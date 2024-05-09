const hQueryLib = require("../../../../lib/xs/xslib/hQuery");
const csvParser = require("../../../utils/csvParser");
const _ = require("lodash");
const helpers = require("../../../../lib/xs/util/helpers");
const analyticsTestService = require("./analyticsTestService");
const InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;

const operator = Object.freeze({
	IN : "IN",
	BETWEEN : "BETWEEN"
});


/**
 * Contains simplified tests for analytic views.
 * In the simplified tests, the view results are compared with the snapshots of earlier correct view results.
 * 	The following test data are used:
 * 	- calculation version 1: standard example from db.content
 *  - calculation version 3: test version with exotic items from db.analytics.views.testdata. It contains "exotic" 
 *    cases, like items w/o descriptions or accounts etc. that are not available in the standard example.
 *    
 * 	The reference csv data is created using analyticViewData.xsjs from the standard example data (calculation version 1). 
 * 		Please check the view results before you use them as a reference. 
 * 		Example calls for creating reference data: 
 * 		- for standard views:
 * 			- http://d04....:8000/testtools/analyticViewData.xsjs?view=V_EXT_ACTIVITIES&p_var_language=EN&v_calculation_version_id=1&calculate=true
 * 			- http://d04....:8000/testtools/analyticViewData.xsjs?view=V_EXT_PROJECT_COSTING_SHEET&p_var_language=EN&v_project_id=%23P1&calculate=true (for project #P1)
 * 		- for custom field views: 
 *			- http://d04....:8000/testtools/analyticViewData.xsjs?view=V_EXT_LINE_ITEMS_CUST&p_var_language=EN&v_calculation_version_id=1&calculate=true
 *			- http://d04....:8000/testtools/analyticViewData.xsjs?view=V_EXT_PROJECT_COMPONENT_SPLIT_CUST&p_var_language=EN&v_project_id=%23P1&p_VAR_ONLY_CURRENT=0&calculate=true
 * 			(attention: to get the correct view results, the custom fields for the test data below should be created before on the target HANA (e.g. by
 * 			editing in client or by jasmine.dbConnection.commit(); in beforeEach() method). 
 * 			 But this is necessary only if the generation of the custom fields has been changed.)
 * 
 * 		The data can be shown also in test log using e.g. jasmine.log(getTestData(result)); in compareViewResultsWithSnapshot();
 *
 * MK: internal URLs/information are not allowed
 */
 
/*
Tests are disabled  until a better approach is implemented. See https://jira.itc.sap.com/browse/PLC-4137
*/

