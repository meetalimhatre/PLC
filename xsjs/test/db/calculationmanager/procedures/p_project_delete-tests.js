var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");

describe('p_project_delete', function() {

    var testPackage = $.session.getUsername().toLowerCase();
    var mockstar = null;
    var sTestUser = $.session.getUsername().toUpperCase();
    var sProjectId = testData.oProjectTestData.PROJECT_ID[0];
    
    if(jasmine.plcTestRunParameters.generatedFields === true){
    	var oItemTestDataExt = testDataGenerator.createItemExtObjectFromObject([3001,3002,3003,5001], [2809,2809,2809,4809],testData.oItemExtData,4);
    }   
   
    beforeOnce(function() {

        mockstar = new MockstarFacade( // Initialize Mockstar
            {
                testmodel: "sap.plc.db.calculationmanager.procedures/p_project_delete", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation: "sap.plc.db::basis.t_calculation",
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    item: "sap.plc.db::basis.t_item",
                    item_ext: "sap.plc.db::basis.t_item_ext",
                    project: "sap.plc.db::basis.t_project",
                    project_lifecycle_configuration: "sap.plc.db::basis.t_project_lifecycle_configuration",
                    lifecycle_period_value: "sap.plc.db::basis.t_project_lifecycle_period_quantity_value",
                    project_activity_price_surcharges: "sap.plc.db::basis.t_project_activity_price_surcharges",
					project_activity_price_surcharge_values: "sap.plc.db::basis.t_project_activity_price_surcharge_values",
					project_material_price_surcharges: "sap.plc.db::basis.t_project_material_price_surcharges",
					project_material_price_surcharge_values:  "sap.plc.db::basis.t_project_material_price_surcharge_values",                    
                    authorization: "sap.plc.db::auth.t_auth_project"
                }
            });
    });

    afterOnce(function() {
        //mockstar.cleanup(); // clean up all test artefacts
        mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
    });

    beforeEach(function() {
        mockstar.clearAllTables(); // clear all specified substitute tables and views
        mockstar.insertTableData("calculation", testData.oCalculationTestData);
        mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
        mockstar.insertTableData("item", testData.oItemTestData);
        mockstar.insertTableData("project", testData.oProjectTestData);
        mockstar.insertTableData("project_lifecycle_configuration", testData.oProjectTotalQuantities);
        mockstar.insertTableData("lifecycle_period_value",  testData.oLifecyclePeriodValues);       
        mockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
        mockstar.insertTableData("project_activity_price_surcharge_values",  testData.oProjectActivityPriceSurchargeValues);
        mockstar.insertTableData("project_material_price_surcharges",  testData.oProjectMaterialPriceSurcharges);
        mockstar.insertTableData("project_material_price_surcharge_values",  testData.oProjectMaterialPriceSurchargeValues);

        
        
        mockstar.insertTableData("authorization",{
			PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0], testData.oProjectTestData.PROJECT_ID[1], testData.oProjectTestData.PROJECT_ID[0]],
			USER_ID      : [sTestUser, sTestUser, "TestUser"],
			PRIVILEGE    : ["READ", "FULL_EDIT", "READ"]
		});
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
    		mockstar.insertTableData("item_ext", oItemTestDataExt);
        }
        mockstar.initializeData();
    });
    
    it('should delete project and associated calculations, versions and items, authorizations if project_id is valid', function() {
        //arrange
        var iCalculationID = testData.oCalculationTestData.CALCULATION_ID[0];
        var iCalculationVersionId = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];

        // Check that such project exists
        expect(mockstarHelpers.getRowCount(mockstar, "project", "project_id = '"+sProjectId+"'")).toBe(1);
        
	    var iOriginalCount_Calculation = mockstarHelpers.getRowCount(mockstar, "calculation");
    	var iOriginalCount_CalculationVersion = mockstarHelpers.getRowCount(mockstar, "calculation_version");
    	var iOriginalCount_ItemAll = mockstarHelpers.getRowCount(mockstar, "item");
    	var iOriginalCount_ItemCalcVersion = mockstarHelpers.getRowCount(mockstar, "item", "calculation_version_id="+iCalculationVersionId);
    	var iOriginalCount_Privileges = mockstarHelpers.getRowCount(mockstar, "authorization");

    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		var iOriginalCount_ItemExtAll = mockstarHelpers.getRowCount(mockstar, "item_ext");
    		var iOriginalCount_ItemCalcVersionExt = mockstarHelpers.getRowCount(mockstar, "item_ext", "calculation_version_id="+iCalculationVersionId);
    	}
    	
        //act
        var result = mockstar.call(sProjectId, null);
        
        //assert
        expect(result).toBe(1);

        // Check that project has been deleted
        expect(mockstarHelpers.getRowCount(mockstar, "project", "project_id = '"+sProjectId+"'")).toBe(0);
        
        // Check that only entities assigned to the project have been deleted
        expect(mockstarHelpers.getRowCount(mockstar, "calculation", "calculation_id="+iCalculationID)).toBe(0);
        expect(mockstarHelpers.getRowCount(mockstar, "calculation_version", "calculation_id="+iCalculationID)).toBe(0);     
        
	    expect(mockstarHelpers.getRowCount(mockstar, "calculation")).toBe(iOriginalCount_Calculation-2);
	    expect(mockstarHelpers.getRowCount(mockstar, "calculation_version")).toBe(iOriginalCount_CalculationVersion-2);
	    expect(mockstarHelpers.getRowCount(mockstar, "item")).toBe(iOriginalCount_ItemAll - iOriginalCount_ItemCalcVersion-1);
	    expect(mockstarHelpers.getRowCount(mockstar, "authorization")).toBe(iOriginalCount_Privileges - 2);
	    
	    if(jasmine.plcTestRunParameters.generatedFields === true){
	    	expect(mockstarHelpers.getRowCount(mockstar, "item_ext")).toBe(iOriginalCount_ItemExtAll - iOriginalCount_ItemCalcVersionExt-1);
	    }
    });
    
    it('should not delete any calculation or any versions and items or authorizations if project does not exist', function() {
        //arrange
        let sProjectId = "PR_11111";
        
        // check that the project does not exist
        expect(mockstarHelpers.getRowCount(mockstar, "project", "project_id = '"+sProjectId+"'")).toBe(0);
        var iOriginalCount_Project = mockstarHelpers.getRowCount(mockstar, "project");
        // get the original number of entities
        var iExpectedCount_Calculation = mockstarHelpers.getRowCount(mockstar, "calculation");
        var iExpectedCount_CalcVersion = mockstarHelpers.getRowCount(mockstar, "calculation_version");
        var iExpectedCount_Item = mockstarHelpers.getRowCount(mockstar, "item");
        var iExpectedCount_Privileges = mockstarHelpers.getRowCount(mockstar, "authorization");
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
    		var iExpectedCount_ItemExt = mockstarHelpers.getRowCount(mockstar, "item_ext");
        }

        //act
        var result = mockstar.call(sProjectId, null);
        
        //assert
        expect(result).toBe(0);

        // Check that no entities have been deleted
        expect(mockstarHelpers.getRowCount(mockstar, "project")).toBe(iOriginalCount_Project);
        expect(mockstarHelpers.getRowCount(mockstar, "calculation")).toBe(iExpectedCount_Calculation);
        expect(mockstarHelpers.getRowCount(mockstar, "calculation_version")).toBe(iExpectedCount_CalcVersion);       
        expect(mockstarHelpers.getRowCount(mockstar, "item")).toBe(iExpectedCount_Item);
        expect(mockstarHelpers.getRowCount(mockstar, "authorization")).toBe(iExpectedCount_Privileges);
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
        	 expect(mockstarHelpers.getRowCount(mockstar, "item_ext")).toBe(iExpectedCount_ItemExt);
        }
    });
    
    it('should not delete project (and authorization) if it contains source version with master versions in different project', function() {
        //arrange
    	var sExpectedDate = new Date().toJSON();
		mockstar.insertTableData("calculation", testData.oCalculationTestData1);
		mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
		mockstar.insertTableData("item", {
			"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
			"CALCULATION_VERSION_ID" : [2810, 2810, 2, 6809, 6809],
			"PARENT_ITEM_ID" : [ null, 3001, 3001, null, 5001],
			"PREDECESSOR_ITEM_ID" : [ null, 3001, null, null, 5001],
			"IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
            "ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
            "CHILD_ITEM_CATEGORY_ID" : [ 0, 10, 10, 10, 10],
			"REFERENCED_CALCULATION_VERSION_ID": [null, 4811, 4, null, 2809],
			"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"CREATED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ],
			"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
			"LAST_MODIFIED_BY" : [ "TestUser", "TestUser", "TestUser", "TestUser", "TestUser" ]
		});	

        // Check that such project exists
    	 var iOriginalCount_Project = mockstarHelpers.getRowCount(mockstar, "project");
    	 var iOriginalCount_Authorization = mockstarHelpers.getRowCount(mockstar, "authorization");
        
        //act
        var result = mockstar.call(sProjectId, null);
        
        //assert
        expect(result).toBe(0);

        // Check that project was not deleted
        expect(mockstarHelpers.getRowCount(mockstar, "project")).toBe(iOriginalCount_Project);
        expect(mockstarHelpers.getRowCount(mockstar, "authorization")).toBe(iOriginalCount_Authorization);
    });
    
    it('should delete total quantities and associated values of project', function() {
        // arrange
        var iOriginalCount_Calculation = mockstarHelpers.getRowCount(mockstar, "calculation", "project_id='"+sProjectId+"'");
        var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration");
        var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value");
        
        // act
        var oResultObject = mockstar.call(sProjectId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities - iOriginalCount_Calculation);
        expect(mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues - 6);  
    });
        
    it('should not delete total quantities of a different project', function() {
        // arrange
        var sDifferentProjectId = testData.oProjectTestData.PROJECT_ID[2];
        var iOriginalCount_TotalQuantities = mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration");
        var iOriginalCount_TotalQuantitiesValues = mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value");
        
        // act
        var oResultObject = mockstar.call(sDifferentProjectId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_lifecycle_configuration")).toBe(iOriginalCount_TotalQuantities);
        expect(mockstarHelpers.getRowCount(mockstar, "lifecycle_period_value")).toBe(iOriginalCount_TotalQuantitiesValues);
    });
    
    it('should delete surcharge definitions and values of project', function() {
        // arrange
        var iOriginalCount_ActivityPriceSurcharges = mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharges");
        var iOriginalCount_ActivityPriceSurchargeValues= mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharge_values");
        var iOriginalCount_MaterialPriceSurcharges = mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharges");
        var iOriginalCount_MaterialPriceSurchargeValues= mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharge_values");        
        
        // act
        var oResultObject = mockstar.call(sProjectId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_ActivityPriceSurcharges - 1);
        expect(mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_ActivityPriceSurchargeValues - 3);  
        expect(mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharges")).toBe(iOriginalCount_MaterialPriceSurcharges - 1);
        expect(mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_MaterialPriceSurchargeValues - 3);  
    });
    
    it('should not delete surcharges of a different project', function() {
        // arrange
        var sDifferentProjectId = testData.oProjectTestData.PROJECT_ID[2];
        var iOriginalCount_ActivityPriceSurcharges = mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharges");
        var iOriginalCount_ActivityPriceSurchargeValues= mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharge_values");
        var iOriginalCount_MaterialPriceSurcharges = mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharges");
        var iOriginalCount_MaterialPriceSurchargeValues= mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharge_values");  
        
        // act
        var oResultObject = mockstar.call(sDifferentProjectId, null);
        
        // assert       
        expect(mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharges")).toBe(iOriginalCount_ActivityPriceSurcharges);
        expect(mockstarHelpers.getRowCount(mockstar, "project_activity_price_surcharge_values")).toBe(iOriginalCount_ActivityPriceSurchargeValues);  
        expect(mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharges")).toBe(iOriginalCount_MaterialPriceSurcharges);
        expect(mockstarHelpers.getRowCount(mockstar, "project_material_price_surcharge_values")).toBe(iOriginalCount_MaterialPriceSurchargeValues); 
    });
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);