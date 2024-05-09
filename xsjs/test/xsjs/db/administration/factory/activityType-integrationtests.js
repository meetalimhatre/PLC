var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;
const _ = require("lodash");

var Administration = require("../administration-util");

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var ProjectTables = $.import("xs.db", "persistency-project").Tables;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
const TestDataUtility        = require("../../../../testtools/testDataUtility").TestDataUtility;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.activityType-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_activity_type_read"
				},
				substituteTables :{
					activity_type : Resources["Activity_Type"].dbobjects.plcTable,
					activity_type_text : Resources["Activity_Type"].dbobjects.plcTextTable,
					account : Resources["Account"].dbobjects.plcTable,
					controlling_area : Resources["Controlling_Area"].dbobjects.plcTable,
					currency : Resources["Currency"].dbobjects.plcTable,
					activity_price : Resources["Activity_Price"].dbobjects.plcTable,
					project : ProjectTables.project,
					project_activity_price_surcharges: ProjectTables.project_activity_price_surcharges,					
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					metadata :  {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Activity_Type"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Activity_Type": procedureXsunit
                });
			}
			
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				MasterdataReadProcedures = originalProcedures;
				mockstar.cleanup();
			}
		});
	
		beforeEach(function() {
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return all valid activity types and texts', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
					name : "business_object",
					value : "Activity_Type"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES.length).toBe(4);
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_TEXT_ENTITIES.length).toBe(3);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
					name : "business_object",
					value : "Activity_Type"
				},{
				    name : "filter",
					value : "ACTIVITY_TYPE_ID=ACTIVITY2222"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_TEXT_ENTITIES.length).toBe(1);
			});
			
				it('should return the filtered entries that start with the string from autocomplete', function() {
				// arrange
				const oExtendedActivityType =  new TestDataUtility(testData.oActivityTypeTestDataPlc).build();
				mockstar.insertTableData("activity_type", _.extend(oExtendedActivityType,{
				    "ACTIVITY_TYPE_ID" :['B1'],
		            "CONTROLLING_AREA_ID" : ['#CA1'],
		            "ACCOUNT_ID" : ['CE1'],
		            "_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
                    "_VALID_TO" : [null],
		            "_SOURCE" : [1],
		            "_CREATED_BY" : ['U000001']
				}));
				const oExtendedActivityTypeText =  new TestDataUtility(testData.oActivityTypeTextTestDataPlc).build();
				mockstar.insertTableData("activity_type_text", _.extend(oExtendedActivityTypeText,{
				    	"ACTIVITY_TYPE_ID" : ['B1', 'A1'],
		                "CONTROLLING_AREA_ID" : ['#CA1','#CA1'],
		                "LANGUAGE" :         ['DE', 'DE'],
		                "ACTIVITY_TYPE_DESCRIPTION" : ['Activity type B1 DE', 'Activity type A1 DE'],
		                "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
		                "_VALID_TO" :[null, null],
		                "_SOURCE" : [1, 1],
		                "_CREATED_BY" : ['U000001', 'U000001']
				}));
				var aParams = [ {
					name : "business_object",
					value : "Activity_Type"
				},{
				    name : "filter",
					value : "CONTROLLING_AREA_ID=#CA1"
				},{
				    name : "searchAutocomplete",
				    value : "B"
				}
				];
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
					name : "business_object",
					value : "Activity_Type"
				},{
				    name : "filter",
					value : "ACTIVITY_TYPE_ID=545"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_TEXT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
			
			it('should not return duplicate entries when multiple filteres are used', function() {
    			// arrange
    			var aParams = [ {
    				name : "business_object",
    				value : "Activity_Type"
    			},{
    			    name : "searchAutocomplete",
    			    value : "A"
    			}, {
    				name : "filter",
    			    value : "CONTROLLING_AREA_ID=%1%&ACTIVITY_TYPE_ID=%A%"
    			}];
    
    			// act
    			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    			
                // assert
    			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
    			expect(oResponseBody).toBeDefined();
    			expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES.length).toBe(4);
    			expect(oResponseBody.body.masterdata.ACTIVITY_TYPE_ENTITIES).toMatchData({
        			   ACTIVITY_TYPE_ID: [testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[1], testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[3], testData.oActivityTypeTestDataPlc.ACTIVITY_TYPE_ID[4]],
        			   CONTROLLING_AREA_ID: [testData.oActivityTypeTestDataPlc.CONTROLLING_AREA_ID[0], testData.oActivityTypeTestDataPlc.CONTROLLING_AREA_ID[1], testData.oActivityTypeTestDataPlc.CONTROLLING_AREA_ID[3], testData.oActivityTypeTestDataPlc.CONTROLLING_AREA_ID[4]],
        			   ACCOUNT_ID: [testData.oActivityTypeTestDataPlc.ACCOUNT_ID[0], testData.oActivityTypeTestDataPlc.ACCOUNT_ID[1], testData.oActivityTypeTestDataPlc.ACCOUNT_ID[3], testData.oActivityTypeTestDataPlc.ACCOUNT_ID[4]]
        			}, ["ACTIVITY_TYPE_ID"]);
    		});
		});
	
		describe ("remove", function (){
			const aParams = [ {
    			name : "business_object",
    			value : "Activity_Type"
    		}];
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("activity_price", testData.oActivityPriceTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate activity type and texts', function() {
				// arrange
            	var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY1111",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
            	}};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody.body.masterdata.DELETE.ACTIVITY_TYPE_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an activity type for which mandatory fields are missing', function() {
				// arrange
            	var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A1"
						}]
            	}};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an activity type which is used in other business objects', function() {
				// arrange
            	var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY4444",
							"CONTROLLING_AREA_ID":"#CA1",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
            	}};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ActivityPrice);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an activity type used in project activity price surcharges', function() {
				// arrange
            	var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
                        	"ACTIVITY_TYPE_ID" : 	testData.oProjectActivityPriceSurcharges.ACTIVITY_TYPE_ID[0],
   							"CONTROLLING_AREA_ID" : testData.oProjectTestData.CONTROLLING_AREA_ID[0],							
							"_VALID_FROM" : 		"2015-01-01T15:39:09.691Z"
						}]
            	}};
    			mockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
    			mockstar.insertTableData("project",  testData.oProjectTestData);            	

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectActivityPriceSurcharges);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});			
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete an activity type that does not exist', function() {
				// arrange
            	var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A1",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM" : "2015-05-01T15:39:09.691Z"
						}]
            	}}

				// act
                new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("currency",testData.oCurrencySecond);
				mockstar.initializeData();
			});
	
			it('should insert activity_type and activity_type_text', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1'
						},{
							"ACTIVITY_TYPE_ID" : 'INS2',
							"CONTROLLING_AREA_ID" : '#CA1'
						}],
						"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 EN',
							"LANGUAGE":"EN"
						},{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 DE',
							"LANGUAGE":"DE"
						},{
							"ACTIVITY_TYPE_ID" : 'INS2',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test2 EN',
							"LANGUAGE":"EN"
						}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{activity_type}}");
				var oTestText = mockstar.execQuery("select * from {{activity_type_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTesta.columns.ACTIVITY_TYPE_ID.rows.length + 2);
				expect(oTestText.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestTexta.columns.ACTIVITY_TYPE_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.ACTIVITY_TYPE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.ACTIVITY_TYPE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for an activity type that does not exists', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
            	name : "business_object",
            			value : "Activity_Type"
            		}];
            	var oItemsPayload = {"CREATE":
            	{ 
            			"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'A123',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 EN',
							"LANGUAGE":"EN"
						},{
							"ACTIVITY_TYPE_ID" : 'A123',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 DE',
							"LANGUAGE":"DE"
						}]
            	}}
    
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);			
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '1234'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert an activity type that already exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'ACTIVITY2222',
							"CONTROLLING_AREA_ID" : '1000'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert an activity type text that already exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'ACTIVITY2222',
							"CONTROLLING_AREA_ID" : '1000',
							"LANGUAGE" : 'EN',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 EN',
							"_VALID_FROM" :'2015-01-01T15:39:09.691Z'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an activity type for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A1"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);;
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
		});
	
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("currency",testData.oCurrencySecond);
				mockstar.initializeData();
			});
	
			it('should insert activity_type and activity_type_text', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1'
						},{
							"ACTIVITY_TYPE_ID" : 'INS2',
							"CONTROLLING_AREA_ID" : '#CA1'
						}],
						"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 EN',
							"LANGUAGE":"EN"
						},{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 DE',
							"LANGUAGE":"DE"
						},{
							"ACTIVITY_TYPE_ID" : 'INS2',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test2 EN',
							"LANGUAGE":"EN"
						}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{activity_type}}");
				var oTestText = mockstar.execQuery("select * from {{activity_type_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTesta.columns.ACTIVITY_TYPE_ID.rows.length + 2);
				expect(oTestText.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestTexta.columns.ACTIVITY_TYPE_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.ACTIVITY_TYPE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.ACTIVITY_TYPE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should deactivate the current version of the upserted activity type text and create a new version', function() {
				// arrange
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}} WHERE ACTIVITY_TYPE_ID = 'ACTIVITY2222'");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY2222",
							"CONTROLLING_AREA_ID": "1000",
							"ACTIVITY_TYPE_DESCRIPTION" : "Updated activity type description",
							"LANGUAGE" : "EN"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTestText = mockstar.execQuery("select * from {{activity_type_text}} WHERE ACTIVITY_TYPE_ID = 'ACTIVITY2222'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestTexta.columns.ACTIVITY_TYPE_ID.rows.length + 1);
			});
			
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for an activity type that does not exists', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
            	name : "business_object",
            			value : "Activity_Type"
            		}];
            	var oItemsPayload = {"UPSERT":
            	{ 
            			"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'A123',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 EN',
							"LANGUAGE":"EN"
						},{
							"ACTIVITY_TYPE_ID" : 'A123',
							"CONTROLLING_AREA_ID" : '#CA1',
							"ACTIVITY_TYPE_DESCRIPTION": 'Test1 DE',
							"LANGUAGE":"DE"
						}]
            	}}
    
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);			
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{activity_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '1234'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert an activity type for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A1"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);;
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
		});
		
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated activity type text and create a new version', function() {
				// arrange
				var oTestTexta = mockstar.execQuery("select * from {{activity_type_text}} WHERE ACTIVITY_TYPE_ID = 'ACTIVITY2222'");
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY2222",
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
							"ACTIVITY_TYPE_DESCRIPTION" : "Updated activity type description",
							"LANGUAGE" : "EN"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTestText = mockstar.execQuery("select * from {{activity_type_text}} WHERE ACTIVITY_TYPE_ID = 'ACTIVITY2222'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestTexta.columns.ACTIVITY_TYPE_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an activity type and referenced object (account) does not exist', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY2222",
							"CONTROLLING_AREA_ID": "1000",
							"ACCOUNT_ID": "0000",
							"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);			
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Account);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update an activity type for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A2"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an activity type that is not available in system', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A1234",
							"CONTROLLING_AREA_ID": "1000",
							"ACCOUNT_ID": "22000",
							"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);			
			});
						
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an activity type text and the activity type text is not available in system', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Activity_Type"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"ACTIVITY_TYPE_TEXT_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "A2",
							"CONTROLLING_AREA_ID": "1000",
							"_VALID_FROM" : '2015-05-01T15:39:09.691Z',
							"ACTIVITY_TYPE_DESCRIPTION" : "Updated activity type description",
							"LANGUAGE" : "EN"
						}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);    
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);			
			});
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}