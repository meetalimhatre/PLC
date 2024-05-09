var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;

describe("p_project_calculate_one_time_costs-tests", function () {
    
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
					testmodel: "sap.plc.db.calculationmanager.procedures/p_project_calculate_one_time_costs", // procedure or view under test
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
    
    it('should calculate correctly all time cost for project when distribution type is based_on_quantity for both t_one_time_project_cost and t_one_time_product_cost',function(){
        
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
                "DISTRIBUTION_TYPE":				[ 0,     0],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [1000,1000, 1000],
            "COST_NOT_DISTRIBUTED": [1000, 1000, 1000],
            "DISTRIBUTION_TYPE": [0,0,0],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        //act
        oMockstar.call(sProjectId);

        //assert

        var oExpectedOneTimeProjectCosts = {
            "ONE_TIME_COST_ID": [1000, 1001],
            "COST_NOT_DISTRIBUTED": ['0.0000000','0.0000000']
        };
        
        const oActualOneTimeProjectCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.cost_not_distributed from {{one_time_project_cost}} otpc
             where otpc.project_id = '${sProjectId}'`
        );

        expect(oActualOneTimeProjectCosts).toMatchData(oExpectedOneTimeProjectCosts,['ONE_TIME_COST_ID']);


        var oExpectedOneTimeProductCosts = {
            "ONE_TIME_COST_ID": [1000,1000,1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": ['9999.0000000','20000.0000000', '20000.0000000'],
            "COST_NOT_DISTRIBUTED": ['0.0000000', '0.0000000', '0.0000000']
        };

        const oActualOneTimeProductCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.calculation_id, otpc.cost_to_distribute, otpc.cost_not_distributed from {{one_time_product_cost}} otpc
                inner join {{one_time_project_cost}} pc
                on pc.one_time_cost_id = otpc.one_time_cost_id 
                and pc.project_id = '${sProjectId}'`
        );

        expect(oActualOneTimeProductCosts).toMatchData(oExpectedOneTimeProductCosts,['ONE_TIME_COST_ID']);

        var oExpectedOneTimeLifecyclePeriosValues = {
            "ONE_TIME_COST_ID": [1000,1000,1000,1000,1000,1000,1000,1000,1001,1001,1001,1001],
            "CALCULATION_ID": [sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1,sCalculationId2,sCalculationId2,sCalculationId2,sCalculationId2, sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1],
            "LIFECYCLE_PERIOD_FROM": [1440,1452,1464,1476,1440,1452,1464,1476,1440,1452,1464,1476],
            "VALUE": ['3333.3333333','3333.3333333','1666.6666666','1666.6666666', '6666.6666666','6666.6666666','3333.3333333', '3333.3333333', '6666.6666666','6666.6666666','3333.3333333', '3333.3333333']
        };

        const oActualOneTimeLifecyclePeriodsValues = oMockstar.execQuery(
            `select otclv.one_time_cost_id, otclv.calculation_id, otclv.lifecycle_period_from,otclv.value from {{one_time_cost_lifecycle_value}} otclv
            inner join {{one_time_project_cost}} pc
            on pc.one_time_cost_id = otclv.one_time_cost_id where pc.project_id = '${sProjectId}'
            order by otclv.one_time_cost_id, otclv.calculation_id,otclv.lifecycle_period_from
            `
        );

        expect(oActualOneTimeLifecyclePeriodsValues).toMatchData(oExpectedOneTimeLifecyclePeriosValues,['ONE_TIME_COST_ID']);

    });

    it('should calculate correctly all time cost for project when distribution type is equally distributed for both t_one_time_project_cost and t_one_time_product_cost',function(){
        
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
                "DISTRIBUTION_TYPE":				[ 1,     1],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [1000,1000, 1000],
            "COST_NOT_DISTRIBUTED": [1000,1000, 1000],
            "DISTRIBUTION_TYPE": [1,1,1],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        //act
        oMockstar.call(sProjectId);

        //assert

        var oExpectedOneTimeProjectCosts = {
            "ONE_TIME_COST_ID": [1000, 1001],
            "COST_NOT_DISTRIBUTED": ['0.0000000','0.0000000']
        };
        
        const oActualOneTimeProjectCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.cost_not_distributed from {{one_time_project_cost}} otpc
             where otpc.project_id = '${sProjectId}'`
        );

        expect(oActualOneTimeProjectCosts).toMatchData(oExpectedOneTimeProjectCosts,['ONE_TIME_COST_ID']);

        var oExpectedOneTimeProductCosts = {
            "ONE_TIME_COST_ID": [1000,1000,1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": ['15000.0000000','15000.0000000', '20000.0000000'],
            "COST_NOT_DISTRIBUTED": ['0.0000000', '0.0000000', '0.0000000']
        };

        const oActualOneTimeProductCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.calculation_id, otpc.cost_to_distribute, otpc.cost_not_distributed from {{one_time_product_cost}} otpc
                inner join {{one_time_project_cost}} pc
                on pc.one_time_cost_id = otpc.one_time_cost_id where pc.project_id = '${sProjectId}'`
            );

        expect(oActualOneTimeProductCosts).toMatchData(oExpectedOneTimeProductCosts,['ONE_TIME_COST_ID']);

        var oExpectedOneTimeLifecyclePeriosValues = {
            "ONE_TIME_COST_ID": [1000,1000,1000,1000,1000,1000,1000,1000,1001,1001,1001,1001],
            "CALCULATION_ID": [sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1,sCalculationId2,sCalculationId2,sCalculationId2,sCalculationId2, sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1],
            "LIFECYCLE_PERIOD_FROM": [1440,1452,1464,1476,1440,1452,1464,1476,1440,1452,1464,1476],
            "VALUE": ['3750.0000000','3750.0000000','3750.0000000','3750.0000000', '3750.0000000','3750.0000000','3750.0000000','3750.0000000', '5000.0000000','5000.0000000','5000.0000000','5000.0000000']
        };

        const oActualOneTimeLifecyclePeriodsValues = oMockstar.execQuery(
            `select otclv.one_time_cost_id, otclv.calculation_id, otclv.lifecycle_period_from,otclv.value from {{one_time_cost_lifecycle_value}} otclv
            inner join {{one_time_project_cost}} pc
            on pc.one_time_cost_id = otclv.one_time_cost_id where pc.project_id = '${sProjectId}'
            order by otclv.one_time_cost_id, otclv.calculation_id,otclv.lifecycle_period_from
            `
        );

        expect(oActualOneTimeLifecyclePeriodsValues).toMatchData(oExpectedOneTimeLifecyclePeriosValues,['ONE_TIME_COST_ID']);

    });

    it('should update cost to distribute for product cost when all quantity periods have value 0',function(){
        
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
                "DISTRIBUTION_TYPE":				[ 1,     1],
                "LAST_MODIFIED_BY":					[testData.sTestUser ,  testData.sTestUser],
                "LAST_MODIFIED_ON":					[testData.sExpectedDate, testData.sExpectedDate]
        });

        oMockstar.insertTableData('one_time_product_cost', {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": [1000,1000, 1000],
            "COST_NOT_DISTRIBUTED": [1000,1000, 1000],
            "DISTRIBUTION_TYPE": [1,1,1],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });

        oMockstar.clearTable('lifecycle_period_value');
        oMockstar.insertTableData('lifecycle_period_value', {
            "CALCULATION_ID": [sCalculationId1,sCalculationId2, sCalculationId1],
            "PROJECT_ID": [sProjectId,sProjectId,sProjectId],
            "LIFECYCLE_PERIOD_FROM": [1000,1001, 1002],
            "VALUE": [1000,0, 1000],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        });


        //act
        oMockstar.call(sProjectId);

        //assert
        var oExpectedOneTimeProductCosts = {
            "ONE_TIME_COST_ID": [1000,1000,1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": ['30000.0000000','0.0000000', '20000.0000000'],
            "COST_NOT_DISTRIBUTED": ['0.0000000', '0.0000000', '0.0000000']
        };

        const oActualOneTimeProductCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.calculation_id, otpc.cost_to_distribute, otpc.cost_not_distributed from {{one_time_product_cost}} otpc
                inner join {{one_time_project_cost}} pc
                on pc.one_time_cost_id = otpc.one_time_cost_id where pc.project_id = '${sProjectId}'`
            );

        expect(oActualOneTimeProductCosts).toMatchData(oExpectedOneTimeProductCosts,['ONE_TIME_COST_ID']);

    });

    it('should not modify one time costs value when distribution type is manual',function(){
        
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


        const oOneTimeProductCostsData =  {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": ['5000.0000000','4000.0000000','4000.0000000'],
            "COST_NOT_DISTRIBUTED": ['5000.0000000','4000.0000000','4000.0000000'],
            "DISTRIBUTION_TYPE": [2,2,2],
            "LAST_MODIFIED_ON": [testData.sExpectedDate,testData.sExpectedDate,testData.sExpectedDate,],
            "LAST_MODIFIED_BY": [testData.sTestUser,testData.sTestUser,testData.sTestUser]
        };
        oMockstar.insertTableData('one_time_product_cost',oOneTimeProductCostsData);


        const oExpectedOneTimeLifecyclePeriosValues = {
            "ONE_TIME_COST_ID": [1000,1000,1000,1000,1000,1000,1000,1000,1001,1001,1001,1001],
            "CALCULATION_ID": [sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1,sCalculationId2,sCalculationId2,sCalculationId2,sCalculationId2, sCalculationId1, sCalculationId1, sCalculationId1,sCalculationId1],
            "LIFECYCLE_PERIOD_FROM": [1440,1452,1464,1476,1440,1452,1464,1476,1440,1452,1464,1476],
            "VALUE": ['10000.0000000','5000.0000000','2500.0000000','2500.0000000', '2500.0000000','5000.0000000','2500.0000000', '0.0000000', '10000.0000000','5000.0000000','2500.0000000','2500.0000000']
        };
        oMockstar.insertTableData('one_time_cost_lifecycle_value',oExpectedOneTimeLifecyclePeriosValues);

        //act
        oMockstar.call(sProjectId);

        //assert

        var oExpectedOneTimeProjectCosts = {
            "ONE_TIME_COST_ID": [1000, 1001],
            "COST_NOT_DISTRIBUTED": ['30000.0000000','20000.0000000']
        };
        
        const oActualOneTimeProjectCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.cost_not_distributed from {{one_time_project_cost}} otpc
             where otpc.project_id = '${sProjectId}'`
        );

        expect(oActualOneTimeProjectCosts).toMatchData(oExpectedOneTimeProjectCosts,['ONE_TIME_COST_ID']);


        const oActualOneTimeProductCosts = oMockstar.execQuery(			
            `select otpc.one_time_cost_id, otpc.calculation_id, otpc.cost_to_distribute,otpc.cost_not_distributed,otpc.distribution_type
             from {{one_time_product_cost}} otpc
                inner join {{one_time_project_cost}} pc
                on pc.one_time_cost_id = otpc.one_time_cost_id where pc.project_id = '${sProjectId}'`
            );

        const oExpectedOneTimeProductCosts =  {
            "ONE_TIME_COST_ID": [1000,1000, 1001],
            "CALCULATION_ID": [sCalculationId1,sCalculationId2,sCalculationId1],
            "COST_TO_DISTRIBUTE": ['5000.0000000','4000.0000000','4000.0000000'],
            "COST_NOT_DISTRIBUTED": ['5000.0000000','4000.0000000','4000.0000000'],
            "DISTRIBUTION_TYPE": [2,2,2],
        };
        expect(oActualOneTimeProductCosts).toMatchData(oExpectedOneTimeProductCosts,['ONE_TIME_COST_ID']);
        
        const oActualOneTimeLifecyclePeriodsValues = oMockstar.execQuery(
            `select otclv.one_time_cost_id, otclv.calculation_id, otclv.lifecycle_period_from,otclv.value from {{one_time_cost_lifecycle_value}} otclv
            inner join {{one_time_project_cost}} pc
            on pc.one_time_cost_id = otclv.one_time_cost_id where pc.project_id = '${sProjectId}'
            order by otclv.one_time_cost_id, otclv.calculation_id,otclv.lifecycle_period_from
            `
        );

        expect(oActualOneTimeLifecyclePeriodsValues).toMatchData(oExpectedOneTimeLifecyclePeriosValues,['ONE_TIME_COST_ID']);

    });
    
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);