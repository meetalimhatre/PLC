var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

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
	describe('xsjs.db.administration.factory.materialAccountDetermination-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procMaterialAccountDeterminationRead" : "sap.plc.db.administration.procedures/p_material_account_determination_read"
				},
				substituteTables : {
					materialAccountDetermination : Resources["Material_Account_Determination"].dbobjects.plcTable,
					gttMaterialAccountDetermination: Resources["Material_Account_Determination"].dbobjects.tempTable,
					controllingArea : Resources["Controlling_Area"].dbobjects.plcTable, 
					currency : Resources["Currency"].dbobjects.plcTable,
					materialType : Resources["Material_Type"].dbobjects.plcTable,
					plant : Resources["Plant"].dbobjects.plcTable,
					valuationClass : Resources["Valuation_Class"].dbobjects.plcTable,
					account : Resources["Account"].dbobjects.plcTable,
					metadata : {
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Material_Account_Determination"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Material_Account_Determination": procedureXsunit
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
				mockstar.insertTableData("materialAccountDetermination", testData.oMaterialAccountDeterminationPlc);			
				mockstar.insertTableData("controllingArea", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("materialType", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("valuationClass", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid material accounts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES.length).toBe(2);
			
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=#CA1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES.length).toBe(2);
			});
	
			it('should not return any entries for an invalid material (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=AA"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.VALUATION_CLASS_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.ACCOUNT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("materialAccountDetermination", testData.oMaterialAccountDeterminationPlc);			
				mockstar.insertTableData("controllingArea", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("materialType", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("valuationClass", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate material accounts', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID": "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"_VALID_FROM" : "2015-06-19T12:27:23.197Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_TO).not.toBe(null);			
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material account determination for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID": "#CA4",
													"MATERIAL_TYPE_ID" : "MT1",
													"PLANT_ID" : "PL1",
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
	        it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material account determination for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				const oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID": null,
													"MATERIAL_TYPE_ID" : "MT1",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"_VALID_FROM" : null
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a material account determination that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID": "#CA4",
													"MATERIAL_TYPE_ID" : "MT1",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"_VALID_FROM" : "2015-06-19T12:00:23.197Z"
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
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currency", testData.oCurrencyGBP);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("controllingArea", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("materialType", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("valuationClass", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should create entries in materialAccountDetermination', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "21000"
												}] 
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should create entries in materialAccountDetermination with empty keys for MATERIAL_TYPE_ID, PLANT_ID, VALUATION_CLASS_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "21000"
												}] 
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
	
			it('should create entries in materialAccountDetermination when using Wildcards', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "*",
													"PLANT_ID" : "*",
													"VALUATION_CLASS_ID" : "*",
													"ACCOUNT_ID" : "11000"
												}]   
                    				        }
                    				}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
				
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("ACCOUNT_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				let oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
												    "CONTROLLING_AREA_ID": null,
												    "ACCOUNT_ID": null
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("ACCOUNT_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
	
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a material account determination that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "11000"
												},
												{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "11000"
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
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1T",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "11000"
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
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("currency", testData.oCurrencyGBP);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("controllingArea", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("materialType", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("valuationClass", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should create entries in materialAccountDetermination', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "21000"
												}] 
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should upsert entries in materialAccountDetermination with empty keys for MATERIAL_TYPE_ID, PLANT_ID, VALUATION_CLASS_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"ACCOUNT_ID" : "21000"
												}] 
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
	
			it('should create entries in materialAccountDetermination when using Wildcards', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "*",
													"PLANT_ID" : "*",
													"VALUATION_CLASS_ID" : "*",
													"ACCOUNT_ID" : "11000"
												}]   
                    				        }
                    				}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES[0]._VALID_FROM).not.toBe(null);
				
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a material for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("ACCOUNT_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1T",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "11000"
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
			
			it('should returned updated entities for material account determination', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oTestMainBefore = mockstar.execQuery("select * from {{materialAccountDetermination}} WHERE CONTROLLING_AREA_ID = '#CA1'");				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "21000"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{materialAccountDetermination}} WHERE CONTROLLING_AREA_ID = '#CA1'");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
			});			
		});
		
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("materialAccountDetermination", testData.oMaterialAccountDeterminationPlc);			
				mockstar.insertTableData("controllingArea", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyGBP);
				mockstar.insertTableData("currency", testData.oCurrencySecond);
				mockstar.insertTableData("materialType", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("valuationClass", testData.oValuationClassTestDataPlc);
				mockstar.insertTableData("account", testData.oAccountTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for material account determination', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oTestMainBefore = mockstar.execQuery("select * from {{materialAccountDetermination}} WHERE CONTROLLING_AREA_ID = '#CA1'");				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA1",
													"MATERIAL_TYPE_ID" : "MT2",
													"PLANT_ID" : "PL1",
													"VALUATION_CLASS_ID" : "V1",
													"ACCOUNT_ID" : "21000",
													"_VALID_FROM" : "2015-06-19T12:27:23.197Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{materialAccountDetermination}} WHERE CONTROLLING_AREA_ID = '#CA1'");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a material account determination for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "#CA4",
													"MATERIAL_TYPE_ID" : "MT1",
													"PLANT_ID" : "PL1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("ACCOUNT_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material account determination that is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Account_Determination"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : "TST2",
													"MATERIAL_TYPE_ID" : "TST2",
													"PLANT_ID" : "TST2",
													"VALUATION_CLASS_ID" : "TST2",
													"ACCOUNT_ID" : "TST2",
													"_VALID_FROM" : "2015-06-19T12:27:23.197Z"
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
	}).addTags(["Administration_NoCF_Integration"]);
}