/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;

describe('db.calcengine.procedures.p_calculate_variant', () =>{
    var oMockstar = null;

    const oFormulaTestData = {
        FORMULA_ID:       [ 99999 ],
        PATH:             ["Item"],
        BUSINESS_OBJECT:  ["Item"],
        COLUMN_ID:        ["QUANTITY"],
        ITEM_CATEGORY_ID: [3],
        IS_FORMULA_USED:  [1],
        FORMULA_STRING:   ["111+222+333"]
    };

    var iVariantId = 11;

    beforeOnce( () => {
        oMockstar = new MockstarFacade({
            testmodel: "sap.plc.db.calcengine.procedures/p_calculate_variant",
            substituteTables: {
                calculation_version:{
                    name: "sap.plc.db::basis.t_calculation_version",
                    data: testData.oCalculationVersionForVariantTestData
                },
                calculation:{
                    name: "sap.plc.db::basis.t_calculation",
                    data: testData.oCalculationForVariantTestData
                },
                project:{
                    name: "sap.plc.db::basis.t_project",
                    data: testData.oProjectForVariantTestData
                },
                formula: {
                    name: "sap.plc.db::basis.t_formula",
                    data: oFormulaTestData
                },
                costing_sheet_overhead_row_formula:{
                    name: "sap.plc.db::basis.t_costing_sheet_overhead_row_formula",
                },
                metadata: "sap.plc.db::basis.t_metadata",
                metadata_attributes: "sap.plc.db::basis.t_metadata_item_attributes",
                item: {
                    name: "sap.plc.db::basis.t_item",
                    data: testData.oItemTestData
                },
                account: {
                    name: "sap.plc.db::basis.t_account",
                    data: testData.oAccountForItemTestData
                }
            }
        })
    });

    afterOnce(function(){				
        oMockstar.cleanup(); // clean up all test artefacts
    });

    beforeEach(function() {
        oMockstar.clearAllTables(); // clear all specified substitute tables and views
        oMockstar.initializeData();
    });

    const aInputVariantItems = [{
        VARIANT_ID: iVariantId,
        ITEM_ID: 3001,
        IS_INCLUDED: 1,
        QUANTITY: null,
        QUANTITY_STATE: 1,
        QUANTITY_UOM_ID: "PC"
    },{
        VARIANT_ID: iVariantId,
        ITEM_ID: 3002,
        IS_INCLUDED: 1,
        QUANTITY: 10,
        QUANTITY_STATE: 2,
        QUANTITY_UOM_ID: "PC"
    },{
        VARIANT_ID: iVariantId,
        ITEM_ID: 3003,
        IS_INCLUDED: 1,
        QUANTITY: 15,
        QUANTITY_STATE: 0,
        QUANTITY_UOM_ID: "PC"
    }];

    var aInputVariantHeader = [{
		VARIANT_ID : iVariantId,
		CALCULATION_VERSION_ID : testData.iCalculationVersionId,
		VARIANT_NAME : "TEST VARIANT",
		EXCHANGE_RATE_TYPE_ID : testData.sDefaultExchangeRateType,
		REPORT_CURRENCY_ID: "EUR",
		SALES_PRICE: "10.0000000",
		SALES_PRICE_CURRENCY_ID: "EUR",
		IS_SELECTED: 1,
		LAST_REMOVED_MARKINGS_ON: testData.sExpectedDate,
		LAST_REMOVED_MARKINGS_BY: testData.sTestUser,
		LAST_MODIFIED_ON: testData.sExpectedDate,
		LAST_MODIFIED_BY: testData.sTestUser,
		LAST_CALCULATED_ON: testData.sExpectedDate,
		LAST_CALCULATED_BY: testData.sTestUser
	}];


    it('should calculate correctly the input variant items', () => {

        //act
        var result = oMockstar.call(testData.iCalculationVersionId, aInputVariantHeader, aInputVariantItems, null, null, null);

        //assert
        expect(result[1].columns.QUANTITY_CALCULATED.rows[0]).toBe("1.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[1]).toBe("1.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[2]).toBe("666.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[0]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[1]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[2]).toBe("666.0000000");
    });

    it('should calculate correctly the input variant items when all quantity states are linked', () => {
        //arrange
        var aInputItems = JSON.parse(JSON.stringify(aInputVariantItems));
        aInputItems[2].QUANTITY_STATE = 2;

        //act
        var result = oMockstar.call(testData.iCalculationVersionId, aInputVariantHeader, aInputItems, null, null, null);

        //assert
        expect(result[1].columns.TOTAL_QUANTITY.rows[0]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[1]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[2]).toBe("1.0000000");
    });

    it('should calculate correctly the input variant items when all quantity states are manual', () => {
        //arrange
        var aInputItems = JSON.parse(JSON.stringify(aInputVariantItems));
        aInputItems[1].QUANTITY_STATE = 1;
        aInputItems[2].QUANTITY_STATE = 1;

        //act
        var result = oMockstar.call(testData.iCalculationVersionId, aInputVariantHeader, aInputItems, null, null, null);

        //assert
        expect(result[1].columns.QUANTITY_CALCULATED.rows[0]).toBe("1.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[1]).toBe("10.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[2]).toBe("666.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[0]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[1]).toBe("10.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[2]).toBe("150.0000000");
    });

    it('should calculate correctly the input variant items when all quantity states are calculated', () => {
        //arrange
        var aInputItems = JSON.parse(JSON.stringify(aInputVariantItems));
        aInputItems[2].QUANTITY_STATE = 2;

        //act
        var result = oMockstar.call(testData.iCalculationVersionId, aInputVariantHeader, aInputItems, null, null, null);

        //assert
        expect(result[1].columns.QUANTITY_CALCULATED.rows[0]).toBe("1.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[1]).toBe("1.0000000");
        expect(result[1].columns.QUANTITY_CALCULATED.rows[2]).toBe("666.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[0]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[1]).toBe("1.0000000");
        expect(result[1].columns.TOTAL_QUANTITY.rows[2]).toBe("1.0000000");
    });
});