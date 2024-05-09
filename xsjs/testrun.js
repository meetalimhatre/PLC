#!/usr/bin/env node
/*eslint no-console: 0*/
"use strict";
const argv = require('yargs').option('f', {
    alias : 'file',
    demand: false,
    default: '.test',
    describe: 'test config file path',
    type: 'string'
}).usage('Usage: test [options]')
.example('test -f .testconfig', 'execute testrunner based on .testconfig file')
.help('h')
.alias('h', 'help')
.argv;

// set global variable appRoot, used for template file loading
const path = require('path');
global.appRoot = path.resolve(__dirname);
global.NewDateAsISOString = () => {
    return (new Date()).toISOString();
};


const testrunner = require('./test/extention/xsjs-test');
const loadSetting = require('./test/extention/xsjs-test/setting').loadSetting;
const testUtil = require("./test/utils/testUtil.js");

testrunner(loadSetting({path: argv.file}));
/*
    In order to make tests run on CF environement, we need to cf push the whole xsjs module using manifest.yml file.
    it gets cf crash error when running node testrun.js in CF, the solution is to make it run on a server and keep the process live
*/
if (testUtil.isCloud()) {
    var xsjs = require('@sap/xsjs');
    var port = process.env.PORT || 3000;
    var xsjsOptions = {
        anonymous: true,
        redirectUrl: "/index.xsjs"
    };
    var expressApp = xsjs(xsjsOptions);
    expressApp.disable('etag');
    expressApp.listen(port);
    console.log("Server listening on port %d", port);
}