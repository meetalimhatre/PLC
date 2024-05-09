var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;
var ProjectTables		= $.import("xs.db", "persistency-project").Tables;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

var oMaterialAccountDetermination = {
		"CONTROLLING_AREA_ID": "#CA1",
		"MATERIAL_TYPE_ID": "MT2",
		"PLANT_ID": "PL1",
		"VALUATION_CLASS_ID": "V2",
		"ACCOUNT_ID": "11000",
		"_VALID_FROM": "2015-06-19T12:27:23.197Z",
		"_SOURCE": 1,
		"_CREATED_BY": "I305774"
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.materialType-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procRead": "sap.plc.db.administration.procedures/p_material_type_read"
				},
				substituteTables : {
					material: Resources["Material"].dbobjects.plcTable,
					material_type : Resources["Material_Type"].dbobjects.plcTable,
					gtt_material_type: Resources["Material_Type"].dbobjects.tempTable,
					material_type_text : Resources["Material_Type"].dbobjects.plcTextTable,
					gtt_material_type_text : Resources["Material_Type"].dbobjects.tempTextTable,
					material_account_determination : Resources["Material_Account_Determination"].dbobjects.plcTable,
					account : Resources["Account"].dbobjects.plcTable,
					plant : Resources["Plant"].dbobjects.plcTable,
					company_code : Resources["Company_Code"].dbobjects.plcTable,
					valuation_class : Resources["Valuation_Class"].dbobjects.plcTable,
					project_material_price_surcharges: ProjectTables.project_material_price_surcharges,	
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Material_Type"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Material_Type": procedureXsunit
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
				mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("material_type_text", testData.oMaterialTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid material types and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(2);
			});
	
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				},{
				    name : "filter",
				    value : "MATERIAL_TYPE_ID=MT2"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_TEXT_ENTITIES.length).toBe(1);
			});
			
			it('should return the valid filtered entries using search autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				},{
				    name : "filter",
				    value : "MATERIAL_TYPE_ID=MT2"
				},{
				    name : "searchAutocomplete",
				    value : "M"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES[0]).toMatchData(
        	                    {'MATERIAL_TYPE_ID': 'MT2',
        	                     'MATERIAL_TYPE_DESCRIPTION' : null,
                                '_SOURCE': 1
                                }, ['MATERIAL_TYPE_ID']);
			});
			
			it('should not return entries if search autocomplete does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				},{
				    name : "filter",
				    value : "MATERIAL_TYPE_ID=MT2"
				},{
				    name : "searchAutocomplete",
				    value : "X"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(0);
			});
	
			it('should not return any entries for an invalid material type (filter)', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				},{
				    name : "filter",
				    value : "MATERIAL_TYPE_ID=MMM"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.MATERIAL_TYPE_TEXT_ENTITIES.length).toBe(0);
			});
		});
	
		describe ("remove", function (){
			var aParams = [ {
				name : "business_object",
				value : "Material_Type"
			}];
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("material_type_text", testData.oMaterialTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed material type', function() {
				// arrange
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
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
                expect(oResponseBody.body.masterdata.DELETE.MATERIAL_TYPE_ENTITIES[0]._VALID_TO).not.toBe(null);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material type for which mandatory fields are missing', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													//						"MATERIAL_TYPE_ID" : ""
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_TYPE_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a material type that does not exist or is not valid', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT1",
													"_VALID_FROM" : "2015-03-01T15:39:09.691Z"
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material type which is used in other business objects', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				mockstar.insertTableData("material_account_determination", oMaterialAccountDetermination);
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.MaterialAccountDetermination);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material type used in project material price surcharges', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : testData.oProjectMaterialPriceSurcharges.MATERIAL_TYPE_ID[0],
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				mockstar.insertTableData("project_material_price_surcharges",  testData.oProjectMaterialPriceSurcharges);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectMaterialPriceSurcharges);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
		});
	
		describe ("insert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("material_type_text", testData.oMaterialTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert material_type and material_type_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{material_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{material_type_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1"
												},{
													"MATERIAL_TYPE_ID" : "MAT1"
												}],
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 DE",
													"LANGUAGE":"DE"
												},{
													"MATERIAL_TYPE_ID" : "MAT1",
													"MATERIAL_TYPE_DESCRIPTION":"Test2 EN",
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{material_type}}");
				var oTestText = mockstar.execQuery("select * from {{material_type_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTesta.columns.MATERIAL_TYPE_ID.rows.length + 2);
				expect(oTestText.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_TYPE_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_TYPE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.MATERIAL_TYPE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a material type that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 DE",
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
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a material type that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2"
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a material type text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"MATERIAL_TYPE_DESCRIPTION" : "Material type description",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material type for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													//						"MATERIAL_TYPE_ID" : "",
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_TYPE_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});			
		});
	
		describe ("upsert", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("material_type_text", testData.oMaterialTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert material_type and material_type_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{material_type}}");
				var oTestTexta = mockstar.execQuery("select * from {{material_type_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1"
												},{
													"MATERIAL_TYPE_ID" : "MAT1"
												}],
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 DE",
													"LANGUAGE":"DE"
												},{
													"MATERIAL_TYPE_ID" : "MAT1",
													"MATERIAL_TYPE_DESCRIPTION":"Test2 EN",
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{material_type}}");
				var oTestText = mockstar.execQuery("select * from {{material_type_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTesta.columns.MATERIAL_TYPE_ID.rows.length + 2);
				expect(oTestText.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_TYPE_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_TYPE_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.MATERIAL_TYPE_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a material type that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_TYPE_ID" : "INS1",
													"MATERIAL_TYPE_DESCRIPTION":"Test1 DE",
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a material type for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_TYPE_ENTITIES": [{
													//						"MATERIAL_TYPE_ID" : "",
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_TYPE_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});		
			
			it('should deactivate the current version of the upserted material type text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"MATERIAL_TYPE_DESCRIPTION" : "Updated material type description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestText = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_TYPE_ID.rows.length);
				expect(oTestText.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_TYPE_ID.rows.length + 1);
			});
		});
		
		describe ("update", function (){
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
				mockstar.insertTableData("material_type_text", testData.oMaterialTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated material type text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"MATERIAL_TYPE_DESCRIPTION" : "Updated material type description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestText = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_TYPE_ID.rows.length + 1);
				expect(oTestText.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_TYPE_ID.rows.length + 1);
			});
	
			it('should deactivate the current version of the updated material type and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"MATERIAL_TYPE_DESCRIPTION" : "Updated material type description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_type}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				var oTestText = mockstar.execQuery("select * from {{material_type_text}} WHERE MATERIAL_TYPE_ID = 'MT2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_TYPE_ID.rows.length);
				//expect(oTestText.columns.MATERIAL_TYPE_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_TYPE_ID.rows.length + 1);
			});
				
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material type text and the material type text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z",
													"MATERIAL_TYPE_DESCRIPTION" : "Updated material type description",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a material type text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Type"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_TYPE_TEXT_ENTITIES": [{
													"MATERIAL_TYPE_ID" : "MT2",
													"MATERIAL_TYPE_DESCRIPTION" : "Updated material type description",
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
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}