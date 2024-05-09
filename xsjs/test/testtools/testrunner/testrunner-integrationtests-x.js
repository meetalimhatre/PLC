var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var plcTestrunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
var xsTestrunner = $.import("sap.hana.testtools.unit.jasminexs", "jasminexsRunner");
var DbArtefactController = require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

describe("testrunner-integrationtests", function() {
	
	var oDefaultResponseMock;
	var sItemExt = 'sap.plc.db::basis.t_item_ext';
	var oController;
	var realCommit;
	
	beforeOnce(function(){
	    realCommit = jasmine.dbConnection.commit;
	    jasmine.dbConnection.setAutoCommit(false);
	});
	
	afterOnce(function(){
	    jasmine.dbConnection.commit = realCommit; 
	});
	
    function cleanup(){
        var cleanUpController = new DbArtefactController($, jasmine.dbConnection);
        //clean custom fields from metadata + regenerate
        var sTruncateMetadataSQL ='delete from "sap.plc.db::basis.t_metadata" where is_custom = 1';
        var sTruncateMetadataItemAttributesSQL='delete from "sap.plc.db::basis.t_metadata_item_attributes"  where exists '+
    	'(SELECT attr.*  '+
    	'FROM "sap.plc.db::basis.t_metadata_item_attributes" as attr  '+
    	'left outer join "sap.plc.db::basis.t_metadata" as meta on  '+
    	'attr.column_id = meta.column_id and '+
    	'attr.path = meta.path and '+
    	'attr.business_object = meta.business_object '+
    	'where meta.is_custom = 1)'; 
    	var sTruncateMetadataTextSQL='delete from "sap.plc.db::basis.t_metadata__text"  where exists '+
    	'(SELECT attr.*  '+
    	'FROM "sap.plc.db::basis.t_metadata__text" as attr  '+
    	'left outer join "sap.plc.db::basis.t_metadata" as meta on  '+
    	'attr.column_id = meta.column_id and '+
    	'attr.path = meta.path '+
    	'where meta.is_custom = 1)'; 
            
        jasmine.dbConnection.executeUpdate(sTruncateMetadataItemAttributesSQL);
        jasmine.dbConnection.executeUpdate(sTruncateMetadataTextSQL);
        jasmine.dbConnection.executeUpdate(sTruncateMetadataSQL);
        cleanUpController.createDeleteAndGenerate();
    }
    
    beforeEach(function() {
        cleanup();
        oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
        jasmine.dbConnection.commit = function(){
            //do nothing
            jasmine.log("Fake Commit");
            return true;
        };
        oController = new DbArtefactController($, jasmine.dbConnection);
        
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
    describe("run", function(){
    	it("should set generate custom fields correctly if 'generate=true' were passed in the request URL", function() {
    		// Arrange
    		spyOn(xsTestrunner, 'run').and.returnValue("Tests ran");
    		var params = createParamsObject([{
                "name": "mode",
                "value": "cf"
            },{
                "name": "generate",
                "value": "yes"
            }]);
    		var oRequest = prepareRequest(params);		
    		var oExtensionColumnsBeforeTestRun = jasmine.dbConnection.executeQuery("select count(column_name) as COUNT from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='" +
    				sItemExt + "'");
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
            testrunner.run();
    		
    		// Assert
    		//parameters set correctly?
    		expect(jasmine.plcTestRunParameters.mode).toBe("cf");
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    		expect(xsTestrunner.run).toHaveBeenCalled();
    		//metadata restored correctly?
     		var oExtensionColumnsAfterTestRun = jasmine.dbConnection.executeQuery("select count(column_name) as COUNT from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='" +
    				sItemExt + "'");
    		expect(parseInt(oExtensionColumnsBeforeTestRun[0].COUNT,10)).toBe(parseInt(oExtensionColumnsAfterTestRun[0].COUNT,10)); 
    	});	
    	
    	it("should store the pre-test-metadata in temporary tables to restore it after running the tests", function() {
    		// Arrange
    		var metaDataBefore = jasmine.dbConnection.executeQuery(
        		    'select count(*) as COUNT from "sap.plc.db::basis.t_metadata"');
    	    var metaDataItemAttributesBefore = jasmine.dbConnection.executeQuery(
    	    'select count(*) as COUNT from "sap.plc.db::basis.t_metadata_item_attributes"');
    		
    		spyOn(xsTestrunner, 'run').and.callFake(function() {
                //check, that generated fields are in t_metadata
                var oExtensionColumnsDuring = jasmine.dbConnection.executeQuery('select count(*) as COUNT from "sap.plc.db::basis.t_metadata" where is_custom = 1');
        	    expect(parseInt(oExtensionColumnsDuring[0].COUNT)).toBe(11);
            });
    		
    		var params = createParamsObject([{
                "name": "generate",
                "value": "yes"
            }]);
    		var oRequest = prepareRequest(params);		
    		
    		// Act
    		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
    		testrunner.run();
    		
    		// Assert
    		var metaData = jasmine.dbConnection.executeQuery(
        		    'select count(*) as COUNT from "SAP_PLC_TEST"."sap.plc_test.testtools.testrunner.db::basis.t_metadata"');
        	expect(parseInt(metaData[0].COUNT,10)).toBe(parseInt(metaDataBefore[0].COUNT,10));
        	var metaDataItemAttributes = jasmine.dbConnection.executeQuery(
        		    'select count(*) as COUNT from "SAP_PLC_TEST"."sap.plc_test.testtools.testrunner.db::basis.t_metadata_item_attributes"');
        	expect(parseInt(metaDataItemAttributes[0].COUNT,10)).toBe(parseInt(metaDataItemAttributesBefore[0].COUNT,10));
    	});
    });
    
    describe("prepare - cleanup", function(){
        
        var oReporterMock;

        beforeEach(function(){
            
            oReporterMock = jasmine.createSpyObj('oReporter',['prepareTestRun']);
            oReporterMock.prepareTestRun.and.returnValue("123");
            
            cleanup(); 
        });
        
        afterEach(function(){
            cleanup(); 
        });
    
        describe("prepare", function(){
            
            
            
            it("should generate custom fields if generate parameter is set to 'true'", function() {
        		// Arrange
        		var params = createParamsObject([{
                    "name": "generate",
                    "value": "yes"
                }]);
        		var oRequest = prepareRequest(params);		
        		
        		// Act
        		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
                testrunner.prepare(oReporterMock);
        		
        		// Assert
        		var oExtensionColumnsAfterPrepare = jasmine.dbConnection.executeQuery("select count(column_name) as COUNT from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='" +
        				sItemExt + "'");
        		expect(parseInt(oExtensionColumnsAfterPrepare[0].COUNT,10)).toBe(38); 
        	});	
        	
        	it("should NOT generate custom fields and store original metadata in temporary tables if generate parameter is not set", function() {
        		// Arrange
        		var params = createParamsObject([]);
        		var oRequest = prepareRequest(params);		
        		oController.createDeleteAndGenerate();
        		
        		// Act
        		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
                testrunner.prepare(oReporterMock);
        		
        		// Assert
        		var oExtensionColumnsAfterPrepare = jasmine.dbConnection.executeQuery("select count(column_name) as COUNT from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='" +
        				sItemExt + "'");
                //should only be "calcualtion_version_id" and "item_id"
        		expect(parseInt(oExtensionColumnsAfterPrepare[0].COUNT,10)).toBe(2); 
        	});	
        	
        	it("should store original metadata in temporary tables", function() {
        		// Arrange
        		var params = createParamsObject([{
                    "name": "mode",
                    "value": "cf"
                },{
                    "name": "generate",
                    "value": "yes"
                }]);
        		var oRequest = prepareRequest(params);		
        		
        		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
    	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
        		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
    	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');
        		
        		// Act
        		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
                testrunner.prepare(oReporterMock);
        		
        		// Assert
        		//metadata stored correctly?
         		var metaData = jasmine.dbConnection.executeQuery(
    		        'select count(*) as count from "SAP_PLC_TEST"."sap.plc_test.testtools.testrunner.db::basis.t_metadata"');
        		expect(parseInt(metaData[0].COUNT,10)).toBeGreaterThan(0);
        		metaData = jasmine.dbConnection.executeQuery(
        		    'select count(*) as count from "SAP_PLC_TEST"."sap.plc_test.testtools.testrunner.db::basis.t_metadata_item_attributes"');
        		expect(parseInt(metaData[0].COUNT,10)).toBeGreaterThan(0);
        	});	
        	
        });
        
        describe("cleanup", function(){
            
            it("should clean up generated custom fields", function() {
        		// Arrange
        		var params = createParamsObject([{
                    "name": "generate",
                    "value": "yes"
                }]);
        		var oRequest = prepareRequest(params);	
        		
        		var metaDataBefore = jasmine.dbConnection.executeQuery('select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"  as attr inner join "sap.plc.db::basis.t_metadata" as meta '+
        		    'on attr.PATH = meta.PATH and attr.COLUMN_ID = meta.COLUMN_ID and attr.BUSINESS_OBJECT=meta.BUSINESS_OBJECT');
        		
        		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
        		//generate custom fields
        		testrunner.prepare(oReporterMock);
        		
        		// Act
        		testrunner.cleanUp();
        		
        		// Assert
        		//check, that the old custom field has been restored
                var metaDataAfter = jasmine.dbConnection.executeQuery(
    		        'select count(*) as count from "sap.plc.db::basis.t_metadata"  where is_custom = 1');
        		expect(parseInt(metaDataAfter[0].COUNT,10)).toBe(0);
        		metaDataAfter = jasmine.dbConnection.executeQuery(
        		    'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"  as attr inner join "sap.plc.db::basis.t_metadata" as meta '+
        		    'on attr.PATH = meta.PATH and attr.COLUMN_ID = meta.COLUMN_ID and attr.BUSINESS_OBJECT=meta.BUSINESS_OBJECT');
        		expect(parseInt(metaDataAfter[0].COUNT,10)).toBe(parseInt(metaDataBefore[0].COUNT,10));
        	});
        	
        	 it("should regenerate the previously strored fields", function() {
        		// Arrange
        		var params = createParamsObject([{
                    "name": "generate",
                    "value": "yes"
                }]);
        		var oRequest = prepareRequest(params);	
        		//insert a custom field that should be saved in the helper tables
        		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata" (PATH,BUSINESS_OBJECT,COLUMN_ID,IS_CUSTOM,SEMANTIC_DATA_TYPE) '+
    	            'values (\'Item\',\'Item\',\'CUST_TEST\',1,\'Integer\');');
        		jasmine.dbConnection.executeUpdate('insert into "sap.plc.db::basis.t_metadata_item_attributes" (PATH,BUSINESS_OBJECT,COLUMN_ID,ITEM_CATEGORY_ID,SUBITEM_STATE) '+
    	            'values (\'Item\',\'Item\',\'CUST_TEST\',-1,-1);');
    	        var metaDataBefore = jasmine.dbConnection.executeQuery('select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"  as attr inner join "sap.plc.db::basis.t_metadata" as meta '+
        		    'on attr.PATH = meta.PATH and attr.COLUMN_ID = meta.COLUMN_ID and attr.BUSINESS_OBJECT=meta.BUSINESS_OBJECT');
    	            
        		var testrunner = new plcTestrunner(oRequest,oDefaultResponseMock,oController, jasmine.dbConnection);
        		//generate custom fields
        		testrunner.prepare(oReporterMock);
        		
        		// Act
        		testrunner.cleanUp();
        		
        		// Assert
        		//check, that the old custom field has been restored
                var metaData = jasmine.dbConnection.executeQuery(
    		        'select count(*) as count from "sap.plc.db::basis.t_metadata"  where is_custom = 1');
        		expect(parseInt(metaData[0].COUNT,10)).toBe(1);
        		metaData = jasmine.dbConnection.executeQuery(
        		    'select count(*) as count from "sap.plc.db::basis.t_metadata_item_attributes"  as attr inner join "sap.plc.db::basis.t_metadata" as meta '+
        		    'on attr.PATH = meta.PATH and attr.COLUMN_ID = meta.COLUMN_ID and attr.BUSINESS_OBJECT=meta.BUSINESS_OBJECT');
        		expect(parseInt(metaData[0].COUNT,10)).toBe(parseInt(metaDataBefore[0].COUNT,10));
        	});
        });
    });
});
