$.response.cntentType = "text/html";
var conn = $.db.getConnection();
var schema = $.request.parameters.get("schema");
var table = $.request.parameters.get("table");
if(schema===undefined){
	schema=$.session.getUsername();
}
function chooseSchema(){
	var result='';
	if(schema==$.session.getUsername()){
		result='<form action="?" method="get"><input id="schema" name="schema"><button type="submit">change schema</button></form>';
	}else{
		result='<button onclick="location.href=\'?\'">back to '+$.session.getUsername()+' schema</button>';
	}
	return result;
}
function listOfSchemas(){
	var pstmt = conn.prepareStatement('SELECT  SCHEMA_NAME FROM "SYS"."TABLES" group by SCHEMA_NAME order by SCHEMA_NAME asc');
	var rs =  pstmt.executeQuery();
	var result='';
	while(rs.next()){
		if(result.length>0){
			result+=', ';
		}
		result+='"'+rs.getString(1)+'"';
	}
	return result;
}
function showTable(){
	if(table==undefined){
		var pstmt = conn.prepareStatement('SELECT  TABLE_NAME, TABLE_TYPE, HAS_PRIMARY_KEY, USES_EXTKEY, TABLE_OID FROM "SYS"."TABLES" where SCHEMA_NAME=\''+schema+'\' order by TABLE_NAME');
		var rs =  pstmt.executeQuery();
		var result='<button onclick="doCheckBox(1)">select all</button> <button onclick="doCheckBox(0)">disable all</button> <button onclick="saveToExcel(\''+schema+'\')">generate</button>\n\
			<table width="100%" style="border:1px solid grey;border-collapse: collapse;" cellpadding=5><tr style="border:1px solid grey; background:#eaeaea;"><td></td><td><strong>TABLE_NAME</strong></td><td align="center"><strong>TABLE_TYPE</strong></td><td align="center"><strong>HAS_PRIMARY_KEY</strong></td><td align="center"><strong>USES_EXTKEY</strong></td></tr>';	
		while(rs.next()){
			result+='<tr style="border:1px solid grey;"><td><input type="checkbox" name="table_'+rs.getString(5)+'" class="tableBox" value="'+rs.getString(5)+'"></td><td><a href="?schema='+schema+'&table='+rs.getString(1)+'">'+rs.getString(1)+'</a></td><td align="center">'+rs.getString(2)+'</td><td align="center"><img src="images/'+rs.getString(3)+'1.png" alt="'+rs.getString(3)+'" title="'+rs.getString(3)+'" width="20"></td><td align="center"><img src="images/'+rs.getString(4)+'1.png" alt="'+rs.getString(4)+'" title="'+rs.getString(4)+'" width="20"></td></tr>';
		}
		result+='</table>';
	}else{
		var pstmt = conn.prepareStatement('SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE_NAME, LENGTH, IS_NULLABLE, DEFAULT_VALUE, COMMENTS, INDEX_TYPE	FROM SYS.TABLE_COLUMNS WHERE SCHEMA_NAME = \''+schema+'\' AND TABLE_NAME = \''+table+'\' ORDER BY POSITION');
		var rs =  pstmt.executeQuery();
		var result='<button onclick="location.href=\'?schema='+schema+'\'">return to schema '+schema+'</button><table width="100%" style="border:1px solid grey;border-collapse: collapse;" cellpadding=5><tr style="border:1px solid grey; background:#eaeaea;"><td><strong>COLUMN_NAME</strong></td><td align="center"><strong>DATA_TYPE_NAME</strong></td><td align="center"><strong>IS_NULLABLE</strong></td><td align="center"><strong>DEFAULT_VALUE</strong></td><td align="center"><strong>INDEX_TYPE</strong></td><td align="center"><strong>COMMENTS</strong></td></tr>';	
		while(rs.next()){
			var defaultV='<img src="images/null1.png" alt="null" title="null" width="20">';
			if(rs.getString(6)!=null){
				defaultV='"'+rs.getString(6)+'"';
			}
			var indexTypeV='<img src="images/FALSE1.png" alt="NONE" title="NONE" width="20">';
			if(rs.getString(8)!='NONE'){
				indexTypeV='<img src="images/TRUE1.png" alt="'+rs.getString(8)+'" title="'+rs.getString(8)+'" width="20">';
			}
			var comments='<img src="images/null1.png" alt="null" title="null" width="20">';
			if(rs.getString(7)!=null){
				comments='"'+rs.getString(7)+'"';
			}
			result+='<tr style="border:1px solid grey;"><td>'+rs.getString(2)+'</td><td align="center">'+rs.getString(3)+' ('+rs.getString(4)+')</td><td align="center"><img src="images/'+rs.getString(5)+'1.png" alt="'+rs.getString(5)+'" title="'+rs.getString(5)+'" width="20"></td><td align="center">'+defaultV+'</td><td align="center">'+indexTypeV+'</td><td align="center">'+comments+'</td></tr>';
		}
		result+='</table>';
	}	
	return result;
}
function printH1(){
	var result;
	if(table==undefined){
		result='<h1>DB info for schema: '+schema+'</h1>';
	}else{
		result='<h1>DB info for table from '+schema+'</h1><h3>Table: '+table+'</h3>';
		var pstmt = conn.prepareStatement('SELECT TABLE_TYPE FROM "SYS"."TABLES" where SCHEMA_NAME=\''+schema+'\' and TABLE_NAME=\''+table+'\'');
		var rs =  pstmt.executeQuery();
		if(rs.next()){
			if(rs.getString(1)=='COLUMN'){
				var pstmt = conn.prepareStatement('SELECT COUNT(*) FROM  "'+schema+'"."'+table+'"');
				var rs =  pstmt.executeQuery();
				if(rs.next()){
					result+='<h3>Number of rows in table: '+rs.getString(1)+'</h3>';	
				}
			}
		}
		
	}
	return result;
}

