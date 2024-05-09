/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;

describe('p_item_delete_items_marked_for_deletion', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var mockstar = null;
                        
        beforeOnce(function() {
            mockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: "sap.plc.db.calculationmanager.procedures/p_item_delete_items_marked_for_deletion",
            substituteTables: // substitute all used tables in the procedure or view
                {
                    item_temporary: "sap.plc.db::basis.t_item_temporary",
                    item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
                    item: "sap.plc.db::basis.t_item",
                    item_ext: "sap.plc.db::basis.t_item_ext",
                    open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions"
                }
            });
        });
        
        afterOnce(function() {
        	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
        });
        
        beforeEach(function() {
            mockstar.clearAllTables(); // clear all specified substitute tables and views
            mockstar.insertTableData("item", testData.oItemTestData);
            mockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
    			mockstar.insertTableData("item_ext", testData.oItemExtData);
            }
        });
        
        afterEach(function() {  });
        
        function testDeletionOfItems(iCalculationVersionId, sSessionId, iDeletedItems){
        	
        	var sWhereItemCondition = "calculation_version_id="+iCalculationVersionId;
        	var sWhereItemTempCondition = "calculation_version_id="+iCalculationVersionId+" and session_id='"+sSessionId+"'";
            var iOriginalCount_ItemAll = mockstar_helpers.getRowCount(mockstar, "item");
            var iOriginalCount_ItemTempAll = mockstar_helpers.getRowCount(mockstar, "item_temporary");
            var iOriginalCount_ItemCalcVersion = mockstar_helpers.getRowCount(mockstar, "item", sWhereItemCondition);
            var iOriginalCount_ItemTempCalcVersion = mockstar_helpers.getRowCount(mockstar, "item_temporary", sWhereItemTempCondition);
                        
    		if(jasmine.plcTestRunParameters.generatedFields === true){
				var iOriginalCount_ItemAllExt = mockstar_helpers.getRowCount(mockstar, "item_ext");
				var iOriginalCount_ItemTempAllExt = mockstar_helpers.getRowCount(mockstar, "item_temporary_ext");
		        var iOriginalCount_ItemExtCalcVersion = mockstar_helpers.getRowCount(mockstar, "item_ext", sWhereItemCondition);
		        var iOriginalCount_ItemTempExtCalcVersion = mockstar_helpers.getRowCount(mockstar, "item_temporary_ext", sWhereItemTempCondition);
    		}
            
			var result = mockstar.call(testData.sSessionId, testData.iCalculationVersionId);//calculation 2809

			//assert
	        // check that the entities have been deleted
	        expect(mockstar_helpers.getRowCount(mockstar, "item", sWhereItemCondition)).toBe(iOriginalCount_ItemCalcVersion-iDeletedItems);
	        expect(mockstar_helpers.getRowCount(mockstar, "item_temporary", sWhereItemTempCondition)).toBe(iOriginalCount_ItemTempCalcVersion-iDeletedItems);

	        // Check that other entities have not been deleted
	        expect(mockstar_helpers.getRowCount(mockstar, "item")).toBe(iOriginalCount_ItemAll - iDeletedItems);
	        expect(mockstar_helpers.getRowCount(mockstar, "item_temporary")).toBe(iOriginalCount_ItemTempAll - iDeletedItems);
	        	        
	        if(jasmine.plcTestRunParameters.generatedFields === true){
	        	expect(mockstar_helpers.getRowCount(mockstar, "item_ext", sWhereItemCondition)).toBe(iOriginalCount_ItemExtCalcVersion-iDeletedItems);
	        	expect(mockstar_helpers.getRowCount(mockstar, "item_temporary_ext", sWhereItemTempCondition)).toBe(iOriginalCount_ItemTempExtCalcVersion-iDeletedItems);
	        	expect(mockstar_helpers.getRowCount(mockstar, "item_ext")).toBe(iOriginalCount_ItemAllExt - iDeletedItems);
	        	expect(mockstar_helpers.getRowCount(mockstar, "item_temporary_ext")).toBe(iOriginalCount_ItemTempAllExt - iDeletedItems);
	        }
	        
        }
        
        it('should delete the items marked for deletion', function() {
        	
            // assemble            
            var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 0, 1, 1, 0, 0 ];
            var iCalculationVersionId = testData.iCalculationVersionId;
            mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
            if(jasmine.plcTestRunParameters.generatedFields === true){
    			mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
            }
            
            var iDeletedItems = 2;
            testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

        });
        
       it('should delete the items marked from deletion (from the writeable version) when the version is open twice (in 2 sessions)', function() {
        	
            // assemble            
            var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 0, 1, 1, 0, 0 ];
            var iCalculationVersionId = testData.iCalculationVersionId;
            var oItemTestDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTestDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
            mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
            mockstar.insertTableData("item_temporary", oItemTestDataCloneItemsInOtherSession);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
    			var oItemExtDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryExtData);
    			oItemExtDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
    			mockstar.insertTableData("item_temporary_ext", oItemExtDataCloneItemsInOtherSession);
            }
            
            var iDeletedItems = 2;
            testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

        });
       
       it('should not delete the items marked for deletion when the version is not open', function() {
       	
           // assemble            
           var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
           oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 0, 1, 1, 0, 0 ];
           var iCalculationVersionId = testData.iCalculationVersionId;
           mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
           if(jasmine.plcTestRunParameters.generatedFields === true){
        	   mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
           }
           mockstar.clearTable("open_calculation_versions");
            
           var iDeletedItems = 0; //no item should be deleted if the version is not opened
           testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

       });
       
       it('should not delete if no item is marked for deletion', function() {
          	
           // assemble            
           var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
           oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 0, 0, 0, 0, 0 ];
           var iCalculationVersionId = testData.iCalculationVersionId;
           mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
           if(jasmine.plcTestRunParameters.generatedFields === true){
        	   mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
           }
            
           var iDeletedItems = 0; //no item should be deleted 
           testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

       });
       
       it('should delete all items if all items are marked for deletion', function() {
         	
           // assemble            
           var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
           oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 1, 1, 1, 0, 0 ];
           var iCalculationVersionId = testData.iCalculationVersionId;
           mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
           if(jasmine.plcTestRunParameters.generatedFields === true){
        	   mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
           }
            
           var iDeletedItems = 3; //all items for a calculation version are marked for deletion
           testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

       });
       
       it('should not delete the items marked for deletion when the version is read-only', function() {
          	
           // assemble            
           var oItemTestDataCloneForItemsToDelete = _.cloneDeep(testData.oItemTemporaryTestData);
           oItemTestDataCloneForItemsToDelete.IS_DELETED = [ 0, 1, 1, 0, 0 ];
           var iCalculationVersionId = testData.iCalculationVersionId;
           mockstar.insertTableData("item_temporary", oItemTestDataCloneForItemsToDelete);
           if(jasmine.plcTestRunParameters.generatedFields === true){
        	   mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
           }
           mockstar.clearTable("open_calculation_versions");
           var oOpenCalculationVersionsTestDataReadOnly = {  "SESSION_ID" : [ testData.sSessionId],
											        		 "CALCULATION_VERSION_ID" : [ iCalculationVersionId],
											        		 "IS_WRITEABLE" : [0]
											        		};
           mockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestDataReadOnly);
            
           var iDeletedItems = 0; //no item should be deleted if the version is read-only
           testDeletionOfItems(iCalculationVersionId,testData.sSessionId,iDeletedItems);

       });
        
    }).addTags(["All_Unit_Tests","CF_Unit_Tests"]);
