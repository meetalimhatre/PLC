/**
 * Test service with functions to be used in analytics_views-integrationtests and other test-related functions
 */ 
const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const _ = require("lodash");
const InstancePrivileges = require("../../../../lib/xs/authorization/authorization-manager").Privileges;

/**
 * Test data for custom fields
 */
var oItemExtData = {
			"CALCULATION_VERSION_ID" : [ 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
			"ITEM_ID" : [ 3952, 4028, 4040, 4032, 4030, 4017, 4027, 3998, 4016 ],
			
			"CUST_BOOLEAN_INT_MANUAL" : 	[ null, null, null, null, null, null, null, null, null ],
			"CUST_BOOLEAN_INT_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_BOOLEAN_INT_UNIT" : 		[ null, null, null, null, null, null, null, null, null ],
			"CUST_BOOLEAN_INT_IS_MANUAL" : 	[ null, null, null, null, null, null, null, null, null ],
			
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL" : 	 [ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT" : 		 [ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL" :  [ null, null, null, null, null, null, null, null, null ],
			
			"CUST_DECIMAL_WITHOUT_REF_MANUAL" : 	[ null, 45, 4, 6, 18, 14, 16, 8, 10 ],
			"CUST_DECIMAL_WITHOUT_REF_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_WITHOUT_REF_UNIT" : 		[ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL" : 	[ null, null, 1, 1, 1, null, 1, null, 1 ],
			
			"CUST_INT_WITHOUT_REF_MANUAL" : 	[ null, null, null, null, null, null, null, null, null ],
			"CUST_INT_WITHOUT_REF_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_INT_WITHOUT_REF_UNIT" : 		[ null, null, null, null, null, null, null, null, null ],
			"CUST_INT_WITHOUT_REF_IS_MANUAL" : 	[ null, null, null, null, null, null, null, null, null ],
			
			"CUST_LOCAL_DATE_MANUAL" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_LOCAL_DATE_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_LOCAL_DATE_UNIT" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_LOCAL_DATE_IS_MANUAL" :  [ null, null, null, null, null, null, null, null, null ],
			
			"CUST_STRING_MANUAL" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_UNIT" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_IS_MANUAL" :  [ null, null, null, null, null, null, null, null, null ],
			
			"CUST_INT_FORMULA_MANUAL" : 	[ null, null, 2, 3, 9, null, 8, null, 5 ],
			"CUST_INT_FORMULA_CALCULATED" : [ 75, 47, 8, 12, 36, 8, 32, 20, 20 ],
			"CUST_INT_FORMULA_UNIT" : 		[ null, null, null, null, null, null, null, null, null ],
			"CUST_INT_FORMULA_IS_MANUAL" : 	[ null, null, 0, 1, 0, null, 1, null, 0 ],
			
			"CUST_DECIMAL_FORMULA_MANUAL" : 	[ 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
			"CUST_DECIMAL_FORMULA_CALCULATED" : [ 727379969, null, 57508.2, 25559.2, 236422.6, null, 10790.1, null, 58718.1 ],
			"CUST_DECIMAL_FORMULA_UNIT" : 		[ null, null, null, null, null, null, null, null, null ],
			"CUST_DECIMAL_FORMULA_IS_MANUAL" : 	[ null, null, null, null, null, null, null, null, null ],
			
			"CUST_STRING_FORMULA_MANUAL" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_FORMULA_CALCULATED" : [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_FORMULA_UNIT" : 	   [ null, null, null, null, null, null, null, null, null ],
			"CUST_STRING_FORMULA_IS_MANUAL" :  [ null, null, null, null, null, null, null, null, null ]
	};

/**
 * Returns a new mockstar object with initialized test data 
 */
function getMockstar() {
	
		let sUserId = $.session.getUsername(); 
		let oAuthProject = {
			"PROJECT_ID" : ['#P1', '#P2', '#P3', '#P4'], 
			"USER_ID": [sUserId, sUserId, sUserId, sUserId],
			"PRIVILEGE": [InstancePrivileges.ADMINISTRATE, InstancePrivileges.ADMINISTRATE, InstancePrivileges.ADMINISTRATE, InstancePrivileges.ADMINISTRATE]
		};
		var oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					substituteTables: // substitute all used tables in the procedure or view
					{
						account : {
							name: 'sap.plc.db::basis.t_account',
							data: 'db.content::t_account.csv'
						},
						account_group : {
							name: 'sap.plc.db::basis.t_account_group',
							data: 'db.content::t_account_group.csv'
						},
						account__text : {
							name: 'sap.plc.db::basis.t_account__text',
							data: 'db.content::t_account__text.csv'
						},		
						activity_type : {
							name: 'sap.plc.db::basis.t_activity_type',
							data: 'db.content::t_activity_type.csv'
						},
						activity_type__text : {
							name: 'sap.plc.db::basis.t_activity_type__text',
							data: 'db.content::t_activity_type__text.csv'
						}, 
						auth_project: {
							name: 'sap.plc.db::auth.t_auth_project',
							data: oAuthProject
						},
						business_area : {
							name: 'sap.plc.db::basis.t_business_area',
							data: 'db.content::t_business_area.csv'
						},
						business_area__text : {
							name: 'sap.plc.db::basis.t_business_area__text',
							data: 'db.content::t_business_area__text.csv'
						},	
						process : {
							name: 'sap.plc.db::basis.t_process',
							data: 'db.content::t_process.csv'
						},
						process__text : {
							name: 'sap.plc.db::basis.t_process__text',
							data: 'db.content::t_process__text.csv'
						},							
						calculation_version : {
							name: 'sap.plc.db::basis.t_calculation_version',
							data: 'db.content::t_calculation_version.csv'
						},
						calculation : {
							name: 'sap.plc.db::basis.t_calculation',
							data: 'db.content::t_calculation.csv'
						},
						company_code : {
							name: 'sap.plc.db::basis.t_company_code',
							data: 'db.content::t_company_code.csv'
						},
						company_code__text : {
							name: 'sap.plc.db::basis.t_company_code__text',
							data: 'db.content::t_company_code__text.csv'
						},	
						component_split : {
							name: 'sap.plc.db::basis.t_component_split',
							data: 'db.content::t_component_split.csv'
						},		
						component_split__text : {
							name: 'sap.plc.db::basis.t_component_split__text',
							data: 'db.content::t_component_split__text.csv'
						},		
						confidence_level : {
							name: 'sap.plc.db::basis.t_confidence_level',
							data: 'db.content::t_confidence_level.csv'
						},	
						confidence_level__text : {
							name: 'sap.plc.db::basis.t_confidence_level__text',
							data: 'db.content::t_confidence_level__text.csv'
						},
						controlling_area : {
							name: 'sap.plc.db::basis.t_controlling_area',
							data: 'db.content::t_controlling_area.csv'
						},		
						controlling_area__text : {
							name: 'sap.plc.db::basis.t_controlling_area__text',
							data: 'db.content::t_controlling_area__text.csv'
						},		
						costing_sheet : {
							name: 'sap.plc.db::basis.t_costing_sheet',
							data: 'db.content::t_costing_sheet.csv'
						},		
						costing_sheet_overhead : {
							name: 'sap.plc.db::basis.t_costing_sheet_overhead',
							data: 'db.content::t_costing_sheet_overhead.csv'
						},	
						costing_sheet_overhead_row : {
							name: 'sap.plc.db::basis.t_costing_sheet_overhead_row',
							data: 'db.content::t_costing_sheet_overhead_row.csv'
						},
						costing_sheet_overhead_row_formula: {
							name: 'sap.plc.db::basis.t_costing_sheet_overhead_row_formula',
						},
						costing_sheet_row : {
							name: 'sap.plc.db::basis.t_costing_sheet_row',
							data: 'db.content::t_costing_sheet_row.csv'
						},			
						costing_sheet_row_dependencies : {
							name: 'sap.plc.db::basis.t_costing_sheet_row_dependencies',
							data: 'db.content::t_costing_sheet_row_dependencies.csv'
						},		
						costing_sheet_row__text : {
							name: 'sap.plc.db::basis.t_costing_sheet_row__text',
							data: 'db.content::t_costing_sheet_row__text.csv'
						},								
						cost_center : {
							name: 'sap.plc.db::basis.t_cost_center',
							data: 'db.content::t_cost_center.csv'
						},	
						cost_center__text : {
							name: 'sap.plc.db::basis.t_cost_center__text',
							data: 'db.content::t_cost_center__text.csv'
						},							
						item : {
							name: 'sap.plc.db::basis.t_item',
							data: 'db.content::t_item.csv'
						},
						material : {
							name: 'sap.plc.db::basis.t_material',
							data: 'db.content::t_material.csv'
						},
						material__text : {
							name: 'sap.plc.db::basis.t_material__text',
							data: 'db.content::t_material__text.csv'
						},
						project : {
							name: 'sap.plc.db::basis.t_project',
							data: 'db.content::t_project.csv'
						},
						item_ext : {
							name: 'sap.plc.db::basis.t_item_ext'
						},
						item_calculated_values_costing_sheet : 'sap.plc.db::basis.t_item_calculated_values_costing_sheet',
						item_calculated_values_component_split : 'sap.plc.db::basis.t_item_calculated_values_component_split',
						item_referenced_version_component_split : 'sap.plc.db::basis.t_item_referenced_version_component_split',
						variant : {
							name: 'sap.plc.db::basis.t_variant',
							data: 'db.content::t_variant.csv'
						}
					},
					csvPackage : 'db.content'	// The test data are taken from the example PLC data
				});
		return oMockstar;
}

/**
 * Calculates the data for the given calculation version id(s).
 * 
 *  @param aCalculationVersionIds
 *  				{array | integer}  - an array or single integer value with CalculationVersionIds to be initialized
 *  @param oMockstar      
 *  				{object}  - mockstar object used in calling test. The object is needed since the data should be loaded in the same session as the test.
 *  @param bClearTables      
 *  				{bool}  - if true, clear data and load them from the test csvs.
 */
function initDataForCalculationVersion(aCalculationVersionIds, oMockstar, bClearTables) {
	bClearTables = bClearTables || false;
	
	if( !_.isArray(aCalculationVersionIds) ) {
		// If this is not an array but a single value, then pack it into array
		aCalculationVersionIds = [aCalculationVersionIds];
	}
	
	_.each(aCalculationVersionIds, function(iCalculationVersionId){
		if( bClearTables === true ) {
			// Use data from test csv - clear the available version first
	        oMockstar.execSingle(`delete from {{item}} where calculation_version_id=${iCalculationVersionId}`);
	        oMockstar.execSingle(`delete from {{calculation_version}} where calculation_version_id=${iCalculationVersionId}`);
			oMockstar.fillFromCsvFile('item', 'db.analytics.views.testdata::t_item_' + iCalculationVersionId + '.csv'); 
			oMockstar.fillFromCsvFile('calculation_version', 'db.analytics.views.testdata::t_calculation_version_' + iCalculationVersionId + '.csv');
		}
	
		var fnCalculateSavedVersion = oMockstar.loadProcedure("sap.plc.db.calcengine.procedures::p_calculate_saved_calculation_version");
		// Calculate values for given calculation version
		fnCalculateSavedVersion(iCalculationVersionId);
	});

}

module.exports = {
	oItemExtData,
	getMockstar,
	initDataForCalculationVersion
};
