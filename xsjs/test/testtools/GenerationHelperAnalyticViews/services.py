import xml.etree.cElementTree as ET
import os
import shutil

sExtViewSufix = '_CUST'
sBaseViewSfix = '_cust'

#Parse xml file
def parse_XMLfile(path_views, filename):
	#Create temporary XML-file from calculationsviews
	shutil.copyfile(path_views + filename + '.hdbcalculationview', path_views + filename + '.xml')		
	#Parse XML-file
	return ET.parse(path_views + filename + '.xml');
	
def set_Calculation_scenario(tree, isExtView):
	#Search and edit element Calculation:scenario
	tree.getroot().tag = 'Calculation:scenario'
	if isExtView:
		tree.getroot().set('id', tree.getroot().attrib.get('id').replace("sap.plc.analytics.views", "sap.plc.analytics.viewsCF") + sExtViewSufix)
	else: 
		tree.getroot().set('id', tree.getroot().attrib.get('id').replace("sap.plc.analytics.views", "sap.plc.analytics.viewsCF") + sBaseViewSfix)
	tree.getroot().set('xmlns:Calculation', 'http://www.sap.com/ndb/BiModelCalculation.ecore')
	tree.getroot().set('xmlns:Variable', 'http://www.sap.com/ndb/BiModelVariable.ecore');

def set_Description(tree):
	#Search element descriptions and edit attribut defaultDescription
	for descriptions in tree.findall('descriptions'):
		descriptions.set('defaultDescription', descriptions.attrib.get('defaultDescription') + sExtViewSufix);
	
def change_resourceURI(tree, v_file, resourceUriPath):
	#Search element dataSource in dataSources with id == v_file
	for dataSources in tree.findall('dataSources'):
			for dataSource in dataSources:					
				if dataSource.attrib.get('id') == v_file:
					#Edit Element resourceUri
					for resourceUri in dataSource:
						if resourceUri.tag == 'resourceUri':
							resourceUri.text = resourceUriPath + v_file
	#Search element mapping in variableMappings with dataSource == v_file
	for variableMappings in tree.findall('variableMappings'):  
		for mapping in variableMappings:													
			if mapping.attrib.get('dataSource') == v_file:
				#Edit Element targetVariable
				for targetVariable in mapping.findall('targetVariable'):
					targetVariable.set('resourceUri', resourceUriPath + v_file)

#Create or temp XML files
def create_XMLfile(tree, path_viewsCF, filename, isExtView):
	if isExtView:
		tree.write(path_viewsCF + filename + sExtViewSufix + '.xml', xml_declaration=True, encoding='UTF-8');
	else: 
		tree.write(path_viewsCF + filename + sBaseViewSfix + '.xml', xml_declaration=True, encoding='UTF-8');
	
#Replace Comments with Attributes and v_bas_file to v_bas_file_cust
def replace_attributes(path_viewsCF, filename, v_bas_file, mapping_attributes):
	#Open temp file stream
	with open(path_viewsCF + filename + '_cust' + '.xml', 'rt') as fin:
		#Write hdbcalculationview-template file stream
		with open(path_viewsCF + filename + '_cust' + '.hdbcalculationview.template', 'wt') as fout:
			for line in fin:			
				#Replace Comments			
				for comment, text in mapping_attributes.items():
					line = line.replace(comment, text)
				
				#REPLACE v_bas_file
				line = line.replace(v_bas_file, v_bas_file + '_cust')				
				fout.write(line)		
	#Close file streams
	fin.close()
	fout.close();
	
#Remove temp files in folder views and viewsCF
def remove_tempFiles(path_views, path_viewsCF, filename):
	os.remove(path_views + filename + '.xml')	
	os.remove(path_viewsCF + filename + '_CUST' + '.xml');	