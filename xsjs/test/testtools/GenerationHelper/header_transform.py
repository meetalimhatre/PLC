# transforms artifact files into artifact template files

import re
import util
import header_util

def type_to_files(argument):
	switcher = {
			".hdbdd": "TableType",
			'.hdbprocedure': "SQLScript",
			".hdbstructure": "Structure",
			".hdbcalculationview": "hdbcalculationview",
			".hdbfunction": "hdbfunction"
	}
	return switcher.get(argument, "nothing") 

def unique_bo(iterable):
	seen = set()
	seen_add = seen.add
	list = set()
	list_add = list.add
	
	for element in iterable:
		if element not in seen:
			seen_add(element)
			
	for elem in seen:
		if "t_item" in elem or "t_item_temporary" in elem or "ITEM_ID" in elem:
			list_add("Item")
				
	for listelem in list:
		yield listelem
			
					
def unique(iterable):
	seen = set()
	seen_add = seen.add
	
	for element in iterable:
		if element not in seen:
			seen_add(element)
			yield element

name_regex = re.compile(r'sap.plc.db::basis.t_[^"]+|sap.plc.db::repl[^"]+|sap.plc.db.replication.views::[^"]+|(?i)t_item|(?i)t_item_temporary|(?i)ITEM_ID')
def extract_boDependencies(content):
	return unique_bo(name_regex.findall(content))

name_regex_1 = re.compile(r'(?i)analytics.views.*?::([^"<]+)|<DataSource id="([^"]+)|::(?P<ts>.*?(?i)ts_.*?)"|::(?P<tt>.*?(?i)tt_.*?)"|(?i)call .*(?i)procedures::(?P<proc>(?i)p_.*?)"|(?i)CALL .*_SYS_AFL.(?P<afl>.*?) *\(')
def extract_dependencies(content):
	return unique(util.remove_empty_matches(name_regex_1.findall(content)))

def make_headers(type, dependencies, dBdependencies):
	return {"type": type, "boDependencies": dependencies, "dependencies": dBdependencies}

def transform_to_template(content, type):
	return header_util.write_headers(type, content, make_headers(type, extract_boDependencies(content), extract_dependencies(content)))

def create_transformed_file(fn, ext, package, template, rootfile):
	type_to_files(ext)
	with open(fn, 'r') as input:
		content = input.read()
		with open(fn + '-template', 'w') as output:
			output.write(transform_to_template(content, type_to_files(ext)))

def run(basedir):
	util.walk_files(basedir, ['.hdbprocedure', '.hdbcalculationview', '.hdbfunction'], create_transformed_file)