var _ = require("lodash");
var mockstarHelpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var AddinImport = $.import("xs.db", "persistency-addin");
var AddinStates = require("../../../lib/xs/util/constants").AddinStates;
var AddinServiceParameters = require("../../../lib/xs/util/constants").AddinServiceParameters;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var PersistencyMetadataImport = require("../../../lib/xs/db/persistency-metadata");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MessageLibrary = require("../../../lib/xs/util/message");
var messageCode = MessageLibrary.Code;


if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.addins-integrationtests', function() {
		var oMockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
		var sUser = $.session.getUsername();

		beforeOnce(function() {

			oMockstar = new MockstarFacade({
				substituteTables : {
					version : {
						name: AddinImport.Tables.version,
						data: testData.oAddinVersionTestData
					},
					configuration_header : {
						name: AddinImport.Tables.configuration_header,
						data: testData.oAddinConfigurationHeaderTestData
					},
					configuration_items : {
						name: AddinImport.Tables.configuration_items,
						data: testData.oAddinConfigurationItemsTestData
					},

					metadata : {
						name : PersistencyMetadataImport.Tables.metadata,
						data : testData.mCsvFiles.metadata
					},
					metadata_text : {
						name : PersistencyMetadataImport.Tables.metadataText,
						data : testData.mCsvFiles.metadata__text
					},
					metadata_item_attributes : {
						name : PersistencyMetadataImport.Tables.metadataItemAttributes,
						data : testData.mCsvFiles.metadata_item_attributes
					},

					session : "sap.plc.db::basis.t_session"
				},
				csvPackage: testData.sCsvPackage
			});
		});

		beforeEach(function() {
			oMockstar.clearAllTables();
			oMockstar.initializeData();

			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});

		function buildRequest(params, iHttpMethod, oBody) {
			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			params.get = function(sArgument) {
				var oSearchedParam = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});

				return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
			};

			var oRequest = {
					queryPath : "addins",
					method : iHttpMethod,
					parameters : params,
					body : oBody
			};
			return oRequest;
		}


		describe('GET Request - Read Add-Ins', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			function checkAddinVersion(aAddinVersionActual, oAddinVersionExpected) {
				// Clone object in order to modify them safely
				var oAddinVersionExpectedClone = _.cloneDeep(oAddinVersionExpected);
				var oAddinVersionActual = mockstarHelpers.convertArrayOfObjectsToObjectOfArrays(aAddinVersionActual);

				// Compare version fields
				var oAddinVersionFieldsActual = _.omit(oAddinVersionActual, 'CONFIGURATION');
				var oAddinVersionFieldsExpected = _.omit(oAddinVersionExpectedClone, 'CONFIGURATION');

				var oExpectedData = JSON.parse(JSON.stringify(oAddinVersionFieldsExpected));
				expect(oAddinVersionFieldsActual).toMatchData(oExpectedData, [ "ADDIN_GUID" ]);

				// Compare configuration header fields
				var oAddinConfigurationHeaderExpected = { CONFIGURATION: [] };
				var oAddinConfigurationHeader = _.pick(oAddinVersionExpectedClone, ['CONFIGURATION' ]);
				var oAddinConfigurationHeaderActual = _.pick(oAddinVersionActual, 'CONFIGURATION');

				// Prepare Configuration header object to be comparable
				for(var i = 0; i < oAddinConfigurationHeader.CONFIGURATION.CREATED_ON.length; i++) {
					oAddinConfigurationHeaderExpected.CONFIGURATION.push({
							CREATED_ON              : oAddinConfigurationHeader.CONFIGURATION.CREATED_ON[i],
							CREATED_BY      : oAddinConfigurationHeader.CONFIGURATION.CREATED_BY[i],
							LAST_MODIFIED_ON        : oAddinConfigurationHeader.CONFIGURATION.LAST_MODIFIED_ON[i],
							LAST_MODIFIED_BY: oAddinConfigurationHeader.CONFIGURATION.LAST_MODIFIED_BY[i]
						});
				}

				oExpectedData = JSON.parse(JSON.stringify(oAddinConfigurationHeaderExpected));
				expect(oAddinConfigurationHeaderActual).toEqualObject(oExpectedData);

			}

			function prepareAddinVersions(oAddinVersionExpected) {
				// Clone object in order to modify them safely
				var oAddinVersionFieldsExpected = _.cloneDeep(oAddinVersionExpected);

				// Create version strings from version numbers
				var iLength = oAddinVersionFieldsExpected.ADDIN_MAJOR_VERSION.length;
				oAddinVersionFieldsExpected.ADDIN_VERSION = [];
				for (var i = 0; i < iLength; i++) {
					var sAddinVersion = [oAddinVersionFieldsExpected.ADDIN_MAJOR_VERSION[i],
					                     oAddinVersionFieldsExpected.ADDIN_MINOR_VERSION[i],
					                     oAddinVersionFieldsExpected.ADDIN_REVISION_NUMBER[i],
					                     oAddinVersionFieldsExpected.ADDIN_BUILD_NUMBER[i]
					].join(".");
					oAddinVersionFieldsExpected.ADDIN_VERSION.push(sAddinVersion);
				}
				oAddinVersionFieldsExpected = _.omit(oAddinVersionFieldsExpected, ['ADDIN_MAJOR_VERSION', 'ADDIN_MINOR_VERSION', 'ADDIN_REVISION_NUMBER', 'ADDIN_BUILD_NUMBER' ]);

				return oAddinVersionFieldsExpected;
			}

			it('should return ONLY activated addin versions if status = activated', function() {
				//arrange
				var params = [{"name" : "status", "value" : AddinServiceParameters.Status.Values.Activated}];
				var oRequest = buildRequest(params, $.net.http.GET);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.length).toBe(1);
				
				jasmine.log(oResponseObject);

				var oAddin       = testData.oAddinVersionTestData;
				var oAddinHeader = testData.oAddinConfigurationHeaderTestData;
				var i            = 1;
				var oActivatedAddin = {
						"ADDIN_GUID"                  : oAddin.ADDIN_GUID[i],
						"ADDIN_VERSION"               : [oAddin.ADDIN_MAJOR_VERSION[i], oAddin.ADDIN_MINOR_VERSION[i], oAddin.ADDIN_REVISION_NUMBER[i], oAddin.ADDIN_BUILD_NUMBER[i]].join("."),
						"NAME"                        : oAddin.NAME[i],
						"FULL_QUALIFIED_NAME"         : oAddin.FULL_QUALIFIED_NAME[i],
						"DESCRIPTION"                 : oAddin.DESCRIPTION[i],
						"PUBLISHER"                   : oAddin.PUBLISHER[i],
						"STATUS"                      : AddinServiceParameters.Status.Values.Activated,
						"CERTIFICATE_ISSUER"          : oAddin.CERTIFICATE_ISSUER[i],
						"CERTIFICATE_SUBJECT"         : oAddin.CERTIFICATE_SUBJECT[i],
						"CERTIFICATE_VALID_FROM"      : oAddin.CERTIFICATE_VALID_FROM[i],
						"CERTIFICATE_VALID_TO"        : oAddin.CERTIFICATE_VALID_TO[i],
						CREATED_ON                  : oAddin.CREATED_ON[i],
						"CREATED_BY"          : oAddin.CREATED_BY[i],
						"LAST_MODIFIED_ON"            : oAddin.LAST_MODIFIED_ON[i],
						"LAST_MODIFIED_BY"    : oAddin.LAST_MODIFIED_BY[i],
						"CONFIGURATION"               : {
								CREATED_ON              : oAddinHeader.CREATED_ON[i],
								"CREATED_BY"      : oAddinHeader.CREATED_BY[i],
								"LAST_MODIFIED_ON"        : oAddinHeader.LAST_MODIFIED_ON[i],
								"LAST_MODIFIED_BY":	oAddinHeader.LAST_MODIFIED_BY[i]
							}
				};
				expect(oResponseObject.body[0]).toEqualObject(oActivatedAddin);

				jasmine.log(JSON.stringify(oResponseObject.body));
			});

			it('should return all addin versions if status = all', function() {
				//arrange
				var params = [{"name" : "status", "value" : AddinServiceParameters.Status.Values.All}];
				var oRequest = buildRequest(params, $.net.http.GET);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.length).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);

				// Merge testData objects oAddinVersionTestData + oAddinConfigurationHeaderTestData
				var oAddinVersionTestData = _.cloneDeep(testData.oAddinVersionTestData);
				oAddinVersionTestData.CONFIGURATION = {
					CREATED_ON              : [],
					CREATED_BY      : [],
					LAST_MODIFIED_ON        : [],
					LAST_MODIFIED_BY: []
				};

				for(var i = 0; i < oAddinVersionTestData.ADDIN_GUID.length; i++) {
					if(testData.oAddinConfigurationHeaderTestData.CREATED_ON[i] === undefined) {
						oAddinVersionTestData.CONFIGURATION.CREATED_ON[i]               = null;
						oAddinVersionTestData.CONFIGURATION.CREATED_BY[i]       = null;
						oAddinVersionTestData.CONFIGURATION.LAST_MODIFIED_ON[i]         = null;
						oAddinVersionTestData.CONFIGURATION.LAST_MODIFIED_BY[i] = null;
					} else {
						oAddinVersionTestData.CONFIGURATION.CREATED_ON[i]               = testData.oAddinConfigurationHeaderTestData.CREATED_ON[i];
						oAddinVersionTestData.CONFIGURATION.CREATED_BY[i]       = testData.oAddinConfigurationHeaderTestData.CREATED_BY[i];
						oAddinVersionTestData.CONFIGURATION.LAST_MODIFIED_ON[i]         = testData.oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
						oAddinVersionTestData.CONFIGURATION.LAST_MODIFIED_BY[i] = testData.oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
					}
				}

				//element in array have to be rearranged because of the order of items in response 
				oResponseObject.body = [oResponseObject.body[0], oResponseObject.body[2], oResponseObject.body[1]];

				// all addins from db should be returned incl. config
				checkAddinVersion(oResponseObject.body, prepareAddinVersions(oAddinVersionTestData));

				jasmine.log(JSON.stringify(oResponseObject.body));
			});

			it('should return empty array if no addin version is available', function() {
				//arrange
				oMockstar.clearTables(["version", "configuration_header", "configuration_items"]);

				var params = [ {"name" : "status", "value" : AddinServiceParameters.Status.Values.All}];
				var oRequest = buildRequest(params, $.net.http.GET);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				var aExpectedResult = [];
				expect(oResponseObject.body).toEqual(aExpectedResult);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request parameter Status = undefined", function() {
				//arrange
				var params = [{}];
				var oRequest = buildRequest(params, $.net.http.GET);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request parameter Status contains an invald value", function() {
				//arrange
				var params = [{"name": "status", "value" : "InvaldValue"}];
				var oRequest = buildRequest(params, $.net.http.GET);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});
		});


		describe('POST Request - Register add-in', function() {

			var oNewAddinVersion = {
					"ADDIN_GUID"            : "234567891",
					"ADDIN_VERSION"         : "3.14.4.3",
					"NAME"                  : "Test Add-In 3",
					"FULL_QUALIFIED_NAME"   : "com.sap.plc.extensibility.testAddIn_3",
					"DESCRIPTION"           : "Test addin desc 3",
					"PUBLISHER"             : "SAP SE",
					"CERTIFICATE_ISSUER"    : "CN=VeriSign Class 3",
					"CERTIFICATE_SUBJECT"   : "CN = TFS, O = mySAP.com",
					"CERTIFICATE_VALID_FROM": '2015-12-01T19:23:25.052Z',
					"CERTIFICATE_VALID_TO"  : '2019-12-01T19:23:25.052Z'
			};

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should register addin version if all optional fields are included into request', function() {
				//arrange
				var oBody = {
						asString : function() {
							return JSON.stringify(oNewAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oExpectedAddin = _.cloneDeep(oNewAddinVersion);
				oExpectedAddin.STATUS = AddinStates.Registered;
				oExpectedAddin.CREATED_BY = $.session.getUsername();
				oExpectedAddin.LAST_MODIFIED_BY = $.session.getUsername();
				oExpectedAddin.CONFIGURATION = {
					"CREATED_ON":null,
					"CREATED_BY":null,
					"LAST_MODIFIED_ON":null,
					"LAST_MODIFIED_BY":null
				};


				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject.body));
				jasmine.log(JSON.stringify(oExpectedAddin));
				
				expect(_.omit(oResponseObject.body, ["CREATED_ON", "LAST_MODIFIED_ON"])).toEqualObject(oExpectedAddin);
				
			});

			it('should register addin version if optional fields are not included into request', function(){
				//arrange
				var oNewAddinVersionMinimal = _.omit(_.cloneDeep(oNewAddinVersion), ['DESCRIPTION', 'PUBLISHER']);
				var oBody = {
						asString : function() {
							return JSON.stringify(oNewAddinVersionMinimal);
						}};
				var oRequest = buildRequest([], $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				// assert
				var oExpectedAddin = _.cloneDeep(oNewAddinVersion);
				oExpectedAddin.STATUS = AddinStates.Registered;
				oExpectedAddin.DESCRIPTION = null;
				oExpectedAddin.PUBLISHER = null;
				oExpectedAddin.CREATED_BY = $.session.getUsername();
				oExpectedAddin.LAST_MODIFIED_BY = $.session.getUsername();
				oExpectedAddin.CONFIGURATION = {
					"CREATED_ON":null,
					"CREATED_BY":null,
					"LAST_MODIFIED_ON":null,
					"LAST_MODIFIED_BY":null
				};


				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject.body));
				jasmine.log(JSON.stringify(oExpectedAddin));
				
				expect(_.omit(oResponseObject.body, ["CREATED_ON", "LAST_MODIFIED_ON"])).toEqualObject(oExpectedAddin);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) if same addin version is registered again', function(){
				//arrange
				var oAddinWithDoubleVersion = _.cloneDeep(oNewAddinVersion);
				oAddinWithDoubleVersion.ADDIN_GUID = testData.oAddinVersionTestData.ADDIN_GUID[0],
				oAddinWithDoubleVersion.ADDIN_VERSION = [
														testData.oAddinVersionTestData.ADDIN_MAJOR_VERSION[0],
														testData.oAddinVersionTestData.ADDIN_MINOR_VERSION[0],
														testData.oAddinVersionTestData.ADDIN_REVISION_NUMBER[0],
														testData.oAddinVersionTestData.ADDIN_BUILD_NUMBER[0]
													].join(".");

				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinWithDoubleVersion);
						}};
				var oRequest = buildRequest([], $.net.http.POST, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);

				jasmine.log(JSON.stringify(oResponseObject));
			});

		});


		describe('DEL Request - Unregister Add-In', function() {

			var oAddin = testData.oAddinVersionTestData;

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should unregister addin version', function() {
				//arrange
				var oAddinToUnregister = {
						"ADDIN_GUID":  		oAddin.ADDIN_GUID[1],
						"ADDIN_VERSION" : 	[oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]].join(".")
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinToUnregister);
						}};

				var oRequest = buildRequest([], $.net.http.DEL, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				// Check that one instance has been deleted
				expect(mockstarHelpers.getRowCount(oMockstar, "version")).toEqual(testData.oAddinVersionTestData.ADDIN_GUID.length - 1);

				// Check that addin configuration header and items has been deleted as well
				expect(mockstarHelpers.getRowCount(oMockstar, "configuration_header")).toEqual(testData.oAddinConfigurationHeaderTestData.ADDIN_GUID.length - 1);

				// testData.oAddinVersionTestData.ADDIN_GUID[1] contains TWO config values
				expect(mockstarHelpers.getRowCount(oMockstar, "configuration_items")).toEqual(testData.oAddinConfigurationItemsTestData.ADDIN_GUID.length - 2);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin version does not exist ', function() {
				//arrange
				var oAddinToUnregister = {
						"ADDIN_GUID"   : oAddin.ADDIN_GUID[1],
						"ADDIN_VERSION": "9.9.9.9"
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinToUnregister);
						}};

				var oRequest = buildRequest([], $.net.http.DEL, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

				// Check that no data has been deleted
				expect(mockstarHelpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin guid does not exist', function() {
				//arrange
				var oAddinToUnregister = {
						"ADDIN_GUID":  		"99999999999",
						"ADDIN_VERSION" : 	[oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]].join(".")
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinToUnregister);
						}};

				var oRequest = buildRequest([], $.net.http.DEL, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.NOT_FOUND);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

				// Check that no data has been deleted
				expect(mockstarHelpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);
			});

		});


		describe('PUT Request - Activate / Deactive Add-In', function() {

			var oAddin = testData.oAddinVersionTestData;
			var oAddinConfigurationHeaderTestData = testData.oAddinConfigurationHeaderTestData;

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should update addin version to activated status if status = activated', function() {
				//arrange
				// oAddin.ADDIN_GUID[0] => Registered Addin
				var oAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
						"ADDIN_VERSION" : [
									oAddin.ADDIN_MAJOR_VERSION[0],
									oAddin.ADDIN_MINOR_VERSION[0],
									oAddin.ADDIN_REVISION_NUMBER[0],
									oAddin.ADDIN_BUILD_NUMBER[0]
								].join("."),
						"LAST_MODIFIED_ON" : oAddin.LAST_MODIFIED_ON[0],
						"STATUS" : AddinStates.Activated
				};

				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.PUT, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var sHeader_created_on = null;
				var sHeader_created_by = null;
				var sHeader_last_modified_on = null;
				var sHeader_last_modified_by = null;
				
				for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
					
					// check testdata for matching config entries
					if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddin.ADDIN_GUID[0]
						&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddin.ADDIN_MAJOR_VERSION[0]
						&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddin.ADDIN_MINOR_VERSION[0]
						&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddin.ADDIN_REVISION_NUMBER[0]
						&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddin.ADDIN_BUILD_NUMBER[0]
					) {
						sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
						sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
						sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
						sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
					}
				}
				
				var oExpectedAddin = {
					"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
					"ADDIN_VERSION" : [
								oAddin.ADDIN_MAJOR_VERSION[0],
								oAddin.ADDIN_MINOR_VERSION[0],
								oAddin.ADDIN_REVISION_NUMBER[0],
								oAddin.ADDIN_BUILD_NUMBER[0]
							].join("."),
					"NAME":oAddin.NAME[0],
					"FULL_QUALIFIED_NAME":oAddin.FULL_QUALIFIED_NAME[0],
					"DESCRIPTION":oAddin.DESCRIPTION[0],
					"PUBLISHER":oAddin.PUBLISHER[0],
					"STATUS" : AddinStates.Activated,
					"CERTIFICATE_ISSUER":oAddin.CERTIFICATE_ISSUER[0],
					"CERTIFICATE_SUBJECT":oAddin.CERTIFICATE_SUBJECT[0],
					"CERTIFICATE_VALID_FROM":oAddin.CERTIFICATE_VALID_FROM[0],
					"CERTIFICATE_VALID_TO":oAddin.CERTIFICATE_VALID_TO[0],
					"CREATED_ON":oAddin.CREATED_ON[0],
					"CREATED_BY":oAddin.CREATED_BY[0],
					"LAST_MODIFIED_BY":oAddin.LAST_MODIFIED_BY[0],
					"CONFIGURATION" : {
						"CREATED_ON":sHeader_created_on,
						"CREATED_BY":sHeader_created_by,
						"LAST_MODIFIED_ON":sHeader_last_modified_on,
						"LAST_MODIFIED_BY":sHeader_last_modified_by
					}
				};
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject.body));
				jasmine.log(JSON.stringify(oExpectedAddin));
				
				expect(_.omit(oResponseObject.body, ['LAST_MODIFIED_ON'])).toEqualObject(oExpectedAddin);
			});

			it('should update addin version to registered status if status = registered', function(){
				//arrange
				// oAddin.ADDIN_GUID[1] => Activated Addin
				var oAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[1],
						"ADDIN_VERSION" : [
									oAddin.ADDIN_MAJOR_VERSION[1],
									oAddin.ADDIN_MINOR_VERSION[1],
									oAddin.ADDIN_REVISION_NUMBER[1],
									oAddin.ADDIN_BUILD_NUMBER[1]
								].join("."),
						"LAST_MODIFIED_ON" : oAddin.LAST_MODIFIED_ON[1],
						"STATUS" : AddinStates.Registered
				};

				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.PUT, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var sHeader_created_on = null;
				var sHeader_created_by = null;
				var sHeader_last_modified_on = null;
				var sHeader_last_modified_by = null;
				
				for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
					
					// check testdata for matching config entries
					if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddin.ADDIN_GUID[1]
						&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddin.ADDIN_MAJOR_VERSION[1]
						&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddin.ADDIN_MINOR_VERSION[1]
						&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddin.ADDIN_REVISION_NUMBER[1]
						&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddin.ADDIN_BUILD_NUMBER[1]
					) {
						sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
						sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
						sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
						sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
					}
				}
				
				var oExpectedAddin = {
					"ADDIN_GUID":  oAddin.ADDIN_GUID[1],
					"ADDIN_VERSION" : [
								oAddin.ADDIN_MAJOR_VERSION[1],
								oAddin.ADDIN_MINOR_VERSION[1],
								oAddin.ADDIN_REVISION_NUMBER[1],
								oAddin.ADDIN_BUILD_NUMBER[1]
							].join("."),
					"NAME":oAddin.NAME[1],
					"FULL_QUALIFIED_NAME":oAddin.FULL_QUALIFIED_NAME[1],
					"DESCRIPTION":oAddin.DESCRIPTION[1],
					"PUBLISHER":oAddin.PUBLISHER[1],
					"STATUS" : AddinStates.Registered,
					"CERTIFICATE_ISSUER":oAddin.CERTIFICATE_ISSUER[1],
					"CERTIFICATE_SUBJECT":oAddin.CERTIFICATE_SUBJECT[1],
					"CERTIFICATE_VALID_FROM":oAddin.CERTIFICATE_VALID_FROM[1],
					"CERTIFICATE_VALID_TO":oAddin.CERTIFICATE_VALID_TO[1],
					"CREATED_ON":oAddin.CREATED_ON[1],
					"CREATED_BY":oAddin.CREATED_BY[1],
					"LAST_MODIFIED_BY":oAddin.LAST_MODIFIED_BY[1],
					"CONFIGURATION" : {
						"CREATED_ON":sHeader_created_on,
						"CREATED_BY":sHeader_created_by,
						"LAST_MODIFIED_ON":sHeader_last_modified_on,
						"LAST_MODIFIED_BY":sHeader_last_modified_by
					}
				};
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject.body));
				jasmine.log(JSON.stringify(oExpectedAddin));
				
				expect(_.omit(oResponseObject.body, ['LAST_MODIFIED_ON'])).toEqualObject(oExpectedAddin);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin version does not exist', function() {
				//arrange
				var oAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
						"ADDIN_VERSION" : [
								oAddin.ADDIN_MAJOR_VERSION[0],
								oAddin.ADDIN_MINOR_VERSION[0],
								oAddin.ADDIN_REVISION_NUMBER[0],
								'9'		// Build Number repalced
							].join("."),
						"LAST_MODIFIED_ON" : oAddin.LAST_MODIFIED_ON[0],
						"STATUS" : AddinStates.Registered
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.PUT, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) if addin version was updated in the meantime', function(){
				//arrange
				var oAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
						"ADDIN_VERSION" : [
								oAddin.ADDIN_MAJOR_VERSION[0],
								oAddin.ADDIN_MINOR_VERSION[0],
								oAddin.ADDIN_REVISION_NUMBER[0],
								oAddin.ADDIN_BUILD_NUMBER[0]
							].join("."),
						"LAST_MODIFIED_ON" : '2015-01-01T00:00:00.000Z',
						"STATUS" : AddinStates.Activated
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.PUT, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.responseCode);
				jasmine.log(oDefaultResponseMock.status);

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should raise exception (ADDIN_STATUS_ALREADY_SET_INFO) if addin status was already set', function(){
				//arrange
				var oAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
						"ADDIN_VERSION" : [
								oAddin.ADDIN_MAJOR_VERSION[0],
								oAddin.ADDIN_MINOR_VERSION[0],
								oAddin.ADDIN_REVISION_NUMBER[0],
								oAddin.ADDIN_BUILD_NUMBER[0]
							].join("."),
						"LAST_MODIFIED_ON" : oAddin.LAST_MODIFIED_ON[0],
						"STATUS" : oAddin.STATUS[0]
				};
				var oBody = {
						asString : function() {
							return JSON.stringify(oAddinVersion);
						}};
				var oRequest = buildRequest([], $.net.http.PUT, oBody);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(messageCode.ADDIN_STATUS_ALREADY_SET_INFO.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(messageCode.ADDIN_STATUS_ALREADY_SET_INFO.code);
			});

		});

	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}
