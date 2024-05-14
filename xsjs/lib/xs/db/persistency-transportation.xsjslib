const _ = $.require('lodash');
var oForeignKeyRelationships = $.import('xs.db', 'db-model-constraints').mForeignKeyConstraints;
const oSpecialForeignKeyRelationships = $.import('xs.db', 'db-model-constraints').mSpecialForeignKeyConstraints;
const mDataModel = $.import('xs.db', 'db-model-tables').mDataModel;
const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

// tables with CLOB (or LargeString) columns
const aClobTables = ['t_addin_configuration_items'];

//array of tables names for custom fields and formulas
const aCffTables = [
    't_metadata',
    't_metadata_item_attributes',
    't_metadata__text',
    't_formula'
];

//array of tables names for default settings
const aSettingTables = ['t_default_settings'];

// array of tables names for Add-in configuration
const aAddinTables = [
    't_addin_configuration_header',
    't_addin_configuration_items',
    't_addin_version'
];

var Tables = Object.freeze({
    metadata: 'sap.plc.db::basis.t_metadata',
    layout_columns: 'sap.plc.db::basis.t_layout_column',
    layout_hidden_fields: 'sap.plc.db::basis.t_layout_hidden_field'
});
// array of tables names for all customizing tables

// NOTE (RF): currently only exporting CFF tables, since the is a discrepancy between Technical Specification and
// realisation of the transport tool; the Specification requires that fields not sent during an import are removed from the
// system; however this functionality is only implemented for CFF-based tables due to their custom implementation; export of addin and 
// default setting tables is disabled to have a consistent export and import behavior
const aCustomizingTables = aCffTables; //.concat(aSettingTables, aAddinTables); 

// mapping of master data business object names to array of table names 
var mMasterDataBusinessObjects = {
    'account': [
        't_account',
        't_account__text'
    ],
    'account_group': [
        't_account_group',
        't_account_group__text',
        't_account_account_group'
    ],
    'activity_type': [
        't_activity_type',
        't_activity_type__text'
    ],
    'business_area': [
        't_business_area',
        't_business_area__text'
    ],
    'company_code': [
        't_company_code',
        't_company_code__text'
    ],
    'component_split': [
        't_component_split_account_group',
        't_component_split',
        't_component_split__text'
    ],
    'controlling_area': [
        't_controlling_area',
        't_controlling_area__text'
    ],
    'cost_center': [
        't_cost_center',
        't_cost_center__text'
    ],
    'costing_sheet': [
        't_costing_sheet',
        't_costing_sheet_base',
        't_costing_sheet_base_row',
        't_costing_sheet_overhead',
        't_costing_sheet_overhead_row',
        't_costing_sheet_row',
        't_costing_sheet_row__text',
        't_costing_sheet_row_dependencies',
        't_costing_sheet_row__text'
    ],
    'material_account_determination': ['t_material_account_determination'],
    'material_group': [
        't_material_group',
        't_material_group__text'
    ],
    'material_type': [
        't_material_type',
        't_material_type__text'
    ],
    'overhead_group': [
        't_overhead_group',
        't_overhead_group__text'
    ],
    'plant': [
        't_plant',
        't_plant__text'
    ],
    'profit_center': [
        't_profit_center',
        't_profit_center__text'
    ],
    'valuation_class': [
        't_valuation_class',
        't_valuation_class__text'
    ]
};

// import replication settings (ERP -> PLC tables)
var MasterdataResources = $.require('../util/masterdataResources').MasterdataResource;

var oReplicationMapping = {
    't_account': {
        erpTable: MasterdataResources.Account.erpTable,
        mapping: MasterdataResources.Account.configuration.oMappingMainErpPlc
    },
    't_account__text': {
        erpTable: MasterdataResources.Account.erpTextTable,
        mapping: MasterdataResources.Account.configuration.oMappingTextErpPlc
    },
    't_activityType': {
        erpTable: MasterdataResources.Activity_Type.erpTable,
        mapping: MasterdataResources.Activity_Type.configuration.oMappingMainErpPlc
    },
    't_activityType__text': {
        erpTable: MasterdataResources.Activity_Type.erpTextTable,
        mapping: MasterdataResources.Activity_Type.configuration.oMappingTextErpPlc
    },
    't_businessArea': {
        erpTable: MasterdataResources.Business_Area.erpTable,
        mapping: MasterdataResources.Business_Area.configuration.oMappingMainErpPlc
    },
    't_businessArea__text': {
        erpTable: MasterdataResources.Business_Area.erpTextTable,
        mapping: MasterdataResources.Business_Area.configuration.oMappingTextErpPlc
    },
    't_companyCode': {
        erpTable: MasterdataResources.Company_Code.erpTable,
        mapping: MasterdataResources.Company_Code.configuration.oMappingMainErpPlc
    },
    't_companyCode__text': {
        erpTable: MasterdataResources.Company_Code.erpTextTable,
        mapping: MasterdataResources.Company_Code.configuration.oMappingTextErpPlc
    },
    't_controllingArea': {
        erpTable: MasterdataResources.Controlling_Area.erpTable,
        mapping: MasterdataResources.Controlling_Area.configuration.oMappingMainErpPlc
    },
    't_controllingArea__text': {
        erpTable: MasterdataResources.Controlling_Area.erpTextTable,
        mapping: MasterdataResources.Controlling_Area.configuration.oMappingTextErpPlc
    },
    't_costCenter': {
        erpTable: MasterdataResources.Cost_Center.erpTable,
        mapping: MasterdataResources.Cost_Center.configuration.oMappingMainErpPlc
    },
    't_costCenter__text': {
        erpTable: MasterdataResources.Cost_Center.erpTextTable,
        mapping: MasterdataResources.Cost_Center.configuration.oMappingTextErpPlc
    },
    't_materialAccountDetermination': {
        erpTable: MasterdataResources.Material_Account_Determination.erpTable,
        mapping: MasterdataResources.Material_Account_Determination.configuration.oMappingMainErpPlc
    },
    't_materialAccountDetermination__text': {
        erpTable: MasterdataResources.Material_Account_Determination.erpTextTable,
        mapping: MasterdataResources.Material_Account_Determination.configuration.oMappingTextErpPlc
    },
    't_materialGroup': {
        erpTable: MasterdataResources.Material_Group.erpTable,
        mapping: MasterdataResources.Material_Group.configuration.oMappingMainErpPlc
    },
    't_materialGroup__text': {
        erpTable: MasterdataResources.Material_Group.erpTextTable,
        mapping: MasterdataResources.Material_Group.configuration.oMappingTextErpPlc
    },
    't_materialType': {
        erpTable: MasterdataResources.Material_Type.erpTable,
        mapping: MasterdataResources.Material_Type.configuration.oMappingMainErpPlc
    },
    't_materialType__text': {
        erpTable: MasterdataResources.Material_Type.erpTextTable,
        mapping: MasterdataResources.Material_Type.configuration.oMappingTextErpPlc
    },
    't_overheadGroup': {
        erpTable: MasterdataResources.Overhead_Group.erpTable,
        mapping: MasterdataResources.Overhead_Group.configuration.oMappingMainErpPlc
    },
    't_overheadGroup__text': {
        erpTable: MasterdataResources.Overhead_Group.erpTextTable,
        mapping: MasterdataResources.Overhead_Group.configuration.oMappingTextErpPlc
    },
    't_plant': {
        erpTable: MasterdataResources.Plant.erpTable,
        mapping: MasterdataResources.Plant.configuration.oMappingMainErpPlc
    },
    't_plant__text': {
        erpTable: MasterdataResources.Plant.erpTextTable,
        mapping: MasterdataResources.Plant.configuration.oMappingTextErpPlc
    },
    't_profitCenter': {
        erpTable: MasterdataResources.Profit_Center.erpTable,
        mapping: MasterdataResources.Profit_Center.configuration.oMappingMainErpPlc
    },
    't_profitCenter__text': {
        erpTable: MasterdataResources.Profit_Center.erpTextTable,
        mapping: MasterdataResources.Profit_Center.configuration.oMappingTextErpPlc
    },
    't_valuationClass': {
        erpTable: MasterdataResources.Valuation_Class.erpTable,
        mapping: MasterdataResources.Valuation_Class.configuration.oMappingMainErpPlc
    },
    't_valuationClass__text': {
        erpTable: MasterdataResources.Valuation_Class.erpTextTable,
        mapping: MasterdataResources.Valuation_Class.configuration.oMappingTextErpPlc
    }
};


