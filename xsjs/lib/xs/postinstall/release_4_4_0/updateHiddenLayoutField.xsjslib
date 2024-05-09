function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {

    const sLayoutHiddenTable = "sap.plc.db::basis.t_layout_hidden_field";    

    try {
        oConnection.executeUpdate(`update "${sLayoutHiddenTable}" set COLUMN_ID ='LIFECYCLE_PERIOD_DESCRIPTION' 
        where PATH='CALCULATION_VERSION' and BUSINESS_OBJECT='Calculation_Version' and COLUMN_ID ='LIFECYCLE_PERIOD_FROM';`);        
    } catch (e) {
        console.log("error:", e.message);
        throw new Error(`Failed to update layout hidden field LIFECYCLE_PERIOD_FROM , Error: ${e.message}`);
    }

    oConnection.commit();
    return true;
}
