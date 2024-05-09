const ServiceOutput = require("../../../lib/xs/util/serviceOutput");
const _ = require("lodash");
const globalSearch = new (require("../../../lib/xs/impl/global-search").GlobalSearch)($);
const testData = require("../../testdata/testdata").data;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.global-search-tests', function() {

		var oPersistencyMock = null;
		var oConnectionMock = null;

		var oExpectedProject = JSON.parse(JSON.stringify(testData.oProjectTestData));
        _.each(oExpectedProject, function(value, key){ oExpectedProject[key] = value.splice(0, 2);});
        
        var oExpectedCalculation = JSON.parse(JSON.stringify(testData.oCalculationTestData));
        _.each(oExpectedCalculation, function(value, key){ oExpectedCalculation[key] = value.splice(0, 2);});
        
        var oExpectedCalculationVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
        _.each(oExpectedCalculationVersion, function(value, key){ oExpectedCalculationVersion[key] = value.splice(0, 2);});

		beforeOnce(function() {
			oConnectionMock = jasmine.createSpyObj('oConnectionMock', ['commit']);
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
			oPersistencyMock.getConnection.and.returnValue(oConnectionMock);

		});

		describe("get", function() {
			
			var oTestGlobalSearch = null;
			
			beforeEach(function() {

				initTestData();

				var oPersistencyGlobalSearchMock = jasmine.createSpyObj("oPersistencyGlobalSearchMock", ["get"]);
				oPersistencyMock.GlobalSearch = oPersistencyGlobalSearchMock;

				oPersistencyMock.GlobalSearch.get.and.returnValue(
						oTestGlobalSearch
				);

			});

			function initTestData() {
				oTestGlobalSearch = [				                     {
				                         "PROJECT_ID": "#P2",
				                         "CALCULATION_ID": null,
				                         "CALCULATION_VERSION_ID": null,
				                         "ENTITY_TYPE": "Project",
				                         "ENTITY_NAME": "#SAP Example: Pumpenprojekt",
										 "ENTITY_ID": "#P2",
										 "BASE_VERSION_ID": null,
										 "BASE_VERSION_NAME": null,
										 "CALCULATION_VERSION_TYPE": null,
				                         "CUSTOMER_NAME": "Kunde 1",
				                         "TOTAL_COST": null,
				                         "TOTAL_QUANTITY": null,
				                         "CREATED_ON": "2015-09-01T09:00:00.000Z",
				                         "CREATED_BY": "#CONTROLLER",
				                         "LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
										 "LAST_MODIFIED_BY": "#CONTROLLER",
										 "PROJECT_PATH": 2
				                     },
				                     {
				                         "PROJECT_ID": "#P1",
				                         "CALCULATION_ID": null,
				                         "CALCULATION_VERSION_ID": null,
				                         "ENTITY_TYPE": "Project",
				                         "ENTITY_NAME": "#SAP Example: Pumps Project",
										 "ENTITY_ID": "#P1",
										 "BASE_VERSION_ID": null,
										 "BASE_VERSION_NAME": null,
										 "CALCULATION_VERSION_TYPE": null,
				                         "CUSTOMER_NAME": "Customer 3",
				                         "TOTAL_COST": null,
				                         "TOTAL_QUANTITY": null,
				                         "CREATED_ON": "2015-09-01T09:00:00.000Z",
				                         "CREATED_BY": "#CONTROLLER",
				                         "LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
										 "LAST_MODIFIED_BY": "#CONTROLLER",
										 "PROJECT_PATH": 1
				                     }
				                 ];
			}

			it('should return an array with 2 elements as payload if a valid search was done', function() {
				// arrange
				var oServiceOutput = new ServiceOutput();

				// act
				globalSearch.get(null, {"sortedColumnId" : null, "sortedDirection" : null, "filter" : null, "type" : "Projects", "top" : null}, oServiceOutput, oPersistencyMock);
				var oOutputGlobalSearch = oServiceOutput.payload.body.GLOBAL_SEARCH;

				// assert

				// assert
				expect(oOutputGlobalSearch.length).toBe(2);
			});

		});
		
	}).addTags(["All_Unit_Tests"]);
}