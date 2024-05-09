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
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.vendor-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead" : "sap.plc.db.administration.procedures/p_vendor_read"
				},
				substituteTables : {
					vendor : {
						name : Resources["Vendor"].dbobjects.plcTable
					},
					metadata :  {
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Vendor"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Vendor": procedureXsunit
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
				mockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid vendors', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(2);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				},{
				    name : "filter",
				    value : "VENDOR_ID=V1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(1);
			});
			
			it('should return the filtered entries using searchAutocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				},{
				    name : "filter",
				    value : "COUNTRY=C1"
				},{
				    name : "searchAutocomplete",
				    value : "N"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES[0]).toMatchData(
        	                    {'VENDOR_ID': 'V1',
        	                     'VENDOR_NAME' : 'N1',
        	                     'REGION': 'A',
        	                     'COUNTRY': 'C1',
        	                     'CITY': 'A',
        	                     'STREET_NUMBER_OR_PO_BOX': '1',
        	                     'POSTAL_CODE': '1',
                                '_SOURCE': 1
                                }, ['VENDOR_ID']);
			});
			
			it('should return the entries using multimple filteres and searchAutocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				},{
				    name : "filter",
				    value : "COUNTRY=C1&CITY=A"
				},{
				    name : "searchAutocomplete",
				    value : "N"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES[0]).toMatchData(
        	                    {'VENDOR_ID': 'V1',
        	                     'VENDOR_NAME' : 'N1',
        	                     'REGION': 'A',
        	                     'COUNTRY': 'C1',
        	                     'CITY': 'A',
        	                     'STREET_NUMBER_OR_PO_BOX': '1',
        	                     'POSTAL_CODE': '1',
                                '_SOURCE': 1
                                }, ['VENDOR_ID']);
			});
	
			it('should not return any entries for an invalid vendor (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				},{
				    name : "filter",
				    value : "VENDOR_ID=VV"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(0);
			});
			
			it('should not return any entries if the searchAutocomplete does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				},{
				    name : "filter",
				    value : "COUNTRY=C1"
				},{
				    name : "searchAutocomplete",
				    value : "X"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.VENDOR_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert vendor', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{vendor}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V4",
													"VENDOR_NAME" : "N4",
													"COUNTRY" : "C4",
													"POSTAL_CODE" : "4",
													"REGION" : "C",
													"CITY" : "C",
													"STREET_NUMBER_OR_PO_BOX" : "4"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{vendor}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.VENDOR_ID.rows.length).toBe(oTestBefore.columns.VENDOR_ID.rows.length + 1);
				expect(oResponseBody.body.masterdata.CREATE.VENDOR_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a vendor that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V1",
													"VENDOR_NAME" : "N4",
													"COUNTRY" : "C4",
													"POSTAL_CODE" : "4",
													"REGION" : "C",
													"CITY" : "C",
													"STREET_NUMBER_OR_PO_BOX" : "4"
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
					value : "Vendor"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR" : "V1",
													"VENDOR_NAME" : "N4",
													"COUNTRY" : "C4",
													"POSTAL_CODE" : "4",
													"REGION" : "C",
													"CITY" : "C",
													"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("VENDOR");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of missing mandatory values', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
																			"VENDOR_NAME" : "N4",
																			"COUNTRY" : "C4",
																			"POSTAL_CODE" : "4",
																			"REGION" : "C",
																			"CITY" : "C",
																			"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of null mandatory values', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				let oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
												                            "VENDOR_ID" : null,
																			"VENDOR_NAME" : "N4",
																			"COUNTRY" : "C4",
																			"POSTAL_CODE" : "4",
																			"REGION" : "C",
																			"CITY" : "C",
																			"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a vendor with VEDOR_ID=DELETED', function() {
				// arrange
				let aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				let oItemsPayload = {"CREATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
												                        "VENDOR_ID" : "DELETED",
																		"VENDOR_NAME" : "N4",
																		"COUNTRY" : "C4",
																		"POSTAL_CODE" : "4",
																		"REGION" : "C",
																		"CITY" : "C",
																		"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
			});
		});	
		
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert vendor', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oTestBefore = mockstar.execQuery("select * from {{vendor}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V4",
													"VENDOR_NAME" : "N4",
													"COUNTRY" : "C4",
													"POSTAL_CODE" : "4",
													"REGION" : "C",
													"CITY" : "C",
													"STREET_NUMBER_OR_PO_BOX" : "4"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{vendor}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.VENDOR_ID.rows.length).toBe(oTestBefore.columns.VENDOR_ID.rows.length + 1);
				expect(oResponseBody.body.masterdata.UPSERT.VENDOR_ENTITIES[0]._VALID_FROM).not.toBe(null);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR" : "V1",
													"VENDOR_NAME" : "N4",
													"COUNTRY" : "C4",
													"POSTAL_CODE" : "4",
													"REGION" : "C",
													"CITY" : "C",
													"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("VENDOR");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) in case of missing mandatory values', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"VENDOR_ENTITIES" : [{
																			"VENDOR_NAME" : "N4",
																			"COUNTRY" : "C4",
																			"POSTAL_CODE" : "4",
																			"REGION" : "C",
																			"CITY" : "C",
																			"STREET_NUMBER_OR_PO_BOX" : "4"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should deactivate the current version of the upserted vendor and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{vendor}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V1",
													"VENDOR_NAME" : "N1",
													"COUNTRY" : "C1",
													"POSTAL_CODE" : "1",
													"REGION" : "A",
													"CITY" : "A",
													"STREET_NUMBER_OR_PO_BOX" : "1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{vendor}}");

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.VENDOR_ID.rows.length).toBe(oTestMainBefore.columns.VENDOR_ID.rows.length + 1);
			});
			
		});	
	
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated vendor and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{vendor}}");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V1",
													"VENDOR_NAME" : "N1",
													"COUNTRY" : "C1",
													"POSTAL_CODE" : "1",
													"REGION" : "A",
													"CITY" : "A",
													"STREET_NUMBER_OR_PO_BOX" : "1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestMain = mockstar.execQuery("select * from {{vendor}}");

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.VENDOR_ID.rows.length).toBe(oTestMainBefore.columns.VENDOR_ID.rows.length + 1);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when vendor is not current', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];

				var oItemsPayload = {"UPDATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V3",
													"VENDOR_NAME" : "N1",
													"COUNTRY" : "C1",
													"POSTAL_CODE" : "1",
													"REGION" : "A",
													"CITY" : "A",
													"STREET_NUMBER_OR_PO_BOX" : "1",
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when vendor is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID" : "V123",
													"VENDOR_NAME" : "N1",
													"COUNTRY" : "C1",
													"POSTAL_CODE" : "1",
													"REGION" : "A",
													"CITY" : "A",
													"STREET_NUMBER_OR_PO_BOX" : "1",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z"
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a vendor for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"VENDOR_ENTITIES" : [{
																			"VENDOR_NAME" : "N1",
																			"COUNTRY" : "C1",
																			"POSTAL_CODE" : "1",
																			"REGION" : "A",
																			"CITY" : "A",
																			"STREET_NUMBER_OR_PO_BOX" : "1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});	
		});
	
		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables and views
				mockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed vendor', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID"   : "V2",
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
                expect(oResponseBody.body.masterdata.DELETE.VENDOR_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a vendor for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VENDOR_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("VENDOR_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a vendor that does not exist', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Vendor"
				}];
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"VENDOR_ENTITIES" : [{
													"VENDOR_ID"   : "V123",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z"
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
	}).addTags(["Administration_NoCF_Integration"]);
}