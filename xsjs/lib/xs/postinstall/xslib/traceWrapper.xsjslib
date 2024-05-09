// this file wraps the request handler and manages the outpu displayed to the end user
const trace = $.import('xs.postinstall.xslib', 'trace');
const _ = $.require('lodash');
const whoAmI = 'xs.postinstall.xslib.traceWrapper';
async function fatal(line) {
    await trace.fatal(whoAmI, line);
}
async function debug(line) {
    await trace.debug(whoAmI, line);
}


function stringify_exception(ex) {
    var eString = '';
    if (ex.constructor === Array) {
        _.each(ex, function (ex_it) {
            eString += 'Exception:\n' + ex_it.toString() + '\n';
        });
    } else {
        eString = 'Exception:\n' + ex.toString() + '\n';
    }

    var prop = '';
    for (prop in ex) {
        if ([
                'fileName',
                'lineNumber',
                'stack'
            ].indexOf(prop) < 0) {
            eString += prop + ': ' + ex[prop] + '\n';
        }
    }
    if (ex.stack !== undefined) {
        eString += '\nException.stack.toString():\n';
        eString += ex.stack.toString();
    }
    return eString;
}

async function log_exception(ex) {
    await fatal(await stringify_exception(ex));
}

function checkPrivilege(oReqiuredPrivilege) {
    try {
        $.session.assertAppPrivilege(oReqiuredPrivilege);
        return true;
    } catch (ex) {
        return false;
    }
}


async function wrap_request_handler(request_handler) {
    // This will wrap a request handler for tracing.

    var result = null;
    var start;
    try {
        start = parseInt(new Date().getTime(), 10);
        // call the request handler
        result = request_handler(true);
        await debug('result: ' + JSON.stringify(result));

    } catch (e) {
        await log_exception(e);

        if (e.code && e.code === 258) {
            $.response.status = $.net.http.UNAUTHORIZED;
            $.response.contentType = 'plain/text';
            $.response.setBody('');
            return result;
        }

    }

    try {
        var cookies = 'Cookies: ' + JSON.stringify($.request.cookies) + '\n\n';
        $.response.contentType = 'text/plain';
        var current = parseInt(new Date().getTime(), 10);
        var elapsed = 'Total Execution Time: ' + (current - start) + ' ms\n\n';
        $.response.setBody(elapsed + cookies + await trace.getTransientTrace() + '\n');
        $.response.status = $.net.http.OK;
        return result;
    } catch (e) {
        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
        $.response.contentType = 'plain/text';
        $.response.setBody('corrupted trace handler');
        return result;
    }
}
export default {trace,_,whoAmI,fatal,debug,stringify_exception,log_exception,checkPrivilege,wrap_request_handler};
