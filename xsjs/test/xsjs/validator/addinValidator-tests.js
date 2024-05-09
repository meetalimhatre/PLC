var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");

var addinValidatorLibrary = $.import("xs.validator", "addinValidator");
var AddinValidator = addinValidatorLibrary.AddinValidator;
var AddinStates = require("../../../lib/xs/util/constants").AddinStates;
var AddinServiceParameters = require("../../../lib/xs/util/constants").AddinServiceParameters;


if(jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.validator.addinValidator-tests', function() {
		var oAddinValidator;

		var sSessionID = "TestSessionID";
		var oMetadataProviderMock = null;
		var oConnectionMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;

		var oValidAddinToDel = {
				ADDIN_GUID   : "1234567890123456789",
				ADDIN_VERSION: "2.12.1.0",
		};

		var oValidAddinToPost = {
				ADDIN_GUID            : "1234567890123456789",
				ADDIN_VERSION         : "2.12.1.2",
				FULL_QUALIFIED_NAME   : "com.sap.plc.extensibility.testAddIn",
				NAME                  : "Test Add-In",
				DESCRIPTION           : "Test addin",
				PUBLISHER             : "SAP SE",
				CERTIFICATE_ISSUER    : "CN =VeriSign Class 3 Code Signing 2010 CA",
				CERTIFICATE_SUBJECT   : "CN = TFS Development, O = mySAP.com Software, C = DE",
				CERTIFICATE_VALID_FROM: "2015-01-01T01:00:00.000Z",
				CERTIFICATE_VALID_TO  : "2019-01-01T01:00:00.000Z"
		};

		var oValidAddinToPut = {
				ADDIN_GUID      : "1234567890123456789",
				ADDIN_VERSION   : "2.12.1.2",
				LAST_MODIFIED_ON: "2015-12-08T11:42:00.000Z",
				STATUS          : AddinStates.Activated
		};

		var oValidAddinsAndMethods = {
				ADDIN      : [oValidAddinToDel, 	oValidAddinToPost, 	oValidAddinToPut],
				METHOD     : [$.net.http.DEL, 	$.net.http.POST, 	$.net.http.PUT],
				METHOD_NAME: ['DEL', 		'POST', 			'PUT']
		};

		var aInvalidVersions = ['false', '1.0.2.false', '1', '1.2', '1.2.3', '1.2.3.4.5', '-1.0.2.3'];

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

			oAddinValidator = new AddinValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);

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


		describe("General validations for POST/PUT/DEL methods", function() {

			it("should return validated object if the request is valid", function() {
				for(var i=0; i<oValidAddinsAndMethods.ADDIN.length; i++){
					jasmine.log(`Validating ${oValidAddinsAndMethods.METHOD_NAME[i]} requests`);
					// arrange
					var oValidAddin = oValidAddinsAndMethods.ADDIN[i];

					//act
					var oRequest = buildRequest(oValidAddinsAndMethods.METHOD[i], "addins", [], oValidAddin);
					var result = oAddinValidator.validate(oRequest);

					// assert
					var oParsedResult = JSON.parse(JSON.stringify(result));
					expect(oParsedResult).toEqualObject(oValidAddin, [ "ADDIN_GUID" ]);
				}

			});

			it("should raise an exception with code if request contains invalid fields", function() {
				for(var i=0; i<oValidAddinsAndMethods.ADDIN.length; i++) {
					var exception;

					// arrange
					var oValidAddin = oValidAddinsAndMethods.ADDIN[i];
					var oInvalidAddin = _.extend({}, oValidAddin, {
						INVALID_FIELD : "INVALID"
					});

					// act
					try {
						var oRequest = buildRequest(oValidAddinsAndMethods.METHOD[i], "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				}
			});

			it("should raise an exception with code if request does not contain some mandatory field", function() {
				for(var i=0; i<oValidAddinsAndMethods.ADDIN.length; i++) {
					var exception;

					// arrange
					var oValidAddin = oValidAddinsAndMethods.ADDIN[i];
					var oInvalidAddin = _.omit(oValidAddin, 'ADDIN_GUID');

					// act
					try {
						var oRequest = buildRequest(oValidAddinsAndMethods.METHOD[i], "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				}
			});

			it("should raise an exception with code if ADDIN_VERSION field has wrong format", function() {
				for(var j=0; j<aInvalidVersions.length; j++) {
					for(var i=0; i<oValidAddinsAndMethods.ADDIN.length; i++) {
						var exception;

						// arrange
						var oInvalidAddin = _.clone(oValidAddinsAndMethods.ADDIN[i]);
						oInvalidAddin.ADDIN_VERSION = aInvalidVersions[j];

						// act
						try {
							var oRequest = buildRequest(oValidAddinsAndMethods.METHOD[i], "addins", [], oInvalidAddin);
							var result = oAddinValidator.validate(oRequest);
						} catch (e) {
							exception = e;
						}

						// assert
						expect(exception).toBeDefined();
						expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
					}
				}
			});
		});


		describe("GET: validateGetRequest - Read Add-Ins", function() {
			var oValidatedParameters = null;

			it("should validate OK if request parameter Status = All", function() {
				// arrange
				jasmine.log(AddinServiceParameters.Status.Values.All);
				oValidatedParameters = {
						"status" : AddinServiceParameters.Status.Values.All
				};

				//act
				var oRequest = buildRequest($.net.http.GET, "addins", [oValidatedParameters]);
				var result = oAddinValidator.validate(oRequest, oValidatedParameters);
			});

			it("should validate OK if request parameter Status = Activated", function() {
				// arrange
				oValidatedParameters = {
						"status" : AddinServiceParameters.Status.Values.Activated
				};

				// act
				var oRequest = buildRequest($.net.http.GET, "addins", [oValidatedParameters]);
				var result = oAddinValidator.validate(oRequest, oValidatedParameters);
			});
			
			it("should raise an exception if request contains body", function() {
				var exception;
				
				// arrange
				oValidatedParameters = {
						"status" : AddinServiceParameters.Status.Values.Activated
				};

				// act
				try {
					var oRequest = buildRequest($.net.http.GET, "addins", [oValidatedParameters], oValidAddinToPut);
					var result = oAddinValidator.validate(oRequest, oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception).toBeDefined();
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

		});


		describe("PUT: validateUpdateRequest - (De)Activate Add-In", function() {

			it("should accept STATUS field in different cases and convert it to lower case (AddinStates.Activated)", function() {
				var aValidStatusFields = ['activated', 'Activated', 'ACTIVATED'];
				_.each(aValidStatusFields, function(sStatus) {

					//arrange
					var oValidAddin = _.clone(oValidAddinToPut);
					oValidAddin.STATUS = sStatus;

					// Create result object as expected to be returned
					// Hint: All AddinStates are lowercase
					var oValidAddinRes = _.clone(oValidAddinToPut);
					oValidAddinRes.STATUS = sStatus.toLowerCase();
					jasmine.log(JSON.stringify(oValidAddinRes));

					//act
					var oRequest = buildRequest($.net.http.PUT, "addins", [], oValidAddin);
					var result = oAddinValidator.validate(oRequest);

					// assert
					var oParsedResult = JSON.parse(JSON.stringify(result));
					expect(oParsedResult.STATUS).toEqual(AddinStates.Activated);
					expect(oParsedResult).toEqualObject(oValidAddinRes);

					jasmine.log(JSON.stringify(oParsedResult));
				});

			});

			it("should accept STATUS field in different cases and convert it to lower case (AddinStates.Registered)", function() {
				var aValidStatusFields = ['Registered', 'ReGisTerEd', 'REGISTERED'];
				_.each(aValidStatusFields, function(sStatus) {

					//arrange
					var oValidAddin = _.clone(oValidAddinToPut);
					oValidAddin.STATUS = sStatus;

					// Create result object as expected to be returned
					// Hint: All AddinStates are lowercase
					var oValidAddinRes = _.clone(oValidAddinToPut);
					oValidAddinRes.STATUS = sStatus.toLowerCase();

					jasmine.log(JSON.stringify(oValidAddinRes));

					//act
					var oRequest = buildRequest($.net.http.PUT, "addins", [], oValidAddin);
					var result = oAddinValidator.validate(oRequest);

					// assert
					var oParsedResult = JSON.parse(JSON.stringify(result));
					expect(oParsedResult.STATUS).toEqual(AddinStates.Registered);
					expect(oParsedResult).toEqualObject(oValidAddinRes);

					jasmine.log(JSON.stringify(oParsedResult));
				});

			});


			it("should raise an exception if STATUS is not a valid value", function() {
				var aValidStatusFields = ['1activated', 'Activateds', 'STRINGACTIVATED', '123', 'false'];
				_.each(aValidStatusFields, function(sStatus) {
					var exception;

					//arrange
					var oInvalidAddin = _.clone(oValidAddinToPut);
					oInvalidAddin.STATUS = sStatus;

					//act
					try {
						var oRequest = buildRequest($.net.http.PUT, "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
					} catch(e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				});

			});

			it("should raise an exception if request does not contain LAST_MODIFIED_ON", function() {
					var exception;

					//arrange
					var oInvalidAddin = _.omit(_.clone(oValidAddinToPut), ['LAST_MODIFIED_ON']);

					// act
					try {
						var oRequest = buildRequest($.net.http.PUT, "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);

			});

		});


		describe("POST: validateRegisterRequest - Register Add-In", function() {

			it("should raise an exception if various mandatory fields are missing", function() {
				var aMandatoryFields = ['CERTIFICATE_ISSUER', 'NAME', 'CERTIFICATE_VALID_TO', 'FULL_QUALIFIED_NAME', 'CERTIFICATE_SUBJECT'];
				_.each(aMandatoryFields, function(sMandatoryField) {
					var exception;

					//arrange
					var oInvalidAddin = _.omit(_.clone(oValidAddinToPost), [sMandatoryField]);

					//act
					try {
						var oRequest = buildRequest($.net.http.POST, "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
					} catch(e) {
						exception = e;
					}

					// assert
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
				});

			});

		});


		describe("DELETE: validateUnregisterRequest - Unregister Add-In", function() {

			it("should raise an exception if request does not contain ADDIN_GUID", function() {
					var exception;

					//arrange
					var oInvalidAddin = _.omit(_.clone(oValidAddinToDel), ['ADDIN_GUID']);

					// act
					try {
						var oRequest = buildRequest($.net.http.DEL, "addins", [], oInvalidAddin);
						var result = oAddinValidator.validate(oRequest);
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