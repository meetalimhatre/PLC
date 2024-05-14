const helpers = $.require('../../util/helpers');

/**
 * Fixes overlaps between masterdata entities with the same key, if those entities do not differ in any other values.
 *  
 * @param  {object} oRequest    $.request object
 * @param  {object} oResponse   $.response object
 * @param  {object} oConnection? A connection object used to communicate with the index server. 
 *                                 Parameter is only used for testing in order to pass jasmine.dbConnection. Can be null in other cases
 * @constructor
 */

async function MasterdataOverlapFixer(oRequest, oResponse, oConnection) {
    if (helpers.isNullOrUndefined(oConnection)) {
        const oConnectionFactory = await new ($.require('../../db/connection/connection')).ConnectionFactory($);
        oConnection = await oConnectionFactory.getConnection();
    }
    const oOutputData = {};

    // ##################################################################################################################################
    //      Private Functions   
    // ##################################################################################################################################

    /**    
     * Gets all column names for a table. 
     *      
     * @param  {string} sTableName Name of the table
     * @return {array}    Returns an array to combine 3 different return values: 1. all columns, 2. all key columns, 3. all key columns without _VALID_FROM
     */
    async function getTableColumns(sTableName) {
        const aColumns = Array.from(await oConnection.executeQuery(`select column_name,
                is_nullable,
                index_type
         from "SYS"."TABLE_COLUMNS" as columns
         where      schema_name = CURRENT_SCHEMA
                and table_name = '${ sTableName }'
        `));
        const aKeyColumnNames = aColumns.filter(oColumn => oColumn.INDEX_TYPE == 'FULL').map(oColumn => oColumn.COLUMN_NAME);
        const aKeyColumnNamesWithoutValidFrom = aKeyColumnNames.filter(sColumnName => sColumnName !== '_VALID_FROM');
        return [
            aColumns,
            aKeyColumnNames,
            aKeyColumnNamesWithoutValidFrom
        ];
    }

    /**    
     * Check if a table with the given already exists in SAP_PLC. Used to check if a backup table exists before creating/droping it.
     *      
     * @param  {string} sTableName Name of the table
     * @return {boolean}         True if the table exists, false otherwise.
     */
    function existsTable(sTableName) {
        return await oConnection.executeQuery(`
            select count(*) as count
            from "SYS"."TABLES"
            where schema_name = CURRENT_SCHEMA and table_name = '${ sTableName }'
        `)[0].COUNT > 0;
    }


    /**
     * Creates a backup table containing all rows of entities with overlaps. If an entity has any overlaps all records of the entity are
     * saved in the backup table in case to recover the original state in case of detected errors. 
     *      
     * @param  {string} sTableName Name of the table to backup.
     */
    async function backupTable(sTableName) {
        const [aColumns, aKeyColumnNames, aKeyColumnNamesWithoutValidFrom] = await getTableColumns(sTableName);
        const sBackupTableName = `${ sTableName }${ MasterdataOverlapFixer.BACKUP_SUFFIX }`;
        if (existsTable(sBackupTableName) === true) {
            $.trace.error(`Dropping table ${ sBackupTableName } because it already exists`);
            await oConnection.executeUpdate(`drop table "${ sBackupTableName }"`);
        }

        $.trace.error(`Creating backup table ${ sBackupTableName }...`);
        oOutputData[sTableName].backupTable = `"${ sBackupTableName }"`;
        await oConnection.executeUpdate(`
            create column table "${ sBackupTableName }" as
                (
                    select * 
                    from "${ sTableName }"
                    where (${ aKeyColumnNamesWithoutValidFrom.join(', ') }) in (
                        select distinct ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName }`).join(', ') }
                        from "${ sTableName }"  a 
                            inner join "${ sTableName }"  b 
                                on  ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName } = b.${ sColumnName }`).join(' and ') }
                        where   a._valid_from < b._valid_from 
                                and (
                                           (a._valid_to > b._valid_from)
                                        or (a._valid_to is null)  
                                )                        
                    ) 
                )`);
        $.trace.error(`Backup table created`);
    }


    /**    
     * Tries to repair overlapping records for masterdata entities. Overlaps are only corrected if the overlapping records have except _VALID_FROM/TO the
     * same data. Otherwise the overlap is not fixed. No error is thrown in this case. 
     *      
     * @param  {string} sTableName Name of the table to fix
     */
    async function repairOverlaps(sTableName) {
        $.trace.error(`Trying to repair overlaps for ${ sTableName }...`);
        const [aColumns, aKeyColumnNames, aKeyColumnNamesWithoutValidFrom] = await getTableColumns(sTableName);

        const aValueColumnNames = aColumns.filter(oColumn => {
            const sName = oColumn.COLUMN_NAME;
            const bIsNotKey = aKeyColumnNames.indexOf(sName) === -1;
            const bIsNotProtected = [
                '_VALID_TO',
                '_SOURCE',
                '_CREATED_BY'
            ].indexOf(sName) === -1;
            return bIsNotKey && bIsNotProtected;
        }).map(oColumn => oColumn.COLUMN_NAME);

        // this statement is doing the actual fix; basic ideas (read from inside out)
        //  - first all overlaps are detected (join with aliases a and b)
        //      - the first where-constraint detects overlaps by comparing _valid_from/to
        //      - the second where-constraint ensure that only entities are selected which have the same values in the value columns
        //          - this is done because the overlap fix will correct all entities of a primary key, which could lead to unexpected changes if the value columns differ
        //          - for this reason ALL value columns of the masterdata entity must have the same values, not only the overlapping rows
        //          - the check is done by using rank() which returns the same value if the values are equal; idea in more detail:
        //              - partition is defined on primary keys; order by is defined on primary keys + value columns
        //              - if all rows for the entity have the same values, the rank would always be 1
        //              - if there are other values, the rank would be increased each time a new value is detected
        //              - this is similar to a group by on primary keys + value columns, where the number of groups are counted; if the number of groups > 1 => no update
        //              - see https://help.sap.com/viewer/4fe29514fd584807ac9f2a04f6754767/2.0.02/en-US/10bb583b586e47a09790eb8f8eeeab62.html for details on rank()
        //  - if overlapping entities are found, the window function lead is used correct the overlaps
        //      - the window is defined over all entities with that id and order by the _valid_from to have it in the correct chronological order
        //      - lead() now takes the value of the next row's _valid_from and sets it as _valid_to of the current one
        //      - see https://help.sap.com/viewer/4fe29514fd584807ac9f2a04f6754767/2.0.02/en-US/5932eebb6208406590071eb65c6caa83.html for details on lead()
        //      - by this all overlaps are in a non-overlapping state afterwards
        //      - because we made sure that we only apply this in identical rows, changing _valid_from/to makes now difference for calculation versions
        const sStmt = `
            update masterdata
            set _valid_to = corrected._valid_to
            from "${ sTableName }" as masterdata
            inner join (
                select  ${ aKeyColumnNames.join(', ') },
                        lead(_valid_from) over (partition by ${ aKeyColumnNamesWithoutValidFrom.join(', ') } order by ${ aKeyColumnNames.join(', ') }) as _valid_to 
                from "${ sTableName }"
                where (${ aKeyColumnNamesWithoutValidFrom.join(', ') })
                       in (
                           select distinct  
                                   ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName }`).join(', ') }
                           from "${ sTableName }"  a 
                               inner join "${ sTableName }"  b 
                                   on  ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName } = b.${ sColumnName }`).join(' and ') }
                           where   a._valid_from < b._valid_from 
                                   and (
                                              (a._valid_to > b._valid_from)
                                           or (a._valid_to is null)  
                                   )
                                   and (${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName }`).join(', ') }) not in (
                                              select ${ aKeyColumnNamesWithoutValidFrom.join(', ') }
                                            from (
                                                    select
                                                       ${ aKeyColumnNamesWithoutValidFrom.join(', ') },
                                                       rank() over (partition by ${ aKeyColumnNamesWithoutValidFrom.join(', ') } order by ${ aKeyColumnNamesWithoutValidFrom.join(', ') }${ aValueColumnNames.length > 0 ? ', ' + aValueColumnNames.join(', ') : '' }) as group_number
                                                     from "${ sTableName }"
                                                )
                                            where group_number > 1 
                                    )
                            )
            ) as corrected
                on  ${ aKeyColumnNames.map(sColumnName => `masterdata.${ sColumnName } = corrected.${ sColumnName }`).join(' and ') };
        `;
        const oTableOutputData = oOutputData[sTableName];
        oTableOutputData.updateStatement = sStmt;
        oTableOutputData.numberOfFixedOverlaps = await oConnection.executeUpdate(sStmt);

        $.trace.error(`Repair attempt completed: fixed ${ oTableOutputData.numberOfFixedOverlaps } overlaps`);
    }


    /**    
     * Generates the output messages presented to the used. Writes directly oResponse, which is passed as constructor argument.
     *      
     */
    async function generateResponse() {
        $.trace.error(`Generating script output...`);
        const aResponseBuffer = [];

        aResponseBuffer.push('###########################');
        aResponseBuffer.push('Masterdata Overlaps Fixer');
        aResponseBuffer.push('###########################');
        aResponseBuffer.push('\n');
        aResponseBuffer.push('Summary');
        aResponseBuffer.push('========');

        const oUnableToFixMasterdata = {};
        Object.keys(oOutputData).forEach(sTableName => {
            if (oOutputData[sTableName].overlapsAfter.length > 0) {
                oUnableToFixMasterdata[sTableName] = oOutputData[sTableName].overlapsAfter;
            }
        });
        const oFixedMasterdata = {};
        Object.keys(oOutputData).forEach(sTableName => {
            if (oOutputData[sTableName].overlapsBefore.length > 0) {
                oFixedMasterdata[sTableName] = oOutputData[sTableName].overlapsBefore;
            }
        });

        const aTablesWithOverlaps = Object.keys(oUnableToFixMasterdata);
        const aTablesFixed = Object.keys(oFixedMasterdata);
        const fCreateOverlapOutput = oOverlapResult => {
            const aOverlapBuffer = [];
            Object.keys(oOverlapResult).forEach(sKey => aOverlapBuffer.push(`${ sKey }: ${ oOverlapResult[sKey] instanceof Date ? oOverlapResult[sKey].toJSON() : oOverlapResult[sKey] }`));
            return aOverlapBuffer.join(' / ');
        };
        if (aTablesWithOverlaps.length > 0) {
            aResponseBuffer.push('###########################################################');
            aResponseBuffer.push('ERROR: Could not resolve overlaps for the following tables');
            aResponseBuffer.push('##########################################################');
            aTablesWithOverlaps.forEach(sTableName => {
                oUnableToFixMasterdata[sTableName].forEach(oOverlapResult => aResponseBuffer.push(fCreateOverlapOutput(oOverlapResult)));
            });
        } else if (aTablesFixed.length > 0) {
            aResponseBuffer.push('SUCCESS! Masterdata overlaps successfully repaired. ✔');
            aResponseBuffer.push('Resolved the following overlaps:');
            aTablesFixed.forEach(sTableName => {
                oFixedMasterdata[sTableName].forEach(oOverlapResult => aResponseBuffer.push(fCreateOverlapOutput(oOverlapResult)));

            });
        } else {
            aResponseBuffer.push('SUCCESS! Checked all tables and no overlaps were detected. Nothing to repair. All good! :)');
        }

        aResponseBuffer.push('\n');
        aResponseBuffer.push('Details');
        aResponseBuffer.push('========');
        aResponseBuffer.push(JSON.stringify(oOutputData, null, 2));

        const bHasErrors = aTablesWithOverlaps.length > 0;
        oResponse.status = bHasErrors ? $.net.http.INTERNAL_SERVER_ERROR : $.net.http.OK;
        oResponse.contentType = 'text/plain';
        const sResponseContent = aResponseBuffer.join('\n');
        oResponse.setBody(sResponseContent);

        $.trace.error(`Script output generated:`);
        $.trace.error(sResponseContent);
    }

    // ##################################################################################################################################
    //      Public Members  
    // ##################################################################################################################################

    /**    
     * Returns the names of all mastedata tables defined in SAP_PLC. It uses the fact that all masterdata tables have a column _VALID_TO 
     * column to identify a mastedata table.
     *      
     * @return {array}  String array of all mastedata table names. 
     */
    this.getMasterdataTables = () => {
        return Array.from(await oConnection.executeQuery(`select distinct columns.table_name 
             from "SYS"."TABLE_COLUMNS" as columns 
             inner join "SYS"."TABLES"  as  tables
                 on  columns.schema_name =  tables.schema_name 
                 and columns.table_name =  tables.table_name 
             where   columns.schema_name = CURRENT_SCHEMA
                 and columns.column_name = '_VALID_TO'
                 and tables.is_temporary = 'FALSE'
                 and tables.is_column_table = 'TRUE'
        `)).map(oResultObject => oResultObject.TABLE_NAME).filter(sTableName => !sTableName.endsWith(MasterdataOverlapFixer.BACKUP_SUFFIX));
    };

    /**    
     * Checks a table for masterdata overlaps and returns an array of all overlaping entities, if this is the case.
     *      
     * @param  {string} sTableName Name of the table that should be checked for overlaps.
     * @return {array}            Array of objects. Each object in the array contains an overlapping entity. 
     */
    this.getOverlaps = sTableName => {
        $.trace.error(`Retrieving overlaps for table ${ sTableName }...`);
        const [aColumns, aKeyColumnNames, aKeyColumnNamesWithoutValidFrom] = await getTableColumns(sTableName);
        const sStmt = `select ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName }`).join(', ') },
                    a._valid_from,
                    a._valid_to,
                    b._valid_from as overlap_valid_from,
                    b._valid_to as overlap_valid_to
                from "${ sTableName }"  a 
                    inner join "${ sTableName }"  b 
                        on  ${ aKeyColumnNamesWithoutValidFrom.map(sColumnName => `a.${ sColumnName } = b.${ sColumnName }`).join(' and ') }
                where   a._valid_from < b._valid_from 
                        and (
                                   (a._valid_to > b._valid_from)
                                or (a._valid_to is null)  
                        )`;
        const aOverlaps = Array.from(await oConnection.executeQuery(sStmt));
        $.trace.error(`${ aOverlaps.length } overlaps retrieved`);
        return aOverlaps;
    };

    /**    
     * Executing this function checks for overlaps in all masterdata tables of SAP_PLC (incl. text tables) and, if any overlaps detected,
     * trying to resolve those. If the resolution as successful the response code 200 is set and user gets information about the fixed 
     * masterdata.
     * 
     * The function does not resolve the overlaps of entities that differ in any value of the masterdata, because this could lead to 
     * unexpected results (e.g., in the calculation of versions). If overlaps in such data is detected the response code will set to 
     * 500 and the user gets information about the issues.
     * 
     * The flow of the function is:
     *  1. Check for overlaps
     *  2. If overlap is detected, create backup table; otherwise go to 1
     *  3. Try to repairOverlaps
     *  4. Check for overlaps again. If overlaps are still there, there need an overlap with different data and the function is producing 
     *   an error; got to 1
     */
    this.fix = () => {
        try {
            const aMasterdataTables = this.getMasterdataTables();
            aMasterdataTables.forEach((sTableName, iIndex) => {
                $.trace.error(`#### Processing ${ sTableName } (${ iIndex + 1 } of ${ aMasterdataTables.length }) ####`);
                oOutputData[sTableName] = {};
                const oTableOutputData = oOutputData[sTableName];

                oTableOutputData.overlapsBefore = this.getOverlaps(sTableName);
                oTableOutputData.overlapsAfter = [];
                const bHasOverlaps = oTableOutputData.overlapsBefore.length > 0;
                oTableOutputData.needRepair = bHasOverlaps;

                if (bHasOverlaps === true) {
                    await backupTable(sTableName);
                    await repairOverlaps(sTableName);
                    oTableOutputData.overlapsAfter = this.getOverlaps(sTableName);
                }

                // committing right after a table was processed in order to save the current progress in case there is a timeout or other issue 
                // later
                $.trace.error(`Commiting transaction...`);
                await oConnection.commit();
                $.trace.error(`Commited`);
            });
            await generateResponse();

        } catch (e) {
            $.trace.error(`Exception during execution: ${ e.message || e.msg }`);
        }
    };
}
MasterdataOverlapFixer.prototype = Object.create(MasterdataOverlapFixer.prototype);
MasterdataOverlapFixer.prototype.constructor = MasterdataOverlapFixer;
MasterdataOverlapFixer.BACKUP_SUFFIX = '__backup';
export default {helpers,MasterdataOverlapFixer};
