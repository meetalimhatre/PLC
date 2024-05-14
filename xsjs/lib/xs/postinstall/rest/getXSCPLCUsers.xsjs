var plcUsers = $.import('xs.postinstall.release_4_0_0', 'getXSCPLCUsers').getXSCUsers(await $.hdb.getConnection());
$.response.setBody(plcUsers);
export default {plcUsers};
