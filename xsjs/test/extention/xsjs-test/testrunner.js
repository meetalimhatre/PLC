"use strict";

const localJasmine = require('./jasmine.js'); // need to be on the top

const _ = require("lodash");
const xsjsTest = require('@sap/xsjs-test');
const path = require('path');
const fs = require('fs');
const dive = require('@sap/xsjs/node_modules/diveSync');
const testUtil = require("../../utils/testUtil.js");

// set to true if files ending with "-tests.js", "-integrationtests.js" are regarded as test scripts
const ENABLER_JS_TEST_SCRIPTS = true;

// supported postfixes
const supportedNameEndingPatterns = Object.freeze([
    "-tests",
    "-integrationtests",
    "-postinstalltests"
]);

//extend xsjs-test to fix pattern unavailable issue and add plc test set-up and clean-up functionality.
module.exports = function (options) {
    const testApp = xsjsTest(options);
    const loadTests = testApp.loadTests;
    const runJasmine = testApp.runJasmine;

    let oPlcTestrunner;
    let context;

    testApp.runJasmine = function () {
        const callback = arguments[1];
        const callbackWraper = function () {
            const args = arguments;
            try {
                oPlcTestrunner.cleanUpForXsjsTest();
            }
            catch (e) {
                console.error(e.message)
            }

            try {
                if (context && context.hdb) {
                    context.hdb._closeAllConnections();
                }
            }
            catch (e) {
                console.error('Ignored error: attempt to close database connection failed: ' + e.message)
                console.error(e.stack)
            }
            callback.apply(testApp, Array.prototype.slice.apply(args));
        };
        runJasmine.apply(testApp, [arguments[0], callbackWraper]);
    };

    testApp.loadTests = function () {
        const args = Array.prototype.slice.apply(arguments);
        const testOptions = args[0];
        const xsrt = args[1];
        const jasmineInterface = args[3];
        const cov = args[4];
        // Add testOptions to jasmine environment to support parallel test execution
        jasmineInterface.jasmine.plcTestOptions = testOptions;
        context = args[2];

        function createSandbox(sandbox) {
            if (cov) {
                sandbox[cov.coverageVar] = cov.coverageObject
            }
            for (var jk in jasmineInterface) {
                sandbox[jk] = jasmineInterface[jk]
            }
            return sandbox
        }

        xsrt.setSandboxHook(createSandbox);
        const PlcTestrunner = xsrt.runXsjslib('testtools.testrunner.testrunner', context).PLCTestRunner;
        const DbArtefactController = require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;
        const oConnection = context.hdb.getConnection({ "treatDateAsUTC": true, "enableColumnIndices": false });
        const oController = new DbArtefactController(context, oConnection);

        const oRequest = {
            parameters: {
                get: function (property) {
                    return options.test[property];
                }
            }
        };

        const oResponse = {
            setBody: function (content) {
                console.log(content);
            }
        };

        oPlcTestrunner = new PlcTestrunner(oRequest, oResponse, oController, oConnection);
        const canBeRun = oPlcTestrunner.setupForXsjsTest();
        if (!canBeRun) {
            oPlcTestrunner.cleanUpForXsjsTest();
            if (context && context.hdb) {
                context.hdb._closeAllConnections();
            }
            process.exit(0);
        }

        // before calling loadTests, filter out the non-testing xsjslib files
        let originalXsjslib = xsrt.xsjslib;
        xsrt.xsjslib = _.clone(xsrt.xsjslib);
        filterOutNonTestingFiles(testOptions, xsrt);
        loadTests.apply(testApp, args);
        xsrt.xsjslib = originalXsjslib;

        if (ENABLER_JS_TEST_SCRIPTS) {
            loadJsTests(testOptions, xsrt);
        }

        // notify test util that all test suites are loaded
        testUtil.onSuitesLoaded(localJasmine.jasmineConnectionPool);
    };

    return testApp.runTests(function (output, contentType, covObject) {
        var fileName = options.test.filename || "report";

        var fext = options.test.format || 'txt'
        fext = fext.replace('/', '.')
        fext = fext.replace('\\', '.')
        var fname = fileName + "." + fext;
        fs.writeFileSync(path.join(options.test.reportdir, fname), output)

        // see if any failures occurred without parsing the result string into a json object
        // regex will find the first occurrence of form ... "failure" : 3 which is the consolidated
        // number of total failures and use this as exit code
        // in case of zero failures the exit code will be 0 and therefore meaning "ok"
        var match = /"failures"\s*:\s*(\d+)/i.exec(output);
        var nFailures = 0;
        if (match && match.length === 2) {
            nFailures = parseInt(match[1]);
        }
        //in CF environment, we keep the process running so that we can ssh to the test container and get the test report
        if (!testUtil.isCloud()) {
            process.exit(nFailures);
        }
    });
}

