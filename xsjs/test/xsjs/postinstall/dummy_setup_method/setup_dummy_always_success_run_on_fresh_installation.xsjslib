/* eslint no-var: 0, no-unused-vars: 0  */
// This script will run all the steps successfully

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");
var name = "always_success_run_on_fresh_installation";

var runOnFreshInstallation = true;

function check(oConnection) {
    return log.log(name, "check", true);
}

function run(oConnection) {
    return log.log(name, "run", true);
}

function clean(oConnection) {
    return log.log(name, "clean", true);
}
