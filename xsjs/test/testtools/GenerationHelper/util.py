import os
import os.path

def escape(str):
	return str.replace('\\', '\\\\').replace('"', '\\"');
	
def to_literal(s):
	return '"' + escape(s) + '"'

def lines_to_literal(lines):
	return '"' + '\\n\\\n'.join(lines) + '"'

def replace_in_package(str):
	return str.replace('\\\\', '.')

def remove_empty_matches(content):
	rez = set()
	rez_add = rez.add
	for x in content:
		for y in x:
			if y!='':
				rez_add(y)
	return rez

def walk_files(basedir, ext, walk_func):
	for root, dirs, files in os.walk(basedir):
		for file in files:
			fn = os.path.join(root, file)
			_, cur_ext = os.path.splitext(fn)
			if cur_ext in ext:
				package, templateName = os.path.split(os.path.relpath(fn,basedir))
				packageName = os.path.basename(basedir) + '.' + package.replace("\\",".")
				walk_func(fn, cur_ext, packageName, templateName, root)
				