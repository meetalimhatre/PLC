var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.profitCenter-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead": "sap.plc.db.administration.procedures/p_profit_center_read"
				},
				substituteTables : {
					profit_center : {
						name : Resources["Profit_Center"].dbobjects.plcTable
					},
					gtt_profit_center: Resources["Profit_Center"].dbobjects.tempTable,
					profit_center_text : {
						name : Resources["Profit_Center"].dbobjects.plcTextTable
					},
					gtt_cost_center_text : Resources["Profit_Center"].dbobjects.tempTextTable,
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					project : {
						name : ProjectTables.project
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Profit_Center"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Profit_Center": procedureXsunit
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
	
		describe("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("profit_center", testData.oProfitCenterTestDataPlc);
				mockstar.insertTableData("profit_center_text", testData.oProfitCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should return valid profit center and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(3);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				},{
				    name : "filter",
				    value : "PROFIT_CENTER_ID=P3"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should return the valid entries with searchAutocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				},{
				    name : "filter",
				    value : "PROFIT_CENTER_ID=P3"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES[0]).toMatchData(
        	                    {'PROFIT_CENTER_ID': 'P3',
        	                     'CONTROLLING_AREA_ID' : '#CA2',
        	                     'PROFIT_CENTER_DESCRIPTION': null
                                }, ['PROFIT_CENTER_ID']);
			});
			
			it('should return the valid entries using searchAutocomplete and multimple filteres', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				},{
				    name : "filter",
				    value : "PROFIT_CENTER_ID=P1&CONTROLLING_AREA_ID=#CA1"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES[0]).toMatchData(
        	                    {'PROFIT_CENTER_ID': 'P1',
        	                     'CONTROLLING_AREA_ID' : '#CA1',
        	                     'PROFIT_CENTER_DESCRIPTION': null
                                }, ['PROFIT_CENTER_ID']);
			});
			
			it('should not return any entries if the searchAutocomplete doeas not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				},{
				    name : "filter",
				    value : "PROFIT_CENTER_ID=P1"
				},{
				    name : "searchAutocomplete",
				    value : "Xz"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(0);
              
			});
			
			
	
			it('should not return any entries for an invalid profit center (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				},{
				    name : "filter",
				    value : "PROFIT_CENTER_ID=PP"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.PROFIT_CENTER_TEXT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("profit_center", testData.oProfitCenterTestDataPlc);
				mockstar.insertTableData("profit_center_text", testData.oProfitCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should insert profit_center and profit_center_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{profit_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{profit_center_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : '#CA1'
												},{
													"PROFIT_CENTER_ID" : 'P5',
													"CONTROLLING_AREA_ID" : '#CA1'
												}],
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
												},{
													"PROFIT_CENTER_ID" : 'P5',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test2 EN',
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{profit_center}}");
				var oTestText = mockstar.execQuery("select * from {{profit_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROFIT_CENTER_ID.rows.length).toBe(oTesta.columns.PROFIT_CENTER_ID.rows.length + 2);
				expect(oTestText.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestTexta.columns.PROFIT_CENTER_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.PROFIT_CENTER_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.PROFIT_CENTER_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a profit center that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P123',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"PROFIT_CENTER_ID" : 'P123',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
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
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a profit center that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P1',
													"CONTROLLING_AREA_ID" : '#CA1'
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a profit center text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P3',
													"CONTROLLING_AREA_ID" : '#CA2',
													"LANGUAGE" : "EN",
													"PROFIT_CENTER_DESCRIPTION" : 'Updated profit center description'
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a profit center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P1'
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P1',
													"CONTROLLING_AREA_ID" : 'CCC1'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
		});	
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("profit_center", testData.oProfitCenterTestDataPlc);
				mockstar.insertTableData("profit_center_text", testData.oProfitCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should insert profit_center and profit_center_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{profit_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{profit_center_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : '#CA1'
												},{
													"PROFIT_CENTER_ID" : 'P5',
													"CONTROLLING_AREA_ID" : '#CA1'
												}],
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"PROFIT_CENTER_ID" : 'P4',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
												},{
													"PROFIT_CENTER_ID" : 'P5',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test2 EN',
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{profit_center}}");
				var oTestText = mockstar.execQuery("select * from {{profit_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PROFIT_CENTER_ID.rows.length).toBe(oTesta.columns.PROFIT_CENTER_ID.rows.length + 2);
				expect(oTestText.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestTexta.columns.PROFIT_CENTER_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.PROFIT_CENTER_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.PROFIT_CENTER_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a profit center that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P123',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"PROFIT_CENTER_ID" : 'P123',
													"CONTROLLING_AREA_ID" : "#CA1",
													"PROFIT_CENTER_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a profit center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P1'
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P1',
													"CONTROLLING_AREA_ID" : 'CCC1'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
			
			it('should deactivate the current version of the upserted profit center text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				var oTestTextBefore = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P3',
													"CONTROLLING_AREA_ID" : '#CA2',
													"LANGUAGE" : "EN",
													"PROFIT_CENTER_DESCRIPTION" : 'Updated profit center description',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				var oTestText = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.PROFIT_CENTER_ID.rows.length);
				expect(oTestText.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.PROFIT_CENTER_ID.rows.length + 1);
			});
		});	
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("profit_center", testData.oProfitCenterTestDataPlc);
				mockstar.insertTableData("profit_center_text", testData.oProfitCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed profit center', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : "P1",
													"CONTROLLING_AREA_ID" : "#CA1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.PROFIT_CENTER_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a profit center that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : "P1",
													"CONTROLLING_AREA_ID" : "#CA1",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z"
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a profit center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : "P1",
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
		});	
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("profit_center", testData.oProfitCenterTestDataPlc);
				mockstar.insertTableData("profit_center_text", testData.oProfitCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated profit center text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				var oTestTextBefore = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P3',
													"CONTROLLING_AREA_ID" : '#CA2',
													"LANGUAGE" : "EN",
													"PROFIT_CENTER_DESCRIPTION" : 'Updated profit center description',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				var oTestText = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.PROFIT_CENTER_ID.rows.length + 1);
				expect(oTestText.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.PROFIT_CENTER_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a profit center text and the profit center text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P3',
													"CONTROLLING_AREA_ID" : '#CA2',
													"LANGUAGE" : "EN",
													"PROFIT_CENTER_DESCRIPTION" : 'Updated profit center description',
													"_VALID_FROM" : '2015-02-01T15:39:09.691Z'
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
					
			it('should deactivate the current version of the updated profit center and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				//var oTestTextBefore = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROFIT_CENTER_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P3',
													"CONTROLLING_AREA_ID" : '#CA2',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{profit_center}} WHERE PROFIT_CENTER_ID = 'P3'");
				//var oTestText = mockstar.execQuery("select * from {{profit_center_text}} WHERE PROFIT_CENTER_ID = 'P3'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.PROFIT_CENTER_ID.rows.length + 1);
				//expect(oTestText.columns.PROFIT_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.PROFIT_CENTER_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a profit center text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Profit_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PROFIT_CENTER_TEXT_ENTITIES" : [{
													"PROFIT_CENTER_ID" : 'P123',
													"LANGUAGE" : "EN",
													"PROFIT_CENTER_DESCRIPTION" : 'Updated profit center description'
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
		});		
	}).addTags(["Administration_NoCF_Integration"]);
}