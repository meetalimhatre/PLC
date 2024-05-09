const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const SetValueForMappingLanguageId = $.import("xs.postinstall.release_4_3_0", "setValueForMappingLanguageId");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("setValueForMappingLanguageId-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                language: {
                    name: "sap.plc.db::basis.t_language",
                    data: testdata.oMappingLanguageTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should change the value of language_id to mapping_language_id's value", () => {
        // arrange

        // act
        SetValueForMappingLanguageId.run(jasmine.dbConnection);
        // assert
        var oMappingLanguageId = oMockstar.execQuery(`select LANGUAGE, MAPPING_LANGUAGE_ID,TEXTS_MAINTAINABLE from {{language}}`);
        expect(oMappingLanguageId.columns.MAPPING_LANGUAGE_ID.rows.length).toBe(39);
        expect(oMappingLanguageId.columns.LANGUAGE.rows).toEqual(['SR','ZH-HANS','TH','KO','RO','SL','HR','MS','UK','ET','AR','HE','CS','DE','EN','EL','HU','JA-JP','DA','PL','ZH-HANT','NL','NO','PT','SK','RU','TR','FI','SV','BG','LT','LV','AF','IS','CA','ID','FR','ES','IT']);
        expect(oMappingLanguageId.columns.MAPPING_LANGUAGE_ID.rows).toEqual(['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','G','H','J','K','L','M','N','O','P','Q','R','T','U','V','W','X','Y','a','b','c','i','F','S','I']);
        expect(oMappingLanguageId.columns.TEXTS_MAINTAINABLE.rows).toEqual([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]);
    });

}).addTags(["All_Unit_Tests"]);