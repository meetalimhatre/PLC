var BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var MessageLibrary = require("../../../lib/xs/util/message");
const helpers = require("../../../lib/xs/util/helpers");

var layoutValidatorLibrary = $.import("xs.validator", "layoutValidator");
var LayoutValidator = layoutValidatorLibrary.LayoutValidator;

var oConnectionMock = null;
var BusinessObjectValidatorUtilsMock = null;
var oExpectedErrorCode = MessageLibrary.Code.GENERAL_VALIDATION_ERROR;
var oLayoutValidator;

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.validator.layoutValidator-tests', function () {
		var oPersistencyMock = null;

		beforeEach(function () {

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Layout);
			spyOn(BusinessObjectValidatorUtilsMock, "checkMandatoryProperties", "checkInvalidProperties");

			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();

			oConnectionMock = jasmine.createSpyObj('oConnectionMock', ['commit']);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

			var oMetadataMock = jasmine.createSpyObj('oMetadataMock', ['getMetadata']);
			oPersistencyMock.Metadata = oMetadataMock;

			oLayoutValidator = new LayoutValidator(oPersistencyMock, BusinessObjectValidatorUtilsMock);
		});


		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
				queryPath: "layout",
				method: oHTTPMethod,
				body: {
					asString: function () {
						return JSON.stringify(oBody);
					}
				}
			};
			return oRequest;
		}

		function setGetMetadataReturnValue(aReturnObjects) {
			var oReturnValue = helpers.deepFreeze(aReturnObjects);
			oPersistencyMock.Metadata.getMetadata.and.returnValue(oReturnValue);
		}

		it('should throw exception on POST if the request object contain hidden fields property and this is not an array', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": -1,
				"LAYOUT_NAME": "Test",
				"IS_CURRENT": 0,
				"HIDDEN_FIELDS": "test"
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);

		});

		it('should throw exception on POST if the request object contain layout columnns property and this is not an array', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": -1,
				"LAYOUT_NAME": "Test",
				"IS_CURRENT": 0,
				"LAYOUT_COLUMNS": {
					"test": "test"
				}
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);

		});

		it('should not throw exception on POST if the request object contain the same layout columnn twice', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CURRENT": 0,
				"LAYOUT_COLUMNS": [
					{
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "ITEM", //Uppercase, because the frontend sends it uppercase
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 3,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 100
					},
					{
						"DISPLAY_ORDER": 4,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 66
					}
				]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			setGetMetadataReturnValue([
				{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "QUANTITY"
				},
				{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "QUANTITY_UOM_ID"
				}
			]);

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeUndefined();
		});

		it('should not throw exception on POST if PATH contains dots', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1023,
				"IS_CURRENT": 0,
				"LAYOUT_COLUMNS": [
					{
						"DISPLAY_ORDER": 0,
						"PATH": "ITEM.ACCOUNT",
						"BUSINESS_OBJECT": "Account",
						"COLUMN_ID": "ACCOUNT_ID",
						"COLUMN_WIDTH": 100
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "ITEM.ACCOUNT",
						"BUSINESS_OBJECT": "Account",
						"COLUMN_ID": "ACCOUNT_ID",
						"COLUMN_WIDTH": 100
					}],
				"HIDDEN_FIELDS": []
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			setGetMetadataReturnValue([{
				"PATH": "Item.Account",
				"BUSINESS_OBJECT": "Account",
				"COLUMN_ID": "ACCOUNT_ID"
			}])

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeUndefined();
		});

		it('should throw exception on POST if it contains invalid field', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CURRENT": 0,
				"LAYOUT_COLUMNS": [
					{
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "NOT_EXISTENT",
						"BUSINESS_OBJECT": "SomeThingWrong",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 66
					}
				]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should throw exception on PUT if it contains invalid field', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CORPORATE": 0,
				"LAYOUT_COLUMNS": [{
					"DISPLAY_ORDER": 1,
					"COSTING_SHEET_ROW_ID": 2
				}, {
					"DISPLAY_ORDER": 3,
					"COST_COMPONENT_ID": 1
				},
				{
					"DISPLAY_ORDER": 2,
					"COST_COMPONENT_ID": 1
				}]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.PUT);

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should throw exception on PUT if first column contains BUSINESS_OBJECT and PATH', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CORPORATE": 0,
				"LAYOUT_COLUMNS": [{
					"DISPLAY_ORDER": 0,
					"PATH": "ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_WIDTH": 100
				}]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.PUT);

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should throw exception on POST if first column contains BUSINESS_OBJECT and PATH', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CORPORATE": 0,
				"LAYOUT_COLUMNS": [{
					"DISPLAY_ORDER": 0,
					"PATH": "ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_WIDTH": 100
				}]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should not throw exception on POST if only first column is send', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test",
				"IS_CORPORATE": 0,
				"LAYOUT_COLUMNS": [{
					"DISPLAY_ORDER": 0,
					"COLUMN_WIDTH": 100
				}]
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);
		});

		it('should not throw exception on POST if the request object contain the same layout columnn twice', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"IS_CURRENT": 0,
				"LAYOUT_COLUMNS": [
					{
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 100
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 100
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 66
					},
					{
						"DISPLAY_ORDER": 3,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 100
					},
					{
						"DISPLAY_ORDER": 4,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 66
					}],
				"HIDDEN_FIELDS": []
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.POST);
			var params = { is_corporate: false };


			setGetMetadataReturnValue([
				{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "QUANTITY"
				},
				{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "QUANTITY_UOM_ID"
				}
			]);

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody, params);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeUndefined();
		});

		it('should throw exception on DELETE if it contains other properties than id', function () {
			//arrange
			var oLayoutTestData1 = {
				"LAYOUT_ID": 1,
				"LAYOUT_NAME": "Test"
			};
			var exception;
			var oRequestBody = createRequest(oLayoutTestData1, $.net.http.DEL);

			//act
			try {
				var result = oLayoutValidator.validate(oRequestBody);
			} catch (e) {
				exception = e;
			}

			expect(exception).toBeDefined();
			expect(exception.code).toEqual(oExpectedErrorCode);

		});

		const validRequestTotalCost = {
			"LAYOUT_ID": 1024,
			"LAYOUT_NAME": "Test",
			"IS_CURRENT": 0,
			"LAYOUT_COLUMNS": [
				{
					"DISPLAY_ORDER": 1,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST",
					"COSTING_SHEET_ROW_ID": "TEST",
					"COLUMN_WIDTH": 100
				},
				{
					"DISPLAY_ORDER": 2,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST2",
					"COSTING_SHEET_ROW_ID": "TEST",
					"COLUMN_WIDTH": 100
				},
				{
					"DISPLAY_ORDER": 3,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST3",
					"COSTING_SHEET_ROW_ID": "TEST",
					"COLUMN_WIDTH": 100
				},
				{
					"DISPLAY_ORDER": 4,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST",
					"COST_COMPONENT_ID": "TEST",
					"COLUMN_WIDTH": 100
				},
				{
					"DISPLAY_ORDER": 5,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST2",
					"COST_COMPONENT_ID": "TEST",
					"COLUMN_WIDTH": 100
				},
				{
					"DISPLAY_ORDER": 6,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST3",
					"COST_COMPONENT_ID": "TEST",
					"COLUMN_WIDTH": 100
				}
			]
		}
		const invalidRequestTotalCostCostingSheet = {
			"LAYOUT_ID": 1024,
			"LAYOUT_NAME": "Test",
			"IS_CURRENT": 0,
			"LAYOUT_COLUMNS": [
				{
					"DISPLAY_ORDER": 1,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "PRICE", // a valid Column Id but invalid for this kind of layout 
					"COSTING_SHEET_ROW_ID": "TEST",
					"COLUMN_WIDTH": 100
				}
			]
		}
		const invalidRequestTotalCostComponentSplit = {
			"LAYOUT_ID": 1024,
			"LAYOUT_NAME": "Test",
			"IS_CURRENT": 0,
			"LAYOUT_COLUMNS": [
				{
					"DISPLAY_ORDER": 1,
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "PRICE", // a valid Column Id but invalid for this kind of layout 
					"COST_COMPONENT_ID": "TEST",
					"COLUMN_WIDTH": 100
				}
			]
		}
		const parametersTotalCost = [
			{
				description: "should not throw exception on POST if it contains valid TOTAL_COST fields",
				expected: validRequestTotalCost,
				method: $.net.http.POST,
				shouldThrow: false
			},
			{
				description: "should not throw exception on PUT if it contains valid TOTAL_COST fields",
				expected: validRequestTotalCost,
				method: $.net.http.PUT,
				shouldThrow: false
			},
			{
				description: "should throw exception on POST if it contains invalid TOTAL_COST fields for Costing Sheet Row",
				expected: invalidRequestTotalCostCostingSheet,
				method: $.net.http.POST,
				shouldThrow: true
			},
			{
				description: "should throw exception on PUT if it contains invalid TOTAL_COST fields for Costing Sheet Row",
				expected: invalidRequestTotalCostCostingSheet,
				method: $.net.http.PUT,
				shouldThrow: true
			},
			{
				description: "should throw exception on POST if it contains invalid TOTAL_COST fields for Component Split Row",
				expected: invalidRequestTotalCostComponentSplit,
				method: $.net.http.POST,
				shouldThrow: true
			},
			{
				description: "should throw exception on PUT if it contains invalid TOTAL_COST fields for Component Split Row",
				expected: invalidRequestTotalCostComponentSplit,
				method: $.net.http.PUT,
				shouldThrow: true
			}
		];
		parametersTotalCost.forEach((parameter) => {
			it(parameter.description, () => {

				//arrange
				setGetMetadataReturnValue([{
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST"
				},
				{
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST2"
				},
				{
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "TOTAL_COST3"
				},
				{
					"PATH": "CALCULATION_VERSION.ROOT_ITEM",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "PRICE"
				}
				]);

				var request = createRequest(parameter.expected, parameter.method);
				var params = { is_corporate: false };

				// act
				try {
					var actual = oLayoutValidator.validate(request, params);
				} catch (e) {
					exception = e;
				}

				// assert
				if (parameter.shouldThrow) {
					expect(exception).toBeDefined();
					expect(exception.code).toEqual(oExpectedErrorCode);
				}
				else {
					expect(parameter.expected).toEqualObject(actual);
				}
			});

		});
	}).addTags(["All_Unit_Tests"]);
}