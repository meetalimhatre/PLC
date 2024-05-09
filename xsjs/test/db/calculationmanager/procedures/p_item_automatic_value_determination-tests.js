var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var testdata = require("../../../testdata/testdata").data;
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;

describe("p_item_automatic_value_determination", function () {
	
	var sSessionId = testdata.oCalculationVersionTemporaryTestData.SESSION_ID[0];
	var iCalculationVersionId = testdata.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0];
	
	var aItems = new TestDataUtility(testdata.oItemTemporaryTestData).getObjects([0,1,2]);
	aItems[0].ACCOUNT_ID = "100000";
	aItems[0].DETERMINED_ACCOUNT_ID = "100";
	aItems[0].MATERIAL_ID = "MAT1";
	aItems[0].PLANT_ID = "PL1";
	aItems[0].VALUATION_CLASS_ID = "V1";
	aItems[0].SURCHARGE = "123";
	aItems[0].PRICE_VARIABLE_PORTION = "1212"; // change of price should reset SURCHARGE
	aItems[0].IS_PRICE_SPLIT_ACTIVE = 0;
	aItems[0].IS_DISABLING_ACCOUNT_DETERMINATION = 0;
	aItems[0].IS_DISABLING_PRICE_DETERMINATION = 1;
	aItems[0].VENDOR_ID = "VD0";
	aItems[1].ACCOUNT_ID = "INVALID";
	aItems[1].VENDOR_ID = "VD1";
	aItems[1].IS_DISABLING_ACCOUNT_DETERMINATION = 0;
	aItems[1].DETERMINED_ACCOUNT_ID = "100";
	aItems[1].MATERIAL_ID = "MAT2";
	aItems[2].ACCOUNT_ID = "MANUAL";
	aItems[2].IS_DISABLING_ACCOUNT_DETERMINATION = 0;
	aItems[2].VENDOR_ID = "VD2";

	var aMaterialAccountDetermination = new TestDataUtility(testdata.oMaterialAccountDeterminationPlc).getObjects([0,1]);
	aMaterialAccountDetermination[0].MATERIAL_TYPE_ID = "MT1";
	aMaterialAccountDetermination[0].CONTROLLING_AREA_ID = "1000";
	aMaterialAccountDetermination[0].VALUATION_CLASS_ID = "V1";
	aMaterialAccountDetermination[1].MATERIAL_TYPE_ID = "MT1";
	aMaterialAccountDetermination[1].CONTROLLING_AREA_ID = "1000";
		   
	var mockstar = null;

	beforeOnce(function () {

		mockstar = new MockstarFacade({
			testmodel: "sap.plc.db.calculationmanager.procedures/p_item_automatic_value_determination",
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
				    name: "sap.plc.db::basis.t_item_temporary",
				    data: testdata.oItemTemporaryTestData
				},
				gtt_item_temporary_with_masterdata_custom_fields:{
					 name: "sap.plc.db::basis.gtt_item_temporary_with_masterdata_custom_fields"
				},
				material_price: {
					name: "sap.plc.db::basis.t_material_price"
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
				item_temporary_ext:  "sap.plc.db::basis.t_item_temporary_ext"
				
			}
		});
	});

	afterOnce(function () {
		mockstar.cleanup();
	});
	
	beforeEach(function () {   
		mockstar.clearAllTables();
		mockstar.insertTableData("gtt_item_temporary_with_masterdata_custom_fields", aItems);
		mockstar.initializeData();
	});

	describe("general", function () {
		it("it should ignore the masterdata update if the price determination is disabled", function() {
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			// assert
			expect(result[0][0].IS_DISABLING_PRICE_DETERMINATION).toEqual(1);
			expect(result[0][0].IS_PRICE_SPLIT_ACTIVE).toEqual(0);
		});

		it("should return empty result set if no calculation version for the given id was found", function () {
			// act
			var result = mockstar.call(-1, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0].length).toBe(0);
		});

		it("should return empty result set if no calculation version for the given session id was found", function () {
			// act
			var result = mockstar.call(iCalculationVersionId, "invalid", '', false, null, null, false);

			//assert
			expect(result[0].length).toBe(0);
		});
		
		it("should return correct TOTAL_COST_PER_UNIT, TOTAL_COST_PER_UNIT_FIXED_PORTION, TOTAL_COST_PER_UNIT_VARIABLE_PORTION", function(){
		    // act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);
			
			
			//assert
			var resultArray = mockstar_helpers.convertResultToArray(result[0]);
			expect(resultArray.TOTAL_COST_PER_UNIT[0]).toBe(aItems[0].TOTAL_COST_PER_UNIT);
			expect(resultArray.TOTAL_COST_PER_UNIT[1]).toBe(aItems[1].TOTAL_COST_PER_UNIT);
			expect(resultArray.TOTAL_COST_PER_UNIT[2]).toBe(aItems[2].TOTAL_COST_PER_UNIT);
			expect(resultArray.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]).toBe(aItems[0].TOTAL_COST_PER_UNIT_FIXED_PORTION);
			expect(resultArray.TOTAL_COST_PER_UNIT_FIXED_PORTION[1]).toBe(aItems[1].TOTAL_COST_PER_UNIT_FIXED_PORTION);
			expect(resultArray.TOTAL_COST_PER_UNIT_FIXED_PORTION[2]).toBe(aItems[2].TOTAL_COST_PER_UNIT_FIXED_PORTION);
			expect(resultArray.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]).toBe(aItems[0].TOTAL_COST_PER_UNIT_VARIABLE_PORTION);
			expect(resultArray.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[1]).toBe(aItems[1].TOTAL_COST_PER_UNIT_VARIABLE_PORTION);
			expect(resultArray.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[2]).toBe(aItems[2].TOTAL_COST_PER_UNIT_VARIABLE_PORTION);
		});		
		
		it("should set SURCHARGE to null if a price related field was changed", function(){		
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);
			
			
			//assert
			var resultArray = mockstar_helpers.convertResultToArray(result[0]);
			expect(resultArray.SURCHARGE[0]).toBe(null);
		});
	});

	describe("account determination integration", function () {
		
		it("should integrate the account determination result for first item (account 100000)", function () {
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0][0].ACCOUNT_ID).toEqual("100000");
		});

		it("should determine correctyle determined_account_id for the items", function(){

			// arrange
			var aItemsDetermined = JSON.parse(JSON.stringify(aItems));
			var iItemId = 3001;

			aItemsDetermined[0].ITEM_CATEGORY_ID = 2;
			aItemsDetermined[1].ITEM_CATEGORY_ID = 3;
			aItemsDetermined[2].ITEM_CATEGORY_ID = 3;

			mockstar.execSingle(`update {{item}} set item_category_id = 2 where item_id = ${iItemId}`);
			mockstar.execSingle(`update {{item_temporary}} set item_category_id = 2 where item_id = ${iItemId}`);
			mockstar.clearTable("material_account_determination");
			mockstar.insertTableData("material_account_determination", aMaterialAccountDetermination);
			mockstar.clearTable("gtt_item_temporary_with_masterdata_custom_fields");
			mockstar.insertTableData("gtt_item_temporary_with_masterdata_custom_fields", aItemsDetermined);
			
			//act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0][0].ACCOUNT_ID).toEqual("11000");
			expect(result[0][0].DETERMINED_ACCOUNT_ID).toEqual("11000");
			expect(result[0][1].DETERMINED_ACCOUNT_ID).toEqual("100");
			expect(result[0][2].DETERMINED_ACCOUNT_ID).toBe("625000"); 
		});

		it("should reset account information for second item", function () {
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0][1].ACCOUNT_ID).toBe(null);
		});

		it("should not reset account information for second item if is_disabling_account_determination has the value true", function () {
			// act
			mockstar.clearTable("gtt_item_temporary_with_masterdata_custom_fields")
			aItems[1].IS_DISABLING_ACCOUNT_DETERMINATION = 1;
			mockstar.insertTableData("gtt_item_temporary_with_masterdata_custom_fields", aItems);
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0][1].ACCOUNT_ID).toBe(aItems[1].ACCOUNT_ID);
		});

		it("should keep manually set account information for third item", function () {
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);

			//assert
			expect(result[0][2].ACCOUNT_ID).toEqual(aItems[2].ACCOUNT_ID);
		});

		it("should return vendor id from item", function () {
			
			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);
			
			//assert
			expect(result[0][0].VENDOR_ID).toEqual(aItems[0].VENDOR_ID);
			expect(result[0][1].VENDOR_ID).toEqual(aItems[1].VENDOR_ID);
			expect(result[0][2].VENDOR_ID).toEqual(aItems[2].VENDOR_ID);
		});
		
		it("should return vendor id from item even if material price's vendor is generic", function () {
			//arrange
			mockstar.clearTable("gtt_item_temporary_with_masterdata_custom_fields")
			aItems[2].MATERIAL_ID = "MAT1";
			aItems[2].ITEM_CATEGORY_ID = 2;
			aItems[2].IS_DISABLING_ACCOUNT_DETERMINATION = 0;
			aItems[2].VENDOR_ID = "#VD2";
			aItems[2].PLANT_ID = "PL1"; 
			mockstar.insertTableData("gtt_item_temporary_with_masterdata_custom_fields", aItems);

			var oMaterialPriceTestData = testdata.oMaterialPriceTestDataPlc;
			oMaterialPriceTestData.PRICE_SOURCE_ID[0] = "PLC_STANDARD_PRICE";
			oMaterialPriceTestData.VALID_FROM[0] = oMaterialPriceTestData.VALID_FROM[1];

			mockstar.insertTableData("material_price", oMaterialPriceTestData);

			// act
			var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);
			
			//assert
			expect(result[0][2].VENDOR_ID).toEqual("#VD2");
			expect(result[0][2].PRICE_SOURCE_ID).toEqual("PLC_STANDARD_PRICE");
		});
		
	});
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
	    
		describe("set custom fields", function () {
		    
			it("set material id for first item --> custom field CMAT_STRING_MANUAL set from t_material_ext',", function () {
				//arrange
				mockstar.insertTableData("material_ext", testdata.oMaterialExtTestDataPlc);
				mockstar.insertTableData("material_plant_ext", testdata.oMaterialPlantExtTestDataPlc);
				mockstar.insertTableData("cost_center_ext", testdata.oCostCenterExtTestDataPlc);
				
				// act
				var result = mockstar.call(iCalculationVersionId, sSessionId, '', false, null, null, false);
	
				//assert
				expect(result[0][0].CMAT_STRING_MANUAL).toEqual(testdata.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]);
			});
			
		});
	}

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);