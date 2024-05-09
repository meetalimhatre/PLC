var testData = require("../../../../testdata/testdata").data;
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../../testtools/mockstar_helpers");

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 			= require("../../../../../lib/xs/util/message");
var MessageCode    			= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.workCenter-integrationtests', function() {
	
		
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
					        work_center_process : Resources["Work_Center_Process"].dbobjects.plcTable,
							work_center : {
								name : Resources["Work_Center"].dbobjects.plcTable
							},
							work_center_text : {
								name : Resources["Work_Center"].dbobjects.plcTextTable
							},
							work_center_activity : {
								name : Resources["Work_Center_Activity"].dbobjects.plcTable
							},
							controlling_area : {
								name : Resources["Controlling_Area"].dbobjects.plcTable
							},
							controlling_area_text : {
								name : Resources["Controlling_Area"].dbobjects.plcTextTable
							},
							cost_center : {
								name : Resources["Cost_Center"].dbobjects.plcTable
							},
							plant : {
								name : Resources["Plant"].dbobjects.plcTable
							},
							plant_text : {
								name : Resources["Plant"].dbobjects.plcTextTable
							},
							company_code : {
								name : Resources["Company_Code"].dbobjects.plcTable
							},
						    company_code_text : {
								name : Resources["Company_Code"].dbobjects.plcTextTable
							},
							language : {
								name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
								data : testData.oLanguage
							},
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
		
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_text", testData.oWorkCenterTextTestDataPlc);
				mockstar.insertTableData("work_center_activity", testData.oWorkCenterActivityTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
				if(jasmine.plcTestRunParameters.generatedFields === true){
					mockstar.insertTableData("work_center_ext", testData.oWorkCenterExtTestDataPlc);
				}
			});
	
			it('should return valid work centers and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(testData.oWorkCenterTestDataPlc.WORK_CENTER_ID.length);
				expect(oResponseBody.body.masterdata.WORK_CENTER_TEXT_ENTITIES.length).toBe(testData.oWorkCenterTextTestDataPlc.WORK_CENTER_ID.length);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_MANUAL).toBe('20.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_MANUAL).toBe('30.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[2].CWCE_DECIMAL_MANUAL).toBe('40.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[3].CWCE_DECIMAL_MANUAL).toBe('50.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_UNIT).toBe('EUR');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_UNIT).toBe('CAD');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[2].CWCE_DECIMAL_UNIT).toBe('EUR');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[3].CWCE_DECIMAL_UNIT).toBe('CAD');
				}
			});
			
			it('should return a subset of valid work centers and texts when skip parameter is used', function() {
				// arrange
				var iSkip = 2;
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "skip",
					value : iSkip
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(testData.oWorkCenterTestDataPlc.WORK_CENTER_ID.length-iSkip);
				expect(oResponseBody.body.masterdata.WORK_CENTER_TEXT_ENTITIES.length).toBe(testData.oWorkCenterTextTestDataPlc.WORK_CENTER_ID.length-iSkip);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_MANUAL).toBe('40.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_MANUAL).toBe('50.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_UNIT).toBe('EUR');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_UNIT).toBe('CAD');
				}
			});
			
			it('should return all work centers and texts when skip parameter is used and it set to 0', function() {
				// arrange
				var iSkip = 0;
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "skip",
					value : iSkip
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(testData.oWorkCenterTestDataPlc.WORK_CENTER_ID.length);
				expect(oResponseBody.body.masterdata.WORK_CENTER_TEXT_ENTITIES.length).toBe(testData.oWorkCenterTextTestDataPlc.WORK_CENTER_ID.length);
			});
			
			it('should return a subset of valid work centers  and texts when skip and top parameters are used', function() {
				// arrange
				var iTop = 2;
				var iSkip = 1;
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "skip",
					value : iSkip
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.WORK_CENTER_TEXT_ENTITIES.length).toBe(2);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_MANUAL).toBe('30.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_MANUAL).toBe('40.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_UNIT).toBe('CAD');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[1].CWCE_DECIMAL_UNIT).toBe('EUR');
				}
			});
			
			it('should return no work centers and texts when skip and top parameters are used, skip = 1 and top = 0', function() {
				// arrange
				var iTop = 0;
				var iSkip = 1;
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "skip",
					value : 1
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.WORK_CENTER_TEXT_ENTITIES.length).toBe(0);
			});
			
		    it('should return the filtered work centers - one filter on WORK_cENTER_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "filter",
					value : "WORK_CENTER_ID=WC1"
				}];
				
				var iCount = mockstar_helpers.getRowCount(mockstar, "work_center", "WORK_CENTER_ID='WC1'");
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(iCount);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_MANUAL).toBe('20.0000000');
					expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES[0].CWCE_DECIMAL_UNIT).toBe('EUR');
				}
			});
			
			it('should return the filtered work centers - one filter on COMPANY_CODE_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "filter",
					value : "COMPANY_CODE_ID=CC1"
				}];
				
				var oResults = mockstar.execQuery("select count(*) as ROWCOUNT from {{work_center}} as wk inner join {{plant}} as plant on plant.PLANT_ID = wk.PLANT_ID and plant.COMPANY_CODE_ID='CC1'");
				var iCount = parseInt(oResults.columns.ROWCOUNT.rows[0], 10);
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(iCount);
			});
			
			it('should return the work centers filtered by process', function() {
				// arrange
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "filter",
					value : "PROCESS_ID=B2"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody.body.masterdata.WORK_CENTER_PROCESS_ENTITIES.length).toBe(3);
			});
			
			it('should return the work centers filtered by process and work center id', function() {
				// arrange
				mockstar.insertTableData("work_center_process", testData.oWorkCenterProcessTestDataPlc);
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "filter",
					value : "PROCESS_ID=B2&WORK_CENTER_ID=WC2"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody.body.masterdata.WORK_CENTER_PROCESS_ENTITIES.length).toBe(1);
			});
			
			it('should return work centers search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "searchAutocomplete",
					value : "WC1"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(1);
			});
			
			it('should return work centers search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "searchAutocomplete",
					value : "WC"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(5);
			});
			
			it('should not return work centers when filtered value is invalid', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				},{
					name : "filter",
					value : "COST_CENTER_ID=AAA"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.WORK_CENTER_ENTITIES.length).toBe(0);
			});
		});
	    describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_text", testData.oWorkCenterTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
				if(jasmine.plcTestRunParameters.generatedFields === true){
					mockstar.insertTableData("work_center_ext", testData.oWorkCenterExtTestDataPlc);
				}
			});
	
			it('should deactivate the current version of the removed work centers', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.WORK_CENTER_ENTITIES[0]._VALID_TO).not.toBe(null);
                if(jasmine.plcTestRunParameters.generatedFields === true){
                	var oTestExtAfter =	mockstar.execQuery("select B.* from {{work_center}} as A inner join {{work_center_ext}} as B on A.WORK_CENTER_ID = B.WORK_CENTER_ID and A.PLANT_ID = B.PLANT_ID where A.WORK_CENTER_ID = 'WC1' and B.PLANT_ID = 'PL1'");
                	expect(oTestExtAfter.columns.WORK_CENTER_ID.rows.length).toBe(1);
                }
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a work center that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC11",
													"PLANT_ID" : "PL11",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				//assert
			    expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("WORK_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
												    "WORK_CENTER_ID" : "WC1"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
		});
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_text", testData.oWorkCenterTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
				if(jasmine.plcTestRunParameters.generatedFields === true){
					mockstar.insertTableData("work_center_ext", testData.oWorkCenterExtTestDataPlc);
				}
			});
	
			it('should insert work_center and work_center_text, and work center custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{work_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{work_center_text}}");
				
				if(jasmine.plcTestRunParameters.generatedFields === true){
					var oTestExta = mockstar.execQuery("select * from {{work_center_ext}}");
					var oItemsPayload = {"CREATE":
				       { 
						"WORK_CENTER_ENTITIES" : [{
								"WORK_CENTER_ID" : "WC6",
								"PLANT_ID" : "PL1",
								"COST_CENTER_ID" : "CC2",
								"CONTROLLING_AREA_ID" : "1000",
								"CWCE_DECIMAL_MANUAL": "66"
							},{
								"WORK_CENTER_ID" : "WC7",
								"PLANT_ID" : "PL1",
								"COST_CENTER_ID" : "CC2",
								"CONTROLLING_AREA_ID" : "1000",
								"CWCE_DECIMAL_MANUAL": "77"
							}],
							"WORK_CENTER_TEXT_ENTITIES" : [{
								"WORK_CENTER_ID" : "WC6",
								"PLANT_ID" : "PL1",
								"WORK_CENTER_DESCRIPTION" : "Test1 EN",
								"LANGUAGE" : "EN"
							},{
								"WORK_CENTER_ID" : "WC6",
								"PLANT_ID" : "PL1",
								"WORK_CENTER_DESCRIPTION" : "Test1 DE",
								"LANGUAGE" : "DE"
							},{
								"WORK_CENTER_ID" : "WC7",
								"PLANT_ID" : "PL1",
								"WORK_CENTER_DESCRIPTION" : "Test2 EN",
								"LANGUAGE" : "EN"
							}]
				        }
					};
				} else {
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
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"WORK_CENTER_ID" : "WC7",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};
				}
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{work_center}}");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.WORK_CENTER_ID.rows.length).toBe(oTesta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTexta.columns.WORK_CENTER_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0]._VALID_FROM).not.toBe(null);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					var oTestExt = mockstar.execQuery("select * from {{work_center_ext}}");
					expect(oTestExt.columns.WORK_CENTER_ID.rows.length).toBe(oTestExta.columns.WORK_CENTER_ID.rows.length + 2);
				}
			});
			
			it('should insert Work_Center and Work_Center_text complete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{work_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{work_center_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "MACHINE",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}],
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{work_center}}");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.WORK_CENTER_ID.rows.length).toBe(oTesta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTexta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].WORK_CENTER_ID).toBe('WC8');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].PLANT_ID).toBe('PL1');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].WORK_CENTER_CATEGORY).toBe("LABOR");
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].COST_CENTER_ID).toBe('CC2');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].CONTROLLING_AREA_ID).toBe('1000');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].WORK_CENTER_RESPONSIBLE).toBe('i335279');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0].EFFICIENCY).toBe('70.0000000');
				expect(oResponseBody.body.masterdata.CREATE.WORK_CENTER_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when invalid Work Center Categories are inserted', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "LABORS",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "MACHINES",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "99",
													"WORK_CENTER_CATEGORY" : "MACHINE",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}],
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
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
				expect(oResponseBody.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[0].details.validationObj.propertyInfo).toBe('Work Center Category');
				expect(oResponseBody.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseBody.head.messages[1].details.validationObj.propertyInfo).toBe('Work Center Category');
				expect(oResponseBody.head.messages[2].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert a work center with a controlling area that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : "CC1",
													"CONTROLLING_AREA_ID" : "#C11",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
                expect(oResponseBody.head.messages[0].details.businessObj.toUpperCase()).toBe("CONTROLLING_AREA,COST_CENTER");		
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert a work center with a plant that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL5",
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
                expect(oResponseBody.head.messages[0].details.businessObj.toUpperCase()).toBe("PLANT");		
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert a work center with plant, controlling area, cost center that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL6",
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : "CC3",
													"CONTROLLING_AREA_ID" : "#CC",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
                expect(oResponseBody.head.messages[0].details.businessObj.toUpperCase()).toBe("CONTROLLING_AREA,PLANT,COST_CENTER");	
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a work center that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC66",
													"PLANT_ID" : "PL11",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC66",
													"PLANT_ID" : "PL11",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"WORK_CENTER_ID" : "WC77",
													"PLANT_ID" : "PL11",
													"WORK_CENTER_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a work center that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a work center text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "WORK CENTER WC1 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("COST_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("WORK_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("COST_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[3].columnId).toBe("CONTROLLING_AREA_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a work center for which mandatory fields are null', function() {
				// arrange
				const aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				const oItemsPayload = {"CREATE":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : null,
													"PLANT_ID" : null,
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : null,
													"CONTROLLING_AREA_ID" : null,
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : 70
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                const oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("WORK_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("COST_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[3].columnId).toBe("CONTROLLING_AREA_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_text", testData.oWorkCenterTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
				if(jasmine.plcTestRunParameters.generatedFields === true){
					mockstar.insertTableData("work_center_ext", testData.oWorkCenterExtTestDataPlc);
				}
			});
	
			it('should insert Work_Center and Work_Center_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{work_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{work_center_text}}");
				
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
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC6",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"WORK_CENTER_ID" : "WC7",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{work_center}}");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.WORK_CENTER_ID.rows.length).toBe(oTesta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTexta.columns.WORK_CENTER_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				it('should insert work center custom fields', function() {
					// arrange
					var aParams = [ {
						name : "business_object",
						value : "Work_Center"
					}];
					
					var oTesta = mockstar.execQuery("select * from {{work_center}}");
					var oTestTexta = mockstar.execQuery("select * from {{work_center_text}}");
					var oTestExta = mockstar.execQuery("select * from {{work_center_ext}}");
					
					var oItemsPayload = {"UPSERT":
	                    				       { 
												"WORK_CENTER_ENTITIES" : [{
														"WORK_CENTER_ID" : "WC6",
														"PLANT_ID" : "PL1",
														"COST_CENTER_ID" : "CC2",
														"CONTROLLING_AREA_ID" : "1000",
														"CWCE_DECIMAL_MANUAL": "120",
														"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
													},{
														"WORK_CENTER_ID" : "WC7",
														"PLANT_ID" : "PL1",
														"COST_CENTER_ID" : "CC2",
														"CONTROLLING_AREA_ID" : "1000",
														"CWCE_DECIMAL_MANUAL": "88",
														"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
													}],
													"WORK_CENTER_TEXT_ENTITIES" : [{
														"WORK_CENTER_ID" : "WC6",
														"PLANT_ID" : "PL1",
														"WORK_CENTER_DESCRIPTION" : "Test1 EN",
														"LANGUAGE" : "EN"
													},{
														"WORK_CENTER_ID" : "WC6",
														"PLANT_ID" : "PL1",
														"WORK_CENTER_DESCRIPTION" : "Test1 DE",
														"LANGUAGE" : "DE"
													},{
														"WORK_CENTER_ID" : "WC7",
														"PLANT_ID" : "PL1",
														"WORK_CENTER_DESCRIPTION" : "Test2 EN",
														"LANGUAGE" : "EN"
													}]
	                    				        }
	                    				};

				    // act
					new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
	                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					var oTest = mockstar.execQuery("select * from {{work_center}}");
					var oTestText = mockstar.execQuery("select * from {{work_center_text}}");
					var oTestExt = mockstar.execQuery("select * from {{work_center_ext}}");
					
					//assert
					expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
					expect(oResponseBody).toBeDefined();
					expect(oTest.columns.WORK_CENTER_ID.rows.length).toBe(oTesta.columns.WORK_CENTER_ID.rows.length + 2);
					expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
					expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
					expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
					expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTexta.columns.WORK_CENTER_ID.rows.length + 3);
					expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0]._VALID_FROM).not.toBe(null);
					expect(oTestExt.columns.WORK_CENTER_ID.rows.length).toBe(oTestExta.columns.WORK_CENTER_ID.rows.length + 2);
					expect(oTestExt.columns.PLANT_ID.rows.length).toBe(oTestExta.columns.PLANT_ID.rows.length + 2);
					expect(oTestExt.columns.CWCE_DECIMAL_MANUAL.rows.length).toBe(oTestExta.columns.CWCE_DECIMAL_MANUAL.rows.length + 2);
					expect(oTestExt.columns.CWCE_DECIMAL_UNIT.rows.length).toBe(oTestExta.columns.CWCE_DECIMAL_UNIT.rows.length + 2);
				});
			}
			
			it('should insert Work_Center and Work_Center_text complete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{work_center}}");
				var oTestTexta = mockstar.execQuery("select * from {{work_center_text}}");
				
				var oItemsPayload = { "UPSERT":
	                    			   { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "LABOR",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_CATEGORY" : "MACHINE",
													"COST_CENTER_ID" : "CC2",
													"CONTROLLING_AREA_ID" : "1000",
													"WORK_CENTER_RESPONSIBLE" : "i335279",
													"EFFICIENCY" : '70.0000000'
												}],
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC8",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC9",
													"PLANT_ID" : "PL1",
													"WORK_CENTER_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{work_center}}");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.WORK_CENTER_ID.rows.length).toBe(oTesta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTexta.columns.WORK_CENTER_ID.rows.length + 2);
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].WORK_CENTER_ID).toBe('WC8');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].PLANT_ID).toBe('PL1');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].WORK_CENTER_CATEGORY).toBe("LABOR");
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].COST_CENTER_ID).toBe('CC2');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].CONTROLLING_AREA_ID).toBe('1000');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].WORK_CENTER_RESPONSIBLE).toBe('i335279');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0].EFFICIENCY).toBe('70.0000000');
				expect(oResponseBody.body.masterdata.UPSERT.WORK_CENTER_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a Work_Center that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC56",
													"PLANT_ID" : "PL11",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"WORK_CENTER_ID" : "WC556",
													"PLANT_ID" : "PL11",
													"WORK_CENTER_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a work center for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"WORK_CENTER_ENTITIES" : [{
													
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("WORK_CENTER_ID");	
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("COST_CENTER_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[3].columnId).toBe("CONTROLLING_AREA_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should deactivate the current version of the upserted work center text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{work_center}} WHERE WORK_CENTER_ID = 'WC1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{work_center_text}} WHERE WORK_CENTER_ID = 'WC1'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"WORK_CENTER_DESCRIPTION" : "Updated work center description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{work_center}} WHERE WORK_CENTER_ID = 'WC1'");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}} WHERE WORK_CENTER_ID = 'WC1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.WORK_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.WORK_CENTER_ID.rows.length);
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.WORK_CENTER_ID.rows.length + 1);
			});
			
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("work_center", testData.oWorkCenterTestDataPlc);
				mockstar.insertTableData("work_center_text", testData.oWorkCenterTextTestDataPlc);
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
				if(jasmine.plcTestRunParameters.generatedFields === true){
					mockstar.insertTableData("work_center_ext", testData.oWorkCenterExtTestDataPlc);
				}
			});
	
			it('should deactivate the current version of the updated work center text and create a new version, also for extension table', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{work_center}} WHERE WORK_CENTER_ID = 'WC1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{work_center_text}} WHERE WORK_CENTER_ID = 'WC1'");
				
				if(jasmine.plcTestRunParameters.generatedFields === true){
					var oTestExtBefore = mockstar.execQuery("select * from {{work_center_ext}} WHERE WORK_CENTER_ID = 'WC1'");
					var oItemsPayload = {"UPDATE":
				       { 
							"WORK_CENTER_ENTITIES" : [{
								"WORK_CENTER_ID" : "WC1",
								"PLANT_ID" : "PL1",
								"COST_CENTER_ID" : "CC2",
								"CONTROLLING_AREA_ID" : "1000",
								"_VALID_FROM": "2015-01-01T15:39:09.691Z",
								"CWCE_DECIMAL_MANUAL": "99"
							}],
							"WORK_CENTER_TEXT_ENTITIES" : [{
								"WORK_CENTER_ID" : "WC1",
								"PLANT_ID" : "PL1",
								"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
								"WORK_CENTER_DESCRIPTION" : "Updated work center description",
								"LANGUAGE" : "EN"
							}]
				        }
					};
				} else {				
					var oItemsPayload = {"UPDATE":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC1",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"WORK_CENTER_DESCRIPTION" : "Updated work center description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};
				}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{work_center}} WHERE WORK_CENTER_ID = 'WC1'");
				var oTestText = mockstar.execQuery("select * from {{work_center_text}} WHERE WORK_CENTER_ID = 'WC1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.WORK_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.WORK_CENTER_ID.rows.length + 1);
				if(jasmine.plcTestRunParameters.generatedFields === true){
					var oTestExtAfter = mockstar.execQuery("select * from {{work_center_ext}} WHERE WORK_CENTER_ID = 'WC1'");
					expect(oTestExtAfter.columns.WORK_CENTER_ID.rows.length).toBe(oTestExtBefore.columns.WORK_CENTER_ID.rows.length + 1);
					expect(oTestExtAfter.columns.CWCE_DECIMAL_MANUAL.rows[1]).toBe('99.0000000');
					expect(oTestExtAfter.columns._VALID_FROM.rows[1].toString()).toBe(oTestMain.columns._VALID_FROM.rows[1].toString());
				}				
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when an invalid Work Center Category is updated', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
											"WORK_CENTER_ENTITIES" : [{
													"WORK_CENTER_CATEGORY" : "LABORS",
													"WORK_CENTER_ID" : "WC1",
                    								"PLANT_ID" : "PL1",
                    								"COST_CENTER_ID" : "CC2",
                    								"CONTROLLING_AREA_ID" : "1000",
                    								"_VALID_FROM": "2015-01-01T15:39:09.691Z"
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
				expect(oResponseBody.head.messages[0].details.validationObj.propertyInfo).toBe('Work Center Category');
			});
				
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a work center text and the work center text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC11",
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"WORK_CENTER_DESCRIPTION" : "Updated work center description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a work center text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Work_Center"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"WORK_CENTER_TEXT_ENTITIES" : [{
													"WORK_CENTER_ID" : "WC11",
													"WORK_CENTER_DESCRIPTION" : "Updated work center description"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
               
				//assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[2].columnId).toBe("LANGUAGE");
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});			
		});
	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}