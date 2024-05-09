/*eslint no-console: 0*/
"use strict";

const jsonfile = require('jsonfile');

const xsEnviromentSettingsFile = 'xs-env.json';
const defaultEnvironmentFile = 'default-env.json';

var environmentSettings;
try {
  environmentSettings = jsonfile.readFileSync(xsEnviromentSettingsFile);
} catch (err) {
  err.message = err.message + ". Please make sure to execute \"xs env xsac-plc-db --export-json " + xsEnviromentSettingsFile + "\" to create the " + xsEnviromentSettingsFile + " file."
  throw err
}
const newSettings = {};
newSettings.VCAP_SERVICES = environmentSettings.VCAP_SERVICES;
jsonfile.writeFileSync(defaultEnvironmentFile, newSettings, { spaces: 4 });
