function downloadExcel(){  
    var body = '';   
    var query = 'SELECT TOP 25 \"CommodityID\", \"SupplierID\", \"Title\", \"Price\" FROM \"D061475\".\"sap.playground.D061475.data::commodity\" ';    $.trace.debug(query);  
    var conn = $.db.getConnection(); 
    var pstmt = conn.prepareStatement(query);  
    var rs = pstmt.executeQuery();  
    body =   
"Purchase Order Id \tPartner Id \tCompany Name \tCreated At \n";  
   while(rs.next()) {  
        body += rs.getString(1)+  
"\t"+rs.getString(2)+"\t"+rs.getString(3)+"\t"+rs.getString(4)+"\n";  
    }    $.response.setBody(body);      
    $.response.contentType = 'application/vnd.ms-excel; charset=utf-16le';  
    $.response.headers.set('Content-Disposition','attachment; filename=Excel.xls');  
    $.response.headers.set('access-control-allow-origin','*');  
    $.response.status = $.net.http.OK;  
}  
downloadExcel();