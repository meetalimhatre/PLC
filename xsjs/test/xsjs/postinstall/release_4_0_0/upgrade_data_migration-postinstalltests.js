let sPlcSchema = "SAP_PLC";
let oConn = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
oConn.setAutoCommit(true);
let oParseStringRegexp = /^length=(\d+)$/;
const { 
    aSchemaModification, tableNotRemoved, getTargetTableName, getDeletedColumns, getRenamedColumns, getRenameColumn 
} = $.import("xs.postinstall.xslib", "upgradeSchemaMapping");
const oMockData = Object.freeze({
    t_metadata: {//primary key: PATH, BUSINESS_OBJECT, COLUMN_ID
        PATH: ["Cost_Center", "Item"],
        BUSINESS_OBJECT: ["Cost_Center", "Item"],
        COLUMN_ID: ["CCEN_UPGRADE", "CCEN_UPGRADE"],
        IS_CUSTOM: [1, 1],
        ROLLUP_TYPE_ID: [0, 0],
        SIDE_PANEL_GROUP_ID: [501, 102],
        DISPLAY_ORDER: [504, 510],
        TABLE_DISPLAY_ORDER: [505, null],
        REF_UOM_CURRENCY_PATH: [null, null],
        REF_UOM_CURRENCY_BUSINESS_OBJECT: [null, null],
        REF_UOM_CURRENCY_COLUMN_ID: [null, null],
        DIMENSION_ID: [null, null],
        UOM_CURRENCY_FLAG: [null, null],
        SEMANTIC_DATA_TYPE: ["BooleanInt", "BooleanInt"],
        SEMANTIC_DATA_TYPE_ATTRIBUTES: [null, null],
        VALIDATION_REGEX_ID: [null, null],
        PROPERTY_TYPE: [5, 5],
        IS_IMMUTABLE_AFTER_SAVE: [null, null],
        IS_REQUIRED_IN_MASTERDATA: [null, null],
        IS_WILDCARD_ALLOWED: [null, null],
        IS_USABLE_IN_FORMULA: [1, 1],
        TRIGGERS_CALC_ENGINE: [1, 1],
        RESOURCE_KEY_DISPLAY_NAME: [null, null],
        RESOURCE_KEY_DISPLAY_DESCRIPTION: [null, null],
        CREATED_AT: ["2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z"],
        CREATED_BY_USER_ID: ["TEST1", "TEST1"],
        LAST_MODIFIED_AT: ["2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z"],
        LAST_MODIFIED_BY_USER_ID: ["TEST1", "TEST1"]
    },
    t_metadata__text: {//primary key: PATH, COLUMN_ID, LANGUAGE
        PATH: ["Cost_Center", "Item"],
        COLUMN_ID: ["CCEN_UPGRADE", "CCEN_UPGRADE"],
        LANGUAGE: ["EN", "EN"],
        DISPLAY_NAME: ["jjj", "jjj"],
        DISPLAY_DESCRIPTION: ["testtest", "testest"],
        CREATED_AT: ["2018-04-23T02:46:18.678Z", "2018-04-23T02:46:18.678Z"],
        CREATED_BY_USER_ID: ["TEST1", "TEST1"],
        LAST_MODIFIED_AT: ["2018-04-23T03:01:02.495Z",  "2018-04-23T03:01:02.495Z"],
        LAST_MODIFIED_BY_USER_ID: ["TEST1", "TEST1"]
    },
    t_metadata_item_attributes: {
        PATH:["Cost_Center", "Item", "Item", "Item", "Item"],
        BUSINESS_OBJECT:["Cost_Center", "Item", "Item", "Item", "Item"],
        COLUMN_ID:["CCEN_UPGRADE", "CCEN_UPGRADE", "CCEN_UPGRADE", "CCEN_UPGRADE", "CCEN_UPGRADE"],
        ITEM_CATEGORY_ID:[-1, 3, 3, 8, 8],
        HAS_CHILDREN:[-1,-1,-1,-1,-1],
        IS_ACTIVE:[-1, 0, 1, 0, 1],
        IS_MANDATORY:[null, null, null, null, null],
        IS_REQUIRED_FOR_COMPLETENESS:[null, null, null, null, null],
        IS_READ_ONLY:[0,0,0,0,0],
        IS_TRANSFERABLE:[null, null, null, null, null],
        DEFAULT_VALUE:[0,0,0,0,0],
        CREATED_AT:["2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z"],
        CREATED_BY_USER_ID:["TEST1", "TEST1", "TEST1", "TEST1", "TEST1"],
        LAST_MODIFIED_AT:["2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z", "2018-04-26T08:59:29.861Z"],
        LAST_MODIFIED_BY_USER_ID:["TEST1", "TEST1", "TEST1", "TEST1", "TEST1"]
    },
    t_cost_center: {//primary key: COST_CENTER_ID, CONTROLLING_AREA_ID, _VALID_FROM
        COST_CENTER_ID: ["8G0KMTJRLN"],
        CONTROLLING_AREA_ID: ["#CA1"],
        _VALID_FROM: ["2008-04-25T10:11:10.154Z"],
        _VALID_TO: [null],
        _SOURCE: [1],
        _CREATED_BY_USER_ID: ["Automatically generated"]
    },
    t_price: {//primary key: PRICE_SOURCE_ID, MATERIAL_ID, PLANT_ID, VENDOR_ID,PROJECT_ID, customer_id, _validate_from, VALID_FROM_QUANTITY, validate_from
        PRICE_SOURCE_ID: ["PLC_STANDARD_PRICE"],
        MATERIAL_ID: ["0EMXRJPB"],
        PLANT_ID: ["7WDN"],
        VENDOR_ID: ["*"],
        PURCHASING_GROUP: [null],
        PURCHASING_DOCUMENT: [null],
        LOCAL_CONTENT: [null],
        PROJECT_ID: ["*"],
        CUSTOMER_ID: ["*"],
        VALID_FROM: ["2008-04-25T00:00:00.000Z"],
        VALID_TO: ["2028-04-25T00:00:00.000Z"],
        VALID_FROM_QUANTITY: ["1.0000000"],
        VALID_TO_QUANTITY: [null],
        PRICE_FIXED_PORTION: ["824.5600000"],
        PRICE_VARIABLE_PORTION: ["843.6800000"],
        PRICE_TRANSACTION_CURRENCY_ID: ["EUR"],
        PRICE_UNIT: ["14.0000000"],
        PRICE_UNIT_UOM_ID: ["PC"],
        _VALID_FROM: ["2008-04-25T10:11:10.521Z"],
        _VALID_TO: [null],
        _SOURCE: [1],
        _CREATED_BY_USER_ID: ["Automatically generated"]
    },
});

