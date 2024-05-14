// This is a "dummy" step which will always succeed.
// Its purpose is to introduce a distinctive marker for
// successful end of the setup. The driver will
// check for the corresponding log entries to infer
// if the setup phase completed properly.

var runOnFreshInstallation = true;

function check(oConnection) {
    return true;
}

function run(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}
export default {runOnFreshInstallation,check,run,clean};
