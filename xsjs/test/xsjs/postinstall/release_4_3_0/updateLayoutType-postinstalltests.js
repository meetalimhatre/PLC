const sLayoutTable = "sap.plc.db::basis.t_layout";
const sLayoutColumnTable = "sap.plc.db::basis.t_layout_column";

var oConnection = null;

var user = $.session.getUsername();
var sExpectedDate = new Date().toISOString();
var sTestUser = $.session.getUsername();

describe("Insert standard bom compare layout", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var oLayout = [
            [111,'Test1', 0, null],
            [222,'Test2', 1, null],
            [333,'Test3', 0, 2],
            [444,'Test4', 0, 2]
        ];

        var oLayoutColumns = [
            [111,0,"Item","Item",null,null,null,430],
            [111,1,"Item","Item","ColA",null,null,430],
            [111,2,"Item","Item","ColB",null,null,430],
            [222,0,"Item","Item",null,null,null,430],
            [222,1,"Item","Item","ColA",null,null,430],
            [222,2,"Item","Item",null,null,null,430],
            [222,3,"Item","Item",null,null,null,430],
            [333,0,"Item","Item","ColA",null,null,430],
            [444,0,"Item","Item","ColA",null,null,430]
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sLayoutTable}" where layout_id in (111,222,333,444)`);
            oConnection.executeUpdate(`DELETE from "${sLayoutColumnTable}" where layout_id in (111,222,333,444)`);

            oConnection.executeUpdate(`INSERT INTO "${sLayoutTable}" (LAYOUT_ID,LAYOUT_NAME,IS_CORPORATE,LAYOUT_TYPE)
                                       VALUES (?, ?, ?, ?)`, oLayout);
            oConnection.executeUpdate(`INSERT INTO "${sLayoutColumnTable}" (LAYOUT_ID,DISPLAY_ORDER,PATH,BUSINESS_OBJECT,COLUMN_ID,COSTING_SHEET_ROW_ID,COST_COMPONENT_ID,COLUMN_WIDTH)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, oLayoutColumns);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("t_layout should contain only the default bom compare layout and no layout should have layout type set to null", () => {

            const oActualLayoutData = oConnection.executeQuery(`SELECT LAYOUT_ID, LAYOUT_TYPE FROM "${sLayoutTable}" where layout_id in (111,222,333,444)`);
            const oActualLayoutColumnData = oConnection.executeQuery(`SELECT LAYOUT_ID FROM "${sLayoutColumnTable}" where layout_id in (111,222,333,444)`);
            const oActualLayoutTypeData = oConnection.executeQuery(`SELECT LAYOUT_ID, LAYOUT_TYPE FROM "${sLayoutTable}" where layout_type is null or layout_type = 2`);


            expect(oActualLayoutData.length).toBe(2);
            expect(oActualLayoutColumnData.length).toBe(7);
            expect(oActualLayoutTypeData.length).toBe(1);

            oConnection.executeUpdate(`DELETE FROM "${sLayoutTable}" where layout_id in (111,222,333,444) `);
            oConnection.executeUpdate(`DELETE FROM "${sLayoutColumnTable}" where layout_id in (111,222,333,444) `);

            oConnection.commit();
        });
    }
});