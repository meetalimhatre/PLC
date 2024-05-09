var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testdata = require("../../testdata/testdata").data;

var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var Code = MessageLibrary.Code;

var PersistencyMiscImport = require("../../../lib/xs/db/persistency-misc");
var mTableNamesMisc = PersistencyMiscImport.Tables;

var PersistencyMetadataImport = require("../../../lib/xs/db/persistency-metadata");
var mTableNamesMeta = PersistencyMetadataImport.Tables;

var AdministrationValidatorLibrary = $.import("xs.validator", "administrationValidator");
var AdministrationValidator = AdministrationValidatorLibrary.AdministrationValidator;
var MetadataProvider = require("../../../lib/xs/metadata/metadataProvider").MetadataProvider;
var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;

var PersistencyImport = $.import("xs.db", "persistency"); 

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.validator.administrationValidator-integrationtests', function() {
		var oMockstar = null;
		
		var oAdministrationValidator = null;
		
		var oMetadataProvider = new MetadataProvider();
		var oAdministrationUtils = new BusinessObjectValidatorUtils(BusinessObjectTypes.Administration);
        var sSessionId = testdata.sSessionId;
        
		beforeOnce(function(){
		    oMockstar = new MockstarFacade( // Initialize Mockstar
                {
                    substituteTables: // substitute all used tables in the procedure or view
                    {
                        session: {
                            name : mTableNamesMisc.session,
                            data: testdata.oSessionTestData
                        },
                        metadata:{
                            name: mTableNamesMeta.metadata,
                            data: testdata.mCsvFiles.metadata
                        }, 
                        metadataText: {
                            name: mTableNamesMeta.metadataText,
                            data: testdata.mCsvFilesmetadata_item_attributes
                        },
                        metadataItemAttributes: mTableNamesMeta.metadataItemAttributes,
    					activity_price : Resources["Activity_Price"].dbobjects.plcTable,
                        formula: mTableNamesMeta.formula,
                        regex: {
                            name: "sap.plc.db::basis.t_regex",
                            data: testdata.mCsvFiles.regex
                        }
                    }
                });
        });
		
		beforeEach(function() {
		    oMockstar.clearAllTables();
		    oMockstar.initializeData();
		    
		    var oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
			oAdministrationValidator = new AdministrationValidator(oPersistency, sSessionId, oMetadataProvider, oAdministrationUtils);			
		});
		
		var oBatchObjectInvalid = { 
				"CREATE":{
                        "ACTIVITY_PRICE_ENTITIES" : [{
							"PRICE_SOURCE_ID": "301",
							"CONTROLLING_AREA_ID": '###',
							"COST_CENTER_ID": 'CC2',
							"ACTIVITY_TYPE_ID": "A2",
							"PROJECT_ID": "*",
							"VALID_FROM": "2015-01-01",
							"PRICE_FIXED_PORTION": 111.11,
							"PRICE_VARIABLE_PORTION": 123.45,
							"TRANSACTION_CURRENCY_ID": "TST",
							"PRICE_UNIT": 1,
							"PRICE_UNIT_UOM_ID": "TST",
							"_VALID_FROM": "2015-01-01T00:00:00.000Z"
						}]
				}	
		};
		
		function buildRequest(params){
			params.get = function(sArgument) {
				var value; 
				_.each(this, function(oParameter) {
					if (oParameter.name === sArgument) {
						value = oParameter.value;
					}
				});
				return value;
			};

			var oRequest = {
					queryPath : "administration",
					method : $.net.http.GET,
					parameters : params,
					body : {
						asString : function() {
							return "";
						}
					}
			};
			return oRequest;
		}

		function buildPostRequest(params, oBatchObject){
			params.get = function(sArgument) {
				var value; 
				_.each(this, function(oParameter) {
					if (oParameter.name === sArgument) {
						value = oParameter.value;
					}
				});
				return value;
			};

			var oRequest = {
					queryPath : "administration",
					method : $.net.http.POST,
					parameters : params,
					body : {
						asString : function() {
							return JSON.stringify(oBatchObject);
						}
					}
			};
			return oRequest;
		}
		
		function buildFilterGetRequest(sFilter) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "filter",
				"value" : sFilter
			},
			{
				"name" : "business_object",
				"value" : BusinessObjectTypes.ActivityPrice
			} ];			
			return buildRequest(params);
		}
		
		function buildFilterPostRequest(oBatchObject) {

			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ 
			{
				"name" : "business_object",
				"value" : BusinessObjectTypes.ActivityPrice
			} ];			
			return buildPostRequest(params, oBatchObject);
		}		
		
		describe("check filter parameter", function(){

			it("should pass if filter parameter is valid and operator is '=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "COST_CENTER_ID=dfgh48FGDF";
				//act
				try{
					oAdministrationValidator.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});
			
			it("should NOT pass if filter parameter contains a non existing field", function() {
				///arrange
				var exception = null;
				var sFilter = "NON_EXISTING_FIELD=dfgh48FGDFäöüÄÖÜßA%Aaa#&COST_CENTER_ID=dfgh48FGDFäöüÄÖÜßA%Aaa#";
				//act
				try{
					oAdministrationValidator.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
			    expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});
		
		describe("check HTTP POST body", function(){

			it("should fail if body contains wrong properties on UPDATE, CREATE OR DELETE ", function() {
				///arrange
				var exception = null;
				//act
				try{
					oAdministrationValidator.validate(buildFilterPostRequest(oBatchObjectInvalid), $.net.http.POST);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it("should throw an exception if the id string has a leading whitespace", function() {
				
				// arrange
				var oBatchObject = { 
						"CREATE":{
						    "MATERIAL_ENTITIES":[{
							"MATERIAL_ID" : " #123",
							"MATERIAL_TYPE_ID" : "MT2",
							"IS_PHANTOM_MATERIAL" : 0
						}]
				}};
				var params = [ 
    			{
    				"name" : "business_object",
    				"value" : BusinessObjectTypes.Material
    			} ];			
			    
				var result;
				// act
				result = oAdministrationValidator.validate(buildPostRequest(params, oBatchObject), $.net.http.POST);
				
				// assert
				expect(result.VALIDATION.errors).toBeDefined();
				expect(result.VALIDATION.errors.length).toBe(1);
				expect(result.VALIDATION.errors[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
				expect(result.VALIDATION.errors[0].details.validationObj.validationInfoCode).toEqual(MessageLibrary.ValidationInfoCode.INVALID_CHARACTERS_ERROR);
			});
			
            it("should validate an object that has an id containing multiple spaces", () => {
                let exception = null;
                // arrange
                const oBatchObject = {
                    CREATE: {
                        MATERIAL_ENTITIES: [{
                            MATERIAL_ID: "I      D",
                        }],
                    },
                };
                const params = [{
                    name: "business_object",
                    value: BusinessObjectTypes.Material,
                }];

                try {
                    oAdministrationValidator.validate(buildPostRequest(params, oBatchObject), $.net.http.POST);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception).toBe(null);
            });

            it("should fail to validate an object that has an id ending with spaces", () => {
                // arrange
                const oBatchObject = {
                    CREATE: {
                        MATERIAL_ENTITIES: [{
                            MATERIAL_ID: "ID  ",
                        }],
                    },
                };
                const params = [
                    {
                        name: "business_object",
                        value: BusinessObjectTypes.Material,
                    }];
                // act
                const result = oAdministrationValidator.validate(buildPostRequest(params, oBatchObject), $.net.http.POST);

                // assert
                expect(result.VALIDATION.errors).toBeDefined();
                expect(result.VALIDATION.errors.length).toBe(1);
                expect(result.VALIDATION.errors[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
                expect(result.VALIDATION.errors[0].details.validationObj.validationInfoCode).toEqual(MessageLibrary.ValidationInfoCode.INVALID_CHARACTERS_ERROR);
            });

			it("should not validate text entities on UPSERT if main entity was invalidated", function() {
				
				// arrange
				var oBatchObject = { 
						"CREATE":{},
						"UPDATE":{},
						"UPSERT":{
							"ACTIVITY_TYPE_ENTITIES": [{
								 "ACTIVITY_TYPE_ID": "TEST_MDC",
								 "CONTROLLING_AREA_ID": "MDC",
								 "ACCOUNT_ID": "1234"
								}
							],
							"ACTIVITY_TYPE_TEXT_ENTITIES": [{
								 "ACTIVITY_TYPE_DESCRIPTION": "TEST_MDC EN",
								 "ACTIVITY_TYPE_ID": "TEST_MDC",
								 "CONTROLLING_AREA_ID": "MDC",
								 "LANGUAGE": "EN"
								},
								{
								 "ACTIVITY_TYPE_DESCRIPTION": "TEST_MDC DE",
								 "ACTIVITY_TYPE_ID": "TEST_MDC",
								 "CONTROLLING_AREA_ID": "MDC",
								 "LANGUAGE": "DE"
								}
							]
						},
						"DELETE":{}
				};
				var params = [{
					"name" : "ignoreBadData",
					"value" : true
				},
				{
					"name" : "business_object",
					"value" : BusinessObjectTypes.ActivityType
				}];				
			    
				var result;
				// act
				result = oAdministrationValidator.validate(buildPostRequest(params, oBatchObject), $.net.http.POST);
				
				// assert
				expect(result.VALIDATION.errors).toBeDefined();
				expect(result.VALIDATION.errors.length).toBe(3);
				expect(result.VALIDATION.errors[0].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(result.VALIDATION.errors[1].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(result.VALIDATION.errors[2].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it("should not validate text entities on CREATE if main entity was invalidated", function() {
				
				// arrange
				var oBatchObject = { 
						"CREATE":{
							"ACTIVITY_TYPE_ENTITIES": [{
								"ACTIVITY_TYPE_ID": "TEST_MDC",
								"CONTROLLING_AREA_ID": "MDC",
								"ACCOUNT_ID": "1234"
							   }
						   ],
						   "ACTIVITY_TYPE_TEXT_ENTITIES": [{
								"ACTIVITY_TYPE_DESCRIPTION": "TEST_MDC EN",
								"ACTIVITY_TYPE_ID": "TEST_MDC",
								"CONTROLLING_AREA_ID": "MDC",
								"LANGUAGE": "EN"
							   },
							   {
								"ACTIVITY_TYPE_DESCRIPTION": "TEST_MDC DE",
								"ACTIVITY_TYPE_ID": "TEST_MDC",
								"CONTROLLING_AREA_ID": "MDC",
								"LANGUAGE": "DE"
							   }
						   ]
						},
						"UPDATE":{},
						"UPSERT":{},
						"DELETE":{}
				};
				var params = [{
					"name" : "ignoreBadData",
					"value" : true
				},
				{
					"name" : "business_object",
					"value" : BusinessObjectTypes.ActivityType
				}];				
			    
				var result;
				// act
				result = oAdministrationValidator.validate(buildPostRequest(params, oBatchObject), $.net.http.POST);
				
				// assert
				expect(result.VALIDATION.errors).toBeDefined();
				expect(result.VALIDATION.errors.length).toBe(3);
				expect(result.VALIDATION.errors[0].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(result.VALIDATION.errors[1].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(result.VALIDATION.errors[2].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});
        });		
		
	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}
	