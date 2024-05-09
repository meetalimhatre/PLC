/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;

describe('p_calculation_version_set_new_id', function() {

        var testPackage = $.session.getUsername().toLowerCase();
        var mockstar = null;
               
        beforeOnce(function() {
            mockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: "sap.plc.db.calculationmanager.procedures/p_calculation_version_set_new_id",
            substituteTables: // substitute all used tables in the procedure or view
                {
                    calculation_version_temporary: "sap.plc.db::basis.t_calculation_version_temporary",
                    open_calculation_versions: "sap.plc.db::basis.t_open_calculation_versions",
                    item_temporary: "sap.plc.db::basis.t_item_temporary",
                    item_temporary_ext: "sap.plc.db::basis.t_item_temporary_ext",
                }
            });
        });
        
        afterOnce(function() {
        	mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
        });
        
        beforeEach(function() {
            mockstar.clearAllTables(); // clear all specified substitute tables and views
            mockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
            mockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
            }
            mockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
        });
        
        afterEach(function() {  });
        
        function testSetNewId(sSessionId,iNewCalculationVersionId,iOldCalculationVersionId){
            // assert
            var iCountOldCv = mockstar_helpers.getRowCount(mockstar, "calculation_version_temporary", "session_id='" + sSessionId + "' and calculation_version_id = " + iOldCalculationVersionId);
            var iCountOldOpenCv = mockstar_helpers.getRowCount(mockstar, "open_calculation_versions", "session_id='" + sSessionId + "' and calculation_version_id = " + iOldCalculationVersionId);
            var iCountOldItems = mockstar_helpers.getRowCount(mockstar, "item_temporary", "session_id='" + sSessionId + "' and calculation_version_id = " + iOldCalculationVersionId);
			if(jasmine.plcTestRunParameters.generatedFields === true){
	            var iCountOldItemsExt = mockstar_helpers.getRowCount(mockstar, "item_temporary_ext", "session_id='" + sSessionId + "' and calculation_version_id = " + iOldCalculationVersionId);
			}

            // act
            var result = mockstar.call(sSessionId,iNewCalculationVersionId,iOldCalculationVersionId);
            
            // assert
            var iCount = mockstar_helpers.getRowCount(mockstar, "calculation_version_temporary", "session_id='" + sSessionId + "' and calculation_version_id = " + iNewCalculationVersionId);
			expect(iCount).toEqual(iCountOldCv);
            
            var iCount = mockstar_helpers.getRowCount(mockstar, "open_calculation_versions", "session_id='" + sSessionId + "' and calculation_version_id = " + iNewCalculationVersionId);
			expect(iCount).toEqual(iCountOldOpenCv);
			
            var iCount = mockstar_helpers.getRowCount(mockstar, "item_temporary", "session_id='" + sSessionId + "' and calculation_version_id = " + iNewCalculationVersionId);
			expect(iCount).toEqual(iCountOldItems);
            
			if(jasmine.plcTestRunParameters.generatedFields === true){
	            var iCount = mockstar_helpers.getRowCount(mockstar, "item_temporary_ext", "session_id='" + sSessionId + "' and calculation_version_id = " + iNewCalculationVersionId);
				expect(iCount).toEqual(iCountOldItemsExt);
			}
        }
        
        it('should set new calculation version id in tables: calculation_version_temporary, t_item_temporary, item_temporary_ext, open_calculation_versions', function() {
            // assemble
            var iOldCalculationVersionId = testData.iCalculationVersionId;
            var iNewCalculationVersionId = 1000;
            var sSessionId = testData.sSessionId;
                        
            testSetNewId(sSessionId,iNewCalculationVersionId,iOldCalculationVersionId);
            
        });
        
        it('should set new calculation version id in tables: calculation_version_temporary, t_item_temporary, item_temporary_ext, open_calculation_versions if calculation version is opend also in another session', function() {
            // assemble
            var iOldCalculationVersionId = testData.iCalculationVersionId;
            var iNewCalculationVersionId = 1000;
            var sSessionId = testData.sSessionId;
            
            var oItemTestDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryTestData);
            oItemTestDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
            mockstar.insertTableData("item_temporary", oItemTestDataCloneItemsInOtherSession);
            var oCalculationVersionTemporaryTestDataInOtherSession = _.cloneDeep(testData.oCalculationVersionTemporaryTestData);
            oCalculationVersionTemporaryTestDataInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
            mockstar.insertTableData("calculation_version_temporary", oCalculationVersionTemporaryTestDataInOtherSession);
            
            if(jasmine.plcTestRunParameters.generatedFields === true){
    			var oItemExtDataCloneItemsInOtherSession = _.cloneDeep(testData.oItemTemporaryExtData);
    			oItemExtDataCloneItemsInOtherSession.SESSION_ID = [testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId,testData.sSecondSessionId];
    			mockstar.insertTableData("item_temporary_ext", oItemExtDataCloneItemsInOtherSession);
            }
            
            testSetNewId(sSessionId,iNewCalculationVersionId,iOldCalculationVersionId)
            
        });
    
        it("should not modify id of variant matrix in t_open_calculation_versions", () => {
            // arrange
            const iOldCalculationVersionId = 1;
            const iNewCalculationVersionId = 2;
            const sSessionId = testData.sSessionId;
            mockstar.clearAllTables();
            mockstar.insertTableData("open_calculation_versions", {
                SESSION_ID: [sSessionId, sSessionId],
                CALCULATION_VERSION_ID: [iOldCalculationVersionId, iOldCalculationVersionId],
                CONTEXT: ["variant_matrix", "calculation_version"],
                IS_WRITEABLE: [1, 0],
            });

            // act
            mockstar.call(sSessionId, iNewCalculationVersionId, iOldCalculationVersionId);

            //assert
            const oExpectedData = {
                SESSION_ID: [sSessionId, sSessionId],
                CALCULATION_VERSION_ID: [iOldCalculationVersionId, iNewCalculationVersionId],
                CONTEXT: ["variant_matrix", "calculation_version"],
                IS_WRITEABLE: [1, 1],
            };
            const oTableData = mockstar.execQuery(`select * from {{open_calculation_versions}}`);
            expect(oTableData).toMatchData(oExpectedData, ["SESSION_ID", "CALCULATION_VERSION_ID", "CONTEXT"]);
            
        });
    
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);