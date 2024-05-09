/*
 * This library can be used in tests for providing testdata (similar to csvs, but easier to maintain)
 * Please extend data if needed. Please run all tests after changing this file.
 */
const _ = require("lodash");
const Constants = require("../../lib/xs/util/constants");
const AddinStates = Constants.AddinStates;
const sDefaultExchangeRateType = Constants.sDefaultExchangeRateType;
const sValidFrom = '2015-01-01T15:39:09.691Z';

// The reason to wrap the test data into a function is that, some of the data members need to be gererated
// dynamically, e.g., sSessionId and its derived data
function generateTestData($) {

var oTomorrow = new Date();
var oYesterday = new Date();
oYesterday.setDate(oYesterday.getDate() -1);
var sMasterdataTimestampDate = oTomorrow.toJSON();
var sValidFromDate = oYesterday.toJSON();
var sExpectedDate = new Date().toJSON();
var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z").toJSON(); //"2011-08-20";

var userSchema = $.session.getUsername().toUpperCase();
var testPackage = $.session.getUsername().toLowerCase();
var sSessionId = $.session.getUsername();
var sSecondSessionId = "SecondSession";
var sTestUser = $.session.getUsername();
var sSecondUser = "SecondTestUser";
var sFirstName = "FirstName";
var sLastName = "LastName";
var sDefaultLanguage = "DE";
var sEnLanguage = "EN";
var iProjectId = 'PR1';
var iCalculationVersionId = 2809;
var iSecondVersionId = 4809;
var iCalculationId = 1978;
var iSecondCalculationId = 2078;
var sComponent_structure_description = "Test Structure Description";
var sComponentSplitId = "1";
var iVariantId = 11;
var iSecondVariantId = 22;
var iThirdVariantId = 33;
var sStandardPriceStrategy = "PLC_STANDARD";
oTomorrow.setDate(oTomorrow.getDate() +1);

var mCsvFiles = Object.freeze({
    metadata : "db.content::t_metadata.csv",
    metadata_item_attributes : "db.content::t_metadata_item_attributes.csv",
    currency : "db.content::t_currency.csv",
    uom : "db.content::t_uom.csv",
    regex : "db.content::t_regex.csv",
    exchange_rate_type: "db.content::t_exchange_rate_type.csv"
});

//[Registered, Activated, Activated w/o config]
var oAddinVersionTestData = {
        "ADDIN_GUID":  ["1234567890", "1234567891" , "1234567891"],
        "ADDIN_MAJOR_VERSION" : ["2", "2", "2"],
        "ADDIN_MINOR_VERSION": ["12", "12", "12"],
        "ADDIN_REVISION_NUMBER": ["1", "2", "2"],
        "ADDIN_BUILD_NUMBER": ["2", "1", "2"],
        "NAME":  ["Test Add-In 0", "Test Add-In 1", "Test Add-In 1_1"],
        "FULL_QUALIFIED_NAME": ["com.sap.plc.extensibility.testAddIn_0", "com.sap.plc.extensibility.testAddIn_1", "com.sap.plc.extensibility.testAddIn_1"],
        "DESCRIPTION" :  ["Test addin desc 0", "Test addin desc 1", "Test addin desc 1_2"],
        "PUBLISHER":  ["SAP SE", "SAP SE", "SAP SE"],
        "STATUS" : [AddinStates.Registered, AddinStates.Activated, AddinStates.Registered],
        "CERTIFICATE_ISSUER":  ["CN=VeriSign Class 3", "CN=VeriSign Class 3", "CN=VeriSign Class 3"],
        "CERTIFICATE_SUBJECT":  ["CN = TFS, O = mySAP.com", "CN = TFS, O = mySAP.com", "CN = TFS, O = mySAP.com"],
        "CERTIFICATE_VALID_FROM":  [sExpectedDate, sExpectedDate, sExpectedDate],
        "CERTIFICATE_VALID_TO":  [sExpectedDate, sExpectedDate, sExpectedDate],
        "CREATED_ON" : [sExpectedDate, sExpectedDate, sExpectedDate],
        "CREATED_BY" : [sTestUser, sTestUser, sTestUser],
        "LAST_MODIFIED_ON" : [sExpectedDate, sExpectedDate, sExpectedDate],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser, sTestUser]
    };

var oAddinConfigurationHeaderTestData = {
        "ADDIN_GUID":           [oAddinVersionTestData.ADDIN_GUID[0],           oAddinVersionTestData.ADDIN_GUID[1]],
        "ADDIN_MAJOR_VERSION" : [oAddinVersionTestData.ADDIN_MAJOR_VERSION[0],  oAddinVersionTestData.ADDIN_MAJOR_VERSION[1]],
        "ADDIN_MINOR_VERSION":  [oAddinVersionTestData.ADDIN_MINOR_VERSION[0],  oAddinVersionTestData.ADDIN_MINOR_VERSION[1]],
        "ADDIN_REVISION_NUMBER":[oAddinVersionTestData.ADDIN_REVISION_NUMBER[0],oAddinVersionTestData.ADDIN_REVISION_NUMBER[1]],
        "ADDIN_BUILD_NUMBER":   [oAddinVersionTestData.ADDIN_BUILD_NUMBER[0],   oAddinVersionTestData.ADDIN_BUILD_NUMBER[1]],
        "CREATED_ON" : [sExpectedDate, sExpectedDate],
        "CREATED_BY" : [sTestUser, sTestUser],
        "LAST_MODIFIED_ON" : [sExpectedDate, sExpectedDate],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
    };

var oAddinConfigurationItemsTestData = {
        "ADDIN_GUID":           [oAddinVersionTestData.ADDIN_GUID[1],           oAddinVersionTestData.ADDIN_GUID[1]],
        "ADDIN_MAJOR_VERSION" : [oAddinVersionTestData.ADDIN_MAJOR_VERSION[1],  oAddinVersionTestData.ADDIN_MAJOR_VERSION[1]],
        "ADDIN_MINOR_VERSION":  [oAddinVersionTestData.ADDIN_MINOR_VERSION[1],  oAddinVersionTestData.ADDIN_MINOR_VERSION[1]],
        "ADDIN_REVISION_NUMBER":[oAddinVersionTestData.ADDIN_REVISION_NUMBER[1],oAddinVersionTestData.ADDIN_REVISION_NUMBER[1]],
        "ADDIN_BUILD_NUMBER":   [oAddinVersionTestData.ADDIN_BUILD_NUMBER[1],   oAddinVersionTestData.ADDIN_BUILD_NUMBER[1]],
        "CONFIG_KEY" :          ["TestKey1", "TestKey2"],
        "CONFIG_VALUE" :        ["SomeValue1", "SomeValue2"]
    };


var oCalculationVersionTestData = {
    "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId, 5809 ],
    "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId, 5078 ],
    "CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
    "CALCULATION_VERSION_TYPE" : [ 1, 1, 1 ],
    "ROOT_ITEM_ID" : [ 3001, 5001, 7001 ],
    "CUSTOMER_ID" : [ "", "", "" ],
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
    "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
    "IS_FROZEN" : [ 0, 0, 0 ],
    "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ],
    "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ]
};


var oCalculationVersionTestData1 = {
        "CALCULATION_VERSION_ID" : [ 2810, 4811, 6809, 9191, 9192, 9193, 9194],
        "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId, 5078, 191, 222, 191, 222],
        "CALCULATION_VERSION_NAME" : [ "Baseline Version11", "Baseline Version21", "Baseline Version31", "Baseline Version41", "Baseline Version51", "Baseline Version61", "Baseline Version71"],
        "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT','INACTIVE','PENDING','DRAFT'],
        "CALCULATION_VERSION_TYPE" : [ 1, 1, 1, 1, 1, 1, 1 ],
        "ROOT_ITEM_ID" : [ 3001, 5001, 7001, 9199, 9299, 9945, 9946],
        "CUSTOMER_ID" : [ "", "", "", "C2", "C3", "C3", "C2"],
        "SALES_PRICE" : [ "20.0000000", "10.0000000", "10.0000000", "40.0000000", "50.0000000", "70.0000000", "80.0000000"],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR", "USD", "USD", "EUR", "EUR"],
        "REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR", "EUR", "USD", "EUR", "EUR"],
        "SALES_DOCUMENT" : ["DOC", "DOC", "DOC", "", "", "", ""],
        "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
        "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
        "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser],
        "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate],
        "IS_FROZEN" : [ 0, 0, 0, 0, 0, 0, 0],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy]
    };

    var oCalculationVersionTestData3 = {
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId, 5809 ],
        "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId, 5078 ],
        "CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2", "Baseline Version3" ],
        "STATUS_ID":['ACTIVE','INACTIVE','PENDING'],
        "CALCULATION_VERSION_TYPE" : [ 1, 1, 1 ],
        "ROOT_ITEM_ID" : [ 3001, 5001, 7001 ],
        "CUSTOMER_ID" : [ "", "", "" ],
        "SALES_PRICE" : ["20.0000000", "10.0000000", "10.0000000" ],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR" ],
        "COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM" ],
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId ],
        "SALES_DOCUMENT" : ["DOC", "DOC", "DOC"],
        "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "LAST_MODIFIED_ON" : [ "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z" ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
        "IS_FROZEN" : [ 0, 0, 0 ],
        "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ],
        "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ]
    };

    var oCalculationVersionPriceData = {
        "CALCULATION_VERSION_ID" : [ 1039, 1040, 1041 ],
        "CALCULATION_ID" : [ 1002, 1002, 1002 ],
        "CALCULATION_VERSION_NAME" : [ "Material Version1", "Activity Version1", "Material and Activity"],
        "STATUS_ID":['ACTIVE','INACTIVE','PENDING'],
        "CALCULATION_VERSION_TYPE" : [ 1, 1, 1 ],
        "ROOT_ITEM_ID" : [ 1, 1, 1 ],
        "CUSTOMER_ID" : [ null, null, null ],
        "SALES_PRICE" : [null, null, null ],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
        "COSTING_SHEET_ID" : [ null, null, null ],
        "COMPONENT_SPLIT_ID" : [ null, null, null ],
        "SALES_DOCUMENT" : [null, null, null],
        "START_OF_PRODUCTION" : [ null, null, null ],
        "END_OF_PRODUCTION" : [ null, null, null ],
        "VALUATION_DATE" : [ "2019-05-30", "2019-05-30", "2019-05-30" ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z" ],
        "IS_FROZEN" : [ 0, 0, 0],
        "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD" ],
        "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD" ]
};

var oCalculationVersionTemporaryTestData = _.extend(JSON.parse(JSON.stringify(oCalculationVersionTestData)), {
    "SESSION_ID" : [ sSessionId, sSessionId, sSessionId ]
});

var oCalculationVersionTempPriceData = {
        "CALCULATION_VERSION_ID" : [ 1039, 1040, 1041 ],
        "CALCULATION_ID" : [ 1002, 1002, 1002 ],
        "CALCULATION_VERSION_NAME" : [ "Material Version1", "Activity Version1", "Material and Activity"],
        "STATUS_ID":['ACTIVE','INACTIVE','PENDING'],
        "CALCULATION_VERSION_TYPE" : [ 1, 1, 1 ],
        "ROOT_ITEM_ID" : [ 1, 1, 1 ],
        "CUSTOMER_ID" : [ null, null, null ],
        "SALES_PRICE" : [null, null, null ],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "EUR", "EUR" ],
        "COSTING_SHEET_ID" : [ null, null, null ],
        "COMPONENT_SPLIT_ID" : [ null, null, null ],
        "SALES_DOCUMENT" : [null, null, null],
        "START_OF_PRODUCTION" : [ null, null, null ],
        "END_OF_PRODUCTION" : [ null, null, null ],
        "VALUATION_DATE" : [ "2019-05-30", "2019-05-30", "2019-05-30" ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z" ],
        "IS_FROZEN" : [ 0, 0, 0],
	"SESSION_ID" : [ sSessionId, sSessionId, sSessionId ],
        "MATERIAL_PRICE_STRATEGY_ID": ["PLC_TEST_ST_MAT", "PLC_TEST_ST_MAT", "PLC_STANDARD" ],
        "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_TEST_ST_ACT", "PLC_TEST_ST_ACT", "PLC_STANDARD" ]
};

var oCalculationLifecycleVersionTestData = {
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId ],
        "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId ],
        "SESSION_ID" : [ sSessionId, sSessionId ],
        "CALCULATION_VERSION_NAME" : [ "Baseline Version1", "Baseline Version2" ],
        "STATUS_ID":['ACTIVE','INACTIVE'],
        "CALCULATION_VERSION_TYPE" : [ 1, 16 ],
        "ROOT_ITEM_ID" : [ 3001, 5001 ],
        "CUSTOMER_ID" : [ "", "" ],
        "SALES_PRICE" : ["20.0000000", "10.0000000" ],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "EUR" ],
        "COSTING_SHEET_ID" : [ "COGM", "COGM" ],
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId ],
        "SALES_DOCUMENT" : ["DOC", "DOC" ],
        "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate ],
        "LIFECYCLE_PERIOD_FROM" : [null, 1440],
        "BASE_VERSION_ID" : [ null, iCalculationVersionId],
        "IS_FROZEN" : [ 0, 0 ],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy ],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy ]
    };

var oCalculationLifecycleVersionTestData2 = {
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, 2810, 2811, iSecondVersionId ],
        "CALCULATION_ID" : [ iCalculationId, iCalculationId, iCalculationId, iCalculationId ],
        "CALCULATION_VERSION_NAME" : [ "Base Version for Lifecycle", "Lifecycle Version 1", "Lifecycle Version 2", "Version with no Lifecycle Version" ],
        "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT'],
        "CALCULATION_VERSION_TYPE" : [ 1, 2, 2, 1 ],
        "ROOT_ITEM_ID" : [ 3001, 3001, 3001, 5001 ],
        "CUSTOMER_ID" : [ "", "", "", "" ],
        "SALES_PRICE" : ["20.0000000", "10.0000000","20.0000000", "10.0000000" ],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR", "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "EUR", "EUR", "EUR" ],
        "COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM", "COGM" ],
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId, sComponentSplitId ],
        "SALES_DOCUMENT" : ["DOC", "DOC", "DOC", "DOC" ],
        "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
        "LIFECYCLE_PERIOD_FROM" : [ null, 1440, 1440, null ],
        "BASE_VERSION_ID" : [ null, iCalculationVersionId, iCalculationVersionId, null ],
        "IS_FROZEN" : [ 0, 0, 0, 0 ],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy ],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy ]
    };

var oItemTestData = {
        "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iSecondVersionId, 5809 ],
        "PARENT_ITEM_ID" : [ null, 3001, 3002, null, null ],
        "PREDECESSOR_ITEM_ID" : [ null, 3001, 3002, null, null ],
        "IS_ACTIVE" : [ 1, 1, 1, 1, 1 ],
        "ITEM_CATEGORY_ID" : [ 0, 1, 3, 0, 0 ],
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
        "VENDOR_ID":[null,"",null,null,null],
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
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sTestUser, sTestUser ],
        "ITEM_DESCRIPTION" : [ "", "", "", "", "" ],
        "COMMENT" : [ "1. Comment", "", "", "2. Comment", "3. Comment" ],
        "CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 3, 0, 0 ]
    };

    var oItemTestAdditionalData = {
        "ITEM_ID" : [ 2, 78, 79, 80 ],
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId ],
        "PARENT_ITEM_ID" : [ 3001, 3001, 78, 78 ],
        "IS_ACTIVE" : [ 1, 1, 1, 1 ],
        "ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser ],
    };

    var oVariantItemTestAdditionalData = {
        "VARIANT_ID": [11, 11, 11],
        "ITEM_ID": [78, 78, 80],
        "IS_INCLUDED": [0, 0, 0],
        "QUANTITY_STATE": [1, 1, 1],
        "QUANTITY": ['100.0000000', '100.0000000', '100.0000000'],
    };

    var oItemTemporaryPriceData = {
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
        "VENDOR_ID":[null,null,null,null, null, null, null],
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
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser ],
        "ITEM_DESCRIPTION" : [ "", "", "", "", "", "", "" ],
        "COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
	"SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId, sSessionId ],
	"ITEM_DESCRIPTION" : [ "", "", "", "", "", "", ""],
	"COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
	"IS_DIRTY" : [ 0, 0, 0, 0, 0, 0, 0],
	"IS_DELETED" : [ 0, 0, 0, 0, 0, 0, 0 ]
    };

    var oItemPriceData = {
        "ITEM_ID" : [ 1, 2, 1, 2, 1, 2, 3 ],
        "CALCULATION_VERSION_ID" : [ 1039, 1039, 1040, 1040, 1041, 1041, 1041 ],
        "PARENT_ITEM_ID" : [ null, 1, null, 1, null, 1, 1 ],
        "PREDECESSOR_ITEM_ID" : [ null, null, null, null, null, null, null],
        "IS_ACTIVE" : [ 1, 1, 1, 1, 1, 1, 1],
        "ITEM_CATEGORY_ID" : [ 0, 2, 0, 3, 0, 2, 3],
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
        "VENDOR_ID":[null,null,null,null, null, null, null],
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
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "CREATED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser, sSecondUser ],
        "ITEM_DESCRIPTION" : [ "", "", "", "", "", "", "" ],
        "COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
	"ITEM_DESCRIPTION" : [ "", "", "", "", "", "", ""],
        "COMMENT" : [ "1. Comment", "", "", "", "", "", "" ],
        "CHILD_ITEM_CATEGORY_ID" : [ 0, 2, 0, 3, 0, 2, 3],
    };

    // all ACCOUNT_IDs used as input for the CalcEngine must be defined here
    var oAccountForItemTestData = {
        ACCOUNT_ID: ["0", "#AC11", "625000"],
        CONTROLLING_AREA_ID: ["#CA1", "#CA1", "#CA1"],
        _VALID_FROM: ["2000-01-01T00:00:00.000Z", "2000-01-01T00:00:00.000Z", "2000-01-01T00:00:00.000Z"]
    };

    var oItemTestDataWithMasterdata = {
        "ITEM_ID" : [ 3001, 3002, 3003],
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId],
        "PARENT_ITEM_ID" : [ null, 3001, 3002],
        "PREDECESSOR_ITEM_ID" : [ null, 3001, 3002],
        "IS_ACTIVE" : [ 1, 1, 1],
        "ITEM_CATEGORY_ID" : [ 0, 1, 3],
        "CHILD_ITEM_CATEGORY_ID" : [ 0, 1, 3],
        "CONFIDENCE_LEVEL_ID":[null,null,null],
        //masterdata
        "ACCOUNT_ID" : [ "625000", "0", "625000"],
        "ACTIVITY_TYPE_ID" : [ "ACTIVITY2222", "", ""],
        "BASE_QUANTITY" : [ 1, 1, 1],
        "BUSINESS_AREA_ID" : [ "B1", "", "B3"],
        "PROCESS_ID" : [ "B1", "", ""],
        "COMPANY_CODE_ID" : [ "CC1", "", ""],
        "COST_CENTER_ID" : [ "CC2", "", ""],
        "LOT_SIZE" : [ null, null, null],
        "LOT_SIZE_IS_MANUAL" : [ null, null, null],
        "DOCUMENT_TYPE_ID" : [ null, "DT1", null],
        "DOCUMENT_ID" : [ "", "D1", ""],
        "DOCUMENT_VERSION" : [null, "1", null],
        "DOCUMENT_PART" : [ null, "1", null],
        "DOCUMENT_STATUS_ID" : [null, "S1", null],
        "DESIGN_OFFICE_ID" : [ null, "L1", null],
        "MATERIAL_ID" : [ "MAT1", "", ""],
        "MATERIAL_TYPE_ID" : [ "MT2", null, null],
        "MATERIAL_GROUP_ID" : [ "MG2", null, null],
        "OVERHEAD_GROUP_ID": ["O1", null, null],
        "PLANT_ID" : [ "PL1", "", ""],
        "PROFIT_CENTER_ID" : [ "P4", "", ""],
        "VALUATION_CLASS_ID": ["V1", "V1",, null],
        "VENDOR_ID":["V1","V2",null],
        "WORK_CENTER_ID" : [ "WC1", "", ""],
        "ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", ""],
        "PURCHASING_GROUP" : [ null, null, null],
        "PURCHASING_DOCUMENT" : [ null, null, null],
        "LOCAL_CONTENT" : [ null, null, null],
        "QUANTITY" : [ "1", "1", "1"],
        "QUANTITY_IS_MANUAL" : [ null, null, null],
        "QUANTITY_UOM_ID" : [ "PC", "PC", "PC"],
        "TOTAL_QUANTITY" : [ "1", "1", "1"],
        "TOTAL_QUANTITY_UOM_ID" : [ "PC", "PC", "PC"],
        "TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1],
        "IS_RELEVANT_TO_COSTING_IN_ERP" : [null, null, null],
        "PRICE_FIXED_PORTION":[0,2772.36,2246.88],
        "PRICE_FIXED_PORTION_IS_MANUAL":[null,null,null],
        "PRICE_VARIABLE_PORTION":[0,0,415.66],
        "PRICE_VARIABLE_PORTION_IS_MANUAL":[null,null,null],
        "PRICE":[null,2772.36,2662.54],
        "TRANSACTION_CURRENCY_ID":["EUR","USD","EUR"],
        "PRICE_ID":[null,null,'2B0000E0B2BDB9671600A4000936462B'],
        "PRICE_UNIT":[0,100,100],
        "PRICE_UNIT_IS_MANUAL":[null,null,null],
        "PRICE_UNIT_UOM_ID":["H","H","H"],
        "PRICE_SOURCE_ID":["","",""],
        "PRICE_SOURCE_TYPE_ID":[null,null,null],
        "IS_DISABLING_PRICE_DETERMINATION":[null,null,null],
        "TARGET_COST" : [ null, null, null],
        "TARGET_COST_IS_MANUAL" : [ null, null, null],
        "TARGET_COST_CURRENCY_ID":["EUR","CAD","EUR"],
        "PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null],
        "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null],
        "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null],
        "OTHER_COST" : [ null, null, null],
        "OTHER_COST_FIXED_PORTION" : [ null, null, null],
        "OTHER_COST_VARIABLE_PORTION" : [ null, null, null],
        "TOTAL_COST" : [ null, null, null],
        "TOTAL_COST_FIXED_PORTION" : [ null, null, null],
        "TOTAL_COST_VARIABLE_PORTION" : [ null, null, null],
        "TOTAL_COST_PER_UNIT_FIXED_PORTION":       [  '13',    '6',    '6'],
        "TOTAL_COST_PER_UNIT_VARIABLE_PORTION":    [  '26',    '3',    '3'],
        "TOTAL_COST_PER_UNIT":                     [  '39',    '9',    '9'],
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate],
        "CREATED_BY" : [ sTestUser, sTestUser, sTestUser],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate,],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser],
        "ITEM_DESCRIPTION" : [ "", "", ""],
        "COMMENT" : [ "1. Comment", "", ""]
    };

