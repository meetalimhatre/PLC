// This script will run all the steps successfully

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
this.name = "always_success";

function check(oConnection) {
    return log.log(name, "check", true);
}

function run(oConnection) {
    return log.log(name, "run", true);
}

function clean(oConnection) {
    return log.log(name, "clean", true);
}