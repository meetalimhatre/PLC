/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;

describe('db.calcengine.procedures.p_uom_conversion', () => {

	var oMockstar = null;

	beforeOnce(function() {
		oMockstar = new MockstarFacade( // Initialize Mockstar
			{
				testmodel: "sap.plc.db.calcengine.procedures/p_uom_conversion", // procedure or view under test
				substituteTables: // substitute all used tables in the procedure or view
				{
					version: {
						name: "sap.plc.db::basis.t_calculation_version_temporary",
						data: testData.oCalculationVersionTemporaryTestData
					},
					uom: {
						name: "sap.plc.db::basis.t_uom",
						data: "t_uom.csv"
					}
				},
				csvPackage: "db.content"
			}
		);
	});

	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.initializeData();
	});

	// Tests do not depend on custom fields
	if (jasmine.plcTestRunParameters.generatedFields === false) {
		it('should convert UoMs and report possible errors', function() {
			//arrange
			// 2 feasible conversions: 2m -> 200cm, 3h -> 180min
			// 1 error condition: 4m -> kg (dimensions do not match)
			var oInputData = [
				{
					"ITEM_ID":       1,
					"SOURCE_VALUE":  2,
					"SOURCE_UOM_ID": "M",
					"TARGET_UOM_ID": "CM"
				},
				{
					"ITEM_ID":       2,
					"SOURCE_VALUE":  3,
					"SOURCE_UOM_ID": "H",
					"TARGET_UOM_ID": "MIN"
				},
				{
					"ITEM_ID":       3,
					"SOURCE_VALUE":  4,
					"SOURCE_UOM_ID": "M",
					"TARGET_UOM_ID": "KG"
				},
			];
			
			//act
			var result = oMockstar.call(testData.iCalculationVersionId, testData.sSessionId, oInputData, null);
			
			//assert
			// check converted UoM values
		   expect(result).toMatchData({
				ITEM_ID:          [1,      2,     3 ],
				CONVERTED_VALUE:  ["200.0000000", "180.0000000", null],
				ERROR_CODE:       [null,   null,   3],
				ERROR_DETAILS:    [null,   null,  '"businessObject":"Item","columnId":"SOURCE_UOM_ID","unitOfMeasureId":"M","businessObject2":"Item","columnId2":"TARGET_UOM_ID","unitOfMeasureId2":"KG"']
			}, ["ITEM_ID"]);
		});
	}
		
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);