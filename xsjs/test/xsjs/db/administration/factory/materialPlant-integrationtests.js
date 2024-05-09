var testData         = require("../../../../testdata/testdata").data;
var mockstar_helpers = require("../../../../testtools/mockstar_helpers");
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
var TestDataUtility          = require("../../../../testtools/testDataUtility").TestDataUtility;
var _ = require("lodash");

	
describe('xsjs.db.administration.factory.materialPlant-integrationtests', function() {

	
	var originalProcedures = null;
	var mockstar = null;
	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function() {

		mockstar = new MockstarFacade({ // Initialize Mockstar
			testmodel : {
				"procRead": "sap.plc.db.administration.procedures/p_material_plant_read"
			},
			substituteTables : {
				material_plant : Resources["Material_Plant"].dbobjects.plcTable,
				gtt_material_plant: Resources["Material_Plant"].dbobjects.tempTable,
				material : Resources["Material"].dbobjects.plcTable,
				material_text : Resources["Material"].dbobjects.plcTextTable,
				plant : Resources["Plant"].dbobjects.plcTable,
				valuation_class : Resources["Valuation_Class"].dbobjects.plcTable,
				overhead_group : Resources["Overhead_Group"].dbobjects.plcTable,
				plant_text : Resources["Plant"].dbobjects.plcTextTable,
				metadata :  {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes : {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				},
				session : {
					name : "sap.plc.db::basis.t_session",
					data : testData.oSessionTestDataEn
				},
				material_plant_ext : "sap.plc.db::basis.t_material_plant_ext"
			},
			csvPackage : testData.sCsvPackage
		});

		if (!mockstar.disableMockstar) {
            var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Material_Plant"];
            originalProcedures = MasterdataReadProcedures;
            MasterdataReadProcedures = Object.freeze({
            	"Material_Plant": procedureXsunit
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
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should return valid material plant', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
			var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES.length).toBe(3);
		});

		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should return valid material plant with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Plant"
				} ];
				
				var aExpectedMaterialPlantsExtPlc = [];
				var oMaterialPlants = new TestDataUtility(testData.oMaterialPlantTestDataPlc).build();
				var aMaterialPlants = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oMaterialPlants);
				var aExpectedMaterialPlants = _.filter(aMaterialPlants, function(oMaterialPlants) {
				    return (oMaterialPlants._VALID_TO === null);
			    });
				var oExpectedMaterialPlant = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedMaterialPlants);
				
				var oMaterialPlantsExt = new TestDataUtility(testData.oMaterialPlantExtTestDataPlc).build();
				var aMaterialPlantsExt = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oMaterialPlantsExt);
				
				_.each(aExpectedMaterialPlants, function(oMatPlant){
				    var aExpectedMaterialPlantExtPart = _.filter(aMaterialPlantsExt, function(oMatPlatExt){
				        return (oMatPlatExt.PLANT_ID === oMatPlant.PLANT_ID && oMatPlatExt.MATERIAL_ID === oMatPlant.MATERIAL_ID && oMatPlatExt._VALID_FROM === oMatPlant._VALID_FROM);
				    }) ;
				    aExpectedMaterialPlantsExtPlc = _.union(aExpectedMaterialPlantsExtPlc, aExpectedMaterialPlantExtPart);
				});

				var oExpectedExtMaterialPlant = _.pick(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedMaterialPlantsExtPlc),"CMPL_INTEGER_MANUAL","CMPL_INTEGER_UNIT");
				var iLenDif = aExpectedMaterialPlants.length - aExpectedMaterialPlantsExtPlc.length;

				for(var i = 0; i < iLenDif; i++){
				    oExpectedExtMaterialPlant.CMPL_INTEGER_MANUAL.push(null);
				    oExpectedExtMaterialPlant.CMPL_INTEGER_UNIT.push(null);
				}

				oExpectedMaterialPlant = _.extend(oExpectedMaterialPlant, oExpectedExtMaterialPlant);
				 				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
	            var returnedResult = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES);
	            expect(returnedResult).toMatchData(oExpectedMaterialPlant, ["MATERIAL_ID", "PLANT_ID","_VALID_FROM"]);
			});
		}
		
		it('should return the valid filtered entries', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
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
            expect(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES.length).toBe(2);
		});
		
		it('should return the valid filtered entries when filtering entries based on Material Description', function() {
			
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			},{
			    name : "filter",
			    value : "MATERIAL_DESCRIPTION=Material MAT1 EN"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES.length).toBe(1);
			expect(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES[0].MATERIAL_DESCRIPTION).toBe("Material MAT1 EN");
		});

		it('should not return any entries for an invalid material (filter)', function() {
			
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			},{
			    name : "filter",
			    value : "MATERIAL_ID=MMM"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.MATERIAL_PLANT_ENTITIES.length).toBe(0);
		});
	});
	
	describe ("remove", function (){
		
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		
		it('should deactivate material plants', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"DELETE":
								       { 
										"MATERIAL_PLANT_ENTITIES": [{
											"MATERIAL_ID" : "MAT1",
											"PLANT_ID":"PL1",
											"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
											}]
								        }
								};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM}'`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material_plant");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_plant_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM}'`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oItemsPayload.DELETE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.DELETE.MATERIAL_PLANT_ENTITIES[0]._VALID_TO).not.toBe(null);
            expect(oTestBefore._VALID_TO[0]).toBe(null);
            expect(oTestAfter._VALID_TO[0]).not.toBe(null);
            expect(mockstar_helpers.getRowCount(mockstar, "material_plant")).toBe(iTestBefore);
            if(jasmine.plcTestRunParameters.generatedFields === true){
                expect(mockstar_helpers.getRowCount(mockstar, "material_plant_ext")).toBe(iTestExtBefore);
            }
		});

		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material plant for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"DELETE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
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
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a material plant that does not exist / or it is not valid', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"DELETE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"PLANT_ID":"PL1",
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
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should insert material plant', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oTestBefore = mockstar.execQuery("select * from {{material_plant}}");
			
			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : 'MAT4',
												"PLANT_ID" : 'PL4'
											},{
												"MATERIAL_ID" : 'MAT1',
												"PLANT_ID" : 'PL4'
											}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{material_plant}}");				
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.MATERIAL_ID.rows.length).toBe(oTestBefore.columns.MATERIAL_ID.rows.length + 2);
			expect(oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).not.toBe(null);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert material plant with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Plant"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material_plant");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_plant_ext");
				
				var oItemsPayload = {"CREATE":
									       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : 'MAT4',
												"PLANT_ID" : 'PL4',
												"CMPL_INTEGER_MANUAL" : 1
											},{
												"MATERIAL_ID" : 'MAT1',
												"PLANT_ID" : 'PL4'
											}]
								        }
								};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                                
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}'`));
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}'`));
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "material_plant")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "material_plant_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_PLANT_ENTITIES[0].CMPL_INTEGER_MANUAL).toBe(oTestExt.CMPL_INTEGER_MANUAL[0]);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material plant that has a unit for a custom field that does not allow units', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Plant"
				}];

				var oItemsPayload = {"CREATE":
	                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : 'MAT4',
												"PLANT_ID" : 'PL4',
												"CMAT_STRING_UNIT" : 'EUR'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CMAT_STRING_UNIT");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
		}
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"PLANT_ID":"P123"
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

		it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a material plant that already exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"PLANT_ID":"PL1"
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
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material plant for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1"
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
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
	});
	

	describe ("upsert", function (){
		
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
			mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should insert material plant', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oTestBefore = mockstar.execQuery("select * from {{material_plant}}");
			
			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : 'MAT4',
												"PLANT_ID" : 'PL4'
											},{
												"MATERIAL_ID" : 'MAT1',
												"PLANT_ID" : 'PL4'
											}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{material_plant}}");				
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.MATERIAL_ID.rows.length).toBe(oTestBefore.columns.MATERIAL_ID.rows.length + 2);
			expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).not.toBe(null);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert material plant with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Plant"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material_plant");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_plant_ext");
				
				var oItemsPayload = {"UPSERT":
									       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : 'MAT4',
												"PLANT_ID" : 'PL4',
												"CMPL_INTEGER_MANUAL" : 1
											},{
												"MATERIAL_ID" : 'MAT1',
												"PLANT_ID" : 'PL4',
												"CMPL_INTEGER_MANUAL" : 1
											}]
								        }
								};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                                
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}'`));
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}'`));
				
				//assert 
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "material_plant")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "material_plant_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0].CMPL_INTEGER_MANUAL).toBe(oTestExt.CMPL_INTEGER_MANUAL[0]);
			});
		}
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (plant) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"PLANT_ID":"P123"
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
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a material plant for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1"
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
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});

		it('should deactivate the current version of the upserted material plant and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"UPSERT":
								       { 
											"MATERIAL_PLANT_ENTITIES": [ {
												"MATERIAL_ID" : "MAT2",
												"PLANT_ID": "PL3",
												"VALUATION_CLASS_ID": "V1"
											}]
								        }
								};
			
			var oTestBefore = mockstar_helpers.convertResultToArray( 
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}'  and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material_plant");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_plant_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_TO is null`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPSERT.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_PLANT_ENTITIES[0]._VALID_TO).toBe(null);
            expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
            expect(mockstar_helpers.getRowCount(mockstar, "material_plant")).toBe(iTestBefore+1);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	//oTestExtAfter.CMPL_INTEGER_MANUAL[0] will be empty if it's not set in the request
            	expect(oTestExtAfter.CMPL_INTEGER_MANUAL[0]).not.toBe(oTestExtBefore.CMPL_INTEGER_MANUAL[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
                expect(mockstar_helpers.getRowCount(mockstar, "material_plant_ext")).toBe(iTestExtBefore+1);
            }
		});
		
	});

	describe ("update", function (){
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
			mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
			mockstar.insertTableData("valuation_class", testData.oValuationClassTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});
		
		it('should deactivate the current version of the updated material and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"UPDATE":
								       { 
											"MATERIAL_PLANT_ENTITIES": [ {
												"MATERIAL_ID" : "MAT2",
												"PLANT_ID": "PL3",
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
												"VALUATION_CLASS_ID": "V1"
											}]
								        }
								};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material_plant");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
						
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
			    var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_plant_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
           
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material_plant}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_TO is null`));
					 var validFromAfter = oTestAfter._VALID_FROM[0];
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_plant_ext}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].MATERIAL_ID}' and PLANT_ID = '${oItemsPayload.UPDATE.MATERIAL_PLANT_ENTITIES[0].PLANT_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.UPDATE.MATERIAL_PLANT_ENTITIES[0]._VALID_TO).toBe(null);
            expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
            expect(mockstar_helpers.getRowCount(mockstar, "material_plant")).toBe(iTestBefore+1);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	//oTestExtAfter.CMPL_INTEGER_MANUAL[0] will be empty if it's not set in the request
            	expect(oTestExtAfter.CMPL_INTEGER_MANUAL[0]).not.toBe(oTestExtBefore.CMPL_INTEGER_MANUAL[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
                expect(mockstar_helpers.getRowCount(mockstar, "material_plant_ext")).toBe(iTestExtBefore+1);
            }
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (overhead group) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT2",
												"PLANT_ID": "PL3",
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
												"VALUATION_CLASS_ID": "V2",
												"OVERHEAD_GROUP_ID": "GG"
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
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.OverheadGroup);
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (valuation class) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];

			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT2",
												"PLANT_ID": "PL3",
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
												"VALUATION_CLASS_ID": "VV"
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
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ValuationClass);
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material plant that is not available in system or is not valid', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT2",
												"PLANT_ID": "PL3",
												"_VALID_FROM" : '2015-06-01T15:39:09.691Z',
												"VALUATION_CLASS_ID": "V2"
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
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a material plant for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material_Plant"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_PLANT_ENTITIES": [{
												"MATERIAL_ID" : "MAT2",
												"VALUATION_CLASS_ID": "V2"
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
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);