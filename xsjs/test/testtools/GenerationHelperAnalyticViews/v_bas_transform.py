import xml.etree.cElementTree as ET

def set_customFields(tree, v_bas_file):
	#Search element logicalModel with id == v_bas_file
	for logicalModel in tree.findall('logicalModel'):
		if logicalModel.attrib.get('id') == v_bas_file: 		
			#ADD cv_customFieldsAttrVXml  
			for attributes in logicalModel.findall('attributes'):				
				attributes.insert(len(attributes), ET.Comment(text='cv_customFieldsAttrXml'))	
			#ADD cv_customFieldsMeasureVXml   
			for baseMeasures in logicalModel.findall('baseMeasures'):				
				baseMeasures.insert(len(baseMeasures), ET.Comment(text='cv_customFieldsMeasureXml'))