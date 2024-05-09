//this register works on migrate PLC version 3.0.0 XSC SAP_PLC tables' data to XSA version 4.0.0 container tables
//the register need sqlcc config to be ready because of cross-schema tables visit. for detail, please see post-install tool user manual
//please assign your sqlcc user the role of "sqlcc_user" as it need "select", "insert" and "delete" privilege of your HDI container. you can execute "grant sqlcc_user to <your_sqlcc_user>" in hanastudio to get the role.
var oSqlccConnection = null;
var dbArtefactControllerLibrary = $.require("../../db/generation/hdi-db-artefact-controller");
var DbArtefactController = dbArtefactControllerLibrary.DbArtefactController;
const aDeletedTables = ["sap.plc.db::basis.t_account_group_account_group","sap.plc.db::basis.t_activity_rate_ext","sap.plc.db::basis.t_add_in_configuration","sap.plc.db::basis.t_cost_component",
                        "sap.plc.db::basis.t_cost_component__text", "sap.plc.db::basis.t_cost_component_values", "sap.plc.db::basis.t_replication_mapping",
                        "sap.plc.db::basis.t_account_staging", "sap.plc.db::basis.t_account__text_staging", "sap.plc.db::basis.t_account_account_group_staging",
                        "sap.plc.db::basis.t_account_group_staging", "sap.plc.db::basis.t_account_group__text_staging", "sap.plc.db::basis.t_account_group_account_group_staging",
                        "sap.plc.db::basis.t_account_group_cost_component_staging", "sap.plc.db::basis.t_activity_type_staging", "sap.plc.db::basis.t_activity_type__text_staging",
                        "sap.plc.db::basis.t_add_in_configuration_staging", "sap.plc.db::basis.t_addin_configuration_header_staging", "sap.plc.db::basis.t_addin_configuration_items_staging",
                        "sap.plc.db::basis.t_addin_version_staging", "sap.plc.db::basis.t_business_area_staging", "sap.plc.db::basis.t_business_area__text_staging",
                        "sap.plc.db::basis.t_company_code_staging", "sap.plc.db::basis.t_company_code__text_staging", "sap.plc.db::basis.t_component_split_staging",
                        "sap.plc.db::basis.t_component_split__text_staging", "sap.plc.db::basis.t_controlling_area_staging", "sap.plc.db::basis.t_controlling_area__text_staging",
                        "sap.plc.db::basis.t_cost_center_staging", "sap.plc.db::basis.t_cost_center__text_staging", "sap.plc.db::basis.t_cost_component_staging",
                        "sap.plc.db::basis.t_cost_component__text_staging", "sap.plc.db::basis.t_cost_component_values_staging", "sap.plc.db::basis.t_costing_sheet_staging",
                        "sap.plc.db::basis.t_costing_sheet__text_staging", "sap.plc.db::basis.t_costing_sheet_base_staging", "sap.plc.db::basis.t_costing_sheet_base_row_staging",
                        "sap.plc.db::basis.t_costing_sheet_overhead_staging", "sap.plc.db::basis.t_costing_sheet_overhead_row_staging", "sap.plc.db::basis.t_costing_sheet_row_staging",
                        "sap.plc.db::basis.t_costing_sheet_row__text_staging", "sap.plc.db::basis.t_costing_sheet_row_dependencies_staging", "sap.plc.db::basis.t_default_settings_staging",
                        "sap.plc.db::basis.t_material_account_staging", "sap.plc.db::basis.t_material_group_staging", "sap.plc.db::basis.t_material_group__text_staging",
                        "sap.plc.db::basis.t_material_type_staging", "sap.plc.db::basis.t_material_type__text_staging", "sap.plc.db::basis.t_price_ext", "sap.plc.db::basis.t_overhead_group_staging",
                        "sap.plc.db::basis.t_overhead_group__text_staging", "sap.plc.db::basis.t_plant_staging", "sap.plc.db::basis.t_plant__text_staging",
                        "sap.plc.db::basis.t_valuation_class__text_staging", "sap.plc.db::basis.t_activity_rate", "sap.plc.db::basis.t_price"
                    ];
//const aInstanceBasedTables = ["sap.plc.db::auth.t_auth_project", "sap.plc.db::auth.t_auth_user", "sap.plc.db::auth.t_usergroup_user"];
const {tableNotRemoved, getTargetTableName, getDeletedColumns, getRenamedColumns, getRenameColumn} = $.import("xs.postinstall.xslib", "upgradeSchemaMapping");
const {migrateMaterialPrice} = $.import("xs.postinstall.release_4_0_0", "migrateMaterialPrice");
const {migrateActivityPrice} = $.import("xs.postinstall.release_4_0_0", "migrateActivityPrice");
const {migrateMetadataCustomFields} = $.import("xs.postinstall.release_4_0_0", "migrateCustomFieldsMetadata");

