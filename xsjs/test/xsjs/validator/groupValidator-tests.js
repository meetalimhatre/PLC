var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var groupValidatorLibrary = $.import("xs.validator", "groupValidator");
var GroupValidator = groupValidatorLibrary.GroupValidator;

var oConnectionMock = null;
var BusinessObjectValidatorUtilsMock = null;
var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
var oGroupValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.groupValidator-tests', function() {
		var oPersistencyMock = null;
		var oMetadataProviderMock = jasmine.createSpyObj("metadataProvider", ["get"]);

		beforeEach(function() {

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Group);
			spyOn(BusinessObjectValidatorUtilsMock, "checkMandatoryProperties", "checkInvalidProperties");

			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			oGroupValidator = new GroupValidator(oPersistencyMock, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
		});


		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "groups",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					}
			};
			return oRequest;
		}

		it('should throw exception one of the operations is invalid', function() {
			//arrange
			var oGroupTestData1 = {
					"CREATE": { "GROUPS": []},
					"TEST": {},
					"UPDATE": {
						"SUBGROUPS":[]
					}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});

		it('should throw exception if no objects are defined to be created, updated or deleted', function() {
			//arrange
			var oGroupTestData1 = {};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});

		it('should throw exception on POST if there are missing properties or invalid properties', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oGroupTestData1 = {
					"CREATE": { "GROUPS": [{
											"GROUP_ID": "tEST",
											"test1": "test"
											}, {
												"DESCRIPTION": "descr"}]},
					"DELETE": {	"SUBGROUPS": [{
											"GROUP_ID": "tEST",
											"test2": "test"
											}, {
											"SUBGROUP_ID": "descr"}],
								"MEMBERS": [{ 
											"USER_ID": "test"
											},{ 
											"GROUP_ID": "test",
											"Test3": "test"}]}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(MessageLibrary.Code.BATCH_OPPERATION_ERROR);		

		});	

		it('should throw exception on POST if users appear multiple times on request', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oGroupTestData1 = {
					"CREATE": { "MEMBERS": [ { 
										"USER_ID": "test",
										"GROUP_ID": "test" },
										{ "USER_ID": "test1",
											"GROUP_ID": "test"}
										]},
					"DELETE": {	
								"MEMBERS": [ { 
										"USER_ID": "test",
										"GROUP_ID": "test1"},
									{ "USER_ID": "test1",
										"GROUP_ID": "test"}
										]}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});	

		it('should throw exception on POST if subgroups appear multiple times on request', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oGroupTestData1 = {
						"CREATE": { "SUBGROUPS": [ { 
										"SUBGROUP_ID": "test",
										"GROUP_ID": "test" },
									{ 	"SUBGROUP_ID": "test",
											"GROUP_ID": "test1"}
									]},
						"DELETE": {	
								"SUBGROUPS": [ { 
										"SUBGROUP_ID": "test",
										"GROUP_ID": "test1"},
									{ 	"SUBGROUP_ID": "test1",
										"GROUP_ID": "test1"}
									]}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);		

		});
		
		it('should throw exception on UPDATE if not only groups appear in the requst', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oGroupTestData1 = {
					"CREATE": { "GROUPS": []},
					"UPDATE": {
						"SUBGROUPS":[{
										"SUBGROUP_ID": "test",
										"GROUP_ID": "test1"}]
					}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
	
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(MessageLibrary.Code.BATCH_OPPERATION_ERROR);		
		});
		
		it('should throw exception on POST if subgroups is not an array', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var oGroupTestData1 = {
						"CREATE": { "SUBGROUPS":  { 
										"SUBGROUP_ID": "test",
										"GROUP_ID": "test" 
									} },
						"DELETE": {	
								"SUBGROUPS": { 	"SUBGROUP_ID": "test1",
										"GROUP_ID": "test1"
									}}
			};
			var exception;
			var oRequestBody = createRequest(oGroupTestData1, $.net.http.POST);
			//act
			try {
				oGroupValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(MessageLibrary.Code.BATCH_OPPERATION_ERROR);		

		});

	}).addTags(["All_Unit_Tests"]);
}