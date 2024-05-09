var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('db.administration:p_update_material_prices_first_version_audit_columns',function() {
		
		var oMockstarPlc = null;
		
		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.administration.procedures/p_update_material_prices_first_version_audit_columns", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{
							material_price: {
								name: "sap.plc.db::basis.t_material_price"
							},
							material_price__first_version: {
								name: "sap.plc.db::basis.t_material_price__first_version"
							}
						}
					});
		});

		beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.initializeData();
		});
		
		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for material prices that have only one version', function() {

            var oMaterialPriceTestDataPlc = {
                    "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["101","201","101","101"],
                    "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT1"],
                    "PLANT_ID": ["PL1","PL1","*","PL3"],
                    "VENDOR_ID": ["*","*","*","*"],
                    "PROJECT_ID": ["*", "*", "*", "*"],
                    "CUSTOMER_ID": ["*", "*", "*", "*"],
                    "VALID_FROM": ["2015-06-19T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z"],
                    "VALID_TO": ["2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z","2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z"],
                    "VALID_FROM_QUANTITY": ['1.0000000','1.0000000','1.0000000','1.0000000'],
                    "PRICE_FIXED_PORTION": ['123.4500000','123.8800000','121.2500000','121.2500000'],
                    "PRICE_VARIABLE_PORTION": ['234.5600000','234.9900000','200.5500000','234.9900000'],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ['1.0000000','100.0000000','1.0000000','2.0000000'],
                    "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
                    "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                    "_SOURCE": [1,2,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305774","U000920","U000920","U000920"]
            };

			//arrange
			oMockstarPlc.insertTableData("material_price", oMaterialPriceTestDataPlc);
			
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure();

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{material_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "180000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305774","U000920","U000920","U000920"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });

		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for material prices that have more than one version', function() {

            var oMaterialPriceTestDataPlc = {
                    "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "170000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["101","201","101","101"],
                    "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT1"],
                    "PLANT_ID": ["PL1","PL1","*","PL3"],
                    "VENDOR_ID": ["*","*","*","*"],
                    "PROJECT_ID": ["*", "*", "*", "*"],
                    "CUSTOMER_ID": ["*", "*", "*", "*"],
                    "VALID_FROM": ["2015-06-19T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z"],
                    "VALID_TO": ["2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z","2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z"],
                    "VALID_FROM_QUANTITY": ['1.0000000','1.0000000','1.0000000','1.0000000'],
                    "PRICE_FIXED_PORTION": ['123.4500000','123.8800000','121.2500000','121.2500000'],
                    "PRICE_VARIABLE_PORTION": ['234.5600000','234.9900000','200.5500000','234.9900000'],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ['1.0000000','100.0000000','1.0000000','2.0000000'],
                    "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
                    "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z"],
                    "_VALID_TO": ["2016-06-19T12:27:23.197Z",null,"2016-06-19T12:27:23.197Z",null],
                    "_SOURCE": [1,2,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305774","U000920","U000921","U000920"]
            };

			//arrange
			oMockstarPlc.insertTableData("material_price", oMaterialPriceTestDataPlc);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(2);

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{material_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "170000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305774","I305774","U000921","U000921"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });

		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for material prices that have one or more versions', function() {

            var oMaterialPriceTestDataPlc = {
                    "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "170000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["101","201","101","101"],
                    "MATERIAL_ID": ["MAT1","MAT1","MAT1","MAT1"],
                    "PLANT_ID": ["PL1","PL1","*","PL3"],
                    "VENDOR_ID": ["*","*","*","*"],
                    "PROJECT_ID": ["*", "*", "*", "*"],
                    "CUSTOMER_ID": ["*", "*", "*", "*"],
                    "VALID_FROM": ["2015-06-19T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z","2010-01-01T00:00:00.000Z"],
                    "VALID_TO": ["2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z","2999-12-31T00:00:00.000Z","2099-12-31T00:00:00.000Z"],
                    "VALID_FROM_QUANTITY": ['1.0000000','1.0000000','1.0000000','1.0000000'],
                    "PRICE_FIXED_PORTION": ['123.4500000','123.8800000','121.2500000','121.2500000'],
                    "PRICE_VARIABLE_PORTION": ['234.5600000','234.9900000','200.5500000','234.9900000'],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ['1.0000000','100.0000000','1.0000000','2.0000000'],
                    "PRICE_UNIT_UOM_ID": ["H","H","H","H"],
                    "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                    "_VALID_TO": ["2016-06-19T12:27:23.197Z",null,null,null],
                    "_SOURCE": [1,2,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305774","U000920","U000921","U000920"]
            };

			//arrange
			oMockstarPlc.insertTableData("material_price", oMaterialPriceTestDataPlc);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(2);

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{material_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["170000E0B2BDB9671600A4000936462B", "170000E0B2BDB9671600A4000936462B", "190000E0B2BDB9671600A4000936462B", "1A0000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-06-19T12:27:23.197Z","2016-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z","2015-06-19T12:27:23.197Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305774","I305774","U000921","U000920"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });
	}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}