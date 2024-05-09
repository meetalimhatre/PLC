var init = $.import('testtools.GenerateTempTables', 'generate-temp-tables');
init.generate($.request, $.response, $.session.getSecurityToken(), $.session.getUsername());