var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.factory.companyCode-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_company_code_read"
				},
				substituteTables : {
					company_code : {
						name : Resources["Company_Code"].dbobjects.plcTable
					},
					gtt_company_code: Resources["Company_Code"].dbobjects.tempTable,
					company_code_text : {
						name : Resources["Company_Code"].dbobjects.plcTextTable
					},
					gtt_company_code_text : Resources["Company_Code"].dbobjects.tempTextTable,
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					plant : {
						name : Resources["Plant"].dbobjects.plcTable
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
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
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Company_Code"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Company_Code": procedureXsunit
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
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("company_code_text", testData.oCompanyCodeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid company code and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(3);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				},{
				    name : "filter",
				    value : "COMPANY_CODE_ID=CC1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_TEXT_ENTITIES.length).toBe(1);
			});
	
			it('should not return any entries for an invalid controlling area (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				},{
				    name : "filter",
				    value : "COMPANY_CODE_ID=MDC"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should return the valid company codes that start with the string from autocomplete and are filtered by controlling area id', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Company_Code"
            		},{
            		    name : "filter",
            			value : "CONTROLLING_AREA_ID=1000"
            		},{
             		    name : "searchAutocomplete",
             		    value : "CC"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(3);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES).toMatchData({
    			   COMPANY_CODE_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[1], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[2]],
    			   CONTROLLING_AREA_ID: [testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[0], testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[1], testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[2]],
    			   COMPANY_CODE_CURRENCY_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[1], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[2]]
    			}, ["COMPANY_CODE_ID"]);
			});
			
			it('should not return duplicate entries when multiple filteres are used', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Company_Code"
            		},{
            		    name : "filter",
            			value : "CONTROLLING_AREA_ID=1000&COMPANY_CODE_CURRENCY_ID=EUR"
            		},{
             		    name : "searchAutocomplete",
             		    value : "CC"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(3);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES).toMatchData({
    			   COMPANY_CODE_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[1], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[2]],
    			   CONTROLLING_AREA_ID: [testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[0], testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[1], testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[2]],
    			   COMPANY_CODE_CURRENCY_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[1], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[2]]
    			}, ["COMPANY_CODE_ID"]);
			});
			
			it('should return empty arrays when no entitie matches the filter condition', function() {
				// arrange
				var aParams = [ {
            			name : "business_object",
            			value : "Company_Code"
            		},{
            		    name : "filter",
            			value : "CONTROLLING_AREA_ID=1000&COMPANY_CODE_CURRENCY_ID=EUR"
            		},{
             		    name : "searchAutocomplete",
             		    value : "CCTEST"
             		}];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("company_code_text", testData.oCompanyCodeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed company code', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"COMPANY_CODE_ENTITIES": [{
													"COMPANY_CODE_ID" : "CC3",
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
                expect(oResponseBody.body.masterdata.DELETE.COMPANY_CODE_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete an account for which mandatory fields are missing', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"COMPANY_CODE_ENTITIES": [{
						//							"COMPANY_CODE_ID" : ""
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("COMPANY_CODE_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a company code which is used in other business objects', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				var oItemsPayload = {"DELETE":
                    				       { 
												"COMPANY_CODE_ENTITIES": [{
													"COMPANY_CODE_ID" : "CC1",
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Plant);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a company code that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"COMPANY_CODE_ENTITIES": [{
													"COMPANY_CODE_ID" : "C123",
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
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("company_code_text", testData.oCompanyCodeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert company_code and company_code_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{company_code}}");
				var oTestTexta = mockstar.execQuery("select * from {{company_code_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"CONTROLLING_AREA_ID" : '#CA1'
												},{
													"COMPANY_CODE_ID" : 'INS2',
													"CONTROLLING_AREA_ID" : '#CA1'
												}],
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
												},{
													"COMPANY_CODE_ID" : 'INS2',
													"COMPANY_CODE_DESCRIPTION" : 'Test2 EN',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{company_code}}");
				var oTestText = mockstar.execQuery("select * from {{company_code_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.COMPANY_CODE_ID.rows.length).toBe(oTesta.columns.COMPANY_CODE_ID.rows.length+2);
				expect(oTestText.columns.COMPANY_CODE_ID.rows.length).toBe(oTestTexta.columns.COMPANY_CODE_ID.rows.length+3);
				expect(oResponseBody.body.masterdata.CREATE.COMPANY_CODE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.COMPANY_CODE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a company code that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
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
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a company code that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC1',
													"CONTROLLING_AREA_ID" : '1000',
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a company code text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC1',
													"CONTROLLING_AREA_ID" : '1000',
													"COMPANY_CODE_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE" : 'CC1'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("COMPANY_CODE");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert an account for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
												    "CONTROLLING_AREA_ID" : '1000'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("COMPANY_CODE_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'MDC',
													"CONTROLLING_AREA_ID" : '###'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
		});
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("company_code_text", testData.oCompanyCodeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert company_code and company_code_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{company_code}}");
				var oTestTexta = mockstar.execQuery("select * from {{company_code_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"CONTROLLING_AREA_ID" : '#CA1'
												},{
													"COMPANY_CODE_ID" : 'INS2',
													"CONTROLLING_AREA_ID" : '#CA1'
												}],
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
												},{
													"COMPANY_CODE_ID" : 'INS2',
													"COMPANY_CODE_DESCRIPTION" : 'Test2 EN',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{company_code}}");
				var oTestText = mockstar.execQuery("select * from {{company_code_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.COMPANY_CODE_ID.rows.length).toBe(oTesta.columns.COMPANY_CODE_ID.rows.length+2);
				expect(oTestText.columns.COMPANY_CODE_ID.rows.length).toBe(oTestTexta.columns.COMPANY_CODE_ID.rows.length+3);
				expect(oResponseBody.body.masterdata.UPSERT.COMPANY_CODE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.COMPANY_CODE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should deactivate the current version of the upserted company code text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{company_code_text}} WHERE COMPANY_CODE_ID = 'CC3'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC3',
													"COMPANY_CODE_DESCRIPTION" : 'Updated company code description',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{company_code_text}} WHERE COMPANY_CODE_ID = 'CC3'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.COMPANY_CODE_ID.rows.length).toBe(oTestMainBefore.columns.COMPANY_CODE_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a company code that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 EN',
													"LANGUAGE":"EN"
												},{
													"COMPANY_CODE_ID" : 'INS1',
													"COMPANY_CODE_DESCRIPTION": 'Test1 DE',
													"LANGUAGE":"DE"
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE" : 'CC1'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("COMPANY_CODE");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert an account for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
												    "CONTROLLING_AREA_ID" : '1000'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("COMPANY_CODE_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'MDC',
													"CONTROLLING_AREA_ID" : '###'
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
			});
		});
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("company_code_text", testData.oCompanyCodeTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated company code text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{company_code_text}} WHERE COMPANY_CODE_ID = 'CC3'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC3',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
													"COMPANY_CODE_DESCRIPTION" : 'Updated company code description',
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{company_code_text}} WHERE COMPANY_CODE_ID = 'CC3'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.COMPANY_CODE_ID.rows.length).toBe(oTestMainBefore.columns.COMPANY_CODE_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a company code which is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"COMPANY_CODE_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'ZZZ',
													"CONTROLLING_AREA_ID" : '1000',
													"COMPANY_CODE_CURRENCY_ID" : 'EUR',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a company code text for a company code which is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
													"COMPANY_CODE_DESCRIPTION" : 'Updated company code description',
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a company code text for a company code text which is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'CC3',
													"_VALID_FROM" : '2015-05-01T15:39:09.691Z',
													"COMPANY_CODE_DESCRIPTION" : 'Updated company code description',
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a company code text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Company_Code"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"COMPANY_CODE_TEXT_ENTITIES" : [{
													"COMPANY_CODE_ID" : 'ZZZ',
													"COMPANY_CODE_DESCRIPTION" : 'Euro'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("LANGUAGE");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}