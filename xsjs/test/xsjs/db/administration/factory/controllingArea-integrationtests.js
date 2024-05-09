var testData = require("../../../../testdata/testdata").data;
var mockstar_helpers = require("../../../../testtools/mockstar_helpers");
var MockstarFacade = require("../../../../testtools/mockstar_facade").MockstarFacade;

var Administration = require("../administration-util");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.controllingArea-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_controlling_area_read"
				},
				substituteTables : {
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					controlling_area_text : {
						name : Resources["Controlling_Area"].dbobjects.plcTextTable
					},
					activity_price : {
						name : Resources["Activity_Price"].dbobjects.plcTable
					},
					activity_type : {
						name : Resources["Activity_Type"].dbobjects.plcTable
					},
					account : {
						name : Resources["Account"].dbobjects.plcTable
					},
					process : {
						name : Resources["Process"].dbobjects.plcTable
					},
					company_code : {
						name : Resources["Company_Code"].dbobjects.plcTable
					},
					component_split : {
						name : Resources["Component_Split"].dbobjects.plcTable
					},
					cost_center : {
						name : Resources["Cost_Center"].dbobjects.plcTable
					},
					costing_sheet : {
						name : Resources["Costing_Sheet"].dbobjects.plcTable,
					},
					materialAccountDetermination : {
						name : Resources["Material_Account_Determination"].dbobjects.plcTable
					},
					profit_center : {
						name : Resources["Profit_Center"].dbobjects.plcTable
					},
					work_center : {
						name : Resources["Work_Center"].dbobjects.plcTable
					}, 
					work_center_activity_type : {
						name : Resources["Work_Center_Activity"].dbobjects.plcTable
					},    
					project : {
						name : ProjectTables.project
					},
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Controlling_Area"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Controlling_Area": procedureXsunit
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
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyEUR);

				mockstar.initializeData();
			});
	
			it('should return all valid controlling areas and texts', function() {
				// arrange
//				var administration = Administration.getAdministrationObject(mockstar,mockstarRepl);
//				var sLanguage = 'EN';
//				var oGetParameters = {};
//				oGetParameters["business_object"] = "Controlling_Area";
//	
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				} ];
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(5);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_TEXT_ENTITIES.length).toBe(10);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=#CA1&CONTROLLING_AREA_CURRENCY_ID=EUR"
				} ];
				
				var iCount = mockstar_helpers.getRowCount(mockstar, "controlling_area", "CONTROLLING_AREA_ID= '#CA1' and CONTROLLING_AREA_CURRENCY_ID= 'EUR'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "controlling_area_text", "CONTROLLING_AREA_ID= '#CA1'");
				var sLanguage = 'EN';
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(iCount);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_TEXT_ENTITIES.length).toBe(iCountText);
			});
	
			it('should return the filtered entries - case insensitive', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=#CA1&CONTROLLING_AREA_CURRENCY_ID=EUR"
				} ];
				var iCount = mockstar_helpers.getRowCount(mockstar, "controlling_area", "CONTROLLING_AREA_ID= '#CA1' and CONTROLLING_AREA_CURRENCY_ID= 'EUR'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "controlling_area_text", "CONTROLLING_AREA_ID= '#CA1'");
				var sLanguage = 'EN';
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(iCount);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_TEXT_ENTITIES.length).toBe(iCountText);
			});
			
			it('should return the valid filtered entities using search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_CURRENCY_ID=EUR"
				},{
				    name : "searchAutocomplete",
				    value : "#C"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '#CA1',
        	                     'CONTROLLING_AREA_DESCRIPTION' : 'Kostenrechnungskreis 1',
        	                     'CONTROLLING_AREA_CURRENCY_ID': 'EUR',
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[1]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '#CA3',
        	                     'CONTROLLING_AREA_DESCRIPTION' : 'Kostenrechnungskreis 3',
        	                     'CONTROLLING_AREA_CURRENCY_ID': 'EUR',
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
                
			});
			
			it('should return the valid multiple filtered entities using search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=#CA1&CONTROLLING_AREA_CURRENCY_ID=EUR"
				},{
				    name : "searchAutocomplete",
				    value : "Ko"
				}  ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '#CA1',
        	                     'CONTROLLING_AREA_DESCRIPTION' : 'Kostenrechnungskreis 1',
        	                     'CONTROLLING_AREA_CURRENCY_ID': 'EUR',
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
			});
			
			it('should return no entities using search autocomplete that does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_CURRENCY_ID=EUR"
				},{
				    name : "searchAutocomplete",
				    value : "Ml"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
	        
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=545"
				} ];
				var sLanguage = 'EN';
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oResponseBody).not.toBe(null);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_TEXT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyEUR);

				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed controlling area', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"DELETE":
                    				       { 
                        						"CONTROLLING_AREA_ENTITIES" : [{
                        					        "CONTROLLING_AREA_ID" : "#CA3",
							                        "_VALID_FROM" : "2015-01-01T15:39:09.691Z"
                        						}]
                    				        }
                    				}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.DELETE.CONTROLLING_AREA_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a controlling area for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"DELETE":
				{ 
					"CONTROLLING_AREA_ENTITIES": [{
					}]
			    }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a controlling area for which mandatory fields are null', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				let oItemsPayload = {"DELETE":
				{ 
					"CONTROLLING_AREA_ENTITIES": [{
					    "CONTROLLING_AREA_ID": null,
					    "_VALID_FROM": null
					}]
			    }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a controlling area which is used in other business objects', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"DELETE":
				{ 
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID" : "#CA1",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
			    }}
				
				var oProcess = {
						"PROCESS_ID" : ["B1"],
						"CONTROLLING_AREA_ID": ["#CA1"],
						"ACCOUNT_ID": ["778"],
						"_VALID_FROM": ["2015-01-01T00:00:00.000Z"],
						"_VALID_TO": [null],
						"_SOURCE": [1],
						"_CREATED_BY": ['U000001']
				};
				mockstar.insertTableData("process", oProcess);

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Process);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a controlling area which is used in other business object with no versioning', function() {
				// arrange
				mockstar.insertTableData("project", testData.oProjectTestData);
				
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"DELETE":
				{ 
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID" : "1000",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
			    }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Project);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a controlling area that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"DELETE":
				{ 
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID" : "C123",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
			    }}

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyEUR);
				
				mockstar.initializeData();
			});
	
			it('should insert controlling_area and controlling_area_text', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{controlling_area}}");
				var oTestTexta = mockstar.execQuery("select * from {{controlling_area_text}}");
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"CREATE":
				{ 
					    "CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1"
						},{
							"CONTROLLING_AREA_ID" : "CA2"
						}],
						"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "EN"
						},{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" : "Test1 DE",
							"LANGUAGE" : "DE"
						},{
							"CONTROLLING_AREA_ID" : "CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Test2 EN",
							"LANGUAGE" : "EN"
						}]
			    }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{controlling_area}}");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length + 2);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestTexta.columns.CONTROLLING_AREA_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.CONTROLLING_AREA_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.CONTROLLING_AREA_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should insert a text for an existing entity', function() {
				// arrange
				mockstar.clearTable("controlling_area_text");
				var oTestMainBefore = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES": [{
                			"CONTROLLING_AREA_ID" : "#CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Controlling area description",
							"LANGUAGE" : "EN"
                		}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
			    expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				//expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a controlling area and the used language does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "Z1"
						}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Language);	
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a controlling area that does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                	    "CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "EN"
						},{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" : "Test1 DE",
							"LANGUAGE" : "DE"
						}]
                }}

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
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a controlling area that already exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA1"
						}]
                }}		
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a controlling area text that already exists', function() {
				// arrange
                var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "EN"
						}]
                }}				
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA" : "#CA1"
						}]
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CONTROLLING_AREA");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a controlling area for which mandatory fields are missing', function() {
				// arrange
            	var aParams = [ {
            		name : "business_object",
            		value : "Controlling_Area"
            	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
	//						"CONTROLLING_AREA_ID" : ""
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (currency) does not exist', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"CREATE":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_CURRENCY_ID" : "ABC"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Currency);
			});
	
 		});
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyEUR);
				
				mockstar.initializeData();
			});
	
			it('should insert controlling_area and controlling_area_text', function() {
				// arrange
				var oTesta = mockstar.execQuery("select * from {{controlling_area}}");
				var oTestTexta = mockstar.execQuery("select * from {{controlling_area_text}}");
				var aParams = [ {
					name : "business_object",
					value : "Controlling_Area"
				}];
				var oItemsPayload = {"UPSERT":
				{ 
					    "CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1"
						},{
							"CONTROLLING_AREA_ID" : "CA2"
						}],
						"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "EN"
						},{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_DESCRIPTION" : "Test1 DE",
							"LANGUAGE" : "DE"
						},{
							"CONTROLLING_AREA_ID" : "CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Test2 EN",
							"LANGUAGE" : "EN"
						}]
			    }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				var oTest = mockstar.execQuery("select * from {{controlling_area}}");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}}");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oTest.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTesta.columns.CONTROLLING_AREA_ID.rows.length+2);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestTexta.columns.CONTROLLING_AREA_ID.rows.length+3);
				expect(oResponseBody.body.masterdata.UPSERT.CONTROLLING_AREA_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.CONTROLLING_AREA_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should update controlling_area_text', function() {
				// arrange
				var oTestMainBefore = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Updated controlling area description",
							"LANGUAGE" : "EN"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestTextBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
			});
			
			it('should insert a text for an existing entity', function() {
				// arrange
				mockstar.clearTable("controlling_area_text");
				var oTestMainBefore = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES": [{
                			"CONTROLLING_AREA_ID" : "#CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Controlling area description",
							"LANGUAGE" : "EN"
                		}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
			    expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				//expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a controlling area and the used language does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA1",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "Z1"
						}]
                }}
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Language);	
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a controlling area that does not exists', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                	    "CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA",
							"CONTROLLING_AREA_DESCRIPTION" :"Test1 EN",
							"LANGUAGE" : "EN"
						},{
							"CONTROLLING_AREA_ID" : "CA",
							"CONTROLLING_AREA_DESCRIPTION" : "Test1 DE",
							"LANGUAGE" : "DE"
						}]
                }}

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
			 
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA" : "#CA1"
						}]
                }}
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CONTROLLING_AREA");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a controlling area for which mandatory fields are missing', function() {
				// arrange
            	var aParams = [ {
            		name : "business_object",
            		value : "Controlling_Area"
            	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (currency) does not exist', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPSERT":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "CA1",
							"CONTROLLING_AREA_CURRENCY_ID" : "ABC"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.Currency);
			});
	
 		});
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrencyEUR);
				
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated controlling area text and create a new version', function() {
				// arrange
				var oTestMainBefore = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA2",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
							"CONTROLLING_AREA_DESCRIPTION" : "Updated controlling area description",
							"LANGUAGE" : "EN"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{controlling_area}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				var oTestText = mockstar.execQuery("select * from {{controlling_area_text}} WHERE CONTROLLING_AREA_ID = '#CA2'");
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestMainBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
				expect(oTestText.columns.CONTROLLING_AREA_ID.rows.length).toBe(oTestTextBefore.columns.CONTROLLING_AREA_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a controlling area which is not available in system', function() {
				// arrange
                var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"CONTROLLING_AREA_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#ZZZ",
							"CONTROLLING_AREA_CURRENCY_ID" : "TST",
							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
						
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a controlling area text for a controlling area text which is not available in system', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                	    "CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA2",
							"_VALID_FROM" : "2015-05-01T15:39:09.691Z",
							"CONTROLLING_AREA_DESCRIPTION" : "Updated controlling area description",
							"LANGUAGE" : "EN"
						}]
                }}
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a controlling area text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
                		name : "business_object",
                		value : "Controlling_Area"
                	}];
                var oItemsPayload = {"UPDATE":
                { 
                		"CONTROLLING_AREA_TEXT_ENTITIES" : [{
							"CONTROLLING_AREA_ID" : "#CA2",
							"CONTROLLING_AREA_DESCRIPTION" : "Updated controlling area description"
						}]
                }}
                
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
                expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("LANGUAGE");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}