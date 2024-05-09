/* eslint no-var: 0, no-unused-vars: 0, max-len: 0 */
const trace = $.import("xs.xslib", "trace");
const whoAmI = "testtools.testrunner.postinstall.set_default_values_for_masterdata_boolean_cf.xsjslib";
const PersistencyImport = $.import("xs.db", "persistency");
const constants = $.require("../../../../lib/xs/util/constants");

function check(oConnection) {
    return true;
}

function info(line) {
    trace.info(whoAmI, line);
}

function run(oConnection) {
    // select the masterdata custom fields of boolean type
    const query = `select COLUMN_ID, BUSINESS_OBJECT, PATH from "sap.plc.db::basis.t_metadata" where IS_CUSTOM = 1 and SEMANTIC_DATA_TYPE = 'BooleanInt' and BUSINESS_OBJECT <> '${constants.BusinessObjectTypes.Item}'`;
    const aBooleanCustomFields = Array.from(oConnection.executeQuery(query));

    const oPersistency = new PersistencyImport.Persistency(oConnection);

    // change the _MANUAL property of the boolean custom fields to the default values
    if (aBooleanCustomFields.length > 0) {
        let updatedItem;
        // set
        aBooleanCustomFields.forEach((row) => {
            updatedItem = oPersistency.Metadata.updateFieldWithDefaultValue(row);
        });

        info("Custom fields updated.");
    } else {
        info("No boolean custom fields had to be updated.");
    }

    return true;
}

function clean(oConnection) {
    // The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
