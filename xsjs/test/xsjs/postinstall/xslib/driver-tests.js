const driver = $.import("xs.postinstall.xslib", "driver");
let oConnection;

const log = $.import("xsjs.postinstall.dummy_setup_method", "setup_log");

const response = {
    setBody: function(body) {
        this.body = body;
    }
};

function wipeLog() {
    oConnection.executeUpdate('DELETE FROM "sap.plc.db::basis.t_installation_log"');
    oConnection.commit();
}

function setRegister(name, register) {
    driver.setRegister(name, register);
}

function closeConnection() {
    oConnection.close();
}

function logRegister(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState) {
    driver.log(sVersion, sVersionSp, sVersionPatch, sName, sStep, sState, oConnection);
}

describe("xsjs.postinstall.xslib.driver-tests", function() {
    beforeAll(function() {
        oConnection = $.hdb.getConnection();
        oConnection.setAutoCommit(true);
    });
    afterAll(closeConnection);
    describe("Process parameters from POST body", () => {
        it("test fresh install parameters", () => {
            const oParam = driver.processParameters({
                parameters: [
                    {
                        name: "password",
                        value: "Hana1234"
                    },
                    {
                        name: "optional",
                        value: "[ 1, 2 ]"
                    }
                ]
            });
            expect(oParam).toEqualObject({
                password: "Hana1234",
                optional: [ 1, 2 ]
            });
        });

        it("test upgrade parameters", () => {
            const oParam = driver.processParameters({
                parameters: [
                    {
                        name: "optional",
                        value: "[ 1 ]"
                    }
                ]
            });
            expect(oParam).toEqualObject({
                optional: [ 1 ]
            });
        });
    });

    describe("get merged/filtered steps collection", () => {
        beforeEach(wipeLog);
        afterEach(wipeLog);

        it("fresh install obtain final steps", () => {
            setRegister('aPreDatabaseSetupInstallSteps', [
                "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
            ]);
            setRegister('aDatabaseSetup', [
                "xs.postinstall.dummy_setup_method.setup_dummy_run_failure"
            ]);
            setRegister('aPostDatabaseSetupInstallSteps', [
                "xs.postinstall.release_independent.99_setup_completed"
            ]);
            setRegister('aOptionalInstallSteps', [
                {
                    id: 1,
                    description: "Install example content",
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);

            const oRequestBody = {
                parameters: [
                    {
                        name: "password",
                        value: "Hana1234"
                    },
                    {
                        name: "mode",
                        value: "freshInstallation"
                    },
                    {
                        name: "optional",
                        value: "[ 1 ]"
                    }
                ]
            };

            const oBaseRelease = driver.readBaseRelease(oConnection);
            expect(oBaseRelease).toEqualObject({
                version: 0,
                version_sp: 0,
                version_patch: 0
            });

            const bIsFreshInstallation = driver.isFreshInstallation(oRequestBody);
            expect(bIsFreshInstallation).toEqual(true);


            const oParam = driver.processParameters(oRequestBody);
            expect(oParam).toEqualObject({
                password: "Hana1234",
                optional: [ 1 ],
                mode: "freshInstallation"
            });

            const aMappedRegister = driver.getMappedRegister(bIsFreshInstallation, oConnection);
            expect(aMappedRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                }
            ]);

            const aOptionalRegister = driver.getOptionalRegister(oParam.optional, bIsFreshInstallation);
            expect(aOptionalRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);

            const currentStep = driver.getCurrentStep([ ...aMappedRegister, ...aOptionalRegister ], oConnection);
            expect(currentStep).toEqual(0);

            const aFinalSteps = driver.obtainFinalSteps(oRequestBody, oConnection);
            expect(aFinalSteps).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);
        });


        it("fresh install obtain final steps (recover from error)", () => {
            setRegister('aPreDatabaseSetupInstallSteps', [
                "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
            ]);
            setRegister('aDatabaseSetup', [
                "xs.postinstall.dummy_setup_method.setup_dummy_run_failure"
            ]);
            setRegister('aPostDatabaseSetupInstallSteps', [
                "xs.postinstall.release_independent.99_setup_completed"
            ]);
            setRegister('aOptionalInstallSteps', [
                {
                    id: 1,
                    description: "Install example content",
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);

            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "started");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "finished");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "started");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "finished");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "check", "started");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "check", "finished");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "run", "started");
            logRegister(driver.version, driver.version_sp, driver.version_patch, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "run", "error");

            const oRequestBody = {
                parameters: [
                    {
                        name: "password",
                        value: "Hana1234"
                    },
                    {
                        name: "mode",
                        value: "freshInstallation"
                    },
                    {
                        name: "optional",
                        value: "[ 1 ]"
                    }
                ]
            };

            const oBaseRelease = driver.readBaseRelease(oConnection);
            expect(oBaseRelease).toEqualObject({
                version: 0,
                version_sp: 0,
                version_patch: 0
            });

            const bIsFreshInstallation = driver.isFreshInstallation(oRequestBody);
            expect(bIsFreshInstallation).toEqual(true);


            const oParam = driver.processParameters(oRequestBody);
            expect(oParam).toEqualObject({
                password: "Hana1234",
                optional: [ 1 ],
                mode: "freshInstallation"
            });

            const aMappedRegister = driver.getMappedRegister(bIsFreshInstallation, oConnection);
            expect(aMappedRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                }
            ]);

            const aOptionalRegister = driver.getOptionalRegister(oParam.optional, bIsFreshInstallation);
            expect(aOptionalRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);

            const currentStep = driver.getCurrentStep([ ...aMappedRegister, ...aOptionalRegister ], oConnection);
            expect(currentStep).toEqual(2);

            const aFinalSteps = driver.obtainFinalSteps(oRequestBody, oConnection);
            expect(aFinalSteps).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);
        });


        it("upgrade obtain final steps", () => {
            setRegister('aPreDatabaseSetUpUpgradeSteps', [
                {
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);
            setRegister('aDatabaseSetup', [
                "xs.postinstall.dummy_setup_method.setup_dummy_run_failure"
            ]);
            setRegister('aPostDatabaseSetupUpgradeSteps', [
                {
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    library: [
                        "xs.postinstall.release_independent.99_setup_completed"
                    ]
                }
            ]);
            setRegister('aOptionalUpgradeSteps', [
                {
                    id: 1,
                    description: "Install example content",
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);

            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "started");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "finished");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "started");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "finished");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "check", "started");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "check", "finished");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "run", "started");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "run", "finished");

            const oRequestBody = {
                parameters: [
                    {
                        name: "optional",
                        value: "[ 1 ]"
                    },
                    {
                        name: "mode",
                        value: "upgrade"
                    }
                ]
            };

            const oBaseRelease = driver.readBaseRelease(oConnection);
            expect(oBaseRelease).toEqualObject({
                version: 2,
                version_sp: 0,
                version_patch: 1
            });

            const bIsFreshInstallation = driver.isFreshInstallation(oRequestBody);
            expect(bIsFreshInstallation).toEqual(false);


            const oParam = driver.processParameters(oRequestBody);
            expect(oParam).toEqualObject({
                optional: [ 1 ],
                mode: "upgrade"
            });

            const aMappedRegister = driver.getMappedRegister(bIsFreshInstallation, oConnection);
            expect(aMappedRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                }
            ]);

            const aOptionalRegister = driver.getOptionalRegister(oParam.optional, bIsFreshInstallation);
            expect(aOptionalRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);

            const currentStep = driver.getCurrentStep([ ...aMappedRegister, ...aOptionalRegister ], oConnection);
            expect(currentStep).toEqual(0);

            const aFinalSteps = driver.obtainFinalSteps(oRequestBody, oConnection);
            expect(aFinalSteps).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);
        });


        it("upgrade obtain final steps (recover from error)", () => {
            setRegister('aPreDatabaseSetUpUpgradeSteps', [
                {
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);
            setRegister('aDatabaseSetup', [
                "xs.postinstall.dummy_setup_method.setup_dummy_run_failure"
            ]);
            setRegister('aPostDatabaseSetupUpgradeSteps', [
                {
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    library: [
                        "xs.postinstall.release_independent.99_setup_completed"
                    ]
                }
            ]);
            setRegister('aOptionalUpgradeSteps', [
                {
                    id: 1,
                    description: "Install example content",
                    library: [
                        "xs.postinstall.dummy_setup_method.setup_dummy_always_success"
                    ]
                }
            ]);

            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "started");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "finished");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "started");
            logRegister(2, 0, 1, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "finished");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "check", "started");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "check", "finished");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "run", "started");
            logRegister(2, 0, 1, "xs.postinstall.release_independent.99_setup_completed", "run", "finished");

            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "started");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "check", "finished");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "started");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_always_success", "run", "finished");

            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "check", "started");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "check", "finished");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "run", "started");
            logRegister(2, 3, 0, "xs.postinstall.dummy_setup_method.setup_dummy_run_failure", "run", "error");

            const oRequestBody = {
                parameters: [
                    {
                        name: "optional",
                        value: "[ 1 ]"
                    },
                    {
                        name: "mode",
                        value: "upgrade"
                    }
                ]
            };

            const oBaseRelease = driver.readBaseRelease(oConnection);
            expect(oBaseRelease).toEqualObject({
                version: 2,
                version_sp: 0,
                version_patch: 1
            });

            const bIsFreshInstallation = driver.isFreshInstallation(oRequestBody);
            expect(bIsFreshInstallation).toEqual(false);


            const oParam = driver.processParameters(oRequestBody);
            expect(oParam).toEqualObject({
                optional: [ 1 ],
                mode: "upgrade"
            });

            const aMappedRegister = driver.getMappedRegister(bIsFreshInstallation, oConnection);
            expect(aMappedRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                }
            ]);

            const aOptionalRegister = driver.getOptionalRegister(oParam.optional, bIsFreshInstallation);
            expect(aOptionalRegister).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);

            const currentStep = driver.getCurrentStep([ ...aMappedRegister, ...aOptionalRegister ], oConnection);
            expect(currentStep).toEqual(2);
            const aFinalSteps = driver.obtainFinalSteps(oRequestBody, oConnection);
            expect(aFinalSteps).toEqualObject([
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_run_failure",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_run_failure",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: null
                },
                {
                    library_full_name: "xs.postinstall.release_independent.99_setup_completed",
                    library_package: "xs.postinstall.release_independent",
                    library_name: "99_setup_completed",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch,
                    description: "Complete setup"
                },
                {
                    library_full_name: "xs.postinstall.dummy_setup_method.setup_dummy_always_success",
                    library_package: "xs.postinstall.dummy_setup_method",
                    library_name: "setup_dummy_always_success",
                    version: driver.version,
                    version_sp: driver.version_sp,
                    version_patch: driver.version_patch
                }
            ]);
        });
    });
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);