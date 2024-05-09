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
const TestDataUtility        = require("../../../../testtools/testDataUtility").TestDataUtility;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.factory.businessArea-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
			
		beforeOnce(function() {
			
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_business_area_read"
				},
				substituteTables : {
					business_area : {
						name : Resources["Business_Area"].dbobjects.plcTable
					},
					gtt_business_area: Resources["Business_Area"].dbobjects.tempTable,
					business_area_text : {
						name : Resources["Business_Area"].dbobjects.plcTextTable
					},
					gtt_business_area_text : Resources["Business_Area"].dbobjects.tempTextTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Business_Area"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Business_Area": procedureXsunit
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
				mockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
				mockstar.insertTableData("business_area_text", testData.oBusinessAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return all valid business areas and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(3);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				},{
				    name : "filter",
				    value : "BUSINESS_AREA_ID=B1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should return the filtered entries using autocomplete', function() {

				// arrange
				const aParams = [ {
					name : "business_object",
					value : "Business_Area"
				},{
				    name : "searchAutocomplete",
				    value : "B"
				}, {
				    name : "filter",
				    value : "BUSINESS_AREA_ID=B1"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                const oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid business area (filter)', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				},{
				    name : "filter",
				    value : "BUSINESS_AREA_ID=#B1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.BUSINESS_AREA_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should not return duplicate entries when multiple filteres are used', function() {
    			// arrange
    			var aParams = [ {
    				name : "business_object",
    				value : "Business_Area"
    			},{
    			    name : "searchAutocomplete",
    			    value : "B"
    			}, {
    				name : "filter",
    			    value : "BUSINESS_AREA_ID=B1&_SOURCE=1"
    			}];
    
    			// act
    			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    			
                // assert
    			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
    			expect(oResponseBody).toBeDefined();
    			expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(1);
    			expect(oResponseBody.body.masterdata.BUSINESS_AREA_ENTITIES).toMatchData({
        			   BUSINESS_AREA_ID: [testData.oBusinessAreaTestDataPlc.BUSINESS_AREA_ID[0]]
        			}, ["BUSINESS_AREA_ID"]);
    		});
		});
		
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
				mockstar.insertTableData("business_area_text", testData.oBusinessAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed business area', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"BUSINESS_AREA_ENTITIES": [{
													"BUSINESS_AREA_ID" : "B1",
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
                expect(oResponseBody.body.masterdata.DELETE.BUSINESS_AREA_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a business area for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"BUSINESS_AREA_ENTITIES": [{
													"BUSINESS_AREA_ID" : "B1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a business area that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"BUSINESS_AREA_ENTITIES": [{
													"BUSINESS_AREA_ID" : "B1",
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
		});
		
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
				mockstar.insertTableData("business_area_text", testData.oBusinessAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert business_area and business_area_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{business_area}}");
				var oTestTexta = mockstar.execQuery("select * from {{business_area_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "INS1"
												},{
													"BUSINESS_AREA_ID" : "INS2"
												}],
												"BUSINESS_AREA_TEXT_ENTITIES": [{
													"BUSINESS_AREA_ID" : "INS1",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"BUSINESS_AREA_ID" : "INS1",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"BUSINESS_AREA_ID" : "INS2",
													"BUSINESS_AREA_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" :"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{business_area}}");
				var oTestText = mockstar.execQuery("select * from {{business_area_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.BUSINESS_AREA_ID.rows.length).toBe(oTesta.columns.BUSINESS_AREA_ID.rows.length + 2);
				expect(oTestText.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestTexta.columns.BUSINESS_AREA_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.BUSINESS_AREA_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.BUSINESS_AREA_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a business area for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
						//							"BUSINESS_AREA_ID" : ""
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("BUSINESS_AREA_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert a business area text for a business area that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B123",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN",
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
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			});

			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a business area that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1"
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a business area text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN",
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
		});
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
				mockstar.insertTableData("business_area_text", testData.oBusinessAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert business_area and business_area_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{business_area}}");
				var oTestTexta = mockstar.execQuery("select * from {{business_area_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "INS1"
												},{
													"BUSINESS_AREA_ID" : "INS2"
												}],
												"BUSINESS_AREA_TEXT_ENTITIES": [{
													"BUSINESS_AREA_ID" : "INS1",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"BUSINESS_AREA_ID" : "INS1",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"BUSINESS_AREA_ID" : "INS2",
													"BUSINESS_AREA_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" :"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{business_area}}");
				var oTestText = mockstar.execQuery("select * from {{business_area_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.BUSINESS_AREA_ID.rows.length).toBe(oTesta.columns.BUSINESS_AREA_ID.rows.length + 2);
				expect(oTestText.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestTexta.columns.BUSINESS_AREA_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.BUSINESS_AREA_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.BUSINESS_AREA_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should deactivate the current version of the upserted business area text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"BUSINESS_AREA_DESCRIPTION" : "Updated business areas description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestText = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestMainBefore.columns.BUSINESS_AREA_ID.rows.length);
				expect(oTestText.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestTextBefore.columns.BUSINESS_AREA_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a business area for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("BUSINESS_AREA_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert a business area text for a business area that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B123",
													"BUSINESS_AREA_DESCRIPTION" : "Test1 EN",
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
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			});
			
		});
		
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("business_area", testData.oBusinessAreaTestDataPlc);
				mockstar.insertTableData("business_area_text", testData.oBusinessAreaTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated business area text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"BUSINESS_AREA_DESCRIPTION" : "Updated business areas description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestText = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestMainBefore.columns.BUSINESS_AREA_ID.rows.length + 1);
				expect(oTestText.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestTextBefore.columns.BUSINESS_AREA_ID.rows.length + 1);
			});
	
			it('should deactivate the current version of the updated business area and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"BUSINESS_AREA_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{business_area}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oTestText = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestMainBefore.columns.BUSINESS_AREA_ID.rows.length + 1);
				//expect(oTestText.columns.BUSINESS_AREA_ID.rows.length).toBe(oTestTextBefore.columns.BUSINESS_AREA_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a business area text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"BUSINESS_AREA_DESCRIPTION" : "Updated business areas description"
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a business area text and the business area is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				var oTestTexta = mockstar.execQuery("select * from {{business_area_text}} WHERE BUSINESS_AREA_ID = 'B1'");
				var oItemsPayload = {"UPDATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "BBB",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"BUSINESS_AREA_DESCRIPTION" : "Updated business areas description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};
				mockstar.clearTable("business_area");
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});	
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a business area text and business area text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Business_Area"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"BUSINESS_AREA_TEXT_ENTITIES" : [{
													"BUSINESS_AREA_ID" : "B1",
													"_VALID_FROM" : "2015-05-01T15:39:09.691Z",
													"BUSINESS_AREA_DESCRIPTION" : "Updated business areas description",
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
		});
	}).addTags(["Administration_NoCF_Integration"]);
}