// static imports
	var mockstar_helpers = require("../../testtools/mockstar_helpers");
	const helpers = require("../../../lib/xs/util/helpers");
	var testData = require("../../testdata/testdata").data;
	var authorizationUnroller = require("../../../lib/xs/authorization/authorization-unroller");
	const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;


	// Import constructors
	var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
	var PersistencyImport = $.import("xs.db", "persistency");
	var Persistency = PersistencyImport.Persistency;

	// Mockstar import & settings
	var persistency = null;

	var oMockstar = null;
	var sTestUser  = "Test";
	var sTestUser2 = "Test2";
	var sTestPlaceholder = 'DELETED';
	var sTestUserThatDoesntExistInTables = 'NoUser';
	var sExpectedRetentionDate = new Date();
	var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON();
	var sTestCustomer = "2";
	var sTestCustomerNotExist = "000";
	var sTestVendor = "5";
	var sTestVendor2 = "55";
	var sTestVendorNotExist = "999";
	var sTestProject = "PR1";
	var sTestProjectNotExist = "XXX";
	var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;
	const sDefaultPriceDeterminationStrategy = testData.sStandardPriceStrategy;

describe('xsjs.db.persistency-dataProtection-integrationtests', function() {

	var oRecentCalculationVersionTestData = {
			CALCULATION_VERSION_ID:     2809,
			USER_ID:                    sTestUser,
			LAST_USED_ON:               "2014-04-23 08:00:00"
	 };

	var oUsergroupUserTestData = {
	        USERGROUP_ID:               ["TestGroup","TestGroup"],
		    USER_ID:                    [sTestUser, sTestUser2]
	};

	var oLayoutPersonalTestData = {
            LAYOUT_ID:                  "10",
    	    USER_ID:                    sTestUser,
    	    IS_CURRENT:                 1
	};

	var oDefaultSettingsTestData = {
            USER_ID:                    sTestUser,
            CONTROLLING_AREA_ID:        "CA",
            COMPANY_CODE_ID:            "1000",
            PLANT_ID:                   "100",
            REPORT_CURRENCY_ID:         "EUR",
            COMPONENT_SPLIT_ID:         "10",
            COSTING_SHEET_ID:           "1",
            LIFECYCLE_PERIOD_INTERVAL:  12
	};

	var oLockTestData = {
            LOCK_OBJECT:                "1",
            USER_ID:                    sTestUser,
            LAST_UPDATED_ON:          sExpectedDateWithoutTime
	};

	var oInstallationLogTestData = {
            VERSION:                    1,
            VERSION_SP:                 1,
            VERSION_PATCH:              1,
            NAME:                       "log",
            TIME:                       sExpectedDateWithoutTime,
            EXECUTED_BY:        sTestUser,
            STEP:                       "run",
            STATE:                      "started"
	};

	var oAuthUserTestData = {
	        OBJECT_TYPE:                ["PROJECT", "PROJECT", "PROJECT", "PROJECT"],
            OBJECT_ID:                  ["1", "1", "2", "2"],
            USER_ID:                    [sTestUser, sTestUser2, sTestUser, sTestUser2],
            PRIVILEGE:                  ["READ","ADMINISTRATE","ADMINISTRATE","ADMINISTRATE"]
    };

    var oAuthUserTestDataAllAdmins = {
	        OBJECT_TYPE:                ["PROJECT", "PROJECT", "PROJECT", "PROJECT"],
            OBJECT_ID:                  ["1", "1", "2", "2"],
            USER_ID:                    [sTestUser, sTestUser2, sTestUser, sTestUser2],
            PRIVILEGE:                  ["ADMINISTRATE","ADMINISTRATE","ADMINISTRATE","ADMINISTRATE"]
    };

    var oAuthProjectTestData = {
            PROJECT_ID:                 ["1", "1", "2", "2"],
            USER_ID:                    [sTestUser, sTestUser2, sTestUser, sTestUser2],
            PRIVILEGE:                  ["READ","ADMINISTRATE","ADMINISTRATE","ADMINISTRATE"]
    };

    var oCalculationVersionTestData = {
        CALCULATION_VERSION_ID:         1,
        CALCULATION_ID:                 1,
        CALCULATION_VERSION_NAME:       "Version1",
        CALCULATION_VERSION_TYPE:       1,
        ROOT_ITEM_ID:                   1,
        CUSTOMER_ID:                    sTestCustomer,
        SALES_DOCUMENT:                 "100",
        SALES_PRICE:                    1,
        SALES_PRICE_CURRENCY_ID:        "EUR",
        REPORT_CURRENCY_ID:             "EUR",
        COSTING_SHEET_ID:               "COS1",
        COMPONENT_SPLIT_ID:             "SPLIT_DETAILED",
        START_OF_PRODUCTION:            new Date().toJSON() ,
        END_OF_PRODUCTION:              new Date().toJSON(),
        VALUATION_DATE:                 new Date().toJSON(),
        LAST_MODIFIED_ON:                  sExpectedDateWithoutTime,
        LAST_MODIFIED_BY:          sTestUser,
        MASTER_DATA_TIMESTAMP:          sExpectedDateWithoutTime,
        LIFECYCLE_PERIOD_FROM:          12,
        BASE_VERSION_ID:                1,
        IS_FROZEN:                      0,
        EXCHANGE_RATE_TYPE_ID:          sDefaultExchangeRateType,
        MATERIAL_PRICE_STRATEGY_ID: sDefaultPriceDeterminationStrategy,
        ACTIVITY_PRICE_STRATEGY_ID: sDefaultPriceDeterminationStrategy
    };

    var oCustomerTestData = {
        CUSTOMER_ID:                    sTestCustomer,
        CUSTOMER_NAME:                  "C2",
        COUNTRY:                        "US",
        POSTAL_CODE:                    "1234",
        REGION:                         "W",
        CITY:                           "Palo Alto",
        STREET_NUMBER_OR_PO_BOX:        "7890",
        _VALID_FROM:                    sExpectedDateWithoutTime,
        _VALID_TO:                      sExpectedDateWithoutTime,
        _SOURCE:                        2,
        _CREATED_BY:            		sTestUser
    };

    var oProjectTestData = {
		PROJECT_ID:				        ["PR1",						"PR2"],
		ENTITY_ID:						[1,                           2],
		REFERENCE_PROJECT_ID:		    ["0",						"0"],
		PROJECT_NAME:				    ["Prj 1",					"Prj 2"],
		PROJECT_RESPONSIBLE:		    [sTestUser,					sTestUser2],
		CONTROLLING_AREA_ID:		    ["CA1",                     "CA1"],
		CUSTOMER_ID:				    [sTestCustomer,				sTestCustomer],
		SALES_DOCUMENT:			        ["SD1",						"SD1"],
		SALES_PRICE:				    ["20",						"10"],
		SALES_PRICE_CURRENCY_ID:	    ["EUR",						"EUR"],
		COMMENT:					    ["Comment 1",				"Comment 2"],
		COMPANY_CODE_ID:			    ["CC1",						"CC1"],
		PLANT_ID:					    ["PL1",						"PL1"],
		BUSINESS_AREA_ID:			    ["B1",						"B1"],
		PROFIT_CENTER_ID:			    ["P4",						"P4"],
		REPORT_CURRENCY_ID:		        ["EUR",						"EUR"],
		COSTING_SHEET_ID:			    ["COGM",					"COGM"],
		COMPONENT_SPLIT_ID:	    	    ["1",			            "1"],
		START_OF_PROJECT:			    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		END_OF_PROJECT:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		START_OF_PRODUCTION:		    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		END_OF_PRODUCTION:		        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		VALUATION_DATE:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		LIFECYCLE_VALUATION_DATE:       [sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
		LIFECYCLE_PERIOD_INTERVAL:      [12,						12],
		CREATED_ON:				        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
		CREATED_BY:		        [sTestUser, 				sTestUser2],
		LAST_MODIFIED_ON:			        [sExpectedDateWithoutTime,	sExpectedDateWithoutTime],
		LAST_MODIFIED_BY:	        [sTestUser2, 				sTestUser],
		EXCHANGE_RATE_TYPE_ID:          [sDefaultExchangeRateType,	sDefaultExchangeRateType],
		MATERIAL_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy],
		ACTIVITY_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy]
	   };

    var oItemTestData = {
        ITEM_ID:                        [3001,3002,3003,5001],
        CALCULATION_VERSION_ID:         [1,1,1,1],
        PARENT_ITEM_ID:                 [0,3001,3002,0],
        IS_ACTIVE:                      [1,1,1,1],
		ITEM_CATEGORY_ID:               [1,1,3,1],
		CHILD_ITEM_CATEGORY_ID:               [1,1,3,1],
        ACCOUNT_ID:                     [0,0,625000,0],
        VENDOR_ID:                      [sTestVendor, sTestVendor, sTestVendor2, sTestVendor2],
        CREATED_ON:                     ["2014-04-23 08:00:00","2014-04-23 08:00:00","2014-04-25T08:00:00Z","2014-04-23 08:00:00"],
        CREATED_BY:             [sTestUser,sTestUser2,sTestUser,sTestUser],
        LAST_MODIFIED_ON:               ["2014-04-23 08:00:00","2014-04-23 08:00:00","2014-04-25T08:00:00Z","2014-04-23 08:00:00"],
        LAST_MODIFIED_BY:       [sTestUser,sTestUser,sTestUser2,sTestUser2],
        PRICE_FIXED_PORTION:            [1,1,1,1],
		PRICE_VARIABLE_PORTION:         [0,0,0,0],
		TRANSACTION_CURRENCY_ID:  ['EUR','EUR','EUR','EUR'],
		PRICE_UNIT:                     [1,1,1,1],
		PRICE_UNIT_UOM_ID:              ['EUR','EUR','EUR','EUR']
	};

	var oMaterialPriceTestData = {
		PRICE_ID:                       ["280000E0B2BDB9671600A4000936462B", "290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B","2B0000E0B2BDB9671600A4000936462B"],
		PRICE_SOURCE_ID:                ["101","201","101","101"],
		MATERIAL_ID:                    ["MAT1","MAT1","MAT1","MAT1"],
		PLANT_ID:                       ["PL1","PL1","*","PL3"],
		VENDOR_ID:                      [sTestVendor, sTestVendor, sTestVendor2, sTestVendor2],
		PROJECT_ID:                     ["PR1", "PR1", "PR2", "PR2"],
		CUSTOMER_ID:                    [sTestCustomer, sTestCustomer, sTestCustomer, sTestCustomer],
		VALID_FROM:                     ["2015-06-19","2010-01-01","2010-01-01","2010-01-01"],
		VALID_TO:                       ["2999-12-31","2019-12-31","2999-12-31","2017-12-31"],
		VALID_FROM_QUANTITY:            [1,1,1,1],
		PRICE_FIXED_PORTION:            [123.45,123.88,121.25,121.25],
		PRICE_VARIABLE_PORTION:         [234.56,234.99,200.55,234.99],
		TRANSACTION_CURRENCY_ID:  ["EUR","EUR","EUR","EUR"],
		PRICE_UNIT:                     [1,100,1,2],
		PRICE_UNIT_UOM_ID:              ["H","H","H","H"],
        _VALID_FROM:                    ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        _SOURCE:                        [1,2,1,1],
		_CREATED_BY:            [sTestUser,sTestUser,sTestUser2,sTestUser2],
		_CREATED_BY_FIRST_VERSION: [sTestUser,sTestUser,sTestUser2,sTestUser2]
	};

    var oMaterialPriceExtTestData = {
		PRICE_ID:                       ["280000E0B2BDB9671600A4000936462B", "290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B","2B0000E0B2BDB9671600A4000936462B"],
        _VALID_FROM:                    ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"]
	};

	var oActivityPriceTestData = {
		PRICE_ID:                       ["290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B","2B0000E0B2BDB9671600A4000936462B"],
        PRICE_SOURCE_ID:                ["301","301","301"],
        CONTROLLING_AREA_ID:            ['#CA1','1000','1000'],
        COST_CENTER_ID:                 ['CC2','CC2',"CC4"],
        ACTIVITY_TYPE_ID:               ["A4","*","*"],
        PROJECT_ID:                     ["*","*","*"],
        VALID_FROM:                     ["2015-01-01","2010-01-01","2010-01-01"],
		CUSTOMER_ID:                    [sTestCustomer, sTestCustomer, sTestCustomer],
        VALID_FROM_QUANTITY:            ["1", "1", "1"],
        PRICE_FIXED_PORTION:            ["135.98","135.98","150"],
        PRICE_VARIABLE_PORTION:         ["123.45","123.45","200"],
        TRANSACTION_CURRENCY_ID:  ["EUR","EUR","EUR"],
        PRICE_UNIT:                     ["1","1","1"],
        PRICE_UNIT_UOM_ID:              ["PC","PC","PC"],
        _VALID_FROM:                    ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
        _SOURCE:                        [1,1,1],
        _CREATED_BY:            [sTestUser,sTestUser,sTestUser2],
		_CREATED_BY_FIRST_VERSION: [sTestUser,sTestUser,sTestUser2]
	};

	var oActivityPriceExtTestData = {
		PRICE_ID:                       ["290000E0B2BDB9671600A4000936462B","2A0000E0B2BDB9671600A4000936462B"],
        _VALID_FROM:                    ["2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"]
	};
	var oPriceFirstVersionTestData = {
		"PRICE_ID": ["280000E0B2BDB9671600A4000936462B","280000E0B2BDB9671600A4000936462C","280000E0B2BDB9671600A4000936462D"],
		"_VALID_FROM": ["2015-01-02","2010-01-03","2010-01-04"],
		"_CREATED_BY": [sTestUser2, sTestUser, sTestUser2]
 	};

	var oVendorTestData = {
        VENDOR_ID :                     [sTestVendor, sTestVendor2],
        VENDOR_NAME :                   ["V5", "V55"],
        COUNTRY :                       ["C1", "C2"],
        POSTAL_CODE :                   ["1", "2"],
        REGION :                        ["A", "B"],
        CITY :                          ["X","Y"],
        STREET_NUMBER_OR_PO_BOX :       ["11","22"],
        _VALID_FROM :                   ['2015-01-01T15:39:09.691Z', sExpectedRetentionDate.toJSON(), '2015-01-01T15:39:09.691Z'],
        _VALID_TO :                     [null, null, '2015-04-30T15:39:09.691Z'],
        _SOURCE :                       [1, 1, 1],
        _CREATED_BY :           [sTestUser, sTestUser2]
    };

    var oCalculationTestData = {
       CALCULATION_ID:                 [1, 300],
       PROJECT_ID:                     ["PR1", "PR2"],
       CALCULATION_NAME:               ["calculation 1","calculation 2"],
       CREATED_ON:                     ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
       CREATED_BY:             [sTestUser, sTestUser2],
       LAST_MODIFIED_ON:               ["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000"],
       LAST_MODIFIED_BY:       [sTestUser, sTestUser2]
    };

    var oFormulaTestData = {
       PATH :                          ["Item","Item","Item"],
	   BUSINESS_OBJECT:                ["Item","Item","Item"],
	   COLUMN_ID :                     ["TARGET_COST","TARGET_COST","TARGET_COST"],
	   ITEM_CATEGORY_ID :              [0,0,0],
	   FORMULA_ID :                    [11,12,13],
	   IS_FORMULA_USED:                [1,1,0],
	   FORMULA_STRING:                 [
                                           `If($Version.LAST_MODIFIED_BY='${sTestUser}'; 1 ; 0)`,
                                           `If($Version.CUSTOMER_ID='${sTestCustomer}'; 1 ; 0)`,
                                           `If($Version.VENDOR_ID='${sTestVendor}'; 1 ; 0)`
                                       ],
	   FORMULA_DESCRIPTION:            ["","",""]
	};

	var oStatusTestData = {
        STATUS_ID:["ACTIVE","INACTIVE","PENDING","DRAFT"],
        IS_DEFAULT:[1,0,0,0],
        IS_ACTIVE:[1,0,1,0],
        IS_STATUS_COPYABLE:[1,0,0,1],
        DISPLAY_ORDER:[1,2,3,4],
        CREATED_ON:["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
        CREATED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2],
        LAST_MODIFIED_ON:["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
    };

    var oTagTestData = {
       TAG_ID : [1, 2, 3, 4],
       TAG_NAME : ["DRAFT", "FINISHED", "CALCULATED", "DELAYED"],
       CREATED_ON : ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
       CREATED_BY : [sTestUser, sTestUser2, sTestUser, sTestUser2]
	};
	
	var oOneTimeProjectCostTestData ={
		ONE_TIME_COST_ID:[1,2,3,4],
        PROJECT_ID:["PR1","PR2","PR1","PR1"],
        ACCOUNT_ID:["AC1","AC1","AC2","AC3"],
        COST_DESCRIPTION:["C1","C1","C2","C3"],
		COST_TO_DISTRIBUTE:[11,12,13,14],
		COST_NOT_DISTRIBUTED:[11,12,13,14],
        COST_CURRENCY_ID:["EUR","EUR","EUR","EUR"],
		FIXED_COST_PORTION:[1,2,3,4],
		DISTRIBUTION_TYPE:[0,0,0,0],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
	};

	var oOneTimeProductCostTestData ={
		ONE_TIME_COST_ID:[1,2,3,4],
        CALCULATION_ID:[1,300,1,1],
		COST_TO_DISTRIBUTE:[11,12,13,14],
		COST_NOT_DISTRIBUTED:[11,12,13,14],
		DISTRIBUTION_TYPE:[0,0,0,0],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
	};

	var oProjectTotalQuatitiesTestData ={
		RULE_ID:[1,2,3,4],
        CALCULATION_ID:[1,300,1,1],
        CALCULATION_VERSION_ID:[11,12,13,14],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
	};

	var oProjectLifecycleConfigurationTestData ={
        PROJECT_ID:["PR1","PR2","PR1","PR1"],
        CALCULATION_ID:[1,300,2,3],
        CALCULATION_VERSION_ID:[11,12,13,14],
        IS_ONE_TIME_COST_ASSIGNED:[1,1,1,1],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
	};

	var oProjectLifecyclePeriodTypeTestData ={
		PROJECT_ID:["PR1","PR2","PR1","PR1"],
		YEAR:[2021,2020,2022,2023],
		IS_YEAR_SELECTED:[1,1,1,1],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2]
	};

	var oProjectMonthlyLifecyclePeriodTypeTestData ={
		PROJECT_ID:["PR1","PR2","PR1","PR1","PR2","PR2","PR2"],
		YEAR:[2021,2020,2022,2023,2024,2025,2026],
		SELECTED_MONTH: [2,4,6,7,7,6,9],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2,sTestUser, sTestUser, sTestUser2]
	};

	var oProjectLifecyclePeriodQuantityValueTestData ={
		PROJECT_ID:["PR1","PR2","PR1","PR1","PR1","PR1"],
		CALCULATION_ID:[1,300,2,3,4,5],
		LIFECYCLE_PERIOD_FROM:[2021,2020,2022,2023,2024,2025],
		VALUE:[134,341,45,341,456,789],
        LAST_MODIFIED_ON:["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
        LAST_MODIFIED_BY:[sTestUser, sTestUser2, sTestUser, sTestUser2,sTestUser, sTestUser2]
	};
	var oItemCategoryTestData ={
		"ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
		"DISPLAY_ORDER":[0,1,2,3,4,5,6,7,8,9,10],
		"CHILD_ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
		"ITEM_CATEGORY_CODE":['CODE0','CODE1','CODE2','CODE3','CODE4','CODE5','CODE6','CODE7','CODE8','CODE9','CODE10'],
		"ICON":['icon0','icon1','icon2','icon3','icon4','icon5','icon6','icon7','icon8','icon9','icon10'],
		"CREATED_BY":[sTestUser, sTestUser, sTestUser, sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser],
		"LAST_MODIFIED_BY":[sTestUser, sTestUser, sTestUser, sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
	};
	var oTaskTestData ={
		"TASK_ID":[1,2,3],
		"SESSION_ID":[sTestUser, sTestUser, sTestUser],
		"TASK_TYPE":["run","run","run"],
		"STATUS":["complete","complete","complete"],
		"PARAMETERS":[null,null,null],
		"PROGRESS_STEP":[9,9,9],
		"PROGRESS_TOTAL":[9,9,9],
		"CREATED_ON":[null,null,null],
		"STARTED":["2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000","2020-05-14 08:00:00.2340000"],
		"LAST_UPDATED_ON":["2020-05-14 08:01:00.2340000","2020-05-14 08:01:00.2340000","2020-05-14 08:01:00.2340000"],
		"ERROR_CODE":[0,0,0],
		"ERROR_DETAILS":[null,null,null],
	};
	var oMetadataStagingTestData={
		"PATH":["Project","Project.Customer","Project.Plant"],
		"BUSINESS_OBJECT":["Project","Customer","Plant"],
		"COLUMN_ID":["PROJECT_ID","CUSTOMER_ID","PLANT_ID"],
		"IS_CUSTOM":[0,0,0],
		"ROLLUP_TYPE_ID":[0,0,0],
		"SIDE_PANEL_GROUP_ID":[401,401,402],
		"DISPLAY_ORDER":[1,6,1],
		"TABLE_DISPLAY_ORDER":[null,null,null],
		"REF_UOM_CURRENCY_PATH":[null,null,null],
		"REF_UOM_CURRENCY_BUSINESS_OBJECT":[null,null,null],
		"REF_UOM_CURRENCY_COLUMN_ID":[null,null,null],
		"UOM_CURRENCY_FLAG":[null,null,null],
		"SEMANTIC_DATA_TYPE":["String","String","String"],
		"SEMANTIC_DATA_TYPE_ATTRIBUTES":["length=35; uppercase=1","length=10; uppercase=1","length=8; uppercase=1"],
		"VALIDATION_REGEX_ID":["MASTERDATA","MASTERDATA","MASTERDATA"],
		"PROPERTY_TYPE":[3,8,8],
		"IS_IMMUTABLE_AFTER_SAVE":[1,null,null],
		"IS_REQUIRED_IN_MASTERDATA":[null,null,null],
		"IS_WILDCARD_ALLOWED":[null,null,null],
		"IS_USABLE_IN_FORMULA":[null,null,null],
		"RESOURCE_KEY_DISPLAY_NAME":["XFLD_Project_ProjectId","XFLD_Project_Customer","XFLD_Project_Plant"],
		"RESOURCE_KEY_DISPLAY_DESCRIPTION":["XTOL_Project_ProjectId","XTOL_Project_Customer","XTOL_Project_Plant"],
		"CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"CREATED_BY":[sTestUser, sTestUser2, sTestUser],
		"LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"LAST_MODIFIED_BY":[sTestUser2, sTestUser, sTestUser2],
	};
	var oMetadataTextStagingTestData={
		"PATH":["Project","Project.Customer","Project.Plant"],
		"COLUMN_ID":["PROJECT_ID","CUSTOMER_ID","PLANT_ID"],
		"LANGUAGE":["EN","DE","FR"],
		"DISPLAY_NAME":["Name 1","Name 2","Name 3"],
		"DISPLAY_DESCRIPTION":["Description 1","Description 2","Description 3"],
		"CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"CREATED_BY":[sTestUser2, sTestUser, sTestUser2],
		"LAST_MODIFIED_ON":["2014-05-14 08:00:00.2340000","2014-05-14 08:00:00.2340000","2014-06-19 08:00:00.2340000"],
		"LAST_MODIFIED_BY":[sTestUser, sTestUser2, sTestUser],
	};
	
	const oAutoCompleteUser = {
		USER_ID: [sTestUser, sTestUser]
	};

    var oPersonalDataValidityTestData = {
	};
	const fPredicate = oObject => oObject.VARIANT_ID === testData.oVariantTestData.VARIANT_ID[0];
	const oVariantTestData = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicate);
	oVariantTestData[0].CALCULATION_VERSION_ID = oCalculationVersionTestData.CALCULATION_VERSION_ID;
	oVariantTestData[0].LAST_REMOVED_MARKINGS_BY = sTestUser;
	oVariantTestData[0].LAST_MODIFIED_BY = sTestUser;
	oVariantTestData[0].LAST_CALCULATED_BY = sTestUser;
	
    beforeOnce(function() {
		oMockstar = new MockstarFacade({
			substituteTables : {
				recent_calculation_versions: {
					name: "sap.plc.db::basis.t_recent_calculation_versions",
					data: oRecentCalculationVersionTestData
				},
				usergroup_user: {
					name: "sap.plc.db::auth.t_usergroup_user",
					data: oUsergroupUserTestData
				},
				layout_personal: {
					name: "sap.plc.db::basis.t_layout_personal",
					data: oLayoutPersonalTestData
				},
				default_settings: {
					name: "sap.plc.db::basis.t_default_settings",
					data: oDefaultSettingsTestData
				},
				lock: {
					name: "sap.plc.db::basis.t_lock",
					data: oLockTestData
				},
				log: {
					name: "sap.plc.db::basis.t_installation_log",
					data: oInstallationLogTestData
				},
				auth_user: {
					name: "sap.plc.db::auth.t_auth_user",
					data: oAuthUserTestData
				},
				auth_project: {
					name: "sap.plc.db::auth.t_auth_project",
					data: oAuthProjectTestData
				},
				calculation_version: {
					name: "sap.plc.db::basis.t_calculation_version",
					data: oCalculationVersionTestData
				},
				customer: {
					name: "sap.plc.db::basis.t_customer",
					data: oCustomerTestData
				},
				project: {
					name: "sap.plc.db::basis.t_project",
					data: oProjectTestData
				},
				item: {
					name: "sap.plc.db::basis.t_item",
					data: oItemTestData
				},
				item_category :{
					name: "sap.plc.db::basis.t_item_category",
					data: oItemCategoryTestData

				},
				material_price: {
					name: "sap.plc.db::basis.t_material_price",
					data: oMaterialPriceTestData
				},
				material_price_first_version: {
					name: "sap.plc.db::basis.t_material_price__first_version",
					data: oPriceFirstVersionTestData
				},
				material_price_ext: {
					name: "sap.plc.db::basis.t_material_price_ext",
					data: oMaterialPriceExtTestData
				},
				activity_price: {
					name: "sap.plc.db::basis.t_activity_price",
					data: oActivityPriceTestData
				},
				activity_price_ext: {
					name: "sap.plc.db::basis.t_activity_price_ext",
					data: oActivityPriceExtTestData
				},
				activity_price_first_version: {
					name: "sap.plc.db::basis.t_activity_price__first_version",
					data: oPriceFirstVersionTestData
				},
				vendor: {
					name: "sap.plc.db::basis.t_vendor",
					data: oVendorTestData
				},
				calculation: {
					name: "sap.plc.db::basis.t_calculation",
					data: oCalculationTestData
				},
				formula: {
					name: "sap.plc.db::basis.t_formula",
					data: oFormulaTestData
				},
				frontend_settings: "sap.plc.db::basis.t_frontend_settings",
				personDataValidity: {
					name: "sap.plc.db::basis.t_personal_data_validity",
					data: oPersonalDataValidityTestData
				},
				variant: {
					name: "sap.plc.db::basis.t_variant",
					data: oVariantTestData
				},
				auto_complete_user: {
					name: "sap.plc.db::basis.t_auto_complete_user",
					data: oAutoCompleteUser
				},
				status: {
                	name: "sap.plc.db::basis.t_status",
                	data: oStatusTestData
                },
                tag: {
                   	name: "sap.plc.db::basis.t_tag",
                   	data: oTagTestData
				},
				entity_tags:"sap.plc.db::basis.t_entity_tags",
				one_time_project_cost: {
					name: "sap.plc.db::basis.t_one_time_project_cost",
					data: oOneTimeProjectCostTestData
				},
    			one_time_product_cost: {
					name: "sap.plc.db::basis.t_one_time_product_cost",
					data: oOneTimeProductCostTestData
				},
				project_total_quantities: {
					name: "sap.plc.db::basis.t_project_total_quantities",
					data: oProjectTotalQuatitiesTestData
				},
    			project_lifecycle_configuration: {
					name: "sap.plc.db::basis.t_project_lifecycle_configuration",
					data: oProjectLifecycleConfigurationTestData
				},
				project_lifecycle_period_type: {
					name: "sap.plc.db::basis.t_project_lifecycle_period_type",
					data: oProjectLifecyclePeriodTypeTestData
				},
    			project_monthly_lifecycle_period: {
					name: "sap.plc.db::basis.t_project_monthly_lifecycle_period",
					data: oProjectMonthlyLifecyclePeriodTypeTestData
				},
    			project_lifecycle_period_quantity_value: {
					name: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
					data: oProjectLifecyclePeriodQuantityValueTestData
				},
				customer_replication:"sap.plc.db::repl_st.t_kna1",
				vendor_replication: "sap.plc.db::repl_st.t_lfa1",	
				task: {
					name: "sap.plc.db::basis.t_task",
					data: oTaskTestData
				},
				metadata_staging: {
					name: "sap.plc.db::basis.t_metadata_staging",
					data: oMetadataStagingTestData
				},
				metadata__text_staging: {
					name: "sap.plc.db::basis.t_metadata__text_staging",
					data: oMetadataTextStagingTestData
				}			
			}
		});
	});

    beforeEach(function() {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
        persistency = new Persistency(jasmine.dbConnection);
        spyOn(authorizationUnroller, 'unrollPrivilegesOnObjectUpdate').and.callFake(function() { return true; });
    });

    afterOnce(function() {
    	if (!oMockstar.disableMockstar) {
            oMockstar.cleanup();
    	}
    });

    describe('delete', function() {
		it('should delete user id', function() {
			// act
			persistency.DataProtection.deleteUserIds(sTestUser);

			// assert
			expect(mockstar_helpers.getRowCount(oMockstar, "usergroup_user", "USER_ID = '"+ sTestUser +"'")).toBe(0);

			var oResultUsergroupUserTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{usergroup_user}}"));
			expect(oResultUsergroupUserTable.USER_ID.length).toEqual(1);

			var oResultautocompleteuserTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{auto_complete_user}}"));
			expect(oResultautocompleteuserTable.USER_ID.length).toEqual(0);

			var oResultLayoutPersonalTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{layout_personal}}"));
			expect(oResultLayoutPersonalTable.USER_ID.length).toEqual(0);

			var oResultDefaultSettingsTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{default_settings}}"));
			expect(oResultDefaultSettingsTable.USER_ID.length).toEqual(0);

			var oResultLockTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{lock}}"));
			expect(oResultLockTable.USER_ID.length).toEqual(0);

			var oResulLogTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{log}}"));
			expect(oResulLogTable.EXECUTED_BY.length).toEqual(0);

			var oResulRecentCalculationVersionsTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{recent_calculation_versions}}"));
			expect(oResulRecentCalculationVersionsTable.USER_ID.length).toEqual(0);

			var oResulTaskTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{task}}"));
			expect(oResulTaskTable.SESSION_ID.length).toEqual(0);

			// For auth_project
			expect(authorizationUnroller.unrollPrivilegesOnObjectUpdate).toHaveBeenCalled();
		});
		
		it('should delete the front end setting for a specific user', () => {
		    //arrange
		    oMockstar.insertTableData("frontend_settings", { SETTING_ID:      [1, 2],
                                                             SETTING_NAME:    ["AOIntegration", "AOIntegration"],
                                                             SETTING_TYPE:    ["AnalyticsIntegration", "AnalyticsIntegration"],
                                                             USER_ID:         [sTestUser, null],
                                                             SETTING_CONTENT: ["Error reading a value user", "Error reading a value corporate"]
		                            });
    
		    // act
			persistency.DataProtection.deleteUserIds(sTestUser);

			// assert
			var oResultUserFrontEndSettings = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{frontend_settings}} where USER_ID = '" + sTestUser+"'"));
			expect(oResultUserFrontEndSettings.USER_ID.length).toEqual(0);
			
			//check that the corporate setting was not deleted
			var oResultFrontEndSettings = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{frontend_settings}}"));
			expect(oResultFrontEndSettings.USER_ID.length).toEqual(1);
        });
        
        it('should delete all the front end settings for a specific user', () => {
		    //arrange
		    oMockstar.insertTableData("frontend_settings", { SETTING_ID:      [1, 2, 3, 4],
                                                             SETTING_NAME:    ["AOIntegration", "AOIntegration", "ErpIntegration", "ErpIntegration"],
                                                             SETTING_TYPE:    ["AnalyticsIntegration", "AnalyticsIntegration", "ERPIntegration", "ERPIntegration"],
                                                             USER_ID:         [sTestUser, null, sTestUser, "TESTER1"],
                                                             SETTING_CONTENT: ["Error reading a value user", "Error reading a value corporate", "Error for erp integration", "Error for erp integration"]
		                            });
    
		    // act
			persistency.DataProtection.deleteUserIds(sTestUser);

			// assert
			var oResultUserFrontEndSettings = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{frontend_settings}} where USER_ID = '" + sTestUser+"'"));
			expect(oResultUserFrontEndSettings.USER_ID.length).toEqual(0);
			
			//check that the corporate setting and other user setting was not deleted
			var oResultFrontEndSettings = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{frontend_settings}}"));
			expect(oResultFrontEndSettings.USER_ID.length).toEqual(2);
        });
        
        it('should not delete any front end setting if there is none defined for a specific user', () => {
		    //arrange
		    oMockstar.insertTableData("frontend_settings", { SETTING_ID:      [1, 2, 3],
                                                             SETTING_NAME:    ["AOIntegration", "AOIntegration", "ErpIntegration"],
                                                             SETTING_TYPE:    ["AnalyticsIntegration", "AnalyticsIntegration", "ERPIntegration"],
                                                             USER_ID:         ['TESTER1', null, 'TESTER2'],
                                                             SETTING_CONTENT: ["Error reading a value user", "Error reading a value corporate", "Error for erp integration"]
		                            });
    
		    // act
			persistency.DataProtection.deleteUserIds(sTestUser);

			// assert
			var oResultFrontEndSettings = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{frontend_settings}}"));
			expect(oResultFrontEndSettings.USER_ID.length).toEqual(3);
        });

		it('should not delete user id if it is the only administrator of a project', function() {
        	// arrange
			var exception;

        	//act
			try {
				persistency.DataProtection.deleteInstanceBasedUserIds(sTestUser2);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code.code).toEqual('PROJECT_WITH_NO_ADMINISTRATOR_ERROR');
			expect(exception.code.responseCode).toEqual(400);
		});
	});
	
	describe('remove references to user ids', function () {

		function expectedRowCount() {
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY = '" + sTestUser + "'")).toBe(2);			
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY_FIRST_VERSION = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price_first_version", "_CREATED_BY = '" + sTestUser + "'")).toBe(1);

			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY_FIRST_VERSION = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price_first_version", "_CREATED_BY = '" + sTestUser + "'")).toBe(1);
			
			expect(mockstar_helpers.getRowCount(oMockstar, "vendor", "_CREATED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "customer", "_CREATED_BY = '" + sTestUser + "'")).toBe(1);
	
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "variant", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "item", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "CREATED_BY = '" + sTestUser + "'")).toBe(11);
			expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(11);
	
			expect(mockstar_helpers.getRowCount(oMockstar, "project", "CREATED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "CREATED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "item", "CREATED_BY = '" + sTestUser + "'")).toBe(3);

			expect(mockstar_helpers.getRowCount(oMockstar, "status", "CREATED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "status", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);

			expect(mockstar_helpers.getRowCount(oMockstar, "tag", "CREATED_BY = '" + sTestUser + "'")).toBe(2);
			
			expect(mockstar_helpers.getRowCount(oMockstar, "one_time_project_cost", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "one_time_product_cost", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_total_quantities", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_configuration", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_period_type", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_monthly_lifecycle_period", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(4);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_period_quantity_value", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(3);

			expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "CREATED_BY = '" + sTestUser + "'")).toBe(2);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "CREATED_BY = '" + sTestUser + "'")).toBe(1);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(2);
		}
	
		it('should remove references for the given user id', function () {
			// before
			expectedRowCount();
			// act
			
			persistency.DataProtection.removeReferencesToUserIds(sTestUser);
	
			// assert
			// after
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY_FIRST_VERSION = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "material_price_first_version", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "_CREATED_BY_FIRST_VERSION = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price_first_version", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "vendor", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "customer", "_CREATED_BY = '" + sTestUser + "'")).toBe(0);
	
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "variant", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "item", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
	
			expect(mockstar_helpers.getRowCount(oMockstar, "project", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "item", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "item_category", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "status", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "status", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "tag", "CREATED_BY = '" + sTestUser + "'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "one_time_project_cost", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "one_time_product_cost", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_total_quantities", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_configuration", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_period_type", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_monthly_lifecycle_period", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project_lifecycle_period_quantity_value", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata_staging", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "CREATED_BY = '" + sTestUser + "'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "metadata__text_staging", "LAST_MODIFIED_BY = '" + sTestUser + "'")).toBe(0);
		});
	
		it('should not remove references for the given user id if user does not exist', function () {
			// act
			persistency.DataProtection.removeReferencesToUserIds("sFakeUser");
	
			// assert
			expectedRowCount();
		});
	});

    describe('delete instance based', function() {
		// arrange
    	beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.insertTableData("auth_user", oAuthUserTestDataAllAdmins);
			oMockstar.initializeData();

		});
		afterOnce(function() {
			oMockstar.cleanup();
		});
		it('should delete user id with instance based check', function() {
        	// act
			persistency.DataProtection.deleteInstanceBasedUserIds(sTestUser);

			// assert
			var oResultAuthUserTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{auth_user}} where object_id = '1'"));
			expect(oResultAuthUserTable.USER_ID.length).toEqual(1);
		});

		it('should delete an administrator user when he/she is not the only administrator', function() {
        	// act
			persistency.DataProtection.deleteInstanceBasedUserIds(sTestUser2);

			// assert
    		var oResultAuthUserTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{auth_user}} where object_id = '2'"));
    		expect(oResultAuthUserTable.USER_ID.length).toEqual(1);
        });

        it('should return the number of affected rows when deleting a user-id',() => {
            //act
            const iAffectedRows = persistency.DataProtection.deleteInstanceBasedUserIds(sTestUser);

            //assert
            expect(iAffectedRows).toEqual(2);
        });
	});

	describe('customer', function() {
		it('should delete customer id', function() {
			// act
			persistency.DataProtection.deleteCustomerId(sTestCustomer);

			// assert
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation_version", "CUSTOMER_ID = '"+ sTestCustomer +"'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "project", "CUSTOMER_ID = '"+ sTestCustomer +"'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "customer", "CUSTOMER_ID = '"+ sTestCustomer +"'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "activity_price", "CUSTOMER_ID = '"+ sTestCustomer +"'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "CUSTOMER_ID = '"+ sTestCustomer +"'")).toBe(0);

			var oResultCustomerTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{customer}}"));
    		expect(oResultCustomerTable.CUSTOMER_ID.length).toEqual(0);
		});

		it('should not delete customer id if it does not exists', function() {
			// act
			persistency.DataProtection.deleteCustomerId(sTestCustomerNotExist);
			// assert
    		var oResultCalculationVersionTable = oMockstar.execQuery("select * from {{calculation_version}}");
    		expect(oResultCalculationVersionTable.columns.CUSTOMER_ID.rows[0]).toEqual(sTestCustomer);

    		var oResultProjectTable = oMockstar.execQuery("select * from {{project}}");
    		expect(oResultProjectTable.columns.CUSTOMER_ID.rows[0]).toEqual(sTestCustomer);

    		var oResultCustomerTable = oMockstar.execQuery("select * from {{customer}}");
    		expect(oResultCustomerTable.columns.CUSTOMER_ID.rows[0]).toEqual(sTestCustomer);

    		var oResultActivityTable = oMockstar.execQuery("select * from {{activity_price}}");
    		expect(oResultActivityTable.columns.CUSTOMER_ID.rows[0]).toEqual(sTestCustomer);

    		var oResultPriceTable = oMockstar.execQuery("select * from {{material_price}}");
    		expect(oResultPriceTable.columns.CUSTOMER_ID.rows[0]).toEqual(sTestCustomer);
    		if(jasmine.plcTestRunParameters.generatedFields === true){
    		    var oResultPriceExtTable = oMockstar.execQuery(`select * from {{material_price_ext}} where PRICE_ID in ('${oResultPriceTable.columns.PRICE_ID.rows.join("', '")}')`);
    		    expect(oResultPriceExtTable.columns.PRICE_ID.rows.length).toEqual(oResultPriceTable.columns.PRICE_ID.rows.length);
				
    		    var oResultActivityExtTable = oMockstar.execQuery(`select * from {{activity_price_ext}} where PRICE_ID in ('${oResultActivityTable.columns.PRICE_ID.rows.join("', '")}')`);
    		    expect(oResultActivityExtTable.columns.PRICE_ID.rows.length).toEqual(oActivityPriceExtTestData.PRICE_ID.length);
    		}
        });

        it('should return the number of affected rows when deleting customer personal data',() => {
            //act
            const result = persistency.DataProtection.deleteCustomerId(sTestCustomer);
            //assert
            expect(result).toEqual(17);
        });

        it('should return the number of affected rows when not deleting customer personal data',() => {
            //act
            const result = persistency.DataProtection.deleteCustomerId(sTestCustomerNotExist);
            //assert
            expect(result).toEqual(0);
		});
				
		it('should return the number of affected rows when deleting customer from replication table', () => {
			//arrange			
		    oMockstar.insertTableData("customer_replication", { MANDT:      ["1", "2", "1"],
																KUNNR:    ["KUST99", "KUST99", "KUST98"],
																LAND1:    ["DE", "EN","RO"]
                                                             
		                            });
    
		    // act
			const result = persistency.DataProtection.deleteCustomerId("KUST99");

			//assert
            expect(result).toEqual(2);
        });
	});

	describe('vendor', function() {
		it('should delete vendor id', function() {
			// act
			persistency.DataProtection.deleteVendorId(sTestVendor);

			// assert
			expect(mockstar_helpers.getRowCount(oMockstar, "item", "VENDOR_ID = '"+ sTestVendor +"'")).toBe(0);

		    expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "VENDOR_ID = '"+ sTestVendor +"'")).toBe(0);

		    if(jasmine.plcTestRunParameters.generatedFields === true){
				var oResultPriceExtTable = oMockstar.execQuery(`select * from {{material_price_ext}}
																 where PRICE_ID in (select PRICE_ID from {{material_price}} 
																					where VENDOR_ID = '${sTestVendor}')`);
    		    expect(oResultPriceExtTable.columns.PRICE_ID.rows.length).toEqual(0);
			}
			expect(mockstar_helpers.getRowCount(oMockstar, "vendor", "VENDOR_ID = '"+ sTestVendor +"'")).toBe(0);

			var oResultVendorTable = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{vendor}}"));
    		expect(oResultVendorTable.VENDOR_ID.length).toEqual(1);
		});

		it('should not delete vendor id if it does not exists', function() {
    		// act
    		persistency.DataProtection.deleteVendorId(sTestVendorNotExist);

    		// assert
            var oResultItemTable = oMockstar.execQuery("select * from {{item}}");
    		expect(oResultItemTable.columns.VENDOR_ID.rows[0]).toEqual(sTestVendor);

            var oResultPriceTable = oMockstar.execQuery("select * from {{material_price}}");
    		expect(oResultPriceTable.columns.VENDOR_ID.rows[0]).toEqual(sTestVendor);

    		if(jasmine.plcTestRunParameters.generatedFields === true){
				var oResultPriceExtTable = oMockstar.execQuery(`select * from {{material_price_ext}}
																 where PRICE_ID in (select PRICE_ID from {{material_price}} 
																					where VENDOR_ID = '${sTestVendor}')`);
    		    expect(oResultPriceExtTable.columns.PRICE_ID.rows.length).not.toEqual(0);
			}

    		var oResultVendorTable = oMockstar.execQuery("select * from {{vendor}}");
    		expect(oResultVendorTable.columns.VENDOR_ID.rows[0]).toEqual(sTestVendor);
        });

        it('should return the number of affected rows if the vendor was deleted',() => {
            //act
            const result = persistency.DataProtection.deleteVendorId(sTestVendor);
            //assert
            expect(result).toEqual(7);
        });

        it('should return 0 (zero) as the number of affected rows if the vendor to be deleted does not exist',() => {
            //act
            const result = persistency.DataProtection.deleteVendorId(sTestVendorNotExist);
            //assert
            expect(result).toEqual(0);
		});
		
		it('should return the number of affected rows when deleting vendor from replication table', () => {
			//arrange			
		    oMockstar.insertTableData("vendor_replication", { MANDT:      ["1", "2", "3"],
																LIFNR:    ["VEN97", "VEN99", "VEN97"],
																LAND1:    ["DE", "EN","RO"]
                                                             
		                            });
    
		    // act
			const result = persistency.DataProtection.deleteVendorId("VEN97");

			//assert
			expect(result).toEqual(2);
		});
	});

	describe('project', function() {
		it('should delete personal data from project', function() {
			// act
			persistency.DataProtection.removePersonalDataFromProject(sTestProject);

			// assert
			var oResultProject = oMockstar.execQuery("select * from {{project}} where project_id = 'PR1'");
    		expect(oResultProject.columns.CUSTOMER_ID.rows[0]).toEqual(sTestPlaceholder);
    		expect(oResultProject.columns.CREATED_BY.rows[0]).toEqual(sTestPlaceholder);
			expect(oResultProject.columns.LAST_MODIFIED_BY.rows[0]).toEqual(sTestPlaceholder);
			expect(oResultProject.columns.PROJECT_RESPONSIBLE.rows[0]).toEqual(sTestPlaceholder);

    		var oResultProjectCalculation = oMockstar.execQuery("select * from {{calculation}} where project_id = 'PR1'");
    		expect(oResultProjectCalculation.columns.CREATED_BY.rows[0]).toEqual(sTestPlaceholder);
			expect(oResultProjectCalculation.columns.LAST_MODIFIED_BY.rows[0]).toEqual(sTestPlaceholder);
			
			var oResultVariant = oMockstar.execQuery(`select * from {{variant}} where variant_id = ${testData.oVariantTestData.VARIANT_ID[0]}`);
			expect(oResultVariant.columns.LAST_CALCULATED_BY.rows[0]).toEqual(sTestPlaceholder);
			expect(oResultVariant.columns.LAST_MODIFIED_BY.rows[0]).toEqual(sTestPlaceholder);
    		expect(oResultVariant.columns.LAST_REMOVED_MARKINGS_BY.rows[0]).toEqual(sTestPlaceholder);

    		var oResultProjectCalculationVersion = oMockstar.execQuery("select * from {{calculation_version}} where calculation_id = 1");
    		expect(oResultProjectCalculationVersion.columns.CUSTOMER_ID.rows[0]).toEqual(sTestPlaceholder);
    		expect(oResultProjectCalculationVersion.columns.LAST_MODIFIED_BY.rows[0]).toEqual(sTestPlaceholder);

    		var oResultProjectItem = oMockstar.execQuery("select * from {{item}} where calculation_version_id = 1");
    		expect(oResultProjectItem.columns.VENDOR_ID.rows[0]).toEqual(sTestPlaceholder);
    		expect(oResultProjectItem.columns.CREATED_BY.rows[0]).toEqual(sTestPlaceholder);
    		expect(oResultProjectItem.columns.LAST_MODIFIED_BY.rows[0]).toEqual(sTestPlaceholder);

            var oResultProjectPrice = oMockstar.execQuery("select * from {{material_price}} where project_id = 'PR1'");
    		expect(oResultProjectPrice.columns.VENDOR_ID.rows[0]).toBe(undefined);
    		expect(oResultProjectPrice.columns._CREATED_BY.rows[0]).toBe(undefined);

    		if(jasmine.plcTestRunParameters.generatedFields === true){
				var oResultPriceExtTable = oMockstar.execQuery(`select * from {{material_price_ext}}
																 where PRICE_ID in (select PRICE_ID from {{material_price}} 
																					where PROJECT_ID = 'PR1')`);
    		    expect(oResultPriceExtTable.columns.PRICE_ID.rows.length).toEqual(0);
			}
		});

		it('should not delete personal data if project does not exist', function() {
			// act
			persistency.DataProtection.removePersonalDataFromProject(sTestProjectNotExist);

			// assert
			expect(mockstar_helpers.getRowCount(oMockstar, "project", "CUSTOMER_ID = '"+ sTestPlaceholder +"'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project", "CREATED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "project", "LAST_MODIFIED_BY = '"+ sTestPlaceholder +"'")).toBe(0);

			expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "CREATED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
            expect(mockstar_helpers.getRowCount(oMockstar, "calculation", "LAST_MODIFIED_BY = '"+ sTestPlaceholder +"'")).toBe(0);

            expect(mockstar_helpers.getRowCount(oMockstar, "calculation_version", "CUSTOMER_ID = '"+ sTestPlaceholder +"'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "calculation_version", "LAST_MODIFIED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
			
			expect(mockstar_helpers.getRowCount(oMockstar, "variant", "LAST_CALCULATED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "variant", "LAST_MODIFIED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
			expect(mockstar_helpers.getRowCount(oMockstar, "variant", "LAST_REMOVED_MARKINGS_BY = '"+ sTestPlaceholder +"'")).toBe(0);

            expect(mockstar_helpers.getRowCount(oMockstar, "item", "VENDOR_ID = '"+ sTestPlaceholder +"'")).toBe(0);
            expect(mockstar_helpers.getRowCount(oMockstar, "item", "CREATED_BY = '"+ sTestPlaceholder +"'")).toBe(0);
            expect(mockstar_helpers.getRowCount(oMockstar, "item", "LAST_MODIFIED_BY = '"+ sTestPlaceholder +"'")).toBe(0);

            expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "VENDOR_ID = '"+ sTestPlaceholder +"'")).toBe(0);
            expect(mockstar_helpers.getRowCount(oMockstar, "material_price", "_CREATED_BY = '"+ sTestPlaceholder +"'")).toBe(0);

            if(jasmine.plcTestRunParameters.generatedFields === true){
				var oResultPriceExtTable = oMockstar.execQuery(`select * from {{material_price_ext}}
																 where PRICE_ID in (select PRICE_ID from {{material_price}} 
																					where VENDOR_ID = '${sTestPlaceholder}')`);
			}
        });

        it('should return the number of affected rows if personal data has been deleted from a project',() => {
            //act
            const result = persistency.DataProtection.removePersonalDataFromProject(sTestProject);
            //assert
            expect(result).toEqual(35);
        });

        it('should return 0 if the project to be cleared from personal data does not exist',() => {
            //act
            const result = persistency.DataProtection.removePersonalDataFromProject(sTestProjectNotExist);
            //assert
            expect(result).toEqual(0);
        });
	});

	describe('formula', function() {

        let oPersonalDataTypes;
        
        beforeEach(() => {
            oPersonalDataTypes = persistency.DataProtection.oPersonalDataTypes;
        })

		it('should find formulas that contain personal data (userId) and return the formulas IDs', function() {
			// act
			//formulaDataProtection is a local function, it is called from updateUserIdsWithPlaceholder
			const oFormulaUser = new TestDataUtility(oFormulaTestData).build();
			oFormulaUser.FORMULA_STRING[1] = `If($Version.SALES_DOCUMENT='${sTestCustomer}'; 1 ; 0)`;
			oFormulaUser.FORMULA_STRING[2] = `If($Version.SALES_DOCUMENT='${sTestVendor}'; 1 ; 0)`;
			oMockstar.clearTable("formula");
			oMockstar.insertTableData("formula", oFormulaUser);
			var resultFormulaCheckForUser = persistency.DataProtection.findFormulasThatContainPersonalData(sTestUser, oPersonalDataTypes.User);

            // assert
            expect(resultFormulaCheckForUser.length).toBe(1);
            expect(resultFormulaCheckForUser).toContain(11);
        });

        it('should find formulas that contain personal data (CustomerId) and return the formulas IDs', function() {
			// act
			//formulaDataProtection is a local function, it is called from updateUserIdsWithPlaceholder
			const oFormulaUser = new TestDataUtility(oFormulaTestData).build();
			oFormulaUser.FORMULA_STRING[0] = `If($Version.SALES_DOCUMENT='${sTestUser}'; 1 ; 0)`;
			oFormulaUser.FORMULA_STRING[2] = `If($Version.SALES_DOCUMENT='${sTestVendor}'; 1 ; 0)`;
			oMockstar.clearTable("formula");
			oMockstar.insertTableData("formula", oFormulaUser);
			var resultFormulaCheckForUser = persistency.DataProtection.findFormulasThatContainPersonalData(sTestCustomer, oPersonalDataTypes.Customer);

            // assert
            expect(resultFormulaCheckForUser.length).toBe(1);
            expect(resultFormulaCheckForUser).toContain(12);
        });

        it('should find formulas that contain personal data (vendorId) and return the formulas IDs', function() {
			// act
			//formulaDataProtection is a local function, it is called from updateUserIdsWithPlaceholder
			const oFormulaUser = new TestDataUtility(oFormulaTestData).build();
			oFormulaUser.FORMULA_STRING[0] = `If($Version.SALES_DOCUMENT='${sTestUser}'; 1 ; 0)`;
			oFormulaUser.FORMULA_STRING[1] = `If($Version.SALES_DOCUMENT='${sTestCustomer}'; 1 ; 0)`;
			oMockstar.clearTable("formula");
			oMockstar.insertTableData("formula", oFormulaUser);
			var resultFormulaCheckForUser = persistency.DataProtection.findFormulasThatContainPersonalData(sTestVendor, oPersonalDataTypes.Vendor);

            // assert
            expect(resultFormulaCheckForUser.length).toBe(1);
            expect(resultFormulaCheckForUser).toContain(13);
		});

		it('should not return any formula if userId/vendorId/CustomerId does not exist in it', function() {
			// act
			//formulaDataProtection is a local function, it is called from updateUserIdsWithPlaceholder
			const oFormulaUser = new TestDataUtility(oFormulaTestData).build();
			oFormulaUser.FORMULA_STRING[0] = `If($Version.CALCULATION_VERSION_NAME='Version1'; 1 ; 0)`;
			oFormulaUser.FORMULA_STRING[1] = `If($Version.SALES_PRICE_CURRENCY_ID='EUR'; 1 ; 0)`;
			oFormulaUser.FORMULA_STRING[2] = `If($Version.REPORT_CURRENCY_ID='EUR'; 1 ; 0)`;
			oMockstar.clearTable("formula");
			oMockstar.insertTableData("formula", oFormulaUser);
			var resultFormulaCheckForUser = persistency.DataProtection.findFormulasThatContainPersonalData(sTestUserThatDoesntExistInTables, oPersonalDataTypes.User);

			// assert
			expect(resultFormulaCheckForUser).toEqual([]);
		});

		it('should find formulas that contain personal data when the user is used in a range of users', function() {
			// act
			//formulaDataProtection is a local function, it is called from updateUserIdsWithPlaceholder
			var resultFormulaCheckForUser = persistency.DataProtection.findFormulasThatContainPersonalData("someUser", oPersonalDataTypes.Vendor);

            // assert
            expect(resultFormulaCheckForUser.length).toBe(3);
            expect(resultFormulaCheckForUser).toEqual([11, 12, 13]);
		});
	});
	
	describe('validity', function() {
		it('should delete personal data of user if validity end is reached', function() {
			// arrange
			spyOn(persistency.DataProtection, 'removeReferencesToUserIds');
			spyOn(persistency.DataProtection, 'deleteInstanceBasedUserIds');
			spyOn(persistency.DataProtection, 'deleteUserIds');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY: 		                ["user"],
				SUBJECT:   				    [sTestUser],
				VALID_TO:	            ["2014-05-14 08:00:00.0000000"]
		    });

			
			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.removeReferencesToUserIds).toHaveBeenCalledWith(sTestUser);
			expect(persistency.DataProtection.deleteInstanceBasedUserIds).toHaveBeenCalledWith(sTestUser, true);
			expect(persistency.DataProtection.deleteUserIds).toHaveBeenCalledWith(sTestUser);
		});
		
		it('should delete personal data of vendor if validity end is reached', function() {
			// arrange
			spyOn(persistency.DataProtection, 'deleteVendorId');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY: 		                ["vendor"],
				SUBJECT:   				    [sTestVendor],
				VALID_TO:	            ["2014-05-14 08:00:00.0000000"]
		    });

			
			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.deleteVendorId).toHaveBeenCalledWith(sTestVendor);

		});
		
		it('should delete personal data of customer if validity end is reached', function() {
			// arrange
			spyOn(persistency.DataProtection, 'deleteCustomerId');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY: 		                ["customer"],
				SUBJECT:   				    [sTestCustomer],
				VALID_TO:	            ["2014-05-14 08:00:00.0000000"]
		    });

			
			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.deleteCustomerId).toHaveBeenCalledWith(sTestCustomer);
		});
		
		it('should delete personal data in project if validity end is reached', function() {
			// arrange
			spyOn(persistency.DataProtection, 'removePersonalDataFromProject');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY: 		                ["project"],
				SUBJECT:   				    [sTestProject],
				VALID_TO:	            ["2014-05-14 08:00:00.0000000"]
		    });

			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.removePersonalDataFromProject).toHaveBeenCalledWith(sTestProject);
		});

		it('should delete personal data if validity end is reached for both general and specific customers, vendors and projects', function() {
			// arrange
			spyOn(persistency.DataProtection, 'removePersonalDataFromProject');
			spyOn(persistency.DataProtection, 'deleteCustomerId');
			spyOn(persistency.DataProtection, 'deleteVendorId');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			oMockstar.clearTables(["project", "customer", "vendor", "personDataValidity"]);
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY:    ["CUSTOMER","VENDOR","CUSTOMER","CUSTOMER","PROJECT","PROJECT","VENDOR","PROJECT","VENDOR"],
				SUBJECT:   ["CU1"     ,"VD1"   ,"*"       ,"CU3"     , "*"     ,"PR1"    ,"*"     ,"PR3"    ,"VD4"   ],
				VALID_TO:  ["2029-01-14 08:00:00.0000000", "2029-05-14 08:00:00.0000000", null, "2020-01-14 08:00:00.0000000",null, "2019-05-14 08:00:00.0000000", null, "2029-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000"],
				VALID_FOR: [null, null, 60, null, 48, null, 24, null, null]
		    });
			oMockstar.insertTableData ("vendor", {
				VENDOR_ID :                     ["VD1", "VD2", "VD3", "VD3"],
				VENDOR_NAME :                   ["V5", "V55", null, null],
				COUNTRY :                       ["C1", "C2", null, null],
				POSTAL_CODE :                   ["1", "2", null, null],
				REGION :                        ["A", "B",null, null],
				CITY :                          ["X","Y", null, null],
				STREET_NUMBER_OR_PO_BOX :       ["11","22", null, null],
				_VALID_FROM :                   ['2019-01-01T15:39:09.691Z', '2027-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z','2010-01-01T15:39:09.691Z'],
				_VALID_TO :                     [null, null, '2029-01-01T15:39:09.691Z', null],
				_SOURCE :                       [1, 1, 1, 1],
				_CREATED_BY :                   [sTestUser, sTestUser2,sTestUser2, sTestUser2]
			});
			oMockstar.insertTableData("customer", {
				CUSTOMER_ID:                    ["CU2", "CU1","CU2", "CU3"],
				CUSTOMER_NAME:                  ["CU2", "CU1","CU2", "CU3"],
				COUNTRY:                        ["C1", "C2", null, null],
				POSTAL_CODE:                    ["1", "2", null, null],
				REGION:                         ["A", "B",null, null],
				CITY:                           ["X","Y", null, null],
				STREET_NUMBER_OR_PO_BOX:        ["11","22", null, null],
        		_VALID_FROM:                    ['2019-01-01T15:39:09.691Z', '2010-01-01T15:39:09.691Z', '2010-01-01T15:39:09.691Z', '2019-01-01T15:39:09.691Z'],
				_VALID_TO :                     [null, null, '2019-01-01T15:39:09.691Z', null],
				_SOURCE :                       [1, 1, 1, 1],
				_CREATED_BY :                   [sTestUser, sTestUser2,sTestUser2, sTestUser2]
			});
			oMockstar.insertTableData("project", {
			   PROJECT_ID:				        ["PR1",						"PR2"],
				ENTITY_ID:						[1,                           2],
				REFERENCE_PROJECT_ID:		    ["0",						"0"],
				PROJECT_NAME:				    ["Prj 1",					"Prj 2"],
				PROJECT_RESPONSIBLE:		    [sTestUser,					sTestUser2],
				CONTROLLING_AREA_ID:		    ["CA1",                     "CA1"],
				CUSTOMER_ID:				    [sTestCustomer,				sTestCustomer],
				SALES_DOCUMENT:			        ["SD1",						"SD1"],
				SALES_PRICE:				    ["20",						"10"],
				SALES_PRICE_CURRENCY_ID:	    ["EUR",						"EUR"],
				COMMENT:					    ["Comment 1",				"Comment 2"],
				COMPANY_CODE_ID:			    ["CC1",						"CC1"],
				PLANT_ID:					    ["PL1",						"PL1"],
				BUSINESS_AREA_ID:			    ["B1",						"B1"],
				PROFIT_CENTER_ID:			    ["P4",						"P4"],
				REPORT_CURRENCY_ID:		        ["EUR",						"EUR"],
				COSTING_SHEET_ID:			    ["COGM",					"COGM"],
				COMPONENT_SPLIT_ID:	    	    ["1",			            "1"],
				START_OF_PROJECT:			    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				END_OF_PROJECT:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				START_OF_PRODUCTION:		    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				END_OF_PRODUCTION:		        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				VALUATION_DATE:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				LIFECYCLE_VALUATION_DATE:       [sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
				LIFECYCLE_PERIOD_INTERVAL:      [12,						12],
				CREATED_ON:				        ['2019-01-01T15:39:09.691Z', 	'2010-01-01T15:39:09.691Z'],
				CREATED_BY:		        		[sTestUser, 				sTestUser2],
				LAST_MODIFIED_ON:			    [sExpectedDateWithoutTime,	sExpectedDateWithoutTime],
				LAST_MODIFIED_BY:	        	[sTestUser2, 				sTestUser],
				EXCHANGE_RATE_TYPE_ID:          [sDefaultExchangeRateType,	sDefaultExchangeRateType],
				MATERIAL_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy],
				ACTIVITY_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy]
			});

			
			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.deleteCustomerId).toHaveBeenCalledTimes(2);
			expect(persistency.DataProtection.deleteVendorId).toHaveBeenCalledTimes(2);//once for V3 and once for V4 in switch (even if no V4 in t_vendor)
			expect(persistency.DataProtection.removePersonalDataFromProject).toHaveBeenCalledTimes(2);
		});

		it('should delete personal data if validity end is reached when valid_to is set for general data', function() {
			// arrange
			spyOn(persistency.DataProtection, 'removePersonalDataFromProject');
			spyOn(persistency.DataProtection, 'deleteCustomerId');
			spyOn(persistency.DataProtection, 'deleteVendorId');
			spyOn(jasmine.dbConnection, 'commit').and.callFake(function() {});
			oMockstar.clearTables(["project", "customer", "vendor", "personDataValidity"]);
			
			oMockstar.insertTableData("personDataValidity", {
				ENTITY:    ["CUSTOMER","VENDOR","CUSTOMER", "PROJECT","PROJECT","VENDOR","PROJECT","VENDOR"],
				SUBJECT:   ["CU1"     ,"VD1"   ,"*"       , "*"     ,"PR1"    ,"*"     ,"PR3"    ,"VD4"   ],
				VALID_TO:  ["2029-01-14 08:00:00.0000000", "2029-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000", "2029-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000"]
		    });
			oMockstar.insertTableData ("vendor", {
				VENDOR_ID :                     ["VD1", "VD2", "VD3", "VD3"],
				VENDOR_NAME :                   ["V5", "V55", null, null],
				COUNTRY :                       ["C1", "C2", null, null],
				POSTAL_CODE :                   ["1", "2", null, null],
				REGION :                        ["A", "B",null, null],
				CITY :                          ["X","Y", null, null],
				STREET_NUMBER_OR_PO_BOX :       ["11","22", null, null],
				_VALID_FROM :                   ['2019-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z','2010-01-01T15:39:09.691Z'],
				_VALID_TO :                     [null, null, '2020-01-01T15:39:09.691Z', null],
				_SOURCE :                       [1, 1, 1, 1],
				_CREATED_BY :                   [sTestUser, sTestUser2,sTestUser2, sTestUser2]
			});
			oMockstar.insertTableData("customer", {
				CUSTOMER_ID:                    ["CU2", "CU1","CU2", "CU3"],
				CUSTOMER_NAME:                  ["CU2", "CU1","CU2", "CU3"],
				COUNTRY:                        ["C1", "C2", null, null],
				POSTAL_CODE:                    ["1", "2", null, null],
				REGION:                         ["A", "B",null, null],
				CITY:                           ["X","Y", null, null],
				STREET_NUMBER_OR_PO_BOX:        ["11","22", null, null],
        		_VALID_FROM:                    ['2019-01-01T15:39:09.691Z', '2010-01-01T15:39:09.691Z', '2010-01-01T15:39:09.691Z', '2019-01-01T15:39:09.691Z'],
				_VALID_TO :                     [null, null, '2019-01-01T15:39:09.691Z', null],
				_SOURCE :                       [1, 1, 1, 1],
				_CREATED_BY :                   [sTestUser, sTestUser2,sTestUser2, sTestUser2]
			});
			oMockstar.insertTableData("project", {
			   PROJECT_ID:				        ["PR1",						"PR2"],
				ENTITY_ID:						[1,                           2],
				REFERENCE_PROJECT_ID:		    ["0",						"0"],
				PROJECT_NAME:				    ["Prj 1",					"Prj 2"],
				PROJECT_RESPONSIBLE:		    [sTestUser,					sTestUser2],
				CONTROLLING_AREA_ID:		    ["CA1",                     "CA1"],
				CUSTOMER_ID:				    [sTestCustomer,				sTestCustomer],
				SALES_DOCUMENT:			        ["SD1",						"SD1"],
				SALES_PRICE:				    ["20",						"10"],
				SALES_PRICE_CURRENCY_ID:	    ["EUR",						"EUR"],
				COMMENT:					    ["Comment 1",				"Comment 2"],
				COMPANY_CODE_ID:			    ["CC1",						"CC1"],
				PLANT_ID:					    ["PL1",						"PL1"],
				BUSINESS_AREA_ID:			    ["B1",						"B1"],
				PROFIT_CENTER_ID:			    ["P4",						"P4"],
				REPORT_CURRENCY_ID:		        ["EUR",						"EUR"],
				COSTING_SHEET_ID:			    ["COGM",					"COGM"],
				COMPONENT_SPLIT_ID:	    	    ["1",			            "1"],
				START_OF_PROJECT:			    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				END_OF_PROJECT:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				START_OF_PRODUCTION:		    [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				END_OF_PRODUCTION:		        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				VALUATION_DATE:			        [sExpectedDateWithoutTime, 	sExpectedDateWithoutTime],
				LIFECYCLE_VALUATION_DATE:       [sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
				LIFECYCLE_PERIOD_INTERVAL:      [12,						12],
				CREATED_ON:				        ['2019-01-01T15:39:09.691Z', 	'2010-01-01T15:39:09.691Z'],
				CREATED_BY:		        		[sTestUser, 				sTestUser2],
				LAST_MODIFIED_ON:			    [sExpectedDateWithoutTime,	sExpectedDateWithoutTime],
				LAST_MODIFIED_BY:	        	[sTestUser2, 				sTestUser],
				EXCHANGE_RATE_TYPE_ID:          [sDefaultExchangeRateType,	sDefaultExchangeRateType],
				MATERIAL_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy],
				ACTIVITY_PRICE_STRATEGY_ID:     [sDefaultPriceDeterminationStrategy, sDefaultPriceDeterminationStrategy]
			});

			
			// act
			persistency.DataProtection.erasePersonalDataAfterEndOfValidity();

			// assert
			
			expect(persistency.DataProtection.deleteCustomerId).toHaveBeenCalledTimes(2);
			expect(persistency.DataProtection.deleteVendorId).toHaveBeenCalledTimes(3);//for V2, V3 and for V4 in switch (even if no V4 in t_vendor)
			expect(persistency.DataProtection.removePersonalDataFromProject).toHaveBeenCalledTimes(2);			
		});
	});
	
	describe('get personal data', function() {
		const vDataProtection = 'sap.plc.db.views::V_DATA_PROTECTION_DISPLAY_INFO';
		const sEntityId = sTestVendor2;
		const sEntityTypeVendor = "VENDOR";
		const sEntityRetentionMetadata = "VENDOR_ID;VENDOR_NAME;COUNTRY;POSTAL_CODE;REGION;CITY;STREET_NUMBER_OR_PO_BOX;_VALID_FROM;_VALID_TO;_SOURCE";
		const sDateWithTimezone = `${sExpectedRetentionDate.toDateString()} ${sExpectedRetentionDate.toTimeString()}`;
		const sEntityRetentionData = [`55;V55;C2;2;B;Y;22;${sDateWithTimezone};;1`];	

		it('should return all the personal data for the given entity id', function() {
			// act
			const oPersistencyResult = persistency.DataProtection.getPersonalData(sEntityId, sEntityTypeVendor);
			const oPersistencyResultCompressed = JSON.parse(JSON.stringify(helpers.transposeResultArrayOfObjects(oPersistencyResult, true)));
			const oMockPersistencyResult = oMockstar.execQuery(`select TABLE_NAME, COLUMN_NAME, ENTITY_ID as ENTITY, COUNTER from "${vDataProtection}" where ENTITY_ID = '${sEntityId}' and ENTITY_TYPE = '${sEntityTypeVendor}'`);
			const oMockPersistencyResultCompressed = mockstar_helpers.convertResultToArray(oMockPersistencyResult);
			const oRetentionData = persistency.DataProtection.getRetentionData(sEntityId, sEntityTypeVendor);
			// assert
			expect(oPersistencyResultCompressed).toEqual(oMockPersistencyResultCompressed);
			expect(oRetentionData.data.length).toBe(1);
			expect(oRetentionData.metadata).toEqual(sEntityRetentionMetadata);
			expect(oRetentionData.data).toEqual(sEntityRetentionData);
		});

		it('should return all the personal data for the given entity id and order the retention data by _VALID_TO column', function() {
			//arrange
			let oTestData = {
				"VENDOR_ID" : ['55', '55', '55'],
				"VENDOR_NAME" : ['N1', 'N2', 'N3'],
				"COUNTRY" : ['C1', 'C2', 'C3'],
				"POSTAL_CODE" : ['1', '1', '2'],
				"REGION" : ['A', 'A', 'B'],
				"CITY" : ['A', 'A', 'C'],
				"STREET_NUMBER_OR_PO_BOX" : ['1', '2', '3'],
				"_VALID_FROM" : ['2013-01-01T15:39:09.691Z', '2011-01-01T15:39:09.691Z', '2016-01-01T15:39:09.691Z'],
				"_VALID_TO" : ['2014-01-01T15:39:09.691Z', '2012-01-01T15:39:09.690Z', '2017-04-30T15:39:09.691Z'],
				"_SOURCE" : [1, 1, 1],
				"_CREATED_BY" : ['U000001', 'U000002', 'U000001']
			};
			oMockstar.insertTableData("vendor", oTestData);
			// act
			const oPersistencyResult = persistency.DataProtection.getPersonalData(sEntityId, sEntityTypeVendor);
			const oPersistencyResultCompressed = JSON.parse(JSON.stringify(helpers.transposeResultArrayOfObjects(oPersistencyResult, true)));
			const oMockPersistencyResult = oMockstar.execQuery(`select TABLE_NAME, COLUMN_NAME, ENTITY_ID as ENTITY, COUNTER from "${vDataProtection}" where ENTITY_ID = '${sEntityId}' and ENTITY_TYPE = '${sEntityTypeVendor}'`);
			const oMockPersistencyResultCompressed = mockstar_helpers.convertResultToArray(oMockPersistencyResult);
			const oRetentionData = persistency.DataProtection.getRetentionData(sEntityId, sEntityTypeVendor);
			// assert
			expect(oPersistencyResultCompressed).toEqual(oMockPersistencyResultCompressed);
			expect(oRetentionData.data.length).toBe(4);
			expect(oRetentionData.metadata).toEqual(sEntityRetentionMetadata);
			expect(oRetentionData.data[0]).toEqual(sEntityRetentionData[0]);
		});
		
		it('should return an empty object when there is no personal data in the database for the given entity_id', () => {
		    
			// act
			oMockstar.clearAllTables();
			const oPersistencyResult = persistency.DataProtection.getPersonalData(sEntityId, sEntityTypeVendor);
			const oRetentionData = persistency.DataProtection.getRetentionData(sEntityId, sEntityTypeVendor);
			// assert
			expect(Array.isArray(oPersistencyResult)).toBeTruthy();
			expect(oPersistencyResult.length).toBe(0);
			expect(oRetentionData.data.length).toBe(0);
        });

    });

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);