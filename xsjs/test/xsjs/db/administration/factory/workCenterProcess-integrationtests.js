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
	describe('xsjs.db.administration.workCenterProcess-integrationtests', function() {
	
		
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
							work_center : Resources["Work_Center"].dbobjects.plcTable,
							work_center_process : Resources["Work_Center_Process"].dbobjects.plcTable,
							work_center_activity : Resources["Work_Center_Activity"].dbobjects.plcTable,
							work_center_text :  Resources["Work_Center"].dbobjects.plcTextTable,
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
		
		
		describe ("Check if validation functions work as expected", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.initializeData();
			});
			
			
			it("Should insert all WORK CENTER PROCESSES related to a WORK CENTER when WORK CENTER is deleted", function(){
			    var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
                    								"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
                    								"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
                    								"_VALID_FROM" : testData.oWorkCenterTestDataPlc._VALID_FROM[0],
                    								"COST_CENTER_ID" : testData.oWorkCenterTestDataPlc.COST_CENTER_ID[0],
                    								"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]
                    							},{
                    								"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
                    								"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
                    								"_VALID_FROM" : testData.oWorkCenterTestDataPlc._VALID_FROM[1],
                    								"COST_CENTER_ID" : testData.oWorkCenterTestDataPlc.COST_CENTER_ID[1],
                    								"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]
                    							}]
                    				        } 
                    				};
                    				
                // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
                expect(oTest.columns.WORK_CENTER_ID.rows[0]).toBe(testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0]);
                expect(oTest.columns.WORK_CENTER_ID.rows[1]).toBe(testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]);
                expect(oTest.columns.CONTROLLING_AREA_ID.rows[0]).toBe(testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]);
                expect(oTest.columns.CONTROLLING_AREA_ID.rows[1]).toBe(testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]);
                expect(oTest.columns.PLANT_ID.rows[0]).toBe(testData.oWorkCenterTestDataPlc.PLANT_ID[0]);
                expect(oTest.columns.PLANT_ID.rows[1]).toBe(testData.oWorkCenterTestDataPlc.PLANT_ID[1]);
                expect(oTest.columns.OPERATION.rows[0]).toBe('Delete');
                expect(oTest.columns.OPERATION.rows[1]).toBe('Delete');
			});
			
			
			it("Should correctly determine the operations and raise specific errors for different operations", function(){
			    var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[2]
												}]
                    				        },
                    				"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"_VALID_FROM" : "2014-01-01T15:39:09.691Z"
												}]
                    				        },
                    				"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[3],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[3],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[3],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[3]
												}]
                    				        }
                    				};
                    				
                // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
                expect(oTest.columns.OPERATION.rows.length).toEqual(3);
                expect(oTest.columns.OPERATION.rows[0]).toBe('Create');
                expect(oTest.columns.OPERATION.rows[1]).toBe('Delete');
                expect(oTest.columns.OPERATION.rows[2]).toBe('Upsert');
                expect(oResponseBody.head.messages[0].code).toBe('GENERAL_ENTITY_DUPLICATE_ERROR');
                expect(oResponseBody.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
                expect(oResponseBody.head.messages.length).toBe(2);
			});
			
			it("Should throw GENERAL_VALIDATION_ERROR when operation executed is not allowed", function(){
			    var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[3],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[3],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[3],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[3]
												}]
                    				        }
                    				};
                    				
                // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				
				//assert
			    expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
                expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('GENERAL_METHOD_NOT_ALLOWED_ERROR');
			});
			
			it("Should not throw exception when operation executed is not allowed and ignoreBadData parameter is set to true", function(){
			    var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[3],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[3],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[3],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[3]
												}],
                    				        "WORK_CENTER_ENTITIES" :[]
                    				        }
                    				};
                    				
                // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				
				//assert
			    expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
			});
		});
		
		describe ("INSERT", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
			
			
			it('Should create new WORK_CENTER_PROCESSES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0], testData.oWorkCenterTestDataPlc.PLANT_ID[1]],
					PROCESS_ID : [testData.oProcessTestDataPlc1.PROCESS_ID[0], testData.oProcessTestDataPlc1.PROCESS_ID[1]],
					_VALID_TO : [null, null]
			    }, ["PROCESS_ID"]);
		});
		
		it('Should create valid WORK CENTER PROCESSES and return error messages for invalid ones when ignoreBadData parameter is used', function() {
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
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												},
												{
													"WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 1);
			    expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0]],
					PROCESS_ID : [testData.oProcessTestDataPlc1.PROCESS_ID[0]],
					_VALID_TO : [null]
			    }, ["PROCESS_ID"]);
			    expect(oResponseBody.head.messages.length).toBe(1);
			    expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_PROCESS_ENTITIES[0].WORK_CENTER_ID).toBe('WC499');
			    expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
		});
		
		
		it('Should create WORK CENTERS and WORK CENTER PROCESSES', function() {
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
												}]
                    				       }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
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
		
		it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid WORK CENTER is found for WORK CENTER PROCESS', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC500",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
			});
			
			it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid PROCESS is found for WORK CENTER PROCESS', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : "BP500"
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj).toBe('Process');
			});
			
			it('should throw GENERAL_ENTITY_DUPLICATE_ERROR when WORK CENTER PROCESS already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oTest.columns.ERROR_CODE.rows[1]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe('MainObj');
				expect(oResponseBody.head.messages[0].details.businessObj).toBe('Work_Center_Process');
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
				mockstar.initializeData();
			});
			
			
			it('Should create new WORK CENTER PROCESSES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0], testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0], testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0], testData.oWorkCenterTestDataPlc.PLANT_ID[1]],
					PROCESS_ID : [testData.oProcessTestDataPlc1.PROCESS_ID[0], testData.oProcessTestDataPlc1.PROCESS_ID[1]],
					_VALID_TO : [null, null]
			    }, ["PROCESS_ID"]);
		});
		
		
		it('Should create valid WORK CENTER PROCESSES and return error messages for invalid ones when ignoreBadData parameter is used', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
				    name : "ignoreBadData",
				    value : true
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												},
												{
													"WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[1]
												}]
                    				        }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 1);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterTestDataPlc.PLANT_ID[0]],
					PROCESS_ID : [testData.oProcessTestDataPlc1.PROCESS_ID[0]],
					_VALID_TO : [null]
			    }, ["PROCESS_ID"]);
			    expect(oResponseBody.head.messages.length).toBe(1);
			    expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_PROCESS_ENTITIES[0].WORK_CENTER_ID).toBe('WC499');
			    expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
		});
		
		
		it('Should create WORK CENTERS and WORK CENTER PROCESSES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPSERT":
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
												}]
                    				       }
                    				};
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}}");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns.PROCESS_ID.rows.length).toBe(oTestBefore.columns.PROCESS_ID.rows.length + 2);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES).toMatchData({
			        WORK_CENTER_ID : ["WC6", "WC7"],
					CONTROLLING_AREA_ID : ["1000", "1000"],
					PLANT_ID : ["PL1", "PL1"],
					COST_CENTER_ID : ["CC2", "CC2"],
					_VALID_TO : [null, null]
			    }, ["WORK_CENTER_ID"]);
			    expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			       WORK_CENTER_ID : ["WC6", "WC7"],
					CONTROLLING_AREA_ID : ["1000", "1000"],
					PLANT_ID : ["PL1", "PL1"],
					PROCESS_ID : ["B1", "B2"],
					_VALID_TO : [null, null]
			    }, ["WORK_CENTER_ID"]);
		});
		
		it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid WORK CENTER is found for WORK CENTER PROCESS', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC500",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj).toBe('Work_Center');
			});
			
			it('should throw GENERAL_ENTITY_NOT_FOUND_ERROR when no valid PROCESS is found for WORK CENTER PROCESS', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : "BP500"
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj).toBe('Process');
			});
			
			it('should throw GENERAL_ENTITY_DUPLICATE_ERROR when WORK CENTER PROCESS already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				
				var oItemsPayload = {"UPSERT":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]
												},{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1]
												}]
                    				        }
                    				};
                    				

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{gtt_work_center_process}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.ERROR_CODE.rows[0]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oTest.columns.ERROR_CODE.rows[1]).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
			});
    });
    
    describe ("DELETE", function (){
		    beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				mockstar.insertTableData("process", testData.oProcessTestDataPlc1);
				mockstar.initializeData();
			});
			
			
			it('Should delete WORK_CENTER_PROCESSES', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]
												},
												{
												    "WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[1]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[2],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[2]
												}]
                    				        }
                    				};
                    				
                
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1], testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[2]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1], testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[2]],
					PLANT_ID : [testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1], testData.oWorkCenterProcessTestDataPlc.PLANT_ID[2]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1], testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[2]],
					_VALID_FROM : [testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0],testData.oWorkCenterProcessTestDataPlc._VALID_FROM[1], testData.oWorkCenterProcessTestDataPlc._VALID_FROM[2]]
			    }, ["WORK_CENTER_ID"]);
				
		});
		
		it('Should throw GENERAL_VALIDATION_ERROR when trying to delete a work center used in work center activities', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]
												},
												{
												    "WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[1]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[2],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[2]
												}]
                    				        }
                    				};
                    				
                
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages.length).toBe(3);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[2].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			    expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('DEPENDENCY_ERROR');
			    expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe('DEPENDENCY_ERROR');
			    expect(oResponseBody.head.messages[2].details.validationObj.validationInfoCode).toBe('DEPENDENCY_ERROR');
				
		});
		
		it('Should delete work center processes and work center activities from the request', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]
												}],
											"WORK_CENTER_ACTIVITY_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0],
													"ACTIVITY_TYPE_ID" : testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0],
													"_VALID_FROM" : testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]
												}]
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}} where _VALID_TO is null");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 1);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]],
					_VALID_FROM : [testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]]
			    }, ["WORK_CENTER_ID"]);
			    expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ACTIVITY_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterActivityTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterActivityTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterActivityTestDataPlc.PLANT_ID[0]],
					ACTIVITY_TYPE_ID : [testData.oWorkCenterActivityTestDataPlc.ACTIVITY_TYPE_ID[0]],
					PROCESS_ID : [testData.oWorkCenterActivityTestDataPlc.PROCESS_ID[0]],
					_VALID_FROM : [testData.oWorkCenterActivityTestDataPlc._VALID_FROM[0]]
			    }, ["ACTIVITY_TYPE_ID"]);
		});
		
		it('Should delete valid WORK_CENTER_PROCESSES and return error messages for invalid ones', function() {
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
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]
												},
												{
												    "WORK_CENTER_ID" : "WC499",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[1]
												},
												{
													"WORK_CENTER_ID" : testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[2],
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[2],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[2],
													"PROCESS_ID" : "B499",
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[2]
												}]
                    				        }
                    				};
                    				
                
                
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0]],
					PLANT_ID : [testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0]],
					_VALID_FROM : [testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]]
			    }, ["WORK_CENTER_ID"]);
				expect(oResponseBody.head.messages.length).toBe(2);
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				
		});
		
		
		it('Should throw GENERAL ENTITY NOT FOUND when trying to delete a work center process that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : "TEST",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],
													"PROCESS_ID" : testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0]
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
				expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_PROCESS_ENTITIES[0].WORK_CENTER_ID).toBe('TEST');
				
		});
		
		it('Should throw GENERAL VALIDATION ERROR when data types do not match', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
											"WORK_CENTER_PROCESS_ENTITIES" : [{
													"WORK_CENTER_ID" : "InvalidDataType",
													"CONTROLLING_AREA_ID" : testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[3],
													"PLANT_ID" : testData.oWorkCenterProcessTestDataPlc.PLANT_ID[3],
													"PROCESS_ID" : "InvalidDataType",
													"_VALID_FROM" : testData.oWorkCenterProcessTestDataPlc._VALID_FROM[3]
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
				expect(oResponseBody.head.messages[0].details.administrationObj.WORK_CENTER_PROCESS_ENTITIES[0].WORK_CENTER_ID).toBe("InvalidDataType");
				
		});
		
		
		it('Should delete all WORK CENTER PROCESSES used in a WORK CENTER when it is DELETED', function() {
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
											"WORK_CENTER_PROCESS_ENTITIES" : []
                    				        }
                    				};
                    				
                
                var oTestBefore = mockstar.execQuery("select * from {{work_center_process}} where _VALID_TO is null");
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{work_center_process}} where _VALID_TO is null");
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestAfter.columns._VALID_TO.rows.length).toBe(oTestBefore.columns._VALID_TO.rows.length - 3);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_PROCESS_ENTITIES.length).toBe(3);
				expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_PROCESS_ENTITIES).toMatchData({
			        WORK_CENTER_ID : [testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[0],testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[1], testData.oWorkCenterProcessTestDataPlc.WORK_CENTER_ID[4]],
					CONTROLLING_AREA_ID : [testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[0],testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[1], testData.oWorkCenterProcessTestDataPlc.CONTROLLING_AREA_ID[4]],
					PLANT_ID : [testData.oWorkCenterProcessTestDataPlc.PLANT_ID[0],testData.oWorkCenterProcessTestDataPlc.PLANT_ID[1], testData.oWorkCenterProcessTestDataPlc.PLANT_ID[4]],
					PROCESS_ID : [testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[0],testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[1], testData.oWorkCenterProcessTestDataPlc.PROCESS_ID[4]],
					_VALID_FROM : [testData.oWorkCenterProcessTestDataPlc._VALID_FROM[0],testData.oWorkCenterProcessTestDataPlc._VALID_FROM[1], testData.oWorkCenterProcessTestDataPlc._VALID_FROM[4]]
			    }, ["WORK_CENTER_ID"]);
		});
		
		it('Should throw GENERAL_VALIDATION_ERROR when trying to delete a PROCESS that is used in a WORK CENTER PROCESS', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Process"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PROCESS_ENTITIES" : [{
													"PROCESS_ID" : testData.oProcessTestDataPlc1.PROCESS_ID[0],
													"CONTROLLING_AREA_ID" : testData.oProcessTestDataPlc1.CONTROLLING_AREA_ID[0],
													"ACCOUNT_ID" : testData.oProcessTestDataPlc1.ACCOUNT_ID[0],
													"_VALID_FROM" : testData.oProcessTestDataPlc1._VALID_FROM[0]
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe('DEPENDENCY_ERROR');
				
		});
    });
}).addTags(["Administration_NoCF_Integration"]);
}