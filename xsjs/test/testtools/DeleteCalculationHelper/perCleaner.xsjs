
var oConnection = $.db.getConnection({
 	"isolationLevel" : $.db.isolation.SERIALIZABLE
});

//delete data from recent calculation versions table
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_calculation_version_temporary\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_item_referenced_version_component_split_temporary\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_item_temporary\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_item_temporary_ext\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_recent_calculation_versions\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_open_calculation_versions\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_open_projects\"").execute();
oConnection.prepareStatement("delete from \"sap.plc.db::basis.t_session\"").execute();

oConnection.commit();

oConnection.close();
    
$.response.contentType = "text/plain";
$.response.setBody("Reset finished");
$.response.status = $.net.http.OK;