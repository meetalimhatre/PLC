/* eslint no-var: 0, no-unused-vars: 0, max-len: 0 */
const trace = $.import("xs.xslib", "trace");
const whoAmI = "testtools.testrunner.postinstall.set_default_values_for_unit_masterdata_cf.xsjslib";
const PersistencyMetadata = $.require("../../../../lib/xs/db/persistency-metadata").Metadata;
const constants = $.require("../../../../lib/xs/util/constants");

function check(oConnection) {
    return true;
}

function info(line) {
    trace.info(whoAmI, line);
}

function run(oConnection) {
    const query = `select COLUMN_ID, BUSINESS_OBJECT, PATH, UOM_CURRENCY_FLAG, REF_UOM_CURRENCY_PATH, REF_UOM_CURRENCY_BUSINESS_OBJECT, REF_UOM_CURRENCY_COLUMN_ID from "sap.plc.db::basis.t_metadata" 
                    where IS_CUSTOM = 1 and UOM_CURRENCY_FLAG = 0 and REF_UOM_CURRENCY_PATH is not null and REF_UOM_CURRENCY_BUSINESS_OBJECT is not null and REF_UOM_CURRENCY_COLUMN_ID is not null
                    and ((BUSINESS_OBJECT='${constants.BusinessObjectTypes.Item}' and Path = '${constants.BusinessObjectTypes.Item}' and Column_ID like 'CUST_%') 
                    or (BUSINESS_OBJECT !='${constants.BusinessObjectTypes.Item}' and Path != '${constants.BusinessObjectTypes.Item}' and Column_ID LIKE_REGEXPR '^(CAPR|CWCE|CMPR|CMPL|CMAT|CCEN)[a-zA-Z0-9_]*$'))`;
    const aUnitCustomFields = Array.from(oConnection.executeQuery(query));

    const oPersistencyMetadata = new PersistencyMetadata($, null, oConnection, $.session.getUsername());

    // change the _UNIT property of the custom fields to the default values
    if (aUnitCustomFields.length > 0) {
        let updatedItem;
        aUnitCustomFields.forEach((row) => {
            updatedItem = oPersistencyMetadata.updateUnitField(row);
        });
        info("Custom fields updated.");
    } else {
        info("No custom fields had to be updated.");
    }

    return true;
}

function clean(oConnection) {
    // The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
