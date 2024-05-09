# transforms xsjslib artifact template files into plain template files

import os
import os.path
import re
	
def transform_template(content):
	content = re.sub(r'var template = "(.+)";', r'\1', content, flags=re.MULTILINE | re.DOTALL)
	content = content.replace('\\n\\\n', '\n').replace('\\\\', '\\').replace('\\"', '"').replace('\\n', '')
	return content

def create_template_file(fn, ext, package, template, rootfile):
	with open(fn, 'r') as input:
		content = input.read()
	newFileName = str(fn).replace("-template.xsjslib", ".template")
	origContent = None
	if os.path.exists(newFileName):
		with open(newFileName, 'r') as orig:
			origContent = orig.read()
	generatedContent = transform_template(content)
	# Only generate file if the content has changed
	if generatedContent != origContent:
		print("Generating " + newFileName)
		with open(newFileName, 'w') as output:
			output.write(generatedContent)

def run(basedir):
	for root, dirs, files in os.walk(basedir):
		for file in files:
			if file.endswith("-template.xsjslib"):
				fn = os.path.join(root, file)
				package, templateName = os.path.split(os.path.relpath(fn,basedir))
				packageName = os.path.basename(basedir) + '.' + package.replace("\\",".")
				_, cur_ext = os.path.splitext(fn)
				create_template_file(fn, cur_ext, packageName, templateName, root)
	
	
#	walk_files(basedir, ['.hdbprocedure-template', '.tabletype-template', '.table-template', '.hdbcalculationview-template', '.hdbfunction-template', '.hdbhierarchyview-template',], create_xsjs_file)