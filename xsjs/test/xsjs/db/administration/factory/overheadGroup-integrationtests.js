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
	describe('xsjs.db.administration.overheadGroup-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_overhead_group_read"
				},
				substituteTables : {
					overhead_group : {
						name : Resources["Overhead_Group"].dbobjects.plcTable
					},
					gtt_overhead_group: Resources["Overhead_Group"].dbobjects.tempTable,
					overhead_group_text : {
						name : Resources["Overhead_Group"].dbobjects.plcTextTable
					},
					gtt_overhead_group_text : Resources["Overhead_Group"].dbobjects.tempTextTable,
					plant : {
						name : Resources["Plant"].dbobjects.plcTable
					},
					company_code : {
						name : Resources["Company_Code"].dbobjects.plcTable
					},
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					material_plant : Resources["Material_Plant"].dbobjects.plcTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Overhead_Group"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Overhead_Group": procedureXsunit
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
				mockstar.insertTableData("overhead_group", testData.oOverheadGroupTestDataPlc);
				mockstar.insertTableData("overhead_group_text", testData.oOverheadGroupTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return all valid overhead groups and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);


				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				//in overhead group tables are 3 valid entries, but only 2 are displayed because one of the plants is invalid
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(2);
			});
	
			it('should return the filtered entries using a single filter field', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				},{
				    name : "filter",
				    value : "PLANT_ID=PL1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_TEXT_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid controlling area (filter)', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=ZZZ"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should return the valid overhead groups that start with the string from autocomplete and are filtered by multiple fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				},{
				    name : "searchAutocomplete",
				    value : "O"
				}, {
					name : "filter",
				    value : "PLANT_ID=PL1&COMPANY_CODE_ID=CC1&CONTROLLING_AREA_ID=1000"	
				}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES).toMatchData({
                   OVERHEAD_GROUP_ID: [testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]],
                   PLANT_ID: [testData.oOverheadGroupTestDataPlc.PLANT_ID[0]],
     			}, ["OVERHEAD_GROUP_ID"]);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES).toMatchData({
                	PLANT_ID: [testData.oPlantTestDataPlc.PLANT_ID[0]],
                	COMPANY_CODE_ID: [testData.oPlantTestDataPlc.COMPANY_CODE_ID[0]],
      			}, ["PLANT_ID"]);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES).toMatchData({
                	COMPANY_CODE_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]],
                	CONTROLLING_AREA_ID: [testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[0]],
      			}, ["COMPANY_CODE_ID"]);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES).toMatchData({
                	CONTROLLING_AREA_ID: [testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3]],
                	CONTROLLING_AREA_CURRENCY_ID: [testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_CURRENCY_ID[3]],
      			}, ["CONTROLLING_AREA_ID"]);
			});
			
			it('should not return the valid overhead groups when wrong filter values are used - controlling area id in this case', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				},{
				    name : "searchAutocomplete",
				    value : "O"
				}, {
					name : "filter",
				    value : "PLANT_ID=PL1&COMPANY_CODE_ID=CC1&CONTROLLING_AREA_ID=#CA1"	
				}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
		});
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("overhead_group", testData.oOverheadGroupTestDataPlc);
				mockstar.insertTableData("overhead_group_text", testData.oOverheadGroupTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert overhead_group and overhead_group_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{overhead_group}}");
				var oTestTexta = mockstar.execQuery("select * from {{overhead_group_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : 'PL1'
												},{
													"OVERHEAD_GROUP_ID" : 'O5',
													"PLANT_ID" : 'PL1'
												}],
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Test1 EN',
													"LANGUAGE" : "EN"
												},{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test1 DE',
													"LANGUAGE" : "DE"
												},{
													"OVERHEAD_GROUP_ID" : 'O5',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test2 EN',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{overhead_group}}");
				var oTestText = mockstar.execQuery("select * from {{overhead_group_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTesta.columns.OVERHEAD_GROUP_ID.rows.length + 2);
				expect(oTestText.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestTexta.columns.OVERHEAD_GROUP_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.OVERHEAD_GROUP_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.OVERHEAD_GROUP_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP" : 'O2',
													"PLANT_ID" : 'PL1'
												}],
												"OVERHEAD_GROUP_TEXT_ENTITIES" : []
                    				        }
                    				};
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("OVERHEAD_GROUP");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert overhead group for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("OVERHEAD_GROUP_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : '04',
													"PLANT_ID" : '###'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Plant);
			});
			
			it('should deactivate the current version of the upserted profit center text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O1',
													"PLANT_ID" : 'PL1',
													"LANGUAGE" : "EN",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Updated overhead group description'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestText = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestMainBefore.columns.OVERHEAD_GROUP_ID.rows.length);
				expect(oTestText.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.OVERHEAD_GROUP_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a overhead group that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Test1 EN',
													"LANGUAGE" : "EN"
												},{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test1 DE',
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
			
		});	
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("overhead_group", testData.oOverheadGroupTestDataPlc);
				mockstar.insertTableData("overhead_group_text", testData.oOverheadGroupTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert overhead_group and overhead_group_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{overhead_group}}");
				var oTestTexta = mockstar.execQuery("select * from {{overhead_group_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : 'PL1'
												},{
													"OVERHEAD_GROUP_ID" : 'O5',
													"PLANT_ID" : 'PL1'
												}],
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Test1 EN',
													"LANGUAGE" : "EN"
												},{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test1 DE',
													"LANGUAGE" : "DE"
												},{
													"OVERHEAD_GROUP_ID" : 'O5',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test2 EN',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{overhead_group}}");
				var oTestText = mockstar.execQuery("select * from {{overhead_group_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTesta.columns.OVERHEAD_GROUP_ID.rows.length + 2);
				expect(oTestText.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestTexta.columns.OVERHEAD_GROUP_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.OVERHEAD_GROUP_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.OVERHEAD_GROUP_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a overhead group that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O2',
													"PLANT_ID" : 'PL2'
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a overhead group text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O2',
													"PLANT_ID" : "PL2",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Test1 EN',
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
	
			it('should throw exception in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP" : 'O2',
													"PLANT_ID" : 'PL1'
												}],
												"OVERHEAD_GROUP_TEXT_ENTITIES" : []
                    				        }
                    				};
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("OVERHEAD_GROUP");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert overhead group for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
						//							"OVERHEAD_GROUP_ID" : '',
						//							"PLANT_ID" : ''
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("OVERHEAD_GROUP_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : '04',
													"PLANT_ID" : '###'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Plant);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a overhead group that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Test1 EN',
													"LANGUAGE" : "EN"
												},{
													"OVERHEAD_GROUP_ID" : 'O4',
													"PLANT_ID" : "PL1",
													"OVERHEAD_GROUP_DESCRIPTION": 'Test1 DE',
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
		});		
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("overhead_group", testData.oOverheadGroupTestDataPlc);
				mockstar.insertTableData("overhead_group_text", testData.oOverheadGroupTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);			
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed overhead group', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O2",
													"PLANT_ID" : "PL2",
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
                expect(oResponseBody.body.masterdata.DELETE.OVERHEAD_GROUP_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a overhead group which is used in other business objects', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				let oMaterialPlantTestDataPlc = {
					"MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4'],
					"PLANT_ID" : ['PL1','PL3', 'PL3', 'PL1'],
					"OVERHEAD_GROUP_ID": ['O1', 'O2', 'O1', 'O1'],
					"VALUATION_CLASS_ID": ['V1', 'V2', 'V2', null],
					"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
					"_VALID_TO" : [null, null,'2015-06-06T15:39:09.691Z', null ],
					"_SOURCE" : [1, 1, 1, 1],
					"_CREATED_BY" :['U000001', 'U000001', 'U000002', 'U000002']
			}
				
				mockstar.insertTableData("material_plant", oMaterialPlantTestDataPlc);
				var oItemsPayload = {"DELETE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O1',
													"PLANT_ID" : 'PL1',
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.MaterialPlant);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects.length).toBe(1);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a overhead group for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O1",
							//						"PLANT_ID" : ""
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a overhead group that does not exist/it is not valid', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O1",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-06-01T15:39:09.691Z"
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
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("overhead_group", testData.oOverheadGroupTestDataPlc);
				mockstar.insertTableData("overhead_group_text", testData.oOverheadGroupTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated profit center text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'O1',
													"PLANT_ID" : 'PL1',
													"LANGUAGE" : "EN",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Updated overhead group description',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestText = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestMainBefore.columns.OVERHEAD_GROUP_ID.rows.length + 1);
				expect(oTestText.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.OVERHEAD_GROUP_ID.rows.length + 1);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a overhead group text and the overhead group is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : 'OO',
													"PLANT_ID" : 'PL2',
													"LANGUAGE" : "EN",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Updated overhead group description',
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
	
			it('should deactivate the current version of the updated profit center and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"OVERHEAD_GROUP_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O1",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]	
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{overhead_group}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				var oTestText = mockstar.execQuery("select * from {{overhead_group_text}} WHERE OVERHEAD_GROUP_ID = 'O1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestMainBefore.columns.OVERHEAD_GROUP_ID.rows.length + 1);
				//expect(oTestText.columns.OVERHEAD_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.OVERHEAD_GROUP_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a overhead group text for which mandatory fields are missing', function() {
				
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O2",
													"PLANT_ID" : "PL2",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Updated overhead group description'
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a overhead group text and the overhead group text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Overhead_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"OVERHEAD_GROUP_TEXT_ENTITIES" : [{
													"OVERHEAD_GROUP_ID" : "O2",
													"PLANT_ID" : "PL2",
													"LANGUAGE" : "EN",
													"OVERHEAD_GROUP_DESCRIPTION" : 'Updated overhead group description',
													"_VALID_FROM" : "2015-05-01T15:39:09.691Z"
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