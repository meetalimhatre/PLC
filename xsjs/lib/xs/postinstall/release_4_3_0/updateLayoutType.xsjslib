const sLayoutTable = 'sap.plc.db::basis.t_layout';
const sLayoutColumnTable = 'sap.plc.db::basis.t_layout_column';
const sLayoutPersonal = 'sap.plc.db::basis.t_layout_personal';

function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

const setLayoutType = oConnection => {
    oConnection.executeUpdate(`update "${ sLayoutTable }" set LAYOUT_TYPE = 1 where layout_type is null`);
};

const cleanUpInconsistentLayouts = oConnection => {
    oConnection.executeUpdate(`delete from "${ sLayoutTable }" where layout_type = 2`);
    oConnection.executeUpdate(`delete from "${ sLayoutColumnTable }" where layout_id in 
                                (select layoutColumn.LAYOUT_ID from "${ sLayoutColumnTable }" layoutColumn left outer join "${ sLayoutTable }" layout 
                                on layoutColumn.LAYOUT_ID = layout.LAYOUT_ID where layout.LAYOUT_ID is null)`);
    oConnection.executeUpdate(`delete from "${ sLayoutPersonal }" where layout_id in 
                                (select layoutPersonal.LAYOUT_ID from "${ sLayoutPersonal }" layoutPersonal left outer join "${ sLayoutTable }" layout 
                                on layoutPersonal.LAYOUT_ID = layout.LAYOUT_ID where layout.LAYOUT_ID is null)`);
};

const insertStandardBomCompareLayout = oConnection => {
    oConnection.executeUpdate(`UPSERT "${ sLayoutTable }" (LAYOUT_ID,LAYOUT_NAME,IS_CORPORATE,LAYOUT_TYPE) VALUES (3,'#SAP Default for BoM Compare',1,2) WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'0','ITEM','Item','ITEM_KEY',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'1','ITEM','Item','QUANTITY',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'2','ITEM','Item','QUANTITY_UOM_ID',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'3','ITEM','Item','TOTAL_QUANTITY',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'4','ITEM','Item','TOTAL_QUANTITY_UOM_ID',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'5','ITEM','Item','TOTAL_COST',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'6','ITEM','Item','TOTAL_COST_PER_UNIT',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'7','ITEM','Item','PRICE_FIXED_PORTION',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'8','ITEM','Item','PRICE_VARIABLE_PORTION',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'9','ITEM','Item','PRICE',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'10','ITEM','Item','TRANSACTION_CURRENCY_ID',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'11','ITEM','Item','PRICE_UNIT',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'12','ITEM','Item','PRICE_UNIT_UOM_ID',NULL,NULL,'320') WITH PRIMARY KEY`);
    oConnection.executeUpdate(`UPSERT "${ sLayoutColumnTable }" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH) VALUES (3,'13','ITEM','Item','PRICE_FOR_TOTAL_QUANTITY',NULL,NULL,'320') WITH PRIMARY KEY`);
};

async function run(oConnection) {
    try {
        setLayoutType(oConnection);
        cleanUpInconsistentLayouts(oConnection);
        insertStandardBomCompareLayout(oConnection);
        await oConnection.commit();
    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Failed to adapt layouts: ${ e.message }`);
    }
    return true;
}
export default {sLayoutTable,sLayoutColumnTable,sLayoutPersonal,check,clean,setLayoutType,cleanUpInconsistentLayouts,insertStandardBomCompareLayout,run};
