var _ = require("lodash");
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var Code = MessageLibrary.Code;
var GenericSyntaxValidator = require("../../../lib/xs/validator/genericSyntaxValidator").GenericSyntaxValidator;
var helpers = require("../../../lib/xs/util/helpers");

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.validator.genericSyntaxValidator-tests', function() {

		var genericSyntaxValidator;

		var sStringDefaultTypeDetails = "length=20;";

		describe('basic tests', function() {

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("validateValue_undefinedValueButOptional_returnUndefined", function() {
				// act
				var returnValue = genericSyntaxValidator.validateValue(undefined, "String", false);

				// assert
				expect(returnValue).toBe(null);
			});

			it("validateValue_undefinedValueButMandatory_throwPlcException", function() {
				// arrange
				var exception;

				// act
				try {
					var returnValue = genericSyntaxValidator.validateValue(undefined, "String", sStringDefaultTypeDetails, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
			});

			it("validateValue_invalidDataType_throwPlcException", function() {
				// arrange
				var sInvalidDataType = "sInvalidDataType";
				var exception;

				// act
				try {
					var returnValue = genericSyntaxValidator.validateValue("value", sInvalidDataType, undefined, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code).toBe(Code.GENERAL_UNEXPECTED_EXCEPTION);
			});


			it("validateValue_dataTypesWithLeadingAndTailingSpaces_validatedValues", function() {
				// arrange
				var aDataTypesAndValues = {
						"Decimal": {
							value: "123.45",
							typeDetails: "precision=20;scale=5;"
						},
						"String": {
							value: "s",
							typeDetails: "length=5;"
						},
						"Link": {
							value: "https://www.sap.com",
							typeDetails: "length=5000;"
						},
						"Boolean": {
							value: true
						},
						"BooleanInt": {
							value: 1
						},
						"Integer": {
							value: 123
						},
						"PositiveInteger": {
							value: 123
						},
						"UTCTimestamp": {
							value: "2009-03-24T16:24:32.057Z"
						},
						"LocalDate": {
							value: "2009-03-24"
						}
				};

				_.each(aDataTypesAndValues, function(oInput, sDataType) {
					var sDataTypeLeadingSpace = " " + sDataType;
					var sDataTypeTailingSpace = sDataType + " ";
					var sDataTypeLeadingAndTailingSpace = " " + sDataType + " ";

					// act
					var returnValueLeadingSpace = genericSyntaxValidator.validateValue(oInput.value, sDataTypeLeadingSpace, oInput.typeDetails,
							true);
					var returnValueTailingSpace = genericSyntaxValidator.validateValue(oInput.value, sDataTypeTailingSpace, oInput.typeDetails,
							true);
					var returnValueLeadingAndTailingSpace = genericSyntaxValidator.validateValue(oInput.value, sDataTypeLeadingAndTailingSpace,
							oInput.typeDetails, true);

					// assert
					if (returnValueLeadingSpace instanceof Date) {
						expect(returnValueLeadingSpace instanceof Date).toBe(true);
						expect(returnValueTailingSpace instanceof Date).toBe(true);
						expect(returnValueLeadingAndTailingSpace instanceof Date).toBe(true);
					} else {
						expect(returnValueLeadingSpace).toBe(oInput.value);
						expect(returnValueTailingSpace).toBe(oInput.value);
						expect(returnValueLeadingAndTailingSpace).toBe(oInput.value);
					}

				});
			});

			it("validateUppercaseMetadata_wrongUppercaseValue_throwPlcException", function() {
				// arrange
				var exception;
				var sStringSemanticDatatype = 'length=10;uppercase=31';
				var value = 'test';
				// act
				try {
					var returnValue = genericSyntaxValidator.validateValue(value, "String", sStringSemanticDatatype, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
				expect(exception.code).toBe(Code.GENERAL_UNEXPECTED_ERROR);
			});
		});

		describe('decimal tests', function() {

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("should return validated values if valid decimal was provided as input", function() {
				var mValidTestNumbers = {
				    "1234567.1234": "precision=25;scale=9;", 
					"1234567.1234": "precision=20;scale=5;", 
					"1234567.12345": "precision=20;scale=5;", 
					"12.12345": "precision=7;scale=5;", 
					"12345": "precision=10;scale=5;",
					"1234567": "precision=12;scale=5;",
					"0": "precision=7;scale=5;",
					"-12.12345": "precision=7;scale=5;",
					"-12345": "precision=10;scale=5;"
				};

				_.each(mValidTestNumbers, function(sTypeDetails, sTestNumber) {
					jasmine.log("Validating " + sTestNumber);

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sTestNumber, "Decimal", sTypeDetails, true);

					// assert
					expect(sReturnValue).toBe(sTestNumber);
				});
			});
			
			it("should return validated values if valid decimal was provided as input when using caching maps", function() {
			    let i = 3;
				var mValidTestNumbers = {
					"1234567.1234": "precision=20;scale=5;", 
					"1234567.12345": "precision=20;scale=5;", 
					"12.12345": "precision=7;scale=5;", 
					"12345": "precision=10;scale=5;",
					"1234567": "precision=12;scale=5;",
					"0": "precision=7;scale=5;",
					"-12.12345": "precision=7;scale=5;",
					"-12345": "precision=10;scale=5;"
				};
                
                while(i > 0) {
    				_.each(mValidTestNumbers, function(sTypeDetails, sTestNumber) {
    					jasmine.log("Validating " + sTestNumber);
    
    					// act
    					var sReturnValue = genericSyntaxValidator.validateValue(sTestNumber, "Decimal", sTypeDetails, true);
    
    					// assert
    					expect(sReturnValue).toBe(sTestNumber);
    				});
    				i--;
                }
			});
			
			it("should throw an exception if the scale or precision are exceeded", function() {
				// arrange
				var mInvalidValues = {
					"123456.123456": "precision=11;scale=6", // max. whole digits = 5 (p-s = 5)
					"123456.12345": "precision=11;scale=4", // max scale exceeded
					"123456789.12": "precision=11;scale=4", // invalid since max. 9 whole digits allowed
					"1234.": "precision=20;scale=5;",		// test some silly value no matter scale/precision
					"-1234.": "precision=20;scale=5;",
					"123fa.": "precision=20;scale=5;",
					"123a34.21": "precision=20;scale=5;",
					"121§2": "precision=20;scale=5;",
					"123ö": "precision=20;scale=5;",
					"abcde": "precision=20;scale=5;"
				};

				// act
				_.each(mInvalidValues, function(sTypeAttributes, sValue) {
					jasmine.log(`validating value ${sValue} with data type attributes ${sTypeAttributes}`);
					var exception = null;
					try {
						var iReturnValue = genericSyntaxValidator.validateValue(sValue, "Decimal", sTypeAttributes, true);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception instanceof PlcException).toBe(true);
					expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
				});
			});

			it("should validate values regardless the type details contain a lot of spaces", function() {
				// arrange
				var aTypeDetailsVariations = ["precision=20;scale=5;", " precision = 20 ; scale = 5 ;", "precision=20; scale=5",
				                              "precision=20 scale=5", "precision=20;scale=5 ;", " precision=20;scale=5"];
				var sValue = "123.45";
				_.each(aTypeDetailsVariations, function(sTypeDetail, iIndex) {
					jasmine.log("Checking type detail " + sTypeDetail);

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "Decimal", sTypeDetail, true);

					// assert
					expect(sReturnValue).toBe(sValue);
				});
			});
			
			it("should throw a general exception if invalid precisions and scales are provided", function() {			
				// arrange
				// rule for precision p and scale s: 0 <= s <= p <= 38
				var aInvalidTypeAttributes = ["precision=39;scale=5;", "precision=20;scale=-1;","precision=20;scale=21;"];
				var sValue = "123.45";

				_.each(aInvalidTypeAttributes, function(sTypeAttributes) {
					jasmine.log("Checking type detail " + sTypeAttributes);

					var exception = null;
					try {
						var iReturnValue = genericSyntaxValidator.validateValue(sValue, "Decimal", sTypeAttributes, true);
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception instanceof PlcException).toBe(true);
					expect(exception.code).toBe(Code.GENERAL_UNEXPECTED_EXCEPTION);
				});
			});
		});

		describe('string tests', function() {
			var mValidStrings = {
					"a": "length=1;",
					"♥": "length=1;",
					"B": "length=10;",
					"123": "length=3;",
					"asdf123": "length=7;",
					"ASas23": "length=7;",
					"ASas234y": "length=9;uppercase=0",
					"ASDFGG15": "length=9;uppercase=1",
					"abc\r\nABC DEF \r\n 123" : "length=23;"
			};

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("valid string -> validation succeed and return validated value", function() {
				// arrange
				_.each(mValidStrings, function(sTypeDetail, sTestString) {

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "String", sTypeDetail, true);

					// assert
					expect(sReturnValue).toBe(sTestString);
				});
			});
			
			it("valid string -> validation succeed and return validated value when using caching maps", function() {
				// arrange
				let i = 3;
				while(i > 0) {
			    	_.each(mValidStrings, function(sTypeDetail, sTestString) {

    					// act
    					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "String", sTypeDetail, true);
    
    					// assert
    					expect(sReturnValue).toBe(sTestString);
    				});
    				i--;
				}

			});

			it("no data type attributes for length provided => validation should succeed anyway and return validated value", function() {
				// arrange
				_.each(mValidStrings, function(sTypeDetail, sTestString) {

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "String", undefined, true);

					// assert
					expect(sReturnValue).toBe(sTestString);
				});
			});

			it("different variants of data type attributes -> successful validation (and attribute parsing)", function() {
				// arrange
				var aTypeDetailsVariations = ["length=5;", "length = 5 ;", "length=5", "length=5 ;", "length =5;", " length= 5 ;"];
				var sValue = "abcde";
				_.each(aTypeDetailsVariations, function(sTypeDetail, iIndex) {
					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "String", sTypeDetail, true);

					// assert
					expect(sReturnValue).toBe(sValue);
				});
			});

			it("string too long -> throw PlcException", function() {
				// arrange
				var sValue = "sValue123";
				var sTypeDetail = "length=1;";
				var exception;

				// act
				try {
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "String", sTypeDetail, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
			});

			it("string lowercase -> throw PlcException", function() {
				// arrange
				var sValue = "sValue123";
				var sTypeDetail = "length=10;uppercase=1";
				var exception;

				// act
				try {
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "String", sTypeDetail, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
			});

		});

		describe('link tests', function() {
			var mValidStrings = {
					"Https://www.google.com/Search?q=regex+url+sql+injection+prevention": "length=2000;",
					"htTp://xn--nw2a.xn--j6w193g/": "length=2000;",
					"https://html.com/anchors-links/#menu-main": "length=2000;",
					"ftp://localhost:12": "length=2000;",
					"sftp://localhost": "length=2000;",
					"http://192.168.1.1:12345/my-custom-http-port/test/loung/url/?has_parameter=true&number>100#anchor": "length=2000;",
					"http://www.tüv-süd.de": "length=2000;",
					"http://8mile.com/": "length=2000;"
			};

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("valid link -> validation succeed and return validated value", function() {
				// arrange
				_.each(mValidStrings, function(sTypeDetail, sTestString) {

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "Link", sTypeDetail, true);

					// assert
					expect(sReturnValue).toBe(sTestString);
				});
			});
			
			it("valid link -> validation succeed and return validated value when using caching maps", function() {
				// arrange
				let i = 3;
				while(i > 0) {
			    	_.each(mValidStrings, function(sTypeDetail, sTestString) {

    					// act
    					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "Link", sTypeDetail, true);
    
    					// assert
    					expect(sReturnValue).toBe(sTestString);
    				});
    				i--;
				}

			});

			it("no data type attributes for length provided => validation should succeed anyway and return validated value", function() {
				// arrange
				_.each(mValidStrings, function(sTypeDetail, sTestString) {

					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "Link", undefined, true);

					// assert
					expect(sReturnValue).toBe(sTestString);
				});
			});

			it("different variants of data type attributes -> successful validation (and attribute parsing)", function() {
				// arrange
				var aTypeDetailsVariations = ["length=24;", "length = 25 ;", "length=25", "length=25 ;", "length =25;", " length= 25 ;"];
				var sValue = "https://www.sap.com";
				_.each(aTypeDetailsVariations, function(sTypeDetail, iIndex) {
					// act
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "Link", sTypeDetail, true);

					// assert
					expect(sReturnValue).toBe(sValue);
				});
			});

			it("string too long -> throw PlcException", function() {
				// arrange
				var sValue = "https://www.sap.com";
				var sTypeDetail = "length=1;";
				var exception;

				// act
				try {
					var sReturnValue = genericSyntaxValidator.validateValue(sValue, "Link", sTypeDetail, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
			});

			it("wrong uppercase attribute used => successful validation", function() {
				// arrange
				var sTestString = "https://www.sap.com";
				var sTypeDetail = "length=30;uppercase=1";
				var exception;

				// act
				var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "Link", sTypeDetail, true);

				// assert
				expect(sReturnValue).toBe(sTestString);
			});

			it("only uppercase attribute used => PlcException Thrown", function() {
				// arrange
				var sTestString = "https://www.sap.com";
				var sTypeDetail = "uppercase=1";
				var exception;

				// act
				try {
					var sReturnValue = genericSyntaxValidator.validateValue(sTestString, "Link", sTypeDetail, true);
				} catch (e) {
					exception = e;
				}

				// assert
				expect(exception instanceof PlcException).toBe(true);
			});

		});

		
		describe('regular expression string tests', function() {

			// Helper function to get regular expression string defined in t_regex.csv
			function getRegexString(name) {
				const result = jasmine.dbConnection.executeQuery(
					'select VALIDATION_REGEX_VALUE from "sap.plc.db::basis.t_regex" where VALIDATION_REGEX_ID = ?',
					name
				);
				return result[0].VALIDATION_REGEX_VALUE;
			}

			const aValidStrings = [
			                     // letters
			                     "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ", "ÐÑÒÓÔÕÖØÙÚÛÜÝÞß", "àáâãäåæçèéêëìíîï", "ðñòóôõöøùúûüýþÿ", "ĀāĂăĄąĆćĈĉĊċČčĎď", "ĐđĒēĔĕĖėĘęĚěĜĝĞğ",
			                     "ĠġĢģĤĥĦħĨĩĪīĬĭĮį", "İıĲĳĴĵĶķĸĹĺĻļĽľĿ", "ŀŁłŃńŅņŇňŉŊŋŌōŎŏ", "ŐőŒœŔŕŖŗŘřŚśŜŝŞş", "ŠšŢţŤťŦŧŨũŪūŬŭŮů", "ŰűŲųŴŵŶŷŸŹźŻżŽžſ",
			                     "ƀƁƂƃƄƅƆƇƈƉƊƋƌƍƎƏ", "ƐƑƒƓƔƕƖƗƘƙƚƛƜƝƞƟ", "ƠơƢƣƤƥƦƧƨƩƪƫƬƭƮƯ", "ưƱƲƳƴƵƶƷƸƹƺƻƼƽƾƿ", "ǄǅǆǇǈǉǊǋǌǍǎǏ", "ǐǑǒǓǔǕǖǗǘǙǚǛǜǝǞǟ",
			                     "ǠǡǢǣǤǥǦǧǨǩǪǫǬǭǮǯ", "ǰǱǲǳǴǵǶǷǸǹǺǻǼǽǾǿ", "ȀȁȂȃȄȅȆȇȈȉȊȋȌȍȎȏ", "ȐȑȒȓȔȕȖȗȘșȚțȜȝȞȟ", "ȠȡȢȣȤȥȦȧȨȩȪȫȬȭȮȯ", "ȰȱȲȳȴȵȶȷȸȹȺȻȼȽȾȿ", "ɀɁ",
			                     "ɐɑɒɓɔɕɖɗɘəɚɛɜɝɞɟ", "ɠɡɢɣɤɥɦɧɨɩɪɫɬɭɮɯ", "ɰɱɲɳɴɵɶɷɸɹɺɻɼɽɾɿ", "ʀʁʂʃʄʅʆʇʈʉʊʋʌʍʎʏ", "ʐʑʒʓʔʕʖʗʘʙʚʛʜʝʞʟ", "ʠʡʢʣʤʥʦʧʨʩʪʫʬʭʮʯ",
			                     "ڀځڂڃڄڅچڇڈډڊڋڌڍڎڏ", "ڐڑڒړڔڕږڗژڙښڛڜڝڞڟ", "ڠڡڢڣڤڥڦڧڨکڪګڬڭڮگ", "ذرزسشصضطظعغ", "ܠܡܢܣܤܥܦܧܨܩܪܫܬܭܮ", "ސޑޒޓޔޕޖޗޘޙޚޛޜޝޞޟ", "ऐऑऒओऔकखगघङचछजझञट",
			                     "ऄअआइईउऊऋऌऍऎए", "रऱलळऴवशषसह", "ওঔকখগঘঙচছজঝঞট", "ঠডঢণতথদধন", "ਓਔਕਖਗਘਙਚਛਜਝਞਟ", "ઓઔકખગઘઙચછજઝઞટ",

			                     // numbers
			                     "1234567890", "一二三四五六七八九零", "一二三四五六",

			                     // special characters
				"/", "#", "_", "-", ".", ":", "|", "+", "(", ")", "`",
			                     
			                     // special strings
				"P:ABC", "a b", "a  b",

			                     // mixed characters
			                     "0001AAaa///..###___---////", "#######000000....____////", "_____adsgagSAG245", "------2352afsaASF", ".......asd124##__--///",
			                     "/////...asd124##__--///", "asd124##__--//......./", "AAASSZZasd124##__--//......./"
			                     ];


			describe('regular expression for masterdata', function() {
				const aInvalidCharacters = [
										"!", "\"", "£", "$", "%", "^", "&", "*", "=", "[", "]", "{", "}", ";", "'", "@", "~", "<", ">", "?", "\\",
			                          ",", "¬", "÷", "♥", " ", "a b "
			                          ];
				const sRegExp = getRegexString("MASTERDATA");
			
				beforeEach(function() {
					genericSyntaxValidator = new GenericSyntaxValidator();
				});

				it("valid string -> RegEx validation succeeded and returned validated value", function() {
					//validateValue_withRegEx_StringValidValues_validatedString
					// arrange + act + assert
						testRegExValidation("String","length=30;", aValidStrings, sRegExp, false, true);
				});

				it("invalid string -> with RegEx validation failed and threw validation exception", function() {
					//validateValue_withRegEx_StringInvalidValues_throwPlcException
					// arrange + act + assert
						testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, true, true);
				});

				it("invalid characters -> without RegEx validation will return validated value", function() {
					//validateValue_withoutRegex_StringInvalidValues_validatedString
					// arrange + act + assert
						testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, false, false);
				});
			});

			describe('regular expression for link', function() {

				const aValidLinks = [
										"htTp://xn--nw2a.xn--j6w193g/", "Https://www.google.com/Search?q=regex+url+sql+injection+prevention",
										"https://Html.com/anchors-links/#menu-main", "ftp://localhost:12", "sftp://localhost",
										"http://192.168.1.1:12345/my-custom-http-port/test/loung/url/?has_parameter=true&number>100#anchor",
										"http://www.tüv-süd.de", "http://8mile.com/", ""
									];
				
				const aInvalidLinks = [
										"test", "test application", "https://test space", "mailto:test@test.com", "  ***", "test@test.com",
										"\\\dwdf207\\PTU_Industry\\07_Projects\\2012\\2012_Product_Costing\\Test.ppt", "/path/to/page", "//website.com/path/to/page" 									
			                          ];
				const sRegExp = getRegexString("LINK");
			
				beforeEach(function() {
					genericSyntaxValidator = new GenericSyntaxValidator();
				});

				it("valid link -> RegEx validation succeeded and returned validated value", function() {
					//validateValue_withRegEx_StringValidValues_validatedString
					// arrange + act + assert
					testRegExValidation("Link","length=5000;", aValidLinks, sRegExp, false, true);
				});
                
				it("invalid link -> with RegEx validation failed and threw validation exception", function() {
					//validateValue_withRegEx_StringInvalidValues_throwPlcException
					// arrange + act + assert
					testRegExValidation("Link","length=5000;", aInvalidLinks, sRegExp, true, true);
				});

				it("invalid characters -> without RegEx validation will return validated value", function() {
					//validateValue_withoutRegex_StringInvalidValues_validatedString
					// arrange + act + assert
					testRegExValidation("Link","length=5000;", aInvalidLinks, sRegExp, false, false);
				});
			});

		
			describe('regular expression for item', function() {
				const aValidItemStrings = aValidStrings.concat([
			                     // empty string
			                     ""
									]);
				const aInvalidCharacters = [
										"!", "\"", "£", "$", "%", "^", "&", "*", "=", "[", "]", "{", "}", ";", "'", "@", "~", "<", ">", "?", "\\",
			                          ",", "¬", "÷", "♥", " "
			                          ];
				const sRegExp = getRegexString("ITEM");
			
			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("valid string -> RegEx validation succeeded and returned validated value", function() {
				//validateValue_withRegEx_StringValidValues_validatedString
				// arrange + act + assert
					testRegExValidation("String","length=30;", aValidItemStrings, sRegExp, false, true);
			});

			it("invalid string -> with RegEx validation failed and threw validation exception", function() {
				//validateValue_withRegEx_StringInvalidValues_throwPlcException
				// arrange + act + assert
					testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, true, true);
			});

			it("invalid characters -> without RegEx validation will return validated value", function() {
				//validateValue_withoutRegex_StringInvalidValues_validatedString
				// arrange + act + assert
					testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, false, false);
			});
		});
		
			describe('regular expression for wildcard', function() {
				const aValidWildcardStrings = aValidStrings.concat([
			                    // empty string
			                     "",
			                     // star
			                     "*"
									]);
				const aInvalidCharacters = [
										"!", "\"", "£", "$", "%", "^", "&", "=", "[", "]", "{", "}", ";", "'", "@", "~", "<", ">", "?", "\\",
			                          ",", "¬", "÷", "♥", " ", "**"
			                          ];
				const sRegExp = getRegexString("WILDCARD");
			
			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("valid string -> RegEx validation succeeded and returned validated value", function() {
				//validateValue_withRegEx_StringValidValues_validatedString
				// arrange + act + assert
					testRegExValidation("String","length=30;", aValidWildcardStrings, sRegExp, false, true);
			});

			it("invalid string -> with RegEx validation failed and threw validation exception", function() {
				//validateValue_withRegEx_StringInvalidValues_throwPlcException
				// arrange + act + assert
					testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, true, true);
			});

			it("invalid characters -> without RegEx validation will return validated value", function() {
				//validateValue_withoutRegex_StringInvalidValues_validatedString
				// arrange + act + assert
					testRegExValidation("String","length=30;", aInvalidCharacters, sRegExp, false, false);
				});
			});
		});

		describe('boolean tests', function() {
			var aValidValues = [true, false];

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("validateValue_booleanValidValuesAsBoolean_validatedBoolean", function() {
				_.each(aValidValues, function(bTestValue, iIndex) {
					// arrange
					var sDataType = "Boolean";

					// act
					var bReturnValue = genericSyntaxValidator.validateValue(bTestValue, sDataType, undefined, true);

					// assert
					expect(bReturnValue).toBe(bTestValue);
				});
			});
			
			it("validateValue_booleanValidValuesAsBoolean_validatedBoolean when using caching maps", function() {
			    let i = 3;
			    while(i > 0) {
			        _.each(aValidValues, function(bTestValue, iIndex) {
    					// arrange
    					var sDataType = "Boolean";
    
    					// act
    					var bReturnValue = genericSyntaxValidator.validateValue(bTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(bReturnValue).toBe(bTestValue);
    				});
			        i--;
			    }
			});

			it("validateValue_booleanValidValuesAsString_validatedBoolean", function() {
				_.each(aValidValues, function(bTestValue, iIndex) {
					// arrange
					var sValue = bTestValue.toString();
					var sDataType = "Boolean";

					// act
					var bReturnValue = genericSyntaxValidator.validateValue(sValue, sDataType, undefined, true);

					// assert
					expect(bReturnValue).toBe(bTestValue);
				});
			});

			it("validateValue_booleanInvalidValues_throwPlcException", function() {
				// arrange
				var aInvalidValues = ["truee", "falsee", "FALSE", "TRUE", "True", "False", "", " ", "1234", "asd"];
				var sDataType = "Boolean";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		describe('booleanInt tests', function() {
			var aValidValues = [0, 1];

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("validateValue_booleanIntValidValuesAsInteger_validatedInteger", function() {
				_.each(aValidValues, function(iTestValue, iIndex) {
					// arrange
					var sDataType = "BooleanInt";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iTestValue);
				});
			});
            
            it("validateValue_booleanIntValidValuesAsInteger_validatedInteger when using caching maps", function() {
                let i = 3;
                while(i > 0) {
                    _.each(aValidValues, function(iTestValue, iIndex) {
    					// arrange
    					var sDataType = "BooleanInt";
    
    					// act
    					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(iReturnValue).toBe(iTestValue);
    				}); 
    				i--;
                }
			});
			
			it("validateValue_booleanIntValidValuesAsString_validatedInteger", function() {
				_.each(aValidValues, function(iTestValue, iIndex) {
					// arrange
					var sValue = iTestValue.toString();
					var sDataType = "BooleanInt";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(sValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iTestValue);
				});
			});

			it("validateValue_booleanIntInvalidValues_throwPlcException", function() {
				// arrange
				var aInvalidValues = [11, "00", -1, "-0", 1234, "01", 2, 3, "true", "false", "'0", "", " ", ];
				var sDataType = "BooleanInt";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);

			});
		});

		describe('integer tests', function() {		
			// map to hold valid test values as string and as integer value
			// conversion to string must be done manually since 9999999999999999999999999999 would be 
			// stringified to 1e+28 otherwise		
			var mValidValues = {
				"-123": -123,
				"1": 1,
				"3": 3,
				"123": 123,
				"2147483647": 2147483647,
				"-2147483647": -2147483647,
				// values with whitespace characters; those should be ignored if the value is handed in as string
				" -123" : -123,
				"123 " : 123,
				" 123 " : 123
			}

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("should return validated value if given value is integer", function() {
				_.each(mValidValues, function(iTestValue, sTestValue) {
					// arrange
					var sDataType = "Integer";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iTestValue);
				});
			});
			
			it("should return validated value if given value is integer when using caching maps", function() {
			    let i = 3;
			    while(i > 0) {
    				_.each(mValidValues, function(iTestValue, sTestValue) {
    					// arrange
    					var sDataType = "Integer";
    
    					// act
    					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(iReturnValue).toBe(iTestValue);
    				});			        
			        i--;
			    }
			});

			it("should return validated value if given value is string containing an integer", function() {
				_.each(mValidValues, function(iExpectedValue, sTestValue) {
					// arrange
					var sDataType = "Integer";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(sTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iExpectedValue);
				});
			});

			it("should throw PlcException if value is not an integer", function() {
				// arrange
				var aInvalidValues = [".0", 123.23, -123.32, "0xFF", "123a", "a21313", "123.2a", "12a.21", NaN];
				var sDataType = "Integer";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
			
			it("should throw PlcException if value is greater than max Integer supported by SQL 2147483647(numeric overflow)", function() {
				// arrange
				var aInvalidValues = [2147483648, 214748364799, 9999999999999, 9007199254740992];
				var sDataType = "Integer";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		describe('positive integer tests', function() {
			// map to hold valid test values as string and as integer value
			// conversion to string must be done manually since 9999999999999999999999999999 would be 
			// stringified to 1e+28 otherwise		
			var mValidValues = {
				"1": 1,
				"3": 3,
				"123": 123,
				"2147483647": 2147483647,
				// values with whitespace characters; those should be ignored if the value is handed in as string
				" 123" : 123,
				"123 " : 123,
				" 123 " : 123
			}
			
			
			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("should return validated value if given value is a positive integer", function() {
				_.each(mValidValues, function(iTestValue, sTestValue) {
					// arrange
					var sDataType = "PositiveInteger";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iTestValue);
				});
			});
			
			it("should return validated value if given value is a positive integer when using caching maps", function() {
				let i = 3;
			    while(i > 0) {
    				_.each(mValidValues, function(iTestValue, sTestValue) {
    					// arrange
    					var sDataType = "PositiveInteger";
    
    					// act
    					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(iReturnValue).toBe(iTestValue);
    				});
			        i--;       
			    }
			});

			it("should return validated value if given value is string containing a positive integer", function() {
				_.each(mValidValues, function(iExpectedValue, sTestValue) {
					// arrange
					var sDataType = "PositiveInteger";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(sTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iExpectedValue);
				});
			});

			it("should throw PlcException if value is not a positve integer", function() {
				// arrange
				var aInvalidValues = [".0", -1, "-0", -1234, 123.23, -123.32, "0xFF", "123a", "a21313", "123.2a", "12a.21"];
				var sDataType = "PositiveInteger";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
			
		    it("should throw PlcException if value is greater than max Integer supported by SQL 2147483647(numeric overflow)", function() {
				// arrange
				var aInvalidValues = [2147483648, 214748364799, 9999999999999, 9007199254740992];
				var sDataType = "Integer";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		describe('negative integer tests', function() {
			// map to hold valid test values as string and as integer value
			// conversion to string must be done manually since 9999999999999999999999999999 would be 
			// stringified to 1e+28 otherwise		
			var mValidValues = {
				"-1": -1,
				"-3": -3,
				"-123": -123,
				"-2147483647": -2147483647,
				// values with whitespace characters; those should be ignored if the value is handed in as string
				" -123" : -123,
				"-123 " : -123,
				" -123 " : -123
			}
			
			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("should return validated value if given value is a negative integer", function() {
				_.each(mValidValues, function(iTestValue, sTestValue) {
					// arrange
					var sDataType = "NegativeInteger";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iTestValue);
				});
			});
            
            it("should return validated value if given value is a negative integer when using caching maps", function() {
                let i = 3;
                while(i > 0) {
                    _.each(mValidValues, function(iTestValue, sTestValue) {
    					// arrange
    					var sDataType = "NegativeInteger";
    
    					// act
    					var iReturnValue = genericSyntaxValidator.validateValue(iTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(iReturnValue).toBe(iTestValue);
    				});
                    i--;
                }
			});
			
			it("should return validated value if given value is string containing a negative integer", function() {
				_.each(mValidValues, function(iExpectedValue, sTestValue) {
					// arrange
					var sDataType = "NegativeInteger";

					// act
					var iReturnValue = genericSyntaxValidator.validateValue(sTestValue, sDataType, undefined, true);

					// assert
					expect(iReturnValue).toBe(iExpectedValue);
				});
			});

			it("validateValue_negativeIntegerInvalidValues_throwPlcException", function() {
				// arrange
				var aInvalidValues = [".0", 0, 1, "-0", 123.23, "0xFF", "123a", "a21313", "123.2a", "12a.21"];
				var sDataType = "NegativeInteger";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
			
			it("should throw PlcException if value is smaller than min Integer supported by SQL 2147483647(numeric overflow)", function() {
				// arrange
				var aInvalidValues = [-2147483648, -214748364799, -9999999999999, -9007199254740992];
				var sDataType = "NegativeInteger";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		describe('utctimestamp tests', function() {
			var mValidDates = {
               // we had some difficulties in parsing .52Z => 520 milliseconds;
               // .052Z => 52 milliseconds!
              "2015-12-01T19:23:25.52Z": {
                              year: 2015,
                              month: 11,
                              date: 1,
                              hours: 19,
                              minutes: 23,
                              seconds: 25,
                              millis: 520
              },
              "2015-12-01T19:23:25.520Z": {
                              year: 2015,
                              month: 11,
                              date: 1,
                              hours: 19,
                              minutes: 23,
                              seconds: 25,
                              millis: 520
              },               
              "2015-12-01T19:23:25.052Z": {
                              year: 2015,
                              month: 11,
                              date: 1,
                              hours: 19,
                              minutes: 23,
                              seconds: 25,
                              millis: 52
              },
              //YYYY-MM-DDTHH:MM:ss.mZ
              "2009-03-24T16:24:32.1Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24,
                              seconds: 32,
                              millis: 100
              },
              //YYYY-MM-DDTHH:MM:ss.mmZ
              "2009-03-24T16:24:32.12Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24,
                              seconds: 32,
                              millis: 120
              },
              //YYYY-MM-DDTHH:MM:ss.mZ
              "2009-03-24T16:24:32.1Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24,
                              seconds: 32,
                              millis: 100
              },
              //YYYY-MM-DDTHH:MM:ss.mmmZ
              "2009-03-24T16:24:32.123Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24,
                              seconds: 32,
                              millis: 123
              },
              //YYYY-MM-DDTHH:MM:ss.mmmZ
              "2009-03-24T16:24Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24
              },
               //YYYY-MM-DDTHH:MM:ssZ
               "2009-03-24T16:24:32Z": {
                              year: 2009,
                              month: 2,
                              date: 24,
                              hours: 16,
                              minutes: 24,
                              seconds: 32
               }
};

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("validateValue_utcTimestampValidValues_correctDateReturned", function() {
				_.each(mValidDates, function(oCorrectDate, sDateString) {
					// arrange
					jasmine.log(`Validating ${sDateString}`);
					var sDataType = "UTCTimestamp";

					// act
					var oReturnDate = genericSyntaxValidator.validateValue(sDateString, sDataType, undefined, true);

					expect(oCorrectDate.year).toEqual(oReturnDate.getUTCFullYear());
					expect(oCorrectDate.month).toEqual(oReturnDate.getUTCMonth());
					expect(oCorrectDate.date).toEqual(oReturnDate.getUTCDate());
					if(!helpers.isNullOrUndefined(oCorrectDate.hours)){
					    expect(oCorrectDate.hours).toEqual(oReturnDate.getUTCHours());
					}
					if(!helpers.isNullOrUndefined(oCorrectDate.minutes)){
					    expect(oCorrectDate.minutes).toEqual(oReturnDate.getUTCMinutes());
					}
					if(!helpers.isNullOrUndefined(oCorrectDate.seconds)){
					    expect(oCorrectDate.seconds).toEqual(oReturnDate.getUTCSeconds());
					}
					if(!helpers.isNullOrUndefined(oCorrectDate.millis)){
					    expect(oCorrectDate.millis).toEqual(oReturnDate.getUTCMilliseconds());
					}
				});

			});
			
			it("validateValue_utcTimestampValidValues_correctDateReturned when using caching maps", function() {
			    let i = 5;
			    while(i > 0) {
			        _.each(mValidDates, function(oCorrectDate, sDateString) {
    					// arrange
    					jasmine.log(`Validating ${sDateString}`);
    					var sDataType = "UTCTimestamp";
    
    					// act
    					var oReturnDate = genericSyntaxValidator.validateValue(sDateString, sDataType, undefined, true);
    
    					expect(oCorrectDate.year).toEqual(oReturnDate.getUTCFullYear());
    					expect(oCorrectDate.month).toEqual(oReturnDate.getUTCMonth());
    					expect(oCorrectDate.date).toEqual(oReturnDate.getUTCDate());
    					if(!helpers.isNullOrUndefined(oCorrectDate.hours)){
    					    expect(oCorrectDate.hours).toEqual(oReturnDate.getUTCHours());
    					}
    					if(!helpers.isNullOrUndefined(oCorrectDate.minutes)){
    					    expect(oCorrectDate.minutes).toEqual(oReturnDate.getUTCMinutes());
    					}
    					if(!helpers.isNullOrUndefined(oCorrectDate.seconds)){
    					    expect(oCorrectDate.seconds).toEqual(oReturnDate.getUTCSeconds());
    					}
    					if(!helpers.isNullOrUndefined(oCorrectDate.millis)){
    					    expect(oCorrectDate.millis).toEqual(oReturnDate.getUTCMilliseconds());
    					}
    				});
			        i--;
			    }
			});

			it("validateValue_utcTimestampInvalidValues_throwPlcException", function() {
				// arrange
				var aInvalidValues = ["2015-02-29T19:23:25Z","2016-02-30T19:23:25Z","200903", "2009-03-2416:24:32:10", "2013-08-08 01:00", "2013-31-31T12:32:22.023Z",
                                      
                                      // 29th feb in no leapyear
                                      "2014-31-31T19:23:25Z", // overflow
                                      "2015-02-15T19:39:11+00:00", "2015-02-15T19:39:11+04:00", "2015-02-15T19:39:11-00:00", "2015-02-15T19:39:11-04:00", // with
                                      // time
                                      // zones
                                      // (forbidden)
                                      
                                      // Hour 24 cannot have other values that 00 for minutes,seconds,miliseconds
                                      "2015-02-15T24:01:00",
                                      "2015-02-15T24:00:01",
                                      "2015-02-15T24:01:00Z",
                                      "2015-02-15T24:00:01Z",
                                      "2015-02-15T24:00:00.1Z",
                                      "2015-02-15T24:00:00.01Z",
                                      "2015-02-15T24:00:00.001Z",
                                      
                                      // Lower case T and Z seem to make the parser throw an error
                                      "2009-03-24T16:24:32.1z",
                                      "2009-03-24T16:24:32.12z",
                                      "2009-03-24T16:24:32.123z",
                                      "2009-03-24t16:24:32.1z",
                                      "2009-03-24t16:24:32.12z",
                                      "2009-03-24t16:24:32.123z",
                                      
                                      // Must provide Z so that all dates ar UTC and not localdates
                                      "2009-03-24t16:24:32.1",
                                      "2009-03-24t16:24:32.12",
                                      "2009-03-24t16:24:32.123",
                                      "2009-03-24T16:24:32.1",
                                      "2009-03-24T16:24:32.12",
                                      "2009-03-24T16:24:32.123",
                                      "2009-03-24",
                                      "2016-02-29",
                                      "2009-03-24T16",
                                      "2009-03-24T16:24",
                                      "2009-03-24T16:24:32",
                                      
                                      // D time zone (delta time zone?) should fail? or not? 
                                      "2009-03-24T16:24:32.123D",
                                      
                                      // "." in regex match any character - make sure it;s escaped and matches exactly "." character
                                      "2009-03-24T16:24:32a1Z",
                                      "2009-03-24T16:24:32312Z",
                                      "2009-03-24T16:24:32#123Z"
                                      ];

				var sDataType = "UTCTimestamp";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		describe('localdate tests', function() {
			var aValidValues = ["2016-02-29", "2013-01-01", "2016-02-29", // leapyear
			                    "2011-02-27T00:00:00Z", "2011-02-27T00:00:00",
			                    "2014-02-14T00:00:00.000Z", "2014-02-14T00:00:00.000"];

			beforeEach(function() {
				genericSyntaxValidator = new GenericSyntaxValidator();
			});

			it("validateValue_localDateValidValuesAsString_validatedLocalDate", function() {
				_.each(aValidValues, function(sTestValue, iIndex) {

					jasmine.log(`Validating ${sTestValue}`);
					// arrange
					var sDataType = "LocalDate";
					var oInputDate = new Date(Date.parse(sTestValue));

					// act
					var oReturnDate = genericSyntaxValidator.validateValue(sTestValue, sDataType, undefined, true);

					// assert
					expect(oInputDate.getDate()).toBe(oReturnDate.getDate());
					expect(oInputDate.getMonth()).toBe(oReturnDate.getMonth());
					expect(oInputDate.getFullYear()).toBe(oReturnDate.getFullYear());

				});
			});
			
			it("validateValue_localDateValidValuesAsString_validatedLocalDate when using caching maps", function() {
			    let i = 5;
			    while(i > 0) {
    				_.each(aValidValues, function(sTestValue, iIndex) {
    
    					jasmine.log(`Validating ${sTestValue}`);
    					// arrange
    					var sDataType = "LocalDate";
    					var oInputDate = new Date(Date.parse(sTestValue));
    
    					// act
    					var oReturnDate = genericSyntaxValidator.validateValue(sTestValue, sDataType, undefined, true);
    
    					// assert
    					expect(oInputDate.getDate()).toBe(oReturnDate.getDate());
    					expect(oInputDate.getMonth()).toBe(oReturnDate.getMonth());
    					expect(oInputDate.getFullYear()).toBe(oReturnDate.getFullYear());
    
    				});			        
			        i--;
			    }
			});

			it("validateValue_localDateInvalidValues_throwPlcException", function() {
				// arrange
				var aInvalidValues = ["2014-31-32", "200903", "2009-03-2416:24:32:10", "2015-02-29T19:23:25Z", // 29th
				                      // feb
				                      // in no
				                      // leapyear
				                      "2014-31-31T19:23:25Z" , "2011-02-31T00:00:00.123Z" // overflow
				                      ];
				var sDataType = "LocalDate";

				// act + assert
				testInvalidValuesForDataType(aInvalidValues, sDataType, null, genericSyntaxValidator);
			});
		});

		function testInvalidValuesForDataType(aInvalidValues, sDataType, sTypeAttributes, oGenericSyntaxValidator) {
			var exception;
			_.each(aInvalidValues, function(invalidValue, iIndex) {
				jasmine.log(`Validating ${invalidValue}`);
				// arrange
				exception = null;

				try {
					// act
					oGenericSyntaxValidator.validateValue(invalidValue, sDataType, sTypeAttributes, true);
				} catch (e) {
					exception = e;
				}
				// assert
				expect(exception instanceof PlcException).toBe(true);
			});
		}
		
		function testRegExValidation(sType, sTypeDetail, mStrings, sRegExp, bHasException, bHasRegEx) {
		    // arrange
			_.each(mStrings, function(sTestString) {
				var exception;
				var sReturnValue;
				// act
				try {
				    if (bHasRegEx){
				        sReturnValue = genericSyntaxValidator.validateValue(sTestString, sType, sTypeDetail, true, sRegExp);
				    }
				    else {
				        sReturnValue = genericSyntaxValidator.validateValue(sTestString, sType, sTypeDetail, true, undefined);
				    }
				} catch (e) {
					exception = e;
				}
				// assert
				if (bHasException){
				    expect(exception instanceof PlcException).toBe(true);
				}
				else {
				    expect(exception).toBe(undefined);
				    expect(sReturnValue).toBe(sTestString);
				}
			});
		}

	}).addTags(["All_Unit_Tests"]);
}