// remove the non testing files from xsrt.xsjslib
function filterOutNonTestingFiles(testOptions, xsrt) {
    const tags = testOptions.tags ? _.map(testOptions.tags.split(','), s => _.trim(s)) : [];
    const directory = _.find(xsrt.get("rootDirs"), dir => dir.endsWith("/test") || dir.endsWith("\\test"));
    const libsRemove = [];

    _.forEach(xsrt.xsjslib, function (value, libId) {
        // check filename endings
        if (!_.some(supportedNameEndingPatterns, nameEnding => libId.endsWith(nameEnding))) {
            libsRemove.push(libId);
            return;
        }

        // check testOptions.tags
        const file = directory + "/" + libId.replace(".", "/") + ".xsjslib";
        if (tags.length !== 0 && !checkSuiteTag(tags, file)) {
            libsRemove.push(libId);
            return;
        }
    });

    libsRemove.forEach(function (libId) {
        delete xsrt.xsjslib[libId];
    });
}

// example in testing suite: "}).addTags(["All_Unit_Tests"]);"
const tagsPattern = /\.addTags\s*\(\s*\[(.*)\s*\]\s*\)/m;

// return true if the suite has the tags
function checkSuiteTag(tags, suiteFile) {
    if (!fs.existsSync(suiteFile)) {
        return false;
    }

    let content;
    try {
        content = fs.readFileSync(suiteFile, { encoding: 'utf8' });
    } catch (e) {
        console.log(e.message);
        throw e;
    }

    let match = tagsPattern.exec(content);
    if (!match || !match.length || match.length !== 2) return false;
    let parsedTags = _.map(match[1].trim().split(","), value => {
        let s = _.trim(value);
        if (s.length > 2 && _.first(s) === "'" && _.last(s) === "'") {
            return s.substr(1, s.length - 2);
        } else if (s.length > 2 && _.first(s) === '"' && _.last(s) === '"') {
            return s.substr(1, s.length - 2);
        } else {
            throw new Error("Invalid syntax for addTags(). File path: " + suiteFile);
        }
    });
    return _.intersection(parsedTags, tags).length !== 0;
}

function loadJsTests(testOptions, xsrt) {
    let pPack = new RegExp('^' + _.escapeRegExp(testOptions.package) + '.*');
    let pLib = new RegExp(testOptions.pattern);
    const tags = testOptions.tags ? _.map(testOptions.tags.split(','), s => _.trim(s)) : [];
    const nameEndings = _.map(supportedNameEndingPatterns, s => s + ".js");
    const directory = _.find(xsrt.get("rootDirs"), dir => dir.endsWith("/test") || dir.endsWith("\\test"));
    const useMockUser = _.isNil(testUtil) || _.isEmpty(testUtil.getRealUser());
    const mockUserBase = testUtil.getCurrentMockUser();
    let userCounter = 1;

    dive(directory, function (err, file) {
        if (err) throw err;

        // check filename endings
        if (!_.some(nameEndings, s => file.endsWith(s))) return;

        const pathname = file.substring(directory.length);
        const resId = toResourceId(pathname);

        // check testOptions.package
        if (!resId.match(pPack)) return;

        // check testOptions.pattern
        let match = resId.match(pLib);
        if (!match || !match.length) return;
        if (resId != match[0]) return;

        // check testOptions.tags
        if (tags.length !== 0 && !checkSuiteTag(tags, file)) return;

        if (useMockUser) {
            // For different top-level suite, we use different user name. This is helpful for detecting bugs caused by
            // global variables from $.session.getUsername()
            testUtil.setCurrentMockUser(mockUserBase + '_' + userCounter++);
        }

        console.log(`Loading test: ${pathname.substr(1)}, username: ${testUtil.getCurrentUsername()} ${useMockUser ? '(mocked)' : ''}`);
        try {
            require(file);
        } catch (err) {
            console.error(err.stack);
            throw new Error("Error when loading test file:  " + file + err);
        }
    });

    if (useMockUser) {
        // restore to the default mock user
        testUtil.setCurrentMockUser(null);
    }
}

function toResourceId(pathname) {
    var pos = pathname.lastIndexOf('.');
    if (pos < 0) {
        throw new Error('File without extension: ' + pathname);
    }
    return pathname.substring(1, pos).replace(/\/|\\/g, '.');
};
