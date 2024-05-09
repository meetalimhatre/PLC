// This library returns false for run and passes for other tests

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "run_failure";

function check(oConnection) {
    return log.log(name, "check", true);
}

function run(oConnection) {
    return log.log(name, "run", false);
}

function clean(oConnection) {
    return log.log(name, "clean", true);
}