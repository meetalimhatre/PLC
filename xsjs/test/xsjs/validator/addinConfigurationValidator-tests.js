var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");

var addinConfigurationValidatorLibrary = $.import("xs.validator", "addinConfigurationValidator");
var AddinConfigurationValidator = addinConfigurationValidatorLibrary.AddinConfigurationValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.addinConfigurationValidator-tests', function() {

		var oAddinConfigurationValidator;

		var sSessionID = "TestSessionID";
		var oMetadataProviderMock = null;
		var oConnectionMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;

		
		var oValidAddinToPost = {
			ADDIN_GUID      : "1234567890123456789",
			ADDIN_VERSION   : "2.12.0.2",
			CONFIG_DATA     : [{
				CONFIG_KEY  : "TestKey1",
				CONFIG_VALUE: "SomeValue1"
			},
			{
				CONFIG_KEY  : "TestKey2",
				CONFIG_VALUE: ""
			}]
		};
		
		var oValidAddinToPut = {
			ADDIN_GUID      : "1234567890123456789",
			ADDIN_VERSION   : "2.12.0.2",
			LAST_MODIFIED_ON:"2019-01-01T01:00:00.000Z",
			CONFIG_DATA     : [{
				CONFIG_KEY  : "TestKey1",
				CONFIG_VALUE: "SomeValue1"
			},
			{
				CONFIG_KEY  : "TestKey2",
				CONFIG_VALUE: ""
			}]
		};

		var aInvalidVersions = ['false', 'null', '1.0.2.false', '1', '1.2', '1.2.3', '1.2.3.4.5', '-1.0.2.3'];

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Addin);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity", "checkMandatoryProperties");
			// arrange the mock of checkEntity that to return the entity with which it was called;
			// bypasses any validation, but keeps the contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oAddinConfigurationValidator = new AddinConfigurationValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

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


		describe("GET: validateGetRequest - Read Add-In Configuration", function() {
			var oValidatedParameters = null;

			it("should validate OK if request parameters guid = defined, version = defined, and addin version has correct format", function() {
				// arrange
				oValidatedParameters = {
						'guid' : '123456789',
						'version' : '1.2.3.4'
					};

				//act
				var oRequest = buildRequest($.net.http.GET, "addin-configurations", [oValidatedParameters]);
				var result = oAddinConfigurationValidator.validate(oRequest, oValidatedParameters);

			});

			it("should raise an exception with code if request parameter version has wrong format", function() {
				for(var j = 0; j < aInvalidVersions.length; j++){
					var exception;

					// arrange
					oValidatedParameters = {
							'guid' : '123456789',
							'version' : aInvalidVersions[j]
					};

					// act
					try {
						var oRequest = buildRequest($.net.http.GET, "addin-configurations", [oValidatedParameters]);
						var result = oAddinConfigurationValidator.validate(oRequest, oValidatedParameters);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				}
			});

			it("should validate OK if request parameter guid, version, use_previous_version are defined", function() {
				// arrange
				oValidatedParameters = {
						'guid' : '123456789',
						'version' : '1.2.3.4',
						'use_previous_version' : true
				};

				// act
				var oRequest = buildRequest($.net.http.GET, "addin-configurations", [oValidatedParameters]);
				var result = oAddinConfigurationValidator.validate(oRequest, oValidatedParameters);
			});

			it("should raise an exception if request contains body information", function() {
				var exception;
				
				// arrange
				oValidatedParameters = {
						'guid' : '123456789',
						'version' : '1.2.3.4',
						'use_previous_version' : false
				};

				// act
				try {
					var oRequest = buildRequest($.net.http.GET, "addin-configurations", [oValidatedParameters], oValidAddinToPut);
					var result = oAddinConfigurationValidator.validate(oRequest, oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

		});


		describe("POST: validateCreateRequest - Create Add-In Configuration", function() {

			it("should validate OK in case of sending a valid create request", function() {
				// act
				var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oValidAddinToPost);
				var result = oAddinConfigurationValidator.validate(oRequest);

				// assert
				var oParsedResult = JSON.parse(JSON.stringify(result));
				expect(oParsedResult).toEqualObject(oValidAddinToPost, [ "ADDIN_GUID" ]);
			});
			
			it("should raise an exception (GENERAL_VALIDATION_ERROR) in case of sending a update object (LAST_MODIFIED_ON is included)", function() {
				var exception;
				
				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oValidAddinToPut);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if ADDIN_VERSION field has wrong format", function() {
				for(var j=0; j<aInvalidVersions.length; j++) {
						var exception;

						// arrange
						var oInvalidAddin = _.clone(oValidAddinToPost);
						oInvalidAddin.ADDIN_VERSION = aInvalidVersions[j];

						// act
						try {
							var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
							var result = oAddinConfigurationValidator.validate(oRequest);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception).toBeDefined();
						expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);

				}
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request contains invalid fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.extend({}, oValidAddinToPost, {
					INVALID : "INVALID"
				});

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain ADDIN_VERSION", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPost);
				oInvalidAddin = _.omit(oInvalidAddin, ['ADDIN_VERSION']);

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain ADDIN_GUID", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPost);
				oInvalidAddin = _.omit(oInvalidAddin, ['ADDIN_GUID']);

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});			

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain CONFIG_DATA", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPost);
				oInvalidAddin.CONFIG_DATA = undefined;
				jasmine.log(JSON.stringify(oInvalidAddin));

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				jasmine.log(JSON.stringify(exception));
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if CONFIG_DATA contain invalid fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPost);
				oInvalidAddin.CONFIG_DATA[0].INVALID = 'INVALID';

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if CONFIGURATION ITEMS do not contain mandatory fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPost);
				oInvalidAddin.CONFIG_DATA[0] = _.omit(oInvalidAddin.CONFIG_DATA[0], ['CONFIG_KEY']);

				// act
				try {
					var oRequest = buildRequest($.net.http.POST, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});
		

		describe("PUT: validateUpdateRequest - Update Add-In Configuration", function() {

			it("should validate OK in case of sending a valid update request", function() {
				// act
				var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oValidAddinToPut);
				var result = oAddinConfigurationValidator.validate(oRequest);

				// assert
				var oParsedResult = JSON.parse(JSON.stringify(result));
				expect(oParsedResult).toEqualObject(oValidAddinToPut, [ "ADDIN_GUID" ]);
			});
			
			it("should raise an exception (GENERAL_VALIDATION_ERROR) in case of sending a create object (LAST_MODIFIED_ON is missing)", function() {
				var exception;
				
				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oValidAddinToPost);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if ADDIN_VERSION field has wrong format", function() {
				for(var j=0; j<aInvalidVersions.length; j++) {
						var exception;

						// arrange
						var oInvalidAddin = _.clone(oValidAddinToPut);
						oInvalidAddin.ADDIN_VERSION = aInvalidVersions[j];

						// act
						try {
							var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
							var result = oAddinConfigurationValidator.validate(oRequest);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception).toBeDefined();
						expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);

				}
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request contains invalid fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.extend({}, oValidAddinToPut, {
					INVALID : "INVALID"
				});

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain ADDIN_VERSION", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPut);
				oInvalidAddin = _.omit(oInvalidAddin, ['ADDIN_VERSION']);

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain ADDIN_GUID", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPut);
				oInvalidAddin = _.omit(oInvalidAddin, ['ADDIN_GUID']);

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});			

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if request does not contain CONFIG_DATA", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPut);
				oInvalidAddin.CONFIG_DATA = undefined;
				jasmine.log(JSON.stringify(oInvalidAddin));

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				jasmine.log(JSON.stringify(exception));
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if CONFIG_DATA contain invalid fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPut);
				oInvalidAddin.CONFIG_DATA[0].INVALID = 'INVALID';

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should raise an exception (GENERAL_VALIDATION_ERROR) if CONFIGURATION ITEMS do not contain mandatory fields", function() {
				var exception;

				// arrange
				var oInvalidAddin = _.clone(oValidAddinToPut);
				oInvalidAddin.CONFIG_DATA[0] = _.omit(oInvalidAddin.CONFIG_DATA[0], ['CONFIG_KEY']);

				// act
				try {
					var oRequest = buildRequest($.net.http.PUT, "addin-configurations", [], oInvalidAddin);
					var result = oAddinConfigurationValidator.validate(oRequest);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});

	}).addTags(["All_Unit_Tests"]);
}