const _ = require("lodash");
const Runtime = require('@sap/xsjs/lib/runtime.js').Runtime;
const xssec = require("@sap/xssec");
const axios = require("axios");
const testUtil = require("../../utils/testUtil.js");
const {describe, xdescribe, fdescribe, it, xit, fit, beforeEach, afterEach, beforeAll, afterAll, beforeOnce, afterOnce, expect, pending, fail, spyOn} = testUtil;

const APPRIVILEGE = true;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

function mockSession(context) {
    Object.defineProperties(context.session, {
        'getUsername': {
            enumerable: false,
            configurable: false,
            writable: true,
            value: () => {
                return testUtil.getCurrentMockUser();
            }
        },
        'hasAppPrivilege': {
            enumerable: false,
            configurable: false,
            writable: false,
            value: (sPrivilege) => {
                if(sPrivilege !== "non.exisiting::Privilege"){
                    return APPRIVILEGE;
                } else {
                    return false;
                }
            }
        }
    });
    Object.defineProperty(context, 'getPlcUsername', {
        enumerable: false,
        configurable: false,
        writable: true,
        value: () => {
            return testUtil.getCurrentMockUser();
        }
    });
}


function fetchJWT(opts) {
    const uaaService = opts.uaa;
    const username = opts.username;
    const password = opts.password;
    const realUser = testUtil.getRealUser();

    if (realUser && !_.isEmpty(realUser)) {
        let result = axios({
            url : `${uaaService.url}/oauth/token?client_id=${uaaService.clientid}&grant_type=password&username=${username}&password=${password}`,
            auth: {
                username: uaaService.clientid,
                password: uaaService.clientsecret,
                sendImmediately: false
            }
        })
            .then(response => response)
            .catch(error => console.log(error));

        try {
             result = JSON.parse(data.body);
        } catch (e) {
            console.log(`${e.message}`);
            process.exit(0);
        }

        if (!result.access_token) {
            console.log(`ERROR:${result.error}, reason is ${result.error_description}`);
            process.exit(0);
        }
        return result.access_token;
    }
}


function createSecurityContext(opts) {
    const token = fetchJWT(opts);
    if (token) {
        return xssec.createSecurityContext.sync(token, opts.uaa);
    }
    else {
        console.warn(`########### unavailable username or password, mock bussiness user(${testUtil.getCurrentMockUser()}_<NUM>)  ########### `);
    }
}

// Set the global varaibles for test scripts in .js to easy access: $, jamine and jasmine functions
function setGlobalObjectsForJs(context) {
    global.$ = context;

    if (!global.hasOwnProperty("jasmine")) {
        Object.defineProperty(global, "jasmine", {
            get: function () {
                return testUtil.getJasmine();
            }
        });
    }

    global.describe = describe;
    global.xdescribe = xdescribe;
    global.fdescribe = fdescribe;
    global.it = it;
    global.xit = xit;
    global.fit = fit;
    global.beforeEach = beforeEach;
    global.afterEach = afterEach;
    global.beforeAll = beforeAll;
    global.afterAll = afterAll;
    global.beforeOnce = beforeOnce;
    global.afterOnce = afterOnce;
    global.expect = expect;
    global.pending = pending;
    global.fail = fail;
    global.spyOn = spyOn;
}

const createBaseContext =  Runtime.prototype.createBaseContext;


module.exports = function(options) {
    const opt = options;
    let isRealUser = opt.username && opt.password && !testUtil.isCloud();
    if (isRealUser) {
        testUtil.setRealUser(opt.username);
    }

    Runtime.prototype.createBaseContext = function (req, locale, traceOptions) {
        req.authInfo =  createSecurityContext(opt);
        req.user = {id: opt.username};
        const isCfEnv = testUtil.isCloud();
        //mock authInfo.getIdentityZone() and make it return the tenantId, which will be used for instance manager to get the db credentials of tenant-specific database
        if (isCfEnv) {
            req = { "authInfo": { getIdentityZone: function () { return opt.tenantId } }, "headers": [] };
        }
        const context = createBaseContext.apply(this, [req, locale, traceOptions]);
        //in XSA on premise, when set the user name and password, it will use the real user for authentication, rather than mock user
        if (!isRealUser) {
            mockSession(context);
        }

        // save the context object for later reference, plus other settings
        setGlobalObjectsForJs(context);
        return context;
    }
}
