const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const updateLayoutType = $.import("xs.postinstall.release_4_3_0", "updateLayoutType");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("Insert standard bom compare layout", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                layout: {
                    name: "sap.plc.db::basis.t_layout",
                    data: testdata.oLayout
                },
                layoutColumn: {
                    name: "sap.plc.db::basis.t_layout_column",
                    data: testdata.oLayoutColumns
                },
                layoutPersonal: {
                    name: "sap.plc.db::basis.t_layout_personal",
                    data: testdata.oLayoutPersonal
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
        oMockstar.execSingle(`update {{layout}} set layout_type = null where layout_id in (1,2,3,4)`);//these layouts should be updated
        oMockstar.execSingle(`update {{layout}} set layout_type = 2 where layout_id in (5,6,7)`); //these layouts are invalid and should be deleted
    });

    it("should update layout type", () => {
        //arrange
        // act
        updateLayoutType.run(jasmine.dbConnection);
        // assert
        let oLayoutsWithNullType = oMockstar.execQuery(`select * from {{layout}} where layout_type is null`);
        let oBomCompareLayouts = oMockstar.execQuery(`select * from {{layout}} where layout_type = 2`);
        let oLayoutColumns = oMockstar.execQuery(`select distinct layout_id from {{layoutColumn}}`);

        expect(oLayoutsWithNullType.columns.LAYOUT_ID.rows.length).toBe(0);
        expect(oBomCompareLayouts.columns.LAYOUT_ID.rows.length).toBe(1);
        expect(oLayoutColumns.columns.LAYOUT_ID.rows.length).toBe(4);
    });

    it("should upsert layout with id 3 and set layout_type to 2", () => {
        // act
        updateLayoutType.run(jasmine.dbConnection);
        // assert
        let oBomcomparelayout = oMockstar.execQuery(`select * from {{layout}} where layout_id = 3 and layout_type = 2`);

        expect(oBomcomparelayout.columns.LAYOUT_ID.rows.length).toBe(1);
    });

    it("should remove the previously created layouts with layout_type = 2 ", () => {
        // act
        updateLayoutType.run(jasmine.dbConnection);
        // assert
        let oLayoutData = oMockstar.execQuery(`select * from {{layout}} where layout_id in (5,6,7) `);
        let oLayoutColumnData = oMockstar.execQuery(`select * from {{layoutColumn}} where layout_id in (5,6,7)`);
        let oLayoutPersonalData = oMockstar.execQuery(`select * from {{layoutPersonal}} where layout_id in (5,6,7)`);

        expect(oLayoutData.columns.LAYOUT_ID.rows.length).toBe(0);
        expect(oLayoutColumnData.columns.LAYOUT_ID.rows.length).toBe(0);
        expect(oLayoutPersonalData.columns.LAYOUT_ID.rows.length).toBe(0);
    });

}).addTags(["All_Unit_Tests"]);