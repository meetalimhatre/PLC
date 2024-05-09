const sFormulaTable = "sap.plc.db::basis.t_formula";
var oConnection = null;

//check if sqlcc configuration is ok
function check(oCurrentConnection){
    try{
        oConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
        return true;
    } catch(e) {
        throw(e);
    }
}

function run(oCurrentConnection) {
    const sCurrentSchema = getCurrentSchema(oCurrentConnection);
    oCurrentConnection.executeUpdate(`
                                update "${sCurrentSchema}"."${sFormulaTable}"
                                    set COLUMN_ID = 
                                        case when COLUMN_ID = 'QUANTITY_FOR_ONE_ASSEMBLY' then 'QUANTITY'
                                             when COLUMN_ID = 'COSTING_LOT_SIZE' then 'LOT_SIZE'
                                    end
                                where COLUMN_ID in ('QUANTITY_FOR_ONE_ASSEMBLY', 'COSTING_LOT_SIZE')
                             `);
    oCurrentConnection.commit();
    return true;
}

function getCurrentSchema(oCurrentConnection) {
    return oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

function clean(oCurrentConnection) {
    closeSqlConnection(oConnection)
    return true;
}
