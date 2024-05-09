if (jasmine.plcTestRunParameters.mode === 'all') {
	describe(
			'xsjs.impl.calculation-versions-tests',
			function() {

				var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
				var _ = require("lodash");
				var calculationVersions = new (require("../../../lib/xs/impl/calculation-versions").CalculationVersions)($);
				var MessageLibrary = require("../../../lib/xs/util/message");
				var Constants = require("../../../lib/xs/util/constants");
				var helpers = require("../../../lib/xs/util/helpers");

				var PlcException = MessageLibrary.PlcException;
				var messageCode = MessageLibrary.Code;
				var severity = MessageLibrary.Severity;
                const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
                const testData = require("../../testdata/testdata").data;

				var oTestCalculationVersion = {
					CALCULATION_VERSION_ID : 2809,
					COSTING_SHEET_ID : "123",
					COMPONENT_SPLIT_ID : "1234",
					CALCULATION_ID : 1978,
					LOT_SIZE : 10,
					LOT_SIZE_UOM_ID : "St",
					CALCULATION_NAME : "Calculation Name",
					CALCULATION_VERSION_NAME : "Calculation Version Name"
				};

				var oConnectionMock = null;
				var oPersistencyMock = null;

				beforeEach(function() {
					spyOn($.trace, "error").and.returnValue(null);
					spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });
					oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);

					oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
					oPersistencyMock.getConnection.and.returnValue(oConnectionMock);
				});

				describe(
						"openCalculationVersion",
						function() {

							beforeEach(function() {
								var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "getSessionDetails" ]);
								oPersistencySessionMock.getSessionDetails.and.returnValue({
									userId : "userId",
									sessionId : "sessionId",
									language : "DE"
								});

								var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", [ "getComponentSplitBaseData",
										"getCostingSheetBaseData", "releaseLock" ]);
								var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [
										"open", "getSessionRecord", "getLockingUser", "setVersionLock", "getMasterVersions", "getVersionType", "checkLockCalculatingLifecycle" ]);
								
								oPersistencyCalculationVersionMock.setVersionLock.and.returnValue('userId');

								oPersistencyMock.Session = oPersistencySessionMock;
								oPersistencyMock.Misc = oPersistencyMiscMock;
								oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
							});

							it("should throw exception if session was not initilize before", function() {
								// arrange
								oPersistencyMock.Session.getSessionDetails.and.callFake(function() {
									throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION);
								});
								var exception = null;

								// act
								try {
									calculationVersions.openCalculationVersion(null, [], new ServiceOutput(), oPersistencyMock);
								} catch (e) {
									exception = e;
								}

								// assert
								expect(exception instanceof PlcException).toBe(true);
								expect(exception.code.code).toBe('GENERAL_UNEXPECTED_EXCEPTION');
							});

							it(
									"should throw PlcException with error code NOT_FOUND if given id in query path does not correspond to a calculation version",
									function() {
										// arrange
										oPersistencyMock.CalculationVersion.open.and.returnValue({});
										var exception = null;

										// act
										try {
											calculationVersions.openCalculationVersion(null, {
												id : 123
											}, new ServiceOutput(), oPersistencyMock);
										} catch (e) {
											exception = e;
										}

										// assert
										expect(exception.code.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
									});

							var oComponentSplitsVersionData = {
								COMPONENT_SPLIT_ID : "01",
								COMPONENT_SPLIT_DESCRIPTION : "SplitDescription",
								ACCOUNT_GROUPS : [ {
									ACCOUNT_GROUP_ID : 10,
									ACCOUNT_GROUP_DESCRIPTION : "Rohmaterial"
								}, {
									ACCOUNT_GROUP_ID : 20,
									ACCOUNT_GROUP_DESCRIPTION : "Kaufteile"
								} ]
							};
							var oCostingSheetVersionData = {
								COSTING_SHEET_ID : "COGM",
								COSTING_SHEET_DESCRIPTION : "Herstellkosten",
								ROWS : [ {
									COSTING_SHEET_ROW_ID : "MEK",
									COSTING_SHEET_ROW_DESCRIPTION : "Materialeinzelkosten"
								} ]
							};

							function prepareValidRequest() {
								var oRootItem = {
									ITEM_ID : 134,
									PARENT_ITEM_ID : null,
									CALCULATION_VERSION_ID : oTestCalculationVersion.CALCULATION_VERSION_ID
								};

								var oReadCalculationOutput = {
									version : oTestCalculationVersion,
									items : [ oRootItem ]
								};
								var oSessionRecord = {
									CALCULATION_VERSION_ID : oTestCalculationVersion.CACALCULATION_VERSION_ID
								};

								oPersistencyMock.CalculationVersion.open.and.returnValue(oReadCalculationOutput);
								oPersistencyMock.CalculationVersion.getSessionRecord.and.returnValue(oSessionRecord);
								oPersistencyMock.CalculationVersion.getMasterVersions.and.returnValue({});
							}

							it("should return valid calculation version object if version can be found in database", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								// checkResponseObject(oOutputObject);

								var transactional = oServiceOutput.payload.body.transactionaldata[0];
								expect(transactional.CALCULATION_VERSION_ID).toEqual(oTestCalculationVersion.CALCULATION_VERSION_ID);
								expect(_.isArray(transactional.ITEMS)).toBeTruthy();
							});

							it("should contain version status if version can be found in database", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								var oReturnedVersion = oServiceOutput.payload.body.transactionaldata[0];
								expect(oReturnedVersion.IS_WRITEABLE).toEqual(0);
							});
							
							it("should return the is-writeable info if the user gets the write-lock during opening the version ", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();
								oPersistencyMock.CalculationVersion.setVersionLock.and.returnValue({ 
									LockingUser: $.session.getUsername(), 
									LockingContext: Constants.CalculationVersionLockContext.CALCULATION_VERSION,
									LockMode: "write",
									IsReference: false,
									IsLifecycleVersion: false,
									IsFrozen: false,
									IsNotPrivileged: false
								 });

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								var oReturnedVersion = oServiceOutput.payload.body.transactionaldata[0];
								expect(oReturnedVersion.IS_WRITEABLE).toEqual(1);
							});
							
							it("should return the not-writeable info if the user has only READ instance-based privilege", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();
								oPersistencyMock.CalculationVersion.setVersionLock.and.returnValue({ 
									LockingUser: $.session.getUsername(), 
									LockingContext: Constants.CalculationVersionLockContext.CALCULATION_VERSION,
									LockMode: "read",
									IsReference: false,
									IsLifecycleVersion: false,
									IsFrozen: false,
									IsNotPrivileged: true
								 });

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								var oReturnedVersion = oServiceOutput.payload.body.transactionaldata[0];
								expect(oReturnedVersion.IS_WRITEABLE).toEqual(0);
								
								expect(oServiceOutput.payload.head.messages[0]).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].code).toEqual(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
								expect(oServiceOutput.payload.head.messages[0].severity).toEqual(severity.WARNING);
								expect(oServiceOutput.payload.head.messages[0].details.calculationVersionObjs).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].details.userObjs).toBeUndefined();
								expect(oServiceOutput.payload.head.messages[0].details.notWriteableEntityDetailsObj).toEqual(MessageLibrary.NotWriteableEntityDetailsCode.NOT_AUTHORIZED_TO_EDIT);		
							});
							
							it("should return a not-writeable info the locking user if the version is opened by someone else in write-mode", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();
								var sLockingUser = 'SomeOtherUser';
								oPersistencyMock.CalculationVersion.setVersionLock.and.returnValue({ 
									LockingUser: sLockingUser, 
									LockingContext: Constants.CalculationVersionLockContext.CALCULATION_VERSION,
									LockMode: "read",
									IsReference: false,
									IsLifecycleVersion: false,
									IsFrozen: false,
									IsNotPrivileged: false});

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								var oReturnedVersion = oServiceOutput.payload.body.transactionaldata[0];
								expect(oReturnedVersion.IS_WRITEABLE).toBe(0);

								expect(oServiceOutput.payload.head.messages[0]).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].code).toEqual(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
								expect(oServiceOutput.payload.head.messages[0].severity).toEqual(severity.WARNING);
								expect(oServiceOutput.payload.head.messages[0].details.userObjs[0]).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].details.userObjs[0].id).toEqual(sLockingUser);
								expect(oServiceOutput.payload.head.messages[0].details.calculationVersionObjs).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].details.notWriteableEntityDetailsObj).toEqual(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
								
							});
							
							it("should return a not-writeable info if the version is frozen", function() {
								// arrange
								prepareValidRequest();
								var oServiceOutput = new ServiceOutput();
								oPersistencyMock.CalculationVersion.setVersionLock.and.returnValue({ 
									LockingUser: null, 
									LockingContext: Constants.CalculationVersionLockContext.CALCULATION_VERSION,
									LockMode: "read",
									IsReference: false,
									IsLifecycleVersion: false,
									IsFrozen: true,
									IsNotPrivileged: false});

								// act
								calculationVersions.openCalculationVersion(null, [], oServiceOutput, oPersistencyMock);

								// assert
								var oReturnedVersion = oServiceOutput.payload.body.transactionaldata[0];
								expect(oReturnedVersion.IS_WRITEABLE).toBe(0);
								
								expect(oServiceOutput.payload.head.messages[0]).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].code).toEqual(messageCode.ENTITY_NOT_WRITEABLE_INFO.code);
								expect(oServiceOutput.payload.head.messages[0].severity).toEqual(severity.WARNING);
								expect(oServiceOutput.payload.head.messages[0].details.calculationVersionObjs).toBeDefined();
								expect(oServiceOutput.payload.head.messages[0].details.userObjs).toBeUndefined();
								expect(oServiceOutput.payload.head.messages[0].details.notWriteableEntityDetailsObj).toEqual(MessageLibrary.NotWriteableEntityDetailsCode.IS_FROZEN);
							});							
						});

				describe("save", function() {
					var oReadCalculationOutput = {
						version : oTestCalculationVersion,
						items : [],
						costingSheetResults : [],
						componentSplitResults : [],
						leafItemResults : []
					};

					beforeEach(function() {

						var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "getSessionDetails" ]);
						oPersistencySessionMock.getSessionDetails.and.returnValue({
							userId : "userId",
							sessionId : "sessionId",
							language : "DE"
						});

						var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", [ "getComponentSplitBaseData",
								"getCostingSheetBaseData" ]);
						var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [ "open",
								"getSessionRecord", "exists", "isNameUnique", "setNewId", "update", "save", "isOpenedInSessionAndContext",
								"isOpenedAndLockedInSessionAndContext", "saveCalculationResults", "getSaveRelevantFields", "isFrozen", "getMasterVersions", "getVersionType", "isLifecycleVersion", "setLifecycleVersionTypeToManual" ]);
						var oPersistencyItemMock = jasmine.createSpyObj("oPersistencyItemMock", [ "deleteItems", "getIdsOfDirtyItems",
								"getSaveRelevantFields" ]);
                        const oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getCopiedVariants", "update"]);
						oPersistencyMock.Session = oPersistencySessionMock;
						oPersistencyMock.Misc = oPersistencyMiscMock;
						oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
						oPersistencyMock.Item = oPersistencyItemMock;
						oPersistencyMock.Variant = oPersistencyVariantMock;

						oPersistencyMock.CalculationVersion.open.and.returnValue(oReadCalculationOutput);
						oPersistencyMock.CalculationVersion.getSaveRelevantFields.and.returnValue(oReadCalculationOutput);
						oPersistencyMock.CalculationVersion.exists.and.returnValue(false);
						oPersistencyMock.CalculationVersion.isNameUnique.and.returnValue(true);
						oPersistencyMock.CalculationVersion.setNewId.and.returnValue(1234);
						oPersistencyMock.CalculationVersion.isOpenedInSessionAndContext.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isOpenedAndLockedInSessionAndContext.and.returnValue(true);
						oPersistencyMock.CalculationVersion.getMasterVersions.and.returnValue({});
						
						oPersistencyMock.Item.getIdsOfDirtyItems.and.returnValue([]);
						oPersistencyMock.Variant.getCopiedVariants.and.returnValue({});
					});

					it("should check if calculation version is opened in current session for save calculation version", function() {
						// arrange
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
						oPersistencyMock.CalculationVersion.getVersionType.and.returnValue(1);

						// act
						calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
							action : "save"
						}, new ServiceOutput(), oPersistencyMock);

						// assert
						expect(oPersistencyMock.CalculationVersion.isOpenedInSessionAndContext).toHaveBeenCalled();
					});

					it("should call saveCalculationResults during save of a calculation version", function() {
						// arrange
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
					    oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
					    oPersistencyMock.CalculationVersion.getVersionType.and.returnValue(1);

						// act
						calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
							action : "save"
						}, new ServiceOutput(), oPersistencyMock);

						// assert
						expect(oPersistencyMock.CalculationVersion.saveCalculationResults).toHaveBeenCalled();
					});
					
					it("should throw error message is calculation version is frozen", function() {
						// prepare calculation version data
						// arrange
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(true);
						
						// try the save functionality
						// act
						var exception = null;
						try {
							calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
								action : "save"
							}, new ServiceOutput(), oPersistencyMock);
						} catch (e) {
							exception = e;
						}
						
					    // expect error message to be thrown
						// assert
						expect(exception.code.responseCode).toBe(MessageLibrary.Code.CALCULATIONVERSION_IS_FROZEN_ERROR.responseCode);
						expect(exception.code.code).toBe(MessageLibrary.Code.CALCULATIONVERSION_IS_FROZEN_ERROR.code);
								
					});
					it("should call getCopiedVariants during save of a version", function() {
						// arrange
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
					    oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
					    oPersistencyMock.CalculationVersion.getVersionType.and.returnValue(1);
						// act
						calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
							action : "save"
						}, new ServiceOutput(), oPersistencyMock);

						// assert
						expect(oPersistencyMock.Variant.getCopiedVariants).toHaveBeenCalled();
					});
					it("should call update variants during save of a version if the version has any variants with null as a LAST_MODIFIED_ON", function() {
						// arrange
                        const iCalculationVersionId = oTestCalculationVersion.CALCULATION_VERSION_ID;
                        const fPredicate = oObject => oObject.CALCULATION_VERSION_ID === iCalculationVersionId;
                        const aCopiedVariants = new TestDataUtility(testData.oVariantTestData).getObjects(fPredicate);
                        aCopiedVariants.forEach(oCopiedVariant => {
                            oCopiedVariant.LAST_MODIFIED_ON = null;
                        });

						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
					    oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
					    oPersistencyMock.CalculationVersion.getVersionType.and.returnValue(1);
					    oPersistencyMock.Variant.getCopiedVariants.and.returnValue(aCopiedVariants)

						// act
						calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
							action : "save"
						}, new ServiceOutput(), oPersistencyMock);

						// assert
						expect(oPersistencyMock.Variant.update).toHaveBeenCalled();
					});
					it("should not call update variants during save of a version if the version has no variants with null as a LAST_MODIFIED_ON", function() {
						// arrange
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
					    oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
					    oPersistencyMock.CalculationVersion.getVersionType.and.returnValue(1);
					    oPersistencyMock.Variant.getCopiedVariants.and.returnValue([])

						// act
						calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
							action : "save"
						}, new ServiceOutput(), oPersistencyMock);

						// assert
						expect(oPersistencyMock.Variant.update).not.toHaveBeenCalled();
					});
				});

				describe("handleCopyRequest", function() {
					beforeEach(function() {
						var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "isSessionOpened",
								"getSessionDetails" ]);						
						var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [ "exists",
								"existsCVTemp", "open", "setNewId" ]);
						
						oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
						oPersistencyMock.Session = oPersistencySessionMock;

						oPersistencyMock.Session.getSessionDetails.and.returnValue({
							userId : "userId",
							sessionId : "sessionId",
							language : "DE"
						});
					});

					it('handleCopyRequest_temporaryCV_throwsException', function() {
						// arrange
						oPersistencyMock.Session.isSessionOpened.and.returnValue(true);
						oPersistencyMock.CalculationVersion.exists.and.returnValue(false);
						oPersistencyMock.CalculationVersion.existsCVTemp.and.returnValue(true);
						oPersistencyMock.CalculationVersion.open.and.returnValue({
							version : {},
							items : []
						});
						oConnectionMock.commit.calls.reset();

						var params = {
							"action" : "copy",
							"id" : 123,
							"calculate" : false
						};

						// act
						var exception = null;
						try {
							calculationVersions.handlePostRequest(null, params, new ServiceOutput(), oPersistencyMock);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe('CALCULATIONVERSION_IS_TEMPORARY_ERROR');
						expect(exception.developerMessage).toBe(
								'The version is a temporary calculation version. Please save the calculation version and try again.');
						expect(oPersistencyMock.CalculationVersion.setNewId).not.toHaveBeenCalled();
					});

					it('handleCopyRequest_notExistingCV_throwsException', function() {
						// arrange
						oPersistencyMock.Session.isSessionOpened.and.returnValue(true);
						oPersistencyMock.CalculationVersion.open.and.returnValue({
							version : {},
							items : []
						});
						oPersistencyMock.CalculationVersion.exists.and.returnValue(false);
						oPersistencyMock.CalculationVersion.existsCVTemp.and.returnValue(false);
						oConnectionMock.commit.calls.reset();

						var params = {
							"action" : "copy",
							"id" : 321,
							"calculate" : false
						};

						// act
						var exception = null;
						try {
							calculationVersions.handlePostRequest(null, params, new ServiceOutput(), oPersistencyMock);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception.code.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
						const sClientMessage = "Calculation version not found.";
						expect(exception.developerMessage).toBe(sClientMessage);
						expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Calculation version id: 321.`);
						expect(oPersistencyMock.CalculationVersion.setNewId).not.toHaveBeenCalled();
					});
				});

				describe("handleCreateRequest", function() {

					const oTestCalculationVersion = {
						SESSION_ID : "12345",
						CALCULATION_VERSION_ID : -1,
						CALCULATION_ID : 123,
						ROOT_ITEM_ID : -1,
						LOT_SIZE : 1.5,
						LOT_SIZE_UOM_ID : "testUom",
						REPORT_CURRENCY_ID : "testcurrency",
						CALCULATION_NAME : "testCalculation",
						CALCULATION_VERSION_NAME : "testCalculationVersion",
						ITEMS : [ {
							SESSION_ID : "12345",
							ITEM_ID : -1,
							CALCULATION_VERSION_ID : -1,
							ITEM_CATEGORY_ID : "01"
						} ]
					};

					beforeEach(function() {
						var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "isSessionOpened",
								"getSessionDetails" ]);
						var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencySessionMock", [ "exists" ]);
						var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "create", "checkSavedVersion" ]);						

						oPersistencyMock.Calculation = oPersistencyCalculationMock;
						oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
						oPersistencyMock.Session = oPersistencySessionMock;
					});

					it('createCalculation_invalidSession_throwsException', function() {
						// arrange
						var params = {
							"action" : "create"
						};
						oPersistencyMock.Session.getSessionDetails.and.returnValue({
							userId : "userId",
							sessionId : "sessionId",
							language : "DE"
						});
						oPersistencyMock.Session.isSessionOpened.and.returnValue(false);
						oConnectionMock.commit.calls.reset();

						// act & assert
						expect(
								function() {
									calculationVersions.handlePostRequest([ oTestCalculationVersion ], params, new ServiceOutput(),
											oPersistencyMock);
								}).toThrow();

						expect(oConnectionMock.commit).not.toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.create).not.toHaveBeenCalled();
					});

					it('createCalculationVersion_invalidCalculation_throwsException', function() {
						// arrange
						var params = {
							"action" : "create"
						};
						oPersistencyMock.Session.getSessionDetails.and.returnValue({
							userId : "userId",
							sessionId : "sessionId",
							language : "DE"
						});
						oPersistencyMock.Session.isSessionOpened.and.returnValue(true);
						oPersistencyMock.Calculation.exists.and.returnValue(false);
						oPersistencyMock.CalculationVersion.checkSavedVersion.and.returnValue(1);
						oConnectionMock.commit.calls.reset();

						// act
						var exception = null;
						try {
							calculationVersions.handlePostRequest([ oTestCalculationVersion ], params, new ServiceOutput(),
									oPersistencyMock);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(oConnectionMock.commit).not.toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.create).not.toHaveBeenCalled();
						expect(exception.code.code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
					});
				});
				
				describe("remove", function() {

					const oTestCalculationVersion = {
						CALCULATION_VERSION_ID : 1
					};

					beforeEach(function() {
						var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "isSessionOpened",
								"getSessionDetails" ]);
						var oPersistencyCalculationMock = jasmine.createSpyObj("oPersistencySessionMock", ["isCurrentVersion" ]);
						var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencySessionMock", ["getOpeningUsers", "isSingle", "isFrozen", "getMasterVersions", "exists" ]);
						
						oPersistencyMock.Calculation = oPersistencyCalculationMock;
						oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
						oPersistencyMock.Session = oPersistencySessionMock;
					});

					it('removeCalculationVersion_isCurrent_throwsException', function() {
						// arrange
						var params = {};
						oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isSingle.and.returnValue(false);
						oPersistencyMock.Calculation.isCurrentVersion.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
						oPersistencyMock.CalculationVersion.getOpeningUsers.and.returnValue({});
						oPersistencyMock.CalculationVersion.getMasterVersions.and.returnValue({});
						oConnectionMock.commit.calls.reset();

						// act & assert
						var exception = null;
						try {
									calculationVersions.remove([ oTestCalculationVersion ], params, new ServiceOutput(),
											oPersistencyMock);
						} catch (e) {
							exception = e;
						}
                        
                        expect(oPersistencyMock.CalculationVersion.isSingle).toHaveBeenCalled();
						expect(oPersistencyMock.Calculation.isCurrentVersion).toHaveBeenCalled();
						expect(exception.code.code).toBe('DELETE_CURRENT_VERSION_ERROR');
					});

					it('removeCalculationVersion_isSingle_throwsException', function() {
							// arrange
							var params = {};
							oPersistencyMock.CalculationVersion.exists.and.returnValue(true);
							oPersistencyMock.CalculationVersion.isSingle.and.returnValue(true);
							oPersistencyMock.Calculation.isCurrentVersion.and.returnValue(true);
							oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
						    oPersistencyMock.CalculationVersion.getOpeningUsers.and.returnValue({});	
						    oPersistencyMock.CalculationVersion.getMasterVersions.and.returnValue({});
							oConnectionMock.commit.calls.reset();

							// act & assert
							var exception = null;
							try {
										calculationVersions.remove([ oTestCalculationVersion ], params, new ServiceOutput(),
												oPersistencyMock);
							} catch (e) {
								exception = e;
							}
                            // if the calculation version is single and is current, it should throw the IsSingle exception
                            expect(oPersistencyMock.CalculationVersion.isSingle).toHaveBeenCalled();
							expect(oPersistencyMock.Calculation.isCurrentVersion).not.toHaveBeenCalled();
							expect(exception.code.code).toBe('CALCULATIONVERSION_IS_SINGLE_ERROR');
					});
					
				});
				
				describe('freezeCalculationVersion', function() {
					const oTestCalculationVersion = {
						CALCULATION_VERSION_ID : 1
					};
					
					beforeEach(function() {
						oPersistencyMock.Session = jasmine.createSpyObj("oPersistencySessionMock", [ "isSessionOpened", "getSessionDetails" ]);
						oPersistencyMock.CalculationVersion = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [ "isOpenedAndLockedInSessionAndContext", "isFrozen", "isDirty" ]);
						
						oConnectionMock.commit.calls.reset();
					});
					
					it('should throw an exception if the calculation version is not opened and writeable/locked', function() {
						// arrange
						// Mock isOpenedAndLockedInSessionAndContext function to return false always
						oPersistencyMock.CalculationVersion.isOpenedAndLockedInSessionAndContext.and.returnValue(false);
						
						// act & assert
						// call freezeCalculationVersion should throw an exception
						var exception = null;
						try {
							calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
								action : "freeze"
							}, new ServiceOutput(), oPersistencyMock);
						} catch(e) {
							exception = e;
						}
						
						expect(oPersistencyMock.CalculationVersion.isOpenedAndLockedInSessionAndContext).toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.isDirty).not.toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.isFrozen).not.toHaveBeenCalled();
						expect(exception.code.code).toBe('CALCULATIONVERSION_NOT_WRITABLE_ERROR');
					});
					
					it('should throw an exception if the calculation version is dirty', function() {
						// arrange
						// Mock isDirty function to return true always
						oPersistencyMock.CalculationVersion.isOpenedAndLockedInSessionAndContext.and.returnValue(true);
						oPersistencyMock.CalculationVersion.isFrozen.and.returnValue(false);
						oPersistencyMock.CalculationVersion.isDirty.and.returnValue(true);

						// act & assert
						// call freezeCalculationVersion should throw an exception
						var exception = null;
						try {
							calculationVersions.handlePostRequest([ oTestCalculationVersion ], {
								action : "freeze"
							}, new ServiceOutput(), oPersistencyMock);
						} catch(e) {
							exception = e;
						}
						
						expect(oPersistencyMock.CalculationVersion.isOpenedAndLockedInSessionAndContext).toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.isDirty).toHaveBeenCalled();
						expect(oPersistencyMock.CalculationVersion.isFrozen).not.toHaveBeenCalled();
						expect(exception.code.code).toBe('CALCULATIONVERSION_NOT_SAVED_ERROR');
					});
				
				});				
				
			}).addTags(["All_Unit_Tests"]);
}