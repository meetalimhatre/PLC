//This script always return true for check but returns false for other steps

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "run_and_clean_failure";

function check(oConnection) {
    return log.log(name, "check", true);
}

function run(oConnection) {
    return log.log(name, "run", false);
}

function clean(oConnection) {
    return log.log(name, "clean", false);
}