xdescribe('analytics_views-integrationtests', function() {
	var originalGetUsername = $.session.getUsername;

	//set test user name to equal to XS_APPLICATIONUSER session variable
	let sessionVariable = jasmine.dbConnection.executeQuery(`SELECT SESSION_CONTEXT('XS_APPLICATIONUSER') as USER_ID from DUMMY`);
	var sUserId = sessionVariable[0].USER_ID;

	var oMockstar = null;
	
	const iDefaultVersionId = 1;
	const sDefaultProjectId = '#P1';
	const aDefaultComparingFields = ['ITEM_ID'];

	const aViews = {
			component_split : "V_EXT_COMPONENT_SPLIT",
			costing_sheet : "V_EXT_COSTING_SHEET",
			line_items : "V_EXT_LINE_ITEMS",
			material_list : "V_EXT_MATERIAL_LIST",
			activities: "V_EXT_ACTIVITIES",
			project_component_split: "V_EXT_PROJECT_COMPONENT_SPLIT",
			project_costing_sheet: "V_EXT_PROJECT_COSTING_SHEET"
	};

	beforeOnce(function() {	
		$.session.getUsername = () => sUserId;
		oMockstar = analyticsTestService.getMockstar();
	});
	
	afterOnce(function(){				
		oMockstar.cleanup();
		$.session.getUsername = originalGetUsername;
	});

	beforeEach(function() {
		
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.initializeData();

		if (jasmine.plcTestRunParameters.generatedFields === true) {
			oMockstar.insertTableData("item_ext", analyticsTestService.oItemExtData);
		}
		
		// Calculate values for the test calculation version
		analyticsTestService.initDataForCalculationVersion([iDefaultVersionId, 2], oMockstar);
		
		// jasmine.dbConnection.commit(); // Only when calculation results with custom fields have to be saved, e.g. for test data generation
	});

	describe("V_EXT_COMPONENT_SPLIT", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters  = { VAR_LANGUAGE  : 'EN' };
	    const oViewVariables   = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
	    const aComparingFields =  ['ITEM_ID', 'ACCOUNT_ID', 'COST_COMPONENT_ID'];

		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.component_split, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("should return results equal with snapshot for CUSTOM field view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.component_split, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.component_split, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.component_split, oViewVariables, oViewParameters, aComparingFields);
			});

			it("should return results equal with snapshot for standard view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.component_split, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.component_split, oViewVariables, oViewParameters);
			});
		}
	});

	describe("V_EXT_COSTING_SHEET", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters  = { VAR_LANGUAGE  : 'EN' };
	    let oViewVariables   = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
	    const aComparingFields = ['ITEM_ID', 'ACCOUNT_ID', 'COSTING_SHEET_ROW_ID', 'COSTING_SHEET_OVERHEAD_ROW_ID'];
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
		
			it("should return results equal with snapshot for CUSTOM field view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.costing_sheet, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("should return results equal with snapshot for CUSTOM field view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.costing_sheet, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.costing_sheet, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.costing_sheet, oViewVariables, oViewParameters, aComparingFields);
			
			});
			
			it("should return results equal with snapshot for standard view with test version 3", function() {
				oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [3] } };				
				analyticsTestService.initDataForCalculationVersion(oViewVariables.CALCULATION_VERSION_ID.VALUES[0], oMockstar, true);
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.costing_sheet, oViewVariables, oViewParameters, aComparingFields);
			});			
			it("should return results equal with snapshot for standard view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.costing_sheet, oViewVariables, oViewParameters, aComparingFields);
			});
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.costing_sheet, oViewVariables, oViewParameters);
			});
		}
	});

	describe("V_EXT_LINE_ITEMS", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters  = { VAR_LANGUAGE  : 'EN' };
	    const oViewVariables   = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
	    const aComparingFields = ['ITEM_ID', 'ACCOUNT_ID', 'COSTING_SHEET_ROW_ID', 'COSTING_SHEET_OVERHEAD_ROW_ID'];
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("should return results equal with snapshot for CUSTOM field view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields, true);
			});
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.line_items, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("should return results equal with snapshot for standard view with test version 3", function() {
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [3] } };
				analyticsTestService.initDataForCalculationVersion(oViewVariables.CALCULATION_VERSION_ID.VALUES[0], oMockstar, true);
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields, oViewVariables.CALCULATION_VERSION_ID.VALUES[0]);
			});
			it("should return results equal with snapshot for standard view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields);
			});
			it("should return results equal with snapshot for standard view with test version 99 (Generated from Variant)", function() {
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [99] } };
				analyticsTestService.initDataForCalculationVersion(oViewVariables.CALCULATION_VERSION_ID.VALUES, oMockstar, true);
				
				compareViewResultsWithSnapshot(aViews.line_items, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.line_items, oViewVariables, oViewParameters);
			});						
		}
	});	

	describe("V_EXT_MATERIAL_LIST", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters = { VAR_LANGUAGE  : 'EN' };
	    const oViewVariables	= { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.material_list, oViewVariables, oViewParameters, aDefaultComparingFields, true);
			});
			it("should return results equal with snapshot for CUSTOM field view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.material_list, oViewVariables, oViewParameters, aDefaultComparingFields, true);
			});
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.material_list, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.material_list, oViewVariables, oViewParameters, aDefaultComparingFields);
			});
			it("should return results equal with snapshot for standard view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.material_list, oViewVariables, oViewParameters, aDefaultComparingFields);
			});
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.material_list, oViewVariables, oViewParameters);
			});			
		}
	});	


	describe("V_EXT_ACTIVITIES", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters = { VAR_LANGUAGE  : 'EN' };
	    const oViewVariables  = { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				//act & assert
				compareViewResultsWithSnapshot(aViews.activities, oViewVariables, oViewParameters, aDefaultComparingFields, true);
				
			});
			it("should return results equal with snapshot for CUSTOM field view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.activities, oViewVariables, oViewParameters, aDefaultComparingFields, true);
			});
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.activities, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				//act & assert 
				compareViewResultsWithSnapshot(aViews.activities, oViewVariables, oViewParameters, aDefaultComparingFields);
			});
			it("should return results equal with snapshot for standard view for selected range (1 - 3)", function() {
				//act & assert
				let oViewVariables = { CALCULATION_VERSION_ID : { OPERATOR: operator.BETWEEN, VALUES: [iDefaultVersionId, 3] } };
				compareViewResultsWithSnapshot(aViews.activities, oViewVariables, oViewParameters, aDefaultComparingFields);
			});
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
                checkViewsConsideringPrivileges(aViews.activities, oViewVariables, oViewParameters);
			});			
		}
	});

	// TODO: Extend test data to enable multi-project comparison including scenarios
	//       with current and non-current calculation versions per calculation as soon
	//		 as extended test data is available
	describe("V_EXT_PROJECT_COMPONENT_SPLIT", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters  = { VAR_LANGUAGE : 'EN', VAR_ONLY_CURRENT: 0 };		
	    const aComparingFields = [ 'PROJECT_ID', 'CALCULATION_ID', 'CALCULATION_VERSION_ID', 'ACCOUNT_ID', 'COST_COMPONENT_ID'];
		
		beforeOnce(function() {
		});
		
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_component_split, oViewVariables, oViewParameters, aComparingFields, true);
			});
			
			it("should return results equal with snapshot for CUSTOM field view for selected Range (#P1 - #P3)", function() {				
				let oViewVariables = { PROJECT_ID : { OPERATOR: operator.BETWEEN, VALUES: [sDefaultProjectId, '#P3'] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_component_split, oViewVariables, oViewParameters, aComparingFields, true);
			});
			
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
                checkViewsConsideringPrivileges(aViews.project_component_split, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_component_split, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("should return results equal with snapshot for standard view for selected Range (#P1 - #P3)", function() {				
				let oViewVariables = { PROJECT_ID : { OPERATOR: operator.BETWEEN, VALUES: [sDefaultProjectId, '#P3'] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_component_split, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("should return results equal with snapshot for standard view and project with lifecycle versions (#P4)", function() {
				// It is sufficient to check the lifecycle properties of the project only once here, 
				// since they are determined in v_bas_dime_calcversion which is same in all views.
				// The cost values for the versions of this project are not calculated and remain 0, since they are not relevant for this test.
				
				
				let sProjectId = '#P4';
				// Get list of versions of the project
				let result = oMockstar.execQuery(
						`	select versions.calculation_version_id as calculation_version_id
								from {{calculation_version}} as versions
								inner join {{calculation}} as calculations
									on calculations.calculation_id = versions.calculation_id and calculations.project_id = '${sProjectId}';
						`);
			
				let aVersionIds = result.columns.CALCULATION_VERSION_ID.rows;
				
				// calculate all versions of the project to have reasonable data
				analyticsTestService.initDataForCalculationVersion(aVersionIds, oMockstar);
				
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sProjectId] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_component_split, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
                checkViewsConsideringPrivileges(aViews.activities, oViewVariables, oViewParameters);
			});	
		}
	});

	// TODO: Extend test data to enable multi-project comparison including scenarios
	//       with current and non-current calculation versions per calculation as soon
	//		 as extended test data is available
	describe("V_EXT_PROJECT_COSTING_SHEET", function() {
		
		// Arrange input parameter and variable for view
	    const oViewParameters  = { VAR_LANGUAGE : 'EN', VAR_ONLY_CURRENT: 0 };
	    const aComparingFields = [ 'PROJECT_ID', 'CALCULATION_ID', 'CALCULATION_VERSION_ID', 'PROJECT_COSTING_SHEET_ID', 'COSTING_SHEET_ROW_ID'];
		
		beforeOnce(function() {
		});
		
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should return results equal with snapshot for CUSTOM field view", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_costing_sheet, oViewVariables, oViewParameters, aComparingFields, true);
			});
			
			it("should return results equal with snapshot for CUSTOM field view for selected Range (#P1 - #P3)", function() {				
				let oViewVariables = { PROJECT_ID : { OPERATOR: operator.BETWEEN, VALUES: [sDefaultProjectId, '#P3'] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_costing_sheet, oViewVariables, oViewParameters, aComparingFields, true);
			});
			
			it("authorization check for CUSTOM FIELD view: should return results only for versions of project that user is authorized for", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
                checkViewsConsideringPrivileges(aViews.project_costing_sheet, oViewVariables, oViewParameters, true);
			});
		} else {
			it("should return results equal with snapshot for standard view", function() {				
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_costing_sheet, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("should return results equal with snapshot for standard view for selected Range (#P1 - #P3)", function() {				
				let oViewVariables = { PROJECT_ID : { OPERATOR: operator.BETWEEN, VALUES: [sDefaultProjectId, '#P3'] } };
				
				//act & assert
				compareViewResultsWithSnapshot(aViews.project_costing_sheet, oViewVariables, oViewParameters, aComparingFields);
			});
			
			it("authorization check: should return results only for versions of project that user is authorized for", function() {
				let oViewVariables   = { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
                checkViewsConsideringPrivileges(aViews.activities, oViewVariables, oViewParameters);
			});	
		}
	});
	
	/**
	 * Tests authorization checks for help views that are used in prompt dialogs for selecting input variables/parameters.
	 * 	- These base views have to be checked separately, since they are not covered by tests for V_EXT_ views. The prompt dialog should not offer the versions/projects that user is not eligible for.
	 */
	describe("value help views", function() {
		if (jasmine.plcTestRunParameters.generatedFields !== true) {
			// Arrange input parameter and variable for view
			var oViewParameters = { VAR_LANGUAGE  : 'EN' };
			var oViewVariables	= { CALCULATION_VERSION_ID : { OPERATOR: operator.IN, VALUES: [iDefaultVersionId] } };
		
			it("authorization check for v_bas_help_language: should return results only for versions of project that user is authorized for", function() {
				checkViewsConsideringPrivileges('v_bas_help_language', oViewVariables, oViewParameters);
			});
		
			it("authorization check for v_bas_dime_project: should return results only for versions of project that user is authorized for", function() {
				let oViewVariables	= { PROJECT_ID : { OPERATOR: operator.IN, VALUES: [sDefaultProjectId] } };
				checkViewsConsideringPrivileges('v_bas_dime_project', oViewVariables, oViewParameters);
			});
		}
	});	
	
	/**
	 * Manipulates the privileges for projects and checks if the view returns the data.
	 */
	function checkViewsConsideringPrivileges(sViewName, oVariables, oParameters, bCustomFields) {
		// Remove privilege for requested project
		enterPrivilege(sDefaultProjectId, sUserId, null);
		expect(isViewResultEmpty(sViewName, oVariables, oParameters, bCustomFields)).toBeTruthy();
				
		// Check that the results appear after setting privileges for the project
		enterPrivilege(sDefaultProjectId, sUserId, InstancePrivileges.ADMINISTRATE);
		expect(isViewResultEmpty(sViewName, oVariables, oParameters, bCustomFields)).toBeFalsy();
    }

	/**
	 * Compares result from view with the reference snapshot data with correct view results.
	 */
	function compareViewResultsWithSnapshot(sViewName, oVariables, oParameters, aComparingFields, bCustomFields) {
		bCustomFields = bCustomFields || false;
		let csvPackage = 'db.analytics.views.testdata';
		let viewPackage = 'sap.plc.analytics.views';
    	
    	if (bCustomFields === true) {
    		// Use other folders for custom views
    		csvPackage = csvPackage + 'CF';
    		viewPackage = viewPackage + 'CF';
    		sViewName = sViewName + '_CUST';
    	} 

    	const referenceData = loadDataFromCsv(csvPackage, getCsvFileName(sViewName, oVariables, oParameters));

		// We use here hQuery instead of oMockstar.execQuery, since they deliver different results for some 0/null values
    	const hQuery = new hQueryLib.HQuery(jasmine.dbConnection);
		const sStmt = `SELECT * FROM "${viewPackage}::${sViewName}" 
				        ${convertParametersForDbStatement(oParameters)} 
						${convertVariablesForDbStatement(oVariables)}
				        ORDER BY ${aComparingFields.join(",")}
				;`;
		const oStatement = hQuery.statement(sStmt);
		const result = oStatement.execute();
		
	    convertDatesNumbersToStrings(result);
        removeDecimalTrailingZeros(result);
	    jasmine.log(getTestData(result));  // Uncomment this to see the view results

        expect(result).toMatchData(referenceData, aComparingFields);
    }
	
	/**
	 * Get result from view and check that it is empty.
	 */
	function isViewResultEmpty(sViewName, oVariables, oParameters, bCustomFields) {
		bCustomFields = bCustomFields || false;
    	let viewPackage = 'sap.plc.analytics.views';
    	
    	let sBaseFolder = '';
    	if ( _.includes(_.values(aViews), sViewName) === false){
    		// If view name is not in list of external views, then this is a base view and the folder should be changed 
    		sBaseFolder = sBaseFolder + '.base';
    	}
    	
    	if (bCustomFields === true) {
    		// If this is a custom field view, then the name and folder should be adjusted
    		viewPackage = viewPackage + 'CF';
    		sViewName = sViewName + '_CUST';
    	}
   	
    	const sStmt = `SELECT COUNT(*) as count FROM "${viewPackage}${sBaseFolder}::${sViewName}" 
				        ${convertParametersForDbStatement(oParameters)} 
				        ${convertVariablesForDbStatement(oVariables)}
				;`;
        let result = oMockstar.execQuery(sStmt);
        return parseInt(result.columns.COUNT.rows[0], 10)  == 0;
    }
	
	// TODO: move it to a helper common with project.xsjslib
	function enterPrivilege(sProjectId, sUserId, sPrivilege){
		if(helpers.isNullOrUndefined(sPrivilege) === true) {
			oMockstar.execSingle(`delete from {{auth_project}} where project_id='${sProjectId}' and user_id='${sUserId}' `);
		} else {
	        oMockstar.insertTableData("auth_project",{
	            PROJECT_ID   : [sProjectId],
	            USER_ID      : [sUserId],
	            PRIVILEGE    : [sPrivilege]
	         });
		}
    }

	/**
	 * Helper to produce strings from query results for writing into test log using jasmine.log(getTestData(result));
	 */
	function getTestData(aQueryResult){
	    const sSeparator = ";";
	    var aHeaders = _.keys(aQueryResult[0]);
	    
	    var sResult = aHeaders.join(sSeparator) + "\n";
	    
	    for(var i=0; i<aQueryResult.length; i++){
	    	var aValues = [];
	    	_.each(aHeaders, function(sKey){
				var sValue = aQueryResult[i][sKey];
				if(sValue === null) {
					sValue = '?';
				}
				aValues.push(sValue);    		
	    	});
	    	sResult += aValues.join(sSeparator) + "\n";
	    }
	    return sResult;
	}

	
	function loadDataFromCsv(csvPackage, csvFile) {
	    const csvProperties = {
				separator : ";",
				headers : true,
				decSeparator : ".",
				castToScalar : true,
				nullValue : "?" 
		};

		var aParsedObjects = csvParser.csvToObjects(csvPackage, csvFile, csvProperties);
		
		for(var i = 0; i < aParsedObjects.length; i++) {
			_.each(aParsedObjects[i], function(sValue, sKey) {
				aParsedObjects[i][sKey] = sValue.trim();
				if(aParsedObjects[i][sKey] === '?') {
					aParsedObjects[i][sKey] = null;
				}
			});
		}

		return aParsedObjects;
	}
	
	/**
	 * Converts the properties of type Date to Strings since it is necessary for comparison. Expects the input as array of objects, e.g. [{id1:v1, id2:v2}, ...]
	 */
	function convertDatesNumbersToStrings(aResult) {
		// iterate over array
	    _.each(aResult, function(oResultItem, iIndex) {		
			var aKeysToCheck = _.keys(oResultItem);
			_.each(aKeysToCheck, function(sKey) {
				var oValue = oResultItem[sKey];
				if (oValue instanceof Date) {
					aResult[iIndex][sKey] = convertDateToTestUTCString(oValue);
				}
				if(_.isNumber(oValue)){
					aResult[iIndex][sKey] = oValue.toString()
				}
			});
		});
	}

	function convertDateToTestUTCString(date) {
		const sDateString = date.toUTCString();
		const rPattern = /^(\w*)\,\s(\d*)\s(\w*)\s(\d*)\s(\d\d\:\d\d:\d\d)\s(\w*)$/g;
		return sDateString.replace(rPattern, '$1 $3 $2 $4 $5 $6+0000 (UTC)');
	}

	function removeDecimalTrailingZeros(aResult) {
		// iterate over array
	    _.each(aResult, function(oResultItem, iIndex) {
			var aKeysToCheck = _.keys(oResultItem);
			_.each(aKeysToCheck, function(sKey) {
				var oValue = oResultItem[sKey];
				if(typeof(oValue) === "string" && oValue !== '' && !isNaN(oValue)){
					aResult[iIndex][sKey] = Number(oValue).toString();
				}
			});
		});
	}
	
	/**
	 * Converts view input parameters into string for db statement execution
	 */
	function convertParametersForDbStatement(oParameters) {

		var aPreparedViewParameters = [];
		_.each(oParameters, function(sValue, sKey) {
			aPreparedViewParameters.push('\'PLACEHOLDER\' = (\'$$' + sKey + '$$\', \'' + sValue + '\')');
		});
		var sViewParameters = '';
		if(aPreparedViewParameters.length > 0) {
			sViewParameters = "(" + aPreparedViewParameters.join(', ') + ")";
		}
		
		return sViewParameters;
	}
	
	/**
	 * Converts view input variables into string for db statement execution
	 */
	function convertVariablesForDbStatement(oVariables) {

		var aPreparedViewVariables = [];
		_.each(oVariables, function(oValue, sKey) {
		    let aValues = _.map(oValue.VALUES, function(sValue){ return '\'' + sValue + '\''; });
			switch(oValue.OPERATOR) {
				case operator.IN:
					aPreparedViewVariables.push('(' + sKey + ' IN (' + aValues.join(', ') + ') )');
					break;
				case operator.BETWEEN:
					aPreparedViewVariables.push('(' + sKey + ' BETWEEN (' +aValues[0] + ') AND (' + aValues[1] + ') )');
					break;
			}			
		});
		var sViewVariables = '';
		if(aPreparedViewVariables.length > 0) {
			sViewVariables = ' where ' + aPreparedViewVariables.join(' AND ');
		}
		
		return sViewVariables;
	}
	
	/**
	 * Get name of the csv file with expected test data
	 * 
	 *  Example: <ViewName>_<Language>_<VersionId>, e.g. V_EXT_ACTIVITIES_EN_1
	 */
	function getCsvFileName(sViewName, oVariables, oParameters) {
		var sObjectIds = "";
		var sViewType = "";
		if ( oVariables.hasOwnProperty("CALCULATION_VERSION_ID") ) {
			sViewType = oVariables.CALCULATION_VERSION_ID;
		} else if ( oVariables.hasOwnProperty("PROJECT_ID") ){
			sViewType = oVariables.PROJECT_ID;
		}
		var sOperator = sViewType.OPERATOR;
		if (sOperator === operator.IN) {
			sObjectIds = sViewType.VALUES[0];
		} else if (sOperator === operator.BETWEEN) {
			sObjectIds = sViewType.VALUES[0] + '_to_' + sViewType.VALUES[1];
		}
		
		var csvFile = sViewName + '__' + oParameters.VAR_LANGUAGE + '_' + sObjectIds + '.csv';
		return csvFile;
	}

}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);