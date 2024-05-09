/* eslint no-underscore-dangle: ["error", { "allow": ["_VALID_TO"] }] */
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const helpers = require("../../../lib/xs/util/helpers");
const mockstarHelpers = require("../../testtools/mockstar_helpers");
const Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
const testDataERP = require("./testDataForTriggers");
const testDataPLC = require("../../testdata/testdata").data;

describe("triggers_on_erp_tables-tests", () => {
    const TestDataUtility = require("../../xsjs/postinstall/testtools/testDataUtility").TestDataUtility;

    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            testmodel: {
            },
            substituteTables: {
                account: {
                    name: Resources.Account.dbobjects.plcTable,
                    data: testDataPLC.oAccountData,
                },
                accountText: {
                    name: Resources.Account.dbobjects.plcTextTable,
                    data: testDataPLC.oAccountTextData,
                },
                erpAccount: {
                    name: "sap.plc.db::repl.cskb"
                },
                erpAccountText: {
                    name: Resources.Account.dbobjects.erpTextTable
                },
                activityType: {
                    name: Resources.Activity_Type.dbobjects.plcTable,
                    data: testDataPLC.oActivityTypeData,
                },
                erpActivityType: {
                    name: "sap.plc.db::repl.csla"
                },
                activityTypeText: {
                    name: Resources.Activity_Type.dbobjects.plcTextTable,
                    data: testDataPLC.oActivityTypeTextData,
                },
                erpActivityTypeText: {
                    name: "sap.plc.db::repl.t_cslt"
                },
                controllingArea: {
                    name: Resources.Controlling_Area.dbobjects.plcTable,
                    data: testDataPLC.oControllingAreaData,
                },
                erpControllingArea: {
                    name: Resources.Controlling_Area.dbobjects.erpTable
                },
                controllingAreaText: {
                    name: Resources.Controlling_Area.dbobjects.plcTextTable,
                    data: testDataPLC.oControllingAreaTextData,
                },
                erpControllingAreaText: {
                    name: Resources.Controlling_Area.dbobjects.erpTextTable
                },
                businessArea: {
                    name: Resources.Business_Area.dbobjects.plcTable,
                    data: testDataPLC.oBusinessAreaData,
                },
                erpBusinessArea: {
                    name: Resources.Business_Area.dbobjects.erpTable
                },
                businessAreaText: {
                    name: Resources.Business_Area.dbobjects.plcTextTable,
                    data: testDataPLC.oBusinessAreaTextData,
                },
                erpBusinessAreaText: {
                    name: Resources.Business_Area.dbobjects.erpTextTable
                },
                process: {
                    name: Resources.Process.dbobjects.plcTable,
                    data: testDataPLC.oProcessData,
                },
                processText: {
                    name: Resources.Process.dbobjects.plcTextTable,
                    data: testDataPLC.oProcessTextData,
                },
                erpProcess: {
                    name: "sap.plc.db::repl.cbpr"
                },
                erpProcessText: {
                    name: "sap.plc.db::repl.t_cbpt"
                },
                companyCode: {
                    name: Resources.Company_Code.dbobjects.plcTable,
                    data: testDataPLC.oCompanyCodeData,
                },
                erpCompanyCode: {
                    name: Resources.Company_Code.dbobjects.erpTable
                },
                companyCodeText: {
                    name: Resources.Company_Code.dbobjects.plcTextTable,
                    data: testDataPLC.oCompanyCodeTextData,
                },
                erpCompanyCodeText: {
                    name: Resources.Company_Code.dbobjects.erpTextTable
                },
                costCenter: {
                    name: Resources.Cost_Center.dbobjects.plcTable,
                    data: testDataPLC.oCostCenterData,
                },
                erpCostCenter: {
                    name: "sap.plc.db::repl.csks"
                },
                costCenterText: {
                    name: Resources.Cost_Center.dbobjects.plcTextTable,
                    data: testDataPLC.oCostCenterTextData,
                },
                erpCostCenterText: {
                    name: "sap.plc.db::repl.t_cskt"
                },
                customer: {
                    name: Resources.Customer.dbobjects.plcTable,
                    data: testDataPLC.oCustomerData,
                },
                erpCustomer: {
                    name: Resources.Customer.dbobjects.erpTable
                },
                currency: {
                    name: Resources.Currency.dbobjects.plcTable,
                    data: testDataPLC.oCurrencyData,
                },
                currencyConversion: {
                    name: Resources.Currency_Conversion.dbobjects.plcTable,
                },
                erpCurrencyConversionTCURR: {
                    name: "sap.plc.db::repl.t_tcurr"
                },
                erpCurrencyConversionTCURF: {
                    name: "sap.plc.db::repl.t_tcurf"
                },
                currencyText: {
                    name: Resources.Currency.dbobjects.plcTextTable,
                    data: testDataPLC.oCurrencyTextData,
                },
                dimension: {
                    name: Resources.Dimension.dbobjects.plcTable,
                    data: testDataPLC.oDimensionData,
                },
                dimensionText: {
                    name: Resources.Dimension.dbobjects.plcTextTable,
                    data: testDataPLC.oDimensionTextData,
                },
                document: {
                    name: Resources.Document.dbobjects.plcTable,
                    data: testDataPLC.oDocumentData,
                },
                erpDocument: {
                    name: Resources.Document.dbobjects.erpTable
                },
                documentText: {
                    name: Resources.Document.dbobjects.plcTextTable,
                    data: testDataPLC.oDocumentTextData,
                },
                erpDocumentText: {
                    name: Resources.Document.dbobjects.erpTextTable
                },
                documentMaterial: {
                    name: "sap.plc.db::basis.t_document_material",
                    data: testDataPLC.oDocumentMaterialTestData,
                },
                erpDocumentMaterial: {
                    name: "sap.plc.db::repl.drad"
                },
                documentStatus: {
                    name: Resources.Document_Status.dbobjects.plcTable,
                    data: testDataPLC.oDocumentStatusData,
                },
                erpDocumentStatus: {
                    name: Resources.Document_Status.dbobjects.erpTable
                },
                documentStatusText: {
                    name: Resources.Document_Status.dbobjects.plcTextTable,
                    data: testDataPLC.oDocumentStatusTextData,
                },
                erpDocumentStatusText: {
                    name: Resources.Document_Status.dbobjects.erpTextTable
                },
                documentType: {
                    name: Resources.Document_Type.dbobjects.plcTable,
                    data: testDataPLC.oDocumentTypeData,
                },
                erpDocumentType: {
                    name: Resources.Document_Type.dbobjects.erpTable
                },
                documentTypeText: {
                    name: Resources.Document_Type.dbobjects.plcTextTable,
                    data: testDataPLC.oDocumentTypeTextData,
                },
                erpDocumentTypeText: {
                    name: Resources.Document_Type.dbobjects.erpTextTable
                },
                material: {
                    name: Resources.Material.dbobjects.plcTable,
                    data: testDataPLC.oMaterialData,
                },
                erpMaterial: {
                    name: Resources.Material.dbobjects.erpTable
                },
                materialText: {
                    name: Resources.Material.dbobjects.plcTextTable,
                    data: testDataPLC.oMaterialTextData,
                },
                erpMaterialText: {
                    name: Resources.Material.dbobjects.erpTextTable
                },
                materialGroup: {
                    name: Resources.Material_Group.dbobjects.plcTable,
                    data: testDataPLC.oMaterialGroupData,
                },
                erpMaterialGroup: {
                    name: Resources.Material_Group.dbobjects.erpTable
                },
                materialGroupText: {
                    name: Resources.Material_Group.dbobjects.plcTextTable,
                    data: testDataPLC.oMaterialGroupTextData,
                },
                erpMaterialGroupText: {
                    name: Resources.Material_Group.dbobjects.erpTextTable
                },
                materialPlant: {
                    name: Resources.Material_Plant.dbobjects.plcTable,
                    data: testDataPLC.oMaterialPlantData,
                },
                erpMaterialPlant: {
                    name: Resources.Material_Plant.dbobjects.erpTable
                },
                materialPrice: {
                    name: Resources.Material_Price.dbobjects.plcTable,
                    data: testDataPLC.oMaterialPriceData,
                },
                erpMaterialPrice: {
                    name: Resources.Material_Price.dbobjects.erpTable
                },
                materialType: {
                    name: Resources.Material_Type.dbobjects.plcTable,
                    data: testDataPLC.oMaterialTypeData,
                },
                erpMaterialType: {
                    name: Resources.Material_Type.dbobjects.erpTable
                },
                materialTypeText: {
                    name: Resources.Material_Type.dbobjects.plcTextTable,
                    data: testDataPLC.oMaterialTypeTextData,
                },
                erpMaterialTypeText: {
                    name: Resources.Material_Type.dbobjects.erpTextTable
                },
                plant: {
                    name: Resources.Plant.dbobjects.plcTable,
                    data: testDataPLC.oPlantData,
                },
                erpPlant: {
                    name: Resources.Plant.dbobjects.erpTable
                },
                plantText: {
                    name: Resources.Plant.dbobjects.plcTextTable,
                    data: testDataPLC.oPlantTextData,
                },
                erpPlantText: {
                    name: Resources.Plant.dbobjects.erpTextTable
                },
                profitCenter: {
                    name: Resources.Profit_Center.dbobjects.plcTable,
                    data: testDataPLC.oProfitCenterData,
                },
                erpProfitCenter: {
                    name: "sap.plc.db::repl.cepc"
                },
                profitCenterText: {
                    name: Resources.Profit_Center.dbobjects.plcTextTable,
                    data: testDataPLC.oProfitCenterTextData,
                },
                erpProfitCenterText: {
                    name: "sap.plc.db::repl.t_cepct"
                },
                vendor: {
                    name: Resources.Vendor.dbobjects.plcTable,
                    data: testDataPLC.oVendorData,
                },
                erpVendor: {
                    name: Resources.Vendor.dbobjects.erpTable
                },
                uom: {
                    name: Resources.Unit_Of_Measure.dbobjects.plcTable,
                    data: testDataPLC.oUomData,
                },
                erpUom: {
                    name: Resources.Unit_Of_Measure.dbobjects.erpTable
                },
                uomText: {
                    name: Resources.Unit_Of_Measure.dbobjects.plcTextTable,
                    data: testDataPLC.oUomTextData,
                },
                erpUomText: {
                    name: Resources.Unit_Of_Measure.dbobjects.erpTextTable
                },
                overheadGroup: {
                    name: Resources.Overhead_Group.dbobjects.plcTable,
                    data: testDataPLC.oOverheadGroupData,
                },
                erpOverheadGroup: {
                    name: Resources.Overhead_Group.dbobjects.erpTable
                },
                overheadGroupText: {
                    name: Resources.Overhead_Group.dbobjects.plcTextTable,
                    data: testDataPLC.oOverheadGroupTextData,
                },
                erpOverheadGroupText: {
                    name: Resources.Overhead_Group.dbobjects.erpTextTable
                },
                valuationClass: {
                    name: Resources.Valuation_Class.dbobjects.plcTable,
                    data: testDataPLC.oValuationClassData,
                },
                erpValuationClass: {
                    name: Resources.Valuation_Class.dbobjects.erpTable
                },
                valuationClassText: {
                    name: Resources.Valuation_Class.dbobjects.plcTextTable,
                    data: testDataPLC.oValuationClassTextData,
                },
                erpValuationClassText: {
                    name: Resources.Valuation_Class.dbobjects.erpTextTable
                },
                erpMaterialAccountDetermination: {
                    name: "sap.plc.db::repl.t030"
                },
                materialAccountDetermination: {
                    name: Resources.Material_Account_Determination.dbobjects.plcTable,
                },
            },
        });
    });

    afterOnce(() => {
        oMockstar.cleanup();
    });

    beforeEach(() => {
        jasmine.dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL off");
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    /**
    * Generic functions that check if the triggers work as expected
    * @param   {string} sPlcTable - PLC Table on which the verification is done
    * @param   {string} sErpTable - ERP Table on which operations are done
    * @param   {object} oTestErpData - Test data containing the objects used for testing
    * @param   {integer} iIndex1 - Index of the first object which is used for testing
    * @param   {integer} iIndex2 - Index of the second object which is used for testing
    * @param   {integer} iExpectedIncrement - The number of entries expected to be inserted in PLC Table
    * @param   {array} aKeys - Array containing the keys corresponding to each PLC Table
    */

    function testTriggerAfterInsert(sPlcTable, sErpTable, oTestErpData, iIndex1, iIndex2, iExpectedIncrement) {
        jasmine.log(`testing trigger when inserting data in erp table: ${sErpTable}`);

        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        const oTestEntry1 = new TestDataUtility(oTestErpData).getObject(iIndex1);
        oMockstar.insertTableData(sErpTable, oTestEntry1);
        if (!helpers.isNullOrUndefined(iIndex2)) {
            const oTestEntry2 = new TestDataUtility(oTestErpData).getObject(iIndex2);
            oMockstar.insertTableData(sErpTable, oTestEntry2);
        }
        const iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        expect(iRowsPlcTableAfter).toEqual(iRowsPlcTableBefore + iExpectedIncrement);
    }


    /* Insert in ERP Table test entry from the position iObjIndex -> Trigger copies it to corresponding PLC Table.
    Update test entry with data from position iObjIndex -> Trigger should not execute since the entry is identical
    Update test entry with data from position iObjIndex2 -> Trigger should execute.
    Current entry from PLC Table is invalidated and a new one with updated values is inserted */
    function testTriggerAfterUpdate(sPlcTable, sErpTable, oTestErpData, iObjIndex, iObjIndex2) {
        jasmine.log(`testing trigger when updating data in erp table: ${sErpTable}`);
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, sPlcTable);

        let oTestEntry = new TestDataUtility(oTestErpData).getObject(iObjIndex);

        oMockstar.insertTableData(sErpTable, oTestEntry);
        oMockstar.upsertTableData(sErpTable, oTestEntry);
        if (!helpers.isNullOrUndefined(iObjIndex2)) {
            oTestEntry = new TestDataUtility(oTestErpData).getObject(iObjIndex2);
            oMockstar.upsertTableData(sErpTable, oTestEntry);
        }
        const iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        const oTestEntries = oMockstar.execQuery(`select * from {{${sPlcTable}}}`);
        if (!helpers.isNullOrUndefined(iObjIndex2)) {
            expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 2);
            expect(oTestEntries.columns._VALID_TO.rows[0]).not.toBe(null);
            expect(oTestEntries.columns._VALID_TO.rows[1]).toBe(null);
        } else {
            expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 1);
            expect(oTestEntries.columns._VALID_TO.rows[0]).toBe(null);
        }
    }

    function testTriggerAfterUpdatePersonalData(sPlcTable, sErpTable, oTestErpData, iObjIndex, iObjIndex2) {
        jasmine.log(`testing trigger when updating data in erp table: ${sErpTable}`);
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        let select= oMockstar.execQuery(`select * from {{${sPlcTable}}}`);
        let select2= oMockstar.execQuery(`select * from {{${sErpTable}}}`);

        let oTestEntry = new TestDataUtility(oTestErpData).getObject(iObjIndex);

        oMockstar.insertTableData(sErpTable, oTestEntry);
        oMockstar.upsertTableData(sErpTable, oTestEntry);
        select= oMockstar.execQuery(`select * from {{${sPlcTable}}}`);
        select2= oMockstar.execQuery(`select * from {{${sErpTable}}}`);

        if (!helpers.isNullOrUndefined(iObjIndex2)) {
            oTestEntry = new TestDataUtility(oTestErpData).getObject(iObjIndex2);
            oMockstar.upsertTableData(sErpTable, oTestEntry);
        }

        select= oMockstar.execQuery(`select * from {{${sPlcTable}}}`);
        select2= oMockstar.execQuery(`select * from {{${sErpTable}}}`);
        const iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore);
    }

    function testTriggerAfterDelete(sPlcTable, sErpTable, oTestErpData, objIndex, aKeys) {
        jasmine.log(`testing trigger when deleting data in erp table: ${sErpTable}`);
        const whereCondition = " _VALID_TO is null ";
        const oTestEntry1 = new TestDataUtility(oTestErpData).getObject(objIndex);
        oMockstar.insertTableData(sErpTable, oTestEntry1);
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, sPlcTable, whereCondition);

        let keyString = "";
        aKeys.forEach((sKey, iIndex) => {
            keyString += ` ${sKey} = '${oTestEntry1[sKey]}' `;
            if (aKeys.length - 1 > iIndex) { keyString += "  AND "; }
        });
        oMockstar.execSingle(`delete from {{${sErpTable}}} where ${keyString}`);

        const iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, sPlcTable, whereCondition);
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore - 1);
    }

    function testTriggerAfterDeletePersonalData(sPlcTable, sErpTable, oTestErpData, objIndex, aKeys) {
        jasmine.log(`testing trigger when deleting data in erp table: ${sErpTable}`);
        const oTestEntry1 = new TestDataUtility(oTestErpData).getObject(objIndex);
        oMockstar.insertTableData(sErpTable, oTestEntry1);
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, sPlcTable);

        let keyString = "";
        aKeys.forEach((sKey, iIndex) => {
            keyString += ` ${sKey} = '${oTestEntry1[sKey]}' `;
            if (aKeys.length - 1 > iIndex) { keyString += "  AND "; }
        });

        oMockstar.execSingle(`delete from {{${sErpTable}}} where ${keyString}`);

        const iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, sPlcTable);
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore - 1);
    }

    it("should delete data", () => {
        // act
        testTriggerAfterDelete("businessArea", "erpBusinessArea", testDataERP.oBusinessAreaErpData, 0, ["GSBER"]);
        testTriggerAfterDelete("businessAreaText", "erpBusinessAreaText", testDataERP.oBusinessAreaTextErpData, 0, ["LANGU", "GSBER"]);
        testTriggerAfterDelete("companyCode", "erpCompanyCode", testDataERP.oCompanyCodeErpData, 0, ["BUKRS"]);
        testTriggerAfterDelete("companyCodeText", "erpCompanyCodeText", testDataERP.oCompanyCodeTextErpData, 0, ["LANGU", "BUKRS"]);
        testTriggerAfterDelete("controllingArea", "erpControllingArea", testDataERP.oControllingAreaErpData, 0, ["KOKRS"]);
        testTriggerAfterDelete("controllingAreaText", "erpControllingAreaText", testDataERP.oControllingAreaTextErpData, 0, ["LANGU", "KOKRS"]);
        testTriggerAfterDelete("customer", "erpCustomer", testDataERP.oCustomerErpData, 0, ["KUNNR"]);
        testTriggerAfterDelete("document", "erpDocument", testDataERP.oDocumentErpData, 0, ["DOKAR", "DOKNR", "DOKVR", "DOKTL"]);
        testTriggerAfterDelete("documentText", "erpDocumentText", testDataERP.oDocumentTextErpData, 0, ["DOKAR", "DOKNR", "DOKVR", "DOKTL", "LANGU"]);
        let aKeys = ["DOKAR", "DOKNR", "DOKVR", "DOKTL", "OBJKY"];
        testTriggerAfterDelete("documentMaterial", "erpDocumentMaterial", testDataERP.oDocumentMaterialErpData, 0, aKeys);
        testTriggerAfterDelete("documentType", "erpDocumentType", testDataERP.oDocumentTypeErpData, 0, ["DOKAR"]);
        testTriggerAfterDelete("documentTypeText", "erpDocumentTypeText", testDataERP.oDocumentTypeTextErpData, 0, ["LANGU", "DOKAR"]);
        testTriggerAfterDelete("documentStatus", "erpDocumentStatus", testDataERP.oDocumentStatusErpData, 0, ["DOKAR", "DOKST"]);
        testTriggerAfterDelete("documentStatusText", "erpDocumentStatusText", testDataERP.oDocumentStatusTextErpData, 0, ["LANGU", "DOKST"]);
        testTriggerAfterDelete("material", "erpMaterial", testDataERP.oMaterialErpData, 0, ["MATNR"]);
        testTriggerAfterDelete("materialText", "erpMaterialText", testDataERP.oMaterialTextErpData, 0, ["LANGU", "MATNR"]);
        testTriggerAfterDelete("materialGroup", "erpMaterialGroup", testDataERP.oMaterialGroupErpData, 0, ["MATKL"]);
        testTriggerAfterDelete("materialGroupText", "erpMaterialGroupText", testDataERP.oMaterialGroupTextErpData, 0, ["LANGU", "MATKL"]);
        testTriggerAfterDelete("materialType", "erpMaterialType", testDataERP.oMaterialTypeErpData, 0, ["MTART"]);
        testTriggerAfterDelete("materialTypeText", "erpMaterialTypeText", testDataERP.oMaterialTypeTextErpData, 0, ["LANGU", "MTART"]);
        testTriggerAfterDelete("plant", "erpPlant", testDataERP.oPlantErpData, 0, ["WERKS"]);
        testTriggerAfterDelete("plantText", "erpPlantText", testDataERP.oPlantTextErpData, 0, ["LANGU", "WERKS"]);
        testTriggerAfterDelete("overheadGroup", "erpOverheadGroup", testDataERP.oOverheadGroupErpData, 0, ["WERKS", "KOSGR"]);
        testTriggerAfterDelete("overheadGroupText", "erpOverheadGroupText", testDataERP.oOverheadGroupTextErpData, 0, ["WERKS", "LANGU", "KOSGR"]);
        testTriggerAfterDelete("uom", "erpUom", testDataERP.oUomErpData, 0, ["MSEHI"]);
        testTriggerAfterDelete("uomText", "erpUomText", testDataERP.oUomTextErpData, 0, ["LANGU", "MSEHI"]);
        testTriggerAfterDelete("valuationClass", "erpValuationClass", testDataERP.oValuationClassErpData, 0, ["BKLAS"]);
        testTriggerAfterDelete("valuationClassText", "erpValuationClassText", testDataERP.oValuationClassTextErpData, 0, ["LANGU", "BKLAS"]);
        testTriggerAfterDelete("vendor", "erpVendor", testDataERP.oVendorErpData, 0, ["LIFNR"]);
        testTriggerAfterDelete("materialPlant", "erpMaterialPlant", testDataERP.oMaterialPlantErpData, 0, ["MATNR", "WERKS"]);
        aKeys = ["VALID_FROM", "PRICE_SOURCE_ID", "WERKS", "MATNR", "VENDOR_ID", "PROJECT_ID", "VALID_FROM_QUANTITY"];
        testTriggerAfterDelete("materialPrice", "erpMaterialPrice", testDataERP.oMaterialPriceErpData, 0, aKeys);

        // element with index 0 has an old DATBI, element with index 1 has an new DATBI
        testTriggerAfterDelete("account", "erpAccount", testDataERP.oAccountErpTableData, 1, ["KOKRS", "KSTAR", "DATBI"]);
        testTriggerAfterDelete("accountText", "erpAccountText", testDataERP.oAccountTextErpData, 0, ["KOKRS", "LANGU", "KSTAR"]);
        testTriggerAfterDelete("process", "erpProcess", testDataERP.oProcessErpTableData, 1, ["KOKRS", "PRZNR", "DATBI"]);
        aKeys = ["KOKRS", "LANGU", "PRZNR", "DATBI"];
        testTriggerAfterDelete("processText", "erpProcessText", testDataERP.oProcessTextErpTableData, 1, aKeys);
        testTriggerAfterDelete("costCenter", "erpCostCenter", testDataERP.oCostCenterErpTableData, 1, ["KOKRS", "KOSTL", "DATBI"]);
        aKeys = ["KOKRS", "LANGU", "KOSTL", "DATBI"];
        testTriggerAfterDelete("costCenterText", "erpCostCenterText", testDataERP.oCostCenterTextErpTableData, 1, aKeys);
        testTriggerAfterDelete("profitCenter", "erpProfitCenter", testDataERP.oProfitCenterErpTableData, 1, ["PRCTR", "DATBI", "KOKRS"]);
        aKeys = ["PRCTR", "LANGU", "DATBI", "KOKRS"];
        testTriggerAfterDelete("profitCenterText", "erpProfitCenterText", testDataERP.oProfitCenterTextErpTableData, 1, aKeys);
        testTriggerAfterDelete("activityType", "erpActivityType", testDataERP.oActivityTypeErpTableData, 1, ["KOKRS", "LSTAR", "DATBI"]);
        aKeys = ["KOKRS", "LANGU", "LSTAR", "DATBI"];
        testTriggerAfterDelete("activityTypeText", "erpActivityTypeText", testDataERP.oActivityTypeTextErpTableData, 1, aKeys);
    });

    it("should update data (on ERP tables) in PLC", () => {
        // arrange

        // act
        testTriggerAfterUpdate("businessArea", "erpBusinessArea", testDataERP.oBusinessAreaErpData, 0, null);
        testTriggerAfterUpdate("businessAreaText", "erpBusinessAreaText", testDataERP.oBusinessAreaTextErpData, 0, 1);
        testTriggerAfterUpdate("companyCode", "erpCompanyCode", testDataERP.oCompanyCodeErpData, 0, 1);
        testTriggerAfterUpdate("companyCodeText", "erpCompanyCodeText", testDataERP.oCompanyCodeTextErpData, 0, 1);
        testTriggerAfterUpdate("controllingArea", "erpControllingArea", testDataERP.oControllingAreaErpData, 0, 1);
        testTriggerAfterUpdate("controllingAreaText", "erpControllingAreaText", testDataERP.oControllingAreaTextErpData, 0, 1);
        testTriggerAfterUpdate("customer", "erpCustomer", testDataERP.oCustomerErpData, 0, 1);
        testTriggerAfterUpdate("document", "erpDocument", testDataERP.oDocumentErpData, 0, 1);
        testTriggerAfterUpdate("documentText", "erpDocumentText", testDataERP.oDocumentTextErpData, 0, 1);
        testTriggerAfterUpdate("documentMaterial", "erpDocumentMaterial", testDataERP.oDocumentMaterialErpData, 0, null);
        testTriggerAfterUpdate("documentType", "erpDocumentType", testDataERP.oDocumentTypeErpData, 0, null);
        testTriggerAfterUpdate("documentTypeText", "erpDocumentTypeText", testDataERP.oDocumentTypeTextErpData, 0, 1);
        testTriggerAfterUpdate("documentStatus", "erpDocumentStatus", testDataERP.oDocumentStatusErpData, 0, null);
        testTriggerAfterUpdate("documentStatusText", "erpDocumentStatusText", testDataERP.oDocumentStatusTextErpData, 0, 1);
        testTriggerAfterUpdate("material", "erpMaterial", testDataERP.oMaterialErpData, 0, 1);
        testTriggerAfterUpdate("materialText", "erpMaterialText", testDataERP.oMaterialTextErpData, 0, 1);
        testTriggerAfterUpdate("materialGroup", "erpMaterialGroup", testDataERP.oMaterialGroupErpData, 0, null);
        testTriggerAfterUpdate("materialGroupText", "erpMaterialGroupText", testDataERP.oMaterialGroupTextErpData, 0, 4);
        testTriggerAfterUpdate("materialType", "erpMaterialType", testDataERP.oMaterialTypeErpData, 0, null);
        testTriggerAfterUpdate("materialTypeText", "erpMaterialTypeText", testDataERP.oMaterialTypeTextErpData, 0, 1);
        testTriggerAfterUpdate("plant", "erpPlant", testDataERP.oPlantErpData, 0, 1);
        testTriggerAfterUpdate("plantText", "erpPlantText", testDataERP.oPlantTextErpData, 0, 1);
        testTriggerAfterUpdate("overheadGroup", "erpOverheadGroup", testDataERP.oOverheadGroupErpData, 0, null);
        testTriggerAfterUpdate("overheadGroupText", "erpOverheadGroupText", testDataERP.oOverheadGroupTextErpData, 0, 1);
        testTriggerAfterUpdate("uom", "erpUom", testDataERP.oUomErpData, 0, 1);
        testTriggerAfterUpdate("uomText", "erpUomText", testDataERP.oUomTextErpData, 0, 1);
        testTriggerAfterUpdate("valuationClass", "erpValuationClass", testDataERP.oValuationClassErpData, 0, null);
        testTriggerAfterUpdate("valuationClassText", "erpValuationClassText", testDataERP.oValuationClassTextErpData, 0, 1);
        testTriggerAfterUpdate("vendor", "erpVendor", testDataERP.oVendorErpData, 0, 1);
        testTriggerAfterUpdate("materialPlant", "erpMaterialPlant", testDataERP.oMaterialPlantErpData, 0, 1);
        testTriggerAfterUpdate("materialPrice", "erpMaterialPrice", testDataERP.oMaterialPriceErpData, 0);

        // element with index 0 has an old DATBI, element with index 1 has an new DATBI
        testTriggerAfterUpdate("account", "erpAccount", testDataERP.oAccountErpTableData, 1, null);
        testTriggerAfterUpdate("accountText", "erpAccountText", testDataERP.oAccountTextErpData, 0, 1);
        testTriggerAfterUpdate("process", "erpProcess", testDataERP.oProcessErpTableData, 1, null);
        testTriggerAfterUpdate("processText", "erpProcessText", testDataERP.oProcessTextErpTableData, 1, 3);
        testTriggerAfterUpdate("costCenter", "erpCostCenter", testDataERP.oCostCenterErpTableData, 1, null);
        testTriggerAfterUpdate("costCenterText", "erpCostCenterText", testDataERP.oCostCenterTextErpTableData, 1, 3);
        testTriggerAfterUpdate("profitCenter", "erpProfitCenter", testDataERP.oProfitCenterErpTableData, 1, null);
        testTriggerAfterUpdate("profitCenterText", "erpProfitCenterText", testDataERP.oProfitCenterTextErpTableData, 1, 3);
        testTriggerAfterUpdate("activityType", "erpActivityType", testDataERP.oActivityTypeErpTableData, 1, 2);
        testTriggerAfterUpdate("activityTypeText", "erpActivityTypeText", testDataERP.oActivityTypeTextErpTableData, 1, 3);
    });

    it("should copy inserted data (on ERP tables) in PLC", () => {
        // arrange

        // act
        // assert
        testTriggerAfterInsert("businessArea", "erpBusinessArea", testDataERP.oBusinessAreaErpData, 0, null, 1);
        testTriggerAfterInsert("businessAreaText", "erpBusinessAreaText", testDataERP.oBusinessAreaTextErpData, 0, null, 1);
        testTriggerAfterInsert("companyCode", "erpCompanyCode", testDataERP.oCompanyCodeErpData, 0, null, 1);
        testTriggerAfterInsert("companyCodeText", "erpCompanyCodeText", testDataERP.oCompanyCodeTextErpData, 0, null, 1);
        testTriggerAfterInsert("controllingArea", "erpControllingArea", testDataERP.oControllingAreaErpData, 0, null, 1);
        testTriggerAfterInsert("controllingAreaText", "erpControllingAreaText", testDataERP.oControllingAreaTextErpData, 0, null, 1);
        testTriggerAfterInsert("customer", "erpCustomer", testDataERP.oCustomerErpData, 0, null, 1);
        testTriggerAfterInsert("document", "erpDocument", testDataERP.oDocumentErpData, 0, null, 1);
        testTriggerAfterInsert("documentText", "erpDocumentText", testDataERP.oDocumentTextErpData, 0, null, 1);
        testTriggerAfterInsert("documentMaterial", "erpDocumentMaterial", testDataERP.oDocumentMaterialErpData, 0, null, 1);
        testTriggerAfterInsert("documentType", "erpDocumentType", testDataERP.oDocumentTypeErpData, 0, null, 1);
        testTriggerAfterInsert("documentTypeText", "erpDocumentTypeText", testDataERP.oDocumentTypeTextErpData, 0, null, 1);
        testTriggerAfterInsert("documentStatus", "erpDocumentStatus", testDataERP.oDocumentStatusErpData, 0, null, 1);
        testTriggerAfterInsert("documentStatusText", "erpDocumentStatusText", testDataERP.oDocumentStatusTextErpData, 0, null, 1);
        testTriggerAfterInsert("material", "erpMaterial", testDataERP.oMaterialErpData, 0, null, 1);
        testTriggerAfterInsert("materialText", "erpMaterialText", testDataERP.oMaterialTextErpData, 0, null, 1);
        testTriggerAfterInsert("materialGroup", "erpMaterialGroup", testDataERP.oMaterialGroupErpData, 0, null, 1);
        testTriggerAfterInsert("materialGroupText", "erpMaterialGroupText", testDataERP.oMaterialGroupTextErpData, 0, null, 1);
        testTriggerAfterInsert("materialType", "erpMaterialType", testDataERP.oMaterialTypeErpData, 0, null, 1);
        testTriggerAfterInsert("materialTypeText", "erpMaterialTypeText", testDataERP.oMaterialTypeTextErpData, 0, null, 1);
        testTriggerAfterInsert("plant", "erpPlant", testDataERP.oPlantErpData, 0, null, 1);
        testTriggerAfterInsert("plantText", "erpPlantText", testDataERP.oPlantTextErpData, 0, null, 1);
        testTriggerAfterInsert("overheadGroup", "erpOverheadGroup", testDataERP.oOverheadGroupErpData, 0, null, 1);
        testTriggerAfterInsert("overheadGroupText", "erpOverheadGroupText", testDataERP.oOverheadGroupTextErpData, 0, null, 1);
        testTriggerAfterInsert("uom", "erpUom", testDataERP.oUomErpData, 0, null, 1);
        testTriggerAfterInsert("uomText", "erpUomText", testDataERP.oUomTextErpData, 0, null, 1);
        testTriggerAfterInsert("valuationClass", "erpValuationClass", testDataERP.oValuationClassErpData, 0, null, 1);
        testTriggerAfterInsert("valuationClassText", "erpValuationClassText", testDataERP.oValuationClassTextErpData, 0, null, 1);
        testTriggerAfterInsert("vendor", "erpVendor", testDataERP.oVendorErpData, 0, null, 1);
        testTriggerAfterInsert("materialPlant", "erpMaterialPlant", testDataERP.oMaterialPlantErpData, 0, null, 1);
        testTriggerAfterInsert("materialPrice", "erpMaterialPrice", testDataERP.oMaterialPriceErpData, 0, null, 1);
        testTriggerAfterInsert("vendor", "erpVendor", testDataERP.oVendorDeletedErpTableData, 1, null, 0);
        testTriggerAfterInsert("customer", "erpCustomer", testDataERP.oCustomerDeletedErpTableData, 1, null, 0);

        // element with index 0 has an old DATBI, element with index 1 has an new DATBI
        testTriggerAfterInsert("account", "erpAccount", testDataERP.oAccountErpTableData, 0, 1, 1);
        testTriggerAfterInsert("accountText", "erpAccountText", testDataERP.oAccountTextErpData, 0, null, 1);
        testTriggerAfterInsert("process", "erpProcess", testDataERP.oProcessErpTableData, 0, 1, 1);
        testTriggerAfterInsert("processText", "erpProcessText", testDataERP.oProcessTextErpTableData, 0, 1, 1);
        testTriggerAfterInsert("costCenter", "erpCostCenter", testDataERP.oCostCenterErpTableData, 0, 1, 1);
        testTriggerAfterInsert("costCenterText", "erpCostCenterText", testDataERP.oCostCenterTextErpTableData, 0, 1, 1);
        testTriggerAfterInsert("profitCenter", "erpProfitCenter", testDataERP.oProfitCenterErpTableData, 0, 1, 1);
        testTriggerAfterInsert("profitCenterText", "erpProfitCenterText", testDataERP.oProfitCenterTextErpTableData, 0, 1, 1);
        testTriggerAfterInsert("activityType", "erpActivityType", testDataERP.oActivityTypeErpTableData, 0, 1, 1);
        testTriggerAfterInsert("activityTypeText", "erpActivityTypeText", testDataERP.oActivityTypeTextErpTableData, 0, 1, 1);
    });

    /* Since material Account determination and Currency Conversion use more than 1 table in ERP, these two need to be tested separately */
    it("should copy the data from ERP Material Account determination Table to PLC Table using trigger", () => {
        // arrange

        // act
        const erpCompanyCode = new TestDataUtility(testDataERP.oCompanyCodeErpData).getObject(2);
        const erpPlant = new TestDataUtility(testDataERP.oPlantErpData).getObject(2);
        const erpMaterialAccountDeterminationRow = new TestDataUtility(testDataERP.oMaterialAccountDeterminationErpTableData).getObject(0);

        const erpMaterialAccountDeterminationRow2 = new TestDataUtility(testDataERP.oMaterialAccountDeterminationErpTableData).getObject(1);

        oMockstar.insertTableData("erpCompanyCode", erpCompanyCode);
        oMockstar.insertTableData("erpPlant", erpPlant);

        const whereCondition = " _VALID_TO is null ";
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination", whereCondition);
        const iRowsPlcTableBeforeTotal = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination");

        jasmine.log("testing trigger when inserting data in erp material account determination table ");
        oMockstar.insertTableData("erpMaterialAccountDetermination", erpMaterialAccountDeterminationRow);
        let iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination", whereCondition);

        let iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 1);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBeforeTotal + 1);

        jasmine.log("testing trigger when update data in erp material account determination table ");
        oMockstar.upsertTableData("erpMaterialAccountDetermination", erpMaterialAccountDeterminationRow);
        oMockstar.upsertTableData("erpMaterialAccountDetermination", erpMaterialAccountDeterminationRow2);
        iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination", whereCondition);
        iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 1);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBefore + 3);

        jasmine.log("testing trigger when deleting data in erp material account determination table ");
        oMockstar.execSingle(`delete from {{erpMaterialAccountDetermination}} where MTART = '${erpMaterialAccountDeterminationRow2.MTART}' `
            + ` and KTOPL = '${erpMaterialAccountDeterminationRow2.KTOPL}' and BWMOD = '${erpMaterialAccountDeterminationRow2.BWMOD}' 
            and BKLAS = '${erpMaterialAccountDeterminationRow2.BKLAS}'`);
        iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination", whereCondition);
        iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "materialAccountDetermination");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBefore + 3);
    });

    it("should copy the data from ERP Currency Conversion Table to PLC Table using trigger", () => {
        // arrange

        // act
        const erpTCURRdata1 = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURR).getObject(0);
        const erpTCURRdata2 = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURR).getObject(1);
        const erpTCURFdata1 = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURF).getObject(0);

        oMockstar.insertTableData("erpCurrencyConversionTCURF", erpTCURFdata1);

        const whereCondition = " _VALID_TO is null ";
        const iRowsPlcTableBefore = mockstarHelpers.getRowCount(oMockstar, "currencyConversion", whereCondition);
        const iRowsPlcTableBeforeTotal = mockstarHelpers.getRowCount(oMockstar, "currencyConversion");

        jasmine.log("testing trigger when inserting data in erp currency conversion table ");
        oMockstar.insertTableData("erpCurrencyConversionTCURR", erpTCURRdata1);
        let iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "currencyConversion", whereCondition);
        let iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "currencyConversion");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 1);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBeforeTotal + 1);

        jasmine.log("testing trigger when update data in erp currency conversion table");
        oMockstar.upsertTableData("erpCurrencyConversionTCURR", erpTCURRdata1);
        oMockstar.upsertTableData("erpCurrencyConversionTCURR", erpTCURRdata2);
        iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "currencyConversion", whereCondition);
        iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "currencyConversion");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore + 1);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBefore + 2);

        jasmine.log("testing trigger when delete data in erp currency conversion table");
        oMockstar.execSingle(`delete from {{erpCurrencyConversionTCURR}} where FCURR = '${erpTCURRdata2.FCURR}' `
            + ` and TCURR = '${erpTCURRdata2.TCURR}' and GDATU_C = '${erpTCURRdata2.GDATU_C}'`);
        iRowsPlcTableAfter = mockstarHelpers.getRowCount(oMockstar, "currencyConversion", whereCondition);
        iRowsPlcTableAfterTotal = mockstarHelpers.getRowCount(oMockstar, "currencyConversion");
        expect(iRowsPlcTableAfter).toBe(iRowsPlcTableBefore);
        expect(iRowsPlcTableAfterTotal).toBe(iRowsPlcTableBefore + 2);
    });

    it("should copy the data from ERP Currency Conversion Table to PLC Table using trigger with negative exchange rates when there is the invers pair in TCURF(for negative rates the factors are switched)", () => {
        // act
        // delete and recreate all triggers; then insert data in erp tables
        //updateTriggers.run(jasmine.dbConnection);

        let erpTCURRdata = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURR).getObject(1);
        erpTCURRdata.UKURS = -5;
        const erpTCURFdata = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURF).getObject(1);
        let erpTCURFdata1 = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURF).getObject(1);;
        erpTCURFdata1.FCURR = erpTCURFdata.TCURR;
        erpTCURFdata1.TCURR = erpTCURFdata.FCURR;
        oMockstar.insertTableData("erpCurrencyConversionTCURF", erpTCURFdata);
        oMockstar.insertTableData("erpCurrencyConversionTCURF", erpTCURFdata1);
        
        jasmine.log("testing trigger when inserting data in erp currency conversion table ");
        
        oMockstar.insertTableData("erpCurrencyConversionTCURR", erpTCURRdata);
        const oCurrencyConversionCreate = oMockstar.execQuery(`select * from {{${"currencyConversion"}}}`);
        
        expect(oCurrencyConversionCreate.columns.FROM_CURRENCY_ID.rows[0]).toEqual(erpTCURRdata.FCURR);
        expect(oCurrencyConversionCreate.columns.TO_CURRENCY_ID.rows[0]).toEqual(erpTCURRdata.TCURR);
        expect(parseFloat(oCurrencyConversionCreate.columns.RATE.rows[0])).toEqual(0.2);
        expect(oCurrencyConversionCreate.columns.FROM_FACTOR.rows[0]).toEqual(erpTCURFdata1.TFACT);
        expect(oCurrencyConversionCreate.columns.TO_FACTOR.rows[0]).toEqual(erpTCURFdata1.FFACT);

        jasmine.log("testing trigger when update data in erp currency conversion table");
        erpTCURRdata.UKURS = -2;
        oMockstar.upsertTableData("erpCurrencyConversionTCURR", erpTCURRdata);
        const oCurrencyConversionUpdate = oMockstar.execQuery(`select * from {{${"currencyConversion"}}}`);
        expect(oCurrencyConversionUpdate.columns.FROM_CURRENCY_ID.rows[1]).toEqual(erpTCURRdata.FCURR);
        expect(oCurrencyConversionUpdate.columns.TO_CURRENCY_ID.rows[1]).toEqual(erpTCURRdata.TCURR);
        expect(parseFloat(oCurrencyConversionUpdate.columns.RATE.rows[1])).toEqual(0.5);
        expect(oCurrencyConversionUpdate.columns.FROM_FACTOR.rows[1]).toEqual(erpTCURFdata1.TFACT);
        expect(oCurrencyConversionUpdate.columns.TO_FACTOR.rows[1]).toEqual(erpTCURFdata1.FFACT);
        
    });
        it("should copy the data from ERP Currency Conversion Table to PLC Table using trigger with negative exchange rates when there is NOT the invers pair in TCURF", () => {
        // act
        // delete and recreate all triggers; then insert data in erp tables
        //updateTriggers.run(jasmine.dbConnection);

        let erpTCURRdata = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURR).getObject(1);
        erpTCURRdata.UKURS = -5;
        const erpTCURFdata = new TestDataUtility(testDataERP.oCurrencyConversionErpDataTCURF).getObject(1);

        oMockstar.insertTableData("erpCurrencyConversionTCURF", erpTCURFdata);
        
        jasmine.log("testing trigger when inserting data in erp currency conversion table ");
        
        oMockstar.insertTableData("erpCurrencyConversionTCURR", erpTCURRdata);
        const oCurrencyConversionCreate = oMockstar.execQuery(`select * from {{${"currencyConversion"}}}`);
        
        expect(oCurrencyConversionCreate.columns.FROM_CURRENCY_ID.rows[0]).toEqual(erpTCURRdata.FCURR);
        expect(oCurrencyConversionCreate.columns.TO_CURRENCY_ID.rows[0]).toEqual(erpTCURRdata.TCURR);
        expect(parseFloat(oCurrencyConversionCreate.columns.RATE.rows[0])).toEqual(0.2);
        expect(oCurrencyConversionCreate.columns.FROM_FACTOR.rows[0]).toEqual(1);
        expect(oCurrencyConversionCreate.columns.TO_FACTOR.rows[0]).toEqual(1);

        jasmine.log("testing trigger when update data in erp currency conversion table");
        erpTCURRdata.UKURS = -2;
        oMockstar.upsertTableData("erpCurrencyConversionTCURR", erpTCURRdata);
        const oCurrencyConversionUpdate = oMockstar.execQuery(`select * from {{${"currencyConversion"}}}`);
        expect(oCurrencyConversionUpdate.columns.FROM_CURRENCY_ID.rows[1]).toEqual(erpTCURRdata.FCURR);
        expect(oCurrencyConversionUpdate.columns.TO_CURRENCY_ID.rows[1]).toEqual(erpTCURRdata.TCURR);
        expect(parseFloat(oCurrencyConversionUpdate.columns.RATE.rows[1])).toEqual(0.5);
        expect(oCurrencyConversionUpdate.columns.FROM_FACTOR.rows[1]).toEqual(1);
        expect(oCurrencyConversionUpdate.columns.TO_FACTOR.rows[1]).toEqual(1);
        
    });

    it("should delete data for customer/vendor - personal data", () => {
        // act
        testTriggerAfterDeletePersonalData("customer", "erpCustomer", testDataERP.oCustomerErpData, 1, ["KUNNR"]);
        testTriggerAfterDeletePersonalData("vendor", "erpVendor", testDataERP.oVendorErpData, 1, ["LIFNR"]);
    });

    it("should not update data for a vendor/customer with VENDOR_ID/CUSTOMER_ID=DELETED", () => {
        // act
        testTriggerAfterUpdatePersonalData("vendor", "erpVendor", testDataERP.oVendorDeletedErpTableData, 0, 1,0);
        testTriggerAfterUpdatePersonalData("customer", "erpCustomer", testDataERP.oCustomerDeletedErpTableData, 0, 1,0);
    });

}).addTags(["Triggers"]);