describe("data migration tests", () => {

    beforeAll(() => {});

    afterAll(() => {
        if (oConn.close) {
            oConn.close();
        }      
    });

    if (jasmine.plcTestRunParameters.mode === 'prepare') {
        it("prepare test data with generating custom fields", () => {
            if (!checkExtensionTableExist(oConn, sPlcSchema)) {
                throw Error("no extension tables in PLC XSC schema, please do PLC DU and Post-Install before running this test");
            }  

            if (!generateCustomField(oConn, oMockData.t_metadata)) {
                throw Error("generate or drop custom fields error, please check PLC XSC database");
            }

            Object.keys(oMockData).forEach((sTableName) => {
                importDattoTable(oMockData[sTableName], sTableName)
            })

        });
    }

    if (jasmine.plcTestRunParameters.mode === 'assert') {
        it("check test data", () => {
            // compare t_metadata__text
            let sMetatDataTextSql = getQuerySql("t_metadata__text", ["PATH", "COLUMN_ID", "LANGUAGE"]);
            let oMetaDataTextResult = oConn.executeQuery(sMetatDataTextSql);
            transferQueryValue(oMetaDataTextResult[0]);
            expect(oMetaDataTextResult[0]).toMatchData(getExpectTableData("t_metadata__text"), Object.keys(oMetaDataTextResult[0]));
            // compare t_cost_center with customer field in extention table
            let sCostCenterSql = getQuerySql("t_cost_center", ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "_VALID_FROM"]);
            let oCostCenterResult = oConn.executeQuery(sCostCenterSql);
            transferQueryValue(oCostCenterResult[0]);
            expect(oCostCenterResult[0]).toMatchData(getExpectTableData("t_cost_center"), Object.keys(oCostCenterResult[0]));
            expect(checkCustomFieldExist(oConn, getExtensionTableName("cost_center"), oMockData.t_metadata.COLUMN_ID[0], getCurrentSchema(oConn))).toBe(true);
        })
    }

})

