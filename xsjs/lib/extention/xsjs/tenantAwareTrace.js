const Runtime = require('@sap/xsjs/lib/runtime.js').Runtime;
const jsonwebtoken = require('jsonwebtoken');

const overrideTrace = (context) => {
    const _trace = context.trace;
    const tenantInfo = {tenantId: "NA"};
    try {
        tenantInfo.tenantId = jsonwebtoken
            .decode(_trace._tracer._logContext._options.req.headers.authorization.split(" ")[1])
            .ext_attr.subaccountid;
    } catch (error) {
        _trace.info("Cannot extract tenantId: %s", error);
    }
    const debug = _trace.debug;
    const info = _trace.info;
    const warning = _trace.warning;
    const error = _trace.error;
    const fatal = _trace.fatal;
    const warn = _trace.warn;
    _trace._tracer._appContext.setCustomFields(["tenantId"]);

    const extracted = (args) => {
        let _args = [...args];
        _args.push(tenantInfo);
        return _args;
    }

    _trace.debug = function() {
        debug.apply(null, extracted(arguments));
    }
    _trace.info = function() {
        info.apply(null, extracted(arguments));
    }
    _trace.warning = function() {
        warning.apply(null, extracted(arguments));
    }
    _trace.error = function() {
        error.apply(null, extracted(arguments));
    }
    _trace.fatal = function() {
        fatal.apply(null, extracted(arguments));
    }
    _trace.warn = function() {
        warn.apply(null, extracted(arguments));
    }
}

const _createBaseContext = Runtime.prototype.createBaseContext;

module.exports = function () {
    Runtime.prototype.createBaseContext = function (req, locale, traceOptions) {
        const context = _createBaseContext.apply(this, [req, locale, traceOptions]);
        overrideTrace(context);
        return context;
    }
}