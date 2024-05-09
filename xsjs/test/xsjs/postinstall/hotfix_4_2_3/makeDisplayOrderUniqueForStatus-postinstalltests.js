const sStatusTable= "sap.plc.db::basis.t_status";
var oConnection = null;

describe("Make display order unqiue for statuses", () => {

    const sUser = "no_user";
    var dDate = new Date().toJSON()

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {

        var oStatusTestData = [
            ['ACTIVE', 1, 1, 1, 1, dDate, sUser, dDate, sUser],
            ['INACTIVE', 1, 1, 1, 3, dDate, sUser, dDate, sUser],
            ['PENDING', 1, 1, 1, 3, dDate, sUser, dDate, sUser],
            ['DRAFT', 1, 1, 1, 3, dDate, sUser, dDate, sUser],
            ['S1', 1, 1, 1, 4, dDate, sUser, dDate, sUser],
            ['S2', 1, 1, 1, 4, dDate, sUser, dDate, sUser],
            ['S3', 1, 1, 1, 4, dDate, sUser, dDate, sUser],
            ['S4', 1, 1, 1, 4, dDate, sUser, dDate, sUser],
            ['S5', 1, 1, 1, 9, dDate, sUser, dDate, sUser],
            ['S6', 1, 1, 1, 10, dDate, sUser, dDate, sUser],
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`INSERT INTO "${sStatusTable}" (STATUS_ID, IS_DEFAULT, IS_ACTIVE, IS_STATUS_COPYABLE, DISPLAY_ORDER, CREATED_ON, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, oStatusTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should have no duplicates for DISPLAY_ORDER for statuses", () => {

            const sTestUser = $.session.getUsername();
            var oExpectedStatuses = {
                "STATUS_ID": ['ACTIVE','DRAFT','INACTIVE','PENDING','S1','S2','S3','S4','S5','S6'],
                "DISPLAY_ORDER": [1,3,4,5,6,7,8,9,10,11],
                "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
            };
            const oActualStatuses = oConnection.executeQuery(`SELECT STATUS_ID,DISPLAY_ORDER,LAST_MODIFIED_BY FROM "${sStatusTable}" ORDER BY DISPLAY_ORDER, STATUS_ID`);
            expect(oActualStatuses.length).toBe(10);
            expect(oActualStatuses).toMatchData(oExpectedStatuses,["STATUS_ID"]);

            oConnection.executeUpdate(`DELETE FROM "${sStatusTable}"`);
            oConnection.commit();
        });
    }
}); 