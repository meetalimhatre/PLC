var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var _ = require("lodash");

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('db.administration:p_work_center_read',function() {
		
		var oMockstarPlc = null;
		
		var sMasterdataTimestamp = new Date().toJSON();
		var sValidFrom = '2015-01-01T15:39:09.691Z';
		var sValidTo = '2015-06-01T15:39:09.691Z';
		var sLanguage = 'EN';
		
		var oWorkCenter = {
			"WORK_CENTER_ID" : ['WC1' , 'WC2'],
    		"PLANT_ID" : ['PL1' , 'PL2'],
    		"WORK_CENTER_CATEGORY": ['1', '2'],
    		"COST_CENTER_ID" : ['CC1', 'CC2'],
    		"CONTROLLING_AREA_ID" : ["1000", "2000"],
    		"WORK_CENTER_RESPONSIBLE": ['U000001', 'U000001'],
    		"EFFICIENCY": ["300.0000000", "40.0000000"],
    		"_VALID_FROM" : [sValidFrom, sValidFrom],
    		"_VALID_TO" : [null, null],
    		"_SOURCE" :[1, 1],
    		"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oWorkCenterExt = {
				"WORK_CENTER_ID" : ['WC1' , 'WC2'],
	    		"PLANT_ID" : ['PL1' , 'PL2'],
	    		"_VALID_FROM" : [sValidFrom, sValidFrom],
	    		"CWCE_DECIMAL_MANUAL": ["20.0000000", "30.0000000"],
	    		"CWCE_DECIMAL_UNIT": ["EUR", "CAD"]
			};
		
		var oWorkCenterText = {
			"WORK_CENTER_ID" : ['WC1' , 'WC2'],
    		"PLANT_ID" : ['PL1' , 'PL2'],
    		"LANGUAGE": ['EN', 'DE'],
    		"WORK_CENTER_DESCRIPTION" : ['Work Center 1', 'Work Center 2'],
    		"_VALID_FROM" : [sValidFrom, sValidFrom],
    		"_VALID_TO" : [null, null],
    		"_SOURCE" :[1, 1],
    		"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oControllingArea = {
				"CONTROLLING_AREA_ID" : ['1000', '2000'],
				"CONTROLLING_AREA_CURRENCY_ID" : ['EUR', 'USD'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};		
		
		var oPlant = {
				"PLANT_ID" : ['PL1', 'PL2'],
				"COMPANY_CODE_ID" : ['CC1', 'CC2'],
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" :[1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};
		
		var oCostCenter = {
				"COST_CENTER_ID" : ['CC1', 'CC2'],
				"CONTROLLING_AREA_ID" : ['1000', '2000'],			
				"_VALID_FROM" : [sValidFrom, sValidFrom],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" :['U000001', 'U000001']
		};
		
		var oWorkCenterProcess = {
			"WORK_CENTER_ID" : ['WC1' , 'WC2', 'WC3'],
    		"PLANT_ID" : ['PL1' , 'PL2', 'PL3'],
    		"CONTROLLING_AREA_ID": ['1000', '2000', '3000'],
    		"PROCESS_ID" : ['BP1', 'BP2', 'BP3'],
    		"_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom],
    		"_VALID_TO" : [null, null, sValidTo],
    		"_SOURCE" : [1, 1, 1],
    		"_CREATED_BY" : ['U000001', 'U000002', 'U000003']
		};
		
		var oProcess = {
			"PROCESS_ID" : ['BP1', 'BP2', 'BP3'],
    		"CONTROLLING_AREA_ID": ['1000', '2000', '3000'],
    		"ACCOUNT_ID": ['A1', 'A2', 'A3'],
    		"_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom],
    		"_VALID_TO": [null, null, sValidTo],
    		"_SOURCE": [1, 1, 1],
    		"_CREATED_BY": ['U000001', 'U000002', 'U000003']
		};
		
		var oActivityType = {
		    "ACTIVITY_TYPE_ID" :['A1', 'A2', 'A3','A4'],
    		"CONTROLLING_AREA_ID" : ['1000', '2000', '1000','#CA1'],
    		"ACCOUNT_ID" : ['CE1', 'CE2', 'CE1','11000'],
    		"_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
            "_VALID_TO" : [null, null, null, null],
    		"_SOURCE" : [1, 1, 1, 1],
    		"_CREATED_BY" : ['U000001', 'U000002', 'U000001','U000001']
		};
		
		var oWorkCenterActivityType = {
		    "WORK_CENTER_ID" : ['WC1', 'WC2', 'WC3','WC99'],
            "ACTIVITY_TYPE_ID" :['A1', 'A2', 'A3','A4'],
            "PLANT_ID" : ['PL1' , 'PL2', 'PL3', 'PL5'],
            "CONTROLLING_AREA_ID" : ['1000', '2000', '1000', '#CA2'],
            "PROCESS_ID" : ['BP1', '*', 'BP3', "BP4", "BP5"],
            "QUANTITY" : [ "1", "1", "1", "1", "1" ],
            "TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
		    "LOT_SIZE" : [ null, null, null, null, null ],
		    "QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC" ],
            "_VALID_FROM" : [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        	"_VALID_TO" : [null, null, null, '2016-01-01T15:39:09.691Z'],
        	"_SOURCE" :[1, 1, 1, 2],
        	"_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000002']
		};
		
		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.administration.procedures/p_work_center_read", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{	
						    work_center: {
								name: "sap.plc.db::basis.t_work_center",
								data: oWorkCenter
							},
							work_center_text: {
								name: "sap.plc.db::basis.t_work_center__text",
								data: oWorkCenterText
							},
							plant: {
								name: "sap.plc.db::basis.t_plant",
								data: oPlant
							},
							cost_center: {
								name: "sap.plc.db::basis.t_cost_center",
								data: oCostCenter
							},
							controlling_area: {
								name: "sap.plc.db::basis.t_controlling_area",
								data: oControllingArea
							},
							process: {
								name: "sap.plc.db::basis.t_process",
								data: oProcess
							},
							work_center_process: {
								name: "sap.plc.db::basis.t_work_center_process",
								data: oWorkCenterProcess
							},
							work_center_ext: "sap.plc.db::basis.t_work_center_ext",
							activity_type: {
								name: "sap.plc.db::basis.t_activity_type",
								data: oActivityType
							},
							work_center_activity_type: {
								name: "sap.plc.db::basis.t_work_center_activity_type",
								data: oWorkCenterActivityType
							}
						}
					});
		});
		beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.initializeData();
		});

		afterEach(function() {
		});
		
		it('should return only correct work centers', function() {
			//arrange
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstarPlc.insertTableData("work_center_ext", oWorkCenterExt);
			}
			
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
			
            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            if(jasmine.plcTestRunParameters.generatedFields === true){            	
            	var expectedWorkCenter = _.extend(JSON.parse(JSON.stringify(oWorkCenter)), {
            		"CWCE_DECIMAL_MANUAL": ["20.0000000", "30.0000000"],
    	    		"CWCE_DECIMAL_UNIT": ["EUR", "CAD"]
                });
            } else {
            	var expectedWorkCenter = JSON.parse(JSON.stringify(oWorkCenter));
            }
            var expectedWorkCenterWithoutDates = _.omit(expectedWorkCenter, ["_VALID_TO", "_VALID_FROM"]);
            
            expect(actualWorkCenter.length).toBe(2);
			expect(actualWorkCenter).toMatchData(expectedWorkCenterWithoutDates, ["WORK_CENTER_ID", "PLANT_ID", "COST_CENTER_ID", "CONTROLLING_AREA_ID"]);
        });
        
        it('should return only correct work center texts', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);

            //assert
            var actualWorkCenterText = Array.slice(result.OT_WORK_CENTER_TEXT);
            
            var expectedWorkCenterText = JSON.parse(JSON.stringify(oWorkCenterText));
            var expectedWorkCenterTextWithoutDates = _.omit(expectedWorkCenterText, ["_VALID_TO", "_VALID_FROM"]);
            
            expect(actualWorkCenterText.length).toBe(2);
			expect(actualWorkCenterText).toMatchData(expectedWorkCenterTextWithoutDates, ["WORK_CENTER_ID", "PLANT_ID", "LANGUAGE"]);
        });
		
		it('should return only correct cost centers', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert
            var actualCostCenter = Array.slice(result.OT_COST_CENTER);
            var expectedCostCenter = JSON.parse(JSON.stringify(oCostCenter));
            var expectedCostCenterWithoutDates = _.omit(expectedCostCenter, ["_VALID_TO", "_VALID_FROM"]);
            expect(actualCostCenter.length).toBe(2);
			expect(actualCostCenter).toMatchData(expectedCostCenterWithoutDates, ["COST_CENTER_ID", "CONTROLLING_AREA_ID"]);
        });	
        
     	it('should return only correct controlling areas', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert
            var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
            var expectedControllingArea = JSON.parse(JSON.stringify(oControllingArea));
            var expectedControllingAreaWithoutDates = _.omit(expectedControllingArea, ["_VALID_TO", "_VALID_FROM"]);
            expect(actualControllingArea.length).toBe(2);
			expect(actualControllingArea).toMatchData(expectedControllingAreaWithoutDates, ["CONTROLLING_AREA_ID"]);
        });	
        
        it('should return only correct plants', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert
            var actualPlant = Array.slice(result.OT_PLANT);
            var expectedPlant = JSON.parse(JSON.stringify(oPlant));
            var expectedPlantWithoutDates = _.omit(expectedPlant, ["_VALID_TO", "_VALID_FROM"]);
            expect(actualPlant.length).toBe(2);
			expect(actualPlant).toMatchData(expectedPlantWithoutDates, ["PLANT_ID", "COMPANY_CODE_ID"]);
        });
        
        it('should return only correct processes', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert 
            var actualProcess = Array.slice(result.OT_PROCESS);
            
            expect(actualProcess.length).toBe(2);
			expect(actualProcess).toMatchData({
					"PROCESS_ID" : ['BP1', 'BP2'],
            		"CONTROLLING_AREA_ID": ['1000', '2000'],
            		"ACCOUNT_ID": ['A1', 'A2'],
            		"_SOURCE": [1, 1],
            		"_CREATED_BY": ['U000001', 'U000002']
				}, ["PROCESS_ID"]); 
        });
        
        it('should return only correct work center processes', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert 
            var actualWCProcess = Array.slice(result.OT_WORK_CENTER_PROCESS);
            
            expect(actualWCProcess.length).toBe(2);
			expect(actualWCProcess).toMatchData({
					"WORK_CENTER_ID" : ['WC1' , 'WC2'],
            		"PLANT_ID" : ['PL1' , 'PL2'],
            		"CONTROLLING_AREA_ID": ['1000', '2000'],
            		"PROCESS_ID" : ['BP1', 'BP2'],
            		"_SOURCE" : [1, 1],
            		"_CREATED_BY" : ['U000001', 'U000002']
				}, ["WORK_CENTER_ID"]);
        });
        
        it('Should return only the activity types that have a valid work center activity type used in a work center', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert 
            var actualActivityTypes = Array.slice(result.OT_ACTIVITY_TYPE);
			
            expect(actualActivityTypes.length).toBe(2);
			expect(actualActivityTypes).toMatchData({
					"ACTIVITY_TYPE_ID" :['A1', 'A2'],
            		"CONTROLLING_AREA_ID" : ['1000', '2000'],
            		"ACCOUNT_ID" : ['CE1', 'CE2'],
                    "_VALID_TO" : [null, null],
            		"_SOURCE" : [1, 1],
            		"_CREATED_BY" : ['U000001', 'U000002']
				}, ["ACTIVITY_TYPE_ID"]); 
        });
        
        it('Should return only work center activity types that are used in a work center', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert 
            var actualWCActivity = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
            
            expect(actualWCActivity.length).toBe(2);
			expect(actualWCActivity).toMatchData({
					"WORK_CENTER_ID" : ['WC1', 'WC2'],
                    "ACTIVITY_TYPE_ID" :['A1', 'A2'],
                    "PLANT_ID" : ['PL1' , 'PL2'],
                    "CONTROLLING_AREA_ID" : ['1000', '2000'],
                    "PROCESS_ID" : ['BP1', '*'],
                    "QUANTITY" : [ "1.0000000", "1.0000000"],
                    "TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1],
        		    "LOT_SIZE" : [ null, null],
        		    "QUANTITY_UOM_ID" : [ "PC", "PC"],
                	"_VALID_TO" : [null, null],
                	"_SOURCE" :[1, 1],
                	"_CREATED_BY" : ['U000001', 'U000001']
				}, ["WORK_CENTER_ID"]);
        });
        
        it('Should return no work center activity type and no activity type if no work center activity type is defined for that work center', function() {
        	oMockstarPlc.clearTable('work_center');
        	
        	var oWorkCenter = {
        			"WORK_CENTER_ID" : ['WC99'],
            		"PLANT_ID" : ['PL1'],
            		"WORK_CENTER_CATEGORY": ['1'],
            		"COST_CENTER_ID" : ['CC1'],
            		"CONTROLLING_AREA_ID" : ["1000"],
            		"WORK_CENTER_RESPONSIBLE": ['U000001'],
            		"EFFICIENCY": ["300.0000000"],
            		"_VALID_FROM" : [sValidFrom],
            		"_VALID_TO" : [null],
            		"_SOURCE" :[1],
            		"_CREATED_BY" : ['U000001']
        		};
        	
        	oMockstarPlc.insertTableData("work_center", oWorkCenter);
        	//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);
            //assert 
			var actualWC = Array.slice(result.OT_WORK_CENTER);
            var actualWCActivity = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
            var actualActivityTypes = Array.slice(result.OT_ACTIVITY_TYPE);
            
            expect(actualWCActivity.length).toBe(0);
            expect(actualActivityTypes.length).toBe(0);
            expect(actualWC.length).toBe(1);
            var expectedWorKCenterWithoutDates = _.omit(oWorkCenter, ["_VALID_TO", "_VALID_FROM"]);
            expect(actualWC[0]).toMatchData(expectedWorKCenterWithoutDates, ["WORK_CENTER_ID", "PLANT_ID"]);
        });
        
        it('should return correct after skip', function() {
			//act 
			var iSkip = 1;
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, iSkip);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            var actualWorkCenterText = Array.slice(result.OT_WORK_CENTER_TEXT);
            var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
            var actualPlant = Array.slice(result.OT_PLANT);
            var actualProcess = Array.slice(result.OT_PROCESS);
            var actualWCProcess = Array.slice(result.OT_WORK_CENTER_PROCESS);
            var actualActivityTypes = Array.slice(result.OT_ACTIVITY_TYPE);
            var actualWCActivity = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
            
            expect(actualWorkCenter.length).toBe(oWorkCenter.WORK_CENTER_ID.length-iSkip);
            expect(actualWorkCenterText.length).toBe(oWorkCenterText.WORK_CENTER_ID.length-iSkip);
            expect(actualControllingArea.length).toBe(oControllingArea.CONTROLLING_AREA_ID.length-iSkip);
            expect(actualPlant.length).toBe(oPlant.PLANT_ID.length-iSkip);
            expect(actualPlant.length).toBe(oCostCenter.COST_CENTER_ID.length-iSkip);
            expect(actualProcess.length).toBe(1);
            expect(actualWCProcess.length).toBe(1);
            expect(actualActivityTypes.length).toBe(1);
            expect(actualWCActivity.length).toBe(1);
            
        });
        
       it('should return correct work center if top parameter is set to 1', function() {
			//act 
			var iTop = 1;
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', iTop, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            var actualWorkCenterText = Array.slice(result.OT_WORK_CENTER_TEXT);
            var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
            var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
            var actualPlant = Array.slice(result.OT_PLANT);
            var actualActivityTypes = Array.slice(result.OT_ACTIVITY_TYPE);
            var actualWCActivity = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
          
            expect(actualWorkCenter.length).toBe(iTop);
            expect(actualWorkCenterText.length).toBe(iTop);
            expect(actualActivityTypes.length).toBe(iTop);
            expect(actualWCActivity.length).toBe(iTop);
            
        });
       
       it('should return no work center if top parameter is set to 0', function() {
			//act 
			var iTop = 0;
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', iTop, 0);

           //assert
           var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
           var actualWorkCenterText = Array.slice(result.OT_WORK_CENTER_TEXT);
           var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
           var actualControllingArea = Array.slice(result.OT_CONTROLLING_AREA);
           var actualPlant = Array.slice(result.OT_PLANT);
           var actualActivityTypes = Array.slice(result.OT_ACTIVITY_TYPE);
           var actualWCActivity = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
         
           expect(actualWorkCenter.length).toBe(iTop);
           expect(actualWorkCenterText.length).toBe(iTop);
           expect(actualActivityTypes.length).toBe(iTop);
           expect(actualWCActivity.length).toBe(iTop);
       });
        
        it('should return the correct dates for work centers, plants, controlling areas, cost centers, processes, work center processes', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', '', 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            
            
            //expect
            expect(result.OT_WORK_CENTER[0]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_WORK_CENTER[0]._VALID_TO).toBe(null);
            expect(result.OT_PLANT[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_PLANT[1]._VALID_TO).toBe(null);      
			expect(result.OT_CONTROLLING_AREA[0]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_CONTROLLING_AREA[0]._VALID_TO).toBe(null);
            expect(result.OT_COST_CENTER[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_COST_CENTER[1]._VALID_TO).toBe(null); 
			expect(result.OT_PROCESS[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_PROCESS[1]._VALID_TO).toBe(null);
			expect(result.OT_WORK_CENTER_PROCESS[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_WORK_CENTER_PROCESS[1]._VALID_TO).toBe(null);
			expect(result.OT_ACTIVITY_TYPE[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_ACTIVITY_TYPE[1]._VALID_TO).toBe(null);
			expect(result.OT_WORK_CENTER_ACTIVITY[1]._VALID_FROM.toString()).toBe(new Date(sValidFrom).toString());
			expect(result.OT_WORK_CENTER_ACTIVITY[1]._VALID_TO).toBe(null);
         });
         
        it('should return only correct work centers when filtering work_center_id', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', "WORK_CENTER_ID = 'WC1'", 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            expect(actualWorkCenter.length).toBe(1);
        });
        
        it('should return only correct work centers when filtering company code', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, '', "COMPANY_CODE_ID = 'CC1'", 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            expect(actualWorkCenter.length).toBe(1);
        });
        
        it('should return only correct work centers with search autocomplete - one result', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, 'WC1', '', 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            expect(actualWorkCenter.length).toBe(1);
        });
        
        it('should return only correct work centers with search autocomplete - two results', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, 'WC', '', 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            expect(actualWorkCenter.length).toBe(2);
        });
        
        it('should return no work center when search autocomplete with invalid values', function() {
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(sLanguage, sMasterdataTimestamp, 'WC1234567890', '', 100, 0);

            //assert
            var actualWorkCenter = Array.slice(result.OT_WORK_CENTER);
            expect(actualWorkCenter.length).toBe(0);
        });
	}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}