'use strict';

const approuter = require('@sap/approuter');
const logger = require('@sap/approuter/lib/utils/logger').getLogger('/plc/xsjs/plcExtensions');
const tracer = require('@sap/approuter/lib/utils/logger').getTracer(__filename);
const ar = approuter();

const options = {
    workingDir: 'xsa',
    extensions: [
        require('./lib/plcExtensions/index')
    ]
};

const namePattern = /^\w+$/i;
const urlPattern = /^https?:\/\/[a-z0-9][a-z0-9-.]+[a-z0-9](:[1-9]\d+)?(\/.*)?$/i;

const isUndefinedNullOrEmptyObject = (param) => {
    const paramType = typeof param;
    return paramType === 'undefined' || param === null || (paramType === 'object' && Object.getOwnPropertyNames(param).length === 0);
};

const validatePlcExtensions = (plcExtensions) => {
    if (!Array.isArray(plcExtensions)) {
        tracer.error('plcExtensions is not an array: ', JSON.stringify(plcExtensions));
        throw new Error('Not an array');
    }
    var nameSet = new Set();
    plcExtensions.forEach(ext => {
        var hasName = false;
        var hasUrl = false;
        tracer.debug('validating extension \'%s\'', JSON.stringify(ext));
        Object.getOwnPropertyNames(ext).forEach(property => {
            switch(property) {
                case 'name':
                    if (!namePattern.test(ext.name)) {
                        throw new Error('invalid extension name: ' + ext.name);
                    }
                    if (nameSet.has(ext.name)) {
                        throw new Error('duplicate extension found: ' + ext.name);
                    }
                    nameSet.add(ext.name);
                    hasName = true;
                    tracer.debug('valid property found - name: ', ext.name);
                    break;
                case 'url':
                    if (!urlPattern.test(ext.url)) {
                        throw new Error('invalid url: ' + ext.url);
                    }
                    hasUrl = true;
                    tracer.debug('valid property found - url: ', ext.url);
                    break;
                case 'strictSSL':
                    if (typeof ext.strictSSL !== 'boolean') {
                        throw new Error('invalid strictSSL: ', ext.strictSSL);
                    }
                    tracer.debug('valid property found - strictSSL: ', ext.strictSSL);
                    break;
                case 'timeout':
                    if (typeof ext.timeout !== 'number' || ext.timeout < 0) {
                        throw new Error('invalid timeout: ', ext.timeout);
                    }
                    tracer.debug('valid property found - timeout: ', ext.timeout);
                    break;
                default:
                    throw new Error('invalid property found: ', property);
            }
        });
        if (!hasName) {
            throw new Error('missing mandatory property: name');
        }
        if (!hasUrl) {
            throw new Error('missing mandatory property: url');
        }
        tracer.debug('extension \'%s\' is valid', ext.name);
    });
};

ar.start(options);
ar.createRouterConfig({xsappConfig: {}}, (err, routerConfig) => {

    if (!isUndefinedNullOrEmptyObject(err)) {
        const errMessage = err.message ? err.message : JSON.stringify(err);
        logger.error('createRouterConfig failed - err: ', errMessage);
        throw new Error('createRouterConfig failed');
    }
    try {
        var plcExtensions = JSON.parse(process.env.SAP_PLC_EXTENSIONS || '[]');
        tracer.debug('processing SAP_PLC_EXTENSIONS: ' + JSON.stringify(plcExtensions));
        validatePlcExtensions(plcExtensions);
        plcExtensions.forEach(plcExt => {
            tracer.debug('registering extension \'%s\'', plcExt.name);
            routerConfig.destinations[plcExt.name] = {
                'forwardAuthToken': false,
                'name': plcExt.name,
                'strictSSL': (typeof plcExt.strictSSL !== 'boolean') ? true : plcExt.strictSSL,
                'url': plcExt.url,
                'timeout': (typeof plcExt.timeout !== 'number') ? 30000 : plcExt.timeout
            };
        });
        tracer.debug('done processing SAP_PLC_EXTENSIONS');
    }
    catch (error) {
        tracer.error('failed parsing SAP_PLC_EXTENSIONS: %s -> %s', process.env.SAP_PLC_EXTENSIONS, error.message);
        logger.warning('no plc extension registered');
    }
});