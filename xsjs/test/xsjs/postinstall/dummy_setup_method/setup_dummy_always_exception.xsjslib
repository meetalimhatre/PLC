// This script throws exception for all the cases

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "always_exception";

function check(oConnection) {
    log.logException(name, "check", "failed");
}

function run(oConnection) {
    log.logException(name, "run", "failed");
}

function clean(oConnection) {
    log.logException(name, "clean", "failed");
}