var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;
var PersistencyImport = $.import("xs.db", "persistency");
var GlobalSearchImport = $.import("xs.db", "persistency-globalSearch").Tables;
var Persistency = PersistencyImport.Persistency;
var Constants = require("../../../lib/xs/util/constants");
var GlobalSearchTypeValues = Constants.globalSearchTypeValues;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
var helpers = require("../../../lib/xs/util/helpers");

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe("xsjs.db.persistency-globalsearch-integrationtests", function() {

		describe('get', function() {

			var persistency = null;
			var oMockstar = null;
			var sSessionId = "sessionID";
			var sUserId = $.session.getUsername();
			var aResultProperties = ["PROJECT_ID", "PROJECT_NAME", "STATUS_ID", "CALCULATION_ID", "CALCULATION_NAME", "CALCULATION_VERSION_ID", "CALCULATION_VERSION_NAME", "ENTITY_TYPE", "ENTITY_NAME", "ENTITY_ID", "BASE_VERSION_ID", "BASE_VERSION_NAME", "CALCULATION_VERSION_TYPE", "CUSTOMER_NAME", "CUSTOMER_ID", "TOTAL_COST", "TOTAL_COST_UOM_ID", "TOTAL_QUANTITY", "TOTAL_QUANTITY_UOM_ID", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON", "LAST_MODIFIED_BY", "PROJECT_PATH"];

			var oExpectedProject = JSON.parse(JSON.stringify(testData.oProjectTestData));
			_.each(oExpectedProject, function(value, key){ oExpectedProject[key] = value.splice(0, 2);});

			var oExpectedCalculation = JSON.parse(JSON.stringify(testData.oCalculationTestData));
			_.each(oExpectedCalculation, function(value, key){ oExpectedCalculation[key] = value.splice(0, 2);});

			var oExpectedCalculationVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData3));
			_.each(oExpectedCalculationVersion, function(value, key){ oExpectedCalculationVersion[key] = value.splice(0, 2);});

			const sBaseVersionName = testData.oCalculationVersionTestData3.CALCULATION_VERSION_NAME[0];
			function insertVersionwithItems(iVersionType, sVersionName, bLifecycleVersion) {
				let oVersion = new TestDataUtility(testData.oCalculationVersionTestData3).getObject(0);
				oVersion.BASE_VERSION_ID = testData.oCalculationVersionTestData3.CALCULATION_VERSION_ID[0];
				oVersion.CALCULATION_VERSION_ID = 4810;
				oVersion.CALCULATION_VERSION_TYPE = iVersionType;
				oVersion.CALCULATION_VERSION_NAME = sVersionName;
				if(bLifecycleVersion === true){
					oVersion.LIFECYCLE_PERIOD_FROM = 555;
				}
				oMockstar.insertTableData("calculation_version", oVersion);
				let oVersionItems = new TestDataUtility(testData.oItemTestData).getObject(0);
				oVersionItems.CALCULATION_VERSION_ID = oVersion.CALCULATION_VERSION_ID;
				oMockstar.insertTableData("item", oVersionItems);
			};

			beforeOnce(function() {
				oMockstar = new MockstarFacade({ // Initialize Mockstar
					substituteTables : {
						calculation : GlobalSearchImport.calculation,
						calculation_version : GlobalSearchImport.calculation_version,
						calculation_version_temporary : 'sap.plc.db::basis.t_calculation_version_temporary',
						project : GlobalSearchImport.project,
						customer : GlobalSearchImport.customer,
						item : GlobalSearchImport.item,
						entity_relation : 'sap.plc.db::basis.t_entity_relation',
						authorization : {
							name : 'sap.plc.db::auth.t_auth_project',
							data : {
								PROJECT_ID   : [oExpectedProject.PROJECT_ID[0], oExpectedProject.PROJECT_ID[0]],
								USER_ID      : [sUserId, 'Test_Duplicates'],
								PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ]
							}
						}
					}
				});
			});

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
				oMockstar.insertTableData("project", oExpectedProject);
				oMockstar.insertTableData("calculation", oExpectedCalculation);
				oMockstar.insertTableData("calculation_version", oExpectedCalculationVersion);
				oMockstar.insertTableData("item", testData.oItemTestData);
				oMockstar.insertTableData("customer", testData.oCustomerTestDataPlc);
				oMockstar.insertTableData("entity_relation", testData.oEntityRelationTestData);
				
				persistency = new Persistency(jasmine.dbConnection);
			});


			afterOnce(function() {
				oMockstar.cleanup();
			});

			it('should return no data if search for something that does not exists', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "DoesnNotExists", null, null, testData.sTestUser);

				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(0);
			});

			it('should return one project if search is made for All Objects and by a valid project name', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, testData.oProjectTestData.PROJECT_NAME[0], null, null, testData.sTestUser);

				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
			});

			it('should return one project if search is made for Projects and by a valid project name', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, testData.oProjectTestData.PROJECT_NAME[0], GlobalSearchTypeValues.Project, null, testData.sTestUser);

				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
			});
			
			it('should return one version if search is made for Calculation Versions and by a valid version name', function() {
				// act
				let sBaseVersionName = testData.oCalculationVersionTestData3.CALCULATION_VERSION_NAME[0];
				let aResult = persistency.GlobalSearch.get(null, null, sBaseVersionName, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);

				// assert
				expect(aResult.length).toEqual(1);
				expect(aResult[0].CALCULATION_VERSION_NAME).toEqual(sBaseVersionName);
			});
							
			it('should return one version if search is made for Calculation Versions and by a valid status id', function() {
				// act
				let sStatusId = testData.oCalculationVersionTestData3.STATUS_ID[1];
				let aResult = persistency.GlobalSearch.get(null, null, sStatusId, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);

				// assert
				expect(aResult.length).toEqual(1);
				expect(aResult[0].STATUS_ID).toEqual(sStatusId);
			});

			it('should return two versions if search is made for Calculation Versions and by a valid last modified on date', function() {
				// act
				let sLastModifiedOn = '2019';
				let aResult = persistency.GlobalSearch.get(null, null, sLastModifiedOn, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);

				// assert
				expect(aResult.length).toEqual(2);
				expect(aResult[0].LAST_MODIFIED_ON).toBeDefined();
				expect(aResult[1].LAST_MODIFIED_ON).toBeDefined();
			});

			it('should return one base version and one lifecycle versions if search is made for Calculation Versions and by a valid version name', function() {
				// arrange
				const sLifecycleVersionName = sBaseVersionName + "_" + testData.oLifecyclePeriodValues.LIFECYCLE_PERIOD_FROM[0];
				// insert lifecycle version
				insertVersionwithItems(Constants.CalculationVersionType.Lifecycle, sLifecycleVersionName, true);
				
				// act
				let aResult = persistency.GlobalSearch.get(null, null, sBaseVersionName, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);
				const sGetVersionTypeStmt = `select * from {{calculation_version}}`;
				const oVersion = oMockstar.execQuery(sGetVersionTypeStmt).columns;
				// assert: only base version is returned
				expect(aResult.length).toEqual(2);
				expect(aResult[0].CALCULATION_VERSION_NAME).toEqual(sBaseVersionName);
				expect(aResult[0].BASE_VERSION_ID).toEqual(null);
				expect(aResult[0].CALCULATION_VERSION_TYPE).toEqual(1);
				expect(aResult[0].BASE_VERSION_NAME).toEqual(null);
				expect(aResult[1].CALCULATION_VERSION_NAME).toEqual(sLifecycleVersionName);
				expect(aResult[1].BASE_VERSION_ID).toEqual(testData.oCalculationVersionTestData3.CALCULATION_VERSION_ID[0]);
				expect(aResult[1].CALCULATION_VERSION_TYPE).toEqual(2);
				expect(aResult[1].BASE_VERSION_NAME).toEqual(testData.oCalculationVersionTestData3.CALCULATION_VERSION_NAME[0]);

			});

			it('should return one manual lifecycle versions if search is made for Calculation Versions and by a valid version id', function() {
				// arrange
				const sManualLifecycleVersionName = sBaseVersionName + "_" + testData.oLifecyclePeriodValues.LIFECYCLE_PERIOD_FROM[0];
				// insert lifecycle version
				insertVersionwithItems(Constants.CalculationVersionType.ManualLifecycleVersion, sManualLifecycleVersionName, true);

				// act
				let aResult = persistency.GlobalSearch.get(null, null, '4810', GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);
				
				// assert: only base version is returned
				expect(aResult.length).toEqual(1);
				expect(aResult[0].CALCULATION_VERSION_NAME).toEqual(sManualLifecycleVersionName);
				expect(aResult[0].CALCULATION_VERSION_ID).toEqual(4810);
				expect(aResult[0].BASE_VERSION_ID).toEqual(testData.oCalculationVersionTestData3.CALCULATION_VERSION_ID[0]);
				expect(aResult[0].CALCULATION_VERSION_TYPE).toEqual(16);
				expect(aResult[0].BASE_VERSION_NAME).toEqual(testData.oCalculationVersionTestData3.CALCULATION_VERSION_NAME[0]);
			});

			it('should return no duplicates, only one manual lifecycle', function() {
				// arrange
				const sManualLifecycleVersionName = sBaseVersionName + "_" + testData.oLifecyclePeriodValues.LIFECYCLE_PERIOD_FROM[0];
				// insert lifecycle version
				insertVersionwithItems(Constants.CalculationVersionType.ManualLifecycleVersion, sManualLifecycleVersionName, true);

				// act
				let aResult = persistency.GlobalSearch.get(null, null, '4810', GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);
				
				// assert: only base version is returned
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
				expect(aResult[0].CALCULATION_VERSION_ID).toEqual(4810);
			});

			it('should return no duplicates, only one lifecycle', function() {
				// arrange
				const sLifecycleVersionName = sBaseVersionName + "_" + testData.oLifecyclePeriodValues.LIFECYCLE_PERIOD_FROM[0];
				// insert lifecycle version
				insertVersionwithItems(Constants.CalculationVersionType.Lifecycle, sLifecycleVersionName, true);

				// act
				let aResult = persistency.GlobalSearch.get(null, null, '4810', GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);
				
				// assert: only base version is returned
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
				expect(aResult[0].CALCULATION_VERSION_ID).toEqual(4810);
			});
			
			it('should return a version of type variant base if search is made for Calculation Versions and by a valid version name', function() {
				// arrange
				const sVariantBaseVersionName = sBaseVersionName + "_" + "VariantBase";

				// insert variant base version
				insertVersionwithItems(Constants.CalculationVersionType.VariantBase, sVariantBaseVersionName, false);
				
				// act
				let aResult = persistency.GlobalSearch.get(null, null, sBaseVersionName, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);

				const sGetVersionTypeStmt = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = ${aResult[1].CALCULATION_VERSION_ID}`;
				const oVersion = oMockstar.execQuery(sGetVersionTypeStmt).columns;
			
				// assert: base and variant base version are returned
				expect(aResult.length).toEqual(2);
				expect(aResult[0].CALCULATION_VERSION_NAME).toEqual(sBaseVersionName);
				expect(aResult[1].CALCULATION_VERSION_NAME).toEqual(sVariantBaseVersionName);
				expect(oVersion.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.VariantBase);
			});

			it('should return a version of type generated from a variant if search is made for Calculation Versions and by a valid version name', function() {
				// arrange
				const sGeneratedVersionName = sBaseVersionName + "_" + "GeneratedVersion";
				
				// insert generated version
				insertVersionwithItems(Constants.CalculationVersionType.GeneratedFromVariant, sGeneratedVersionName, false);
				
				// act
				let aResult = persistency.GlobalSearch.get(null, null, sBaseVersionName, GlobalSearchTypeValues.CalculationVersion, null, testData.sTestUser);

				const sGetVersionTypeStmt = `select * from {{calculation_version}} where CALCULATION_VERSION_ID = ${aResult[1].CALCULATION_VERSION_ID}`;
				const oVersion = oMockstar.execQuery(sGetVersionTypeStmt).columns;
			
				// assert: base and variant base version are returned
				expect(aResult.length).toEqual(2);
				expect(aResult[0].CALCULATION_VERSION_NAME).toEqual(sBaseVersionName);
				expect(aResult[1].CALCULATION_VERSION_NAME).toEqual(sGeneratedVersionName);
				expect(oVersion.CALCULATION_VERSION_TYPE.rows[0]).toEqual(Constants.CalculationVersionType.GeneratedFromVariant);
			});
			
			it('should return no entry if search is made for all objects and filter contains special chars', function() {
				// act
				let searchFilter = '';
				_.each(Constants.aRegexSpecialChars, function(oRegexSpecialChar, iIndex){
					searchFilter = searchFilter + oRegexSpecialChar.specialChar;
				});
				var aResult = persistency.GlobalSearch.get(null, null, searchFilter, 'all', null, testData.sTestUser);

				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(0);
			});

			it('should return no entries if search is made for Calculation and by a invalid calculation name', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, 'Invalid Calculation Name', GlobalSearchTypeValues.Calculation, null, testData.sTestUser);

				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(0);
			});

			it('should return no entries if search is made for All Objects and no filter is defined', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, '', 'all', null, testData.sTestUser);
				
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(0);
			});

			it('should return all entries that have name or customer name containing a string or another string if search is made for All Objects and filter project name and customer name', function() {
				//arrange
				oMockstar.insertTableData("authorization",{
					PROJECT_ID   : [oExpectedProject.PROJECT_ID[1]],//PR2
					USER_ID      : [sUserId],
					PRIVILEGE    : [InstancePrivileges.READ]
				});
				// act
				let aResult = persistency.GlobalSearch.get(null, null, testData.oProjectTestData.PROJECT_NAME[0] + " OR " + testData.oCustomerTestDataPlc.CUSTOMER_NAME[0], 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(3);
			});

			it('should return all entries for which the user has read privilege, that have name or customer name containing a string or another string if search is made for All Objects and filter project name and customer name', function() {
				//same data and call as the test before, but the read privilege for project PR2 is missing					
				// act
				let aResult = persistency.GlobalSearch.get(null, null, testData.oProjectTestData.PROJECT_NAME[0] + " OR " + testData.oCustomerTestDataPlc.CUSTOMER_NAME[0], 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(2);
			});
			
			it('should return no duplicates and all entries that have name or customer name containing a string or another string if search is made for All Objects and filter project name and customer name', function() {
				//arrange
				oMockstar.insertTableData("authorization",{
					PROJECT_ID   : [oExpectedProject.PROJECT_ID[1]],//PR2
					USER_ID      : [sUserId],
					PRIVILEGE    : [InstancePrivileges.READ]
				});
				// act
				let aResult = persistency.GlobalSearch.get(null, null, testData.oProjectTestData.PROJECT_NAME[0] + " OR " + testData.oCustomerTestDataPlc.CUSTOMER_NAME[0], 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(3);
				expect(helpers.arrayHasDuplicates(aResult)).toBe(false);
			});
			
			it('should return all entries that have name or customer name containing a string and another - no AND operator between string if search is made for All Objects and filter project name and customer name', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "PR 1", 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
			});

			it('should return all entries that have name or customer name containing a string and another in reversed order', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "1 PR", 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
			});				

			it('should return all entries that have name or customer name containing a string and another - AND operator between string if search is made for All Objects and filter project name and customer name', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "PR AND 1", 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
			});

			it('should return correct output structure of response', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "PR AND 1", 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);
				let oResult = aResult[0];
				expect(_.keys(oResult)).toEqual(aResultProperties);
			});

			it('should return correct PROJECT_PATH', function() {
				// act
				let aResult = persistency.GlobalSearch.get(null, null, "Pump", 'all', null, testData.sTestUser);
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(2);
				let oResult1 = aResult[0];
				let oResult2 = aResult[1];
				expect(oResult1.PROJECT_PATH).toEqual('1');
				expect(oResult2.PROJECT_PATH).toEqual('1');
			});
			
			it('should return calculations that are not temporary (that have at least one saved version)', function() {
				//arrange
				oMockstar.clearTable("calculation_version");
				_.each(oExpectedCalculationVersion, function(value, key){ oExpectedCalculationVersion[key] = value.splice(0, 1);});
				oMockstar.insertTableData("calculation_version", oExpectedCalculationVersion);
				oMockstar.insertTableData("calculation_version_temporary",testData.oCalculationVersionTemporaryTestData);
				
				// act
				var aResult = persistency.GlobalSearch.get(null, null, `Pump`, 'all', null, testData.sTestUser);
				
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);			
			});
			
			it('should return no duplicates calculations if a calculation has multiple calculation versions and the search is made for calculations types', function() {
				//arrange
				oMockstar.clearTable("calculation_version");
				var oCalculationVersion = JSON.parse(JSON.stringify(oExpectedCalculationVersion));
				
				_.each(oCalculationVersion, function(value, key){ oCalculationVersion[key] = value.splice(0, 2);});
				oCalculationVersion["CALCULATION_ID"][1] = oCalculationVersion["CALCULATION_ID"][0];
				oMockstar.insertTableData("calculation_version", oCalculationVersion);

				// act
				var aResult = persistency.GlobalSearch.get(null, null, 'Pump', 'Calculation', null, testData.sTestUser);
				
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);			
			});
			
			it('should return no duplicates calculations if a calculation has multiple calculation versions and the search is made for all types', function() {
				//arrange
				oMockstar.clearTable("calculation_version");
				var oCalculationVersion = JSON.parse(JSON.stringify(oExpectedCalculationVersion));
				
				_.each(oCalculationVersion, function(value, key){ oCalculationVersion[key] = value.splice(0, 2);});
				oCalculationVersion["CALCULATION_ID"][1] = oCalculationVersion["CALCULATION_ID"][0];
				oMockstar.insertTableData("calculation_version", oCalculationVersion);

				// act
				var aResult = persistency.GlobalSearch.get(null, null, 'Pump', 'all', null, testData.sTestUser);
				
				// assert
				expect(aResult).toBeDefined();
				expect(aResult.length).toEqual(1);			
			});
		});

	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}