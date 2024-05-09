##########################################################################################
# Creates custom field template files for analytic views and their base views.
#
# Prerequisites:
# - Installed Python 2.7.11 from https://www.python.org/downloads/
# - Installed pathlib from https://pypi.python.org/pypi/pathlib/ and run "python setup.py install" in the unzipped folder of pathlib
# - Installed sqlparse from https://github.com/andialbrecht/sqlparse  and run "python setup.py install" in the unzipped folder of sqlparse
#
# Execution:
# Script has to be executed in its local folder ([...]xsjs\test\testtools\GenerationHelperAnalyticViews) as it uses
# relative path statements to import libraries and read/write views and table functions
##########################################################################################
import services
import v_ext_transform
import v_bas_transform
import table_function_transform

#Import Transformer for xsjslib files
import sys
sys.path.append('../GenerationHelper')
import template_transform

#Relative paths to the standard and custom field view source files
path_views = '../../../../db/src/analytics/views/'
path_viewsCF = '../../../../xsjs/lib/analytics/viewsCF/'
path_views_base = '../../../../db/src/analytics/views/base/'
path_viewsCF_base = '../../../../xsjs/lib/analytics/viewsCF/base/'
#Schema for referencing the custom field views from other custom field views.
resourceUri = 'sap.plc.analytics.viewsCF.base::'

#V_EXT_FILES
v_ext_files = {
	'V_EXT_ACTIVITIES' : 'v_bas_meas_item_costs',
	'V_EXT_COMPONENT_SPLIT' : 'v_bas_meas_component_split', 
	'V_EXT_COSTING_SHEET' : 'v_bas_meas_costing_sheet_w_costs_and_prices',
	'V_EXT_LINE_ITEMS' : 'v_bas_meas_line_items',
	'V_EXT_MATERIAL_LIST' : 'v_bas_meas_item_costs',
	'V_EXT_PROJECT_COMPONENT_SPLIT' : 'v_bas_meas_project_component_split',
	'V_EXT_PROJECT_COSTING_SHEET' : 'v_bas_meas_project_costing_sheet'
}

#V_BAS_FILES
v_bas_files = {
	'v_bas_meas_component_split' : 'TABLE_FUNCTION_v_bas_meas_component_split',
	'v_bas_meas_costing_sheet_w_costs_and_prices' : 'TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices',
	'v_bas_meas_item_costs' : 'TABLE_FUNCTION_v_bas_meas_item_costs',
	'v_bas_meas_line_items' : 'TABLE_FUNCTION_v_bas_meas_line_items',
	'v_bas_meas_project_component_split' : 'TABLE_FUNCTION_v_bas_meas_project_component_split',
	'v_bas_meas_project_costing_sheet' : 'TABLE_FUNCTION_v_bas_meas_project_costing_sheet'
}

#TABLE_FUNCTIONS
TABLE_FUNCTION_v_bas_meas_component_split = ('','item')
TABLE_FUNCTION_v_bas_meas_costing_sheet = ('','item')
TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices = ('v_bas_meas_costing_sheet_cust','csvalues')
TABLE_FUNCTION_v_bas_meas_item_costs = ('','item')
TABLE_FUNCTION_v_bas_meas_line_items = ('v_bas_meas_costing_sheet_cust','itemcosts')
TABLE_FUNCTION_v_bas_meas_project_component_split = ('','item')
TABLE_FUNCTION_v_bas_meas_project_costing_sheet = ('v_bas_meas_item_costs_cust, v_bas_meas_costing_sheet_cust','csvalues')

