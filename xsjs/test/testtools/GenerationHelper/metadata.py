import re
import util
import header_util
import header_transform
import json
import os.path
import datetime
import pathlib

ext = None
rootfile = None
packageName = None
templateName = None

def add_entry(entries, name, headers, packageName, templateName, rootfile):
	file = rootfile + "\\" + templateName + ".xsjslib"
	if os.path.exists(file):
		headers["packageName"] = packageName
		headers["templateName"] = templateName
	else:
		headers["packageName"] = ""
		headers["templateName"] = ""
	entries[name] = headers
	
def transform_entries(entries, business_objects):
	i = datetime.datetime.now()
	output = '// This is a generated file. DO NOT EDIT! \n\n'
	output += '// Generation date: ' + ' %s.%s.%s ' % (i.day, i.month, i.year) + '%s:%s:%s' % (i.hour, i.minute, i.second) + '\n\n'
	output += 'var mBusinessObjectsMetadata = ' + json.dumps(business_objects, indent=4) + ';'
	output += '\n\n'
	output += 'var mDbArtefactsMetadata = ' + json.dumps(entries, indent=4) + ';'

	output += '\n\n'
	output += 'module.exports.mBusinessObjectsMetadata = mBusinessObjectsMetadata;\n'
	output += 'module.exports.mDbArtefactsMetadata = mDbArtefactsMetadata;\n'
	return output;

def transform_bo_metadata(entries):
	business_object = {}
	seen = set()
	seen_add = seen.add
	for artefact in entries:
		for bo in entries[artefact]["boDependencies"]:
			if bo not in seen:
				seen_add(bo)
				business_object[bo] = {"dependencies": []}
				business_object[bo]["dependencies"].append(artefact)
			else:
				business_object[bo]["dependencies"].append(artefact)
	return business_object;
	
def worker(entries, ext, packageName, templateName, rootfile):
	def go(fn, ext, packageName, templateName, rootfile):
		name = os.path.basename(fn).split('.')[0]
		with open(fn, 'r') as input:
			content = input.read()
			if ext == '.tabletype-template':
				name_regex_2 = re.compile(r'(?i)CREATE TYPE.*?::(' + name + '\.(?i)t._.*?)"|(?i)CREATE TYPE.*?::(.*?\.(?i)t._.*?)"|(?i)CREATE TYPE.*?::((?i)t._.*?)"')
				for tt_ts in header_transform.unique(util.remove_empty_matches(name_regex_2.findall(content))):
					headers_tt_ts = header_util.parse_headers(content)
					add_entry(entries, tt_ts, headers_tt_ts, packageName, templateName, rootfile)
			else:
				headers = header_util.parse_headers(content)
				add_entry(entries, name, headers, packageName, templateName, rootfile)
	return go

def run(basedir):
	entries = {}
	util.walk_files(basedir, ['.hdbprocedure-template', '.tabletype-template', '.hdbcalculationview-template', '.hdbfunction-template'], worker(entries, ext, packageName, templateName, rootfile))
	with open(os.path.join(basedir + "\\plc\\xs\\db\\generation", 'custom_fields_metadata.js'), 'w') as output:
		output.write(transform_entries(entries, transform_bo_metadata(entries)))
