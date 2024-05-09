var _ = require("lodash");
var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources               = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.factory.process-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var mockstarRepl = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
		
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_process_read"
				},
				substituteTables : {
					process : {
						name : Resources["Process"].dbobjects.plcTable
					},
					process_text : {
						name : Resources["Process"].dbobjects.plcTextTable
					},
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					accounts : {
						name : Resources["Account"].dbobjects.plcTable
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					metadata :  {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestDataEn
					},
					csvPackage : testData.sCsvPackage
				}
			});
		
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Process"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Process": procedureXsunit
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
				mockstar.insertTableData("process", testData.oProcessTestDataPlc);
				mockstar.insertTableData("process_text", testData.oProcessTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("accounts", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			afterEach(function() {
				mockstar.cleanup();
			});
	
			it('should return all valid processes and texts', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(3);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		},{
            			name : "filter",
            			value : "CONTROLLING_AREA_ID=#CA2"
            		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(2);
			});
			
			it('should return the filtered entries with top parameter set to 1', function() {
				// arrange
				var iTop = 1;
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		},{
            			name : "filter",
            			value : "CONTROLLING_AREA_ID=#CA2"
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
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should not return not current values', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		},{
            			name : "filter",
            			value : "CONTROLLING_AREA_ID=#CA1"
            		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should not return entries when top parameter is set to 0', function() {
				// arrange
				var iTop = 0;
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
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
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should return valid values when skip parameter is set to 1', function() {
				// arrange
				var iSkip = 1;
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
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
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(2);
			});
	
	        it('should return valid values when skip and top parameters are set to 1', function() {
				// arrange
				var iSkip = 1;
				var iTop = 1;
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
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
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		},{
            			name : "filter",
            			value : "CONTROLLING_AREA_ID=000"
            		}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.PROCESS_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should return the valid busines processes that start with the string from autocomplete and are filtered by controlling area id', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [ {
            			name : "business_object",
            			value : "Process"
            		},{
            		    name : "filter",
            			value : "CONTROLLING_AREA_ID=#CA2"
            		},{
             		    name : "searchAutocomplete",
             		    value : "Process"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES).toMatchData({
        			   PROCESS_ID: [testData.oProcessTestDataPlc.PROCESS_ID[1], testData.oProcessTestDataPlc.PROCESS_ID[3]],
        			   CONTROLLING_AREA_ID: [testData.oProcessTestDataPlc.CONTROLLING_AREA_ID[1], testData.oProcessTestDataPlc.CONTROLLING_AREA_ID[3]],
        			   ACCOUNT_ID: [testData.oProcessTestDataPlc.ACCOUNT_ID[1], testData.oProcessTestDataPlc.ACCOUNT_ID[3]],
        			   COMMENT: [testData.oProcessTestDataPlc.COMMENT[1], testData.oProcessTestDataPlc.COMMENT[3]]
        			}, ["PROCESS_ID"]);
			});
			
			it('should not return duplicate entries when multiple filteres are used', function() {
				// arrange
				var sLanguage = 'EN';
				var aParams = [{
            			name : "business_object",
            			value : "Process"
            		},{
            		    name : "filter",
            			value : "CONTROLLING_AREA_ID=#CA2&ACCOUNT_ID=A2"
            		},{
             		    name : "searchAutocomplete",
             		    value : "Process"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.PROCESS_ENTITIES).toMatchData({
        			   PROCESS_ID: [testData.oProcessTestDataPlc.PROCESS_ID[1], testData.oProcessTestDataPlc.PROCESS_ID[3]],
        			   CONTROLLING_AREA_ID: [testData.oProcessTestDataPlc.CONTROLLING_AREA_ID[1], testData.oProcessTestDataPlc.CONTROLLING_AREA_ID[3]],
        			   ACCOUNT_ID: [testData.oProcessTestDataPlc.ACCOUNT_ID[1], testData.oProcessTestDataPlc.ACCOUNT_ID[3]],
        			   COMMENT: [testData.oProcessTestDataPlc.COMMENT[1], testData.oProcessTestDataPlc.COMMENT[3]]
        			}, ["PROCESS_ID"]);
			});
		});

	    describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("process", testData.oProcessTestDataPlc);
				mockstar.insertTableData("process_text", testData.oProcessTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("accounts", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed process', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				var oTestBefore = mockstar.execQuery("select * from {{process}}");

				var oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : "#CA2",
													"ACCOUNT_ID" : "A2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    var oTestAfter = mockstar.execQuery("select * from {{process}}");

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length);
                expect(oResponseBody.body.masterdata.DELETE.PROCESS_ENTITIES[0]._VALID_TO).not.toBe(null);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a process that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
												    "PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA2",
													"ACCOUNT_ID" : "A2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
			    expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a process for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B2"
												}]
                    				        }
                    				};

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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a process for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				let oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : null,
													"_VALID_FROM": null
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});	
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA2",
													"ACCOUNT_ID" : "A2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PROCESS_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
		});
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("process", testData.oProcessTestDataPlc);
				mockstar.insertTableData("process_text", testData.oProcessTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("accounts", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert process and process_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{process}}");
				var oTestTexta = mockstar.execQuery("select * from {{process_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1"
												},{
													"PROCESS_ID" : "B23",
													"CONTROLLING_AREA_ID" : "#CA1"
												}],
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "DE",
													"PROCESS_DESCRIPTION" : "Process test DE"
												},{
													"PROCESS_ID" : "B23",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "DE",
													"PROCESS_DESCRIPTION" : "Process test DE"
												}]
                    				        }
                    				};
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{process}}");
				var oTestText = mockstar.execQuery("select * from {{process_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROCESS_ID.rows.length).toBe(oTesta.columns.PROCESS_ID.rows.length + 2);
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTexta.columns.PROCESS_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.PROCESS_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should insert process together with the texts in the maintained languages', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{process}}");
				var oTestTexta = mockstar.execQuery("select * from {{process_text}}");

				var oItemsPayload = {"CREATE":
                    				       { 
											"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B25",
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "11000",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"COMMENT": "Comment 1"
													
												},{
													"PROCESS_ID" : "B26",
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "11000",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"COMMENT": "Comment 2"
												}],
											"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B25",
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROCESS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
												    "PROCESS_ID" : "B26",
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROCESS_DESCRIPTION" : "Test 2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{process}}");
				var oTestText = mockstar.execQuery("select * from {{process_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROCESS_ID.rows.length).toBe(oTesta.columns.PROCESS_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTest.columns.ACCOUNT_ID.rows.length).toBe(oTesta.columns.ACCOUNT_ID.rows.length + 2);
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTexta.columns.PROCESS_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.CREATE.PROCESS_ENTITIES[0]._VALID_FROM).not.toBe(null);
				expect(oResponseBody.body.masterdata.CREATE.PROCESS_ENTITIES[0]._VALID_TO).toBe(null);
				
                var oProcessActual = _.omit(oResponseBody.body.masterdata.CREATE.PROCESS_ENTITIES[0], ["DELETED_FROM_SOURCE", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); 
                var oProcessExpected = _.omit(oItemsPayload.CREATE.PROCESS_ENTITIES[0],["_VALID_FROM"]);
				expect(_.isEqual(oProcessActual, oProcessExpected)).toBe(true);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a process that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B33",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B44",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												}]
                    				        }
                    				};

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
			 
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert a process with a controlling area that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_ENTITIES" : [{
												    "PROCESS_ID" : "#B11",
													"CONTROLLING_AREA_ID" : "#11C",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
                expect(oResponseBody.head.messages[0].details.businessObj.toUpperCase()).toBe("CONTROLLING_AREA");		
			});

			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a process that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : "#CA2",
													"_VALID_FROM": '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a process text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN",
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a process for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA2",
													"ACCOUNT_ID" : "A2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PROCESS_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a process for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PROCESS_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
			    mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("process", testData.oProcessTestDataPlc);
				mockstar.insertTableData("process_text", testData.oProcessTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("accounts", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert Process and Process_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{process}}");
				var oTestTexta = mockstar.execQuery("select * from {{process_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1"
												},{
													"PROCESS_ID" : "B23",
													"CONTROLLING_AREA_ID" : "#CA1"
												}],
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "DE",
													"PROCESS_DESCRIPTION" : "Process test DE"
												},{
													"PROCESS_ID" : "B23",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "DE",
													"PROCESS_DESCRIPTION" : "Process test DE"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{process}}");
				var oTestText = mockstar.execQuery("select * from {{process_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROCESS_ID.rows.length).toBe(oTesta.columns.PROCESS_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTexta.columns.PROCESS_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.PROCESS_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should insert Process and Process_text complete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{process}}");
				var oTestTexta = mockstar.execQuery("select * from {{process_text}}");

				var oItemsPayload = {"UPSERT":
                    				       { 
											"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B25",
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "11000",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"COMMENT": "Comment 1"
													
												},{
													"PROCESS_ID" : "B26",
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "11000",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"COMMENT": "Comment 2"
												}],
											"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B25",
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROCESS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
												    "PROCESS_ID" : "B26",
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROCESS_DESCRIPTION" : "Test 2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{process}}");
				var oTestText = mockstar.execQuery("select * from {{process_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROCESS_ID.rows.length).toBe(oTesta.columns.PROCESS_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTest.columns.ACCOUNT_ID.rows.length).toBe(oTesta.columns.ACCOUNT_ID.rows.length + 2);

                var oProcessActual = _.omit(oResponseBody.body.masterdata.UPSERT.PROCESS_ENTITIES[0], ["DELETED_FROM_SOURCE", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]); 
                var oProcessExpected = _.omit(oItemsPayload.UPSERT.PROCESS_ENTITIES[0],["_VALID_FROM"]);
				expect(_.isEqual(oProcessActual, oProcessExpected)).toBe(true);
				
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTexta.columns.PROCESS_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.UPSERT.PROCESS_ENTITIES[0]._VALID_FROM).not.toBe(null);
				expect(oResponseBody.body.masterdata.UPSERT.PROCESS_ENTITIES[0]._VALID_TO).toBe(null);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a Process that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B33",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												},{
													"PROCESS_ID" : "B44",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN"
												}]
                    				        }
                    				};

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
				expect(oResponseBody.head.messages[2].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oResponseBody.head.messages[2].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROCESS_ENTITIES" : [{
													
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PROCESS_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should deactivate the current version of the upserted process text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{process}} WHERE PROCESS_ID = 'B2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{process_text}} WHERE PROCESS_ID = 'B2'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN upsert"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{process}} WHERE PROCESS_ID = 'B2'");
				var oTestText = mockstar.execQuery("select * from {{process_text}} WHERE PROCESS_ID = 'B2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.PROCESS_ID.rows.length).toBe(oTestMainBefore.columns.PROCESS_ID.rows.length);
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTextBefore.columns.PROCESS_ID.rows.length + 1);
			});
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("process", testData.oProcessTestDataPlc);
				mockstar.insertTableData("process_text", testData.oProcessTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("accounts", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated process text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{process}} WHERE PROCESS_ID = 'B2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{process_text}} WHERE PROCESS_ID = 'B2'");
				
					var oItemsPayload = {"UPDATE":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"CONTROLLING_AREA_ID" : "#CA2",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN update",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{process}} WHERE PROCESS_ID = 'B2'");
				var oTestText = mockstar.execQuery("select * from {{process_text}} WHERE PROCESS_ID = 'B2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.PROCESS_ID.rows.length).toBe(oTestTextBefore.columns.PROCESS_ID.rows.length + 1);
			});
				
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a process text and the process text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B22",
													"CONTROLLING_AREA_ID" : "#CA1",
													"LANGUAGE" : "EN",
													"PROCESS_DESCRIPTION" : "Process test EN",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a process text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROCESS_TEXT_ENTITIES" : [{
													"PROCESS_ID" : "B2",
													"PROCESS_DESCRIPTION" : "Process test EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("LANGUAGE");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
			
			it('should throw exception (GENERAL_NOT_CURRENT_ERROR) when try to update a process text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : "B1",
													"CONTROLLING_AREA_ID" : "#CA1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});		
		});	
	}).addTags(["Administration_NoCF_Integration"]);
}