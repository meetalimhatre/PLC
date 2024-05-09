var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('db.administration:p_update_activity_prices_first_version_audit_columns',function() {
		
		var oMockstarPlc = null;
		
		beforeOnce(function() {

			oMockstarPlc = new MockstarFacade(
					{
						testmodel: "sap.plc.db.administration.procedures/p_update_activity_prices_first_version_audit_columns", // procedure or view under test
						substituteTables:                                           // substitute all used tables in the procedure or view
						{
							activity_price: {
								name: "sap.plc.db::basis.t_activity_price"
							},
							activity_price__first_version: {
								name: "sap.plc.db::basis.t_activity_price__first_version"
							}
						}
					});
		});

		beforeEach(function() {
			oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
			oMockstarPlc.initializeData();
		});
		
		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for activity prices that have only one version', function() {

            var oActivityPriceTestDataPlc = {
                    "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B","2G0000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["301","301","301","301"],
                    "CONTROLLING_AREA_ID": ['#CA1','1000','1000','1000'],
                    "COST_CENTER_ID": ['CC2','CC2',"CC4","CC4"],
                    "ACTIVITY_TYPE_ID": ["ACTIVITY4444","*","*","*"],
                    "PROJECT_ID": ["*","*","*","*"],
                    "VALID_FROM": ["2015-01-01","2010-01-01","2010-01-01","2010-01-01"],
                    "CUSTOMER_ID": ['*', '*', '*', '*'],
                    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_FIXED_PORTION": ["135.98","135.98","150","150"],
                    "PRICE_VARIABLE_PORTION": ["123.4500000", "123.4500000", "200", "200"],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
                    "IS_PRICE_SPLIT_ACTIVE": [0,0,0,0],
                    "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                    "_SOURCE": [1,1,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305778","U0001","U0001","U0001"]
            };

			//arrange
			oMockstarPlc.insertTableData("activity_price", oActivityPriceTestDataPlc);
			
			//act 
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure();

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{activity_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305778","U0001","U0001"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });

		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for activity prices that have more than one version', function() {

            var oActivityPriceTestDataPlc = {
                    "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2B0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["301","301","301","301"],
                    "CONTROLLING_AREA_ID": ['#CA1','1000','1000','1000'],
                    "COST_CENTER_ID": ['CC2','CC2',"CC4","CC4"],
                    "ACTIVITY_TYPE_ID": ["ACTIVITY4444","*","*","*"],
                    "PROJECT_ID": ["*","*","*","*"],
                    "VALID_FROM": ["2015-01-01","2010-01-01","2010-01-01","2010-01-01"],
                    "CUSTOMER_ID": ['*', '*', '*', '*'],
                    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_FIXED_PORTION": ["135.98","135.98","150","150"],
                    "PRICE_VARIABLE_PORTION": ["123.4500000", "123.4500000", "200", "200"],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
                    "IS_PRICE_SPLIT_ACTIVE": [0,0,0,0],
                    "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2016-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2016-01-01T00:00:00.000Z"],
                    "_VALID_TO": ["2016-01-01T15:39:09.691Z",null,"2016-01-01T00:00:00.000Z",null],
                    "_SOURCE": [1,1,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305778","U0001","U0001","U0001"]
            };

			//arrange
			oMockstarPlc.insertTableData("activity_price", oActivityPriceTestDataPlc);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(2);

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{activity_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2B0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2016-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2016-01-01T00:00:00.000Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-01-01T15:39:09.691Z","2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305778","I305778","U0001","U0001"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });

		it('should update _VALID_FROM_FIRST_VERSION and _CREATED_BY_FIRST_VERSION for activity prices that have one or more versions', function() {

            var oActivityPriceTestDataPlc = {
                    "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
                    "PRICE_SOURCE_ID": ["301","301","301","301"],
                    "CONTROLLING_AREA_ID": ['#CA1','1000','1000','1000'],
                    "COST_CENTER_ID": ['CC2','CC2',"CC4","CC4"],
                    "ACTIVITY_TYPE_ID": ["ACTIVITY4444","*","*","*"],
                    "PROJECT_ID": ["*","*","*","*"],
                    "VALID_FROM": ["2015-01-01","2010-01-01","2010-01-01","2010-01-01"],
                    "CUSTOMER_ID": ['*', '*', '*', '*'],
                    "VALID_FROM_QUANTITY": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_FIXED_PORTION": ["135.98","135.98","150","150"],
                    "PRICE_VARIABLE_PORTION": ["123.4500000", "123.4500000", "200", "200"],
                    "TRANSACTION_CURRENCY_ID": ["EUR","EUR","EUR","EUR"],
                    "PRICE_UNIT": ["1.0000000", "1.0000000", "1.0000000", "1.0000000"],
                    "PRICE_UNIT_UOM_ID": ["PC","PC","PC","PC"],
                    "IS_PRICE_SPLIT_ACTIVE": [0,0,0,0],
                    "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2016-01-01T00:00:00.000Z"],
                    "_VALID_TO": [null,null,"2016-01-01T00:00:00.000Z",null],
                    "_SOURCE": [1,1,1,1],
                    "_VALID_FROM_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY_FIRST_VERSION": [null,null,null,null],
                    "_CREATED_BY": ["I305778","U0001","U0002","U0001"]
            };

			//arrange
			oMockstarPlc.insertTableData("activity_price", oActivityPriceTestDataPlc);

			//act
			var procedure = oMockstarPlc.loadProcedure();
			var result = procedure(2);

            // assert
            var aAuditFields = oMockstarPlc.execQuery(`SELECT PRICE_ID,_VALID_FROM,_VALID_FROM_FIRST_VERSION,_CREATED_BY_FIRST_VERSION FROM {{activity_price}};`);
            expect(aAuditFields).toBeDefined();
            expect(mockstarHelpers.convertResultToArray(aAuditFields)).toMatchData({
                "PRICE_ID": ["2B0000E0B2BDB9671600A4000936462B","2E0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B","2F0000E0B2BDB9671600A4000936462B"],
                "_VALID_FROM": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2016-01-01T00:00:00.000Z"],
                "_VALID_FROM_FIRST_VERSION": ["2015-01-01T15:39:09.691Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z","2015-01-01T00:00:00.000Z"],
                "_CREATED_BY_FIRST_VERSION": ["I305778","U0001","U0002","U0002"]
            }, ["PRICE_ID","_VALID_FROM","_VALID_FROM_FIRST_VERSION", "_CREATED_BY_FIRST_VERSION"]);
        });
	}).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}