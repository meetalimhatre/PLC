// This library tests the postinstall framework by creating different instances of register and passing it to the driver
// The test passes when the entry in t_installation_log table contains the required version number
// The test_script used for this test are given in xsjs.postinstall.dummy_setup_method

var driver = $.import("xs.postinstall.xslib", "driver");
let task_id;
let oConnection;

var log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");

var { version, version_sp, version_patch } = driver;

var response = {
    setBody: function(body) 
    {
        this.body = body;
    }
};

function overrideRegister(register) {
    return driver.overrideRegister(register, oConnection);
}   

function setRegister(name, register) {
    driver.setRegister(name, register);
}

function logRegister(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState) {
    driver.log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState, oConnection);
}

function getTaskStatus() {
    if (task_id) {
        var task = oConnection.executeQuery('SELECT STATUS, PROGRESS_STEP, PROGRESS_TOTAL FROM "sap.plc.db::basis.t_task" WHERE TASK_ID = ' + task_id);

        return {
            status: task[0].STATUS,
            progress_step: task[0].PROGRESS_STEP,
            progress_total: task[0].PROGRESS_TOTAL
}
}
    else {
        return {
            status: null,
            progress_step: null,
            progress_total:null
        }
        }
    }

function cleanTask() {
    if (task_id) {
        oConnection.executeUpdate('DELETE FROM "sap.plc.db::basis.t_task" WHERE TASK_ID = ' + task_id);
        oConnection.commit();
    } 
    task_id = 0;
}


function wipeLog() {
    oConnection.executeUpdate('DELETE FROM "sap.plc.db::basis.t_installation_log"');
    oConnection.commit();
    }

function closeConnection() {
    oConnection.close();
}

function checkBaseRelease(iVersion, iVersionSP, iVersionPatch) 
{
    var oBaseRelease = driver.readBaseRelease(oConnection);
    expect(oBaseRelease).toEqual({version: iVersion, version_sp: iVersionSP, version_patch: iVersionPatch});
}

