const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const UpdateHelpLink = $.import("xs.postinstall.release_4_0_0", "updateHelpLink");

describe("UpdateHelpLink-tests", () => {
    const sSettingType = "APPLICATIONHELP";
    const sSettingName = "SapProvidedHelpLink";
    const sOldProvidedHelpLink = "http://help.sap.com/plc300";
    const sProvidedHelpLink = "http://help.sap.com/plc_ce";
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                frontend_settings: "sap.plc.db::basis.t_frontend_settings",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update the sap provided help link", () => {
        // arrange
        const oFrontendSetting = {
            SETTING_ID: [0],
            SETTING_NAME: [sSettingName],
            SETTING_TYPE: [sSettingType],
            SETTING_CONTENT: [sOldProvidedHelpLink],
            USER_ID: [null],
        };
        const oFrontendSettingExpected = JSON.parse(JSON.stringify(oFrontendSetting));
        oFrontendSettingExpected.SETTING_CONTENT[0] = sProvidedHelpLink;

        oMockstar.insertTableData("frontend_settings", oFrontendSetting);
        jasmine.dbConnection.commit();

        // act
        UpdateHelpLink.run(jasmine.dbConnection);

        // assert
        const oFrontendSettingsAfter = oMockstar.execQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT, USER_ID
                                                            from {{frontend_settings}}
                                                            where SETTING_ID = '${oFrontendSetting.SETTING_ID[0]}'`);
        expect(oFrontendSettingsAfter.columns.SETTING_CONTENT.rows[0]).toBe(oFrontendSettingExpected.SETTING_CONTENT[0]);
        expect(oFrontendSettingsAfter).toMatchData(oFrontendSettingExpected, ["SETTING_ID", "SETTING_NAME", "SETTING_TYPE"]);
    });
}).addTags(["All_Unit_Tests"]);
