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
/**
* The Testrunner class.
*   @param request {$.web.WebRequest}
*       The HTTP request instance that is passed over from the HTTP server to the XS Engine.
*   @param response {$.web.WebResponse}
*       The HTTP response instance that is passed over to the HTTP server.
*   @param oController {xs.db.generation.DbArtefactController}
*        the instatiated DbArtefactController to generate custom fields to be used in the tests.
*   @param oConnection {dbConnection}
*        the db connection used to setup custom fields.
*/
function PLCTestRunner(request, response, oController, oConnection) {
    injectScriptGeneration.injectMetadataLibrary();

    // store column names of metadata tables in order to be used inside of SQL queries to avoid select * issues
    var sMetadataColumns         = "path, business_object, column_id, is_custom, rollup_type_id, side_panel_group_id, display_order, table_display_order, ref_uom_currency_path, ref_uom_currency_business_object, " +
                                    "ref_uom_currency_column_id, uom_currency_flag, semantic_data_type, semantic_data_type_attributes, property_type, is_immutable_after_save, is_required_in_masterdata, "+
                                    "is_wildcard_allowed, is_usable_in_formula, resource_key_display_name, resource_key_display_description, created_on, created_by, last_modified_on, "+
                                    "last_modified_by, validation_regex_id";
	var sMetadataTextColumns       = "path, column_id, language, display_name, display_description, created_on, created_by, last_modified_on, last_modified_by";
	var sMetadataAttributesColumns = "path, business_object, column_id, item_category_id, subitem_state, is_mandatory, is_read_only, is_transferable, " +
	                                 "default_value, created_on, created_by, last_modified_on, last_modified_by";
  var sFormularColumns           = "formula_id, path, business_object, column_id, item_category_id, is_formula_used, formula_string, formula_description";

    var oRequest = request;
    var oResponse = response;
    var oTableUtils;
    var oCsvProperties = {
        decSeparator : '.',
		separator : ',',
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

	//package and filenames
	var sTestDataBasePackage = "testtools.testrunner.db.content" ;
	var sTestDataBasePackageExtension = "default";
	var sMetadataFileName = "testdata_sap_t_metadata.csv";


    // Values allowed for the MODE parameter
    var aValidModeParameterValues = [
        "all",      //set to run all tests (default)
        "cf",        //set to run only custom field dependend tests
        "prepare",   //set for calling only postinstall-prepare tests (which are no tests! just preparation of the system before an upgrad)
        "assert"    //set for running the assert part of the postinstall-tests
    ];

    // Values allowed for the GENERATE parameter
    var aValidGenerateParameterValues = [
        "yes",  //DEPRECATED - USE default instead.
        "default", //set to generate custom fields before running the tests
        "no",    //set to not generate custom fields before running the tests (default)
        "run",  // set to runs custom field tests by setting generatedFields=true and not generating the custom fields before run. By skipping custom fields generation, the test runtime is significantly decreased.
        "clear" //generates a custom field free setup (using the csv's in the main project) - will set the jasmine.plcTestRunParameters.generatedFields parameter to false
    ];

    /**
    *   Inserting Custom Fields Metadata (based on csv's) in t_metadata to be used by the db-artefact-controller
    *   in order to generate custom fields before running the tests.
    */
    function insertCustomFieldMetadataFromCSV(bIncludeTestdata){
        var sFullTableName = `"sap.plc.db::basis.t_metadata"`;
        if(bIncludeTestdata){
            var sTestDataPackage = sTestDataBasePackage+"."+ sTestDataBasePackageExtension;
            var sTestDataCSVName = sMetadataFileName;
            oTableUtils.fillFromCsvFile(sFullTableName, sTestDataPackage, sTestDataCSVName, oCsvProperties);
        }

        var sOriginalDataPackage = "db.content";
        var sOriginalDataCSVName = "t_metadata.csv";
        oTableUtils.fillFromCsvFile(sFullTableName, sOriginalDataPackage, sOriginalDataCSVName, oCsvProperties);
    }

    /**
    *   Inserting Custom Fields Metadata Item Attributes (from csv's) in t_metadata_item_attributes to be used by the db-artefact-controller
    *   in order to generate custom fields before running the tests
    */
    function insertCustomFieldMetadataItemAttributesFromCSV(bIncludeTestdata){
        var sFullTableName = `"sap.plc.db::basis.t_metadata_item_attributes"`;
        if(bIncludeTestdata){
            var sTestDataPackage = sTestDataBasePackage+"."+ sTestDataBasePackageExtension;
            var sTestDataCSVName = "testdata_sap_t_metadata_item_attributes.csv";
            oTableUtils.fillFromCsvFile(sFullTableName, sTestDataPackage, sTestDataCSVName, oCsvProperties);
        }

        var sOriginalDataPackage = "db.content";
        var sOriginalDataCSVName = "t_metadata_item_attributes.csv";
        oTableUtils.fillFromCsvFile(sFullTableName, sOriginalDataPackage, sOriginalDataCSVName, oCsvProperties);
    }

    /**
    *   Inserting Custom Fields Metadata Texts (from csv's) in t_metadata__text to be used by the db-artefact-controller
    *   in order to generate custom fields before running the tests
    */
    function insertCustomFieldMetadataTextFromCSV(){
        var sFullTableName = `"sap.plc.db::basis.t_metadata__text"`;
        var sTestDataPackage = sTestDataBasePackage+"."+ sTestDataBasePackageExtension;
        var sTestDataCSVName = "testdata_sap_t_metadata__text.csv";
        oTableUtils.fillFromCsvFile(sFullTableName, sTestDataPackage, sTestDataCSVName, oCsvProperties);
    }

     /**
    *   Inserting Custom Formulas (from csv's) in t_formulas to be used by the db-artefact-controller
    *   in order to generate custom fields before running the tests
    */
    function insertCustomFormulasFromCSV(){
        var sFullTableName = `"sap.plc.db::basis.t_formula"`;
        var sTestDataPackage = sTestDataBasePackage+"."+ sTestDataBasePackageExtension;
        var sTestDataCSVName = "testdata_sap_t_formula.csv";
        oTableUtils.fillFromCsvFile(sFullTableName, sTestDataPackage, sTestDataCSVName, oCsvProperties);
    }


    /**
     *  Truncates metadata tables to ensure a deterministic test setup.
     */
    function truncateMetaData()
    {
        var sTruncateMetadataSQL = `delete from "sap.plc.db::basis.t_metadata";`;
        var sTruncateMetadataItemAttributesSQL = `delete from "sap.plc.db::basis.t_metadata_item_attributes"`;
        var sTruncateMetadataTextSQL = `delete from "sap.plc.db::basis.t_metadata__text"`;
        var sTruncateFormulaSQL = `delete from "sap.plc.db::basis.t_formula"`;

        oConnection.executeUpdate(sTruncateFormulaSQL);
        oConnection.executeUpdate(sTruncateMetadataItemAttributesSQL);
        oConnection.executeUpdate(sTruncateMetadataTextSQL);
        oConnection.executeUpdate(sTruncateMetadataSQL);
    }
 /**
     *  Checks if a scenario package exists and if the metadata csv is there.
     *  @param sSubpackage String
     *      the name of the scenario-subpackage (e.g. 'default' or 'pwo')
     */
    function doesScenarioExist(sSubpackage)
    {
        // var repository = new Repository($.db.getConnection($.db.isolation.SERIALIZABLE));
        // return repository.fileExists(RepositoryPath.fromPackageAndFilename(sTestDataBasePackage+"."+ sSubpackage,sMetadataFileName));
        return csvParser.csvExists(sTestDataBasePackage + "." + sSubpackage, sMetadataFileName);
    }
    /**
    *   Reads the MODE parameter value. Sets the value to 'all' if the parameter was not set.
    */
    function getModeParameterValue(){
        var sMode = oRequest.parameters.get('mode');
        if (sMode === undefined) {
    		sMode = 'all';
        }

        if(!_.includes(aValidModeParameterValues, sMode) ){
            console.info("Mode parameter value invalid. Please use 'all' or 'cf'");
    	    return undefined;
        }

        return sMode;
    }
    /**
    *   Reads the tenantId parameter.
    */
    function getTenantIdParameterValue(){
        var sTenantId = oRequest.parameters.get('tenantId');
        if(sTenantId === undefined){
            console.error("tenantId is undefined in .test file");
        }
        return sTenantId;
    }
    /**
    *   Reads the generate parameter. Sets it to 'no' if it was not set.
    */
    function getGenerateParameterValue(sDefault){
        var sGenerate = oRequest.parameters.get('generate');
        if (sGenerate === undefined) {
    		sGenerate = sDefault ? sDefault : 'no';
        }
        if(!_.includes(aValidGenerateParameterValues, sGenerate) ){
            //checks if the generate parameter was set to a valid package (that should contain csv's)
            if(doesScenarioExist(sGenerate)){
                sTestDataBasePackageExtension = sGenerate;
            }else{
                console.info("Generate parameter value invalid. Please use 'default' or 'no' or the name of a valid scenario package");
                oResponse.setBody("Generate parameter value invalid. Please use 'default' or 'no' or the name of a valid scenario package");
                oResponse.status = $.net.http.INTERNAL_SERVER_ERROR;
                oResponse.contentType = "text/plain";
                return undefined;
            }
        }
        return sGenerate;
    }

    /**
     * 	Stores pre-testrun metadata in a temporary table and insert testdata in the metadata tables
     */
    function prepareTestMetadata(){
        oTableUtils = new TableUtils(oConnection);

    	truncateMetaData();
    	insertCustomFieldMetadataFromCSV(getGenerateParameterValue() === 'clear' ? false : true);
        insertCustomFieldMetadataItemAttributesFromCSV(getGenerateParameterValue() === 'clear' ? false : true);
        if(getGenerateParameterValue() !== 'clear'){
	        insertCustomFieldMetadataTextFromCSV();
	        insertCustomFormulasFromCSV();
        }
    }

    /**
     * Prepares Testdata and triggers generation of custom fields and formulas.
     */
    function generateTestCFF(){
        prepareTestMetadata();
        oConnection.commit();
	    oController.generateAllFilesExt();
        oController.commit();
        if (getGenerateParameterValue() !== 'clear'){
            // Currently, we don't have test data for custom fields in t_item_ext. However, the frontend still expects
            // that *_IS_MANUAL fields are set correctly.
            // 1. Create missing rows in t_item_ext for each row in t_item
            // Create missing rows in masterdata tables
            const oPersistencyMetadata = new PersistencyMetadata($, null, oConnection, $.session.getUsername());
            oPersistencyMetadata.copyItemsToItemExt();
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.Material);
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.MaterialPlant);
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.MaterialPrice);
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.CostCenter);
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.WorkCenter);
            oPersistencyMetadata.copyMasterdataToMasterdataExt(BusinessObjectTypes.ActivityPrice);

            // 2. Correctly set *_IS_MANUAL fields for custom fields where it is NULL for selected
            // item categories by calling post-install script.
            fixIsManual.run(oConnection);
            
            //3. Set manual values for boolean fields
            fixBooleanManualForItem.run(oConnection);
            fixBooleanManualForMd.run(oConnection);
            
            //4. Set default values for unit fields
            fixUnit.run(oConnection);
            
            oConnection.commit();
        }
    }

    // Cleanup Script for Auit Tests
    this.cleanUpForAuitTest = function() {
        truncateMetaData();
        oConnection.commit();

        //clear temporary tables first
        const oPersistency = new Persistency(oConnection);
        oPersistency.Session.clearTemporaryTables($.session.getUsername()); 
        oConnection.commit();

        //regenerate artefacts - metadata example data was changed
        oController.generateAllFilesExt();
        oController.commit();
    };

    this.cleanUpForXsjsTest = function() {
        const sGenerate = getGenerateParameterValue();
        const sRunId = oRequest.parameters.get('runid');
        if((sGenerate !== undefined && sGenerate !== "no" && sGenerate !=='run') && helpers.isNullOrUndefined(sRunId)){
            truncateMetaData();
            oConnection.commit();
            oController.generateAllFilesExt();
            oController.commit();
        }
    }

    this.setupForXsjsTest = function ()
    {
        //handle mode parameter
        var sMode = getModeParameterValue();

        jasmine.plcTestRunParameters = {
            generatedFields: false,
            mode: sMode
        };

        if(isCloud()){
            jasmine.plcTestRunParameters.tenantId =  getTenantIdParameterValue();
        }

        var sRunId = oRequest.parameters.get('runid');

        //handle generate parameter
        var sGenerate = getGenerateParameterValue();
        if(sGenerate !== undefined && sGenerate !=='no' && sGenerate !=='run')
        {
            //if a runid is passed, the test was prepared, no need to generate fields again
            if (helpers.isNullOrUndefined(sRunId))
            {
                generateTestCFF();
            }
            if (sGenerate !== 'clear')
            {
                jasmine.plcTestRunParameters.generatedFields = true;
            }
        }
        if(sGenerate ==='run'){
            jasmine.plcTestRunParameters.generatedFields = true;
        }
        try
        {
            //if mode and generate parameters are set and handled correctly, run the tests
            if (sMode && sGenerate)
            {
                return true;
            } else
            {
                //remove the environment parameters to not influence coming test runs
                jasmine.plcTestRunParameters = {};
                return false
            }
        } catch (e)
        {
            console.error(e.message + "\n" + e.stack);
            return false;
        }
    };




    /**
    *   Prepares the tests and generates custom fields if generate parameter is set in the request
    *   if needed.
    *   @param oReporter {sap.hana.testtools.unit.jasminexs.reporter2.db.dbReporter"}
    *       The reporter used to prepare testruns.
     */
    this.prepare = function(oReporter){
        try {
            var sGenerate = getGenerateParameterValue();
    	    if(sGenerate !== undefined && sGenerate !=='no'){
        		generateTestCFF();
    	    }
    	    if(sGenerate){
            	var env = params.getEnvironmentParams();
            	var runId = oReporter.prepareTestRun(env);
                console.info(runId);

    	    }
        } catch (e) {

            console.error(e.message + "\n" + e.stack);

        }
    };

    /**
     *  Cleans up custom fields created with setup(), prepare() or run(). Is also restores metadata stored previously in helper tables.
     */
    this.cleanUp = function ()
    {
        try
        {
            truncateMetaData();
            oConnection.commit();
            oController.generateAllFilesExt();
            oController.commit();
        } catch (e)
        {
            console.error(e.message + "\n" + e.stack);
        }
    };

    /**
     * Creates a defined set of custom fields after storing the current metadata in helper tables (so that it can be restored using the cleanUp() function).
     */
    this.setup = function(){
        try {
            //clear temporary tables first
            const oPersistency = new Persistency(oConnection);
            oPersistency.Session.clearTemporaryTables($.session.getUsername()); 
            oConnection.commit();

            var sGenerate = getGenerateParameterValue('default');
			if(sGenerate !== undefined && sGenerate !=='no'){
                generateTestCFF();
                console.info(`Create CFF for ${sGenerate} scenario successfully.`);

                oResponse.contentType = "text/plain";
                oResponse.status = $.net.http.OK;
                oResponse.setBody("Create CFF for "+sGenerate+" scenario successfully.");
			}
        } catch (e) {

            console.error(e.message + "\n" + e.stack);
            oResponse.contentType = "text/plain";
            oResponse.setBody(e.message + "\n" + e.stack);
            oResponse.status = $.net.http.INTERNAL_SERVER_ERROR;

        }
    };
}

PLCTestRunner.prototype = Object.create(PLCTestRunner.prototype);
PLCTestRunner.prototype.constructor = PLCTestRunner;