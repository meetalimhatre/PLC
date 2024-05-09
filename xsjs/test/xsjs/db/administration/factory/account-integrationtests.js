var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.account-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
		
		beforeOnce(function() {
			
			mockstar = new MockstarFacade({ // Initialize Mockstar
						testmodel : {
							"procRead" : "sap.plc.db.administration.procedures/p_account_read"
						},
						substituteTables : {
							account : {
								name : Resources["Account"].dbobjects.plcTable
							},
							account_text : {
								name : Resources["Account"].dbobjects.plcTextTable
							},
							controlling_area : {
								name : Resources["Controlling_Area"].dbobjects.plcTable
							},
							controlling_area_text : {
								name : Resources["Controlling_Area"].dbobjects.plcTextTable
							},
							process : {
								name : Resources["Process"].dbobjects.plcTable
							},
							account_group : {
								name : Resources["Account_Group"].dbobjects.plcTable
							},
							account_group_text : {
								name : Resources["Account_Group"].dbobjects.plcTextTable
							},
							account_account_group : {
								name : Resources["Account_Account_Group"].dbobjects.plcTable
							},
							costing_sheet_overhead : {
								name : Resources["Costing_Sheet_Overhead"].dbobjects.plcTable
							},
							costing_sheet_overhead_row : {
								name : Resources["Costing_Sheet_Overhead_Row"].dbobjects.plcTable
							},
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Account"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Account": procedureXsunit
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
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.insertTableData("account_text", testData.oAccountTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid accounts and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Account"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(testData.oAccountTestDataPlc.ACCOUNT_ID.length);
				expect(oResponseBody.body.masterdata.ACCOUNT_TEXT_ENTITIES.length).toBe(testData.oAccountTextTestDataPlc.ACCOUNT_ID.length);
			});
			
			it('should return a subset of valid accounts and texts when skip parameter is used', function() {
				// arrange
				var iSkip = 2;
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
					name : "skip",
					value : iSkip
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(testData.oAccountTestDataPlc.ACCOUNT_ID.length-iSkip);
				expect(oResponseBody.body.masterdata.ACCOUNT_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should return a subset of valid accounts and texts when skip and top parameters are used', function() {
				// arrange
				var iTop = 2;
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
					name : "skip",
					value : 1
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(iTop);
				expect(oResponseBody.body.masterdata.ACCOUNT_TEXT_ENTITIES.length).toBe(2);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use top and skip parameters with values greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iTop = 214748364899;
				var iSkip = 2147483648;
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
					name : "skip",
					value : iSkip
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use skip parameter with a value greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iSkip = 2147483648;
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
					name : "skip",
					value : iSkip
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use top parameter with a value greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iTop = 214748364899;
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=545"
				} ];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.ACCOUNT_TEXT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
			
			it('should filter data using additional criteria in autocomplete', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
					name : "business_object",
					value : "Account"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=#CA1&ACCOUNT_ID>11000"
				},{
				     name : "searchAutocomplete",
				     value : "2"
				} ];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(1);
			});
			
		    it('should return the valid acounts that start with the string from autocomplete and are filtered', function() {
    			// arrange
    			var aParams = [ {
    				name : "business_object",
    				value : "Account"
    			},{
    			    name : "searchAutocomplete",
    			    value : "11"
    			}, {
    				name : "filter",
    			    value : "CONTROLLING_AREA_ID=%CA%"
    			}];
    
    			// act
    			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    			
                // assert
    			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
    			expect(oResponseBody).toBeDefined();
    			expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(1);
    			expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES).toMatchData({
    			   ACCOUNT_ID: [testData.oAccountTestDataPlc.ACCOUNT_ID[0]],
    			   CONTROLLING_AREA_ID: [testData.oAccountTestDataPlc.CONTROLLING_AREA_ID[0]]
    			}, ["ACCOUNT_ID"]);
    		});
		
    		it('should not return duplicate entries when multiple filteres are used', function() {
    			// arrange
    			var aParams = [ {
    				name : "business_object",
    				value : "Account"
    			},{
    			    name : "searchAutocomplete",
    			    value : "Bilanz"
    			}, {
    				name : "filter",
    			    value : "CONTROLLING_AREA_ID=%CA%&ACCOUNT_ID=%1%"
    			}];
    
    			// act
    			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    			
                // assert
    			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
    			expect(oResponseBody).toBeDefined();
    			expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(2);
    			expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES).toMatchData({
    			   ACCOUNT_ID: [testData.oAccountTestDataPlc.ACCOUNT_ID[0], testData.oAccountTestDataPlc.ACCOUNT_ID[1]],
    			   CONTROLLING_AREA_ID: [testData.oAccountTestDataPlc.CONTROLLING_AREA_ID[0], testData.oAccountTestDataPlc.CONTROLLING_AREA_ID[1]]
    			}, ["ACCOUNT_ID"]);
    		});
		});
		
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("account", testData.oAccountTest);
				mockstar.insertTableData("account_text", testData.oAccountTextTest);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.initializeData();
			});
			
			it('should deactivate the current version of the removed account', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"DELETE":
                { 
                	"ACCOUNT_ENTITIES": [{
				        	"ACCOUNT_ID": "778",
	             			"CONTROLLING_AREA_ID" : "#CA1",
	             			"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
	                    }]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				var oTest = mockstar.execQuery("select * from {{account}} where ACCOUNT_ID = '778' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.ACCOUNT_ENTITIES[0]._VALID_FROM).toBe(oItemsPayload.DELETE.ACCOUNT_ENTITIES[0]._VALID_FROM);
				expect(oTest.columns._VALID_TO.rows[0]).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account for which  mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"DELETE":
                { 
                		"ACCOUNT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778"
	                    }]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account for which  mandatory fields are null', function() {
				// arrange
				let aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                let oItemsPayload = {"DELETE":
                { 
                		"ACCOUNT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778",
	                    	"CONTROLLING_AREA_ID": null,
	                    	"_VALID_FROM": null
	                    }]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account which is used in other business objects', function() {
				// arrange
				var oProcess = {
						"PROCESS_ID" : ["B1"],
						"CONTROLLING_AREA_ID": ["#CA1"],
						"ACCOUNT_ID": ["778"],
						"_VALID_FROM": ["2015-01-01T00:00:00.000Z"],
						"_VALID_TO": [null],
						"_SOURCE": [1],
						"_CREATED_BY": [mockstar.currentUser]
				};
				mockstar.insertTableData("process", oProcess);
				
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"DELETE":
                { 
                	"ACCOUNT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778",
	             			"CONTROLLING_AREA_ID" : "#CA1",
	             			"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
	                    }]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Process);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete an account that does not exist', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Account"
            		}];
            	var oItemsPayload = {"DELETE":
            	{ 
            		 "ACCOUNT_ENTITIES": [{
				        	"ACCOUNT_ID": "123",
	             			"CONTROLLING_AREA_ID" : "#CA1",
	             			"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
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
			
			it('should deactivate the current version of the removed account and corresponding account ranges if ACCOUNT_ID is not used in another bussiness object', function() {
				// arrange
				var oAccountGroupTest = {
						"ACCOUNT_GROUP_ID" : [700, 800],
						"CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
						"COST_PORTION" : [7, 8],
						"_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
						"_VALID_TO" : [null, null],
						"_SOURCE" : [1, 1],
						"_CREATED_BY" : [mockstar.currentUser, mockstar.currentUser]
				};
				var oAccountGroupTextTest = {
						"ACCOUNT_GROUP_ID" : [700, 700, 800, 800],
						"LANGUAGE" : ["EN", "DE", "EN", "DE"],
						"ACCOUNT_GROUP_DESCRIPTION" : ["EN Test 700", "DE Test 700", "EN Test 800", "DE Test 800"],
						"_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
						"_VALID_TO" : [null, null, null, null],
						"_SOURCE" : [1, 1, 1, 1],
						"_CREATED_BY" : [mockstar.currentUser, mockstar.currentUser, mockstar.currentUser, mockstar.currentUser]
				};
				var oAccountRangeTest = {
						"FROM_ACCOUNT_ID": ["777", "778"],
						"TO_ACCOUNT_ID" : ["777", "778"],
						"ACCOUNT_GROUP_ID" : [700, 800],
						"_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
						"_VALID_TO" : ["2015-01-02T00:00:00.000Z", "2015-01-02T00:00:00.000Z"],
						"_SOURCE" : [1, 1],
						"_CREATED_BY" : [mockstar.currentUser, mockstar.currentUser]
				};
				mockstar.insertTableData("account_group", oAccountGroupTest);
				mockstar.insertTableData("account_group_text", oAccountGroupTextTest);
				mockstar.insertTableData("account_account_group", oAccountRangeTest);
				
				var aParams = [ {
            			name : "business_object",
            			value : "Account"
            		}];
            	var oItemsPayload = {"DELETE":
            	{ 
            			 "ACCOUNT_ENTITIES" : [{
	                    	"ACCOUNT_ID" : "778",
	             			"CONTROLLING_AREA_ID" : "#CA1",
	             			"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
	                    }]
            	}}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
				var oTest = mockstar.execQuery("select * from {{account}} where ACCOUNT_ID = '778' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.ACCOUNT_ENTITIES[0]._VALID_FROM).toBe(oItemsPayload.DELETE.ACCOUNT_ENTITIES[0]._VALID_FROM);
				expect(oTest.columns._VALID_TO.rows[0]).not.toBe(null);
				var oTestRange = mockstar.execQuery("select * from {{account_account_group}} where FROM_ACCOUNT_ID = '778' and TO_ACCOUNT_ID = '778' and _VALID_FROM = '2015-01-01T00:00:00.000Z'");
				expect(oTestRange.columns._VALID_TO.rows[0]).not.toBe(null);
			});
		});
		
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.insertTableData("account_text", testData.oAccountTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.initializeData();
			});
			
			it('should insert account and account_text', function() {
				// arrange
				var oTestBefore = mockstar.execQuery("select * from {{account}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_ENTITIES" : [{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "EN",
							"ACCOUNT_DESCRIPTION" : "EN Test 7"
						  },{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 7"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "EN",
							"ACCOUNT_DESCRIPTION" : "EN Test 8"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 8"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account}}");
				var oTestText = mockstar.execQuery("select * from {{account_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ACCOUNT_ID.rows.length).toBe(oTestBefore.columns.ACCOUNT_ID.rows.length + 2);
				expect(oTestText.columns.ACCOUNT_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_ID.rows.length + 4);
				expect(oResponseBody.body.masterdata.CREATE.ACCOUNT_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.ACCOUNT_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for an account that does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_ENTITIES" : [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "701",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 701"
						  },{
							"ACCOUNT_ID" : "702",
							"LANGUAGE" : "EN",
							"CONTROLLING_AREA_ID" : "#CA1",
							"ACCOUNT_DESCRIPTION" : "EN Test 702"
						}]		
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for an account that does not exists(same account id, different controlling areas)', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "#CA2"
						}],
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 700"
						  },{
							"ACCOUNT_ID" : "700",
							"LANGUAGE": "EN",
							"CONTROLLING_AREA_ID" : "#CA1",
							"ACCOUNT_DESCRIPTION" : "EN Test 700"
						}]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
			    expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "5455"
						}]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert an account that already exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID": "11000",
							"CONTROLLING_AREA_ID" : '#CA1'
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert an account text that already exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"ACCOUNT_TEXT_ENTITIES": [{
							"ACCOUNT_ID": "11000",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "Bilanz Anlagen"
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an account for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                	 "ACCOUNT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778"
	                    }]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
		});
		
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.insertTableData("account_text", testData.oAccountTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.initializeData();
			});
			
			it('should insert account and account_text', function() {
				// arrange
				var oTestBefore = mockstar.execQuery("select * from {{account}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_text}}");
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACCOUNT_ENTITIES" : [{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1"
						}],
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "EN",
							"ACCOUNT_DESCRIPTION" : "EN Test 7"
						  },{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 7"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "EN",
							"ACCOUNT_DESCRIPTION" : "EN Test 8"
						  },{
							"ACCOUNT_ID" : "778",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 8"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{account}}");
				var oTestText = mockstar.execQuery("select * from {{account_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ACCOUNT_ID.rows.length).toBe(oTestBefore.columns.ACCOUNT_ID.rows.length + 2);
				expect(oTestText.columns.ACCOUNT_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_ID.rows.length + 4);
				expect(oResponseBody.body.masterdata.UPSERT.ACCOUNT_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.ACCOUNT_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should update account and account_text', function() {
				// arrange
				var oTestMainBefore = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '11000' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '11000' AND CONTROLLING_AREA_ID = '#CA1'");
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                	    "ACCOUNT_ENTITIES" : [],
	                    "ACCOUNT_TEXT_ENTITIES" : [{
	                    	"ACCOUNT_ID" : "11000",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "EN",
	                    	"ACCOUNT_DESCRIPTION" : "EN Test Updated"
	                      },{
	                    	"ACCOUNT_ID" : "11000",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "DE",
	                    	"ACCOUNT_DESCRIPTION" : "DE Test Updated"
	                    }]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				
				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '11000' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestText = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '11000' AND CONTROLLING_AREA_ID = '#CA1'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.ACCOUNT_ID.rows.length).toBe(oTestMainBefore.columns.ACCOUNT_ID.rows.length);
				expect(oTestText.columns.ACCOUNT_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_ID.rows.length + 2);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for an account that does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "701",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 701"
						  },{
							"ACCOUNT_ID" : "702",
							"LANGUAGE" : "EN",
							"CONTROLLING_AREA_ID" : "#CA1",
							"ACCOUNT_DESCRIPTION" : "EN Test 702"
						}]		
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for an account that does not exists(same account id, different controlling areas)', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "#CA2"
						}],
						"ACCOUNT_TEXT_ENTITIES" : [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "#CA1",
							"LANGUAGE" : "DE",
							"ACCOUNT_DESCRIPTION" : "DE Test 700"
						  },{
							"ACCOUNT_ID" : "700",
							"LANGUAGE": "EN",
							"CONTROLLING_AREA_ID" : "#CA1",
							"ACCOUNT_DESCRIPTION" : "EN Test 700"
						}]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
			    expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID" : "700",
							"CONTROLLING_AREA_ID" : "5455"
						}]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert an account for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                	 "ACCOUNT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778"
	                    }]	
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
		});
		
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("account", testData.oAccountTest);
				mockstar.insertTableData("account_text", testData.oAccountTextTest);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.initializeData();
			});
			
			it('should deactivate the current version of the updated account texts and create a new version', function() {
				// arrange
				var oTestMainBefore = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                	"ACCOUNT_ENTITIES" : [],
	                    "ACCOUNT_TEXT_ENTITIES" : [{
	                    	"ACCOUNT_ID" : "777",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "EN",
	                    	"ACCOUNT_DESCRIPTION" : "EN Test Updated",
	                    	"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
	                      },{
	                    	"ACCOUNT_ID" : "777",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "DE",
	                    	"ACCOUNT_DESCRIPTION" : "DE Test Updated",
	                    	"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
	                    }]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				
				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestText = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.ACCOUNT_ID.rows.length).toBe(oTestMainBefore.columns.ACCOUNT_ID.rows.length + 1);
				expect(oTestText.columns.ACCOUNT_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_ID.rows.length + 2);
			});
			
			it('should deactivate the current version of the updated account and create a new version)', function() {
				// arrange
			    var oTestMainBefore = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                	"ACCOUNT_ENTITIES" : [{
							"ACCOUNT_ID" : "777",
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						}]
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{account}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				var oTestText = mockstar.execQuery("select * from {{account_text}} WHERE ACCOUNT_ID = '777' AND CONTROLLING_AREA_ID = '#CA1'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.ACCOUNT_ID.rows.length).toBe(oTestMainBefore.columns.ACCOUNT_ID.rows.length + 1);
			//	expect(oTestText.columns.ACCOUNT_ID.rows.length).toBe(oTestTextBefore.columns.ACCOUNT_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update an account text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                        "ACCOUNT_TEXT_ENTITIES": [{
	                    	"ACCOUNT_ID": "778",
	                    	"LANGUAGE": "EN",
	                    	"ACCOUNT_DESCRIPTION": "EN"
	                    }]	
                }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
						
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an account text and the account text is not available in system', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Account"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                        "ACCOUNT_TEXT_ENTITIES" : [{
	                    	"ACCOUNT_ID" : "777",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "EN",
	                    	"ACCOUNT_DESCRIPTION" : "EN Test 7 Updated",
	                    	"_VALID_FROM" : "2015-01-02T00:00:00.000Z"
	                      },{
	                    	"ACCOUNT_ID" : "777",
	                    	"CONTROLLING_AREA_ID" : "#CA1",
	                    	"LANGUAGE" : "DE",
	                    	"ACCOUNT_DESCRIPTION" : "DE Test 7 Updated",
	                    	"_VALID_FROM" : "2015-01-02T00:00:00.000Z"
	                    }]
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}