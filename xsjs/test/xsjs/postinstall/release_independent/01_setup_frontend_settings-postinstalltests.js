const sXSCSchema = "SAP_PLC";
const sFrontendSettingsTable = "sap.plc.db::basis.t_frontend_settings";
//the test data comes from t_price_source.csv, it need to be updated if csv file changes.
const oExpectedData = {
    SETTING_NAME:['AnalysisForOfficeAnalyticViews', 'SapProvidedHelpLink', 'CustomerProvidedHelpLink', 'MaximumNumberOfImportItems', 'CustomAnalysisForOfficeAnalyticViews',  'MaximumNumberOfVariantsInSum', 'MaximumBatchSizeRepl'],
    SETTING_TYPE:['ANALYTICSINTEGRATION', 'APPLICATIONHELP', 'APPLICATIONHELP', 'IMPORTSETTINGS', 'ANALYTICSINTEGRATION', 'VARIANTSSETTINGS', 'REPLSETTINGS']
}

describe("test frontend settings were inserted", () => {
    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("compare settings", ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        SETTING_NAME,
                        SETTING_TYPE
                    FROM   
                        "${sFrontendSettingsTable}"
                        WHERE SETTING_NAME IN ('AnalysisForOfficeAnalyticViews', 'SapProvidedHelpLink', 'CustomerProvidedHelpLink', 'MaximumNumberOfImportItems', 'CustomAnalysisForOfficeAnalyticViews',  'MaximumNumberOfVariantsInSum', 'MaximumBatchSizeRepl')`);
            expect(oResult).toMatchData(oExpectedData, Object.keys(oResult[0]));
        });
    }
});