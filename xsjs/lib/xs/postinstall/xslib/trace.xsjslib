// Reusable trace methods

// Trace entries will be triggered if the condition at the end of the log calls
// is false. If there is no condition this will implicitly assumed to be false.

// Trace implies that the content is intended for developers. It also implies
// that the messages may or may not be meaningless to anyone but developers. 

// Due to the fact that at this time no dedicated log facility exists the
// log and the traces will end up in the same file. It is hence recommended
// that developers stick to "d" level trace entries.


const gc_level = {
    fatal: 'f',
    info: 'i',
    warning: 'w',
    error: 'e',
    debug: 'd'
};
const sLevel = 'feiwd';

var transientTrace;

//do not write any trace entries anywhere
//collect them in memory instead
function setTransientMode(level) {
    transientTrace = transientTrace || {
        rawEntries: [],
        entries: '',
        level: gc_level.debug
    };
    transientTrace.level = (level || transientTrace.level || 'd').toLowerCase();
}

function getRawTransientTrace() {
    return transientTrace.rawEntries;
}

//get transient trace entries
function getTransientTrace() {
    var output = '';
    if (!(transientTrace && transientTrace.rawEntries)) {
        return '';
    }

    for (var i = 0; i < transientTrace.rawEntries.length; ++i) {
        output += '[' + transientTrace.rawEntries[i].level + ']: ' + transientTrace.rawEntries[i].message + '\r\n';
    }

    return output;
}

async function trace(level, group, comment, condition) {
    function isFunction(input) {
        return $.toString.call(input) === '[object Function]';
    }

    // only use the first letter, e.g. "error" would be mapped to "E"
    var theLevel = level[0];
    var everythingOK = await isFunction(condition) ? condition() : condition;
    if (!everythingOK) {
        var output = '[' + group + ']: ' + (await isFunction(comment) ? comment() : comment);
        if (transientTrace) {
            if (sLevel.indexOf(level) <= sLevel.indexOf(transientTrace.level)) {
                transientTrace.rawEntries.push({
                    level: level,
                    message: output
                });
            }
        } else {
            switch (theLevel) {
            case gc_level.debug:
                await $.trace.debug(output);
                break;
            case gc_level.info:
                await $.trace.info(output);
                break;
            case gc_level.warning:
                await $.trace.warning(output);
                break;
            case gc_level.error:
                $.trace.error(output);
                break;
            case gc_level.fatal:
                await $.trace.fatal(output);
                break;
            default:
                await $.trace.debug(output);
            }
        }
    }
}


async function debug(group, comment, condition) {
    await trace(gc_level.debug, group, comment, condition);
}

async function info(group, comment, condition) {
    await trace(gc_level.info, group, comment, condition);
}

async function warning(group, comment, condition) {
    await trace(gc_level.warning, group, comment, condition);
}

async function error(group, comment, condition) {
    await trace(gc_level.error, group, comment, condition);
}

async function fatal(group, comment, condition) {
    await trace(gc_level.fatal, group, comment, condition);
}

async function assert(group, comment, condition) {
    await trace(gc_level.fatal, group, comment, condition);
}
export default {gc_level,sLevel,transientTrace,setTransientMode,getRawTransientTrace,getTransientTrace,trace,debug,info,warning,error,fatal,assert};
