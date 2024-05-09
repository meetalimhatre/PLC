var _ = require("lodash");

var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;

var AdministrationValidatorLibrary = $.import("xs.validator", "administrationValidator");
var AdministrationValidator = AdministrationValidatorLibrary.AdministrationValidator;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.validator.administrationValidator-tests', function() {
		
		var administration;
		var sSessionID = "TestSessionID";
		var oMetadataProviderMock = null;
		var oConnectionMock = null;
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;
		
		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);
			oMetadataProviderMock.get.and.returnValue(
                [{COLUMN_ID : 'AABBzz_kk09'},
                {COLUMN_ID : 'AAB_Bzz_kk09'},
                {COLUMN_ID : 'AABBzzkk09'},
                {COLUMN_ID : 'PRICE_SOURCE_ID'},
                {COLUMN_ID : 'PLANT_ID'},
                {COLUMN_ID : 'VALID_FROM'},
                {COLUMN_ID : 'MATERIAL_ID'},
                {COLUMN_ID : 'VALID_FROM'},
                {COLUMN_ID : 'PLANT_ID'},
                {COLUMN_ID : 'PRICE_VARIABLE_PORTION'},
                {COLUMN_ID : 'GIGI_KENT'}]
            );
			    
			
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', [ 'commit' ]);
			
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "getConnection" ]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);
			
			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Administration);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEmptyBody").and.callThrough();
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();
			
			administration = new AdministrationValidator(oPersistencyMock, sSessionID, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);			
		});
		
		function buildRequest(params){
			params.get = function(sArgument) {
				var value;  	
				_.each(this, function(oParameter) {
					if (oParameter.name === sArgument) {
						value = oParameter.value;
					}
				});
				return value;
			};

			var oRequest = {
					queryPath : "administration",
					method : $.net.http.GET,
					parameters : params,
					body : {
						asString : function() {
							return "";
						}
					}
			};
			return oRequest;
		}
		
		function buildGetRequest(sBusinessObject){
		    var params = [ {
				"name" : "business_object",
				"value" : sBusinessObject
			} ];
			return buildRequest(params);
		}
		
		function buildFilterGetRequest(sFilter) {
			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			var params = [ {
				"name" : "filter",
				"value" : sFilter
			},{
				"name" : "business_object",
				"value" : "Plant"
			} ];			
			return buildRequest(params);
		}
		
		function buildAutoCompleteGetRequest(sSearchString){
			var params = [ {
				"name" : "searchAutocomplete",
				"value" : sSearchString
			},{
				"name" : "business_object",
				"value" : "Plant"
			} ];
			return buildRequest(params);
		}
		
		describe("check filter parameter", function(){

			it("should pass if filter parameter is valid and operator is '=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzz_kk09=dfgh48FGDFäöüÄÖÜßA%Aaa#";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should pass if filter parameter is valid and operator is '!=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzz_kk09!=dfgh%-48F_GDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should pass if filter parameter is valid and operator is '<=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzz_kk09<=1000";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should pass if filter parameter is valid and operator is '<' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzz_kk09<10";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should pass if filter parameter is valid and operator is '>=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AAB_Bzz_kk09>=30";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should pass if filter parameter is valid and operator is '>' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AAB_Bzz_kk09>70";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});
			it("should pass if filter parameter is valid using not equals (!=)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09!=dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid using less or equal (<=)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09<=dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid using greater or equal (>=)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>=dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid using less than (<)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09<dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid using greater than (>)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid and operator is '=' ", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09=dfgh48FGDF&AABBzzkk09>dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});
			it("should pass if filter parameter is valid starting with asterisk (%)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>%dfgh48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});

			it("should pass if filter parameter is valid ending with wildcard (%)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh48FGDF%";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});

			it("should pass if filter parameter is valid containing an wildcard (%)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh%48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing an #", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh#48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing a dash -", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh-48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing an underscore _", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh_48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			it("should pass if filter parameter is valid containing a dot (.)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh.48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing a slash (/)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh/48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing a german letter (äöü)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfghäöü48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});
			
			it("should pass if filter parameter is valid containing a foreign letters (一二三四五六)", function() {
				///arrange
				var exception = null;
				var sFilter = "AABBzzkk09>dfgh一二三四五六48FGDF";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});

			it("should pass if filter parameter contains multiple valid filters", function() {
				///arrange
				var exception = null;
				var sFilter = "PRICE_SOURCE_ID!=101&MATERIAL_ID=100-100&PLANT_ID=1000&VALID_FROM<=2015-09-01&MATERIAL_ID=C-100&MATERIAL_ID=105-100&MATERIAL_ID=100-121&MATERIAL_ID!=100-401&VALID_FROM!=2015-08-31&PLANT_ID=2000&PLANT_ID!=4000&PLANT_ID=3000&PRICE_VARIABLE_PORTION>=1&PRICE_VARIABLE_PORTION<350&GIGI_KENT=%asd_ff-%g%&GIGI_KENT=asd_ff-%g%&GIGI_KENT=asd_ff-%g";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);

			});

			it("should throw exception if filter criterion parameter is malformed", function() {
				//arrange
				var exception = null;
				var sFilter = "select * from dummy;=ABC";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});

			it("should throw exception if filter value parameter is malformed", function() {
				//arrange
				var exception = null;
				var sFilter = "AABBzzkk09=select * from dummy;";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});

			it("should throw exception if filter parameter is malformed", function() {
				//arrange
				var exception = null;
				var sFilter = "select * from dummy;";
				//act
				try{
					administration.validate(buildFilterGetRequest(sFilter), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});
		
		describe("check autocomplete parameter", function(){
			
			it("should pass if autocomplete parameter is valid", function() {
				//arrange
				var exception = null;
				var sSearchAutocomplete = "äöüÄÖÜßA%Aaa#+| :/-";				
				//act
				try{
					administration.validate(buildAutoCompleteGetRequest(sSearchAutocomplete), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should throw exception if autocomplete parameter is malformed", function() {
				//arrange
				var exception = null;
				var sSearchAutocomplete = "!AABBz*@~z$kk(0)9[]";
				//act
				try{
					administration.validate(buildAutoCompleteGetRequest(sSearchAutocomplete), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});
		
		describe("check business_object parameter", function(){
			
			it("should pass if business_object parameter is valid", function() {
				//arrange
				var exception = null;
				var sBusinessObject = "Activity_Price";				
				//act
				try{
					administration.validate(buildGetRequest(sBusinessObject), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception).toBe(null);
			});

			it("should throw exception if business_object parameter is malformed", function() {
				//arrange
				var exception = null;
				var sBusinessObject = "select * from dummy";
				//act
				try{
					administration.validate(buildGetRequest(sBusinessObject), $.net.http.GET);
				}catch(e) {
					exception = e;
				}    		
				//assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code.code).toBe('GENERAL_VALIDATION_ERROR');
			});
		});

	}).addTags(["All_Unit_Tests"]);
}	