describe("xsjs.postinstall.xslib.driver-integrationtests", function() 
{
    beforeAll(function() {
        oConnection = $.hdb.getConnection();
        oConnection.setAutoCommit(true);
    });
    afterAll(closeConnection);
    describe("fresh installation: driver-integrationtests", function() {
        beforeEach(wipeLog);
        afterEach(wipeLog);
            
        it("proper base release determination on empty log", function() {
            expect(driver.readBaseRelease(oConnection)).toEqual({version: 0, version_sp: 0, version_patch: 0});
    });

        it("proper base release determination on not empty log", function() {
            overrideRegister({
                "aPostDatabaseSetupInstallSteps": [
                    "xs.postinstall.release_independent.00_setup_check_prerequisites",
                    "xs.postinstall.release_independent.99_setup_completed"
                ]             
    });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "password",
                    value: "Hana1234"
                },
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);
            checkBaseRelease(version, version_sp, version_patch);
            expect(getTaskStatus()).toEqual({
                status: 'complete',
                progress_step: 2,
                progress_total: 2
            });
    });

        it("test run always successful AIM", function() {
            overrideRegister({
                "aPostDatabaseSetupInstallSteps": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    "xs.postinstall.release_independent.99_setup_completed"
                ],
                "aOptionalInstallSteps": [ 
                    {
                      id: 1,
                      description: "110_ERPPriceSource",
                      library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                      ]
                    },
                    {
                      id: 2,
                      description: "import example data",
                      library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                      ]
                    }
                ]
            });
        
            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "password",
                    value: "Hana1234"
                },
                {
                    name: "optional",
                    value: "[1,2]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);


            expect(getTaskStatus()).toEqual({
                status: 'complete',
                progress_step: 4,
                progress_total: 4
            });
            checkBaseRelease(version, version_sp, version_patch);
    });

        it("test always failure AIM", function() {
            overrideRegister({
                "aPostDatabaseSetupInstallSteps": [
                 "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                 "xs.postinstall.release_independent.99_setup_completed"
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);
            // neither try to run or clean if check failed
            checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 0,
                progress_total: 2
    });
    });

        it("test run and clean failure AIM", function() {
            overrideRegister({
                "aPostDatabaseSetupInstallSteps": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_run_and_clean_failure",
                    "xs.postinstall.release_independent.99_setup_completed"
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);
        checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 0,
                progress_total: 2
            });
        });

        it("test run failure AIM", function() {
            overrideRegister({
                "aPreDatabaseSetupInstallSteps": [
                    "xs.postinstall.release_independent.00_setup_check_prerequisites"
                ],
                "aPostDatabaseSetupInstallSteps": [
                     "xsjs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                     "xs.postinstall.release_independent.99_setup_completed"
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
        checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 3
            });
    });

        it("test always exception AIM", function() {
            overrideRegister({
                "aPreDatabaseSetupInstallSteps": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                ],
                "aPostDatabaseSetupInstallSteps": [
                     "xsjs.postinstall.dummy_setup_method.setup_dummy_always_exception",
                     "xs.postinstall.release_independent.99_setup_completed"
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
        checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 3
            });
        });

        it("test check last of 3 fails", function() {
            overrideRegister({
                "aPreDatabaseSetupInstallSteps": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                ],
                "aPostDatabaseSetupInstallSteps": [
                     "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                     "xs.postinstall.release_independent.99_setup_completed"
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);
        checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 2,
                progress_total: 4
            });
        });
    
        it("test check second of 3 fails", function() {
            overrideRegister({
                "aPreDatabaseSetupInstallSteps": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                ],
                "aDatabaseSetup": [
                    "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                ],
                "aPostDatabaseSetupInstallSteps": [
                     "xs.postinstall.release_independent.99_setup_completed"
                ]
            });
            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "freshInstallation"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
        checkBaseRelease(0, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 4
            });
        });
    });

    describe("upgrade: driver-integrationtests", function() {
        beforeEach(() => {
            wipeLog();

            logRegister(1, 0, 0, "xs.postinstall.release_independent.99_setup_completed", "check", "started");
            logRegister(1, 0, 0, "xs.postinstall.release_independent.99_setup_completed", "check", "finished");
            logRegister(1, 0, 0, "xs.postinstall.release_independent.99_setup_completed", "run", "started");
            logRegister(1, 0, 0, "xs.postinstall.release_independent.99_setup_completed", "run", "finished");
        });
        afterEach(wipeLog);

        it("proper base release determination", function() {
            expect(driver.readBaseRelease(oConnection)).toEqual({version: 1, version_sp: 0, version_patch: 0});
        });

        it("proper base release determination on not empty log", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]

                    }
                ]
    });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "password",
                    value: "Hana1234"
                },
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);
            checkBaseRelease(version, version_sp, version_patch);
            expect(getTaskStatus()).toEqual({
                status: 'complete',
                progress_step: 2,
                progress_total: 2
            });
        });
    
        it("test run always successful AIM", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });


            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "password",
                    value: "Hana1234"
                },
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }
            ]}, response, false, oConnection);

            
            expect(getTaskStatus()).toEqual({
                status: 'complete',
                progress_step: 4,
                progress_total: 4
            });
            checkBaseRelease(version, version_sp, version_patch);
    });

        it("test always failure AIM", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);

            checkBaseRelease(1, 1, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 2,
                progress_total: 4
            });
    });

        it("test run and clean failure AIM", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_run_and_clean_failure",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
            checkBaseRelease(1, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 0,
                progress_total: 4
            });
        });

        it("test run failure AIM", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
            checkBaseRelease(1, 1, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 3
            });
        });

        it("test always exception AIM", function() {
            overrideRegister({
            "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_exception",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
            checkBaseRelease(1, 1, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 3
            });
        });

        it("test check second of 5 fails", function() {
             overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure"
                        ]
                    }
                ],
                "aPostDatabaseSetupUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [ 
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success"
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ],

             });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
            checkBaseRelease(1, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 5
            });
        });

        it("test run after upgrade failure AIM", function() {
            overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure"
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
    });

            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);

            checkBaseRelease(1, 0, 0);

            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 1,
                progress_total: 4
    });
    
             overrideRegister({
                "aPreDatabaseSetUpUpgradeSteps": [
                    {
                        version      : 1,
                        version_sp   : 1,
                        version_patch: 0,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_failure"
                        ]
                    },
                    {
                        version      : version,
                        version_sp   : version_sp,
                        version_patch: version_patch,
                        library: [
                            "xsjs.postinstall.dummy_setup_method.setup_dummy_always_success",
                            "xs.postinstall.release_independent.99_setup_completed"    
                        ]
                    }
                ]
            });
             
            task_id = driver.run({method : $.net.http.POST, parameters : [
                {
                    name: "optional",
                    value: "[]"
                },
                {
                    name: "mode",
                    value: "upgrade"
                },
                {
                    name: "tenantid",
                    value: jasmine.plcTestRunParameters.tenantId
                }    
            ]}, response, false, oConnection);
             
            checkBaseRelease(1, 0, 0);
             
            expect(getTaskStatus()).toEqual({
                status: 'failed',
                progress_step: 0,
                progress_total: 3
            });
        });
    });
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);