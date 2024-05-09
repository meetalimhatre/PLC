var testData = require("../../../testdata/testdata").data;
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");

var ApiExchangeRateTypeImport = $.import("xs.db.administration", "api-exchangeRateType");
var Administration = require("./administration-util");
var Resources = require("../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	    = require("../../../../lib/xs/util/message");
var MessageCode    	    = MessageLibrary.Code;

var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../lib/xs/util/constants").BusinessObjectTypes;
var sDefaultExchangeRateType = require("../../../../lib/xs/util/constants").sDefaultExchangeRateType;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.administration.api-exchangeRateType-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;

		beforeOnce(function() {
	
			mockstar = new MockstarFacade({ // Initialize Mockstar
				testmodel : {
					"procExchangeRateTypeRead": "sap.plc.db.administration.procedures/p_exchange_rate_type_read",
				},
				substituteTables : {
					exchangeRateType : Resources["Exchange_Rate_Type"].dbobjects.plcTable,
					exchangeRateTypeText : Resources["Exchange_Rate_Type"].dbobjects.plcTextTable,
					currencyConversion : Resources["Currency_Conversion"].dbobjects.plcTable,
					calculation_version : "sap.plc.db::basis.t_calculation_version",
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					project : {
							name : "sap.plc.db::basis.t_project",
							data : testData.oProjectTestData
					},
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.administration.procedures::';
				originalProcedures = ApiExchangeRateTypeImport.Procedures;
				ApiExchangeRateTypeImport.Procedures = Object.freeze({
					exchange_rate_type_read : procedurePrefix + 'p_exchange_rate_type_read'
				});
			}
	
		});
	
		afterOnce(function() {
			if (!mockstar.disableMockstar) {
				ApiExchangeRateTypeImport.Procedures = originalProcedures;
				mockstar.cleanup();
			}
		});
	
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("exchangeRateType", testData.oExchangeRateTypeTestDataPlc);
				mockstar.insertTableData("exchangeRateTypeText", testData.oExchangeRateTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid exchange rate type', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = null;
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).not.toBe(0);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_TEXT_ENTITIES.length).not.toBe(0);
			});
			
			it('should return filtered entries', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = "EXCHANGE_RATE_TYPE_ID=AVG";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(iCount);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_TEXT_ENTITIES.length).toBe(iCountText);
			});
			
			it('should return valid entries when using searchAutocomplete', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = null;
				oGetParameters["searchAutocomplete"] = "AVG";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(iCount);
			});
			
			it('should not return duplicate entries when multiple filters are used', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = "EXCHANGE_RATE_TYPE_ID=AVG&EXCHANGE_RATE_TYPE_DESCRIPTION=Average Rate";
				oGetParameters["searchAutocomplete"] = "AVG";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(iCount);
			});
			
			it('should not return entries when conditions from filter or autocomplete are not met', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var iCountText = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText", "EXCHANGE_RATE_TYPE_ID='AVG'");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = "EXCHANGE_RATE_TYPE_ID=AVG";
				oGetParameters["searchAutocomplete"] = "test";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(0);
			});
			
			it('should return corresponding entries when using top parameter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = null;
				oGetParameters["top"] = "3";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(3);
			});
			
			it('should return corresponding entries when using skip parameter', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var iCount = mockstar_helpers.getRowCount(mockstar, "exchangeRateType");
				var sLanguage = 'EN';
				var oGetParameters= [];
				oGetParameters["business_object"] = "Exchange_Rate_Type";
				oGetParameters["filter"] = null;
				oGetParameters["skip"] = "3";
	
				// act
				var oReturnedObject = administration.getAdministration(oGetParameters, sLanguage, new Date());
	
				// assert
				expect(oReturnedObject).not.toBe(null);
				expect(oReturnedObject.EXCHANGE_RATE_TYPE_ENTITIES.length).toBe(iCount - 3);
			});
		});
		
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables
				mockstar.insertTableData("exchangeRateType", testData.oExchangeRateTypeTestDataPlc);
				mockstar.insertTableData("exchangeRateTypeText", testData.oExchangeRateTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert exchange rate type and exchange rate type text', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var exchangeRateTypeNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateType");
				var exchangeRateTypeTextNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText");				
				
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : "ERT"
						},{
							"EXCHANGE_RATE_TYPE_ID" : "EXT"
						}],
						"EXCHANGE_RATE_TYPE_TEXT_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "ERT",
                            "LANGUAGE": "DE",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "PLC testen ERT"
						},{
                    		"EXCHANGE_RATE_TYPE_ID": "ERT",
                            "LANGUAGE": "EN",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "PLC test ERT"
						},{
                    		"EXCHANGE_RATE_TYPE_ID": "EXT",
                            "LANGUAGE": "EN",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "PLC test EXT"
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(mockstar_helpers.getRowCount(mockstar, "exchangeRateType")).toEqual(exchangeRateTypeNoBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText")).toEqual(exchangeRateTypeTextNoBefore+3);

			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a exchange rate type that does not exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_TEXT_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "AAA",
                            "LANGUAGE": "DE",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "PLC testen AAA"
						},{
                    		"EXCHANGE_RATE_TYPE_ID": "AAA",
                            "LANGUAGE": "EN",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "PLC test AAA"
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
				expect(oReturnedObject.errors[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
				expect(oReturnedObject.errors[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert exchange rate types with invalid columns', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = "Exchange_Rate_Type";
				const oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "AVERAGE",
                    		"INVALID_COLUMN" : "ABC"
						}]
				};
	
				// act
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnId).toBe("INVALID_COLUMN");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe("METADATA_ERROR");	
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert EXCHANGE_RATE_TYPE_ID with lowercase', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = "Exchange_Rate_Type";
				const oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "average"
						}]
				};
	
				// act
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert null as EXCHANGE_RATE_TYPE_ID', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = "Exchange_Rate_Type";
				const oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": null
						}]
				};
	
				// act
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert EXCHANGE_RATE_TYPE_ID with not allowed characters', function() {
				// arrange
				let administration = Administration.getAdministrationObject(mockstar,mockstar);
				let sObjectName = "Exchange_Rate_Type";
				const oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "!**$#"
						}]
				};
	
				// act
				let oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe("INVALID_CHARACTERS_ERROR");	
			});
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a exchange rate type that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a exchange rate type text that already exists', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_TEXT_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "AVG",
                            "LANGUAGE": "EN",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "Average Rate"
                            }]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a exchange rate type for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
						}]
				};
	
				// act
				var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("EXCHANGE_RATE_TYPE_ID");
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});

		});	

		describe ("remove", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables
				mockstar.insertTableData("exchangeRateType", testData.oExchangeRateTypeTestDataPlc);
				mockstar.insertTableData("exchangeRateTypeText", testData.oExchangeRateTypeTextTestDataPlc);
				mockstar.insertTableData("currencyConversion", testData.oCurrencyConversion);
				mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				mockstar.insertTableData("project", testData.oProjectTestData);
				mockstar.initializeData();
			});
	
			it('should remove the exchange rate type', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
	            var oBatchItemAdd = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : "AVV"
						}],
						"EXCHANGE_RATE_TYPE_TEXT_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "AVV",
                            "LANGUAGE": "EN",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "new Exchange Rate Type - to be deleted"
						}]
				};
				
	            var oReturnedObject = administration.insertAdministration(sObjectName, oBatchItemAdd, new Date());
	            
                var oTesta = mockstar.execQuery("select * from {{exchangeRateType}} WHERE EXCHANGE_RATE_TYPE_ID = 'AVV'");
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : oBatchItemAdd.EXCHANGE_RATE_TYPE_ENTITIES[0].EXCHANGE_RATE_TYPE_ID,
							"LAST_MODIFIED_ON": oTesta.columns.LAST_MODIFIED_ON.rows[0].toJSON()
						}]
				};
				
                var exchangeRateTypeNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateType","EXCHANGE_RATE_TYPE_ID = 'AVV'");
				var exchangeRateTypeTextNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText","EXCHANGE_RATE_TYPE_ID = 'AVV'");
				
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				var	exchangeRateTypeNoAfter = mockstar_helpers.getRowCount(mockstar, "exchangeRateType","EXCHANGE_RATE_TYPE_ID = 'AVV'");
                var exchangeRateTypeTextNoAfter = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText","EXCHANGE_RATE_TYPE_ID = 'AVV'");

				expect(oReturnedObject.hasErrors).toBe(false);
				expect(exchangeRateTypeNoAfter).toBe(exchangeRateTypeNoBefore - 1);
				expect(exchangeRateTypeTextNoAfter).toBe(exchangeRateTypeTextNoBefore - 1);

			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to remove a exchange rate type that does not exist', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : "AAA",
							"LAST_MODIFIED_ON" : "2016-08-02T16:46:33.044Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to remove a exchange rate type for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("EXCHANGE_RATE_TYPE_ID");		
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR / ValidationInfoCode DEPENDENCY_ERROR) when trying to remove a exchange rate type used in other business objects (e.g. currency_conversion)', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oTesta = mockstar.execQuery("select * from {{exchangeRateType}} WHERE EXCHANGE_RATE_TYPE_ID = '"+sDefaultExchangeRateType+"'");
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : sDefaultExchangeRateType,
							"LAST_MODIFIED_ON": oTesta.columns.LAST_MODIFIED_ON.rows[0].toJSON()
						}]
				};
	
				// act
				var oReturnedObject = administration.deleteAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObj.EXCHANGE_RATE_TYPE_ENTITIES[0].EXCHANGE_RATE_TYPE_ID).toBe(sDefaultExchangeRateType);
				expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.CurrencyConversion);
				expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[1].businessObj).toBe(BusinessObjectTypes.Project);	
				expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[2].businessObj).toBe(BusinessObjectTypes.CalculationVersion);	
				expect(oReturnedObject.errors[0].details.validationObj.dependencyObjects[3].businessObj).toBe(BusinessObjectTypes.Variant);	
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
		});

		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables();  // clear all specified substitute tables
				mockstar.insertTableData("exchangeRateType", testData.oExchangeRateTypeTestDataPlc);
				mockstar.insertTableData("exchangeRateTypeText", testData.oExchangeRateTypeTextTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should update the exchange rate type entry', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var exchangeRateTypeNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateType","EXCHANGE_RATE_TYPE_ID= 'AVG'");
				var exchangeRateTypeTextNoBefore = mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText","EXCHANGE_RATE_TYPE_ID= 'AVG'");
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : "AVG",
							"LAST_MODIFIED_ON": testData.sExpectedDate
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(false);
				expect(mockstar_helpers.getRowCount(mockstar, "exchangeRateType","EXCHANGE_RATE_TYPE_ID= 'AVG'")).toEqual(exchangeRateTypeNoBefore);
				expect(mockstar_helpers.getRowCount(mockstar, "exchangeRateTypeText","EXCHANGE_RATE_TYPE_ID= 'AVG'")).toEqual(exchangeRateTypeTextNoBefore);				
				expect(oReturnedObject.entities.EXCHANGE_RATE_TYPE_ENTITIES[0].CREATED_ON.toString()).toBe(new Date(testData.oExchangeRateTypeTestDataPlc.CREATED_ON[0]).toString());
				expect(oReturnedObject.entities.EXCHANGE_RATE_TYPE_ENTITIES[0].CREATED_BY).toBe(testData.oExchangeRateTypeTestDataPlc.CREATED_BY[0]);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a exchange rate type and the exchange rate type is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
							"EXCHANGE_RATE_TYPE_ID" : "994",
							"LAST_MODIFIED_ON" : "2016-08-02T16:46:33.044Z"
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
			});
			
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a exchange rate type text and the exchange rate type is not available in system', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_TEXT_ENTITIES" : [{
                    		"EXCHANGE_RATE_TYPE_ID": "994",
                            "LANGUAGE": "DE",
                            "EXCHANGE_RATE_TYPE_DESCRIPTION": "Update",
                            "LAST_MODIFIED_ON" : "2016-08-02T16:46:33.044Z"
						}]
				};

				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oReturnedObject.errors[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
			});
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a exchange rate type for which mandatory fields are missing', function() {
				// arrange
				var administration = Administration.getAdministrationObject(mockstar,mockstar);
				var sObjectName = "Exchange_Rate_Type";
				var oBatchItem = { 
						"EXCHANGE_RATE_TYPE_ENTITIES" : [{
						}]
				};
	
				// act
				var oReturnedObject = administration.updateAdministration(sObjectName, oBatchItem, new Date());
	
				//assert
				expect(oReturnedObject.hasErrors).toBe(true);
				expect(oReturnedObject.errors[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[0].columnId).toBe("EXCHANGE_RATE_TYPE_ID");	
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
				expect(oReturnedObject.errors[0].details.validationObj.columnIds[1].columnId).toBe("LAST_MODIFIED_ON");	
				expect(oReturnedObject.errors[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
		});	
	}).addTags(["Administration_NoCF_Integration"]);
}