var oItemTestData1 = {
        "ITEM_ID" : [ 9199, 9299, 9945, 9946 ],
        "CALCULATION_VERSION_ID" : [ 9191, 9192, 9193, 9194],
        "PARENT_ITEM_ID" : [ null, null, null, null],
        "PREDECESSOR_ITEM_ID" : [ null, null, null, null],
        "IS_ACTIVE" : [ 1, 1, 1, 1],
        "ITEM_CATEGORY_ID" : [ 0, 0, 0, 0],
        "CHILD_ITEM_CATEGORY_ID" : [ 0, 0, 0, 0],
        "ACCOUNT_ID" : [ "0", "0", "0", "0"],
        "DOCUMENT_TYPE_ID" : [ "", "", "", ""],
        "DOCUMENT_ID" : [ "", "", "", ""],
        "DOCUMENT_VERSION" : [ "", "", "", ""],
        "DOCUMENT_PART" : [ "", "", "", ""],
        "MATERIAL_ID" : [ "", "", "", ""],
        "ACTIVITY_TYPE_ID" : [ "", "", "", ""],
        "PROCESS_ID" : [ "", "", "", ""],
        "LOT_SIZE" : [ null, null, null, null],
        "LOT_SIZE_IS_MANUAL" : [ null, null, null, null],
        "ENGINEERING_CHANGE_NUMBER_ID" : [ "", "", "", ""],
        "COMPANY_CODE_ID" : [ "", "", "", ""],
        "COST_CENTER_ID" : [ "", "", "", ""],
        "PLANT_ID" : [ "", "", "", ""],
        "WORK_CENTER_ID" : [ "", "", "", ""],
        "BUSINESS_AREA_ID" : [ "", "", "", ""],
        "PROFIT_CENTER_ID" : [ "", "", "", ""],
        "QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "QUANTITY_IS_MANUAL" : [ null, null, null, null],
        "QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC"],
        "TOTAL_QUANTITY" : [ "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "TOTAL_QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC"],
        "TOTAL_QUANTITY_DEPENDS_ON" : [ 1, 1, 1, 1],
        "IS_RELEVANT_TO_COSTING_IN_ERP" : [null, null, null, null],
        "PRICE_FIXED_PORTION":[0, 9772.36, 112, 222.45],
        "PRICE_FIXED_PORTION_IS_MANUAL":[null, null, null, null],
        "PRICE_VARIABLE_PORTION":[0, 0, 0, 0],
        "PRICE_VARIABLE_PORTION_IS_MANUAL":[null, null, null, null],
        "PRICE":[null, null, null, null],
        "TRANSACTION_CURRENCY_ID":["EUR","USD", "EUR","USD"],
        "PRICE_UNIT":[0, 100, 0, 0],
        "PRICE_UNIT_IS_MANUAL":[null,null, null,null],
        "PRICE_UNIT_UOM_ID":["H", "H", "H", "H"],
        "CONFIDENCE_LEVEL_ID":[null, null, null, null],
        "PRICE_SOURCE_ID":["", "", "", ""],
        "VENDOR_ID":[null ,null, null ,null],
        "TARGET_COST" : [ null, null, null ,null],
        "TARGET_COST_IS_MANUAL" : [ null, null, null ,null],
        "TARGET_COST_CURRENCY_ID":["EUR","EUR", "EUR","EUR"],
        "PRICE_FOR_TOTAL_QUANTITY" : [ null, null, null, null],
        "PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION" : [ null, null, null, null],
        "PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION" : [ null, null, null, null],
        "OTHER_COST" : [ null, null, null, null],
        "OTHER_COST_FIXED_PORTION" : [ null, null, null, null],
        "OTHER_COST_VARIABLE_PORTION" : [ null, null, null, null],
        "TOTAL_COST" : [ null, null, null, null],
        "TOTAL_COST_FIXED_PORTION" : [ null, null, null, null],
        "TOTAL_COST_VARIABLE_PORTION" : [ null, null, null, null],
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
        "CREATED_BY" : [ sTestUser, sSecondUser, sTestUser, sSecondUser],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
        "LAST_MODIFIED_BY" : [ sTestUser, sSecondUser, sTestUser, sSecondUser],
        "ITEM_DESCRIPTION" : [ "", "", "", ""],
        "COMMENT" : [ "1. Comment", "2. Comment", "Comment 3", "Comment 4"]
    };