// array of all master data table names
const aMasterDataTables = function () {
    // add all master data business object tables to one list
    var aTables = [];
    for (var bo in mMasterDataBusinessObjects) {
        aTables.push.apply(aTables, mMasterDataBusinessObjects[bo]);
    }
    return aTables;
}();

// array of all tables names allowed to be imported/exported
var aAllTables = aMasterDataTables.concat(aCffTables, aSettingTables, aAddinTables);

// special business objects
mMasterDataBusinessObjects.settings = aSettingTables;
mMasterDataBusinessObjects.cff = aCffTables;
mMasterDataBusinessObjects.addins = aAddinTables;
mMasterDataBusinessObjects.customizing = aCustomizingTables;
mMasterDataBusinessObjects.masterdata = aMasterDataTables;
mMasterDataBusinessObjects.all = aAllTables;

const Procedures = { 'check_formulas_staging': 'sap.plc.db.calcengine.procedures::p_check_formulas_staging' };

/**
 * Creates a new Transportation object.
 * @constructor
 */
function Transportation(dbConnection, oDbArtefactController, oMetadataPersistency) {

    // columns that will not be exported; TS specifies that audit fields are ignored
    var aFilteredExportColumns = [
        '_VALID_FROM',
        '_VALID_TO',
        '_SOURCE',
        'CREATED_ON',
        'CREATED_BY',
        'LAST_MODIFIED_ON',
        'LAST_MODIFIED_BY'
    ];

    var aTablesUsingSequence = [
        't_costing_sheet_base',
        't_costing_sheet_overhead',
        't_costing_sheet_overhead_row',
        't_formula'
    ];

    var iSource = 1; //for Plc project;
    var bDefaultUserID = true;
    var sLockObject = 'import'; // TODO: or "cff"?
    var sTableNameLock = 't_lock';
    var sTableNamePrefix = 'sap.plc.db::basis.';
    var oCurrentDate; // consistently use this Date for _VALID_FROM




    /**
	 * Get full qualified table name of a staging table.
	 * @param   {string} sTableName      - name of the table in foreign key relationship condition
	 * @returns {string} - full name of corresponding staging table in db
	 */
    function getFullStagingTableName(sTableName) {
        return sTableNamePrefix + sTableName + '_staging';
    }

    /**
	 * Get full qualified table name.
	 * @param   {string} sTableName      - name of the table in foreign key relationship condition
	 * @returns {string} - full name of the table in db
	 */
    function getFullTableName(sTableName) {
        return sTableNamePrefix + sTableName;
    }

    /**
	 * build query to insert into staging tables using sequence id
	 */
    async function getQueryToInsertStagingTableWithSequence(sTableName, sColumnsInsert, sParametersInsert) {
        var query = `INSERT INTO "${ await getFullStagingTableName(sTableName) }" (NEW_ID,${ sColumnsInsert }) VALUES ("sap.plc.db.sequence::s_${ sTableName.substring(2) }".nextval,${ sParametersInsert })`;
        return query;
    }

    /** 
	 * Check that any user is using import tool
	 * @param {}
	 *
	 * @return {bool}
	 *      false if no one is using import tool
	 *      true if someone is using import tool
	 */
    // TODO: use function in Persistency.misc
    async function isUnlockStatus() {
        var fullTableNameLock = await getFullTableName(sTableNameLock);
        var query = 'select lock_object from "' + fullTableNameLock + '" where lock_object=?';
        var result = dbConnection.executeQuery(query, sLockObject);

        if (_.isNull(result) || _.isUndefined(result)) {
            const sLogMessage = `Error during checking lock status of import tool.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        } else {
            if (result.length > 0) {
                return false;
            } else {
                return true;
            }
        }
    }

    /** 
	 * Check that any user is logged in the PLC app
	 * @param {}
	 *
	 * @return {bool, string}
	 * 		bool:
	 *      false if no one is logged in
	 *      true if someone is logged in
	 * 
	 * 		string:
	 * 		list of active users
	 */
    async function hasActiveUsers() {
        var sQuery = 'select a.USER_ID' + ' FROM  "sap.plc.db::basis.t_session" AS a,' + ' "sap.plc.db::basis.t_application_timeout" AS b' + " WHERE   b.APPLICATION_TIMEOUT_ID = 'SessionTimeout' AND" + ' SECONDS_BETWEEN ( a.LAST_ACTIVITY_TIME , CURRENT_UTCTIMESTAMP ) < b.VALUE_IN_SECONDS AND' + ' a.LAST_ACTIVITY_TIME < CURRENT_UTCTIMESTAMP';
        var result = dbConnection.executeQuery(sQuery);
        if (_.isNull(result) || _.isUndefined(result)) {
            const sLogMessage = `Error during the checking of active users in the system.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        } else {
            var resultObject = {
                hasUsers: result.length > 0 ? true : false,
                users: (() => {
                    let sActiveUsers = '';
                    result.forEach(user => {
                        sActiveUsers += '\n' + user.USER_ID;
                    });
                    return sActiveUsers;
                })()
            };
            return resultObject;
        }

    }

    /** 
	 * Before starting to import data, the value 'import' is inserted to lock table to inform that there is someone using import tool
	 */
    // TODO: use function in Persistency.misc
    async function lockImportTool() {
        var fullTableNameLock = await getFullTableName(sTableNameLock);
        var query = 'INSERT INTO "' + fullTableNameLock + '" (LOCK_OBJECT,USER_ID) VALUES (?,?)';
        dbConnection.executeUpdate(query, sLockObject, $.getPlcUsername());
    }

    /** after finishing to import data, delete object import in lock table to inform that there is noone using import tool
	 *
	 */
    // TODO: use function in Persistency.misc
    async function unlockImportTool() {
        var fullTableNameLock = await getFullTableName(sTableNameLock);
        var query = 'DELETE FROM "' + fullTableNameLock + '" WHERE lock_object=?';
        dbConnection.executeUpdate(query, sLockObject);
    }

    /**
	 * Delete all data in staging tables
	 */
    function deleteAllStagingTables() {
        //TODO: not correct because extension table does not exist in mDataModel. We need to get every table with prefix staging and delete.
        Object.keys(mDataModel).forEach(async function (sTableName) {
            if (mDataModel[sTableName].hasStagingTable) {
                var query = 'delete from "' + await getFullStagingTableName(sTableName) + '"';
                dbConnection.executeUpdate(query);
            }
        });
    }

    /**
	 * Delete custom fields from layout data
	 */
    function deleteLayoutData() {

        let stmDeletelayoutColumns = `
		delete 
			from "${ Tables.layout_columns }"
		where (UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)) in
		(
			select
				UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)
			from
				"${ Tables.metadata }"
			where is_custom = 1
		);
	    `;

        let stmDeletelayoutHiddenFields = `
			delete 
				from "${ Tables.layout_hidden_fields }"
			where (UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)) in
			(
				select
					UPPER(PATH), UPPER(BUSINESS_OBJECT), UPPER(COLUMN_ID)
				from
					"${ Tables.metadata }"
				where is_custom = 1
			);
	    `;

        dbConnection.executeUpdate(stmDeletelayoutColumns);
        dbConnection.executeUpdate(stmDeletelayoutHiddenFields);
    }

    /**
	 * Insert data into staging tables.
	 * @param {map} mTableData - map table name to table content
	 * @param {string} sTableName - table name
	 */
    async function insertIntoStagingTablesWithoutCustomField(mTableData, sTableName) {
        var aTableContent = mTableData[sTableName];
        // TODO: We cannot simply take the column names from mTableData. This would potentially allow SQL injection.
        var aColumns = aTableContent[0]; // first row contains column names
        var sColumnsInsert = aColumns.join(',');
        var sParametersInsert = aColumns.map(function () {
            return '?';
        }).join(','); // create "?,?,?" string

        var aAllRowsDataClient = aTableContent.slice(1); // omit header row
        if (aAllRowsDataClient.length === 0) {
            return;
        }
        var aAllRowsData = [];
        //process null value sent from client
        // TODO: this seems to be not required
        _.each(aAllRowsDataClient, function (rowData) {
            var processedData = _.map(rowData, function (columnValue) {
                if (columnValue === 'null') {
                    return null;
                } else {
                    return columnValue;
                }
            });
            aAllRowsData.push(processedData);
        });

        if (aTablesUsingSequence.indexOf(sTableName) !== -1) {
            // special handling for tables with Integer IDs and Sequences
            sColumnsInsert = 'NEW_ID,' + sColumnsInsert;
            sParametersInsert = '"sap.plc.db.sequence::s_' + sTableName.substring(2) + '".nextval,' + sParametersInsert;
        }
        var query = 'INSERT INTO "' + await getFullStagingTableName(sTableName) + '" (' + sColumnsInsert + ')' + ' VALUES (' + sParametersInsert + ')';
        dbConnection.executeUpdate(query, aAllRowsData);
    }

    /**
	 * Batch insert into many staging tables
	 * @param {map} mTableData - object data received from client
	 */
    async function insertIntoStagingTables(mTableData) {
        try {
            Object.keys(mTableData).forEach(async function (sTableName) {
                await insertIntoStagingTablesWithoutCustomField(mTableData, sTableName);
            });
        } catch (e) {
            const sClientMsg = 'Error during inserting data into staging tables.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
    }

    /**
	 * Create a query to check foreign key constraints before adding to db
	 * @param {string} sTableName    - the name of the table
	 * @param {object} oConstraint   - the reference constraint of the table
	 */
    async function buildQueryCheckReferenceKey(sTableName, oConstraint) {
        var fromStagingTableName = await getFullStagingTableName(sTableName);
        var toStagingTableName = await getFullStagingTableName(oConstraint.targetTable);
        var toTableName = await getFullTableName(oConstraint.targetTable);
        var aFromFields = [];
        var aToFields = [];
        var aOnCondition = [];
        var aWhereCondition = [];
        var query = '';
        if (oConstraint.fields.length > 0) {
            oConstraint.fields.forEach(function (field) {
                aFromFields.push('T1.' + field[0]);
                aToFields.push(field[1]);
                aOnCondition.push('T1.' + field[0] + '=T2.' + field[1]);
                aWhereCondition.push(`T1.${ field[0] } IS NOT NULL AND T2.${ field[1] } IS NULL AND TO_NVARCHAR(T1.${ field[0] }) <> ''`);
            });
            aFromFields.join(',');

            /* check if the target table has a staging table */
            if (!mDataModel[oConstraint.targetTable].hasStagingTable) {
                query += 'SELECT ' + aFromFields.join(',') + ' FROM "' + fromStagingTableName + '" T1 LEFT OUTER JOIN' + ' (SELECT ' + aToFields.join(',') + ' FROM "' + toTableName;
            } else {
                query += 'SELECT ' + aFromFields.join(',') + ' FROM "' + fromStagingTableName + '" T1 LEFT OUTER JOIN' + ' (SELECT ' + aToFields.join(',') + ' FROM "' + toStagingTableName + '"' + ' UNION ALL SELECT ' + aToFields.join(',') + ' FROM "' + toTableName;
            }
            query += '") T2' + ' ON ' + aOnCondition.join(' AND ') + ' WHERE ' + aWhereCondition.join(' AND ');
        }
        return query;
    }

    /**
	 * Check the integrity of custom fields & formula related tables
	 */
    async function checkCustomFieldsAndFormulas(mTableData, mParameters) {
        if (mParameters.mode !== 'replace') {
            // use an inner join to figure out which custom fields already exists; if the the import is not 'replace' it would only be allowed to add new custom fields;
            // if this query has results, it would mean that existing custom fields would be updated (which is not allowed)
            var oModifiedCustomFieldsResult = dbConnection.executeQuery("	select db.column_id as column_id 					from \"sap.plc.db::basis.t_metadata\" as db 					  inner join  \"sap.plc.db::basis.t_metadata_staging\" as staging 					  	on 	db.path = staging.path						  	and db.business_object = staging.business_object 					  	and db.column_id = staging.column_id 				  	where 		db.is_custom = 1 					  		and staging.is_custom = 1 							and ( 									ifnull(db.rollup_type_id, -1) <> ifnull(staging.rollup_type_id, -1) 								or ifnull(db.side_panel_group_id, -1) <> ifnull(staging.side_panel_group_id, -1) 								or ifnull(db.display_order, -1) <> ifnull(staging.display_order, -1) 								or ifnull(db.table_display_order, -1) <> ifnull(staging.table_display_order, -1) 								or ifnull(db.ref_uom_currency_path, '') <> ifnull(staging.ref_uom_currency_path, '') 								or ifnull(db.ref_uom_currency_business_object, '') <> ifnull(staging.ref_uom_currency_business_object, '') 								or ifnull(db.ref_uom_currency_column_id, '') <> ifnull(staging.ref_uom_currency_column_id, '') 								or ifnull(db.uom_currency_flag, -1) <> ifnull(staging.uom_currency_flag, -1) 								or ifnull(db.semantic_data_type, '') <> ifnull(staging.semantic_data_type, '') 								or ifnull(db.semantic_data_type_attributes, '') <> ifnull(staging.semantic_data_type_attributes, '') 								or ifnull(db.property_type, -1) <> ifnull(staging.property_type, -1) 								or ifnull(db.is_usable_in_formula, -1) <> ifnull(staging.is_usable_in_formula, -1) 							);");

            if (oModifiedCustomFieldsResult.length > 0) {
                var aModifiedCustomFields = _.map(oModifiedCustomFieldsResult, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to replace the following custom fields ${ aModifiedCustomFields.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED, sLogMessage);
            }

            // if mode is not 'replace', it must not be possible to delete custom fields 
            var oDeletedCustomFieldsResult = dbConnection.executeQuery('select column_id 				from "sap.plc.db::basis.t_metadata" 				where is_custom = 1 								except 								select column_id  				from "sap.plc.db::basis.t_metadata_staging" 				where is_custom = 1');
            if (oDeletedCustomFieldsResult.length > 0) {
                var aDeletedCustomFields = _.map(oDeletedCustomFieldsResult, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to delete following custom fields ${ aDeletedCustomFields.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_DELETED, sLogMessage);
            }

            // if mode is not 'replace', it must not be possible to modify existing formulas 
            var oModifiedFormulasResult = dbConnection.executeQuery('	select db.column_id as column_id 						from "sap.plc.db::basis.t_formula" as db 						  inner join  "sap.plc.db::basis.t_formula_staging" as staging 						  	on 	db.path = staging.path							  	and db.business_object = staging.business_object 						  	and db.column_id = staging.column_id 							and db.item_category_id = staging.item_category_id 					  	where  db.is_formula_used <> staging.is_formula_used 							or HASH_SHA256(to_binary(db.formula_string)) <> HASH_SHA256(to_binary(staging.formula_string)) 							or ifnull(db.formula_description, \'\') <> ifnull(staging.formula_description, \'\')');
            if (oModifiedFormulasResult.length > 0) {
                var aModifiedFormulasResult = _.map(oModifiedFormulasResult, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to modify formulas for custom fields ${ aModifiedFormulasResult.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_FORMULA_CANNOT_BE_MODIFIED, sLogMessage);
            }

            // if mode is not 'replace', it must not be possible to delete existing formulas 
            var oDeletedFormulasResult = dbConnection.executeQuery('select path, business_object, column_id, item_category_id 				from "sap.plc.db::basis.t_formula" 				except 				select path, business_object, column_id, item_category_id 				from "sap.plc.db::basis.t_formula_staging"');
            if (oDeletedFormulasResult.length > 0) {
                var aDeletedFormulasResult = _.map(oDeletedFormulasResult, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to delete formulas for following fields ${ aDeletedFormulasResult.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_FORMULA_CANNOT_BE_DELETED, sLogMessage);
            }

            // use except operator to figure out which custom fields attributes have been changed between source and target system; if the import mode is 'append' it is not allowed to modify any item attribute
            // if this query has results, it would mean that existing custom field attributes would be updated (which is not allowed)
            var oModifiedCustomFieldItemAttributes = dbConnection.executeQuery('	( 							SELECT attributes.path, attributes.business_object, attributes.column_id, attributes.item_category_id, attributes.subitem_state, attributes.is_mandatory, 								attributes.is_read_only, attributes.is_transferable, attributes.default_value 							FROM "sap.plc.db::basis.t_metadata" as metadata 								INNER JOIN "sap.plc.db::basis.t_metadata_item_attributes" as attributes 									on attributes.path = metadata.path	 									and attributes.business_object = metadata.business_object 									and attributes.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 						EXCEPT 							SELECT attributes_staging.path, attributes_staging.business_object, attributes_staging.column_id, attributes_staging.item_category_id, attributes_staging.subitem_state, attributes_staging.is_mandatory, 								attributes_staging.is_read_only, attributes_staging.is_transferable, attributes_staging.default_value 							FROM "sap.plc.db::basis.t_metadata" as metadata 								INNER JOIN "sap.plc.db::basis.t_metadata_item_attributes_staging" as attributes_staging 									on 	attributes_staging.path = metadata.path	 									and attributes_staging.business_object = metadata.business_object 									and attributes_staging.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 					) 					UNION ALL 					( 							SELECT attributes_staging.path, attributes_staging.business_object, attributes_staging.column_id, attributes_staging.item_category_id, attributes_staging.subitem_state, attributes_staging.is_mandatory, 								attributes_staging.is_read_only, attributes_staging.is_transferable, attributes_staging.default_value 							FROM "sap.plc.db::basis.t_metadata" as metadata 								INNER JOIN "sap.plc.db::basis.t_metadata_item_attributes_staging" as attributes_staging 									on 	attributes_staging.path = metadata.path	 									and attributes_staging.business_object = metadata.business_object 									and attributes_staging.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 						EXCEPT 							SELECT attributes.path, attributes.business_object, attributes.column_id, attributes.item_category_id, attributes.subitem_state, attributes.is_mandatory, 								attributes.is_read_only, attributes.is_transferable, attributes.default_value 							FROM "sap.plc.db::basis.t_metadata" as metadata 								INNER JOIN "sap.plc.db::basis.t_metadata_item_attributes" as attributes 									on attributes.path = metadata.path	 									and attributes.business_object = metadata.business_object 									and attributes.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 					);');
            if (oModifiedCustomFieldItemAttributes.length > 0) {
                var aModifiedCustomFieldItemAttributes = _.map(oModifiedCustomFieldItemAttributes, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to change item attributes for custom fields ${ aModifiedCustomFieldItemAttributes.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED, sLogMessage);
            }

            // use except operator to figure out which custom fields texts have been changed between source and target system; 
            // if the import mode is 'append' it is not allowed to modify any texts (neither display name nor description)
            // if this query has results, it would mean that existing custom field texts would be updated (which is not allowed)
            var oModifiedCustomFieldTexts = dbConnection.executeQuery('	( 							SELECT texts.path, texts.column_id, texts.language, texts.display_name, texts.display_description 							FROM "sap.plc.db::basis.t_metadata__text" as texts 								INNER JOIN "sap.plc.db::basis.t_metadata" as metadata 									ON texts.path = metadata.path 									AND texts.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 						EXCEPT 							SELECT texts_staging.path, texts_staging.column_id, texts_staging.language, texts_staging.display_name, texts_staging.display_description 							FROM "sap.plc.db::basis.t_metadata__text_staging" as texts_staging 								INNER JOIN "sap.plc.db::basis.t_metadata" as metadata 									ON texts_staging.path = metadata.path 									AND texts_staging.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 					) 					UNION ALL 					( 							SELECT texts_staging.path, texts_staging.column_id, texts_staging.language, texts_staging.display_name, texts_staging.display_description 							FROM "sap.plc.db::basis.t_metadata__text_staging" as texts_staging 								INNER JOIN "sap.plc.db::basis.t_metadata" as metadata 									ON texts_staging.path = metadata.path 									AND texts_staging.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 						EXCEPT 							SELECT texts.path, texts.column_id, texts.language, texts.display_name, texts.display_description 							FROM "sap.plc.db::basis.t_metadata__text" as texts 								INNER JOIN "sap.plc.db::basis.t_metadata" as metadata 									ON texts.path = metadata.path 									AND texts.column_id = metadata.column_id 								WHERE metadata.is_custom = 1 					);');
            if (oModifiedCustomFieldTexts.length > 0) {
                var aModifiedCustomFieldTexts = _.map(oModifiedCustomFieldTexts, function (oRow) {
                    return oRow.COLUMN_ID;
                });
                const sLogMessage = `Unable to change display name and description for custom fields ${ aModifiedCustomFieldTexts.join(',') } if the parameter mode is not set to 'replace'`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED, sLogMessage);
            }
        }

        // data type or data type attribute changes for existing custom fields are not possible in general (in the current version - since hana view generation fails)
        // Impl. Information: 
        //  - use a inner join to determine currently existing custom fields and the where-clause to limit to rows with changed data type information
        //  - since semantic_data_type_attributes is a nullable-column the comparison must be made using the nullif()-function
        var oChangedDataTypeCustomFieldsResult = dbConnection.executeQuery('	select db.column_id as column_id 				from "sap.plc.db::basis.t_metadata" as db 				  inner join  "sap.plc.db::basis.t_metadata_staging" as staging 					on 	db.path = staging.path						and db.business_object = staging.business_object 					and db.column_id = staging.column_id 				where 	(	db.semantic_data_type <> staging.semantic_data_type 							or	nullif(db.semantic_data_type_attributes, staging.semantic_data_type_attributes) is not null 						) 						and staging.is_custom = 1;');
        if (oChangedDataTypeCustomFieldsResult.length > 0) {
            var aModifiedDataTypeCustomFields = _.map(oChangedDataTypeCustomFieldsResult, function (oRow) {
                return oRow.COLUMN_ID;
            });
            const sLogMessage = `Unable change the data type or attributes of the following custom fields: ${ aModifiedDataTypeCustomFields.join(',') }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.TRANSPORT_CUSTOM_FIELD_CANNOT_BE_MODIFIED, sLogMessage);
        }

        // check for invalid entries in t_metadata
        const oInvalidMetadataResult = dbConnection.executeQuery(`SELECT path, business_object, column_id FROM "sap.plc.db::basis.t_metadata_staging"
			WHERE business_object not in ('Item', 'Cost_Center', 'Material', 'Material_Plant', 'Material_Price', 'Work_Center', 'Activity_Price') or
				path not in ('Item', 'Cost_Center', 'Material', 'Material_Plant', 'Material_Price', 'Work_Center', 'Activity_Price') or
				business_object <> path or
				(path='Item' and not column_id LIKE_REGEXPR '^(CUST|CMPR|CMPL|CMAT|CCEN|CWCE|CAPR)_[A-Z][A-Z0-9_]*$') or
				(path='Cost_Center' and not column_id LIKE_REGEXPR '^CCEN_[A-Z][A-Z0-9_]*$') or
				(path='Material' and not column_id LIKE_REGEXPR '^CMAT_[A-Z][A-Z0-9_]*$') or
				(path='Material_Plant' and not column_id LIKE_REGEXPR '^CMPL_[A-Z][A-Z0-9_]*$') or
				(path='Material_Price' and not column_id LIKE_REGEXPR '^CMPR_[A-Z][A-Z0-9_]*$') or
				(path='Work_Center' and not column_id LIKE_REGEXPR '^CWCE_[A-Z][A-Z0-9_]*$') or
				(path='Activity_Price' and not column_id LIKE_REGEXPR '^CAPR_[A-Z][A-Z0-9_]*$') or
				is_custom <> 1 or
				rollup_type_id < 0 or rollup_type_id > 5 or
				property_type not in (1,2,3,5,6,7,11,12,22) or -- only Price=1, Number=2, Text=3, Boolean=5, UoM=6, Currency=7, DateTime=11, Date=12 are allowed
				semantic_data_type not in ('Integer', 'Decimal', 'UTCTimestamp', 'LocalDate', 'BooleanInt', 'String', 'Link') or
				(semantic_data_type = 'String' and not(semantic_data_type_attributes LIKE_REGEXPR '^length=[1-9][0-9]*$')) or
				(semantic_data_type = 'Decimal' and semantic_data_type_attributes <> 'precision=24; scale=7') or
				(uom_currency_flag is not null and uom_currency_flag not in (0,1)) or
				(ref_uom_currency_business_object is not null and ref_uom_currency_business_object not in 
					('', 'Item', 'Cost_Center', 'Material', 'Material_Plant', 'Material_Price', 'Work_Center', 'Activity_Price')) or
				(ref_uom_currency_column_id is not null and ref_uom_currency_column_id <> '' and ref_uom_currency_column_id not in 
					(select column_id from "sap.plc.db::basis.t_metadata_staging" union all select column_id from "sap.plc.db::basis.t_metadata"))`);

        if (oInvalidMetadataResult.length > 0) {
            const sLogMessage = `Found invalid content in t_metadata_staging for the following rows: ${ JSON.stringify(oInvalidMetadataResult) }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }

        // metadata is only complete if there is at least 1 row for the path, business_object, column_id in t_metadata_item_attributes_staging in order to define a category 
        // for the custom field an other contraints (mandatory, ...)
        var oMissingItemAttributesResult = dbConnection.executeQuery('select path, business_object, column_id from "sap.plc.db::basis.t_metadata_staging" 			where (path, business_object, column_id) not in ( 					select path, business_object, column_id from "sap.plc.db::basis.t_metadata_item_attributes_staging" 			);');
        if (oMissingItemAttributesResult.length > 0) {
            const sLogMessage = `Found invalid contents in t_metadata for which no data in t_metadata_item_attributes or t_metadata_item_attributes_staging exist: ${ JSON.stringify(oMissingItemAttributesResult) }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }

        var oInvalidMetadataAttributesResult = dbConnection.executeQuery('SELECT path, business_object, column_id, item_category_id FROM "sap.plc.db::basis.t_metadata_item_attributes_staging" where  			item_category_id < -1 or item_category_id > (SELECT MAX(item_category_id) FROM "sap.plc.db::basis.t_item_category") or  			subitem_state not in (-1,0,1)');

        if (oInvalidMetadataAttributesResult.length > 0) {
            const sLogMessage = `Found invalid contents in t_metadata_item_attributes_staging for the following rows: ${ JSON.stringify(oInvalidMetadataAttributesResult) }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
        }



        // use procedure to check forumlars
        var fnCheckFormulas = dbConnection.loadProcedure(Procedures.check_formulas_staging);
        var oFormulaErrorsResult = fnCheckFormulas();
        if (oFormulaErrorsResult.ERRORS.length > 0) {
            // only use the first error, since the error code mapping to multiple error codes would be unclear
            var oFormulaError = oFormulaErrorsResult.ERRORS[0];
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addFormulaObjs({ FORMULA_ERROR: JSON.parse('{' + oFormulaError.ERROR_DETAILS.replace(/'/g, '"') + '}') });
            const sLogMessage = `Found invalid formula in t_formula_staging: ${ oFormulaError.ERROR_DETAILS }`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageLibrary.FormulaInterpreterErrorMapping[oFormulaError.ERROR_CODE], sLogMessage, oMessageDetails);
        }
    }

    async function insertCustomFieldsAndFormulasToPersistentTables(mParameters) {

        if (mParameters.mode === 'replace') {
            // in case replace mode is set, all custom fields and formulas which are not part of the request needs to be removed; to do
            // that all custom fields are removed from metadata here and all formulas; subsequent statements create them again 

            // delete existing layouts
            await deleteLayoutData();


            dbConnection.executeUpdate('	delete from "sap.plc.db::basis.t_metadata" 					where 	is_custom = 1');

            dbConnection.executeUpdate('	delete from "sap.plc.db::basis.t_metadata__text" 					where  (path, column_id) not in ( 							select path, column_id from "sap.plc.db::basis.t_metadata" 						)');



            dbConnection.executeUpdate('	delete from "sap.plc.db::basis.t_metadata_item_attributes" 					where  (path, business_object, column_id) not in ( 							select path, business_object, column_id from "sap.plc.db::basis.t_metadata" 						)');



            dbConnection.executeUpdate('delete from "sap.plc.db::basis.t_formula" 										where (path, business_object, column_id, item_category_id) not in ( 											select path, business_object, column_id, item_category_id from "sap.plc.db::basis.t_formula_staging" 										)');


            dbConnection.executeUpdate('update "sap.plc.db::basis.t_formula" formula set 						is_formula_used = staging.is_formula_used, formula_string = staging.formula_string, formula_description = staging.formula_description 					from "sap.plc.db::basis.t_formula_staging" as staging inner join "sap.plc.db::basis.t_formula" as formula 						on formula.path = staging.path AND formula.business_object = staging.business_object AND 						formula.column_id = staging.column_id AND formula.item_category_id = staging.item_category_id');
        }





        dbConnection.executeUpdate('upsert "sap.plc.db::basis.t_metadata" ' + '(path, business_object, column_id, rollup_type_id, side_panel_group_id, display_order, table_display_order, ' + 'ref_uom_currency_path, ref_uom_currency_business_object, ref_uom_currency_column_id, uom_currency_flag, ' + 'semantic_data_type, semantic_data_type_attributes, property_type, is_usable_in_formula, is_custom) ' + 'select path, business_object, column_id, rollup_type_id, side_panel_group_id, display_order, table_display_order, ' + 'ref_uom_currency_path, ref_uom_currency_business_object, ref_uom_currency_column_id, uom_currency_flag, ' + 'semantic_data_type, semantic_data_type_attributes, property_type, 1 as is_usable_in_formula, is_custom ' + 'from "sap.plc.db::basis.t_metadata_staging" where is_custom = 1;');

        dbConnection.executeUpdate('upsert "sap.plc.db::basis.t_metadata_item_attributes" 					(path, business_object, column_id, item_category_id, subitem_state, is_mandatory, 					is_read_only, is_transferable, default_value) 				select attributes.path, attributes.business_object, attributes.column_id, attributes.item_category_id, attributes.subitem_state, attributes.is_mandatory, 				attributes.is_read_only, attributes.is_transferable, attributes.default_value 				from "sap.plc.db::basis.t_metadata_item_attributes_staging" as attributes					inner join "sap.plc.db::basis.t_metadata_staging" as metadata 						on 	metadata.path = attributes.path 						and metadata.business_object = attributes.business_object 						and metadata.column_id = attributes.column_id 				where metadata.is_custom = 1;');

        dbConnection.executeUpdate('upsert "sap.plc.db::basis.t_metadata__text" 				(path, column_id, language, display_name, display_description) 			select text.path, text.column_id, text.language, text.display_name, text.display_description 			from "sap.plc.db::basis.t_metadata__text_staging" as text 				inner join "sap.plc.db::basis.t_metadata_staging" as metadata 					on 	metadata.path = text.path 					and metadata.column_id = text.column_id 					where metadata.is_custom = 1;');



        dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_formula" 					(formula_id,path,business_object,column_id,item_category_id,is_formula_used,formula_string,formula_description) 				select  staging.new_id as formula_id, 						staging.path, staging.business_object, staging.column_id, staging.item_category_id, staging.is_formula_used, 						staging.formula_string, staging.formula_description 				from "sap.plc.db::basis.t_formula_staging" as staging left outer join "sap.plc.db::basis.t_formula" as formula 						on formula.path = staging.path AND formula.business_object = staging.business_object AND 						formula.column_id = staging.column_id AND formula.item_category_id = staging.item_category_id 				where formula.formula_id is null');


        if (mParameters.mode === 'replace') {
            oDbArtefactController.generateAllFilesExt();
        } else {
            oDbArtefactController.generateAllFiles();
        }



        oMetadataPersistency.copyItemsToItemExt();
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.Material);
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.MaterialPlant);
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.MaterialPrice);
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.CostCenter);
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.WorkCenter);
        oMetadataPersistency.copyMasterdataToMasterdataExt(BusinessObjectTypes.ActivityPrice);

        var aNewCustomFieldResult = dbConnection.executeQuery(`select staging.path as path, staging.business_object as business_object, staging.column_id as column_id, staging.rollup_type_id as rollup_type_id, staging.UOM_CURRENCY_FLAG as UOM_CURRENCY_FLAG, staging.REF_UOM_CURRENCY_PATH as REF_UOM_CURRENCY_PATH, staging.REF_UOM_CURRENCY_BUSINESS_OBJECT as REF_UOM_CURRENCY_BUSINESS_OBJECT, staging.REF_UOM_CURRENCY_COLUMN_ID as REF_UOM_CURRENCY_COLUMN_ID, staging.SEMANTIC_DATA_TYPE as SEMANTIC_DATA_TYPE
				from "sap.plc.db::basis.t_metadata_staging" as staging 
					left outer join "sap.plc.db::basis.t_metadata" as db 
						on	staging.path = db.path 
						and staging.business_object = db.business_object 
						and	staging.column_id = db.column_id 
				where staging.is_custom = 1 and db.uom_currency_flag != 1 
				and ((db.path = 'Item' and db.business_object = 'Item' and db.column_id LIKE_REGEXPR '^CUST_[A-Z][A-Z0-9_]*$') 
				or (db.path != 'Item' and db.business_object != 'Item' and db.column_id LIKE_REGEXPR '^(CAPR|CWCE|CMPR|CMPL|CMAT|CCEN)_[A-Z][A-Z0-9_]*$'));`);
        if (aNewCustomFieldResult.length > 0) {
            _.each(aNewCustomFieldResult, function (oNewCustomFieldMetadata) {
                if (oNewCustomFieldMetadata.PATH === 'Item' && oNewCustomFieldMetadata.BUSINESS_OBJECT === 'Item') {
                    oMetadataPersistency.updateManualField(oNewCustomFieldMetadata);
                }
                if (oNewCustomFieldMetadata.SEMANTIC_DATA_TYPE === 'BooleanInt' && oNewCustomFieldMetadata.BUSINESS_OBJECT !== 'Item') {
                    oMetadataPersistency.updateFieldWithDefaultValue(oNewCustomFieldMetadata);
                }
                oMetadataPersistency.updateUnitField(oNewCustomFieldMetadata);
            });
        }

    }




    function deleteAlreadyExistingData(mTableData) {
        Object.keys(mTableData).forEach(async function (sTableName) {
            if (_.includes(aCffTables, sTableName) === true) {


                return;
            }

            if (mDataModel[sTableName].hasStagingTable && aClobTables.indexOf(sTableName) === -1) {

                var aPrimaryKeys = mDataModel[sTableName].primaryKeys.filter(function (value) {
                    return value !== '_VALID_FROM';
                });
                var sPrimaryKeyList = aPrimaryKeys.join(',');
                var sPrimaryKeyListWithPrefix = aPrimaryKeys.map(function (value) {
                    return 't1.' + value;
                }).join(',');
                var sJoinCondition = mDataModel[sTableName].columns.filter(function (value) {
                    return !value.startsWith('_');
                }).map(function (value) {
                    return 't1.' + value + '=t2.' + value;
                }).join(' and ');
                var sWhereCondition = mDataModel[sTableName].isVersionedTable ? ' where _valid_to is null)' : ')';





                var query = 'delete from "' + await getFullStagingTableName(sTableName) + '" where (' + sPrimaryKeyList + ') in (select ' + sPrimaryKeyListWithPrefix + ' from "' + await getFullTableName(sTableName) + '" t1 inner join "' + await getFullStagingTableName(sTableName) + '" t2 on ' + sJoinCondition + sWhereCondition;
                dbConnection.executeUpdate(query);
            }
        });
    }






    function deleteAlreadyExistingReplicatedData(mTableData) {

        return;
    }







    async function checkReferenceIntegrity(mTableData) {
        var aErrors = [];
        Object.keys(mTableData).forEach(function (sTableName) {
            var aTableConstraints = oForeignKeyRelationships[sTableName];
            if (aTableConstraints !== undefined && aTableConstraints !== null) {
                aTableConstraints.forEach(async function (constraint) {
                    try {
                        var query = await buildQueryCheckReferenceKey(sTableName, constraint);
                        if (query.length > 0) {
                            var result = dbConnection.executeQuery(query);
                            if (result.length > 0) {
                                aErrors.push('data is inconsistent between ' + sTableName + ' and ' + constraint.targetTable);
                            }
                        }
                    } catch (e) {
                        const sClientMsg = 'Error while checking foreign key constraints.';
                        const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
                    }
                });
            }
        });




        if (aErrors.length !== 0) {
            const sClientMsg = 'Data is not consistent. See server log for detailed error messages.';
            const sServerMsg = `${ sClientMsg } Errors: ${ aErrors.join(';') }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, undefined, undefined, undefined);
        } else {
            return true;
        }

    }






    async function insertIntoTableUsingSequence(mTableData, sTableName) {
        var sQuery;
        var aColumns = mTableData[sTableName][0];
        var sColumnsInsert;
        if (sTableName === 't_costing_sheet_base') {
            sColumnsInsert = _.without(aColumns, 'COSTING_SHEET_BASE_ID').join(',');
            sQuery = 'INSERT INTO "' + await getFullTableName(sTableName) + '"' + ' (COSTING_SHEET_BASE_ID,' + sColumnsInsert + ', _VALID_FROM,_SOURCE,_CREATED_BY) ' + ' SELECT NEW_ID' + ' AS COSTING_SHEET_BASE_ID,' + sColumnsInsert + ",'" + oCurrentDate.toJSON() + "' AS _VALID_FROM,'" + iSource + "' as _SOURCE," + "'" + $.getPlcUsername() + "' AS _CREATED_BY" + ' FROM "' + await getFullStagingTableName('t_costing_sheet_base') + '"';
        } else {

            return;
        }

        dbConnection.executeUpdate(sQuery);
    }






    async function insertIntoTableHavingRelationshipWithSequence(mTableData, sTableName) {
        var aTableData = mTableData[sTableName];
        var aColumns = aTableData[0];

        var oConstraint = oSpecialForeignKeyRelationships[sTableName][0];

        var fromStagingTableName = await getFullStagingTableName(sTableName);
        var toStagingTableName = await getFullStagingTableName(oConstraint.targetTable);

        var sFromField = oConstraint.fields[0][0];
        var sToField = oConstraint.fields[0][1];
        var sColumns = _.without(aColumns, sFromField).join(',');

        var sUpsertStmt = 'UPSERT "' + await getFullTableName(sTableName) + '"' + ' (' + sFromField + ',' + sColumns + ') ' + 'Select (Select NEW_ID' + ' FROM "' + toStagingTableName + '" T1 WHERE T1.' + sToField + '= T2.' + sFromField + ') AS ' + sFromField + ',' + sColumns + ' FROM "' + fromStagingTableName + '" T2';

        dbConnection.executeUpdate(sUpsertStmt);
    }






    async function insertIntoNormalTable(mTableData, sTableName) {
        var aTableData = mTableData[sTableName];
        var aColumns = aTableData[0];

        var sColumnsInsert = aColumns.join(',');


        var aPrimaryKeys = mDataModel[sTableName].primaryKeys;
        var aOnCondition = [];
        aPrimaryKeys.forEach(function (pk) {
            if (pk !== '_VALID_FROM') {
                aOnCondition.push('T1.' + pk + '=T2.' + pk);
            }
        });

        if (mDataModel[sTableName].isVersionedTable) {



            var sUpdateStmt = 'UPDATE "' + await getFullTableName(sTableName) + '" T1' + ' SET _VALID_TO=? FROM "' + await getFullTableName(sTableName) + '" T1 INNER JOIN "' + await getFullStagingTableName(sTableName) + '" T2 ON ' + aOnCondition.join(' AND ') + ' WHERE T1._VALID_TO IS NULL';

            dbConnection.executeUpdate(sUpdateStmt, oCurrentDate);


            var aDefaultColumnsInsert = [];

            if (bDefaultUserID) {
                aDefaultColumnsInsert.push('_VALID_FROM, _VALID_TO, _SOURCE, _CREATED_BY');
                aDefaultColumnsInsert.push("'" + oCurrentDate.toJSON() + "' AS _VALID_FROM, NULL AS _VALID_TO, '" + iSource + "' AS _SOURCE," + "'" + $.getPlcUsername() + "' AS _CREATED_BY");
            } else {
                aDefaultColumnsInsert.push('_VALID_FROM, _VALID_TO, _SOURCE');
                aDefaultColumnsInsert.push("'" + oCurrentDate.toJSON() + "' AS _VALID_FROM, NULL AS _VALID_TO, '" + iSource + "' AS _SOURCE");
            }


            if (bDefaultUserID) {

                if (aColumns.indexOf('_CREATED_BY') !== -1) {
                    aColumns = _.without(aColumns, '_CREATED_BY');
                }
                sColumnsInsert = aColumns.join(',');
            }

            var sInsertStmt = 'INSERT INTO "' + await getFullTableName(sTableName) + '"' + ' (' + sColumnsInsert + ',' + aDefaultColumnsInsert[0] + ') ' + ' SELECT ' + sColumnsInsert + ',' + aDefaultColumnsInsert[1] + ' FROM "' + await getFullStagingTableName(sTableName) + '"';

            dbConnection.executeUpdate(sInsertStmt);
        } else {

            var sUpsertStmt = 'UPSERT "' + await getFullTableName(sTableName) + '"' + ' (' + sColumnsInsert + ') ' + ' SELECT ' + sColumnsInsert + ' FROM "' + await getFullStagingTableName(sTableName) + '"';

            dbConnection.executeUpdate(sUpsertStmt);
        }
    }






    async function insertIntoDB(mTableData, mParameters, mOutput) {
        Object.keys(mTableData).forEach(async function (sTableName) {
            if (aTablesUsingSequence.indexOf(sTableName) !== -1) {
                await insertIntoTableUsingSequence(mTableData, sTableName);
            } else if (oSpecialForeignKeyRelationships.hasOwnProperty(sTableName)) {
                await insertIntoTableHavingRelationshipWithSequence(mTableData, sTableName);
            } else if (_.includes(aCffTables, sTableName)) {
				// do nothing for CFF here, since for all 4 tables are inserted with one 
				// function call (see below)
			            } else {
                await insertIntoNormalTable(mTableData, sTableName);
            }

            mOutput[sTableName] = ['imported successfully'];
        });


        await insertCustomFieldsAndFormulasToPersistentTables(mParameters);
        _.each(aCffTables, function (sCffTableName) {
            mOutput[sCffTableName] = ['imported successfully'];
        });
    }








    this.importData = async function (oRequest, mParameters) {
        mParameters = mParameters || {};
        mParameters.mode = mParameters.mode || 'append';

        var oOutput = {};
        oCurrentDate = new Date(Date.now());
        if (oRequest === null) {
            const sLogMessage = `Request is null during import data.`;
            $.trace.error(sLogMessage);

            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }


        if (!await isUnlockStatus()) {
            const sLogMessage = `The system is currently locked. Data cannot be imported at the moment.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_METHOD_NOT_ALLOWED_ERROR, sLogMessage);
        }
        const resultActiveUsers = await hasActiveUsers();
        if (resultActiveUsers.hasUsers) {
            const sLogMessage = `Data cannot be imported at the moment.The following users are logged in the PLC app: ` + resultActiveUsers.users;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_METHOD_NOT_ALLOWED_ERROR, sLogMessage);
        }

        try {
            await lockImportTool();
        } catch (e) {
            const sClientMsg = 'Error while trying to acquire lock object.';
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, undefined, undefined, e);
        }
        try {


            await deleteAllStagingTables();

            await insertIntoStagingTables(oRequest);







            await deleteAlreadyExistingData(oRequest);

            await checkCustomFieldsAndFormulas(oRequest, mParameters);


            await deleteAlreadyExistingReplicatedData(oRequest);

            await checkReferenceIntegrity(oRequest);


            await insertIntoDB(oRequest, mParameters, oOutput);
        } finally {

            await unlockImportTool();
        }
        return oOutput;
    };





    function exportTables(aTableNames) {
        var mTableData = {};
        aTableNames.forEach(async function (sTableName) {
            var bIsCffTable = aCffTables.indexOf(sTableName) !== -1;



            var aColumnNames = mDataModel[sTableName].columns;

            var isVersionedTable = aColumnNames.indexOf('_VALID_FROM') !== -1;
            aColumnNames = aColumnNames.filter(function (columnName) {
                return aFilteredExportColumns.indexOf(columnName) === -1;
            });

            var aPrefixedColumnNames = aColumnNames.map(function (value) {
                return 't1.' + value;
            });

            var query = 'SELECT ' + aPrefixedColumnNames.join(',') + ' FROM "' + await getFullTableName(sTableName) + '" t1';
            if (isVersionedTable) {

                query += ' WHERE _valid_to IS NULL AND _source=1';
            }
            if (bIsCffTable) {

                switch (sTableName) {
                case 't_metadata':
                    query += ' WHERE is_custom=1';
                    break;
                case 't_metadata__text':
                    query += ' INNER JOIN "' + await getFullTableName('t_metadata') + '" t2 ON t1.column_id=t2.column_id AND t1.path=t2.path WHERE is_custom=1';
                    break;
                case 't_metadata_item_attributes':
                    query += ' INNER JOIN "' + await getFullTableName('t_metadata') + '" t2 ON t1.column_id=t2.column_id AND t1.path=t2.path AND t1.business_object=t2.business_object WHERE is_custom=1';
                    break;
                case 't_formula':
                    break;
                default: {
                        const sLogMessage = `Invalid table name provided for export: ${ sTableName }`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                    }
                }
            }

            var result = dbConnection.executeQuery(query);
            var tableData = [];
            var tableRow = [];
            if (result.length > 0) {
                for (let column in result[0]) {
                    tableRow.push(column);
                }
                tableData.push(tableRow);

                for (let row in result) {

                    tableRow = [];
                    for (let column in result[row]) {
                        tableRow.push(result[row][column]);
                    }
                    tableData.push(tableRow);
                }
            } else {

                aColumnNames.forEach(function (column) {
                    tableRow.push(column);
                });
                tableData.push(tableRow);
            }
            mTableData[sTableName] = tableData;
        });
        return mTableData;
    }





    this.exportData = async function (mParameters) {

        var aTableNames = [];



        var aBoList = mParameters.businessObjects.split(',');
        aBoList.forEach(function (bo) {
            var boTables = mMasterDataBusinessObjects[bo];
            if (boTables !== undefined && boTables !== null) {
                aTableNames.push.apply(aTableNames, boTables);
            }
        });


        if (aTableNames.length > 0) {
            return await exportTables(aTableNames);
        }
    };

    this.getTableColumns = function (sTableName) {
        var aTableColumns = [];
        var sFullTableName = 'sap.plc.db::basis.' + sTableName;
        var result = dbConnection.executeQuery('select column_name from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name=?', sFullTableName);
        for (var row in result) {
            if (!_.includes(aFilteredExportColumns, result[row].COLUMN_NAME)) {
                aTableColumns.push(result[row].COLUMN_NAME);
            }
        }
        return aTableColumns;
    };
}

Transportation.prototype = Object.create(Transportation.prototype);
Transportation.prototype.constructor = Transportation;
export default {_,oForeignKeyRelationships,oSpecialForeignKeyRelationships,mDataModel,BusinessObjectTypes,MessageLibrary,PlcException,Code,MessageDetails,aClobTables,aCffTables,aSettingTables,aAddinTables,Tables,aCustomizingTables,mMasterDataBusinessObjects,MasterdataResources,oReplicationMapping,aMasterDataTables,aAllTables,Procedures,Transportation};
