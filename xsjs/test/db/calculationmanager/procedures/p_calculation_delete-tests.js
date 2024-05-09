/*jslint undef:true*/

var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers  = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

describe('p_calculation_delete', function() {

    var testPackage = $.session.getUsername().toLowerCase();
    var mockstar = null;

    var oCalculationTestData = { 
            "CALCULATION_ID":[1978,2078,5078],
            "CALCULATION_NAME":["Kalkulation Pumpe P-100","Calculation Pump P-100","Calc Key Finder"],
            "CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
            "CREATED_BY":["D043604","D043604","D043604"],
            "LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
            "LAST_MODIFIED_BY":["D043604","D043604","D043604"]
        };
    
    var oItemTestData = {
            "ITEM_ID":[3001,3002,3003,5001],
            "CALCULATION_VERSION_ID":[2809,2809,2809,4809],
            "PARENT_ITEM_ID":[0,3001,3002,0],
            "IS_ACTIVE":[1,1,1,1],
            "ITEM_CATEGORY_ID":[1,1,3,1],
            "ACCOUNT_ID":[0,0,625000,0],
            "CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
            "CREATED_BY":["D043604","D043604","D043604","D043604"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
            "LAST_MODIFIED_BY":["Torsten","Detlef","Wilhem","User1"],
            "PRICE_FIXED_PORTION":                    ['1.0000000','1.0000000','1.0000000','1.0000000'],
			"PRICE_VARIABLE_PORTION":                 ['0.0000000','0.0000000','0.0000000','0.0000000'],
			"TRANSACTION_CURRENCY_ID":          ['EUR','EUR','EUR','EUR'],
			"PRICE_UNIT":                             ['1.0000000','1.0000000','1.0000000','1.0000000'],
			"PRICE_UNIT_UOM_ID":                      ['EUR','EUR','EUR','EUR']
		};
    
    if(jasmine.plcTestRunParameters.generatedFields === true){
    	var oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001,3002,3003,5001], [2809,2809,2809,4809],testData.oItemExtData,4);
    }
    
    var oCalculationVersionTestData = {
            "CALCULATION_VERSION_ID":[2809,4809,5809],
            "CALCULATION_ID":[1978,2078,5078],
            "CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version","Baseline Version"],
            "ROOT_ITEM_ID":[3001,5001,7001],
            "REPORT_CURRENCY_ID":["EUR","USD","EUR"],
            "VALUATION_DATE":["2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
            "LAST_MODIFIED_BY":["Torsten","Detlef","Wilhem","User1"],
            "MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
            "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
            "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
		};
    
    beforeOnce(function() {

        mockstar = new MockstarFacade( // Initialize Mockstar
            {
                testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_delete", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation: "sap.plc.db::basis.t_calculation",
                    item: "sap.plc.db::basis.t_item",
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    item_ext: "sap.plc.db::basis.t_item_ext" ,
                    project_lifecycle_configuration: "sap.plc.db::basis.t_project_lifecycle_configuration",
                    lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
                    authorization: "sap.plc.db::auth.t_auth_project",
                    one_time_project_cost: "sap.plc.db::basis.t_one_time_project_cost",
                    one_time_product_cost: "sap.plc.db::basis.t_one_time_product_cost",
                    one_time_cost_lifecycle_value: "sap.plc.db::basis.t_one_time_cost_lifecycle_value"
                }
            });
    });

    afterOnce(function() {
        //mockstar.cleanup(); // clean up all test artefacts
        mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
    });

    beforeEach(function() {
        mockstar.clearAllTables(); // clear all specified substitute tables and views
        mockstar.insertTableData("calculation", oCalculationTestData);
        mockstar.insertTableData("item", oItemTestData);
        mockstar.insertTableData("calculation_version", oCalculationVersionTestData);
        mockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
        mockstar.insertTableData("lifecycle_period_value",  testData.oLifecyclePeriodValues);
        mockstar.insertTableData("one_time_project_cost", testData.oProjectOneTimeProjectCost);
        mockstar.insertTableData("one_time_product_cost", testData.oProjectOneTimeProductCost);
        mockstar.insertTableData("one_time_cost_lifecycle_value", testData.oProjectOneTimeCostLifecycleValue);
        if(jasmine.plcTestRunParameters.generatedFields === true){
    		mockstar.insertTableData("item_ext", oItemTestDataExt);
        }
        mockstar.initializeData();
    });

    afterEach(function() {

    });
    
    it('should delete the calculation and associated calculations when calculation_id is valid', function() {
        //arrange
        var iCalculationID = 1978;
        var iCalculationVersionId = 2809;

        // Check that such calculation exists
        expect(mockstarHelpers .getRowCount(mockstar, "calculation", "calculation_id="+iCalculationID)).toBe(1);
        
	    var iOriginalCount_Calculation = mockstarHelpers .getRowCount(mockstar, "calculation");
    	var iOriginalCount_CalculationVersion = mockstarHelpers .getRowCount(mockstar, "calculation_version");
    	var iOriginalCount_ItemAll = mockstarHelpers .getRowCount(mockstar, "item");
    	var iOriginalCount_ItemCalcVersion = mockstarHelpers .getRowCount(mockstar, "item", "calculation_version_id="+iCalculationVersionId);

    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		var iOriginalCount_ItemExtAll = mockstarHelpers .getRowCount(mockstar, "item_ext");
    		var iOriginalCount_ItemCalcVersionExt = mockstarHelpers .getRowCount(mockstar, "item_ext", "calculation_version_id="+iCalculationVersionId);
    	}
    	
        //act
        var result = mockstar.call(iCalculationID, null);
        
        //assert
        expect(result).toBe(1);

        // Check that the entities have been deleted
        expect(mockstarHelpers .getRowCount(mockstar, "calculation", "calculation_id="+iCalculationID)).toBe(0);
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version", "calculation_id="+iCalculationID)).toBe(0);      
        
        // Check that other entities have not been deleted
	    expect(mockstarHelpers .getRowCount(mockstar, "calculation")).toBe(iOriginalCount_Calculation-1);
	    expect(mockstarHelpers .getRowCount(mockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion-1);
	    expect(mockstarHelpers .getRowCount(mockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);
	    
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers .getRowCount(mockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemCalcVersionExt);
	    }
    });
    
    it('should not delete any calculation or associated versions and items if calculation_id is invalid', function() {
        //arrange
        var iCalculationID = 1111;
        
        // check that the calculation does not exist
        expect(mockstarHelpers .getRowCount(mockstar, "calculation", "calculation_id="+iCalculationID)).toBe(0);
        // get the original number of entities
        var iExpectedCount_Calculation = mockstarHelpers .getRowCount(mockstar, "calculation");
        var iExpectedCount_CalcVersion = mockstarHelpers .getRowCount(mockstar, "calculation_version");
        var iExpectedCount_Item = mockstarHelpers .getRowCount(mockstar, "item");
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
    		var iExpectedCount_ItemExt = mockstarHelpers .getRowCount(mockstar, "item_ext");
        }

        //act
        var result = mockstar.call(iCalculationID, null);
        
        //assert
        expect(result).toBe(0);

        // Check that no entities have been deleted
        expect(mockstarHelpers .getRowCount(mockstar, "calculation")).toBe(iExpectedCount_Calculation);
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version")).toBe(iExpectedCount_CalcVersion);       
        expect(mockstarHelpers .getRowCount(mockstar, "item")).toBe(iExpectedCount_Item);
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
        	 expect(mockstarHelpers .getRowCount(mockstar, "item_ext")).toBe(iExpectedCount_ItemExt);
        }
    });
    
    it('should not delete the calculation when it contains source versions with master versions in different calculations', function() {
        //arrange
        var iCalculationID = 1978;
        
       //create an item that references the valid version 2809
    	var oReferencedItem = mockstarHelpers .convertToObject(testData.oItemTestData, 1);
		oReferencedItem.ITEM_ID = 4445;
		oReferencedItem.CALCULATION_VERSION_ID = 4809;
		oReferencedItem.REFERENCED_CALCULATION_VERSION_ID = 2809;
		oReferencedItem.ITEM_CATEGORY_ID = 10;
		mockstar.insertTableData("item", oReferencedItem);

        // Check that such calculation exists
        expect(mockstarHelpers .getRowCount(mockstar, "calculation", "calculation_id="+iCalculationID)).toBe(1);
        
	    var iOriginalCount_Calculation = mockstarHelpers .getRowCount(mockstar, "calculation");

        ///act
        var result = mockstar.call(iCalculationID, null);
        
        //assert
        expect(result).toBe(0);

        // Check that no entities have been deleted
        expect(mockstarHelpers .getRowCount(mockstar, "calculation")).toBe(iOriginalCount_Calculation);
    });
    
    it('should delete calculation total quantity and associated values', function() {
        // arrange
        var iCalculationId = testData.iCalculationId;
        var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration");
        var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value");
        
        // act
        var result = mockstar.call(iCalculationId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - 1);
        expect(mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 3);
        expect(mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration", "calculation_id="+iCalculationId)).toBe(0);
    });
    
        
    it('should not delete total quantity if is not defined for a calculation', function() {
        // arrange
        var iCalculationId = 999;
        var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration");
        var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value");
        
        // act
        var result = mockstar.call(iCalculationId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
        expect(mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
    });

    it('should delete one time costs associated with the calculation', function(){
        //arrange
        var iCalculationId = testData.iCalculationId;
        var iOriginalCountProductCost = mockstarHelpers.getRowCount(mockstar , "one_time_product_cost");
        var iOriginalCountLifecycleValues = mockstarHelpers.getRowCount(mockstar , "one_time_cost_lifecycle_value");

        // act
        var result = mockstar.call(iCalculationId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_product_cost")).toBe(iOriginalCountProductCost - 3);
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_cost_lifecycle_value")).toBe(iOriginalCountLifecycleValues - 2);
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_product_cost", "calculation_id="+iCalculationId)).toBe(0);
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_cost_lifecycle_value", "calculation_id="+iCalculationId)).toBe(0);
    });

    it('should not delete one time costs  if is not defined for the calculation', function() {
        // arrange
        var iCalculationId = 999;
        var iOriginalCountProductCost = mockstarHelpers.getRowCount(mockstar , "one_time_product_cost");
        var iOriginalCountLifecycleValues = mockstarHelpers.getRowCount(mockstar , "one_time_cost_lifecycle_value");
        
        // act
        var result = mockstar.call(iCalculationId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_product_cost")).toBe(iOriginalCountProductCost);
        expect(mockstarHelpers.getRowCount(mockstar, "one_time_cost_lifecycle_value")).toBe(iOriginalCountLifecycleValues);
    });

    it('should update cost not distributed for  manual one time project cost when calculation gets deleted', function(){
        //arrange
        var iCalculationId = testData.iCalculationId;
        var fCostToDistributeAssociatedWithCalculationId = 6000;
        var getCostNotDistributedForProject = `
            select cost_not_distributed
            from {{one_time_project_cost}}
            where project_id = 'PR1'
            order by one_time_cost_id                                                               
        `;
        var aOriginalCostNotDistributedForProject = mockstar.execQuery(getCostNotDistributedForProject);

        //act
        var result = mockstar.call(iCalculationId, null);
        var aUpdatedCostNotDistributedForProject = mockstar.execQuery(getCostNotDistributedForProject);

        //assert
        expect(aUpdatedCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[0]).toBe(aOriginalCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[0]); // no change for based on quantity distribution
        expect(aUpdatedCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[1]).toBe(aOriginalCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[1]); // no change for equally distribution
        expect(parseFloat(aUpdatedCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[2])).toBe(parseFloat(aOriginalCostNotDistributedForProject.columns.COST_NOT_DISTRIBUTED.rows[2]) + fCostToDistributeAssociatedWithCalculationId); // change only for manually distribution
    });
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);