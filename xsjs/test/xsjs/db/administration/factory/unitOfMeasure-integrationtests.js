var testData       = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;
var _ 			   = require("lodash");
var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var HelperObjectTypes = require("../../../../../lib/xs/util/constants").HelperObjectTypes
var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var TestDataUtility         = require("../../../../testtools/testDataUtility").TestDataUtility;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

var oUOM = {
	"UOM_ID": "#L",
	"DIMENSION_ID": "D2",
	"NUMERATOR": 1,
	"DENOMINATOR": 1,
	"EXPONENT_BASE10": 0,
	"SI_CONSTANT": 0,
	"_VALID_FROM": "2015-06-02T14:45:50.096Z",
	"_SOURCE": 1,
	"_CREATED_BY": "U000"
};
var oUOMText = {
	"UOM_ID" : "#L",
	"LANGUAGE" : "DE",
	"UOM_CODE" : "d",
	"UOM_DESCRIPTION" : "Test entry 2",
	"_VALID_FROM": "2015-06-02T14:45:50.096Z",
	"_SOURCE": 1,
	"_CREATED_BY": "U000"
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.db.administration.uom-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procUOMRead": "sap.plc.db.administration.procedures/p_unit_of_measures_read"
				},
				substituteTables : {
					uom : {
						name : Resources["Unit_Of_Measure"].dbobjects.plcTable
					},
					uom_text : {
						name : Resources["Unit_Of_Measure"].dbobjects.plcTextTable
					},
					gtt_uom: Resources["Unit_Of_Measure"].dbobjects.tempTable,
					gtt_uom_text : Resources["Unit_Of_Measure"].dbobjects.tempTextTable,
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguageTestData
					},
					dimension : {
						name : Resources["Dimension"].dbobjects.plcTable
					},
					material : {
						name : Resources["Material"].dbobjects.plcTable
					},
					material_plant : {
						name : Resources["Material_Plant"].dbobjects.plcTable
					},
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					item : {
						name : "sap.plc.db::basis.t_item"
					},
					item_temp : {
						name : "sap.plc.db::basis.t_item_temporary"
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					},
					variant_item : {
						name : "sap.plc.db::basis.t_variant_item"
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Unit_Of_Measure"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Unit_Of_Measure": procedureXsunit
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
				mockstar.insertTableData("uom", testData.oUOM);
				mockstar.insertTableData("uom_text", testData.oUOMText);
				mockstar.insertTableData("dimension", testData.oDimensionTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid unit of measures and unit of measure texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBe(2);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				},{
				    name : "filter",
				    value : "UOM_ID=#L"
				} ];
				
				mockstar.insertTableData("uom", oUOM);
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBe(1);
			});
			
			it('should not return any entries for an invalid uom (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				},{
				    name : "filter",
				    value : "UOM_ID=VV"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.UNIT_OF_MEASURE_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.UNIT_OF_MEASURE_TEXT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("uom", testData.oUOM);
				mockstar.insertTableData("uom_text", testData.oUOMText);
				mockstar.insertTableData("dimension", testData.oDimensionTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate unit of measures and unit of measure texts', function() {
				
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.UNIT_OF_MEASURE_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
	
			it('should throw an error (GENERAL_VALIDATION_ERROR) when UOM_ID is used in other business objects', function() {
				// arrange
				const oVariantItemTestData = new TestDataUtility(testData.oVariantItemTestData).build();
				oVariantItemTestData.QUANTITY_UOM_ID[0] = "TST";
				mockstar.insertTableData("variant_item", oVariantItemTestData);
				
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]
                    				        }
                    				};

				var oMaterial = {
						"MATERIAL_ID" : "MAT1",
						"BASE_UOM_ID" : "TST",
						"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
						"_VALID_TO" : null,
						"_SOURCE" : 1,
						"_CREATED_BY" :"U000001"
				};
				mockstar.insertTableData("material", oMaterial);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Material);		
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[1].businessObj).toBe(BusinessObjectTypes.VariantItem);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw an error (GENERAL_VALIDATION_ERROR) when UOM_ID is used in ITEM business object', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "H1",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]
                    				        }
                    				};

				var oUOM = {
						"UOM_ID": ["H1"],
						"DIMENSION_ID": ["D2"],
						"NUMERATOR": [1],
						"DENOMINATOR": [1],
						"EXPONENT_BASE10": [0],
						"SI_CONSTANT": [0],
						"_VALID_FROM": ["2015-06-02T14:45:50.096Z"],
						"_SOURCE": [1],
						"_CREATED_BY": ["U000"]
				};
				
				var oUOMText = {
						"UOM_ID": ["H1", "H1"],
						"LANGUAGE": ["EN", "DE"],
						"UOM_CODE": ["en", "de"],
						"UOM_DESCRIPTION": ["Test entry H", "Test entry H"],
						"_VALID_FROM": ["2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z"],
						"_SOURCE": [1,1],
						"_CREATED_BY": ["U000", "U000"]
				};

				var oItemTestData = new TestDataUtility(testData.oItemTestData).getObjects();
				var aPriceUnitUomId = ["H1","H1","H1","H1","H1"];
				_.each(oItemTestData,function(oItem,iIndex){
					oItem.PRICE_UNIT_UOM_ID = aPriceUnitUomId[iIndex];
				});

				mockstar.insertTableData("uom", oUOM);
				mockstar.insertTableData("uom_text", oUOMText);
				mockstar.insertTableData("item", oItemTestData);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Item);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);

			});
			
			it('should throw an error (GENERAL_VALIDATION_ERROR) when UOM_ID is Standard (PC/H/MIN)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "H",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												},
												{
													"UOM_ID" : "PC",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												},
												{
													"UOM_ID" : "MIN",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}]		
                    				        }
                    				};

				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toEqual(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.DEPENDENCY_ERROR);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toEqual(HelperObjectTypes.Standard);
				expect(oResponseBody.head.messages[1].code).toEqual(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.DEPENDENCY_ERROR);
				expect(oResponseBody.head.messages[1].details.validationObj.dependencyObjects[0].businessObj).toEqual(HelperObjectTypes.Standard);
				expect(oResponseBody.head.messages[2].code).toEqual(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[2].details.validationObj.validationInfoCode).toEqual(ValidationInfoCode.DEPENDENCY_ERROR);
				expect(oResponseBody.head.messages[2].details.validationObj.dependencyObjects[0].businessObj).toEqual(HelperObjectTypes.Standard);
			});
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views		
				mockstar.insertTableData("dimension", testData.oDimensionTestDataPlc);
				mockstar.insertTableData("uom", oUOM);
				mockstar.insertTableData("uom_text", oUOMText);
				mockstar.initializeData();
			});
	
			it('should create entries in uom and uom_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{uom}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{uom_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "D2",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
												}]         
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{uom}}");
				var oTestText = mockstar.execQuery("select * from {{uom_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.UOM_ID.rows.length).toBe(oTestBefore.columns.UOM_ID.rows.length + 1);
				expect(oTestText.columns.UOM_ID.rows.length).toBe(oTestTextBefore.columns.UOM_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.CREATE.UNIT_OF_MEASURE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.UNIT_OF_MEASURE_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw an error (GENERAL_ENTITY_NOT_FOUND_ERROR) when reference object dimension does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "DX",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Dimension);
			});
			
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a UOMs that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
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
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a UOM that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID": "#L",
													"DIMENSION_ID": "D2",
													"NUMERATOR": 1,
													"DENOMINATOR": 1,
													"EXPONENT_BASE10": 0,
													"SI_CONSTANT": 0
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "#L",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												},{
													"UOM_ID" : "#L",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												}]		        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);	
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a UOM text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "#L",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM": "#L",
													"DIMENSION_ID": "D2",
													"NUMERATOR": 1,
													"DENOMINATOR": 1,
													"EXPONENT_BASE10": 0,
													"SI_CONSTANT": 0
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("UOM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an UOM for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"DIMENSION_ID": "D2",
													"NUMERATOR": 1,
													"DENOMINATOR": 1,
													"EXPONENT_BASE10": 0,
													"SI_CONSTANT": 0
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												},
												{
													"UOM_ID" : "",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("UOM_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an UOM for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				let oItemsPayload = {"CREATE":
                    				       { 
											"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
												"UOM_ID" : null,
												"LANGUAGE" : "EN",
												"UOM_CODE" : "d",
												"UOM_DESCRIPTION" : "Test entry 2"
											}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("UOM_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views		
				mockstar.insertTableData("dimension", testData.oDimensionTestDataPlc);
				mockstar.insertTableData("uom", oUOM);
				mockstar.insertTableData("uom_text", oUOMText);
				mockstar.initializeData();
			});
	
			it('should create entries in uom and uom_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{uom}}");
				var oTestTextBefore = mockstar.execQuery("select * from {{uom_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "D2",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
												}]         
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{uom}}");
				var oTestText = mockstar.execQuery("select * from {{uom_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.UOM_ID.rows.length).toBe(oTestBefore.columns.UOM_ID.rows.length + 1);
				expect(oTestText.columns.UOM_ID.rows.length).toBe(oTestTextBefore.columns.UOM_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.UPSERT.UNIT_OF_MEASURE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.UNIT_OF_MEASURE_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw an error (GENERAL_ENTITY_NOT_FOUND_ERROR) when reference object dimension does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "DX",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Dimension);
			});
			
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a UOMs that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 1"	
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"	
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM": "#L",
													"DIMENSION_ID": "D2",
													"NUMERATOR": 1,
													"DENOMINATOR": 1,
													"EXPONENT_BASE10": 0,
													"SI_CONSTANT": 0
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("UOM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert an UOM for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"DIMENSION_ID": "D2",
													"NUMERATOR": 1,
													"DENOMINATOR": 1,
													"EXPONENT_BASE10": 0,
													"SI_CONSTANT": 0
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "",
													"LANGUAGE" : "EN",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												},
												{
													"UOM_ID" : "",
													"LANGUAGE" : "DE",
													"UOM_CODE" : "d",
													"UOM_DESCRIPTION" : "Test entry 2"
												}]	        
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("UOM_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should returned updated entities for uom and uom_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{uom}} WHERE UOM_ID = 'TST'");
				var oTestTextBefore = mockstar.execQuery("select * from {{uom_text}} WHERE UOM_ID = 'TST'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "D2",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
													"UOM_CODE" : "en",
													"UOM_DESCRIPTION" : "Updated entry 1",
													"_SOURCE": 1,
													"_CREATED_BY": "U000"
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
													"UOM_CODE" : "de",
													"UOM_DESCRIPTION" : "Updated entry 2",
													"_SOURCE": 1,
													"_CREATED_BY": "U000"
												}]     
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{uom}} WHERE UOM_ID = 'TST'");
				var oTestText = mockstar.execQuery("select * from {{uom_text}} WHERE UOM_ID = 'TST'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.UOM_ID.rows.length).toBe(oTestMainBefore.columns.UOM_ID.rows.length + 1);
				expect(oTestText.columns.UOM_ID.rows.length).toBe(oTestTextBefore.columns.UOM_ID.rows.length + 2);
			});
	
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("uom", testData.oUOM);
				mockstar.insertTableData("uom_text", testData.oUOMText);
				mockstar.insertTableData("dimension", testData.oDimensionTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should returned updated entities for uom and uom_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{uom}} WHERE UOM_ID = 'TST'");
				var oTestTextBefore = mockstar.execQuery("select * from {{uom_text}} WHERE UOM_ID = 'TST'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "TST",
													"DIMENSION_ID" : "D2",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
												}],
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
													"UOM_CODE" : "en",
													"UOM_DESCRIPTION" : "Updated entry 1",
													"_SOURCE": 1,
													"_CREATED_BY": "U000"
												},{
													"UOM_ID" : "TST",
													"LANGUAGE" : "DE",
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z",
													"UOM_CODE" : "de",
													"UOM_DESCRIPTION" : "Updated entry 2",
													"_SOURCE": 1,
													"_CREATED_BY": "U000"
												}]     
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{uom}} WHERE UOM_ID = 'TST'");
				var oTestText = mockstar.execQuery("select * from {{uom_text}} WHERE UOM_ID = 'TST'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.UOM_ID.rows.length).toBe(oTestMainBefore.columns.UOM_ID.rows.length + 1);
				expect(oTestText.columns.UOM_ID.rows.length).toBe(oTestTextBefore.columns.UOM_ID.rows.length + 2);
			});
			
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when unit of measure is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "ZZZ",
													"DIMENSION_ID" : "D2",
													"NUMERATOR" : 1,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 0,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
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
						
			it('should throw error (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an UOM text which is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST",
													"LANGUAGE" : "EN",
													"_VALID_FROM" : "2015-09-02T14:45:50.096Z",
													"UOM_CODE" : "en",
													"UOM_DESCRIPTION" : "Updated entry 1"
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
			
			it("should throw an error (GENERAL_VALIDATION_ERROR) when try to update an UOM copied from ERP", function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"UNIT_OF_MEASURE_ENTITIES" : [{
													"UOM_ID" : "YYY",
													"DIMENSION_ID" : "TIME",
													"NUMERATOR" : 3600,
													"DENOMINATOR" : 1,
													"EXPONENT_BASE10" : 0,
													"SI_CONSTANT" : 1,
													"_VALID_FROM" : "2015-06-02T14:45:50.096Z"
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.SOURCE_ERP);
			});
			
			it('should throw error (GENERAL_VALIDATION_ERROR) when try to update a UOM text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Unit_Of_Measure"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"UNIT_OF_MEASURE_TEXT_ENTITIES" : [{
													"UOM_ID" : "TST"
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