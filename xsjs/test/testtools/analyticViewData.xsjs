/**
 * Test service returning the test data for an analytic view as a .csv file
 */
var HQuery = $.require("../../lib/xs/xslib/hQuery").HQuery;
var _ = $.require("lodash");
var analyticsTestService = $.import("db.analytics.views", "analyticsTestService");

//load the jasmine module globally
var module = $.import("sap.hana.testtools.unit.jasminexs.lib", "module");
module.install("sap.hana.testtools.unit.jasminexs.lib", "core2");
module.install("sap.hana.testtools.unit.jasminexs.lib.extensions", "all");

var view = $.request.parameters.get("view") || 'V_EXT_MATERIAL_LIST';
var calculate = $.request.parameters.get("calculate") || false;
var path = '';
var isCustomFieldView;
var sSeparator = ";";

if(view.indexOf('_CUST') === -1){
	path = '"_SYS_BIC"."analytics.views/';
	isCustomFieldView = false;
} else {
	path = '"_SYS_BIC"."analytics.viewsCF/';
	isCustomFieldView = true;
}

// Prepare input parameters and variables
var aPreparedViewParameters = [];
var aPreparedViewVariables = [];
var sViewParameters = '';
var sViewVariables = '';

_.each($.request.parameters, function(value) {
	if(value.name.substring(0, 2) === 'p_') {
		aPreparedViewParameters.push('\'PLACEHOLDER\' = (\'$$' + value.name.substring(2) + '$$\', \'' + value.value + '\')');
	} else if(value.name.substring(0, 2) === 'v_') {
		aPreparedViewVariables.push(value.name.substring(2) + ' = \'' + value.value + '\'');
	}
});
if(aPreparedViewParameters.length > 0) {
	sViewParameters = "(" + aPreparedViewParameters.join(', ') + ")";
}
if(aPreparedViewVariables.length > 0) {
	sViewVariables = ' where ' + aPreparedViewVariables.join(' AND ');
}

/**
 * Returns the data from an analytic view for given language and calculation version.
 * @returns data as .csv file named <view>__<language>_<calculation version_id>.csv, e.g. "V_EXT_LINE_ITEMS__EN_1.csv"
 */

function calculateData(iCalculationVersionId){
	var oMockstar = analyticsTestService.getMockstar();
	
	// TODO: init metadata for custom fields. Currently, the custom views would deliver correct results only if the metadata have been created before, e.g. by TestRunner
	if (isCustomFieldView === true) {
		oMockstar.insertTableData("item_ext", analyticsTestService.oItemExtData);
	}

	analyticsTestService.initDataForCalculationVersion(iCalculationVersionId, oMockstar);
	jasmine.dbConnection.commit();
}


/**
 * Returns the data from an analytic view for given language and calculation version.
 * @returns data as .csv file named <view>__<language>_<calculation version_id>.csv, e.g. "V_EXT_LINE_ITEMS__EN_1.csv"
 */

function getViewData(){
	var hQuery = new HQuery($.hdb.getConnection());
	
	if(calculate === 'true' ) {
		calculateData($.request.parameters.get("v_calculation_version_id"));
	}
	
	var sStmt = 'SELECT * FROM ' + path + view + '"' + 
		sViewParameters + "  " +
		sViewVariables + " ORDER BY PROJECT_ID, CALCULATION_VERSION_ID, ITEM_ID;";
	var oStatement = hQuery.statement(sStmt);

    return oStatement.execute();
}

function convertViewResultToString(aRows){
    var aHeaders = _.keys(aRows[0]);
    
    var sResult = aHeaders.join(sSeparator) + "\n";
    
    for(var i = 0; i < aRows.length; i++){
    	var aValues = [];
    	_.each(aHeaders, function(sKey){
			var sValue = aRows[i][sKey];
			if(sValue === null) {
				sValue = '?';
			}
			aValues.push(sValue);    		
    	});
    	sResult += aValues.join(sSeparator) + "\n";
    }
    return sResult;
}

var filename = view + '__' + $.request.parameters.get("p_var_language") + '_' + ($.request.parameters.get("v_calculation_version_id") || ($.request.parameters.get("v_project_id") || '##ID##'));
var result = convertViewResultToString(getViewData());


$.response.setBody(result);
$.response.contentType = "text/csv";
$.response.headers.set('Content-Disposition', 'attachment;filename=' + filename + '.csv');