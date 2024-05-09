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
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.factory.customer-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ //Initialize Mockstar
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_customer_read"
				},
				substituteTables : {
					customer : {
						name : Resources["Customer"].dbobjects.plcTable
					},
					gtt_customer: Resources["Customer"].dbobjects.tempTable,
					project : {
						name : ProjectTables.project
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Customer"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Customer": procedureXsunit
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
	
		describe("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return all valid customers and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(2);
			});
	
			it('should return the filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				},{
				    name : "filter",
				    value : "CUSTOMER_ID=C1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(1);
			});
			
			it('should return the filtered entries using search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				},{
				    name : "filter",
				    value : "COUNTRY=C1"
				},{
				    name : "searchAutocomplete",
				    value : "N"
				}  ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES[0]).toMatchData(
        	                    {'CUSTOMER_ID': 'C1',
        	                     'CUSTOMER_NAME' : 'N1',
        	                     'COUNTRY': 'C1',
        	                     'CITY': 'A',
        	                     'STREET_NUMBER_OR_PO_BOX': '1',
        	                     'POSTAL_CODE': '1',
                                '_SOURCE': 1
                                }, ['CUSTOMER_ID']);
			});
			
			it('should return the entries using search autocomplete and multiple filteres', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				},{
				    name : "filter",
				    value : "COUNTRY=C1&REGION=A"
				},{
				    name : "searchAutocomplete",
				    value : "N"
				}  ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES[0]).toMatchData(
        	                    {'CUSTOMER_ID': 'C1',
        	                     'CUSTOMER_NAME' : 'N1',
        	                     'COUNTRY': 'C1',
        	                     'CITY': 'A',
        	                     'STREET_NUMBER_OR_PO_BOX': '1',
        	                     'POSTAL_CODE': '1',
                                '_SOURCE': 1
                                }, ['CUSTOMER_ID']);
			});
			
			it('should return no entries if the search autocomplete does not match data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				},{
				    name : "filter",
				    value : "CUSTOMER_ID=C1"
				},{
				    name : "searchAutocomplete",
				    value : "L"
				}  ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(0);
			});
	
			it('should not return any entries for an invalid customer (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				},{
				    name : "filter",
				    value : "CUSTOMER_ID=CX"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.CUSTOMER_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert customer', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{customer}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "C3",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{customer}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.CUSTOMER_ID.rows.length).toBe(oTestBefore.columns.CUSTOMER_ID.rows.length + 1);
				expect(oResponseBody.body.masterdata.UPSERT.CUSTOMER_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER": "C3",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CUSTOMER");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of missing mandatory values', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of null mandatory values', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				let oItemsPayload = {"UPSERT":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
												    "CUSTOMER_ID": null,
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
			
			it('should deactivate the current version of the upserted customer and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{customer}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID" : "C1",
													"CUSTOMER_NAME" : "N2",
													"COUNTRY" : "C2",
													"POSTAL_CODE" : "2",
													"REGION" : "AA",
													"CITY" : "AA",
													"STREET_NUMBER_OR_PO_BOX" : "2"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{customer}}");

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CUSTOMER_ID.rows.length).toBe(oTestMainBefore.columns.CUSTOMER_ID.rows.length + 1);
			});
		});	
		
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert customer', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{customer}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "C3",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{customer}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.CUSTOMER_ID.rows.length).toBe(oTestBefore.columns.CUSTOMER_ID.rows.length + 1);
				expect(oResponseBody.body.masterdata.CREATE.CUSTOMER_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a customer that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "C1",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER": "C3",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CUSTOMER");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a customer with CUSTOMER_ID=DELETED', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "DELETED",
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);		
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of missing mandatory values', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_NAME": "N3",
													"COUNTRY": "C3",
													"POSTAL_CODE": "3",
													"REGION": "C",
													"CITY": "C",
													"STREET_NUMBER_OR_PO_BOX": "3"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});	
	
		describe ("remove", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed customer', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "C2",
													"_VALID_FROM": "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.CUSTOMER_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a customer for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a customer that does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID": "C1234",
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});			
		});	
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated customer and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{customer}}");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID" : "C1",
													"CUSTOMER_NAME" : "N2",
													"COUNTRY" : "C2",
													"POSTAL_CODE" : "2",
													"REGION" : "AA",
													"CITY" : "AA",
													"STREET_NUMBER_OR_PO_BOX" : "2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{customer}}");

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.CUSTOMER_ID.rows.length).toBe(oTestMainBefore.columns.CUSTOMER_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when customer is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_ID" : "ZZZ",
													"CUSTOMER_NAME" : "N2",
													"COUNTRY" : "C2",
													"POSTAL_CODE" : "2",
													"REGION" : "AA",
													"CITY" : "AA",
													"STREET_NUMBER_OR_PO_BOX" : "2",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a customer for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Customer"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"CUSTOMER_ENTITIES" : [{
													"CUSTOMER_NAME" : "N2",
													"COUNTRY" : "C2",
													"POSTAL_CODE" : "2",
													"REGION" : "AA",
													"CITY" : "AA",
													"STREET_NUMBER_OR_PO_BOX" : "2"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CUSTOMER_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});				
		});	
	}).addTags(["Administration_NoCF_Integration"]);
}