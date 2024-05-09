const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var oHq = hQueryLib.hQuery($.hdb.getConnection());

var oImpl = $.import("testtools.DeleteCalculationHelper", "calculationversionhelper");
oImpl.handleRequest($.request, $.response, $.session.getSecurityToken(), $.session.getUsername());