const plcSchema = "SAP_PLC";
const excludeTables = ["sap.plc.db::basis.t_lock", "sap.plc.db::basis.t_task", "sap.plc.db::basis.t_log"];
const preMigrationTableName = ["sap.plc.db::basis.t_metadata__text","sap.plc.db::basis.t_formula"];
const iTableThreshold = 100000;
//the t_lock and some other tables don't need to be migrated in future, it's just used to keep plc data consistent


/**
 * get all tables under XSC "SAP_PLC" schema
 * @return all PLC tables in XSC
 */
function getPLCTables() {
    var tables = oSqlccConnection.executeQuery(`SELECT TABLE_NAME FROM "SYS"."M_CS_TABLES" WHERE SCHEMA_NAME = '${plcSchema}' AND TABLE_NAME not in (${aDeletedTables.map((sTableName) => {return `'${sTableName}'`;}).join()}) `);    //IS_USER_DEFINED_TYPE is used to distinguish temp tables and tables.
    return tables.map((item) => {
        return item.TABLE_NAME;
    }).filter((sTableName) => {
        return tableNotRemoved(sTableName);
    });
}

/**
 * get current connection
 * @return connection
 */
function getCurrentConnection(){
    return oSqlccConnection; 
}

/**
 *get the current schema name of your database
 * @param oConnection {object}
 * @return current schema
 */
