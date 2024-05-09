var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var ServiceOutput = require("../../../lib/xs/util/serviceOutput");
var frontendSettingsValidatorLibrary = $.import("xs.validator", "frontendSettingsValidator");
var _ = require("lodash");

var FrontendSettingsValidator = frontendSettingsValidatorLibrary.FrontendSettingsValidator;
var BusinessObjectValidatorUtilsMock = null;
var MessageLibrary = require("../../../lib/xs/util/message");
var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
var oUnExpectedErrorCode = MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION;
var oFrontendSettingsValidator;
var Persistency = $.import("xs.db", "persistency").Persistency;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('frontendSettingsValidator-tests', function() {
		var oPersistencyMock = null;

		beforeEach(function() {

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.FrontendSettings);
			oPersistencyMock = new Persistency(jasmine.dbConnection);

			oFrontendSettingsValidator = new FrontendSettingsValidator(oPersistencyMock, BusinessObjectValidatorUtilsMock);
		});


		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "frontend-settings",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					}
			};
			return oRequest;
		}

		it('should throw exception one of the operation is invalid (e.g. PATCH)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": -1,
						"SETTING_NAME": 'MyFilter',
						"SETTING_TYPE": "Filter",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}=='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PATCH);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oUnExpectedErrorCode);
		});
		
		
		it('should throw exception if body not empty (GET)', function() {
			//arrange
			var aFrontendSettingsTestData = {"empty":"body"};
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.GET);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('Expected an empty body during validation of FrontendSettings');
		});

		
		it('should throw exception if no objects are defined to be created (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [ ];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('Cannot validate HTTP method POST');
		});
		
		it('should throw exception if there are missing properties or invalid properties (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
			            "SETTING_ID": -1,
						"SETTING_TYPE": "FILTER",
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.developerMessage).toContain('Mandatory property SETTING_NAME is missing (business object: FrontendSettings).');	
		});	

		it('should throw exception if settings is not an array (POST)', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var aFrontendSettingsTestData = {
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}'
			};
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('Cannot validate HTTP method POST');
		});
		
		it('should throw exception if SETTING_TYPE length is greater than 50 (POST)', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter',
						"SETTING_TYPE": 'FILTER_FILTER_FILTER_FILTER_FILTER_FILTER_FILTER_FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}=='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
			expect(exception.developerMessage).toContain(`String is too long (max. length: 50).`);
		});
		
		it('should throw exception if SETTING_NAME length is greater than 250 (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}'
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain(`String is too long (max. length: 250).`);
		});
		
		it('should validate SETTING_NAME which contains characters like ^([\\pL\\d_:#.\\/\\-][^\\S\\n\\r\\f\\t]?)*[\\pL\\d_:#.\\/\\-]$ (POST)', function() {
			//arrange
			var aValidNames = ['f', 'f1üä', 'f 1过滤器__', 'aB0_#ABCabc123# _', '中文日本語中文'];
			
			_.each(aValidNames, function(sValidName,index){				
				var aFrontendSettingsTestData = [{
					"SETTING_ID": 1234,
					"SETTING_NAME": sValidName,
					"SETTING_TYPE": 'FILTER',
					"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
				}];
				var exception;
				var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
				
				//act
				try {
					oFrontendSettingsValidator.validate(oRequestBody, null);
				} catch(e) {
					exception = e; 
				}
				
				// assert
				expect(exception).toBeUndefined();	
			});
		});
		
		it('should throw exception if SETTING_NAME contains other characters than ^([\\pL\\d_:#.\\/\\-][^\\S\\n\\r\\f\\t]?)*[\\pL\\d_:#.\\/\\-]$ (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": '-My Filter @&',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should throw exception if SETTING_NAME contains leading spaces (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": ' Filter',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should throw exception if SETTING_NAME contains trailing spaces (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'Filter ',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should validate SETTING_TYPE which contains characters like ^[\\w]+$ (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_TYPE": 'FILTER_A',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});
		
		it('should throw exception if SETTING_TYPE contains other characters than ^[\\w]+$ (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter1234',
						"SETTING_TYPE": 'FILTER_-',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should throw exception if SETTING_TYPE is empty (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter1',
						"SETTING_TYPE": '',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
		});
		
		it('should throw exception if SETTING_NAME is empty (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": '',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
		});
		
		it('should throw exception if SETTING_CONTENT contains other characters than ^[\\w\{\}\\s\:\[\]\",.#$\/\\\+]*\=$ (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter1234',
						"SETTING_TYPE": 'FILTER_',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"&@"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should validate SETTING_CONTENT which contains characters like ^[\\w\{\}\\s\:\[\]\",.#$\/\\\+]*\=$ (POST)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_TYPE": 'FILTER_A',
						"SETTING_CONTENT": 'azAZ09_\{\}\s:\[\]\",.#/\\='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});

		it('should throw exception if no objects are defined to be updated (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [ ];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
			expect(exception.developerMessage).toContain('Cannot validate HTTP method PUT');
		});
		
		it('should throw exception if there are missing properties or invalid properties (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.developerMessage).toContain('SETTING_NAME is missing');
		});	

		it('should throw exception if settings is not an array (PUT)', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var aFrontendSettingsTestData = {
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			};
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
			expect(exception.developerMessage).toContain('Cannot validate HTTP method PUT');
		});
		
		it('should throw exception if SETTING_NAME length is greater than 250 (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#MyFilter01_#',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain(`String is too long (max. length: 250).`);
		});
		
		it('should validate SETTING_NAME which contains characters like ^([\\pL\\d_:#.\\/\\-][^\\S\\n\\r\\f\\t]?)*[\\pL\\d_:#.\\/\\-]$ (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB 0_#',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});
		
		it('should throw exception if SETTING_NAME contains other characters than ^([\\pL\\d_:#.\\/\\-][^\\S\\n\\r\\f\\t]?)*[\\pL\\d_:#.\\/\\-]$ (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter@',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should throw exception if SETTING_NAME is empty (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": '',
						"SETTING_TYPE": 'FILTER',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
		});
		
		it('should throw exception if SETTING_CONTENT contains other characters than ^[\\w\{\}\\\s\:\[\]\",.#$\/\\\+]*\=$ (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'MyFilter1234',
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"&@="}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('contains invalid characters');	
		});
		
		it('should validate SETTING_CONTENT which contains characters like ^[\\w\{\}\\s\:\[\]\",.#$\/\\\+]*\=$ (PUT)', function() {
			//arrange
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_CONTENT": 'azAZ09_\{\}\s\:\[\]\",.#\/\\='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});

		
		it('should throw exception if no objects are defined to be deleted (DEL)', function() {
			//arrange
			var aFrontendSettingsTestData = [ ];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.DEL);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
			expect(exception.developerMessage).toContain('Cannot validate HTTP method DELETE');
		});
	
		it('should throw exception if there are extra or invalid properties (DEL)', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_CONTENT": '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"2"}='
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.DEL);
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
			expect(exception.developerMessage).toContain('Found invalid properties during validation of FrontendSettings: SETTING_CONTENT.');
		});
		
		it('should throw exception if settings is not an array (DEL)', function() {
			//arrange
			var oServiceOutput = new ServiceOutput();
			var aFrontendSettingsTestData = {
						"SETTING_ID": 1234
			};
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.DEL);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null, oServiceOutput);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);	
			expect(exception.developerMessage).toContain('Cannot validate HTTP method DELETE');
		});

		it('should validate SETTING_CONTENT which contains valid base64 CHANGE_CONFIGURATION for Mass Change (POST)', function() {
			//arrange
			var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6e319fQ==";
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_TYPE": 'MassChange',
						"SETTING_CONTENT": aSettingContent
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});

		it('should validate SETTING_CONTENT which contains valid base64 CHANGE_CONFIGURATION for Mass Change (PUT)', function() {
			spyOn(oPersistencyMock.FrontendSettings, "getFrontendSettingsMassChangeIds");
			oPersistencyMock.FrontendSettings.getFrontendSettingsMassChangeIds.and.returnValue([{
				"SETTING_ID": 1234
			}]);
			//arrange
			var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMRCI6e319fQ==";
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_CONTENT": aSettingContent
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody, null);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeUndefined();	
		});

		it('should throw exception if SETTING_CONTENT contains invalid base64 CHANGE_CONFIGURATION for Mass Change (POST)', function() {
			//arrange
			var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMIjp7fX19";
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_TYPE": 'MassChange',
						"SETTING_CONTENT": aSettingContent
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.POST);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should throw exception if SETTING_CONTENT contains invalid base64 CHANGE_CONFIGURATION for Mass Change (PUT)', function() {
			spyOn(oPersistencyMock.FrontendSettings, "getFrontendSettingsMassChangeIds");
			oPersistencyMock.FrontendSettings.getFrontendSettingsMassChangeIds.and.returnValue([{
				"SETTING_ID": 1234
			}]);
			//arrange
			var aSettingContent = "eyJDSEFOR0VfQ09ORklHVVJBVElPTiI6eyJGSUVMIjp7fX19";
			var aFrontendSettingsTestData = [{
						"SETTING_ID": 1234,
						"SETTING_NAME": 'aB0_#aB0_#',
						"SETTING_CONTENT": aSettingContent
			}];
			var exception;
			var oRequestBody = createRequest(aFrontendSettingsTestData, $.net.http.PUT);
			
			//act
			try {
				oFrontendSettingsValidator.validate(oRequestBody);
			} catch(e) {
				exception = e; 
			}
			
			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});
		
	}).addTags(["All_Unit_Tests"]);
}