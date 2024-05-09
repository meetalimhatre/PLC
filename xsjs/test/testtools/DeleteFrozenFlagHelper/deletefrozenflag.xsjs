const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var hQuery = hQueryLib.hQuery($.hdb.getConnection());

var oImpl = $.import("testtools.DeleteFrozenFlagHelper", "deletefrozenflag");
oImpl.handleRequest($.request, $.response, $.session.getSecurityToken(), $.session.getUsername());