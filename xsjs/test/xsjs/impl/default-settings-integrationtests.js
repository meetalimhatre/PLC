/*jslint undef:true*/
var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var PersistencyImport = $.import("xs.db", "persistency");
var defaultSettingsImport = $.import("xs.db", "persistency-defaultSettings");
var helpers = require("../../../lib/xs/util/helpers");
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var ServiceMetaInformation  = require("../../../lib/xs/util/constants").ServiceMetaInformation;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");

var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

var oDefaultResponseMock = null;
var oPersistency = null;
var oMockstar = null;

var sUserId = $.session.getUsername().toUpperCase();

var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.sap.plc.db.defaultsettings.procedures::';

var oSessionTestData;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.default-settings-integrationtests', function() {
		var originalProcedures = null;

		var oLocalDefaultSettingsTestData = {
				"CONTROLLING_AREA_ID": "#CA7",
				"COMPANY_CODE_ID": "CC7",
				"PLANT_ID": "PL7",
				"REPORT_CURRENCY_ID": "EUR",
				"COMPONENT_SPLIT_ID": "#CS7",
				"COSTING_SHEET_ID": "COGS"
		};
		var oLocalControllingAreaTestDataPlc = {
				"CONTROLLING_AREA_ID" : ['#CA7', '#CA8'],
				"CONTROLLING_AREA_CURRENCY_ID" : ['EUR', 'USD'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['#CONTROLLER', '#CONTROLLER']
		};
		var oLocalCurrency = {
				"CURRENCY_ID": ["EUR", "USD", "GBP"],
				"_SOURCE": [1,1,1],
				"_CREATED_BY": ["I305774","I305774","I305774"],
				"_VALID_FROM": ["2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z"]
		};
		var oLocalCompanyCodeTestDataPlc = {
				"COMPANY_CODE_ID" : ['CC7', 'CC8'],
				"CONTROLLING_AREA_ID" : ['1000', '1000'],
				"COMPANY_CODE_CURRENCY_ID" : ['EUR', 'EUR'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1, 1],
				"_CREATED_BY" : ['U000001', 'U000002']
		};
		var oLocalPlantTestDataPlc = {
				"PLANT_ID" : ['PL7' , 'PL8'],
				"COMPANY_CODE_ID" : ['CC7', 'CC8'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
				"_VALID_TO" : [null, '2015-05-25T15:39:09.691Z'],
				"_SOURCE" :[1, 1],
				"_CREATED_BY" : ['U000001', 'U000001']
		};
		var oLocalCostingSheetTestData = {
				"COSTING_SHEET_ID" : ['COGS', 'COGM'],
				"CONTROLLING_AREA_ID" : ['1000', '1000'],
				"_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z']
		};
		var oLocalComponentSplitTestDataPlc = {
				"COMPONENT_SPLIT_ID" : ['#CS7', '#CS8'],
				"CONTROLLING_AREA_ID" : ['#CA7', '#CA8'],
				"_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
				"_VALID_TO" : [null, null],
				"_SOURCE" : [1,1],
				"_CREATED_BY" : ["U000", "U000"]
		};    

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
							session : "sap.plc.db::basis.t_session",
							lock : "sap.plc.db::basis.t_lock"
						}
					});
			
			oSessionTestData = {
					"SESSION_ID": sUserId,
					"USER_ID": sUserId,
					"LANGUAGE":'EN',
					"LAST_ACTIVITY_TIME" : new Date()
			};

			if (!oMockstar.disableMockstar) {
				originalProcedures = defaultSettingsImport.Procedures;
				defaultSettingsImport.Procedures = Object.freeze({
					default_settings_read : procedurePrefix + 'p_default_settings_read'
				});
			}
		});


		afterOnce(function() {
			if (!oMockstar.disableMockstar) {
				defaultSettingsImport.Procedures = originalProcedures;
				oMockstar.cleanupMultiple([
				                           "sap.plc.db.defaultsettings.procedures"
				                           ]);
				oMockstar.cleanup();
			}
		});

		beforeEach(function() {
			oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});


		describe('Read Default Settings (GET)', function() {

			beforeEach(function() {
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
				oMockstar.clearAllTables();
				var oDefaultSettingsData = _.clone(oLocalDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = $.session.getUsername();
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oMockstar.insertTableData("controlling_area", oLocalControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", oLocalCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", oLocalPlantTestDataPlc);
				oMockstar.insertTableData("currency", oLocalCurrency);
				oMockstar.insertTableData("component_split", oLocalComponentSplitTestDataPlc); 
				oMockstar.insertTableData("costing_sheet", oLocalCostingSheetTestData);
				oMockstar.insertTableData("session", oSessionTestData);

				oMockstar.initializeData();
			});

			function buildRequest(bLock) {

				//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [
				    {"name": "type", "value": "global"},
				    {"name": "lock", "value": bLock}
				];
				
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
						queryPath: "default-settings",
						method: $.net.http.GET,
						parameters: params
				};
				return oRequest;
			}

			it('should read default settings when valid input -> returns default settings', function() {
				//arrange
				var oRequest = buildRequest(false);
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA)).toBe(true);
				expect(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA.CONTROLLING_AREA_ID).toBeDefined();
			});
			
			it('should read and lock default settings -> returns default settings and lock status', function() {
				//arrange
				var oRequest = buildRequest(true);
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA)).toBe(true);
				expect(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA.CONTROLLING_AREA_ID).toBeDefined();
				
				// Check lock status
				expect(oResponseObject.body.DEFAULT_SETTINGS[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(0);
			});
			
			it('[Metadata is locked] should read and lock default settings -> returns default settings and lock status with locking user id', function() {
				//arrange
				var oRequest = buildRequest(true);
				// Set lock by another user
				var sLockingUserId = "anotherUser";
				var oSession = {
						SESSION_ID : [ sLockingUserId ],
						USER_ID : [ sLockingUserId ],
						LANGUAGE : [ "EN" ],
						LAST_ACTIVITY_TIME : [ new Date()]
				};
				oMockstar.insertTableData("session", oSession);
				oPersistency.Misc.setLock(BusinessObjectTypes.DefaultSettings, sLockingUserId);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA)).toBe(true);
				expect(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA.CONTROLLING_AREA_ID).toBeDefined();
				
				// Check lock status
				expect(oResponseObject.body.DEFAULT_SETTINGS[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(1);	
				expect(oResponseObject.body.DEFAULT_SETTINGS[ServiceMetaInformation.LockStatus][ServiceMetaInformation.UserId]).toBe(sLockingUserId);	
			});
			
		});

		describe('Create Default Settings', function() {

			beforeEach(function() {
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
				oMockstar.clearAllTables();
				oMockstar.insertTableData("controlling_area", oLocalControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", oLocalCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", oLocalPlantTestDataPlc);
				oMockstar.insertTableData("currency", oLocalCurrency);
				oMockstar.insertTableData("component_split", oLocalComponentSplitTestDataPlc); 
				oMockstar.insertTableData("costing_sheet", oLocalCostingSheetTestData);
			oMockstar.insertTableData("session", oSessionTestData);
				oMockstar.initializeData();
			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			function buildRequest(sUserType) {

				//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [{
					"name": "type",
					"value": sUserType
				}];
				params.get = function() {
					return sUserType;
				};
				var oRequest = {
						queryPath: "default-settings",
						method: $.net.http.POST,
						parameters: params,
						body: {
							asString: function() {
								return JSON.stringify(oLocalDefaultSettingsTestData);
							}
						}
				};
				return oRequest;
			}

			it('should create default settings when valid input (POST Request+Settings in Body) -> returns created settings', function() {
				//arrange
				var oRequest = buildRequest("user");
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body.DEFAULT_SETTINGS)).toBe(true);
				expect(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA_ID).not.toBe(null);
			});
			
          it("should throw error (GENERAL_UNEXPECTED_EXCEPTION) if global settings are locked by another user", function() {
              //arrange
             const sLockingUserId = "anotherUser";
             const oSession = {
                     SESSION_ID : [ sLockingUserId ],
                     USER_ID : [ sLockingUserId ],
                     LANGUAGE : [ "EN" ],
                     LAST_ACTIVITY_TIME : [ new Date()]
             };
             oMockstar.insertTableData("session", oSession);
             oPersistency.Misc.setLock(BusinessObjectTypes.DefaultSettings, sLockingUserId);
         
             const oRequest = buildRequest("global");

              // act
              new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

              // assert
              expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.responseCode);
              const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
              expect(oResponseObject.head.messages.length).toBe(1);
              expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.code);
          });
					
		});

		describe('Update Default Settings', function() {

			beforeEach(function() {
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
				oMockstar.clearAllTables();
				var oDefaultSettingsData = _.clone(oLocalDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = $.session.getUsername();
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oMockstar.insertTableData("controlling_area", oLocalControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", oLocalCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", oLocalPlantTestDataPlc);
				oMockstar.insertTableData("currency", oLocalCurrency);
				oMockstar.insertTableData("component_split", oLocalComponentSplitTestDataPlc); 
				oMockstar.insertTableData("costing_sheet", oLocalCostingSheetTestData);
			oMockstar.insertTableData("session", oSessionTestData);
				oMockstar.initializeData();
			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			function buildRequest(oUpdatedSettings) {

				//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [{
					"name": "type",
					"value": "global"
				}];
				params.get = function(sArgument) {
					return "global";
				};
				var oRequest = {
						queryPath: "default-settings",
						method: $.net.http.PUT,
						parameters: params,
						body: {
							asString: function() {
								return JSON.stringify(oUpdatedSettings);
							}
						}
				};
				return oRequest;
			}

			it('should update default settings when valid input (PUT Request+Settings in Body) -> returns updated settings', function() {
				//arrange
				var oUpdatedDefaultSettings = {
						"CONTROLLING_AREA_ID": "#CA7",
						"COMPANY_CODE_ID": "CC7",
						"PLANT_ID": "PL7",
						"REPORT_CURRENCY_ID": "EUR",
						"COMPONENT_SPLIT_ID": "#CS8",
						"COSTING_SHEET_ID": "COGM"
				};
				var oRequest = buildRequest(oUpdatedDefaultSettings);
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(helpers.isPlainObject(oResponseObject)).toBe(true);
				expect(_.isObject(oResponseObject.body.DEFAULT_SETTINGS)).toBe(true);
				expect(oResponseObject.body.DEFAULT_SETTINGS.CONTROLLING_AREA_ID).not.toBe(null);
			});
			
	       it("should throw error (GENERAL_UNEXPECTED_EXCEPTION) if global settings are locked by another user", function() {
	                //arrange
                   var sLockingUserId = "anotherUser";
                   var oSession = {
                           SESSION_ID : [ sLockingUserId ],
                           USER_ID : [ sLockingUserId ],
                           LANGUAGE : [ "EN" ],
                           LAST_ACTIVITY_TIME : [ new Date()]
                   };
                   oMockstar.insertTableData("session", oSession);
                   oPersistency.Misc.setLock(BusinessObjectTypes.DefaultSettings, sLockingUserId);
               
	               var oUpdatedDefaultSettings = {
	                        "CONTROLLING_AREA_ID": "#CA7"
	                };
	                var oRequest = buildRequest(oUpdatedDefaultSettings);

	                // act
	                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

	                // assert
	                expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.responseCode);
	                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	                expect(oResponseObject.head.messages.length).toBe(1);
	                expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.code);
	       });
		});

		describe('Delete Default Settings', function() {

			beforeEach(function() {
				oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
				var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oDefaultResponseMock.headers = oResponseHeaderMock;
				oMockstar.clearAllTables();
				var oDefaultSettingsData = _.clone(oLocalDefaultSettingsTestData);
				oDefaultSettingsData.USER_ID = '';
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oDefaultSettingsData.USER_ID = $.session.getUsername();
				oMockstar.insertTableData("defaultSettings", oDefaultSettingsData);
				oMockstar.insertTableData("controlling_area", oLocalControllingAreaTestDataPlc);
				oMockstar.insertTableData("company_code", oLocalCompanyCodeTestDataPlc);
				oMockstar.insertTableData("plant", oLocalPlantTestDataPlc);
				oMockstar.insertTableData("currency", oLocalCurrency);
				oMockstar.insertTableData("component_split", oLocalComponentSplitTestDataPlc); 
				oMockstar.insertTableData("costing_sheet", oLocalCostingSheetTestData);
			    oMockstar.insertTableData("session", oSessionTestData);
				oMockstar.initializeData();
			});

			afterEach(function() {
				oMockstar.cleanup();
			});

			function buildRequest(sType) {
				var params = [{
					"name": "type",
					"value": sType
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
				var oRequest = {
						queryPath: "default-settings",
						method: $.net.http.DEL,
						parameters: params
				};
				return oRequest;
			}

			it('should delete user default settings', function() {
				//arrange
				var oRequestUser = buildRequest("user"); 
				var oSelectStatementUserBefore = oMockstar.execQuery("select * from {{defaultSettings}} where USER_ID='" + sUserId + "'");
				expect(oSelectStatementUserBefore.columns.USER_ID.rows.length).toEqual(1);

				//act
				new Dispatcher(oCtx, oRequestUser, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.DEFAULT_SETTINGS).toBe(sUserId);
				
				var oSelectStatementUserAfter = oMockstar.execQuery("select * from {{defaultSettings}} where USER_ID='" + sUserId + "'");
				expect(oSelectStatementUserAfter.columns.USER_ID.rows.length).toEqual(0);
			});

			it('should delete global default settings', function() {
				//arrange
				var oRequestGlobal = buildRequest("global"); 
				var oSelectStatementGlobalBefore = oMockstar.execQuery("select * from {{defaultSettings}} where USER_ID=''");
				expect(oSelectStatementGlobalBefore.columns.USER_ID.rows.length).toEqual(1);

				//act
				new Dispatcher(oCtx, oRequestGlobal, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.DEFAULT_SETTINGS).toBe(sUserId);
				
				var oSelectStatementGlobalAfter = oMockstar.execQuery("select * from {{defaultSettings}} where USER_ID = ''");
				expect(oSelectStatementGlobalAfter.columns.USER_ID.rows.length).toEqual(0);
			});

	        it("should throw error (GENERAL_UNEXPECTED_EXCEPTION) if global settings are locked by another user", function() {
                //arrange
               const sLockingUserId = "anotherUser";
               const oSession = {
                       SESSION_ID : [ sLockingUserId ],
                       USER_ID : [ sLockingUserId ],
                       LANGUAGE : [ "EN" ],
                       LAST_ACTIVITY_TIME : [ new Date()]
               };
               oMockstar.insertTableData("session", oSession);
               oPersistency.Misc.setLock(BusinessObjectTypes.DefaultSettings, sLockingUserId);
           
               const oUpdatedDefaultSettings = {
                        "CONTROLLING_AREA_ID": "#CA7"
                };
               const oRequest = buildRequest("global");

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.responseCode);
                const oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION.code);
	        });
			
		});    

	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}