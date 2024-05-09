var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testdata = require("../../../testdata/testdata").data;
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;

describe("p_calculation_version_masterdata_timestamp_update", function () {
	
	var sSessionId = testdata.oCalculationVersionTemporaryTestData.SESSION_ID[0];
	var iCalculationVersionId = testdata.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0];
	
	var aItems = new TestDataUtility(testdata.oItemTemporaryTestData).getObjects([0,1,2]);
	aItems[0].ACCOUNT_ID = "100000";
	aItems[0].MATERIAL_ID = "MAT1";
	aItems[0].PLANT_ID = "PL1";
	aItems[0].VALUATION_CLASS_ID = "V1";
	
	var aMaterialAccountDetermination = new TestDataUtility(testdata.oMaterialAccountDeterminationPlc).getObjects([0,1]);
	aMaterialAccountDetermination[0].MATERIAL_TYPE_ID = "MT1";
	aMaterialAccountDetermination[0].CONTROLLING_AREA_ID = "1000";
	aMaterialAccountDetermination[0].VALUATION_CLASS_ID = "V1";
	aMaterialAccountDetermination[1].MATERIAL_TYPE_ID = "MT1";
	aMaterialAccountDetermination[1].CONTROLLING_AREA_ID = "1000";
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var aItemsExt = new TestDataUtility(testdata.oItemTemporaryExtWithMasterData).getObjects([0,1,2]);
	}
	
	var mockstar = null;

	beforeOnce(function () {

		mockstar = new MockstarFacade({
			testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_masterdata_timestamp_update",
			substituteTables: {
				calculation: {
					name: "sap.plc.db::basis.t_calculation",
					data: testdata.oCalculationTestData
				},
				project: {
					name: "sap.plc.db::basis.t_project",
					data: testdata.oProjectTestData
				},
				calculation_version_temporary: {
					name: "sap.plc.db::basis.t_calculation_version_temporary",
					data: testdata.oCalculationVersionTemporaryTestData
				},
				item:{
				    name: "sap.plc.db::basis.t_item",
				    data: testdata.oItemTestData
				},
				item_temporary:{
				    name: "sap.plc.db::basis.t_item_temporary"
				},
				gtt_item_temporary_with_masterdata_custom_fields:{
					 name: "sap.plc.db::basis.gtt_item_temporary_with_masterdata_custom_fields"
				},
				company_code: {
					name: "sap.plc.db::basis.t_company_code",
					data: testdata.oCompanyCodeTestDataPlc
				},	
				document_material: {
					name: "sap.plc.db::basis.t_document_material",
					data: testdata.oDocumentMaterialTestData
				},	
				material: {
					name: "sap.plc.db::basis.t_material",
					data: testdata.oMaterialTestDataPlc
				},	
				material_type : {
					name: "sap.plc.db::basis.t_material_type",
					data: testdata.oMaterialTypeTestDataPlc
				},
				material_group : {
					name: "sap.plc.db::basis.t_material_group",
					data: testdata.oMaterialGroupTestDataPlc
				},
				plant: {
					name: "sap.plc.db::basis.t_plant",
					data:  testdata.oPlantTestDataPlc
				},
				material_plant: {
					name: "sap.plc.db::basis.t_material_plant",
					data:  testdata.oMaterialPlantTestDataPlc
				},
				overhead_group: {
					name: "sap.plc.db::basis.t_overhead_group",
					data:  testdata.oOverheadGroupTestDataPlc
				},
				valuation_class: {
					name: "sap.plc.db::basis.t_valuation_class",
					data:  testdata.oValuationClassTestDataPlc
				},
				design_office: {
					name: "sap.plc.db::basis.t_design_office",
					data:  testdata.oDesignOfficeTestDataPlc
				},
				material_account_determination: {
					name: "sap.plc.db::basis.t_material_account_determination",
					data:  testdata.oMaterialAccountDeterminationPlc
				},
				activity_type: {
					name: "sap.plc.db::basis.t_activity_type"
				},
				process: {
					name: "sap.plc.db::basis.t_process"
				},
				material_ext : "sap.plc.db::basis.t_material_ext",
				material_plant_ext: "sap.plc.db::basis.t_material_plant_ext",
				cost_center_ext:  "sap.plc.db::basis.t_cost_center_ext",
				item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext"			
			}
		});
	});

	afterOnce(function () {
		mockstar.cleanup();
	});
	
	beforeEach(function () {
		mockstar.clearAllTables();
		mockstar.insertTableData("item_temporary", aItems);
		mockstar.initializeData();
	});
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		    
			it("should update values for master data custom fields in the item temporary extension table", function () {
				//arrange
				mockstar.insertTableData("material_ext", testdata.oMaterialExtTestDataPlc);
				mockstar.insertTableData("material_plant_ext", testdata.oMaterialPlantExtTestDataPlc);
				mockstar.insertTableData("cost_center_ext", testdata.oCostCenterExtTestDataPlc);
				mockstar.insertTableData("item_temporary_ext", aItemsExt);				
				
				// act
				var result = mockstar.call(iCalculationVersionId, sSessionId, new Date(), null ,null);
				
				//assert
				var testMaterialCustomFields = mockstar.execQuery("select CMAT_STRING_MANUAL, CMAT_STRING_UNIT from {{item_temporary_ext}} where calculation_version_id = " 
						+ iCalculationVersionId + " and item_id =  " + aItems[0].ITEM_ID);
				expect(testMaterialCustomFields.columns.CMAT_STRING_MANUAL.rows[0]).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]); 
				expect(testMaterialCustomFields.columns.CMAT_STRING_UNIT.rows[0]).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_UNIT[0]);
				expect(result[0][0].CMAT_STRING_MANUAL).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]);
				expect(result[0][0].CMAT_STRING_UNIT).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_UNIT[0]);
			});
			
			it("should insert values for master data custom fields in the item temporary extension table", function () {
				//arrange
				mockstar.insertTableData("material_ext", testdata.oMaterialExtTestDataPlc);
				mockstar.insertTableData("material_plant_ext", testdata.oMaterialPlantExtTestDataPlc);
				mockstar.insertTableData("cost_center_ext", testdata.oCostCenterExtTestDataPlc);

				// act
				var result = mockstar.call(iCalculationVersionId, sSessionId, new Date(), null ,null);
				
				//assert
				var testMaterialCustomFields = mockstar.execQuery("select CMAT_STRING_MANUAL, CMAT_STRING_UNIT from {{item_temporary_ext}} where calculation_version_id = " 
						+ iCalculationVersionId + " and item_id =  " + aItems[0].ITEM_ID);
				expect(testMaterialCustomFields.columns.CMAT_STRING_MANUAL.rows[0]).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]); 
				expect(testMaterialCustomFields.columns.CMAT_STRING_UNIT.rows[0]).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_UNIT[0]);
				expect(result[0][0].CMAT_STRING_MANUAL).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]);
				expect(result[0][0].CMAT_STRING_UNIT).toBe(testdata.oMaterialExtTestDataPlc.CMAT_STRING_UNIT[0]);
			});
			
	}

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);