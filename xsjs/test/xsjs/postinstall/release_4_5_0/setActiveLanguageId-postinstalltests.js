const sLanguageTable = "sap.plc.db::basis.t_language";

var oConnection = null;

var user = $.session.getUsername();
var sExpectedDate = new Date().toISOString();
var sTestUser = $.session.getUsername();

describe("Sets value for TEXTS_MAINTAINABLE", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var oLanguageTestData = [
            ['SR', 1, "2014-04-01T00:00:00.000Z", null],
            ['ZH-HANS', 1, "2014-04-01T00:00:00.000Z", null],
            ['TH', 1, "2014-04-01T00:00:00.000Z", null],
            ['KO', 1, "2014-04-01T00:00:00.000Z", null],
            ['RO', 1, "2014-04-01T00:00:00.000Z", null],
            ['SL', 1, "2014-04-01T00:00:00.000Z", null],
            ['HR', 1, "2014-04-01T00:00:00.000Z", null],
            ['MS', 1, "2014-04-01T00:00:00.000Z", null],
            ['UK', 1, "2014-04-01T00:00:00.000Z", null],
            ['ET', 1, "2014-04-01T00:00:00.000Z", null],
            ['AR', 1, "2014-04-01T00:00:00.000Z", null],
            ['HE', 1, "2014-04-01T00:00:00.000Z", null],
            ['CS', 1, "2014-04-01T00:00:00.000Z", null],
            ['DE', 1, "2014-04-01T00:00:00.000Z", null],
            ['EN', 1, "2014-04-01T00:00:00.000Z", null],
            ['EL', 1, "2014-04-01T00:00:00.000Z", null],
            ['HU', 1, "2014-04-01T00:00:00.000Z", null],
            ['JA-JP', 1, "2014-04-01T00:00:00.000Z", null],
            ['DA', 1, "2014-04-01T00:00:00.000Z", null],
            ['PL', 1, "2014-04-01T00:00:00.000Z", null],
            ['ZH-HANT', 1, "2014-04-01T00:00:00.000Z", null],
            ['NL', 1, "2014-04-01T00:00:00.000Z", null],
            ['NO', 1, "2014-04-01T00:00:00.000Z", null],
            ['PT', 0, "2014-04-01T00:00:00.000Z", null],
            ['SK', 1, "2014-04-01T00:00:00.000Z", null],
            ['RU', 0, "2014-04-01T00:00:00.000Z", null],
            ['TR', 1, "2014-04-01T00:00:00.000Z", null],
            ['FI', 1, "2014-04-01T00:00:00.000Z", null],
            ['SV', 1, "2014-04-01T00:00:00.000Z", null],
            ['BG', 1, "2014-04-01T00:00:00.000Z", null],
            ['LT', 1, "2014-04-01T00:00:00.000Z", null],
            ['LV', 1, "2014-04-01T00:00:00.000Z", null],
            ['AF', 1, "2014-04-01T00:00:00.000Z", null],
            ['IS', 1, "2014-04-01T00:00:00.000Z", null],
            ['CA', 1, "2014-04-01T00:00:00.000Z", null],
            ['ID', 1, "2014-04-01T00:00:00.000Z", null],
            ['FR', 1, "2014-04-01T00:00:00.000Z", null],
            ['ES', 1, "2014-04-01T00:00:00.000Z", null],
            ['IT', 1, "2014-04-01T00:00:00.000Z", null],
        ]

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sLanguageTable}"`)

            oConnection.executeUpdate(`INSERT INTO "${sLanguageTable}" (LANGUAGE, TEXTS_MAINTAINABLE, _VALID_FROM, MAPPING_LANGUAGE_ID)
                                       VALUES (?, ?, ?, ?)`, oLanguageTestData);

            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("mapping_language_id should be set", () => {

            const oActualMappingLanguageId = oConnection.executeQuery(`SELECT LANGUAGE, MAPPING_LANGUAGE_ID, TEXTS_MAINTAINABLE FROM "${sLanguageTable}" WHERE LANGUAGE IN ('PT', 'RU')`);

            expect(oActualMappingLanguageId.length).toBe(2);
            expect(oActualMappingLanguageId[0].LANGUAGE).toEqual('PT');
            expect(oActualMappingLanguageId[0].TEXTS_MAINTAINABLE).toEqual(1);
            expect(oActualMappingLanguageId[1].LANGUAGE).toEqual('RU');
            expect(oActualMappingLanguageId[1].TEXTS_MAINTAINABLE).toEqual(1);

            oConnection.commit();
        });
    }
});