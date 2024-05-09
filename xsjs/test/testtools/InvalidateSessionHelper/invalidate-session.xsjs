const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var oHq = hQueryLib.hQuery($.hdb.getConnection());

var oImpl = $.import("testtools.InvalidateSessionHelper", "invalidate-session");
oImpl.handleRequest($.request, $.response, $.session.getUsername(), $.session.getUsername());