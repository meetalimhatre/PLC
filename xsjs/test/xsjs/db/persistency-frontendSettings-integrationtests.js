var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var sTestUser = $.session.getUsername();
var sType = 'Filter';

describe('xsjs.db.persistency-frontendSettings-integrationtests', function() {

	
	var mockstar = null;

	var aFrontendSettingsEmpty = [{
		"SETTING_ID": [],
		"SETTING_NAME": [],
		"SETTING_TYPE": [],
		"SETTING_CONTENT": []
    }];

	var aFrontendSettingsOneEntry = [{
		"SETTING_ID": [1],
		"SETTING_NAME": ['MyFilter1'],
		"SETTING_TYPE": ['FILTER'],
		"SETTING_CONTENT": ['{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}']
    }];

	var aFrontendSettingsMassChangeOneEntry = [{
		"SETTING_ID": [1],
		"SETTING_NAME": ['MyFilter1'],
		"SETTING_TYPE": ['MASSCHANGE'],
		"SETTING_CONTENT": ['{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}']
    }];

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables: {
				frontend_settings: 'sap.plc.db::basis.t_frontend_settings'
			}
		});
	});

	describe('Get Frontend Settings', function() {

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return all corporate frontend settings and the ones defined by the user', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.FrontendSettings.getFrontendSettings(sType.toUpperCase(), sTestUser);

			// assert
			//there are 2 corporate frontend settings and 2 defined by the current user in the testdata
			expect(oRetrievedObject.length).toEqual(4);
		});

		it('should return one frontend setting', function() {
			// arrange
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", aFrontendSettingsOneEntry);
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.FrontendSettings.getFrontendSettings(sType.toUpperCase(), sTestUser);

			// assert
			//there is 1 frontend setting in the testdata
			expect(oRetrievedObject.length).toEqual(1);
		});

		it('should return no frontend settings when there are none', function() {
			// arrange
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", aFrontendSettingsEmpty);
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.FrontendSettings.getFrontendSettings(sType.toUpperCase(), sTestUser);

			// assert
			//there is 1 frontend setting in the testdata
			expect(oRetrievedObject.length).toEqual(0);
		});

		it('should not return any corporate frontend settings or the ones defined by the user when setting type is invalid', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.FrontendSettings.getFrontendSettings('InvalidSettingType', sTestUser);

			// assert
			//there is not data found
			expect(oRetrievedObject.length).toEqual(0);
		});

		it('should return one frontend setting id with type "Mass Change"', function() {
			// arrange
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", aFrontendSettingsMassChangeOneEntry);
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.FrontendSettings.getFrontendSettingsMassChangeIds(aFrontendSettingsOneEntry[0].SETTING_ID);

			// assert
			//there is 1 frontend setting in the testdata
			expect(oRetrievedObject.length).toEqual(1);
		});
	});

	describe('Create Frontend Settings', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should create one corporate setting', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aCreatedSetting = [{
				"SETTING_ID": -1,
				"SETTING_NAME": "CorporateFilter3",
				"SETTING_TYPE": "FILTER",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}];

			//act
			var result = persistency.FrontendSettings.insertFrontendSettings(aCreatedSetting, null);

			//assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBeGreaterThan(0);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings")).toBe(8);
		});

		it('should create one personal setting', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aCreatedSetting = [{
				"SETTING_ID": -1,
				"SETTING_NAME": "PersonalFilter3",
				"SETTING_TYPE": "FILTER",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}];

			//act
			var result = persistency.FrontendSettings.insertFrontendSettings(aCreatedSetting, testData.sTestUser);

			// assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBeGreaterThan(0);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings")).toBe(8);
		});

		it('should create multiple corporate frontend settings', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aCreatedSetting = [{
				"SETTING_ID": -1,
				"SETTING_NAME": "SettingA",
				"SETTING_TYPE": "FILTER",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}, {
				"SETTING_ID": -2,
				"SETTING_NAME": "SettingB",
				"SETTING_TYPE": "FILTER",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}];

			//act
			var result = persistency.FrontendSettings.insertFrontendSettings(aCreatedSetting, null);

			//assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBe(2);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings")).toBe(9);
		});

		it('should throw error when trying to insert frontend settings that has the same name as an existing personal frontend setting',
			function() {
				// arrange
				var exception;
				var persistency = new Persistency(jasmine.dbConnection);
				var aCreatedSetting = [{
					"SETTING_ID": -1,
					"SETTING_NAME": "MyFilter1",
					"SETTING_TYPE": "FILTER",
					"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}'
			    }];

				//act
				try {
					persistency.FrontendSettings.insertFrontendSettings(aCreatedSetting, testData.sTestUser);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toEqual('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
				expect(exception.code.responseCode).toEqual(409);
			});
	});

	describe('Update Frontend Settings', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should update one corporate setting', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			var aUpdateSettings = [{
				"SETTING_ID": 1,
				"SETTING_NAME": "MyFilter11",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}];

			//act
			var result = persistency.FrontendSettings.updateFrontendSettings(aUpdateSettings);

			//assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBe(1);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "SETTING_ID=1 and SETTING_NAME='MyFilter11'")).toBe(1);
		});

		it('should update one personal setting', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aUpdateSettings = [{
				"SETTING_ID": 2,
				"SETTING_NAME": "MyFilter11",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}'
			}];

			//act
			var result = persistency.FrontendSettings.updateFrontendSettings(aUpdateSettings);

			// assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBe(1);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "SETTING_ID=2 and SETTING_NAME='MyFilter11'")).toBe(1);
		});

		it('should update multiple personal frontend settings', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aUpdateSettings = [{
				"SETTING_ID": 3,
				"SETTING_NAME": "MyFilter1Update",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}=='
			}, {
				"SETTING_ID": 4,
				"SETTING_NAME": "MyFilter2Update",
				"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}='
			}];

			//act
			var result = persistency.FrontendSettings.updateFrontendSettings(aUpdateSettings);

			// assert
			expect(result.ERRORS.length).toBe(0);
			expect(result.SETTINGS.length).toBe(2);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "SETTING_ID=3 and SETTING_NAME='MyFilter1Update'")).toBe(1);
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "SETTING_ID=4 and SETTING_NAME='MyFilter2Update'")).toBe(1);
		});

		//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
		it('should throw error when trying to update frontend setting that has the same name as an existing personal frontend setting',
			function() {
				// arrange
				var exception;
				var persistency = new Persistency(jasmine.dbConnection);
				var aUpdateSettings = [{
					"SETTING_ID": 1,
					"SETTING_NAME": "CorporateFilter2"
			    }];

				//act
				try {
					persistency.FrontendSettings.updateFrontendSettings(aUpdateSettings);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toEqual('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
				expect(exception.code.responseCode).toEqual(409);
			});
	});

	describe('Delete Frontend Settings', function() {

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
		it('should delete a personal setting', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aSettings = [{
				"SETTING_ID": 3
			}]

			//act
			persistency.FrontendSettings.deleteFrontendSettings(aSettings);

			// assert
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "(SETTING_ID) = (" + aSettings[0].SETTING_ID + ")")).toBe(0);
		});

		//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
		it('should delete multiple corporate settings', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aSettings = [{
				"SETTING_ID": 1
			}, {
				"SETTING_ID": 2
			}]

			//act
			var result = persistency.FrontendSettings.deleteFrontendSettings(aSettings);

			// assert
			expect(result.length).toEqual(0);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "(SETTING_ID) = (" + aSettings[0].SETTING_ID + ")")).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "frontend_settings", "(SETTING_ID) = (" + aSettings[1].SETTING_ID + ")")).toBe(0);
		});

		//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
		it('should throw error when trying to delete frontend setting that does not exist', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aSettings = [{
				"SETTING_ID": 11
			    }];

			//act
			var result = persistency.FrontendSettings.deleteFrontendSettings(aSettings);

			// assert
			expect(result.length).toEqual(1);
		});
	});

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);