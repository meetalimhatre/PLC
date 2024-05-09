/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;

describe('p_item_get_items', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var mockstar = null;
                
        beforeOnce(function() {
            mockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: "sap.plc.db.calculationmanager.procedures/p_item_get_items",
            substituteTables: // substitute all used tables in the procedure or view
                {
                    item_temporary: "sap.plc.db::basis.t_item_temporary",
                    item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
                    calculation_version_temp: "sap.plc.db::basis.t_calculation_version_temporary",
                    material: "sap.plc.db::basis.t_material",
                    material_type: "sap.plc.db::basis.t_material_type",
                    material_group: "sap.plc.db::basis.t_material_group",
                    material_plant: "sap.plc.db::basis.t_material_plant",
                    overhead_group: "sap.plc.db::basis.t_overhead_group",
                    valuation_class: "sap.plc.db::basis.t_valuation_class",
                    document: "sap.plc.db::basis.t_document",
                    document_type: "sap.plc.db::basis.t_document_type",
                    document_status: "sap.plc.db::basis.t_document_status",
                    design_office: "sap.plc.db::basis.t_design_office"
                }
            });
        });
        
        afterOnce(function() {
        	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
        });
        
        beforeEach(function() {
            mockstar.clearAllTables(); // clear all specified substitute tables and views
            mockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
            mockstar.insertTableData("calculation_version_temp", testData.oCalculationVersionTemporaryTestData);
            mockstar.insertTableData("document_type", testData.oDocumentTypeTestDataPlc);
            mockstar.insertTableData("document", testData.oDocumentTestDataPlc);
            if(jasmine.plcTestRunParameters.generatedFields === true){
    			mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
            }
        });
        
        afterEach(function() {  });
        
        function testGetItems(){
        	
            // assemble                        
            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,testData.oItemTemporaryExtData),testData.aCalculatedCustomFields);
            }
    		
            // keep only items: [ 3001, 3002 ]
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-3);});
            
			var oInputItemIds = {
					"ITEM_ID" : [ 3001, 3002]
			};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);
            
        }
        
        it('should read items --> values returned', function() {
        	
			testGetItems();

        });
        
        
        it('should read items --> values returned for document type from Document table', function() {
        	
			// assemble       
			mockstar.clearTable("item_temporary"); // clear specified substitute tables and views
            var oItemTemporaryTestDataWithDocumentType = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTemporaryTestDataWithDocumentType.DOCUMENT_TYPE_ID = [ 'DT1', 'DT1','DT1', 'DT1','DT1' ];
            mockstar.insertTableData("item_temporary", oItemTemporaryTestDataWithDocumentType);
            
            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,testData.oItemTemporaryExtData),testData.aCalculatedCustomFields);
            }
    		
            // keep only items: [ 3001, 3002 ]
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-3);});
            oExpectedItemData.DOCUMENT_TYPE_ID = [ 'DT1', 'DT1' ];  // as procedure will look first in document table only DT1 will be returned
            
			var oInputItemIds = {
					"ITEM_ID" : [ 3001, 3002]
					};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);

        });
        
        it('should read items --> values returned for document type from Document type table', function() {
        	
			// assemble       
			mockstar.clearTable("item_temporary"); // clear specified substitute tables and views
			mockstar.clearTable("document_type");
            var oItemTemporaryTestDataWithDocumentType = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTemporaryTestDataWithDocumentType.DOCUMENT_TYPE_ID = [ 'DT2', 'DT2','DT2', 'DT2','DT2' ];
            mockstar.insertTableData("item_temporary", oItemTemporaryTestDataWithDocumentType);
            var oDocumentTypeTestDataPlcWithValidToNullForDT2 = _.cloneDeep(testData.oDocumentTypeTestDataPlc);
            oDocumentTypeTestDataPlcWithValidToNullForDT2._VALID_TO = [ null, null, null, null, null ];
            mockstar.insertTableData("document_type", oDocumentTypeTestDataPlcWithValidToNullForDT2);
            
            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,testData.oItemTemporaryExtData),testData.aCalculatedCustomFields);
            }
    		
            // keep only items: [ 3001, 3002 ]
            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-3);});
            oExpectedItemData.DOCUMENT_TYPE_ID = [ 'DT2', 'DT2' ];  // as procedure will look first in document table only DT1 will be returned
            
			var oInputItemIds = {
					"ITEM_ID" : [ 3001, 3002]
					};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);

        });

        it('should read items if version is opened in another session --> values returned', function() {
        	
        	//add entries in temporary tables for a new session
            var oItemTestDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTestDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
            mockstar.insertTableData("item_temporary", oItemTestDataCloneItemsInOtherSession);
            if(jasmine.plcTestRunParameters.generatedFields === true){
    			var oItemExtDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryExtData);
    			oItemExtDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
    			mockstar.insertTableData("item_temporary_ext", oItemExtDataCloneItemsInOtherSession);
            }
        	        	
			testGetItems();

        });
        
        
        it('should not return any item when item does not exist', function() {
        	            
			var oInputItemIds = {
					"ITEM_ID" : [ 3005]
			};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems.ITEM_ID.length).toBe(0);

        });
        
        it("should return correct TOTAL_COST_PER_UNIT, TOTAL_COST_PER_UNIT_FIXED_PORTION, TOTAL_COST_PER_UNIT_VARIABLE_PORTION", function() {
        	            
			var oInputItemIds = {
					"ITEM_ID" : [ 3001]
			};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems.TOTAL_COST_PER_UNIT[0]).toBe(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[0]);
            expect(aResultItems.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]).toBe(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]);
            expect(aResultItems.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]).toBe(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]);

        });

        it("should return correct IS_DISABLING_ACCOUNT_DETERMINATION", function() {
        	            
			var oInputItemIds = {
					"ITEM_ID" : [ 3001]
			};
            
			var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);

			//assert
			var aResultItems = mockstar_helpers.convertResultToArray(result);
            expect(aResultItems.IS_DISABLING_ACCOUNT_DETERMINATION[0]).toBe(testData.oItemTemporaryTestData.IS_DISABLING_ACCOUNT_DETERMINATION[0]);
    
        });
        
        if(jasmine.plcTestRunParameters.generatedFields === true){
	        it('should read items and fill custom fields with null if there is no entry in the extension table', function() {
	        	// assemble                        
	            var oItemTemporaryTestDataClone = _.cloneDeep(testData.oItemTemporaryTestData);
	            
	        	mockstar.clearTable("item_temporary_ext");
	        	var oItemTempExtClone = _.omit(_.cloneDeep(testData.oItemTemporaryExtData),["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);
	        	_.each(oItemTempExtClone, function(value, key){ oItemTempExtClone[key] = [null, null, null, null, null];});
	    		oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone,oItemTempExtClone),testData.aCalculatedCustomFields);
	            
	    		
	            // keep only items: [ 3001, 3002 ]
	            var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestDataClone));
	            _.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-3);});
	            
				var oInputItemIds = {
						"ITEM_ID" : [ 3001, 3002 ]
				};
	            
				var result = mockstar.call(mockstar_helpers.transpose(oInputItemIds),testData.sSessionId, testData.iCalculationVersionId, null);
	
				//assert
				var aResultItems = mockstar_helpers.convertResultToArray(result);
	            expect(aResultItems).toMatchData(oExpectedItemData, ["SESSION_ID","ITEM_ID","CALCULATION_VERSION_ID"]);
	
	        });
        }
        
    }).addTags(["All_Unit_Tests","CF_Unit_Tests"]);