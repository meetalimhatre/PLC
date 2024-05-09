var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;


describe("p_project_create_lifecycle_versions", function () {
	var oMockstar = null;
	var sSessionId = $.session.getUsername();

	var sProjectId = testData.oCalculationTestData.PROJECT_ID[0];
	var iBaseVersionToCopyId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
	var iExistingVersionId = 6;
	var iExistingManualVersionId = 7;
	var sAccountId = "#AC11";
	const sOneTimeCostItemDescription = 'Verteilte Kosten';


	var oProjectTotalQuantitiesTestData = {
			"PROJECT_ID" : 				[ testData.iProjectId ],
			"CALCULATION_ID" : 			[ testData.iCalculationId ],
			"CALCULATION_VERSION_ID" : 	[ testData.iCalculationVersionId],
			"IS_ONE_TIME_COST_ASSIGNED":[ 0, 0 ],
			"MATERIAL_PRICE_SURCHARGE_STRATEGY": [ 'NO_SURCHARGES' ],
			"ACTIVITY_PRICE_SURCHARGE_STRATEGY": [ 'NO_SURCHARGES' ],
			"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate],
			"LAST_MODIFIED_BY" :[ testData.sTestUser ]
		};

	var oLifecyclePeriodValueTestData = {
			"PROJECT_ID":				[ testData.iProjectId, testData.iProjectId, "PR2", "PR2" ],
			"CALCULATION_ID" : 		    [ testData.iCalculationId , testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId ],
			"LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1452, 1440, 1452],
			"VALUE" : 					['20.0000000', '30', '1' ,'2'],
			"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
			"LAST_MODIFIED_BY" :		[ testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser ]
	};

	var oOneTimeProjectCost = {
			"ONE_TIME_COST_ID": 				[1000, 1001],
			"PROJECT_ID":						[sProjectId, sProjectId],
			"ACCOUNT_ID":						[sAccountId, sAccountId],
			"COST_DESCRIPTION":					['Investment', 'Process'],
			"COST_TO_DISTRIBUTE":				[1000,  2000],
			"COST_NOT_DISTRIBUTED":				[1000,  2000],
			"COST_CURRENCY_ID":					['EUR','EUR',],
			"FIXED_COST_PORTION":				[20,    50],
			"DISTRIBUTION_TYPE":				[ 0,     0],
			"LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
			"LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
		};

	const oProjectLifecyclePeriodTypeData = {
		"PROJECT_ID":		[ testData.iProjectId, testData.iProjectId ],
		"YEAR":				[ 2020, 2021 ],
		"PERIOD_TYPE" :		[ 'YEARLY', 'YEARLY' ],
		"LAST_MODIFIED_ON":	[ testData.sExpectedDate, testData.sExpectedDate ],
		"LAST_MODIFIED_BY":	[ testData.sTestUser, testData.sTestUser ]
	};

	const oProjectLifecyclePeriodTypeDataCustom = {
		"PROJECT_ID":		[ testData.iProjectId, testData.iProjectId, "PR2", "PR2" ],
		"YEAR":				[ 2020, 2021, 2020, 2021 ],
		"PERIOD_TYPE" :		[ 'CUSTOM', 'CUSTOM', 'CUSTOM', 'CUSTOM' ],
		"LAST_MODIFIED_ON":	[ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
		"LAST_MODIFIED_BY":	[ testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser ]
	};

	const oProjectMonthlyLifecyclePeriodData = {
		"PROJECT_ID":		[ testData.iProjectId, testData.iProjectId, "PR2", "PR2" ],
		"YEAR":				[ 2020, 2021, 2020, 2021 ],
		"SELECTED_MONTH" :	[ 1, 2, 1, 2 ],
		"MONTH_DESCRIPTION":[ 'January', 'February', 'January', 'February' ],
		"LAST_MODIFIED_BY":	[ testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser ],
		"LAST_MODIFIED_ON":	[ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ]
	};

	const oLifecycleMonthlyPeriodValueTestData = {
		"PROJECT_ID":				[ testData.iProjectId, testData.iProjectId, "PR2", "PR2" ],
		"CALCULATION_ID" : 		    [ testData.iCalculationId , testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId ],
		"LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1453, 1440, 1453 ],
		"VALUE" : 					['20.0000000', '30', '2', '3' ],
		"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate ],
		"LAST_MODIFIED_BY" :		[ testData.sTestUser, testData.sTestUser, testData.sTestUser, testData.sTestUser ]
	};

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_project_create_lifecycle_versions", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						account: "sap.plc.db::basis.t_account",
						calculation: "sap.plc.db::basis.t_calculation",
						calculation_version: "sap.plc.db::basis.t_calculation_version",
						item: "sap.plc.db::basis.t_item",
						item_ext: "sap.plc.db::basis.t_item_ext",
						item_calculated_values_component_split: "sap.plc.db::basis.t_item_calculated_values_component_split", 
						item_calculated_values_costing_sheet: "sap.plc.db::basis.t_item_calculated_values_costing_sheet", 
						item_referenced_version_component_split: "sap.plc.db::basis.t_item_referenced_version_component_split",
						lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
						project: "sap.plc.db::basis.t_project",
						project_total_quantities: "sap.plc.db::basis.t_project_total_quantities",
						one_time_project_cost: "sap.plc.db::basis.t_one_time_project_cost",
						project_lifecycle_configuration:"sap.plc.db::basis.t_project_lifecycle_configuration",
						one_time_cost_lifecycle_value:"sap.plc.db::basis.t_one_time_cost_lifecycle_value",
						one_time_product_cost :"sap.plc.db::basis.t_one_time_product_cost",
						project_lifecycle_period_type: "sap.plc.db::basis.t_project_lifecycle_period_type",
						project_monthly_lifecycle_period: "sap.plc.db::basis.t_project_monthly_lifecycle_period"
					}
				});
	});
	
	afterOnce(function() {
		oMockstar.cleanup(); // clean up all test artefacts
	});


	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views

		oMockstar.insertTableData("calculation", testData.oCalculationTestData);
		oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
		oMockstar.insertTableData("item", testData.oItemTestData);
		oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValueTestData);
		oMockstar.insertTableData("project", testData.oProjectTestData);
		oMockstar.insertTableData("project_lifecycle_configuration", oProjectTotalQuantitiesTestData);
		oMockstar.insertTableData("project_lifecycle_period_type", oProjectLifecyclePeriodTypeData);

		if (jasmine.plcTestRunParameters.generatedFields === true){
			oMockstar.insertTableData("item_ext", testData.oItemExtData);
		}
	});
	
	
	/**	
	 * Utility method to invoke the procedure. Is used in order not to adapt every test every time the parameters of the procedure changes.
	 * 	 
	 */	 
	function _invokeProcedureForLifecycleVersions(){
		return oMockstar.call(sProjectId, sSessionId, false, null, '');
	}
	function _invokeProcedureForManualLifecycleVersions(){
		return oMockstar.call(sProjectId, sSessionId, true, null, '');
	}

	it('should name correctly the lifecycle calculation versions with custom periods', () => {
		//arrange	
		oMockstar.clearTable("project_lifecycle_period_type");
		oMockstar.clearTable("lifecycle_period_value");
		oMockstar.insertTableData("lifecycle_period_value", oLifecycleMonthlyPeriodValueTestData);
		oMockstar.insertTableData("project_lifecycle_period_type", oProjectLifecyclePeriodTypeDataCustom);
		oMockstar.insertTableData("project_monthly_lifecycle_period", oProjectMonthlyLifecyclePeriodData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersion2020 = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' and lifecycle_period_from = '${oLifecycleMonthlyPeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]}'`);
		expect(oCreatedLifecycleVersion2020.columns.CALCULATION_VERSION_NAME.rows[0]).toBe("Baseline Version1 - 2020 - January");
		let oCreatedLifecycleVersion2021 = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' and lifecycle_period_from = '${oLifecycleMonthlyPeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]}'`);
		expect(oCreatedLifecycleVersion2021.columns.CALCULATION_VERSION_NAME.rows[0]).toBe("Baseline Version1 - 2021 - February");
	});

	it('should name correctly the lifecycle calculation versions with custom periods when the description is NULL', () => {
		//arrange
		oMockstar.clearTable("project_lifecycle_period_type");
		let oCustomMonthlyPeriodData = oProjectMonthlyLifecyclePeriodData;
		oCustomMonthlyPeriodData.MONTH_DESCRIPTION = [ null, null, null, null ];
		oMockstar.clearTable("lifecycle_period_value");
		oMockstar.insertTableData("lifecycle_period_value", oLifecycleMonthlyPeriodValueTestData);
		oMockstar.insertTableData("project_lifecycle_period_type", oProjectLifecyclePeriodTypeDataCustom);
		oMockstar.insertTableData("project_monthly_lifecycle_period", oCustomMonthlyPeriodData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersion2020 = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' and lifecycle_period_from = '${oLifecycleMonthlyPeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]}'`);
		expect(oCreatedLifecycleVersion2020.columns.CALCULATION_VERSION_NAME.rows[0]).toBe("Baseline Version1 - 2020 - M1");
		let oCreatedLifecycleVersion2021 = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' and lifecycle_period_from = '${oLifecycleMonthlyPeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]}'`);
		expect(oCreatedLifecycleVersion2021.columns.CALCULATION_VERSION_NAME.rows[0]).toBe("Baseline Version1 - 2021 - M2");
	});

	it('should delete entries in item-related tables for lc versions not selected for lifecycle calculation', function() {
		// arrange
		// insert an existing LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		// insert item entries in existing calculation versions
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;	
		oMockstar.insertTableData("item", oExistingItemTestData);
		
    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		let oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001], [iExistingVersionId], testData.oItemExtData,1);
    		oMockstar.insertTableData("item_ext", oItemTestDataExt);
    	}
		
		let oItemCalculatedValuesCostingSheetWithVersion = new TestDataUtility(testData.oItemCalculatedValuesCostingSheet).getObject(0);
		oItemCalculatedValuesCostingSheetWithVersion.CALCULATION_VERSION_ID = iExistingVersionId;
		oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheetWithVersion);
		
		let oItemCalculatedValuesComponentSplitWithVersion = new TestDataUtility(testData.oItemCalculatedValuesComponentSplit).getObject(0);
		oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplitWithVersion);
		
		let oItemReferencedVersionComponentSplit = {
				"MASTER_CALCULATION_VERSION_ID" : [iExistingVersionId],
				"REFERENCED_CALCULATION_VERSION_ID" : [iExistingVersionId],
				"COMPONENT_SPLIT_ID" : ["100"],
				"COST_COMPONENT_ID" : [2],
				"ACCOUNT_ID" : ["40"],
				"COST_FIXED_PORTION" : ['3'],
				"COST_VARIABLE_PORTION" : ['4']
			};
		oMockstar.insertTableData("item_referenced_version_component_split", oItemReferencedVersionComponentSplit);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id = " + iExistingVersionId)).toBe(0); // entry should not exist
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_costing_sheet", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_component_split", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_referenced_version_component_split", "master_calculation_version_id = " + iExistingVersionId)).toBe(0);
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iExistingVersionId)).toBe(0);
	    }
	});

	it('should delete entries in item-related tables for manual+lc versions not selected for lifecycle calculation', function() {
		// arrange
		// insert an existing manual+LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});		
		_.extend(aExistingCalculationVersionTestData[1],  {
			"CALCULATION_VERSION_ID" : iExistingManualVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
			"CALCULATION_VERSION_TYPE" : 16,
			"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
			"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
	});		
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		// insert item entries in existing calculation versions
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0,1]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;	
		oExistingItemTestData[1].CALCULATION_VERSION_ID = iExistingManualVersionId;	
		oMockstar.insertTableData("item", oExistingItemTestData);
		
    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		let oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001, 3002], [iExistingVersionId, iExistingManualVersionId], testData.oItemExtData,2);
    		oMockstar.insertTableData("item_ext", oItemTestDataExt);
    	}
		
		let oItemCalculatedValuesCostingSheetWithVersion = new TestDataUtility(testData.oItemCalculatedValuesCostingSheet).getObjects([0, 1]);
		oItemCalculatedValuesCostingSheetWithVersion[0].CALCULATION_VERSION_ID = iExistingVersionId;
		oItemCalculatedValuesCostingSheetWithVersion[1].CALCULATION_VERSION_ID = iExistingManualVersionId;
		oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheetWithVersion);
		
		let oItemCalculatedValuesComponentSplitWithVersion = new TestDataUtility(testData.oItemCalculatedValuesComponentSplit).getObjects([0, 1]);
		oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplitWithVersion);
		
		let oItemReferencedVersionComponentSplit = {
				"MASTER_CALCULATION_VERSION_ID" : [iExistingVersionId, iExistingManualVersionId],
				"REFERENCED_CALCULATION_VERSION_ID" : [iExistingVersionId, iExistingManualVersionId],
				"COMPONENT_SPLIT_ID" : ["100", "100"],
				"COST_COMPONENT_ID" : [2,2],
				"ACCOUNT_ID" : ["40", "40"],
				"COST_FIXED_PORTION" : ['3', '3'],
				"COST_VARIABLE_PORTION" : ['4', '4']
			};
		oMockstar.insertTableData("item_referenced_version_component_split", oItemReferencedVersionComponentSplit);		

		//act
		_invokeProcedureForManualLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id = " + iExistingVersionId)).toBe(0); // entry should not exist
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_costing_sheet", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_component_split", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_referenced_version_component_split", "master_calculation_version_id = " + iExistingVersionId)).toBe(0);
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		}
		expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id = " + iExistingManualVersionId)).toBe(0); // entry should not exist
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_costing_sheet", "calculation_version_id = " + iExistingManualVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_component_split", "calculation_version_id = " + iExistingManualVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_referenced_version_component_split", "master_calculation_version_id = " + iExistingManualVersionId)).toBe(0);
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iExistingManualVersionId)).toBe(0);
	    }
	});

	it('should not delete entries in item-related tables for manual versions not selected for lifecycle calculation when overwrite parameter is set to false', function() {
		// arrange
		// insert an existing manual+LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});		
		_.extend(aExistingCalculationVersionTestData[1],  {
			"CALCULATION_VERSION_ID" : iExistingManualVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
			"CALCULATION_VERSION_TYPE" : 16,
			"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
			"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
	});		
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		// insert item entries in existing calculation versions
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0,1]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;	
		oExistingItemTestData[1].CALCULATION_VERSION_ID = iExistingManualVersionId;	
		oMockstar.insertTableData("item", oExistingItemTestData);
		
    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		let oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001, 3002], [iExistingVersionId, iExistingManualVersionId], testData.oItemExtData,2);
    		oMockstar.insertTableData("item_ext", oItemTestDataExt);
    	}
		
		let oItemCalculatedValuesCostingSheetWithVersion = new TestDataUtility(testData.oItemCalculatedValuesCostingSheet).getObjects([0, 1]);
		oItemCalculatedValuesCostingSheetWithVersion[0].CALCULATION_VERSION_ID = iExistingVersionId;
		oItemCalculatedValuesCostingSheetWithVersion[1].CALCULATION_VERSION_ID = iExistingManualVersionId;
		oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheetWithVersion);
		
		let oItemCalculatedValuesComponentSplitWithVersion = new TestDataUtility(testData.oItemCalculatedValuesComponentSplit).getObjects([0, 1]);
		oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplitWithVersion);
		
		let oItemReferencedVersionComponentSplit = {
				"MASTER_CALCULATION_VERSION_ID" : [iExistingVersionId, iExistingManualVersionId],
				"REFERENCED_CALCULATION_VERSION_ID" : [iExistingVersionId, iExistingManualVersionId],
				"COMPONENT_SPLIT_ID" : ["100", "100"],
				"COST_COMPONENT_ID" : [2,2],
				"ACCOUNT_ID" : ["40", "40"],
				"COST_FIXED_PORTION" : ['3', '3'],
				"COST_VARIABLE_PORTION" : ['4', '4']
			};
		oMockstar.insertTableData("item_referenced_version_component_split", oItemReferencedVersionComponentSplit);		

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "item", "calculation_version_id = " + iExistingVersionId)).toBe(0); // entry should not exist
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_costing_sheet", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_calculated_values_component_split", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		expect(mockstarHelpers.getRowCount(oMockstar, "item_referenced_version_component_split", "master_calculation_version_id = " + iExistingVersionId)).toBe(0);
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iExistingVersionId)).toBe(0);
		}
	});
	
	it('should delete entries in t_calculation_version for existing lc versions with lifecycle periods not selected for lifecycle calculation', function() {
		// arrange
		// insert an existing LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;		
		oMockstar.insertTableData("item", oExistingItemTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingVersionId)).toBe(0); // entry should not exist
	});

	it('should delete entries in t_calculation_version for existing manual+lc versions with lifecycle periods not selected for lifecycle calculation', function() {
		// arrange
		// insert an existing manual+LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});	
		_.extend(aExistingCalculationVersionTestData[1],  {
			"CALCULATION_VERSION_ID" : iExistingManualVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
			"CALCULATION_VERSION_TYPE" : 16,
			"LIFECYCLE_PERIOD_FROM" : 5000,   // lifecycle period not selected for simulation 
			"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
	    });			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0,1]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;	
		oExistingItemTestData[1].CALCULATION_VERSION_ID = iExistingManualVersionId;		
		oMockstar.insertTableData("item", oExistingItemTestData);

		//act
		_invokeProcedureForManualLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingVersionId)).toBe(0); // entry should not exist
	    expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingManualVersionId)).toBe(0); // entry should not exist
	});
	
	it('should not delete entries in t_calculation_version for existing lc versions with lifecycle periods selected for lifecycle calculation', function() {
		// arrange
		// insert an existing LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0],   // lifecycle period selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingVersionId;		
		oMockstar.insertTableData("item", oExistingItemTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingVersionId)).toBe(1); // entry should exist
	});

	it('should not delete entries in t_calculation_version for existing manual lc versions with lifecycle periods selected for lifecycle calculation', function() {
		// arrange
		// insert an existing manual+LC version with 1 root item
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"CALCULATION_VERSION_ID" : iExistingManualVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
				"CALCULATION_VERSION_TYPE" : 16,
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0],   // lifecycle period selected for simulation 
				"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
		});	
		_.extend(aExistingCalculationVersionTestData[1],  {
			"CALCULATION_VERSION_ID" : iExistingVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
			"CALCULATION_VERSION_TYPE" : 2,
			"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1],   // lifecycle period selected for simulation 
			"BASE_VERSION_ID" : testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]
	});	
				
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);
		
		let oExistingItemTestData = new TestDataUtility(testData.oItemTestData).getObjects([0,1]);
		oExistingItemTestData[0].CALCULATION_VERSION_ID = iExistingManualVersionId;	
		oExistingItemTestData[1].CALCULATION_VERSION_ID = iExistingVersionId;		
		oMockstar.insertTableData("item", oExistingItemTestData);

		//act
		_invokeProcedureForManualLifecycleVersions();

		//assert
		expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingManualVersionId)).toBe(1); // entry should exist
	    expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingVersionId)).toBe(1); // entry should exist
	});

	it('should create lc versions in t_calculation_version, t_item, t_item_ext for one version and one lifecycle', function() {
		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		
		// check created lifecycle version
		let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' and lifecycle_period_from = '${oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]}'`);
		let oExpectedLifecycleVersion = (new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]))[0];
		oExpectedLifecycleVersion = _.omit(oExpectedLifecycleVersion, ["CALCULATION_VERSION_ID", "START_OF_PRODUCTION", "END_OF_PRODUCTION", "VALUATION_DATE", "LAST_MODIFIED_ON", "MASTER_DATA_TIMESTAMP"]);
		_.extend(oExpectedLifecycleVersion, {
			BASE_VERSION_ID: iBaseVersionToCopyId,
			CALCULATION_VERSION_NAME: testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0] + " - 2020",
			CALCULATION_VERSION_TYPE: 2,
			LIFECYCLE_PERIOD_FROM: oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]
		});
		expect(oCreatedLifecycleVersion).toMatchData(oExpectedLifecycleVersion, [ "ROOT_ITEM_ID" ]);
		
		// check created items of the lifecycle version
		var iCreatedLifecycleVersionId = oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0];
		
		let oCreatedItems = oMockstar.execQuery("select * from {{item}} where calculation_version_id = " + iCreatedLifecycleVersionId);
		let oExpectedItems = mockstarHelpers.convertArrayOfObjectsToObjectOfArrays(new TestDataUtility(testData.oItemTestData).getObjects([0, 1, 2]));
		oExpectedItems = _.omit(oExpectedItems, ["CREATED_ON", "LAST_MODIFIED_ON"]);
		oExpectedItems.CREATED_BY = [sSessionId, sSessionId, sSessionId];
		oExpectedItems.LAST_MODIFIED_BY = [sSessionId, sSessionId, sSessionId];
		oExpectedItems.CALCULATION_VERSION_ID = [iCreatedLifecycleVersionId, iCreatedLifecycleVersionId, iCreatedLifecycleVersionId];
		oExpectedItems.TOTAL_QUANTITY = [oLifecyclePeriodValueTestData.VALUE[0], '1.0000000', '1.0000000'];

		expect(oCreatedItems).toMatchData(oExpectedItems, [ "ITEM_ID" ]);
		
		if(jasmine.plcTestRunParameters.generatedFields === true){

			let iNewItemsExtMasterCalcVerCount = oMockstar.execQuery(
					`select count(*) as count
						from {{item}} as item 
						right outer join {{item_ext}} as ext
							on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id
						where ext.calculation_version_id = '${iCreatedLifecycleVersionId}'`);
			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(3);	

			//root item's custom field values
			let oExpectedExtItems = mockstarHelpers.convertArrayOfObjectsToObjectOfArrays(new TestDataUtility(testData.oItemExtData).getObjects([0, 1, 2]));
			    oExpectedExtItems = _.omit(oExpectedExtItems, ["CUST_LOCAL_DATE_MANUAL"]);
		        oExpectedExtItems.CALCULATION_VERSION_ID = [iCreatedLifecycleVersionId, iCreatedLifecycleVersionId, iCreatedLifecycleVersionId];

			let oCreatedExtItems = oMockstar.execQuery(`select * from {{item_ext}} where calculation_version_id = '${iCreatedLifecycleVersionId}' `);
			expect(oCreatedExtItems).toMatchData(oExpectedExtItems, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		}
	});
	
	it('should return ids and lifecycle_period_from of created lifecycle versions in ascending order of lifecycle_period_from', function() {
		//act
		let oProcedureResult = _invokeProcedureForLifecycleVersions();
		
		// assert 
		let oCreatedLifecycleVersions = oMockstar.execQuery(`
			select 	calculation_version_id,
					lifecycle_period_from
			from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}'
			order by lifecycle_period_from asc
		`);

		expect(oProcedureResult).toMatchData(oCreatedLifecycleVersions, ["CALCULATION_VERSION_ID"]);
	});

	it('should update properties of created manual+lifecycle version -> take over the id for existing lifecycle version', function() {

		// arrange	
		// insert an existing manual+LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]   // lifecycle period selected for simulation  
		});		
		_.extend(aExistingCalculationVersionTestData[1],  {
			"BASE_VERSION_ID" : iBaseVersionToCopyId,
			"CALCULATION_VERSION_ID" : iExistingManualVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
			"CALCULATION_VERSION_TYPE" : 16,
			"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]   // lifecycle period selected for simulation  
	    });		
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForManualLifecycleVersions();
		//assert
		let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}'`);

		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0]).toBe(iExistingVersionId);
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[1]).toBe(iExistingManualVersionId);
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_TYPE.rows[1]).toBe(2);
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_TYPE.rows[0]).toBe(2);
	});
	
	it('should update properties of created lifecycle version -> calculation version name extended with lifecycle period', function() {
		// arrange	
		// insert an existing LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0,1]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]   // lifecycle period selected for simulation  
		});	
		_.extend(aExistingCalculationVersionTestData[1],  {
			"BASE_VERSION_ID" : iBaseVersionToCopyId,
			"CALCULATION_VERSION_ID" : iExistingManualVersionId,
			"CALCULATION_VERSION_NAME": "Calc vers" + iExistingManualVersionId,
			"CALCULATION_VERSION_TYPE" : 16,
			"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]   // lifecycle period selected for simulation  
	    });			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForManualLifecycleVersions();

		//assert
		let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}'`);
		
		// check that time period suffix has been added to the version name
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_NAME.rows[0]).toBe(testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0] + " - 2020");
	    expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_NAME.rows[1]).toBe(testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0] + " - 2021");
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_TYPE.rows[1]).toBe(2);
		expect(oCreatedLifecycleVersion.columns.CALCULATION_VERSION_TYPE.rows[0]).toBe(2);
	});
				
	it('should update properties of created lifecycle version -> valuation date updated to lifecycle period', function() {
		// arrange	
		// insert an existing LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"VALUATION_DATE" : new Date("2017-08-20T09:01:02.000Z").toJSON(),  // some specific date
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}'`);
		
		// check that time period suffix has been added to the version name
		expect(oCreatedLifecycleVersion.columns.VALUATION_DATE.rows[0].toString()).toBe('Thu Aug 20 2020 00:00:00 GMT+0000 (Coordinated Universal Time)'); // months of lifecycle period added to valuation date
	});

	it('should update properties of created lifecycle version -> valuation date updated to lifecycle period when lifecycle period type is custom', function() {
		// arrange
		oMockstar.clearTable("project_lifecycle_period_type");
		oMockstar.clearTable("lifecycle_period_value");
		oMockstar.insertTableData("lifecycle_period_value", oLifecycleMonthlyPeriodValueTestData);
		oMockstar.insertTableData("project_lifecycle_period_type", oProjectLifecyclePeriodTypeDataCustom);
		oMockstar.insertTableData("project_monthly_lifecycle_period", oProjectMonthlyLifecyclePeriodData);

		// insert an existing LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"VALUATION_DATE" : new Date("2017-08-20T09:01:02.000Z").toJSON(),  // some specific date
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}'`);
		
		// check that time period suffix has been added to the version name
		expect(oCreatedLifecycleVersions.columns.VALUATION_DATE.rows[0].toString()).toBe('Mon Jan 20 2020 00:00:00 GMT+0000 (Coordinated Universal Time)'); // months of lifecycle period added to valuation date
		expect(oCreatedLifecycleVersions.columns.VALUATION_DATE.rows[1].toString()).toBe('Sat Feb 20 2021 00:00:00 GMT+0000 (Coordinated Universal Time)');
	});
	
	it('should create lc versions for two lifecycle periods of one base version', function() {
		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		// Check entries in t_calculation_version
		let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
		let sBaseVersionName = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
		let oExpectedLifecycleVersions = {
			BASE_VERSION_ID: [iBaseVersionToCopyId, iBaseVersionToCopyId],
			CALCULATION_VERSION_NAME: [ sBaseVersionName + " - 2020", sBaseVersionName + " - 2021"],
			CALCULATION_VERSION_TYPE: [2, 2],
			LIFECYCLE_PERIOD_FROM: [oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]]
		};
		expect(oCreatedLifecycleVersions).toMatchData(oExpectedLifecycleVersions, [ "LIFECYCLE_PERIOD_FROM" ]);

		// check amount of copied items
		let oCreatedItems = oMockstar.execQuery(			
		    `select it.calculation_version_id, it.item_id from {{item}} it 
		    	inner join {{calculation_version}} cv 
		    	on it.calculation_version_id = cv.calculation_version_id where cv.base_version_id = '${iBaseVersionToCopyId}'`
		    );
		
		let iCvId1 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[0];
		let iCvId2 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[1];
		// 3 items x 2 lifecycle versions expected
		let oExpectedItems = {
			CALCULATION_VERSION_ID: [iCvId1, iCvId1, iCvId1, iCvId2, iCvId2, iCvId2],
			ITEM_ID:                [  3001,   3002,   3003,   3001,   3002,   3003]
		};
		expect(oCreatedItems).toMatchData(oExpectedItems, [ "CALCULATION_VERSION_ID", "ITEM_ID" ]);
	});

	
	it('should update properties of created lifecycle version -> IS_DISABLING_ACCOUNT_DETERMINATION = 1', function() {
		// arrange	
		// insert items with IS_DISABLING_ACCOUNT_DETERMINATION = 1
		oMockstar.clearTable("item");
		let aExistingCalculationVersionItemsTestData = new TestDataUtility(testData.oItemTestData).getObjects([0,1,2,3,4,5]);
		aExistingCalculationVersionItemsTestData[1].IS_DISABLING_ACCOUNT_DETERMINATION = 1;
		aExistingCalculationVersionItemsTestData[2].IS_DISABLING_ACCOUNT_DETERMINATION = 1;
		oMockstar.insertTableData("item", aExistingCalculationVersionItemsTestData);
		// insert an existing LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"VALUATION_DATE" : new Date("2017-08-20T09:01:02.000Z").toJSON(),  
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersionItems = oMockstar.execQuery(`select * from {{item}} where calculation_version_id = '${iExistingVersionId}'`);
		// check that IS_DISABLING_ACCOUNT_DETERMINATION from lifecycle version items is 1
		expect(oCreatedLifecycleVersionItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[1]).toBe(1); 
		expect(oCreatedLifecycleVersionItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[2]).toBe(1);
	});

	it('should update properties of created lifecycle version -> IS_DISABLING_ACCOUNT_DETERMINATION = 0', function() {
		// arrange	
		// insert an existing LC version
		let aExistingCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObjects([0]);
		_.extend(aExistingCalculationVersionTestData[0],  {
				"BASE_VERSION_ID" : iBaseVersionToCopyId,
				"CALCULATION_VERSION_ID" : iExistingVersionId,
				"CALCULATION_VERSION_NAME": "Calc vers" + iExistingVersionId,
				"CALCULATION_VERSION_TYPE" : 2,
				"VALUATION_DATE" : new Date("2017-08-20T09:01:02.000Z").toJSON(),  
				"LIFECYCLE_PERIOD_FROM" : oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0]
		});			
		oMockstar.insertTableData("calculation_version", aExistingCalculationVersionTestData);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert
		let oCreatedLifecycleVersionItems = oMockstar.execQuery(`select * from {{item}} where calculation_version_id = '${iExistingVersionId}'`);
		// check that time period suffix has been added to the version name
		expect(oCreatedLifecycleVersionItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[0]).toBe(0);
		expect(oCreatedLifecycleVersionItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[1]).toBe(0); 
		expect(oCreatedLifecycleVersionItems.columns.IS_DISABLING_ACCOUNT_DETERMINATION.rows[2]).toBe(0);
	});
	
	it('should create lc versions for two lifecycle periods of two base versions of one project', function() {
		// arrange	
		
		// create rules for 2 base versions to calculate
		let iSecondBaseVersionToCopyId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1];
		let oProjectTotalQuantities = {
				"PROJECT_ID" : 				[ testData.iProjectId, 											testData.iProjectId],
				"CALCULATION_ID" : 			[ testData.oCalculationTestData.CALCULATION_ID[0], 	testData.oCalculationTestData.CALCULATION_ID[1] ],
				"CALCULATION_VERSION_ID" : 	[ iBaseVersionToCopyId, 							iSecondBaseVersionToCopyId],
				"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, 							testData.sExpectedDate],
				"LAST_MODIFIED_BY" :[ testData.sTestUser, 								testData.sTestUser ]
			};
		oMockstar.clearTable("project_lifecycle_configuration");
		oMockstar.insertTableData("project_lifecycle_configuration", oProjectTotalQuantities);
		
		// add second lifecycle period
		let oLifecyclePeriodValue = {
				"PROJECT_ID":				[ testData.iProjectId, testData.iProjectId, testData.iProjectId, testData.iProjectId ],
				"CALCULATION_ID" : 		    [ testData.iCalculationId , testData.iCalculationId, testData.iSecondCalculationId, testData.iSecondCalculationId ],
				"LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1452, 1440, 1452],
				"VALUE" : 					[   20,   30,	40,   50],
				"LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate, testData.sExpectedDate],
				"LAST_MODIFIED_BY" :[ testData.sTestUser, testData.sTestUser, testData.sTestUser , testData.sTestUser ]
			};
		oMockstar.clearTable("lifecycle_period_value"); 
		oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValue);

		//act
		_invokeProcedureForLifecycleVersions();

		//assert

		// check entries in t_calculation_version		
		let oCreatedLifecycleVersion = oMockstar.execQuery(
					`select * from {{calculation_version}} 
					where base_version_id = '${iBaseVersionToCopyId}' or base_version_id = '${iSecondBaseVersionToCopyId}'`);
		let sBaseVersionName = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
		let sSecondBaseVersionName = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[1];
		let oExpectedLifecycleVersions = {
			BASE_VERSION_ID: 			[iBaseVersionToCopyId, 							iBaseVersionToCopyId, 							iSecondBaseVersionToCopyId, 					iSecondBaseVersionToCopyId],
			CALCULATION_VERSION_NAME: 	[sBaseVersionName + " - 2020", 					sBaseVersionName + " - 2021", 					sSecondBaseVersionName + " - 2020", 			sSecondBaseVersionName + " - 2021"],
			CALCULATION_VERSION_TYPE: 	[2, 											2, 												2, 												2],
			LIFECYCLE_PERIOD_FROM: 		[oLifecyclePeriodValue.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValue.LIFECYCLE_PERIOD_FROM[1], oLifecyclePeriodValue.LIFECYCLE_PERIOD_FROM[2], oLifecyclePeriodValue.LIFECYCLE_PERIOD_FROM[3]]
		};
		expect(oCreatedLifecycleVersion).toMatchData(oExpectedLifecycleVersions, [ "CALCULATION_VERSION_NAME" ]);
		
		// check amount of copied items
		let oCreatedItems = oMockstar.execQuery(
		    `select it.ITEM_ID from {{item}} it inner join {{calculation_version}} cv on it.calculation_version_id = cv.calculation_version_id 
				where cv.base_version_id = '${iBaseVersionToCopyId}' or base_version_id = '${iSecondBaseVersionToCopyId}' `
		    );
		expect(oCreatedItems.columns.ITEM_ID.rows.length).toBe(8); // = 3 items x 2 lifecycle versions + 1 items x 2 lifecycle versions
	});

	
	describe('update references', function() {
	    var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedLifecycleCalculationVersion(jasmine.plcTestRunParameters.generatedFields);
	    var iReferencingItemId = oBuiltTestData.ReferencingItemId;

		beforeEach(function() {
			oMockstar.clearTables(['calculation', 'calculation_version', 'item', 'item_ext']);

			oMockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);
			oMockstar.insertTableData("calculation_version", oBuiltTestData.CalcVerTestData);
			oMockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);

			if(jasmine.plcTestRunParameters.generatedFields === true){
				var aCustomFields = oBuiltTestData.CustomFields;

				oMockstar.insertTableData("item_ext", oBuiltTestData.ItemExtTestData); 
			}
		});
		
		it('should update when lifecycle version for same period of referenced version exists -> set reference to it and take over root item values', function() {
            oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedLifecycleCalculationVersion(
                    jasmine.plcTestRunParameters.generatedFields, 
                    oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], // insert lifecycle version of referenced base version with same lifecycle period
                    1); 
			// arrange
			oMockstar.insertTableData("calculation_version", oBuiltTestData.ReferencedLifecycleVersion);
			oMockstar.insertTableData("item", oBuiltTestData.ReferencedLifecycleVersionItems);
	        if(jasmine.plcTestRunParameters.generatedFields === true){
	            oMockstar.insertTableData("item_ext", oBuiltTestData.ReferencedExtLifecycleVersionItems);
	        }

			//act
			_invokeProcedureForLifecycleVersions();

			//assert
			let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
	        var iCreatedLifecycleVersionId = oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0];
			let oUpdatedMasterItem = oMockstar.execQuery(
			    `select * from {{item}} where calculation_version_id = '${iCreatedLifecycleVersionId}' and item_id = '${iReferencingItemId}'`);
			// Item references lifecycle version
			expect(oUpdatedMasterItem.columns.REFERENCED_CALCULATION_VERSION_ID.rows[0]).toBe(4810);
			
			// check that root item values were taken over
			var rootItem = oBuiltTestData.ReferencedLifecycleVersionItems;
			var oExpectedMasterItem = {
			    ITEM_ID:                    iReferencingItemId,
			    PRICE_FIXED_PORTION:        rootItem.TOTAL_COST_FIXED_PORTION,
			    PRICE_VARIABLE_PORTION:     rootItem.TOTAL_COST_VARIABLE_PORTION,
			    PRICE:                      rootItem.TOTAL_COST,
			    TRANSACTION_CURRENCY_ID: oCreatedLifecycleVersion.columns.REPORT_CURRENCY_ID.rows[0],
			    PRICE_UNIT:                 rootItem.TOTAL_QUANTITY,
			    PRICE_UNIT_UOM_ID:          rootItem.TOTAL_QUANTITY_UOM_ID,
			    PRICE_SOURCE_ID:            rootItem.PRICE_SOURCE_ID,
			    ACCOUNT_ID:                 rootItem.ACCOUNT_ID,
			    IS_ACTIVE:                  rootItem.IS_ACTIVE
			};
			expect(oUpdatedMasterItem).toMatchData(oExpectedMasterItem, ["ITEM_ID"]);
			
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
			    // check that ext root item values were taken over
			    let oExpectedExtItems = oBuiltTestData.ReferencedExtLifecycleVersionItems;
	    		oExpectedExtItems.CALCULATION_VERSION_ID = iCreatedLifecycleVersionId;
	    		oExpectedExtItems.ITEM_ID = iReferencingItemId;

				let oUpdatedExtItems = oMockstar.execQuery(
				    `select * from {{item_ext}} where calculation_version_id = '${iCreatedLifecycleVersionId}' and item_id = '${iReferencingItemId}'`);
				expect(oUpdatedExtItems).toMatchData(oExpectedExtItems, ['ITEM_ID']);
			}
		});

		it('should update when lifecycle versions for same period and previous period of referenced version exist -> set reference to version with same period', function() {
			
            oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedLifecycleCalculationVersion(
                    jasmine.plcTestRunParameters.generatedFields, 
                    oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], // insert lifecycle version of base version with same lifecycle period
                    1);
			// arrange
			oMockstar.insertTableData("calculation_version", oBuiltTestData.ReferencedLifecycleVersion);
			oMockstar.insertTableData("item", oBuiltTestData.ReferencedLifecycleVersionItems);
			
            oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedLifecycleCalculationVersion(
                    jasmine.plcTestRunParameters.generatedFields, 
                    oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0] - 12, // insert lifecycle version of base version with previous lifecycle period
                    2); 
			// arrange
			oMockstar.insertTableData("calculation_version", oBuiltTestData.ReferencedLifecycleVersion);
			oMockstar.insertTableData("item", oBuiltTestData.ReferencedLifecycleVersionItems);

			//act
			_invokeProcedureForLifecycleVersions();

			//assert
			let oCreatedLifecycleVersion = oMockstar.execQuery("select * from {{calculation_version}} where base_version_id = " + iBaseVersionToCopyId);
	        let iCreatedLifecycleVersionId = oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0];
			let oCreatedItems = oMockstar.execQuery(
				    `select * from {{item}} where calculation_version_id = '${iCreatedLifecycleVersionId}' and item_id = '${iReferencingItemId}' `
			        );
			// Item references lifecycle version
			expect(oCreatedItems.columns.REFERENCED_CALCULATION_VERSION_ID.rows[0]).toBe(4810);
		});
		
		it('should update when lifecycle version for previous period of referenced version exists -> set reference to it', function() {
			// arrange
			// insert an existing LC version with 1 root item
			oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedLifecycleCalculationVersion(
                    jasmine.plcTestRunParameters.generatedFields, 
                    oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0] - 12, // insert lifecycle version of base version with previous lifecycle period
                    2); 
			oMockstar.insertTableData("calculation_version", oBuiltTestData.ReferencedLifecycleVersion);
			oMockstar.insertTableData("item", oBuiltTestData.ReferencedLifecycleVersionItems);

			//act
			_invokeProcedureForLifecycleVersions();

			//assert
		    let oCreatedLifecycleVersion = oMockstar.execQuery("select * from {{calculation_version}} where base_version_id = " + iBaseVersionToCopyId);
	        let iCreatedLifecycleVersionId = oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0];
			let oCreatedItems = oMockstar.execQuery(
				    `select * from {{item}} where calculation_version_id = '${iCreatedLifecycleVersionId}' and item_id = '${iReferencingItemId}' `
			        );
			// Item references lifecycle version
			expect(oCreatedItems.columns.REFERENCED_CALCULATION_VERSION_ID.rows[0]).toBe(4811);
		});
		
		it('should not update when no lifecycle version for same or previous period of referenced version exists -> stay with reference to base version', function() {
			// arrange + act
			_invokeProcedureForLifecycleVersions();

			//assert
			let oCreatedLifecycleVersion = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
	        let iCreatedLifecycleVersionId = oCreatedLifecycleVersion.columns.CALCULATION_VERSION_ID.rows[0];
	        
			let oCreatedItems = oMockstar.execQuery(
				    `select * from {{item}} where calculation_version_id = '${ iCreatedLifecycleVersionId }' and item_id = '${iReferencingItemId}' `
			        );
			// item references the base reference version
			expect(oCreatedItems.columns.REFERENCED_CALCULATION_VERSION_ID.rows[0]).toBe(testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1]);
		});

	});

	describe("one_time_costs", function(){

		beforeEach(function() {
			oMockstar.clearTables(['one_time_project_cost', 'project_lifecycle_configuration']);
			oMockstar.insertTableData('one_time_project_cost', oOneTimeProjectCost);
			oMockstar.insertTableData('account', testData.oAccountForItemTestData);
			oMockstar.execSingle('update {{item}} set predecessor_item_id = null');
		});

		it('should add the items for one time cost for project to the created lifecycle versions when there exists a lifecycle configuration with one_time_cost_assigned = 1 having only manual distribution', function(){

			//arrange
			oMockstar.insertTableData('project_lifecycle_configuration',{
					"PROJECT_ID": [sProjectId],
					"CALCULATION_ID":	[testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"CALCULATION_VERSION_ID":[testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
					"IS_ONE_TIME_COST_ASSIGNED":[1],
					"MATERIAL_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES"],
					"ACTIVITY_PRICE_SURCHARGE_STRATEGY":["NO_SURCHARGES"],
					"LAST_MODIFIED_ON": [testData.sExpectedDate],
					"LAST_MODIFIED_BY": [testData.sTestUser]
			});

			oMockstar.insertTableData('one_time_cost_lifecycle_value',{
					"ONE_TIME_COST_ID":[1000, 1000, 1001, 1001],
					"CALCULATION_ID":[testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"LIFECYCLE_PERIOD_FROM":[oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]],
					"VALUE": [3000, 4000, 5000, 6000]
			});

			oMockstar.insertTableData('one_time_product_cost', {
					"ONE_TIME_COST_ID": [1000,1001],
					"CALCULATION_ID": [testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"COST_TO_DISTRIBUTE": [7000,11000],
					"COST_NOT_DISTRIBUTED": [7000, 11000],
					"DISTRIBUTION_TYPE": [2,2],
					"LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate],
					"LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser]
			});

			//act
			oMockstar.call(sProjectId, sSessionId, true, null, 'Distributed Costs');

			//asert
			// check created lifecycle version

			// Check entries in t_calculation_version
			let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
			let sBaseVersionName = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
			let oExpectedLifecycleVersions = {
				BASE_VERSION_ID: [iBaseVersionToCopyId, iBaseVersionToCopyId],
				CALCULATION_VERSION_NAME: [ sBaseVersionName + " - 2020", sBaseVersionName + " - 2021"],
				CALCULATION_VERSION_TYPE: [2, 2],
				LIFECYCLE_PERIOD_FROM: [oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]]
			};
			expect(oCreatedLifecycleVersions).toMatchData(oExpectedLifecycleVersions, [ "LIFECYCLE_PERIOD_FROM" ]);

			// check amount of copied items
			let oCreatedItems = oMockstar.execQuery(
				`select it.calculation_version_id,
					it.item_id,
					it.parent_item_id,
					it.predecessor_item_id,
					it.is_active,
					it.item_category_id,
					it.item_description,
					it.account_id,
					it.quantity,
					it.quantity_is_manual,
					it.quantity_uom_id,
					it.total_quantity_depends_on,
					it.price_fixed_portion,
					it.price_fixed_portion_is_manual,
					it.price_variable_portion,
					it.price_variable_portion_is_manual,
					it.transaction_currency_id,
					it.price_unit,
					it.price_unit_uom_id
				from {{item}} it
					inner join {{calculation_version}} cv
					on it.calculation_version_id = cv.calculation_version_id where cv.base_version_id = '${iBaseVersionToCopyId}'
					order by it.calculation_version_id,it.item_id`
				);

			let iCvId1 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[0];
			let iCvId2 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[1];
			// 6 items x 2 lifecycle versions expected
			let oExpectedItems = {
				CALCULATION_VERSION_ID: 			[iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2],
				ITEM_ID:                			[  3001,   3002,   3003,   3004,   3005,   3006, 3001,   3002,   3003,   3004,   3005,   3006],
				PARENT_ITEM_ID:						[  null,   3001,   3002,   3001,   3004,   3004, null,   3001,   3002,   3001,   3004,   3004],
				PREDECESSOR_ITEM_ID:				[  null,   3004,   null,   null,   null,   3005, null,   3004,   null,   null,   null,   3005],
				IS_ACTIVE:							[  	  1,	  1,	  1,	  1,	  1,	  1,	1,		1,		1,		1,		1,		1],
				ITEM_CATEGORY_ID:					[	  0,	  1,	  3,	  8,	  8,	  8,	0,	    1,	    3,	    8,	    8,	    8],
				ITEM_DESCRIPTION:					[	 "",	 "",	 "",	"Distributed Costs", "Investment", "Process","",	 "",	 "",	"Distributed Costs", "Investment", "Process"],
				ACCOUNT_ID:							[	"0",	"0",	"625000", null, sAccountId, sAccountId,"0",	"0",	"625000", null, sAccountId, sAccountId],
				QUANTITY:							[	"1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000"],
				QUANTITY_IS_MANUAL:					[  	null,	  1,	  1,	  1,	  1,	  1, null,		1,		1,		1,		1,		1],
				QUANTITY_UOM_ID:					[	"PC",  "PC",	"H",   "PC",   "PC",   "PC",  "PC",  "PC",    "H",   "PC",  "PC",    "PC"],
				TOTAL_QUANTITY_DEPENDS_ON:			[	  1,	  1,	  1,	  0,	  0,      0,    1,	    1,	    1,	    0,	   0,       0],
				PRICE_FIXED_PORTION:				["0.0000000", "2772.3600000", "2246.8800000", null, "600.0000000", "2500.0000000", "0.0000000", "2772.3600000", "2246.8800000", null, "800.0000000", "3000.0000000"],
				PRICE_FIXED_PORTION_IS_MANUAL:		[	  0,      0,      1,   null,      1,      1,	0,      0,      1,   null,      1,      1],
				PRICE_VARIABLE_PORTION:				["0.0000000", "0.0000000", "415.6600000", null, "2400.0000000", "2500.0000000","0.0000000", "0.0000000", "415.6600000", null, "3200.0000000", "3000.0000000"],
				PRICE_VARIABLE_PORTION_IS_MANUAL:	[	  0,      0,      1,   null,      1,      1,	0,      0,      1,   null,      1,      1],
				TRANSACTION_CURRENCY_ID:			[	"EUR", "EUR", "EUR", null, "EUR", "EUR", "EUR", "EUR", "EUR", null, "EUR", "EUR"],
				PRICE_UNIT:							["0.0000000", "100.0000000", "100.0000000", null, "1.0000000", "1.0000000", "0.0000000", "100.0000000", "100.0000000", null, "1.0000000", "1.0000000"],
				PRICE_UNIT_UOM_ID:					[	 "H",    "H",    "H",  null,	 "PC",	 "PC", "H",    "H",    "H",  null,	 "PC",	 "PC"]
			};
			expect(oCreatedItems).toMatchData(oExpectedItems, [ "CALCULATION_VERSION_ID", "ITEM_ID" ]);
			expect(mockstarHelpers.getRowCount(oMockstar, "calculation_version", "calculation_version_id = " + iExistingManualVersionId)).toBe(0); // entry should not exist

			if(jasmine.plcTestRunParameters.generatedFields === true){				
				// 6 items per generated lifecycle, all must have records in t_item_ext 				
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iCvId1)).toBe(6);
				expect(mockstarHelpers.getRowCount(oMockstar, "item_ext", "calculation_version_id = " + iCvId2)).toBe(6);						
			}
		});


		it('should not add the items for one time cost for project to the created lifecycle versions when there exists a lifecycle configuration with one_time_cost_assigned = 0', function() {

			//arrange
			oMockstar.insertTableData('project_lifecycle_configuration',{
				"PROJECT_ID": [sProjectId],
				"CALCULATION_ID":	[testData.oCalculationVersionTestData.CALCULATION_ID[0]],
				"CALCULATION_VERSION_ID":[testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
				"IS_ONE_TIME_COST_ASSIGNED":[0],
				"MATERIAL_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES"],
				"ACTIVITY_PRICE_SURCHARGE_STRATEGY":["NO_SURCHARGES"],
				"LAST_MODIFIED_ON": [testData.sExpectedDate],
				"LAST_MODIFIED_BY": [testData.sTestUser]
			});

			//act
			_invokeProcedureForLifecycleVersions();

			//assert
			// Check entries in t_calculation_version
			let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
			let sBaseVersionName = testData.oCalculationVersionTestData.CALCULATION_VERSION_NAME[0];
			let oExpectedLifecycleVersions = {
				BASE_VERSION_ID: [iBaseVersionToCopyId, iBaseVersionToCopyId],
				CALCULATION_VERSION_NAME: [ sBaseVersionName + " - 2020", sBaseVersionName + " - 2021"],
				CALCULATION_VERSION_TYPE: [2, 2],
				LIFECYCLE_PERIOD_FROM: [oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]]
			};
			expect(oCreatedLifecycleVersions).toMatchData(oExpectedLifecycleVersions, [ "LIFECYCLE_PERIOD_FROM" ]);

			// check amount of copied items
			let oCreatedItems = oMockstar.execQuery(
				`select it.calculation_version_id, it.item_id from {{item}} it
					inner join {{calculation_version}} cv
					on it.calculation_version_id = cv.calculation_version_id where cv.base_version_id = '${iBaseVersionToCopyId}'`
				);

			let iCvId1 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[0];
			let iCvId2 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[1];
			// 3 items x 2 lifecycle versions expected
			let oExpectedItems = {
				CALCULATION_VERSION_ID: [iCvId1, iCvId1, iCvId1, iCvId2, iCvId2, iCvId2],
				ITEM_ID:                [  3001,   3002,   3003,   3001,   3002,   3003]
			};
			expect(oCreatedItems).toMatchData(oExpectedItems, [ "CALCULATION_VERSION_ID", "ITEM_ID" ]);
		});

		it('should add the sOneTimeCostItemDescription text to the parent items', function(){

			//arrange
			oMockstar.insertTableData('project_lifecycle_configuration',{
					"PROJECT_ID": [sProjectId],
					"CALCULATION_ID":	[testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"CALCULATION_VERSION_ID":[testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
					"IS_ONE_TIME_COST_ASSIGNED":[1],
					"MATERIAL_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES"],
					"ACTIVITY_PRICE_SURCHARGE_STRATEGY":["NO_SURCHARGES"],
					"LAST_MODIFIED_ON": [testData.sExpectedDate],
					"LAST_MODIFIED_BY": [testData.sTestUser]
			});

			oMockstar.insertTableData('one_time_cost_lifecycle_value',{
					"ONE_TIME_COST_ID":[1000, 1000, 1001, 1001],
					"CALCULATION_ID":[testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"LIFECYCLE_PERIOD_FROM":[oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]],
					"VALUE": [3000, 4000, 5000, 6000]
			});

			oMockstar.insertTableData('one_time_product_cost', {
					"ONE_TIME_COST_ID": [1000,1001],
					"CALCULATION_ID": [testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
					"COST_TO_DISTRIBUTE": [7000,11000],
					"COST_NOT_DISTRIBUTED": [7000, 11000],
					"DISTRIBUTION_TYPE": [2,2],
					"LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate],
					"LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser]
			});

			//act
			oMockstar.call(sProjectId, sSessionId, false, null, sOneTimeCostItemDescription);

			//asert
			// check created lifecycle version

			// Check entries in t_calculation_version
			let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
		
			// check amount of copied items
			let oCreatedItems = oMockstar.execQuery(
				`select it.calculation_version_id,
					it.item_id,
					it.parent_item_id,
					it.predecessor_item_id,
					it.is_active,
					it.item_category_id,
					it.item_description,
					it.account_id,
					it.quantity,
					it.quantity_is_manual,
					it.quantity_uom_id,
					it.total_quantity_depends_on,
					it.price_fixed_portion,
					it.price_fixed_portion_is_manual,
					it.price_variable_portion,
					it.price_variable_portion_is_manual,
					it.transaction_currency_id,
					it.price_unit,
					it.price_unit_uom_id
				from {{item}} it
					inner join {{calculation_version}} cv
					on it.calculation_version_id = cv.calculation_version_id where cv.base_version_id = '${iBaseVersionToCopyId}'
					order by it.calculation_version_id,it.item_id`
				);

			let iCvId1 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[0];
			let iCvId2 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[1];
			// 6 items x 2 lifecycle versions expected
			let oExpectedItems = {
				CALCULATION_VERSION_ID: 			[iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2],
				ITEM_ID:                			[  3001,   3002,   3003,   3004,   3005,   3006, 3001,   3002,   3003,   3004,   3005,   3006],
				PARENT_ITEM_ID:						[  null,   3001,   3002,   3001,   3004,   3004, null,   3001,   3002,   3001,   3004,   3004],
				PREDECESSOR_ITEM_ID:				[  null,   3004,   null,   null,   null,   3005, null,   3004,   null,   null,   null,   3005],
				IS_ACTIVE:							[  	  1,	  1,	  1,	  1,	  1,	  1,	1,		1,		1,		1,		1,		1],
				ITEM_CATEGORY_ID:					[	  0,	  1,	  3,	  8,	  8,	  8,	0,	    1,	    3,	    8,	    8,	    8],
				ITEM_DESCRIPTION:					[	 "",	 "",	 "",	sOneTimeCostItemDescription, "Investment", "Process","",	 "",	 "",	sOneTimeCostItemDescription, "Investment", "Process"],
				ACCOUNT_ID:							[	"0",	"0",	"625000", null, sAccountId, sAccountId,"0",	"0",	"625000", null, sAccountId, sAccountId],
				QUANTITY:							[	"1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000"],
				PRICE_FIXED_PORTION:				["0.0000000", "2772.3600000", "2246.8800000", null, "600.0000000", "2500.0000000", "0.0000000", "2772.3600000", "2246.8800000", null, "800.0000000", "3000.0000000"],
				PRICE_FIXED_PORTION_IS_MANUAL:		[	  0,      0,      1,   null,      1,      1,	0,      0,      1,   null,      1,      1],
				PRICE_VARIABLE_PORTION:				["0.0000000", "0.0000000", "415.6600000", null, "2400.0000000", "2500.0000000","0.0000000", "0.0000000", "415.6600000", null, "3200.0000000", "3000.0000000"],
			};
			expect(oCreatedItems).toMatchData(oExpectedItems, [ "CALCULATION_VERSION_ID", "ITEM_ID" ]);
			});

			it('should leave the field for sOneTimeCostItemDescription empty if the procedure is called with an empty value', function(){

				//arrange
				oMockstar.insertTableData('project_lifecycle_configuration',{
						"PROJECT_ID": [sProjectId],
						"CALCULATION_ID":	[testData.oCalculationVersionTestData.CALCULATION_ID[0]],
						"CALCULATION_VERSION_ID":[testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0]],
						"IS_ONE_TIME_COST_ASSIGNED":[1],
						"MATERIAL_PRICE_SURCHARGE_STRATEGY": ["NO_SURCHARGES"],
						"ACTIVITY_PRICE_SURCHARGE_STRATEGY":["NO_SURCHARGES"],
						"LAST_MODIFIED_ON": [testData.sExpectedDate],
						"LAST_MODIFIED_BY": [testData.sTestUser]
				});
	
				oMockstar.insertTableData('one_time_cost_lifecycle_value',{
						"ONE_TIME_COST_ID":[1000, 1000, 1001, 1001],
						"CALCULATION_ID":[testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0], testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
						"LIFECYCLE_PERIOD_FROM":[oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[0], oLifecyclePeriodValueTestData.LIFECYCLE_PERIOD_FROM[1]],
						"VALUE": [3000, 4000, 5000, 6000]
				});
	
				oMockstar.insertTableData('one_time_product_cost', {
						"ONE_TIME_COST_ID": [1000,1001],
						"CALCULATION_ID": [testData.oCalculationVersionTestData.CALCULATION_ID[0],testData.oCalculationVersionTestData.CALCULATION_ID[0]],
						"COST_TO_DISTRIBUTE": [7000,11000],
						"COST_NOT_DISTRIBUTED": [7000, 11000],
						"DISTRIBUTION_TYPE": [2,2],
						"LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate],
						"LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser]
				});
	
				//act
				oMockstar.call(sProjectId, sSessionId, false, null, '');
	
				//asert
				// check created lifecycle version
	
				// Check entries in t_calculation_version
				let oCreatedLifecycleVersions = oMockstar.execQuery(`select * from {{calculation_version}} where base_version_id = '${iBaseVersionToCopyId}' `);
			
				// check amount of copied items
				let oCreatedItems = oMockstar.execQuery(
					`select it.calculation_version_id,
						it.item_id,
						it.parent_item_id,
						it.predecessor_item_id,
						it.is_active,
						it.item_category_id,
						it.item_description,
						it.account_id,
						it.quantity,
						it.quantity_is_manual,
						it.quantity_uom_id,
						it.total_quantity_depends_on,
						it.price_fixed_portion,
						it.price_fixed_portion_is_manual,
						it.price_variable_portion,
						it.price_variable_portion_is_manual,
						it.transaction_currency_id,
						it.price_unit,
						it.price_unit_uom_id
					from {{item}} it
						inner join {{calculation_version}} cv
						on it.calculation_version_id = cv.calculation_version_id where cv.base_version_id = '${iBaseVersionToCopyId}'
						order by it.calculation_version_id,it.item_id`
					);
	
				let iCvId1 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[0];
				let iCvId2 = oCreatedLifecycleVersions.columns.CALCULATION_VERSION_ID.rows[1];
				// 6 items x 2 lifecycle versions expected
				let oExpectedItems = {
					CALCULATION_VERSION_ID: 			[iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId1, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2, iCvId2],
					ITEM_ID:                			[  3001,   3002,   3003,   3004,   3005,   3006, 3001,   3002,   3003,   3004,   3005,   3006],
					PARENT_ITEM_ID:						[  null,   3001,   3002,   3001,   3004,   3004, null,   3001,   3002,   3001,   3004,   3004],
					PREDECESSOR_ITEM_ID:				[  null,   3004,   null,   null,   null,   3005, null,   3004,   null,   null,   null,   3005],
					IS_ACTIVE:							[  	  1,	  1,	  1,	  1,	  1,	  1,	1,		1,		1,		1,		1,		1],
					ITEM_CATEGORY_ID:					[	  0,	  1,	  3,	  8,	  8,	  8,	0,	    1,	    3,	    8,	    8,	    8],
					ITEM_DESCRIPTION:					[	 "",	 "",	 "",	"", "Investment", "Process","",	 "",	 "",	"", "Investment", "Process"],
					ACCOUNT_ID:							[	"0",	"0",	"625000", null, sAccountId, sAccountId,"0",	"0",	"625000", null, sAccountId, sAccountId],
					QUANTITY:							[	"1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000","1.0000000"],
					PRICE_FIXED_PORTION:				["0.0000000", "2772.3600000", "2246.8800000", null, "600.0000000", "2500.0000000", "0.0000000", "2772.3600000", "2246.8800000", null, "800.0000000", "3000.0000000"],
					PRICE_FIXED_PORTION_IS_MANUAL:		[	  0,      0,      1,   null,      1,      1,	0,      0,      1,   null,      1,      1],
					PRICE_VARIABLE_PORTION:				["0.0000000", "0.0000000", "415.6600000", null, "2400.0000000", "2500.0000000","0.0000000", "0.0000000", "415.6600000", null, "3200.0000000", "3000.0000000"],
				};
				expect(oCreatedItems).toMatchData(oExpectedItems, [ "CALCULATION_VERSION_ID", "ITEM_ID" ]);
				});
	});

}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);
