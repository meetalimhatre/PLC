/*jslint undef:true*/

var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers  = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;

describe('p_calculation_version_delete', function() {

    var testPackage = $.session.getUsername().toLowerCase();
    var mockstar = null;

    var oCalculationVersionTestData = {
            "CALCULATION_VERSION_ID":[2809,4809,5809],
            "CALCULATION_ID":[1978,2078,5078],
            "CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version","Baseline Version"],
            "ROOT_ITEM_ID":[3001,5001,7001],
            "REPORT_CURRENCY_ID":["EUR","USD","EUR"],
            "VALUATION_DATE":["2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
            "LAST_MODIFIED_BY":["Torsten","Detlef","Wilhem"],
            "MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
            "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
            "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
		};

    var oCalculationVersionVariantMatrixTestData = {
        "CALCULATION_VERSION_ID":[2809,4809,5809],
        "CALCULATION_ID":[1978,2078,5078],
        "CALCULATION_VERSION_NAME":["Baseline Version","Baseline Version","Baseline Version"],
        "CALCULATION_VERSION_TYPE": [4, 8, 8],
        "BASE_VERSION_ID": [null, 2809, 2809],
        "ROOT_ITEM_ID":[3001,5001,7001],
        "REPORT_CURRENCY_ID":["EUR","USD","EUR"],
        "VALUATION_DATE":["2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000","2014-06-01 00:00:00.2340000"],
        "LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
        "LAST_MODIFIED_BY":["Torsten","Detlef","Wilhem"],
        "MASTER_DATA_TIMESTAMP" : ["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000"],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
    };
		
    var oItemTestData = {
            "ITEM_ID":[3001,3002,3003,5001],
            "CALCULATION_VERSION_ID":[2809,2809,2809,4809],
            "PARENT_ITEM_ID":[0,3001,3002,0],
            "IS_ACTIVE":[1,1,1,1],
            "ITEM_CATEGORY_ID":[1,1,3,1],
            "CHILD_ITEM_CATEGORY_ID":[1,1,3,1],
            "ACCOUNT_ID":[0,0,625000,0],
            "CREATED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
            "CREATED_BY":["D043604","D043604","D043604","D043604"],
            "LAST_MODIFIED_ON":["2014-04-23 08:00:00.2340000","2014-04-23 08:00:00.2340000","2014-04-25 08:00:00.2340000","2014-04-23 08:00:00.2340000"],
            "LAST_MODIFIED_BY":["Torsten","Detlef","Wilhem","User1"],
            "PRICE_FIXED_PORTION":                    ["1.0000000","1.0000000","1.0000000","1.0000000"],
			"PRICE_VARIABLE_PORTION":                 ["0.0000000","0.0000000","0.0000000","0.0000000"],
			"TRANSACTION_CURRENCY_ID":          ['EUR','EUR','EUR','EUR'],
			"PRICE_UNIT":                             ["1.0000000","1.0000000","1.0000000","1.0000000"],
			"PRICE_UNIT_UOM_ID":                      ['EUR','EUR','EUR','EUR']
		};
    
    if(jasmine.plcTestRunParameters.generatedFields === true){
    	var oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001,3002,3003,5001], [2809,2809,2809,4809],testData.oItemExtData,4);
    }

    beforeOnce(function() {

        mockstar = new MockstarFacade( // Initialize Mockstar
            {
                testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_delete", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    item: "sap.plc.db::basis.t_item",
                    item_ext: "sap.plc.db::basis.t_item_ext",
                    project_lifecycle_configuration: "sap.plc.db::basis.t_project_lifecycle_configuration",
                    lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
                    variant: "sap.plc.db::basis.t_variant",
                    variant_item: "sap.plc.db::basis.t_variant_item",
                }
            });
    });

    afterOnce(function() {
        //mockstar.cleanup(); // clean up all test artefacts
    	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
    });

    beforeEach(function() {
        mockstar.clearAllTables(); // clear all specified substitute tables and views
        mockstar.insertTableData("calculation_version", oCalculationVersionTestData);
        mockstar.insertTableData("item", oItemTestData);
        mockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
        mockstar.insertTableData("lifecycle_period_value",  testData.oLifecyclePeriodValues);
        mockstar.insertTableData("variant", new TestDataUtility(testData.oVariantTestData).build());
        mockstar.insertTableData("variant_item", new TestDataUtility(testData.oVariantItemTestData).build());

        if(jasmine.plcTestRunParameters.generatedFields === true){
			mockstar.insertTableData("item_ext", oItemTestDataExt);
    	}
        mockstar.initializeData();
    });

    afterEach(function() {

    });
    
    it('should delete the calculation version and associated items when calculation_version_id is valid', function() {
        //arrange

        var iCalculationVersionId = 2809;
        // check that such calculation version and items exists
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version", "calculation_version_id="+iCalculationVersionId)).toBe(1);
        expect(mockstarHelpers .getRowCount(mockstar, "item", "calculation_version_id="+iCalculationVersionId)).toBe(3);
        
        var iOriginalCount_CalculationVersion = mockstarHelpers .getRowCount(mockstar, "calculation_version");
        var iOriginalCount_ItemAll = mockstarHelpers .getRowCount(mockstar, "item");
        var iOriginalCount_ItemCalcVersion = mockstarHelpers .getRowCount(mockstar, "item", "calculation_version_id="+iCalculationVersionId);
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
			var iOriginalCount_ItemAllExt = mockstarHelpers .getRowCount(mockstar, "item_ext");
	        var iOriginalCount_ItemExtCalcVersion = mockstarHelpers .getRowCount(mockstar, "item_ext", "calculation_version_id="+iCalculationVersionId);
	        expect(iOriginalCount_ItemExtCalcVersion).toBe(3);
    	}
        //act
        var result = mockstar.call(iCalculationVersionId, null);

        //assert
        
        // check that the entities have been deleted
		expect(result).toBe(1); // leaf_item_results
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version", "calculation_version_id="+iCalculationVersionId)).toBe(0);
        expect(mockstarHelpers .getRowCount(mockstar, "item", "calculation_version_id="+iCalculationVersionId)).toBe(0);

        // Check that other entities have not been deleted
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion-1);
        expect(mockstarHelpers .getRowCount(mockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion);
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
        	expect(mockstarHelpers .getRowCount(mockstar, "item_ext", "calculation_version_id="+iCalculationVersionId)).toBe(0);
        	expect(mockstarHelpers .getRowCount(mockstar, "item_ext")).toBe(iOriginalCount_ItemAllExt - iOriginalCount_ItemExtCalcVersion);
        }
        
    });
    
    it('should not delete any calculation version or items if calculation_version_id is invalid', function() {
        //arrange
        var iCalculationVersionID = 1111;
        var iValidCalculationVersionID = 2809;

        // check that the calculation version does not exist
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version", "calculation_version_id="+iCalculationVersionID)).toBe(0);
        // check that other entries exists
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version")).toBeGreaterThan(0);
        expect(mockstarHelpers .getRowCount(mockstar, "item")).toBeGreaterThan(0);
        
        // get the original number of entities        
        var iExpectedCount_CalcVersion = mockstarHelpers .getRowCount(mockstar, "calculation_version");
        var iExpectedCount_Item = mockstarHelpers .getRowCount(mockstar, "item");
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
			expect(mockstarHelpers .getRowCount(mockstar, "item_ext")).toBeGreaterThan(0);
			var iExpectedCount_ItemExt = mockstarHelpers .getRowCount(mockstar, "item_ext");
        }

        //act
        var result = mockstar.call(iCalculationVersionID, null);

        //assert
        expect(result).toBe(0);
        
        // check that no entities have been deleted
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version", "calculation_version_id="+iValidCalculationVersionID)).toBe(1);
        expect(mockstarHelpers .getRowCount(mockstar, "calculation_version")).toBe(iExpectedCount_CalcVersion);
        expect(mockstarHelpers .getRowCount(mockstar, "item")).toBe(iExpectedCount_Item);
        if(jasmine.plcTestRunParameters.generatedFields === true){
        	 expect(mockstarHelpers .getRowCount(mockstar, "item_ext")).toBe(iExpectedCount_ItemExt);
        }

    }); 
     
      it('should delete calculation total quantity and associated values', function() {
          // arrange
          var iCvId = testData.iCalculationVersionId;
          var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration");
          var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value");
          
          // act
          var result = mockstar.call(iCvId, null);
          
          // assert       
          expect(mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
          expect(mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
          expect(mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration", "calculation_version_id="+iCvId)).toBe(0);
      });
      
      it('should not delete total quantitiy if is not defined for a calculation version', function() {
          // arrange
          var iCalculationVersionId = 999;
          var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration");
          var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value");
          
          // act
          var result = mockstar.call(iCalculationVersionId, null);
          
          // assert       
          expect(mockstarHelpers.getRowCount(mockstar , "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
          expect(mockstarHelpers.getRowCount(mockstar , "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
      });
      
    it('should delete the variant matrix of a calculation version', function() {
        // arrange
        mockstar.clearTable("calculation_version");
        mockstar.insertTableData("calculation_version", new TestDataUtility(testData.oCalculationVersionTestData).build());
        const iCalculationVersionId = testData.oVariantTestData.CALCULATION_VERSION_ID[0];
        const sVariants = `select * from {{variant}} where CALCULATION_VERSION_ID = ${iCalculationVersionId}`;
        const aVersionVariantsBefore = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows;
        const sVariantItems = `select * from {{variant_item}} where VARIANT_ID in (${aVersionVariantsBefore})`;
        const iVersionVariantItemsBefore = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;

        // act
        mockstar.call(iCalculationVersionId, null);
        // assert
        const aVersionVariantsAfter = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows;
        const iVersionVariantItemsAfter = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;

        expect(aVersionVariantsBefore.length).not.toBe(0);
        expect(aVersionVariantsAfter.length).toBe(0);
        expect(iVersionVariantItemsBefore).not.toBe(0);
        expect(iVersionVariantItemsAfter).toBe(0);
    });
    
    it('should not delete variants if none belongs to the deleted version', function() {
        // arrange
        mockstar.clearTable("calculation_version");
        mockstar.insertTableData("calculation_version", new TestDataUtility(testData.oCalculationVersionTestData).build());
        // get a calculation version id that has no variants assigned
        const iCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[2];
        const sVariants = `select * from {{variant}}`;
        const iVariantsBefore = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows.length;
        const sVariantItems = `select * from {{variant_item}}`;
        const iVariantItemsBefore = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;
        // act
        mockstar.call(iCalculationVersionId, null);
        // assert
        const iVariantsAfter = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows.length;
        const iVariantItemsAfter = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;
        expect(iVariantsBefore).toBe(iVariantsAfter);
        expect(iVariantItemsBefore).toBe(iVariantItemsAfter);
    });
    
    it('should not delete other variants than the ones belonging to the deleted version', function() {
        // arrange
        mockstar.clearTable("calculation_version");
        mockstar.insertTableData("calculation_version", new TestDataUtility(testData.oCalculationVersionTestData).build());
        const iCalculationVersionId = testData.oVariantTestData.CALCULATION_VERSION_ID[0];
        const sVariants = `select * from {{variant}} where CALCULATION_VERSION_ID != ${iCalculationVersionId}`;
        const aOtherVariantsBefore = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows;
        const sVariantItems = `select * from {{variant_item}} where VARIANT_ID in (${aOtherVariantsBefore})`;
        const iOtherVariantItemsBefore = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;

        // act
        mockstar.call(iCalculationVersionId, null);
        // assert
        const aOtherVariantsAfter = mockstar.execQuery(sVariants).columns.VARIANT_ID.rows;
        const iOtherVariantItemsAfter = mockstar.execQuery(sVariantItems).columns.VARIANT_ID.rows.length;

        expect(aOtherVariantsBefore.length).toBe(aOtherVariantsAfter.length);
        expect(iOtherVariantItemsBefore).toBe(iOtherVariantItemsAfter);
        expect(aOtherVariantsBefore.length).not.toBe(0);
        expect(iOtherVariantItemsBefore).not.toBe(0);
    });
    it('should not delete generated versions when deleting their base version', function() {
            // arrange
            const iCalculationVersionId = testData.iCalculationVersionId;
            const aCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).build();
            aCalculationVersionTestData.BASE_VERSION_ID = [];
            aCalculationVersionTestData.BASE_VERSION_ID[1] = iCalculationVersionId;
            aCalculationVersionTestData.CALCULATION_VERSION_TYPE[1] = 8; // version generated from variant
            mockstar.clearTable("calculation_version");
            mockstar.insertTableData("calculation_version", aCalculationVersionTestData);

            const sGeneratedVersion = `select * from {{calculation_version}} where BASE_VERSION_ID = ${iCalculationVersionId}`;
            const aGeneratedVersionsBefore = mockstar.execQuery(sGeneratedVersion).columns.CALCULATION_VERSION_ID.rows;
            // act
            mockstar.call(iCalculationVersionId, null);
            // assert
            const sGeneratedVersionAfter = `select * from {{calculation_version}} where CALCULATION_VERSION_TYPE = 8`;
            const aGeneratedVersionAfter = mockstar.execQuery(sGeneratedVersionAfter).columns.BASE_VERSION_ID.rows;
            expect(aGeneratedVersionsBefore.length).toBe(aGeneratedVersionAfter.length);
            expect(aGeneratedVersionAfter).toEqual([null])
        });

    it('should set base_version_id to null for the calculations generated from matrix when the base version is deleted', function() {
        // arrange
        mockstar.clearTable("calculation_version");
        mockstar.insertTableData("calculation_version", oCalculationVersionVariantMatrixTestData);
        const iCalculationVersionId = testData.oVariantTestData.CALCULATION_VERSION_ID[0];

        const sGeneratedVersionBefore = `select * from {{calculation_version}} where BASE_VERSION_ID = ${iCalculationVersionId}`;
        const aVersionVariantsBefore = mockstar.execQuery(sGeneratedVersionBefore).columns.CALCULATION_VERSION_ID.rows;

        // act
        mockstar.call(iCalculationVersionId, null);

        // assert
        const sGeneratedVersion = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = ${aVersionVariantsBefore[0]} or CALCULATION_VERSION_ID = ${aVersionVariantsBefore[1]}`;
        const aVersionVariantsAfter = mockstar.execQuery(sGeneratedVersion).columns.BASE_VERSION_ID.rows;

        expect(aVersionVariantsAfter.length).toBe(2);
        expect(aVersionVariantsAfter).toEqual([null, null]);
    });
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);