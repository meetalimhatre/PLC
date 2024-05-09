var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.workCenterActivity-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
		
		beforeOnce(function() {
			
			mockstar = new MockstarFacade({ // Initialize Mockstar
						testmodel : {
							"procRead" : "sap.plc.db.administration.procedures/p_work_center_read"
						},
						substituteTables : {
						    gtt_work_center: Resources["Work_Center"].dbobjects.tempTable,
					        gtt_work_center_text: Resources["Work_Center"].dbobjects.tempTextTable,
					        gtt_work_center_process: Resources["Work_Center_Process"].dbobjects.tempTable,
					        gtt_work_center_activity:Resources["Work_Center_Activity"].dbobjects.tempTable,
							work_center : Resources["Work_Center"].dbobjects.plcTable,
							work_center_process : Resources["Work_Center_Process"].dbobjects.plcTable,
							work_center_activity : Resources["Work_Center_Activity"].dbobjects.plcTable,
							work_center_text :  Resources["Work_Center"].dbobjects.plcTextTable,
							activity_type : Resources["Activity_Type"].dbobjects.plcTable,
							activity_Type_text : Resources["Activity_Type"].dbobjects.plcTextTable,
							controlling_area : Resources["Controlling_Area"].dbobjects.plcTable,
							controlling_area_text : Resources["Controlling_Area"].dbobjects.plcTextTable,
							plant : Resources["Plant"].dbobjects.plcTable,
							plant_text : Resources["Plant"].dbobjects.plcTextTable,
							process :Resources["Process"].dbobjects.plcTable,
							process_text :  Resources["Process"].dbobjects.plcTextTable,
							cost_center : Resources["Cost_Center"].dbobjects.plcTable,
							company_code : Resources["Company_Code"].dbobjects.plcTable,
						    company_code_text : Resources["Company_Code"].dbobjects.plcTextTable,
        					session : {
        						name : "sap.plc.db::basis.t_session",
        						data : testData.oSessionTestData
        					},
        					work_center_ext : "sap.plc.db::basis.t_work_center_ext"
						},
		                csvPackage : testData.sCsvPackage
					});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Work_Center"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Work_Center": procedureXsunit
                });
			}
			
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				MasterdataReadProcedures = originalProcedures;
				mockstar.cleanup();
			}
		});
	
		beforeEach(function() {
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
		});
		
		describe ("INSERT", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc1);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
			
			
			it('Should create new WORK_CENTER_ACTIVITY entities', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[1],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[1],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[1],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestBefore.columns.ACTIVITY_TYPE_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0], testData.oWorkCenterTestDataPlc.PLANT_ID[1]],
					ACTIVITY_TYPE_ID : [testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0], testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0], testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1]],
					QUANTITY : [testData.oWorkCenterActivityTestDataPlc.QUANTITY[0], testData.oWorkCenterActivityTestDataPlc.QUANTITY[1]],
					QUANTITY_UOM_ID : [testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0], testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[1]],
					TOTAL_QUANTITY_DEPENDS_ON : [testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0], testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[1]],
					LOT_SIZE : [testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0], testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[1]],
					_VALID_TO : [null, null]
			    }, ["ACTIVITY_TYPE_ID"]);
		});
		
		it('Should create new WORK_CENTER_ACTIVITY entities having PROCESS_ID set to WILDCARD', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[1],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[1],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[1],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.ACTIVITY_TYPE_ID.rows.length).toBe(oTestBefore.columns.ACTIVITY_TYPE_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0], testData.oWorkCenterTestDataPlc.PLANT_ID[1]],
					ACTIVITY_TYPE_ID : [testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0], testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1]],
					PROCESS_ID : ['*', '*'],
					QUANTITY : [testData.oWorkCenterActivityTestDataPlc.QUANTITY[0], testData.oWorkCenterActivityTestDataPlc.QUANTITY[1]],
					QUANTITY_UOM_ID : [testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0], testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[1]],
					TOTAL_QUANTITY_DEPENDS_ON : [testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0], testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[1]],
					LOT_SIZE : [testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0], testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[1]],
					_VALID_TO : [null, null]
			    }, ["ACTIVITY_TYPE_ID"]);
		});
		
		it('Should create valid WORK CENTER ACTIVITIES and return error messages for invalid ones when ignoreBadData parameter is used', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0]
												},
												{
													"WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 1);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0]],
					ACTIVITY_TYPE_ID : [testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]],
					_VALID_TO : [null]
			    }, ["ACTIVITY_TYPE_ID"]);
			    
			    expect(oResponseBody.head.messages.length).toBe(1);
			    expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_ACTIVITY_ENTITIES[0].WORK_CENTER_ID).toBe('WC499');
			    expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
		});
		
		it('Should create WORK CENTERS, WORK CENTER PROCESSES and WORK CENTER ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
                    						"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000"
												},{
													"WORK_CENTER_ID" : "WC7",
													"PLANT_ID" : "PL1",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000"
												}],
                    						"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"CONTROLLING_AREA_ID" : "1000",
													"PROCESS_ID" : "B1"
												},
												{
													"WORK_CENTER_ID" : "WC7",
													"PLANT_ID" : "PL1",
													"CONTROLLING_AREA_ID" : "1000",
													"PROCESS_ID" : "B2"
												}],
                    						"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"CONTROLLING_AREA_ID" : "1000",
													"PROCESS_ID" : "B1",
													"ACTIVITY_TYPE_ID" : "ACTIVITY1111"
												},
												{
													"WORK_CENTER_ID" : "WC7",
													"PLANT_ID" : "PL1",
													"CONTROLLING_AREA_ID" : "1000",
													"PROCESS_ID" : "B2",
													"ACTIVITY_TYPE_ID" : "ACTIVITY2222"
												}]
                    				       }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : ["WC6", "WC7"],
					CONTROLLING_AREA_ID : ["1000", "1000"],
					PLANT_ID : ["PL1", "PL1"],
					ACTIVITY_TYPE_ID : ["ACTIVITY1111", "ACTIVITY2222"],
					PROCESS_ID : ["B1", "B2"],
					_VALID_TO : [null, null]
			    }, ["ACTIVITY_TYPE_ID"]);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES).toMatchData({
			        WORK_CENTER_ID : ["WC6", "WC7"],
					CONTROLLING_AREA_ID : ["1000", "1000"],
					PLANT_ID : ["PL1", "PL1"],
					COST_CENTER_ID : ["CC2", "CC2"],
					_VALID_TO : [null, null]
			    }, ["WORK_CENTER_ID"]);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			       WORK_CENTER_ID : ["WC6", "WC7"],
					CONTROLLING_AREA_ID : ["1000", "1000"],
					PLANT_ID : ["PL1", "PL1"],
					PROCESS_ID : ["B1", "B2"],
					_VALID_TO : [null, null]
			    }, ["WORK_CENTER_ID"]);
		});
		
		it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid WORK CENTER is found for WORK CENTER ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC88",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
			});
			
		it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid WORK CENTER PROCESS is found for WORK CENTER ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : "BP99"
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center_Process');
			});
			
		it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid ACTIVITY TYPE is found for WORK CENTER ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : "AT499"
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Activity_Type');
			});
			
		it('should throw GENERAL_ENTITY_DUPLICATE_ERROR when WORK CENTER ACTIVITY already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oTest.columns.ERROR_CODE.rows[1]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe('MainObj');
				expect(oResponseBody.head.messages[0].details.businessObj).toBe('Work_Center_Activity');
			});
			
		it('should throw GENERAL_ENTITY_DUPLICATE_ERROR and GENERAL_ENTITY_NOT_FOUND_ERROR for different entities from the request', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC500",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oTest.columns.ERROR_CODE.rows[1]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
			});
			
		it('should throw GENERAL_VALIDATION_ERROR when mandatory properties are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_activity}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oTest.columns.ERROR_CODE.rows[1]).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
			});
		
    		it('Should throw GENERAL VALIDATION ERROR when data types do not match', function() {
    				// arrange
    				var aParams = [ {
    					name : "business_object",
    					value : "Work_Center"
    				}];
    				
    				var oItemsPayload = {"CREATE":
                        				       { 
    											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
    													"WORK_CENTER_ID" : "InvalidDataType",
    													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[2],
    													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[2],
    													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[2],
    													"ACTIVITY_TYPE_ID" : "InvalidDataType"
    												}]
                        				        }
                        				};
                        				
                    
    			    // act
    				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                    var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
    				//assert
    				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
    				expect(oResponseBody).toBeDefined();
    				expect(oResponseBody.head.messages.length).toBe(1);
    				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
    				expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_ACTIVITY_ENTITIES[0].WORK_CENTER_ID).toBe("InvalidDataType");
    				
    		});
    		
    		it('Should throw GENERAL VALIDATION ERROR when TOTAL_QUANTITY_DEPENDS_ON is set to LOT_SIZE_DEPENDENT and LOT_SIZE is null or 0', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
											        "WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
											},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"LOT_SIZE" : 0
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
		});
    });
    
     describe ("DELETE", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc1);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				mockstar.initializeData();
			});
			
			
			it('Should delete WORK_CENTER_ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1]
												}]
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages).toBeUndefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 2);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0], testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0], testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1]],
					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0], testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1]]
			    }, ["ACTIVITY_TYPE_ID"]);
		});
		
		it('Should delete WORK_CENTER_ACTIVITIES and throw error for invalid one when ignoreBadData parameter is set to true', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1]
												}]
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 1);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0]],
					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]]
			    }, ["ACTIVITY_TYPE_ID"]);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				
		});
		
		it('Should delete valid WORK_CENTER_ACTIVITIES and return error messages for invalid ones', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
												    "WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[2],
													"ACTIVITY_TYPE_ID" : "AT2",
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[2]
												}]
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 1);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES.length).toBe(1);
    			expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
    			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0]],
    					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0]],
    					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0]],
    					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0]],
    					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0]],
    					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]]
    			    }, ["ACTIVITY_TYPE_ID"]);
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				
		});
		
		it('Should throw GENERAL ENTITY NOT FOUND when trying to delete a work center activity that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[2],
													"ACTIVITY_TYPE_ID" : "TEST",
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[2]
												}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(1);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_ACTIVITY_ENTITIES[0].ACTIVITY_TYPE_ID).toBe('TEST');	
		});
		
		it('Should delete all WORK CENTER ACTIVITIES used in a WORK CENTER when it is DELETED', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"_VALID_FROM" : testData.oWorkCenterTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"_VALID_FROM" : testData.oWorkCenterTestDataPlc._VALID_FROM[1]
												}],
											"WORK_CENTER_ACTIVITY_ENTITIES" : []
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}} where _VALID_TO is null");
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 3);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES.length).toBe(3);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1], testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[4]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1], testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[4]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0], testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1], testData.oWorkCenterActivityTestDataPlc.PLANT_ID[4]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1], testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[4]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0], testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1], testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[4]],
					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0], testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1], testData.oWorkCenterActivityTestDataPlc._VALID_FROM[4]]
			    }, ["WORK_CENTER_ID"]);
		});
		
		it('Should delete all WORK CENTER ACTIVITIES used in a WORK CENTER as well as ALL WORK CENTER ACTIVITIES from the request ', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"_VALID_FROM" : testData.oWorkCenterTestDataPlc._VALID_FROM[0]
												}],
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
											        "WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[4],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[4],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[4],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[4],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[4],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[4]
											}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[4]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[4]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.PLANT_ID[4]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[4]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[4]],
					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oWorkCenterActivityTestDataPlc._VALID_FROM[4]]
			    }, ["WORK_CENTER_ID"]);
		});
		
		it('Should throw GENERAL_VALIDATION_ERROR when trying to delete an ACTIVITY_TYPE that is used in a WORK CENTER ACTIVITY', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Activity_Type"
				}];
				
				var oItemsPayload = {"DELETE":
            	{ 
            			"ACTIVITY_TYPE_ENTITIES": [{
							"ACTIVITY_TYPE_ID" : "ACTIVITY1111",
							"CONTROLLING_AREA_ID":"1000",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
            	}};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(1);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('DEPENDENCY_ERROR');
				
		});
    });
    
    describe ("UPDATE", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc1);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				mockstar.initializeData();
			});
			
			
			it('Should update WORK_CENTER_ACTIVITIES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0],
													"QUANTITY" : '75.0000000',
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"LOT_SIZE" : '25.0000000'
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" :  '55.0000000',
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPDATE.WORK_CENTER_ACTIVITY_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.UPDATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0], testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0], testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0], testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1]],
					QUANTITY : ['75.0000000', '55.0000000'],
					QUANTITY_UOM_ID : ["MIN", "H"],
					TOTAL_QUANTITY_DEPENDS_ON : [2, 3],
					LOT_SIZE : ['25.0000000', null]
			    }, ["ACTIVITY_TYPE_ID"]);	
		});
		
		it('Should update WORK_CENTER_ACTIVITIES and send error for invalid one when ignoreBadData is set to true', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0],
													"QUANTITY" : '75.0000000',
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"LOT_SIZE" : '25.0000000'
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : '55.0000000',
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}} where ACTIVITY_TYPE_ID in ('A1', 'A2') and _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}} where ACTIVITY_TYPE_ID in ('A1', 'A2') and _VALID_TO is null");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.UPDATE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
    			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0]],
    					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0]],
    					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0]],
    					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0]],
    					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0]],
    					_VALID_TO : [null],
    					QUANTITY : ['75.0000000'],
    					QUANTITY_UOM_ID : ["MIN"],
    					TOTAL_QUANTITY_DEPENDS_ON : [2],
    					LOT_SIZE : ['25.0000000']
    			    }, ["ACTIVITY_TYPE_ID"]);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');	
		});
		
		it('Should throw GENERAL VALIDATION ERROR when TOTAL_QUANTITY_DEPENDS_ON is not lot size dependent and LOT_SIZE is set', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0],
													"QUANTITY" : 75,
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 1,
													"LOT_SIZE" : 25
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3,
													"LOT_SIZE" : 33
												}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
		});
		
		it('Should throw GENERAL VALIDATION ERROR when MANDATORY COLUMNS ARE MISSING', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0],
													"QUANTITY" : 75,
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 1,
													"LOT_SIZE" : 25
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
		});
		
		it('Should throw GENERAL ENTITY NOT FOUND ERROR when WORK CENTER ACTIVITY IS NOT FOUND', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0],
													"QUANTITY" : 75,
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 1,
													"LOT_SIZE" : 25
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : "BP88",
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
		});
		
		it('Should throw VALIDATION ERROR  when SOURCE is not PLC', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
				                            {
                    				       "WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[3],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[3],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[3],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[3],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[3],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[3],
													"QUANTITY" : 75,
													"QUANTITY_UOM_ID" : "MIN",
													"TOTAL_QUANTITY_DEPENDS_ON" : 1,
													"LOT_SIZE" : 25
												}]
                    				        }
                    				};
                    				
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(1);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('SOURCE_ERP');
		});
    });
    
     describe ("UPSERT", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc1);
				mockstar.initializeData();
			});
			
			
			it('Should update an entry and create a new entry', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : '55.0000000',
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0], testData.oWorkCenterTestDataPlc.PLANT_ID[1]],
					ACTIVITY_TYPE_ID : [testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0], testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[1]],
					PROCESS_ID : ['*', testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1]],
					QUANTITY : [testData.oWorkCenterActivityTestDataPlc.QUANTITY[0], '55.0000000'],
					QUANTITY_UOM_ID : [testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0], "H"],
					TOTAL_QUANTITY_DEPENDS_ON : [testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0], 3],
					LOT_SIZE : [testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0], null],
					_VALID_TO : [null, null]
			    }, ["ACTIVITY_TYPE_ID"]);
		});
		
		it('Should update an entry and throw GENERAL VALIDATION ERROR for another when ignoreBadData parameter is set to true', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_activity}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_activity}}");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 1);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
    			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0]],
    					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]],
    					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0]],
    					ACTIVITY_TYPE_ID : [testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0]],
    					PROCESS_ID : ['*'],
    					_VALID_TO : [null],
    					QUANTITY : [testData.oWorkCenterActivityTestDataPlc.QUANTITY[0]],
    					QUANTITY_UOM_ID : [testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0]],
    					TOTAL_QUANTITY_DEPENDS_ON : [testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0]],
    					LOT_SIZE : [testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0]]
    			    }, ["ACTIVITY_TYPE_ID"]);
			    expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
		});
		
		it('Should throw GENERAL VALIDATION ERROR when TOTAL_QUANTITY_DEPENDS_ON is not lot size dependent and LOT_SIZE is set', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3,
													"LOT_SIZE" : 25
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(1);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
		});
		
		it('Should throw GENERAL VALIDATION ERROR when TOTAL_QUANTITY_DEPENDS_ON is set to LOT_SIZE_DEPENDENT and LOT_SIZE is null or 0', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
											        "WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
											},{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[1],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 2,
													"LOT_SIZE" : 0
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('VALUE_ERROR');
		});
		
		it('Should throw GENERAL ENTITY NOT FOUND ERROR when no valid WORK CENTER is introduced', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC88",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" : '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : "WC89",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : '*',
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
				expect(oResponseBody.head.messages[1].details.validationObj).toBe('Work_Center');
		});
		
		it('Should throw GENERAL ENTITY NOT FOUND ERROR when no valid WORK CENTER PROCESS is found', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oActivityTypeTestDataPlc1.ACTIVITY_TYPE_ID[0],
													"PROCESS_ID" :  'BP89',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : 'BP88',
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center_Process');
				expect(oResponseBody.head.messages[1].details.validationObj).toBe('Work_Center_Process');
		});
		
		it('Should throw GENERAL ENTITY NOT FOUND ERROR when no valid ACTIVITY TYPE is found', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"ACTIVITY_TYPE_ID" : 'AT89',
													"PROCESS_ID" :  '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : '*',
													"ACTIVITY_TYPE_ID" : 'AT88',
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Activity_Type');
				expect(oResponseBody.head.messages[1].details.validationObj).toBe('Activity_Type');
		});
		
		it('Should throw GENERAL VALIDATION ERROR when MANDATORY PROPERTIES are mising', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" :  '*',
													"QUANTITY" : testData.oWorkCenterActivityTestDataPlc.QUANTITY[0],
													"QUANTITY_UOM_ID" : testData.oWorkCenterActivityTestDataPlc.QUANTITY_UOM_ID[0],
													"TOTAL_QUANTITY_DEPENDS_ON" : testData.oWorkCenterActivityTestDataPlc.TOTAL_QUANTITY_DEPENDS_ON[0],
													"LOT_SIZE" : testData.oWorkCenterActivityTestDataPlc.LOT_SIZE[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[1],
													"PROCESS_ID" : '*',
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[1],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[1],
													"QUANTITY" : 55,
													"QUANTITY_UOM_ID" : "H",
													"TOTAL_QUANTITY_DEPENDS_ON" : 3
												}]
                    				        }
                    				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
				expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('MISSING_MANDATORY_ENTRY');
		});
    });
}).addTags(["Administration_NoCF_Integration"]);
}