function getCurrentSchema(oConnection) {
    return oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

function transferQueryValue(oResult) {
    if (oResult) {
        Object.keys(oResult).forEach((sColumn) => {
            if (sColumn === "CREATED_AT" || sColumn === "LAST_MODIFIED_AT" || sColumn === "_VALID_FROM" || sColumn === "VALID_FROM" || sColumn === "VALID_TO") {
                oResult[sColumn] = oResult[sColumn].toJSON();
            }  
        })
    }
    
}

/**
 * get expect data result
 * @param {string} - the property name of mock data, also is the XSC table name
 * @returns {object} - formated data
 */
function getExpectTableData(sObjectName) {
    let oResultObject = {};
    let sOriginTableName = `sap.plc.db::basis.${sObjectName}`;
    let sRemovedColumns = getDeletedColumns(sOriginTableName).map((oColumn) => {
        return oColumn.originalColumn
    });
    Object.keys(oMockData[sObjectName]).forEach((sColumn) => {
        if (!sRemovedColumns.includes(sColumn)) {
            oResultObject[sColumn] = oMockData[sObjectName][sColumn][0];
        }
    });
    return oResultObject;
}

/**
 * transfer sql query format according to data model change
 * @param {string} - the property name of mock data, also is the XSC table name
 * @param {array} - primary collection
 * @returns {string} - query sql
 */
function getQuerySql(sObjectName, aPrimarykeys){
    let sOriginTableName = `sap.plc.db::basis.${sObjectName}`;
    let sTableName = getTargetTableName(sOriginTableName);
    let sRemovedColumns = getDeletedColumns(sOriginTableName).map((oColumn) => {
        return oColumn.originalColumn
    });
    let sQuerySql = `SELECT `;
    Object.keys(oMockData[sObjectName]).forEach((sColumn) => {
        if (!sRemovedColumns.includes(sColumn)) {
            sQuerySql += `"${getRenameColumn(sOriginTableName, sColumn)}" as "${sColumn}",`
        }
    });
    sQuerySql = sQuerySql.slice(0,-1) + ` FROM "${sTableName}" WHERE `;
    aPrimarykeys.forEach((sPrimarykey) => {
        sQuerySql += `${sPrimarykey} = '${oMockData[sObjectName][sPrimarykey][0]}' AND `
    });
    return sQuerySql.slice(0, -4);
}

/**
 * transfer mockdata to sql insert format
 * @param {object} - special table mock data
 * @param {string} - choose the format type to be array or object
 * @returns {boolean} - formated data
 */
function transferObjecttoArray(oData, sType = "array") {
    let aTransferObject = [];
    let aKeys = Object.keys(oData);
    for (let i = 0; i < oData[aKeys[0]].length; i++) {
        let aRowData = sType === "array" ? [] : {};
        for (let j = 0; j < aKeys.length; j++) {
            if (sType === "array") {
                aRowData.push(oData[aKeys[j]][i]);
            } else if(sType === "object"){
                aRowData[aKeys[j]] = oData[aKeys[j]][i];
            }
        }
        aTransferObject.push(aRowData);
    }
    return aTransferObject;
}

/**
 * generate custom fields in XSC SAP_PLC schema acoording to test data
 * @param {object}
 *  oConnection -   the sqlcc connection to XSC HANA db
 *  oMetadata - test mock data for special table
 * @returns {boolean} - true if generating custom fields successfully, else return false
 */
function generateCustomField(oConnection, oMetadata) {
    let oTableData = transferObjecttoArray(oMetadata, "object");
    try {
        oTableData.forEach((oItem) => {
            if (oItem["IS_CUSTOM"] === 1) {
                if ((oItem["BUSINESS_OBJECT"] == "Cost_Center")) {
                    modifyCustomField(oConnection, "Cost_Center", oItem);
                } else {
                    modifyCustomField(oConnection, oItem["BUSINESS_OBJECT"], oItem);
                }
            }
        });
        return true;
    } catch (e) {
        console.log(e.message);
        return false;
    }

}

/**
 * check custom fields exists, if yes, delete and regenerate them
 * @param {object}
 *  oConnection -   the sqlcc connection to XSC HANA db
 *  sTableName  -   extension table name
 *  oItem - custom field record
 */
function modifyCustomField(oConnection, sTableName, oItem) {
    if (checkCustomFieldExist(oConnection, getExtensionTableName(sTableName), oItem.COLUMN_ID, sPlcSchema)) {
        deleteCustomField(oConnection, getExtensionTableName(sTableName), oItem.COLUMN_ID, !oItem.COLUMN_ID.startsWith("CUST_"));
    }
    addCustomField(oConnection, getExtensionTableName(sTableName), oItem.COLUMN_ID, mapSemanticToSqlDatatype(oItem.SEMANTIC_DATA_TYPE, oItem.SEMANTIC_DATA_TYPE_ATTRIBUTES), !oItem.COLUMN_ID.startsWith("CUST_"));
}

/**
 * check custom fields exists, if yes, delete and regenerate them
 * @param {object}
 *  sBusinessObject - the table business object
 * @returns {string} - return table full name
 */
function getExtensionTableName(sBusinessObject) {
    // the table name is only for XSC 
    switch (sBusinessObject) {
        case "Material_Price":
            return "sap.plc.db::basis.t_price_ext";
        case "Activity_Price":
            return "sap.plc.db::basis.t_activity_rate_ext";
    }

    return `sap.plc.db::basis.t_${sBusinessObject.toLowerCase()}_ext`
}

/**
 * check XSC PLC extension table exists
 * @param {object}
 *  oConnection -   the sqlcc connection to XSC HANA db
 * @returns {boolean} - true if XSC PLC extension table exists, else return false
 */
function checkExtensionTableExist(oConnection, sSchema) {
    let oResult = oConnection.executeQuery(`SELECT COUNT(*) AS EXTNUMBER FROM "SYS"."TABLES" WHERE SCHEMA_NAME = '${sSchema}' AND RIGHT(TABLE_NAME, 4) = '_ext'`);
    if (oResult && oResult[0].EXTNUMBER > 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * check XSC PLC custom fields exists
 * @param {object}
 *  oConnection -   the sqlcc connection to XSC HANA db
 *  sTableName  -   extension table name
 *  sCustomField - custom field name
 * @returns {boolean} - true if custom field exists, else return false
 */
function checkCustomFieldExist(oConnection, sTableName, sCustomField, sSchema) {
    let oResult = oConnection.executeQuery(`SELECT * FROM "SYS"."TABLE_COLUMNS" WHERE SCHEMA_NAME = '${sSchema}' AND TABLE_NAME = '${sTableName}' AND COLUMN_NAME LIKE '${sCustomField}%'`);
    if (oResult && oResult.length > 0) {
        return true;
    } else {
        return false;
    }
}

/**
 * import CSV data to XSC PLC tables
 * @param {object}
 *  oTableData  -  extension table name
 *  sFile  -  CSV file name
 */
function importDattoTable(oTableData, sFile) {
    try {
        let oFormatData = transferObjecttoArray(oTableData);
        if (!oFormatData.length) {
            return false;
        }
        let sInsertSQL = `UPSERT "${sPlcSchema}"."sap.plc.db::basis.${sFile}" VALUES (`;
        for (let i = 0; i < oFormatData[0].length; i++) {
            sInsertSQL += "?,"
        }
        sInsertSQL = sInsertSQL.slice(0, -1) + `) WITH PRIMARY KEY`;
        oConn.executeUpdate(sInsertSQL, oFormatData);
    } catch (e) {
        console.log(e);
        console.log('error: ' + sFile.split('.')[0]);
    }
}

/**
 * map the custom fields data type to hanasql data type
 * @param {string}
 *  sSemanticDatatype   -  semantic data type
 *  sSemanticDatatypeAttributes - semantic data type attributes
 */
function mapSemanticToSqlDatatype(sSemanticDatatype, sSemanticDatatypeAttributes) {

    switch (sSemanticDatatype) {
        case "Integer":
            return "integer";
        case "UTCTimestamp":
            return "timestamp";
        case "LocalDate":
            return "date";
        case "BooleanInt":
            return "integer";
        case "String":
            parseResult = oParseStringRegexp.exec(sSemanticDatatypeAttributes);
            return "nvarchar(' + parseResult[1] + ')";
        case "Decimal":
            return "decimal(28,7)"; // always use precision 28, scale 7 for Decimal fields
    }
    const sLogMessage = "semantic datatype is unknown: " + sSemanticDatatype;
    $.trace.error(sLogMessage);
}

/**
 * add custom fields by altering table in XSC PLC schema
 * @param {object}
 *  oConnection -  the sqlcc connection to XSC HANA db
 *  sTableName - extension table name
 *  sFieldName - custom field name
 *  sFieldType - custom field type
 *  bIsMasterdataField - is master data type
 */
function addCustomField(oConnection, sTableName, sFieldName, sFieldType, bIsMasterdataField) {

    $.trace.info("Started adding custom field " + sFieldName + " of type " + sFieldType + " in table " + sTableName);

    // alter table add column
    let sSql = 'alter table "' + sPlcSchema + '"."' + sTableName + '" add (';

    // create field for manually entered values
    sSql += sFieldName + '_MANUAL ' + sFieldType + ', ';

    if (!bIsMasterdataField) {
        // create field for calculated values
        sSql += sFieldName + '_CALCULATED ' + sFieldType + ', ';
        // create field for switch between calculated and manually entered values
        sSql += sFieldName + '_IS_MANUAL tinyint, ';
    }

    // create field for UoM/currencies
    sSql += sFieldName + '_UNIT nvarchar(3))';

    oConnection.executeUpdate(sSql);
    $.trace.info("Finished adding custom field " + sFieldName + " of type " + sFieldType + " in table " + sTableName);
}

/**
 * add custom fields by altering table in XSC PLC schema
 * @param {object}
 *  oConnection -  the sqlcc connection to XSC HANA db
 *  sTableName - extension table name
 *  sFieldName - custom field name
 *  bIsMasterdataField - is master data type
 */
function deleteCustomField(oConnection, sTableName, sFieldName, bIsMasterdataField) {

    $.trace.info("Started deleting custom field " + sFieldName + " in table " + sTableName);

    // alter table drop column
    let sSql = 'alter table "' + sPlcSchema + '"."' + sTableName + '" drop (';

    // drop field for manually entered values
    sSql += sFieldName + '_MANUAL,';

    if (!bIsMasterdataField) {
        // drop field for calculated values
        sSql += sFieldName + '_CALCULATED,';
        // drop field for switch between calculated and manually entered values
        sSql += sFieldName + '_IS_MANUAL,';
    }

    // drop field for UoM/currencies
    sSql += sFieldName + '_UNIT)';

    oConnection.executeUpdate(sSql);
    $.trace.info("Finished deleting custom field " + sFieldName + " in table " + sTableName);
};
