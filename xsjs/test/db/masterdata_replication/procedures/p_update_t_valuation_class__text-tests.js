const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_valuation_class__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_valuation_class__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    valuation_class: {
                        name: "sap.plc.db::basis.t_valuation_class",
                        data: testData.oValuationClass
                    },
                    valuation_class__text: {
                        name: "sap.plc.db::basis.t_valuation_class__text",
                        data: testData.oValuationClassText
                    },
                    language: {
                        name: "sap.plc.db::basis.t_language",
                        data: testData.oLanguage
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

        it('should not create a valuation_class_text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "valuation_class__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new valuation_class_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "valuation_class__text");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V3 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where VALUATION_CLASS_ID in ('${aInputRows[0].VALUATION_CLASS_ID}', '${aInputRows[1].VALUATION_CLASS_ID}')`);
            expect(aBeforeResults.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "valuation_class__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "VALUATION_CLASS_DESCRIPTION": [aInputRows[0].VALUATION_CLASS_DESCRIPTION, aInputRows[1].VALUATION_CLASS_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);
        });

        it('should update an existing valuation_class_text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "valuation_class__text");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[3],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[3],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where VALUATION_CLASS_ID in ('${aInputRows[0].VALUATION_CLASS_ID}', '${aInputRows[1].VALUATION_CLASS_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.VALUATION_CLASS_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "valuation_class__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "VALUATION_CLASS_DESCRIPTION": [aInputRows[0].VALUATION_CLASS_DESCRIPTION, aInputRows[1].VALUATION_CLASS_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "VALUATION_CLASS_DESCRIPTION": [testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[2], testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oValuationClassText._VALID_FROM[2], testData.oValuationClassText._VALID_FROM[3]],
                "_SOURCE": [testData.oValuationClassText._SOURCE[2], testData.oValuationClassText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "valuation_class__text");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "valuation_class__text");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[6],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[6],
                "VALUATION_CLASS_DESCRIPTION": testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[6],
                "_SOURCE": testData.oValuationClassText._SOURCE[6],
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[7],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[7],
                "VALUATION_CLASS_DESCRIPTION": testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[7],
                "_SOURCE": testData.oValuationClassText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.VALUATION_CLASS_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a valuation_class_text if valuation_class does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": 'V4',
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VALUATION_CLASS_ID'],
                "FIELD_VALUE": [aInputRows[0].VALUATION_CLASS_ID],
                "MESSAGE_TEXT": ['Unknown Valuation Class ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_valuation_class__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a valuation_class_text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": 'AAA',
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Valuation Class ID '.concat(aInputRows[0].VALUATION_CLASS_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_valuation_class__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two valuation_class_texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");

            let aInputRows = [{
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V3 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClass.VALUATION_CLASS_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V3 EN",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[3],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[3],
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 EN",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": 'V4',
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V4 DE",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[2],
                "LANGUAGE": 'AAA',
                "VALUATION_CLASS_DESCRIPTION": "Updated Valuation V1 AAA",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V4 FR",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "VALUATION_CLASS_DESCRIPTION": "Valuation V4 FR",
                "_SOURCE": 2
            }, {
                "VALUATION_CLASS_ID": testData.oValuationClassText.VALUATION_CLASS_ID[7],
                "LANGUAGE": testData.oValuationClassText.LANGUAGE[7],
                "VALUATION_CLASS_DESCRIPTION": testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[7],
                "_SOURCE": testData.oValuationClassText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oValuationClassText, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);

            //assert
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "valuation_class");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "valuation_class__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VALUATION_CLASS_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].VALUATION_CLASS_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Valuation Class ID', 'Unknown Language for Valuation Class ID '.concat(aInputRows[5].VALUATION_CLASS_ID)],
                "MESSAGE_TYPE": ['ERROR','ERROR'],
                "TABLE_NAME": ['t_valuation_class__text', 't_valuation_class__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT","MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[0].VALUATION_CLASS_ID, aInputRows[1].VALUATION_CLASS_ID, aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "VALUATION_CLASS_DESCRIPTION": [aInputRows[0].VALUATION_CLASS_DESCRIPTION, aInputRows[1].VALUATION_CLASS_DESCRIPTION, aInputRows[2].VALUATION_CLASS_DESCRIPTION, aInputRows[3].VALUATION_CLASS_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "VALUATION_CLASS_ID": [aInputRows[2].VALUATION_CLASS_ID, aInputRows[3].VALUATION_CLASS_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "VALUATION_CLASS_DESCRIPTION": [testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[2], testData.oValuationClassText.VALUATION_CLASS_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oValuationClassText._VALID_FROM[2], testData.oValuationClassText._VALID_FROM[3]],
                "_SOURCE": [testData.oValuationClassText._SOURCE[2], testData.oValuationClassText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{valuation_class__text}}
                where VALUATION_CLASS_ID in ('${aInputRows[6].VALUATION_CLASS_ID}', '${aInputRows[7].VALUATION_CLASS_ID}', '${aInputRows[8].VALUATION_CLASS_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oValuationClassText, [4, 5, 6, 7]), ["VALUATION_CLASS_ID", "LANGUAGE", "VALUATION_CLASS_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}