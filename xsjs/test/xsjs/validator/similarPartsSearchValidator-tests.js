const _ = require("lodash");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
const MessageLibrary = require("../../../lib/xs/util/message");
const similarPartsSearchValidatorLibrary = $.import("xs.validator", "similarPartsSearchValidator");
const SimilarPartsSearchValidator = similarPartsSearchValidatorLibrary.SimilarPartsSearchValidator;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;

const oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;

const PersistencySimilarParts = require("../../../lib/xs/db/persistency-similarPartsSearch");
const SupportedSqlTypes = PersistencySimilarParts.SupportedSqlTypes;

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.validator.similarPartsSearchValidator-tests', function() {

		let oSimilarPartsSearchValidator;
		let oMetadataProviderMock = null;
		let oPersistencyMock = null;
		let BusinessObjectValidatorUtilsMock = null;
		let oMockstar = null;

		beforeOnce(function() {
			oMockstar = new MockstarFacade({
				substituteTables: {
					item: "sap.plc.db::basis.t_item"
				}
			});
		});

		afterOnce(function() {
			oMockstar.cleanup();
		});

		beforeEach(function() {
			jasmine.dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL OFF");
			oMockstar.clearAllTables();
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', ['get']);
			oMetadataProviderMock.get.and.returnValue([{
				"COLUMN_ID": 'ITEM_DESCRIPTION'
			}, {
				"COLUMN_ID": 'MATERIAL_ID'
			}, {
				"COLUMN_ID": 'CONSTRUCTION_VARIENT'
			}, {
				"COLUMN_ID": 'MODEL'
			}, {
				"COLUMN_ID": 'MODEL_SERIES'
			}, {
				"COLUMN_ID": 'HAND'
			}, {
				"COLUMN_ID": "PRICE"
			}, {
				"COLUMN_ID": "CREATED_ON"
			}, {
				"COLUMN_ID": "TYPE_NAME"
			}]);

			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(jasmine.dbConnection);

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.SimilarPartsSearch);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity", "checkMandatoryProperties");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				let oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oSimilarPartsSearchValidator = new SimilarPartsSearchValidator(oPersistencyMock, oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
		});


		let params = [];
		params.get = function() {
			return undefined;
		};

		function createRequest(oBody, oHTTPMethod) {
			let oRequest = {
				queryPath: "similar-parts-search",
				method: oHTTPMethod,
				body: {
					asString: function() {
						return JSON.stringify(oBody);
					}
				},
				parameters: params
			};
			return oRequest;
		}

		function validateAndCheckErrorCodes(aValues, aCodes) {
			aValues.forEach(function(oValue, iIndex) {
				validateAndCheckErrorCode(oValue, aCodes[iIndex]);
			});
		}

		function validateAndCheckErrorCode(oValue, oCode) {
			let exception;
			let oRequestBody = createRequest(oValue, $.net.http.POST);

			//act
			try {
				oSimilarPartsSearchValidator.validate(oRequestBody);
			} catch (e) {
				exception = e;
			}

			// assert
			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oCode);
		}

		describe('validate Attributes', function() {

			it('should throw exception if mandatory field CALCULATION_VERSION_ID not defined for batch search', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}, {
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should return validated results if CALCULATION_VERSION_ID is defined for batch search ', function() {
				const oRequest1 = [{
					"CALCULATION_VERSION_ID": 1005,
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": [1]
						}
					}
				}, {
					"CALCULATION_VERSION_ID": 2005,
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ProjectIds": ['1', '2', '3'],
							"CalculationIds": [11, 12, 13],
							"CalculationVersionIds": [1001, 1002, 1003],
							"ExcludeCalculationVersionIds": [1001]
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(2);
			});

			it('should return validated results if both mandatory Attributes and Source are defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": [1]
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should throw exception if mandatory field Attributes not defined', function() {
				const oRequest1 = [{
					"Source": {}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should throw exception if Attributes field is not array, or is empty array, or array has empty object, ', function() {
				const oRequest1 = [{
					"Attributes": "wqw",
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if mandatory Attributes field "Name" or "Value" undefined', function() {
				const oRequest1 = [{
					"Attributes": [{}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Value": "C 205.308-2",
						"Weight": 1
					}],
					"Source": {}
				}];
				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Weight": 1
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if mandatory Attributes field "IsFuzzySearch" undefined, or is not BooleanInt', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 1
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 7
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if mandatory Attributes field "Weight" undefined, or is invalid Weight', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"IsFuzzySearch": 0
					}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "MATERIAL_ID",
						"Value": "C 205.308-2",
						"Weight": 2,
						"IsFuzzySearch": 0
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should return validated results if unique Attributes Names are defined in Attributes and Groups, or valid pattern is defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "MATERIAL_ID",
						"Value": "EIN-KOMPONENTEN-STRUKTURKLEBSTOFF DBL790",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}, {
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1}) ([0-9]{3}).([0-9]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["C"],
									"Value": "C"
								}]
							}, {
								"Index": 2,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["205"],
									"Value": "205"
								}]
							}, {
								"Index": 3,
								"Name": "CONSTRUCTION_VARIENT",
								"Weight": 0.707529627390014,
								"Dict": [{
									"Key": [
										"3"
									],
									"Value": "Coupé"
								}]
							}]
						}
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": [1006]
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should throw exception if Attribute Name is duplicated', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1}) ([0-9]{3})",
							"Groups": [{
								"Index": 1,
								"Name": "HAND",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1", "2", "3"],
									"Value": "left-handed"
								}]
							}, {
								"Index": 2,
								"Name": "HAND",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1", "2", "3"],
									"Value": "right-handed"
								}]
							}]
						}
					}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "MATERIAL_ID",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1}) ([0-9]{3})",
							"Groups": [{
								"Index": 1,
								"Name": "HAND",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1", "2", "3"],
									"Value": "left-handed"
								}]
							}, {
								"Index": 2,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1", "2", "3"],
									"Value": "right-handed"
								}]
							}]
						}
					}, {
						"Name": "MATERIAL_ID",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw error if the Attribute Name not existing in data base', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "MATERIAL_ID",
						"Value": "EIN-KOMPONENTEN-STRUKTURKLEBSTOFF DBL790",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}, {
						"Name": "test",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1}) ([0-9]{3}).([0-9]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["C"],
									"Value": "C"
								}]
							}, {
								"Index": 2,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["205"],
									"Value": "205"
								}]
							}, {
								"Index": 3,
								"Name": "CONSTRUCTION_VARIENT",
								"Weight": 0.707529627390014,
								"Dict": [{
									"Key": [
										"3"
									],
									"Value": "Coupé"
								}]
							}]
						}
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": [1006]
						}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});
		});

		describe('validate Supported SQL Types', function() {
			// Testing for supportability for string, numeric, boolean, date columns
			function runValidateSupportedSQLTypesTest(dataType) {
				it(`support data type ${dataType} in similar parts request`, function() {
					oMockstar.execSingle(`ALTER TABLE {{item}} ADD (TYPE_NAME ${dataType})`);
					const oRqeust = [{
						"Attributes": [{
							"Name": "TYPE_NAME",
							"Value": "C 205.308-2",
							"Weight": 1,
							"IsFuzzySearch": 1
						}],
						"Source": {
							"CalculationVersions": {}
						}
					}];
					let oRequestBody = createRequest(oRqeust, $.net.http.POST);
					let result = oSimilarPartsSearchValidator.validate(oRequestBody);
					expect(result.length).toBe(1);
					expect(result[0].Attributes[0].PropertyMap[0].DataType).toBe(`${dataType}`);
				});
			}

			_.values(_.omit(SupportedSqlTypes, "FixedDecimal", "Text")).join(",").split(",").map(function(dateType) {
				runValidateSupportedSQLTypesTest(dateType);
			});

			// Testing for supportability for text columns
			function runValidateSupportedTextTypesTest(dataType) {
				it(`support data type ${dataType} in similar parts request`, function() {
					let sDataType = dataType === "SHORTTEXT" ? "SHORTTEXT(200)" : dataType;
					oMockstar.execSingle(`ALTER TABLE {{item}} ADD (TYPE_NAME ${sDataType})`);
					const oRqeust = [{
						"Attributes": [{
							"Name": "TYPE_NAME",
							"Value": "C 205.308-2",
							"Weight": 1,
							"IsFuzzySearch": 1
						}],
						"Source": {
							"CalculationVersions": {}
						}
					}];
					let oRequestBody = createRequest(oRqeust, $.net.http.POST);
					let result = oSimilarPartsSearchValidator.validate(oRequestBody);
					expect(result.length).toBe(1);
					expect(result[0].Attributes[0].PropertyMap[0].DataType).toBe(`${dataType}`);
				});
			}
			SupportedSqlTypes.Text.map(dataType => runValidateSupportedTextTypesTest(dataType));

			it(`support data type DECIMAL(<precision>, <scale>) in similar parts request`, function() {
				oMockstar.execSingle(`ALTER TABLE {{item}} ADD (TYPE_NAME DECIMAL(28, 5) DEFAULT 12.19)`);
				const oRqeust = [{
					"Attributes": [{
						"Name": "TYPE_NAME",
						"Value": 12.19,
						"Weight": 1,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				let oRequestBody = createRequest(oRqeust, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
				expect(result[0].Attributes[0].PropertyMap[0].DataType).toBe('FixedDecimal');
			});

			it(`should return two data sources for MATERIAL_ID in similar parts request after validating`, function() {
				const oRqeust = [{
					"Attributes": [{
						"Name": "MATERIAL_ID",
						"Value": '#MATERIAL',
						"Weight": 1,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				let oRequestBody = createRequest(oRqeust, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
				expect(result[0].Attributes[0].PropertyMap).toMatchData({
					"SourceType":	["calculationversions", "masterdata"],
					"DataType": 	["NVARCHAR", "NVARCHAR"]
				}, ['SourceType']);
				// column MATERIAL_ID should come from below tables
				expect(_.difference(result[0].Attributes[0].TableSource, Array.of(
					PersistencySimilarParts.Tables.item,
					PersistencySimilarParts.Tables.material, PersistencySimilarParts.Tables.material__text, PersistencySimilarParts.Tables.material_ext,
					PersistencySimilarParts.Tables.material_price, PersistencySimilarParts.Tables.material_price_ext
				)).length).toBe(0);
			});

			function runValidateUnsupportedSQLTypesTest(dataType) {
				it(`should throw exception because doesn't support data type ${dataType} in similar parts request`, function() {
					oMockstar.execSingle(`ALTER TABLE {{item}} ADD (TYPE_NAME ${dataType})`);
					const oRqeust = [{
						"Attributes": [{
							"Name": "TYPE_NAME",
							"Value": "test",
							"Weight": 1,
							"IsFuzzySearch": 1
						}],
						"Source": {
							"CalculationVersions": {}
						}
					}];
					let oRequestBody = createRequest(oRqeust, $.net.http.POST);
					let exception;
					try {
						oSimilarPartsSearchValidator.validate(oRequestBody);
					} catch(e) {
						exception = e;
					}
					expect(exception).toBeDefined();
					expect(exception.developerMessage).toBe(`Similar parts search doesn't support ${dataType} on column name TYPE_NAME.`);
				});
			}
			[
				"ST_GEOMETRY",
				"ST_POINT",
				"ALPHANUM",
				"CLOB",
				"BLOB",
				"NCLOB"
			].map(function(dateType) {
				runValidateUnsupportedSQLTypesTest(dateType);
			});
		});

		describe('validate Pattern', function() {
			it('should throw exception if Pattern is undefined when IsFuzzySearch=0 ', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0
					}],
					"Source": {}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should throw exception if Pattern is not an object, or is empty object', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": []
					}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});


			it('should throw exception if Value of pattern is not string, or not valid substring_regexpr', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": 4,
							"Groups": {}
						}
					}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "yguiy(gygu",
							"Groups": []
						}
					}],
					"Source": {}
				}];
				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{2})",
							"Groups": []
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if number of matched Pattern Value is smaller than Groups length', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.643533277886267,
								"Dict": [{
									"Key": [
										"C"
									],
									"Value": "C"
								}]
							}, {
								"Index": 2,
								"Name": "MODEL_SERIES",
								"Weight": 0.372509875752201,
								"Dict": [{
									"Key": [
										"205"
									],
									"Value": "205"
								}]
							}]
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should throw exception if Groups of pattern is not array, or is empty array', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": {}
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": []
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});
		});

		// "Option" parameter for fuzzy search on numeric columns
		describe('validate Option', () => {
			it("should throw exception if score function isn't one of linear, gaussian, logarithmic", () => {
				let oRequest = JSON.parse(`[{
					"Attributes": [{
						"Name": "PRICE",
						"Value": 30.02,
						"Weight": 1,
						"IsFuzzySearch": 1,
						"Option": {
							"scoreFunction": "test"
						}
					}],
					"Source": {}
				}]`);
				validateAndCheckErrorCode(oRequest, oExpectedErrorCode);
			});

			function runValidateOptionTest(scoreFunction, searchOptionKey, searchOptionValue, valueDescription) {
				it(`should throw exception if ${searchOptionKey} ${valueDescription} for ${scoreFunction} score function`, () => {
					let oRequest = JSON.parse(`[{
						"Attributes": [{
							"Name": "PRICE",
							"Value": 30.02,
							"Weight": 1,
							"IsFuzzySearch": 1,
							"Option": {
								"scoreFunction": "${scoreFunction}",
								"${searchOptionKey}": ${searchOptionValue}
							}
						}],
						"Source": {}
					}]`);
					validateAndCheckErrorCode(oRequest, oExpectedErrorCode);
				});
			}

			//------------------- scoreFunction  searchOptionKey        searchOptionValue  valueDescription
			runValidateOptionTest("linear",      "scoreFunctionScale",  -2,                "< 0");
			runValidateOptionTest("linear",      "scoreFunctionScale",   0,                "= 0");
			runValidateOptionTest("gaussian",    "scoreFunctionScale",  -1,                "< 0");
			runValidateOptionTest("gaussian",    "scoreFunctionScale",   0,                "= 0");
			runValidateOptionTest("linear",      "scoreFunctionDecay",  -1,                "< 0");
			runValidateOptionTest("linear",      "scoreFunctionDecay",   1,                "= 1");
			runValidateOptionTest("linear",      "scoreFunctionDecay",   2,                "> 1");
			runValidateOptionTest("gaussian",    "scoreFunctionDecay",  -1,                "< 0");
			runValidateOptionTest("gaussian",    "scoreFunctionDecay",   0,                "= 0");
			runValidateOptionTest("gaussian",    "scoreFunctionDecay",   1,                "= 1");
			runValidateOptionTest("gaussian",    "scoreFunctionDecay",   2,                "> 1");
			runValidateOptionTest("logarithmic", "scoreFunctionBase",    1,                "= 1");
			runValidateOptionTest("logarithmic", "scoreFunctionBase",    0,                "< 1");
			runValidateOptionTest("linear",      "scoreFunctionOffset", -1,                "< 0");
			runValidateOptionTest("gaussian",    "scoreFunctionOffset", -1,                "< 0");
			runValidateOptionTest("logarithmic", "scoreFunctionOffset", -1,                "< 0");
		});

		// Default search options are based on input search value, need setup and validate
		describe("validate Option based on Input Value", () => {
			function runValidateDefaultOptionTest(searchOption, searchValue, caseDescription) {
				it(`should throw exception if ${caseDescription} for ${searchOption.scoreFunction} score function`, () => {
					let oRequest = JSON.parse(`[{
						"Attributes": [{
							"Name": "PRICE",
							"Value": ${searchValue},
							"Weight": 1,
							"IsFuzzySearch": 1,
							"Option": ${JSON.stringify(searchOption)}
						}],
						"Source": {"CalculationVersions": {}}
					}]`);
					validateAndCheckErrorCode(oRequest, oExpectedErrorCode);
				});
			}

			//------------------------ searchOption ------------- searchValue ---------- caseDescription
			runValidateDefaultOptionTest({scoreFunction: "linear"}, 0, "calculated scoreFunctionScale = 0 based on search value 0");
			runValidateDefaultOptionTest({scoreFunction: "linear"}, -1, "calculated scoreFunctionScale = -1 based on search value -1");
			runValidateDefaultOptionTest({scoreFunction: "gaussian"}, 0, "calculated scoreFunctionScale = 0 based on search value 0");
			runValidateDefaultOptionTest({scoreFunction: "gaussian"}, -1, "calculated scoreFunctionScale = -1 based on search value -1");
			runValidateDefaultOptionTest({scoreFunction: "logarithmic"}, 0, "calculated scoreFunctionBase = 1 based on search value 0");
			runValidateDefaultOptionTest({scoreFunction: "logarithmic"}, -0.5, "calculated scoreFunctionBase = 0.5 < 1 based on search value -0.5");
			runValidateDefaultOptionTest({scoreFunction: "logarithmic", scoreFunctionOffset: 0.5 }, -0.5, "calculated scoreFunctionBase = 0 < 1 based on search value -0.5");
			runValidateDefaultOptionTest({scoreFunction: "logarithmic", scoreFunctionOffset: 0.5 }, -0.4, "calculated scoreFunctionBase = 0.1 < 1 based on search value -0.4");
			runValidateDefaultOptionTest({scoreFunction: "logarithmic", scoreFunctionOffset: 0.4 }, 0.3, "calculated scoreFunctionBase = 0.9 < 1 based on search value 0.3");
		});

		describe("validated Search Options", () => {
			// Cases for similar parts requests for search option validation
			function checkValidatedRequest(searchOption, searchValue, validSearchOption, caseDescription) {
				it(`${caseDescription}`, () => {
					let oRequest = JSON.parse(`[{
						"Attributes": [{
							"Name": "PRICE",
							"Value": ${searchValue},
							"Weight": 1,
							"IsFuzzySearch": 1,
							"Option": ${JSON.stringify(searchOption)}
						}],
						"Source": {"CalculationVersions": {}}
					}]`);
					let oRequestBody = createRequest(oRequest, $.net.http.POST);
					// act
					let oValidRequest = oSimilarPartsSearchValidator.validate(oRequestBody);
					// assert
					expect(oValidRequest[0].Attributes[0].Option).toEqualObject(validSearchOption);
				});
			}

			checkValidatedRequest({scoreFunction: "linear"}, 1.2,
								{scoreFunction: "linear", scoreFunctionOffset: 0, scoreFunctionDecay: 0.5, scoreFunctionScale: 1.2},
								"check default search option for input search value 1.2 for linear score function");
			checkValidatedRequest({scoreFunction: "linear", scoreFunctionOffset: 0.4}, 1.2,
								{scoreFunction: "linear", scoreFunctionOffset: 0.4, scoreFunctionDecay: 0.5, scoreFunctionScale: 1.2},
								"check default search option for input scoreFunctionOffset 0.4 and search value 1.2 for linear score function");
			checkValidatedRequest({scoreFunction: "gaussian"}, 0.8,
								{scoreFunction: "gaussian", scoreFunctionOffset: 0, scoreFunctionDecay: 0.5, scoreFunctionScale: 0.8},
								"check default search option for input search value 0.8 for gaussian score function");
			checkValidatedRequest({scoreFunction: "gaussian", scoreFunctionDecay: 0.8}, 0.8,
								{scoreFunction: "gaussian", scoreFunctionOffset: 0, scoreFunctionDecay: 0.8, scoreFunctionScale: 0.8},
								"check default search option for input scoreFunctionDecay 0.8 and search value 0.8 for gaussian score function");
			checkValidatedRequest({scoreFunction: "gaussian", scoreFunctionScale: 0.8}, -0.8,
								{scoreFunction: "gaussian", scoreFunctionOffset: 0, scoreFunctionDecay: 0.5, scoreFunctionScale: 0.8},
								"check default search option for input scoreFunctionScale 0.8 and search value -0.8 for gaussian score function");
			checkValidatedRequest({scoreFunction: "logarithmic"}, 0.2,
								{scoreFunction: "logarithmic", scoreFunctionOffset: 0, scoreFunctionBase: 1.2},
								"checked default search option for input and search value 0.2 for logarithmic score function");
			checkValidatedRequest({scoreFunction: "logarithmic", scoreFunctionOffset: 0.2}, 1.2,
								{scoreFunction: "logarithmic", scoreFunctionOffset: 0.2, scoreFunctionBase: 2.0},
								"checked default search option for input scoreFunctionOffset 0.4 and search value 1.2 for logarithmic score function");

			it("check default search option for DATE columns", () => {
				let dCreatedOn = new Date().toJSON();
				let oRequest = JSON.parse(`[{
					"Attributes": [{
						"Name": "CREATED_ON",
						"Value": "${dCreatedOn}",
						"Weight": 1,
						"IsFuzzySearch": 1
					}],
					"Source": {"CalculationVersions": {}}
				}]`);
				let oRequestBody = createRequest(oRequest, $.net.http.POST);
				// act
				let oValidRequest = oSimilarPartsSearchValidator.validate(oRequestBody);
				// assert
				expect(oValidRequest[0].Attributes[0].Option.scoreFunctionScale).toBe(365);
				expect(oValidRequest[0].Attributes[0].Option.scoreFunctionOffset).toBe(182);
			});


		});

		describe('validate Group', function() {
			it('should throw exception if Index of Group is undefined, or invalid, or index is larger than matched group number', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{

							}]
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": -4,
								"Name": "MODEL_SERIES",
								"Weight": 1,
								"Dict": []
							}]
						}
					}],
					"Source": {}
				}];

				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 2,
								"Name": "MODEL",
								"Weight": 0.643533277886267,
								"Dict": [{
									"Key": [
										"C"
									],
									"Value": "C"
								}]
							}]
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if Name of Group is undefined, or is invalid', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 0
							}]
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": 1,
								"Weight": 1,
								"Dict": []
							}]
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if Weight of Group is undefined, or is invalid', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES"
							}]
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 1.7,
								"Dict": []
							}]
						}
					}],
					"Source": {}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if Dict of Group is undefined, or is not array, or is empty array, or has empty object', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 1
							}]
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 1,
								"Dict": {}
							}]
						}
					}],
					"Source": {}
				}];
				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": []
							}]
						}
					}],
					"Source": {}
				}];

				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if Key of Dict is undefined, or is not array, or is empty array, or value in Key is not string', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{

								}]
							}]
						}
					}],
					"Source": {}
				}];

				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{
									"Key": "",
									"Value": "LEFT-HANDED"
								}]
							}]
						}
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL_SERIES",
								"Weight": 0.5,
								"Dict": [{
									"Key": [],
									"Value": "LEFT-HANDED"
								}]
							}]
						}
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				const oRequest4 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.5,
								"Dict": [{
									"Key": [1, 2, 3],
									"Value": "LEFT-HANDED"
								}]
							}]
						}
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3, oRequest4], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if Value of Dict is undefined, or is invalid', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1", "2"]
								}]
							}]
						}
					}],
					"Source": {}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 0,
						"Pattern": {
							"Value": "([a-zA-Z]{1})",
							"Groups": [{
								"Index": 1,
								"Name": "MODEL",
								"Weight": 0.5,
								"Dict": [{
									"Key": ["1"],
									"Value": 3
								}]
							}]
						}
					}],
					"Source": {
						"CalculationVersions": {}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});


		});

		describe('validate Source', function() {
			it('should return validated results if valid TimeRange is defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": [1]
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should throw exception  if the FromTime or ToTime is not a valid UTC time', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-13T0",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should throw exception if the FromTime is larger than ToTime', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-19T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should return validated results if valid CalculationVersions is defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ProjectIds": ['1', '2', '3'],
							"CalculationIds": [11, 12, 13],
							"CalculationVersionIds": [1001, 1002, 1003],
							"ExcludeCalculationVersionIds": [1001]
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should return validated results if valid MasterData is defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": {
							"MaterialTypes": ["#PT1", "#PT1"],
							"MaterialGroups": ['PT1', 'PT1']
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should throw exception if none of valid MasterData nor valid CalculationVersions is defined', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": ""
					}
				}];
				const oRequest3 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": ""
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2, oRequest3], [oExpectedErrorCode, oExpectedErrorCode, oExpectedErrorCode]);
			});
		});

		describe('validate MasterData', function() {
			it('should throw exception if MaterialTypes is not array, or value in array is not string', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": {
							"MaterialTypes": 0
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": {
							"MaterialTypes": [1, 2]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if MaterialGroups is not array, or value in array is not string', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": {
							"MaterialGroups": 0
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"MasterData": {
							"MaterialGroups": [1, 2]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});
		});

		describe('validate CalculationVersions', function() {
			it('should throw exception if OnlyCurrent is not BooleanInt', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 4
						}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should throw exception if CALCULATION_VERSION_ID not defined when OnlyCurrent = 1', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 1
						}
					}
				}];
				validateAndCheckErrorCode(oRequest1, oExpectedErrorCode);
			});

			it('should return validated results if CALCULATION_VERSION_ID is defined when OnlyCurrent = 1', function() {
				const oRequest1 = [{
					"CALCULATION_VERSION_ID": 10006,
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 1
						}
					}
				}];
				let oRequestBody = createRequest(oRequest1, $.net.http.POST);
				let result = oSimilarPartsSearchValidator.validate(oRequestBody);
				expect(result.length).toBe(1);
			});

			it('should throw exception if ProjectIds is not array, or value in array is not string', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ProjectIds": "2"
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ProjectIds": [1, 2, 3]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if CalculationIds is not array, or value in array is not integer', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"CalculationIds": 23
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"CalculationIds": ["1", "2", "3"]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if CalculationVersionIds is not array, or value in array is not integer', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"CalculationVersionIds": "dwe"
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"CalculationVersionIds": ["1", "2", "3"]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});

			it('should throw exception if ExcludeCalculationVersionIDs is not array, or value in array is not integer', function() {
				const oRequest1 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": "dwe"
						}
					}
				}];
				const oRequest2 = [{
					"Attributes": [{
						"Name": "ITEM_DESCRIPTION",
						"Value": "C 205.308-2",
						"Weight": 0.6,
						"IsFuzzySearch": 1
					}],
					"Source": {
						"TimeRange": {
							"FromTime": "2017-04-12T00:00:00.000Z",
							"ToTime": "2017-04-16T00:00:00.000Z"
						},
						"CalculationVersions": {
							"OnlyCurrent": 0,
							"ExcludeCalculationVersionIds": ["1", "2", "3"]
						}
					}
				}];
				validateAndCheckErrorCodes([oRequest1, oRequest2], [oExpectedErrorCode, oExpectedErrorCode]);
			});
		});
	}).addTags(["All_Unit_Tests"]);
}
