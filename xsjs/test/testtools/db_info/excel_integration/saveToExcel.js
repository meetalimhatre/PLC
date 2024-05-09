function saveToExcel(schema) { 	
	try{
		var aUrl= 'excel_integration/exportToExcel.xsjs';
		var t=''; 
		$('input[type=checkbox]').each(function() { 
			if($(this).prop('checked')){ 
				if(t.length>0){ 
					t+=','; 
				} 
				t+=$(this).attr('value'); 
			} 
		});
		if(t.length>0){
		  $.ajax({ 
				url:aUrl,
				dataType:'json',
				  type: "GET",
				  data: { schema : schema, table:t, server: location.host.split(':')[0] },
				success: function (json) {
		            
		            var file = { 
							worksheets:json.worksheets,
							creator : json.creator , created : new Date(json.created) , 
							lastModifiedBy : json.lastModifiedBy , modified : new Date(json.modified) ,
							activeWorksheet : json.activeWorksheet
							
					};		           
					window.location = xlsx(file).href( ) ;		            
		        }					
			});		
		}else{
			alert('need to choose at least one table');
		}
	}
	catch(ex){		
		console.log(ex.toString());
		console.log("Error in saveToExcel:"+ex.message);
	}
	
}