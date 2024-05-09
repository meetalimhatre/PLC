import re
import itertools

header_regex = re.compile(r'//\$\s*(\w+)\s*:(.*)')
def parse_headers(content):
	lines = content.splitlines()
	res = {}

	for line in lines:
		m = header_regex.match(line)
		if m:
			vals = [s.strip(' \r\n\t"') for s in m.group(2).split(',')]
			if "$ type" in line:
				vals = vals[0]
			if len(vals) == 1 and vals[0]=='':
				res[m.group(1)] = []
			else:
				res[m.group(1)] = vals
		else:
			break
	return res

def header_val(vals):
	if isinstance(vals, str):
		return vals
	return ', '.join(vals)

def write_headers(type, content, headers):
	header_lines = ('//$ ' + name + ': ' + header_val(vals) for name, vals in headers.items())
	if type == 'hdbcalculationview' or type == 'hdbfunction':
		return '\n'.join(header_lines) + '\n' + content
	else:
		return '\n'.join(header_lines) + '\n' + 'CREATE ' + content

def strip_headers(content):
	return '\n'.join(itertools.dropwhile(lambda line: line.startswith('//$'), content.splitlines()))
