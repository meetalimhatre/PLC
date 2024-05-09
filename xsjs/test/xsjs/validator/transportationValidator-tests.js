var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var transportationValidatorLibrary = $.import("xs.validator", "transportationValidator");
var TransportationValidator = transportationValidatorLibrary.TransportationValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.transportationValidator-tests', function() {
		
		var oTransportationValidator;
		var sSessionID = "TestSessionID";
		var oConnectionMock = null;
		var oPersistencyMock = null;
		var oTransportationMock = null;
		var BusinessObjectValidatorUtilsMock = null;

		describe ("export", function() {
			
			beforeEach(function() {

				oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);

				BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Transportation);
				spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

				oTransportationValidator= new TransportationValidator(oPersistencyMock, sSessionID, BusinessObjectValidatorUtilsMock);
			});

			function createGetRequest(oHTTPMethod) {
				var oRequest = {
						queryPath : "transportation",
						method : oHTTPMethod,
						body : {
							asString : function() {
								return "";
							}
						}
				};
				return oRequest;
			}

			it("should return validated transportation url for exporting table content", function(){
				//arrange
				var exception = null;
				var sTableParams = {tableNames: "t_metadata"};
				var aTableParams = {tableNames: "t_metadata,t_metadata_item_attributes,t_metadata__text"};
				var sBusinessObjectParams = {businessObjects: "cff"};
				var aBusinessObjectParams = {businessObjects: "cff,settings"};

				//act 
				try {
					oTransportationValidator.validate(createGetRequest($.net.http.GET), sTableParams);
					oTransportationValidator.validate(createGetRequest($.net.http.GET), aTableParams);
					oTransportationValidator.validate(createGetRequest($.net.http.GET), sBusinessObjectParams);
					oTransportationValidator.validate(createGetRequest($.net.http.GET), aBusinessObjectParams);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBe(null);			
			});

			it("should throw exception if table cannot be exported", function(){
				//arrange
				var exception = null;
				var aTableParams = {tableNames: "t_metadata,t_initialization_state"};

				//act 
				try {
					oTransportationValidator.validate(createGetRequest($.net.http.GET), aTableParams);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});

			it("should throw exception if business object is not valid", function(){
				//arrange
				var exception = null;
				var aBusinessObjectParams = {businessObjects: "settings,cfff"};

				//act 
				try {
					oTransportationValidator.validate(createGetRequest($.net.http.GET), aBusinessObjectParams);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});
		
		describe ("import", function() {
			
			var oTableColums = ["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID"];
				
			beforeEach(function() {

				oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
				
				oTransportationMock = jasmine.createSpyObj("oTransportationMock",["getTableColumns"]);
				oTransportationMock.getTableColumns.and.returnValue(oTableColums);
				
				oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
				oPersistencyMock.getConnection.and.returnValue(oConnectionMock);
				oPersistencyMock.Transportation = oTransportationMock;

				BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Transportation);
				spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

				oTransportationValidator= new TransportationValidator(oPersistencyMock, sSessionID, BusinessObjectValidatorUtilsMock);
				
			});
			
			function createPostRequest(oBody, oHTTPMethod) {
				var oRequest = {
						queryPath : "transportation",
						method : oHTTPMethod,
						body : {
							asString : function() {
								return JSON.stringify(oBody);
							}
						}
				};
				return oRequest;
			}
			
			it("should return validated body for post request", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controlling_area": [
												["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID"],
												["3", null]
											]
						};
				
				var oBody1 = {
						"t_controlling_area": [
												["CONTROLLING_AREA_CURRENCY_ID", "CONTROLLING_AREA_ID",],
												[null, "3"]
											]
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
					//order of the columns in the json should not count
					oTransportationValidator.validate(createPostRequest(oBody1,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBe(null);			
			});
			
			it("should throw exception if table name is not valid", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controllingg_area": [
												["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID"],
												["3", null]
											]
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});
			
			it("should throw exception if columns are not valid for table", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controllingg_area": [
												["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID", "TEST"],
												["3", null, 1]
											]
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert				
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});
			
			it("should throw exception if table columns are missing from the json", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controllingg_area": [
												["CONTROLLING_AREA_ID"],
												["3", null, 1]
											]
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert				
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});
			
			it("should throw exception if table content is an object (instead of array)", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controllingg_area": {}  // invalid table content
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});
			
			it("should throw exception if table content is not an array of arrays", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controllingg_area": [{}]  // invalid table content
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});

			it("should throw exception if table row has different number of columns than the header", function(){
				//arrange
				var exception = null;
				var params = null;
				var oBody = {
						"t_controlling_area": [
												["CONTROLLING_AREA_ID", "CONTROLLING_AREA_CURRENCY_ID"],
												["3", null],
												["5"] // invalid row
											]
						};

				//act 
				try {
					oTransportationValidator.validate(createPostRequest(oBody,$.net.http.POST), params);
				} catch(e) {
					exception = e;
				}

				//assert
				expect(exception).toBeDefined();
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');			
			});
		});
		
	}).addTags(["All_Unit_Tests"]);
}