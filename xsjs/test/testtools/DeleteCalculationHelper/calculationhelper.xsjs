var hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var oHq = hQueryLib.hQuery($.hdb.getConnection());

var oImpl = $.import("testtools.DeleteCalculationHelper", "calculationhelper");
oImpl.handleRequest($.request, $.response, $.session.getSecurityToken(), $.session.getUsername());