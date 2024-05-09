/*jslint undef:true*/

var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe('sap.plc.db.management.procedures::p_unlock_calculation_version', function() {

    var testPackage = $.session.getUsername().toLowerCase();
    var oMockstar = null;
	var iCalculationVersionId = 2809;
    var sSessionId = "TestSession";
    var sLockingSessionId = "User 1";

    var oOpenCalculationVersionTestData = {
        "SESSION_ID": [sLockingSessionId, sSessionId],
        "CALCULATION_VERSION_ID": [iCalculationVersionId, 4809],
        "IS_WRITEABLE": [1,1]
    };
    
    var oCalculationVersionTestData = {
            "SESSION_ID": [sLockingSessionId, sSessionId],
            "CALCULATION_VERSION_ID":[iCalculationVersionId,4809],
            "CALCULATION_ID":[1978,2078],
            "CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version"],
            "ROOT_ITEM_ID":[3001,5001],
            "REPORT_CURRENCY_ID":["EUR","USD"],
            "VALUATION_DATE":["2014-06-01","2014-06-01"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00","2014-04-23 08:00:00"],
            "LAST_MODIFIED_BY":["Torsten","Detlef"],
            "MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00","2014-04-23 08:00:00"],
            "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy],
            "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy]
		};

    var oItemTestData = {
            "SESSION_ID": [sLockingSessionId, sLockingSessionId, sLockingSessionId, sSessionId],
            "ITEM_ID":[3001,3002,3003,5001],
            "CALCULATION_VERSION_ID":[iCalculationVersionId,iCalculationVersionId,iCalculationVersionId,4809],
            "PARENT_ITEM_ID":[0,3001,3002,0],
            "IS_ACTIVE":[1,1,1,1],
            "ITEM_CATEGORY_ID":[1,1,3,1],
            "CHILD_ITEM_CATEGORY_ID":[1,1,3,1],
            "ACCOUNT_ID":[0,0,625000,0],
            "CREATED_ON":["2014-04-23 08:00:00","2014-04-23 08:00:00","2014-04-25 08:00:00","2014-04-23 08:00:00"],
            "CREATED_BY":["D043604","D043604","D043604","D043604"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00","2014-04-23 08:00:00","2014-04-25 08:00:00","2014-04-23 08:00:00"],
            "LAST_MODIFIED_BY":["User1","User1","User1","User1"],
            "PRICE_FIXED_PORTION":                    [1,1,1,1],
			"PRICE_VARIABLE_PORTION":                 [0,0,0,0],
			"TRANSACTION_CURRENCY_ID":          ['EUR','EUR','EUR','EUR'],
			"PRICE_UNIT":                             [1,1,1,1],
			"PRICE_UNIT_UOM_ID":                      ['EUR','EUR','EUR','EUR']
		};
    
    if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemTestDataExt = testDataGenerator.createItemTempExtObjectFromObject(
									[3001,3002,3003,5001], 
									[iCalculationVersionId,iCalculationVersionId,iCalculationVersionId,4809], 
									[sLockingSessionId, sLockingSessionId, sLockingSessionId, sSessionId], testData.oItemExtData,4);
	}   

    beforeOnce(function() {
        oMockstar = new MockstarFacade( // Initialize Mockstar
		{
            testmodel: "sap.plc.db.management.procedures/p_unlock_calculation_version", // procedure or view under test
            substituteTables: // substitute all used tables in the procedure or view
            {
                open_calculation_versions :{
                	name: "sap.plc.db::basis.t_open_calculation_versions",
                	data: oOpenCalculationVersionTestData
                },
                calculation_version_temporary :{
                	name: "sap.plc.db::basis.t_calculation_version_temporary",
                	data: oCalculationVersionTestData
                },
                item_temporary : {
                	name: "sap.plc.db::basis.t_item_temporary",
                	data: oItemTestData
                },
                item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext"
            }
		});
    });

    afterOnce(function() {
    	//oMockstar.cleanup(); // clean up all test artefacts
    	oMockstar.cleanup(testPackage+"sap.plc.db.management.procedures");
    });

    beforeEach(function() {	
        oMockstar.clearAllTables(); // clear all specified substitute tables and views
        if(jasmine.plcTestRunParameters.generatedFields === true){
        	oMockstar.insertTableData("item_temporary_ext", oItemTestDataExt);
        }
        oMockstar.initializeData();
    });

    afterEach(function() {
    });

    it('should unlock a calculation version locked by a given userid (and not unlock others)', function() {
    	//act
    	var result = oMockstar.call(sLockingSessionId);
    	//assert
    	var result = oMockstar.execQuery("select SESSION_ID, CALCULATION_VERSION_ID, IS_WRITEABLE from {{open_calculation_versions}}");
 		expect(result).toMatchData({
 			SESSION_ID:     [sSessionId],
 			CALCULATION_VERSION_ID :   [4809],
 			IS_WRITEABLE : [1] 
 		}, ["SESSION_ID", "CALCULATION_VERSION_ID", "IS_WRITEABLE" ]);
 		
 		result = oMockstar.execQuery("select SESSION_ID,CALCULATION_VERSION_ID,CALCULATION_ID,CALCULATION_VERSION_NAME,ROOT_ITEM_ID,REPORT_CURRENCY_ID,LAST_MODIFIED_BY from {{calculation_version_temporary}}");
 		expect(result).toMatchData({
 			 "SESSION_ID": [ sSessionId],
             "CALCULATION_VERSION_ID":[4809],
             "CALCULATION_ID":[2078],
             "CALCULATION_VERSION_NAME":["Baseline Version"],
             "ROOT_ITEM_ID":[5001],
             "REPORT_CURRENCY_ID":["USD"],            
             "LAST_MODIFIED_BY":["Detlef"],            
 		}, ["SESSION_ID", "CALCULATION_VERSION_ID"]);
 		
 		result = oMockstar.execQuery("select  SESSION_ID, ITEM_ID, CALCULATION_VERSION_ID, PARENT_ITEM_ID, IS_ACTIVE, ITEM_CATEGORY_ID,CHILD_ITEM_CATEGORY_ID, ACCOUNT_ID, CREATED_BY, LAST_MODIFIED_BY, PRICE_FIXED_PORTION , PRICE_VARIABLE_PORTION  , TRANSACTION_CURRENCY_ID  , PRICE_UNIT  , PRICE_UNIT_UOM_ID  from {{item_temporary}}");
 		expect(result).toMatchData({
 			"SESSION_ID": [sSessionId],
            "ITEM_ID":[5001],
            "CALCULATION_VERSION_ID":[4809],
            "PARENT_ITEM_ID":[0],
            "IS_ACTIVE":[1],
            "ITEM_CATEGORY_ID":[1],
            "CHILD_ITEM_CATEGORY_ID":[1],        
            "ACCOUNT_ID":["0"],
            "CREATED_BY":["D043604"],
            "LAST_MODIFIED_BY":["User1"],
            "PRICE_FIXED_PORTION":                    ["1.0000000"],
			"PRICE_VARIABLE_PORTION":                 ["0.0000000"],
			"TRANSACTION_CURRENCY_ID":          ['EUR'],
			"PRICE_UNIT":                             ["1.0000000"],
			"PRICE_UNIT_UOM_ID":                      ['EUR']	
 		}, ["SESSION_ID", "ITEM_ID","CALCULATION_VERSION_ID" ]);
 		
 		if(jasmine.plcTestRunParameters.generatedFields === true){
 			result = oMockstar.execQuery("select * from {{item_temporary_ext}}");
 			expect(result).toMatchData({
 	            "SESSION_ID": [oItemTestDataExt["SESSION_ID"][3]],
 	            "ITEM_ID":[oItemTestDataExt["ITEM_ID"][3]],
 	            "CALCULATION_VERSION_ID":[oItemTestDataExt["CALCULATION_VERSION_ID"][3]],
 	    		"CUST_BOOLEAN_INT_MANUAL":[oItemTestDataExt["CUST_BOOLEAN_INT_MANUAL"][3]],
 				"CUST_STRING_MANUAL":[oItemTestDataExt["CUST_STRING_MANUAL"][3]], 
 			}, ["SESSION_ID", "ITEM_ID","CALCULATION_VERSION_ID" ]);
 		}
    });        
    
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);