# transforms artifact template files into js template files

import util
import os.path
import header_util
	
def transform_to_template(content):
	return 'var template = ' + util.lines_to_literal(util.escape(content).splitlines()) + ';'

def create_xsjs_file(fn, ext, package, template, rootfile):
	with open(fn, 'r') as input:
		content = input.read()
	newFileName = fn + '.xsjslib'
	origContent = None
	if os.path.exists(newFileName):
		with open(newFileName, 'r') as orig:
			origContent = orig.read()
	generatedContent = transform_to_template(header_util.strip_headers(content))
	# Only generate file if the content has changed
	if generatedContent != origContent:
		print("Generating " + newFileName)
		with open(newFileName, 'w') as output:
			output.write(generatedContent)

def run(basedir):
	util.walk_files(basedir, ['.hdbprocedure-template', '.tabletype-template', '.table-template', '.hdbcalculationview-template', '.hdbfunction-template', '.hdbhierarchyview-template',], create_xsjs_file)