/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var _ = require("lodash");
var testData = require("../../../testdata/testdata").data;
var InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;
const TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;

describe('p_calculations_versions_read', function() {

	var testPackage = $.session.getUsername().toLowerCase();
	var mockstar = null;
	// TestData
	var oTwoDaysAgo = new Date();
	oTwoDaysAgo.setDate(oTwoDaysAgo.getDate() -2);

	var oUOM = {
			"UOM_ID": "PC",
			"DIMENSION_ID": "D2",
			"NUMERATOR": 1,
			"DENOMINATOR": 1,
			"EXPONENT_BASE10": 0,
			"SI_CONSTANT": 0,
			"_VALID_FROM": "2015-06-02T14:45:50.096Z",
			"_SOURCE": 1,
			"_CREATED_BY": "U000"
	};
	var sExpectedDate = new Date().toJSON();
	var sTestUser = $.session.getUsername().toUpperCase();
	var oCalculationTestData = {
			"CALCULATION_ID" : [ 1978, 2078, 5078 ],
			"PROJECT_ID" : [ "PR1", "PR1", "PR3" ],
			"CALCULATION_NAME" : [ "Kalkulation Pumpe P-100", "Calculation Pump P-100", "Kalkulation Schluesselfinder" ],
			"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ],
			"CREATED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
			"CREATED_BY" : [ sTestUser, sTestUser, sTestUser ],
			"LAST_MODIFIED_ON" : [ sExpectedDate, sExpectedDate, sExpectedDate ],
			"LAST_MODIFIED_BY" : [ sTestUser, sTestUser, sTestUser ]
	};
	const bReturnLifecycle = true;
	const bGetOnlyLifecycles = 0;

	beforeOnce(function() {
		mockstar = new MockstarFacade({ // Initialize Mockstar
			testmodel: "sap.plc.db.calculationmanager.procedures/p_calculations_versions_read",
			substituteTables: // substitute all used tables in the procedure or view
			{
				gtt_calculation_ids: "sap.plc.db::temp.gtt_calculation_ids",
				calculation_version: "sap.plc.db::basis.t_calculation_version",
				item: "sap.plc.db::basis.t_item",
				item_ext : "sap.plc.db::basis.t_item_ext",
				project: "sap.plc.db::basis.t_project",
				authorization: "sap.plc.db::auth.t_auth_project",
				calculation: "sap.plc.db::basis.t_calculation",
				recent_calculation_versions: "sap.plc.db::basis.t_recent_calculation_versions",
				gtt_calculation_version_ids: "sap.plc.db::temp.gtt_calculation_version_ids",
				document: {
					name: "sap.plc.db::basis.t_document"
				},
				document_type: {
					name: "sap.plc.db::basis.t_document_type"
				},
				document_status: {
					name: "sap.plc.db::basis.t_document_status"
				},							
				component_split: {
					name: "sap.plc.db::basis.t_component_split"
				},
				component_split__text: {
					name: "sap.plc.db::basis.t_component_split__text"
				},
				component_split_account_group: {
					name: "sap.plc.db::basis.t_component_split_account_group"
				},
				costing_sheet: {
					name: "sap.plc.db::basis.t_costing_sheet"
				},
				costing_sheet__text: {
					name: "sap.plc.db::basis.t_costing_sheet__text"
				},
				account_group__text: {
					name: "sap.plc.db::basis.t_account_group__text"
				},
				costing_sheet_row: {
					name: "sap.plc.db::basis.t_costing_sheet_row"
				},
				costing_sheet_row__text: {
					name: "sap.plc.db::basis.t_costing_sheet_row__text"
				},
				costing_sheet_base: {
					name: "sap.plc.db::basis.t_costing_sheet_base"
				},
				costing_sheet_base_row: {
					name: "sap.plc.db::basis.t_costing_sheet_base_row"
				},
				costing_sheet_overhead: {
					name: "sap.plc.db::basis.t_costing_sheet_overhead"
				},
				costing_sheet_overhead_row: {
					name: "sap.plc.db::basis.t_costing_sheet_overhead_row"
				},
				costing_sheet_row_dependencies: {
					name: "sap.plc.db::basis.t_costing_sheet_row_dependencies"
				},
				account_group: {
					name: "sap.plc.db::basis.t_account_group"
				},
				work_center: {
					name: "sap.plc.db::basis.t_work_center"
				},
				process: {
					name: "sap.plc.db::basis.t_process"
				},
				overhead_group: {
					name: "sap.plc.db::basis.t_overhead_group"
				},		
				overhead_group__text: {
					name: "sap.plc.db::basis.t_overhead_group__text"
				},		
				plant: {
					name: "sap.plc.db::basis.t_plant"
				},
				cost_center: {
					name: "sap.plc.db::basis.t_cost_center"
				},
				profit_center: {
					name: "sap.plc.db::basis.t_profit_center"
				},
				activity_type: {
					name: "sap.plc.db::basis.t_activity_type"
				},
				account: {
					name: "sap.plc.db::basis.t_account"
				},
				company_code: {
					name: "sap.plc.db::basis.t_company_code"
				},
				controlling_area: {
					name: "sap.plc.db::basis.t_controlling_area"
				},
				business_area: {
					name: "sap.plc.db::basis.t_business_area"
				},
				design_office: {
					name: "sap.plc.db::basis.t_design_office"
				},
				design_office__text: {
					name: "sap.plc.db::basis.t_design_office__text"
				},				        
				material: {
					name: "sap.plc.db::basis.t_material"
				},
				material_group: {
					name: "sap.plc.db::basis.t_material_group"
				},
				material_plant: {
					name: "sap.plc.db::basis.t_material_plant"
				},
				material_type: {
					name: "sap.plc.db::basis.t_material_type"
				},
				valuation_class: {
					name:"sap.plc.db::basis.t_valuation_class"
				},
				valuation_class__text: {
					name:"sap.plc.db::basis.t_valuation_class__text"
				},				        
				vendor: {
					name: "sap.plc.db::basis.t_vendor"
				},
				customer: {
					name: "sap.plc.db::basis.t_customer"
				},
				currency: {
					name: "sap.plc.db::basis.t_currency",
					data: testData.oCurrencySecond
				},
				unit_of_measure: {
					name: "sap.plc.db::basis.t_uom"
				}
			}
		});
	});

	afterOnce(function() {
		mockstar.cleanup(testPackage+"sap.plc.db.calculationmanager.procedures");
	});

	beforeEach(function() {
		mockstar.clearAllTables(); // clear all specified substitute tables and views
		mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
		mockstar.insertTableData("item", testData.oItemTestData);
		mockstar.insertTableData("project", testData.oProjectTestData);
		mockstar.insertTableData("calculation", oCalculationTestData);
		mockstar.insertTableData("recent_calculation_versions", testData.oRecentCalculationTestData);
		mockstar.insertTableData("unit_of_measure", oUOM);
		mockstar.insertTableData("authorization", {
			PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[0]],
			USER_ID      : [sTestUser],
			PRIVILEGE    : [InstancePrivileges.READ]
		});
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			mockstar.insertTableData("item_ext", testData.oItemExtData);
		}
		mockstar.initializeData();
	});

	it('should get a calculation version for a calculation ID', function() {
		// assemble
		var oCalcIds = { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);

		var iId =  0;
		var iLoadMasterdata = 0;            
		var iCurrent = 0;
		// copy the test data and remove the unexpected values for calculation version
		var oExpectedCalcVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
		_.each(oExpectedCalcVersion, function(value, key){ oExpectedCalcVersion[key] = value.splice(0, value.length-2);});
		// copy the test data and remove the unexpected values for items
		var oItemTestDataClone = _.cloneDeep(testData.oItemTestData);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oItemTestDataClone = _.omit(_.extend(oItemTestDataClone,testData.oItemExtData),testData.aCalculatedCustomFields);
		}
		var oExpectedItemData = JSON.parse(JSON.stringify(oItemTestDataClone));
		_.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-4);});

		// act
		var result = mockstar.call(10, 0, 0, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		// assert            
		expect(resultCalcVersion).toMatchData(oExpectedCalcVersion, ["CALCULATION_VERSION_ID"]);
//		expect(resultItems).toMatchData(oExpectedItemData, ["ITEM_ID","CALCULATION_VERSION_ID"]);
		expect(resultCalcVersion.ROOT_ITEM_ID[0]).toBe(resultItems.ITEM_ID[0]);
		// check calculations
		expect(resultCalculations.CALCULATION_ID.length).toBe(0);
		// check projects
		expect(resultProjects.PROJECT_ID.length).toBe(0);
	});
	
	it('should get all calculation versions for which the user has the read project privilege (2/3 projects)', function() {
		// arrange
		mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
		mockstar.insertTableData("item", testData.oItemTestData1);
		mockstar.insertTableData("calculation", testData.oCalculationTestData1);
		mockstar.insertTableData("recent_calculation_versions", {
			"CALCULATION_VERSION_ID" : [ 9191 ],
			"USER_ID" : [ sTestUser],
			"LAST_USED_ON" : [ testData.sExpectedDate ]
		});
		mockstar.insertTableData("authorization",{
			PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[2], testData.oProjectTestData.PROJECT_ID[2], testData.oProjectTestData.PROJECT_ID[2]],//PRR
			USER_ID      : [sTestUser, "TEST1", "TEST2"],
			PRIVILEGE    : [InstancePrivileges.READ, InstancePrivileges.READ, InstancePrivileges.READ]
		});
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 10, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(3);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(3);
		expect(resultCalculations.CALCULATION_ID.length).toBe(3);
		expect(resultProjects.PROJECT_ID.length).toBe(2);
	}); 

	it('should not get a calculation version for a calculation ID if the user does not have read project privilege', function() {
		// arrange
		var oCalcIds = { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);
		mockstar.clearTable("authorization");

		var iId =  0;
		var iLoadMasterdata = 0;            
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 0, 0, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert  
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(0);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(0);
	});

	it('should get one RECENT calculation versions', function() {
		// assemble
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;
		// copy the test data and remove the unexpected values for calculation version
		var oExpectedCalcVersion = JSON.parse(JSON.stringify(testData.oCalculationVersionTestData));
		_.each(oExpectedCalcVersion, function(value, key){ oExpectedCalcVersion[key] = value.splice(0, value.length-2);});
		// copy the test data and remove the unexpected values for items
		var oItemTestDataClone = _.cloneDeep(testData.oItemTestData);
		if(jasmine.plcTestRunParameters.generatedFields === true){
			oItemTestDataClone = _.omit(_.extend(oItemTestDataClone,testData.oItemExtData),testData.aCalculatedCustomFields);
		}
		var oExpectedItemData = JSON.parse(JSON.stringify(oItemTestDataClone));
		_.each(oExpectedItemData, function(value, key){ oExpectedItemData[key] = value.splice(0, value.length-4);});

		// act
		var result = mockstar.call(1, 1, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null ,null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		// check calculation version
		expect(resultCalcVersion).toMatchData(oExpectedCalcVersion, ["CALCULATION_VERSION_ID"]);
//		expect(resultItems).toMatchData(oExpectedItemData, ["ITEM_ID","CALCULATION_VERSION_ID"]);
		expect(resultCalcVersion.ROOT_ITEM_ID[0]).toBe(resultItems.ITEM_ID[0]);
		// check calculations
		expect(resultCalculations.CALCULATION_ID.length).toBeGreaterThan(0);
		// check projects
		expect(resultProjects.PROJECT_ID.length).toBeGreaterThan(0);
	});
	
	it('should get only the RECENT calculation version even if iv_top parameter is more than 1', function() {
		// arrange
		mockstar.clearTable("recent_calculation_versions");
		mockstar.insertTableData("recent_calculation_versions", {
			"CALCULATION_VERSION_ID" : [ testData.iCalculationVersionId ],
			"USER_ID" : [ sTestUser ],
			"LAST_USED_ON" : [ sExpectedDate ]
		});
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 1, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 1);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(1);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(1);
		expect(resultItems.ITEM_ID.length).toBe(1);
		expect(resultCalculations.CALCULATION_ID.length).toBe(1);
		expect(resultProjects.PROJECT_ID.length).toBe(1);
	});

	it('should return 0 for HAS_LIFECYCLE if the calculation has more versions but none of them is a lifecycle calculation', function() {
		// assemble
		var oCalcIds = { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);

		var iId =  0;
		var iLoadMasterdata = 0;            
		var iCurrent = 0;
		mockstar.execSingle('UPDATE {{calculation_version}} SET BASE_VERSION_ID = 2809');

		// act
		var result = mockstar.call(10, 0, 1978, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, false, false, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		expect(resultCalcVersion.HAS_LIFECYCLES[0] === null || resultCalcVersion.HAS_LIFECYCLES[0] === 0).toBe(true);
	});

	it('should get the RECENT calculation versions for which the user has the read project privilege', function() {
		// arrange
		mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData1);
		mockstar.insertTableData("item", testData.oItemTestData1);
		mockstar.insertTableData("calculation", testData.oCalculationTestData1);
		mockstar.insertTableData("recent_calculation_versions", {
			"CALCULATION_VERSION_ID" : [ 9191, 9194 ],
			"USER_ID" : [ sTestUser, sTestUser ],
			"LAST_USED_ON" : [ testData.sExpectedDate, testData.sValidFromDate ]
		});
		mockstar.clearTable("authorization");
		mockstar.insertTableData("authorization",{
			PROJECT_ID   : [testData.oProjectTestData.PROJECT_ID[2]],//PRR
			USER_ID      : [sTestUser],
			PRIVILEGE    : [InstancePrivileges.READ]
		});
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 1, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(2);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(2);
		expect(resultItems.ITEM_ID.length).toBe(2);
		expect(resultCalculations.CALCULATION_ID.length).toBe(2);
		expect(resultProjects.PROJECT_ID.length).toBe(1);
	});

	it('should get ALL RECENT calculation versions', function() {
		// assemble
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;
		var oRecentCelcVersion = JSON.parse(JSON.stringify(testData.oRecentCalculationTestData));
		// keep only top 2 most used coaclualtion versions 
		var aExpectedRecentCalcVersion = oRecentCelcVersion.CALCULATION_VERSION_ID.splice(0,2);

		// act
		// unable to pass null as calculation id because of mockstar - as workaround pass value 0 (will not affect results) 
		var result = mockstar.call(10, 1, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		// check calculation version
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(2);
		expect(aExpectedRecentCalcVersion).toEqual(resultCalcVersion.CALCULATION_VERSION_ID);
		// check item 
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(2);
		//expect(resultItems.ITEM_ID.length).toBe(2);
		expect(resultCalcVersion.ROOT_ITEM_ID[0]).toBe(resultItems.ITEM_ID[0]);
		//expect(resultCalcVersion.ROOT_ITEM_ID[1]).toBe(resultItems.ITEM_ID[1]);
		// check calculations
		expect(resultCalculations.CALCULATION_ID.length).toBeGreaterThan(0);
		// check projects
		expect(resultProjects.PROJECT_ID.length).toBeGreaterThan(0);
	});  

	it('should not get any RECENT calculation versions if the user does not have the read project privilege', function() {
		// arrange
		var iId =  0;
		var iLoadMasterdata = 0;             
		var iCurrent = 0;
		mockstar.clearTable("authorization");

		// act
		var result = mockstar.call(10, 1, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		var resultCalculations = mockstar_helpers.convertResultToArray(result[2]);
		var resultProjects = mockstar_helpers.convertResultToArray(result[3]);
		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(0);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(0);
		expect(resultItems.ITEM_ID.length).toBe(0);
		expect(resultCalculations.CALCULATION_ID.length).toBe(0);
		expect(resultProjects.PROJECT_ID.length).toBe(0);
	});

	it('should return masterdata for versions and items', function() {
		// assemble
		var iId =  0;
		var iLoadMasterdata = 1;             
		var oCalcIds = { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);

		var uom = mockstar_helpers.convertResultToArray(result[4]);
		var currency = mockstar_helpers.convertResultToArray(result[5]);

		expect(uom.UOM_ID.length).toBe(1);
		expect(uom.UOM_ID[0]).toBe(oUOM.UOM_ID);
		expect(currency.CURRENCY_ID.length).toBe(1);
		expect(currency.CURRENCY_ID[0]).toBe(testData.oCurrencySecond.CURRENCY_ID);
	});

	it('should return a single version for given id incl. items and masteradata', function () {
	    // assemble
	    const iId = 2809,
	        iLoadMasterdata = 1,
	        iTop = 1,
	        iRecentlyUsed = 0,
	        iCurrent = 0;

	    // act
		const result = mockstar.call(iTop, iRecentlyUsed, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 1);

	    // assert
	    const resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
	    const resultItems = mockstar_helpers.convertResultToArray(result[1]);
	    const oExpectedVersion = new TestDataUtility(testData.oCalculationVersionTestData).pickValues(oVersion => oVersion.CALCULATION_VERSION_ID === iId);
	    const oExpectedItems = new TestDataUtility(testData.oItemTestData).pickValues(oItem => oItem.PARENT_ITEM_ID === null && oItem.CALCULATION_VERSION_ID === iId);
	    expect(resultCalcVersion).toMatchData(oExpectedVersion, ["CALCULATION_VERSION_ID"]);
	    expect(resultItems).toMatchData(oExpectedItems, ["ITEM_ID", "CALCULATION_VERSION_ID"]);

	    // check masterdata
	    var uom = mockstar_helpers.convertResultToArray(result[4]);
	    var currency = mockstar_helpers.convertResultToArray(result[5]);
	    expect(uom.UOM_ID.length).toBe(1);
	    expect(uom.UOM_ID[0]).toBe(oUOM.UOM_ID);
	    expect(currency.CURRENCY_ID.length).toBe(1);
	    expect(currency.CURRENCY_ID[0]).toBe(testData.oCurrencySecond.CURRENCY_ID);
	});
	
	it('should get TOTAL_COST_PER_UNIT, TOTAL_COST_PER_UNIT_FIXED_PORTION, TOTAL_COST_PER_UNIT_VARIABLE_PORTION', function(){
		//assemble
		var iId =  0;
		var iLoadMasterdata = 1;             
		var oCalcIds = { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);
		var iCurrent = 0;
		
		
		//act
		var result = mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);
		//assert
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);
		
		expect(resultItems.TOTAL_COST_PER_UNIT[0]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT[0]);
		expect(resultItems.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_FIXED_PORTION[0]);
		expect(resultItems.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]).toEqual(testData.oItemTemporaryTestData.TOTAL_COST_PER_UNIT_VARIABLE_PORTION[0]);
		});

    it('should insert the referenced versions ids into temporary table gtt_calculation_version_ids', function() {
		// assert
		//insert items with referenced versions
		mockstar.clearTable("item");
        const iFirstReferenceVersionId = testData.iSecondVersionId;
        const iSecondReferenceVersionId = 5809;

		let oItemWithReferences = new TestDataUtility(testData.oItemTestData).build();
		oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID = [iFirstReferenceVersionId, iSecondReferenceVersionId];

		mockstar.insertTableData("item", oItemWithReferences);
    	mockstar.insertTableData("gtt_calculation_ids",  { "CALCULATION_ID": oCalculationTestData.CALCULATION_ID[0]});

		const iId =  0, iCurrent = 0, iLoadMasterdata = 1;
		const sGetReferencedVersionsIds = "select * from {{gtt_calculation_version_ids}}";
		const aReferencedVersionIdsBefore = mockstar.execQuery(sGetReferencedVersionsIds).columns.CALCULATION_VERSION_ID.rows;
		// act
		mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 1);
		const aReferencedVersionIdsAfter = mockstar.execQuery(sGetReferencedVersionsIds).columns.CALCULATION_VERSION_ID.rows.sort();

		// assert
        expect(aReferencedVersionIdsBefore.length).toBe(0);
        expect(aReferencedVersionIdsAfter.length).toBe(1);
        expect(aReferencedVersionIdsAfter[0]).toBe(iFirstReferenceVersionId);
	});
	
	it('should not insert the referenced versions ids into gtt_calculation_version_ids if no item has a reference', function() {
		// assert
		mockstar.clearTable("item");
		let oItemWithReferences = new TestDataUtility(testData.oItemTestData).build();
		oItemWithReferences.REFERENCED_CALCULATION_VERSION_ID = Array(oItemWithReferences.ITEM_ID.length).fill(null);
		mockstar.insertTableData("item", oItemWithReferences);
		const iId =  0, iCurrent = 0, iLoadMasterdata = 1;
		const sGetReferencedVersionsIds = "select * from {{gtt_calculation_version_ids}}";
		// act
		mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent,bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);
		const aReferencedVersionIdsAfter = mockstar.execQuery(sGetReferencedVersionsIds).columns.CALCULATION_VERSION_ID.rows.sort();
		// assert
        expect(aReferencedVersionIdsAfter.length).toBe(0);
	});

	it('should return ONLY ROOT items and masterdata for versions when return only root is true', function() {
		// assemble
		var iId =  0;
		var iLoadMasterdata = 1;             
		var oCalcIds = { "CALCULATION_ID": [oCalculationTestData.CALCULATION_ID[0], oCalculationTestData.CALCULATION_ID[1]]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, bReturnLifecycle, bGetOnlyLifecycles, null, null, null, null, null, null, null, 1);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);

		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(2);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(2);
		expect(resultItems.ITEM_ID.length).toBe(2);
	});

	it('should return all items and masterdata for versions when return only root is false', function() {
		// assemble
		var iId =  0;
		var iLoadMasterdata = 1;             
		var oCalcIds = { "CALCULATION_ID": [oCalculationTestData.CALCULATION_ID[0], oCalculationTestData.CALCULATION_ID[1]]};
		mockstar.insertTableData("gtt_calculation_ids", oCalcIds);
		var iCurrent = 0;

		// act
		var result = mockstar.call(10, 0, iId, iLoadMasterdata, testData.sTestUser, 'EN', iCurrent, false, bGetOnlyLifecycles, null, null, null, null, null, null, null, 0);

		// assert
		var resultCalcVersion = mockstar_helpers.convertResultToArray(result[0]);
		var resultItems = mockstar_helpers.convertResultToArray(result[1]);

		expect(resultCalcVersion.CALCULATION_VERSION_ID.length).toBe(2);
		expect(resultCalcVersion.ROOT_ITEM_ID.length).toBe(2);
		expect(resultItems.ITEM_ID.length).toBe(4);
	});


}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);