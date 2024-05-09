if(jasmine.plcTestRunParameters.mode === 'all'){
	describe(
			'xs.db.persistency-misc-integrationtests',
			function() {
				var Constants = require("../../../lib/xs/util/constants");
				var testData = require("../../testdata/testdata").data;
				var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
				var mockstar_helpers = require("../../testtools/mockstar_helpers");

				var PersistencyImport = $.import("xs.db", "persistency");
				var PersistencyMiscImport = require("../../../lib/xs/db/persistency-misc");

				var Persistency = PersistencyImport.Persistency;

				var mTableNames = PersistencyMiscImport.Tables;

				
				var originalProcedures = null;

				beforeOnce(function() {
					var oMockstar = new MockstarFacade();
					if (!oMockstar.disableMockstar) {
						var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '::';

						originalProcedures = PersistencyMiscImport.Procedures;
						PersistencyMiscImport.Procedures = Object.freeze({
							calculation_version_read : procedurePrefix + 'p_calculation_version_read',
							calculation_version_save : procedurePrefix + 'p_calculation_version_save',
							calculation_version_close : procedurePrefix + 'p_calculation_version_close',
							calculation : procedurePrefix + 'p_calculation',
							delete_item : procedurePrefix + 'p_item_delete_item_with_children'
						});
					}
				});

				afterOnce(function() {
					var oMockstar = new MockstarFacade();
					if (!oMockstar.disableMockstar) {
						PersistencyMiscImport.Procedures = originalProcedures;
					}
				});

				describe('determineAvailableLanguage', function() {
					var oMockstar = null;
					var sTestTableName = mTableNames.costing_sheet_row__text;

					var oCostingSheetRowTestData = {
							COSTING_SHEET_ID : ["COGS","COGS","COGS"],
							COSTING_SHEET_ROW_ID : ["10","10","10"],
							LANGUAGE : ["DE","EN","ES"],
							COSTING_SHEET_ROW_DESCRIPTION : ["Row 10 DE","Row 10 EN","Row 10 ES"],
							_VALID_FROM : [new Date().toJSON(),new Date().toJSON(),new Date().toJSON()]
					};

					var aFallbackLanguages = Constants.FallbackLanguages;

					beforeOnce(function() {
						oMockstar = new MockstarFacade(// Initialize Mockstar
								{
									substituteTables : // substitute all used tables in the procedure or view
									{
										costing_sheet_row__text : sTestTableName
									}
								});					
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.initializeData();
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					it('should return preferred language', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						oMockstar.insertTableData("costing_sheet_row__text", oCostingSheetRowTestData);
						var sPreferredLanugage = 'DE';

						// act
						var sDeterminedLanguage = persistency.Misc.determineAvailableLanguage(sTestTableName, sPreferredLanugage);

						// assert
						expect(sDeterminedLanguage).toBe(sPreferredLanugage);
					});

					it('should return first fallback language', function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);
						oMockstar.insertTableData("costing_sheet_row__text", oCostingSheetRowTestData);
						var sPreferredLanugage = 'HE';

						// act
						var sDeterminedLanguage = persistency.Misc.determineAvailableLanguage(sTestTableName, sPreferredLanugage);

						// assert
						expect(sDeterminedLanguage).toBe(aFallbackLanguages[0]);
					});

					it('should return second fallback language', function() {
						// arrange
						var oCostingSheetRowData = {
								COSTING_SHEET_ID : ["COGS","COGS"],
								COSTING_SHEET_ROW_ID : ["10","10"],
								LANGUAGE : ["DE","ES"],
								COSTING_SHEET_ROW_DESCRIPTION : ["Row 10 DE","Row 10 ES"],
								_VALID_FROM : [new Date().toJSON(),new Date().toJSON(),new Date().toJSON()]
						};

						var persistency = new Persistency(jasmine.dbConnection);
						oMockstar.insertTableData("costing_sheet_row__text", oCostingSheetRowData);
						var sPreferredLanugage = 'HE';

						// act
						var sDeterminedLanguage = persistency.Misc.determineAvailableLanguage(sTestTableName, sPreferredLanugage);

						// assert
						expect(sDeterminedLanguage).toBe(aFallbackLanguages[1]);
					});

					it('should return first available language', function() {
						// arrange
						var firstAvailableLanguage = ['ES', 'IT'];

						var oCostingSheetRowData = {
								COSTING_SHEET_ID : ["COGS","COGS"],
								COSTING_SHEET_ROW_ID : ["10","10"],
								LANGUAGE : ["ES","IT"],
								COSTING_SHEET_ROW_DESCRIPTION : ["Row 10 ES","Row 10 IT"],
								_VALID_FROM : [new Date().toJSON(),new Date().toJSON(),new Date().toJSON()]
						};

						var persistency = new Persistency(jasmine.dbConnection);
						oMockstar.insertTableData("costing_sheet_row__text", oCostingSheetRowData);
						var sPreferredLanugage = 'HE';

						// act
						var sDeterminedLanguage = persistency.Misc.determineAvailableLanguage(sTestTableName, sPreferredLanugage);

						// assert
						expect(firstAvailableLanguage).toContain(sDeterminedLanguage);
					});

				});

				describe('getSystemMessages', function() {
					var oMockstar = null;

					var oSystemMessageData = {
							LANGUAGE:["EN","DE"],
							MESSAGE: ["System upgrade", "Systemaktualisierung \n läuft jetzt"]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables: {
								system_message: mTableNames.system_message
							},
						});
					});

					beforeEach(function() {
						oMockstar.insertTableData("system_message", oSystemMessageData);                
					});

					afterEach(function() {
						oMockstar.clearAllTables();
					});

					afterOnce(function() {
						oMockstar.cleanup(); // clean up all test artefacts
					});

					it('should return message when message exists in the requested language', function() {
						// arrange                                       
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var resultObject = unitUnderTest.Misc.getSystemMessages(oSystemMessageData.LANGUAGE[1]);

						// assert
						var aExpectedMessage =[ { MESSAGE: oSystemMessageData.MESSAGE[1] } ];
						expect(resultObject).toEqualObject(aExpectedMessage); 
					});  

					it('should return message in english when message exists in english', function() {
						// arrange                                       
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var resultObject = unitUnderTest.Misc.getSystemMessages(oSystemMessageData.LANGUAGE[0]);

						// assert
						var aExpectedMessage = [ { MESSAGE: oSystemMessageData.MESSAGE[0] } ];
						expect(resultObject).toEqualObject(aExpectedMessage); 
					});  

					it('should return message in default language (english) when message in requested language (UA) is not available', function() {
						// arrange
						var sLanguage = "UA";
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var resultObject = unitUnderTest.Misc.getSystemMessages(sLanguage);

						// assert
						var aExpectedMessage = [ { MESSAGE: oSystemMessageData.MESSAGE[0] } ];
						expect(resultObject).toEqualObject(aExpectedMessage); 
					});    

					it('should return empty array when no messages exist', function() {
						// arrange
						oMockstar.clearAllTables();
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						var resultObject = unitUnderTest.Misc.getSystemMessages(oSystemMessageData.LANGUAGE[0]);

						// assert
						var aExpectedMessage = [];
						expect(resultObject).toEqualObject(aExpectedMessage); 
					});  

					it("should throw Exception if sIsoLanguage is not valid", function() {
						// arrange
						var exception = null;
						var unitUnderTest = new Persistency(jasmine.dbConnection);

						// act
						try {
							unitUnderTest.Misc.getSystemMessages(undefined);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
					});
				});				

