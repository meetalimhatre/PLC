// This library maintains the log
var _log = [];

function logException(name, step, ex) {
    _log.push({name: name, step: step, ex: ex});
    throw(ex);
}

function log(name, step, value) {
    _log.push({name: name, step: step, result: value});
    return value;
}

function clear() {
    _log = [];
}

function getLog() {
    return _log;
}