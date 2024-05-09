import argparse
import template_transform
import template_transform2
import header_transform
import metadata

if __name__ == '__main__':
	parser = argparse.ArgumentParser(description='Artifact transformer')
	parser.add_argument('action')
	parser.add_argument('basedir')
	args = parser.parse_args()
	
	# action names subject to change
	if args.action == 'addheaders':
		header_transform.run(args.basedir)
	elif args.action == 'xsjslib':
		template_transform.run(args.basedir)
	elif args.action == 'template':
		template_transform2.run(args.basedir)
	elif args.action == 'metadata':
		metadata.run(args.basedir)
	else:
		print('Unknown action')