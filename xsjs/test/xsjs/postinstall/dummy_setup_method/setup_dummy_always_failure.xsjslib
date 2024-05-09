// This script will return false to the driver in every case

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "always_failure";

function check(oConnection) {
    return log.log(name, "check", false);
}

function run(oConnection) {
    return log.log(name, "run", false);
}

function clean(oConnection) {
    return log.log(name, "clean", false);
}