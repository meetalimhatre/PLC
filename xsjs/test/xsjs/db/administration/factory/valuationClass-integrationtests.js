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
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.valuationClass-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_valuation_class_read"
				},
				substituteTables : {
					valuation_class : {
						name : Resources["Valuation_Class"].dbobjects.plcTable
					},
					gtt_valuation_class: Resources["Valuation_Class"].dbobjects.tempTable,
					gtt_valuation_class_text: Resources["Valuation_Class"].dbobjects.tempTextTable,
					valuation_class_text : {
						name : Resources["Valuation_Class"].dbobjects.plcTextTable
					},
					material_plant : Resources["Material_Plant"].dbobjects.plcTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Valuation_Class"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Valuation_Class": procedureXsunit
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
				mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("valuation_class_text", testData.oValuationClassTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid valuation class and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_ENTITIES.length).toBe(2);
			});

			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				},{
				    name : "filter",
				    value : "VALUATION_CLASS_ID=V1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_TEXT_ENTITIES.length).toBe(1);
			});

			it('should return the valid autocomplete entry', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				},{
					name : "top",
					value : 100 
				},{
				    name : "searchAutocomplete",
				    value : "V2"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid vendor (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				},{
				    name : "filter",
				    value : "VALUATION_CLASS_ID=VV"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.VALUATION_CLASS_TEXT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("valuation_class_text", testData.oValuationClassTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed valuation class', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V1",
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
                expect(oResponseBody.body.masterdata.DELETE.VALUATION_CLASS_ENTITIES[0]._VALID_TO).not.toBe(null);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a valuation class that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V1",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a valuation class which is used in other business objects', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.MaterialPlant);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a valuation class for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VALUATION_CLASS_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});			
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("valuation_class_text", testData.oValuationClassTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert valuation_class and valuation_class_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{valuation_class}}");
				var oTestTexta = mockstar.execQuery("select * from {{valuation_class_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1"
												},{
													"VALUATION_CLASS_ID" : "INS2"
												}],
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"VALUATION_CLASS_ID" : "INS2",
													"VALUATION_CLASS_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{valuation_class}}");
				var oTestText = mockstar.execQuery("select * from {{valuation_class_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.VALUATION_CLASS_ID.rows.length).toBe(oTesta.columns.VALUATION_CLASS_ID.rows.length + 2);
				expect(oTestText.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestTexta.columns.VALUATION_CLASS_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.VALUATION_CLASS_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a valuation class that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
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

			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a valuation class that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V1"
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a valuation class text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
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

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a valuation class for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VALUATION_CLASS_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("valuation_class_text", testData.oValuationClassTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert valuation_class and valuation_class_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{valuation_class}}");
				var oTestTexta = mockstar.execQuery("select * from {{valuation_class_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1"
												},{
													"VALUATION_CLASS_ID" : "INS2"
												}],
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"VALUATION_CLASS_ID" : "INS2",
													"VALUATION_CLASS_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{valuation_class}}");
				var oTestText = mockstar.execQuery("select * from {{valuation_class_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.VALUATION_CLASS_ID.rows.length).toBe(oTesta.columns.VALUATION_CLASS_ID.rows.length + 2);
				expect(oTestText.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestTexta.columns.VALUATION_CLASS_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.VALUATION_CLASS_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a valuation class that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"VALUATION_CLASS_ID" : "INS1",
													"VALUATION_CLASS_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
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

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a valuation class for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"VALUATION_CLASS_ENTITIES" : [{
													
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VALUATION_CLASS_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should deactivate the current version of the upsrted valuation class text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{valuation_class}} WHERE VALUATION_CLASS_ID = 'V2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{valuation_class_text}} WHERE VALUATION_CLASS_ID = 'V2'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"VALUATION_CLASS_DESCRIPTION" : "Updated valuation class description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{valuation_class}} WHERE VALUATION_CLASS_ID = 'V2'");
				var oTestText = mockstar.execQuery("select * from {{valuation_class_text}} WHERE VALUATION_CLASS_ID = 'V2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestMainBefore.columns.VALUATION_CLASS_ID.rows.length);
				expect(oTestText.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestTextBefore.columns.VALUATION_CLASS_ID.rows.length + 1);
			});
			
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("valuation_class_text", testData.oValuationClassTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated valuation class text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{valuation_class}} WHERE VALUATION_CLASS_ID = 'V2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{valuation_class_text}} WHERE VALUATION_CLASS_ID = 'V2'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"VALUATION_CLASS_DESCRIPTION" : "Updated valuation class description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{valuation_class}} WHERE VALUATION_CLASS_ID = 'V2'");
				var oTestText = mockstar.execQuery("select * from {{valuation_class_text}} WHERE VALUATION_CLASS_ID = 'V2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestMainBefore.columns.VALUATION_CLASS_ID.rows.length + 1);
				expect(oTestText.columns.VALUATION_CLASS_ID.rows.length).toBe(oTestTextBefore.columns.VALUATION_CLASS_ID.rows.length + 1);
			});
				
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a valuation class text and the valuation class text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V2",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z",
													"VALUATION_CLASS_DESCRIPTION" : "Updated valuation class description",
													"LANGUAGE" : "EN"
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a valuation class text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Valuation_Class"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VALUATION_CLASS_TEXT_ENTITIES" : [{
													"VALUATION_CLASS_ID" : "V2",
													"VALUATION_CLASS_DESCRIPTION" : "Updated valuation class description"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("LANGUAGE");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}
