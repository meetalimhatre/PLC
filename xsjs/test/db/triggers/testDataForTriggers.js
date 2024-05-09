/* eslint no-unused-vars: "off" */
var sCA = "1000";
var time2 = new Date(2014, 5, 5).toJSON();
var time3 = new Date(2015, 1, 1).toJSON();

var sOldDate = "20000101";
var sFutureDate = "99990101";
// -------------------ERP data---------------------------------

var oAccountTextErpData = {
    KOKRS: [sCA, sCA, sCA, sCA],
    LANGU: ["DE", "DE", "EN", "EN"],
    KSTAR: ["AC3", "AC3", "AC3", "AC4"],
    KTEXT: ["Beschr AC3", "Beschr AC99", "Desc AC3", "Desc AC4"],
};

var oBusinessAreaErpData = {
    GSBER: ["BA3", "BA4"],
};

var oBusinessAreaTextErpData = {
    LANGU: ["DE", "DE", "EN", "EN"],
    GSBER: ["BA3", "BA3", "BA3", "BA4"],
    GTEXT: ["Beschr BA3", "Beschr BA99", "Desc BA3", "Desc BA4"],
};

var oCompanyCodeErpData = {
    BUKRS: ["Co3", "Co3", "0100"],
    WAERS: ["C1", "C2", "EUR"],
    KTOPL: ["", "", "INT"],
    KOKRS: [sCA, sCA, sCA],
};


var oCompanyCodeTextErpData = {
    LANGU: ["DE", "DE", "EN", "EN"],
    BUKRS: ["Co3", "Co3", "Co3", "Co4"],
    BUTXT: ["Beschr Co3", "Beschr Co99", "Desc Co3", "Desc Co4"],
};

var oCustomerErpData = {
    KUNNR: ["CU3", "CU3", "deleted"],
    LAND1: ["DE", "DE", "RO"],
    NAME1: ["Customer 3", "Customer 4", "Customer 5"],
    ORT01: ["City 3", "City 4", "City 5"],
    PSTLZ: ["333", "444", "555"],
    REGIO: ["DE3", "DE4", "DE5"],
    STRAS: ["3", "4", "5"],
    STKZN:[0,1,0]
};

var oDocumentErpData = {
    DOKAR: ["D3", "D3"],
    DOKNR: ["D3", "D3"],
    DOKVR: ["V3", "V3"],
    DOKTL: ["P3", "P3"],
    DOKST: ["S3", "S4"],
    LABOR: ["L3", "L4"],
    CADKZ: ["3", "4"],
};

var oDocumentTextErpData = {
    DOKAR: ["D3", "D3", "D3", "D4"],
    DOKNR: ["D3", "D3", "D3", "D4"],
    DOKVR: ["V3", "V3", "V3", "V4"],
    DOKTL: ["P3", "P3", "P3", "P4"],
    LANGU: ["DE", "DE", "EN", "EN"],
    DKTXT: ["Beschr D3", "Beschr D99", "Desc D3", "Desc D4"],
};

var oDocumentMaterialErpData = {
    DOKAR: ["D3", "D4"],
    DOKNR: ["D3", "D4"],
    DOKVR: ["V3", "V4"],
    DOKTL: ["P3", "P4"],
    OBJKY: ["M3", "M4"],
};

var oDocumentStatusErpData = {
    DOKAR: ["D3", "D4"],
    DOKST: ["S3", "S4"],
};

var oDocumentStatusTextErpData = {
    LANGU: ["DE", "DE", "EN", "EN"],
    DOKST: ["S3", "S3", "S3", "S4"],
    DOSTX: ["Beschr S3", "Beschr S99", "Desc S3", "Desc S4"],
};

var oDocumentTypeErpData = {
    DOKAR: ["D3", "D4"],
};

var oDocumentTypeTextErpData = {
    LANGU: ["DE", "DE", "EN", "EN"],
    DOKAR: ["D3", "D3", "D3", "D4"],
    DARTXT: ["Beschr D3", "Beschr D99", "Desc D3", "Desc D4"],
};

var oMaterialErpData = {
    MATNR: ["M3", "M3"],
    MTART: ["T3", "T4"],
    MATKL: ["G3", "G4"],
    MEINS: ["U3", "U3"],
    CADKZ: ["1", "1"],
    KZKFG: ["1", "1"],
};

var oMaterialTextErpData = {
    LANGU: ["DE", "DE", "DE", "EN"],
    MATNR: ["M3", "M3", "M4", "M4"],
    MAKTX: ["Beschr M3", "Beschr M99", "Beschr M4", "Desc M4"],
};

var oMaterialGroupErpData = {
    MATKL: ["G3", "G4"],
};

