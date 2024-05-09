import sqlparse
from sqlparse import tokens,sql
from sqlparse.sql import Where, Comparison, Parenthesis, TokenList
from sqlparse.tokens import (Comment, Comparison, Keyword, Name, Punctuation, String, Whitespace)

#Parse SQL file
def parseFile(path_views_base, file):
	#Open hdbtablefunction files
	file = open(path_views_base + file + '.hdbfunction', 'r') 
	#Parse files
	return sqlparse.parse(file.read());
	
#Edit Function
def edit_Function(res):
	for field in res:
		for token in field.tokens:						
			#Search Function
			if token.ttype is Keyword and token.value == 'FUNCTION':				
				next_token = field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)
				#Transform views to viewsCF AND Add _cust
				field.tokens[next_token[0]] = sql.Token(tokens.Text, next_token[1].value.replace('analytics.views.base','analytics.viewsCF.base')[:-1] + '_cust\"')

# ADD cv_customFieldsTableFunctList		
def add_cv_customFieldsTableFunctList(res):
	for field in res:
		for token in field.tokens:						
			#Search RETURNS
			if token.ttype is Keyword and token.value == 'RETURNS':
				next_token = field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1]					
				#Search RETURNS TABLE
				if next_token.ttype is Keyword and next_token.value == 'TABLE':			
					temp_token = field.token_next(field.token_index(next_token), skip_ws=True, skip_cm=True)						
					#Add cv_customFieldsTableFunctList at the end of RETURN TABLE function
					field.tokens[temp_token[0]] = sql.Token(tokens.Text, temp_token[1].value[:-1] + '\t{{#if Item.customFields}}\n\t\t\t{{cv_customFieldsTableFunctList Item}}\n\t{{/if}}\n)\n');				
					
# ADD cv_customFieldsTableFunctSelect
def add_cv_customFieldsTableFunctSelect(res, variable):
	for field in res:
		for token in field.tokens:
			#Search variable
			if variable in token.value :
				#Go through next tokens until keyword 'FROM'
				while field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1] is not None and field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1].value != 'FROM':	
					token = field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1]
				else:				
					#Add cv_customFieldsTableFunctSelect before keyword 'FROM'
					if field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1] is not None: 						
						field.tokens[field.token_index(token)] = sql.Token(tokens.Text, token.value + '\n\t\t{{#if Item.customFields}}\n\t\t\t{{cv_customFieldsTableFunctSelect Item}}\n\t\t{{/if}}');
	
#Add t_extensionTable_item
def add_t_extensionTable_item(res, variable, t_extensionTable_item):
	for field in res:
		for token in field.tokens:
			#Search return
			if variable in token.value and field.token_prev(field.token_index(token), skip_ws=True, skip_cm=False)[1].value != 'return':				
				#Go through next tokens until keyword 'Where'
				while field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1] is not None and field.token_next(field.token_index(token), skip_ws=True, skip_cm=True) is not Where:	
					token = field.token_next(field.token_index(token), skip_ws=True, skip_cm=True)[1]
				else:							 
					#Add t_extensionTable_item before keyword 'Where'
					field.tokens[field.token_index(token)] = sql.Token(tokens.Text, t_extensionTable_item + token.value);
					

#Create hdbtablefunctions
def create_hdbtablefunctions(path_viewsCF_base, filename, res):
	#Add Header at the beginning of the SQL Content
	content = ''
	for part in res:
		content = content + str(part)
	
	#Write file	as hdbtablefunction-template	
	new_file= open(path_viewsCF_base + filename + '_cust' + '.hdbfunction.template', 'w+')
	for line in content:
		new_file.write(line);