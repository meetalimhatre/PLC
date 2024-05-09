const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const setActiveLanguageId = $.import("xs.postinstall.release_4_5_0", "setActiveLanguageId");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("setActiveLanguageId-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                language: {
                    name: "sap.plc.db::basis.t_language",
                    data: testdata.oActiveLanguageTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should activate  Portuguese and Russian language", () => {
        // act
        setActiveLanguageId.run(jasmine.dbConnection);
        // assert
        let oMappingLanguageId = oMockstar.execQuery(`select LANGUAGE, MAPPING_LANGUAGE_ID,TEXTS_MAINTAINABLE from {{language}} where LANGUAGE in ('RU', 'PT')`); 
        expect(oMappingLanguageId.columns.MAPPING_LANGUAGE_ID.rows.length).toBe(2);
        expect(oMappingLanguageId.columns.LANGUAGE.rows).toEqual(['PT','RU']);
        expect(oMappingLanguageId.columns.TEXTS_MAINTAINABLE.rows).toEqual([1,1]);
    });

}).addTags(["All_Unit_Tests"]);