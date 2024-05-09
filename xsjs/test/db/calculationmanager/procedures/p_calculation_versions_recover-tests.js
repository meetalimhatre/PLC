/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
var InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;

describe('p_calculations_versions_recover', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var mockstar = null;
        // TestData
        var oTwoDaysAgo = new Date();
        oTwoDaysAgo.setDate(oTwoDaysAgo.getDate() -2);

        var sTestUser = $.session.getUsername().toUpperCase();

        beforeOnce(function() {
            mockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculations_versions_recover",
            substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation_version_temporary: "sap.plc.db::basis.t_calculation_version_temporary",
                    open_calculation_version: "sap.plc.db::basis.t_open_calculation_versions",
                    item: "sap.plc.db::basis.t_item",
                    item_ext : "sap.plc.db::basis.t_item_ext",
                    project: "sap.plc.db::basis.t_project",
                    calculation: "sap.plc.db::basis.t_calculation",
                    authorization : {
						name : 'sap.plc.db::auth.t_auth_project',
						data : {
							PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0]],
							USER_ID      : [sTestUser],
							PRIVILEGE    : [InstancePrivileges.READ]
						}
					}
                }
            });
        });
        
        afterOnce(function() {
        	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
        });
        
        beforeEach(function() {
            mockstar.clearAllTables(); // clear all specified substitute tables and views
            mockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
            mockstar.insertTableData("item", testData.oItemTestData);
            mockstar.insertTableData("project", testData.oProjectTestData);
            mockstar.insertTableData("calculation", testData.oCalculationTestData);
            mockstar.insertTableData("open_calculation_version", testData.oOpenCalculationVersionsTestData);
            if (jasmine.plcTestRunParameters.generatedFields === true) {
            	mockstar.insertTableData("item_ext", testData.oItemExtData);
			}
            mockstar.initializeData();
        });
        
        afterEach(function() {  });
        
        it('should get one calculation version that must be recovered', function() {
            // assemble
			var iId =  0;
			var iLoadMasterdata = 0;             
			var iCurrent = 0;
			// copy the test data and remove the unexpected values for calculation version
            var oExpectedCalcVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
            _.each(oExpectedCalcVersion, function(value, key){ oExpectedCalcVersion[key] = value.splice(0, value.length-2);});
            // copy the test data and remove the unexpected values for items
            var oItemTestDataClone = _.cloneDeep(testData.oItemTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTestDataClone = _.omit(_.extend(oItemTestDataClone,testData.oItemExtData),testData.aCalculatedCustomFields);
            }
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-4);});


            // act
            var result = mockstar.call( 1, testData.sTestUser, null,null,null,null);

            // assert
            var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
            var resultItems = mockstar_helpers.convertResultToArray(result[1]);
            var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
            var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
            // check calculation version
            expect(resultCalcVersion).toMatchData(oExpectedCalcVersion, ["CALCULATION_VERSION_ID"]);
            expect(resultCalcVersion.ROOT_ITEM_ID[0]).toBe(resultItems.ITEM_ID[0]);
            // check calculations
            expect(resultCalculations.CALCULATION_ID.length).toBeGreaterThan(0);
            // check projects
            expect(resultProjects.PROJECT_ID.length).toBeGreaterThan(0);   
            
        });
        
        it('should get all calculation versions that must be recovered', function() {
            // assemble
			var iId =  0;
			var iLoadMasterdata = 0;             
			var iCurrent = 0;
			// copy the test data and remove the unexpected values for calculation version
            var oExpectedCalcVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
            _.each(oExpectedCalcVersion, function(value, key){ oExpectedCalcVersion[key] = value.splice(0, value.length-2);});
            // copy the test data and remove the unexpected values for items
            var oItemTestDataClone = _.cloneDeep(testData.oItemTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTestDataClone = _.omit(_.extend(oItemTestDataClone,testData.oItemExtData),testData.aCalculatedCustomFields);
            }
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-4);});


            // act
            var result = mockstar.call( 10, testData.sTestUser, null,null,null,null);

            // assert
            var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
            var resultItems = mockstar_helpers.convertResultToArray(result[1]);
            var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
            var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
            // check calculation version
            expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(2);
            // check item 
            expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(2);
            //expect(resultItems.ITEM_ID.length).toBe(2);
            expect(resultCalcVersion.ROOT_ITEM_ID[0]).toBe(resultItems.ITEM_ID[0]);
            // check calculations
            expect(resultCalculations.CALCULATION_ID.length).toBeGreaterThan(0);
            // check projects
            expect(resultProjects.PROJECT_ID.length).toBeGreaterThan(0);
            //check for TOTAL_COST_PER_UNIT
            expect(resultItems.TOTAL_COST_PER_UNIT[0]).toBe(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[0]);
            expect(resultItems.TOTAL_COST_PER_UNIT[1]).toBe(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[1]);
            //check for TOTAL_COST_PER_UNIT_VARIABLE_PORTION
    		expect(resultItems.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]);
    		expect(resultItems.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[1]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[1]);
    		//check for TOTAL_COST_PER_UNIT_FIXED_PORTION
    		expect(resultItems.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]);
    		expect(resultItems.TOTAL_COST_PER_UNIT_FIXED_PORTION[1]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[1]);
        });
        
        it('should not get any calculation version that must be recovered if the user does not have instance privilege', function() {
            // arrange
        	mockstar.clearTable("authorization");
			var iId =  0;
			var iLoadMasterdata = 0;             
			var iCurrent = 0;
		
            // act
            var result = mockstar.call( 10, testData.sTestUser, null,null,null,null);

            // assert
            var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
            expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(0);
            expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(0);
        });
   
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);