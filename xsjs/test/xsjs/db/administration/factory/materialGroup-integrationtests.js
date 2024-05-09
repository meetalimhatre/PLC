var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var ProjectTables		= $.import("xs.db", "persistency-project").Tables;
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
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

var oMaterialTestDataPlc = {
		"MATERIAL_ID" : ['MAT1'],
		"MATERIAL_GROUP_ID": ['MG3'],
		"IS_PHANTOM_MATERIAL" : [1],
		"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
		"_VALID_TO" : [null],
		"_SOURCE" : [1],
		"_CREATED_BY" :['U000001']
};

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.materialGroup-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procRead": "sap.plc.db.administration.procedures/p_material_group_read"
				},
				substituteTables : {
					material_group : Resources["Material_Group"].dbobjects.plcTable,
					gtt_material_group: Resources["Material_Group"].dbobjects.tempTable,
					material_group_text : Resources["Material_Group"].dbobjects.plcTextTable,
					gtt_material_group_text : Resources["Material_Group"].dbobjects.tempTextTable,
					material : Resources["Material"].dbobjects.plcTable,
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
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Material_Group"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Material_Group": procedureXsunit
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
				mockstar.insertTableData("material_group", testData.oMaterialGroupTestDataPlc);
				mockstar.insertTableData("material_group_text", testData.oMaterialGroupTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid material groups and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES.length).toBe(2);
			});
			
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				},{
				    name : "filter",
				    value : "MATERIAL_GROUP_ID=MG2"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES.length).toBe(1);
			});
			
			it('should return the valid entries using searchAutocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				},{
				    name : "filter",
				    value : "MATERIAL_GROUP_ID=MG2"
				},{
				    name : "searchAutocomplete",
				    value : "M"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES[0]).toMatchData(
        	                    {'MATERIAL_GROUP_ID': 'MG2',
        	                     'MATERIAL_GROUP_DESCRIPTION' : null,
                                '_SOURCE': 1
                                }, ['MATERIAL_GROUP_ID']);
			});
	
			it('should not return any entries for an invalid material group (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				},{
				    name : "filter",
				    value : "MATERIAL_GROUP_ID=GGG"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES.length).toBe(0);
			});
			
		it('should not return any entries using searchAutocomplete that does not match the data', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				},{
				    name : "filter",
				    value : "MATERIAL_GROUP_ID=MG2"
				},{
				    name : "searchAutocomplete",
				    value : "X"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.MATERIAL_GROUP_ENTITIES.length).toBe(0);
			});
		});

		describe ("remove", function (){
			var aParams = [ {
				name : "business_object",
				value : "Material_Group"
			}];
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("material", oMaterialTestDataPlc);
				mockstar.insertTableData("material_group", testData.oMaterialGroupTestDataPlc);
				mockstar.insertTableData("material_group_text", testData.oMaterialGroupTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the removed material group', function() {
				// arrange
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
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
                expect(oResponseBody.body.masterdata.DELETE.MATERIAL_GROUP_ENTITIES[0]._VALID_TO).not.toBe(null);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material group which is used in other business objects', function() {
				// arrange			
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG3",
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
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.Material);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material group used in project material price surcharges', function() {
				// arrange
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : testData.oProjectMaterialPriceSurcharges.MATERIAL_GROUP_ID[0],
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material group for which mandatory fields are missing', function() {
				// arrange
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													//						"MATERIAL_GROUP_ID" : ""
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_GROUP_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a material group that does not exist', function() {
				// arrange
				var oItemsPayload = {"DELETE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "M123",
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
				mockstar.insertTableData("material_group", testData.oMaterialGroupTestDataPlc);
				mockstar.insertTableData("material_group_text", testData.oMaterialGroupTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert material_group and material_group_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{material_group}}");
				var oTestTexta = mockstar.execQuery("select * from {{material_group_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1"
												},{
													"MATERIAL_GROUP_ID" : "INS2"
												}],
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 DE",
													"LANGUAGE":"DE"
												},{
													"MATERIAL_GROUP_ID" : "INS2",
													"MATERIAL_GROUP_DESCRIPTION":"Test2 EN",
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{material_group}}");
				var oTestText = mockstar.execQuery("select * from {{material_group_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTesta.columns.MATERIAL_GROUP_ID.rows.length + 2);
				expect(oTestText.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_GROUP_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_GROUP_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.MATERIAL_GROUP_TEXT_ENTITIES[0]._VALID_FROM);
			});	
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a material group that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 DE",
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
	
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a material group that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a material group text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"MATERIAL_GROUP_DESCRIPTION" : "Material group description",
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

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material group for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													//						"MATERIAL_GROUP_ID" : "",
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_GROUP_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});

		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("material_group", testData.oMaterialGroupTestDataPlc);
				mockstar.insertTableData("material_group_text", testData.oMaterialGroupTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert material_group and material_group_text', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{material_group}}");
				var oTestTexta = mockstar.execQuery("select * from {{material_group_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1"
												},{
													"MATERIAL_GROUP_ID" : "INS2"
												}],
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 DE",
													"LANGUAGE":"DE"
												},{
													"MATERIAL_GROUP_ID" : "INS2",
													"MATERIAL_GROUP_DESCRIPTION":"Test2 EN",
													"LANGUAGE":"EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{material_group}}");
				var oTestText = mockstar.execQuery("select * from {{material_group_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTesta.columns.MATERIAL_GROUP_ID.rows.length + 2);
				expect(oTestText.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_GROUP_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_GROUP_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.MATERIAL_GROUP_TEXT_ENTITIES[0]._VALID_FROM);
			});	
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a material group that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 EN",
													"LANGUAGE":"EN"
												},{
													"MATERIAL_GROUP_ID" : "INS1",
													"MATERIAL_GROUP_DESCRIPTION":"Test1 DE",
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

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a material group for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_GROUP_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should deactivate the current version of the upserted material group text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"MATERIAL_GROUP_DESCRIPTION" : "Updated material group description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestText = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_GROUP_ID.rows.length + 1);
			});
		});
		
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("material_group", testData.oMaterialGroupTestDataPlc);
				mockstar.insertTableData("material_group_text", testData.oMaterialGroupTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated material group text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"MATERIAL_GROUP_DESCRIPTION" : "Updated material group description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestText = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_GROUP_ID.rows.length + 1);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material group text and the material group is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z",
													"MATERIAL_GROUP_DESCRIPTION" : "Updated material group description",
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
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material group text and the material group text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z",
													"MATERIAL_GROUP_DESCRIPTION" : "Updated material group description",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a material group text for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_GROUP_TEXT_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"MATERIAL_GROUP_DESCRIPTION" : "Updated material group description",
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
	
			it('should deactivate the current version of the updated material group and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material_Group"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestTextBefore = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"MATERIAL_GROUP_ENTITIES": [{
													"MATERIAL_GROUP_ID" : "MG2",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{material_group}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				var oTestText = mockstar.execQuery("select * from {{material_group_text}} WHERE MATERIAL_GROUP_ID = 'MG2'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestText.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_GROUP_ID.rows.length);
				expect(oTestMain.columns.MATERIAL_GROUP_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_GROUP_ID.rows.length+1);
			});
		});
	}).addTags(["Administration_NoCF_Integration"]);
}