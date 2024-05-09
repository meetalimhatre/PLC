var _ = require("lodash");
var testData = require("../../testdata/testdata").data;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;


describe('xsjs.authorization.groups-integrationtests', function () {
	var Persistency = $.import("xs.db", "persistency").Persistency;
	var oCtx = DispatcherLibrary.prepareDispatch($);

	var oMockstar = null;
	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function () {

		oMockstar = new MockstarFacade(
			{
				substituteTables: {
					usergroup: {
						name: "sap.plc.db::auth.t_usergroup",
						data: testData.oUserGroups
					},
					usergroup_user: {
						name: "sap.plc.db::auth.t_usergroup_user",
						data: testData.oUserGroupUser
					},
					usergroup_usergroup: {
						name: "sap.plc.db::auth.t_usergroup_usergroup",
						data: testData.oUserGroupUserGroups
					},
					lock: "sap.plc.db::basis.t_lock",
					session: {
						name: "sap.plc.db::basis.t_session",
						data: testData.oSessionTestData
					}
				}
			});
	});

	beforeEach(function () {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
	});

	function buildRequest(params, iHttpMethod, oGroup) {
		// parameter object to simulate the list of parameters from request

		var oRequest = {
			queryPath: "groups",
			method: iHttpMethod
		};
		if (!_.isNull(params)) {
			params.get = function (sArgument) {
				var oParam = _.find(params, function (oParam) {
					return sArgument === oParam.name;
				});

				return oParam !== undefined ? oParam.value : undefined;
			};
			oRequest.parameters = params;
		}
		if (!_.isNull(oGroup)) {
			var oBody = {
				asString: function () {
					return JSON.stringify(oGroup);
				}
			};
			oRequest.body = oBody;
		}
		return oRequest;
	}

	if (jasmine.plcTestRunParameters.mode === 'all') {

		describe('get', function () {

			beforeEach(function () {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.initializeData();
			});

			it('should read all group', function () {
				//arrange
				var params = [];
				var oRequest = buildRequest(params, $.net.http.GET, null);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body;

				expect(oReturnedObject.GROUPS.length).toBe(7);
				expect(oReturnedObject.GROUPS).toMatchData({
					"GROUP_ID": ['USRGR1', 'UGR2', 'USRGR3', 'USRGR4', 'USRGR5', 'UGR6', 'USRGR7'],
					"DESCRIPTION": ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7']
				}, ["GROUP_ID"]);
			});

			it('should read the group and the group users and subgroups for a given id', function () {
				//arrange
				var params = [{
					name: "id",
					value: "USRGR1"
				}];
				var oRequest = buildRequest(params, $.net.http.GET, null);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body;

				expect(oReturnedObject.GROUPS.length).toBe(1);
				expect(oReturnedObject.GROUPS).toMatchData({
					"GROUP_ID": ['USRGR1'],
					"DESCRIPTION": ['Group 1']
				}, ["GROUP_ID"]);
				expect(oReturnedObject.SUBGROUPS.length).toBe(4);
				expect(oReturnedObject.SUBGROUPS).toMatchData({
					"GROUP_ID": ['UGR6', 'UGR2', 'USRGR5', 'USRGR3'],
					"DESCRIPTION": ['Group 6', 'Group 2', 'Group 5', 'Group 3']
				}, ["GROUP_ID"]);
				expect(oReturnedObject.MEMBERS.length).toBe(3);
				expect(oReturnedObject.MEMBERS).toMatchData({ "USER_ID": ['USR1', 'USR2', 'USR3'] }, ["USER_ID"]);
			});

			it('should return the groups filtered by searchAutocomplete', function () {
				//arrange
				var params = [{
					name: "searchAutocomplete",
					value: "UG"
				}];
				var oRequest = buildRequest(params, $.net.http.GET, null);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body;

				expect(oReturnedObject.GROUPS.length).toBe(2);
			});

			it('should throw exception when group id is not found', function () {
				//arrange
				var params = [{
					name: "id",
					value: "USRGR"
				}];
				var oRequest = buildRequest(params, $.net.http.GET, null);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});

			it('should set the is_locked to 1 if groups are locked by someone else', function () {
				//arrange
				var oLock = {
					"LOCK_OBJECT": "group",
					"USER_ID": testData.sSecondUser,
					"LAST_UPDATED_ON": new Date()
				};
				oMockstar.insertTableData("lock", oLock);

				var params = [{
					name: "lock",
					value: "true"
				}];
				var oRequest = buildRequest(params, $.net.http.GET, null);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.LOCK_STATUS.IS_LOCKED).toBe(1);
				expect(oResponseObject.body.LOCK_STATUS.USER_ID).toBe(testData.sSecondUser);
			});

			it('should set the lock on groups for the current user if they are not locked by someone else', function () {
				//arrange
				var params = [{
					name: "lock",
					value: "true"
				}];
				var oRequest = buildRequest(params, $.net.http.GET, null);
				oMockstar.clearTable("lock");

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				//check lock table
				var iLocks = mockstar_helpers.getRowCount(oMockstar, "lock", "user_id='" + testData.sSessionId + "'");
				expect(iLocks).toBe(1);
			});
		});

		describe('edit batch operation', function () {
			beforeEach(function () {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.initializeData();
			});

			it('should create the groups and the memberships - user or group', function () {
				//arrange
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": "Test Group 1"
						}, {
							"GROUP_ID": "TestGr2",
							"DESCRIPTION": "Test Group 2"
						}],
						"MEMBERS": []
					},
					"UPDATE": {
						"GROUPS": [
							{
								"GROUP_ID": "UGR6",
								"DESCRIPTION": "Updated descr"
							}
						]
					},
					"DELETE": {
						"MEMBERS": [
							{
								"GROUP_ID": "USRGR1",
								"USER_ID": "USR2"
							}, {
								"GROUP_ID": "USRGR4",
								"USER_ID": "USR1"
							}
						],
						"GROUPS": []
					}
				};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				//returns empty body
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body).toEqual({});
				var oGroupsAfer = oMockstar.execQuery("select * from {{usergroup}}");
				var oMembersAfer = oMockstar.execQuery("select * from {{usergroup_user}}");
				expect(oGroupsAfer).toMatchData({
					"USERGROUP_ID": ['USRGR1', 'UGR2', 'USRGR3', 'USRGR4', 'USRGR5', 'UGR6', 'USRGR7', 'TESTGR1', "TESTGR2"],
					"DESCRIPTION": ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Updated descr', 'Group 7', 'Test Group 1', 'Test Group 2']
				}, ["USERGROUP_ID"]);
				expect(oMembersAfer).toMatchData({
					"USERGROUP_ID": ['USRGR1', 'USRGR1', 'USRGR4', 'USRGR4'],
					"USER_ID": ['USR1', 'USR3', 'USR4', 'USR10']
				}, ["USERGROUP_ID", "USER_ID"]);
			});

			it('should throw exception if groups are locked by someone else', function () {
				//arrange
				var oLock = {
					"LOCK_OBJECT": "group",
					"USER_ID": testData.sSecondUser,
					"LAST_UPDATED_ON": new Date()
				};
				oMockstar.insertTableData("lock", oLock);

				//arrange
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": "Test Group 1"
						}, {
							"GROUP_ID": "TestGr2",
							"DESCRIPTION": "Test Group 2"
						}]
					}
				};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GROUPS_NOT_WRITABLE_ERROR');
			});

			it('should set lock for the current user in case it is not already set', function () {
				//arrange
				oMockstar.clearTable("lock");
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": "Test Group 1"
						}, {
							"GROUP_ID": "TestGr2",
							"DESCRIPTION": "Test Group 2"
						}]
					}
				};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var iLocks = mockstar_helpers.getRowCount(oMockstar, "lock", "user_id='" + testData.sSessionId + "'");
				expect(iLocks).toBe(1);
			});

			it('should throw exception for each object that could not be created, updated or deleted', function () {
				//arrange
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": "Test Group 1"
						}, {
							"GROUP_ID": "UGR2",
							"DESCRIPTION": "Test Group 2"
						}, {
							"GROUP_ID": "USRGR3",
							"DESCRIPTION": "Test Group 3"
						}],
						"MEMBERS": [{
							"GROUP_ID": "USRGR1",
							"USER_ID": "SYSTEM"
						}, {
							"GROUP_ID": "USRGR3",
							"USER_ID": "Tester2"
						}
						],
						"SUBGROUPS": [{
							"GROUP_ID": "USRGR1",
							"SUBGROUP_ID": "UGR2"
						}, {
							"GROUP_ID": "USRGR3",
							"SUBGROUP_ID": "USRGR1"
						}
						]
					},
					"UPDATE": {
						"GROUPS": [
							{
								"GROUP_ID": "UGR6",
								"DESCRIPTION": "Updated description"
							},
							{
								"GROUP_ID": "Ugg111",
								"DESCRIPTION": "Updated description"
							},
							{
								"GROUP_ID": "UGR111",
								"DESCRIPTION": "Updated description"
							}
						]
					},
					"DELETE": {
						"MEMBERS": [
							{
								"GROUP_ID": "USRGR1",
								"USER_ID": "USR2"
							}, {
								"GROUP_ID": "Test1",
								"USER_ID": "USR1"
							}, {
								"GROUP_ID": "Test2",
								"USER_ID": "USR1"
							}],
						"SUBGROUPS": [{
							"GROUP_ID": "USRGR4",
							"SUBGROUP_ID": "UGR"
						}, {
							"GROUP_ID": "USRGR4",
							"SUBGROUP_ID": "USRGR3"
						}
						]
					}
				};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(8);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_ALREADY_EXISTS_ERROR');
				expect(oResponseObject.head.messages[0].operation).toBe('Create');
				expect(oResponseObject.head.messages[1].code).toBe('GENERAL_ENTITY_ALREADY_EXISTS_ERROR');
				expect(oResponseObject.head.messages[1].operation).toBe('Create');
				expect(oResponseObject.head.messages[2].code).toBe('GENERAL_ENTITY_ALREADY_EXISTS_ERROR');
				expect(oResponseObject.head.messages[2].operation).toBe('Create');
				expect(oResponseObject.head.messages[3].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[3].operation).toBe('Delete');
				expect(oResponseObject.head.messages[4].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[4].operation).toBe('Delete');
				expect(oResponseObject.head.messages[5].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[5].operation).toBe('Delete');
				expect(oResponseObject.head.messages[6].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[6].operation).toBe('Update');
				expect(oResponseObject.head.messages[7].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[7].operation).toBe('Update');
			});

			it('should throw validation exceptions for each object that could not be validated from created, updated or deleted', function () {
				//arrange
				const sLongUserId = `
					SAP HANA functions as a comprehensive platform for the development and execution of native data-intensive 
					applications that run efficiently in SAP HANA, taking advantage of its in-memory architecture and parallel execution 
					capabilities. Structured accordingly, applications can profit from the increased performance provided by SAP HANA due 
					to the integration with the data source.
				`;
				const sSqlInjection = 'drop table t_auth_project';
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": "Test Group 1"
						}, {
							"GROUP_ID": "TestGr2",
							"DESCRIPTION1": "Test Group 2"
						}],
						"MEMBERS": [{
							"GROUP_ID": "TestGr2",
							"DESCRIPTION": "Test Group 1"
						},
						{
							"GROUP_ID": "TestGr2",
							"USER_ID": sLongUserId
						},
						{
							"GROUP_ID": "TestGr2",
							"USER_ID": sSqlInjection
						},
						]
					},
					"UPDATE": {
						"GROUPS": [
							{
								"GROUP_ID": "UGR6",
								"DESCRIPTION": "Updated description"
							}
						]
					},
					"DELETE": {
						"MEMBERS": [
							{
								"GROUP_ID": "USRGR1",
								"USER_ID1": "USR2"
							}, {
								"GROUP_ID": "USRGR4",
								"USER_ID": "USR1"
							}, {
								"GROUP_ID": "USRGR4",
								"USER_ID": sLongUserId
							}, {
								"GROUP_ID": "USRGR4",
								"USER_ID": sSqlInjection
							}
						],
						"GROUPS": []
					}
				};

				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(9);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[0].operation).toBe('Create');
				expect(oResponseObject.head.messages[0].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[1].operation).toBe('Create');
				expect(oResponseObject.head.messages[1].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[2].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[2].operation).toBe('Create');
				expect(oResponseObject.head.messages[2].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[3].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[3].operation).toBe('Create');
				expect(oResponseObject.head.messages[3].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[4].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[4].operation).toBe('Create');
				expect(oResponseObject.head.messages[4].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[5].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[5].operation).toBe('Delete');
				expect(oResponseObject.head.messages[5].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[6].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[6].operation).toBe('Delete');
				expect(oResponseObject.head.messages[6].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[7].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[7].operation).toBe('Delete');
				expect(oResponseObject.head.messages[7].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[8].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[8].operation).toBe('Delete');
				expect(oResponseObject.head.messages[8].validationInfoCode).toBe("VALUE_ERROR");
			});

			it('should throw validation error if group description is longer than 256', function () {
				//arrange
				let s257CharachtersLongString = new Array(257 + 1).join('c');
				var oBody = {
					"CREATE": {
						"GROUPS": [{
							"GROUP_ID": "TestGr1",
							"DESCRIPTION": s257CharachtersLongString
						}, {
							"GROUP_ID": "TestGr2",
							"DESCRIPTION": "Test Group 2"
						}],
						"MEMBERS": []
					},
					"UPDATE": {
						"GROUPS": [
							{
								"GROUP_ID": "UGR6",
								"DESCRIPTION": s257CharachtersLongString
							}
						]
					}
				};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(2);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[0].operation).toBe('Create');
				expect(oResponseObject.head.messages[0].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[1].code).toBe('GENERAL_VALIDATION_ERROR');
				expect(oResponseObject.head.messages[1].operation).toBe('Update');
				expect(oResponseObject.head.messages[1].validationInfoCode).toBe("VALUE_ERROR");
				
			});
		});
	}
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
