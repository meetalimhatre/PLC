const businessObjectValidatorFactory = $.import("xs.validator", "businessObjectValidatorFactory").BusinessObjectValidatorFactory;
const BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;

describe("xsjs.validator.businessObjectValidator-tests", () => {
    let oPersistencyMock;
    let sBusinessObjectType;

    beforeEach(() => {
        oPersistencyMock = {};
    });

    afterOnce(() => {
    });

    it("should return a DataProtectionValidator-instance if the BusinessObjectType to be validated is 'DataProtection'", () => {
        // arrange
        const sSessionId = "TestSession";
        sBusinessObjectType = BusinessObjectTypes.DataProtection;
        // act
        const result = businessObjectValidatorFactory.createBusinessObjectValidator(sBusinessObjectType, oPersistencyMock, sSessionId);
        // assert
        expect(typeof result).toEqual("object");
        expect(result.constructor.name).toEqual("DataProtectionValidator");
    });
}).addTags(["All_Unit_Tests"]);
