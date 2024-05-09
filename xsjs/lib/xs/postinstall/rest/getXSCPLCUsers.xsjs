var plcUsers = $.import("xs.postinstall.release_4_0_0", "getXSCPLCUsers").getXSCUsers($.hdb.getConnection());
$.response.setBody(plcUsers);


