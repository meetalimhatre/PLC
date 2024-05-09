var _ = require("lodash");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var Code = MessageLibrary.Code;
var projectValidatorLibrary = $.import("xs.validator", "projectValidator");
var ProjectValidator = projectValidatorLibrary.ProjectValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
var sDefaultExchangeRateType = require("../../../lib/xs/util/constants").sDefaultExchangeRateType;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.projectValidator-tests', function() {

		var sSessionID = "TestSessionID";
		var oProjectValidator;

		var oMetadataProviderMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;

		var oExistingMasterdata = {
				CONTROLLING_AREAS : [{
					CONTROLLING_AREA_ID: "CV1" 
				}],
				COSTING_SHEETS: [{
					COSTING_SHEET_ID: "CS1"
				}],
				COMPONENT_SPLITS: [{
					COMPONENT_SPLIT_ID: "SPLIT1"
				},
				{
					COMPONENT_SPLIT_ID: "SPLIT2"
				}
				],
				CURRENCIES: [{
					CURRENCY_ID: "EUR"
				}],
				EXCHANGE_RATE_TYPES: [{
					EXCHANGE_RATE_TYPE_ID: sDefaultExchangeRateType
				}],
				MATERIAL_PRICE_STRATEGIES: [{
					PRICE_DETERMINATION_STRATEGY_ID: "PLC_STANDARD_M"
				}],
				ACTIVITY_PRICE_STRATEGIES: [{
					PRICE_DETERMINATION_STRATEGY_ID: "PLC_STANDARD_A"
				}]
		};

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);
            oMetadataProviderMock.get.and.returnValue([{"COLUMN_ID" : 'PROJECT_ID'},{"COLUMN_ID" : 'PROJECT_NAME'}]);
			
			// since some functions (esp. utilities of the persistency library must be executed, it is only partially mocked)
			oPersistencyMock = new Persistency({});
			spyOn(oPersistencyMock.Project, "getExistingNonTemporaryMasterdata");
			oPersistencyMock.Project.getExistingNonTemporaryMasterdata.and.returnValue(oExistingMasterdata);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Project);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oProjectValidator = new ProjectValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
		});

		var params = [];
		params.get = function() {
			return undefined;
		};

		var oValidExistingProject = {
				"PROJECT_ID":"PR1"
		};

		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "projects",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					},
					parameters : params
			};
			return oRequest;
		}

		describe("POST", function() {
			it("should validate OK for action = create", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'create'
				};
				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"PATH": "11/22/33/42"
				};
				
				// act
				var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});

			it("should validate OK for action = create if entity id is 0 (root) - path is mandatory", function() {
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"PATH": "0"
				};
				
				// act
				const result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});
			
			it("should validate OK for action = create if start of production is earlier than end of production", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'create'
				};
				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PRODUCTION" : "2010-08-20T00:00:00.000Z",
						"END_OF_PRODUCTION" : "2016-08-20T00:00:00.000Z",
						"PATH": "11/22/33/42"
				};
				
				// act
				var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				
				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});
			
			it("should validate OK for action = create if start of production is date and end of production is empty", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'create'
				};
				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PRODUCTION" : "2016-08-20T00:00:00.000Z",
						"PATH": "11/22/33/42"
				};
				
				// act
				var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				
				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});
			
			it("should validate OK for action = create if start of production is empty and end of production is date", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'create'
				};
				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"END_OF_PRODUCTION" : "2016-08-20T00:00:00.000Z",
						"PATH": "11/22/33/42"
				};
				
				// act
				var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				
				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});
			
			it("should throw error for action = create if start of production is later than end of production", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'create'
				};
				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PRODUCTION" : "2016-08-20T00:00:00.000Z",
						"END_OF_PRODUCTION" : "2010-08-20T00:00:00.000Z",
						"PATH": "11/22/33/42"
				};
				
				var exception;

				// act
				try {
					var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
			
			it("should throw error for action = create if start of project is later than end of project", function() {
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": "11/22/33/42"
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should throw error for action = create if PATH is not valid (contains characters)", function() {
				const invalidPath = "11/22/33INVALID/42";
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": invalidPath
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should throw error for action = create if PATH is missing from the request", function() {
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z"
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should throw error for action = create if PATH is not valid (is of type integer)", function() {
				const invalidPath = 123;
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": invalidPath
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it(`should throw error for action = create if PATH is not valid (int separated by multiple "/")`, function() {
				const invalidPath = "11/22/33///42";
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": invalidPath
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it(`should throw error for action = create if PATH is not valid (int separated by backslash \\)`, function() {
				const invalidPath = `11\\22\\33\\42`;
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": invalidPath
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should throw error for action = create if folder id is not an int", function() {
				// arrange
				const oValidatedParameters = {
						"action" : 'create'
				};
				const oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"START_OF_PROJECT" : "2016-08-20T00:00:00.000Z",
						"END_OF_PROJECT" : "2010-08-20T00:00:00.000Z",
						"PATH": "11/22/33/421ab"
				};
				
				let exception;

				// act
				try {
					oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it("should validate OK for action = close", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'close'
				};

				var result = oProjectValidator.validate( createRequest(oValidExistingProject, $.net.http.POST), oValidatedParameters);
				
				// assert
				expect(result).toEqualObject(oValidExistingProject);
			});

			it("should validate OK for action = open", function() {
				// arrange
				var oValidatedParameters = {
						"action" : 'open'
				};

				var result = oProjectValidator.validate( createRequest(oValidExistingProject, $.net.http.POST), oValidatedParameters);
				
				// assert
				expect(result).toEqualObject(oValidExistingProject);
			});

			it(`should throw error for action = create if MATERIAL_PRICE_STRATEGY_ID is null`, function () {
				// arrange
				const oValidatedParameters = {
					"action": 'create'
				};
				const oInvalidProjectToCreate = {
					"PROJECT_ID": "PR1",
					"START_OF_PROJECT": "2016-08-20T00:00:00.000Z",
					"END_OF_PROJECT": "2010-08-20T00:00:00.000Z",
					"PATH": "11/22/33/421ab",
					"MATERIAL_PRICE_STRATEGY_ID": null
				};

				let exception;

				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});

			it(`should throw error for action = create if ACTIVITY_PRICE_STRATEGY_ID is null`, function () {
				// arrange
				const oValidatedParameters = {
					"action": 'create'
				};
				const oInvalidProjectToCreate = {
					"PROJECT_ID": "PR1",
					"START_OF_PROJECT": "2016-08-20T00:00:00.000Z",
					"END_OF_PROJECT": "2010-08-20T00:00:00.000Z",
					"PATH": "11/22/33/421ab",
					"ACTIVITY_PRICE_STRATEGY_ID": null
				};

				let exception;

				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProjectToCreate, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
			});
		});

		describe("DELETE", function() {
			it("should validate OK", function() {
				// arrange and act
				oProjectValidator.validate( createRequest(oValidExistingProject, $.net.http.DEL));
			});
		});

		describe("PUT: validateUpdateRequest()", function() {
			it("should return a validated project if the request is valid", function() {
				// arrange
				var oReq = _.clone(oValidExistingProject);
				
				//act
				var result = oProjectValidator.validate(createRequest(oReq, $.net.http.PUT));

				// assert
				expect(result).toEqualObject(oReq);
			});
			
			it("should throw an exception if only one of TARGET_PATH or PATH exist on the request", function(){
                //arrange
				const oReq = _.clone(oValidExistingProject);
				oReq.TARGET_PATH = "0";
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate(createRequest(oReq, $.net.http.PUT));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeDefined();
		        expect(oException.code.code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
		});

		describe("tests for non-temporary masterdata", function() {

			var oExpectedErrorCode = MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR;
			var oValidatedParameters = {
					"action" : 'create'
			};

			it("should return validated calculation_version if item contains only references to existing non-temporary masterdata", function() {
				// arrange

				var oValidProjectToCreate = {
						"PROJECT_ID":"PR1",
						"REPORT_CURRENCY_ID" : "EUR",
						"CONTROLLING_AREA_ID" : "CV1",
						"COSTING_SHEET_ID" : "CS1",
						"COMPONENT_SPLIT_ID" : "SPLIT1",
						"PATH": "11/22/33/42",
						"MATERIAL_PRICE_STRATEGY_ID": "PLC_STANDARD_M",
						"ACTIVITY_PRICE_STRATEGY_ID": "PLC_STANDARD_A"
				};

				//act
				var result = oProjectValidator.validate( createRequest(oValidProjectToCreate, $.net.http.POST), oValidatedParameters);

				// assert
				expect(result).toEqualObject(oValidProjectToCreate);
			});


			it("should raise an exception with code if project references a non-existing REPORT_CURRENCY_ID for PUT", function() {
				// arrange
				var oInvalidProject = {
					"PROJECT_ID":			"PR1", 
					"REPORT_CURRENCY_ID" : 	"DM",
					"PATH": "11/22/33/42",
				};
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.PUT));
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
			
			it("should raise an exception with code if project references a non-existing EXCHANGE_RATE_TYPE_ID for PUT", () => {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":"PR1",
						"REPORT_CURRENCY_ID" : "EUR",
						"CONTROLLING_AREA_ID" : "CV1",
						"COSTING_SHEET_ID" : "CS1",
						"COMPONENT_SPLIT_ID" : "SPLIT1",
						"EXCHANGE_RATE_TYPE_ID" : "ABC"
				    };
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.PUT));
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("EXCHANGE_RATE_TYPE_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});
			
			it("should raise an exception with code if project references a non-existing REPORT_CURRENCY_ID for POST", function() {
				// arrange
				var oInvalidProject = {
					"PROJECT_ID":			"PR1", 
					"REPORT_CURRENCY_ID" : 	"DM",
					"PATH": "11/22/33/42",
				};
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.POST) , oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
			});

			it("should raise an exception if project references a non-existing MATERIAL_PRICE_STRATEGY_ID for PUT", () => {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"REPORT_CURRENCY_ID": "EUR",
					"CONTROLLING_AREA_ID": "CV1",
					"COSTING_SHEET_ID": "CS1",
					"COMPONENT_SPLIT_ID": "SPLIT1",
					"MATERIAL_PRICE_STRATEGY_ID": "ABC"
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.PUT));
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("MATERIAL_PRICE_STRATEGY_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});

			it("should raise an exception if project references a non-existing MATERIAL_PRICE_STRATEGY_ID for POST", function () {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"MATERIAL_PRICE_STRATEGY_ID": "DM",
					"PATH": "11/22/33/42",
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}
				// assert
				exception.developerMessage.indexOf("MATERIAL_PRICE_STRATEGY_ID") !== -1;
				expect(exception.code).toEqual(oExpectedErrorCode);
			});

			it("should raise an exception if project references a non-existing ACTIVITY_PRICE_STRATEGY_ID for PUT", () => {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"REPORT_CURRENCY_ID": "EUR",
					"CONTROLLING_AREA_ID": "CV1",
					"COSTING_SHEET_ID": "CS1",
					"COMPONENT_SPLIT_ID": "SPLIT1",
					"ACTIVITY_PRICE_STRATEGY_ID": "ABC"
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.PUT));
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("ACTIVITY_PRICE_STRATEGY_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});

			it("should raise an exception if project references a non-existing ACTIVITY_PRICE_STRATEGY_ID for POST", function () {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"ACTIVITY_PRICE_STRATEGY_ID": "DM",
					"PATH": "11/22/33/42",
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}
				// assert
				exception.developerMessage.indexOf("ACTIVITY_PRICE_STRATEGY_ID") !== -1;
				expect(exception.code).toEqual(oExpectedErrorCode);
			});

			it("should raise an exception if MATERIAL_PRICE_STRATEGY_ID is an existing PRICE_DETERMINATION_STRATEGY but not of correct type (1) for PUT", () => {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"REPORT_CURRENCY_ID": "EUR",
					"CONTROLLING_AREA_ID": "CV1",
					"COSTING_SHEET_ID": "CS1",
					"COMPONENT_SPLIT_ID": "SPLIT1",
					"MATERIAL_PRICE_STRATEGY_ID": "PLC_STANDARD_A"
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.PUT));
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("MATERIAL_PRICE_STRATEGY_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});

			it("should raise an exception if MATERIAL_PRICE_STRATEGY_ID is an existing PRICE_DETERMINATION_STRATEGY but not of correct type (1) for POST", function () {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"MATERIAL_PRICE_STRATEGY_ID": "PLC_STANDARD_A",
					"PATH": "11/22/33/42",
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}
				// assert
				exception.developerMessage.indexOf("MATERIAL_PRICE_STRATEGY_ID") !== -1;
				expect(exception.code).toEqual(oExpectedErrorCode);
			});

			it("should raise an exception if ACTIVITY_PRICE_STRATEGY_ID is an existing PRICE_DETERMINATION_STRATEGY but not of correct type (1) for PUT", () => {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"REPORT_CURRENCY_ID": "EUR",
					"CONTROLLING_AREA_ID": "CV1",
					"COSTING_SHEET_ID": "CS1",
					"COMPONENT_SPLIT_ID": "SPLIT1",
					"ACTIVITY_PRICE_STRATEGY_ID": "PLC_STANDARD_M"
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.PUT));
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("ACTIVITY_PRICE_STRATEGY_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});

			it("should raise an exception if ACTIVITY_PRICE_STRATEGY_ID is an existing PRICE_DETERMINATION_STRATEGY but not of correct type (1) for POST", function () {
				// arrange
				const oInvalidProject = {
					"PROJECT_ID": "PR1",
					"ACTIVITY_PRICE_STRATEGY_ID": "PLC_STANDARD_M",
					"PATH": "11/22/33/42",
				};
				let exception;
				// act
				try {
					oProjectValidator.validate(createRequest(oInvalidProject, $.net.http.POST), oValidatedParameters);
				} catch (e) {
					exception = e;
				}
				// assert
				exception.developerMessage.indexOf("ACTIVITY_PRICE_STRATEGY_ID") !== -1;
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
			it("should raise an exception with code if project references a non-existing EXCHANGE_RATE_TYPE_ID for POST", () => {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":"PR1",
						"REPORT_CURRENCY_ID" : "EUR",
						"CONTROLLING_AREA_ID" : "CV1",
						"COSTING_SHEET_ID" : "CS1",
						"COMPONENT_SPLIT_ID" : "SPLIT1",
						"EXCHANGE_RATE_TYPE_ID" : "ABC",
						"PATH": "11/22/33/42",
				    };
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.POST) , oValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
				exception.developerMessage.indexOf("EXCHANGE_RATE_TYPE_ID") !== -1;
				exception.developerMessage.indexOf("The value ABC is not valid. Temporary values are not allowed") !== -1;
			});

			it("should raise an exception with code if project references a non-existing CONTROLLING_AREA_ID", function() {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":			"PR1", 
						"CONTROLLING_AREA_ID" : "CA_X"
					};
				
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.PUT));
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
			
			it("should raise an exception with code if project references a non-existing COSTING_SHEET_ID", function() {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":			"PR1", 
						"COSTING_SHEET_ID" : "CS_X"
					};
				
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.PUT));
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
			});
			
			it("should raise an exception with code if project references a non-existing COMPONENT_SPLIT_ID", function() {
				// arrange
				var oInvalidProject = {
						"PROJECT_ID":		"PR1", 
						"COMPONENT_SPLIT_ID" : "CS_X"
					};
				
				var exception;

				// act
				try {
					oProjectValidator.validate(createRequest( oInvalidProject ,  $.net.http.PUT));
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception.code).toEqual(oExpectedErrorCode);
			});

		});
		
		describe("GET", function(){
		
		    function setParameter(mParameters){
		        var params = [];
		        if(mParameters.get("searchAutocomplete")){
		            params.push({
    				    "name" : "searchAutocomplete",
    				    "value" : mParameters.get("searchAutocomplete")
    			    });
    			}
		        if(mParameters.get("top")){
		            params.push({
    				    "name" : "top",
    				    "value" : mParameters.get("top")
    			    });
    			}
    			if(mParameters.get("filter")){
		            params.push({
    				    "name" : "filter",
    				    "value" : mParameters.get("filter")
    			    });
    			}
		        
    			params.get = function(sArgument) {
    			    return mParameters.get(sArgument);
    			};
    			
    			return params;
		    }
		    
		    function createGetRequest(mParameters) {
			var oRequest = {
					queryPath : "projects",
					method : $.net.http.GET,
					body : {
						asString : function() {
							return "";
						}
					},
					parameters : setParameter(mParameters)
			};
			return oRequest;
		}
		    
		    //searchAutoComplete
		    it("should validate OK if a valid searchAutocomplete parameter is passed", function(){
                //arrange
		        var mParameters = new Map([
		                ["searchAutocomplete","ABC123"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeUndefined();
		    });
		    
		    it("should throw an exception if an invalid searchAutocomplete parameter is passed", function(){
                //arrange
		        var mParameters = new Map([
		                ["searchAutocomplete","$"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeDefined();
		        expect(oException.code.code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		    });
		    
		    //filter
		    //valid fieldname
		    it("should validate OK if a valid fieldname for the filter parameter is passed", function(){
		         //arrange
		        var mParameters = new Map([
		                ["filter","PROJECT_ID=P1 _#/.%-"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeUndefined();
		    });
		    
		    //invalid fieldname
		    it("should throw an exception if an invalid fieldname for the filter parameter is passed", function(){
		         //arrange
		        var mParameters = new Map([
		                ["filter","DROP_SCHEMA_SAP_PLC=#P1"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeDefined();
		        expect(oException.code.code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		    });
		    
		    it("should validate OK if a valid filter parameter is passed with a project id containing spaces and special characters", function(){
		         //arrange
		        var mParameters = new Map([
		                ["filter","PROJECT_ID=AA BB | TEST PROJECT | 11.01"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeUndefined();
		    });
		    
		    
		    //multiple filters
		    it("should validate OK if multiple valid filter parameters are passed", function(){
		         //arrange
		        var mParameters = new Map([
		                ["filter","PROJECT_ID=P1_#/.%-&PROJECT_NAME=P1_#/.%-"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeUndefined();
		    });
		    
            //searchAutoComplete+Filter
		    it("should validate OK if valid filter parameter and valid searchAutocomplete parameter are passed", function(){
		        //arrange
		        var mParameters = new Map([
		                ["filter","PROJECT_ID=P1 _#/.%-&PROJECT_NAME=P1 _#/.%-"],
		                ["searchAutocomplete","ABC123"]
		            ]);
		        var oException;
		        
		        //act
		        try{
		            oProjectValidator.validate( createGetRequest(mParameters));
		        }catch(e){
		            oException = e;
		        }
		        
		        //assert
		        expect(oException).toBeUndefined();
		    });
		})
	}).addTags(["All_Unit_Tests"]);
}