/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstarHelpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;

describe('p_calculation_version_reset_missing_nontemporary_masterdata', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var oMockstar = null;
        var iCalculationVersionId = testData.iCalculationVersionId;
        
    	var oExpectedUnchangedCalculationVersion = {
    			"CALCULATION_VERSION_ID":  [testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0]],
    			"COSTING_SHEET_ID":  [testData.oCalculationVersionTemporaryTestData.COSTING_SHEET_ID[0]],
    			"COMPONENT_SPLIT_ID":  [testData.oCalculationVersionTemporaryTestData.COMPONENT_SPLIT_ID[0]]
    		};    	        
    	var oExpectedUnchangedItems = {
    			"ITEM_ID":  [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
    			"ACCOUNT_ID":  [testData.oItemTemporaryTestData.ACCOUNT_ID[0], testData.oItemTemporaryTestData.ACCOUNT_ID[1], testData.oItemTemporaryTestData.ACCOUNT_ID[2]]
    		};
    	
     
        beforeOnce(function() {
            oMockstar = new MockstarFacade({
            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_reset_missing_nontemporary_masterdata",
            substituteTables: 
                {
        			account : {
        				name : "sap.plc.db::basis.t_account",
        				data : testData.oAccountTestDataPlc
        			},
            		calculation : {
            			name : "sap.plc.db::basis.t_calculation",
            			data : testData.oCalculationTestData
            		},
                	calculation_version_temporary:{
            			name : "sap.plc.db::basis.t_calculation_version_temporary",
            			data : testData.oCalculationVersionTemporaryTestData
            		},
            		costing_sheet : {
            			name : "sap.plc.db::basis.t_costing_sheet",
            			data : testData.oCostingSheetTestData
            		},
            		component_split : {
            			name : "sap.plc.db::basis.t_component_split",
            			data : testData.oComponentSplitTest
            		},
                	item_temporary:  {
            			name : "sap.plc.db::basis.t_item_temporary",
            			data : testData.oItemTemporaryTestData
            		},
            		project : {
            			name : "sap.plc.db::basis.t_project",
            			data : testData.oProjectTestData
            		}
                }
            });
        });
        
        afterOnce(function() {
        	oMockstar.cleanup( testPackage + "sap.plc.db.calculationmanager.procedures" );
        });
        
        beforeEach(function() {
            oMockstar.clearAllTables(); // clear all specified substitute tables and views
            oMockstar.initializeData();
        });
        
        afterEach(function() {  });
        
        
        it('should not set masterdata to null if they exist -> no db changes', function() {
            // arrange            
            // act + assert
        	
        	// data should not change
        	var oExpectedProcedureOutput = [0, 0, 0];
        	
        	callAndCheckResults(oExpectedProcedureOutput, oExpectedUnchangedCalculationVersion, oExpectedUnchangedItems);
        });
        
        it('should set costing sheet of calculation version to null if it does not exist -> db updated', function() {
            // arrange
        	oMockstar.clearTable("costing_sheet");
        	var oCostingSheetTestData = mockstarHelpers.convertToObject(testData.oCostingSheetTestData, 0);
        	oCostingSheetTestData.CONTROLLING_AREA_ID = "#CAX";
        	oMockstar.insertTableData("costing_sheet", oCostingSheetTestData);
            
            // act + assert
        	var oExpectedProcedureOutput = [1, 0, 0];
        	var oExpectedUpdatedCalculationVersion = {
        			"CALCULATION_VERSION_ID":  [testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0]],
        			"COSTING_SHEET_ID":  [null],
        			"COMPONENT_SPLIT_ID":  [testData.oCalculationVersionTemporaryTestData.COMPONENT_SPLIT_ID[0]]
        		};
        	callAndCheckResults(oExpectedProcedureOutput, oExpectedUpdatedCalculationVersion, oExpectedUnchangedItems);
        });
        
        it('should set component split of calculation version to null if it does not exist -> db updated', function() {
            // arrange
        	oMockstar.clearTable("component_split");
        	var oComponentSplitTest = mockstarHelpers.convertToObject(testData.oComponentSplitTest, 0);
        	oComponentSplitTest.CONTROLLING_AREA_ID = "#CAX";
        	oMockstar.insertTableData("component_split", oComponentSplitTest);
            
            // act + assert
        	var oExpectedProcedureOutput = [0, 1, 0];
        	var oExpectedUpdatedCalculationVersion = {
        			"CALCULATION_VERSION_ID":  [testData.oCalculationVersionTemporaryTestData.CALCULATION_VERSION_ID[0]],
        			"COSTING_SHEET_ID":  [testData.oCalculationVersionTemporaryTestData.COSTING_SHEET_ID[0]],
        			"COMPONENT_SPLIT_ID":  [null]
        		};
        	callAndCheckResults(oExpectedProcedureOutput, oExpectedUpdatedCalculationVersion, oExpectedUnchangedItems);
        });
        
        it('should set selected accounts of items to null if they do not exist -> db updated', function() {
            // arrange
        	oMockstar.clearTable("account");
        	var oAccountTestDataPlc = _.cloneDeep(testData.oAccountTestDataPlc);
        	oAccountTestDataPlc.CONTROLLING_AREA_ID[2] = "#CAX";
        	oMockstar.insertTableData("account", oAccountTestDataPlc);
            
            // act + assert
        	var oExpectedProcedureOutput = [0, 0, 2];
        	
        	var oExpectedUpdatedItems = {
        			"ITEM_ID":  [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
        			"ACCOUNT_ID":  [null, null, testData.oItemTestData.ACCOUNT_ID[2]]
        		};
        	callAndCheckResults(oExpectedProcedureOutput, oExpectedUnchangedCalculationVersion, oExpectedUpdatedItems);
        });
        
        it('should set all accounts of items to null if they do not exist -> db updated', function() {
            // arrange
        	oMockstar.clearTable("account");
        	var oAccountTestDataPlc = _.cloneDeep(testData.oAccountTestDataPlc);
        	oAccountTestDataPlc.CONTROLLING_AREA_ID[2] = "#CAX";
        	oAccountTestDataPlc.CONTROLLING_AREA_ID[3] = "#CAX";
        	oMockstar.insertTableData("account", oAccountTestDataPlc);
            
            // act + assert
        	var oExpectedProcedureOutput = [0, 0, 3];
        	
        	var oExpectedUpdatedItems = {
        			"ITEM_ID":  [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
        			"ACCOUNT_ID":  [null, null, null]
        		};
        	callAndCheckResults(oExpectedProcedureOutput, oExpectedUnchangedCalculationVersion, oExpectedUpdatedItems);
        });
               
        function callAndCheckResults(oExpectedProcedureOutput, oExpectedUpdatedCalculationVersion, oExpectedUpdatedItems){
        	// act
        	var result = oMockstar.call(iCalculationVersionId, testData.sSessionId, null, null, null);
        	
        	// assert
        	var oExpectedResult = [result[0], result[1], result[2].length];
            expect(oExpectedResult).toEqualObject(oExpectedProcedureOutput);
            
            // check db changes
    		var oUpdatedCalculationVersion = oMockstar.execQuery("select CALCULATION_VERSION_ID, COSTING_SHEET_ID, COMPONENT_SPLIT_ID from " +
    				"{{calculation_version_temporary}} where calculation_version_id = " + iCalculationVersionId);

    		expect(oUpdatedCalculationVersion).toMatchData(oExpectedUpdatedCalculationVersion, ["CALCULATION_VERSION_ID"]);
    		
    		var oUpdatedItems = oMockstar.execQuery("select ITEM_ID, ACCOUNT_ID from " +
    				"{{item_temporary}} where calculation_version_id = " + iCalculationVersionId);

    		expect(oUpdatedItems).toMatchData(oExpectedUpdatedItems, ["ITEM_ID"]);

        }
        
}).addTags(["All_Unit_Tests"]);