var oMaterialGroupTextErpData = {
    LANGU: ["DE", "DE", "DE", "EN", "DE"],
    MATKL: ["G3", "G4", "G4", "G4", "G3"],
    WGBEZ: ["Beschr G3", "Beschr G99", "Beschr G4", "Desc G4", "Beschr G99"],
};

var oMaterialPlantErpData = {
    MATNR: ["M3", "M3"],
    WERKS: ["P3", "P3"],
    LOSGR: [1, 2],
    BKLAS: ["VC3", "VC4"],
    KOSGR: ["OG3", "OG4"],
    MEINS: ["U3", "U3"],
};

var oMaterialPriceErpData = {
    PRICE_SOURCE_ID: ["201", "201", "201"],
    MATNR: ["MATE1", "MATE1", "MATE2"],
    WERKS: ["PLE1", "PLE2", "PLE2"],
    VENDOR_ID: ["*", "*", "*"],
    PROJECT_ID: ["*", "*", "*"],
    VALID_FROM: ["2015-06-19", "2010-01-01", "2010-01-01"],
    VALID_FROM_QUANTITY: [1, 1, 1],
    STPRS: [120.45, 110.25, 170.23],
    WAERS: ["EUR", "EUR", "EUR"],
    PEINH: [1, 1, 1],
    MEINS: ["H", "H", "H"],
};

var oMaterialTypeErpData = {
    MTART: ["T3", "T4"],
};

var oMaterialTypeTextErpData = {
    LANGU: ["DE", "DE", "DE", "EN", "DE"],
    MTART: ["T3", "T3", "T4", "T4", "T4"],
    MTBEZ: ["Beschr T3", "Beschr T99", "Beschr T4", "Desc T4", "Beschr T99"],
};

var oPlantErpData = {
    WERKS: ["P3", "P3", "1000"],
    BWKEY: ["", "", "1000"],
    STRAS: ["3", "4", ""],
    PSTLZ: ["333", "444", ""],
    ORT01: ["City 3", "City 4", ""],
    LAND1: ["DE", "RO", "DE"],
    REGIO: ["DE3", "RO4", ""],
    BWMOD: ["", "", "1000"],
    BUKRS: ["Co3", "Co4", "0100"],
};

var oPlantTextErpData = {
    LANGU: ["DE", "DE", "DE", "EN", "DE"],
    WERKS: ["P3", "P3", "P4", "P4", "P4"],
    NAME1: ["Beschr P3", "Beschr P99", "Beschr P4", "Desc P4", "Beschr P99"],
};

var oVendorErpData = {
    LIFNR: ["V3", "V3", "deleted"],
    LAND1: ["DE", "RO", "RO"],
    NAME1: ["Vendor 3", "Vendor 4", "Vendor 5"],
    PSTL2: ["333", "444", "55"],
    REGIO: ["DE3", "RO4", "DE5"],
    STRAS: ["3", "4", "5"],
    STKZN:[0,1,0]
};

var oUomErpData = {
    MSEHI: ["U3", "U3"],
    DIMID: ["D1", "D2"],
    ZAEHL: [1, 2],
    NENNR: [3, 4],
    EXP10: [1, 2],
    ADDKO: [1, 2],
};

var oUomTextErpData = {
    LANGU: ["DE", "DE", "EN", "EN"],
    MSEHI: ["U3", "U3", "U3", "U4"],
    MSEHT: ["Beschr U3", "Beschr U99", "Desc U3", "Desc U4"],
    MSEH3: ["UC3", "UC3", "UC3", "UC4"],
};

var oOverheadGroupErpData = {
    WERKS: ["P3", "P4"],
    KOSGR: ["OG3", "OG4"],
};

var oOverheadGroupTextErpData = {
    WERKS: ["P3", "P3", "P4", "P4", "P4"],
    LANGU: ["DE", "DE", "DE", "EN", "DE"],
    KOSGR: ["OG3", "OG3", "OG4", "OG4", "OG4"],
    TXZSCHL: ["Beschr OG3", "Beschr OG99", "Beschr OG4", "Desc OG4", "Beschr OG99"],
};

var oValuationClassErpData = {
    BKLAS: ["VC3", "VC4"],
};

var oValuationClassTextErpData = {
    LANGU: ["DE", "DE", "DE", "EN", "DE"],
    BKLAS: ["VC3", "VC3", "VC4", "VC4", "VC4"],
    BKBEZ: ["Beschr VC3", "Beschr VC99", "Beschr VC4", "Desc VC4", "Beschr VC99"],
};

var oAccountErpViewData = {
    KSTAR: ["AC3", "AC4"],
    KOKRS: [sCA, sCA],
};

var oAccountErpTableData = {
    KSTAR: ["AC3", "AC4", "AC5"],
    KOKRS: [sCA, sCA, sCA],
    DATBI: [sOldDate, sFutureDate, sFutureDate],
};

