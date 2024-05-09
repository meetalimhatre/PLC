/*eslint no-console: 0*/
"use strict";

const jsonfile = require('jsonfile');

const xsEnviromentSettingsFile = 'xs-env.json';
const defaultServicesFile = 'default-services.json';
const defaultEnvironmentFile = 'default-env.json';

var environmentSettings;
try {
  environmentSettings = jsonfile.readFileSync(xsEnviromentSettingsFile);
} catch (err) {
  err.message = err.message + ". Please make sure to execute \"xs env xsac-plc-xs --export-json " + xsEnviromentSettingsFile + "\" to create the " + xsEnviromentSettingsFile + " file."
  throw err
}
const newSettings = {};
newSettings.hana = environmentSettings.VCAP_SERVICES.hana[0].credentials;
newSettings.uaa = environmentSettings.VCAP_SERVICES.xsuaa[0].credentials;
newSettings["user-provided"] = environmentSettings.VCAP_SERVICES["user-provided"][0].credentials;
jsonfile.writeFileSync(defaultServicesFile, newSettings, { spaces: 4 });

const newSettings2 = JSON.parse('{"destinations": [{ "forwardAuthToken": true, "name": "xsac-plc-xs-destination", "url": "https://localhost:3000" }]}');
newSettings2.MTA_METADATA = environmentSettings.MTA_METADATA;
newSettings2.MTA_METADATA.id = "HCO_PLC";
newSettings2.MTA_METADATA.version = "2.3.0";
jsonfile.writeFileSync(defaultEnvironmentFile, newSettings2, { spaces: 4 });
