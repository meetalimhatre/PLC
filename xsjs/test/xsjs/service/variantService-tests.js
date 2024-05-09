if (jasmine.plcTestRunParameters.mode === "all") {
    describe("xsjs.service.variantService-tests", () => {
        const VariantService = require("../../../lib/xs/service/variantService");
        const MessageLibrary = require("../../../lib/xs/util/message");
        const PlcException = MessageLibrary.PlcException;
        let oPersistencyMock;
        let oPersistencyCalculationVersionMock;
        let oPersistencyVariantMock;

        beforeEach(() => {
            oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
            oPersistencyMock.getConnection.and.returnValue({ commit() {} });
        });
        describe("checkQuantityStateValues", () => {
            var aItems = [{
                "ITEM_ID": 1,
                "QUANTITY": 10,
                "IS_INCLUDED": 1,
                "QUANTITY_STATE": 1,
                "QUANTITY_UOM_ID": "PC",
                "VARIANT_ID": -1
            },{
                "ITEM_ID": 2,
                "QUANTITY": 10,
                "IS_INCLUDED": 1,
                "QUANTITY_STATE": 1,
                "QUANTITY_UOM_ID": "PC",
                "VARIANT_ID": -1
            },{
                "ITEM_ID": 3,
                "QUANTITY": 10,
                "IS_INCLUDED": 1,
                "QUANTITY_STATE": 0,
                "QUANTITY_UOM_ID": "PC",
                "VARIANT_ID": -1
            },{
                "ITEM_ID": 4,
                "QUANTITY": 10,
                "IS_INCLUDED": 1,
                "QUANTITY_STATE": 0,
                "QUANTITY_UOM_ID": "PC",
                "VARIANT_ID": -1
            },{
                "ITEM_ID": 5,
                "QUANTITY": 10,
                "IS_INCLUDED": 1,
                "QUANTITY_STATE": 0,
                "QUANTITY_UOM_ID": "PC",
                "VARIANT_ID": -1
            }]
            beforeEach(() => {
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["getVersionRootItemId"]);
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
                oPersistencyItemMock = jasmine.createSpyObj("oPersistencyItemMock", ["getItemIdsOfCategory"]);
                oPersistencyMock.Item = oPersistencyItemMock;
            });

            it("should not return anything if valid values are  assigned for QUANTITY STATE", () => {
                // arrange
                let result;
                let exception;
                oPersistencyCalculationVersionMock.getVersionRootItemId.and.returnValue([{"ROOT_ITEM_ID" : 1}]);
                oPersistencyItemMock.getItemIdsOfCategory.and.returnValue([2]);
                // act
                try {
                    result = VariantService.checkQuantityStateValues(oPersistencyMock, aItems, 1);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });

            it("should throw GENERAL_VALIDATION_ERROR is quantity state is not MANUAL(1) for category text", () => {
                // arrange
                let exception = null;
                oPersistencyCalculationVersionMock.getVersionRootItemId.and.returnValue([{"ROOT_ITEM_ID" : 1}]);
                oPersistencyItemMock.getItemIdsOfCategory.and.returnValue([5]); //ITEM_ID 5 quantity state is not MANUAL
                // act
                try {
                    VariantService.checkQuantityStateValues(oPersistencyMock, aItems, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });

            it("should throw GENERAL_VALIDATION_ERROR is quantity state is not manual for root item", () => {
                // arrange
                let exception = null;
                oPersistencyCalculationVersionMock.getVersionRootItemId.and.returnValue([{"ROOT_ITEM_ID" : 4}]);
                oPersistencyItemMock.getItemIdsOfCategory.and.returnValue([2]);
                // act
                try {
                    VariantService.checkQuantityStateValues(oPersistencyMock, aItems, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.GENERAL_VALIDATION_ERROR);
            });
        });
        describe("checkCalculationVersionExists", () => {
            beforeEach(() => {
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["exists"]);
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });

            it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if the calculation version does not exist", () => {
                // arrange
                let exception = null;
                oPersistencyCalculationVersionMock.exists.and.returnValue(false);
                // act
                try {
                    VariantService.checkCalculationVersionExists(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
            });

            it("should not return anything if the calculation version exists", () => {
                // arrange
                let result;
                let exception;
                oPersistencyCalculationVersionMock.exists.and.returnValue(true);
                // act
                try {
                    result = VariantService.checkCalculationVersionExists(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
        describe("checkVariantExists", () => {
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getVariant"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
            });

            it("should throw GENERAL_ENTITY_NOT_FOUND_ERROR if the variant does not exist", () => {
                // arrange
                let exception = null;
                let notDefinedResponse;
                oPersistencyVariantMock.getVariant.and.returnValue(notDefinedResponse);
                // act
                try {
                    VariantService.checkVariantExists(oPersistencyMock, 1, 1);
                } catch (e) {
                    exception = e;
                }

                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
            });

            it("should not return anything if the variant exists", () => {
                // arrange
                let result;
                let exception;
                oPersistencyVariantMock.getVariant.and.returnValue(true);
                // act
                try {
                    result = VariantService.checkVariantExists(oPersistencyMock, 1, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
        describe("checkConcurrentVariantMatrixLock", () => {
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["isLockedInAConcurrentVariantContext"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
            });

            it("should throw ENTITY_NOT_WRITABLE_ERROR if the calculation version is locked in context of variant matrix", () => {
                // arrange
                let exception = null;
                oPersistencyVariantMock.isLockedInAConcurrentVariantContext.and.returnValue(true);
                // act
                try {
                    VariantService.checkConcurrentVariantMatrixLock(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR);
            });

            it("should not return anything if the calculation version exists", () => {
                // arrange
                let result;
                let exception;
                oPersistencyVariantMock.isLockedInAConcurrentVariantContext.and.returnValue(false);
                // act
                try {
                    result = VariantService.checkConcurrentVariantMatrixLock(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
        describe("isVariantNameUnique", () => {
            const aExistingVariants = [{
                VARIANT_ID: 1,
                CALCULATION_VERSION_ID: 1,
                REPORT_CURRENCY_ID: "EUR",
                VARIANT_NAME: "Variant",
            }];
            beforeEach(() => {
                oPersistencyVariantMock = jasmine.createSpyObj("oPersistencyVariantMock", ["getVariants"]);
                oPersistencyMock.Variant = oPersistencyVariantMock;
            });

            it("should throw VARIANT_NAME_NOT_UNIQUE_ERROR if the variant name already exists for the given calculation version (CREATE)", () => {
                // arrange
                let exception = null;
                const sExistingVariantName = "Variant";
                oPersistencyVariantMock.getVariants.and.returnValue(aExistingVariants);
                // act
                try {
                    VariantService.isVariantNameUnique(sExistingVariantName, 1, oPersistencyMock);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.VARIANT_NAME_NOT_UNIQUE_ERROR);
            });

            it("should throw VARIANT_NAME_NOT_UNIQUE_ERROR if the variant name already exists for the given calculation version (UPDATE)", () => {
                // arrange
                let exception = null;
                const sExistingVariantName = "Variant";
                oPersistencyVariantMock.getVariants.and.returnValue(aExistingVariants);
                // act
                try {
                    VariantService.isVariantNameUnique(sExistingVariantName, 1, oPersistencyMock, 3);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.VARIANT_NAME_NOT_UNIQUE_ERROR);
            });

            it("should not return anything if the variant name is unique in the context of the given calculation version (CREATE)", () => {
                // arrange
                let exception;
                let result;
                const sExistingVariantName = "Variant1213";
                oPersistencyVariantMock.getVariants.and.returnValue(aExistingVariants);
                // act
                try {
                    result = VariantService.isVariantNameUnique(sExistingVariantName, 1, oPersistencyMock);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });

            it("should not throw an error if the variant name is duplicated for the same variant id (UPDATE)", () => {
                // arrange
                let exception;
                let result;
                const sExistingVariantName = "Variant";
                oPersistencyVariantMock.getVariants.and.returnValue(aExistingVariants);
                // act
                try {
                    result = VariantService.isVariantNameUnique(sExistingVariantName, 1, oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
        describe("checkVersionIsNotLifecycleVersion", () => {
            beforeEach(() => {
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["isLifecycleVersion"]);
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });

            it("should throw ENTITY_NOT_WRITABLE_ERROR if the calculation version is a lifecycle version", () => {
                // arrange
                let exception = null;
                oPersistencyCalculationVersionMock.isLifecycleVersion.and.returnValue(true);
                // act
                try {
                    VariantService.checkVersionIsNotLifecycleVersion(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR);
            });

            it("should not return anything if the calculation version is not a lifecycle version", () => {
                // arrange
                let result;
                let exception;
                oPersistencyCalculationVersionMock.isLifecycleVersion.and.returnValue(false);
                // act
                try {
                    result = VariantService.checkVersionIsNotLifecycleVersion(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
        describe("checkVersionIsNotFrozen", () => {
            beforeEach(() => {
                oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", ["isFrozen"]);
                oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
            });

            it("should throw ENTITY_NOT_WRITABLE_ERROR if the calculation version is frozen", () => {
                // arrange
                let exception = null;
                oPersistencyCalculationVersionMock.isFrozen.and.returnValue(true);
                // act
                try {
                    VariantService.checkVersionIsNotFrozen(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(exception instanceof PlcException).toBe(true);
                expect(exception.code).toBe(MessageLibrary.Code.ENTITY_NOT_WRITABLE_ERROR);
            });

            it("should not return anything if the calculation version is not frozen", () => {
                // arrange
                let result;
                let exception;
                oPersistencyCalculationVersionMock.isFrozen.and.returnValue(false);
                // act
                try {
                    result = VariantService.checkVersionIsNotFrozen(oPersistencyMock, 1);
                } catch (e) {
                    exception = e;
                }
                // assert
                expect(result).toBeUndefined();
                expect(exception).toBeUndefined();
            });
        });
    }).addTags(["All_Unit_Tests"]);
}
