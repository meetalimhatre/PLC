const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_cost_center__text', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_cost_center__text", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    cost_center: {
                        name: "sap.plc.db::basis.t_cost_center",
                        data: testData.oCostCenter
                    },
                    cost_center__text: {
                        name: "sap.plc.db::basis.t_cost_center__text",
                        data: testData.oCostCenterText
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

        it('should not create a cost center text', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "cost_center__text");

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should create a new cost center text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "cost_center__text");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "COST_CENTER_DESCRIPTION": "CostC CCC3 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "COST_CENTER_DESCRIPTION": "CostC CCC3 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where COST_CENTER_ID in ('${aInputRows[0].COST_CENTER_ID}', '${aInputRows[1].COST_CENTER_ID}')`);
            expect(aBeforeResults.columns.COST_CENTER_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "cost_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "COST_CENTER_DESCRIPTION": [aInputRows[0].COST_CENTER_DESCRIPTION, aInputRows[1].COST_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);
        });

        it('should update an existing cost center text for DE and EN', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "cost_center__text");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[3],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 EN",
                "_SOURCE": 2
            }];

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where COST_CENTER_ID in ('${aInputRows[0].COST_CENTER_ID}', '${aInputRows[1].COST_CENTER_ID}')
                and _VALID_TO is null`);
            expect(aBeforeResults.columns.COST_CENTER_ID.rows.length).toEqual(2);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(2);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 10, "cost_center__text");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "COST_CENTER_DESCRIPTION": [aInputRows[0].COST_CENTER_DESCRIPTION, aInputRows[1].COST_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE],
                "COST_CENTER_DESCRIPTION": [testData.oCostCenterText.COST_CENTER_DESCRIPTION[2], testData.oCostCenterText.COST_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oCostCenterText._VALID_FROM[2], testData.oCostCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oCostCenterText._SOURCE[2], testData.oCostCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "cost_center__text");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 DE",
                "_SOURCE": 2
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 8, "cost_center__text");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[6],
                "COST_CENTER_DESCRIPTION": testData.oCostCenterText.COST_CENTER_DESCRIPTION[6],
                "_SOURCE": testData.oCostCenterText._SOURCE[6],
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[7],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[7],
                "COST_CENTER_DESCRIPTION": testData.oCostCenterText.COST_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oCostCenterText._SOURCE[7],
            }];

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.COST_CENTER_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not create a cost center text if cost center does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": 'C4',
                "CONTROLLING_AREA_ID": testData.oControllingArea.CONTROLLING_AREA_ID[0],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "COST_CENTER_DESCRIPTION": "CostC CCC4 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COST_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].COST_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Cost Center ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_cost_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a cost center text if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 DE",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COST_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].COST_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Cost Center ID for Controlling Area ID '.concat(aInputRows[0].CONTROLLING_AREA_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_cost_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should not update a cost center text if language does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 AAA",
                "_SOURCE": 2
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['LANGUAGE'],
                "FIELD_VALUE": [aInputRows[0].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Language for Cost Center ID '.concat(aInputRows[0].COST_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_cost_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

        it('should insert two cost center texts, update two texts, add error for two, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");

            let aInputRows = [{
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[1],
                "COST_CENTER_DESCRIPTION": "CostC CCC3 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenter.COST_CENTER_ID[4],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[4],
                "LANGUAGE": testData.oLanguage.LANGUAGE[0],
                "COST_CENTER_DESCRIPTION": "CostC CCC3 EN",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[3],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[3],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[3],
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 EN",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": 'C4',
                "CONTROLLING_AREA_ID": '1111',
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "CostC CCC4 DE",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[2],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[2],
                "LANGUAGE": 'AAA',
                "COST_CENTER_DESCRIPTION": "Updated CostC CCC1 AAA",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "CostC CCC4 FR",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[6],
                "CONTROLLING_AREA_ID": testData.oCostCenter.CONTROLLING_AREA_ID[6],
                "LANGUAGE": testData.oLanguage.LANGUAGE[2],
                "COST_CENTER_DESCRIPTION": "CostC CCC4 FR",
                "_SOURCE": 2
            }, {
                "COST_CENTER_ID": testData.oCostCenterText.COST_CENTER_ID[7],
                "CONTROLLING_AREA_ID": testData.oCostCenterText.CONTROLLING_AREA_ID[7],
                "LANGUAGE": testData.oCostCenterText.LANGUAGE[7],
                "COST_CENTER_DESCRIPTION": testData.oCostCenterText.COST_CENTER_DESCRIPTION[7],
                "_SOURCE": testData.oCostCenterText._SOURCE[7],
            }];

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{cost_center__text}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oCostCenterText, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "cost_center");
            mockstarHelpers.checkRowCount(oMockstarPlc, 12, "cost_center__text");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['COST_CENTER_ID', 'LANGUAGE'],
                "FIELD_VALUE": [aInputRows[4].COST_CENTER_ID, aInputRows[5].LANGUAGE],
                "MESSAGE_TEXT": ['Unknown Cost Center ID for Controlling Area ID '.concat(aInputRows[4].CONTROLLING_AREA_ID), 'Unknown Language for Cost Center ID '.concat(aInputRows[5].COST_CENTER_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR'],
                "TABLE_NAME": ['t_cost_center__text', 't_cost_center__text']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID, aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[0].LANGUAGE, aInputRows[1].LANGUAGE, aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "COST_CENTER_DESCRIPTION": [aInputRows[0].COST_CENTER_DESCRIPTION, aInputRows[1].COST_CENTER_DESCRIPTION, aInputRows[2].COST_CENTER_DESCRIPTION, aInputRows[3].COST_CENTER_DESCRIPTION],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "COST_CENTER_ID": [aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "LANGUAGE": [aInputRows[2].LANGUAGE, aInputRows[3].LANGUAGE],
                "COST_CENTER_DESCRIPTION": [testData.oCostCenterText.COST_CENTER_DESCRIPTION[2], testData.oCostCenterText.COST_CENTER_DESCRIPTION[3]],
                "_VALID_FROM": [testData.oCostCenterText._VALID_FROM[2], testData.oCostCenterText._VALID_FROM[3]],
                "_SOURCE": [testData.oCostCenterText._SOURCE[2], testData.oCostCenterText._SOURCE[3]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_FROM", "_SOURCE", "_CREATED_BY"]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{cost_center__text}}
                where COST_CENTER_ID in ('${aInputRows[6].COST_CENTER_ID}', '${aInputRows[7].COST_CENTER_ID}', '${aInputRows[8].COST_CENTER_ID}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oCostCenterText, [4, 5, 6, 7]), ["COST_CENTER_ID", "CONTROLLING_AREA_ID", "LANGUAGE", "COST_CENTER_DESCRIPTION", "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"]);
        });

    }).addTags(["All_Unit_Tests"]);
}