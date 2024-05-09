const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const projectSurchargesValidatorLibrary = $.import("xs.validator", "projectActivityPriceSurchargesValidator");
const ProjectSurchargesValidator = projectSurchargesValidatorLibrary.ProjectActivityPriceSurchargesValidator;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

const MessageLibrary = require("../../../lib/xs/util/message");
const oExpectedValidationError = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
const oExpectedUnexpectedError = MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION;
const Persistency = $.import("xs.db", "persistency").Persistency;
const SurchargePlaceholders = require("../../../lib/xs/util/constants").SurchargePlaceholders;
const testData = require('../../testdata/testdata').data;
const MockstarFacade = require('../../testtools/mockstar_facade').MockstarFacade;
/**
 * Code remark: the tests are almost same as for project quantities. However, Rene and Vladimir decided not to put the tests together since:
 * 	- this was working bad in the past
 *  - it's good to test the public api implicitly
 */
describe('xsjs.validator.projectActivityPriceSurchargesValidator-tests', function() {

	var oConnectionMock = null;
	var oPersistencyMock = null;
	var oProjectSurchargesValidator = null;
	var BusinessObjectValidatorUtilsMock = null;
	var oMockstar = null;

	const oExistingMasterdata = {
		ACCOUNT_GROUPS: [{
			ACCOUNT_GROUP_ID: 1
		}],
		COST_CENTERS: [{
			COST_CENTER_ID: "CC2"
		}],
		ACTIVITY_TYPES: [{
			ACTIVITY_TYPE_ID: "ACTIVITY2222"
		}],
		PLANTS: [{
			PLANT_ID: "PL1"
		}],
	};

	beforeOnce(function () {
		oMockstar = new MockstarFacade({ // Initialize Mockstar
            substituteTables: // substitute all used tables in the procedure or view
            {
				account_group: {
                    name: 'sap.plc.db::basis.t_account_group',
                    data: testData.oAccountGroupTestDataPlc
				},
				activity_type: {
                    name: 'sap.plc.db::basis.t_activity_type',
                    data: testData.oActivityTypeTestDataPlc
				},
				cost_center: {
                    name: 'sap.plc.db::basis.t_cost_center',
                    data: testData.oCostCenterTestDataPlc
                },
				plant: {
                    name: 'sap.plc.db::basis.t_plant',
                    data: testData.oPlantTestDataPlc
				},
				project: {
                    name: 'sap.plc.db::basis.t_project',
                    data: testData.oProjectTestData
				}
            }
        });
	});

	beforeEach(function() {
		// since some functions (esp. utilities of the persistency library must be executed, it is only partially mocked)
		oPersistencyMock = new Persistency(jasmine.dbConnection);
		spyOn(oPersistencyMock.Project, "getExistingNonTemporaryMasterdataForSurcharges");
		oPersistencyMock.Project.getExistingNonTemporaryMasterdataForSurcharges.and.returnValue(oExistingMasterdata);
		spyOn(oPersistencyMock.Project, "exists");
		oPersistencyMock.Project.exists.and.returnValue(true);

		BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Project);
		oProjectSurchargesValidator = new ProjectSurchargesValidator(oPersistencyMock, BusinessObjectValidatorUtilsMock);

		oMockstar.clearAllTables(); // clear all specified substitute tables and views
        oMockstar.initializeData();
	});
	
	var aCorrectBody = [{
		"PLANT_ID": "PL1",
		"ACCOUNT_GROUP_ID": 1, 
		"COST_CENTER_ID": "CC2",
		"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
		"PERIOD_VALUES" : [{
			"LIFECYCLE_PERIOD_FROM" : 1404,
			"VALUE" : '1'
		}]
	}];	

	function prepareRequest(aBody, oHTTPMethod) {
		var oRequest = {
				queryPath : "project/activity-price-surcharges",
				method : oHTTPMethod,
				body : {
					asString : function() {
						return JSON.stringify(aBody);
					}
				},
		};
		return oRequest;
	}
	
	function runAndCheckException(aBody, oHTTPMethod, oExpectedError) {
		var exception;
		var oRequest = prepareRequest(aBody, oHTTPMethod);

		//act
		try {
			var result = oProjectSurchargesValidator.validate(oRequest, {id: "PR1"});
		} catch(e) {
			exception = e; 
		}

		//assert
		expect(exception).toBeDefined();
		expect(exception.code).toEqual(oExpectedError);	
	}
	
	it('should return validated project surcharges', function() {
		//arrange
		var oRequest = prepareRequest(aCorrectBody, $.net.http.PUT);

		//act
		var result = oProjectSurchargesValidator.validate(oRequest, {id: "PR1" });

		//assert
		expect(result).toBeDefined();
		var oParsedResult = JSON.parse(JSON.stringify(result));
		expect(oParsedResult).toEqual(aCorrectBody);		
	});
	
	it('should return validated project surcharges for PLANT_ID=""', function() {
		//arrange
		var aBody = new TestDataUtility(aCorrectBody).build();	
		aBody[0].PLANT_ID = "";

		var oRequest = prepareRequest(aBody, $.net.http.PUT);

		//act
		var result = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

		//assert
		expect(result).toBeDefined();
		var oParsedResult = JSON.parse(JSON.stringify(result));
		expect(oParsedResult).toEqual(aBody);		
	});

	it('should return validated project surcharges for ACTIVITY_TYPE_ID=""', function() {
		//arrange
		var aBody = new TestDataUtility(aCorrectBody).build();	
		aBody[0].ACTIVITY_TYPE_ID = "";

		var oRequest = prepareRequest(aBody, $.net.http.PUT);

		//act
		var result = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

		//assert
		expect(result).toBeDefined();
		var oParsedResult = JSON.parse(JSON.stringify(result));
		expect(oParsedResult).toEqual(aBody);		
	});
	
	it('should return empty surcharges if surcharges in request are empty', function() {
		//arrange
		var aBody = [];

		var oRequest = prepareRequest(aBody, $.net.http.PUT);

		//act
		var result = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

		//assert
		expect(result).toBeDefined();
		var oParsedResult = JSON.parse(JSON.stringify(result));
		expect(oParsedResult).toEqual(aBody);		
	});

	it('should throw exception if method cannot be validated', function() {
		//arrange
		var aBody = [];
		
		//act & assert
		runAndCheckException(aBody, $.net.http.DEL, oExpectedUnexpectedError);
	});	

	it('should throw exception if GET request contains body', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1"
		}];
		
		runAndCheckException(aBody, $.net.http.GET, oExpectedValidationError);
	});	
	
	it('should throw exception if request body is not an array', function() {
		//arrange
		var aBody = {
			"PLANT_ID": "PL1",
		};
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedUnexpectedError);	
	});
	
	it('should throw exception if mandatory properties are missing', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": 1
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);			
	});

	it('should throw exception if contains invalid properties', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": 1, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
			"INVALID" : 'invalid'
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);
	});
	
	it('should throw exception if ACCOUNT_GROUP_ID < -2', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": -3, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222"
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);
	});

	it('should throw exception if PERIOD_VALUES is not an array', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": 1, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
			"PERIOD_VALUES" : {}
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedUnexpectedError);		
	});

	it('should throw exception if in PERIOD_VALUES mandatory property is missing', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": 1, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
			"PERIOD_VALUES" : [{
				"VALUE" : '1000'
			}]
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);			
	});

	it('should throw exception if PERIOD_VALUES contains invalid properties', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": 1, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
			"PERIOD_VALUES" : [{
				"LIFECYCLE_PERIOD_FROM" : 1404,
				"VALUE" : '1000',
				"INVALID" : 'invalid'
			}]
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);	
	});
	
	it('should throw exception if VALUE is 0', function() {
		//arrange
		var aBody = [{
			"PLANT_ID": "PL1",
			"ACCOUNT_GROUP_ID": 1, 
			"COST_CENTER_ID": "CC2",
			"ACTIVITY_TYPE_ID":	"ACTIVITY2222",
			"PERIOD_VALUES" : [{
				"LIFECYCLE_PERIOD_FROM" : 1404,
				"VALUE" : '0'
			}]
		}];
		
		runAndCheckException(aBody, $.net.http.PUT, oExpectedValidationError);		
	});

	describe("tests for non-temporary masterdata", function () {

		it(`should validate successfully if any placeholder (-2) is used for ACCOUNT_GROUP_ID`, () => {
			// arrange
			const oValidDefinition = new TestDataUtility(aCorrectBody[0]).build();
			oValidDefinition["ACCOUNT_GROUP_ID"] = SurchargePlaceholders.ANY_ACCOUNT_GROUP;
			var oRequest = prepareRequest([oValidDefinition], $.net.http.PUT);

			//act
			var oResult = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

			//assert
			expect(oResult).toEqual([oValidDefinition]);
		});

		it(`should validate successfully if any placeholder (-1) is used for ACCOUNT_GROUP_ID`, () => {
			// arrange
			const oValidDefinition = new TestDataUtility(aCorrectBody[0]).build();
			oValidDefinition["ACCOUNT_GROUP_ID"] = SurchargePlaceholders.NO_ACCOUNT_GROUP;
			var oRequest = prepareRequest([oValidDefinition], $.net.http.PUT);

			//act
			var oResult = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

			//assert
			expect(oResult).toEqual([oValidDefinition]);
		});

		it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if version contains unknown master data reference for ACCOUNT_GROUP_ID`, () => {
			// arrange
			const oInvalidDefinition = new TestDataUtility(aCorrectBody[0]).build();
			oInvalidDefinition["ACCOUNT_GROUP_ID"] = 123;

			// act + assert
			runAndCheckException([oInvalidDefinition], $.net.http.PUT, MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR);
		});

		["COST_CENTER_ID", "ACTIVITY_TYPE_ID", "PLANT_ID"].forEach(sNonTemporaryMasterdata => {
			it(`should validate successfully if any placeholder ("*") is used for ${sNonTemporaryMasterdata}`, () => {
				// arrange
				const oValidDefinition = new TestDataUtility(aCorrectBody[0]).build();
				
				// SurchargePlaceholders.ANY_PLANT is the same as for all other string-based properties of a surcharge definition; is used like this here,
				// for the sake of simplicity
				oValidDefinition[sNonTemporaryMasterdata] = SurchargePlaceholders.ANY_PLANT;
				var oRequest = prepareRequest([oValidDefinition], $.net.http.PUT); 

				//act
				var oResult = oProjectSurchargesValidator.validate(oRequest, { id: "PR1" });

				//assert
				expect(oResult).toEqual([oValidDefinition]);		
			});

			it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if version contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
				// arrange
				const oInvalidDefinition = new TestDataUtility(aCorrectBody[0]).build();
				oInvalidDefinition[sNonTemporaryMasterdata] = "ABC";

				// act + assert
				runAndCheckException([oInvalidDefinition], $.net.http.PUT, MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR);
			});
		});
	});
	
}).addTags(["All_Unit_Tests"]);
