var _ = require("lodash");
var testData = require("../../testdata/testdata").data;
var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var sUserId = $.session.getUsername().toUpperCase();

describe('xsjs.impl.frontend-settings-integrationtests', function() {

	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;
	// Function needed since URLs are not accepted as part of build on Jenkins
	function getCustomAppLink (bValid = true) {
		let sURL = 'https://';
		if (bValid) {
			sURL += 'test/customer/link(bD1lbiZjPTAwMSZkPW1pbiZpPTE=)/bc/bsp/link/crm_ui_start/default.htm?'
		} else {
			sURL += '`invalid';
		}
		return sURL;
	}; 
	beforeOnce(function() {

		oMockstar = new MockstarFacade({
			substituteTables: {
				frontend_settings: 'sap.plc.db::basis.t_frontend_settings',
				session: "sap.plc.db::basis.t_session"
			}
		});
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
	});

	function buildRequest(bValueParam, iHttpMethod, oFrontendSettings) {
		var params = [{
			"name": "is_corporate",
			"value": bValueParam
		}];

		params.get = function(sArgument) {
			var value;
			_.each(this, function(oParameter) {
				if (oParameter.name === sArgument) {
					value = oParameter.value;
				}
			});
			return value;
		};

		var oBody = {
			asString: function() {
				return JSON.stringify(oFrontendSettings);
			}
		};

		var oRequest = {
			queryPath: "frontend-settings",
			method: iHttpMethod,
			parameters: params,
			body: oBody
		};
		return oRequest;
	}

	if (jasmine.plcTestRunParameters.mode === 'all') {

		describe('Read Frontend Settings (GET)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oMockstar.initializeData();
			});

			function buildGetRequest(oParam) {

				oParam.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};

				var oRequest = {
					queryPath: "frontend-settings",
					method: $.net.http.GET,
					parameters: oParam
				};
				return oRequest;
			}

			it('should read all the corporate frontend settings and the personal frontend settings of the user that is logged in', function() {
				//arrange
				var oParam = [{
					"name": "type",
					"value": "Filter"
				}];
				var oRequest = buildGetRequest(oParam);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				var oReturnedObject = oResponseObject.body.SETTINGS;
				//check data from the response
				expect(oReturnedObject.length).toBe(4);
				expect(oReturnedObject).toMatchData({
					"SETTING_ID": [1, 2, 3, 4],
					"SETTING_NAME":  ['CorporateFilter1', 'CorporateFilter2', 'MyFilter1', 'MyFilter2'],
					"SETTING_TYPE": ['FILTER', 'FILTER', 'FILTER', 'FILTER'],
					"USER_ID": [null, null, sUserId, sUserId],
					"SETTING_CONTENT": ['{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}',
										'{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}=',
										'{"Field":"PLANT_ID", "Value":"1000"}=',
										'{"Field":"PLANT_ID", "Value":"1000"}==']
				}, ["SETTING_ID"]);
			});

			it('should return error when reading without parameter', function() {
				//arrange
				var oParam = [{}];
				var oRequest = buildGetRequest(oParam);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});

		describe('Create Frontend Settings (POST)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				oMockstar.insertTableData("session", testData.oSessionTestData);
				sUserId = $.session.getUsername().toUpperCase();
			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			it('should create corporate frontend settings for valid input', function() {
				//arrange
				var aNewFrontendSettings = [{
					"SETTING_ID": -1,
					"SETTING_NAME": "Testing",
					"SETTING_TYPE": "Filter",
					"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				    }];
				var oRequest = buildRequest('true', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				var oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBeGreaterThan(0);
				//should always return null for user id for created corporate frontend settings for valid input
				expect(oResponseData.SETTINGS[0].USER_ID).toBe(null);
				//should return handle id for created corporate frontend settings for valid input
				expect(oResponseData.SETTINGS[0].HANDLE_ID).toBe(-1);
			});

			it('should create personal frontend settings for valid input', function() {
				//arrange
				var aNewFrontendSettings = [{
					"SETTING_ID": -1,
					"SETTING_NAME": "PersonalFrontendSetting",
					"SETTING_TYPE": "Filter",
					"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}=='
				    }];
				var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				var oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBeGreaterThan(0);
				// should return user id for created personal frontend settings for valid input
				expect(oResponseData.SETTINGS[0].USER_ID).toBe(sUserId);
				//should return handle id for created personal frontend settings for valid input
				expect(oResponseData.SETTINGS[0].HANDLE_ID).toBe(-1);
			});

			it('should create frontend settings of type applicationhelp when they contain a valid url as content', function() {
				//arrange
				const sValidUrl = getCustomAppLink();
				const aNewFrontendSettings = [{
					"SETTING_ID": -1,
					"SETTING_NAME": "CUSTOMERPROVIDEDHELPLINK",
					"SETTING_TYPE": "APPLICATIONHELP",
					"SETTING_CONTENT": sValidUrl
				    }];
				const oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				const oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBeGreaterThan(0);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe(aNewFrontendSettings[0].SETTING_NAME);
				expect(oResponseData.SETTINGS[0].SETTING_TYPE).toBe(aNewFrontendSettings[0].SETTING_TYPE);
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe(aNewFrontendSettings[0].SETTING_CONTENT);
			});

			it('should throw error when trying to create one frontend setting that has the same name as an existing personal frontend setting',
				function() {
					//arrange
					oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
					var aNewFrontendSettings = [{
						"SETTING_ID": -1,
						"SETTING_NAME": "MyFilter1",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				    }];
					var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);

					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					//assert
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
			});
			
			//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
			it('should throw error when trying to create more than one frontend setting that has the same name as an existing personal frontend setting',
				function() {
					//arrange
					oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
					var aNewFrontendSettings = [{
						"SETTING_ID": -1,
						"SETTING_NAME": "MyFilter1",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				    },
				    {
						"SETTING_ID": -2,
						"SETTING_NAME": "MyFilter2",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}=='
				    },
				    {
						"SETTING_ID": -3,
						"SETTING_NAME": "MyFilterNew",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}'
				    }];
					var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);

					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					//assert
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
					expect(oResponseObject.head.messages[0].details.settingsObj.length).toBe(2);
    				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_ID).toBe(-1);
    				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_NAME).toBe('MyFilter1');
    				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_ID).toBe(-2);
    				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_NAME).toBe('MyFilter2');
			});

			it('should throw error when trying to create frontend setting that has missing mandatory properties', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aNewFrontendSettings = [{
					"SETTING_TYPE": "Filter",
					"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				    }];

				var oRequest = buildRequest('true', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});

			it('should throw error when trying to create a frontend setting of type ApplicationHelp that contains an invalid URL', function() {
				//arrange
				const sInvalidUrl = getCustomAppLink(false);
				const aNewFrontendSettings = [{
					"SETTING_ID": -1,
					"SETTING_NAME": "ConfigurationAplicationHelpLink",
					"SETTING_TYPE": "APPLICATIONHELP",
					"SETTING_CONTENT": sInvalidUrl
				    }];

				const oRequest = buildRequest('true', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[0].details.messageTextObj).toContain('invalid characters');
			});

			it('should throw error when trying to create corporate frontend setting that has the same name as an existing frontend setting',
				function() {
					//arrange
					oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
					var aNewFrontendSettings = [{
						"SETTING_ID": -1,
						"SETTING_NAME": "CorporateFilter1",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				    }];

					var oRequest = buildRequest('true', $.net.http.POST, aNewFrontendSettings);

					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					//assert
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
				});

				it('should create frontend settings for valid base64 SETTING_CONTENT for Mass Change', function() {
					//arrange
					var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6e319fQ==";
					var aNewFrontendSettings = [{
						"SETTING_ID": -1,
						"SETTING_NAME": "PersonalFrontendSetting",
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": aSettingContent
						}];
					var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);
	
					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
	
					//assert
					expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
					expect(oResponseObject.body.SETTINGS.length).toBe(1);
					var oResponseData = oResponseObject.body;
					expect(oResponseData.SETTINGS[0].SETTING_ID).toBeGreaterThan(0);
					// should return user id for created personal frontend settings for valid input
					expect(oResponseData.SETTINGS[0].USER_ID).toBe(sUserId);
					//should return handle id for created personal frontend settings for valid input
					expect(oResponseData.SETTINGS[0].HANDLE_ID).toBe(-1);
				});

				it('should throw an error when trying to create frontend settings with invalid base64 SETTING_CONTENT for Mass Change', function() {
					//arrange
					var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMIjp7fX19";
					var aNewFrontendSettings = [{
						"SETTING_ID": -1,
						"SETTING_NAME": "PersonalFrontendSetting",
						"SETTING_TYPE": "MassChange",
						"SETTING_CONTENT": aSettingContent
						}];
					var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);
	
					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					//assert	
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				});	
		});

		describe('Update Frontend Settings (PUT)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should update corporate setting for valid input', function() {
				//arrange
				var aUpdatedSetting = [{
					"SETTING_ID": 1,
					"SETTING_NAME": "UCorporateFilter1",
					"SETTING_CONTENT": '{"UField":"CONFIDENCE_LEVEL_ID", "Value":"444"}='
			        }];

				var oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				var oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBe(1);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe("UCorporateFilter1");
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe('{"UField":"CONFIDENCE_LEVEL_ID", "Value":"444"}=');
			});

			it('should update CustomerProvidedHelpLink frontend settings when they contain a valid url as content', function() {
				//arrange
				const sValidUrl = getCustomAppLink();
				const aUpdatedSetting = [{
					"SETTING_ID": 1,
					"SETTING_NAME": "CustomerProvidedHelpLink",
					"SETTING_CONTENT": sValidUrl
			        }];

				const oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				const oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBe(aUpdatedSetting[0].SETTING_ID);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe(aUpdatedSetting[0].SETTING_NAME);
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe(aUpdatedSetting[0].SETTING_CONTENT);
			});

			it('should allow SETTING_CONTENT to be empty when updating CustomerProvidedHelpLink settings', function() {
				//arrange
				const aUpdatedSetting = [{
					"SETTING_ID": 1,
					"SETTING_NAME": "CustomerProvidedHelpLink",
					"SETTING_CONTENT": ""
			        }];

				const oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				const oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBe(aUpdatedSetting[0].SETTING_ID);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe(aUpdatedSetting[0].SETTING_NAME);
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe(aUpdatedSetting[0].SETTING_CONTENT);
			});

			it('should update personal setting for valid input', function() {
				//arrange
				var aUpdatedSetting = [{
					"SETTING_ID": 3,
					"SETTING_NAME": "UMyFilter1",
					"SETTING_CONTENT": '{"UField":"CONFIDENCE_LEVEL_ID", "Value":"222"}='
				    }];

				var oRequest = buildRequest('false', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				var oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBe(3);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe("UMyFilter1");
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe('{"UField":"CONFIDENCE_LEVEL_ID", "Value":"222"}=');
			});

			it('should throw error when updating a name to a name which is the same name as an existing user personal setting', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aUpdatedSetting = [{
					"SETTING_ID": 4,
					"SETTING_NAME": "MyFilter1"
				    }];

				var oRequest = buildRequest('false', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
			});
			
			//TODO: The behavior of dbConnection.executeUpdate changed in XSA. Need to wait for fix from XSA team.
			it('should throw error when updating more than one frontend settings that has the same name as an existing personal frontend setting',
				function() {
					//arrange
					oMockstar.clearAllTables();
    				oMockstar.insertTableData("session", testData.oSessionTestData);
					var sTestUser = $.session.getUsername();
					var oFrontendSettings = {
                		"SETTING_ID": [1, 2, 3],
                		"SETTING_NAME": ['MyFilter1', 'MyFilter2', 'MyFilter3'],
                		"SETTING_TYPE": ['FILTER', 'FILTER', 'FILTER'],
                		"USER_ID": [sTestUser, sTestUser, sTestUser],
                		"SETTING_CONTENT": ['{"Field":"PLANT_ID", "Value":"1000"}=',
                							'{"Field":"PLANT_ID", "Value":"1000"}=',
                							'{"Field":"PLANT_ID", "Value":"1000"}=']
};
					oMockstar.insertTableData("frontend_settings", oFrontendSettings);
					var aUpdatedSettings = [{
						"SETTING_ID": 1,
						"SETTING_NAME": 'MyFilter2'
				    },
				    {
						"SETTING_ID": 2,
						"SETTING_NAME": 'MyFilter3'
				    },
				    {
						"SETTING_ID": 3,
						"SETTING_NAME": 'MyFilter3Update'
				    }];
					var oRequest = buildRequest('false', $.net.http.PUT, aUpdatedSettings);

					//act
					new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

					//assert
					var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
					expect(oResponseObject.head.messages[0].details.settingsObj.length).toBe(2);
    				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_ID).toBe(1);
    				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_NAME).toBe('MyFilter2');
    				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_ID).toBe(2);
    				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_NAME).toBe('MyFilter3');
			});

			it('should throw error when updating a name to a name which is the same name as an existing corporate setting', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aUpdatedSetting = [{
					"SETTING_ID": 2,
					"SETTING_NAME": "CorporateFilter1",
					"SETTING_CONTENT": null
				    }];

				var oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_FRONTEND_SETTING_NAMING_CONFLICT');
			});

			it('should throw error when one setting_id does not exist', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aUpdatedSetting = [{
					"SETTING_ID": 11,
					"SETTING_NAME": "CorporateFilter1"
				    }];

				var oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});

			it('should throw error when more than one setting_ids do not exist', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aUpdatedSetting = [{
						"SETTING_ID": 11,
						"SETTING_NAME": "CorporateFilter11"
				    },
					{
						"SETTING_ID": 12,
						"SETTING_NAME": "CorporateFilter12"
				    },
					{
						"SETTING_ID": 13,
						"SETTING_NAME": "CorporateFilter13"
				    },
					{
						"SETTING_ID": 1,
						"SETTING_NAME": "CorporateFilter1Update"
				    }];

				var oRequest = buildRequest('true', $.net.http.PUT, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[0].details.settingsObj.length).toBe(3);
				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_ID).toBe(11);
				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_ID).toBe(12);
				expect(oResponseObject.head.messages[0].details.settingsObj[2].SETTING_ID).toBe(13);
			});

			it('should throw error when trying to update a frontend setting of type ApplicationHelp that contains an invalid URL', function() {
				//arrange
				const sInvalidUrl = getCustomAppLink(false);
				const aFrontendSettings = [{
					"SETTING_ID": 1,
					"SETTING_NAME": "CustomerProvidedHelpLink",
					"SETTING_CONTENT": sInvalidUrl
				    }];

				const oRequest = buildRequest('true', $.net.http.PUT, aFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[0].details.messageTextObj).toContain('invalid characters');
			});

			it('should create frontend settings for valid base64 SETTING_CONTENT for Mass Change', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6e319fQ==";
				var aNewFrontendSettings = [{
					"SETTING_ID":7,
					"SETTING_NAME": "MassChange",
					"SETTING_CONTENT": aSettingContent
					}];
				var oRequest = buildRequest('false', $.net.http.PUT, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.body.SETTINGS.length).toBe(1);
				var oResponseData = oResponseObject.body;
				expect(oResponseData.SETTINGS[0].SETTING_ID).toBeGreaterThan(0);
				expect(oResponseData.SETTINGS[0].SETTING_NAME).toBe("MassChange");
				expect(oResponseData.SETTINGS[0].SETTING_CONTENT).toBe(aSettingContent);
			});

			it('should throw an error when trying to create frontend settings with invalid base64 SETTING_CONTENT for Mass Change', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMIjp7fX19";
				var aNewFrontendSettings = [{
					"SETTING_ID": 7,
					"SETTING_NAME": "MassChange",
					"SETTING_CONTENT": aSettingContent
					}];
				var oRequest = buildRequest('false', $.net.http.POST, aNewFrontendSettings);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert	
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});	
		});

		describe('Delete Frontend Settings (DELETE)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oMockstar.initializeData();
			});

			it('should delete setting for valid corporate input', function() {
				//arrange
				var oDeletedSetting = [{
					"SETTING_ID": 1
				    }];

				var oRequest = buildRequest('true', $.net.http.DEL, oDeletedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			});

			it('should delete setting for valid personal input', function() {
				//arrange
				var oDeletedSetting = [{
					"SETTING_ID": 3
				    }];

				var oRequest = buildRequest('false', $.net.http.DEL, oDeletedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			});

			it('should throw error when the setting_id does not exist and is corporate', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var oDeletedSetting = [{
					"SETTING_ID": 22
				    }];

				var oRequest = buildRequest('true', $.net.http.DEL, oDeletedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});

			it('should throw error when the setting_id does not exist and is personal', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var oDeletedSetting = [{
					"SETTING_ID": 22
				    }];

				var oRequest = buildRequest('false', $.net.http.DEL, oDeletedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
			
			it('should throw error when more than one setting_ids do not exist (corporate)', function() {
				//arrange
				oMockstar.insertTableData("frontend_settings", testData.oFrontendSettings);
				var aUpdatedSetting = [{
						"SETTING_ID": 11
				    },
					{
						"SETTING_ID": 12
				    },
					{
						"SETTING_ID": 13
				    },
					{
						"SETTING_ID": 1
				    }];

				var oRequest = buildRequest('true', $.net.http.DEL, aUpdatedSetting);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[0].details.settingsObj.length).toBe(3);
				expect(oResponseObject.head.messages[0].details.settingsObj[0].SETTING_ID).toBe(11);
				expect(oResponseObject.head.messages[0].details.settingsObj[1].SETTING_ID).toBe(12);
				expect(oResponseObject.head.messages[0].details.settingsObj[2].SETTING_ID).toBe(13);
			});
		});
	}
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);