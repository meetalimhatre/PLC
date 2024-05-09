// This script will return false for clean in other cases it return true

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "clean_failure";

function check(oConnection) {
    return log.log(name, "check", true);
}

function run(oConnection) {
    return log.log(name, "run", true);
}

function clean(oConnection) {
    return log.log(name, "clean", false);
}