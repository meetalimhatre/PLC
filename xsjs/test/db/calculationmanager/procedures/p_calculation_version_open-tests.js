/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");

describe('p_calculation_version_open', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var mockstar = null;
        
        beforeOnce(function() {
            mockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_open",
            substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation_version: "sap.plc.db::basis.t_calculation_version",
                    calculation_version_temporary: "sap.plc.db::basis.t_calculation_version_temporary",
                    open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
                    item: "sap.plc.db::basis.t_item",
                    item_temporary: "sap.plc.db::basis.t_item_temporary",
                    item_ext: "sap.plc.db::basis.t_item_ext",
                    item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
                    session: "sap.plc.db::basis.t_session",
                    referenced_version_component_split: "sap.plc.db::basis.t_item_referenced_version_component_split",
                    referenced_version_component_split_temporary: "sap.plc.db::basis.t_item_referenced_version_component_split_temporary"
                }
            });
        });
        
        afterOnce(function() {
        	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
        });
        
        beforeEach(function() {
            mockstar.clearAllTables(); // clear all specified substitute tables and views
            mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
            mockstar.insertTableData("item", testData.oItemTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	mockstar.insertTableData("item_ext", testData.oItemExtData);
            }
            mockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
            mockstar.insertTableData("session", testData.oSessionTestData);
            mockstar.insertTableData("referenced_version_component_split", testData.oReferencedVersionComponentSplitTestData);
        });
        
        afterEach(function() {  });
        
        it('should open a calculation version --> values returned', function() {
            // assemble
            var iCalculationVersionId = testData.iCalculationVersionId;
            // copy the test data and remove the unexpected values for calculation version
            var oExpectedCalcVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTemporaryTestData));
            _.each(oExpectedCalcVersion, function(value, key){ oExpectedCalcVersion[key] = value.splice(0, value.length-2);});
            // copy the test data and remove the unexpected values for items
            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,testData.oItemTemporaryExtData),testData.aCalculatedCustomFields);
            }
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-2);});
            // act
            var result = mockstar.call(iCalculationVersionId, testData.sSessionId, testData.sTestUser, 1, null, null);
            // assert
            var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
            var resultItems = mockstar_helpers.convertResultToArray(result[1]);
            
            expect(resultCalcVersion).toMatchData(oExpectedCalcVersion, ["SESSION_ID","CALCULATION_VERSION_ID"]);
            expect(resultItems).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);
            
        });
        
        it('should open a calculation version --> referenced version component split data copied to temporary table', function() {
            // arrange        
        	var oBuiltTestData = testDataGenerator.buildTestDataForReferencedCalcVer();
            var iCalculationVersionId = testData.iCalculationVersionId;
            mockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);
            
            // act
            mockstar.call(iCalculationVersionId, testData.sSessionId, testData.sTestUser, 1, null, null);
            
            // assert
            var temporaryComponentSplit = mockstar.execQuery("select * from {{referenced_version_component_split_temporary}}");
			expect(temporaryComponentSplit).toMatchData(testData.oReferencedVersionComponentSplitTemporaryTestData, ["SESSION_ID"]);
            
        });
        
        it('should open a calculation version twice --> data not inserted again in temporary tables', function() {
            // arrange        
        	var oBuiltTestData = testDataGenerator.buildTestDataForReferencedCalcVer();
            var iCalculationVersionId = testData.iCalculationVersionId;
            mockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);
            var exception;
            
            // act
            try{
                mockstar.call(iCalculationVersionId, testData.sSessionId, testData.sTestUser, 1, null, null);
                mockstar.call(iCalculationVersionId, testData.sSessionId, testData.sTestUser, 1, null, null);
            }catch(e){
                exception = e;
            }
            // assert
			expect(exception).toBeUndefined();
            
        });
    
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);