const csvParser = $.require("../../utils/csvParser");
const _ = $.require("lodash");
const helpers = $.require("../../../lib/xs/util/helpers");
const TableUtils = $.require("../../extention/tableUtils").TableUtils;
const injectScriptGeneration = $.require('./inject-testscript-generation');
const PersistencyMetadata = $.require("../../../lib/xs/db/persistency-metadata").Metadata;
const Persistency = $.import("xs.db", "persistency").Persistency;
const BusinessObjectTypes = $.require("../../../lib/xs/util/constants").BusinessObjectTypes;
const fixIsManual = $.import("testtools.testrunner.postinstall", "fix_is_manual_for_all_items");
const fixBooleanManualForItem = $.import("testtools.testrunner.postinstall", "set_default_values_to_boolean_cf");
const fixBooleanManualForMd = $.import("testtools.testrunner.postinstall", "set_default_values_for_masterdata_boolean_cf");
const fixUnit = $.import("testtools.testrunner.postinstall", "set_default_value_for_unit_masterdata_cf");
const isCloud = $.require("../../utils/testUtil.js").isCloud;
const parse = $.require('csv-parse/lib/sync');
const oFS = $.require("fs");
const oPath = $.require("path");

/**
* The CFFLoader class.
*   @param request {$.web.WebRequest}
*       The HTTP request instance that is passed over from the HTTP server to the XS Engine.
*   @param response {$.web.WebResponse}
*       The HTTP response instance that is passed over to the HTTP server.
*   @param oController {xs.db.generation.DbArtefactController}
*        the instatiated DbArtefactController to generate custom fields to be used in the tests.
*   @param oConnection {dbConnection}
*        the db connection used to setup custom fields.
*/
function PLCCFFLoader(request, response, oController, oConnection) {
    injectScriptGeneration.injectMetadataLibrary();
    var oRequest = request;
    var oResponse = response;
    var oCsvProperties = {
        columns: true,
        delimiter: ',',
        headers: true,
        quoting: true,
        skip_empty_lines: true,
        cast: function (value, context) {
            if (value.includes('json')) { // special handling for json properties -> double the quotes of properties
                let jsonValue = value.substring(value.lastIndexOf("json"));
                jsonValue = jsonValue.replace(/\\/g, '')
                jsonValue = jsonValue.split('').map(char => char == '"' ? char + char : char).join('');
                value = "\"" + value.substring(0, value.lastIndexOf("json")) + jsonValue + "\"";
            }
            // check between ,, which is NULL and ,"", which is emptry string
            return (!value.length && !context.quoting) ? "NULL" : value;
        }
    }

    var aMetadataObjects = [{
        "table": "t_metadata_item_attributes",
        "fields": [
            "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "SUBITEM_STATE", "IS_MANDATORY", "IS_READ_ONLY", "IS_TRANSFERABLE",
            "DEFAULT_VALUE", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY"
        ]
    }, {
        "table": "t_metadata",
        "fields": [
            "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "IS_CUSTOM", "ROLLUP_TYPE_ID", "SIDE_PANEL_GROUP_ID", "DISPLAY_ORDER", "TABLE_DISPLAY_ORDER",
            "REF_UOM_CURRENCY_PATH", "REF_UOM_CURRENCY_BUSINESS_OBJECT", "REF_UOM_CURRENCY_COLUMN_ID", "UOM_CURRENCY_FLAG", "SEMANTIC_DATA_TYPE",
            "SEMANTIC_DATA_TYPE_ATTRIBUTES", "VALIDATION_REGEX_ID", "PROPERTY_TYPE", "IS_IMMUTABLE_AFTER_SAVE", "IS_REQUIRED_IN_MASTERDATA",
            "IS_WILDCARD_ALLOWED", "IS_USABLE_IN_FORMULA", "RESOURCE_KEY_DISPLAY_NAME", "RESOURCE_KEY_DISPLAY_DESCRIPTION", "CREATED_ON", "CREATED_BY",
            "LAST_MODIFIED_ON", "LAST_MODIFIED_BY"
        ]
    }, {
        "table": "t_metadata__text",
        "fields": [
            "PATH", "COLUMN_ID", "LANGUAGE", "DISPLAY_NAME", "DISPLAY_DESCRIPTION", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON",
            "LAST_MODIFIED_BY"
        ]
    }, {
        "table": "t_formula",
        "fields": [
            "FORMULA_ID", "PATH", "BUSINESS_OBJECT", "COLUMN_ID", "ITEM_CATEGORY_ID", "IS_FORMULA_USED", "FORMULA_STRING", "FORMULA_DESCRIPTION"
        ]
    }];

    var sTablePrefix = "sap.plc.db::basis.";
    const sResourceFolder = 'lib/testtools/testrunner/db/content';

	//package and filenames
    var sTestDataBasePackage = "testtools.testrunner.db.content" ;
	var sMetadataFileName = "testdata_sap_t_metadata.csv";
    var sTestDataCSVName = "testdata_sap_"; 

    // Values allowed for the GENERATE parameter
    var aValidPackageParameterValues = [
        "default",
        "clear",
        "extension",
        "formula-performance"
    ];
    var sPackageDefault = 'default';

    //values allowed for APPEND parameter
    var aValidAppendParameterValues = [
        "yes",      //set to append custom fields
        "no"        //set to delete existing custom fields and add the new ones
    ];
    var sAppendDefault = 'no';

    //function that reads the csv files and generates the SQL procedures strings
    function loadDataFromCsv(sCurrentSchema) {
        let aReturnStatements = [];
        var sPackage = getPackageParameterValue();
        if (sPackage !== 'clear') {
            aMetadataObjects.forEach(oObject => {
                const sCsvFilePath = "./" + sPackage + "/" + sTestDataCSVName + oObject.table + ".csv";
                try {
                    const aParsedRows = csvToObjects(sCsvFilePath, oCsvProperties);
                    let sGeneratedFromCsv = createUpsertStatementForTable(aParsedRows, sCurrentSchema, sTablePrefix + oObject.table, oObject.fields);
                    aReturnStatements.push(sGeneratedFromCsv);
                }
                catch (e) {
                    console.info("ERROR: Error found at file:" + sCsvFilePath);
                    throw e;
                }
            });
        }
        return aReturnStatements;
    }

    //function that generates the SQL UPSERT procedure strings for given table
    function createUpsertStatementForTable(aParsedRows, sCurrentSchema, sTableName, aArrayOfFields){
        let insertPrefix = `UPSERT "${sCurrentSchema}"."` + sTableName + `" values`;
        let sGeneratedFromCsv =``;
        aParsedRows.forEach(row => {
            let sStatement = ``;
            Object.keys(row).forEach(key => row[key] == "NULL" ? row[key] : row[key]="\'" + row[key] + "\'");
            sStatement += insertPrefix;
            sStatement += `(`;
            aArrayOfFields.forEach(field =>{
                sStatement +=`${row[field]},`;
            })
            sStatement=sStatement.slice(0, -1);
            sStatement+=`) WITH PRIMARY KEY; \n`;
            sGeneratedFromCsv += sStatement;
        })
        return sGeneratedFromCsv;
    }
    
    //function that deletes the existing logs so that the post-install service can be ran
    function deleteLogs(sCurrentSchema) {
        var sDeleteStateSQL = `Delete from "${sCurrentSchema}"."sap.plc.db::basis.t_initialization_state"`;
        var sDeleteLogsSQL = `Delete from "${sCurrentSchema}"."sap.plc.db::basis.t_installation_log"`;
        oConnection.executeUpdate(sDeleteStateSQL);
        oConnection.executeUpdate(sDeleteLogsSQL);
    }
    
    //function that takes the path of a csv file, reads it, and parses it into js objects
    function csvToObjects(sCsvFilePath, oCsvProperties) {
        var realPath = oFS.realpathSync(sResourceFolder,[]);
        var fileData = oFS.readFileSync(oPath.resolve(realPath, sCsvFilePath));
        return parse(fileData,oCsvProperties);
    }

    //function that splits a concatenated UPSERT procedure string into an array of singural procedures.
    function splitStatements(statements){
        let splitStatements = [];
        const prefix = "UPSERT"
        statements.forEach(statement => {
            const statementArray = statement.split(prefix);
            statementArray.forEach(insert =>{
                const singleStatement = prefix + insert;
                if(singleStatement!=='UPSERT'){
                    splitStatements.push(singleStatement);
                }
            })    
        })
        splitStatements.shift()
        return splitStatements;
    }
    
    //function to get the current schema that the connection is running on
    function getCurrentSchema(oCurrentConnection) {
        return oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
    }
    
    function check(oConnection) {
        return true;
    }

    function clean(oConnection) {
        return true;
    }

    /**
     *  Truncates metadata tables to ensure a deterministic test setup.
    */
    function truncateMetaData()
    {
        var sTruncateMetadataSQL = `delete from "sap.plc.db::basis.t_metadata";`;
        var sTruncateMetadataItemAttributesSQL = `delete from "sap.plc.db::basis.t_metadata_item_attributes";`;
        var sTruncateMetadataTextSQL = `delete from "sap.plc.db::basis.t_metadata__text";`;
        var sTruncateFormulaSQL = `delete from "sap.plc.db::basis.t_formula";`;

        oConnection.executeUpdate(sTruncateFormulaSQL);
        oConnection.executeUpdate(sTruncateMetadataItemAttributesSQL);
        oConnection.executeUpdate(sTruncateMetadataTextSQL);
        oConnection.executeUpdate(sTruncateMetadataSQL);
    }

    /**
     *  Checks if a scenario package exists and if the metadata csv is there.
     *  @param sSubpackage String
     *      the name of the scenario-subpackage (e.g. 'default')
     */
    function doesScenarioExist(sSubpackage)
    {
        return csvParser.csvExists(sTestDataBasePackage + "." + sSubpackage, sMetadataFileName);
    }

    /**
    *   Reads the package parameter. Sets it to 'default' if it was not set.
    */
    function getPackageParameterValue(){
        var sPackage = oRequest.parameters.get('package');
        if (sPackage === undefined) {
    		sPackage = sPackageDefault ? sPackageDefault : 'default';
        }
        if(!_.includes(aValidPackageParameterValues, sPackage) ){
            if(doesScenarioExist(sPackage)){
                sTestDataBasePackageExtension = sPackage;
            }else{
                console.info("Package parameter value invalid. Please use 'default' or the name of a valid package");
                oResponse.setBody("Package parameter value invalid. Please use 'default' or the name of a valid package");
                oResponse.status = $.net.http.INTERNAL_SERVER_ERROR;
                oResponse.contentType = "text/plain";
                return undefined;
            }
        }
        return sPackage;
    }

    /**
    *   Reads the append parameter. Sets it to 'no' if it was not set.
    */
    function getAppendParameterValue(){
        var sAppend = oRequest.parameters.get('append');
        if (sAppend === undefined) {
    		sAppend = sAppendDefault ? sAppendDefault : 'no';
        }
        if(!_.includes(aValidAppendParameterValues, sAppend) ){
            if(doesScenarioExist(sAppend)){
                sTestDataBaseAppendExtension = sAppend;
            }else{
                console.info("Append parameter value invalid. Please use 'yes' or 'no'");
                oResponse.setBody("Append parameter value invalid. Please use 'yes' or 'no'");
                oResponse.status = $.net.http.INTERNAL_SERVER_ERROR;
                oResponse.contentType = "text/plain";
                return undefined;
            }
        }
        return sAppend;
    }


    //function that executes the generated procedures
    this.setup = function(){
        const sCurrentSchema = getCurrentSchema(oConnection);
        const statements = loadDataFromCsv(sCurrentSchema);
        const singleStatements = splitStatements(statements);
        var wasDeletedMessage='';
        try {
            if(getAppendParameterValue()=='no'){
                truncateMetaData();
                wasDeletedMessage="Existent data deleted.\n"
            }
            deleteLogs(sCurrentSchema);
            if(getPackageParameterValue()!=='clear'){
                singleStatements.forEach(statement => {
                    oConnection.executeUpdate(statement);
                })
            }
        } catch (e) {
            console.info("error:", e.message);
            oResponse.contentType = "text/plain";
            oResponse.setBody(`Failed to update tables: ${e.message}`);
            throw new Error(`Failed to update tables: ${e.message}`);
        }    
        oConnection.commit();
        oResponse.contentType = "text/plain";
        oResponse.status = $.net.http.OK;
        console.info(wasDeletedMessage + "CFF's generated successfully for " + getPackageParameterValue() + " package.\nPlease run the post-install services!");
        oResponse.setBody(wasDeletedMessage + "CFF's generated successfully for " + getPackageParameterValue() + " package.\nPlease run the post-install services!");
        
        return true;
    };
}

PLCCFFLoader.prototype = Object.create(PLCCFFLoader.prototype);
PLCCFFLoader.prototype.constructor = PLCCFFLoader;