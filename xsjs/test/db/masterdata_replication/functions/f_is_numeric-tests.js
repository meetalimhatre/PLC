const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication.functions:f_is_numeric', function() {

        let oMockstarPlc = null;
        beforeOnce(function() {
            oMockstarPlc = new MockstarFacade({});
        });

        beforeEach(function() {
            oMockstarPlc.initializeData();
        });

        afterEach(function() {});

        it('should return 0 if the string has characters and numbers', function() {
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_is_numeric"('0056t6').RETISNUMERIC AS RETISNUMERIC FROM DUMMY;`);

            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETISNUMERIC.rows[0]).toEqual(0);
        });

        it('should return 0 if the string is not numeric', function() {
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_is_numeric"('tdtsdcd').RETISNUMERIC AS RETISNUMERIC FROM DUMMY;`);

            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETISNUMERIC.rows[0]).toEqual(0);
        });

        it('should return 1 if the string is numeric', function() {
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_is_numeric"('005678').RETISNUMERIC AS RETISNUMERIC FROM DUMMY;`);

            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETISNUMERIC.rows[0]).toEqual(1);
        });

        it('should return 1 if the string is a negativ number', function() {
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_is_numeric"('-0.34').RETISNUMERIC AS RETISNUMERIC FROM DUMMY;`);

            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETISNUMERIC.rows[0]).toEqual(1);
        });

        it('should return 1 if the string is a pozitive number', function() {
            //act
            let aResults = oMockstarPlc.execQuery(`SELECT "sap.plc.db.masterdata_replication.functions::f_is_numeric"('0.34+').RETISNUMERIC AS RETISNUMERIC FROM DUMMY;`);

            //assert
            expect(aResults).toBeDefined();
            expect(aResults.columns.RETISNUMERIC.rows[0]).toEqual(1);
        });
    }).addTags(["All_Unit_Tests"]);
}