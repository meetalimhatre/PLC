var MockstarFacade = require('../../../testtools/mockstar_facade').MockstarFacade;
var testData = require('../../../testdata/testdata').data;

describe('p_materdata_references_validator', function () {

    let testPackage = $.session.getUsername().toLowerCase();
    let oMockstar = null;
    let sTestUser = 'Test';
    let dTimestamp = new Date();
    let sControllingArea = '#CA1';

    let oValidData = {
        'COLUMN_ID': ['PLANT_ID', 'MATERIAL_ID'],
        'VALUE': ['PL1', 'MAT1']
    };

    let oInvalidData = {
        'COLUMN_ID': ['PLANT_ID', 'MATERIAL_ID'],
        'VALUE': ['TEMP1', 'TEMP2']
    };

    beforeOnce(function () {
        oMockstar = new MockstarFacade({ // Initialize Mockstar
            testmodel: 'sap.plc.db.administration.procedures/p_materdata_references_validator',
            substituteTables: // substitute all used tables in the procedure or view
            {
                material: {
                    name: 'sap.plc.db::basis.t_material',
                    data: testData.oMaterialTestDataPlc
                },
                plant: {
                    name: 'sap.plc.db::basis.t_plant',
                    data: testData.oPlantTestDataPlc
                },
                gtt_masterdata_validator: {
                    name: 'sap.plc.db::temp.gtt_masterdata_validator'
                }
            }
        });
    });

    beforeEach(function () {
        oMockstar.clearAllTables(); // clear all specified substitute tables and views
        oMockstar.initializeData();
    });

    afterOnce(function () {
        oMockstar.cleanup(testPackage + 'sap.plc.db.administration.procedures');
    });

    afterEach(function () {});

    describe('Check if masterdata is temporary or not', function () {

        it('should delete all rows from the temporary table', function () {
            // arrange
            oMockstar.insertTableData('gtt_masterdata_validator', oValidData);

            // act 
            var procedure = oMockstar.loadProcedure();
            var result = procedure(dTimestamp, sControllingArea);

            // assert
            var iNumberOfInvalidRows = oMockstar.execQuery(`SELECT COUNT(*) AS ROWCOUNT FROM {{gtt_masterdata_validator}};`);
            expect(iNumberOfInvalidRows.columns.ROWCOUNT.rows[0]).toBe(0);
        });

        it('should delete two rows from the temporary table', function () {
            // arrange
            oMockstar.insertTableData('gtt_masterdata_validator', oInvalidData);

            // act 
            var procedure = oMockstar.loadProcedure();
            var result = procedure(dTimestamp, sControllingArea);

            // assert
            var iNumberOfInvalidRows = oMockstar.execQuery(`SELECT COUNT(*) AS ROWCOUNT FROM {{gtt_masterdata_validator}};`);
            expect(iNumberOfInvalidRows.columns.ROWCOUNT.rows[0]).toBe(2);
        });

    });

}).addTags(['All_Unit_Tests', 'CF_Unit_Tests']);