if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.persistency-defaultSettings-integrationtests', function() {
		var _ = require("lodash");
		var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
		var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
		var testData = require("../../testdata/testdata").data;
		var PersistencyImport = $.import("xs.db", "persistency");
		var defaultSettingsImport = $.import("xs.db", "persistency-defaultSettings");
		var MessageLibrary = require("../../../lib/xs/util/message");

		var PlcException = MessageLibrary.PlcException;
	    var oExpectedErrorCodeEntityNotFound = MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR;
	
		var originalProcedures = null;
		var oMockstar = null;
		var oPersistency = null;

		beforeOnce(function() {
			oMockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel : {
							"procRead": "sap.plc.db.defaultsettings.procedures/p_default_settings_read"
						},
						substituteTables:
						{
							defaultSettings: defaultSettingsImport.Tables.defaultSettings,
							controlling_area: Resources["Controlling_Area"].dbobjects.plcTable,
							company_code: Resources["Company_Code"].dbobjects.plcTable,
							plant: Resources["Plant"].dbobjects.plcTable,
							currency: Resources["Currency"].dbobjects.plcTable,
							component_split: Resources["Component_Split"].dbobjects.plcTable,
							costing_sheet: Resources["Costing_Sheet"].dbobjects.plcTable,
						}
					});
			
			if (!oMockstar.disableMockstar) {
				var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.defaultsettings.procedures::';

				originalProcedures = defaultSettingsImport.Procedures;
				defaultSettingsImport.Procedures = Object.freeze({
					default_settings_read : procedurePrefix + 'p_default_settings_read'
				});
			}
		});

		afterOnce(function() {
			if (!oMockstar.disableMockstar) {
				oMockstar.cleanup();
				defaultSettingsImport.Procedures = originalProcedures;
			}
		});

		beforeEach(function(){
			oMockstar.clearAllTables();
			oMockstar.initializeData();

		oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
		});

		describe('get', function() {
			beforeEach(function() {
				var oDefaultSettingsData = _.cloneDeep(testData.oDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = oMockstar.currentUser;
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				oMockstar.insertTableData("currency", testData.oCurrencySecond);
				oMockstar.insertTableData("component_split", testData.oComponentSplitTestDataPlcDefaultSettings); 
				oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
			});

			it('should get global settings when valid input', function() {
				// arrange
				var sType = 'global';
				var sUserId = oMockstar.currentUser;
				var sLanguage = 'EN';
				var sMasterDataDate = new Date();

				// act
				var oResult = oPersistency.DefaultSettings.get(sType, sUserId, sLanguage, sMasterDataDate);

				// assert
				expect(oResult.CONTROLLING_AREA.CONTROLLING_AREA_ID).toEqual(testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0]);
				expect(oResult.COMPANY_CODE.COMPANY_CODE_ID).toEqual(testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]);
				expect(oResult.PLANT.PLANT_ID).toEqual(testData.oPlantTestDataPlc.PLANT_ID[0]);
				expect(oResult.CURRENCY.CURRENCY_ID).toEqual(testData.oCurrencySecond.CURRENCY_ID);
				expect(oResult.COMPONENT_SPLIT.COMPONENT_SPLIT_ID).toEqual(testData.oComponentSplitTestDataPlcDefaultSettings.COMPONENT_SPLIT_ID[0]);
				expect(oResult.COSTING_SHEET.COSTING_SHEET_ID).toEqual(testData.oCostingSheetTestData.COSTING_SHEET_ID[0]);
			});

			it('should get user settings when valid input', function() {
				// arrange
				var sType = 'user';
				var sUserId = oMockstar.currentUser;
				var sLanguage = 'EN';
				var sMasterDataDate = new Date();

				// act
				var oResult = oPersistency.DefaultSettings.get(sType, sUserId, sLanguage, sMasterDataDate);

				// assert
				expect(oResult.CONTROLLING_AREA.CONTROLLING_AREA_ID).toEqual(testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[0]);
				expect(oResult.COMPANY_CODE.COMPANY_CODE_ID).toEqual(testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]);
				expect(oResult.PLANT.PLANT_ID).toEqual(testData.oPlantTestDataPlc.PLANT_ID[0]);
				expect(oResult.CURRENCY.CURRENCY_ID).toEqual(testData.oCurrencySecond.CURRENCY_ID);
				expect(oResult.COMPONENT_SPLIT.COMPONENT_SPLIT_ID).toEqual(testData.oComponentSplitTestDataPlcDefaultSettings.COMPONENT_SPLIT_ID[0]);
				expect(oResult.COSTING_SHEET.COSTING_SHEET_ID).toEqual(testData.oCostingSheetTestData.COSTING_SHEET_ID[0]);
			});		
		});

		describe('create', function() {	
			
		var oDefaultSettingsInvalidControllingArea = {
				"CONTROLLING_AREA_ID": "#CA999",
		        "COMPANY_CODE_ID": "CC1",
		        "PLANT_ID": "PL1",
		        "REPORT_CURRENCY_ID": "EUR",
		        "COMPONENT_SPLIT_ID": "#CS2",
		        "COSTING_SHEET_ID": "COGM"
		};
		
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				oMockstar.insertTableData("currency", testData.oCurrencySecond);
				oMockstar.insertTableData("component_split", testData.oComponentSplitTestDataPlcDefaultSettings); 
				oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
				oMockstar.initializeData();

			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			it('should create default settings when PLC valid input', function() {
				// arrange
				var sType = 'user';
				var sUserId = oMockstar.currentUser;

				// act
				var oResult = oPersistency.DefaultSettings.create(testData.oDefaultSettingsTestData, sType, sUserId);

				// assert
				expect(oResult).toEqual(testData.oDefaultSettingsTestData);
			});
			
			it('should throw a General PLC Exception if type is unknown', function() {
				// arrange
				var exception = null;
				var sType = null;
				var sUserId = oMockstar.currentUser;

				// act
				try {
				var aResult = oPersistency.DefaultSettings.create(testData.oDefaultSettingsTestData, sType, sUserId);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_UNEXPECTED_EXCEPTION");
			});

			it('should throw Validation Error if Controlling_Area_ID does not exist in relevant table', function() {
				// arrange
				var exception = null;
				var sType = 'user';
				var sUserId = oMockstar.currentUser;
	
				// act
				try {
					var aResult = oPersistency.DefaultSettings.create(oDefaultSettingsInvalidControllingArea, sType, sUserId);
				} catch(e) {
					exception = e;
				}
	
				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code).toEqual(oExpectedErrorCodeEntityNotFound);
			});

		});
		describe('update', function() {
			var oUpdatedDefaultSettings = {
					"CONTROLLING_AREA_ID": "#CA1",
			        "COMPANY_CODE_ID": "CC1",
			        "PLANT_ID": "PL1",
			        "REPORT_CURRENCY_ID": "EUR",
			        "COMPONENT_SPLIT_ID": "#CS2",
			        "COSTING_SHEET_ID": "COGM"
			};
			var oDefaultSettingsInvalidPlant = {
					"CONTROLLING_AREA_ID": "#CA1",
			        "COMPANY_CODE_ID": "CC1",
			        "PLANT_ID": "PL999",
			        "REPORT_CURRENCY_ID": "EUR",
			        "COMPONENT_SPLIT_ID": "#CS2",
			        "COSTING_SHEET_ID": "COGM"
			};
			var oDefaultSettingsOnlyCurrency = {
					"REPORT_CURRENCY_ID": "EUR"
			};
			var oUpdatedDefaultSettingsOnlyCurrency = {
					"CONTROLLING_AREA_ID": "",
			        "COMPANY_CODE_ID": "",
			        "PLANT_ID": "",
			        "REPORT_CURRENCY_ID": "EUR",
			        "COMPONENT_SPLIT_ID": "",
			        "COSTING_SHEET_ID": ""
			};
		
			beforeEach(function() {   
				
				var oDefaultSettingsData = _.cloneDeep(testData.oDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = oMockstar.currentUser;
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);			
				oMockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				oMockstar.insertTableData("currency", testData.oCurrencySecond);
				oMockstar.insertTableData("component_split", testData.oComponentSplitTestDataPlcDefaultSettings); 
				oMockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
				oMockstar.initializeData();
			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			it('should update default settings when valid input', function() {
				// arrange
				var sType = 'user';
				var sUserId = oMockstar.currentUser;

				// act
				var oResult = oPersistency.DefaultSettings.update(oUpdatedDefaultSettings, sType, sUserId);

				// assert
				expect(oResult).toEqual(oUpdatedDefaultSettings);
			});

			it('should update default settings when valid input(only reporting currency should work too)', function() {
				// arrange
				var sType = 'user';
				var sUserId = oMockstar.currentUser;
				var oTestDefaultSettingsOnlyCurrency = _.cloneDeep(oDefaultSettingsOnlyCurrency);

				// act
				var oResult = oPersistency.DefaultSettings.update(oTestDefaultSettingsOnlyCurrency, sType, sUserId);

				// assert
				expect(oResult).toEqualObject(oUpdatedDefaultSettingsOnlyCurrency);
			});
			
			it('should update (global)default settings when valid input(without CONTROLLING_AREA_ID)', function() {
				// arrange
				var sType = 'global';
				var sUserId = oMockstar.currentUser;
				var oTestDefaultSettingsOnlyCurrency = _.cloneDeep(oDefaultSettingsOnlyCurrency);

				// act
				var oResult = oPersistency.DefaultSettings.update(oTestDefaultSettingsOnlyCurrency, sType, sUserId);

				// assert
				expect(oResult).toEqualObject(oUpdatedDefaultSettingsOnlyCurrency);
			});
			
			it('should throw a General PLC Exception if request is performed with an empty array - helpers.isPlainObject() will return false', function() {
				// arrange
				var exception = null;
				var sType = 'user';
				var sUserId = oMockstar.currentUser;

				// act
				try {
					var aResult = oPersistency.DefaultSettings.update([], sType, sUserId);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_UNEXPECTED_EXCEPTION");
			});

			it('should throw a General PLC Exception if type is unknown', function() {
				// arrange
				var exception = null;
				var sType = null;
				var sUserId = oMockstar.currentUser;

				// act
				try {
					var aResult = oPersistency.DefaultSettings.update(oUpdatedDefaultSettings, sType, sUserId);
				} catch(e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toEqual("GENERAL_UNEXPECTED_EXCEPTION");
			});
		
			it('should throw Validation Error if Plant_ID does not exist in relevant table', function() {
				// arrange
				var exception = null;
				var sType = 'user';
				var sUserId = oMockstar.currentUser;
	
				// act
				try {
					var aResult = oPersistency.DefaultSettings.update(oDefaultSettingsInvalidPlant, sType, sUserId);
				} catch(e) {
					exception = e;
				}
	
				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code).toEqual(oExpectedErrorCodeEntityNotFound);
			});
		});

		describe('delete', function() {
			beforeEach(function() {   
				var oDefaultSettingsData = _.cloneDeep(testData.oDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = oMockstar.currentUser;
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
			});

			it('should delete user default settings when valid input', function() {
				// arrange
				var sType = 'user';
				var sUserId = oMockstar.currentUser;
				// act
				var oResult = oPersistency.DefaultSettings.removeDefaultSettings(sType, sUserId);

				// assert
				expect(oResult).toEqual(sUserId);
			});
		});

	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}