describe('getGroups', function() {
					var oMockstar = null;
					var persistency = null;

					var oGroupData = {
							SIDE_PANEL_GROUP_ID : [101, 201],
							SIDE_PANEL_GROUP_DISPLAY_ORDER : [1, 1],
							RESOURCE_KEY_GROUP_DESCRIPTION: ["TEST_GROUP_1", "TEST_GROUP_2"]
					};

					beforeOnce(function() {
						oMockstar = new MockstarFacade({
							substituteTables: {
								group: mTableNames.group
							},
						});
					});

					beforeEach(function() {
						oMockstar.clearAllTables();
						oMockstar.insertTableData("group", oGroupData);   

						persistency = new Persistency(jasmine.dbConnection);
					});

					afterEach(function() {
						oMockstar.clearAllTables();
					});

					afterOnce(function() {
						oMockstar.cleanup(); // clean up all test artefacts
					});

					it('should return all side panel groups', function() {
						// act
						var resultObject = persistency.Misc.getSidePanelGroups();

						// assert
						var aExpectedGroups = [{ SIDE_PANEL_GROUP_ID : 101, SIDE_PANEL_GROUP_DISPLAY_ORDER : 1, RESOURCE_KEY_GROUP_DESCRIPTION : "TEST_GROUP_1" },
						                       { SIDE_PANEL_GROUP_ID : 201, SIDE_PANEL_GROUP_DISPLAY_ORDER : 1, RESOURCE_KEY_GROUP_DESCRIPTION : "TEST_GROUP_2" }];
						expect(resultObject).toEqualObject(aExpectedGroups); 
					});  

				});

				describe('get lock', function() {
					var oMockstar = null;
					var oPersistency = null;
					var testPackage = $.session.getUsername().toLowerCase();

					var oBeforeYesterday = new Date();
					oBeforeYesterday.setDate(oBeforeYesterday.getDate() -2);

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
								{
									substituteTables:
									{
										lock: mTableNames.lock,
										application_timeout: {
											name: mTableNames.application_timeout,
											data: testData.oApplicationTimeout
										},
										session: mTableNames.session

									}
								});
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					beforeEach(function(){
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						var PersistencyImport = $.import("xs.db", "persistency");
						oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
					});

					it("should return the object if it is locked by another user than the current one", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: new Date()
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ "User_1" ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : [new Date()]
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var aLock = oPersistency.Misc.getLock(oLockObject.LOCK_OBJECT, 'User_2');

						// assert
						expect(aLock[0]).toEqual(oLockObject);
						expect(mockstar_helpers.getRowCount(oMockstar, "lock")).toEqual(1);
					});

					it("should not return the object if it is an invalid lock by another user than the current one", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: oBeforeYesterday
						};
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var aLock = oPersistency.Misc.getLock(oLockObject.LOCK_OBJECT, 'User_2');

						// assert
						expect(aLock.length).toEqual(0);
						expect(mockstar_helpers.getRowCount(oMockstar, "lock")).toEqual(0);
					});

					it("should not return the object if it is locked by a user with timeout session", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: new Date()
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ "User_1" ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : ['2015-01-01T15:39:09.691Z']
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var aLock = oPersistency.Misc.getLock(oLockObject.LOCK_OBJECT, 'User_2');

						// assert
						expect(aLock.length).toEqual(0);
						expect(mockstar_helpers.getRowCount(oMockstar, "lock")).toEqual(0);
					});

					it("should not release the lock of a timedout session for the object if it is not requested", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: '2015-01-01T15:39:09.691Z'
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ "User_1" ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : ['2015-01-01T15:39:09.691Z']
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var aLock = oPersistency.Misc.getLock('Costing_Sheet', 'User_2');

						// assert
						expect(mockstar_helpers.getRowCount(oMockstar, "lock", "LOCK_OBJECT='metadata' and USER_ID = 'User_1'")).toEqual(1);
					});
					
					it("should return the object if it is locked by current user and bIncludingCurrentUser is true", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: testData.sSessionId,
								LAST_UPDATED_ON: new Date()
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ testData.sSessionId ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : [new Date()]
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var aLock = oPersistency.Misc.getLock(oLockObject.LOCK_OBJECT, 'User_2', true);

						// assert
						expect(aLock[0]).toEqual(oLockObject);
						expect(mockstar_helpers.getRowCount(oMockstar, "lock")).toEqual(1);
					});
				});

				describe('set lock', function() {
					var oMockstar = null;
					var oPersistency = null;
					var testPackage = $.session.getUsername().toLowerCase();

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
								{
									substituteTables:
									{
										lock: mTableNames.lock,
										session: mTableNames.session
									}
								});
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					beforeEach(function(){
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						var PersistencyImport = $.import("xs.db", "persistency");
						oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
					});

					it("set lock on a specific object for a specific user", function() {
						// arrange
						var sObject = 'metadata';
						var sUser = 'I305774';

						// act
						oPersistency.Misc.setLock(sObject, sUser);

						// assert
						var result = mockstar_helpers.getRowCount(oMockstar, "lock");
						expect(result).toEqual(1);
					});

					it("set lock on a specific object for a specific user, even if it is locked by a timeout session", function() {
						// arrange
						var sObject = 'metadata';
						var sUser = 'user_2';

						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: new Date()
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ "User_1" ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : ['2015-01-01T15:39:09.691Z']
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						oPersistency.Misc.setLock(sObject, sUser);

						// assert
						var result = mockstar_helpers.getRowCount(oMockstar, "lock");
						expect(result).toEqual(1);
					});
					
					it("should not set lock on a specific object if the object is already locked", function() {
						// arrange
						var sObject = 'metadata';
						var sUser = 'user_2';

						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'User_1',
								LAST_UPDATED_ON: new Date()
						};
						var oSessionValues = {
								SESSION_ID : [ "Session_A"],
								USER_ID : [ "User_1" ],
								LANGUAGE : [ "EN" ],
								LAST_ACTIVITY_TIME : [new Date()]
						};

						oMockstar.insertTableData("session", oSessionValues);
						oMockstar.insertTableData("lock", oLockObject);

						// act
						oPersistency.Misc.setLock(sObject, sUser);

						// assert
						var result = mockstar_helpers.getRowCount(oMockstar, "lock", "USER_ID = 'user_2'");
						expect(result).toEqual(0);
						var result = mockstar_helpers.getRowCount(oMockstar, "lock", "USER_ID = 'User_1'");
						expect(result).toEqual(1);
					});
				});

				describe('release lock', function() {
					var oMockstar = null;
					var oPersistency = null;
					var testPackage = $.session.getUsername().toLowerCase();

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
								{
									substituteTables:
									{
										lock: mTableNames.lock
									}
								});
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					beforeEach(function(){
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						var PersistencyImport = $.import("xs.db", "persistency");
						oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
					});

					it("release lock for a specific user", function() {
						// arrange
						var oLockObject = {
								LOCK_OBJECT: 'metadata',
								USER_ID: 'I305774',
								LAST_UPDATED_ON: new Date()
						};
						oMockstar.insertTableData("lock", oLockObject);

						// act
						var iRowCount = oPersistency.Misc.releaseLock(oLockObject.USER_ID);

						// assert
						var result = mockstar_helpers.getRowCount(oMockstar, "lock");
						expect(result).toEqual(0);
						expect(iRowCount).toEqual(1);
					});
				});

				describe('getDefaultSettings', function() {
					var oMockstar = null;
					var oPersistency = null;

					beforeOnce(function() {
						oMockstar = new MockstarFacade( // Initialize Mockstar
								{
									substituteTables:
									{
										settings: {
											name: mTableNames.default_settings,
											data: {
												"USER_ID": ["", "TEST"],
												"CONTROLLING_AREA_ID": ["CA1", "CA2"],
												"COMPANY_CODE_ID": ["CC1", ""],
												"PLANT_ID": ["PL1", "PL2"],
												"REPORT_CURRENCY_ID": ["RC1", "RC2"],
												"COMPONENT_SPLIT_ID": ["SPL1", "CPL2"],
												"COSTING_SHEET_ID": ["CSH1", "CSH2"]
											}
										}
									}
								});
					});

					afterOnce(function() {
						oMockstar.cleanup();
					});

					beforeEach(function(){
						oMockstar.clearAllTables();
						oMockstar.initializeData();
						var PersistencyImport = $.import("xs.db", "persistency");
						oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
					});

					it("Settings exist for User", function() {
						// arrange

						// act
						var result = oPersistency.Misc.getDefaultSettings("TEST");

						// assert
						expect(result.CONTROLLING_AREA_ID).toEqual("CA2");
						expect(result.COMPANY_CODE_ID).toEqual(""); // ta
						expect(result.USER_ID).not.toBeDefined();
					});

					it("Settings don't exist for User, take global settings", function() {
						// arrange

						// act
						var result = oPersistency.Misc.getDefaultSettings("Other");

						// assert
						expect(result.CONTROLLING_AREA_ID).toEqual("CA1");
						expect(result.COMPANY_CODE_ID).toEqual("CC1");
						expect(result.USER_ID).not.toBeDefined();
					});
				});
				
					describe('getPLCUsers', function() {
					var oPersistency = null;	
					var oMockstar = null;

					beforeOnce(function(){
							oMockstar = new MockstarFacade( // Initialize Mockstar
							{
								substituteTables:
								{
									settings: {
										name: mTableNames.auto_complete_user,
										data: {
											"USER_ID": ["SYSTEM"]
										}
									}
								}
							});					
					});
					
					afterOnce(function(){
						oMockstar.cleanup();
					});
					
					beforeEach(function(){
						var PersistencyImport = $.import("xs.db", "persistency");
						oPersistency = new PersistencyImport.Persistency(jasmine.dbConnection);
						
						oMockstar.clearAllTables();
						oMockstar.initializeData();
					});


					it("return the correct user based on given parameter", function() {
						// arrange
						var iTop = 100;
	                    var sSearchAutoComplete = 'SYSTEM';
						var result = '';

						// act
						result = oPersistency.Misc.getPLCUsers(sSearchAutoComplete, iTop);

						// assert
						expect(result.length).toBe(1);
					});
					
					it("return no user", function() {
						// arrange
						var iTop = 100;
	                    var sSearchAutoComplete = 'dummyuserjustforthistest';
						var result = [];

						// act
						result = oPersistency.Misc.getPLCUsers(sSearchAutoComplete, iTop);

						// assert
						expect(result.length).toBe(0);
					});

					it("top parameter works correctly", function() {
						// arrange
						var iTop = 1;
						var result = '';

						// act
						result = oPersistency.Misc.getPLCUsers('', iTop);

						// assert
						expect(result.length).toBe(1);
					});
				});

			}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}