function getSchemaName(oConnection) {
    return oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM "sap.plc.db::DUMMY"`)[0].CURRENT_SCHEMA;
}


/**
 *compare if tables in XSA and XSC are consistent
 * @param tableName {string} XSC PLC table names
 * @param currentSchemaName {string} current schema name
 * return {bollean} if is consistent in XSC and XSA
 */
function compareTableColumns(tableName, currentSchemaName) {
    var currentTable = getSchemaTableColumns(getTargetTableName(tableName), currentSchemaName);
    var plcTable = getXSCPLCTableColumns(tableName);
    if (currentTable.sort().join() ===  plcTable.sort().join()) {
        return true;
    } else {
        return false;
    }
}

/**
 * get all column names in a PLC table
 * @param tableName {string} XSC PLC table names
 * @param currentSchemaName {string} current schema name
 * return {array} the columns collection
 */
function getSchemaTableColumns(tableName, currentSchemaName) {
    return oSqlccConnection.executeQuery(`SELECT COLUMN_NAME FROM SYS.COLUMNS WHERE SCHEMA_NAME = '${currentSchemaName}' AND TABLE_NAME = '${tableName}' ORDER BY POSITION`).map(function(item, index){return item.COLUMN_NAME;});
}

/**
 * get target PLC XSA table columns according to data model changes
 * @param tableName {string} XSC PLC table names
 * return {array} return target columns
 */
function getXSCPLCTableColumns(tableName) {
    var plcTable = oSqlccConnection.executeQuery(`SELECT COLUMN_NAME FROM SYS.COLUMNS WHERE SCHEMA_NAME = '${plcSchema}' AND TABLE_NAME = '${tableName}' ORDER BY POSITION`).map(function(item, index){return item.COLUMN_NAME;});
    var aRemovdColumns = getDeletedColumns(tableName);
    return plcTable.filter((sColumn) => {
        return !aRemovdColumns.find(oRemovedColumn=>{return oRemovedColumn.originalColumn === sColumn});
    }).map((sColumn) => {
        return getRenameColumn(tableName, sColumn);
    });
}


/**
 * check if sqlcc configuration is ok
 * @param oConnection {object} current connection
 * return {bollean} return if connection is created correctly 
 */
function check(oConnection){
    try{
        oSqlccConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
        return true;
    } catch(e) {
        closeSqlConnection();
        throw(e);
    }
}

/**
 * generate custom fields in XSA and make tables consisent with XSC
 * loop all XSC tables and migrate tables' data to XSA container
 * @param oConnection {object} current connection
 * @param oLibraryMeta {object} library information
 * @param oRequestArgs {object} request parameters
 * return {bollean} return if datamigration is successfully 
 */
function run(oConnection, oLibraryMeta ,oRequestArgs) {
    if (oSqlccConnection !== null) {
        try {
            var currentSchemaName = getSchemaName(oConnection);
            migrateMetadataCustomFields(currentSchemaName, oSqlccConnection);
            for (var preIndex in preMigrationTableName) {
                if (!compareTableColumns(preMigrationTableName[preIndex], currentSchemaName)) {
                    //todo: special operation to make preMigration tables consistent
                    return false;
                }
                executeMigration(preMigrationTableName[preIndex], oRequestArgs.file, currentSchemaName);
            }

            var oDbArtefactController = new DbArtefactController($, oConnection);
            oDbArtefactController.generateAllFiles();
            // migrate prices from t_activity_rate into t_activity_price and from t_price to t_material_price and their custom fields
            migrateMaterialPrice(currentSchemaName, oSqlccConnection);
            migrateActivityPrice(currentSchemaName, oSqlccConnection);

            var plcTables = getPLCTables();
        
            for(var index in plcTables) {
                var tableName = plcTables[index];
                if (!preMigrationTableName.includes(tableName) && !excludeTables.includes(tableName)) {
                    executeMigration(tableName, oRequestArgs.file, currentSchemaName);
                }
            }
            return true; 
        } catch(e) {
            closeSqlConnection();
            const sServerMsg = `Error: ${e.message || e.msg}`;
            $.trace.error(sServerMsg);
            throw(e);
        }  
            
    }
}


/**
 * execute data migration, including: check data model changes, data migration, users replacement and remove XSC tables
 * @param sTableName {string} table name
 * @param oMappingUserList {array} user replacement list
 * @param currentSchemaName {object} current schema name
 */
function executeMigration(sTableName, oMappingUserList, currentSchemaName) {
    //TODO: here may need performance test
    console.log(sTableName);
    if (sTableName === "sap.plc.db.calcengine::calcengine_signatures.t_afl_signature") {//the table t_afl_signature is a no primary key table which can't use upsert..select.. sql
        oSqlccConnection.executeUpdate(`TRUNCATE TABLE "${sTableName}"`);
        oSqlccConnection.executeUpdate(`INSERT INTO "${sTableName}" SELECT * FROM "${plcSchema}"."${sTableName}"`);
        oSqlccConnection.commit(); 
    } else {
        //check data model changes
        var aXSCColumns = getSchemaTableColumns(sTableName, plcSchema);
        var aRemovdColumns = getDeletedColumns(sTableName);
        aXSCColumns = aXSCColumns.filter((sColumn) => {
            return !aRemovdColumns.find(oRemovedColumn=>{return oRemovedColumn.originalColumn === sColumn});
        })
        var sPreSql = `UPSERT "${getTargetTableName(sTableName)}" (`
        var sPostSql = `SELECT `;
        aXSCColumns.forEach(sColumn => {
            var sRenameColumn = getRenameColumn(sTableName, sColumn);
            sPreSql += `${sRenameColumn},`;
            sPostSql += `${sColumn} as ${sRenameColumn},`;
        });
        var sSql = `${sPreSql.slice(0, -1)}) ${sPostSql.slice(0, -1)} FROM "${plcSchema}"."${sTableName}"`;
        //split big tables into chunks to insert
        var iRecordNumber = checkTableSize(sTableName, oSqlccConnection);
        if(iRecordNumber > iTableThreshold) {
            var iloops = Math.ceil(iRecordNumber / iTableThreshold);
            for (var i = 0; i < iloops; i++) {
                var sLoopSql = sSql + ` LIMIT ${iTableThreshold} OFFSET ${i * iTableThreshold}`;
                oSqlccConnection.executeUpdate(sLoopSql);
                oSqlccConnection.commit();
            }
        } else {
            oSqlccConnection.executeUpdate(sSql);
            oSqlccConnection.commit();
        }
        
    }
    
    //remove XSC table data to right after migration 
    removeOldVersionData(sTableName, oSqlccConnection)
}

/**
 * remove XSC table data after data migration
 * @param sTableName {string} table name
 * @param oConnection {object} current connection
 */
function removeOldVersionData(sTableName, oConnection) {
    oConnection.executeUpdate(`TRUNCATE TABLE "${plcSchema}"."${sTableName}"`);
    oConnection.commit();
}

/**
 * check table size in XSC, if it's too big, split it for data migration 
 * @param sTableName {string} table name
 * @param oConnection {object} current connection
 * @return {integer} table size
 */
function checkTableSize(sTableName, oConnection) {
    return oConnection.executeQuery(`SELECT COUNT(*) as RECORDNUMBER FROM "${plcSchema}"."${sTableName}"`)[0].RECORDNUMBER;
}

/**
 * create user replacement sql
 * @param sTableName {string} table name
 * @param oConnection {object} current connection
 * @param sColumnName {string} column name 
 * @param currentSchemaName {string} current schema name
 */
function createUserReplaceSql(sTableName, oConnection, sColumnName, currentSchemaName) {
    var oResult = oConnection.executeQuery(`SELECT COLUMN_NAME FROM "SYS"."COLUMNS" WHERE SCHEMA_NAME='${currentSchemaName}' AND TABLE_NAME='${sTableName}' AND COLUMN_NAME='${sColumnName}'`);
    var sSql = "";
    if (!oResult || !oResult.length) {
        return sSql;
    } else {
        sSql = `UPDATE "${sTableName}" SET ${sColumnName} = ? WHERE ${sColumnName} = ?`;
        return sSql;
    }
}

/**
 * close connection
 */
function closeSqlConnection() {
    if (oSqlccConnection !== null) {
        oSqlccConnection.close();
    }
}

/**
 * close connection
 */
function clean(oConnection) {
    closeSqlConnection()
    return true;
}