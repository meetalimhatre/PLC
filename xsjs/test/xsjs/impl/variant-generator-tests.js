if (jasmine.plcTestRunParameters.mode === "all") {
    describe("xsjs.impl.variant-generator-tests", () => {
        const VariantGenerator = new (require("../../../lib/xs/impl/variant-generator").VariantGenerator)($);
        const AuthorizationManager = require("../../../lib/xs/authorization/authorization-manager");
        let oPersistencyMock;
        let oPersistencyCalculationVersionMock;
        let oPersistencyVariantMock;

        beforeEach(() => {
            oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
            oPersistencyMock.getConnection.and.returnValue({ commit() {} });
        });
        describe("getBaseOrLastGeneratedCalculationId", () => {
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getVariant"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["getWithoutItemsPersistent"]);
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });
            const oVariant = {
                LAST_GENERATED_CALCULATION_ID: 10,
            };
            const oVariantNullResult = {
                LAST_GENERATED_CALCULATION_ID: null,
            };
            const iBaseVersionId = 5;
            const aVersion = [{
                CALCULATION_ID: iBaseVersionId,
            }];

            const iNoBaseCalculationResult = -1;
            it("should return the LAST_GENERATED_CALCULATION_ID", () => {
                // arrange
                spyOn(AuthorizationManager, "checkPrivilege").and.returnValue();
                oPersistencyVariantMock.getVariant.and.returnValue(oVariant);
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aVersion);

                // act

                const iResult = VariantGenerator.getBaseOrLastGeneratedCalculationId(oPersistencyMock, 1, 1);

                // assert
                expect(iResult).toBe(oVariant.LAST_GENERATED_CALCULATION_ID);
            });

            it("should return the base calculation id if LAST_GENERATED_CALCULATION_ID is null", () => {
                // arrange
                oPersistencyVariantMock.getVariant.and.returnValue(oVariantNullResult);
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aVersion);
                // act

                const iResult = VariantGenerator.getBaseOrLastGeneratedCalculationId(oPersistencyMock, 1, 1);

                // assert
                expect(iResult).toBe(iBaseVersionId);
            });

            it("should return -1 if both LAST_GENERATED_CALCULATION_ID and base calculation id don't exist", () => {
                // arrange
                oPersistencyVariantMock.getVariant.and.returnValue(oVariantNullResult);
                const aEmptyArrayResult = [];
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aEmptyArrayResult);
                // act

                const iResult = VariantGenerator.getBaseOrLastGeneratedCalculationId(oPersistencyMock, 1, 1);

                // assert
                expect(iResult).toBe(iNoBaseCalculationResult);
            });
        });
        describe("getCalculationVersionName", () => {
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getVariant"]);
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["isNameUnique"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });
            const sNewGeneratedVersionName = "Version1 - Variant1";
            const sRequestedVersionName = "Custom Version Name";

            it("should return the requested version name", () => {
                // arrange
                oPersistencyCalculationVersionMock.isNameUnique.and.returnValue(true);

                // act
                const sVersionName = VariantGenerator.getCalculationVersionName(oPersistencyMock, {}, sRequestedVersionName, 1);

                // assert
                expect(sVersionName).toBe(sRequestedVersionName);
            });
            it("should return the default generated name if there is no requested version name", () => {
                spyOn(VariantGenerator, "generateNewVersionName").and.returnValue(sNewGeneratedVersionName);
                // arrange
                oPersistencyCalculationVersionMock.isNameUnique.and.returnValue(true);

                // act
                const sVersionName = VariantGenerator.getCalculationVersionName(oPersistencyMock, {}, undefined, 1); //eslint-disable-line

                // assert
                expect(sVersionName).toBe(sNewGeneratedVersionName);
            });
            it("should return a new unique name if the version name already exists", () => {
                // arrange
                oPersistencyCalculationVersionMock.isNameUnique.and.returnValue(true);
                const sUniqueName = "NewUniqueVersioName";

                // With the help of callFake we can call the isNameUnique function twice. First it's false and the second time it's unique.
                let bIsNameUnique = false;
                oPersistencyCalculationVersionMock.isNameUnique.and.callFake(() => {
                    if (bIsNameUnique === false) {
                        bIsNameUnique = true;
                        return false;
                    }
                    return true;
                });
                // act
                const sVersionName = VariantGenerator.getCalculationVersionName(oPersistencyMock, {}, sUniqueName, 1); //eslint-disable-line

                // assert
                expect(sVersionName).toBe(`${sUniqueName} (1)`);
            });
        });
        describe("generateNewVersionName", () => {
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getVariant"]);
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["getWithoutItemsPersistent"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });
            const aVersion = [{
                CALCULATION_VERSION_NAME: "Version1",
            }];
            const oVariant = {
                VARIANT_NAME: "Variant1",
            };
            it("should return a new version name created form both the version and variant", () => {
                // arrange
                const sExpectedName = `${aVersion[0].CALCULATION_VERSION_NAME} - ${oVariant.VARIANT_NAME}`;
                oPersistencyVariantMock.getVariant.and.returnValue(oVariant);
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aVersion);

                // act
                const sResultName = VariantGenerator.generateNewVersionName(oPersistencyMock, 1, 1);

                // assert
                expect(sResultName).toBe(sExpectedName);
            });
            it("should return an empty string if getWithoutItemsPersistent returns no results", () => {
                // arrange
                oPersistencyVariantMock.getVariant.and.returnValue(undefined); //eslint-disable-line
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aVersion);

                // act
                const sResultName = VariantGenerator.generateNewVersionName(oPersistencyMock, 1, 1);

                // assert
                expect(sResultName).toBe("");
            });
            it("should return an empty string if getVariant returns no results", () => {
                // arrange
                const aEmptyArray = [];
                oPersistencyVariantMock.getVariant.and.returnValue(oVariant);
                oPersistencyCalculationVersionMock.getWithoutItemsPersistent.and.returnValue(aEmptyArray);

                // act
                const sResultName = VariantGenerator.generateNewVersionName(oPersistencyMock, 1, 1);

                // assert
                expect(sResultName).toBe("");
            });
        });
    }).addTags(["All_Unit_Tests"]);
}