var oActivityTypeErpViewData = {
    LSTAR: ["AT3", "AT4"],
    KOKRS: [sCA, sCA],
    VKSTA: ["AC3", "AC4"],
};

var oActivityTypeErpTableData = {
    LSTAR: ["AT3", "AT4", "AT4"],
    KOKRS: [sCA, sCA, sCA],
    VKSTA: ["AC3", "AC4", "AC5"],
    DATBI: [sOldDate, sFutureDate, sFutureDate],
};

var oActivityTypeTextErpViewData = {
    LSTAR: ["AT3", "AT4", "AT3", "AT4"],
    KOKRS: [sCA, sCA, sCA, sCA],
    KTEXT: ["Beschr AT3", "Beschr AT4", "Desc AT3", "Desc AT4"],
    LANGU: ["DE", "DE", "EN", "EN"],
};

var oActivityTypeTextErpTableData = {
    LSTAR: ["AT3", "AT4", "AT3", "AT4"],
    KOKRS: [sCA, sCA, sCA, sCA],
    KTEXT: ["Beschr AT3", "Beschr AT4", "Desc AT3", "Beschr AT99"],
    LANGU: ["DE", "DE", "EN", "DE"],
    DATBI: [sOldDate, sFutureDate, sFutureDate, sFutureDate],
};

var oProcessErpViewData = {
    KOKRS: [sCA, sCA],
    PRZNR: ["BP3", "BP4"],
    VKSTA: ["AC3", "AC4"],
};

var oProcessErpTableData = {
    KOKRS: [sCA, sCA, sCA],
    PRZNR: ["BP3", "BP4", "BP5"],
    VKSTA: ["AC3", "AC4", "AC4"],
    DATBI: [sOldDate, sFutureDate, sFutureDate],
};

var oProcessTextErpViewData = {
    KOKRS: [sCA, sCA, sCA, sCA],
    PRZNR: ["BP3", "BP4", "BP3", "BP4"],
    LANGU: ["DE", "DE", "EN", "EN"],
    KTEXT: ["Beschr BP3", "Beschr BP4", "Desc BP3", "Desc BP4"],
};

var oProcessTextErpTableData = {
    KOKRS: [sCA, sCA, sCA, sCA],
    PRZNR: ["BP3", "BP4", "BP3", "BP4"],
    LANGU: ["DE", "DE", "EN", "DE"],
    KTEXT: ["Beschr BP3", "Beschr BP4", "Desc BP3", "Beschr BP99"],
    DATBI: [sOldDate, sFutureDate, sFutureDate, sFutureDate],
};

var oCostCenterErpViewData = {
    KOKRS: [sCA, sCA],
    KOSTL: ["CC3", "CC4"],
};

var oCostCenterErpTableData = {
    KOKRS: [sCA, sCA, sCA],
    KOSTL: ["CC3", "CC4", "CC5"],
    DATBI: [sOldDate, sFutureDate, sFutureDate],
};

var oCostCenterTextErpViewData = {
    KOKRS: [sCA, sCA, sCA, sCA],
    LANGU: ["DE", "DE", "EN", "EN"],
    KOSTL: ["CC3", "CC4", "CC3", "CC4"],
    KTEXT: ["Beschr CC3", "Beschr CC4", "Desc CC3", "Desc CC4"],
};

var oCostCenterTextErpTableData = {
    KOKRS: [sCA, sCA, sCA, sCA],
    LANGU: ["DE", "DE", "EN", "DE"],
    KOSTL: ["CC3", "CC4", "CC3", "CC4"],
    KTEXT: ["Beschr CC3", "Beschr CC4", "Desc CC3", "Beschr CC99"],
    DATBI: [sOldDate, sFutureDate, sFutureDate, sFutureDate],
};

var oProfitCenterErpViewData = {
    PRCTR: ["PC3", "PC4"],
    KOKRS: [sCA, sCA],
};

var oProfitCenterErpTableData = {
    PRCTR: ["PC3", "PC4", "PC5"],
    KOKRS: [sCA, sCA, sCA],
    DATBI: [sOldDate, sFutureDate, sFutureDate],
};

var oProfitCenterTextErpViewData = {
    PRCTR: ["PC3", "PC4", "PC3", "PC4"],
    KOKRS: [sCA, sCA, sCA, sCA],
    KTEXT: ["Beschr PC3", "Beschr PC4", "Desc PC3", "Desc PC4"],
    LANGU: ["DE", "DE", "EN", "EN"],
};

var oProfitCenterTextErpTableData = {
    PRCTR: ["PC3", "PC4", "PC3", "PC4"],
    KOKRS: [sCA, sCA, sCA, sCA],
    KTEXT: ["Beschr PC3", "Beschr PC4", "Desc PC3", "Beschr PC499"],
    LANGU: ["DE", "DE", "EN", "DE"],
    DATBI: [sOldDate, sFutureDate, sFutureDate, sFutureDate],
};

