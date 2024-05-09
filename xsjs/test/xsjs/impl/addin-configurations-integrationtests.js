var _ = require("lodash");
var testData = require("../../testdata/testdata").data;

var AddinImport = $.import("xs.db", "persistency-addin");
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var PersistencyMetadataImport = require("../../../lib/xs/db/persistency-metadata");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MessageLibrary = require("../../../lib/xs/util/message");

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.addin-configurations-integrationtests', function() {
		var oMockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;

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

		function buildRequest(oHTTPMethod, sQueryPath, aParams, oBody) {
			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			aParams.get = function(sArgument) {
				var oSearchedParam = _.find(aParams, function(oParam) {
					return sArgument === oParam.name;
				});

				return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
			};

			// Ensure that body is empty during request
			var oBodyData;
			if(oBody !== undefined) {
				oBodyData = {
					asString : function() {
						return JSON.stringify(oBody);
					}
				};
			}

			// Prepare Request Object
			var oRequest = {
					queryPath : sQueryPath,
					method : oHTTPMethod,
					parameters : aParams,
					body : oBodyData
			};
			return oRequest;
		}


		describe('GET Request - Get Add-In Configuration', function() {

			var oAddin = JSON.parse(JSON.stringify(testData.oAddinVersionTestData));
			var oAddinConfigHeader = JSON.parse(JSON.stringify(testData.oAddinConfigurationHeaderTestData));	
			var oAddinConfigItem = JSON.parse(JSON.stringify(testData.oAddinConfigurationItemsTestData));

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});
			
			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request parameters guid = undefined, version = defined, use_previous_version = undefined", function() {
				//arrange
				var params = [
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[0],
												oAddin.ADDIN_MINOR_VERSION[0],
												oAddin.ADDIN_REVISION_NUMBER[0],
												oAddin.ADDIN_BUILD_NUMBER[0]
											].join(".")
								}								
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(oResponseObject);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request parameters guid = defined, version = undefined, use_previous_version = undefined", function() {
				//arrange
				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[0]
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(oResponseObject);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});
			
			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request parameters use_previous_version is not boolean", function() {
				//arrange
				var params = [
									{
										"name"  : "guid",
										"value" : oAddin.ADDIN_GUID[0] + 1	// Modify guid
									},
									{
										"name"  : 'version',
										"value" : [
													oAddin.ADDIN_MAJOR_VERSION[0],
													oAddin.ADDIN_MINOR_VERSION[0],
													oAddin.ADDIN_REVISION_NUMBER[0],
													oAddin.ADDIN_BUILD_NUMBER[0]
												].join(".")
									},
									{
										"name"  : 'use_previous_version',
										"value" : 'false1'
									}						
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(oResponseObject);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if guid does not exist and not return any body', function() {
				//arrange
				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[0] + 1	// Modify guid
								},
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[0],
												oAddin.ADDIN_MINOR_VERSION[0],
												oAddin.ADDIN_REVISION_NUMBER[0],
												oAddin.ADDIN_BUILD_NUMBER[0]
											].join(".")
								},
								{
									"name"  : 'use_previous_version',
									"value" : false
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if version does not exist and not return any body', function() {
				//arrange
				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[0]
								},
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[0] + 1, // Modify version number
												oAddin.ADDIN_MINOR_VERSION[0],
												oAddin.ADDIN_REVISION_NUMBER[0],
												oAddin.ADDIN_BUILD_NUMBER[0]
											].join(".")},
								{
									"name"  : 'use_previous_version',
									"value" : false
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should return addin configuration (header + items) for existing guid and version', function() {
				//arrange
				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[1]
								},
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[1],
												oAddin.ADDIN_MINOR_VERSION[1],
												oAddin.ADDIN_REVISION_NUMBER[1],
												oAddin.ADDIN_BUILD_NUMBER[1]
											].join(".")
								},
								{
									"name"  : 'use_previous_version',
									"value" : false
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject));

				var oExpectedAddinConfig = {
							ADDIN_GUID				: oAddin.ADDIN_GUID[1],
							ADDIN_VERSION           : [
														oAddin.ADDIN_MAJOR_VERSION[1],
														oAddin.ADDIN_MINOR_VERSION[1],
														oAddin.ADDIN_REVISION_NUMBER[1],
														oAddin.ADDIN_BUILD_NUMBER[1]
														].join("."),
							CREATED_ON              : oAddin.CREATED_ON[1],
							CREATED_BY      : oAddin.CREATED_BY[1],
							LAST_MODIFIED_ON        : oAddin.LAST_MODIFIED_ON[1],
							LAST_MODIFIED_BY: oAddin.LAST_MODIFIED_BY[1],
							CONFIG_DATA : [
							               {CONFIG_KEY : oAddinConfigItem.CONFIG_KEY[0], CONFIG_VALUE : oAddinConfigItem.CONFIG_VALUE[0]},
							               {CONFIG_KEY : oAddinConfigItem.CONFIG_KEY[1], CONFIG_VALUE : oAddinConfigItem.CONFIG_VALUE[1]}
							              ]
				};

				expect(oResponseObject.body).toEqualObject(oExpectedAddinConfig, ['ADDIN_VERSION']);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin version is registered, but configuration does not exist', function() {
				//arrange
				var params = [
								{
									"name"  : "guid",
									"value" : String(oAddin.ADDIN_GUID[2])
								},
								{
									"name"  : 'version',
									"value" : new String([
												oAddin.ADDIN_MAJOR_VERSION[2],
												oAddin.ADDIN_MINOR_VERSION[2],
												oAddin.ADDIN_REVISION_NUMBER[2],
												oAddin.ADDIN_BUILD_NUMBER[2]
											].join("."))
								},
								{
									"name"  : 'use_previous_version',
									"value" : new String(false)
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) for registered addin if config is not available for current version and use_previous_version = false', function() {
				//arrange
				oMockstar.clearTables(['configuration_header', 'configuration_items']);
				
				var oConfigHeaderTestData = _.clone(oAddinConfigHeader);
				oConfigHeaderTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigHeaderTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigHeaderTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigHeaderTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigHeaderTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigHeaderTestData.CREATED_ON.push(oAddin.CREATED_ON[2]);
				oConfigHeaderTestData.CREATED_BY.push(oAddin.CREATED_BY[2]);
				oConfigHeaderTestData.LAST_MODIFIED_ON.push(oAddin.LAST_MODIFIED_ON[2]);
				oConfigHeaderTestData.LAST_MODIFIED_BY.push(oAddin.LAST_MODIFIED_BY[2]);

				var oConfigItemTestData = _.clone(oAddinConfigItem);
				oConfigItemTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigItemTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigItemTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigItemTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigItemTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigItemTestData.CONFIG_KEY.push('TestKeyOld');
				oConfigItemTestData.CONFIG_VALUE.push('SomeValue_OldVersion');

				oMockstar.insertTableData("configuration_header", oConfigHeaderTestData);
				oMockstar.insertTableData("configuration_items", oConfigItemTestData);

				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[2]
								},
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[2],
												oAddin.ADDIN_MINOR_VERSION[2],
												oAddin.ADDIN_REVISION_NUMBER[2],
												oAddin.ADDIN_BUILD_NUMBER[2]
											].join(".")
								},
								{
									"name"  : 'use_previous_version',
									"value" : false
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should return config of previous version for registered addin if config for current version is not available and use_previous_version = true', function(){
				//arrange
				oMockstar.clearTables(['configuration_header', 'configuration_items']);
				
				var oConfigHeaderTestData = _.clone(oAddinConfigHeader);
				oConfigHeaderTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigHeaderTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigHeaderTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigHeaderTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigHeaderTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigHeaderTestData.CREATED_ON.push(oAddin.CREATED_ON[2]);
				oConfigHeaderTestData.CREATED_BY.push(oAddin.CREATED_BY[2]);
				oConfigHeaderTestData.LAST_MODIFIED_ON.push(oAddin.LAST_MODIFIED_ON[2]);
				oConfigHeaderTestData.LAST_MODIFIED_BY.push(oAddin.LAST_MODIFIED_BY[2]);

				var oConfigItemTestData = _.clone(oAddinConfigItem);
				oConfigItemTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigItemTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigItemTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigItemTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigItemTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigItemTestData.CONFIG_KEY.push('TestKeyOld');
				oConfigItemTestData.CONFIG_VALUE.push('SomeValue_OldVersion');

				oMockstar.insertTableData("configuration_header", oConfigHeaderTestData);
				oMockstar.insertTableData("configuration_items", oConfigItemTestData);		

				var params = [
								{
									"name"  : "guid",
									"value" : oAddin.ADDIN_GUID[2]
								},
								{
									"name"  : 'version',
									"value" : [
												oAddin.ADDIN_MAJOR_VERSION[2],
												oAddin.ADDIN_MINOR_VERSION[2],
												oAddin.ADDIN_REVISION_NUMBER[2],
												oAddin.ADDIN_BUILD_NUMBER[2]
											].join(".")
								},
								{
									"name"  : 'use_previous_version',
									"value" : true
								}
				              ];
				var oRequest = buildRequest($.net.http.GET, 'addin-configurations', params);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject));

				var oExpectedAddinConfig = {
							ADDIN_GUID				: oAddin.ADDIN_GUID[2],
							ADDIN_VERSION           : [
														oAddin.ADDIN_MAJOR_VERSION[2] - 1, // Lower version number
														oAddin.ADDIN_MINOR_VERSION[2],
														oAddin.ADDIN_REVISION_NUMBER[2],
														oAddin.ADDIN_BUILD_NUMBER[2]
														].join("."),
							CREATED_ON              : oAddin.CREATED_ON[2],
							CREATED_BY      : oAddin.CREATED_BY[2],
							LAST_MODIFIED_ON        : oAddin.LAST_MODIFIED_ON[2],
							LAST_MODIFIED_BY: oAddin.LAST_MODIFIED_BY[2],
							CONFIG_DATA : [
							               {
											   CONFIG_KEY   : oConfigItemTestData.CONFIG_KEY[oConfigItemTestData.CONFIG_KEY.length - 1],
											   CONFIG_VALUE : oConfigItemTestData.CONFIG_VALUE[oConfigItemTestData.CONFIG_VALUE.length - 1]
											}
							              ]
						};

				expect(oResponseObject.body).toEqualObject(oExpectedAddinConfig, ['ADDIN_VERSION']);
			});

		});
		
		describe('POST Request - Create Add-in Configuration', function() {
			var params = [];
			var oAddin = JSON.parse(JSON.stringify(testData.oAddinVersionTestData));
			var oAddinConfigItem = JSON.parse(JSON.stringify(testData.oAddinConfigurationItemsTestData));

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin version does not exist', function(){
				// arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1],
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1] + 1,	// Modify VERSION
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.POST, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin guid does not exist', function(){
				//arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1] + 1, 	// Modify GUID
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1],
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.POST, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should raise exception (GENERAL_ENTITY_ALREADY_EXISTS_ERROR) if configuration has been created before', function(){
				//arrange
				var oAddinConfigToUpdate = {
						ADDIN_GUID      : oAddin.ADDIN_GUID[1],
						ADDIN_VERSION   : [
											oAddin.ADDIN_MAJOR_VERSION[1],
											oAddin.ADDIN_MINOR_VERSION[1],
											oAddin.ADDIN_REVISION_NUMBER[1],
											oAddin.ADDIN_BUILD_NUMBER[1]
										   ].join("."),
					    CONFIG_DATA     : [
											{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
											{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
										  ]
					};

				var oRequest = buildRequest($.net.http.POST, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code);

			});

			it('should create addin configuration if configuration was sent and configuration did not exist before', function() {
				//arrange
				oMockstar.clearTables(['configuration_header', 'configuration_items']);
				// Prepare Request without LAST_MODIFIED_ON
				var oAddinConfigToUpdate = {
						ADDIN_GUID      : oAddin.ADDIN_GUID[1],
						ADDIN_VERSION   : [
											oAddin.ADDIN_MAJOR_VERSION[1],
											oAddin.ADDIN_MINOR_VERSION[1],
											oAddin.ADDIN_REVISION_NUMBER[1],
											oAddin.ADDIN_BUILD_NUMBER[1]
										   ].join("."),
					    CONFIG_DATA     : [
											{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
											{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
										  ]
					};

				var oRequest = buildRequest($.net.http.POST, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject));

				// Check result object
				var oExpectedResult = _.omit(_.clone(oAddinConfigToUpdate), ['LAST_MODIFIED_ON', 'CREATED_ON']);
				oExpectedResult.CREATED_BY = $.session.getUsername();
				oExpectedResult.LAST_MODIFIED_BY = $.session.getUsername();
				expect(_.omit(oResponseObject.body, ['LAST_MODIFIED_ON', 'CREATED_ON'])).toEqualObject(oExpectedResult);

				// Check database
				var sWhere = [" where addin_guid = '" + oAddin.ADDIN_GUID[1] + "'",
				              "and addin_major_version = " + oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + oAddin.ADDIN_BUILD_NUMBER[1]
						  ].join(" ");
				var result = oMockstar.execQuery("select CONFIG_KEY, CONFIG_VALUE from {{configuration_items}}" + sWhere);
				jasmine.log(JSON.stringify(result));
				expect(result).toMatchData(oAddinConfigToUpdate.CONFIG_DATA, ['CONFIG_KEY']);

			});


		});

		describe('PUT Request - Update Add-in Configuration', function() {
			var params = [];
			var oAddin = JSON.parse(JSON.stringify(testData.oAddinVersionTestData));
			var oAddinConfigItem = JSON.parse(JSON.stringify(testData.oAddinConfigurationItemsTestData));

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("session", testData.oSessionTestData);
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin version does not exist', function(){
				// arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1],
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1] + 1,	// Modify VERSION
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
					LAST_MODIFIED_ON: oAddin.LAST_MODIFIED_ON[1],
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if addin guid does not exist', function(){
				//arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1] + 1, 	// Modify GUID
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1],
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
					LAST_MODIFIED_ON: oAddin.LAST_MODIFIED_ON[1],
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			});

			it('should update addin configuration if configuration was sent and configuration exsits before', function(){
				//arrange
				var oAddinConfigToUpdate = {
						ADDIN_GUID      : oAddin.ADDIN_GUID[1],
						ADDIN_VERSION   : [
											oAddin.ADDIN_MAJOR_VERSION[1],
											oAddin.ADDIN_MINOR_VERSION[1],
											oAddin.ADDIN_REVISION_NUMBER[1],
											oAddin.ADDIN_BUILD_NUMBER[1]
										   ].join("."),
						LAST_MODIFIED_ON: oAddin.LAST_MODIFIED_ON[1],
					    CONFIG_DATA     : [
											{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
											{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
										  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				jasmine.log(JSON.stringify(oResponseObject));

				// Check result object
				var oExpectedResult = _.omit(_.clone(oAddinConfigToUpdate), ['LAST_MODIFIED_ON']);
				oExpectedResult.CREATED_ON = oAddin.CREATED_ON[1];
				oExpectedResult.CREATED_BY = $.session.getUsername();
				oExpectedResult.LAST_MODIFIED_BY = $.session.getUsername();
				expect(_.omit(oResponseObject.body, ['LAST_MODIFIED_ON'])).toEqualObject(oExpectedResult);

				// Check database
				var sWhere = [" where addin_guid = '" + oAddin.ADDIN_GUID[1] + "'",
				              "and addin_major_version = " + oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + oAddin.ADDIN_BUILD_NUMBER[1]
						  ].join(" ");
				var result = oMockstar.execQuery("select CONFIG_KEY, CONFIG_VALUE from {{configuration_items}}" + sWhere);
				jasmine.log(JSON.stringify(result));
				expect(result).toMatchData(oAddinConfigToUpdate.CONFIG_DATA, ['CONFIG_KEY']);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if configuration did not exist before', function() {
				//arrange
				oMockstar.clearTables(['configuration_header', 'configuration_items']);
				var oAddinConfigToUpdate = {
						ADDIN_GUID      : oAddin.ADDIN_GUID[1],
						ADDIN_VERSION   : [
											oAddin.ADDIN_MAJOR_VERSION[1],
											oAddin.ADDIN_MINOR_VERSION[1],
											oAddin.ADDIN_REVISION_NUMBER[1],
											oAddin.ADDIN_BUILD_NUMBER[1]
										   ].join("."),
						LAST_MODIFIED_ON: new Date().toJSON(),			// Modify LAST_MODIFIED_ON
					    CONFIG_DATA     : [
											{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
											{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
										  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();	
				
				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);

			});

			it('should raise exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) if LAST_MODIFIED_ON does not equal LAST_MODIFIED_ON in DB', function(){
				// arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1],
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1],
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
					LAST_MODIFIED_ON: new Date().toJSON(),			// Modify LAST_MODIFIED_ON
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_CURRENT_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
			});

			it('should raise exception (GENERAL_VALIDATION_ERROR) if request does not contain LAST_MODIFIED_ON and configuration was created before', function(){
				// arrange
				var oAddinConfigToUpdate = {
					ADDIN_GUID      : oAddin.ADDIN_GUID[1],
					ADDIN_VERSION   : [
										oAddin.ADDIN_MAJOR_VERSION[1],
										oAddin.ADDIN_MINOR_VERSION[1],
										oAddin.ADDIN_REVISION_NUMBER[1],
										oAddin.ADDIN_BUILD_NUMBER[1]
									   ].join("."),
				    CONFIG_DATA     : [
										{CONFIG_KEY: 'NewKey1', CONFIG_VALUE: 'New Value 1'},
										{CONFIG_KEY: 'NewKey2', CONFIG_VALUE: 'New Value 2'}
									  ]
					};

				var oRequest = buildRequest($.net.http.PUT, 'addin-configurations', [], oAddinConfigToUpdate);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.responseCode);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR.code);
			});

		});

	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}
