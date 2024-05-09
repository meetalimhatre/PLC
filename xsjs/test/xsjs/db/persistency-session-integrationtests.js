describe('xsjs.db.persistency-session-integrationtests', function() {
	var _ = require("lodash");
	var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
	var mockstar_helpers = require("../../testtools/mockstar_helpers");

	var PersistencyImport = $.import("xs.db", "persistency");
	var PersistencySession = require("../../../lib/xs/db/persistency-session");
	const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
	const testData = require("../../testdata/testdata").data;
	var Persistency = PersistencyImport.Persistency;

	var mTableNames = PersistencySession.Tables;
	
	var originalProcedures = null;
	const sStandardPriceStrategy = testData.sStandardPriceStrategy;
	beforeOnce(function() {
		var oMockstar = new MockstarFacade();
		if (!oMockstar.disableMockstar) {
			var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '::';

			originalProcedures = PersistencySession.Procedures;
			PersistencySession.Procedures = Object.freeze({
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
			PersistencySession.Procedures = originalProcedures;
		}
	});

	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('isSessionOpened', function() {
			var mockstar = null;
			var oCorrectSessionValues = {
					SESSION_ID : [ "Session_A", "Session_B" ],
					USER_ID : [ "User_1", "User_2" ],
					LANGUAGE : [ "DE", "EN" ],
					LAST_ACTIVITY_TIME : [ new Date(), new Date()]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						sessionTable : mTableNames.session
					},
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("sessionTable", oCorrectSessionValues);
			});

			afterOnce(function() {
				mockstar.cleanup();

			});

			it('should return true when session exists for user', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = oCorrectSessionValues.SESSION_ID[0];
				var sUserId = oCorrectSessionValues.USER_ID[0];

				// act
				var resultObject = persistency.Session.isSessionOpened(sSessionId, sUserId);

				// assert
				expect(resultObject).toBeTruthy();
			});

			it('should return false when session does not exist for user', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "False_Session";
				var sUserId = oCorrectSessionValues.USER_ID[0];

				// act
				var resultObject = persistency.Session.isSessionOpened(sSessionId, sUserId);

				// assert
				expect(resultObject).toBeFalsy();
			});
		});
	}
	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('getSessionDetails', function() {
			var mockstar = null;
			var sessionTable = null;

			var oSessionData = {
					SESSION_ID : "sessionId",
					USER_ID : "userId",
					LANGUAGE : "DE",
					LAST_ACTIVITY_TIME : new Date()
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						session : mTableNames.session
					},
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("session", oSessionData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				mockstar.cleanup(mockstar.userSchema);
			});

			it("should return session details when session exists", function() {
				// arrange
				var sessionData_2 = _.clone(oSessionData);
				sessionData_2.SESSION_ID = "otherSessionId";
				mockstar.insertTableData("session", sessionData_2);
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var oReturnedData = persistency.Session.getSessionDetails(oSessionData.SESSION_ID, oSessionData.USER_ID);

				// assert
				expect(oReturnedData.userId).toBe(oSessionData.USER_ID);
				expect(oReturnedData.sessionId).toBe(oSessionData.SESSION_ID);
				expect(oReturnedData.language).toBe(oSessionData.LANGUAGE);
				expect(oReturnedData.lifetime).toBeDefined();
				expect(oReturnedData.lastActivityTime).toEqual(oSessionData.LAST_ACTIVITY_TIME);
			});
		});
	}
	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('updateSessionForOpenCalculationVersion', function() {
			var mockstar = null;
			var sessionTable = null;
			var itemTemporaryTable = null;
			var calculationVersionTemporaryTable = null;
			var openCalculationVersionsTable = null;
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			var day = date.getDate();
			var sDateString = year + "-" + (month < 10 ? "0"+month : month) + "-" + (day < 10 ? "0"+day : day);

			var oSessionData = {
					SESSION_ID: ["INITIAL_SESSION", "INITIAL_SESSION_B"],
					USER_ID: ["USER_A", "USER_B"],
					LANGUAGE: ["DE", "DE"],
					LAST_ACTIVITY_TIME : [ new Date(), new Date()]
			};

			var oOpenCalcVersionData = {
					SESSION_ID : ["INITIAL_SESSION","INITIAL_SESSION_B"],
					CALCULATION_VERSION_ID : [12345,12345],
					IS_WRITEABLE : [1, 0]
			};

			var oCalcVersionTempData = {
					SESSION_ID : ["INITIAL_SESSION","INITIAL_SESSION_B"],
					CALCULATION_VERSION_ID : [12345,12345],
					CALCULATION_ID : [12345,12345],
					CALCULATION_VERSION_NAME : ["BASELINE","BASELINE"],
					ROOT_ITEM_ID : [1,1],
					REPORT_CURRENCY_ID : [1,1],
					VALUATION_DATE : [sDateString,sDateString],
					MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy],
					ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy, sStandardPriceStrategy]
			};

			var oItemsTempData = {
					SESSION_ID : ["INITIAL_SESSION","INITIAL_SESSION","INITIAL_SESSION_B"],
					ITEM_ID : [1,2,2],
					CALCULATION_VERSION_ID : [12345,12345,12345],
					IS_ACTIVE : [1,1,1],
					ITEM_CATEGORY_ID :[1,1,1],
					CHILD_ITEM_CATEGORY_ID :[1,1,1],
					PRICE_FIXED_PORTION: [1,1,1],
					PRICE_VARIABLE_PORTION:[0,0,0],
					TRANSACTION_CURRENCY_ID:['EUR','EUR','EUR'],
					PRICE_UNIT: [1,1,1],
					PRICE_UNIT_UOM_ID:['EUR','EUR','EUR']
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						session: mTableNames.session,
						open_calculation_versions: mTableNames.open_calculation_versions,
						calculation_version_temporary: mTableNames.calculation_version_temporary,
						item_temporary: mTableNames.item_temporary
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("session", oSessionData);
				mockstar.insertTableData("open_calculation_versions", oOpenCalcVersionData);
				mockstar.insertTableData("calculation_version_temporary", oCalcVersionTempData);
				mockstar.insertTableData("item_temporary", oItemsTempData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				mockstar.cleanup(mockstar.userSchema);
			});

			it("should update session if session for user exists", function() {
				// arrange
				var sSessionId = 'NEW_SESSION';
				var sUserId = "USER_A";

				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.updateSessionForOpenCalculationVersion(sSessionId, sUserId);

				// assert
				// test that session table is still consistent
				var result = mockstar.execQuery("select session_id from {{session}} where session_id like 'INITIAL%'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows.length).toBe(2);

				result = mockstar.execQuery("select session_id from {{item_temporary}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.SESSION_ID.rows.length).toBe(2);

				result = mockstar.execQuery("select session_id from {{calculation_version_temporary}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.SESSION_ID.rows.length).toBe(1);

				result = mockstar.execQuery("select session_id from {{open_calculation_versions}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.SESSION_ID.rows.length).toBe(1);

			});

			it("should NOT update session if session for user does not exist", function() {
				// arrange
				var sSessionId = 'NEW_SESSION';
				var sUserId = "USER_C";

				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.updateSessionForOpenCalculationVersion(sSessionId, sUserId);

				// assert
				// test that session table is still consistent
				var result = mockstar.execQuery("select session_id from {{session}} where session_id like 'INITIAL%'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows.length).toBe(2);

				result = mockstar.execQuery("select session_id from {{item_temporary}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows.length).toBe(0);

				result = mockstar.execQuery("select session_id from {{calculation_version_temporary}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows.length).toBe(0);

				result = mockstar.execQuery("select session_id from {{item_temporary}} where session_id = '" + sSessionId + "'");
				expect(result).toBeDefined;
				expect(result.columns.SESSION_ID.rows.length).toBe(0);

			});
		});
	}

	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('upsertSession', function() {
			var mockstar = null;

			var oSessionData = {
					SESSION_ID : ["INITIAL_SESSION"],
					USER_ID : ["USER_A"],
					LANGUAGE : ["DE"],
					LAST_ACTIVITY_TIME : [ new Date() ]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						session: mTableNames.session
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("session", oSessionData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				mockstar.cleanup(mockstar.userSchema);
			});

			it("should create new session if session does not exist", function() {
				// arrange
				var sSessionId = 'NEW_SESSION';
				var sUserId = "USER_B";
				var sIsoLanguage = "DE";

				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.upsertSession(sSessionId, sUserId, sIsoLanguage);

				// assert
				var result = mockstar.execQuery("select session_id, user_id, language from {{session}} where user_id = '" + sUserId + "'");
				expect(result).toBeDefined;
				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.LANGUAGE.rows[0]).toEqual("DE");
				expect(result.columns.LANGUAGE.rows.length).toBe(1);

				// test for extected total entries
				result = mockstar.execQuery("select session_id, user_id, language from  {{session}} ");
				expect(result).toBeDefined();
				expect(result.columns.USER_ID.rows.length).toBe(2);
			});

			it("should update session if another session for the same user exists", function() {
				// arrange
				var sSessionId = 'NEW_SESSION';
				var sUserId = "USER_A";
				var sIsoLanguage = "DE";

				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.upsertSession(sSessionId, sUserId, sIsoLanguage);

				// assert
				var result = mockstar.execQuery("select session_id, user_id, language from  {{session}} where user_id = '" + sUserId + "'");
				expect(result).toBeDefined;
				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.LANGUAGE.rows[0]).toEqual(sIsoLanguage);
				expect(result.columns.LANGUAGE.rows.length).toBe(1);

				// test for extected total entries
				result = mockstar.execQuery("select session_id, user_id, language from  {{session}} ");
				expect(result).toBeDefined();
				expect(result.columns.USER_ID.rows.length).toBe(1);
			});

			it("should update language if session for same user exists", function() {
				// arrange
				var sSessionId = 'INITIAL_SESSION';
				var sUserId = "USER_A";
				var sIsoLanguage = "EN";

				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.upsertSession(sSessionId, sUserId, sIsoLanguage);

				// assert
				var result = mockstar.execQuery("select session_id, user_id, language from {{session}} where user_id = '" + sUserId + "'");
				expect(result).toBeDefined;
				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.LANGUAGE.rows[0]).toEqual(sIsoLanguage);
				expect(result.columns.LANGUAGE.rows.length).toBe(1);

				// test for extected total entries
				result = mockstar.execQuery("select session_id, user_id, language from {{session}}");
				expect(result).toBeDefined();
				expect(result.columns.USER_ID.rows.length).toBe(1);
			});
		});
	}

	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('deleteSession', function() {
			var mockstar = null;
			var oSessionValues = {
					SESSION_ID : [ "Session_A", "Session_B" ],
					USER_ID : [ "User_1", "User_2" ],
					LANGUAGE : [ "DE", "EN" ],
					LAST_ACTIVITY_TIME : [new Date(), new Date()]
			};

			var oOpenCalculationVersionsTestData = {
					"SESSION_ID" : [ "Session_A", "Session_B" ],
					"CALCULATION_VERSION_ID" : [ 2000, 2001 ],
					"IS_WRITEABLE" : [ 1, 1 ]
			};

			var oLockObject = {
					LOCK_OBJECT: 'metadata',
					USER_ID: 'User_1',
					LAST_UPDATED_ON: new Date()
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						sessionTable : mTableNames.session,
						open_calculation_versions: mTableNames.open_calculation_versions,
						lock: mTableNames.lock
					},
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("sessionTable", oSessionValues);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it('should delete session from table when session exists, also delete locks associated with the session', function() {
				// arrange
				mockstar.insertTableData("lock", oLockObject);
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "Session_A";
				var sUserId = 'User_1';
				var iCount = mockstar_helpers.getRowCount(mockstar, "lock", "user_id='" + sUserId + "'");

				// act
				var resultObject = persistency.Session.deleteSession(sSessionId, sUserId);

				// assert
				expect(resultObject).toBe(1);
				//check for deleted lock
				var iCountAfter = mockstar_helpers.getRowCount(mockstar, "lock", "user_id='" + sUserId + "'");
				expect(iCount).toBe(1);
				expect(iCountAfter).toBe(0);
			});

			it('should return 0 when session not found in table', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "Session";
				var sUserId = "User";

				// act
				var resultObject = persistency.Session.deleteSession(sSessionId, sUserId);

				// assert
				expect(resultObject).toBe(0);
			});

			it('should return 1 when opened calculation versions are found in the session, and session is deleted', function() {
				// arrange
				mockstar.insertTableData("open_calculation_versions", oOpenCalculationVersionsTestData);
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "Session_A";
				var sUserId = "User_1";
				var exception;

				var resultObject = persistency.Session.deleteSession(sSessionId, sUserId);

				// assert
				expect(resultObject).toBe(1);
			});
		});
	}

	if(jasmine.plcTestRunParameters.mode === 'all') {
		describe('updateLastActivity', function() {
			var mockstar = null;
			var oSessionValues = {
					SESSION_ID : [ "Session_A", "Session_B" ],
					USER_ID : [ "User_1", "User_2" ],
					LANGUAGE : [ "DE", "EN" ],
					LAST_ACTIVITY_TIME : ['2001-01-01T00:00:00.000Z', '2001-01-01T00:00:00.000Z']
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						sessionTable : mTableNames.session,
						item_temporary : mTableNames.item_temporary,
						calculation_version_temporary : mTableNames.calculation_version_temporary,
						lock : mTableNames.lock
					},
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("sessionTable", oSessionValues);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it('should update the last activity time', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "Session_A";
				var sUserId = "User_1";

				// act
				persistency.Session.updateLastActivity(sSessionId, sUserId);

				// assert
				var result = mockstar.execQuery(
					`select session_id, user_id, seconds_between(last_activity_time, CURRENT_UTCTIMESTAMP) as lifetime from {{sessionTable}}
					where session_id = '${sSessionId}' and user_id = '${sUserId}'`);

				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.SESSION_ID.rows[0]).toEqual(sSessionId);
				expect(result.columns.LIFETIME.rows[0]).toBeLessThan(5);
			});

			it('should throw exception when session not found in table', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sSessionId = "Session";
				var sUserId = "User";
				var exception;

				// act
				try {
					var resultObject = persistency.Session.updateLastActivity(sSessionId, sUserId);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code.code).toBe('GENERAL_UNEXPECTED_EXCEPTION');
			});
		});
		
		describe('updateLastUserActivity', function() {
			var mockstar = null;
			var oUserActivity = {
				USER_ID : ["User1", "User2", "User3"],
				LAST_ACTIVITY_TIME : ["2019-01-20T00:00:00.000Z", "2019-02-20T00:00:00.000Z", "2019-01-21T00:00:00.000Z"]
			};

			beforeOnce(function() {
				mockstar = new MockstarFacade({
					substituteTables : {
						user_activity : mTableNames.user_activity
					},
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("user_activity", oUserActivity);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it('should insert the  user last activity', function() {
			// arrange
				let persistency = new Persistency(jasmine.dbConnection);
				let sUserId = "User_1";
				const iCountUsers = mockstar.execQuery(
					`select count(*) as rowcount from {{user_activity}}`);
				const sCurrentDate = "2019-01-29T00:00:00.000Z";	

				// act
				persistency.Session.updateLastUserActivity(sUserId,sCurrentDate);

				// assert
				const result = mockstar.execQuery(
					`select USER_ID, LAST_ACTIVITY_TIME from {{user_activity}}
					where  user_id = '${sUserId}'`);
				const iCountResultUsers = mockstar.execQuery(
						`select count(*) as rowcount from {{user_activity}}`);	

				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);	
				expect(iCountResultUsers.columns.ROWCOUNT.rows[0]).toEqual(4);
				expect(result.columns.LAST_ACTIVITY_TIME.rows[0].toJSON()).toEqual(sCurrentDate);
				expect(iCountUsers.columns.ROWCOUNT.rows[0]).toEqual(3);		
			});

			it('should update last activity for user', function() {
				// arrange
				let persistency = new Persistency(jasmine.dbConnection);
				const sUserId = "User1";
				const iCountUsers = mockstar.execQuery(
								   `select count(*) as rowcount from {{user_activity}}`);
				const sCurrentDate = '2019-01-29T00:00:00.000Z';				   

				// act
				persistency.Session.updateLastUserActivity(sUserId,sCurrentDate);

				// assert
				const result = mockstar.execQuery(
					`select USER_ID, LAST_ACTIVITY_TIME  from {{user_activity}}
					where  user_id = '${sUserId}'`);
				const iCountResultUsers = mockstar.execQuery(
					`select count(*) as rowcount from {{user_activity}}`);	

				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.LAST_ACTIVITY_TIME.rows[0].toJSON()).toEqual(sCurrentDate);
				expect(iCountResultUsers.columns.ROWCOUNT.rows[0]).toEqual(iCountUsers.columns.ROWCOUNT.rows[0]);
			});

			it('should update last activity for user and not insert duplicate user for same month in the last day of the month', function() {
				// arrange
				let persistency = new Persistency(jasmine.dbConnection);
				const sUserId = "User_Test";
				mockstar.execSingle(`insert into {{user_activity}} values('${sUserId}','2019-01-31T05:00:00.000Z')`);	
				const iCountUsers = mockstar.execQuery(
					`select count(*) as rowcount from {{user_activity}}`);		   
				const sCurrentDate = '2019-01-31T20:00:00.000Z';				   

				// act
				persistency.Session.updateLastUserActivity(sUserId,sCurrentDate);

				// assert
				const result = mockstar.execQuery(
					`select USER_ID, LAST_ACTIVITY_TIME  from {{user_activity}}
					where  user_id = '${sUserId}'`);
				const iCountResultUsers = mockstar.execQuery(
					`select count(*) as rowcount from {{user_activity}}`);	

				expect(result.columns.USER_ID.rows[0]).toEqual(sUserId);
				expect(result.columns.LAST_ACTIVITY_TIME.rows[0].toJSON()).toEqual(sCurrentDate);
				expect(iCountResultUsers.columns.ROWCOUNT.rows[0]).toEqual(iCountUsers.columns.ROWCOUNT.rows[0]);
			});
		});
	}

	describe('deleteOutdatedEntries', function() {
		var mockstar = null;

		var oTimeoutValues = {
				APPLICATION_TIMEOUT_ID: ["SessionTimeout"],
				VALUE_IN_SECONDS:[ 600 ]
		}

		beforeOnce(function() {
			mockstar = new MockstarFacade({
				substituteTables : {
					sessionTable : mTableNames.session,
					application_timeout: mTableNames.application_timeout,
					lock : mTableNames.lock,
					item_temporary : mTableNames.item_temporary,
					calculation_version_temporary: mTableNames.calculation_version_temporary,
					calculation_version: mTableNames.calculation_version,
					calculation: mTableNames.calculation,
					open_calculation_versions: mTableNames.open_calculation_versions,
					item_temporary_ext : mTableNames.item_temporary_ext

				},
			});
		});

		beforeEach(function() {

			mockstar.clearAllTables();
			mockstar.insertTableData("application_timeout", oTimeoutValues);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});


		it('should delete temporary data if session not in session_table', function() {
			// arrange
			var oLockTimeout = {
					LOCK_OBJECT : ["Costing_Sheet"],
					USER_ID : ["User_1"],
					LAST_UPDATED_ON : ['2015-01-01T15:39:09.691Z']

			};
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var oItemTempExt = {
						SESSION_ID: 'Session_1',
						CALCULATION_VERSION_ID: 1,
						ITEM_ID : 1
				};
				mockstar.insertTableData("item_temporary_ext", oItemTempExt);
				var resultItemTempExtBefore = mockstar.execQuery("select * from {{item_temporary_ext}}");
			}

			mockstar.insertTableData("lock", oLockTimeout);
			var persistency = new Persistency(jasmine.dbConnection);

			// act
			persistency.Session.deleteOutdatedEntries();

			// assert
			var resultSession = mockstar.execQuery("select * from {{sessionTable}}");
			expect(resultSession.columns.SESSION_ID.rows.length).toBe(0);
			var resultLock = mockstar.execQuery("select * from {{lock}}");
			expect(resultLock.columns.USER_ID.rows.length).toBe(0);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var resultItemTempExt = mockstar.execQuery("select * from {{item_temporary_ext}}");
				expect(resultItemTempExt.columns.SESSION_ID.rows.length).toBe(resultItemTempExtBefore.columns.SESSION_ID.rows.length-1);
			}
		});
		
		
		it('should delete calculations without persistent calculation version', function() {
			// arrange
			var oCalculationBuilder = new TestDataUtility(testData.oCalculationTestData);

			var oActiveSession = new TestDataUtility(testData.oSessionTestData).getObject(0);
			oActiveSession.SESSION_ID = "ACTIVE_SESSION";
						
			// it's important that calculations with initial temporary versions in active sessions do not get deleted, since this could
			// remove calculations from other users; test data is arranged accordingly to ensure this is not happening
			var oCalculationWithTempVersion = oCalculationBuilder.getObject(0);
			oCalculationWithTempVersion.CALCULATION_ID = 2378243;
			oCalculationWithTempVersion.CALCULATION_NAME = 'Temp CalculationName With Version';
			var oCvTemp = new TestDataUtility(testData.oCalculationVersionTemporaryTestData).getObject(0);
			oCvTemp.CALCULATION_ID = oCalculationWithTempVersion.CALCULATION_ID;
			oCvTemp.SESSION_ID = oActiveSession.SESSION_ID;
			oCalculationBuilder.addObject(oCalculationWithTempVersion);
			
			var iValidCalculationCount = oCalculationBuilder.getObjectCount();
			
			// create a calculation without version and temporary version; this is supposed to be removed by deleteOutdatedEntries
			var oCalculationWithoutVersions = oCalculationBuilder.getObject(0);
			oCalculationWithoutVersions.CALCULATION_ID = 98765431;
			oCalculationBuilder.addObject(oCalculationWithoutVersions);
			
			mockstar.insertTableData("sessionTable", oActiveSession);
			mockstar.insertTableData("calculation", oCalculationBuilder.build());
			mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			mockstar.insertTableData("calculation_version_temporary", oCvTemp);
			var persistency = new Persistency(jasmine.dbConnection);
			
			// act
			persistency.Session.deleteOutdatedEntries();
			
			// assert
			var oResult = mockstar.execQuery(`select calculation_id from {{calculation}}`);
			// existing calculation with versions should not be deleted; check if none of the valid calculation from the test data got deleted
			expect(oResult.columns.CALCULATION_ID.rows.length).toBe(iValidCalculationCount);
			expect(_.includes(oResult.columns.CALCULATION_ID.rows, oCalculationWithoutVersions.CALCULATION_ID)).toBe(false);
		});

		if(jasmine.plcTestRunParameters.mode === 'all') {
			it('should not delete temporary data if session exists in session table even if session is timedout', function() {
				// arrange
				var oLockTimeout = {
						LOCK_OBJECT : ["Costing_Sheet"],
						USER_ID : ["User_2"],
						LAST_UPDATED_ON : ['2015-01-01T15:39:09.691Z']

				};

				var oSessionTimeoutValues = {
						SESSION_ID : [ "Session_B" ],
						USER_ID : [ "User_2" ],
						LANGUAGE : [ "EN" ],
						LAST_ACTIVITY_TIME : [ '2015-01-01T15:39:09.691Z']
				};

				mockstar.insertTableData("sessionTable", oSessionTimeoutValues);
				mockstar.insertTableData("lock", oLockTimeout);
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.deleteOutdatedEntries();

				// assert
				var resultLock = mockstar.execQuery("select * from {{lock}}");
				expect(resultLock.columns.USER_ID.rows.length).toBe(1);
			});
			
			it("release lock table", function() {
				// arrange
				var oLockObject = {
						LOCK_OBJECT: 'metadata',
						USER_ID: 'I305774',
						LAST_UPDATED_ON: new Date()
				};
				mockstar.insertTableData("lock", oLockObject);
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Session.releaseLockTable(oLockObject.LOCK_OBJECT);

				// assert
				var result = mockstar_helpers.getRowCount(mockstar, "lock");
				expect(result).toEqual(0);
			});
		}

	});
	
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);