var output ='<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n\
<html xmlns="http://www.w3.org/1999/xhtml">\n\
<head>\n\
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\
<title>DB info</title>\n\
<meta name="author" content="Volodymyr Bondarenko">\n\
<script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>\n\
<link rel="stylesheet" href="//code.jquery.com/ui/1.10.4/themes/smoothness/jquery-ui.css">\n\
<script src="//code.jquery.com/jquery-1.9.1.js"></script>\n\
<script src="excel_integration/saveToExcel.js"></script>\n\
	<script type="text/javascript" src="excel_integration/lib/jszip.js"></script>\n\
	<script type="text/javascript" src="excel_integration/lib/jszip-inflate.js"></script>\n\
	<script type="text/javascript" src="excel_integration/lib/jszip-deflate.js"></script>\n\
	<script type="text/javascript" src="excel_integration/lib/jszip-load.js"></script>	\n\
	<script type="text/javascript" src="excel_integration/lib/xlsx.js"></script>\n\
<script src="//code.jquery.com/ui/1.10.4/jquery-ui.js"></script>\n\
	<script>\n\
	function doCheckBox(whatToDo){\n\
		var doThis=true;\n\
		if(whatToDo==0){\n\
			doThis=false;\n\
		}\n\
		$(\'input[type=checkbox]\').each(function(){ $(this).prop(\'checked\', doThis); });\n\
	}\n\
	  $(function() {\n\
	    var availableTags = [ '+listOfSchemas()+' ];\n\
	    $( "#schema" ).autocomplete({\n\
	      source: availableTags\n\
	    });\n\
	  });\n\
	  </script>\n\
<link rel="stylesheet" href="/resources/demos/style.css">\n\
</head>\n\
<body>\n\
'+printH1()+'\n\
<div style="margin:0 auto; width:80%;">\n\
<div style="text-align:right; padding-bottom:5px;margin-bottom: -31px;">'+chooseSchema()+'</div>\n\
'+showTable()+'</div>\n\
</body></html>';

// onenote://dwdf207/PTU_Industry/07_Projects/2012/2012_Product_Costing/60_Project_Management/OneNote/ProductCosting/Development.one#SAP%20HANA%20Client%20Installation&section-id={A6A4359B-A7E5-40F7-AAEC-CE0819B2AD6D}&page-id={EE4BAB6C-5DF7-4DB7-8FA7-D6B9EC4E1621}&end 


conn.close();
output+='\n</body>\n</html>';
$.response.setBody(output);