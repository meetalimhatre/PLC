var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var testdata = require("../../testdata/testdata").data;
var privilegeValidatorLibrary = $.import("xs.validator", "privilegeValidator");
var PrivilegeValidator = privilegeValidatorLibrary.PrivilegeValidator;

var oConnectionMock = null;
var BusinessObjectValidatorUtilsMock = null;
var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
var oPrivilegeValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.privilegeValidator-tests', function() {
		var oPersistencyMock = null;

		beforeEach(function() {

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Privilege);
			spyOn(BusinessObjectValidatorUtilsMock, "checkMandatoryProperties", "checkInvalidProperties");

			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			oPrivilegeValidator = new PrivilegeValidator(oPersistencyMock, BusinessObjectValidatorUtilsMock);
		});


		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "privilege",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					}
			};
			return oRequest;
		}

		it('should throw exception on POST if the request object contains invalid properties', function() {
			//arrange
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						                    { "USER_ID": "Usr2",
						                    	            "PRIVILEGE": "Read"
						                    }]},
						                    "DELETE":  {
						                    	"USER_PRIVILEGES": [
						                    	                    { "USER_ID": "Usr1",
						                    	                    },
						                    	                    { "USER_ID": "Usr4"
						                    	                    }]},
						                    	                    "INSERT":  {
						                    	                    	"USER_PRIVILEGES": [
						                    	                    	                    { "USER_ID": "Tester1",
						                    	                    	                    	"PRIVILEGE": "Administrate"
						                    	                    	                    },
						                    	                    	                    { "USER_ID": "Tester3",
						                    	                    	                    	"PRIVILEGE": "Administrate"
						                    	                    	                    }]}};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	

		it('should throw exception on POST if create, delete or update user privileges are not arrays', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						                    { "USER_ID": "Usr2",
						                    	"PRIVILEGE": "Read"
						                    }]},
						                    "DELETE": { "USER_ID": "Usr1"
						                    }};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(MessageLibrary.Code.BATCH_OPPERATION_ERROR);		

		});	

		it('should throw exception if no objects are defined to be created, updated or deleted', function() {
			//arrange
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1"
			};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	

		it('should throw exception if the current user is on the request', function() {
			//arrange
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						                    { "USER_ID": "Usr2",
						                    	"PRIVILEGE": "Read"
						                    },
						                    { "USER_ID": "Usr5",
						                    	"PRIVILEGE": "Read"
						                    }]},
						                    "DELETE": {
						                    	"USER_PRIVILEGES":
						                    		[{ "USER_ID": testdata.sTestUser
						                    		}]}
			};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	

		it('should throw exception if a user appears 2 times on the request', function() {
			//arrange
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						                    { "USER_ID": "Usr2",
						                    	"PRIVILEGE": "Read"
						                    },
						                    { "USER_ID": "Usr5",
						                    	"PRIVILEGE": "Read"
						                    }]},
						                    "DELETE": {
						                    	"USER_PRIVILEGES":
						                    		[{ "USER_ID": "usr2"
						                    		}]}
			};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	
		
		it('should throw exception if a group appears 2 times on the request', function() {
			//arrange
			var oPrivilegeTestData1 = {  
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
					"UPDATE":  {
						"GROUP_PRIVILEGES": [
						                    { "GROUP_ID": "GR2",
						                    	"PRIVILEGE": "Read"
						                    },
						                    { "GROUP_ID": "GR5",
						                    	"PRIVILEGE": "Read"
						                    }]},
						                    "DELETE": {
						                    	"GROUP_PRIVILEGES":
						                    		[{ "GROUP_ID": "gr2"
						                    		}]}
			};
			var exception;
			var oRequestBody = createRequest(oPrivilegeTestData1, $.net.http.POST);
			//act
			try {
				oPrivilegeValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	

	}).addTags(["All_Unit_Tests"]);
}