var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;

describe("p_project_check_manual_one_time_costs-tests", function () {
    
    var oMockstar = null;
    var sProjectId = "TEST_PROJECT";
    var sCalculationId1 = 1000
    var sCalculationId2 = 1001
    var sAccountId = "ACC10";
    
    var oLifecyclePeriodValueTestData = {
        "PROJECT_ID":				[ sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId, sProjectId],
        "CALCULATION_ID" : 		    [ sCalculationId1,sCalculationId1,sCalculationId1,sCalculationId1,sCalculationId2,sCalculationId2,sCalculationId2,sCalculationId2],
        "LIFECYCLE_PERIOD_FROM" : 	[ 1440, 1452, 1464, 1476, 1440, 1452, 1464, 1476],
        "VALUE" : 					['1000', '1000','500','500', '2000', '2000', '1000', '1000'],
        "LAST_MODIFIED_ON" : 		[ testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate,testData.sExpectedDate, testData.sExpectedDate],
        "LAST_MODIFIED_BY":         [ testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser,testData.sTestUser, testData.sTestUser ]
    };	

    beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_project_check_manual_one_time_costs", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						one_time_project_cost: "sap.plc.db::basis.t_one_time_project_cost", 
						one_time_product_cost: "sap.plc.db::basis.t_one_time_product_cost", 
						one_time_cost_lifecycle_value: "sap.plc.db::basis.t_one_time_cost_lifecycle_value",
						lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
					}
				});
	});
	
	afterOnce(function() {
		oMockstar.cleanup(); // clean up all test artefacts
	});


	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.insertTableData("lifecycle_period_value", oLifecyclePeriodValueTestData);
    });
    
    it('should return true if there is no one_time_costs defined for the project', function(){
        //act
       
        var iResult = oMockstar.call(sProjectId, null);

        //assert
        expect(iResult).toEqual(0); //true
    });
    
    it('should return true if the input data matches the cost defined on one_time_project/product_costs',function(){
        
        //arrange
        oMockstar.insertTableData("one_time_project_cost",{
            
                "ONE_TIME_COST_ID": 				[1000, 1001],
                "PROJECT_ID":						[sProjectId, sProjectId],
                "ACCOUNT_ID":						[sAccountId, sAccountId],
                "COST_DESCRIPTION":					['Investment', 'Process'],
                "COST_TO_DISTRIBUTE":				[30000,  20000],
                "COST_NOT_DISTRIBUTED":				[30000,  20000],
                "COST_CURRENCY_ID":					['EUR','EUR',],
                "FIXED_COST_PORTION":				[20,    50],
                "DISTRIBUTION_TYPE":				[ 2,     2],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [10000,20000, 20000],
            "COST_NOT_DISTRIBUTED": [10000,20000, 20000],
            "DISTRIBUTION_TYPE": [2,2,2],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        oMockstar.insertTableData('one_time_cost_lifecycle_value', {
            "ONE_TIME_COST_ID": [1000,1000,1000,1000,1001, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId1,sCalculationId2, sCalculationId2, sCalculationId1, sCalculationId1],
            "LIFECYCLE_PERIOD_FROM": [1440, 1452, 14440, 1452, 1440, 1452],
            "VALUE":[5000, 5000, 10000, 10000, 10000, 10000]
        });

        //act
        var iResult = oMockstar.call(sProjectId, null);

        //assert
        expect(iResult).toEqual(0); //true

    });

    it('should return false if all the manual one time product costs summed up does not equal the one time costs defined for project', function(){
        
        //arrange
        oMockstar.insertTableData("one_time_project_cost",{
            
                "ONE_TIME_COST_ID": 				[1000, 1001],
                "PROJECT_ID":						[sProjectId, sProjectId],
                "ACCOUNT_ID":						[sAccountId, sAccountId],
                "COST_DESCRIPTION":					['Investment', 'Process'],
                "COST_TO_DISTRIBUTE":				[30000,  20000],
                "COST_NOT_DISTRIBUTED":             [30000,  20000],
                "COST_CURRENCY_ID":					['EUR','EUR',],
                "FIXED_COST_PORTION":				[20,    50],
                "DISTRIBUTION_TYPE":				[ 2,     2],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [1000,1000, 1000],
            "COST_NOT_DISTRIBUTED": [1000,1000, 1000],
            "DISTRIBUTION_TYPE": [2,2,2],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        //act
        var iResult = oMockstar.call(sProjectId, null);
        
        var iExpectedResult = 47000;

        expect(iResult).toEqual(iExpectedResult);
        //assert
    });

    it('should return false if all the manual one time costs  lifecycle values summed up does not equal the one time costs defined for products', function(){
        
        //arrange
        oMockstar.insertTableData("one_time_project_cost",{
            
                "ONE_TIME_COST_ID": 				[1000, 1001],
                "PROJECT_ID":						[sProjectId, sProjectId],
                "ACCOUNT_ID":						[sAccountId, sAccountId],
                "COST_DESCRIPTION":					['Investment', 'Process'],
                "COST_TO_DISTRIBUTE":				[30000,  20000],
                "COST_NOT_DISTRIBUTED":				[30000,  20000],
                "COST_CURRENCY_ID":					['EUR','EUR',],
                "FIXED_COST_PORTION":				[20,    50],
                "DISTRIBUTION_TYPE":				[ 2,     2],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [10000,20000, 20000],
            "COST_NOT_DISTRIBUTED": [10000,20000, 20000],
            "DISTRIBUTION_TYPE": [2,2,2],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        oMockstar.insertTableData('one_time_cost_lifecycle_value', {
            "ONE_TIME_COST_ID": [1000,1000,1000,1000,1001, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId1,sCalculationId2, sCalculationId2, sCalculationId1, sCalculationId1],
            "LIFECYCLE_PERIOD_FROM": [1440, 1452, 14440, 1452, 1440, 1452],
            "VALUE":[5000, 5000, 10000, 10000, 10000, 9000]
        });

        //act
        var iResult = oMockstar.call(sProjectId, null);
        
        var iExpectedResult = 1000;

        expect(iResult).toEqual(iExpectedResult);
        //assert
    });


}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);
