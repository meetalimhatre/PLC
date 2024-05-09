var testData         = require("../../../../testdata/testdata").data;
var mockstar_helpers = require("../../../../testtools/mockstar_helpers");
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
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
var TestDataUtility          = require("../../../../testtools/testDataUtility").TestDataUtility;
var _ = require("lodash");

describe('xsjs.db.administration.factory.material-integrationtests', function() {

	
	var originalProcedures = null;
	var mockstar = null;
	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function() {

		mockstar = new MockstarFacade({ // Initialize Mockstar
			testmodel : {
				"procRead": "sap.plc.db.administration.procedures/p_material_read"
			},
			substituteTables : {
				material : Resources["Material"].dbobjects.plcTable,
				gtt_material : Resources["Material"].dbobjects.tempTable,
				material_text : Resources["Material"].dbobjects.plcTextTable,
				gtt_material_text : Resources["Material"].dbobjects.tempTextTable,
				material_plant : Resources["Material_Plant"].dbobjects.plcTable,
				material_price : Resources["Material_Price"].dbobjects.plcTable,
				material_type : Resources["Material_Type"].dbobjects.plcTable,
				material_group : Resources["Material_Group"].dbobjects.plcTable,
				language : {
					name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
					data : testData.oLanguage
				},
				metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes : {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				},
				session : {
					name : "sap.plc.db::basis.t_session",
					data : testData.oSessionTestData
				},
				material_ext : "sap.plc.db::basis.t_material_ext"
			},
			csvPackage : testData.sCsvPackage
		});			

		if (!mockstar.disableMockstar) {
            var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Material"];
            originalProcedures = MasterdataReadProcedures;
            MasterdataReadProcedures = Object.freeze({
            	"Material": procedureXsunit
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
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should return valid materials and texts', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
			var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(9);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should return valid materials with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material"
				} ];
				var aExpectedMaterialsExtPlc = [];
				
				var oMaterials = new TestDataUtility(testData.oMaterialTestDataPlc).build();
				var aMaterials = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oMaterials);
				var aExpectedMaterials = _.filter(aMaterials, function(oMaterial) {
				    return (oMaterial._VALID_TO === null);
			    }); 
				var oExpectedMaterial = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedMaterials);
				
				var oMaterialsExt = new TestDataUtility(testData.oMaterialExtTestDataPlc).build();
				var aMaterialsExt = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oMaterialsExt);
				
				_.each(aExpectedMaterials, function(oMataterial){
				    var aExpectedMaterialExtPart = _.filter(aMaterialsExt, function(oMaterialExt){
				        return (oMaterialExt.MATERIAL_ID === oMataterial.MATERIAL_ID && oMaterialExt._VALID_FROM === oMataterial._VALID_FROM);
				    }) ;
				    aExpectedMaterialsExtPlc = _.union(aExpectedMaterialsExtPlc, aExpectedMaterialExtPart);
				});

				var oExpectedExtMaterial = _.pick(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedMaterialsExtPlc),"CMAT_STRING_MANUAL","CMAT_STRING_UNIT");
				var iLenDif = aExpectedMaterials.length - aExpectedMaterialsExtPlc.length;
				for(var i = 0; i < iLenDif; i++){
				    oExpectedExtMaterial.CMAT_STRING_MANUAL.push(null);
				    oExpectedExtMaterial.CMAT_STRING_UNIT.push(null);
				}
				
				oExpectedMaterial = _.extend(oExpectedMaterial, oExpectedExtMaterial);
				 
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
	            var returnedResult = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(oResponseBody.body.masterdata.MATERIAL_ENTITIES);
	            expect(returnedResult).toMatchData(oExpectedMaterial, ["MATERIAL_ID","_VALID_FROM"]);
			});
		}

		it('should return the valid filtered entries', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "filter",
			    value : "MATERIAL_ID=MAT7"
			} ];
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).not.toBe(null);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(1);
			expect(oResponseBody.body.masterdata.MATERIAL_TEXT_ENTITIES.length).toBe(1);
		});

		it('should return the valid filtered entries - case insensitive', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "filter",
			    value : "MATERIAL_ID=MAT7"
			} ];

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(1);
			expect(oResponseBody.body.masterdata.MATERIAL_TEXT_ENTITIES.length).toBe(1);
		});
		
		it('should return the valid materials that start with the string from autocomplete and are filtered', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "searchAutocomplete",
			    value : "MAT"
			}, {
				name : "filter",
			    value : "MATERIAL_TYPE_ID=%2%"
			}];

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(1);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES).toMatchData({
			   MATERIAL_ID: [testData.oMaterialTestDataPlc.MATERIAL_ID[1]],
			   MATERIAL_GROUP_ID: [testData.oMaterialTestDataPlc.MATERIAL_GROUP_ID[1]],
			   MATERIAL_TYPE_ID: [testData.oMaterialTestDataPlc.MATERIAL_TYPE_ID[1]]
			}, ["MATERIAL_ID"]);
		});
		
		it('should not return duplicate entries when multiple filteres are used', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "searchAutocomplete",
			    value : "MAT"
			}, {
				name : "filter",
			    value : "MATERIAL_TYPE_ID=%MT%&MATERIAL_GROUP_ID=%MG%"
			}];

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(2);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES).toMatchData({
			   MATERIAL_ID: [testData.oMaterialTestDataPlc.MATERIAL_ID[0], testData.oMaterialTestDataPlc.MATERIAL_ID[1]],
			   MATERIAL_GROUP_ID: [testData.oMaterialTestDataPlc.MATERIAL_GROUP_ID[0], testData.oMaterialTestDataPlc.MATERIAL_GROUP_ID[1]],
			   MATERIAL_TYPE_ID: [testData.oMaterialTestDataPlc.MATERIAL_TYPE_ID[0], testData.oMaterialTestDataPlc.MATERIAL_TYPE_ID[1]]
			}, ["MATERIAL_ID"]);
		});

		it('should not return any entries for an invalid material (filter)', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "filter",
			    value : "MATERIAL_ID=MM"
			} ];

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).not.toBe(null);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(0);
			expect(oResponseBody.body.masterdata.MATERIAL_TEXT_ENTITIES.length).toBe(0);
		});
		
	    it('should return all entries that have material group id different then the one passed in filter when option "not in" is used', function(){
	       //arrange
	       var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "filter",
			    value : "MATERIAL_GROUP_ID!=MG3"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).not.toBe(null);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(9);
			expect(oResponseBody.body.masterdata.MATERIAL_TEXT_ENTITIES.length).toBe(6);
			_.each(oResponseBody.body.masterdata.MATERIAL_ENTITIES, (material) => {
			    expect(material.MATERIAL_GROUP_ID).not.toMatch("MG3");
			});
	    });
	    
	    it('should return all entries that have  IS_PHANTOM_MATERIAL different then the one passed in filter when option "not in" is used', function(){
	       //arrange
	       var aParams = [ {
				name : "business_object",
				value : "Material"
			},{
			    name : "filter",
			    value : "IS_PHANTOM_MATERIAL!=1"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            // assert
            expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).not.toBe(null);
			expect(oResponseBody.body.masterdata.MATERIAL_ENTITIES.length).toBe(8);
			expect(oResponseBody.body.masterdata.MATERIAL_TEXT_ENTITIES.length).toBe(4);
			_.each(oResponseBody.body.masterdata.MATERIAL_ENTITIES, (material) => {
			    expect(material.IS_PHANTOM_MATERIAL).not.toBe(1);
			});
	    });
	});

	describe ("remove", function (){
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.insertTableData("material_plant", testData.oMaterialPlantTestDataPlc);
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			}
			mockstar.initializeData();
		});

		it('should deactivate materials', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"DELETE":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : "MAT5",
												"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
											}]
                				        }
                				};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.DELETE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.DELETE.MATERIAL_ENTITIES[0]._VALID_TO).not.toBe(null);
            expect(oTestBefore._VALID_TO[0]).toBe(null);
            expect(oTestAfter._VALID_TO[0]).not.toBe(null);
            expect(mockstar_helpers.getRowCount(mockstar, "material")).toBe(iTestBefore);
            if(jasmine.plcTestRunParameters.generatedFields === true){
                expect(mockstar_helpers.getRowCount(mockstar, "material_ext")).toBe(iTestExtBefore);
            }
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"DELETE":
                				       { 
											"MATERIAL_ENTITIES": [{
												//						"MATERIAL_ID" : ""
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
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_ID");		
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});	
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material for which mandatory fields are null', function() {
			// arrange
			let aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			let oItemsPayload = {"DELETE":
                				       { 
											"MATERIAL_ENTITIES": [{
    											"MATERIAL_ID" : null,
    											"_VALID_FROM" : null
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
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_ID");		
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.VALUE_ERROR);
		});	

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a material that does not exist/it is not valid', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"DELETE":
		       { 
					"MATERIAL_ENTITIES" : [{
						"MATERIAL_ID" : "MAT4",
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

		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a material which is used in other business objects', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"DELETE":
		       { 
					"MATERIAL_ENTITIES" : [{
						"MATERIAL_ID" : "MAT1",
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
			expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.MaterialPlant);		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
		});
	});

	describe ("insert", function (){	
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should insert material and material texts', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oTesta = mockstar.execQuery("select * from {{material}}");
			var oTestTexta = mockstar.execQuery("select * from {{material_text}}");
			
			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : "INS1"
											},{
												"MATERIAL_ID" : "INS2"
											}],
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 EN",
												"LANGUAGE":"EN"
											},{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 DE",
												"LANGUAGE":"DE"
											},{
												"MATERIAL_ID" : "INS2",
												"MATERIAL_DESCRIPTION":"Test2 EN",
												"LANGUAGE":"EN"
											}]
                				       }
			};
		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{material}}");
			var oTestText = mockstar.execQuery("select * from {{material_text}}");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.MATERIAL_ID.rows.length).toBe(oTesta.columns.MATERIAL_ID.rows.length+2);
			expect(oTestText.columns.MATERIAL_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_ID.rows.length+3);
			expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.MATERIAL_TEXT_ENTITIES[0]._VALID_FROM);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert material with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_ext");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"MATERIAL_ENTITIES": [{
													"MATERIAL_ID" : "INS1",
													"CMAT_STRING_MANUAL" : "test"
												},{
													"MATERIAL_ID" : "INS2"
												}]
                    				       }
				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                                
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "material")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "material_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.MATERIAL_ENTITIES[0].CMAT_STRING_MANUAL).toBe(oTestExt.CMAT_STRING_MANUAL[0]);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material that has a unit for a custom field that does not allow units', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material"
				}];

				var oItemsPayload = {"CREATE":
	                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : 'INS1',
												"CMAT_STRING_UNIT" : 'EUR'
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CMAT_STRING_UNIT");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
		}

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (material group) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			var oItemsPayload = {"CREATE":
		       { 
					"MATERIAL_ENTITIES": [{
						"MATERIAL_ID" : 'INS1',
						"MATERIAL_GROUP_ID" : 'MGGG'
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
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.MaterialGroup);
		});
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a material that does not exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 EN",
												"LANGUAGE":"EN"
											},{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 DE",
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
		
		it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a material that already exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : 'MAT1',
												"MATERIAL_TYPE_ID" : 'MT2'
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
		
		it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a material text that already exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"MATERIAL_DESCRIPTION" : "Description",
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
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a material for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
				"MATERIAL_ENTITIES": [{
											"MATERIAL_TYPE_ID" : 'MT1'
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
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_ID");			
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
	});
	
	describe ("upsert", function (){	
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			}
			mockstar.initializeData();
		});

		it('should insert material and material texts', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oTesta = mockstar.execQuery("select * from {{material}}");
			var oTestTexta = mockstar.execQuery("select * from {{material_text}}");
			
			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : "INS1"
											},{
												"MATERIAL_ID" : "INS2"
											}],
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 EN",
												"LANGUAGE":"EN"
											},{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 DE",
												"LANGUAGE":"DE"
											},{
												"MATERIAL_ID" : "INS2",
												"MATERIAL_DESCRIPTION":"Test2 EN",
												"LANGUAGE":"EN"
											}]
                				       }
			};
		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{material}}");
			var oTestText = mockstar.execQuery("select * from {{material_text}}");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.MATERIAL_ID.rows.length).toBe(oTesta.columns.MATERIAL_ID.rows.length+2);
			expect(oTestText.columns.MATERIAL_ID.rows.length).toBe(oTestTexta.columns.MATERIAL_ID.rows.length+3);
			expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.MATERIAL_TEXT_ENTITIES[0]._VALID_FROM);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert material with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Material"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_ext");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"MATERIAL_ENTITIES": [{
													"MATERIAL_ID" : "INS1",
													"CMAT_STRING_MANUAL" : "test"
												},{
													"MATERIAL_ID" : "INS2"
												}]
                    				       }
				};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                                
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}'`));
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "material")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "material_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0].CMAT_STRING_MANUAL).toBe(oTestExt.CMAT_STRING_MANUAL[0]);
			});
		}
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (material group) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			var oItemsPayload = {"UPSERT":
		       { 
					"MATERIAL_ENTITIES": [{
						"MATERIAL_ID" : 'INS1',
						"MATERIAL_GROUP_ID" : 'MGGG'
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
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.MaterialGroup);
		});
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a material that does not exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 EN",
												"LANGUAGE":"EN"
											},{
												"MATERIAL_ID" : "INS1",
												"MATERIAL_DESCRIPTION":"Test1 DE",
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
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a material for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
										"MATERIAL_ENTITIES": [{
											"MATERIAL_TYPE_ID" : 'MT1'
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
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("MATERIAL_ID");			
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
		
		it('should deactivate the current version of the upserted material text and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			var oTestMainBefore = mockstar.execQuery("select * from {{material}} WHERE MATERIAL_ID = 'MAT1'");
			var oTestTextBefore = mockstar.execQuery("select * from {{material_text}} WHERE MATERIAL_ID = 'MAT1'");
			
			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"MATERIAL_DESCRIPTION" : "Updated plant description",
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			var oTestMain =  mockstar.execQuery("select * from {{material}} WHERE MATERIAL_ID = 'MAT1'");
			var oTestText =  mockstar.execQuery("select * from {{material_text}} WHERE MATERIAL_ID = 'MAT1'");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTestMain.columns.MATERIAL_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_ID.rows.length);
			expect(oTestText.columns.MATERIAL_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_ID.rows.length + 1);
		});
		
		it('should deactivate the current version of the upserted material and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"UPSERT":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : "MAT4",
												"IS_PHANTOM_MATERIAL" : 1
											}]
                				        }
                				};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_TO is null`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.UPSERT.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.UPSERT.MATERIAL_ENTITIES[0]._VALID_TO).toBe(null);
            expect(oTestAfter.IS_PHANTOM_MATERIAL[0]).not.toBe(oTestBefore.IS_PHANTOM_MATERIAL[0]);
            expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
            expect(mockstar_helpers.getRowCount(mockstar, "material")).toBe(iTestBefore+1);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	//oTestExtAfter.CMAT_STRING_MANUAL[0] will be empty if it's not set in the request
            	expect(oTestExtAfter.CMAT_STRING_MANUAL[0]).not.toBe(oTestExtBefore.CMAT_STRING_MANUAL[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
                expect(mockstar_helpers.getRowCount(mockstar, "material_ext")).toBe(iTestExtBefore+1);
            }
		});
		
		it("should throw an error (GENERAL_VALIDATION_ERROR) when try to upsert a material copied from ERP", function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oMaterialTestDataErp = {
					"MATERIAL_ID" : ['UPS1'],
					"IS_PHANTOM_MATERIAL" : [1],
			        "IS_CONFIGURABLE_MATERIAL" : [1],
			        "MATERIAL_TYPE_ID" : ["MT1"],
			        "MATERIAL_GROUP_ID" : ["MG1"],
					"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
					"_VALID_TO" : [null, ],
					"_SOURCE" : [2],
					"_CREATED_BY" :['U000001']
			};

			var oMaterialTextTestDataErp = {
					"MATERIAL_ID" : ['UPS1'],
					"LANGUAGE" : ['EN'],
					"MATERIAL_DESCRIPTION" : ['Material MAT1 EN'],
					"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
					"_VALID_TO" : [null],
					"_SOURCE" : [2],
					"_CREATED_BY" : ['U000001']
			};
			
			//insert the entries having source ERP
			mockstar.insertTableData("material", oMaterialTestDataErp);
			mockstar.insertTableData("material_text", oMaterialTextTestDataErp);

			var oItemsPayload = {"UPSERT":
								      { 
										"MATERIAL_ENTITIES": [{
											"MATERIAL_ID" : "UPS1",
											"IS_PHANTOM_MATERIAL" : 1
										}],
										"MATERIAL_TEXT_ENTITIES": [{
											"MATERIAL_ID" : "UPS1",
											"MATERIAL_DESCRIPTION":"Test1 EN",
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
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);	
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.SOURCE_ERP);
			expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);	
			expect(oResponseBody.head.messages[1].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.SOURCE_ERP);
		});
		
		it("should throw an error (GENERAL_VALIDATION_ERROR) when try to upsert a material text copied from ERP", function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oMaterialTestDataErp = {
					"MATERIAL_ID" : ['UPS1'],
					"IS_PHANTOM_MATERIAL" : [1],
			        "IS_CONFIGURABLE_MATERIAL" : [1],
			        "MATERIAL_TYPE_ID" : ["MT1"],
			        "MATERIAL_GROUP_ID" : ["MG1"],
					"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
					"_VALID_TO" : [null, ],
					"_SOURCE" : [1],
					"_CREATED_BY" :['U000001']
			};

			var oMaterialTextTestDataErp = {
					"MATERIAL_ID" : ['UPS1'],
					"LANGUAGE" : ['EN'],
					"MATERIAL_DESCRIPTION" : ['Material MAT1 EN'],
					"_VALID_FROM" : ['2015-01-01T15:39:09.691Z'],
					"_VALID_TO" : [null],
					"_SOURCE" : [2],
					"_CREATED_BY" : ['U000001']
			};
			
			//insert the entries having source ERP
			mockstar.insertTableData("material", oMaterialTestDataErp);
			mockstar.insertTableData("material_text", oMaterialTextTestDataErp);

			var oItemsPayload = {"UPSERT":
								      { 
										"MATERIAL_ENTITIES": [],
										"MATERIAL_TEXT_ENTITIES": [{
											"MATERIAL_ID" : "UPS1",
											"MATERIAL_DESCRIPTION":"Test1 EN",
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
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);	
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.SOURCE_ERP);
		});
	});

	describe ("update", function (){
		
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			mockstar.insertTableData("material_text", testData.oMaterialTextTestDataPlc);
			mockstar.insertTableData("material_group", testData.oCompanyCodeMaterialGroupTestDataPlc);
			mockstar.insertTableData("material_type", testData.oCompanyCodeMaterialTypeTestDataPlc);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			}
			mockstar.initializeData();
		});
		
		it('should deactivate the current version of the updated material and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_ENTITIES": [{
												"MATERIAL_ID" : "MAT4",
												"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
												"IS_PHANTOM_MATERIAL" : 1
											}]
                				        }
                				};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "material");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "material_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{material}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_TO is null`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{material_ext}} where MATERIAL_ID = '${oItemsPayload.UPDATE.MATERIAL_ENTITIES[0].MATERIAL_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.UPDATE.MATERIAL_ENTITIES[0]._VALID_TO).toBe(null);
            expect(oTestAfter.IS_PHANTOM_MATERIAL[0]).not.toBe(oTestBefore.IS_PHANTOM_MATERIAL[0]);
            expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
            expect(mockstar_helpers.getRowCount(mockstar, "material")).toBe(iTestBefore+1);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	//oTestExtAfter.CMAT_STRING_MANUAL[0] will be empty if it's not set in the request
            	expect(oTestExtAfter.CMAT_STRING_MANUAL[0]).not.toBe(oTestExtBefore.CMAT_STRING_MANUAL[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
                expect(mockstar_helpers.getRowCount(mockstar, "material_ext")).toBe(iTestExtBefore+1);
            }
		});

		it('should deactivate the current version of the updated material text and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			var oTestMainBefore = mockstar.execQuery("select * from {{material}} WHERE MATERIAL_ID = 'MAT1'");
			var oTestTextBefore = mockstar.execQuery("select * from {{material_text}} WHERE MATERIAL_ID = 'MAT1'");
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
												"MATERIAL_DESCRIPTION" : "Updated plant description",
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			var oTestMain =  mockstar.execQuery("select * from {{material}} WHERE MATERIAL_ID = 'MAT1'");
			var oTestText =  mockstar.execQuery("select * from {{material_text}} WHERE MATERIAL_ID = 'MAT1'");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTestMain.columns.MATERIAL_ID.rows.length).toBe(oTestMainBefore.columns.MATERIAL_ID.rows.length);
			expect(oTestText.columns.MATERIAL_ID.rows.length).toBe(oTestTextBefore.columns.MATERIAL_ID.rows.length + 1);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a material text for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"MATERIAL_DESCRIPTION" : "Updated plant description",
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
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material text and the material is not available in system', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"_VALID_FROM" : "2015-05-01T15:39:09.691Z",
												"MATERIAL_DESCRIPTION" : "Updated plant description",
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
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a material text and the material text is not available in system', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Material"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"MATERIAL_TEXT_ENTITIES": [{
												"MATERIAL_ID" : "MAT1",
												"_VALID_FROM" : "2015-05-01T15:39:09.691Z",
												"MATERIAL_DESCRIPTION" : "Updated plant description",
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
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);