table_functions_files = {
	'TABLE_FUNCTION_v_bas_meas_component_split' : TABLE_FUNCTION_v_bas_meas_component_split,
	'TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices' : TABLE_FUNCTION_v_bas_meas_costing_sheet_w_costs_and_prices,
	'TABLE_FUNCTION_v_bas_meas_item_costs' : TABLE_FUNCTION_v_bas_meas_item_costs,
	'TABLE_FUNCTION_v_bas_meas_line_items' : TABLE_FUNCTION_v_bas_meas_line_items,
	'TABLE_FUNCTION_v_bas_meas_project_component_split' : TABLE_FUNCTION_v_bas_meas_project_component_split,
	'TABLE_FUNCTION_v_bas_meas_project_costing_sheet' : TABLE_FUNCTION_v_bas_meas_project_costing_sheet
}

#Attributes for replace comments
v_ext_attributes = { 
	'<!--cv_customFieldsViewAttrXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsViewAttrXml Item}}\n{{/if}}\n', 
	'<!--cv_customFieldsMappingXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsMappingXml Item}}\n{{/if}}\n',	
	'<!--cv_customFieldsAttrVXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsAttrVXml Item}}\n{{/if}}\n',
	'<!--cv_customFieldsMeasureVXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsMeasureVXml Item}}\n{{/if}}\n'
}

v_bas_attributes = { 
	'<!--cv_customFieldsAttrXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsAttrXml Item}}\n{{/if}}\n',
	'<!--cv_customFieldsMeasureXml-->' : '{{#if Item.customFields}}\n\t{{cv_customFieldsMeasureXml Item}}\n{{/if}}\n'
}

#Create V_EXT_CUST files
for filename, v_ext_file in v_ext_files.items():	
	#Parse XML
	tree = services.parse_XMLfile(path_views, filename)
	
	#Edit Attributes
	services.set_Calculation_scenario(tree, True)
	services.set_Description(tree)
	services.change_resourceURI(tree, v_ext_file, resourceUri)
	
	#Add Custom Fields
	v_ext_transform.set_customFields(tree)
	
	#Create changed xml files, Replace Comments and Remove Temp files
	services.create_XMLfile(tree, path_viewsCF, filename, True)
	services.replace_attributes(path_viewsCF, filename, v_ext_file, v_ext_attributes)
	services.remove_tempFiles(path_views, path_viewsCF, filename)		
	
#Create V_BAS_CUST files
for filename, v_bas_file in v_bas_files.items():	
	#Parse XML
	tree = services.parse_XMLfile(path_views_base, filename)
	
	#Edit Attributes
	services.set_Calculation_scenario(tree, False)	
	services.change_resourceURI(tree, v_bas_file, resourceUri)
	
	#Add Custom Fields
	v_bas_transform.set_customFields(tree, v_bas_file)
	
	#Create changed xml files, Replace Comments and Remove Temp files
	services.create_XMLfile(tree, path_viewsCF_base, filename, False)
	services.replace_attributes(path_viewsCF_base, filename, v_bas_file, v_bas_attributes)
	services.remove_tempFiles(path_views_base, path_viewsCF_base, filename)

#Create TABLE_FUNCTION files	
for filename, values in table_functions_files.items():
			
	#Parse SQL
	res = table_function_transform.parseFile(path_views_base, filename)
		
	#Edit Function
	table_function_transform.edit_Function(res)
	
	# ADD cv_customFieldsTableFunctList	
	table_function_transform.add_cv_customFieldsTableFunctList(res)

	#Add cv_customFieldsTableFunctSelect
	table_function_transform.add_cv_customFieldsTableFunctSelect(res,'var_out')

	#Add t_extensionTable_item
	#Define Different LEFT_OUTER_JOIN	
	t_extensionTable_item = '\n\t{{#if Item.customFields}}\n\t\tLEFT OUTER JOIN {{t_extensionTable Item}} plcExtTable ON plcExtTable.item_id = ' + values[1] + '.item_id AND plcExtTable.calculation_version_id = ' + values[1] + '.calculation_version_id\n\t{{/if}}\n'			
	table_function_transform.add_t_extensionTable_item(res,'var_out', t_extensionTable_item)
	
	#Create File
	table_function_transform.create_hdbtablefunctions(path_viewsCF_base, filename, res)
	