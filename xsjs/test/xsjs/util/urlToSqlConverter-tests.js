if (jasmine.plcTestRunParameters.mode === 'all') {
    describe('xsjs.util.urlToSqlConverter-tests', function () {

        var UrlToSqlConverter = require("../../../lib/xs/util/urlToSqlConverter").UrlToSqlConverter;
        var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
        var mockstarHelpers = require("../../testtools/mockstar_helpers");
        var oUrlToSqlConverter;
        var oMockstar = new MockstarFacade();

        beforeEach(function () {
            oUrlToSqlConverter = new UrlToSqlConverter();
        });

        const afilterTemplates = [
            { name: "is", filter: "<COLUMN>=<VALUE>", expected: "0" },
            { name: "contains", filter: "<COLUMN>=%<VALUE>%", expected: "0" },
            { name: "startsWith", filter: "<COLUMN>=<VALUE>%", expected: "0" },
            { name: "endsWith", filter: "<COLUMN>=%<VALUE>", expected: "0" },
            { name: "greaterThanEquals", filter: "<COLUMN>>=<VALUE>", expected: "0" },
            { name: "lowerThanEquals", filter: "<COLUMN><=<VALUE>", expected: "0" },
            { name: "isNot", filter: "<COLUMN>!=<VALUE>", expected: "0" },
            { name: "lowerThan", filter: "<COLUMN><<VALUE>", expected: "0" },
            { name: "greaterThan", filter: "<COLUMN>><VALUE>", expected: "0" },
            { name: "isNot", filter: "<COLUMN>!=<VALUE>" },
            { name: "lowerThan", filter: "<COLUMN><<VALUE>" },
            { name: "greaterThan", filter: "<COLUMN>><VALUE>" },
            { name: "isForTimeStamp", filter: "<COLUMN>>=<VALUE>&<COLUMN><={VALUE2}" }
        ]

        const parameters = [
            {
                description: "Boolean",
                testData: { column: "TEST_COLUMN", values: [0] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "BooleanInt" }],
                filters: [
                    { conditions: ["is"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals", "lowerThanEquals"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["endsWith"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: 1, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: 1, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: 0, expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },

                ]
            },
            {
                description: "Integer",
                testData: { column: "TEST_COLUMN", values: [0] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "Integer" }],
                filters: [
                    { conditions: ["is"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "endsWith"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals", "lowerThanEquals"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["endsWith"], filterValue: 0, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: 1, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: 1, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: -1, expected: { "TEST_COLUMN": [0] }, k: ["TEST_COLUMN"] },
                ]
            },
            {
                description: "Decimal",
                testData: { column: "TEST_COLUMN", values: [0.45] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "Decimal", SEMANTIC_DATA_TYPE_ATTRIBUTES: "precision=24; scale=7" }],
                filters: [
                    { conditions: ["is"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                    //{ conditions: ["contains"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },    these fail for DECIMAL with or without ESCAPE '_'               
                    //{ conditions: ["startsWith"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },                    
                    //{ conditions: ["endsWith"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },                    
                    { conditions: ["is", "greaterThanEquals"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "greaterThanEquals", "lowerThanEquals"], filterValue: 0.45, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: 0.44, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: 0.50, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: 0.44, expected: { "TEST_COLUMN": ['0.45'] }, k: ["TEST_COLUMN"] },
                ]
            },
            {
                description: "String",
                testData: { column: "TEST_COLUMN", values: ["'TEST'"] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "String" }],
                filters: [
                    { conditions: ["is"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "endsWith"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["is", "contains", "startsWith", "greaterThanEquals", "lowerThanEquals"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["endsWith"], filterValue: "TEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: "TEST1", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: "ZEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: "PEST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },

                    { conditions: ["endsWith"], filterValue: "ST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["startsWith"], filterValue: "TE", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "ES", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },

                    { conditions: ["endsWith"], filterValue: "ST", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["startsWith"], filterValue: "TE", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "ES", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                ]
            },
            {
                description: "String",
                testData: { column: "TEST_COLUMN", values: ["'TE_ST'", "'TEST'"] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "String" }],
                filters: [

                    { conditions: ["endsWith"], filterValue: "ST", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["startsWith"], filterValue: "TE", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "ES", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: "TE_T", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },

                ]
            },
            {
                description: "String",
                testData: { column: "TEST_COLUMN", values: ["'TE_ST'", "'TEST'"] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "String" }],
                filters: [

                    { conditions: ["endsWith"], filterValue: "ST", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["startsWith"], filterValue: "TE", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "ES", expected: { "TEST_COLUMN": ["TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: "TE_T", expected: { "TEST_COLUMN": ["TE_ST", "TEST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "_", expected: { "TEST_COLUMN": ["TE_ST"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["contains"], filterValue: "__", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] }

                ]
            },
            {
                description: "UTCTimestamp",
                testData: { column: "TEST_COLUMN", values: ["'2021-06-10T10:00:00Z'"] },
                metadata: [{ COLUMN_ID: "TEST_COLUMN", SEMANTIC_DATA_TYPE: "UTCTimestamp" }],
                filters: [
                    { conditions: ["is"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },
                    { conditions: ["isNot"], filterValue: "2021-06-10T10:00:01Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: "2021-06-10T10:00:01Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThan"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: "2021-06-10T09:59:59", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThan"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThanEquals"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThanEquals"], filterValue: "2021-06-10T09:59:59", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThanEquals"], filterValue: "2021-06-10T10:00:01", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThanEquals"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThanEquals"], filterValue: "2021-06-10T09:59:59", expected: { "TEST_COLUMN": [] }, k: ["TEST_COLUMN"] },
                    { conditions: ["lowerThanEquals"], filterValue: "2021-06-10T10:00:01", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThanEquals"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },
                    { conditions: ["greaterThanEquals", "lowerThanEquals"], filterValue: "2021-06-10T10:00:00Z", expected: { "TEST_COLUMN": ["2021-06-10T10:00:00Z"] }, k: ["TEST_COLUMN"] },

                ]
            },
        ];

        parameters.forEach(p => {
            p.filters.forEach(f => {
                it(`${p.description} with filter name: "${f.conditions}"`, () => {

                    //arrange
                    aFilterTemaplatesToApply = afilterTemplates.filter(t => { return f.conditions.some(c => c === t.name) });
                    var sAllFilters = aFilterTemaplatesToApply.map(t => t.filter.replace("<COLUMN>", p.testData.column).replace("<VALUE>", f.filterValue)).join('&');
                    var sSqlInnerSelect = p.testData.values.map(v => `SELECT ${v} AS ${p.testData.column} FROM DUMMY`).join(' UNION ');

                    //act
                    var sActualFilter = oUrlToSqlConverter.convertToSqlFormat(sAllFilters, p.metadata);
                    var sSql = `SELECT * FROM (${sSqlInnerSelect}) WHERE ${sActualFilter}`;                    
                    var oActualResult = oMockstar.execQuery(sSql);

                    //assert                    
                    expect(mockstarHelpers.convertResultToArray(oActualResult)).toMatchData(f.expected, f.k);

                });
            });
        });
    });
}