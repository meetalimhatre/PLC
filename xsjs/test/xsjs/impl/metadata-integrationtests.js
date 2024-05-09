var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;
var PersistencyImport = $.import("xs.db", "persistency");
var metadataImport = require("../../../lib/xs/db/persistency-metadata");
var constants = require("../../../lib/xs/util/constants"); 
var ServiceMetaInformation  = require("../../../lib/xs/util/constants").ServiceMetaInformation;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var Metadata = require("../../../lib/xs/impl/metadata.js").Metadata;
var Task = require("../../../lib/xs/db/persistency-task").Task;

var oMockstar = null;
var oPersistency = null;
var oDefaultResponseMock = null;

function createSpyOnFieldMappingSequence(oPersistency) {
	startId = 1000;
	spyOn(oPersistency.Metadata.helper, 'getNextSequenceID').and.callFake(function() {
		startId += 1;
		return startId;
	});
}

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.metadata-integrationtests', function() {
		
		var oMetadataTestData = {
		        "PATH" :["Item", "Item", "Item", "Item"],
				"BUSINESS_OBJECT": ["Item", "Item", "Item", "Item"],
				"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST1", "CUST_FORMULA"],
				"SEMANTIC_DATA_TYPE": ["String","Integer", "Integer", "Integer"],
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": ["length=3",null, null, null],
				"REF_UOM_CURRENCY_COLUMN_ID": [null,"CUST_TEST_UNIT", null, null],
				"SIDE_PANEL_GROUP_ID" : [1,1, 1, 1],
				"ROLLUP_TYPE_ID" : [0,0, 0, 0],
				"REF_UOM_CURRENCY_PATH": [null,"Item", null, null],
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null,"Item", null, null],
				"UOM_CURRENCY_FLAG": [1,0, 0, 0],
				"IS_CUSTOM": [1, 1, 1, 1],
				"PROPERTY_TYPE": [3,1,1, 1],
			    "IS_USABLE_IN_FORMULA": [1, 1, 1, 1]
		};
		var oMetadataLanguage = {
		        "PATH" :"Language",
				"BUSINESS_OBJECT": "Language",
				"COLUMN_ID" : "TEXTS_MAINTAINABLE",
				"SEMANTIC_DATA_TYPE": "BooleanInt",
				"SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
				"REF_UOM_CURRENCY_COLUMN_ID": null,
				"SIDE_PANEL_GROUP_ID" : 1,
				"ROLLUP_TYPE_ID" : 0,
				"REF_UOM_CURRENCY_PATH": null,
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
				"UOM_CURRENCY_FLAG": 0,
				"IS_CUSTOM": 0,
				"PROPERTY_TYPE": 5
		};
		var oMetadataTextTestData = {
				"PATH" : ["Item", "Item", "Item", "Item", "Item", "Language" , "Item"],
				"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST", "CUST_TEST1", "TEXTS_MAINTAINABLE", "CUST_FORMULA"],
				"LANGUAGE" : ["EN", "DE", "EN", "DE", "EN", "EN", "EN"],
				"DISPLAY_NAME" : ["Testing Unit EN", "Testing Unit DE", "Testing EN", "Testing DE", "Testing EN", "Testing EN", "Testing EN"] 
		};
		var oMetaDataAttributesTestData = {
				"PATH" : ["Item", "Item", "Item", "Item", "Item", "Item", "Item"],
				"BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item", "Item"],
				"COLUMN_ID" : ["CUST_TEST_UNIT", "CUST_TEST_UNIT", "CUST_TEST", "CUST_TEST", "CUST_TEST1", "CUST_TEST1", "CUST_FORMULA"],
				"ITEM_CATEGORY_ID" : [1, 1, 1, 1, 1, 1, 1],
				"DEFAULT_VALUE": [1, 1, 1, 1, 1, 1, 1],
				"SUBITEM_STATE": [-1, -1, -1, -1, -1, -1, -1],
				"IS_READ_ONLY": [1,0, 1,0, 1,0,0] 
		};
		var oMetaDataFormulasTestData = {
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST",
				"ITEM_CATEGORY_ID" : 1,
				"FORMULA_ID" : 11,
				"IS_FORMULA_USED": 1,
				"FORMULA_STRING": "$CUST_TEST_ROLLUP_POSITIVE+1",
				"FORMULA_DESCRIPTION": "equals 2"
		};
		var oMetaDataCostingSheetRowFormulasTestData = {
				"FORMULA_ID" : 1,
				"FORMULA_STRING": "$CUST_FORMULA",
				"FORMULA_DESCRIPTION": "custom field used in formula"
		};
		var oLanguageTestData  = {
		        "LANGUAGE" : ["EN", "DE", "FR"],
				"TEXTS_MAINTAINABLE": [1, 1, 0],
				"_VALID_FROM": ["2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z"],
				"_SOURCE": [1,1,1],
                "_CREATED_BY": ["U000","U000","U000"]
		};
		var oMetadataTestDataCreatePersistencyRollupGreaterThen0 = {"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE",
				"SEMANTIC_DATA_TYPE": "Integer",
				"REF_UOM_CURRENCY_COLUMN_ID": "",
				"SIDE_PANEL_GROUP_ID" : 101,
				"ROLLUP_TYPE_ID" : 1,
				"REF_UOM_CURRENCY_PATH": "",
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
				"UOM_CURRENCY_FLAG": 0,
				"TEXT": [{
					"PATH" : "Item",
					"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE",
					"LANGUAGE" : "EN",
					"DISPLAY_NAME" : "Testing"},
					{"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE",
						"LANGUAGE" : "DE",
						"DISPLAY_NAME" : "Testing"}
					],
				"ATTRIBUTES": [{
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE",
					"ITEM_CATEGORY_ID" : 1,
					"DEFAULT_VALUE": 1
				}],
				"FORMULAS": [{
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE",
					"ITEM_CATEGORY_ID" : 1,
					"FORMULA_ID" : -1,
					"IS_FORMULA_USED": 1,
					"FORMULA_STRING": "1+1",
					"FORMULA_DESCRIPTION": "equals 2"
				}]};
		var oSchedulerLog  = {
					"RUN_ID" : ["111111"],
					"SCHED_NAME": ["schedulerFactoryBean"],
					"JOB_NAME": ["replication_job"],
					"JOB_GROUP": ["NO_TENANT"],
					"STATE": ["RUNNING"],
					"FIRED_TIME":['2020-12-20 08:23:00.338000000'],
					"FINISHED_TIME":[]
		};			
		function prepareGetRequest(sPath, sBusinessObject, sColumn, bIsCustom, bLock) {
	        // create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
	        var params = [{
	            "name": "path",
	            "value": sPath
	        },
	        {
	        	"name": "business_object",
	            "value": sBusinessObject
	        },
	        {
	        	"name": "column",
	            "value": sColumn
	        },
	        {
	        	"name": "is_custom",
	            "value": bIsCustom
	        },
	        {
	        	"name": "lock",
	            "value": bLock
	        }];
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
	            queryPath: "customfieldsformula",
	            method: $.net.http.GET,
	            parameters: params
	        };
	        return oRequest;
	    }
		
		function prepareBatchRequest(aMetadataCreate, aMetadataUpdate, aMetadataDelete, bCheckCanExecute) {
	        var params = [{
	            "name": "checkCanExecute",
	            "value": bCheckCanExecute
	        }];
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
	            queryPath: "customfieldsformula",
	            method: $.net.http.POST,
	            parameters: params,
	            body : {
					asString : function() {
						return JSON.stringify({
							"CREATE": aMetadataCreate,
							"UPDATE": aMetadataUpdate,
							"DELETE": aMetadataDelete
						});
					}
				}
	        };
	        return oRequest;
		}
		
		beforeOnce(function() {
			oMockstar = new MockstarFacade( // Initialize Mockstar
					{
						substituteTables:
						{
							metadata: metadataImport.Tables.metadata,
							metadataText: metadataImport.Tables.metadataText,
							metadataItemAttributes: metadataImport.Tables.metadataItemAttributes,
							formula: metadataImport.Tables.formula,
							language: {
            					name : "sap.plc.db::basis.t_language",
            					data : oLanguageTestData
            				},
							session : {
            					name : "sap.plc.db::basis.t_session",
            					data : testData.oSessionTestData
            				},
							costingSheetOverheadRowFormula : {
								name : Resources["Costing_Sheet_Overhead_Row_Formula"].dbobjects.plcTable,
								data : oMetaDataCostingSheetRowFormulasTestData
							},
							application_timeout : "sap.plc.db::basis.t_application_timeout",
							lock : "sap.plc.db::basis.t_lock",
							itemExt: metadataImport.Tables.itemExSHeetOverheadt,
							item: metadataImport.Tables.item,
							field_mapping: metadataImport.Tables.field_mapping,
							task: "sap.plc.db::basis.t_task",
							costingSheetOverheadRow : {
								name : "sap.plc.db::basis.t_costing_sheet_overhead_row",
								data : testData.oCostingSheetOverheadRowTestData
							},
							schedulerLog: "sap.plc.db::map.t_scheduler_log"
						}
					});
		});
	
		afterOnce(function() {
			oMockstar.cleanup();
		});
	
		beforeEach(function(){
			oMockstar.clearAllTables();
			oMockstar.initializeData();
	
			oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
            
			spyOn(oPersistency.Metadata, "createDeleteAndGenerate");
			spyOn(oPersistency.Metadata, "updateIsManualField");
			spyOn(oPersistency.Metadata, "updateUnitField");
			spyOn(oPersistency.Metadata, "updateManualField");
			spyOn(oPersistency.Metadata, "copyItemsToItemExt");
			spyOn(oPersistency.Metadata, "setTransactionAutocommitDDLOff");
			spyOn(oPersistency.Metadata, "updateFieldWithDefaultValue");
			spyOn(oPersistency.Metadata, "generateAllFiles");
			spyOn(oPersistency.Task, "cancelTasksWithStatusAndLastUpdatedOlderThan");
			oPersistency.Metadata.createDeleteAndGenerate.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.updateManualField.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.updateIsManualField.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.updateUnitField.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.copyItemsToItemExt.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.setTransactionAutocommitDDLOff.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.updateFieldWithDefaultValue.and.callFake(function() {
				return true;
			});
			oPersistency.Metadata.generateAllFiles.and.callFake(function() {
				return true;
			});
			oPersistency.Task.cancelTasksWithStatusAndLastUpdatedOlderThan.and.callFake(function() {
				let oTask = new Task(jasmine.dbConnection);
				oTask.cancelTasksWithStatusAndLastUpdatedOlderThan(constants.TaskStatus.INACTIVE, constants.TaskType.METADATA_CUSTOM_FIELDS, 30);
			});
			oCtx.persistency = oPersistency;
		});
		
		describe('get', function() {
		    
		    var iItemCategoryCount = Object.keys(constants.ItemCategory).length;
		    //there is 1 case that could occur: SUBITEM_STATE == -1; no default values
		    var iItemAttributesCount = iItemCategoryCount * 2;
		    
			beforeEach(function() {
				oMockstar.clearAllTables(); 
				oMockstar.insertTableData("metadata", testData.oMetadataTestData);
				oMockstar.insertTableData("metadata", oMetadataLanguage);
				oMockstar.insertTableData("metadataText", testData.oMetaTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", testData.oMetaAttributesTestData);
				oMockstar.insertTableData("formula", testData.oMetaFormulasTestData);
				
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oMockstar.insertTableData("application_timeout", testData.oApplicationTimeout);
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});
				
			it('should return 200 OK for a valid request with is_custom parameter set to true', function() {
				// arrange
				var oRequest = prepareGetRequest(null, null, null, true);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//check if response contains metadata with attributes, formulas and texts
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(_.isObject(oResponseObject.body.METADATA)).toBe(true);
				expect(oResponseObject.body.METADATA.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES).toBeDefined();
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES.length).toEqual(iItemAttributesCount);
				expect(oResponseObject.body.METADATA[0].FORMULAS).toBeDefined();
				expect(oResponseObject.body.METADATA[0].FORMULAS.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].TEXT).toBeDefined();
				expect(oResponseObject.body.METADATA[0].TEXT.length).toEqual(1);
			});
			
			it('should return 200 OK for a valid request with path: Item, business_object:Item and is_custom parameter set to true', function() {
				// arrange
				var oRequest = prepareGetRequest('Item', 'Item', null, true);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//check if response contains metadata with attributes, formulas and texts
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(_.isObject(oResponseObject.body.METADATA)).toBe(true);
				expect(oResponseObject.body.METADATA.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES).toBeDefined();
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES.length).toEqual(iItemAttributesCount);
				expect(oResponseObject.body.METADATA[0].FORMULAS).toBeDefined();
				expect(oResponseObject.body.METADATA[0].FORMULAS.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].TEXT).toBeDefined();
				expect(oResponseObject.body.METADATA[0].TEXT.length).toEqual(1);
			});
			
			it('should return 200 OK for a valid request with path: Item, business_object:Item, column_id:CUST_TEST and is_custom parameter set to true', function() {
				// arrange
				var oRequest = prepareGetRequest(null, null, null, true);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//check if response contains metadata with attributes, formulas and texts
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(_.isObject(oResponseObject.body.METADATA)).toBe(true);
				expect(oResponseObject.body.METADATA.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES).toBeDefined();
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES.length).toEqual(iItemAttributesCount);
				expect(oResponseObject.body.METADATA[0].FORMULAS).toBeDefined();
				expect(oResponseObject.body.METADATA[0].FORMULAS.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].TEXT).toBeDefined();
				expect(oResponseObject.body.METADATA[0].TEXT.length).toEqual(1);
			});
			
			it('should return 200 OK with valid metadata, attributes, formulas and texts when valid request is made', function() {
				// arrange
				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, null);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				var aResult = oPersistency.Metadata.getMetadataFields(sPath, sBusinessObject, sColumnId);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//check if response contains metadata with attributes, formulas and texts
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(_.isObject(oResponseObject.body.METADATA)).toBe(true);
				expect(oResponseObject.body.METADATA.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES).toBeDefined();
				expect(oResponseObject.body.METADATA[0].ATTRIBUTES.length).toEqual(iItemAttributesCount);
				expect(oResponseObject.body.METADATA[0].FORMULAS).toBeDefined();
				expect(oResponseObject.body.METADATA[0].FORMULAS.length).toEqual(1);
				expect(oResponseObject.body.METADATA[0].TEXT).toBeDefined();
				expect(oResponseObject.body.METADATA[0].TEXT.length).toEqual(1);
				
			});
			
			it('should not be able to lock when other users are in the system and return active users and lock = 1', function() {
				// arrange
				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				var oTimeout = oMockstar.execQuery("select TO_DOUBLE(VALUE_IN_SECONDS) as VALUE_IN_SECONDS from {{application_timeout}}");
				var oActiveUsers = oMockstar.execQuery("select TO_DOUBLE(count(*)) as ACTIVE_USERS from {{session}}");	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            expect(oActiveUsers.columns.ACTIVE_USERS.rows[0]).toBeGreaterThan(1);
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// check that lock was not set and users locking the system besides current user exists
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).not.toBe(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].LANGUAGE).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).toBeLessThan(oTimeout.columns.VALUE_IN_SECONDS.rows[0]);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].USER_ID).not.toBe(null);
			});

			it('should not be able to lock when other users are in the system and mdr tool is running and return active users, active jobs and lock = 1', function() {
				// arrange
				oMockstar.insertTableData("schedulerLog", oSchedulerLog);

				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				var oTimeout = oMockstar.execQuery("select TO_DOUBLE(VALUE_IN_SECONDS) as VALUE_IN_SECONDS from {{application_timeout}}");
				var oActiveUsers = oMockstar.execQuery("select TO_DOUBLE(count(*)) as ACTIVE_USERS from {{session}}");	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            expect(oActiveUsers.columns.ACTIVE_USERS.rows[0]).toBeGreaterThan(1);
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// check that lock was not set and users locking the system besides current user exists
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).not.toBe(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].LANGUAGE).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).toBeLessThan(oTimeout.columns.VALUE_IN_SECONDS.rows[0]);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].USER_ID).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_JOBS[0].JOB_NAME).toBe("replication_job");
			});

			it('should not be able to lock when other users are in the system and return active users, active jobs and lock = 1', function() {
				// arrange
				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				var oTimeout = oMockstar.execQuery("select TO_DOUBLE(VALUE_IN_SECONDS) as VALUE_IN_SECONDS from {{application_timeout}}");
				var oActiveUsers = oMockstar.execQuery("select TO_DOUBLE(count(*)) as ACTIVE_USERS from {{session}}");	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            expect(oActiveUsers.columns.ACTIVE_USERS.rows[0]).toBeGreaterThan(1);
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// check that lock was not set and users locking the system besides current user exists
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).not.toBe(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].LANGUAGE).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].SECONDS_BETWEEN).toBeLessThan(oTimeout.columns.VALUE_IN_SECONDS.rows[0]);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].USER_ID).not.toBe(null);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_JOBS.length).toBe(0);
			});

			it('should not be able to lock when mdr tool is running and return active jobs and lock = 1', function() {
				// arrange
				var sDate = new Date().toJSON();
				var sSessionId = $.session.getUsername();
				oMockstar.insertTableData("schedulerLog", oSchedulerLog);
				var oSessionTestData = {
					"SESSION_ID" : [ sSessionId ],
					"USER_ID" : [ sSessionId ],
					"LANGUAGE" : [ "DE" ],
					"LAST_ACTIVITY_TIME" : [ sDate ]
					};				
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oSessionTestData );
				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				var oTimeout = oMockstar.execQuery("select TO_DOUBLE(VALUE_IN_SECONDS) as VALUE_IN_SECONDS from {{application_timeout}}");
				var oActiveUsers = oMockstar.execQuery("select TO_DOUBLE(count(*)) as ACTIVE_USERS from {{session}}");	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            expect(oActiveUsers.columns.ACTIVE_USERS.rows[0]).toBe(1);
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// check that lock was not set and users locking the system besides current user exists
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).toBe(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_JOBS.length).not.toBe(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_JOBS[0].JOB_NAME).toBe("replication_job");
			});
			
			it('should be able to lock when only current users is in the system and mdr tool is not running and create an entry in the lock table', function() {
				// arrange
				var sDate = new Date().toJSON();
				var sSessionId = $.session.getUsername();

				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				// Lock for current user
				var oSessionTestData = {
                                    	"SESSION_ID" : [ sSessionId ],
                                    	"USER_ID" : [ sSessionId ],
                                    	"LANGUAGE" : [ "DE" ],
                                        "LAST_ACTIVITY_TIME" : [ sDate ]
                                        };				
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oSessionTestData );
				var oActiveUsers = oMockstar.execQuery("select TO_DOUBLE(count(*)) as ACTIVE_USERS from {{session}}");	
				var oMetadataLock = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{lock}}");	
				var oTaskObject = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{task}}");	
	            
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
				// assert
				expect(oMetadataLock.columns.ROWCOUNT.rows[0]).toBe(0);
				expect(oTaskObject.columns.ROWCOUNT.rows[0]).toBe(0);
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            expect(oActiveUsers.columns.ACTIVE_USERS.rows[0]).toBe(1);

				// Check that there is now an enter in the lock table.
				oMetadataLock = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{lock}}");	
	            expect(oMetadataLock.columns.ROWCOUNT.rows[0]).toBe(1);
			});
			
			it('should be able to lock when other users are in the system, but are inactive and return lock = 0', function() {
				// arrange
				var sDate = new Date().toJSON();
				var sSecondDate = "2017-06-08 13:00:00.2340000";
				var sSessionId = $.session.getUsername();
				var sSecondSessionId = "SecondTestUser";

				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				
				var oSessionTestData = {
                                    	"SESSION_ID" : [ sSessionId , sSecondSessionId],
                                    	"USER_ID" : [ sSessionId,  sSecondSessionId],
                                    	"LANGUAGE" : [ "DE",  "DE"],
                                        "LAST_ACTIVITY_TIME" : [ sDate,  sSecondDate]
                                        };				
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oSessionTestData );
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			    var oNewActiveUsers = oMockstar.execQuery("select * from {{session}}");
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// check that is able to lock and no other users are logged in the system besides current user
				expect(oNewActiveUsers.columns.USER_ID.rows.length).toBe(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(0);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).toBe(0);					
			});
			
			it('should not be able to lock when other users are active in the system and the current user is inactive, the current user will not be deleted', function() {
				// arrange
				var sDate = new Date().toJSON();
				var sSecondDate = "2017-06-08 13:00:00.2340000";
				var sSessionId = $.session.getUsername();
				var sSecondSessionId = "SecoundTestUser";

				var sPath = testData.oMetadataTestData.PATH;
				var sBusinessObject = testData.oMetadataTestData.BUSINESS_OBJECT;
				var sColumnId = testData.oMetadataTestData.COLUMN_ID;
				var oTimeout = oMockstar.execQuery("select TO_DOUBLE(VALUE_IN_SECONDS) as VALUE_IN_SECONDS from {{application_timeout}}");
				var oRequest = prepareGetRequest(sPath, sBusinessObject, sColumnId, true, true);
				
				var oSessionTestData = {
                                    	"SESSION_ID" : [ sSessionId , sSecondSessionId],
                                    	"USER_ID" : [ sSessionId,  sSecondSessionId],
                                    	"LANGUAGE" : [ "DE",  "DE"],
                                        "LAST_ACTIVITY_TIME" : [ sSecondDate, sDate]
                                        };				
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", oSessionTestData );
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	            
	            var oNewActiveUsers = oMockstar.execQuery("select SESSION_ID, USER_ID, LANGUAGE from {{session}}");
	            
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	            
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// check that lock was not set and users locking the system besides current user exists
				delete oSessionTestData.LAST_ACTIVITY_TIME; 
				expect(oNewActiveUsers).toMatchData(oSessionTestData,['SESSION_ID']);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).toBe(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS[0].USER_ID).toBe(sSecondSessionId);
			});

			it('should set existing tasks to CANCELLED which are currently in Status INACTIVE and Last_Updated_on more than 30 minutes ago', function() {
				// arrange
				var oRequest = prepareGetRequest(null, null, null, true);

				let oDateTime = new Date();
				let oDateTimeLess25Minutes = new Date(Date.now() - 1000 * (60 * 25));
				let oDateTimeLess35Minutes = new Date(Date.now() - 1000 * (60 * 35));
				let oDateTimeLess1Day = new Date(Date.now() - 1000 * (60 * 1440));
				
				var oTaskData = [{
					"TASK_ID" : 1,
					"SESSION_ID" : $.session.getUsername(),
					"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
					"STATUS" : 'INACTIVE',
					"PARAMETERS" : null,
					"PROGRESS_STEP" : 0,
					"PROGRESS_TOTAL" : 4,
					"CREATED_ON" : oDateTime,
					"STARTED" : null,
					"LAST_UPDATED_ON" : oDateTime,
					"ERROR_CODE" : null,
					"ERROR_DETAILS" : null
				},{
					"TASK_ID" : 2,
					"SESSION_ID" : $.session.getUsername(),
					"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
					"STATUS" : 'INACTIVE',
					"PARAMETERS" : null,
					"PROGRESS_STEP" : 0,
					"PROGRESS_TOTAL" : 4,
					"CREATED_ON" : oDateTimeLess25Minutes,
					"STARTED" : null,
					"LAST_UPDATED_ON" : oDateTimeLess25Minutes,
					"ERROR_CODE" : null,
					"ERROR_DETAILS" : null
				},{
					"TASK_ID" : 3,
					"SESSION_ID" : $.session.getUsername(),
					"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
					"STATUS" : 'INACTIVE',
					"PARAMETERS" : null,
					"PROGRESS_STEP" : 0,
					"PROGRESS_TOTAL" : 4,
					"CREATED_ON" : oDateTimeLess35Minutes,
					"STARTED" : null,
					"LAST_UPDATED_ON" : oDateTimeLess35Minutes,
					"ERROR_CODE" : null,
					"ERROR_DETAILS" : null
				},{
					"TASK_ID" : 4,
					"SESSION_ID" : $.session.getUsername(),
					"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
					"STATUS" : 'INACTIVE',
					"PARAMETERS" : null,
					"PROGRESS_STEP" : 0,
					"PROGRESS_TOTAL" : 4,
					"CREATED_ON" : oDateTimeLess1Day,
					"STARTED" : null,
					"LAST_UPDATED_ON" : oDateTimeLess1Day,
					"ERROR_CODE" : null,
					"ERROR_DETAILS" : null
				}];

				oMockstar.insertTableData("task", oTaskData);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);


				var oInactiveTaskOne = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 1");
				var oInactiveTaskTwo = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 2");
				var oCanceledTaskThree = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 3");
				var oCanceledTaskFour = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 4");
				
				//check if response contains metadata with attributes, formulas and texts
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(_.isObject(oResponseObject.body.METADATA)).toBe(true);
				expect(oInactiveTaskOne.columns.LAST_UPDATED_ON.rows[0]).toEqual(oDateTime);
				expect(oInactiveTaskOne.columns.STATUS.rows[0]).toEqual("INACTIVE");
				expect(oInactiveTaskTwo.columns.LAST_UPDATED_ON.rows[0]).toEqual(oDateTimeLess25Minutes);
				expect(oInactiveTaskTwo.columns.STATUS.rows[0]).toEqual("INACTIVE");
				expect(oCanceledTaskThree.columns.LAST_UPDATED_ON.rows[0]).toEqual(oDateTimeLess35Minutes);
				expect(oCanceledTaskThree.columns.STATUS.rows[0]).toEqual("CANCELED");
				expect(oCanceledTaskFour.columns.LAST_UPDATED_ON.rows[0]).toEqual(oDateTimeLess1Day);
				expect(oCanceledTaskFour.columns.STATUS.rows[0]).toEqual("CANCELED");
			});
		});
		
		describe('batchopperation create', function() {
		    var sDate = new Date().toJSON();
			var sSessionId = $.session.getUsername();
            var oSessionTestData = {
                                    	"SESSION_ID" : [ sSessionId ],
                                    	"USER_ID" : [ sSessionId ],
                                    	"LANGUAGE" : [ "DE" ],
                                        "LAST_ACTIVITY_TIME" : [ sDate ]
                                    };	
		    
			beforeEach(function() {
			    oMockstar.clearAllTables(); 
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadata", oMetadataLanguage);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("language", oLanguageTestData);
                oMockstar.insertTableData("session", oSessionTestData);
                oMockstar.insertTableData("application_timeout", testData.oApplicationTimeout);
                oMockstar.insertTableData("task", {});
                
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp"]);

				oConnectionFactoryMock = jasmine.createSpyObj("oConnectionFactoryMock", [ "getConnection", "commit" ]);
				oConnectionFactoryMock.getConnection.and.returnValue(jasmine.dbConnection);

				oDefaultResponseMock.followUp.and.callFake(function(oFollowUp){
					var oMetadata = new Metadata($);
					oMetadata.batchCreateUpdateDelete(oFollowUp.parameter.TASK_ID, oFollowUp.parameter.A_BODY_META, oFollowUp.parameter.PARAMETERS, oPersistency, oConnectionFactoryMock);
				});

				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});

			var oMetadataCreate = [{
				"SIDE_PANEL_GROUP_ID": 101,
				"ATTRIBUTES": [{
					"ITEM_CATEGORY_ID": 2,
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST_FORMULA",
					"PATH": "Item"
				}, {
					"ITEM_CATEGORY_ID": 3,
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST_FORMULA",
					"PATH": "Item"
				}],
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
				"REF_UOM_CURRENCY_COLUMN_ID": "",
				"REF_UOM_CURRENCY_PATH": "",
				"ROLLUP_TYPE_ID": 0,
				"SEMANTIC_DATA_TYPE": "Decimal",
				"UOM_CURRENCY_FLAG": 0,
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID": "CUST_TEST_FORMULA",
				"PATH": "Item"
			}, {
				"SIDE_PANEL_GROUP_ID": 101,
				"ATTRIBUTES": [{
					"ITEM_CATEGORY_ID": 2,
					"DEFAULT_VALUE": "0",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST_FORMULA_CHECKBOX",
					"PATH": "Item"
				}],
				"REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
				"REF_UOM_CURRENCY_COLUMN_ID": "",
				"REF_UOM_CURRENCY_PATH": "",
				"ROLLUP_TYPE_ID": 0,
				"SEMANTIC_DATA_TYPE": "BooleanInt",
				"UOM_CURRENCY_FLAG": 0,
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID": "CUST_TEST_FORMULA_CHECKBOX",
				"PATH": "Item"
			}];
			
			var oMetadataTestDataCreateUnitPersistency =
			{"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
			"SEMANTIC_DATA_TYPE": "String",
			"SIDE_PANEL_GROUP_ID" : 101,
			"ROLLUP_TYPE_ID" : 0,
			"UOM_CURRENCY_FLAG" : 1,
			"PROPERTY_TYPE": 6,
			"TEXT": [{
				"PATH" : "Item",
				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
				"LANGUAGE" : "EN",
				"DISPLAY_NAME" : "Testing"},
				{"PATH" : "Item",
					"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
					"LANGUAGE" : "DE",
					"DISPLAY_NAME" : "Testing"}
				],
			"ATTRIBUTES": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
				"ITEM_CATEGORY_ID" : 1,
				"DEFAULT_VALUE": "CM"
			}]};
			
			var oMetadataTestDataCreatePersistency = {"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_CREATE_TEST",
			"SEMANTIC_DATA_TYPE": "Integer",
			"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_CREATE_UNIT",
			"SIDE_PANEL_GROUP_ID" : 101,
			"ROLLUP_TYPE_ID" : 0,
			"REF_UOM_CURRENCY_PATH": "Item",
			"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
			"UOM_CURRENCY_FLAG": 0,
			"TEXT": [{
				"PATH" : "Item",
				"COLUMN_ID" : "CUST_CREATE_TEST",
				"LANGUAGE" : "EN",
				"DISPLAY_NAME" : "Testing"},
				{"PATH" : "Item",
					"COLUMN_ID" : "CUST_CREATE_TEST",
					"LANGUAGE" : "DE",
					"DISPLAY_NAME" : "Testing"}
				],
			"ATTRIBUTES": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_CREATE_TEST",
				"ITEM_CATEGORY_ID" : 1,
				"DEFAULT_VALUE": 1
			}],
			"FORMULAS": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_CREATE_TEST",
				"ITEM_CATEGORY_ID" : 1,
				"FORMULA_ID" : -1,
				"IS_FORMULA_USED": 1,
				"FORMULA_STRING": "1+1",
				"FORMULA_DESCRIPTION": "equals 2"
			}]};
		
			var oMetadataTestDataCreateUnitPersistencyAlreadyExists =
			{"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_TEST_UNIT",
			"SEMANTIC_DATA_TYPE": "String",
			"SIDE_PANEL_GROUP_ID" : 101,
			"ROLLUP_TYPE_ID" : 0,
			"UOM_CURRENCY_FLAG" : 1,
			"PROPERTY_TYPE": 6,
			"TEXT": [{
				"PATH" : "Item",
				"COLUMN_ID" : "CUST_TEST_UNIT",
				"LANGUAGE" : "EN",
				"DISPLAY_NAME" : "Testing"},
				{"PATH" : "Item",
					"COLUMN_ID" : "CUST_TEST_UNIT",
					"LANGUAGE" : "DE",
					"DISPLAY_NAME" : "Testing"}
				],
			"ATTRIBUTES": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_UNIT",
				"ITEM_CATEGORY_ID" : 1,
				"DEFAULT_VALUE": "CM"
			}]};
			
			var oMetadataTestDataCreatePersistencyAlreadyExists = {"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_TEST",
			"SEMANTIC_DATA_TYPE": "Integer",
			"REF_UOM_CURRENCY_COLUMN_ID": "CUST_TEST_UNIT",
			"SIDE_PANEL_GROUP_ID" : 101,
			"ROLLUP_TYPE_ID" : 0,
			"REF_UOM_CURRENCY_PATH": "Item",
			"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Item",
			"UOM_CURRENCY_FLAG": 0,
			"TEXT": [{
				"PATH" : "Item",
				"COLUMN_ID" : "CUST_TEST",
				"LANGUAGE" : "EN",
				"DISPLAY_NAME" : "Testing"},
				{"PATH" : "Item",
					"COLUMN_ID" : "CUST_TEST",
					"LANGUAGE" : "DE",
					"DISPLAY_NAME" : "Testing"}
				],
			"ATTRIBUTES": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST",
				"ITEM_CATEGORY_ID" : 1,
				"DEFAULT_VALUE": 1
			}],
			"FORMULAS": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST",
				"ITEM_CATEGORY_ID" : 1,
				"FORMULA_ID" : -1,
				"IS_FORMULA_USED": 1,
				"FORMULA_STRING": "1+1",
				"FORMULA_DESCRIPTION": "equals 2"
			}]};
			
			var oMetadataTestDataCreateErrorsInFormulaPersistency = {"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_CREATE_TEST",
					"SEMANTIC_DATA_TYPE": "Integer",
					"REF_UOM_CURRENCY_COLUMN_ID": "",
					"SIDE_PANEL_GROUP_ID" : 101,
					"ROLLUP_TYPE_ID" : 0,
					"REF_UOM_CURRENCY_PATH": "",
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": "",
					"UOM_CURRENCY_FLAG": 0,
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_CREATE_TEST",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing"},
						{"PATH" : "Item",
							"COLUMN_ID" : "CUST_CREATE_TEST",
							"LANGUAGE" : "DE",
							"DISPLAY_NAME" : "Testing"}
						],
					"ATTRIBUTES": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_CREATE_TEST",
						"ITEM_CATEGORY_ID" : 1,
						"DEFAULT_VALUE": 1
					}],
					"FORMULAS": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_CREATE_TEST",
						"ITEM_CATEGORY_ID" : 1,
						"FORMULA_ID" : -1,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "$CUST_NAME_WILL_NEVER_EXISTS_1+1",
						"FORMULA_DESCRIPTION": "equals 2"
					}]};
			
			var oMetaMaterialTestDataCreateUnit = {
					PATH : "Material",
					BUSINESS_OBJECT : "Material",
					COLUMN_ID : "CMAT_TEST123_UNIT",
					ROLLUP_TYPE_ID : 0,
					SIDE_PANEL_GROUP_ID : 501,
					REF_UOM_CURRENCY_PATH : "null",
					REF_UOM_CURRENCY_BUSINESS_OBJECT : "null",
					REF_UOM_CURRENCY_COLUMN_ID : null,
					UOM_CURRENCY_FLAG : 1,
					SEMANTIC_DATA_TYPE : "String",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "length=3",
					PROPERTY_TYPE: 7,
					TEXT : [],
					ATTRIBUTES : [ {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123_UNIT",
						ITEM_CATEGORY_ID : -1,
						IS_MANDATORY : 1,
						IS_READ_ONLY : 1,
					}],
					FORMULAS : []
			};
			
			var oMetaMaterialTestDataCreate = {
					PATH : "Material",
					BUSINESS_OBJECT : "Material",
					COLUMN_ID : "CMAT_TEST123",
					ROLLUP_TYPE_ID : 0,
					SIDE_PANEL_GROUP_ID : 501,
					REF_UOM_CURRENCY_PATH : "Material",
					REF_UOM_CURRENCY_BUSINESS_OBJECT : "Material",
					REF_UOM_CURRENCY_COLUMN_ID : "CMAT_TEST123_UNIT",
					UOM_CURRENCY_FLAG : 0,
					SEMANTIC_DATA_TYPE : "Decimal",
					SEMANTIC_DATA_TYPE_ATTRIBUTES: "precision=20; scale=5",
					PROPERTY_TYPE: 3,
					TEXT : [],
					ATTRIBUTES : [ {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123",
						ITEM_CATEGORY_ID : -1,
						IS_MANDATORY : 1,
						IS_READ_ONLY : 1
					}],
					FORMULAS : []
			};

			var oCreateBodyMeta = {
				CREATE:[
				   {
					  SIDE_PANEL_GROUP_ID:101,
					  ATTRIBUTES:[
						 {
							ITEM_CATEGORY_ID:2,
							BUSINESS_OBJECT:"Item",
							COLUMN_ID:"CUST_TEST_FORMULA",
							PATH:"Item"
						 },
						 {
							ITEM_CATEGORY_ID:3,
							BUSINESS_OBJECT:"Item",
							COLUMN_ID:"CUST_TEST_FORMULA",
							PATH:"Item"
						 }
					  ],
					  REF_UOM_CURRENCY_BUSINESS_OBJECT:"",
					  REF_UOM_CURRENCY_COLUMN_ID:"",
					  REF_UOM_CURRENCY_PATH:"",
					  ROLLUP_TYPE_ID:0,
					  SEMANTIC_DATA_TYPE:"Decimal",
					  UOM_CURRENCY_FLAG:0,
					  BUSINESS_OBJECT:"Item",
					  COLUMN_ID:"CUST_TEST_FORMULA",
					  PATH:"Item"
				   },
				   {
					  SIDE_PANEL_GROUP_ID:101,
					  ATTRIBUTES:[
						 {
							ITEM_CATEGORY_ID:2,
							DEFAULT_VALUE:"0",
							BUSINESS_OBJECT:"Item",
							COLUMN_ID:"CUST_TEST_FORMULA_CHECKBOX",
							PATH:"Item"
						 }
					  ],
					  REF_UOM_CURRENCY_BUSINESS_OBJECT:"",
					  REF_UOM_CURRENCY_COLUMN_ID:"",
					  REF_UOM_CURRENCY_PATH:"",
					  ROLLUP_TYPE_ID:0,
					  SEMANTIC_DATA_TYPE:"BooleanInt",
					  UOM_CURRENCY_FLAG:0,
					  BUSINESS_OBJECT:"Item",
					  COLUMN_ID:"CUST_TEST_FORMULA_CHECKBOX",
					  PATH:"Item"
				   }
				],
				UPDATE:[
				   
				],
				DELETE:[
				   
				]
			 };

			it('Should create metadata, create a task and update the task to completed when the metadata has been created', () => {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);

				
				var oRequest = prepareBatchRequest(oMetadataCreate, [], []);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oDefaultResponseMock.followUp).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toEqual(1);
				
				var oResultMasterdataCreationTask = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{task}} WHERE TASK_ID = " + oResponseObject.body.transactionaldata[0].TASK_ID + " AND STATUS = 'COMPLETED'");
				expect(parseInt(oResultMasterdataCreationTask.columns.ROWCOUNT.rows[0], 10)).toBe(1);
			});
			
			it('Should create metadata, create formula using a referenced field which is not valid for all item categories and expect error, update formula + referenced custom field again', () => {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest(oMetadataCreate, [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oDefaultResponseMock.followUp).toHaveBeenCalled();

				var oResponseSuccessfulCreateObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(_.isObject(oResponseSuccessfulCreateObject)).toBe(true);
				expect(_.isObject(oResponseSuccessfulCreateObject.body)).toBe(true);

				var oResponseSuccessfulCreateData = oResponseSuccessfulCreateObject.body.transactionaldata[0];
				expect(_.isFinite(oResponseSuccessfulCreateData.TASK_ID)).toBe(true);
				expect(oResponseSuccessfulCreateData.STATUS).toEqual('INACTIVE');
				expect(oResponseSuccessfulCreateData.TASK_TYPE).toEqual('METADATA_CUSTOM_FIELDS');

				var oResultSuccessfulCreate = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{task}} WHERE TASK_ID = " + oResponseSuccessfulCreateData.TASK_ID + " AND STATUS = 'COMPLETED'");
				expect(parseInt(oResultSuccessfulCreate.columns.ROWCOUNT.rows[0], 10)).toBe(1);

				//update the formula with an item cateogry which is not valid for referenced custom field
				var aMetadataFirstUpdate = [{
					"SIDE_PANEL_GROUP_ID": 101,
					"ATTRIBUTES": [{
						"ITEM_CATEGORY_ID": 2,
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA",
						"PATH": "Item"
					}, {
						"ITEM_CATEGORY_ID": 3,
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA",
						"PATH": "Item"
					}],
					"ROLLUP_TYPE_ID": 0,
					"UOM_CURRENCY_FLAG": 0,
					"FORMULAS": [{
						"FORMULA_ID": 0,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA",
						"ITEM_CATEGORY_ID": 2,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "$CUST_TEST_FORMULA_CHECKBOX + 1",
						"FORMULA_DESCRIPTION": ""
					}, {
						"FORMULA_ID": 0,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA",
						"ITEM_CATEGORY_ID": 3,
						"IS_FORMULA_USED": 1,
						"FORMULA_STRING": "$CUST_TEST_FORMULA_CHECKBOX + 1",
						"FORMULA_DESCRIPTION": ""
					}],
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST_FORMULA",
					"PATH": "Item"
				}];
				oRequest = prepareBatchRequest([], aMetadataFirstUpdate, []);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseFailedUpdate = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseFailedUpdate)).toBe(true);		

				var oResponseFailedUpdateData = oResponseFailedUpdate.body.transactionaldata[0];
				var oResultFailedUpdate = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseFailedUpdateData.TASK_ID);
				expect(oResultFailedUpdate.columns.ERROR_CODE.rows[0]).toEqual("BATCH_OPPERATION_ERROR");
				var oParsedErrorDetails = JSON.parse(oResultFailedUpdate.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails[0].code).toEqual("CALCULATIONENGINE_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_WARNING");
				expect(oResultFailedUpdate.columns.STATUS.rows[0]).toEqual('FAILED');


				// update the formula together with the referenced custom field
				var oMetadataSecondUpdate = {
					"SIDE_PANEL_GROUP_ID": 101,
					"ATTRIBUTES": [{
						"ITEM_CATEGORY_ID": 2,
						"DEFAULT_VALUE": "0",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA_CHECKBOX",
						"PATH": "Item"
					}, {
						"ITEM_CATEGORY_ID": 3,
						"DEFAULT_VALUE": "0",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST_FORMULA_CHECKBOX",
						"PATH": "Item"
					}],
					"ROLLUP_TYPE_ID": 0,
					"UOM_CURRENCY_FLAG": 0,
					"FORMULAS": [],
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST_FORMULA_CHECKBOX",
					"PATH": "Item"
				};
				aMetadataFirstUpdate[1] = aMetadataFirstUpdate[0];
				aMetadataFirstUpdate[0] = oMetadataSecondUpdate;
				oRequest = prepareBatchRequest([], aMetadataFirstUpdate, []);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseSuccessfulyUpdate = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseSuccessfulyUpdate)).toBe(true);
				expect(_.isObject(oResponseSuccessfulyUpdate.body)).toBe(true);
				expect(oResponseSuccessfulyUpdate.body.transactionaldata.length).toEqual(1);

				var oResponseSuccessfulUpdateData = oResponseSuccessfulyUpdate.body.transactionaldata[0];
				var oResultSuccessfulUpdate = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseSuccessfulUpdateData.TASK_ID);
				expect(oResultSuccessfulUpdate.columns.STATUS.rows[0]).toEqual('COMPLETED');
				expect(oResultSuccessfulUpdate.columns.TASK_TYPE.rows[0]).toEqual('METADATA_CUSTOM_FIELDS');
			});

					
			it('should return 200 and update the status of the task to completed when valid custom field with unit of measure attached is sent to be created', function() {		
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetadataTestDataCreateUnitPersistency, oMetadataTestDataCreatePersistency], [], []);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toEqual(1);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID);
				expect(oTaskData.columns.STATUS.rows[0]).toEqual('COMPLETED');
				expect(oTaskData.columns.TASK_TYPE.rows[0]).toEqual('METADATA_CUSTOM_FIELDS');

			});
			
			it("should return 200 when valid masterdata custom field with unit of measure attached is send to be created", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate], [], []);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				
				// check if the custom field and the attached unit of measure were created
				var oResultMasterdataCustomFields = oMockstar.execQuery("select count(*) as ROWCOUNT from {{metadata}} where path = 'Material'  and business_object = 'Material'  and is_custom = 1");
				expect(parseInt(oResultMasterdataCustomFields.columns.ROWCOUNT.rows[0], 10)).toBe(2);
			});
			
			it("should throw validation error if the default uom does not exist in the system", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oMetaMaterialTestDataCreateUnit = {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TESTTT_UNIT",
						ROLLUP_TYPE_ID : 0,
						SIDE_PANEL_GROUP_ID : 0,
						REF_UOM_CURRENCY_PATH : "null",
						REF_UOM_CURRENCY_BUSINESS_OBJECT : "null",
						REF_UOM_CURRENCY_COLUMN_ID : null,
						UOM_CURRENCY_FLAG : 1,
						SEMANTIC_DATA_TYPE : "String",
						SEMANTIC_DATA_TYPE_ATTRIBUTES: "length=3",
						PROPERTY_TYPE: 6,
						TEXT : [],
						ATTRIBUTES : [ {
							PATH : "Material",
							BUSINESS_OBJECT : "Material",
							COLUMN_ID : "CMAT_TESTTT_UNIT",
							ITEM_CATEGORY_ID : -1,
							IS_MANDATORY : 1,
							IS_READ_ONLY : 1,
							"DEFAULT_VALUE": "WR",
						}],
						FORMULAS : []
				};
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate], [], []);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual('GENERAL_VALIDATION_ERROR');
			});
			
			it("should create 2 entries in t_metadata for a masterdata custom field", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate], [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// check if there are entries in metadata for custom field on masterdata and on item level
				var resultMetadata = oMockstar.execQuery("select path, business_object, column_id from {{metadata}} where column_id = 'CMAT_TEST123' and is_custom = 1");
				expect(resultMetadata).toMatchData({
					"PATH" : [ "Material", "Item" ],
					"BUSINESS_OBJECT" : [ "Material", "Item" ],
					"COLUMN_ID" : [ "CMAT_TEST123", "CMAT_TEST123" ]
				}, [ "PATH", "BUSINESS_OBJECT", "COLUMN_ID" ]);
			});

			it("should create 2 entries in t_field_mapping when the CF has a unit", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate], [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// check if there are entries in metadata for custom field on masterdata and on item level
				var resultMetadata = oMockstar.execQuery("select path, business_object, column_id from {{metadata}} where column_id = 'CMAT_TEST123' and is_custom = 1");
				expect(resultMetadata).toMatchData({
					"PATH" : [ "Material", "Item" ],
					"BUSINESS_OBJECT" : [ "Material", "Item" ],
					"COLUMN_ID" : [ "CMAT_TEST123", "CMAT_TEST123" ]
				}, [ "PATH", "BUSINESS_OBJECT", "COLUMN_ID" ]);
				// check for the entries if they are created in the replication tool table
				let oEntriesCreated = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_material' and IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CMAT_TEST123_MANUAL", "CMAT_TEST123_UNIT"]
				};
				expect(oEntriesCreated).toMatchData(oExpectedItems, ["COLUMN_NAME"]);
			});

			it("should create one entry in t_field_mapping when the CF doesn't have a unit", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oCFWithoutUnit = JSON.parse(JSON.stringify(oMetaMaterialTestDataCreate));
				oCFWithoutUnit.REF_UOM_CURRENCY_COLUMN_ID = '';
				var oRequest = prepareBatchRequest([oCFWithoutUnit], [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// check if there are entries in metadata for custom field on masterdata and on item level
				var resultMetadata = oMockstar.execQuery("select path, business_object, column_id from {{metadata}} where column_id = 'CMAT_TEST123' and is_custom = 1");
				expect(resultMetadata).toMatchData({
					"PATH" : [ "Material", "Item" ],
					"BUSINESS_OBJECT" : [ "Material", "Item" ],
					"COLUMN_ID" : [ "CMAT_TEST123", "CMAT_TEST123" ]
				}, [ "PATH", "BUSINESS_OBJECT", "COLUMN_ID" ]);
				// check for the entries if they are created in the replication tool table
				let oEntriesCreated = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_material' and IS_CUSTOM = 1;`);
				let oExpectedItems = {
					"COLUMN_NAME": ["CMAT_TEST123_MANUAL", "CMAT_TEST123_UNIT"]
				};
				expect(oEntriesCreated).toMatchData(oExpectedItems, ["COLUMN_NAME"]);
			});
			
			it("should create different number of item attributes for a masterdata custom field", function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate], [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				// it should create 1 entry on masterdata level and multiple entries on item level
				var oResultMetadataAttributesMaterial = oMockstar.execQuery("select count(*) as ROWCOUNT from {{metadataItemAttributes}} where path = 'Material'  and business_object = 'Material'  and column_id = 'CMAT_TEST123'");
				expect(parseInt(oResultMetadataAttributesMaterial.columns.ROWCOUNT.rows[0], 10)).toBe(1);
				var oResultMetadataAttributesItem = oMockstar.execQuery("select count(*) as ROWCOUNT from {{metadataItemAttributes}} where path = 'Item'  and business_object = 'Item'  and column_id = 'CMAT_TEST123'");
				expect(parseInt(oResultMetadataAttributesItem.columns.ROWCOUNT.rows[0], 10)).toBe(7);
			});
			
			it("should create metadata entry with the correct TABLE_DISPLAY_ORDER property value", function() {
				// arrange
				// insert initial entry in t_metadata, having a predefined value for TABLE_DISPLAY_ORDER
				createSpyOnFieldMappingSequence(oPersistency);
				var oMasterdataInitialEntry = {
						"PATH" :"Material",
						"BUSINESS_OBJECT": "Material",
						"COLUMN_ID" : "CMAT_TEST_INITIAL",
						"SEMANTIC_DATA_TYPE": "String",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=3",
						"REF_UOM_CURRENCY_COLUMN_ID": null,
						"SIDE_PANEL_GROUP_ID" : 0,
						"ROLLUP_TYPE_ID" : 0,
						"REF_UOM_CURRENCY_PATH": null,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
						"UOM_CURRENCY_FLAG": 0,
						"IS_CUSTOM": 1,
						"PROPERTY_TYPE": 3,
						"TABLE_DISPLAY_ORDER": 5
				};
				oMockstar.insertTableData("metadata", oMasterdataInitialEntry);
				// generate metadata object for a second masterdata custom field (without UoM)
				var oSecondMaterialCustomField = JSON.parse(JSON.stringify(oMetaMaterialTestDataCreate)); // deep clone
				oSecondMaterialCustomField.COLUMN_ID = oSecondMaterialCustomField.ATTRIBUTES[0].COLUMN_ID = "CMAT_TEST123456";
				oSecondMaterialCustomField.REF_UOM_CURRENCY_PATH = oSecondMaterialCustomField.REF_UOM_CURRENCY_BUSINESS_OBJECT = oSecondMaterialCustomField.REF_UOM_CURRENCY_COLUMN_ID = null;
				
				var oRequest = prepareBatchRequest([oMetaMaterialTestDataCreateUnit, oMetaMaterialTestDataCreate, oSecondMaterialCustomField], [], []);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oResultMasterdataFirstMainField = oMockstar.execQuery("select TABLE_DISPLAY_ORDER from {{metadata}} where path = 'Material'  and business_object = 'Material' and column_id = 'CMAT_TEST123'");
				var oResultMasterdataSecondMainField = oMockstar.execQuery("select TABLE_DISPLAY_ORDER from {{metadata}} where path = 'Material'  and business_object = 'Material' and column_id = 'CMAT_TEST123456'");
				var oResultMasterdataUnitField = oMockstar.execQuery("select TABLE_DISPLAY_ORDER from {{metadata}} where path = 'Material'  and business_object = 'Material' and column_id = 'CMAT_TEST123_UNIT'");
				expect(parseInt(oResultMasterdataFirstMainField.columns.TABLE_DISPLAY_ORDER.rows[0], 10)).toBe(6);
				expect(parseInt(oResultMasterdataUnitField.columns.TABLE_DISPLAY_ORDER.rows[0], 10)).toBe(7);
				expect(parseInt(oResultMasterdataSecondMainField.columns.TABLE_DISPLAY_ORDER.rows[0], 10)).toBe(8);
				
				var oResultItemFields = oMockstar.execQuery("select TABLE_DISPLAY_ORDER from {{metadata}} where path = 'Item'  and business_object = 'Item' and column_id like 'CMAT_TEST123%'");
				expect(oResultItemFields.columns.TABLE_DISPLAY_ORDER.rows[0]).toBe(null);
				expect(oResultItemFields.columns.TABLE_DISPLAY_ORDER.rows[1]).toBe(null);
			});
			
			it('should fail when trying to add and custom field that has reference to a unit that is not sent int request', function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetadataTestDataCreatePersistency], [], []);
	
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.head)).toBe(true);
				expect(_.isObject(oResponseObject.head.messages)).toBe(true);
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[0].severity).toBe('Error');
			});
			
			it('should return 200 and update the task status to completed if roll-up type is greater then zero', function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetadataTestDataCreatePersistencyRollupGreaterThen0], [], []);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
					
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'COMPLETED'");
				expect(parseInt(oTaskData.columns.ROWCOUNT.rows[0], 10)).toBe(1);
			});
			
			it('should fail when custom field already exists', function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetadataTestDataCreateUnitPersistencyAlreadyExists, oMetadataTestDataCreatePersistencyAlreadyExists], [], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails.length).toBe(2);
				expect(oParsedErrorDetails[0].code).toEqual("GENERAL_ENTITY_ALREADY_EXISTS_ERROR");
				expect(oParsedErrorDetails[1].code).toEqual("GENERAL_ENTITY_ALREADY_EXISTS_ERROR");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
			
			it('should fail when custom field has a formula and formula string refers to a field that does not exists', function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oRequest = prepareBatchRequest([oMetadataTestDataCreateErrorsInFormulaPersistency], [], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails.length).toBe(1);
				expect(oParsedErrorDetails[0].code).toEqual("CALCULATIONENGINE_REFERENCED_FIELD_NOT_FOUND_WARNING");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
			
			it('should not be able to lock when only current users is in the system and return active users and lock = 1', function() {		
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				oMockstar.clearTable("session");
				oMockstar.insertTableData("session", testData.oSessionTestData );
				
			    var	oRequest = prepareBatchRequest([oMetadataTestDataCreateUnitPersistency, oMetadataTestDataCreatePersistency], [], []);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].IS_LOCKED).toEqual(1);
				expect(oResponseObject.body[ServiceMetaInformation.LockActiveStatus].ACTIVE_USERS.length).toBe(1);
			});
			
			it('should be able to lock when only current users is in the system and create an entry in the lock table', function() {		
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				// The current user is already inserted in the beforeEach method.
				var oRequest = prepareBatchRequest([oMetadataTestDataCreateUnitPersistency, oMetadataTestDataCreatePersistency], [], []);
				var oMetadataLock = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{lock}}");	
				var oTaskObject = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{task}}");

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oMetadataLock.columns.ROWCOUNT.rows[0]).toBe(0);
				expect(oTaskObject.columns.ROWCOUNT.rows[0]).toBe(0);

				// Check that there is now an enter in the lock table.
				oMetadataLock = oMockstar.execQuery("select COUNT(*) AS ROWCOUNT from {{lock}}");	
	            expect(oMetadataLock.columns.ROWCOUNT.rows[0]).toBe(1);
			});

			it('Should set existing METADATA_CUSTOM_FIELDS task to Cancelled and create a new task when there is an existing METADATA_CUSTOM_FIELDS task in the system', function() {
				// arrange
				createSpyOnFieldMappingSequence(oPersistency);
				var oMetadata = new Metadata($);
				
				var oTaskData = {
					"TASK_ID" : 1,
					"SESSION_ID" : $.session.getUsername(),
					"TASK_TYPE" : constants.TaskType.METADATA_CUSTOM_FIELDS,
					"STATUS" : 'INACTIVE',
					"PARAMETERS" : null,
					"PROGRESS_STEP" : 0,
					"PROGRESS_TOTAL" : 4,
					"CREATED_ON" : new Date(),
					"STARTED" : null,
					"LAST_UPDATED_ON" : new Date(),
					"ERROR_CODE" : null,
					"ERROR_DETAILS" : null
				};
				oMockstar.insertTableData("task", oTaskData);

				var oInactiveTask = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 1 AND STATUS = 'INACTIVE'");
				oConnectionFactoryMock = jasmine.createSpyObj("oConnectionFactoryMock", [ "getConnection", "commit" ]);
				oConnectionFactoryMock.getConnection.and.returnValue(jasmine.dbConnection);
				oServiceOutputMock = jasmine.createSpyObj("oServiceOutputMock", ["setTransactionalData", "setFollowUp"]);
				oServiceOutputMock.setFollowUp.and.callFake(function(oFollowUp){
						oMetadata.batchCreateUpdateDelete(oFollowUp.parameter.TASK_ID, oCreateBodyMeta, {checkCanExecute: null}, oPersistency, oConnectionFactoryMock);
				});

				// act
				oMetadata.setLockOnMetadataObj(oCreateBodyMeta, {checkCanExecute: null}, oServiceOutputMock, oPersistency, oConnectionFactoryMock);
				
				//assertions
				var oCancelledTask = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = 1 AND STATUS = 'CANCELED'");
				var oCompletedTask = oMockstar.execQuery("select * from {{task}} WHERE STATUS = 'COMPLETED'");
				
				expect(oInactiveTask.columns.STATUS.rows[0]).toEqual('INACTIVE');
				expect(oInactiveTask.columns.STATUS.rows.length).toEqual(1);
				expect(oCancelledTask.columns.STATUS.rows[0]).toEqual('CANCELED');
				expect(oCancelledTask.columns.STATUS.rows.length).toEqual(1);
				expect(oCompletedTask.columns.STATUS.rows[0]).toEqual('COMPLETED');
				expect(oCompletedTask.columns.STATUS.rows.length).toEqual(1);
			});

		});
		
		describe('batchopperation update', function() {
			beforeEach(function() {
			    oMockstar.clearAllTables(); 
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadata", oMetadataLanguage);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("language", oLanguageTestData);
				oMockstar.insertTableData("costingSheetOverheadRowFormula", oMetaDataCostingSheetRowFormulasTestData);
				oMockstar.insertTableData("costingSheetOverheadRow", testData.oCostingSheetOverheadRowTestData);
				oMockstar.insertTableData("task", {});
		
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp" ]);

				oConnectionFactoryMock = jasmine.createSpyObj("oConnectionFactoryMock", [ "getConnection", "commit" ]);
				oConnectionFactoryMock.getConnection.and.returnValue(jasmine.dbConnection);

				oDefaultResponseMock.followUp.and.callFake(function(oFollowUp){
					var oMetadata = new Metadata($);
					oMetadata.batchCreateUpdateDelete(oFollowUp.parameter.TASK_ID, oFollowUp.parameter.A_BODY_META, oFollowUp.parameter.PARAMETERS, oPersistency, oConnectionFactoryMock);
				});

				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});
			
			var oMetadataTestDataUpdateUnit =
				   {"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST_UNIT",
					"PROPERTY_TYPE": 6,
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST_UNIT",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Changed Testing En"}],
					"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST_UNIT",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": "CM"
						}]};
			
			var oMetadataTestDataUpdate = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST",
						"LANGUAGE" : "EN",
						"DISPLAY_NAME" : "Testing changed 1"}],
						"ATTRIBUTES": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"DEFAULT_VALUE": 2
						}],
						"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : 11,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
				}]};
			
			var oMetadataTestDataFormulaUpdate = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST1",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"LANGUAGE" : "EN"
					}],
					"ATTRIBUTES": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"ITEM_CATEGORY_ID" : 1
					}],
					"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST1",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
				}]};
				
			var oMetadataTestDataUpdateNotFound = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST2",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST2",
						"LANGUAGE" : "EN"
					}],
					"ATTRIBUTES": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST2",
						"ITEM_CATEGORY_ID" : 1
					}],
					"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST2",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
				}]};
	
			it("should return 200 and update the status of the task to completed when updating the metadata when valid input", function() {
				// arrange
				var oRequest = prepareBatchRequest([], [oMetadataTestDataUpdateUnit, oMetadataTestDataUpdate], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toEqual(1);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID);
				expect(oTaskData.columns.STATUS.rows[0]).toEqual('COMPLETED');
				expect(oTaskData.columns.TASK_TYPE.rows[0]).toEqual('METADATA_CUSTOM_FIELDS');
			});
			
			it("should return 200 and update the status of the task to completed when create formula for updated custom field if formula does not exist", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [oMetadataTestDataFormulaUpdate], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body)).toBe(true);
				expect(oResponseObject.body.transactionaldata.length).toEqual(1);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID);
				expect(oTaskData.columns.STATUS.rows[0]).toEqual('COMPLETED');
				expect(oTaskData.columns.TASK_TYPE.rows[0]).toEqual('METADATA_CUSTOM_FIELDS');
			});
			
			it("should fail if try to update a custom field that does not exists", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [oMetadataTestDataUpdateNotFound], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(404);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
			
			it("should set the status of the task to FAILED with details if a formula is added to a custom field used in costing sheet formula", function() {

				var oMetadataAddFormula = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_FORMULA",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_FORMULA",
						"LANGUAGE" : "EN"
					}],
					"ATTRIBUTES": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_FORMULA",
						"ITEM_CATEGORY_ID" : 1
					}],
					"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_FORMULA",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4"
				}]};

				// arrange
			    var oRequest = prepareBatchRequest([], [oMetadataAddFormula], []);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails[0].code).toEqual("CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
		});
		
		describe('batchopperation delete', function() {
			beforeEach(function() {
			    oMockstar.clearAllTables();
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadata", oMetadataLanguage);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("formula", oMetaDataFormulasTestData);
				oMockstar.insertTableData("costingSheetOverheadRowFormula", oMetaDataCostingSheetRowFormulasTestData);
				oMockstar.insertTableData("costingSheetOverheadRow", testData.oCostingSheetOverheadRowTestData);
				oMockstar.insertTableData("task", {});
		
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp" ]);

				oConnectionFactoryMock = jasmine.createSpyObj("oConnectionFactoryMock", [ "getConnection", "commit" ]);
				oConnectionFactoryMock.getConnection.and.returnValue(jasmine.dbConnection);

				oDefaultResponseMock.followUp.and.callFake(function(oFollowUp){
					var oMetadata = new Metadata($);
					oMetadata.batchCreateUpdateDelete(oFollowUp.parameter.TASK_ID, oFollowUp.parameter.A_BODY_META, oFollowUp.parameter.PARAMETERS, oPersistency, oConnectionFactoryMock);
				});
				
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});
			
			var oMetadataTestDataDelete =
			   {"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST"
			   };
			
			var oMetadataTestDataNotFoundDelete =
			   {"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_1"
			   };
			
			var oMetadataTestDataCannotDelete =
			   {"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_ROLLUP_POSITIVE"
			   };

			var oMetadataTestDataCreateUnitPersistency =
			{"PATH" : "Item",
			"BUSINESS_OBJECT": "Item",
			"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
			"SEMANTIC_DATA_TYPE": "String",
			"SIDE_PANEL_GROUP_ID" : 1,
			"ROLLUP_TYPE_ID" : 0,
			"UOM_CURRENCY_FLAG" : 1,
			"PROPERTY_TYPE": 6,
			"TEXT": [{
				"PATH" : "Item",
				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
				"LANGUAGE" : "EN",
				"DISPLAY_NAME" : "Testing"},
				{"PATH" : "Item",
					"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
					"LANGUAGE" : "DE",
					"DISPLAY_NAME" : "Testing"}
				],
			"ATTRIBUTES": [{
				"PATH" : "Item",
				"BUSINESS_OBJECT": "Item",
				"COLUMN_ID" : "CUST_TEST_CREATE_UNIT",
				"ITEM_CATEGORY_ID" : 1,
				"DEFAULT_VALUE": 1
			}]};
			
			var oMetadataTestDataFormulaUpdate = {
					"PATH" : "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID" : "CUST_TEST1",
					"TEXT": [{
						"PATH" : "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"LANGUAGE" : "EN"
					}],
					"ATTRIBUTES": [{
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_TEST1",
						"ITEM_CATEGORY_ID" : 1
					}],
					"FORMULAS": [{
							"PATH" : "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID" : "CUST_TEST1",
							"ITEM_CATEGORY_ID" : 1,
							"FORMULA_ID" : -1,
							"IS_FORMULA_USED": 1,
							"FORMULA_STRING": "1+3",
							"FORMULA_DESCRIPTION": "equals 4",
							"RESULT_UOM_CURRENCY_ID": "HH"
				}]};			
			
			it("should return 200 and update the status of the task to COMPLETED when remove metadata, metadata texts, attributes, formulas including unit reference when valid input", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataDelete]);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.body.transactionaldata.length).toEqual(1);

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'COMPLETED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
			});
			
			it("should create failed task when try to delete a custom field that does not exists", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataNotFoundDelete]);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails[0].code).toEqual("GENERAL_ENTITY_NOT_FOUND_ERROR");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
			
			it("should create a failed task when try to delete a custom field that is used in other fields formulas", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataCannotDelete]);
				//creation of CF
				oPersistency.Metadata.create(oMetadataTestDataCreatePersistencyRollupGreaterThen0);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails[0].code).toEqual("GENERAL_VALIDATION_ERROR");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
			
			it("should update status to FAILED when try to delete a custom field that is used in costing sheet row formula", function() {

				var oMetadataTestDataDeleteCustomFieldUsedInFormula =
				{"PATH" : "Item",
				 "BUSINESS_OBJECT": "Item",
				 "COLUMN_ID" : "CUST_FORMULA"
				};
				
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataDeleteCustomFieldUsedInFormula]);
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		

				var oResponseData = oResponseObject.body.transactionaldata[0];
				var oTaskData = oMockstar.execQuery("select * from {{task}} WHERE TASK_ID = " + oResponseData.TASK_ID  + " AND STATUS = 'FAILED'");
				expect(parseInt(oTaskData.columns.TASK_ID.rows.length, 10)).toBe(1);
				var oParsedErrorDetails = JSON.parse(oTaskData.columns.ERROR_DETAILS.rows[0]);
				expect(oParsedErrorDetails[0].code).toEqual("CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR");
				expect(oTaskData.columns.ERROR_CODE.rows[0]).toEqual('BATCH_OPPERATION_ERROR');
			});
			
			it("should return 200 when parameter checkCanExecute = true, metadata texts, attributes, formulas including unit reference when valid input", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataDelete], true);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.body.DELETE).toBe(undefined);
			});

			it("should successfuly delete custom fields entries from Replication Tool when a CF is deleted", function() {
				// arrange
				var oMetadataMaterialCF = {
					"PATH" :["Material", "Material", "Material", "Material", "Item", "Item", "Item", "Item"],
					"BUSINESS_OBJECT": ["Material", "Material", "Material", "Material", "Item", "Item", "Item", "Item"],
					"COLUMN_ID" : ["CMAT_TEST_UNIT", "CMAT_TEST", "CMAT_TEST1", "CMAT_FORMULA", "CMAT_TEST_UNIT", "CMAT_TEST", "CMAT_TEST1", "CMAT_FORMULA"],
					"SEMANTIC_DATA_TYPE": ["String", "Integer", "Integer", "Integer", "String", "Integer", "Integer", "Integer"],
					"SEMANTIC_DATA_TYPE_ATTRIBUTES": ["length=3", null, null, null, "length=3", null, null, null],
					"REF_UOM_CURRENCY_COLUMN_ID": [null, "CMAT_TEST_UNIT", null, null, null, "CMAT_TEST_UNIT", null, null],
					"SIDE_PANEL_GROUP_ID" : [1, 1, 1, 1, 1, 1, 1, 1],
					"ROLLUP_TYPE_ID" : [0, 0, 0, 0, 0, 0, 0, 0],
					"REF_UOM_CURRENCY_PATH": [null, "Material", null, null, null, "Item", null, null],
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": [null, "Material", null, null, null, "Item", null, null],
					"UOM_CURRENCY_FLAG": [1, 0, 0, 0, 1, 0, 0, 0],
					"IS_CUSTOM": [1, 1, 1, 1, 1, 1, 1, 1],
					"PROPERTY_TYPE": [3, 1, 1, 1, 3, 1, 1, 1],
					"IS_USABLE_IN_FORMULA": [1, 1, 1, 1, 1, 1, 1, 1]
				};
				let oExistingCFs = {
					"ID": [1000, 1001, 1002, 1003],
					"TABLE_NAME": ["t_material", "t_material", "t_material", "t_material"],
					"COLUMN_NAME": ["CMAT_TEST_MANUAL", "CMAT_TEST_UNIT", "CMAT_TEST1_MANUAL", "CMAT_FORMULA_MANUAL"],
					"FIELD_TYPE": ["INTEGER", "STRING", "INTEGER", "INTEGER"],
					"FIELD_ORDER": [1000, 1001, 1002, 1003],
					"IS_CUSTOM": [1, 1, 1, 1]
				};
				let aCFsForDeletion = [{
					"BUSINESS_OBJECT":"Material",
					"COLUMN_ID":"CMAT_TEST",
					"PATH":"Material"
				},{
					"BUSINESS_OBJECT":"Material",
					"COLUMN_ID":"CMAT_FORMULA",
					"PATH":"Material"
				}];
				oMockstar.insertTableData("field_mapping", oExistingCFs);
				oMockstar.insertTableData("metadata", oMetadataMaterialCF);
			    var oRequest = prepareBatchRequest([], [], aCFsForDeletion, true);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		

				let oEntriesDb = oMockstar.execQuery(`select * from {{field_mapping}} where TABLE_NAME = 't_material' AND IS_CUSTOM = 1;`);
				expect(oEntriesDb.columns.COLUMN_NAME.rows[0]).toEqual("CMAT_TEST1_MANUAL");
			});
			
			it("should return 500 when parameter checkCanExecute = false", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [], [oMetadataTestDataDelete], false);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual('GENERAL_VALIDATION_ERROR');
			});

			it("should return 500 when parameter checkCanExecute = true and batch information exists for UPDATE", function() {
				// arrange
			    var oRequest = prepareBatchRequest([], [oMetadataTestDataFormulaUpdate], [oMetadataTestDataDelete], true);
			
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual('GENERAL_VALIDATION_ERROR');
			});
			
			it("should return 500 when parameter checkCanExecute = true and batch information exists for CREATE", function() {
				// arrange
			    var oRequest = prepareBatchRequest([oMetadataTestDataCreateUnitPersistency], [], [oMetadataTestDataDelete], true);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(_.isObject(oResponseObject)).toBe(true);		
				expect(oResponseObject.head.messages.length).toEqual(1);
				expect(oResponseObject.head.messages[0].code).toEqual('GENERAL_VALIDATION_ERROR');
			});			
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
		xdescribe('updateManualField', function() {

            var sDate = new Date().toJSON();
		    var sSessionId = $.session.getUsername();
				
            var oSessionTestData = {
            	"SESSION_ID" : [ sSessionId ],
            	"USER_ID" : [ sSessionId ],
            	"LANGUAGE" : [ "DE" ],
                "LAST_ACTIVITY_TIME" : [ sDate ]
            };
                                    
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("metadata", oMetadataTestData);
				oMockstar.insertTableData("metadata", oMetadataLanguage);
				oMockstar.insertTableData("metadataText", oMetadataTextTestData);
				oMockstar.insertTableData("metadataItemAttributes", oMetaDataAttributesTestData);
				oMockstar.insertTableData("language", oLanguageTestData);
                oMockstar.insertTableData("session", oSessionTestData);
                oMockstar.insertTableData("application_timeout", testData.oApplicationTimeout);
				oMockstar.insertTableData("metadataItemAttributes",testData.oMetadataItemAttributesCustTestData);
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status", "followUp" ]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
			});

			it("should not call updateManualField for updating IS_MANUAL field if formula string is updated for an exiting decimal custom field", function() {
				oMockstar.insertTableData("metadata",{
            		"PATH": "Item",
            		"BUSINESS_OBJECT": "Item",
            		"COLUMN_ID": "CUST_DECIMAL_WITHOUT_REF",
            		"IS_CUSTOM": 1,
            		"ROLLUP_TYPE_ID": 1,
            		"SIDE_PANEL_GROUP_ID": null,
            		"DISPLAY_ORDER": null,
            		"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
            		"REF_UOM_CURRENCY_COLUMN_ID": null,
            		"UOM_CURRENCY_FLAG": null,
            		"SEMANTIC_DATA_TYPE": "Decimal",
            		"IS_REQUIRED_IN_MASTERDATA": null,
            		"IS_WILDCARD_ALLOWED": null,
            		"RESOURCE_KEY_DISPLAY_NAME":null,
            		"RESOURCE_KEY_DISPLAY_DESCRIPTION":null
                });
				oMockstar.insertTableData("formula",{
					"PATH" : [ "Item" ],
					"BUSINESS_OBJECT" : [ "Item" ],
					"COLUMN_ID":["CUST_DECIMAL_WITHOUT_REF"],
					"ITEM_CATEGORY_ID":[3],
					"FORMULA_ID":[12],
					"IS_FORMULA_USED":[1],
					"FORMULA_STRING":["1+1"],
					"FORMULA_DESCRIPTION":["equals 2"]
				});
				oMockstar.insertTableData("metadataItemAttributes",{
            			"PATH" : ["Item", "Item"],
            			"BUSINESS_OBJECT": ["Item", "Item"],
            			"COLUMN_ID" : ["CUST_DECIMAL_WITHOUT_REF", "CUST_DECIMAL_WITHOUT_REF"],
            			"ITEM_CATEGORY_ID" : [3, 3],
            			"DEFAULT_VALUE": [1, 1],
            			"SUBITEM_STATE": [-1, -1],
            			"IS_READ_ONLY": [1,0] 
            	});
				oMockstar.insertTableData("itemExt",{
					"ITEM_ID" : [ 3003 ],
					"CALCULATION_VERSION_ID" : [ 2809 ],
					"CUST_DECIMAL_WITHOUT_REF_MANUAL":[1],
					"CUST_DECIMAL_WITHOUT_REF_CALCULATED":[2],
					"CUST_DECIMAL_WITHOUT_REF_UNIT":[null],
					"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[1]
				});
				oMockstar.insertTableData("item",testData.oItemTestData);
				var oMetadataUpdateBool = {
						"PATH" : "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
						"FORMULAS": [{
						    "PATH" : "Item",
        					"BUSINESS_OBJECT" : "Item",
        					"COLUMN_ID":"CUST_DECIMAL_WITHOUT_REF",
        					"ITEM_CATEGORY_ID":3,
        					"FORMULA_ID":12,
        					"IS_FORMULA_USED":1,
        					"FORMULA_STRING": "1+2",
        					"FORMULA_DESCRIPTION": "equals 3"
						}],
						"TEXT": [],
        				"ATTRIBUTES": [{
        					"PATH" : "Item",
        					"BUSINESS_OBJECT": "Item",
        					"COLUMN_ID" : "CUST_DECIMAL_WITHOUT_REF",
        					"ITEM_CATEGORY_ID" : 3,
        					"DEFAULT_VALUE": 1
        				}]
				};
	            
	            // arrange
			    var oRequest = prepareBatchRequest([], [oMetadataUpdateBool], []);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		
				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oDefaultResponseMock.status).toBe(200);
				// if only formula string is updated method that updates _IS_MANUAL field is never called
				expect(oPersistency.Metadata.updateManualField).not.toHaveBeenCalled();;

			});
		});
    }
		
	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}