/*eslint no-console: 0*/
'use strict';

const jsonfile = require('jsonfile');

const xsEnviromentSettingsFile = 'xs-env.json';
const defaultServicesFile = 'default-services.json';
const defaultEnvironmentFile = 'default-env.json';

var environmentSettings;
try {
    environmentSettings = jsonfile.readFileSync(xsEnviromentSettingsFile);
} catch (err) {
    err.message = err.message + '. Please make sure to execute "xs env xsac-plc-xs --export-json ' + xsEnviromentSettingsFile + '" to create the ' + xsEnviromentSettingsFile + ' file.';
    throw err;
}
const newSettings = {};
newSettings.hana = environmentSettings.VCAP_SERVICES.hana[0].credentials;
newSettings.uaa = environmentSettings.VCAP_SERVICES.xsuaa[0].credentials;
newSettings.jobscheduler = environmentSettings.VCAP_SERVICES.jobscheduler[0].credentials;
newSettings['user-provided'] = environmentSettings.VCAP_SERVICES['user-provided'][0].credentials;
jsonfile.writeFileSync(defaultServicesFile, newSettings, { spaces: 4 });

const newSettings2 = {};
newSettings2.PLC_METADATA = {};
newSettings2.PLC_METADATA.id = 'HCO_PLC';
newSettings2.PLC_METADATA.version = '3.0.0';
jsonfile.writeFileSync(defaultEnvironmentFile, newSettings2, { spaces: 4 });
export default {jsonfile,xsEnviromentSettingsFile,defaultServicesFile,defaultEnvironmentFile,environmentSettings,newSettings,newSettings2};
