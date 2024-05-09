import xml.etree.cElementTree as ET

def set_customFields(tree):
	#Search element calculationViews with id == 'Fact_table'
	for calculationViews in tree.find('calculationViews'):
		if calculationViews.attrib.get('id') == 'Fact_table': 
			#ADD cv_customFieldsViewAttrXml 
			for viewAttributes in calculationViews.findall('viewAttributes'):				
				viewAttributes.insert(len(viewAttributes), ET.Comment(text='cv_customFieldsViewAttrXml'))			
			#ADD cv_customFieldsMappingXml 
			for input in calculationViews.findall('input'):
				input.insert(len(input), ET.Comment(text='cv_customFieldsMappingXml'))

	#Search element logicalModel with id == v_bas_file
	for logicalModel in tree.findall('logicalModel'):
		if logicalModel.attrib.get('id') == 'Fact_table': 		
			#ADD cv_customFieldsAttrVXml  
			for attributes in logicalModel.findall('attributes'):				
				attributes.insert(len(attributes), ET.Comment(text='cv_customFieldsAttrVXml'))				
			#ADD cv_customFieldsMeasureVXml   
			for baseMeasures in logicalModel.findall('baseMeasures'):				
				baseMeasures.insert(len(baseMeasures), ET.Comment(text='cv_customFieldsMeasureVXml'));	