var oControllingAreaErpData = {
    KOKRS: ["CA3", "CA3", "CA5"],
    WAERS: ["C9", "C10", "C11"],
    KTOPL: ["", "", ""],
    LMONA: ["", "", ""],
};

var oControllingAreaTextErpData = {
    KOKRS: ["CA3", "CA3"],
    BEZEI: ["C9", "C10"],
    LANGU: ["", ""],
};

var oCurrencyConversionErpData = {
    FCURR: ["FC1", "FC2"],
    TCURR: ["TC1", "TC2"],
    FFACT: [0, 0],
    TFACT: [0, 0],
    UKURS: [0, 0],
    ERP_DATE: [sOldDate, sFutureDate],
};

var oCurrencyConversionErpDataTCURR = {
    FCURR: ["FC2", "FC2"],
    TCURR: ["TC2", "TC2"],
    UKURS: [0, 5],
    GDATU_C: [sFutureDate, sFutureDate],
};

var oCurrencyConversionErpDataTCURF = {
    FCURR: ["FC2", "FC2"],
    TCURR: ["TC2", "TC2"],
    FFACT: [0, 7],
    TFACT: [0, 8],
    GDATU_C: [sFutureDate, sFutureDate],
};

var oMaterialAccountDeterminationErpData = {
    BKLAS: ["BK1", "BK2"],
    KONTS: ["KO1", "KO2"],
    MTART: ["MT1", "MT2"],
    KOKRS: ["KR1", "KR2"],
    WERKS: ["WE1", "WE2"],
};

var oMaterialAccountDeterminationErpTableData = {
    MTART: ["*", "*"],
    KTOPL: ["INT", "INT"],
    BWMOD: ["1000", "1000"],
    BKLAS: ["2000", "2000"],
    KONTS: ["6000000", "500000"],
};

var oVendorDeletedErpTableData = {
    LIFNR: ["DELETED","DELETED"],
    NAME1: ["T1","T"],
    LAND1: ["DE","RO"],
    PSTL2: ["123","12"],
    REGIO: ["T1","T"],
    STRAS: ["T1","T"],
};

var oCustomerDeletedErpTableData = {
    KUNNR: ["DELETED","DELETED"],
    NAME1: ["T1","T"],
    LAND1: ["DE","RO"],
    PSTLZ: ["1","123"],
    REGIO: ["T1","T"],
    ORT01: ["T1","T"],
    STRAS: ["T1","T"],
};


module.exports = {
    sCA,
    time2,
    time3,

    sOldDate,
    sFutureDate,

    oAccountTextErpData,
    oBusinessAreaErpData,
    oBusinessAreaTextErpData,
    oCompanyCodeErpData,
    oCompanyCodeTextErpData,
    oCustomerErpData,
    oDocumentErpData,
    oDocumentTextErpData,
    oDocumentMaterialErpData,
    oDocumentStatusErpData,
    oDocumentStatusTextErpData,
    oDocumentTypeErpData,
    oDocumentTypeTextErpData,
    oMaterialErpData,
    oMaterialTextErpData,
    oMaterialGroupErpData,
    oMaterialGroupTextErpData,
    oMaterialPlantErpData,
    oMaterialPriceErpData,
    oMaterialTypeErpData,
    oMaterialTypeTextErpData,
    oPlantErpData,
    oPlantTextErpData,
    oVendorErpData,
    oUomErpData,
    oUomTextErpData,
    oOverheadGroupErpData,
    oOverheadGroupTextErpData,
    oValuationClassErpData,
    oValuationClassTextErpData,
    oAccountErpViewData,
    oAccountErpTableData,
    oActivityTypeErpViewData,
    oActivityTypeErpTableData,
    oActivityTypeTextErpViewData,
    oActivityTypeTextErpTableData,
    oProcessErpViewData,
    oProcessErpTableData,
    oProcessTextErpViewData,
    oProcessTextErpTableData,
    oCostCenterErpViewData,
    oCostCenterErpTableData,
    oCostCenterTextErpViewData,
    oCostCenterTextErpTableData,
    oProfitCenterErpViewData,
    oProfitCenterErpTableData,
    oProfitCenterTextErpViewData,
    oProfitCenterTextErpTableData,
    oControllingAreaErpData,
    oControllingAreaTextErpData,
    oCurrencyConversionErpData,
    oCurrencyConversionErpDataTCURR,
    oCurrencyConversionErpDataTCURF,
    oMaterialAccountDeterminationErpData,
    oMaterialAccountDeterminationErpTableData,
    oVendorDeletedErpTableData,
    oCustomerDeletedErpTableData
};
