var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var plcTestrunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
var fixIsManual = $.import("testtools.testrunner.postinstall", "fix_is_manual_for_all_items");
const fixBooleanManualForItem = $.import("testtools.testrunner.postinstall", "set_default_values_to_boolean_cf");
const fixBooleanManualForMd = $.import("testtools.testrunner.postinstall", "set_default_values_for_masterdata_boolean_cf");
const fixUnit = $.import("testtools.testrunner.postinstall", "set_default_value_for_unit_masterdata_cf");

describe("testtools.testrunner.testrunner-tests", function() {

	var DbArtefactControllerSpy;
	var oDefaultResponseMock;
	var oReporterMock;
	var originalGenFields= jasmine.plcTestRunParameters.generatedFields;

	function cleanMetaDataTables(){
	    var sTruncateMetadataSQL =`delete from "sap.plc.db::basis.t_metadata" where is_custom = 1`;
	    var sTruncateMetadataTextSQL ='delete from "sap.plc.db::basis.t_metadata__text"';
        var sTruncateMetadataItemAttributesSQL='delete from "sap.plc.db::basis.t_metadata_item_attributes"  where exists '+
    	'(SELECT attr.*  '+
    	'FROM "sap.plc.db::basis.t_metadata_item_attributes" as attr  '+
    	'left outer join "sap.plc.db::basis.t_metadata" as meta on  '+
    	'attr.column_id = meta.column_id and '+
    	'attr.path = meta.path and '+
    	'attr.business_object = meta.business_object '+
    	'where meta.is_custom = 1)';

        jasmine.dbConnection.executeUpdate(sTruncateMetadataItemAttributesSQL);
        jasmine.dbConnection.executeUpdate(sTruncateMetadataTextSQL);
        jasmine.dbConnection.executeUpdate(sTruncateMetadataSQL);
	}

	afterOnce(function() {
		jasmine.plcTestRunParameters.generatedFields = originalGenFields;
	});

	beforeEach(function() {
	    cleanMetaDataTables();
	    jasmine.dbConnection.setAutoCommit(false);
        spyOn(jasmine.dbConnection, 'executeUpdate').and.callThrough();
        spyOn(jasmine.dbConnection, 'commit');

        spyOn(fixIsManual, 'run').and.returnValue(true); // mock post-install script to set IS_MANUAL fields
        spyOn(fixBooleanManualForItem, 'run').and.returnValue(true); // mock post-install script to set MANUAL boolean fields for Item
        spyOn(fixBooleanManualForMd, 'run').and.returnValue(true); // mock post-install script to set MANUAL boolean fields for Masterdata
        spyOn(fixUnit, 'run').and.returnValue(true); // mock post-install script to set UNIT fields for Masterdata and Items
              
        oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);

        DbArtefactControllerSpy = jasmine.createSpyObj('oController', ['generateAllFilesExt', 'commit']);
        DbArtefactControllerSpy.generateAllFilesExt.and.returnValue("generated...not!");
        DbArtefactControllerSpy.commit.and.returnValue("commit by dbArtifactController");

        oReporterMock = jasmine.createSpyObj('oReporter',['prepareTestRun']);
        oReporterMock.prepareTestRun.and.returnValue("123");
	});

	function prepareRequest(params) {

        params.get = function(sArgument) {
			var value;
			_.each(this, function(oParameter) {
				if (oParameter.name === sArgument) {
					value = oParameter.value;
				}
			});
			return value;
		};

        var oRequest = {
            method: $.net.http.GET,
            parameters: params,
            body: {}
        };
        return oRequest;
    }

	function createParamsObject(aNameValuePairs){
        var params = [];
        _.each(aNameValuePairs,function(oNameValuePair){
           params.push(oNameValuePair);
        });
        params.get = function(sParameterName) {
            if (helpers.isNullOrUndefined(sParameterName)) {
                return null;
            } else {
                _.each(aNameValuePairs,function(oNameValuePair){
                    if (sParameterName === oNameValuePair.name) {
                        return oNameValuePair.value;
                    }
                });
            }
        };
        return params;
    }
    describe("mode parameter", function() {

    	it("should set the test-run-parameter correctly in the jasmine environment if a mode parameter was passed in the request URL", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "mode",
                "value": "cf"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.mode).toBe("cf");
    	});

    	it("should set the test-run-parameter to 'all' in the jasmine environment if no mode parameter was passed in the request URL", function() {
    		// Arrange
    		var params = [];
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.mode).toBe("all");
    	});

    	it("should return an error if an invalid mode parameter has been set in the request URL", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "mode",
                "value": "someThingInvalid"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.mode).toBeUndefined();
    	});
    });

	describe("generate parameter", function() {

    	it("should NOT generate custom fields before running tests if a generate parameter was passed in the request URL", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "no"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeFalsy();
    		expect(DbArtefactControllerSpy.generateAllFilesExt).not.toHaveBeenCalled();
    	});

    	it("should generate custom fields before running tests if a generate parameter was passed in the request URL", function() {
    		// Arrange
    		cleanMetaDataTables();
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            }]);
    		var oRequest = prepareRequest(params);

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		//called for setup and cleanup (included in generateAllFilesExt)
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toEqual(1);
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    		//check, that generated fields deleted at the end
            //check, that generated fields are in t_metadata during execution of jasmine test runs
            var metaData = jasmine.dbConnection.executeQuery(
                'select count(*) as count from "sap.plc.db::basis.t_metadata" where ref_uom_currency_column_id = \'CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT\'');
            expect(parseInt(metaData[0].COUNT, 10)).not.toBeLessThan(1);
            metaData = jasmine.dbConnection.executeQuery(
                'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes" where column_id = \'CUST_BOOLEAN_INT\'');
            expect(parseInt(metaData[0].COUNT, 10)).not.toBeLessThan(2);
            metaData = jasmine.dbConnection.executeQuery(
                'select count(*) as count from "sap.plc.db::basis.t_metadata__text" where column_id = \'CUST_BOOLEAN_INT\'');
            expect(parseInt(metaData[0].COUNT, 10)).toEqual(2);

            metaData = jasmine.dbConnection.executeQuery(
                'select count(*) as count from "sap.plc.db::basis.t_formula" where column_id = \'CUST_INT_FORMULA\'');
            expect(parseInt(metaData[0].COUNT, 10)).toEqual(2);
    	});

    	it("should clean the helper tables before generating fields", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            }]);
    		var oRequest = prepareRequest(params);

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
            //check if before anything else, the helper tables have been cleared (truncateMetaData)
    		expect(jasmine.dbConnection.executeUpdate.calls.allArgs()[0]).
    		    toEqual(['delete from "sap.plc.db::basis.t_formula"']);
    		expect(jasmine.dbConnection.executeUpdate.calls.allArgs()[1]).
    		    toEqual(['delete from "sap.plc.db::basis.t_metadata_item_attributes"']);
    		expect(jasmine.dbConnection.executeUpdate.calls.allArgs()[2]).
    		    toEqual(['delete from "sap.plc.db::basis.t_metadata__text"']);
    		expect(jasmine.dbConnection.executeUpdate.calls.allArgs()[3]).
    		    toEqual(['delete from "sap.plc.db::basis.t_metadata";']);
    	});

    	it("should return an error if an invalid generate parameter value has been set in the request URL", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "someThingInvalid"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(DbArtefactControllerSpy.generateAllFilesExt).not.toHaveBeenCalled();
    		expect(oDefaultResponseMock.setBody.calls.mostRecent().args[0]).toBe("Generate parameter value invalid. Please use 'default' or 'no' or the name of a valid scenario package");
    	});

    	it("should clean the metadata tables and restore them after running the tests", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
            testrunner.setupForXsjsTest();
    		// Assert
    		//check if before anything else, the helper table has been filled (first 4 calls are cleaning helper tables)
            var sInsertTestMetadataStmt = jasmine.dbConnection.executeUpdate.calls.allArgs()[4][0];
			// use regex to test in order to ignore columns in statement
            var regInsertTestMetadata = /insert into "sap\.plc\.db::basis\.t_metadata"\(.*\) values \(.*\)/;
			expect(sInsertTestMetadataStmt.search(regInsertTestMetadata) >= 0).toBe(true);
            expect(jasmine.dbConnection.executeUpdate).toHaveBeenCalled();
            //check, that the generation of test custom fields, the restoring of original fields, and the setting of *IS_MANUAL fields has been commited
            expect(jasmine.dbConnection.commit.calls.count()).toBe(2);
            expect(DbArtefactControllerSpy.commit).toHaveBeenCalled();
    	});

    	it("should not generate if a 'runid' parameter has been passed",function(){
    	    // Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            },{
                "name": "runid",
                "value": "123"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    		expect(DbArtefactControllerSpy.generateAllFilesExt).not.toHaveBeenCalled();
    	});

    	it("should generate if the default sceanario package has been passed for the generate parameter",function(){
    	    // Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toBe(1);
    	});

    	it("should generate if a valid sceanario package has been passed for the generate parameter",function(){
    	    // Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "formula-performance"
            }]);
    		var oRequest = prepareRequest(params);
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
            // Assert
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toBe(1);
    	});

    	it("should generate a clear, cff-free setup if the generate parameter is set to 'clear' ",function(){
    	    // Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "clear"
            }]);
    		var oRequest = prepareRequest(params);

    		//insert a custom field that should cleared during tests and restored afterwards
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setupForXsjsTest();
    		// Assert
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeFalsy();
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toBe(1);
			expect(fixIsManual.run).not.toHaveBeenCalled(); // no need to fix IS_MANUAL fields if no custom fields are there
			expect(fixBooleanManualForItem.run).not.toHaveBeenCalled();
			expect(fixBooleanManualForMd.run).not.toHaveBeenCalled();
			expect(fixUnit.run).not.toHaveBeenCalled();
    	});
    });

	describe("clean up generated custom fields and restore original fields", function(){

	    it("should clean up generated custom fields and regenerate the previously stored fields", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "default"
            }]);
    		var oRequest = prepareRequest(params);
    		//insert a custom field that should be saved in the helper tables
    		jasmine.dbConnection.executeUpdate('truncate table "sap.plc.db::basis.t_metadata"');
    		jasmine.dbConnection.executeUpdate('truncate table "sap.plc.db::basis.t_metadata_item_attributes"');
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');

    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);

    		// Act
    		testrunner.cleanUp();

    		// Assert
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toEqual(1);
    		//check, that the old custom fields are not kept
            var metaData = jasmine.dbConnection.executeQuery(
		        'select count(*) as count from "sap.plc.db::basis.t_metadata"  where is_custom = 1');
    		expect(parseInt(metaData[0].COUNT)).toBe(0);
    		metaData = jasmine.dbConnection.executeQuery(
    		    'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"  as attr inner join "sap.plc.db::basis.t_metadata" as meta '+
    		    'on attr.PATH = meta.PATH and attr.COLUMN_ID = meta.COLUMN_ID and attr.BUSINESS_OBJECT=meta.BUSINESS_OBJECT');
    		expect(parseInt(metaData[0].COUNT)).toBe(0);
    	});

	});

	describe("setup custom fields", function(){

	    it("should generate custom fields if no generate parameter has been passed", function() {
    		// Arrange
    		var oRequest = prepareRequest({});
    		//clear metadata tables, to be able to check new entries
    		cleanMetaDataTables();
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setup();
    		// Assert

    		expect(DbArtefactControllerSpy.generateAllFilesExt).toHaveBeenCalled();
    		//check, that generated fields are created
            var metaData = jasmine.dbConnection.executeQuery(
		        'select count(*) as count from "sap.plc.db::basis.t_metadata" where ref_uom_currency_column_id = \'CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT\'');
    		expect(parseInt(metaData[0].COUNT)).toBeGreaterThan(0);
    		metaData = jasmine.dbConnection.executeQuery(
    		    'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes" where column_id = \'CUST_BOOLEAN_INT\'');
    		expect(parseInt(metaData[0].COUNT)).toBeGreaterThan(0);
    	});

    	it("should generate custom fields for a scenario if a generate parameter has been passed", function() {
    		// Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "formula-performance"
            }]);
    		var oRequest = prepareRequest(params);
    		//clear metadata tables, to be able to check new entries
    		cleanMetaDataTables();

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setup();

    		// Assert
    		expect(DbArtefactControllerSpy.generateAllFilesExt).toHaveBeenCalled();
    	});

    	it("should generate a clear, cff-free setup if the generate parameter is set to 'clear' ",function(){
    	    // Arrange
    		var params = createParamsObject([{
                "name": "generate",
                "value": "clear"
            }]);
    		var oRequest = prepareRequest(params);

    		//insert a custom field that should cleared during tests
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');

    			// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setup();

    		// Assert
    		expect(DbArtefactControllerSpy.generateAllFilesExt.calls.count()).toBe(1);
    		expect(parseInt(jasmine.dbConnection.executeQuery('select count(*) as count from "sap.plc.db::basis.t_metadata" where is_custom = 1')[0].COUNT,10)).toEqual(0);
			expect(fixIsManual.run).not.toHaveBeenCalled(); // no need to fix IS_MANUAL fields if no custom fields are there
			expect(fixBooleanManualForItem.run).not.toHaveBeenCalled();
			expect(fixBooleanManualForMd.run).not.toHaveBeenCalled();
			expect(fixUnit.run).not.toHaveBeenCalled();
    	});

        it("should NOT generate custom fields for a scenario if an invalid generate parameter has been passed", function() {
    		// Arrange
			var params = createParamsObject([{
                "name": "generate",
                "value": "somethingInvalid"
            }]);
    		var oRequest = prepareRequest(params);
    		//clear metadata tables, to be able to check new entries
    		cleanMetaDataTables();

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setup();

    		// Assert
    		expect(DbArtefactControllerSpy.generateAllFilesExt).not.toHaveBeenCalled();
    	 });

        it("should store original metadata in helper tables", function() {
    		// Arrange
    		var oRequest = prepareRequest({});

    		//insert a custom field that should be saved in the helper tables
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
    		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');

    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,DbArtefactControllerSpy, jasmine.dbConnection);
    		testrunner.setup();
    		// Assert

    		expect(DbArtefactControllerSpy.generateAllFilesExt).toHaveBeenCalled();
    		//check, that original data has been stored in helper tables
            var metaData = jasmine.dbConnection.executeQuery(
		        'select count(*) as count from "sap.plc.db::basis.t_metadata"');
    		expect(parseInt(metaData[0].COUNT)).toBeGreaterThan(0);
    		metaData = jasmine.dbConnection.executeQuery(
    		    'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"');
    		expect(parseInt(metaData[0].COUNT)).toBeGreaterThan(0);
    	});
	});
}).addTags(["All_Unit_Tests"]);