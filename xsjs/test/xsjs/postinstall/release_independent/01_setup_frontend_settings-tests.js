const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const setupFrontendSettings = $.import("xs.postinstall.release_independent", "01_setup_frontend_settings");
describe("adapt_layout_values-tests", () => {
    let oMockstar;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                frontend_settings: "sap.plc.db::basis.t_frontend_settings",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
    });

    it("should add all the necessary frontend settings", () => {
       
        // act
        setupFrontendSettings.run(jasmine.dbConnection);

        // assert
        const oFrontendSettingAfter = oMockstar.execQuery(`select SETTING_ID, SETTING_NAME, SETTING_CONTENT
                                                             from {{frontend_settings}}`);
        expect(oFrontendSettingAfter.columns.SETTING_ID.rows.length).toBe(7);
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[1]).toBe('https://help.sap.com/plc_ce');
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[3]).toBe('30000');
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[0]).not.toContain('{{DBSCHEMA}}');
    });

    it("should add all the necessary frontend settings that did not previously exist", () => {
        //arrange
        var testData = {
            SETTING_ID: [2,3,4,5],
            SETTING_NAME: ['SapProvidedHelpLink', 'CustomerProvidedHelpLink', 'MaximumNumberOfImportItems', 'MaximumBatchSizeRepl'],
            SETTING_TYPE: ['APPLICATIONHELP', 'APPLICATIONHELP', 'IMPORTSETTINGS', 'REPLSETTINGS'],
            SETTING_CONTENT: ['TEST','TEST','TEST', '5000000']
        }
        oMockstar.insertTableData('frontend_settings',testData);
        
        // act
        setupFrontendSettings.run(jasmine.dbConnection);
        
        // assert
        const oFrontendSettingAfter = oMockstar.execQuery(`select SETTING_ID, SETTING_NAME, SETTING_CONTENT
        from {{frontend_settings}}`);
        expect(oFrontendSettingAfter.columns.SETTING_ID.rows.length).toBe(7);
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[0]).toBe('TEST');
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[1]).toBe('TEST');
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[3]).not.toBe('TEST');
        expect(oFrontendSettingAfter.columns.SETTING_CONTENT.rows[4]).not.toContain('{{DBSCHEMA}}');
        });

}).addTags(["All_Unit_Tests"]);
