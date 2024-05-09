const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_plant', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_plant", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
                    },
                    company_code: {
                        name: "sap.plc.db::basis.t_company_code",
                        data: testData.oCompanyCode
                    },
                    error: {
                        name: "sap.plc.db::map.t_replication_log",
                        data: testData.oError
                    }
                }
            });
        });

        beforeEach(function() {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function() {});

        function pickFromTableData(oTableDataObject, aIndices) {
            var oReturnObject = {};
            _.each(oTableDataObject, function(aValues, sColumnName) {
                // since _.pick returns an object, the result must be converted back to an array
                oReturnObject[sColumnName] = _.toArray(_.pick(aValues, aIndices));
            });
            return oReturnObject;
        }

        it('should not create a plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            const aInputRows = [{
                "PLANT_ID": 'PL4',
                "COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[0],
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{plant}}
                where PLANT_ID = '${aInputRows[0].PLANT_ID}'`);
            expect(aBeforeResults.columns.PLANT_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);
        });

        it('should update an existing plant', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[4],
                "_SOURCE": 2,
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant}}
                where PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.PLANT_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "plant");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where PLANT_ID = '${aInputRows[0].PLANT_ID}' and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where PLANT_ID = '${aInputRows[0].PLANT_ID}' and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID],
                "_VALID_FROM": [testData.oPlant._VALID_FROM[4]],
                "_SOURCE": [testData.oPlant._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            const aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[4],
                "_SOURCE": 2,
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[4],
                "_SOURCE": 2,
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "plant");

            const aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[3],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[3],
                "_SOURCE": testData.oPlant._SOURCE[3],
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[4],
                "_SOURCE": testData.oPlant._SOURCE[4],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.PLANT_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.PLANT_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a plant if company code does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": 'CC99',
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_ID'],
                "FIELD_VALUE": [aInputRows[0].COMPANY_CODE_ID],
                "MESSAGE_TEXT": ['Unknown Company Code ID for Plant ID '.concat(aInputRows[0].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two accounts, update two, add error for one, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            const aInputRows = [{
                "PLANT_ID": 'PL4',
                "COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[0],
                "COUNTRY": 'RO',
                "POSTAL_CODE": '12345',
                "REGION": 'VASLUI',
                "CITY": 'VASLUI',
                "STREET_NUMBER_OR_PO_BOX": '22C',
                "_SOURCE": 2
            }, {
                "PLANT_ID": 'PL5',
                "COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[0],
                "COUNTRY": 'ROM',
                "POSTAL_CODE": '67890',
                "REGION": 'IASI',
                "CITY": 'IASI',
                "STREET_NUMBER_OR_PO_BOX": '33D',
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[3],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[3],
                "COUNTRY": 'RO',
                "POSTAL_CODE": '12345',
                "REGION": 'VASLUI',
                "CITY": 'VASLUI',
                "STREET_NUMBER_OR_PO_BOX": '22C',
                "_SOURCE": 3,
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[4],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[4],
                "COUNTRY": 'ROM',
                "POSTAL_CODE": '67890',
                "REGION": 'IASI',
                "CITY": 'IASI',
                "STREET_NUMBER_OR_PO_BOX": '33D',
                "_SOURCE": 2,
            }, {
                "PLANT_ID": 'PL6',
                "COMPANY_CODE_ID": 'CC99',
                "_SOURCE": 2
            }, {
                "PLANT_ID": 'PL7',
                "COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[0],
                "_SOURCE": 2
            }, {
                "PLANT_ID": 'PL7',
                "COMPANY_CODE_ID": testData.oCompanyCode.COMPANY_CODE_ID[0],
                "_SOURCE": 2
            }, {
                "PLANT_ID": testData.oPlant.PLANT_ID[1],
                "COMPANY_CODE_ID": testData.oPlant.COMPANY_CODE_ID[1],
                "_SOURCE": testData.oPlant._SOURCE[1],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{plant}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oPlant, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "plant");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COMPANY_CODE_ID'],
                "FIELD_VALUE": [aInputRows[4].COMPANY_CODE_ID],
                "MESSAGE_TEXT": ['Unknown Company Code ID for Plant ID '.concat(aInputRows[4].PLANT_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_plant']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "COMPANY_CODE_ID": [aInputRows[0].COMPANY_CODE_ID, aInputRows[1].COMPANY_CODE_ID, aInputRows[2].COMPANY_CODE_ID, aInputRows[3].COMPANY_CODE_ID],
                "COUNTRY": [aInputRows[0].COUNTRY, aInputRows[1].COUNTRY, aInputRows[2].COUNTRY, aInputRows[3].COUNTRY],
                "POSTAL_CODE": [aInputRows[0].POSTAL_CODE, aInputRows[1].POSTAL_CODE, aInputRows[2].POSTAL_CODE, aInputRows[3].POSTAL_CODE],
                "REGION": [aInputRows[0].REGION, aInputRows[1].REGION, aInputRows[2].REGION, aInputRows[3].REGION],
                "CITY": [aInputRows[0].CITY, aInputRows[1].CITY, aInputRows[2].CITY, aInputRows[3].CITY],
                "STREET_NUMBER_OR_PO_BOX": [aInputRows[0].STREET_NUMBER_OR_PO_BOX, aInputRows[1].STREET_NUMBER_OR_PO_BOX, aInputRows[2].STREET_NUMBER_OR_PO_BOX, aInputRows[3].STREET_NUMBER_OR_PO_BOX],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "COMPANY_CODE_ID", "COUNTRY", "POSTAL_CODE", "REGION", "CITY", "STREET_NUMBER_OR_PO_BOX", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{plant}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "COMPANY_CODE_ID": [aInputRows[2].COMPANY_CODE_ID, aInputRows[3].COMPANY_CODE_ID],
                "_VALID_FROM": [testData.oPlant._VALID_FROM[3], testData.oPlant._VALID_FROM[4]],
                "_SOURCE": [testData.oPlant._SOURCE[3], testData.oPlant._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{plant}}
                where PLANT_ID in ('${aInputRows[5].PLANT_ID}', '${aInputRows[6].PLANT_ID}', '${aInputRows[7].PLANT_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oPlant, [0, 1]), ["PLANT_ID", "COMPANY_CODE_ID", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}