var oItemSelectedPriceTestData = {
    "CALCULATION_VERSION_ID":[2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809,2809],
    "ITEM_SELECTED_PRICE_ID":[1,2,3,4,5,6,7,8,9,10,14,16,23,24,28,30,32,33,34,35,36,38,45,65,66],
    "ITEM_CATEGORY_ID":[0,3,3,3,2,2,2,5,3,3,3,2,3,3,2,3,3,3,3,2,5,2,2,3,3],
    "ITEM_ID":[3002,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "DOCUMENT_TYPE_ID":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "DOCUMENT_ID":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "DOCUMENT_PART":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "MATERIAL_ID":["P-100",null,null,null,"100-100","100-200","100-300",null,null,null,null,"100-210",null,null,"100-110",null,null,null,null,"100-120",null,"100-130","100-310",null,null],
    "PLANT_ID":["1000","1000","1000","1000","1000","1000","1000",null,"1000","1000","1000","1000","1000","1000","1000","1000","1000","1000","1000","1000",null,"1000","1000",null,null],
    "ACTIVITY_TYPE_ID":[null,"1422","1420","1421",null,null,null,null,"1421","1422","1420",null,"1422","1420",null,"1421","1422","1420","1421",null,null,null,null,null,null],
    "COST_CENTER_ID":[null,"4230","4230","4230",null,null,null,null,"4220","4220","4220",null,"4280","4280",null,"4280","4210","4210","4210",null,null,null,null,null,null],
    "PROCESS_ID":[null,null,null,null,null,null,null,"300900",null,null,null,null,null,null,null,null,null,null,null,null,"400900",null,null,"300900","400900"],
    "PRICE_SOURCE_ID":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "PRICE_FIXED_PORTION":[null,2772.36,2246.88,2590.96,null,null,null,5,4861.03,3357.74,6253.88,0,1854.81,5241.58,0,2344.63,1446.13,1633.55,3777.51,0,20,0,0,5,20],
    "PRICE_FIXED_PORTION_IS_MANUAL":[null,0,0,0,null,null,null,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "PRICE_VARIABLE_PORTION":[null,0,415.66,371.11,null,null,null,7,449.62,0,576.38,26.13,0,116.06,5.11,472.74,0,367.44,713.67,23,0,0.5,2,7,0],
    "PRICE_VARIABLE_PORTION_IS_MANUAL":[null,0,0,0,null,null,null,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "PRICE":[null,2772.36,2662.54,2962.07,null,null,null,12,5310.65,3357.74,6830.26,26.13,1854.81,5357.64,5.11,2817.37,1446.13,2000.99,4491.18,23,20,0.5,2,12,20],
    "TRANSACTION_CURRENCY_ID":[null,"EUR","EUR","EUR",null,null,null,"EUR","EUR","EUR","EUR","EUR","EUR","EUR","EUR","EUR","EUR","EUR","EUR","USD","EUR","EUR","EUR","EUR","EUR"],
    "PRICE_UNIT":[null,100,100,100,null,null,null,1,100,10,100,1,10,100,1,100,100,100,100,1,1,1,1,1,1],
    "PRICE_UNIT_IS_MANUAL":[null,0,0,0,null,null,null,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "PRICE_UNIT_UOM_ID":[null,"H","H","H",null,null,null,"ST","H","H","H","ST","H","H","ST","H","H","H","H","ST","ST","ST","ST","ST","ST"],
    "CONFIDENCE_LEVEL_ID":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    "VENDOR_ID":[null,null,null,null,null,null,null,null,null,null,null,"1000",null,null,"1000",null,null,null,null,"1003",null,"1002","1000",null,null]
};

var oItemTemporaryTestData = _.extend(JSON.parse(JSON.stringify(oItemTestData)), {
    "SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId ],
    "ITEM_DESCRIPTION" : [ "", "", "", "", "" ],
    "COMMENT" : [ "1. Comment", "", "", "2. Comment", "3. Comment" ],
    "IS_DIRTY" : [ 0, 0, 0, 0, 0 ],
    "IS_DELETED" : [ 0, 0, 0, 0, 0 ]
});

var oItemCalculatedTestData = _.extend(JSON.parse(JSON.stringify(oItemTestData)), {
    "BASE_QUANTITY_CALCULATED" : oItemTestData.QUANTITY,
    "QUANTITY_CALCULATED" : oItemTestData.QUANTITY,
    "TARGET_COST_CALCULATED" : oItemTestData.TARGET_COST,
    "LOT_SIZE_CALCULATED" : oItemTestData.LOT_SIZE,
    "PRICE_UNIT": ['0.0000000', '100.0000000', '100.0000000', '100.0000000', '0.0000000'],
    "PRICE_UNIT_CALCULATED" : ['0.0000000', '100.0000000', '100.0000000', '100.0000000', '0.0000000'],
    "PRICE_FIXED_PORTION" : ['0.0000000', '2772.3600000', '2246.8800000', '2590.9600000', '0.0000000'],
    "PRICE_FIXED_PORTION_CALCULATED" : ['0.0000000', '2772.3600000', '2246.8800000', '2590.9600000', '0.0000000'],
    "PRICE_VARIABLE_PORTION" : ['0.0000000', '0.0000000', '415.66.0000000', '371.1100000', '0.0000000'],
    "PRICE_VARIABLE_PORTION_CALCULATED" : ['0.0000000', '0.0000000', '415.66.0000000', '371.1100000', '0.0000000']
});

var oItemCalculatedValuesCostingSheet = {
    "ITEM_ID" : [oItemTestData.ITEM_ID[0], oItemTestData.ITEM_ID[1]],
    "CALCULATION_VERSION_ID" : [iCalculationVersionId, iSecondCalculationId],
    "COSTING_SHEET_ROW_ID" : ["CSR_1","CSR_1"],
    "COSTING_SHEET_OVERHEAD_ROW_ID" : [-1,-1],
    "ACCOUNT_ID" : ["40","40"],
    "IS_ROLLED_UP_VALUE" : [1,1],
    "HAS_SUBITEMS" : [1,1],
    "COST" : [5,5] ,
    "COST_FIXED_PORTION" : ['2.0000000','2.0000000'],
    "COST_VARIABLE_PORTION" : ['3.0000000','3.0000000']
};

var oItemCalculatedValuesComponentSplit = {
    "ITEM_ID" : [oItemTestData.ITEM_ID[0], oItemTestData.ITEM_ID[1]],
    "CALCULATION_VERSION_ID" : [iCalculationVersionId, iSecondCalculationId],
    "COMPONENT_SPLIT_ID" : ["100", "100"],
    "COST_COMPONENT_ID" : [2,2],
    "ACCOUNT_ID" : ["40", "40"],
    "COST" : [7, 7],
    "COST_FIXED_PORTION" : ['3.0000000', '3.0000000'],
    "COST_VARIABLE_PORTION" : ['4.0000000', '4.0000000']
};

/**
 * Reads metadata and returns NotCalculated and Calculated fields.
 *
 * @returns {object} aMetaData - returns NotCalculated and Calculated fields
 *
 */
function getMetadataCustomFields(){
    var sQuery =    "select COLUMN_ID from \"sap.plc.db::basis.t_metadata\" where path = 'Item'" +
        " and business_object = 'Item' and is_custom = 1 and (uom_currency_flag IS NULL or uom_currency_flag <> 1)";
    var aMetaData = jasmine.dbConnection.executeQuery(sQuery);
    var aFieldsNotCalculatedCustomFields = [];
    var aCalculatedCustomFields = [];
    _.each(aMetaData,function(sColumn,index){
        aFieldsNotCalculatedCustomFields.push(sColumn.COLUMN_ID+"_MANUAL");
        aFieldsNotCalculatedCustomFields.push(sColumn.COLUMN_ID+"_IS_MANUAL");
        aFieldsNotCalculatedCustomFields.push(sColumn.COLUMN_ID+"_UNIT");
        aCalculatedCustomFields.push(sColumn.COLUMN_ID+"_CALCULATED");
    });

    return {
        FieldsNotCalculatedCustomFields : aFieldsNotCalculatedCustomFields,
        CalculatedCustomFields : aCalculatedCustomFields
    };
}

if(jasmine.plcTestRunParameters.generatedFields === true){
    var oMetadataCustTestData = "testtools.testrunner.db.content.default::testdata_sap_t_metadata.csv";
    var oMetadataItemAttributesCustTestData = "testtools.testrunner.db.content.default::testdata_sap_t_metadata_item_attributes.csv";
    var oFormulaCustTestData = "testtools.testrunner.db.content.default::testdata_sap_t_formula.csv";
    var oCustomMetadata = getMetadataCustomFields();
    var aNotCalculatedCustomFields = oCustomMetadata.FieldsNotCalculatedCustomFields;
    var aCalculatedCustomFields = oCustomMetadata.CalculatedCustomFields;
    var oItemExtData = {
        "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iSecondVersionId, 5809 ],
        "CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0],
        "CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
        "CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
        "CUST_BOOLEAN_INT_IS_MANUAL":[null,null,null,null,null],
        "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":["20.0000000", "300.5000000", "40.8800000", "50.9600000", "600.0000000"],
        "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED":[null,null,null,null,null],
        "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT":["EUR","EUR","EUR","EUR","USD"],
        "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL":[null,null,null,null,null],
        "CUST_DECIMAL_WITHOUT_REF_MANUAL":["30.0000000", "400.5000000", "50.8800000", "60.9600000", "700.0000000"],
        "CUST_DECIMAL_WITHOUT_REF_CALCULATED":[null,null,null,null,null],
        "CUST_DECIMAL_WITHOUT_REF_UNIT":[null,null,null,null,null],
        "CUST_DECIMAL_WITHOUT_REF_IS_MANUAL":[null,null,null,null,null],
        "CUST_INT_WITHOUT_REF_MANUAL":[30,40,50,60,70],
        "CUST_INT_WITHOUT_REF_CALCULATED":[null,null,null,null,null],
        "CUST_INT_WITHOUT_REF_UNIT":[null,null,null,null,null],
        "CUST_INT_WITHOUT_REF_IS_MANUAL":[null,null,null,null,null],
        "CUST_LOCAL_DATE_MANUAL":[sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime],
        "CUST_LOCAL_DATE_CALCULATED":[null,null,null,null,null],
        "CUST_LOCAL_DATE_UNIT":[null,null,null,null,null],
        "CUST_LOCAL_DATE_IS_MANUAL":[null,null,null,null,null],
        "CUST_STRING_MANUAL":["Test 1","Test 2","Test 3","Test 4","Test 5"],
        "CUST_STRING_CALCULATED":[null,null,null,null,null],
        "CUST_STRING_UNIT":[null,null,null,null,null],
        "CUST_STRING_IS_MANUAL":[null,null,null,null,null]
    };

    var oItemTemporaryExtData = _.extend(JSON.parse(JSON.stringify(oItemExtData)), {
        "SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId ]
    });

    var oItemExtWithMasterData = {
            "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ],
            "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iSecondVersionId, 5809 ],
            "CMAT_STRING_MANUAL": ["Test 1","Test 2","Test 3","Test 4","Test 5"],
            "CMAT_STRING_UNIT": [null, null, null, null, null],
            "CWCE_DECIMAL_MANUAL": ["100.0000000", "200.0000000", "300.0000000", "400.0000000", "500.0000000"],
            "CWCE_DECIMAL_UNIT": [null, null, null, null, null],
            "CAPR_DECIMAL_MANUAL": ["100.0000000", "200.0000000", "300.0000000", "400.0000000", "500.0000000"],
            "CAPR_DECIMAL_UNIT": [null, null, null, null, null],
    };

    var oItemTemporaryExtWithMasterData = _.extend(JSON.parse(JSON.stringify(oItemExtWithMasterData)), {
        "SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId ]
    });

    var oItemTemporaryExtWithDefaultDataAfterCreateData = _.clone(oItemTemporaryExtData);
    oItemTemporaryExtWithDefaultDataAfterCreateData.CUST_BOOLEAN_INT_IS_MANUAL = [1,1,null,1,1];
    oItemTemporaryExtWithDefaultDataAfterCreateData.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL=[null,1,null,null,null];
    oItemTemporaryExtWithDefaultDataAfterCreateData.CUST_DECIMAL_WITHOUT_REF_IS_MANUAL=[null,1,null,null,null];

    var oMaterialExtTestDataPlc = {
            "MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7'],
            "CMAT_STRING_MANUAL" : ['Test String 1', 'Test String 2', 'Test String 3', 'Test String 4', 'Test String 5', 'Test String 6', 'Test String 7'],
            "CMAT_STRING_UNIT" : [null, null, null, null, null, null, null],
            "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z']
    };

    var oMaterialPlantExtTestDataPlc = {
            "MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4'],
            "PLANT_ID" : ['PL1','PL3', 'PL3', 'PL1'],
            "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
            "CMPL_INTEGER_MANUAL" : [1, 2, 3, 4],
            "CMPL_INTEGER_UNIT" : [null, null, null, null]
    };

    var oMaterialPriceExtTestDataPlc = {
            "PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
            "CMPR_BOOLEAN_INT_MANUAL" : [1, 1, 1],
            "CMPR_BOOLEAN_INT_UNIT" : [null,  null, null],
            "CMPR_DECIMAL_MANUAL": ["123.4500000", "121.2500000", "121.2500000"],
            "CMPR_DECIMAL_UNIT" : [null,  null, null],
            "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": ["234.5600000", "200.5500000", "234.9900000"],
            "CMPR_DECIMAL_WITH_CURRENCY_UNIT": ["EUR","EUR","EUR"],
            "CMPR_DECIMAL_WITH_UOM_MANUAL": ["1.0000000", "1.0000000", "2.0000000"],
            "CMPR_DECIMAL_WITH_UOM_UNIT": ["H","H","H"],
            "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"]
    };

    var oCostCenterExtTestDataPlc = {
            "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA1', '1000'],
            "COST_CENTER_ID" : ['CC1', 'CC2', 'CC3', 'CC2'],
            "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
            "CCEN_DATE_MANUAL" : [sExpectedDateWithoutTime, sExpectedDateWithoutTime , sExpectedDateWithoutTime , sExpectedDateWithoutTime ],
            "CCEN_DATE_UNIT" : [null, null, null, null]
    };
}

var oMaterialPriceDataPlc = {
        "PRICE_ID": [ "2D0055E0B2BDB9671600A4000936462B", "2D0055E0B2BDB9671604A4000936462B", "2D0055E0B2BCB9671600A4000936462B", "2D0077E0B2BDB9671600A4000936462B", "2D7755E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_STANDARD_PRICE", "PLC_TEST_PRICE", "PLC_PROJECT_PRICE", "PLC_VENDOR_PRICE", "PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["P-100", "P-100", "P-100", "P-100", "P-TEST"],
        "_VALID_FROM": ["2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z"],
        "PLANT_ID": ["*", "*", "*", "*", "*"],
        "VENDOR_ID": ["*", "*", "*", "*", "*"],
        "PROJECT_ID": [ "*", "*", "*", "*", "*"],
        "CUSTOMER_ID": [ "*", "*", "*", "*", "*"],
        "VALID_FROM": ["2019-05-30", "2019-05-30", "2019-05-30", "2019-05-30", "2010-05-30"],
	"VALID_TO": [ null, null, null, null, null],
        "VALID_FROM_QUANTITY": [ "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
	"VALID_TO_QUANTITY" : [ null, null, null, null, null],
        "PRICE_FIXED_PORTION": [ "13.0000000", "2.0000000", "6.0000000", "23.0000000", "1.0000000"],
        "PRICE_VARIABLE_PORTION": [ "14.0000000", "3.0000000", "7.0000000", "24.0000000", "2.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC", "PC", "PC", "PC", "PC"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 0, 0, 1],
        "IS_PREFERRED_VENDOR": [0, 0, 0, 0, 0],
        "_SOURCE": [1, 1, 1, 1, 1],
        "_CREATED_BY": ["U000920", "U000920", "U000920", "U000920", "U000920"]
};

var oSessionTestData = {
    "SESSION_ID" : [ sSessionId, sSecondSessionId, 'testsession' ],
    "USER_ID" : [ sTestUser, sSecondUser, sTestUser ],
    "LANGUAGE" : [ sDefaultLanguage, sDefaultLanguage, 'DE' ],
    "LAST_ACTIVITY_TIME" : [ sExpectedDate, sExpectedDate, sExpectedDate]
};

var oAutoCompleteUserData = {
    "USER_ID" : [ sTestUser, sSecondUser ]
}

var oSessionTestDataEn = {
        "SESSION_ID" : [ sSessionId, sSecondSessionId ],
        "USER_ID" : [ sTestUser, sSecondUser ],
        "LANGUAGE" : [ sEnLanguage, sEnLanguage ],
        "LAST_ACTIVITY_TIME" : [ sExpectedDate, sExpectedDate]
    };

var oCostingSheetTestData = {
        "COSTING_SHEET_ID" : [ "COGM" ],
        "CONTROLLING_AREA_ID" : [ '1000' ],
        "IS_TOTAL_COST2_ENABLED" : [ 0 ],
        "IS_TOTAL_COST3_ENABLED" : [ 0 ],
        "_VALID_FROM" : [ '2015-01-01T00:00:00.000Z' ],
        "_VALID_TO" :[ null ],
        "_SOURCE" : [ 1 ],
        "_CREATED_BY" : [ 'U000001' ]
    };

var oCostingSheetTextTestData = {
    "COSTING_SHEET_ID" : [ "COGM", "COGM" ],
    "LANGUAGE" : [ "DE", "EN" ],
    "COSTING_SHEET_DESCRIPTION" : [ "Herstellkosten", "Cost of goods manufactured" ],
    "TOTAL_COST2_DESCRIPTION" : [ "Cost 2", "Cost 22" ],
    "TOTAL_COST3_DESCRIPTION" : [ "Cost 3", "Cost 33" ],
    "_VALID_FROM" : [ '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z' ],
    "_VALID_TO" : [null, null],
    "_SOURCE" : [1, 1],
    "_CREATED_BY" : ['U000001', 'U000001']
};

var oCostingSheetRowTestData = {
        "COSTING_SHEET_ROW_ID" : ["MEK", "MGK", "FEK", "FGK", "HK", "HH"],
        "COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM"],
        "COSTING_SHEET_ROW_TYPE":[1,3,1,3,4,2],
        "COSTING_SHEET_BASE_ID":[,,,,,1],
        "ACCOUNT_GROUP_AS_BASE_ID": [ 13,, 15,,,],
        "COSTING_SHEET_OVERHEAD_ID": [ , 4,, 5,6,7],
        "CALCULATION_ORDER": [0, 1, 2, 3, 4, 5],
        "IS_RELEVANT_FOR_TOTAL": [1,1,1,1,1,1],
        "IS_RELEVANT_FOR_TOTAL2": [1,1,1,1,1,1],
        "IS_RELEVANT_FOR_TOTAL3": [1,1,1,1,1,1],
        "_VALID_FROM": [ '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO": [ null, null, null, null, null,null],
        "_SOURCE": [ 1, 1, 1, 1, 1, 1],
        "_CREATED_BY": [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
    };

var oCostingSheetBaseTestData = {
        "COSTING_SHEET_BASE_ID": [1],
        "COST_PORTION": [3],
        "_VALID_FROM": [ '2015-01-01T00:00:00.000Z'],
        "_VALID_TO": [null],
        "_SOURCE": [1],
        "_CREATED_BY": [ 'U000001']
}

var oCostingSheetBaseRowTestData = {
        "COSTING_SHEET_BASE_ID": [1],
        "ITEM_CATEGORY_ID": [1],
        "SUBITEM_STATE":[1],
        "_VALID_FROM": [ '2015-01-01T00:00:00.000Z'],
        "_VALID_TO": [null],
        "_SOURCE": [1],
        "_CREATED_BY": [ 'U000001'],
        "CHILD_ITEM_CATEGORY_ID": [1]
}

var oCostingSheetRowTextTestData = {
        "COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM",],
        "COSTING_SHEET_ROW_ID" : ["MEK", "MEK", "FEK", "FEK"],
        "LANGUAGE" : [ "EN", "DE", "EN", "DE"],
        "COSTING_SHEET_ROW_DESCRIPTION" : ["Direct Material Cost", "Materialeinzelkosten", "Direct Production Cost", "Fertigungseinzelkosten"],
        "_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [ null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001'],
};

var oCostingSheetOverheadTestData = {
        "COSTING_SHEET_OVERHEAD_ID" : [4, 5],
        "CREDIT_ACCOUNT_ID" : ["655100", "655200"],
        "IS_ROLLED_UP" : [1, 1],
        "_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : ['U000001', 'U000001'],
        "USE_DEFAULT_FIXED_COST_PORTION" : [1, 0]
};

var oCostingSheetOverheadRowTestData = {
        "COSTING_SHEET_OVERHEAD_ROW_ID" : [1, 1, 1, 1],
        "COSTING_SHEET_OVERHEAD_ID" : [4, 5, 6, 7],
        "VALID_FROM" : ['2013-01-01', '2020-12-31', '2013-01-03', '2013-01-02'],
        "VALID_TO" : ['2013-01-01', '2020-12-31', '2099-12-31', '2099-12-31'],
        "CONTROLLING_AREA_ID" : ["1000", "1000", "1000", "1000"],
        "COMPANY_CODE_ID": ["CC1", null, null, null],
        "BUSINESS_AREA_ID": ["B1", null, null, null],
        "PROFIT_CENTER_ID": ["P4", null, null, null],
        "PLANT_ID": ["PL1", null, null, null],
        "OVERHEAD_GROUP_ID": ["O1", null, null, null],
        "OVERHEAD_PERCENTAGE": ["1", null, null, null],
        "PROJECT_ID": ["PR1", "PR2", null, null],
        "ACTIVITY_TYPE_ID": ["ACTIVITY2222", null, null, null],
        "COST_CENTER_ID": ["CC2", null, null, null],
        "WORK_CENTER_ID": ["WC1", null, null, null],
        "OVERHEAD_QUANTITY_BASED": [null, "2", "2", "2"],
        "OVERHEAD_CURRENCY_ID": [null, "EUR", "EUR", "EUR"],
        "OVERHEAD_PRICE_UNIT": [null, "1", "1", "1"],
        "OVERHEAD_PRICE_UNIT_UOM_ID": [null, "PC", "PC", "PC"],
        "CREDIT_FIXED_COST_PORTION" : [1, null, null, null],
        "FORMULA_ID" : [1, null, 2, 3],
        "_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001']
};

var oCostingSheetOverheadRowFormulaTestData = {
        "FORMULA_ID" : [1, 2, 3],
        "FORMULA_STRING" : ["IS_MATERIAL()", "AND($PLANT_ID='#P1';$COMPANY_CODE_ID='#C1')", "IS_MATERIAL()"],
        "FORMULA_DESCRIPTION" : ["Overhead will be used only if the type is material", "Overhead will be applied if plant_id is '#P1' and company_code is '#C1'", "Check if type is material"]
}

var oCostingSheetOverheadRowFormulaTestData = {
        "FORMULA_ID" : [1, 2, 3],
        "FORMULA_STRING" : ["IS_MATERIAL()", "AND($PLANT_ID='#P1';$COMPANY_CODE_ID='#C1')", "IS_MATERIAL()"],
        "FORMULA_DESCRIPTION" : ["Overhead will be used only if the type is material", "Overhead will be applied if plant_id is '#P1' and company_code is '#C1'", "Overhead will be used only if the type is material"]
}

var oCostingSheetRowDependenciesTestData = {
        "SOURCE_ROW_ID" : ["MGK", "FGK", "HK", "HK", "HK", "HK"],
        "TARGET_ROW_ID" : ["MEK", "FEK", "MEK", "MGK", "FEK", "FGK"],
        "COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM"],
        "_VALID_FROM" : ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [null, "2015-08-08T00:00:00.000Z", null, "2015-08-08T00:00:00.000Z", null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
};

//TODO_VV: remove since appears twice?
var oAccountGroupTest = {
        "ACCOUNT_GROUP_ID": [ 13, 15, 700, 800],
        "CONTROLLING_AREA_ID" : [ '1000', '1000', '1000', '1000'],
        "_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "COST_PORTION" : [ 2, 3, 2, 3],
        "_VALID_TO" : [ null, null, null, null],
        "_SOURCE" : [ 1, 1,  1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001']
};

var oAccountGroupTestDataPlc = {
        "ACCOUNT_GROUP_ID": [1, 700],
        "CONTROLLING_AREA_ID" : ['1000', '1000'],
        "_VALID_FROM": ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "COST_PORTION" : [2, 2],
        "_VALID_TO" : [null,null],
        "_SOURCE" :[ 1,1],
        "_CREATED_BY" : ['U000001', 'U000001']
};

var oProjectLifecyclePeriodTypeTestData = {
        "PROJECT_ID": ['PR1', 'PR2'],
        "YEAR" : ['2020', '2021'],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
};

var oProjectMonthlyLifecyclePeriodTestData = {
        "PROJECT_ID": ['PR1', 'PR2'],
        "YEAR" : ['2020', '2021'],
        "SELECTED_MONTH": [1,2],
        "MONTH_DESCRIPTION": ['first month','second month'],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
};

var oProjectLifecyclePeriodQuantityValueTestData = {
        "PROJECT_ID": ['PR1','PR1', 'PR2'],
        "CALCULATION_ID" : [iCalculationId, iSecondCalculationId, iSecondCalculationId],
        "LIFECYCLE_PERIOD_FROM": [4444,4445, 4445],
        "VALUE": [100, 150, 200],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser, sTestUser]
};

var oProjectLifecycleConfigurationTestData = {
        "PROJECT_ID": ['PR1', 'PR2'],
        "CALCULATION_ID" : [iCalculationId, iSecondCalculationId],
        "CALCULATION_VERSION_ID": [iCalculationVersionId,iSecondVersionId],
        "IS_ONE_TIME_COST_ASSIGNED": [1,0],
        "MATERIAL_PRICE_SURCHARGE_STRATEGY": ['NO_SURCHARGES','NO_SURCHARGES'],
        "ACTIVITY_PRICE_SURCHARGE_STRATEGY": ['NO_SURCHARGES','NO_SURCHARGES'],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
};

var oProjectOneTimeProjectCost = {
        "ONE_TIME_COST_ID": [11, 12, 13],
        "PROJECT_ID": ['PR1', 'PR1','PR1'],
        "ACCOUNT_ID": ['0','0','0'],
        "COST_DESCRIPTION": ["Based On Quantity", "Equally", "Manually"],
        "COST_TO_DISTRIBUTE": [100, 200, 300],
        "COST_NOT_DISTRIBUTED": [100, 200, 300],
        "COST_CURRENCY_ID": ["EUR", "EUR", "EUR"],
        "FIXED_COST_PORTION": [100, 100, 100],
        "DISTRIBUTION_TYPE": [0, 1, 2],
        "LAST_MODIFIED_BY":[sTestUser,sTestUser,sTestUser],
        "LAST_MODIFIED_ON": ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z']
};

var oProjectOneTimeProductCost = {
        "ONE_TIME_COST_ID": [11, 11, 12, 13, 13],
        "CALCULATION_ID" : [iCalculationId, iSecondCalculationId, iCalculationId, iCalculationId, iSecondCalculationId],
        "COST_TO_DISTRIBUTE": [5000, 10000, 4000, 6000, 7000],
        "COST_NOT_DISTRIBUTED": [5000, 10000, 4000, 6000, 7000],
        "DISTRIBUTION_TYPE": [0, 1, 2, 2, 1],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser, sTestUser, sTestUser, sTestUser],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z']
};

var oProjectOneTimeCostLifecycleValue = {
        "ONE_TIME_COST_ID": [11, 11, 11, 11, 12],
        "CALCULATION_ID" : [iCalculationId,iCalculationId, iSecondCalculationId,iSecondCalculationId, iSecondCalculationId],
        "LIFECYCLE_PERIOD_FROM": [1440, 1452, 1440, 1452, 1440],
        "VALUE": [3000, 8000, 4000, 6000, 5000]
};

var oAccountGroupText = {
        "ACCOUNT_GROUP_ID" : 1,
        "LANGUAGE" : "EN",
        "ACCOUNT_GROUP_DESCRIPTION" : "Test",
        "_VALID_FROM" : "2015-01-01T00:00:00.000Z",
        "_VALID_TO" : null,
        "_SOURCE" : 1,
        "_CREATED_BY" : "U000001"
};

var oTagTestData = {
        "TAG_ID" : [1, 2, 3, 4, 5, 6],
        "TAG_NAME" : ["DRAFT", "FINISHED", "CALCULATED", "DELAYED", "IMPORTANT", "TEMPORARY"],
        "CREATED_ON" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "CREATED_BY" : ["#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER", "#CONTROLLER"]
};

var oEntityTagsTestData = {
        "TAG_ID" : [1, 2],
        "ENTITY_TYPE" : ["V", "C"],
        "ENTITY_ID" : [iCalculationVersionId, iCalculationId],
        "CREATED_ON" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "CREATED_BY" : ["#CONTROLLER", "#CONTROLLER"]
};

var oAccountAccountGroupTestData = {
        "FROM_ACCOUNT_ID": ["0", "0"],
        "TO_ACCOUNT_ID": ["625000", "0"],
        "ACCOUNT_GROUP_ID": [700, 800],
        "_VALID_FROM": ['2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [ null, null],
        "_SOURCE" : [ 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001']
};

var oOpenCalculationVersionsTestData = {
    "SESSION_ID" : [ sSessionId, sSessionId ],
    "CALCULATION_VERSION_ID" : [ iCalculationVersionId, oCalculationVersionTestData.CALCULATION_VERSION_ID[1] ],
    "CONTEXT" : [ Constants.CalculationVersionLockContext.CALCULATION_VERSION, Constants.CalculationVersionLockContext.CALCULATION_VERSION ],
    "IS_WRITEABLE" : [ 1, 1 ]
};

var oOneTimeProjectCostTestData = {
        "ONE_TIME_COST_ID": [1, 2],
        "PROJECT_ID": ['PR1', 'PR2'],
        "ACCOUNT_ID": ["11000", "21000"],
        "COST_DESCRIPTION": ["Description of cost", "Description of cost"],
        "COST_TO_DISTRIBUTE":[10000, 20000],
        "COST_NOT_DISTRIBUTED":[10000, 20000],
        "COST_CURRENCY_ID":["EUR", "EUR"],
        "FIXED_COST_PORTION":[20, 40],
        "DISTRIBUTION_TYPE":[1, 2],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
};

var oOneTimeProductCostTestData = {
        "ONE_TIME_COST_ID": [1, 2],
        "CALCULATION_ID" : [iCalculationId, iSecondCalculationId],
        "COST_TO_DISTRIBUTE":[10000, 20000],
        "COST_NOT_DISTRIBUTED":[10000, 20000],
        "DISTRIBUTION_TYPE":[1, 2],
        "LAST_MODIFIED_ON" : ['2015-01-01T00:00:00.000Z','2015-01-01T00:00:00.000Z'],
        "LAST_MODIFIED_BY" : [sTestUser, sTestUser]
};

var oOneTimeCostLifecycleValueTestData = {
        "ONE_TIME_COST_ID": [1, 2],
        "CALCULATION_ID" : [iCalculationId, iSecondCalculationId],
        "LIFECYCLE_PERIOD_FROM": [1444,1445],
        "VALUE": [10000,20000]
};

var oUserTestData = {
    "USER_ID" : [ sTestUser, sSecondUser ],
    "DEFAULT_LANGUAGE" : [ sDefaultLanguage, sDefaultLanguage ]
};

var oComponentSplitTest = {
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId ],
        "CONTROLLING_AREA_ID" : ["1000", "#CA3"],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : ["U000001", "U000001"]

    };

var oReferencedVersionComponentSplitTestData = {
        "MASTER_CALCULATION_VERSION_ID": [iCalculationVersionId],
        "REFERENCED_CALCULATION_VERSION_ID": [iSecondVersionId],
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId],
        "COST_COMPONENT_ID" : [2],
        "ACCOUNT_ID" : ["A1"],
        "COST_FIXED_PORTION":["20.5000000"],
        "COST_VARIABLE_PORTION":["9.5000000"]
};

var oReferencedVersionComponentSplitTemporaryTestData = _.extend(JSON.parse(JSON.stringify(oReferencedVersionComponentSplitTestData)), {
    "SESSION_ID" : [ sSessionId ]
});

var oComponentSplitTextTestData = {
    "COMPONENT_SPLIT_ID" : [ sComponentSplitId ],
    "LANGUAGE" : [ sDefaultLanguage ],
    "COMPONENT_SPLIT_DESCRIPTION" : [ sComponent_structure_description ],
    "_VALID_FROM": ["2015-01-01T00:00:00.000Z"],
    "_VALID_TO" : [null],
    "_SOURCE" : [1],
    "_CREATED_BY" : ["U000001"]
};

var oCalculationTestData = {
    "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId, 5078 ],
    "PROJECT_ID" : [ "PR1", "PR1", "PR3" ],
    "CALCULATION_NAME" : [ "Kalkulation Pumpe P-100", "Calculation Pump P-100", "Kalkulation Schluesselfinder" ],
    "CURRENT_CALCULATION_VERSION_ID" : [ 2809, iSecondVersionId, 5809 ],
    "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
    "CREATED_BY" : [ sTestUser, sTestUser, sTestUser ],
    "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
    "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ]
};

var oCalculationTestData1 = {
    "CALCULATION_ID" : [ 191, 222],
    "PROJECT_ID" : [ "PRR", "PRR"],
    "CALCULATION_NAME" : [ "Calculation pump 91", "Calculation pump 92"],
    "CURRENT_CALCULATION_VERSION_ID" : [ 9191, 9192],
    "CREATED_ON" : [ sExpectedDate, sExpectedDate],
    "CREATED_BY" : [ sTestUser, sTestUser],
    "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate],
    "LAST_MODIFIED_BY" : [ sTestUser, sTestUser]
};

var oCalculationPriceData = {
     "CALCULATION_ID" : [ 1002 ],
     "PROJECT_ID" : [ "PT1" ],
     "CALCULATION_NAME" : [ "Kalkulation Pumpe P-100" ],
     "CURRENT_CALCULATION_VERSION_ID" : [ 1039 ],
     "CREATED_ON" : [ "2019-05-30T01:39:09.691Z" ],
     "CREATED_BY" : [ sTestUser ],
     "LAST_MODIFIED_ON" : [ sExpectedDate ],
     "LAST_MODIFIED_BY" : [ sTestUser ]
};

var oDocumentMaterialTestData = {
    DOCUMENT_TYPE_ID:           [       'DT1',       'DT2',         'DT3'],
    DOCUMENT_ID:                [        'D1',        'D2',          'D3'],
    DOCUMENT_VERSION:           [         '1',         '1',          'V3'],
    DOCUMENT_PART:              [         '1',         '1',         'DP3'],
    MATERIAL_ID:                [      'MAT6',       'MAT7',       'MAT7'],
    _VALID_FROM:                ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-02T00:00:00.000Z"],
    _VALID_TO:                  [        null,         null,         null]
};

var oDesignOfficeTestDataPlc = {
        "DESIGN_OFFICE_ID" : ['L1', 'L2'],
        "_VALID_FROM" : [sMasterdataTimestampDate, sMasterdataTimestampDate],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : ['U000001', 'U000001']
};

var oDesignOfficeTextTestDataPlc = {
        "DESIGN_OFFICE_ID" : ['L1'],
        "LANGUAGE" : ['EN'],
        "DESIGN_OFFICE_DESCRIPTION" : ['L1 Description'],
        "_VALID_FROM" : [sMasterdataTimestampDate],
        "_VALID_TO" : [null],
        "_SOURCE" : [1],
        "_CREATED_BY" : ['U000001']
};

var oMappingLanguageTestData = {
    "LANGUAGE":['SR','ZH-HANS','TH','KO','RO','SL','HR','MS','UK','ET','AR','HE','CS','DE','EN','EL','HU','JA-JP','DA','PL','ZH-HANT','NL','NO','PT','SK','RU','TR','FI','SV','BG','LT','LV','AF','IS','CA','ID','FR','ES','IT'],
    "TEXTS_MAINTAINABLE":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    "_VALID_FROM": ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
    "MAPPING_LANGUAGE_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
};

var oActiveLanguageTestData = {
        "LANGUAGE":['SR','ZH-HANS','TH','KO','RO','SL','HR','MS','UK','ET','AR','HE','CS','DE','EN','EL','HU','JA-JP','DA','PL','ZH-HANT','NL','NO','ES','SK','IT','TR','FI','SV','BG','LT','LV','AF','IS','CA','ID','FR','PT','RU'],
        "TEXTS_MAINTAINABLE":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        "_VALID_FROM": ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
        "MAPPING_LANGUAGE_ID": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
    };

var oLanguageTestData = {
    "LANGUAGE":['DE','EN'],
    "TEXTS_MAINTAINABLE":[1,1],
    "_VALID_FROM": ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
    "MAPPING_LANGUAGE_ID": [null, null]
};

var oStatusTestData = {
    "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT'],
    "IS_DEFAULT":[1,0,0,0],
    "IS_ACTIVE":[1,0,1,0],
    "IS_STATUS_COPYABLE":[1,0,0,1],
    "DISPLAY_ORDER":[1,2,3,4],
    "CREATED_ON":["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
    "CREATED_BY":['activeUser','inactiveUser','pendingUser','draftUser'],
    "LAST_MODIFIED_ON":[,,,],
    "LAST_MODIFIED_BY":[,,,]
};

var oStatusTextTestData = {
    "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT'],
    "LANGUAGE":['EN','EN','EN','EN'],
    "STATUS_NAME":['activated','deactivated','processing','DRAFT'],
    "STATUS_DESCRIPTION":['active stastus','inactivated status','in progress','some draft status']
};

var oMaterialTextTestData = {
    MATERIAL_ID:                [            1,           2],
    MATERIAL_DESCRIPTION :      [   'MatDesc1',  'MatDesc2'],
    LANGUAGE :                  [         'DE',        'DE'],
    _VALID_FROM:                ["2014-04-01T00:00:00.000Z", "2014-04-01T00:00:00.000Z"],
    _VALID_TO:                  [         null,         null]
};

// {
//      "PATH": "Item",
//      "BUSINESS_OBJECT": "Item",
//      "COLUMN_ID": "IS_ACTIVESSS",
//      "IS_CUSTOM": 0,
//      "ROLLUP_TYPE_ID": 0,
//      "SIDE_PANEL_GROUP_ID": 101,
//      "DISPLAY_ORDER": 1,
//      "REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
//      "REF_UOM_CURRENCY_COLUMN_ID": null,
//      "UOM_CURRENCY_FLAG": null,
//      "SEMANTIC_DATA_TYPE": "BooleanInt",
//      "SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
//      "IS_REQUIRED_IN_MASTERDATA": null,
//      "TRIGGERS_PRICE_DETERMINATION": null
// };

var oMetadataTestData = {
        "PATH": "Item",
        "BUSINESS_OBJECT": "Item",
        "COLUMN_ID": "IS_ACTIVESSS",
        "IS_CUSTOM": 1,
        "ROLLUP_TYPE_ID": 0,
        "SIDE_PANEL_GROUP_ID": 101,
        "DISPLAY_ORDER": 1,
        "REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
        "REF_UOM_CURRENCY_COLUMN_ID": null,
        "UOM_CURRENCY_FLAG": null,
        "SEMANTIC_DATA_TYPE": "BooleanInt",
        "SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
        "IS_REQUIRED_IN_MASTERDATA": null,
        "IS_WILDCARD_ALLOWED": null,
        "RESOURCE_KEY_DISPLAY_NAME":null,
        "RESOURCE_KEY_DISPLAY_DESCRIPTION":null
};

var oMetadata4CustomFieldCostingSheetTestData = {
        "PATH": ["Item","Item","Item","Item"],
        "BUSINESS_OBJECT": ["Item","Item","Item","Item"],
        "COLUMN_ID": ["CUST_OVERHEAD_CS","CUST_OVERHEAD_UOM","CUST_OVERHEAD_FORMULA","CUST_OVERHEAD_TEXT"],
        "IS_CUSTOM": [1,1,1,1],
        "ROLLUP_TYPE_ID": [0,0,0,0],
        "SIDE_PANEL_GROUP_ID": [101,101,101,101],
        "DISPLAY_ORDER": [1,2,3,4],
        "REF_UOM_CURRENCY_PATH": ['',"Item",'',''],
        "REF_UOM_CURRENCY_BUSINESS_OBJECT": ['',"Item",'',''],
        "REF_UOM_CURRENCY_COLUMN_ID": ['',"CUST_OVERHEAD_UOM_UNIT",'',''],
        "UOM_CURRENCY_FLAG":[0,0,0,0],
        "SEMANTIC_DATA_TYPE": ["Decimal","Decimal","Decimal","String"],
        "SEMANTIC_DATA_TYPE_ATTRIBUTES": ["precision=24; scale=7","precision=24; scale=7","precision=24; scale=7","length=5000"],
        "PROPERTY_TYPE":[2,2,2,3],
        "IS_REQUIRED_IN_MASTERDATA":[null,null,null,null],
        "IS_WILDCARD_ALLOWED": [null,null,null,null,null],
        "IS_USABLE_IN_FORMULA":[1,1,1,1],
        "RESOURCE_KEY_DISPLAY_NAME":[null],
        "RESOURCE_KEY_DISPLAY_DESCRIPTION":[null]
};

var oCustomField4CostingSheetFormulaData = {
        "FORMULA_ID": 1000,
        "PATH": "Item",
        "BUSINESS_OBJECT": "Item",
        "COLUMN_ID": "CUST_OVERHEAD_FORMULA",
        "ITEM_CATEGORY_ID": 0,
        "IS_FORMULA_USED": 1,
        "FORMULA_STRING" : "$Version.SALES_PRICE-$Version.TOTAL_COST" 
}
var oStandardMetaTestData = oMetadataTestData;

var oMetaTextTestData = {
        "PATH": "Item",
        "COLUMN_ID": "IS_ACTIVESSS",
        "LANGUAGE": "EN",
        "DISPLAY_NAME": "Active",
        "DISPLAY_DESCRIPTION": "Active"
};

var oMetaAttributesTestData = {
        "PATH": "Item",
        "BUSINESS_OBJECT": "Item",
        "COLUMN_ID": "IS_ACTIVESSS",
        "ITEM_CATEGORY_ID": -1,
        "SUBITEM_STATE": -1,
        "IS_MANDATORY": 1,
        "IS_READ_ONLY": null,
        "IS_TRANSFERABLE": null,
        "DEFAULT_VALUE": null
};

var oMetaFormulasTestData = {
        "FORMULA_ID": 1,
        "PATH": "Item",
        "BUSINESS_OBJECT": "Item",
        "COLUMN_ID": "IS_ACTIVESSS",
        "ITEM_CATEGORY_ID": -1,
        "IS_FORMULA_USED": 1,
        "FORMULA_STRING" : "1+1"
};

//var oCostCenterTestDataPlc = {
//      "COST_CENTER_ID" : ['#CC1', '#CC2', '#CC3'],
//      "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA3'],
////        "COMPANY_CODE_ID" : ['CC1', 'CC2', 'CC3'],
////        "BUSINESS_AREA_ID" : ['#BA1', '#BA2', '#BA3'],
////        "PROFIT_CENTER_ID" : ['P1', 'P2', 'P3'],
//      "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
//        "_VALID_TO" : [null, null, null],
//        "_SOURCE" : [1, 1, 1],
//        "_CREATED_BY" : ['#CONTROLLER', '#CONTROLLER', '#CONTROLLER']
//}
//
var oCostCenterTextTestDataPlc = {
        "COST_CENTER_ID" : ['#CC1', '#CC2', '#CC3', '#CC1', '#CC2', '#CC3'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA3', '#CA1', '#CA2', '#CA3'],
        "LANGUAGE" : ['EN', 'EN', 'EN', 'DE', 'DE', 'DE'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER']
}


var oCostCenterTestDataErp = {
        "KOSTL" : ['#CC4', '#CC5', '#CC6'],
        "KOKRS" : ['#CA4', '#CA5', '#CA6']
//      "BUKRS" : ['#C4', '#C5', '#C6'],
//      "GSBER" : ['#BA4', '#BA5', '#BA6'],
//      "PRCTR" : ['#PC4', '#PC5', '#PC6']
}

var oCostCenterTextTestDataErp = {
        "KOSTL" : ['#CC4', '#CC5', '#CC6', '#CC4', '#CC5', '#CC6'],
        "KOKRS" : ['#CA4', '#CA5', '#CA6', '#CA4', '#CA5', '#CA6'],
        "KTEXT" : ['Cost Center 4', 'Cost Center 5', 'Cost Center 6', 'Kostenstelle 4', 'Kostenstelle 5', 'Kostenstelle 6'],
        "LANGU" : ['EN', 'EN', 'EN', 'DE', 'DE', 'DE']
}

var oControllingAreaTestDataPlc = {
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA3', '1000', '#MDC'],
        "CONTROLLING_AREA_CURRENCY_ID" : ['EUR', 'USD', 'EUR', 'EUR', 'EUR'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null,null,null],
        "_SOURCE" : [1, 1, 1, 1, 2],
        "_CREATED_BY" : ['#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER']
};

var oControllingAreaTextTestDataPlc ={
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA3', '1000', '#MDC', '#CA1', '#CA2', '#CA3', '1000', '#MDC'],
        "LANGUAGE" : ['EN', 'EN', 'EN', 'EN', 'EN', 'DE', 'DE', 'DE', 'DE', 'DE'],
        "CONTROLLING_AREA_DESCRIPTION" : ['Controlling Area 1', 'Controlling Area 2', 'Controlling Area 3', 'Controlling Area 4', 'Controlling Area 5', 'Kostenrechnungskreis 1', 'Kostenrechnungskreis 2', 'Kostenrechnungskreis 3', 'Kostenrechnungskreis 4', 'Kostenrechnungskreis 5'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, null, null, null, null,null,null,null],
        "_SOURCE" : [1, 1, 1, 1, 2, 1, 1, 1, 1, 2],
        "_CREATED_BY" : ['#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER', '#CONTROLLER']
};

var oControllingAreaTestDataErp = {
        "KOKRS" : ['#CA4', '#CA5', '#CA6'],
        "WAERS" : ['GBP', 'EUR', 'RON'],
        "KTOPL" : ['DDD', 'EEE', 'FFF'],
        "LMONA" : ['V4', 'V5', 'V6']
}

var oControllingAreaTextTestDataErp = {
        "KOKRS" : ['#CA4', '#CA5', '#CA6', '#CA4', '#CA5', '#CA6'],
        "BEZEI" : ['Controlling Area 4', 'Controlling Area 5', 'Controlling Area 6', 'Kostenrechnungskreis 4', 'Kostenrechnungskreis 5', 'Kostenrechnungskreis 6'],
        "LANGU" : ['EN', 'EN', 'EN', 'DE', 'DE', 'DE']
}

var oCompanyCodeTestDataPlc = {
        "COMPANY_CODE_ID" : ['CC1', 'CC2', 'CC3'],
        "CONTROLLING_AREA_ID" : ['1000', '1000', '1000'],
        "COMPANY_CODE_CURRENCY_ID" : ['EUR', 'EUR', 'EUR'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
}

var oCompanyCodeTextTestDataPlc = {
        "COMPANY_CODE_ID" : ['CC1', 'CC1', 'CC2', 'CC2', 'CC3'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN'],
        "COMPANY_CODE_DESCRIPTION" : ['Company code CC1 EN', 'Company code CC1 DE', 'Company code CC2 EN', 'Company code CC2 DE', 'Company code CC3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oCompanyCodeTestDataErp = {
        "BUKRS" : ['#C4', '#C5', '#C6', 'CC1E', 'CC2E'],
        "WAERS" : ['USD', 'EUR', 'GBP', 'EUR', 'USD'],
        "KOKRS" : ['#CA4', '#CA5', '#CA6', '4000', '4000']
}

var oCompanyCodeTextTestDataErp = {
        "BUKRS" : ['#C4', '#C5', '#C6', '#C4', '#C5', '#C6', 'CC1E', 'CC1E', 'CC2E'],
        "BUTXT" : ['Company Code 4', 'Company Code 5', 'Company Code 6', 'Buchungskreis 4', 'Buchungskreis 5', 'Buchungskreis 6', 'CC1 Erp EN', 'CC1 Erp DE', 'CC2 Erp DE'],
        "LANGU" : ['EN', 'EN', 'EN', 'DE', 'DE', 'DE', 'EN', 'DE', 'DE']
}
// End of Test Data for MasterData //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var oBusinessAreaTestDataPlc = {
        "BUSINESS_AREA_ID" :['B1', 'B2', 'B3', 'B4', 'B5'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oBusinessAreaTextTestDataPlc = {
        "BUSINESS_AREA_ID" : ['B1', 'B1', 'B2', 'B3', 'B3', 'B4'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "BUSINESS_AREA_DESCRIPTION" : ['Area B1 EN', 'Area B1 DE', 'Area B2 EN', 'Area B3 DE', 'Area B3 EN', 'Area B4 DE'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000004']
}

var oBusinessAreaTestDataErp = {
        "GSBER" : ['B1E', 'B2E', 'B3E', 'B4E']
}

var oBusinessAreaTextTestDataErp = {
        "GSBER" : ['B1', 'B2E', 'B2E', 'B3E', 'B4E'],
        "LANGU" : ['EN', 'EN', 'DE', 'EN', 'DE'],
        "GTEXT" : ['Area B1 Erp EN', 'Area B2 Erp EN', 'Area B2 Erp DE', 'Area B2 Erp DE', 'Area B3 Erp EN', 'Area B4 Erp DE']
}

var oValuationClassTestDataPlc = {
        "VALUATION_CLASS_ID" :['V1', 'V2', 'V3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z'],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
}

var oValuationClassTextTestDataPlc = {
        "VALUATION_CLASS_ID" : ['V1', 'V1', 'V2', 'V2', 'V3'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN'],
        "VALUATION_CLASS_DESCRIPTION" : ['Valuation V1 EN', 'Valuation V1 DE', 'Valuation V2 EN', 'Valuation V2 DE', 'Valuation V3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oValuationClassTestDataErp = {
        "BKLAS" : ['V1E', 'V2E']
}

var oValuationClassTextTestDataErp = {
        "BKLAS" : ['V1E', 'V1E', 'V2E'],
        "LANGU" : ['EN', 'DE', 'DE'],
        "BKBEZ" : ['Valuation V1 Erp EN', 'Valuation V1 Erp DE', 'Valuation V2 Erp DE']
}

var oActivityTypeTestDataPlc = {
        "ACTIVITY_TYPE_ID" :['ACTIVITY1111', 'ACTIVITY2222', 'ACTIVITY3333','ACTIVITY4444', 'ACTIVITY5555'],
        "CONTROLLING_AREA_ID" : ['1000', '1000', '1000','#CA1', '1000'],
        "ACCOUNT_ID" : ['CE1', 'CE2', 'CE1','11000', 'CE1'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001','U000001','U000001']
}

var oActivityPriceDataPlc = {
        "PRICE_ID": ["2D0000E0B2BDB9671600A4220936462B","2E1100E0B2BDB9671600A4000936462B","2F2200E0B2BDB9671600A4000936462B", "2F3200E0B2BDB9671600A4000936462B", "2F3277E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE","PLC_TEST_PRICE","PLC_STANDARD_PRICE", "PLC_PLANNED_PRICE", "PLC_PLANNED_PRICE"],
        "CONTROLLING_AREA_ID": ['*','*','*','*', '1000'],
        "COST_CENTER_ID": ['*','*','*','*','CC2'],
        "ACTIVITY_TYPE_ID": ['*','*','*','*','ACTIVITY5555'],
        "PROJECT_ID": ['*','*','*','*','*'],
        "VALID_FROM": ["2019-05-30T01:39:09.691Z","2019-05-30T01:39:09.691Z","2019-05-30T01:39:09.691Z", "2019-05-30T01:39:09.691Z", "2010-05-30T01:39:09.691Z"],
        "CUSTOMER_ID": ['*', '*', '*','*','*'],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["11.0000000","4.0000000","33.0000000", "100.0000000", "100.0000000"],
        "PRICE_VARIABLE_PORTION": ["12.0000000", "5.0000000", "34.0000000", "200.0000000", "200.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0,0,0,0,1],
        "_VALID_TO": [null, null, null, null, null],
        "_VALID_FROM": ["2019-05-30T01:39:09.691Z","2019-05-30T01:39:09.691Z","2019-05-30T01:39:09.691Z","2019-05-30T01:39:09.691Z", "2015-01-01T15:39:09.691Z"],
        "_SOURCE": [1,1,1,1,1],
        "_CREATED_BY": ["I305778","U0001","U0001","U0001","U0001"]
};

var oActivityTypeTextTestDataPlc = {
        "ACTIVITY_TYPE_ID" : ['ACTIVITY1111', 'ACTIVITY1111', 'ACTIVITY2222', 'ACTIVITY2222', 'ACTIVITY3333'],
        "CONTROLLING_AREA_ID" : ['1000', '1000', '1000', '1000', '1000'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN'],
        "ACTIVITY_TYPE_DESCRIPTION" : ['Activity type A1 EN', 'Activity type A1 DE', 'Activity type A2 EN', 'Activity type A2 DE', 'Activity type A3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, null, null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oActivityTypeTestDataErp = {
        "LSTAR" : ['A1E', 'A2E']
}

var oActivityTypeTextTestDataErp = {
        "LSTAR" : ['A1E', 'A1E', 'A2E'],
        "LANGU" : ['EN', 'DE', 'DE'],
        "KTEXT" : ['A1 Erp EN', 'A1 Erp DE', 'A2 Erp DE']
}

var oMaterialGroupTestDataPlc = {
        "MATERIAL_GROUP_ID" :['MG1', 'MG2', 'MG3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
}

var oMaterialGroupTextTestDataPlc = {
        "MATERIAL_GROUP_ID" : ['MG1', 'MG1', 'MG2', 'MG2', 'MG3'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN'],
        "MATERIAL_GROUP_DESCRIPTION" : ['Material group MG1 EN', 'Material group MG1 DE', 'Material group MG2 EN', 'Material group MG2 DE', 'Material group MG3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oMaterialGroupTestDataErp = {
        "MATKL" : ['MG1E', 'MG2E']
}

var oMaterialGroupTextTestDataErp = {
        "MATKL" : ['MG1E', 'MG1E', 'MG2E'],
        "LANGU" : ['EN', 'DE', 'DE'],
        "WGBEZ" : ['MG1 Erp EN', 'MG1 Erp DE', 'MG2 Erp DE']
}

var oMaterialTypeTestDataPlc = {
        "MATERIAL_TYPE_ID" :['MT1', 'MT2', 'MT3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z'],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
}

var oMaterialTypeTextTestDataPlc = {
        "MATERIAL_TYPE_ID" : ['MT1', 'MT1', 'MT2', 'MT2', 'MT3'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN'],
        "MATERIAL_TYPE_DESCRIPTION": ['Material type MT1 EN', 'Material type MT1 DE', 'Material type MT2 EN', 'Material type MT2 DE','Material type MT3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oMaterialTypeTestDataErp = {
        "MTART" : ['MT1E', 'MT2E']
}

var oMaterialTypeTextTestDataErp = {
        "MTART" : ['MT1E', 'MT1E', 'MT2E'],
        "LANGU" : ['EN', 'DE', 'DE'],
        "MTBEZ" : ['MT1 Erp EN', 'MT1 Erp DE', 'MT2 Erp DE']
}

var oMaterial = {
        "MATERIAL_ID" : ["P-100"],
        "BASE_UOM_ID" : ["PC"],
        "IS_PHANTOM_MATERIAL" : [0],
        "IS_CONFIGURABLE_MATERIAL" : [0],
        "MATERIAL_TYPE_ID" : [null],
        "MATERIAL_GROUP_ID" : [null],
        "_VALID_FROM" : ["2019-05-30T01:39:09.691Z"],
        "_VALID_TO" : [null],
        "_SOURCE" : [1],
        "_CREATED_BY" :['U000001']
}

var oDimensionTestDataPlc = {
        "DIMENSION_ID" : ['D1', 'D2', 'D3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z'],
        "_SOURCE" : [1,1,1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
};

var oDimensionTextTestDataPlc = {
        "DIMENSION_ID" : ['D1', 'D1', 'D2', 'D2', 'D3'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN'],
        "DIMENSION_DESCRIPTION" : ['Dimension D1 EN', 'Dimension D1 DE', 'Dimension D2 EN', 'Dimension D2 DE', 'Dimension D3 P3 EN'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1,1,1,1,1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
};

var oPlantTestDataPlc = {
        "PLANT_ID" : ['PL1' , 'PL2', 'PL3', 'PL4'],
        "COMPANY_CODE_ID" : ['CC1', 'CC2','CC2', 'CC1'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null],
        "_SOURCE" :[1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003']
}

var oPlantTextTestDataPlc = {
        "PLANT_ID" : ['PL1', 'PL1', 'PL2', 'PL3', 'PL3'],
        "LANGUAGE" : ['EN', 'DE','EN','EN','DE'],
        "PLANT_DESCRIPTION" : ['Plant PL1 EN', 'Plant PL1 DE', 'Plant PL2 EN', 'Plant PL3 EN', 'Plant PL3 DE'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null, '2015-05-25T15:39:09.691Z'],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002']
}

var oPlantTestDataErp = {
        "WERKS" : ['PL1E', 'PL2E', 'PL3E'],
        "BUKRS" : ['#C5', '#C5', '#C5']
}

var oPlantTextTestDataErp = {
        "WERKS" : ['PL1E', 'PL2E' , 'PL2E', 'PL3E'],
        "LANGU" : ['EN','EN', 'DE', 'EN'],
        "NAME1" : ['PL1 Erp EN', 'PL2 Erp EN', 'PL2 Erp DE', 'PL3 Erp EN']
}

var oMaterialPlantTestDataPlc = {
        "MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4'],
        "PLANT_ID" : ['PL1','PL3', 'PL3', 'PL1'],
        "OVERHEAD_GROUP_ID": ['O1', 'O2', 'O1', null],
        "VALUATION_CLASS_ID": ['V1', 'V2', 'V2', null],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null,'2015-06-06T15:39:09.691Z', null ],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" :['U000001', 'U000001', 'U000002', 'U000002']
}

var oMaterialPlantTestDataErp = {
        "MATNR" : ['MT1E', 'MT2E', 'MT3E'],
        "WERKS" : ['PL1E', 'PL2E', 'PL3E']
}

var oMaterialTestDataPlc = {
        "MATERIAL_ID" : ['MAT1', 'MAT2', 'MAT3', 'MAT4', 'MAT5', 'MAT6', 'MAT7', "MATEN", "MATE1", "P-TEST"],
        "IS_PHANTOM_MATERIAL" : [1, 0, 1, null, null, null, null, null, null, 0],
        "IS_CONFIGURABLE_MATERIAL" : [1, 0, 1, null, null, null, null, null, null, 0],
        "BASE_UOM_ID" : ["ML", "MM", "M", null, null, null, null, null, null, null],
        "MATERIAL_TYPE_ID" : ["MT1", "MT2", "MT3", null, null, null, null, null, null, null],
        "MATERIAL_GROUP_ID" : ["MG1", "MG2", "MG3", null, null, null, null, null, null, null],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z', '2019-05-30T01:39:09.691Z'],
        "_VALID_TO" : [null, null,'2015-06-06T15:39:09.691Z', null, null, null, null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1, 1, 2, 2, 1],
        "_CREATED_BY" :['U000001', 'U000003', 'U000002', 'U000002', 'U000003', 'U000003', 'U000003', 'U000003', 'U000003', 'U000001']
}

var oMaterialTextTestDataPlc = {
        "MATERIAL_ID" : ['MAT1', 'MAT1', 'MAT2', 'MAT4', 'MAT5', 'MAT6', 'MAT7'],
        "LANGUAGE" : ['EN', 'DE','EN','EN','DE','DE','DE' ],
        "MATERIAL_DESCRIPTION" : ['Material MAT1 EN', 'Material MAT1 DE', 'Material MAT2 EN', 'Material MAT4 EN', 'Material MAT5 DE', 'Material MAT6 DE', 'Material MAT7 DE'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z','2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, null, '2015-05-25T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000002', 'U000002', 'U000002']
}

var oMaterialTestDataErp = {
        "MATNR" : ['MATERP1'],
        "MTART": ['ROH'],
        "MATKL": ['001'],
        "MEINS": ['PC'],
        "CADKZ": ['0'],
        "KZKFG" : ['0']
}

var oMaterialTextTestDataErp = {
        "MATNR" : ['MATERP1'],
        "LANGU" : ['EN','DE'],
        "MAKTX" : ['Material MAT1 ERP EN', 'Material MAT1 ERP DE']
}

var oMaterialGroupTestDataErp = {
        "MATKL" : ['MG1E']
}

var oMaterialTypeTestDataErp = {
        "MTART" : ['MT1E']
}

var oDocumentTypeTestDataPlc = {
        "DOCUMENT_TYPE_ID" :['DT1', 'DT2', 'DT3', 'DT4', 'DT5'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oDocumentTypeTextTestDataPlc = {
        "DOCUMENT_TYPE_ID" : ['DT1', 'DT1', 'DT2', 'DT3', 'DT3', 'DT4'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "DOCUMENT_TYPE_DESCRIPTION" : ['DT1 EN', 'DT1 DE', 'DT2 EN', 'DT3 DE', 'DT3 EN', 'DT4 DE'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000004']
}

var oDocumentTypeTestDataErp = {
        "DOKAR" : ['D1E', 'D2E', 'D3E', 'D4E']
}

var oDocumentTypeTextTestDataErp = {
        "DOKAR" : ['D1E', 'D2E', 'D2E', 'D3E', 'D4E'],
        "LANGU" : ['EN', 'EN', 'DE', 'EN', 'DE'],
        "DARTXT" : ['DT1 Erp EN', 'DT2 Erp EN', 'DT2 Erp DE', 'DT2 Erp DE', 'DT3 Erp EN', 'DT4 Erp DE']
}

var oDocumentStatusTestDataPlc = {
        "DOCUMENT_TYPE_ID" :['DT1', 'DT3', 'DT1', 'DT5', 'DT5'],
        "DOCUMENT_STATUS_ID": ['S1', 'S2', 'S3', 'S4', 'S5'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
}

var oDocumentStatusTextTestDataPlc = {
        "DOCUMENT_STATUS_ID" : ['S1', 'S1', 'S2', 'S3', 'S3', 'S4'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN', 'DE'],
        "DOCUMENT_STATUS_DESCRIPTION" : ['S1 EN', 'S1 DE', 'S2 EN', 'S3 DE', 'S3 EN', 'S4 DE'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000004']
}

var oDocumentStatusTestDataErp = {
        "DOKAR" : ['D1E', 'D2E', 'D3E', 'D4E'],
        "DOKST" : ['E1', 'E2', 'E3', 'E4']
}

var oDocumentStatusTextTestDataErp = {
        "DOKST" : ['E1', 'E2', 'E2', 'E3', 'E4'],
        "LANGU" : ['EN', 'EN', 'DE', 'EN', 'DE'],
        "DOSTX" : ['E1 Erp EN', 'E2 Erp EN', 'E2 Erp DE', 'E2 Erp DE', 'E3 Erp EN', 'E4 Erp DE']
}

var oDocumentTestDataPlc = {
        "DOCUMENT_TYPE_ID" :['DT1', 'DT3', 'DT1', 'DT5', 'DT2', 'DT5'],
        "DOCUMENT_ID": ['D1', 'D2', 'D3', 'D4', 'D2', 'D5'],
        "DOCUMENT_VERSION": ['1','1','1','1','1', '1'],
        "DOCUMENT_PART": ['1','1','1','1','1', '1'],
        "DOCUMENT_STATUS_ID": ['S1','S2','S3',null, null, null],
        "DESIGN_OFFICE_ID": ['L1','L1','L1',null,null, null],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001']
}

var oDocumentTextTestDataPlc = {
        "DOCUMENT_TYPE_ID": ['DT1','DT1','DT3','DT1','DT1','DT5', 'DT5'],
        "DOCUMENT_ID" : ['D1', 'D1', 'D2', 'D3', 'D3', 'D4', 'D5'],
        "DOCUMENT_VERSION": ['1','1','1','1','1','1', '1'],
        "DOCUMENT_PART": ['1','1','1','1','1','1', '1'],
        "LANGUAGE" :         ['EN', 'DE', 'EN', 'DE', 'EN', 'DE', 'DE'],
        "DOCUMENT_DESCRIPTION" : ['D1 EN', 'D1 DE', 'D2 EN', 'D3 DE', 'D3 EN', 'D4 DE', 'D5 DE'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null, null],
        "_SOURCE" : [1, 1, 1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000004', 'U000004']
}

var oDocumentTestDataErp = {
        "DOKAR" : ['D1E', 'D2E', 'D3E', 'D4E'],
        "DOKNR":  ['D1', 'D2', 'D3', 'D4'],
        "DOKVR":  ['1', '1', '1', '1'],
        "DOKTL":  ['1', '1', '1', '1']
}

var oDocumentTextTestDataErp = {
        "DOKAR" : ['D1E', 'D2E', 'D2E', 'D3E', 'D4E'],
        "DOKNR" : ['D1', 'D2', 'D2', 'D3', 'D4'],
        "DOKVR":  ['1', '1', '1', '1'],
        "DOKTL":  ['1', '1', '1', '1'],
        "LANGU" : ['EN', 'EN', 'DE', 'EN', 'DE'],
        "DKTXT" : ['D1 Erp EN', 'D2 Erp EN', 'D2 Erp DE', 'D2 Erp DE', 'D3 Erp EN', 'D4 Erp DE']
}

var oUOM = {
        "UOM_ID": ["TST","YYY"],
        "DIMENSION_ID": ["D2","TIME"],
        "NUMERATOR": [1,60],
        "DENOMINATOR": [1,1],
        "EXPONENT_BASE10": [0,0],
        "SI_CONSTANT": [0,0],
        "_VALID_FROM": ["2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z"],
        "_SOURCE": [1,2],
        "_CREATED_BY": ["U000", "U000"]
};

var oUOMText = {
        "UOM_ID": ["TST", "TST"],
        "LANGUAGE": ["EN", "DE"],
        "UOM_CODE": ["en", "de"],
        "UOM_DESCRIPTION": ["Test entry", "Test entry"],
        "_VALID_FROM": ["2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z"],
        "_SOURCE": [1,1],
        "_CREATED_BY": ["U000", "U000"]
};

var oUOMTestDataErp = {
        "MSEHI": "HUR",
        "DIMID": "TIME",
        "ZAEHL": 3600,
        "NENNR": 1,
        "EXP10": 0,
        "ADDKO": 0
};
var oUOMTextTestDataErp = {
        "MSEHI": ["HUR","HUR"],
        "LANGU": ['EN', 'DE'],
        "MSEH3": ["HUR","HUR"],
        "MSEHT": ["Hours", "Stunde"]
};

var oLanguage = {
        "LANGUAGE": ["ZZ","DE","EN"],
        "TEXTS_MAINTAINABLE": [1,1,1],
        "_VALID_FROM": ["2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z","2015-06-02T14:45:50.096Z"],
        "_SOURCE": [1,1,1],
        "_CREATED_BY": ["U000","U000","U000"]
};

var oCurrency = {
        "CURRENCY_ID": "TST",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774",
        "_VALID_FROM": "2015-06-02T14:45:50.096Z"
};

var oCurrencySecond = {
        "CURRENCY_ID": "EUR",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774",
        "_VALID_FROM": "2015-06-02T14:45:50.096Z"
};

var oCurrencyGBP = {
        "CURRENCY_ID": "GBP",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774",
        "_VALID_FROM": "2015-06-02T14:45:50.096Z"
};

var oCurrencyText = {
        "CURRENCY_ID": "TST",
        "LANGUAGE": "EN",
        "CURRENCY_CODE": "TST",
        "CURRENCY_DESCRIPTION": "Test currency",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774",
        "_VALID_FROM": "2015-06-02T14:45:50.096Z"
};

var oCurrencyConversion = {
        "EXCHANGE_RATE_TYPE_ID": sDefaultExchangeRateType,
        "FROM_CURRENCY_ID": "EUR",
        "TO_CURRENCY_ID": "TST",
        "FROM_FACTOR": 10,
        "TO_FACTOR": 5,
        "RATE": 4.5,
        "VALID_FROM": "2015-06-02T14:45:50.096Z",
        "_VALID_FROM": "2015-06-02T14:45:50.096Z",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774"
};

var oCurrencyConversionMultiple = {
        "EXCHANGE_RATE_TYPE_ID": [ sDefaultExchangeRateType, sDefaultExchangeRateType ],
        "FROM_CURRENCY_ID": [ "EUR", "EUR" ],
        "TO_CURRENCY_ID": [ "TST", "TST" ],
        "FROM_FACTOR": [ 10, 10 ],
        "TO_FACTOR": [ 5, 5 ],
        "RATE": [ 4.5, 4.6 ],
        "VALID_FROM": [ "2015-06-01T14:45:50.096Z", "2015-06-03T14:45:50.096Z"],
        "_VALID_FROM": [ "2015-06-02T14:45:50.096Z", "2015-06-02T14:45:50.096Z" ],
        "_SOURCE": [ 1, 1],
        "_CREATED_BY": [ "I305774", "I305774" ]
};
var oConversionFactorsTestDataErp = {
        "GDATU_C": "2015-06-02T14:45:50.096Z",
        "FCURR": "EUR",
        "TCURR": "TST",
        "FFACT": 10,
        "TFACT": 5
};
var oExchangeRatesTestDataErp = {
        "GDATU_C": "2015-06-02T14:45:50.096Z",
        "FCURR": "EUR",
        "TCURR": "TST",
        "UKURS": 4.5
};

var oMaterialAccountDetermination = {
        "CONTROLLING_AREA_ID": "#CA4",
        "MATERIAL_TYPE_ID": "MT1E",
        "PLANT_ID": "PL1E",
        "VALUATION_CLASS_ID": "V1E",
        "ACCOUNT_ID": "11000",
        "_VALID_FROM": "2015-06-19T12:27:23.197Z",
        "_SOURCE": 1,
        "_CREATED_BY": "I305774"
};

var oMaterialAccountDeterminationPlc = {
        "CONTROLLING_AREA_ID": ["#CA1","#CA1"],
        "MATERIAL_TYPE_ID": ["MT2","MT2"],
        "PLANT_ID": ["PL1","PL1"],
        "VALUATION_CLASS_ID": ["V2","V1"],
        "ACCOUNT_ID": ["11000","11000"],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,1],
        "_CREATED_BY": ["I305774","I305774"]
};

var oAccountTestDataPlc = {
        "ACCOUNT_ID": ["11000", "21000", "0", "625000"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1", "1000", "1000"],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : ["U000", "U000", "U000", "U000"]
};

var oAccountTextTestDataPlc = {
        "ACCOUNT_ID": ["11000", "21000"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
        "LANGUAGE" : ["DE", "DE"],
        "ACCOUNT_DESCRIPTION" : ["Bilanz Anlagen", "Bilanz Büro"],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : ["U000", "U000"]
};

var oAccountTestDataErp = {
        "KSTAR": ["11000", "21000", "33333"],
        "KOKRS" : ["#CA4", "#CA4", "#CA4"]
};

var oMaterialPriceTestDataPlc = {
        "PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","201","101","101"],
        "MATERIAL_ID": ["MAT1","MATEN","MAT1","MAT1"],
        "PLANT_ID": ["PL1","","","PL2"],
        "VENDOR_ID": ["*","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2015-06-19","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000", "123.8800000", "121.2500000", "121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000", "234.9800000", "200.5500000", "234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000", '100.0000000', "1.0000000", '2.0000000'],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0,0,0,0],
        "IS_PREFERRED_VENDOR": [0,0,0,0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000940","U000930","U000920"]
};

var oMaterialPriceFirstVersionTestDataPlc = {
    "PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
    "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
    "_CREATED_BY": ["I305774","U000940","U000930","U000920"]
};

var oPriceComponentTestDataPlc = {
        "PRICE_ID":[ '2A0000E0B2BDB9671600A4000936462B', '2A0000E0B2BDB9671600A4000936462B',  '2B0000E0B2BDB9671600A4000936462B',  '2B0000E0B2BDB9671600A4000936462B'],
        "_VALID_FROM":['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "ACCOUNT_ID":["11000","21000","625000","32000"],
        "PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000", "6.0000000"],
        "PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000", "7.0000000"],
        "CONTROLLING_AREA_ID":['#CA1', '#CA1', '1000', '#CA1']
};

var oPriceComponentDataPlc = {
        "PRICE_ID":[ '2D7755E0B2BDB9671600A4000936462B', '2A0000E0B2BDB9671600A4000936462B',  '2B0000E0B2BDB9671600A4000936462B', "2F3277E0B2BDB9671600A4000936462B"],
        "_VALID_FROM":['2019-05-30T01:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "ACCOUNT_ID":["11000","21000","625000", "11000"],
        "PRICE_FIXED":[ "13.0000000", "2.0000000", "6.0000000", "9.0000000"],
        "PRICE_VARIABLE":[ "14.0000000", "3.0000000", "7.0000000", "2.0000000"],
        "CONTROLLING_AREA_ID":['10', '1000', '1000', '100']
};

var oPriceTestDataErp = {
        "PRICE_SOURCE_ID": ["201","201","201"],
        "MATNR": ["MATE1", "MATE1","MATE2"],
        "WERKS": ["PLE1","","PLE2"],
        "VENDOR_ID": ["*", "*", "*"],
        "PROJECT_ID": ["*", "*", "*"],
        "VALID_FROM": ["2015-06-19","2010-01-01", "2010-01-01"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
        "STPRS": [120.45,110.25,170.23],
        "WAERS": ["EUR","EUR","EUR"],
        "PEINH": [1,1,1],
        "MEINS": ["H","H","H"]
};


var oPriceSourceTestDataPlc ={
        "PRICE_SOURCE_ID": ["101","102","201","301","302","901","902","903"],
        "PRICE_SOURCE_TYPE_ID": [1,1,1,2,2,3,4,0],
        "CONFIDENCE_LEVEL_ID": [3,5,4,3,4,2,null,1],
        "DETERMINATION_SEQUENCE": [1,2,3,1,2,0,0,0],
        "CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "CREATED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser],
        "LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
};

var oPriceSourceTestDataPlc1 ={
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","ERP_STANDARD_PRICE","PLC_PROJECT_PRICE", "PLC_PLANNED_PRICE", "PLC_STANDARD_PRICE", "PLC_CUSTOMER_PRICE", "PLC_CUSTOMER_PRICE", "PLC_TEST_PRICE", "PLC_TEST_PRICE", "PLC_MANUAL_PRICE", "PLC_CALCULATED_PRICE", "PLC_SURCHARGED_PRICE"],
        "PRICE_SOURCE_TYPE_ID": [1,1,1,1,2,2,2,1,2,2,1,3,4,5],
        "CONFIDENCE_LEVEL_ID": [5,4,3,4,5,4,3,5,5,3,3,null,null,null],
        "DETERMINATION_SEQUENCE": [1,2,3,4,1,2,3,5,4,0,0,0,0,0],
        "CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "CREATED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser],
        "LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
};

var oPriceSourceTextTestDataPlc = {
        "PRICE_SOURCE_ID": "101",
        "LANGUAGE": "DE",
        "PRICE_SOURCE_DESCRIPTION": "Standardpreis (SAP PLC)",
        "PRICE_SOURCE_TYPE_ID": 1
};

var oExchangeRateTypeTestDataPlc ={
        "EXCHANGE_RATE_TYPE_ID": [sDefaultExchangeRateType,"AVG","BUY","SELL"],
        "CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "CREATED_BY": [sTestUser,sTestUser,sTestUser,sTestUser],
        "LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate,sExpectedDate],
        "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser]
};

var oExchangeRateTypeTextTestDataPlc = {
        "EXCHANGE_RATE_TYPE_ID": ["AVG", "BUY", "SELL"],
        "LANGUAGE": ["EN", "EN", "EN"],
        "EXCHANGE_RATE_TYPE_DESCRIPTION": ["Average Rate", "Buying Rate", "Selling Rate"],
        "CREATED_ON": [sExpectedDate,sExpectedDate,sExpectedDate],
        "CREATED_BY": [sTestUser,sTestUser,sTestUser],
        "LAST_MODIFIED_ON":[sExpectedDate,sExpectedDate,sExpectedDate],
        "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser]
};

var oConfidenceLevelTestDataPlc = {
    "CONFIDENCE_LEVEL_ID": 3
};

var oConfidenceLevelTextTestDataPlc = {
    "CONFIDENCE_LEVEL_ID": 3,
    "LANGUAGE": "EN",
    "CONFIDENCE_LEVEL_DESCRIPTION": "TEST DESCRIPTION"
};

var oVendorTestDataPlc = {
    "VENDOR_ID" : ['V1', 'V2', 'V3'],
    "VENDOR_NAME" : ['N1', 'N2', 'N3'],
    "COUNTRY" : ['C1', 'C2', 'C3'],
    "POSTAL_CODE" : ['1', '1', '2'],
    "REGION" : ['A', 'A', 'B'],
    "CITY" : ['A', 'A', 'C'],
    "STREET_NUMBER_OR_PO_BOX" : ['1', '2', '3'],
    "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
    "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z'],
    "_SOURCE" : [1, 1, 1],
    "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
};

var oWorkCenterTestDataPlc = {
        "WORK_CENTER_ID" : ['WC1' , 'WC2', 'WC3', 'WC4', 'WC5'],
        "PLANT_ID" : ['PL1' , 'PL1', 'PL3', 'PL4', 'PL1'],
        "WORK_CENTER_CATEGORY": ['LABOR', 'LABOR_GROUP', 'ZONE', 'MACHINE', 'ZONE'],
        "COST_CENTER_ID" : ['CC2', 'CC2', 'CC2', 'CC2', 'CC1'],
        "CONTROLLING_AREA_ID" : ['1000', '1000', '1000', '1000', '1000'],
        "WORK_CENTER_RESPONSIBLE": ['U000001', 'U000001', 'U000001', 'U000003', 'U000003'],
        "EFFICIENCY": [30, 40, 50, 60, 40],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, null, null],
        "_SOURCE" :[1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000004']
};

var oProcessTestDataPlc1 = {
        "PROCESS_ID" : ['B1', 'B2', 'B3', 'B4'],
        "CONTROLLING_AREA_ID": ['1000', '1000', '1000', '1000'],
        "ACCOUNT_ID": ['A1', 'A2', 'A3', 'A2'],
        "COMMENT": ['Comment B1', 'Comment B2', 'Comment B3', 'Comment B4'],
        "_VALID_FROM": ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO": [null, null, null, null],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001']
};

var oActivityTypeTestDataPlc1 = {
        "ACTIVITY_TYPE_ID" :['ACTIVITY1111', 'ACTIVITY2222', 'ACTIVITY3333','ACTIVITY4444'],
        "CONTROLLING_AREA_ID" : ['1000', '1000', '1000','#CA1'],
        "ACCOUNT_ID" : ['CE1', 'CE2', 'CE1','11000'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001','U000001']
}

var oWorkCenterProcessTestDataPlc = {
    "WORK_CENTER_ID" : ['WC1', 'WC2', 'WC3','WC99', 'WC1'],
    "PROCESS_ID" : ['B1', 'B2', 'B3', 'B2', 'B2'],
    "PLANT_ID" : ['PL1' , 'PL1', 'PL3', 'PL5', 'PL1'],
    "CONTROLLING_AREA_ID" : ['1000', '1000', '1000', '#CA2', '1000'],
    "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
    "_VALID_TO" : [null, null, null, '2016-01-01T15:39:09.691Z', null],
    "_SOURCE" :[1, 1, 1, 2, 1],
    "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000002', 'U000002']
};

var oWorkCenterActivityTestDataPlc = {
    "WORK_CENTER_ID" : ['WC1', 'WC2', 'WC3','WC99', 'WC1'],
    "PROCESS_ID" : ['B1', 'B2', 'B3', '*', 'B2'],
    "ACTIVITY_TYPE_ID" :['ACTIVITY1111', 'ACTIVITY2222', 'ACTIVITY3333','ACTIVITY4444', 'ACTIVITY2222'],
    "PLANT_ID" : ['PL1' , 'PL1', 'PL3', 'PL5', 'PL1'],
    "CONTROLLING_AREA_ID" : ['1000', '1000', '1000', '#CA2', '1000'],
    "QUANTITY" : ["1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000"],
    "QUANTITY_UOM_ID" : [ "PC", "PC", "PC", "PC", "PC"],
    "TOTAL_QUANTITY_DEPENDS_ON" : [ 2, 2, 1, 1, 2],
    "LOT_SIZE" : [ '50.0000000', '25.0000000', null, null, '40.0000000'],
    "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
    "_VALID_TO" : [null, null, null, null, null],
    "_SOURCE" :[1, 1, 1, 2, 1],
    "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000002', 'U000002']
};

var oWorkCenterExtTestDataPlc = {
        "WORK_CENTER_ID" : ['WC1' , 'WC2', 'WC3', 'WC4'],
        "PLANT_ID" : ['PL1' , 'PL1', 'PL3', 'PL4'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "CWCE_DECIMAL_MANUAL": ["20.0000000", "30.0000000", "40.0000000", "50.0000000"],
        "CWCE_DECIMAL_UNIT": ["EUR", "CAD", "EUR", "CAD"]
};

var oWorkCenterTextTestDataPlc = {
        "WORK_CENTER_ID" : ['WC1' , 'WC2', 'WC3', 'WC4', 'WC5'],
        "PLANT_ID" : ['PL1', 'PL1', 'PL3', 'PL4', 'PL1'],
        "LANGUAGE" : ['EN', 'EN','EN','EN', 'DE'],
        "WORK_CENTER_DESCRIPTION" : ['WORK CENTER WC1 EN', 'WORK CENTER WC2 EN', 'WORK CENTER WC3 EN', 'WORK CENTER WC4 EN', 'WORK CENTER WC1 DE'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000003']
};

/*
var oControllingAreaTestDataPlc = {
    "CONTROLLING_AREA_ID":['1000', '2000'],
    "CONTROLLING_AREA_CURRENCY_ID": ['EUR', 'EUR'],
    "FISCAL_YEAR_VARIANT_ID":['K4','K4'],
    "CHART_OF_ACCOUNTS_ID": ['AAA', 'BBB'],
    "_VALID_FROM": ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
    "_VALID_TO": [null, null],
    "_SOURCE": [1, 1],
    "_CREATED_BY": ['U000001', 'U000001']
};*/



var oOverheadGroupTestDataPlc = {
        "OVERHEAD_GROUP_ID" : ['O1', 'O2', 'O3', 'O4'],
        "PLANT_ID" : ['PL1', 'PL2', 'PL3', 'PL3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1,1,1,1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001', 'U000001']
};

var oOverheadGroupTextTestDataPlc = {
        "OVERHEAD_GROUP_ID" : ['O1', 'O2', 'O2', 'O2', 'O3'],
        "PLANT_ID" : ['PL1', 'PL2', 'PL2', 'PL3', 'PL3'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN'],
        "OVERHEAD_GROUP_DESCRIPTION" : ['Overhead O1 P1 EN', 'Overhead O1 P2 DE', 'Overhead O2 P2 EN', 'Overhead O2 P3 DE', 'Overhead O3 P3 EN'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, null, null, '2015-04-30T15:39:09.691Z', '2015-04-30T15:39:09.691Z'],
        "_SOURCE" : [1,1,1,1,1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
};

var oOverheadGroupTestDataErp = {
        "KOSGR" : ['O1E', 'O2E'],
        "WERKS" : ['PL1E', 'PL2E']
};

var oOverheadGroupTextTestDataErp = {
        "KOSGR" : ['O1E', 'O1E', 'O2E', 'O2E'],
        "WERKS" : ['PL1E', 'PL1E', 'PL2E', 'PL2E'],
        "LANGU" : ['EN', 'DE', 'EN', 'DE'],
        "TXZSCHL" : ['Overhead O1E P1 EN Erp', 'Overhead O1E P1 DE Erp', 'Overhead O2E P2 EN Erp', 'Overhead O2E P2 DE Erp']
};

var oProfitCenterTestDataPlc = {
        "PROFIT_CENTER_ID" : ['P1', 'P2', 'P3','P4'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA2','1000'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T00:00:00.000Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, null],
        "_SOURCE" : [1, 1, 1,1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001', 'U000001']
};

var oProfitCenterTextTestDataPlc = {
        "PROFIT_CENTER_ID" : ['P1', 'P1', 'P2', 'P2', 'P3'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA2', '#CA3', '#CA2'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN'],
        "PROFIT_CENTER_DESCRIPTION" : ['Profit P1 EN', 'Profit P1 DE', 'Profit P2 EN', 'Profit P2 DE', 'Profit P3 EN'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1,1,1,1,1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
};

var oProfitCenterTestDataErp = {
        "PRCTR" : ['P1E', 'P2E'],
        "KOKRS" : ['CA1E', 'CA2E']
};

var oProfitCenterTextTestDataErp = {
        "PRCTR" : ['P1E', 'P1E', 'P2E'],
        "KOKRS" : ['CA1E', 'CA1E', 'CA2E'],
        "LANGU" : ['EN', 'DE', 'EN'],
        "KTEXT" : ['Profit P1 Erp EN', 'Profit P1 Erp DE', 'Profit P2 Erp DE']
};

var oDimensionTestDataPlc = {
        "DIMENSION_ID" : ['D1', 'D2', 'D3'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z'],
        "_SOURCE" : [1,1,1],
        "_CREATED_BY" : ['U000001', 'U000002', 'U000001']
};

var oDimensionTextTestDataPlc = {
        "DIMENSION_ID" : ['D1', 'D1', 'D2', 'D2', 'D3'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN'],
        "DIMENSION_DESCRIPTION" : ['Dimension D1 EN', 'Dimension D1 DE', 'Dimension D2 EN', 'Dimension D2 DE', 'Dimension D3 P3 EN'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1,1,1,1,1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
};

var oCustomerTestDataPlc = {
        "CUSTOMER_ID" : ['C1', 'C2', 'C3', 'C4'],
        "CUSTOMER_NAME" : ['N1', 'N2', 'N3', 'N4'],
        "COUNTRY" : ['C1', 'C2', 'C3', 'C4'],
        "POSTAL_CODE" : ['1', '1', '2', '3'],
        "REGION" : ['A', 'A', 'B', 'C'],
        "CITY" : ['A', 'A', 'C', 'D'],
        "STREET_NUMBER_OR_PO_BOX" : ['1', '2', '3', '4'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', sExpectedDate],
        "_VALID_TO" : [null, '2015-05-25T15:39:09.691Z', '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000002']
};

var oCostCenterTestDataPlc = {
        "COST_CENTER_ID" : ['CC1', 'CC2', 'CC3', 'CC2'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA1', '1000'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" : ['2015-05-25T15:39:09.691Z', null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" :['U000001', 'U000002', 'U000001', 'U000001']
};

var oCostCenterTextTestDataPlc = {
        "COST_CENTER_ID" : ['CC1', 'CC1', 'CC2', 'CC2', 'CC3'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA1', '#CA1', '#CA1'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN'],
        "COST_CENTER_DESCRIPTION" : ['Cost center CC1 EN', 'Cost center CC1 DE', 'Cost center CC2 EN', 'Cost center CC2 DE', 'Cost center CC3 EN'],
        "_VALID_FROM" :['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000002', 'U000003', 'U000001']
};

var oProcessTestDataPlc = {
        "PROCESS_ID" : ['B1', 'B2', 'B3', 'B4', 'B5'],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA2', '#CA3', '#CA2', '1000'],
        "ACCOUNT_ID": ['A1', 'A2', 'A3', 'A2', 'A2'],
        "COMMENT": ['Comment B1', 'Comment B2', 'Comment B3', 'Comment B4', 'Comment B5'],
        "_VALID_FROM": ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO": ['2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null],
        "_SOURCE": [1, 1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000002', 'U000001', 'U000001', 'U000001']
};

var oProcessTextTestDataPlc = {
        "PROCESS_ID" : ['B1', 'B1', 'B2', 'B2', 'B3', 'B4', 'B5'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA2', '#CA3', '#CA3', '#CA2', '1000'],
        "LANGUAGE" : ['EN', 'DE', 'EN', 'DE', 'EN', 'EN', 'DE'],
        "PROCESS_DESCRIPTION" : ['Process B1 #CA1 EN', 'Process B1 #CA2 DE', 'Process B2 #CA2 EN', 'Process B2 #CA3 DE', 'Process B3 #CA3 EN', 'Process B4 #CA2 EN', 'Process B5 #CA2 DE'],
        "_VALID_FROM" : ['2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z', '2015-01-01T15:39:09.691Z'],
        "_VALID_TO": [null, '2015-05-25T15:39:09.691Z', null, '2015-04-30T15:39:09.691Z', null, null, null],
        "_SOURCE": [1, 1, 1, 1, 1, 1, 1],
        "_CREATED_BY": ['U000001', 'U000001', 'U000002', 'U000003', 'U000001', 'U000001', 'U000001']
};

var oProcessTestDataErp = {
        "PRZNR" : ['B1E', 'B2E'],
        "KOKRS" : ["#CA4", "#CA4"],
        "VKSTA" : ["11000", "21000"]
};

var oProcessTextTestDataErp = {
        "PRZNR" : ['B1E', 'B1E', 'B2E'],
        "KOKRS" : ["#CA4", "#CA4", "#CA4"],
        "LANGU" : ['EN', 'DE', 'EN'],
        "KTEXT" : ['Bp B1 Erp EN', 'Bp B1 Erp DE', 'Bp B2 Erp DE']
};

var componentSplitAccountGroupTestDataPlc = {
        "ACCOUNT_GROUP_ID":1,
        "COMPONENT_SPLIT_ID": sComponentSplitId,
        "_VALID_FROM":'2015-05-24T15:39:09.691Z',
        "_SOURCE":1,
        "_CREATED_BY":'U000030'
};

var accountGroupTestDataPlc = {
        "ACCOUNT_GROUP_ID": 1,
        "CONTROLLING_AREA_ID" : '#CA1',
        "_VALID_FROM":'2015-05-22T15:39:09.691Z',
        "COST_PORTION" : 2
};

var componentSplit = {
        "COMPONENT_SPLIT_ID" : ['1','2', '3'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA1', '#CA2'],
        "_VALID_FROM" : ['2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z'],
        "_VALID_TO" : [null, '2015-05-29T08:25:05.150Z', null],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001']
};

var componentSplitText = {
        "COMPONENT_SPLIT_ID" : ['1', '2', '2', '3', '3'],
        "LANGUAGE" : ['EN', 'EN','DE', 'EN', 'DE'],
        "COMPONENT_SPLIT_DESCRIPTION" : ['Test1', 'Test2', 'Test2', 'Test3', 'Test3'],
        "_VALID_FROM" : ['2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z', '2015-05-28T15:39:09.691Z'],
        "_VALID_TO" :[null, '2015-05-29T08:25:05.150Z', '2015-05-29T08:25:05.150Z', null, '2015-05-29T08:25:05.150Z'],
        "_SOURCE" : [1, 1, 1, 1, 1],
        "_CREATED_BY" : ['U000001', 'U000001', 'U000001', 'U000001', 'U000001']
};
// Test Data for Account, Account Group and Account Range
var oAccountTest = {
        "ACCOUNT_ID": ["777", "778"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};

var oAccountTextTest = {
        "ACCOUNT_ID": ["777", "777", "778", "778"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1", "#CA1", "#CA1"],
        "LANGUAGE" : ["EN", "DE", "EN", "DE"],
        "ACCOUNT_DESCRIPTION" : ["EN Test 7", "DE Test 7", "EN Test 8", "DE Test 8"],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : [userSchema, userSchema, userSchema, userSchema]
};

var oAccountValidTo = {
        "ACCOUNT_ID" : ["11000", "21000"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, "2015-05-05T00:00:00.000Z"],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};

var oAccountTextValidTo = {
        "ACCOUNT_ID": ["11000", "21000"],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
        "LANGUAGE" : ["DE", "DE"],
        "ACCOUNT_DESCRIPTION" : ["Bilanz Anlagen", "Bilanz Büro"],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, "2015-05-05T00:00:00.000Z"],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};

var oAccountGroupTest = {
        "ACCOUNT_GROUP_ID" : [700, 800, 700],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1", '1000'],
        "COST_PORTION" : [7, 8, 7],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, null],
        "_SOURCE" : [1, 1, 1],
        "_CREATED_BY" : [userSchema, userSchema, userSchema]
};

var oAccountGroupTextTest = {
        "ACCOUNT_GROUP_ID" : [700, 700, 800, 800],
        "LANGUAGE" : ["EN", "DE", "EN", "DE"],
        "ACCOUNT_GROUP_DESCRIPTION" : ["EN Test 700", "DE Test 700", "EN Test 800", "DE Test 800"],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, null, null],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : [userSchema, userSchema, userSchema, userSchema]
};

var oAccountGroupValidTo = {
        "ACCOUNT_GROUP_ID" : [701, 801],
        "CONTROLLING_AREA_ID" : ["#CA1", "#CA1"],
        "COST_PORTION" : [7, 8],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, "2015-05-05T00:00:00.000Z"],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};

var oAccountGroupTextValidTo = {
        "ACCOUNT_GROUP_ID" : [701, 701, 801, 801],
        "LANGUAGE" : ["EN", "DE", "EN", "DE"],
        "ACCOUNT_GROUP_DESCRIPTION" : ["EN Test 701", "DE Test 701", "EN Test 801", "DE Test 801"],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, "2015-05-05T00:00:00.000Z", "2015-05-05T00:00:00.000Z"],
        "_SOURCE" : [1, 1, 1, 1],
        "_CREATED_BY" : [userSchema, userSchema, userSchema, userSchema]
};

var oAccountRangeTest = {
        "FROM_ACCOUNT_ID": ["777", "778"],
        "TO_ACCOUNT_ID" : ["777", "778"],
        "ACCOUNT_GROUP_ID" : [700, 800],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};

var oAccountRangeValidTo = {
        "FROM_ACCOUNT_ID": ["11000", "21000"],
        "TO_ACCOUNT_ID" : ["11000", "21000"],
        "ACCOUNT_GROUP_ID" : [701, 801],
        "_VALID_FROM" : ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, "2015-05-05T00:00:00.000Z"],
        "_SOURCE" : [1, 1],
        "_CREATED_BY" : [userSchema, userSchema]
};
// End of Test Data for Account, Account Group and Account Range

var oDefaultSettingsTestData = {
        "CONTROLLING_AREA_ID": "#CA1",
        "COMPANY_CODE_ID": "CC1",
        "PLANT_ID": "PL1",
        "REPORT_CURRENCY_ID": "EUR",
        "COMPONENT_SPLIT_ID": "#CS1",
        "COSTING_SHEET_ID": "COGM"
};

var oDefaultSettingsTestDataErp = {
        "CONTROLLING_AREA_ID": "#CA5",
        "COMPANY_CODE_ID": "#C5",
        "PLANT_ID": "PL2E",
        "REPORT_CURRENCY_ID": "EUR",
        "COMPONENT_SPLIT_ID": "#CS1",
        "COSTING_SHEET_ID": "COGM"
};

var oComponentSplitTestDataPlcDefaultSettings = {
        "COMPONENT_SPLIT_ID" : ['#CS1', '#CS2', '#CS3'],
        "CONTROLLING_AREA_ID" : ['#CA1', '#CA2', '#CA3'],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_VALID_TO" : [null, null, null],
        "_SOURCE" : [1,1,1],
        "_CREATED_BY" : ["U000", "U000", "U000"]
}

var oActivityPriceTestDataPlc = {
        "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["301","301","301"],
        "CONTROLLING_AREA_ID": ['#CA1','1000','1000'],
        "COST_CENTER_ID": ['CC2','CC2',"CC4"],
        "ACTIVITY_TYPE_ID": ["ACTIVITY4444","*","*"],
        "PROJECT_ID": ["*","*","*"],
        "VALID_FROM": ["2015-01-01","2010-01-01","2010-01-01"],
        "CUSTOMER_ID": ['*', '*', '*'],

        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["135.98","135.98","150"],
        "PRICE_VARIABLE_PORTION": ["123.4500000", "123.4500000", "200"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC"],
        "IS_PRICE_SPLIT_ACTIVE": [0,0,0],
        "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1,1,1],
        "_CREATED_BY": ["I305778","U0001","U0001"]
};
var oActivityPriceFirstVersionTestDataPlc = {
    "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
    "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
    "_CREATED_BY": ["I305778","U0001","U0001"]
};
var oActivityPriceExtTestDataPlc = {
        "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B"],
        "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z"],
        "CAPR_DECIMAL_MANUAL": [20, 30],
        "CAPR_DECIMAL_UNIT": ["EUR", "CAD"]
};

var oCustomerTestDataErp = {
        "KUNNR" : 'CUSTERP',
        "LAND1" : 'DE',
        "NAME1" : 'Customer',
        "ORT01" : 'Walldorf',
        "PSTLZ" : '111111',
        "REGIO" : '01',
        "STRAS" : 'Street Name'
}

var oProjectTestData={
        "PROJECT_ID":               ["PR1",                     "PR2",                      "PRR"],
        "ENTITY_ID":                [1,                          2,                           3],
        "REFERENCE_PROJECT_ID":     ["0",                       "0",                        "0"],
        "PROJECT_NAME":             ["Prj 1",                   "Prj 2",                    "Prj 3"],
        "PROJECT_RESPONSIBLE":      [sTestUser,                 sTestUser,                  sTestUser],
        "CONTROLLING_AREA_ID":      [oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[2]],
        "CUSTOMER_ID":              ['C1',                      'C1',                       'C1'],
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
}

var oProjectCurrencyTestData={
        "PROJECT_ID":               ["PR3",                     "PR4",                      "PPP"],
        "ENTITY_ID":                [4,                          5,                           6],
        "REFERENCE_PROJECT_ID":     ["0",                       "0",                        "0"],
        "PROJECT_NAME":             ["Prj 1",                   "Prj 2",                    "Prj 3"],
        "PROJECT_RESPONSIBLE":      [sTestUser,                 sTestUser,                  sTestUser],
        "CONTROLLING_AREA_ID":      [oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3], oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[2]],
        "CUSTOMER_ID":              ['C1',                      'C1',                       'C1'],
        "SALES_DOCUMENT":           ["SD1",                     "SD1",                      "SD1"],
        "SALES_PRICE":              ['20',                      '10',                       '10'],
        "SALES_PRICE_CURRENCY_ID":  ["CAD",                     null,                       "EUR"],
        "COMMENT":                  ["Comment 1",               "Comment 2",                "Comment 3"],
        "COMPANY_CODE_ID":          ["CC1",                     "CC1",                      "CC1"],
        "PLANT_ID":                 ["PL1",                     "PL1",,                     "PL1"],
        "BUSINESS_AREA_ID":         ["B1",                      "B1",                       "B1"],
        "PROFIT_CENTER_ID":         ["P4",                      "P4",                       "P4"],
        "REPORT_CURRENCY_ID":       ["USD",                     "USD",                      "EUR"],
        "COSTING_SHEET_ID":         ["COGM",                    "COGM",                     "COGM"],
        "COMPONENT_SPLIT_ID":       [sComponentSplitId,         sComponentSplitId,          sComponentSplitId],
        "START_OF_PROJECT":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "END_OF_PROJECT":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "START_OF_PRODUCTION":      [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "END_OF_PRODUCTION":        [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "VALUATION_DATE":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "LIFECYCLE_VALUATION_DATE": [null,                      null,                       null],
        "LIFECYCLE_PERIOD_INTERVAL":[12,                        12,                         12],
        "CREATED_ON":               [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "CREATED_BY":               [sTestUser,                 sTestUser,                  sTestUser],
        "LAST_MODIFIED_ON":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime,   sExpectedDateWithoutTime],
        "LAST_MODIFIED_BY":         [sTestUser,                 sTestUser,                  sTestUser],
        "EXCHANGE_RATE_TYPE_ID":    ["null",                    sDefaultExchangeRateType,   null],
        "MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy,   sStandardPriceStrategy,     sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy,   sStandardPriceStrategy,     sStandardPriceStrategy]
}

var oProjectTestData1={
        "PROJECT_ID":               ["PR11",                    "PR12"],
        "ENTITY_ID":                [7,                           8],
        "REFERENCE_PROJECT_ID":     ["0",                       "0"],
        "PROJECT_NAME":             ["Prj 3",                   "Prj 4"],
        "PROJECT_RESPONSIBLE":      [sTestUser,                 sTestUser],
        "CONTROLLING_AREA_ID":      [oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[2], oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[2]],
        "CUSTOMER_ID":              ['C1',                      'C1'],
        "SALES_DOCUMENT":           ["SD1",                     "SD1"],
        "SALES_PRICE":              ['20',                      '10'],
        "SALES_PRICE_CURRENCY_ID":  ["EUR",                     "EUR"],
        "COMMENT":                  ["Comment 1",               "Comment 2"],
        "COMPANY_CODE_ID":          ["CC1",                     "CC1"],
        "PLANT_ID":                 ["PL1",                     "PL1"],
        "BUSINESS_AREA_ID":         ["B1",                      "B1"],
        "PROFIT_CENTER_ID":         ["P4",                      "P4"],
        "REPORT_CURRENCY_ID":       ["EUR",                     "EUR"],
        "COSTING_SHEET_ID":         ["COGM",                    "COGM"],
        "COMPONENT_SPLIT_ID":       [sComponentSplitId,         sComponentSplitId],
        "START_OF_PROJECT":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "END_OF_PROJECT":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "START_OF_PRODUCTION":      [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "END_OF_PRODUCTION":        [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "VALUATION_DATE":           [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "LIFECYCLE_VALUATION_DATE": [null,                      null],
        "LIFECYCLE_PERIOD_INTERVAL":[12,                        12],
        "CREATED_ON":               [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "CREATED_BY":               [sTestUser,                 sTestUser],
        "LAST_MODIFIED_ON":         [sExpectedDateWithoutTime,  sExpectedDateWithoutTime],
        "LAST_MODIFIED_BY":         [sTestUser,                 sTestUser],
        "EXCHANGE_RATE_TYPE_ID":    [sDefaultExchangeRateType,  null],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy,   sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy,   sStandardPriceStrategy]
}

var oProjectPriceData={
        "PROJECT_ID":               ["PT1"],
        "ENTITY_ID":                [100],
        "REFERENCE_PROJECT_ID":     [null],
        "PROJECT_NAME":             ["Prj 1"],
        "PROJECT_RESPONSIBLE":      [null],
        "CONTROLLING_AREA_ID":      ["#CA1"],
        "CUSTOMER_ID":              [null],
        "SALES_DOCUMENT":           [null],
        "SALES_PRICE":              [null],
        "SALES_PRICE_CURRENCY_ID":  [null],
        "COMMENT":                  ["Comment 1"],
        "COMPANY_CODE_ID":          [null],
        "PLANT_ID":                 [null],
        "BUSINESS_AREA_ID":         [null],
        "PROFIT_CENTER_ID":         [null],
        "REPORT_CURRENCY_ID":       ["EUR"],
        "COSTING_SHEET_ID":         [null],
        "COMPONENT_SPLIT_ID":       [null],
        "START_OF_PROJECT":         [null],
        "END_OF_PROJECT":           [null],
        "START_OF_PRODUCTION":      [null],
        "END_OF_PRODUCTION":        [null],
        "VALUATION_DATE":           [null],
        "LIFECYCLE_VALUATION_DATE": [null],
        "LIFECYCLE_PERIOD_INTERVAL":[12],
        "CREATED_ON":               ["2019-05-30T01:39:09.691Z"],
        "CREATED_BY":               [sTestUser],
        "LAST_MODIFIED_ON":         [sExpectedDateWithoutTime],
        "LAST_MODIFIED_BY":         [sTestUser],
        "EXCHANGE_RATE_TYPE_ID":    [null],
        "MATERIAL_PRICE_STRATEGY_ID":[sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID":[sStandardPriceStrategy]
}

var oFoldersTestData = {
        "ENTITY_ID":               [4,                                        5,                          6],
        "FOLDER_NAME":             ["SAP Example: Folder 1","SAP Example: Folder 2","SAP Example: Folder 3"],
        "CREATED_BY":              [sTestUser,                        sTestUser,                  sTestUser],
        "MODIFIED_BY":             [sTestUser,                        sTestUser,                  sTestUser],
        "CREATED_ON":              [sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime],
        "MODIFIED_ON":             [sExpectedDateWithoutTime,sExpectedDateWithoutTime,sExpectedDateWithoutTime]
}

var oEntityTypes = {
        Folder : "F",
        Project : "P"
}

var oEntityRelationTestData = {
        "ENTITY_ID" : [1, 2, 3, 4, 5, 6],
        "PARENT_ENTITY_ID":[null, 4, 4, null, 4, 4],
        "ENTITY_TYPE": [oEntityTypes.Project, oEntityTypes.Project, oEntityTypes.Project, oEntityTypes.Folder, oEntityTypes.Folder, oEntityTypes.Folder]
}

var oItemCategoryTestData={
        "ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
        "DISPLAY_ORDER":[0,1,2,3,4,5,6,7,8,9,10],
        "CHILD_ITEM_CATEGORY_ID":[0,1,2,3,4,5,6,7,8,9,10],
        "ITEM_CATEGORY_CODE":['CODE0','CODE1','CODE2','CODE3','CODE4','CODE5','CODE6','CODE7','CODE8','CODE9','CODE10'],
        "ICON":['icon0','icon1','icon2','icon3','icon4','icon5','icon6','icon7','icon8','icon9','icon10']
}
var oApplicationTimeout = {
        "APPLICATION_TIMEOUT_ID" : ["SessionTimeout"],
        "VALUE_IN_SECONDS" : [10800],
        "TIMEOUT_DESCRIPTION" : ["3 hours time out of session"]
}

var oRecentCalculationTestData = {
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId ],
        "USER_ID" : [ sTestUser, sTestUser ],
        "LAST_USED_ON" : [ sExpectedDate, sValidFromDate ]
};

var oLayout = {
        "LAYOUT_ID": [1, 2, 3, 4, 5, 6, 7],
        "LAYOUT_NAME": [null, 'Test', null, 'Test4', 'Test5', 'Test6', 'Test7'],
        "IS_CORPORATE": [0, 1, 0, 0, 1, 0, 0],
        "LAYOUT_TYPE": [1,1,1,1,1,1,1]
};
var oLayoutPersonal= {
        "LAYOUT_ID": [1, 3, 6, 7],
        "USER_ID": ['UsrA', sTestUser, sTestUser, 'UsrB'],
        "IS_CURRENT": [1, 1, 0, 0],
};
var oLayoutColumns = {
        "LAYOUT_ID":            [1,    1,      1,      2,    2,      2,      2,      3,      4,      5,      5,      5,      6,      7,      7],
        "DISPLAY_ORDER":        [0,    1,      2,      0,    1,      2,      3,      1,      1,      1,      2,      3,      1,      1,      2],
        "PATH":                 [null, "Item", "Item", null, null,   "Item", "Item", "Item", "Item", "Item", "Item", "Item", null,   "Item", "Item"],
        "BUSINESS_OBJECT":      [null, "Item", null,   null, "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", null,   "Item", "Item"],
        "COLUMN_ID":            [null, "ColA", "ColB", null, null,   "ColC", "ColB", "ColC", "ColD", "ColC", "ColA", null,   "ColB", "ColE", "ColC"],
        "COSTING_SHEET_ROW_ID": [null, null,   null,   null, 2,      null,   null,   null,   null,   null,   null,   null,   null,   null,   null],
        "COST_COMPONENT_ID":    [null, null,   null,   null, 2,      null,   null,   null,   null,   null,   null,   4,      null,   null,   null],
        "COLUMN_WIDTH":         [430,  5,      10,     430,  5,      8,      10,     8,      12,     8,      5,      12,     10,     6,      8]
};
var oLayoutHiddenFields = {
        "LAYOUT_ID": [1, 1, 2, 3, 3 , 4, 4, 5, 5, 6, 7],
        "PATH": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
        "BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
        "COLUMN_ID": ["ColC", "ColE", "ColD", "ColE", "ColA", "ColF", "ColB", "ColD", "ColE", "ColA", "ColA"]
};

var oFrontendSettings = {
        "SETTING_ID": [1, 2, 3, 4, 5, 6, 7],
        "SETTING_NAME": ['CorporateFilter1', 'CorporateFilter2', 'MyFilter1', 'MyFilter2', 'NotAFilter', 'MyFilter1', 'MassChange'],
        "SETTING_TYPE": ['FILTER', 'FILTER', 'FILTER', 'FILTER', 'NotFilter', 'FILTER', 'MASSCHANGE'],
        "USER_ID": [null, null, sTestUser, sTestUser, sTestUser, 'AnotherUser', sTestUser],
        "SETTING_CONTENT": ['{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}',
                            '{"Field":"CONFIDENCE_LEVEL_ID", "Value":"3"}=',
                            '{"Field":"PLANT_ID", "Value":"1000"}=',
                            '{"Field":"PLANT_ID", "Value":"1000"}==',
                            'no data',
                            '{"Field":"PLANT_ID", "Value":"1000"}=',
                            '{"Field":"PLANT_ID", "Value":"1000"}=']
};

var oProjectTotalQuantities = {
        "PROJECT_ID": ["PR1", "PR1", "PR3"],
        "CALCULATION_ID": [ iCalculationId, iSecondCalculationId, 5078 ],
        "CALCULATION_VERSION_ID": [ iCalculationVersionId, iSecondVersionId, 5809 ],
        "MATERIAL_PRICE_SURCHARGE_STRATEGY": [Constants.ProjectSurchargeStrategies.NoSurcharges, Constants.ProjectSurchargeStrategies.NoSurcharges, Constants.ProjectSurchargeStrategies.NoSurcharges],
        "ACTIVITY_PRICE_SURCHARGE_STRATEGY": [Constants.ProjectSurchargeStrategies.NoSurcharges, Constants.ProjectSurchargeStrategies.NoSurcharges, Constants.ProjectSurchargeStrategies.NoSurcharges],
        "LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY": [ sTestUser, sTestUser, sTestUser ]
};

var oLifecyclePeriodValues = {
        "PROJECT_ID": [ "PR1", "PR1", "PR1", "PR1", "PR1", "PR1", "PR3", "PR3", "PR3" ],
        "CALCULATION_ID": [iCalculationId, iCalculationId, iCalculationId, iSecondCalculationId, iSecondCalculationId, iSecondCalculationId, 5078, 5078, 5078],
        "LIFECYCLE_PERIOD_FROM": [ 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428 ],
        "VALUE": [ 3000, 4000, 5000, 500, 1000, 2000, 50, 150, 250 ],
        "LAST_MODIFIED_ON": [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY": [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ]
};

var oProjectActivityPriceSurcharges = {
        "RULE_ID": [ 1, 2, 3 ],
        "PLANT_ID": [ oPlantTextTestDataPlc.PLANT_ID[0], oPlantTextTestDataPlc.PLANT_ID[2], oPlantTextTestDataPlc.PLANT_ID[3] ],
        "ACCOUNT_GROUP_ID": [ oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], oAccountGroupTextTest.ACCOUNT_GROUP_ID[0] ],
        "COST_CENTER_ID": [ oCostCenterTextTestDataPlc.COST_CENTER_ID[0], oCostCenterTextTestDataPlc.COST_CENTER_ID[0], oCostCenterTextTestDataPlc.COST_CENTER_ID[0] ],
        "ACTIVITY_TYPE_ID": [ oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0], oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0], oActivityTypeTextTestDataPlc.ACTIVITY_TYPE_ID[0] ],
        "PROJECT_ID": [ oProjectTestData.PROJECT_ID[0], oProjectTestData.PROJECT_ID[1], oProjectTestData.PROJECT_ID[1] ]
};

var oProjectActivityPriceSurchargeValues = {
        "RULE_ID": [ 1, 1, 1, 2, 2, 2, 3, 3, 3 ],
        "LIFECYCLE_PERIOD_FROM": [ 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428 ],
        "VALUE": ['3.0000000', '4.0000000', '5.0000000', 5, 10, 2, 5, 15, 25 ],
};


var oProjectMaterialPriceSurcharges = {
        "RULE_ID": [ 11, 12, 13 ],
        "PLANT_ID": [ oPlantTextTestDataPlc.PLANT_ID[0], oPlantTextTestDataPlc.PLANT_ID[2], oPlantTextTestDataPlc.PLANT_ID[3] ],
        "ACCOUNT_GROUP_ID": [ oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], oAccountGroupTextTest.ACCOUNT_GROUP_ID[0], oAccountGroupTextTest.ACCOUNT_GROUP_ID[0] ],
        "MATERIAL_GROUP_ID": [ oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[0], oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[0], oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[0] ],
        "MATERIAL_TYPE_ID": [ oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[0], oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[0], oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[0] ],
        "PROJECT_ID": [ oProjectTestData.PROJECT_ID[0], oProjectTestData.PROJECT_ID[1], oProjectTestData.PROJECT_ID[1] ],
        "MATERIAL_ID": [oMaterialTestDataPlc.MATERIAL_ID[0], oMaterialTestDataPlc.MATERIAL_ID[0], oMaterialTestDataPlc.MATERIAL_ID[0]]
};

var oProjectMaterialPriceSurchargeValues = {
        "RULE_ID": [ 11, 11, 11, 12, 12, 12, 13, 13, 13 ],
        "LIFECYCLE_PERIOD_FROM": [ 1404, 1416, 1428, 1404, 1416, 1428, 1404, 1416, 1428 ],
        "VALUE": [ 3, 4, 5, 5, 10, 2, 5, 15, 25 ],
};

var oTask= {
        "TASK_ID":  [100, 101, 102, 103, 104],
        "SESSION_ID":  [sSessionId, 'Session2', 'Session3', sSessionId, sSessionId],
        "TASK_TYPE":  ['PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'TEST', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS', 'PROJECT_CALCULATE_LIFECYCLE_VERSIONS'],
        "STATUS":  ['active','completed','active','inactive','active'],
        "PARAMETERS":  ['par1', 'par2', 'par3', 'par4', 'par5'],
        "PROGRESS_STEP":  [6, 0, 4, 0, 7],
        "PROGRESS_TOTAL":  [12, 18, 14, 15, 11],
        "ERROR_CODE": [null, null, null, 'stopped', null],
        "ERROR_DETAILS":  [null, null, null, 'terminated', null]
};

var oPrivilege= {
        "OBJECT_TYPE": ['PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT'],
        "OBJECT_ID": ['PR1', 'PR1', 'PR1', 'PR1', 'PR2', 'PR2', 'PR2', 'PR3', 'PR3', 'PR3', 'PR3', 'PRR', 'VariantTestProject'],
        "USER_ID": ['USR1', 'SYSTEM', sTestUser, 'USR4', 'USR2', 'USR3', 'USR1', sTestUser, 'USR3', 'USR5', 'USR1', sTestUser, sTestUser],
        "PRIVILEGE": ['ADMINISTRATE', 'CREATE_EDIT', 'ADMINISTRATE', 'READ', 'CREATE_EDIT', 'FULL_EDIT', 'ADMINISTRATE', 'ADMINISTRATE', 'READ', 'ADMINISTRATE', 'FULL_EDIT', 'ADMINISTRATE', 'READ']
};

var oUserGroups = {
        "USERGROUP_ID": ['USRGR1', 'UGR2', 'USRGR3', 'USRGR4', 'USRGR5', 'UGR6', 'USRGR7'],
        "DESCRIPTION": ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7']
};

var oUserGroupUser = {
        "USERGROUP_ID": ['USRGR1', 'USRGR1', 'USRGR1', 'USRGR4', 'USRGR4', 'USRGR4'],
        "USER_ID": ['USR1', 'USR2', 'USR3', 'USR4', 'USR1', 'USR10']

};

var oUserGroupUserGroups = {
        "PARENT_USERGROUP_ID": ['USRGR1', 'USRGR1', 'USRGR1', 'USRGR1', 'USRGR4', 'USRGR4', 'USRGR7'],
        "CHILD_USERGROUP_ID": ['UGR6', 'UGR2', 'USRGR5', 'USRGR3', 'USRGR3', 'UGR2', 'USR1']
};

var oGroupPrivilege = {
        "OBJECT_TYPE": ['PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT', 'PROJECT'],
        "OBJECT_ID": ['PR1', 'PR1', 'PR1', 'PR2', 'PR2', 'PR3', 'PR3', 'PRR'],
        "USERGROUP_ID": ['USRGR1', 'USRGR5', 'USRGR3', 'UGR2', 'UGR6', 'USRGR1', 'UGR6', 'USRGR1'],
        "PRIVILEGE": ['ADMINISTRATE', 'CREATE_EDIT', 'READ', 'READ', 'CREATE_EDIT', 'FULL_EDIT', 'READ', 'READ']
};

var oVariantTestData = {
    VARIANT_ID: [iVariantId, iSecondVariantId, iThirdVariantId, 44],
    CALCULATION_VERSION_ID: [iCalculationVersionId, iCalculationVersionId, iSecondVersionId, iSecondVersionId],
    VARIANT_NAME: ["S-Engine Petrol", "M-Engine Petrol", "M-Engine Electric", "XS-Engine Petrol"],
    COMMENT: ["Comment1", "Comment2", "Comment3", "Comment4"],
    EXCHANGE_RATE_TYPE_ID: ["STANDARD", "STANDARD", "STANDARD", "STANDARD"],
    TOTAL_COST: ["10.0000000", "10.0000000", "1.0000000", "1.0000000"],
    REPORT_CURRENCY_ID: ["EUR", "EUR", "EUR", "EUR"],
    SALES_PRICE: ["10.0000000", "10.0000000", "10.0000000", "10.0000000"],
    SALES_PRICE_CURRENCY_ID: ["EUR", "EUR", "EUR", "EUR"],
    VARIANT_TYPE: [0,0,0,0],
    IS_SELECTED: [1, 1, 1, 1],
    LAST_REMOVED_MARKINGS_ON: [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
    LAST_REMOVED_MARKINGS_BY: [sTestUser, sTestUser, sTestUser, sTestUser],
    LAST_MODIFIED_ON: [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
    LAST_MODIFIED_BY: [sTestUser, sTestUser, sTestUser, sTestUser],
    LAST_CALCULATED_ON:  [sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate],
    LAST_CALCULATED_BY: [sTestUser, sTestUser, sTestUser, sTestUser],
};

var oVariantItemTestData = {
    VARIANT_ID: [ iVariantId, iVariantId, iVariantId, iSecondVariantId, iSecondVariantId, iSecondVariantId, iSecondVariantId, iSecondVariantId, iThirdVariantId ],
    ITEM_ID: [ 3001, 3002, 3003, 3001, 3002, 3003, 3004, 3005, 5001 ],
    IS_INCLUDED: [1, 1, 1, 1, 1, 1, 0, 0, 1 ],
    QUANTITY: [ "10.0000000", "10.0000000", "10.0000000", "20.0000000", "3.0000000", "6.0000000", "1.0000000", "1.0000000", "1.0000000" ],
    QUANTITY_CALCULATED: ["0.0000000", "0.0000000", "0.0000000", "0.0000000", "0.0000000", "0.0000000", "0.0000000", "0.0000000", "0.0000000" ],
    QUANTITY_STATE: [1, 1, 0, 1, 1, 0, 1, 1, 1],
    QUANTITY_UOM_ID: [ "PC", "PC", "H", "PC", "PC", "H", "PC", "PC", "PC" ],
    TOTAL_QUANTITY: [ "110.0000000", "100.0000000", "200.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000" ],
    TOTAL_COST: [ "12.0000000", "101.0000000", "201.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000", "1.0000000" ],
};

var oVariantItemTemporaryTestData = _.extend(JSON.parse(JSON.stringify(oVariantItemTestData)), {
        "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId,  iSecondVersionId]
});


var oVariantItemGenerateTestData = {
    VARIANT_ID: [ iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId, iVariantId ],
    ITEM_ID: [ 1, 11, 12, 13, 111, 112, 113, 1111, 1112, 1113, 14, 15, 16, 161, 162 ],
    IS_INCLUDED: [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0 ],
    QUANTITY: [ 11, 10, 20, 30, 40, 50, 1, 1, 1, 1, 10, 20, 30, 40, 50 ],
    QUANTITY_UOM_ID: [ "PC", "PC", "MM", "H", "MIN", "PC", "PC", "PC", "PC", "PC", "PC", "MM", "H", "MIN", "PC" ],
    TOTAL_QUANTITY: [ 11, 10, 20, 30, 40, 50, 1, 1, 1, 1, 10, 20, 30, 40, 50 ],
    TOTAL_COST: [ 11, 10, 20, 30, 40, 50, 1, 1, 1, 1, 10, 20, 30, 40, 50 ],
};

var oVersionItemGenerateTestData = {
    CALCULATION_VERSION_ID: [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, iCalculationVersionId ],
    ITEM_ID: [ 1, 11, 12, 13, 111, 112, 113, 1111, 1112, 1113, 14, 15, 16, 161, 162 ],
    PREDECESSOR_ITEM_ID: [ null, null, 11, 12, null, 111, 112, null, 1111, 1112, 13, 14, 15, null, 161 ],
    PARENT_ITEM_ID: [ null, 1, 1, 1, 13, 13, 13, 113, 113, 113, 1, 1, 1, 16, 16],
    IS_ACTIVE: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    ITEM_CATEGORY_ID: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    CHILD_ITEM_CATEGORY_ID: [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    CREATED_ON: [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
    CREATED_BY: [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ],
    LAST_MODIFIED_ON: [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
    LAST_MODIFIED_BY: [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ],
};
/*
this test data contains versions, generated from variants in order to be able to test that
for the persistency level functions getVariant and getVariants the correct values for
LAST_GENERATED_VERSION_ID and LAST_GENERATED_CALCULATION_ID the correct values are returned;
*/
var oCalculationVersionForVariantTestData = {
    "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId, 5809, 112, 113, 221, 222 ],
    "CALCULATION_ID" : [ iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iCalculationId, iSecondCalculationId ],
    "CALCULATION_VERSION_NAME" : [ "VariantTestVersion1", "VariantTestVersion2", "1. Gen from V11", "2. Gen from V11", "3. Gen from V11", "1. Gen from V22", "2. Gen from V22" ],
    "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT','INACTIVE','PENDING','DRAFT'],
    "CALCULATION_VERSION_TYPE" : [ 4, 4, 8, 8, 8, 8, 8 ],
    "VARIANT_ID" : [ null, null, iVariantId, iVariantId, iVariantId, iSecondVariantId, iSecondVariantId ],
    "ROOT_ITEM_ID" : [ 3001, 4001, 5001, 6001, 7001, 8001, 9001 ],
    "CUSTOMER_ID" : [ "", "", "", "", "", "", "" ],
    "SALES_PRICE" : [ 20, 10, 10, 20, 10, 10, 20 ],
    "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR", "EUR", "EUR", "EUR", "EUR" ],
    "REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR", "EUR", "EUR", "EUR", "EUR" ],
    "COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM", "COGM", "COGM", "COGM", "COGM" ],
    "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId, sComponentSplitId, sComponentSplitId, sComponentSplitId, sComponentSplitId ],
    "SALES_DOCUMENT" : [ "DOC", "DOC", "DOC", "DOC", "DOC", "DOC", "DOC" ],
    "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "VALUATION_DATE" : [ sExpectedDate, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
    "LAST_MODIFIED_ON" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, "2017-03-15T00:00:00.000Z", "2017-03-16T00:00:00.000Z", "2017-03-17T00:00:00.000Z", "2017-03-18T00:00:00.000Z", "2017-03-19T00:00:00.000Z" ],
    "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser, sTestUser ],
    "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate ],
    "IS_FROZEN" : [ 0, 0, 0, 0, 0, 0, 0 ],
    "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
    "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy, sStandardPriceStrategy],
    "EXCHANGE_RATE_TYPE_ID": [sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType, sDefaultExchangeRateType]
};

var oCalculationForVariantTestData = {
    "CALCULATION_ID" : [ iCalculationId, iSecondCalculationId ],
    "PROJECT_ID" : [ "VariantTestProject", "VariantTestProject" ],
    "CALCULATION_NAME" : [ "#SAP Example: Pump P-400", "#SAP Example: Pump P-500" ],
    "CURRENT_CALCULATION_VERSION_ID" : [ iCalculationVersionId, iSecondVersionId ],
    "CREATED_ON" : [ sExpectedDate, sExpectedDate ],
    "CREATED_BY" : [ sTestUser, sTestUser ],
    "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate ],
    "LAST_MODIFIED_BY" : [ sTestUser, sTestUser ]
};

var oProjectForVariantTestData={
        "PROJECT_ID":               ["VariantTestProject"],
        "ENTITY_ID":                [7],
        "REFERENCE_PROJECT_ID":     ["0"],
        "PROJECT_NAME":             ["Prj for variant"],
        "PROJECT_RESPONSIBLE":      [sTestUser],
        "CONTROLLING_AREA_ID":      [oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[2]],
        "CUSTOMER_ID":              ['C1'],
        "SALES_DOCUMENT":           ["SD1"],
        "SALES_PRICE":              ['20'],
        "SALES_PRICE_CURRENCY_ID":  ["EUR"],
        "COMMENT":                  ["Comment 1"],
        "COMPANY_CODE_ID":          ["CC1"],
        "PLANT_ID":                 ["PL1"],
        "BUSINESS_AREA_ID":         ["B1"],
        "PROFIT_CENTER_ID":         ["P4"],
        "REPORT_CURRENCY_ID":       ["EUR"],
        "COSTING_SHEET_ID":         ["COGM"],
        "COMPONENT_SPLIT_ID":       [sComponentSplitId],
        "START_OF_PROJECT":         [sExpectedDateWithoutTime],
        "END_OF_PROJECT":           [sExpectedDateWithoutTime],
        "START_OF_PRODUCTION":      [sExpectedDateWithoutTime],
        "END_OF_PRODUCTION":        [sExpectedDateWithoutTime],
        "VALUATION_DATE":           [sExpectedDateWithoutTime],
        "LIFECYCLE_VALUATION_DATE": [null],
        "LIFECYCLE_PERIOD_INTERVAL":[12],
        "CREATED_ON":               [sExpectedDateWithoutTime],
        "CREATED_BY":               [sTestUser],
        "LAST_MODIFIED_ON":         [sExpectedDateWithoutTime],
        "LAST_MODIFIED_BY":         [sTestUser],
        "EXCHANGE_RATE_TYPE_ID":    [sDefaultExchangeRateType],
        "MATERIAL_PRICE_STRATEGY_ID": [sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID": [sStandardPriceStrategy]
};

var oPriceDeterminationStrategyTestData = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_TEST_ST_MAT", "PLC_TEST_ST_ACT",],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 2, 1, 2],
        "CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "CREATED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate, sExpectedDate ],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser, sTestUser ]
}

var oPriceDeterminationStrategyPriceSource = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD","PLC_TEST_ST_MAT","PLC_TEST_ST_MAT","PLC_TEST_ST_MAT", "PLC_TEST_ST_ACT","PLC_TEST_ST_ACT","PLC_TEST_ST_ACT"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2],
        "PRICE_SOURCE_ID" : [ "PLC_PROJECT_PRICE", "PLC_VENDOR_PRICE", "PLC_STANDARD_PRICE", "ERP_STANDARD_PRICE", "PLC_PROJECT_PRICE", "PLC_PLANNED_PRICE", "PLC_STANDARD_PRICE", "PLC_CUSTOMER_PRICE", "PLC_CUSTOMER_PRICE", "301", "302", "PLC_PROJECT_PRICE","PLC_TEST_PRICE", "PLC_STANDARD_PRICE", "PLC_PROJECT_PRICE", "PLC_TEST_PRICE", "PLC_STANDARD_PRICE"],
        "PRICE_SOURCE_TYPE_ID" : [ 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2 ],
        "DETERMINATION_SEQUENCE" : [ 1, 0, 2, 3, 1, 0, 2, 4, 3, 5, 6, 0, 1, 2, 0, 1, 2]
}

var oPriceDeterminationStrategyRuleTestData = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_TEST_ST_MAT", "PLC_TEST_ST_MAT", "PLC_TEST_ST_MAT", "PLC_TEST_ST_MAT", "PLC_TEST_ST_MAT", "PLC_TEST_ST_ACT","PLC_TEST_ST_ACT","PLC_TEST_ST_ACT","PLC_TEST_ST_ACT", "PLC_TEST_ST_ACT", "PLC_TEST_ST_ACT"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER", "NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6]
};

var oPriceDeterminationStrategyRuleDefault = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6]
};

var oPriceDeterminationStrategyRuleVendorSecond = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 3, 2, 4, 5, 1, 2 , 3, 4, 5, 6]
};

var oPriceDeterminationStrategyRuleVendorFirst = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [2, 3, 1, 4, 5, 1, 2 , 3, 4, 5, 6]
};

var oPriceDeterminationStrategyRuleVendorFirstPlantSecond = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [3, 2, 1, 4, 5, 1, 2 , 3, 4, 5, 6]
};

var oMaterialPriceTestDataPlcDefault = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["*","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-03","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcDefaultPlant = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","PL2","PL3"],
        "VENDOR_ID": ["*","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcDefaultVendor = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["*","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD2","VD3","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcDefaultProject = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["*","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD1","VD1","*"],
        "PROJECT_ID": ["P1", "*", "PR1", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcDefaultCustomer = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "#CU1", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorSecond = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD2","VD1","VD3","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorSecondMatchVendor = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["*","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorSecondNoMatch = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD1","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorFirst = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD1","VD1","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-03","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorFirstMatchNew = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD1","VD1","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "#CU1", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorFirstNoMatch = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","PL1","PL3"],
        "VENDOR_ID": ["VD1","*","*","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorFirstPlantSecond = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD1","VD1","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2010-01-01","2010-01-03","2010-01-02","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}


var oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["PL1","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD2","VD1","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "#CU1", "*"],
        "VALID_FROM": ["2010-01-03","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch = {
        "PRICE_ID": ["2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B", "2E0000E0B2BDB9671600A4000936462B", "2F0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["101","101","101","101"],
        "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT100"],
        "PLANT_ID": ["*","*","*","PL3"],
        "VENDOR_ID": ["VD1","VD1","VD1","*"],
        "PROJECT_ID": ["*", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "#CU1", "*"],
        "VALID_FROM": ["2010-01-03","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["123.4500000","124.8800000","125.2500000","121.2500000"],
        "PRICE_VARIABLE_PORTION": ["234.5600000","234.9900000","200.5500000","234.9900000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
        "PRICE_UNIT": ["1.0000000","100.0000000","1.0000000","2.0000000"],
        "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
        "IS_PRICE_SPLIT_ACTIVE": [0, 0, 1, 0],
        "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
        "_SOURCE": [1,2,1,1],
        "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
}

var oMaterialPriceTestDataPlcDefaultAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["V1","*","V1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["#P1","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-03","2010-01-04"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcPlantAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["V1","*","V1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["#P1","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["V1","*","V1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["#P1","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcProjectAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","#P1","#P1","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcCustomerAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "CUSTOMER_ID": ["#CU1","*","*","#CU1"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorSecondMatchNewAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["V1","*","V1","*"],
        "CUSTOMER_ID": ["*","*","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorSecondMatchVendorAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["V1","V1","V1","V1"],
        "CUSTOMER_ID": ["#CU1","*","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorSecondNoMatchAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["V1","*","V1","*"],
        "CUSTOMER_ID": ["#CU1","*","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-03","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstMatchVendorAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "CUSTOMER_ID": ["#CU1","*","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-02","2010-01-03","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstMatchNewAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "CUSTOMER_ID": ["#CU1","*","#CU1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstNoMatchAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["*","*","V1","*"],
        "CUSTOMER_ID": ["#CU1","*","#CU1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-03","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "CUSTOMER_ID": ["*","#CU1","*","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","*","*"],
        "VENDOR_ID": ["*","*","*","*"],
        "CUSTOMER_ID": ["*","#CU1","#CU1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll = {
        "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_VENDOR_PRICE","PLC_VENDOR_PRICE","PLC_STANDARD_PRICE","PLC_STANDARD_PRICE"],
        "MATERIAL_ID": ["MAT2","MAT2","#100-110","#100-110"],
        "PLANT_ID": ["*","*","#PT1","*"],
        "VENDOR_ID": ["V1","*","*","*"],
        "CUSTOMER_ID": ["*","#CU1","#CU1","*"],
        "PURCHASING_GROUP":["123","456","789","123"],
        "PURCHASING_DOCUMENT":["1234","5678","5679","5670"],
        "LOCAL_CONTENT":["50.0000000","50.0000000","80.0000000","50.0000000"],
        "PROJECT_ID": ["*","*","*","*"],
        "VALID_FROM": ["2010-01-01","2010-01-01","2010-01-01","2010-01-01"],
        "VALID_TO": ["2999-12-31","2999-12-31","2999-12-31","2999-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000","1.0000000","1.0000000","1.0000000"],
        "PRICE_FIXED_PORTION": ["0.0000000","0.0000000","0.0000000","0.0000000"],
        "PRICE_VARIABLE_PORTION": ["85.5000000","105.5000000","43.5000000","95.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR","USD","EUR","EUR"],
        "PRICE_UNIT": ["10.0000000","10.0000000","5.0000000","10.0000000"],
        "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
        "_VALID_FROM": ["2015-07-01T12:27:23.197Z","2015-07-01T12:27:23.197Z","2015-01-01T12:27:23.197Z","2015-01-01T12:27:23.197Z"],
        "_SOURCE": [1,1,1,1],
        "_CREATED_BY": ["I055799","I055799","I055799","I055799"]
};

var oPriceDeterminationStrategyRuleActivityATSecond = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 2, 3, 4, 5, 1, 4, 3, 2, 5, 6]
};

var oPriceDeterminationStrategyRuleActivityATFirst = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 2, 3, 4, 5, 2, 3, 4, 1, 5, 6]
};

var oPriceDeterminationStrategyRuleActivityATFirstNewSec = {
        "PRICE_DETERMINATION_STRATEGY_ID" : ["PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD","PLC_STANDARD","PLC_STANDARD","PLC_STANDARD", "PLC_STANDARD", "PLC_STANDARD"],
        "PRICE_DETERMINATION_STRATEGY_TYPE_ID" : [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
        "RULE_CODE": ["NEW", "PLANT", "VENDOR", "PROJECT", "CUSTOMER", "CONTROLLING_AREA", "NEW", "COST_CENTER", "ACTIVITY_TYPE", "PROJECT", "CUSTOMER"],
        "PRIORITY": [1, 2, 3, 4, 5, 3, 2, 4, 1, 5, 6]
};

var oActivityPriceTestDataPlcDefaultCA = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '*', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "65.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcDefaultNew = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-03", "2015-01-02", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "65.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcDefaultCC = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["*", "#AT2", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "65.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcDefaultAT = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "*", "#AT2", "#AT2"],
        "PROJECT_ID": ["#P1", "*", "*", "*"],
        "CUSTOMER_ID": ["*", "*", "*", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "65.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcDefaultProject = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "#AT2", "#AT2"],
        "PROJECT_ID": ["*", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["*", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "65.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcDefaultCustomer = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['#CC1', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "#AT2", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "CU", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSecondMatchCA = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "#CC1", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-01", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSecondMatchAT = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "#AT2", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSecondNoMatch = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '*', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSFirstMatchAT = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '*', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "#AT2", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};
var oActivityPriceTestDataPlcATSFirstMatchCA = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '#CA1', '#CA1', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "#AT2", "#AT2", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSFirstNoMatch = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '#CA1', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "*", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-01", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSFirstNewSecMatchAT = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '#CA1', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["*", "*", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-01", "2015-01-03", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSFirstNewSecMatchNew = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '*', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["*", "*", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-02", "2015-01-02", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};

var oActivityPriceTestDataPlcATSFirstNewSecNoMatch = {
        "PRICE_ID": ["290000E0B2BDB9671600A4000936462B", "2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B"],
        "PRICE_SOURCE_ID": ["PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE", "PLC_PROJECT_PRICE"],
        "CONTROLLING_AREA_ID": ['#CA1', '*', '*', 'CA'],
        "COST_CENTER_ID": ['*', '#CC1', "*", "#CC1"],
        "ACTIVITY_TYPE_ID": ["#AT2", "*", "*", "#AT2"],
        "PROJECT_ID": ["#P1", "#P1", "#P1", "*"],
        "CUSTOMER_ID": ["#CU1", "*", "#CU1", "*"],
        "VALID_FROM": ["2015-01-02", "2015-01-03", "2015-01-02", "2015-01-01"],
        "VALID_TO": ["2017-12-31", "2017-12-31", "2017-12-31", "2019-12-31"],
        "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
        "PRICE_FIXED_PORTION": ["65.5000000", "65.5000000", "70.5000000", "65.0000000"],
        "PRICE_VARIABLE_PORTION": ["100.0000000", "90.0000000", "95.0000000", "55.0000000"],
        "TRANSACTION_CURRENCY_ID": ["EUR", "EUR", "EUR", "EUR"],
        "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "30"],
        "PRICE_UNIT_UOM_ID": ["H", "H", "H", "H"],
        "IS_PRICE_SPLIT_ACTIVE": [1, 0, 1, 0],
        "_VALID_FROM": ["2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z", "2015-01-01T00:00:00.000Z"],
        "_SOURCE": [1, 1, 1, 1],
        "_CREATED_BY": ["I055799", "U0001", "U0001", "I055799"]
};


var oLayoutColumnsTestData = {
        "LAYOUT_ID":            [1,    1,      1,      2,    2,      2,      2,      3,      4,      5,      5,      5,      6,      7,      7],
        "DISPLAY_ORDER":        [0,    1,      2,      0,    1,      2,      3,      1,      1,      1,      2,      3,      1,      1,      2],
        "PATH":                 [null, "Item", "Item", null, null,   "Item", "Item", "Item", "Item", "Item", "Item", "Item", null,   "Item", "Item"],
        "BUSINESS_OBJECT":      [null, "Item", null,   null, "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", null,   "Item", "Item"],
        "COLUMN_ID":            [null, "ITEM_CATEGORY_ID", "ColB", null, null,   "ITEM_CATEGORY_ID", "ColB", "ColC", "ColD", "ColC", "ColA", null,   "ColB", "ColE", "ITEM_CATEGORY_ID"],
        "COSTING_SHEET_ROW_ID": [null, null,   null,   null, 2,      null,   null,   null,   null,   null,   null,   null,   null,   null,   null],
        "COST_COMPONENT_ID":    [null, null,   null,   null, 2,      null,   null,   null,   null,   null,   null,   4,      null,   null,   null],
        "COLUMN_WIDTH":         [430,  5,      10,     430,  5,      8,      10,     8,      12,     8,      5,      12,     10,     6,      8]
};
var oLayoutHiddenFieldsTestData = {
        "LAYOUT_ID": [1, 1, 2, 3, 3 , 4, 4, 5, 5, 6, 7],
        "PATH": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
        "BUSINESS_OBJECT": ["Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item", "Item"],
        "COLUMN_ID": ["ColC", "ITEM_CATEGORY_ID", "ColD", "ColE", "ColA", "ColF", "ColB", "ColD", "ColE", "ColA", "ITEM_CATEGORY_ID"]
};

var oItemCategory = {
        "ITEM_CATEGORY_ID": [1,0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "DISPLAY_ORDER": [0,0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "CHILD_ITEM_CATEGORY_ID": [0,0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "ICON": ['dummy','\\ue1d7', '\\ue1b4', '\\ue080', '\\ue0a6', '\\ue078', '\\ue0c7', '\\ue13f', '\\ue002', '\\ue206', '\\ue1a3', '\\ue1d1'],
        "CREATED_ON": [ sValidFrom,sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        "CREATED_BY": ['user1','user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1'],
        "LAST_MODIFIED_ON": [sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom, sValidFrom],
        "LAST_MODIFIED_BY": ['user1','user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1', 'user1'],
        "ITEM_CATEGORY_CODE":[sValidFrom,'CALCULATION VERSION', 'DOCUMENT', 'MATERIAL', 'INTERNAL ACTIVITY', 'EXTERNAL ACTIVITY', 'PROCESS', 'SUBCONTRACTING', 'RESOURCES AND TOOLS', 'VARIABLE ITEM', 'TEXT ITEM', 'REFERENCED VERSION']
}

var oItemCategoryText={
        "ITEM_CATEGORY_ID": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "LANGUAGE":['EN','EN','EN','EN','EN','EN','EN','EN','EN','EN','EN'],
        "ITEM_CATEGORY_DESCRIPTION":['Calculation version','Document','Material','Internal Activity','External Activity','Process','Subcontracting','Resources and Tools','Variable Item','Text Item','Referenced Version'],
        "CHILD_ITEM_CATEGORY_ID":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "ITEM_CATEGORY_NAME":['Calculation version','test_name','test_name','test_name','test_name','test_name','test_name','test_name','test_name','test_name','test_name']
}

var oCalculationVersionTestData2 = {
        "CALCULATION_VERSION_ID" : [ 1006,1007,1008,1009,2809],
        "CALCULATION_ID" : [ 2809, 2809, 2809, 2809,2809],
        "CALCULATION_VERSION_NAME" : [ "Version 1 - 2021","Version 1 - 2022","Version 1 - 2023","Version 1 - 2024","Version 1"],
        "CALCULATION_VERSION_TYPE" : [ 2, 2, 2,2,1 ],
        "ROOT_ITEM_ID" : [ 1, 1, 1,1 ,1],
        "CUSTOMER_ID" : [ "", "", "","","" ],
        "SALES_PRICE" : ["20.0000000", "10.0000000", "10.0000000", "10.0000000","10.0000000"],
        "SALES_PRICE_CURRENCY_ID" : [ "EUR", "EUR", "EUR", "EUR" , "EUR" ],
        "REPORT_CURRENCY_ID" : [ "EUR", "USD", "EUR", "EUR", "EUR"  ],
        "COSTING_SHEET_ID" : [ "COGM", "COGM", "COGM" , "COGM", "COGM"],
        "COMPONENT_SPLIT_ID" : [ sComponentSplitId, sComponentSplitId, sComponentSplitId,sComponentSplitId,sComponentSplitId ],
        "SALES_DOCUMENT" : ["DOC", "DOC", "DOC", "DOC", "DOC"],
        "START_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime,sExpectedDateWithoutTime ,sExpectedDateWithoutTime],
        "END_OF_PRODUCTION" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime,sExpectedDateWithoutTime ,sExpectedDateWithoutTime],
        "VALUATION_DATE" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime,sExpectedDateWithoutTime ,sExpectedDateWithoutTime],
        "LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate,sExpectedDate ,sExpectedDate],
        "LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser,sTestUser,sTestUser ],
        "MASTER_DATA_TIMESTAMP" : [ sMasterdataTimestampDate, sMasterdataTimestampDate, sMasterdataTimestampDate,sMasterdataTimestampDate ,sMasterdataTimestampDate ],
        "IS_FROZEN" : [ 0, 0, 0 , 0, 0],
        "MATERIAL_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy ,sStandardPriceStrategy,sStandardPriceStrategy],
        "ACTIVITY_PRICE_STRATEGY_ID": ["PLC_STANDARD", sStandardPriceStrategy, sStandardPriceStrategy,sStandardPriceStrategy ,sStandardPriceStrategy],
        "BASE_VERSION_ID":[ 2809, 2809, 2809, 2809,null],
        "LIFECYCLE_PERIOD_FROM":[1440, 1445, 1500, 1502,null]
};

var oTestDemoData = {
        "LANGUAGE": ["Test0","Test1","Test2","Test3","Test4","Test5","Test6","Test7","Test8","Test9","Test10"]
}

var result = {
    sDefaultExchangeRateType,

    oTomorrow,
    oYesterday,
    sMasterdataTimestampDate,
    sValidFromDate,
    sExpectedDate,
    sExpectedDateWithoutTime,

    userSchema,
    testPackage,

    sSessionId,
    sSecondSessionId,
    sTestUser,
    sSecondUser,
    sFirstName,
    sLastName,
    sDefaultLanguage,
    sEnLanguage,
    iProjectId,
    iCalculationVersionId,
    iSecondVersionId,
    iCalculationId,
    iSecondCalculationId,
    sComponentSplitId,
    iVariantId,
    iSecondVariantId,
    iThirdVariantId,
    sStandardPriceStrategy,

    mCsvFiles,
    oAddinVersionTestData,
    oAddinConfigurationHeaderTestData,
    oAddinConfigurationItemsTestData,
    oCalculationVersionTestData,
    oCalculationVersionTestData1,
    oCalculationVersionTemporaryTestData,
    oCalculationLifecycleVersionTestData,
    oCalculationLifecycleVersionTestData2,
    oItemTestData,
    oAccountForItemTestData,
    oItemTestDataWithMasterdata,
    oItemTestData1,
    oItemSelectedPriceTestData,
    oItemTemporaryTestData,
    oItemCalculatedTestData,
    oItemCalculatedValuesCostingSheet,
    oItemCalculatedValuesComponentSplit,

    oSessionTestData,
    oAutoCompleteUserData,
    oSessionTestDataEn,
    oCostingSheetTestData,
    oCostingSheetTextTestData,
    oCostingSheetRowTestData,
    oCostingSheetBaseTestData,
    oCostingSheetBaseRowTestData,
    oCostingSheetRowTextTestData,
    oCostingSheetOverheadTestData,
    oCostingSheetOverheadRowTestData,
    oCostingSheetOverheadRowFormulaTestData,
    oCostingSheetRowDependenciesTestData,
    oAccountGroupTest,
    oAccountGroupTestDataPlc,
    oAccountGroupText,
    oAccountAccountGroupTestData,
    oOpenCalculationVersionsTestData,
    oUserTestData,
    oComponentSplitTest,
    oReferencedVersionComponentSplitTestData,
    oReferencedVersionComponentSplitTemporaryTestData,
    oComponentSplitTextTestData,
    oCalculationTestData,
    oCalculationTestData1,
    oDocumentMaterialTestData,
    oDesignOfficeTestDataPlc,
    oDesignOfficeTextTestDataPlc,
    oLanguageTestData,
    oMappingLanguageTestData,
    oActiveLanguageTestData,
    oStatusTestData,
    oStatusTextTestData,
    oMaterialTextTestData,
    oMetadataTestData,
    oMetadata4CustomFieldCostingSheetTestData,
    oStandardMetaTestData,
    oMetaTextTestData,
    oMetaAttributesTestData,
    oMetaFormulasTestData,
    oCustomField4CostingSheetFormulaData,
    oCostCenterTextTestDataPlc,
    oCostCenterTestDataErp,
    oCostCenterTextTestDataErp,
    oControllingAreaTestDataPlc,
    oControllingAreaTextTestDataPlc,
    oControllingAreaTestDataErp,
    oControllingAreaTextTestDataErp,
    oCompanyCodeTestDataPlc,
    oCompanyCodeTextTestDataPlc,
    oCompanyCodeTestDataErp,
    oCompanyCodeTextTestDataErp,
    oBusinessAreaTestDataPlc,
    oBusinessAreaTextTestDataPlc,
    oBusinessAreaTestDataErp,
    oBusinessAreaTextTestDataErp,
    oValuationClassTestDataPlc,
    oValuationClassTextTestDataPlc,
    oValuationClassTestDataErp,
    oValuationClassTextTestDataErp,
    oActivityTypeTestDataPlc,
    oActivityTypeTextTestDataPlc,
    oActivityTypeTestDataErp,
    oActivityTypeTextTestDataErp,
    oMaterialGroupTestDataPlc,
    oMaterialGroupTextTestDataPlc,
    oMaterialGroupTestDataErp,
    oMaterialGroupTextTestDataErp,
    oMaterialTypeTestDataPlc,
    oMaterialTypeTextTestDataPlc,
    oMaterialTypeTestDataErp,
    oMaterialTypeTextTestDataErp,
    oDimensionTestDataPlc,
    oDimensionTextTestDataPlc,
    oPlantTestDataPlc,
    oPlantTextTestDataPlc,
    oPlantTestDataErp,
    oPlantTextTestDataErp,
    oMaterialPlantTestDataPlc,
    oMaterialPlantTestDataErp,
    oMaterialTestDataPlc,
    oMaterialTextTestDataPlc,
    oMaterialTestDataErp,
    oMaterialTextTestDataErp,
    oMaterialGroupTestDataErp,
    oMaterialTypeTestDataErp,
    oDocumentTypeTestDataPlc,
    oDocumentTypeTextTestDataPlc,
    oDocumentTypeTestDataErp,
    oDocumentTypeTextTestDataErp,
    oDocumentStatusTestDataPlc,
    oDocumentStatusTextTestDataPlc,
    oDocumentStatusTestDataErp,
    oDocumentStatusTextTestDataErp,
    oDocumentTestDataPlc,
    oDocumentTextTestDataPlc,
    oDocumentTestDataErp,
    oDocumentTextTestDataErp,
    oUOM,
    oUOMText,
    oUOMTestDataErp,
    oUOMTextTestDataErp,
    oLanguage,
    oCurrency,
    oCurrencySecond,
    oCurrencyGBP,
    oCurrencyText,
    oCurrencyConversion,
    oCurrencyConversionMultiple,
    oConversionFactorsTestDataErp,
    oExchangeRatesTestDataErp,
    oMaterialAccountDetermination,
    oMaterialAccountDeterminationPlc,
    oAccountTestDataPlc,
    oAccountTextTestDataPlc,
    oAccountTestDataErp,
    oMaterialPriceTestDataPlc,
    oPriceTestDataErp,
    oPriceSourceTestDataPlc,
    oPriceSourceTextTestDataPlc,
    oExchangeRateTypeTestDataPlc,
    oExchangeRateTypeTextTestDataPlc,
    oConfidenceLevelTestDataPlc,
    oConfidenceLevelTextTestDataPlc,
    oVendorTestDataPlc,
    oWorkCenterTestDataPlc,
    oProcessTestDataPlc1,
    oActivityTypeTestDataPlc1,
    oWorkCenterProcessTestDataPlc,
    oWorkCenterActivityTestDataPlc,
    oWorkCenterExtTestDataPlc,
    oWorkCenterTextTestDataPlc,

    oOverheadGroupTestDataPlc,
    oOverheadGroupTextTestDataPlc,
    oOverheadGroupTestDataErp,
    oOverheadGroupTextTestDataErp,
    oProfitCenterTestDataPlc,
    oProfitCenterTextTestDataPlc,
    oProfitCenterTestDataErp,
    oProfitCenterTextTestDataErp,
    oDimensionTestDataPlc,
    oDimensionTextTestDataPlc,
    oCustomerTestDataPlc,
    oCostCenterTestDataPlc,
    oCostCenterTextTestDataPlc,
    oProcessTestDataPlc,
    oProcessTextTestDataPlc,
    oProcessTestDataErp,
    oProcessTextTestDataErp,
    componentSplitAccountGroupTestDataPlc,
    accountGroupTestDataPlc,
    componentSplit,
    componentSplitText,
    oAccountTest,
    oAccountTextTest,
    oAccountValidTo,
    oAccountTextValidTo,
    oAccountGroupTest,
    oAccountGroupTextTest,
    oAccountGroupValidTo,
    oAccountGroupTextValidTo,
    oAccountRangeTest,
    oAccountRangeValidTo,
    oDefaultSettingsTestData,
    oDefaultSettingsTestDataErp,
    oComponentSplitTestDataPlcDefaultSettings,
    oActivityPriceTestDataPlc,
    oActivityPriceExtTestDataPlc,
    oCustomerTestDataErp,
    oProjectTestData,
    oProjectCurrencyTestData,
    oProjectTestData1,
    oFoldersTestData,
    oEntityRelationTestData,
    oEntityTypes,
    oItemCategoryTestData,
    oApplicationTimeout,
    oRecentCalculationTestData,
    oLayout,
    oLayoutPersonal,
    oLayoutColumns,
    oLayoutHiddenFields,
    oFrontendSettings,
    oProjectTotalQuantities,
    oLifecyclePeriodValues,
    oProjectActivityPriceSurcharges,
    oProjectActivityPriceSurchargeValues,
    oProjectMaterialPriceSurcharges,
    oProjectMaterialPriceSurchargeValues,
    oProjectLifecyclePeriodTypeTestData,
    oProjectMonthlyLifecyclePeriodTestData,
    oProjectLifecyclePeriodQuantityValueTestData,
    oProjectLifecycleConfigurationTestData,
    oProjectOneTimeProjectCost,
    oProjectOneTimeProductCost,
    oProjectOneTimeCostLifecycleValue,
    oTask,
    oPrivilege,
    oUserGroups,
    oUserGroupUser,
    oUserGroupUserGroups,
    oGroupPrivilege,
    oVariantTestData,
    oVariantItemTestData,
    oVariantItemTemporaryTestData,
    oVariantItemGenerateTestData,
    oOneTimeProjectCostTestData,
    oOneTimeProductCostTestData,
    oOneTimeCostLifecycleValueTestData,
    oVersionItemGenerateTestData,
    oCalculationVersionForVariantTestData,
    oCalculationForVariantTestData,
    oProjectForVariantTestData,
    oPriceDeterminationStrategyTestData,
    oCalculationVersionTempPriceData,
    oCalculationPriceData,
    oProjectPriceData,
    oMaterial,
    oItemPriceData,
    oMaterialPriceDataPlc,
    oItemTemporaryPriceData,
    oItemTestAdditionalData,
    oVariantItemTestAdditionalData,
    oActivityPriceDataPlc,
    oPriceDeterminationStrategyPriceSource,
    oCalculationVersionPriceData,
    oPriceSourceTestDataPlc1,
    oPriceComponentTestDataPlc,
    oPriceComponentDataPlc,
    oPriceDeterminationStrategyRuleTestData,
    oPriceDeterminationStrategyRuleDefault,
    oPriceDeterminationStrategyRuleVendorSecond,
    oPriceDeterminationStrategyRuleVendorFirst,
    oPriceDeterminationStrategyRuleVendorFirstPlantSecond,
    oMaterialPriceTestDataPlcDefault,
    oMaterialPriceTestDataPlcDefaultPlant,
    oMaterialPriceTestDataPlcDefaultVendor,
    oMaterialPriceTestDataPlcDefaultProject,
    oMaterialPriceTestDataPlcDefaultCustomer,
    oMaterialPriceTestDataPlcVendorSecond,
    oMaterialPriceTestDataPlcVendorSecondMatchVendor,
    oMaterialPriceTestDataPlcVendorSecondNoMatch,
    oMaterialPriceTestDataPlcVendorFirst,
    oMaterialPriceTestDataPlcVendorFirstMatchNew,
    oMaterialPriceTestDataPlcVendorFirstNoMatch,
    oMaterialPriceTestDataPlcVendorFirstPlantSecond,
    oMaterialPriceTestDataPlcVendorFirstPlantSecMatchBoth,
    oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatch,
    oMaterialPriceTestDataPlcDefaultAll,
    oMaterialPriceTestDataPlcPlantAll,
    oMaterialPriceTestDataPlcVendorAll,
    oMaterialPriceTestDataPlcProjectAll,
    oMaterialPriceTestDataPlcCustomerAll,
    oMaterialPriceTestDataPlcVendorSecondMatchNewAll,
    oMaterialPriceTestDataPlcVendorSecondMatchVendorAll,
    oMaterialPriceTestDataPlcVendorSecondNoMatchAll,
    oMaterialPriceTestDataPlcVendorFirstMatchVendorAll,
    oMaterialPriceTestDataPlcVendorFirstMatchNewAll,
    oMaterialPriceTestDataPlcVendorFirstNoMatchAll,
    oMaterialPriceTestDataPlcVendorFirstPlantSecMatchVendorAll,
    oMaterialPriceTestDataPlcVendorFirstPlantSecMatchPlantAll,
    oMaterialPriceTestDataPlcVendorFirstPlantSecNoMatchAll,
    oMaterialPriceFirstVersionTestDataPlc,
    oPriceDeterminationStrategyRuleActivityATSecond,
    oPriceDeterminationStrategyRuleActivityATFirst,
    oPriceDeterminationStrategyRuleActivityATFirstNewSec,
    oActivityPriceTestDataPlcDefaultCA,
    oActivityPriceTestDataPlcDefaultNew,
    oActivityPriceTestDataPlcDefaultCC,
    oActivityPriceTestDataPlcDefaultAT,
    oActivityPriceTestDataPlcDefaultProject,
    oActivityPriceTestDataPlcDefaultCustomer,
    oActivityPriceTestDataPlcATSecondMatchCA,
    oActivityPriceTestDataPlcATSecondMatchAT,
    oActivityPriceTestDataPlcATSecondNoMatch,
    oActivityPriceTestDataPlcATSFirstMatchAT,
    oActivityPriceTestDataPlcATSFirstMatchCA,
    oActivityPriceTestDataPlcATSFirstNoMatch,
    oActivityPriceTestDataPlcATSFirstNewSecMatchAT,
    oActivityPriceTestDataPlcATSFirstNewSecMatchNew,
    oActivityPriceTestDataPlcATSFirstNewSecNoMatch,
    oActivityPriceFirstVersionTestDataPlc,

    oTagTestData,
    oEntityTagsTestData,
    oLayoutColumnsTestData,
    oLayoutHiddenFieldsTestData,
    oItemCategory,
    oItemCategoryText,
    oCalculationVersionTestData2,
    oCalculationVersionTestData3,

    oTestDemoData
};

if(jasmine.plcTestRunParameters.generatedFields === true) {
    _.extend(result, {
        oMetadataCustTestData,
        oMetadataItemAttributesCustTestData,
        oFormulaCustTestData,
        oCustomMetadata,
        aNotCalculatedCustomFields,
        aCalculatedCustomFields,
        oItemExtData,
        oItemTemporaryExtData,
        oItemExtWithMasterData,
        oItemTemporaryExtWithMasterData,
        oItemTemporaryExtWithDefaultDataAfterCreateData,
        oMaterialExtTestDataPlc,
        oMaterialPlantExtTestDataPlc,
        oMaterialPriceExtTestDataPlc,
        oCostCenterExtTestDataPlc
    });
}

return result;
} // end of function

module.exports = {
    get data() {
        return generateTestData($);
    }
}