const _ = require("lodash");
const Constants = require("../../lib/xs/util/constants");

function generateTestData($) {

    var sMasterdataTimestamp = NewDateAsISOString();
    var sValidFrom = '2015-01-01T15:39:09.691Z';
    var sValidTo = '2015-06-01T15:39:09.691Z';
    var sLanguage = 'EN';

    var iCalculationVersionId = 2809;
    var iSecondVersionId = 4809;
    var iCalculationId = 1978;
    var iSecondCalculationId = 2078;
    var sComponentSplitId = "1";
    var sStandardPriceStrategy = "PLC_STANDARD";
    var sSessionId = 'U000001';
    var sTestUser = 'U000001';
    var sExpectedDate = new Date().toJSON();
    var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON(); //"2011-08-20";
    var sDefaultExchangeRateType = Constants.sDefaultExchangeRateType;

    var oAccount = {
        "ACCOUNT_ID": ['C1', 'C1', 'C2', 'C2', 'C3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oAccountText = {
        "ACCOUNT_ID": ['C1', 'C1', 'C1', 'C1', 'C2', 'C2', 'C2', 'C2'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '1000', '2000', '2000', '2000', '2000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "ACCOUNT_DESCRIPTION": ['Old Acc C1 DE', 'Old Acc C1 EN', 'Acc C1 DE', 'Acc C1 EN', 'Old Acc C2 DE', 'Old Acc C2 EN', 'Acc C2 DE', 'Acc C2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oActivityPrice = {
        "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '3000'],
        "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC3'],
        "ACTIVITY_TYPE_ID": ['AT1', 'AT1', 'AT2', 'AT2', 'AT3'],
        "PROJECT_ID": ["*", "*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*", "*"],
        "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "VALID_TO": [null, null, null, null, null],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "VALID_TO_QUANTITY": [null, null, null, null, null],
        "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
        "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oActivityPriceExt = {
        "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CAPR_DECIMAL_MANUAL": ["11.0000000", "22.0000000", "33.0000000", "44.0000000", "55.0000000"],
        "CAPR_DECIMAL_UNIT": ["EUR", "EUR", "EUR", "EUR", "EUR"]
    };

    var oActivityType = {
        "ACTIVITY_TYPE_ID": ['AT1', 'AT1', 'AT2', 'AT2', 'AT3', 'AT4'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000', '1000'],
        "ACCOUNT_ID": ['C1', 'C1', 'C2', 'C2', 'C3', 'C1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null, null],
        "_SOURCE": [1, 1, 2, 2, 1, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
    };

    var oActivityTypeText = {
        "ACTIVITY_TYPE_ID": ['AT1', 'AT1', 'AT2', 'AT2', 'AT3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE'],
        "ACTIVITY_TYPE_DESCRIPTION": ['Activity type AT1 DE', 'Activity type AT1 EN', 'Activity type AT2 DE', 'Activity type AT2 EN', 'Activity type AT3 DE'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oBusinessArea = {
        "BUSINESS_AREA_ID": ['B1', 'B1', 'B2', 'B2', 'B3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oBusinessAreaText = {
        "BUSINESS_AREA_ID": ['B1', 'B1', 'B2', 'B2', 'B3'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE'],
        "BUSINESS_AREA_DESCRIPTION": ['B1 DE', 'B1 EN', 'B2 DE', 'B2 EN', 'B3 DE'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oCompanyCode = {
        "COMPANY_CODE_ID": ['CC1', 'CC1', 'CC2', 'CC2', 'CC3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "COMPANY_CODE_CURRENCY_ID": ['EUR', 'USD', 'EUR', 'USD', 'USD'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oCompanyCodeText = {
        "COMPANY_CODE_ID": ['CC1', 'CC1', 'CC2', 'CC2', 'CC3'],
        "LANGUAGE": ['EN', 'DE', 'EN', 'DE', 'EN'],
        "COMPANY_CODE_DESCRIPTION": ['Company code CC1 EN', 'Company code CC1 DE', 'Company code CC2 EN', 'Company code CC2 DE', 'Company code CC3 EN'],
        "_VALID_FROM": [sValidTo, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [null, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
    }

    var oControllingArea = {
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '3000'],
        "CONTROLLING_AREA_CURRENCY_ID": ['EUR', 'EUR', 'EUR', 'EUR', 'EUR'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oControllingAreaText = {
        "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '1000', '2000', '2000', '2000', '2000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "CONTROLLING_AREA_DESCRIPTION": ['Controlling Area 1 DE', 'Controlling Area 1 EN', 'Controlling Area 1 DE', 'Controlling Area 1 EN', 'Controlling Area 2 DE', 'Controlling Area 2 EN', 'Controlling Area 2 DE', 'Controlling Area 2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000002', 'U000001']
    };

    var oCostCenter = {
        "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oCostCenterExt = {
        "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CCEN_DATE_MANUAL": ["2015-01-01T00:00:00.000Z", "2015-01-10T00:00:00.000Z", "2015-02-02T00:00:00.000Z", "2015-02-20T00:00:00.000Z", "2015-03-30T00:00:00.000Z"],
    };

    var oCostCenterText = {
        "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC2', 'CCC2'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '1000', '2000', '2000', '2000', '2000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "COST_CENTER_DESCRIPTION": ['Old CostC CCC1 DE', 'Old CostC CCC1 EN', 'CostC CCC1 DE', 'CostC CCC1 EN', 'Old CostC CCC2 DE', 'Old CostC CCC2 EN', 'CostC CCC2 DE', 'CostC CCC2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oCurrency = {
        "CURRENCY_ID": ['EUR', 'USD', 'GBP', 'TST'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        "_VALID_TO": [null, null, null, null],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001']
    };

    var oCurrencyConversion = {
        "EXCHANGE_RATE_TYPE_ID": ['STANDARD', 'STANDARD', 'STANDARD', 'STANDARD'],
        "FROM_CURRENCY_ID": ['EUR', 'EUR', 'GBP', 'GBP'],
        "TO_CURRENCY_ID": ['USD', 'GBP', 'EUR', 'EUR'],
        "FROM_FACTOR": [1, 1, 1, 1],
        "TO_FACTOR": [1, 1, 1, 1],
        "RATE": ["1.0912001", "0.7159001", "1.3969001", "1.0612001"],
        "VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo],
        "_VALID_TO": [null, null, sValidTo, null],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'I318110'],
        "DELETED_FROM_SOURCE": [null, null, 1, null]
    };


    var oExchangeRateType = {
        "EXCHANGE_RATE_TYPE_ID": ['STANDARD', 'VCC'],
        "CREATED_ON": [sValidFrom, sValidFrom],
        "CREATED_BY": ['#CONTROLLER', 'U000002'],
        "LAST_MODIFIED_ON": [sValidFrom, sValidFrom],
        "LAST_MODIFIED_BY": ['#CONTROLLER', 'U000002']
    };

    var oCustomer = {
        "CUSTOMER_ID": ['#CU1', '#CU2', '#CU3', '#CU3', '#CU4'],
        "CUSTOMER_NAME": ['Customer1', 'Customer2', 'Customer31', 'Customer32', 'Customer4'],
        "COUNTRY": ['Romania', 'Germany', 'USA', 'USA', 'China'],
        "POSTAL_CODE": ['111', '222', '333', '333', '444'],
        "REGION": ['Ilfov', 'GermanyReg', 'CA', 'CA', 'WuhanRegion'],
        "CITY": ['Bucharest', 'Dresden', 'Palo Alto', 'Palo Alto', 'Wuhan'],
        "STREET_NUMBER_OR_PO_BOX": ['Addr1', 'Addr2', 'Addr3', 'Addr3', 'Addr4'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [null, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, 1, null, null]
    };

    var oDocument = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT3', 'DT3', 'DT2'],
        "DOCUMENT_ID": ['D1', 'D1', 'D2', 'D2', 'D3'],
        "DOCUMENT_VERSION": ['1', '2', '1', '2', '1'],
        "DOCUMENT_PART": ['1', '1', '1', '1', '1'],
        "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null, null],
        "DOCUMENT_STATUS_ID": ['S1', 'S2', 'S3', 'S3', 'S3'],
        "DESIGN_OFFICE_ID": ['L1', 'L1', 'L1', 'L1', 'L1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oDocumentDelete = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT2', 'DT3', 'DT3'],
        "DOCUMENT_ID": ['D1', 'D2', 'D3', 'D3'],
        "DOCUMENT_VERSION": ['1', '1', '2', '2'],
        "DOCUMENT_PART": ['1', '1', '1', '1'],
        "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null],
        "DOCUMENT_STATUS_ID": ['S1', 'S2', 'S3', 'S3'],
        "DESIGN_OFFICE_ID": ['L1', 'L1', 'L1', 'L1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo],
        "_VALID_TO": [null, null, sValidTo, null],
        "_SOURCE": [2, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000002'],
        "DELETED_FROM_SOURCE": [null, null, null, 1]
    };

    var oDocumentText = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT3', 'DT3', 'DT2'],
        "DOCUMENT_ID": ['D1', 'D1', 'D2', 'D2', 'D3'],
        "DOCUMENT_VERSION": ['1', '2', '1', '2', '1'],
        "DOCUMENT_PART": ['1', '1', '1', '1', '1'],
        "LANGUAGE": ['EN', 'DE', 'EN', 'DE', 'EN'],
        "DOCUMENT_DESCRIPTION": ['Desc DT1 EN', 'Desc DT1 DE', 'Desc DT3 EN', 'Desc DT3 DE', 'Desc DT2 EN'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
    };

    var oDocumentTextDelete = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT2', 'DT3', 'DT3'],
        "DOCUMENT_ID": ['D1', 'D2', 'D3', 'D3'],
        "DOCUMENT_VERSION": ['1', '1', '2', '2'],
        "DOCUMENT_PART": ['1', '1', '1', '1'],
        "LANGUAGE": ['EN', 'DE', 'EN', 'EN'],
        "DOCUMENT_DESCRIPTION": ['Desc DT1 EN', 'Desc DT2 DE', 'Desc DT3 EN', 'Desc DT3 EN'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo],
        "_VALID_TO": [null, null, sValidTo, null],
        "_SOURCE": [2, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000002']
    };

    var oDocumentMaterial = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3'],
        "DOCUMENT_ID": ['D1', 'D1', 'D2', 'D2', 'D3'],
        "DOCUMENT_VERSION": ['V1', 'V2', 'V1', 'V2', 'V3'],
        "DOCUMENT_PART": ['DP1', 'DP1', 'DP1', 'DP1', 'DP3'],
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT1', 'MAT1', 'MAT1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oDocumentMaterialDelete = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3'],
        "DOCUMENT_ID": ['D1', 'D1', 'D2', 'D2', 'D3'],
        "DOCUMENT_VERSION": ['V1', 'V2', 'V1', 'V2', 'V3'],
        "DOCUMENT_PART": ['DP1', 'DP1', 'DP1', 'DP1', 'DP3'],
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT1', 'MAT1', 'MAT1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, sValidTo],
        "_SOURCE": [2, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oDocumentStatus = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3'],
        "DOCUMENT_STATUS_ID": ['S1', 'S1', 'S2', 'S2', 'S3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oDocumentStatusDelete = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3'],
        "DOCUMENT_STATUS_ID": ['S1', 'S1', 'S2', 'S2', 'S3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, sValidTo],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oDocumentStatusText = {
        "DOCUMENT_STATUS_ID": ['S1', 'S1', 'S1', 'S2', 'S2', 'S3'],
        "LANGUAGE": ['EN', 'EN', 'DE', 'EN', 'EN', 'EN'],
        "DOCUMENT_STATUS_DESCRIPTION": ['S1 EN', 'S1 EN', 'S1 DE', 'S2 EN', 'S2 EN', 'S3 EN'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oDocumentType = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null, null],
        "_SOURCE": [1, 1, 2, 2, 1, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oDocumentTypeDelete = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null, sValidTo],
        "_SOURCE": [2, 2, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null, 1]
    };

    var oDocumentTypeText = {
        "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
        "LANGUAGE": ['EN', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "DOCUMENT_TYPE_DESCRIPTION": ['DT1 EN', 'DT1 EN', 'DT1 DE', 'DT2 EN', 'DT3 DE', 'DT3 EN', 'DT4 DE'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom],
        "_VALID_TO": [sValidTo, null, null, sValidTo, null, null, null],
        "_SOURCE": [1, 1, 1, 2, 2, 1, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oDesignOffice = {
        "DESIGN_OFFICE_ID": ['L1', 'L1', 'L2', 'L3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom],
        "_VALID_TO": [sValidTo, null, null, null],
        "_SOURCE": [1, 1, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003']
    };

    var oMaterial = {
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
        "BASE_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
        "MATERIAL_GROUP_ID": ['MG1', 'MG1', 'MG2', 'MG2', 'MG3'],
        "MATERIAL_TYPE_ID": ['MT1', 'MT1', 'MT2', 'MT2', 'MT3'],
        "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null, null],
        "IS_PHANTOM_MATERIAL": [0, 0, 1, 1, 0],
        "IS_CONFIGURABLE_MATERIAL": [0, 0, 0, 0, 1],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oMaterialExt = {
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CMAT_STRING_MANUAL": ['Old String 1', 'Test String 1', 'Old String 2', 'Test String 2', 'Test String 3']
    };

    var oMaterialText = {
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT2', 'MAT2'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "MATERIAL_DESCRIPTION": ['Old MAT1 DE', 'Old MAT1 EN', 'MAT1 DE', 'MAT1 EN', 'Old MAT2 DE', 'Old MAT2 EN', 'MAT2 DE', 'MAT2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oMaterialGroup = {
        "MATERIAL_GROUP_ID": ['MG1', 'MG1', 'MG2', 'MG2', 'MG3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oMaterialGroupText = {
        "MATERIAL_GROUP_ID": ['MG1', 'MG1', 'MG1', 'MG1', 'MG2', 'MG2', 'MG2', 'MG2', 'MG3'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "MATERIAL_GROUP_DESCRIPTION": ['Old MG1 DE', 'Old MG1 EN', 'MG1 DE', 'MG1 EN', 'Old MG2 DE', 'Old MG2 EN', 'MG2 DE', 'MG2 EN', 'MG3 DE'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oMaterialPlant = {
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
        "OVERHEAD_GROUP_ID": ['O1', 'O1', 'O2', 'O2', 'O3'],
        "VALUATION_CLASS_ID": ['V1', 'V1', 'V2', 'V2', 'V3'],
        "MATERIAL_LOT_SIZE": ["10.0000000", "11.0000000", "20.0000000", "22.0000000", "33.0000000"],
        "MATERIAL_LOT_SIZE_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oMaterialPrice = {
        "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
        "VENDOR_ID": ["*", "*", "*", "*", "*"],
        "PROJECT_ID": ["*", "*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*", "*"],
        "PURCHASING_GROUP": [null, null, null, null, null],
        "PURCHASING_DOCUMENT": [null, null, null, null, null],
        "LOCAL_CONTENT": [null, null, null, null, null],
        "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "VALID_TO": [null, null, null, null, null],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "VALID_TO_QUANTITY": [null, null, null, null, null],
        "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
        "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
        "IS_PREFERRED_VENDOR": [0, 0, 0, 0, 0],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oMaterialPriceExt = {
        "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CMPR_BOOLEAN_INT_MANUAL": [1, 1, 1, 1, 1],
        "CMPR_DECIMAL_MANUAL": ["11.0000000", "22.0000000", "33.0000000", "44.0000000", "55.0000000"],
        "CMPR_DECIMAL_UNIT": [null, null, null, null, null],
        "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["111.0000000", "222.0000000", "333.0000000", "444.0000000", "555.0000000"],
        "CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR", "EUR", "EUR", "EUR", "EUR"],
        "CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
        "CMPR_DECIMAL_WITH_UOM_UNIT": ["H", "H", "H", "H", "H"]
    };

    var oMaterialPlantExt = {
        "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CMPL_INTEGER_MANUAL": [10, 11, 20, 22, 33],
    };

    var oMaterialType = {
        "MATERIAL_TYPE_ID": ['MT1', 'MT1', 'MT2', 'MT2', 'MT3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oMaterialTypeText = {
        "MATERIAL_TYPE_ID": ['MT1', 'MT1', 'MT1', 'MT1', 'MT2', 'MT2', 'MT2', 'MT2', 'MT3'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "MATERIAL_TYPE_DESCRIPTION": ['Old MT1 DE', 'Old MT1 EN', 'MT1 DE', 'MT1 EN', 'Old MT2 DE', 'Old MT2 EN', 'MT2 DE', 'MT2 EN', 'MT3 DE'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oMaterialAccountDetermination = {
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "MATERIAL_TYPE_ID": ['MT1', 'MT1', 'MT2', 'MT2', 'MT3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL3'],
        "VALUATION_CLASS_ID": ['V1', 'V1', 'V2', 'V2', 'V3'],
        "ACCOUNT_ID": ['C1', 'C1', 'C2', 'C2', 'C3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oOverheadGroup = {
        "OVERHEAD_GROUP_ID": ['O1', 'O1', 'O2', 'O2', 'O3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oOverheadGroupText = {
        "OVERHEAD_GROUP_ID": ['O1', 'O1', 'O1', 'O1', 'O2', 'O2', 'O2', 'O2'],
        "PLANT_ID": ['PL1', 'PL1', 'PL1', 'PL1', 'PL2', 'PL2', 'PL2', 'PL2'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "OVERHEAD_GROUP_DESCRIPTION": ['Overhead O1 P1 DE', 'Overhead O1 P1 EN', 'Overhead O1 P1 DE', 'Overhead O1 P1 EN', 'Overhead O2 P2 DE', 'Overhead O2 P2 EN', 'Overhead O2 P2 DE', 'Overhead O2 P2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oPlant = {
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL3'],
        "COMPANY_CODE_ID": ['CC1', 'CC1', 'CC2', 'CC2', 'CC3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oPlantText = {
        "PLANT_ID": ['PL1', 'PL1', 'PL1', 'PL1', 'PL2', 'PL2', 'PL2', 'PL2'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "PLANT_DESCRIPTION": ['Plant PL1 DE', 'Plant PL1 EN', 'Plant PL1 DE', 'Plant PL1 EN', 'Plant PL2 DE', 'Plant PL2 EN', 'Plant PL2 DE', 'Plant PL2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    }

    var oPriceSource = {
        "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
        "PRICE_SOURCE_TYPE_ID": [1, 2],
        "CONFIDENCE_LEVEL_ID": [3, 3],
        "DETERMINATION_SEQUENCE": [3, 4],
        "CREATED_ON": [sValidFrom, sValidFrom],
        "CREATED_BY": ['U000001', 'U000001'],
        "LAST_MODIFIED_ON": [sValidFrom, sValidFrom],
        "LAST_MODIFIED_BY": ['U000001', 'U000001']
    };

    var oProcess = {
        "PROCESS_ID": ['P1', 'P1', 'P2', 'P2', 'P3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "ACCOUNT_ID": ['C1', 'C1', 'C2', 'C2', 'C3'],
        "COMMENT": ['Comment P1 1', 'Comment P1 2', 'Comment P2 1', 'Comment P2 2', 'Comment P3 1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oProcessText = {
        "PROCESS_ID": ['P1', 'P1', 'P2', 'P2', 'P3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE'],
        "PROCESS_DESCRIPTION": ['Desc PT1 1', 'Desc PT1 2', 'Desc PT2 1', 'Desc PT2 2', 'Desc PT3 1'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oProfitCenter = {
        "PROFIT_CENTER_ID": ['P1', 'P1', 'P2', 'P2', 'P3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oProfitCenterText = {
        "PROFIT_CENTER_ID": ['P1', 'P1', 'P1', 'P1', 'P2', 'P2', 'P2', 'P2'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '1000', '2000', '2000', '2000', '2000'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "PROFIT_CENTER_DESCRIPTION": ['Profit P1 DE', 'Profit P1 EN', 'Profit P1 DE', 'Profit P1 EN', 'Profit P2 DE', 'Profit P2 EN', 'Profit P2 DE', 'Profit P2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oUom = {
        "UOM_ID": ["ST", "PC", "EA", "M"],
        "DIMENSION_ID": ["DIM1", "DIM1", "NONE", "LENGTH"],
        "NUMERATOR": [1, 1, 1, 1],
        "DENOMINATOR": [1, 1, 1, 1],
        "EXPONENT_BASE10": [1, 1, 0, 0],
        "SI_CONSTANT": ["1.100000", "1.100000", "0.000000", "0.000000"],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        "_VALID_TO": [null, null, null, null],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000002'],
        "DELETED_FROM_SOURCE": [null, null, null, null]
    };

    var oUomText = {
        "UOM_ID": ["ST", "PC", "PC", "M", "M"],
        "LANGUAGE": ["EN", "DE", "EN", "EN", "EN"],
        "UOM_CODE": ["ST", "PC", "PC", "M", "M"],
        "UOM_DESCRIPTION": ["Stone", "Pece", "Piece", "Meters", "Meters"],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo],
        "_VALID_TO": [null, null, null, sValidTo, null],
        "_SOURCE": [1, 1, 1, 1, 1],
        "_CREATED_BY": ['I318110', 'U000001', 'U000001', 'I318110', 'I318110']
    };


    var oDimension = {
        "DIMENSION_ID": ["DIM1", "DIM2"],
        "_VALID_FROM": [sValidFrom, sValidFrom],
        "_VALID_TO": [null, null],
        "_SOURCE": [1, 1]
    };

    var oValuationClass = {
        "VALUATION_CLASS_ID": ['V1', 'V1', 'V2', 'V2', 'V3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000002", 'U000002', 'U000003', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    }

    var oValuationClassText = {
        "VALUATION_CLASS_ID": ['V1', 'V1', 'V1', 'V1', 'V2', 'V2', 'V2', 'V2'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "VALUATION_CLASS_DESCRIPTION": ['Valuation V1 DE', 'Valuation V1 EN', 'Valuation V1 DE', 'Valuation V1 EN', 'Valuation V2 DE', 'Valuation V2 EN', 'Valuation V2 DE', 'Valuation V2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000002', 'U000001', 'U000002', 'U000002', 'U000003']
    }

    var oVendor = {
        "VENDOR_ID": ['V1', 'V2', 'V3', 'V3', 'V4'],
        "VENDOR_NAME": ['N1', 'N2', 'N31', 'N32', 'N4'],
        "COUNTRY": ['C1', 'C2', 'C3', 'C3', 'C4'],
        "POSTAL_CODE": ['1', '1', '2', '2', '3'],
        "REGION": ['A', 'A', 'B', 'B', 'C'],
        "CITY": ['A', 'A', 'C', 'C', 'D'],
        "STREET_NUMBER_OR_PO_BOX": ['1', '2', '3', '4', '5'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [null, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, 1, null, null]
    };

    var oWorkCenter = {
        "WORK_CENTER_ID": ['WC1', 'WC1', 'WC2', 'WC2', 'WC3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL3'],
        "WORK_CENTER_CATEGORY": ['MACHINE', 'MACHINE', 'MACHINE', 'MACHINE', 'MACHINE'],
        "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC3'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '1000'],
        "WORK_CENTER_RESPONSIBLE": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "EFFICIENCY": ["10.0000000", "11.0000000", "20.0000000", "22.0000000", "33.0000000"],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "_VALID_TO": [sValidTo, null, sValidTo, null, null],
        "_SOURCE": [1, 1, 2, 2, 1],
        "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
        "DELETED_FROM_SOURCE": [null, null, null, null, null]
    };

    var oWorkCenterExt = {
        "WORK_CENTER_ID": ['WC1', 'WC1', 'WC2', 'WC2', 'WC3'],
        "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL3'],
        "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
        "CWCE_DECIMAL_MANUAL": ["10.0000000", "11.0000000", "20.0000000", "22.0000000", "33.0000000"],
        "CWCE_DECIMAL_UNIT": [null, null, null, null, null]
    };

    var oWorkCenterText = {
        "WORK_CENTER_ID": ['WC1', 'WC1', 'WC1', 'WC1', 'WC2', 'WC2', 'WC2', 'WC2'],
        "PLANT_ID": ['PL1', 'PL1', 'PL1', 'PL1', 'PL2', 'PL2', 'PL2', 'PL2'],
        "LANGUAGE": ['DE', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'EN'],
        "WORK_CENTER_DESCRIPTION": ['Old WC WC1 DE', 'Old WC WC1 EN', 'WC WC1 DE', 'WC WC1 EN', 'Old WC WC2 DE', 'Old WC WC2 EN', 'WC WC2 DE', 'WC WC2 EN'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidTo, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidTo],
        "_VALID_TO": [sValidTo, sValidTo, null, null, sValidTo, sValidTo, null, null],
        "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 2],
        "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

    var oLanguage = {
        "LANGUAGE": ["EN", "DE", "FR", "ZZ"],
        "TEXTS_MAINTAINABLE": [1, 1, 1, 1],
        "MAPPING_LANGUAGE_ID": ['E', 'D', 'F', 'J'],
        "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        "_VALID_TO": [null, null, null, null],
        "_SOURCE": [1, 1, 1, 2],
        "_CREATED_BY": ["U000", "U000", "U000", "U000"]
    };

    var oError = {
        "FIELD_NAME": [],
        "FIELD_VALUE": [],
        "MESSAGE_TEXT": [],
        "MESSAGE_TIME": [],
        "MESSAGE_TYPE": [],
        "TABLE_NAME": [],
        "OPERATION": [],
        "RUN_ID": []
    };

/////////////////////////////////////// Test data for Replication Data procedure /////////////////////////////////////////////////////////
var mReplCsvFiles = Object.freeze({
    destination_entity : "db.content::t_destination_entity.csv",
    field_mapping : "db.content::t_field_mapping.csv",
    languages : "db.content::t_language.csv",
    currency: "db.content::t_currency.csv",
    uom: "db.content::t_uom.csv",
    uom_mapping: "db.content::t_uom_mapping.csv"
});

var oKna1 = {
    "MANDT": ['800', '800', '800', '800', '800', '800', '100', '800'],
    "KUNNR": ['Customer1', 'CUSTOMER2', 'CUSTOMER3', 'CUSTOMER4', 'CUSTOMER5', 'CUSTOMER6', 'CUSTOMER7', ' CUSTOMER8'],
    "LAND1": ['FRA', 'GRE', 'US', 'GRE', 'FR', 'GT', 'TG', 'TR'],
    "NAME1": ['First', 'Second', 'Third', 'Customer4', 'CUSTOMER5', 'CUSTOMER6', 'CUSTOMER7', 'CUSTOMER8'],
    "ORT01": ['Ilfov', 'GermanyReg', 'Adr3', 'Adr4', 'Adr5', 'Adr6', 'Adr7', 'Adr8'],
    "PSTLZ": ['43', '97', '123', '456', '789', '655', '678', '754'],
    "REGIO": ['Ber', 'Dre', 'BRE', 'tst', 'reg', 'ter', 'rds', 'BUS'],
    "STRAS": ['Stras2', 'Stras3', 'Adr3', 'Adr4', 'Adr5', 'Adr6', 'Adr7', 'Adr7'],
    "NAME2": ['Customer1', 'Customer2', 'Customer3', 'Repl', '', '', '', ''],
    "LOEVM": [' ', ' ', ' ', ' ', 'X', ' ', ' ', ' '],
    "CVP_XBLCK": [' ', ' ', ' ', ' ', ' ', 'X', ' ', ' ']
};

var oT023 = {
    "MANDT":['800','800','800','800','100'],
    "MATKL":['MG1','MG2', 'MG3', 'MG4', 'MG5']
};

var oT023t = {
    "MANDT":['800','800','800','800','100','800','800','800','800','100','800','800','800','800','100'],
    "MATKL":['MG1','MG2', 'MG3', 'MG4', 'MG5','MG1','MG2', 'MG3', 'MG4', 'MG5','MG1','MG2', 'MG3', 'MG4', 'MG5'],
    "SPRAS":['E','E','E','E','E','D','D','D','D','D','F','F','F','F','F'],
    "WGBEZ":['MG1 EN','MG2 EN', 'MG3 EN', 'MG4 EN Changed', 'MG5 EN Changed','MG1 DE','MG2 DE', 'MG3 DE', 'MG4 DE Changed', 'MG5 DE Changed','MG1 FR','MG2 FR', 'MG3 FR', 'MG4 FR', 'MG5 FR']
};

var oT134 = {
    "MANDT":['800','800','800','800','100'],
    "MTART":['MT1','MT2', 'MT3', 'MT4', 'MT5']
};

var oT134t = {
    "MANDT":['800','800','800','800','100','800','800','800','800','100','800','800','800','800','100'],
    "MTART":['MT1','MT2', 'MT3', 'MT4', 'MT5','MT1','MT2', 'MT3', 'MT4', 'MT5','MT1','MT2', 'MT3', 'MT4', 'MT5'],
    "SPRAS":['E','E','E','E','E','D','D','D','D','D','F','F','F','F','F'],
    "MTBEZ":['MT1 EN','MT2 EN', 'MT3 EN', 'MT4  Changed', 'MT5 EN Changed','MT1 DE','MT2 DE', 'MT3 DE', 'MT4 DE Changed', 'MT5 DE Changed','MT1 FR','MT2 FR', 'MT3 FR', 'MT4 FR', 'MT5 FR']
};

var oMara = {
    "MANDT":['800', '800', '800', '800', '100'],
    "MATNR":['MAT1','MAT2', 'MAT3', 'MAT4', 'MAT5'],
    "MTART":['MT1','MT4','MT3', 'MT4', 'MT5'],
    "MATKL":['MG1','MG4','MG3','MG4','MG5'],
    "MEINS":['ST','PC','PC','KG','PC'],
    "CADKZ":['','','','X',''],
    "KZKFG":['','','','',''],
    "LVORM":['','','X','','']
};

var oMakt = {
    "MANDT": ['800', '800', '800', '800', '100','800', '800', '800', '800', '100','800', '800', '800', '800', '100'],
    "MATNR": ['MAT1','MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT1','MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT1','MAT2', 'MAT3', 'MAT4', 'MAT5'],
    "SPRAS": ['E','E','E','E','E','D','D','D','D','D','F','F','F','F','F'],
    "MAKTX": ['MAT1 EN','MAT2 EN', 'MAT3 EN', 'MAT4 EN Changed', 'MAT5 EN', 'MAT1 DE','MAT2 DE', 'MAT3 DE', 'MAT4 DE Changed', 'MAT5 DE', 'MAT1 FR','MAT2 FR', 'MAT3 FR', 'MAT4 FR', 'MAT5 FR']
};

var oT025 = {
    "MANDT":['800','800','800','800','100'],
    "BKLAS":['VC1','VC2', 'VC3', 'VC4', 'VC5']
};

var oT025t = {
    "MANDT":['800','800','800','800','100','800','800','800','800','100','800','800','800','800','100'],
    "BKLAS":['VC1','VC2', 'VC3', 'VC4', 'VC5','VC1','VC2', 'VC3', 'VC4', 'VC5', 'VC1','VC2', 'VC3', 'VC4', 'VC5'],
    "SPRAS":['E','E','E','E','E','D','D','D','D','D','F','F','F','F','F'],
    "BKBEZ":['VC1 EN','VC2 EN', 'VC3 EN', 'VC4  Changed', 'VC5 EN Changed','VC1 DE','VC2 DE', 'VC3 DE', 'VC4 DE Changed', 'VC5 DE Changed','VC1 FR','VC2 FR', 'VC3 FR', 'VC4 FR', 'VC5 FR']
};

var oTgsb = {
    "MANDT":['800','800','800','800','100'],
    "GSBER":['BA1','BA2', 'BA3', 'BA4', 'BA5']
};

var oTgsbt = {
    "MANDT":['800','800','800','800','100','800','800','800','800','100','800','800','800','800','100'],
    "GSBER":['BA1','BA2', 'BA3', 'BA4', 'BA5','BA1','BA2', 'BA3', 'BA4', 'BA5', 'BA1','BA2', 'BA3', 'BA4', 'BA5'],
    "SPRAS":['E','E','E','E','E','D','D','D','D','D','F','F','F','F','F'],
    "GTEXT":['BA1 EN','BA2 EN', 'BA3 EN', 'BA4  Changed', 'BA5 EN Changed','BA1 DE','BA2 DE', 'BA3 DE', 'BA4 DE Changed', 'BA5 DE Changed','BA1 FR','BA2 FR', 'BA3 FR', 'BA4 FR', 'BA5 FR']
};

var oT006 = {
    "MANDT": ['800', '800', '800', '800', '100', '800', '800'],
    "MSEHI": ['PC', 'EA', 'MM', 'CM', 'M', 't0', 'CCM'],
    "DIMID": ['AREA', 'AREA', 'AREA', 'AREA', 'AREA', 'AREA', 'SURFAC'],
    "ZAEHL": [1, 1, 1, 1, 1, 1, 1],
    "NENNR": [1, 1, 1, 1, 1, 1, 1],
    "EXP10": [0, 0, 0, 0, 0, 0, 0],
    "ADDKO": ["0.000000", "0.000000", "0.000000", "0.000000", "0.000000", "0.000000", "0.000000"]
};

var oT006a = {
    "MANDT": ['800', '800', '800', '100', '800', '800', '800', '100', '800'],
    "MSEHI": ['PC', 'EA', 'MM', 'CM', 'PC', 'EA', 'MM', 'CM', 'CCM'],
    "SPRAS": ['F', 'F', 'F', 'F', 'E', 'E', 'E', 'E', 'E'],
    "MSEH3": ['PCf', 'EAf', 'mmf', 'cmf', 'PCe', 'EAe', 'mme', 'cme', 'CCM'],
    "MSEHT": ['PC french', 'EA french', 'mm french', 'cm french', 'PC en', 'EA en', 'mm en', 'cm en', 'UOM TST']
};

var oCustomerRepl = {
    "CUSTOMER_ID": ['#CU1', '#CU2', '#CU3', '#CU3', '#CU4', 'CUSTOMER3', 'CUSTOMER4', 'CUSTOMER5'],
    "CUSTOMER_NAME": ['Customer1', 'Customer2', 'Customer31', 'Customer32', 'Customer4', 'Customer3 Repl', 'Customer4 Repl', 'Customer5 Repl'],
    "COUNTRY": ['Romania', 'Germany', 'USA', 'USA', 'China', 'US', 'US', 'US'],
    "POSTAL_CODE": ['111', '222', '333', '333', '444', '123', '456', '789'],
    "REGION": ['Ilfov', 'GermanyReg', 'CA', 'CA', 'WuhanRegion', 'Reg1', 'Reg2', 'Reg3'],
    "CITY": ['Bucharest', 'Dresden', 'Palo Alto', 'Palo Alto', 'Wuhan', 'City1', 'City2', 'City3'],
    "STREET_NUMBER_OR_PO_BOX": ['Addr1', 'Addr2', 'Addr3', 'Addr3', 'Addr4', 'Adr3', 'Adr5', 'Adr6'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null, null]
};

var oMaterialGroupRepl = {
    "MATERIAL_GROUP_ID":['#MG1','#MG2','#MG3','#MG3','MG4','MG5','MG6'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
};

var oMaterialGroupTextRepl = {
    "MATERIAL_GROUP_ID":['#MG1','#MG2','#MG3','#MG3','MG4','MG5','MG6', '#MG1','#MG2','#MG3','#MG3','MG4','MG5','MG6','MG4'],
    "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN', 'DE','DE','DE','DE','DE','DE','DE','FR'],
    "MATERIAL_GROUP_DESCRIPTION":['#MG1 EN','#MG2 EN','#MG3 EN','#MG3 EN','MG4 EN','MG5 EN','MG6 EN', '#MG1 DE','#MG2 DE','#MG3 DE','#MG3 DE','MG4 DE','MG5 DE','MG6 DE','MG4 FR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom,sValidFrom,sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null, null, null, sValidTo, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 2, 2,2,2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001','U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
};

var oMaterialTypeRepl = {
    "MATERIAL_TYPE_ID":['#MT1','#MT2','#MT3','#MT3','MT4','MT5','MT6'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
};

var oMaterialTypeTextRepl = {
    "MATERIAL_TYPE_ID":['#MT1','#MT2','#MT3','#MT3','MT4','MT5','MT6', '#MT1','#MT2','#MT3','#MT3','MT4','MT5','MT6','MT4'],
    "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN', 'DE','DE','DE','DE','DE','DE','DE','FR'],
    "MATERIAL_TYPE_DESCRIPTION":['#MT1 EN','#MT2 EN','#MT3 EN','#MT3 EN','MT4 EN','MT5 EN','MT6 EN', '#MT1 DE','#MT2 DE','#MT3 DE','#MT3 DE','MT4 DE','MT5 DE','MT6 DE','MT4 FR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidTo, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null,null, null, sValidTo, null, null, null,null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 2, 2,2,2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001','U000001', 'U000001', 'U000001']
};

var oMaterialRepl = {
    "MATERIAL_ID": ['#MAT1','#MAT2','#MAT3','#MAT3','MAT4','MAT5','MAT6'],
    "BASE_UOM_ID": ["PC", "PC", "PC", "PC", "PC", "PC", "PC"],
    "MATERIAL_GROUP_ID": ['#MG1', '#MG2', '#MG3', '#MG3', 'MG4', 'MG4','MG4'],
    "MATERIAL_TYPE_ID": ['#MT1', '#MT2', '#MT3', '#MT2', 'MT4', 'MT4', 'MT4'],
    "IS_CREATED_VIA_CAD_INTEGRATION": [1, 1, null, null, null, 1, 1],
    "IS_PHANTOM_MATERIAL": [0, 0, 1, 1, 0, 0, 0],
    "IS_CONFIGURABLE_MATERIAL": [0, 0, 0, 0, 1, 0, 0],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
};

var oMaterialTextRepl = {
    "MATERIAL_ID": ['#MAT1','#MAT2','#MAT3','#MAT3','MAT4','MAT5','MAT6', '#MAT1','#MAT2','#MAT3','#MAT3','MAT4','MAT5','MAT6','MAT4'],
    "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN', 'DE','DE','DE','DE','DE','DE','DE','FR'],
    "MATERIAL_DESCRIPTION":['#MAT1 EN','#MAT2 EN','#MAT3 EN','#MAT3 EN','MAT4 EN','MAT5 EN','MAT6 EN', '#MAT1 DE','#MAT2 DE','#MAT3 DE','#MAT3 DE','MAT4 DE','MAT5 DE','MAT6 DE','MAT4 FR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidTo, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null,null, null, sValidTo, null, null, null,null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 2, 2,2,2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001','U000001', 'U000001', 'U000001']
};

var oUomRepl = {
    "UOM_ID": ["#M", "#PC", "EA", "ML", "#MM", "CM3"],
    "DIMENSION_ID": ["DIM1", "DIM1", "NONE", "NONE", "LENGTH", "AREA"],
    "NUMERATOR": [1, 1, 1, 1, 1, 1],
    "DENOMINATOR": [1, 1, 1, 1, 1, 1],
    "EXPONENT_BASE10": [1, 1, 1, 0, 0, 0],
    "SI_CONSTANT": ["1.100000", "1.100000", "1.100000", "0.000000", "0.000000", "0.000000"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 1, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000002', 'U000002', 'U000002'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
};

var oUomTextRepl = {
    "UOM_ID": ["#M", "#PC", "EA", "ML", "#M", "#PC", "EA", "ML", "CM3", "EA"],
    "LANGUAGE": ["EN", "EN", "EN", "EN", "DE", "DE", "DE", "DE", "EN", "FR"],
    "UOM_CODE": ["m", "PC", "EA", "ml", "mG", "PCG", "EAG", "mlG", "CCM", "EAf"],
    "UOM_DESCRIPTION": ["Meter", "Piece", "Each", "Milliliter", "Meter Germ", "Piece Germ", "Each Germ", "Milliliter Germ", "UOM STUCK", "EA french"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null, null, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 1, 1, 2, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001']
};

var oValuationClassRepl = {
    "VALUATION_CLASS_ID":['#VC1','#VC2','#VC3','#VC3','VC4','VC5','VC6'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
};

var oValuationClassTextRepl = {
    "VALUATION_CLASS_ID":['#VC1','#VC2','#VC3','#VC3','VC4','VC5','VC6','#VC1','#VC2','#VC3','#VC3','VC4','VC5','VC6','VC4'],
    "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN', 'DE','DE','DE','DE','DE','DE','DE','FR'],
    "VALUATION_CLASS_DESCRIPTION":['#VC1 EN','#VC2 EN','#VC3 EN','#VC3 EN','VC4 EN','VC5 EN','VC6 EN', '#VC1 DE','#VC2 DE','#VC3 DE','#VC3 DE','VC4 DE','VC5 DE','VC6 DE','VC4 FR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidTo, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null,null, null, sValidTo, null, null, null,null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 2, 2,2,2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001','U000001', 'U000001', 'U000001']
};

var oBusinessAreaRepl = {
    "BUSINESS_AREA_ID":['#BA1','#BA2','#BA3','#BA3','BA4','BA5','BA6'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null, null]
};

var oBusinessAreaTextRepl = {
    "BUSINESS_AREA_ID":['#BA1','#BA2','#BA3','#BA3','BA4','BA5','BA6', '#BA1','#BA2','#BA3','#BA3','BA4','BA5','BA6','BA4'],
    "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN', 'DE','DE','DE','DE','DE','DE','DE','FR'],
    "BUSINESS_AREA_DESCRIPTION":['#BA1 EN','#BA2 EN','#BA3 EN','#BA3 EN','BA4 EN','BA5 EN','BA6 EN', '#BA1 DE','#BA2 DE','#BA3 DE','#BA3 DE','BA4 DE','BA5 DE','BA6 DE','BA4 FR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom,sValidTo, sValidTo, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom,sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null, null, null,null, null, sValidTo, null, null, null,null,null],
    "_SOURCE": [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 2, 2,2,2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001','U000001', 'U000001', 'U000001']
};

var oSchedlog = {
    "RUN_ID": ['NON_CLUSTERED1606117560948', 'NON_CLUSTERED160611756088'],
    "SCHED_NAME": ['schedulerFactoryBean', 'schedulerFactoryBean'],
    "JOB_NAME": ['replication_job', 'replication_job'],
    "JOB_GROUP": ['NO_TENANT', 'NO_TENANT'],
    "STATE": ['DONE', 'RUNNING'],
    "FIRED_TIME": ['2015-01-01T00:00:00.000Z', '2020-11-25T00:00:00.000Z'],
    "FINISHED_TIME": ['2015-01-02T00:00:00.000Z', '2020-11-25T00:00:00.000Z']
};

var oCompanyCodeRepl = {
    "COMPANY_CODE_ID": ['#CC1', '#CC2', '#CC3', 'CC7'],
    "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA2', '#CA3'],
    "COMPANY_CODE_CURRENCY_ID": ['EUR', 'USD', 'EUR', 'USD'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, sValidTo, null, null],
    "_SOURCE": [1, 1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null]
};

var oPlantRepl = {
    "PLANT_ID" : ['#PL1' , '#PL2', 'PL3', 'PL4', 'PL5'],
    "COMPANY_CODE_ID" : ['#CC1', '#CC1','#CC2', '#CC1', '#CC1'],
    "COUNTRY" : ['SPA', 'GER','IT', 'FR', 'DE'],
    "POSTAL_CODE" : ['4324', '2345', '2654', '2345', '6783'],
    "REGION" : ['REG1', 'REG3','REG4', 'REG5', 'REG6'],
    "CITY" : ['Berlin', 'Bucharest','Paris', 'Madrid', 'Paris'],
    "STREET_NUMBER_OR_PO_BOX" : ['4', '3','2', '1', '32'],
    "_VALID_FROM" : ['2020-01-01T15:39:09.691Z', '2019-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z'],
    "_VALID_TO" : [null, '2020-05-25T15:39:09.691Z', null, null, null],
    "_SOURCE" :[1, 1, 2, 2, 2],
    "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000003'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oPlantRplText = {
    "PLANT_ID":['#PL1','#PL1','#PL1','#PL1','PL7'],
    "LANGUAGE":['EN','DE','JA-JP','ZH-HANS','EN'],
    "PLANT_DESCRIPTION":['PL1 EN','PL1 DE','PL1 JA-JP', 'PL1 ZH-HANS','PL7 EN'],
    "_VALID_FROM": ['2020-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z', '2020-01-01T15:39:09.691Z','2020-01-01T15:39:09.691Z','2020-01-01T15:39:09.691Z'],
    "_VALID_TO": [null, null, null, null,null],
    "_SOURCE": [1, 1, 1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001']
};

var oT001w = {
    "MANDT" : ['800', '800' , '800', '800', '800', '800', '800', '100'],
    "WERKS" : ['PL3', 'PL4', 'pl8', 'ZP\7', 'ZPL8', 'PL6', 'PL9', 'PLS'],
    "STRAS" : ['555', '666', 'stras1', 'stras4', 'stras5', 'str7', 'str8', 'str9'],
    "PSTLZ" : ['2654', '2345', '876', '875', '765', '888', '999', '562'],
    "ORT01" : ['Praga', 'Barcelona','Berlin', null, null, 'Paris', 'Praga', 'Cluj'],
    "LAND1" : ['IT', 'DE', 'RO', 'DE', 'FR', 'FR', 'RO', 'SP'],
    "REGIO" : ['TST', 'RG5','RG7', 'RG0', 'RG1', 'RG3', 'RG7', 'RG9'],
    "BWKEY" : ['100', '200', '300', '100', '800', '400','900', '100'],
    "NAME1" : ['Plant Description', 'Plant Description', 'Plant Description', 'Bad Plant', 'Plant', 'Plant Description', 'Plant Description', 'Plant Test9']
};

var oT001k = {
    "MANDT" : ['800', '800' , '800', '800', '800', '800', '800', '800'],
    "BUKRS" : ['#CC2', '#CC1', '#CC3','#CC3', '#CC2', '#CC1', '#CC2', 'CC8'],
    "BWKEY" : ['100', '200', '300', '400', '500', '600', '700', '900']
};

var oReplRunCustomer = {
    "RUN_ID": ['NON_CLUSTERED160611756088'],
    "MANUAL": [1],
    "USER_ID": ['TEST_USER_1'],
    "START_TIME": ['2015-01-01T00:00:00.000Z'],
    "END_TIME": ['2015-01-01T00:00:00.000Z'],
    "LAST_UPDATE_TIME": ['2015-01-01T00:00:00.000Z'],
    "STATUS": ['SUCCESS']
}; 

var oStatisticsCustomer = {
    "TABLE_NAME": ['t_customer'],
    "START_TIME": ['2015-01-01T00:00:00.000Z'],
    "FULL_COUNT": [4],
    "UPDATED_COUNT": [4],
    "DELETED_COUNT": [1],
    "END_TIME": ['2015-01-01T00:00:00.000Z'],
    "RUN_TIME_SECONDS": [''],
    "RUN_ID": ['NON_CLUSTERED160611756088']
}; 

var oReplLogCustomer = {
    "TABLE_NAME": ['', 't_customer', ''],
    "MESSAGE_TIME": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
    "FIELD_NAME": ['', 'CUSTOMER_ID', ''],
    "FIELD_VALUE": ['', 'CUSTOMER5', ''],
    "MESSAGE_TEXT": ['Replication started', 'Changed to PLC source', 'Replication ended'],
    "MESSAGE_TYPE": ['INFO', 'INFO', 'INFO'],
    "OPERATION": ['Replication_Process', 'Replication_Delete', 'Replication_Process'],
    "RUN_ID": ['NON_CLUSTERED160611756088', 'NON_CLUSTERED160611756088', 'NON_CLUSTERED160611756088']
}; 

var oTKA02 = {
    MANDT: ['800', '800', '100', '800', '100', '800'],
    BUKRS: ['#CC1', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6'],
    KOKRS: ['#CA1', '#CA1', '#CA2', '#CA2', '#CA3', '#CA3'],
    GSBER: ['','','','','','']
};

var oT001 = {
    MANDT: ['800', '800', '800', '800', '100', '800'],
    BUKRS: ['#CC1', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6'],
    WAERS: ['EUR', 'EUR', 'USD', 'EUR', 'RON', 'EUR'],
    BUTXT: ['#CC1 Changed', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6']
};

var oCompanyCodeRepl = {
    "COMPANY_CODE_ID": ['#CC1', '#CC2', '#CC3', 'CC7'],
    "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA2', '#CA3'],
    "COMPANY_CODE_CURRENCY_ID": ['EUR', 'USD', 'EUR', 'USD'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, sValidTo, null, null],
    "_SOURCE": [1, 1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null]
};

var oCompanyCodeTextRepl = {
    "COMPANY_CODE_ID": ['#CC1', '#CC2', '#CC3', 'CC7', '#CC1', '#CC2', '#CC3', 'CC7'],
    "LANGUAGE": ['EN', 'EN', 'EN', 'EN', 'DE', 'DE', 'DE', 'DE'],
    "COMPANY_CODE_DESCRIPTION": ['#CC1', '#CC2', '#CC3', 'CC7', '#CC1', '#CC2', '#CC3', 'CC7'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, sValidTo, null, null, null, sValidTo, null, null],
    "_SOURCE": [1, 1, 1, 2, 1, 1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000001', 'U000001', 'U000001', 'U000002', 'U000001']
};

var oTKA01 = {
    MANDT: ['800', '800', '800', '800', '800', '100', '800'],
    KOKRS: ['#CA1', 'CA2', 'CA3', 'CA4', 'CA5', 'CA6', 'CA7'],
    WAERS: ['USD', 'EUR', 'USD', 'EUR', 'USD', 'USD', 'RON'],
    BEZEI: ['CA1 From Repl', 'CA2 From Repl', 'CA3 From Repl', 'CA4 From Repl', 'CA5 From Repl', 'CA6 From Repl', 'CA7 From Repl'],
    KTOPL: ['#CA1', 'CA2', 'CA3', 'CA4', 'CA5', 'CA6', 'CA7']
};

var oControllingAreaRepl = {
    "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '#CA3', 'CA5', 'CA7'],
    "CONTROLLING_AREA_CURRENCY_ID": ['EUR', 'EUR', 'USD', 'EUR', 'EUR'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oControllingAreaTextRepl = {
    "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '#CA3', 'CA5', 'CA7', '#CA1', '#CA2', '#CA3', 'CA5', 'CA7'],
    "LANGUAGE": ['DE', 'DE', 'DE', 'DE', 'DE', 'EN', 'EN', 'EN', 'EN', 'EN'],
    "CONTROLLING_AREA_DESCRIPTION": ['#CA1', '#CA2', '#CA3', 'CA5', 'CA7', '#CA1', '#CA2', '#CA3', 'CA5', 'CA7'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, sValidTo, null, null, null, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001']
};

var oVendorReplTool = {
    "VENDOR_ID": ['#V1', '#V2', 'V3', '#V4'],
    "VENDOR_NAME": ['Ven1', 'Ven2', 'Ven3', 'Delete Vendor'],
    "COUNTRY": ['C1', 'C2', 'C3', 'C3'],
    "POSTAL_CODE": ['1', '2', '3', '4'],
    "REGION": ['A', 'C', 'D', 'B'],
    "CITY": ['Paris', 'Berlin', 'Constanta', 'Bucharest'],
    "STREET_NUMBER_OR_PO_BOX": ['1', '2', '3', '4'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo],
    "_VALID_TO": [null, null, null, null],
    "_SOURCE": [1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, ]
};

var oLfa1 = {
    "MANDT": ['800', '800', '800', '800', '100','800', '800'],
    "LIFNR": ['V3', 'v5', 'V6', '#\3', 'N4', 'V8', 'v9'],
    "LAND1": ['L3', 'L4', 'L5', 'L6', 'L7','L3', 'L4'],
    "NAME1": ['Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor', 'Vendor'],
    "ORT01": ['Praga', 'Cluj', 'London', 'Sibiu', 'Paris', 'Cluj', 'London'],
    "PSTL2": ['55', '33', '88', '22', '88', '33', '88'],
    "REGIO": ['1', '2', '3', '4', '5', '2', '3'],
    "STRAS": ['stras1', 'stras2', 'stras3', 'stras5', 'stras4', 'stras2', 'stras3'],
    "NAME2": ['3', '5', '5', '2', 'n4', '5', '5'],
    "NAME3": ['name', 'name', 'name', 'name', 'name', 'name', 'name'],
    "NAME4": ['U000001', 'U000002', 'U000001', 'U000001', 'U000001', 'U000002', 'U000001'],
    "LOEVM": [' ', ' ', ' ', ' ', ' ', 'X', ' '],
    "CVP_XBLCK": [' ', ' ', ' ', ' ', ' ', ' ', 'X']
};

var dCurrentDate = new Date();
var sDATBI = new Date(dCurrentDate.setFullYear(dCurrentDate.getFullYear() + 1)).toISOString();
var oCSKB = {
    KSTAR: ['#AC1', 'AC2', 'AC3', 'AC4', 'AC5'],
    KOKRS: ['#CA1', '#CA2', 'CA5', '#CA1', 'CA7'],
    DATBI: [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
    MANDT: ['800', '800', '800', '800', '100']
};

var oCSKU = {
    MANDT: ['800', '800', '800', '800', '100', '800', '800', '800', '800', '100'],
    KSTAR: ['#AC1', '#AC2', 'AC3', 'AC4', 'AC5', '#AC1', '#AC2', 'AC3', 'AC4', 'AC5'],
    KTOPL: ['#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1'],
    SPRAS: ['E', 'E', 'E', 'E', 'E', 'D', 'D', 'D', 'J', 'J'],
    KTEXT: ['#AC1 Repl', '#AC2 Repl', 'AC3 Repl', 'AC4 Repl', 'AC5 Repl', '#AC1 Repl', '#AC2 Repl', 'AC3 Repl', 'AC4 Repl', 'AC5 Repl']
};

var oAccountRepl = {
    "ACCOUNT_ID": ['#AC1', '#AC1', '#AC2', 'AC4', 'AC8'],
    "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '#CA1', 'CA5', '#CA1'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null,, null, null],
    "_SOURCE": [2, 1, 2, 1, 2],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oAccountTextRepl = {
    "ACCOUNT_ID": ['#AC1', '#AC3', '#AC2', 'AC4', 'AC8', '#AC1', '#AC3', '#AC2', 'AC4', 'AC8'],
    "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1', '#CA1'],
    "LANGUAGE": ['EN', 'EN', 'EN', 'EN', 'EN', 'DE', 'DE', 'DE', 'DE', 'DE'],
    "ACCOUNT_DESCRIPTION": ['#AC1', '#AC3', '#AC2', 'AC4', 'AC8', '#AC1', '#AC3', '#AC2', 'AC4', 'AC8'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001', 'U000001', "U000001", 'U000001', 'U000001', 'U000001'],
};

var oTCK14 = {
    MANDT: ['800', '800', '800', '800', '800', '800', '800', '100', '800', '800'],
    BWKEY: ['100', '200', '300', '100', '800', '400', '900', '100', '800', '700'],
    KOSGR: ['OG1', 'OG2', 'OG3', 'OG4', 'OG5', 'OG6', 'OG7', 'OG8', 'OG9', 'OG0']
};

var oT001w_TCK14 = {
    "MANDT": ['800', '800', '800', '800', '100', '100', '800'],
    "WERKS": ['#PT1', '#PT2', '#PT3', '#PT4', '#PT4', '#PT1', 'PT2'], 
    "STRAS": ['555', '666', 'stras1', 'stras4', 'str9', 'stras3', 'stras2'],
    "PSTLZ": ['2654', '2345', '876', '875', '562', '561','89'],
    "ORT01": ['Praga', 'Barcelona', 'Berlin', null, 'Cluj', 'Berlin','Paris'],
    "LAND1": ['IT', 'DE', 'RO', 'DE', 'SP', 'DE','FR'],
    "REGIO": ['TST', 'RG5', 'RG7', 'RG0', 'RG9', 'RG0','FR1'],
    "BWKEY": ['100', '200', '300', '100', '100', '200','700'],
    "NAME1": ['Plant Description', 'Plant Description', 'Plant Description', 'Bad Plant', 'Plant Test9', 'Plant Test0','Plant tst']
};

var oTCK15 = {
    MANDT: ['800', '800', '800', '800'],
    BWKEY: ['100', '100', '100', '200'],
    KOSGR: ['OG5', 'OG8', 'OG1', 'OG2'], 
    SPRAS: ['E', 'E', 'D', 'D'], 
    TXZSCHL: ['Overhead New', 'Overhead Group 4', 'Overhead Group 3', 'Overhead Group 4'] 
};

var oOverheadGroupReplForText = {
    "OVERHEAD_GROUP_ID": ['OG8', 'OG1', 'OG2', '#OG4', 'OG5', 'OG5'],
    "PLANT_ID": ['#PT1', '#PT1', '#PT2', '#PT4', '#PT1', '#PT4'],
    "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [2, 2, 2, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
};


var oOverheadGroupRepl = {
    "OVERHEAD_GROUP_ID": ['#OG1', '#OG2', '#OG3', '#OG4', 'OG5'],
    "PLANT_ID": ['#PT2', '#PT1', '#PT3', '#PT4', '#PT2'],
    "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
    "_VALID_TO": [null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oOverheadGroupTextRepl = {
    "OVERHEAD_GROUP_ID": ['#OG1', '#OG3', 'OG5'],
    "PLANT_ID": ['#PT2', '#PT3', '#PT1'],
    "LANGUAGE": ['DE', 'EN', 'EN'],
    "OVERHEAD_GROUP_DESCRIPTION": ['Overhead O1 P1 EN', 'Overhead O1 P1 DE', 'Overhead Old'],
    "_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
    "_VALID_TO": [null, null, null],
    "_SOURCE": [1, 1, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003']
};

var oCSKS = {
    "MANDT": ["800", "800", "800", "800", "800"],
    "KOKRS": ["#CA1", "#CA1", "#CA2", "#CA1", "#CA"],
    "KOSTL": ["CC3", "CC4", "cc5", "0CC7", "CC10"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI]
}

var oCSKT = {
    "MANDT": ["800", "800", "800", "800"],
    "KOKRS": ["#CA1", "#CA2", "#CA1", "#CA1"],
    "KOSTL": ["CC4", "CC5", "CC7", "CC6"],
    "SPRAS": ["D", "J", "D", "E"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI],
    "KTEXT": ["CC4 DE upd", "CC5 JA-JP", "CC7 DE", "CC6 EN"]
}

var oCostCenterRepl = {
    "COST_CENTER_ID": ["#CC1", "#CC2", "CC4", "CC6"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA2", "#CA1", "#CA1"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null],
    "_SOURCE": [1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null]
}

var oCostCenterTextRepl = {
    "COST_CENTER_ID": ["#CC1", "#CC2", "#CC1", "#CC2", "CC4", "CC3"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA2", "#CA1", "#CA2", "#CA1", "#CA2"],
    "LANGUAGE": ["EN", "EN", "DE", "DE", "DE", "EN"],
    "COST_CENTER_DESCRIPTION": ["#CC1 EN", "#CC2 EN", "#CC1 DE", "#CC2 DE", "CC4 DE", "CC3 EN"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

var oCSLA = {
    "MANDT": ["800", "800", "800", "800", "800", "800"],
    "KOKRS": ["#CA1", "#CA", "#CA1", "#CA1", "#CA1", "#CA2"],
    "LSTAR": ["AT3", "AT6", "AT7", "AT8", "AT9", "at10"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
    "VKSTA": ["#AC11", "#AC11", "#AC", "#AC11", "#AC11", "#AC11"]
}

var oCSLT = {
    "MANDT": ["800", "800", "800", "800"],
    "KOKRS": ["#CA", "#CA1", "#CA1", "#CA1"],
    "SPRAS": ["E", "E", "D", "D"],
    "LSTAR": ["AT", "AT4", "AT5", "AT"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI],
    "KTEXT": ["AT EN", "AT4 EN upd", "AT5 DE", "AT DE"]
}

var oActivityTypeRepl = {
    "ACTIVITY_TYPE_ID": ["#AT1", "#AT2", "AT3", "AT4", "AT5"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
    "ACCOUNT_ID": ["#AC1", "#AC2", "#AC11", "#AC11", "#AC11"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
}

var oActivityTypeTextRepl = {
    "ACTIVITY_TYPE_ID": ["#AT1", "#AT2", "#AT1", "#AT2", "AT3", "AT4"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
    "LANGUAGE": ["EN", "EN", "DE", "DE", "EN", "EN"],
    "ACTIVITY_TYPE_DESCRIPTION": ["#AT1 EN", "#AT2 EN", "#AT1 DE", "#AT2 DE", "AT3 EN", "AT4 EN"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
}

var oCEPC = {
    "MANDT": ["800", "800", "800", "800", "800"],
    "PRCTR": ["PC3", "PC6", "0PC7", "pc8", "PC9"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
    "KOKRS": ["#CA1", "#CA", "#CA1", "#CA1", "#CA1"]
}

var oCEPCT = {
    "MANDT": ["800", "800", "800", "800"],
    "SPRAS": ["E", "E", "D", "D"],
    "PRCTR": ["PC5", "PC3", "PC5", "PC"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI],
    "KOKRS": ["#CA1", "#CA1", "#CA", "#CA1"],
    "KTEXT": ["PC5 EN", "PC3 EN upd", "PC5 DE", "PC DE"]
}

var oProfitCenterRepl = {
    "PROFIT_CENTER_ID": ["#PC1", "#PC2", "PC3", "PC4", "PC5"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA2", "#CA1", "#CA1", "#CA1"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
}

var oProfitCenterTextRepl = {
    "PROFIT_CENTER_ID": ["#PC1", "#PC2", "#PC1", "#PC2", "PC3", "PC4"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
    "LANGUAGE": ["EN", "EN", "DE", "DE", "EN", "DE"],
    "PROFIT_CENTER_DESCRIPTION": ["#PC1 EN", "#PC2 EN", "#PC1 DE", "#PC2 DE", "PC3 EN", "PC4 DE"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

var oCBPR = {
    "MANDT": ["800", "800", "800", "800", "800"],
    "KOKRS": ["#CA1", "#CA", "#CA1", "#CA1", "#CA1"],
    "PRZNR": ["PR3", "PR5", "PR6", "pr7", "PR8"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI, sDATBI],
    "VKSTA": ["#AC", "#AC11", "0#AC11", "#AC11", "#AC11"]
}

var oCBPT = {
    "MANDT": ["800", "800", "800", "800"],
    "KOKRS": ["#CA1", "#CA1", "#CA", "#CA1"],
    "SPRAS": ["E", "E", "D", "D"],
    "PRZNR": ["PR3", "PR4", "PR3", "PR"],
    "DATBI": [sDATBI, sDATBI, sDATBI, sDATBI],
    "KTEXT": ["PR3 EN", "PR4 EN upd", "PR3 DE", "PR DE"]
}

var oProcessRepl = {
    "PROCESS_ID": ["#PR1", "#PR2", "PR3", "PR4", "PR9"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
    "ACCOUNT_ID": ["#AC11", "#AC11", "#AC11", "#AC11", "#AC11"],
    "COMMENT": ["Comment PR1", "Comment PR2", "Comment PR3", "Comment PR4", "Comment PR9"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
}

var oProcessTextRepl = {
    "PROCESS_ID": ["#PR1", "#PR2", "#PR1", "#PR2", "PR4", "PR9"],
    "CONTROLLING_AREA_ID": ["#CA1", "#CA1", "#CA1", "#CA1", "#CA1", "#CA1"],
    "LANGUAGE": ["EN", "EN", "DE", "DE", "EN", "EN"],
    "PROCESS_DESCRIPTION": ["#PR1 EN", "#PR2 EN", "#PR1 DE", "#PR2 DE", "PR4 EN", "PR9 EN"],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

var oDestionationEntity = {
    "ID": [2, 21, 24, 25, 8, 9],
    "TABLE_NAME": ['t_company_code', 't_currency_conversion', 't_material_price', 't_material_account_determination', 't_process', 't_valuation_class'],
    "LABEL": ['XFLD_DisplayName_CompanyCode', 'XFLD_DisplayName_CurrencyConversion', 'XFLD_DisplayName_MaterialPrice', 'XFLD_DisplayName_MaterialAccountDetermination', 'XFLD_DisplayName_Process', 'XFLD_DisplayName_ValuationClass'],
    "DESCRIPTION": ['XTOL_DescriptionName_CompanyCode', 'XTOL_DescriptionName_CurrencyConversion', 'XTOL_DescriptionName_MaterialPrice', 'XTOL_DescriptionName_MaterialAccountDetermination', 'XTOL_DescriptionName_Process', 'XTOL_DescriptionName_ValuationClass'],
    "INPUT_SQL_DEFAULT": ['TEST', 'TEST', 'TEST', 'TEST', 'TEST', 'TEST'],
    "INPUT_SQL": [null, null, null, null, null, null],
    "IS_REPL_MANDATORY": [0, 0, 0, 0, 0, 0],
    "REPL_STATUS": ['DISABLED', 'DISABLED', 'DISABLED', 'DISABLED', 'DISABLED', 'DISABLED']
}

var oFieldMapping={
    "ID":[1,2,4,5,6,7],
    "TABLE_NAME":['t_account', 't_account','t_account__text','t_account__text', 't_account__text','t_account__text'],
    "COLUMN_NAME":['ACCOUNT_ID','CONTROLLING_AREA_ID','ACCOUNT_DESCRIPTION','ACCOUNT_ID','CONTROLLING_AREA_ID','LANGUAGE'],
    "FIELD_TYPE":['Integer','String','String','String','String','String'],
    "IS_PK":[1,1,1,1,1,1],
    "MAPPED_COLUMN":["test",null,null,"test",null,null],
    "MAPPED_COLUMN_DEFAULT":['KSTAR',null,'KTEXT','KSTAR',null,null],
    "FIELD_ORDER":[2,1,3,1,5,3],
    "IS_MANDATORY":[1,1,1,1,1,1],
    "IS_NULLABLE":[0,1,1,0,1,1],
    "VALIDATION_REGEX":['MASTERDATA',null,'MASTERDATA',null,'MASTERDATA',null],
    "IS_CUSTOM":[0,,0,0,,0],
    "IS_UPPERCASE":[1,1,1,1,1,1],
    "LENGTH":[10,4,1,10,4,null],
    "SCALE":[1,null,null,null,2,null],
    "PRECISION":[null,4,4,null,4,null],
    "DESCRIPTION":[,'XTOL_DescriptionName_ControllingArea','test','', 'XTOL_DescriptionName_ControllingArea', 'XTOL_DescriptionName_Language']
}


var oTDWA = {
    "DOKAR": ["DT5"],
    "MANDT": ["800"]
}

var oTDWAT = {
    "DOKAR": ["DT4", "DT4"],
    "CVLANG": ["E", "D"],
    "DARTXT": ["EN DESC", "DE DESC"],
    "MANDT": ["800", "800"]
}

oDocumentTypeRepl = {
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

oDocumentTypeTextRepl = {
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
    "LANGUAGE": ['EN', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
    "DOCUMENT_TYPE_DESCRIPTION": ['DT1 EN', 'DT1 EN', 'DT1 DE', 'DT2 EN', 'DT2 DE', 'DT3 EN', 'DT4 DE'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

var oTDWS = {
    "DOKAR": ["DT3"],
    "DOKST": ["D5"],
    "MANDT": ["800"]
}

var oTDWST = {
    "DOKST": ["D4", "D4"],
    "CVLANG": ["E", "D"],
    "DOSTX": ["EN DESC", "DE DESC"],
    "MANDT": ["800", "800"]
}

oDocumentStatusRepl = {
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
    "DOCUMENT_STATUS_ID": ['D1', 'D1', 'D2', 'D2', 'D3', 'D4'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

oDocumentStatusTextRepl = {
    "DOCUMENT_STATUS_ID": ['D1', 'D1', 'D1', 'D2', 'D2', 'D3', 'D4'],
    "LANGUAGE": ['EN', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
    "DOCUMENT_STATUS_DESCRIPTION": ['DT1 EN', 'DT1 EN', 'DT1 DE', 'DT2 EN', 'DT2 DE', 'DT3 EN', 'DT4 DE'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

oDocumentRepl = {
    "DOCUMENT_ID": ['D1', 'D1', 'D2', 'D2', 'D3', 'D4'],
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
    "DOCUMENT_STATUS_ID": ['D1', 'D1', 'D2', 'D2', 'D3', 'D4'],
    "DOCUMENT_VERSION": ['V1', 'V1', 'V2', 'V2', 'V3', 'V4'],
    "DOCUMENT_PART": ['P1', 'P1', 'P2', 'P2', 'P3', 'P4'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

oDocumentTextRepl = {
    "DOCUMENT_ID": ['D1', 'D1', 'D1', 'D2', 'D2', 'D3', 'D4'],
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT1', 'DT2', 'DT2', 'DT3', 'DT4'],
    "DOCUMENT_VERSION": ['V1', 'V1', 'V1', 'V2', 'V2', 'V3', 'V4'],
    "DOCUMENT_PART": ['P1', 'P1', 'P1', 'P2', 'P2', 'P3', 'P4'],
    "LANGUAGE": ['EN', 'EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
    "DOCUMENT_DESCRIPTION": ['DT1 EN', 'DT1 EN', 'DT1 DE', 'DT2 EN', 'DT2 DE', 'DT3 EN', 'DT4 DE'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, null, sValidTo, null, null, null],
    "_SOURCE": [1, 1, 1, 2, 2, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
}

var oDRAW = {
    "DOKAR": ["DT3", "DT4"],
    "DOKNR": ["D5", "D4"],
    "DOKVR": ["V5", "V4"],
    "DOKTL": ["P5", "P4"],
    "DOKST": ["D4", "D4"],
    "MANDT": ["800", "800"]
}

var oDRAT = {
    "DOKAR": ["DT4", "DT4"],
    "DOKNR": ["D4", "D4"],
    "DOKVR": ["V4", "V4"],
    "DOKTL": ["P4", "P4"],
    "LANGU": ["E", "D"],
    "DKTXT": ["EN DESC", "DE DESC"],
    "MANDT": ["800", "800"]
}

var oDrad = {
    "MANDT": ["800","800", "800", '800'],
    "DOKAR": ['DT1', 'DT1', 'DT1', 'DT1'], //type id 
    "DOKNR": ['D1', 'D1', 'D2', 'D2'], //doc id
    "DOKVR": ["V4", "V4", 'V5', 'V2'], //doc version 
    "DOKTL": ["P4", "P4", 'P2', 'P2'], //doc part
    "DOKOB": ['MARA', 'MARA', 'MARA', 'MARC'],
    "OBZAE": ["O1", "O2", 'O3', 'O4'],
    "OBJKY": ['#MAT1', '#MAT2', '#MAT1', '#MAT2'], //material id
    "DELFLAG": ["", "", 'X', '']
}

var oTCURR={
    "MANDT":['800','800','800','800'],
    "KURST":['TEST','TEST','TEST','TEST'],
    "GDATU":['79848877','79848877','79848877','79848877'],
    "FCURR":['BRL', 'CAD', 'CHF','TEST'],
    "TCURR":['CAD', 'BRL', 'BRL','TEST'],
    "UKURS":[0.40000,2.40000,3.00000,3.00000]
}

var oTCURF={
    "MANDT":['800','800','800','800'],
    "KURST":['TEST','TEST','TEST','TEST'],
    "GDATU":['79848877','79848877','79848877','79848877'],
    "FCURR":['BRL', 'CAD', 'CHF','TEST'],
    "TCURR":['CAD', 'BRL', 'BRL','TEST'],
    "FFACT":[1,1,1,1],
    "TFACT":[1,1,1,1]
}

var oCurrencyRepl = {
    "CURRENCY_ID": ['BRL','CAD','CHF','CLP','CNY','EUR','GBP','INR','JPY','RUB','USD'],
    "_VALID_FROM": ['2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000'],
    "_VALID_TO": [null, null, null, null, null, null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
};

var oCurrencyConversionRepl = {
    "EXCHANGE_RATE_TYPE_ID": ['STANDARD','STANDARD','STANDARD','STANDARD','STANDARD','STANDARD'],
    "FROM_CURRENCY_ID": ['USD', 'USD', 'USD', 'USD','CHF','USD'],
    "TO_CURRENCY_ID": ['CNY','EUR','GBP','INR','BRL','RUB'],
    "FROM_FACTOR": [1, 1, 1, 1, 1, 1],
    "TO_FACTOR": [1, 1, 1, 1, 1, 1],
    "RATE": ['6.2023500', '0.9164000', '0.6560500', '63.1475000', '3.00000', '52.0305000'],
    "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
    "_VALID_FROM": ['2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000'],
    "_VALID_TO": [null, null, null, null, null, null],
    "_SOURCE": [1, 1, 1, 1, 2, 1],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'I318110', 'I318110', 'I318110'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null, null]
};


var oVendorDeleteProc = {
    "VENDOR_ID": ['#V1', '#V2', 'V3', '#V4'],
    "VENDOR_NAME": ['Ven1', 'Ven2', 'Ven3', 'Delete Vendor'],
    "COUNTRY": ['C1', 'C2', 'C3', 'C3'],
    "POSTAL_CODE": ['1', '2', '3', '4'],
    "REGION": ['A', 'C', 'D', 'B'],
    "CITY": ['Paris', 'Berlin', 'Constanta', 'Bucharest'],
    "STREET_NUMBER_OR_PO_BOX": ['1', '2', '3', '4'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo],
    "_VALID_TO": [null, null, null, null],
    "_SOURCE": [1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, ]
};

var oVendorError = {
    "FIELD_NAME": ['VENDOR_ID', 'VENDOR_ID', 'CUSTOMER_ID'],
    "FIELD_VALUE": ['#V1', '#V2', '#C1'],
    "MESSAGE_TEXT": ['Error', 'Error', 'Error'],
    "MESSAGE_TIME": ['2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000'],
    "MESSAGE_TYPE": ['Error', 'Error', 'Error'],
    "TABLE_NAME": ['t_vendor', 't_item', 't_customer'],
    "OPERATION": ['INSERT', 'INSERT', 'INSERT'],
    "RUN_ID": ['1', '1', '1']
};

var oVendorMaterialPrice = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
    "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
    "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
    "VENDOR_ID": ["#V1", "#V1", "#V2", "#V3", "*"],
    "PROJECT_ID": ["*", "*", "*", "*", "*"],
    "CUSTOMER_ID": ["*", "*", "*", "*", "*"],
    "PURCHASING_GROUP": [null, null, null, null, null],
    "PURCHASING_DOCUMENT": [null, null, null, null, null],
    "LOCAL_CONTENT": [null, null, null, null, null],
    "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
    "VALID_TO": [null, null, null, null, null],
    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "VALID_TO_QUANTITY": [null, null, null, null, null],
    "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
    "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
    "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
    "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
    "IS_PREFERRED_VENDOR": [0, 0, 0, 0, 0],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null],
    "_SOURCE": [1, 1, 2, 2, 1],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oVendorMaterialPriceExt = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "CMPR_BOOLEAN_INT_MANUAL": [1, 1, 1, 1, 1],
    "CMPR_DECIMAL_MANUAL": ["11.0000000", "22.0000000", "33.0000000", "44.0000000", "55.0000000"],
    "CMPR_DECIMAL_UNIT": [null, null, null, null, null],
    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["111.0000000", "222.0000000", "333.0000000", "444.0000000", "555.0000000"],
    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR", "EUR", "EUR", "EUR", "EUR"],
    "CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
    "CMPR_DECIMAL_WITH_UOM_UNIT": ["H", "H", "H", "H", "H"]
};

var oVendorItem = {
    "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
    "CALCULATION_VERSION_ID" : [ 1003, 1003, 1003, 2003, 5809 ],
    "PARENT_ITEM_ID" : [ null, 3001, 3002, null, null ],
    "PREDECESSOR_ITEM_ID" : [ null, 3001, 3002, null, null ],
    "IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
    "ITEM_CATEGORY_ID" : [ 0, 1, 3, 0, 0 ],
    "CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 3, 0, 0 ],
    "ACCOUNT_ID" : [ "0", "0", "625000", "0", "0" ],
    "DETERMINED_ACCOUNT_ID": ["0", "0", "625000", "0", "0"],
    "DOCUMENT_TYPE_ID" : [ null, null, null, null, null ],
    "DOCUMENT_ID" : [ "", "", "", "", "" ],
    "DOCUMENT_VERSION" : [ null, null, null, null, null ],
    "DOCUMENT_PART" : [ null, null, null, null, null ],
    "DOCUMENT_STATUS_ID" : [ null, null, null, null, null ],
    "DESIGN_OFFICE_ID" : [ null, null, null, null, null ],
    "MATERIAL_ID" : [ "", "", "", "", "" ],
    "MATERIAL_TYPE_ID" : [ null, null, null, null, null ],
    "MATERIAL_GROUP_ID" : [ null, null, null, null, null ],
    "ACTIVITY_TYPE_ID" : [ "", "", "", "", "" ],
    "PROCESS_ID" : [ "", "", "", "", "" ],
    "LOT_SIZE" : [ null, null, null, null, null ],
    "LOT_SIZE_IS_MANUAL" : [ null, 1, 1, null, null ],
    "ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", "", "" ],
    "COMPANY_CODE_ID" : [ "", "", "", "", "" ],
    "COST_CENTER_ID" : [ "", "", "", "", "" ],
    "PLANT_ID" : [ "", "", "", "", "" ],
    "WORK_CENTER_ID" : [ "", "", "", "", "" ],
    "BUSINESS_AREA_ID" : [ "", "", "", "", "" ],
    "PROFIT_CENTER_ID" : [ "", "", "", "", "" ],
    "PURCHASING_GROUP" : [ null, null, null, null, null],
    "PURCHASING_DOCUMENT" : [ null, null, null, null, null],
    "LOCAL_CONTENT" : [ null, null, null, null, null],
    "QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "QUANTITY_IS_MANUAL" : [ null, 1, 1, null, null ],
    "QUANTITY_UOM_ID" : [ "PC", "PC", "H", "PC", "PC" ],
    "TOTAL_QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "TOTAL_QUANTITY_UOM_ID" : [ "PC", "PC", "H", "PC", "PC" ],
    "TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1, 1 ],
    "TOTAL_QUANTITY_OF_VARIANTS"  : [ "10.0000000", "12.0000000", "13.0000000", "13.0000000", "14.0000000" ],
    "IS_RELEVANT_TO_COSTING_IN_ERP" : [null,1,null,null,null],
    "BASE_QUANTITY" : ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "BASE_QUANTITY_IS_MANUAL" : [ null, 1, 1, null, null],
    "PRICE_FIXED_PORTION":['0.0000000', '2772.3600000', '2246.8800000', '2590.9600000', '0.0000000'],
    "PRICE_FIXED_PORTION_IS_MANUAL":[0, 0, 1, 0, 0],
    "PRICE_VARIABLE_PORTION":['0.0000000', '0.0000000', '415.6600000', '371.1100000', '0.0000000'],
    "PRICE_VARIABLE_PORTION_IS_MANUAL":[0, 0, 1, 0, 0],
    "PRICE":[null, "2772.3600000", "2662.5400000", "2962.0700000", null],
    "TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR"],
    "PRICE_UNIT":['0.0000000', '100.0000000', '100.0000000', '100.0000000', '0.0000000'],
    "PRICE_UNIT_IS_MANUAL":[0, 0, 1, 0, 0],
    "PRICE_UNIT_UOM_ID":["H","H","H","H","H"],
    "IS_PRICE_SPLIT_ACTIVE":[0, 0, 0, 0, 0],
    "IS_DISABLING_ACCOUNT_DETERMINATION":[0, 0, 0, 0, 0],
    "PRICE_ID":[null,null,'2B0000E0B2BDB9671600A4000936462B',null,null],
    "CONFIDENCE_LEVEL_ID":[null,null,null,null,null],
    "PRICE_SOURCE_ID":["","","","",""],
    "PRICE_SOURCE_TYPE_ID":[null,null,null,null,null],
    "IS_DISABLING_PRICE_DETERMINATION":[null,null,null,null,null],
    "VENDOR_ID":['#V1','#V1','#V2',null,null],
    "TARGET_COST" : [ null, null, null, null, null ],
    "TARGET_COST_IS_MANUAL" : [ 1, 1, 1, 1, 1 ],
    "TARGET_COST_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR"],
    "PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null, null ],
    "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null, null ],
    "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null, null ],
    "OTHER_COST" : [ null, null, null, null, null ],
    "OTHER_COST_FIXED_PORTION" : [ null, null, null, null, null ],
    "OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null, null ],
    "OVERHEAD_GROUP_ID": [null, null, null, null, null],
    "TOTAL_COST" : [ null, null, null, null, null ],
    "TOTAL_COST_FIXED_PORTION" : [ null, null, null, null, null ],
    "TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null, null ],
    "TOTAL_COST_PER_UNIT_FIXED_PORTION":       [ '13.0000000', '6.0000000', '6.0000000', '6.0000000', '6.0000000'],
    "TOTAL_COST_PER_UNIT_VARIABLE_PORTION":    [ '26.0000000', '3.0000000', '3.0000000', '3.0000000', '3.0000000'],
    "TOTAL_COST_PER_UNIT":                     [ '39.0000000', '9.0000000', '9.0000000', '9.0000000', '9.0000000'],
    "VALUATION_CLASS_ID": [null, null, null, null, null],
    "CREATED_ON" : [ sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom ],
    "CREATED_BY" : [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001' ],
    "LAST_MODIFIED_ON" : [ sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom ],
    "LAST_MODIFIED_BY" : [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001' ],
    "ITEM_DESCRIPTION" : [ "", "", "", "", "" ],
    "COMMENT" : [ "1. Comment", "", "", "2. Comment", "3. Comment" ]
};

var oVendorItemTemporary = {
    "ITEM_ID" : [ 1, 2, 1, 2, 1, 2, 3 ],
    "CALCULATION_VERSION_ID" : [ 1039, 1039, 1040, 1040, 1041, 1041, 1041 ],
    "PARENT_ITEM_ID" : [ null, 1, null, 1, null, 1, 1 ],
    "PREDECESSOR_ITEM_ID" : [ null, null, null, null, null, null, null],
    "IS_ACTIVE" : [ 1, 1, 1, 1, 1, 1, 1],
    "ITEM_CATEGORY_ID" : [ 0, 2, 0, 3, 0, 2, 3],
    "CHILD_ITEM_CATEGORY_ID" : [ 0, 2, 0, 3, 0, 2, 3],
    "ACCOUNT_ID" : [ "0", "0", "0", "0", "0", "0", "0" ],
    "DOCUMENT_TYPE_ID" : [ null, null, null, null, null, null, null ],
    "DOCUMENT_ID" : [ "", "", "", "", "", "", "" ],
    "DOCUMENT_VERSION" : [ null, null, null, null, null, null, null ],
    "DOCUMENT_PART" : [ null, null, null, null, null, null, null ],
    "DOCUMENT_STATUS_ID" : [ null, null, null, null, null, null, null],
    "DESIGN_OFFICE_ID" : [ null, null, null, null, null, null, null ],
    "MATERIAL_ID" : [ "", "P-100", "", "", "", "P-100", ""  ],
    "MATERIAL_TYPE_ID" : [ null, null, null, null, null, null, null ],
    "MATERIAL_GROUP_ID" : [ null, null, null, null, null, null, null ],
    "ACTIVITY_TYPE_ID" : [ "", "", "", "AC1", "", "", "AC1" ],
    "PROCESS_ID" : [ "", "", "", "", "", "", "" ],
    "LOT_SIZE" : [ null, null, null, null, null, null, null ],
    "LOT_SIZE_IS_MANUAL" : [ null, 1, null, 1, null, 1, 1 ],
    "ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", "", "", "", "" ],
    "COMPANY_CODE_ID" : [ "", "", "", "", "", "", "" ],
    "COST_CENTER_ID" : [ "", "", "", "", "", "", "" ],
    "PLANT_ID" : [ "", "", "", "", "", "", ""],
    "WORK_CENTER_ID" : [ "", "", "", "", "", "", "" ],
    "BUSINESS_AREA_ID" : [ "", "", "", "", "", "", "" ],
    "PROFIT_CENTER_ID" : [ "", "", "", "", "", "", "" ],
    "PURCHASING_GROUP" : [ null, null, null, null, null, null, null],
    "PURCHASING_DOCUMENT" : [ null, null, null, null, null, null, null],
    "LOCAL_CONTENT" : [ null, null, null, null, null, null, null],
    "QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "QUANTITY_IS_MANUAL" : [ null, 1, null, 1,  null, 1, 1 ],
    "QUANTITY_UOM_ID" : [ null, "PC", null, "PC", null, "PC", "PC" ],
    "TOTAL_QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "TOTAL_QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC", "PC", "PC" ],
    "TOTAL_QUANTITY_DEPENDS_ON" : [ null, 1, null, 1, null, 1, 1],
    "IS_RELEVANT_TO_COSTING_IN_ERP" : [0,0,0,0,0,0,0],
    "BASE_QUANTITY" : [null, "1.0000000", null, "1.0000000", null, "1.0000000", "1.0000000"],
    "BASE_QUANTITY_IS_MANUAL" : [ null, 1,null, 1, null, 1, 1],
    "PRICE_FIXED_PORTION":['0.0000000', '2772.3600000', '0.0000000', '2772.3600000', '0.0000000', '2772.3600000', '2772'],
    "PRICE_FIXED_PORTION_IS_MANUAL":[1, 1, 1, 1, 1, 1, 1],
    "PRICE_VARIABLE_PORTION":['0.0000000', '0.0000000', '0.0000000', '0.0000000', '0.0000000', '0.0000000', '0.0000000'],
    "PRICE_VARIABLE_PORTION_IS_MANUAL":[0, 0, 0, 0, 0, 0, 0],
    "PRICE":[null, "2772.3600000", null, "2772.3600000", null, "2772", "344"],
    "TRANSACTION_CURRENCY_ID":["EUR","EUR","EUR", "EUR","EUR","EUR", "EUR"],
    "PRICE_UNIT":['0.0000000', '100.0000000', '0.0000000', '100.0000000', '0.0000000', '100.0000000', '20.0000000'],
    "PRICE_UNIT_IS_MANUAL":[0, 0, 0, 0, 0, 0, 0],
    "PRICE_UNIT_UOM_ID":["H","H","H","H","H","H","H"],
    "CONFIDENCE_LEVEL_ID":[null,null,,null, null, null, null],
    "PRICE_SOURCE_ID":["","","","","","",""],
    "PRICE_SOURCE_TYPE_ID":[4,1,4,2,4,1,2],
    "IS_DISABLING_PRICE_DETERMINATION":[null,null,null,null, null, null, null],
    "VENDOR_ID":['#V1','#V1','#V2','#V2', null, null, null],
    "TARGET_COST" : [ null, null, null, null, null, null, null ],
    "TARGET_COST_IS_MANUAL" : [ 1, 1, 1, 1, 1, 1, 1 ],
    "TARGET_COST_CURRENCY_ID":["EUR","EUR","EUR","EUR","EUR","EUR","EUR"],
    "PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null, null, null, null ],
    "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
    "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
    "OTHER_COST" : [ null, null, null, null, null, null, null],
    "OTHER_COST_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
    "OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
    "OVERHEAD_GROUP_ID": [null, null, null, null, null, null, null],
    "TOTAL_COST" : [ null, null, null, null, null, null, null ],
    "TOTAL_COST_FIXED_PORTION" : [ null, null, null, null, null, null, null ],
    "TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null, null, null, null ],
    "TOTAL_COST_PER_UNIT_FIXED_PORTION":       [ '13.0000000', '6.0000000', '6.0000000', '6.0000000', '6.0000000', '6.0000000', '6.0000000'],
    "TOTAL_COST_PER_UNIT_VARIABLE_PORTION":    [ '26.0000000', '3.0000000', '3.0000000', '3.0000000', '3.0000000', '3.0000000', '3.0000000'],
    "TOTAL_COST_PER_UNIT":                     [ '39.0000000', '9.0000000', '9.0000000', '9.0000000', '9.0000000', '9.0000000', '9.0000000'],
    "VALUATION_CLASS_ID": [null, null, null, null, null, null, null],
    "CREATED_ON" : [ sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom ],
    "CREATED_BY" : [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001' ],
    "LAST_MODIFIED_ON" : [ sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom ],
    "LAST_MODIFIED_BY" : [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001' ],
    "ITEM_DESCRIPTION" : [ "", "", "", "", "", "", "" ],
    "COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
    "SESSION_ID" : [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001' ],
    "ITEM_DESCRIPTION" : [ "", "", "", "", "", "", ""],
    "COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
    "IS_DIRTY" : [ 0, 0, 0, 0, 0, 0, 0],
    "IS_DELETED" : [ 0, 0, 0, 0, 0, 0, 0 ]
};
var oCustomerDeleteProc = {
    "CUSTOMER_ID": ['#CU1', '#CU2', '#CU3', '#CU3', '#CU4'],
    "CUSTOMER_NAME": ['Customer1', 'Customer2', 'Customer31', 'Customer32', 'Customer4'],
    "COUNTRY": ['Romania', 'Germany', 'USA', 'USA', 'China'],
    "POSTAL_CODE": ['111', '222', '333', '333', '444'],
    "REGION": ['Ilfov', 'GermanyReg', 'CA', 'CA', 'WuhanRegion'],
    "CITY": ['Bucharest', 'Dresden', 'Palo Alto', 'Palo Alto', 'Wuhan'],
    "STREET_NUMBER_OR_PO_BOX": ['Addr1', 'Addr2', 'Addr3', 'Addr3', 'Addr4'],
    "_VALID_FROM": [sValidFrom, sValidFrom, sValidFrom, sValidTo, sValidFrom],
    "_VALID_TO": [null, null, sValidTo, null, null],
    "_SOURCE": [1, 1, 1, 1, 1],
    "_CREATED_BY": ['U000001', 'U000002', 'U000003', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, 1, null, null]
};

var oCustomerError = {
    "FIELD_NAME": ['CUSTOMER_ID', 'VENDOR_ID', 'CUSTOMER_ID'],
    "FIELD_VALUE": ['#CU2', '#V2', '#CU1'],
    "MESSAGE_TEXT": ['Error', 'Error', 'Error'],
    "MESSAGE_TIME": ['2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000', '2000-01-01 00:00:00.000000000'],
    "MESSAGE_TYPE": ['Error', 'Error', 'Error'],
    "TABLE_NAME": ['t_customer', 't_item', 't_customer'],
    "OPERATION": ['INSERT', 'INSERT', 'INSERT'],
    "RUN_ID": ['1', '1', '1']
};

var oCustomerMaterialPrice = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
    "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT2', 'MAT2', 'MAT3'],
    "PLANT_ID": ['PL1', 'PL1', 'PL2', 'PL2', 'PL1'],
    "VENDOR_ID": ["#V1", "#V1", "#V2", "#V3", "*"],
    "PROJECT_ID": ["*", "*", "*", "*", "*"],
    "CUSTOMER_ID": ["#CU1", "#CU1", "#CU2", "#CU2", "*"],
    "PURCHASING_GROUP": [null, null, null, null, null],
    "PURCHASING_DOCUMENT": [null, null, null, null, null],
    "LOCAL_CONTENT": [null, null, null, null, null],
    "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
    "VALID_TO": [null, null, null, null, null],
    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "VALID_TO_QUANTITY": [null, null, null, null, null],
    "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
    "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
    "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
    "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
    "IS_PREFERRED_VENDOR": [0, 0, 0, 0, 0],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null],
    "_SOURCE": [1, 1, 2, 2, 1],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oCustomerMaterialPriceExt = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "CMPR_BOOLEAN_INT_MANUAL": [1, 1, 1, 1, 1],
    "CMPR_DECIMAL_MANUAL": ["11.0000000", "22.0000000", "33.0000000", "44.0000000", "55.0000000"],
    "CMPR_DECIMAL_UNIT": [null, null, null, null, null],
    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["111.0000000", "222.0000000", "333.0000000", "444.0000000", "555.0000000"],
    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR", "EUR", "EUR", "EUR", "EUR"],
    "CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
    "CMPR_DECIMAL_WITH_UOM_UNIT": ["H", "H", "H", "H", "H"]
};

var oCustomerActivityPrice = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE", "PLC_STANDARD_PRICE"],
    "CONTROLLING_AREA_ID": ['1000', '1000', '2000', '2000', '3000'],
    "COST_CENTER_ID": ['CCC1', 'CCC1', 'CCC2', 'CCC2', 'CCC3'],
    "ACTIVITY_TYPE_ID": ['AT1', 'AT1', 'AT2', 'AT2', 'AT3'],
    "PROJECT_ID": ["*", "*", "*", "*", "*"],
    "CUSTOMER_ID": ["#CU1", "#CU1", "#CU2", "#CU2", "*"],
    "VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
    "VALID_TO": [null, null, null, null, null],
    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "VALID_TO_QUANTITY": [null, null, null, null, null],
    "PRICE_FIXED_PORTION": ["10.0000000", "20.0000000", "30.0000000", "40.0000000", "50.0000000"],
    "PRICE_VARIABLE_PORTION": ["1.0000000", "2.0000000", "3.0000000", "4.0000000", "5.0000000"],
    "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
    "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 0],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "_VALID_TO": [sValidTo, null, sValidTo, null, null],
    "_SOURCE": [1, 1, 2, 2, 1],
    "_CREATED_BY": ['U000001', "U000001", 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [null, null, null, null, null]
};

var oCustomerActivityPriceExt = {
    "PRICE_ID": ["2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidTo, sValidFrom],
    "CAPR_DECIMAL_MANUAL": ["11.0000000", "22.0000000", "33.0000000", "44.0000000", "55.0000000"],
    "CAPR_DECIMAL_UNIT": ["EUR", "EUR", "EUR", "EUR", "EUR"]
};

var oCustomerCalculationVersion = {
    "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId, 5809 ],
    "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId, 5078 ],
    "CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
    "CALCULATION_VERSION_TYPE" : [ 1, 1, 1 ],
    "ROOT_ITEM_ID" : [ 3001, 5001, 7001 ],
    "CUSTOMER_ID" : [ "#CU1", "#CU1", "" ],
    "SALES_PRICE" : ["20.0000000", "10.0000000", "10.0000000" ],
    "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
    "REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR" ],
    "COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM" ],
    "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId ],
    "SALES_DOCUMENT" : ["DOC", "DOC", "DOC"],
    "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
    "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
    "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestamp, sMasterdataTimestamp, sMasterdataTimestamp ],
    "IS_FROZEN" : [ 0, 0, 0 ],
    "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ],
    "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ]
};

var oCustomerCalculationVersionTemporary = _.extend(JSON.parse(JSON.stringify(oCustomerCalculationVersion)), {
    "SESSION_ID" : [ sSessionId, sSessionId, sSessionId ]
});

var oCustomerProject = {
    "PROJECT_ID":               ["PR1",                     "PR2",                      "PRR"],
    "ENTITY_ID":                [1,                          2,                           3],
    "REFERENCE_PROJECT_ID":     ["0",                       "0",                        "0"],
    "PROJECT_NAME":             ["Prj 1",                   "Prj 2",                    "Prj 3"],
    "PROJECT_RESPONSIBLE":      [sTestUser,                 sTestUser,                  sTestUser],
    "CONTROLLING_AREA_ID":      ['#CA1',                    '#CA1',                     '#CA2'],
    "CUSTOMER_ID":              ['#CU1',                      '#CU1',                       '#CU2'],
    "SALES_DOCUMENT":           ["SD1",                     "SD1",                      "SD1"],
    "SALES_PRICE":              ['20.0000000', '10.0000000', '10.0000000'],
    "SALES_PRICE_CURRENCY_ID":  ["EUR",                     "EUR",                      "EUR"],
    "COMMENT":                  ["Comment 1",               "Comment 2",                "Comment 3"],
    "COMPANY_CODE_ID":          ["CC1",                     "CC1",                      "CC1"],
    "PLANT_ID":                 ["PL1",                     "PL1",                      "PL1"],
    "BUSINESS_AREA_ID":         ["B1",                      "B1",                       "B1"],
    "PROFIT_CENTER_ID":         ["P4",                      "P4",                       "P4"],
    "REPORT_CURRENCY_ID":       ["EUR",                     "EUR",                      "EUR"],
    "COSTING_SHEET_ID":         ["COGM",                    "COGM",                     "COGM"],
    "COMPONENT_SPLIT_ID":       [sComponentSplitId,         sComponentSplitId,          sComponentSplitId],
    "START_OF_PROJECT":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "END_OF_PROJECT":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "START_OF_PRODUCTION":      [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "END_OF_PRODUCTION":        [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "VALUATION_DATE":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "LIFECYCLE_VALUATION_DATE": [sExpectedDateWithoutTime,                      null,                       null],
    "LIFECYCLE_PERIOD_INTERVAL":[12,                        12,                         12],
    "CREATED_ON":               [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "CREATED_BY":               [sTestUser,                 sTestUser,                  sTestUser],
    "LAST_MODIFIED_ON":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
    "LAST_MODIFIED_BY":         [sTestUser,                 sTestUser,                  sTestUser],
    "EXCHANGE_RATE_TYPE_ID":    ["BUY",                     sDefaultExchangeRateType,   "null"],
    "MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy,    sStandardPriceStrategy,     sStandardPriceStrategy],
    "ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy,    sStandardPriceStrategy,     sStandardPriceStrategy]
};

var oDocumentMaterialLoadRepl = {
    "DOCUMENT_TYPE_ID": ['DT1', 'DT1', 'DT2', 'DT1'],
    "DOCUMENT_ID": ['D2', 'D2', 'D1', 'D3'],
    "DOCUMENT_VERSION": ['V1', 'V2', 'V1', 'V4'],
    "DOCUMENT_PART": ['DP1', 'DP1', 'TS2', 'TS1'],
    "MATERIAL_ID": ['MAT1', 'MAT1', 'MAT1', '#MAT1'],
    "_VALID_FROM": [sValidFrom, sValidTo, sValidFrom, sValidFrom],
    "_VALID_TO": [sValidTo, null, null, null],
    "_SOURCE": [1, 1, 2, 2],
    "_CREATED_BY": ['U000001', 'U000001', 'U000001', 'U000001'],
    "DELETED_FROM_SOURCE": [0, 0, 0, 0]
};

var oLanguageTestDataMdr = {
    "LANGUAGE":['ZH-HANS','DE','EN','FR','IT','ES','JA-JP','ZH-HANT','RU','NL','NO'],
    "TEXTS_MAINTAINABLE":[1,1,1,1,1,1,1,1,0,0,0],
    "_VALID_FROM": ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
    "MAPPING_LANGUAGE_ID": ['1','D','E','F','I','S','J','M','R','9','A']
};  

    var result = {
        oAccount,
        oAccountText,
        oActivityPrice,
        oActivityPriceExt,
        oActivityType,
        oActivityTypeText,
        oBusinessArea,
        oBusinessAreaText,
        oCompanyCode,
        oCompanyCodeText,
        oControllingArea,
        oControllingAreaText,
        oCostCenter,
        oCostCenterExt,
        oCostCenterText,
        oCurrency,
        oCurrencyConversion,
        oExchangeRateType,
        oDocument,
        oDocumentMaterial,
        oDocumentMaterialDelete,
        oDocumentStatus,
        oDocumentStatusDelete,
        oDocumentStatusText,
        oDocumentStatusRepl,
        oDocumentStatusTextRepl,
        oDocumentText,
        oDocumentType,
        oDocumentTypeDelete,
        oDocumentTypeText,
        oMaterial,
        oMaterialExt,
        oMaterialText,
        oMaterialGroup,
        oMaterialGroupText,
        oMaterialPrice,
        oMaterialPriceExt,
        oMaterialPlant,
        oMaterialPlantExt,
        oMaterialType,
        oMaterialTypeText,
        oMaterialAccountDetermination,
        oOverheadGroup,
        oOverheadGroupText,
        oPlant,
        oPlantText,
        oPriceSource,
        oProcess,
        oProcessText,
        oProfitCenter,
        oProfitCenterText,
        oWorkCenter,
        oWorkCenterExt,
        oWorkCenterText,
        oLanguage,
        oUom,
        oUomText,
        oError,
        oDimension,
        oValuationClass,
        oValuationClassText,
        oCustomer,
        oVendor,
        oDesignOffice,
        sValidFrom,
        sValidTo,
        oDocumentDelete,
        oDocumentTextDelete,
        oKna1,
        oT023,
        oT023t,
        oT134,
        oT134t,
        oMara,
        oMakt,
        oT025,
        oT025t,
        oTgsb,
        oTgsbt,
        oT006,
        oT006a,
        oSchedlog,
        oCustomerRepl,
        oMaterialGroupRepl,
        oMaterialGroupTextRepl,
        oMaterialTypeRepl,
        oMaterialTypeTextRepl,
        oMaterialRepl,
        oMaterialTextRepl,
        oUomRepl,
        oUomTextRepl,
        oValuationClassRepl,
        oValuationClassTextRepl,
        oBusinessAreaRepl,
        oBusinessAreaTextRepl,
        oPlantRepl,
        oT001w,
        oPlantRplText,
        oT001k,
        oCompanyCodeRepl,
        oReplRunCustomer,
        oStatisticsCustomer,
        oReplLogCustomer,
        mReplCsvFiles,
        oTKA01,
        oTKA02,
        oT001,
        oCompanyCodeRepl,
        oCompanyCodeTextRepl,
        oControllingAreaRepl,
        oControllingAreaTextRepl,
        oVendorReplTool,
        oLfa1,
        oCSKB,
        oCSKU,
        oAccountRepl,
        oAccountTextRepl,
        oOverheadGroupRepl,
        oTCK14,
        oTCK15,
        oOverheadGroupTextRepl,
        oT001w_TCK14,
        oOverheadGroupReplForText,
        oCSKT,
        oCSKS,
        oCostCenterRepl,
        oCostCenterTextRepl,
        oCSLA,
        oCSLT,
        oActivityTypeRepl,
        oActivityTypeTextRepl,
        oDocumentTypeRepl,
        oDocumentTypeTextRepl,
        oDocumentRepl,
        oDocumentTextRepl,
        oTDWA,
        oTDWAT,
        oTDWS,
        oTDWST,
        oDRAW,
        oDRAT,
        oCEPC,
        oCEPCT,
        oProfitCenterRepl,
        oProfitCenterTextRepl,
        oCBPR,
        oCBPT,
        oProcessRepl,
        oProcessTextRepl,
        oDestionationEntity,
        oFieldMapping,
        oTCURR,
        oTCURF,
        oCurrencyRepl,
        oCurrencyConversionRepl,
        oCustomerDeleteProc,
        oCustomerError,
        oCustomerMaterialPrice,
        oCustomerMaterialPriceExt,
        oCustomerActivityPrice,
        oCustomerActivityPriceExt,
        oCustomerCalculationVersion,
        oCustomerCalculationVersionTemporary,
        oCustomerProject,
        oCurrencyConversionRepl,
        oVendorDeleteProc,
        oVendorError,
        oVendorMaterialPrice,
        oVendorMaterialPriceExt,
        oVendorItem,
        oVendorItemTemporary,
        oDocumentMaterialLoadRepl,
        oDrad,
        oLanguageTestDataMdr    
    };
    return result;
}

module.exports = {
    get data() {
        return generateTestData($);
    }
}