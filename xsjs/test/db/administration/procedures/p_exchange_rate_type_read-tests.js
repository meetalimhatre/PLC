const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const _ = require("lodash");
const Constants = require("../../../../lib/xs/util/constants");
const sDefaultExchangeRateType = Constants.sDefaultExchangeRateType;


if (jasmine.plcTestRunParameters.mode === 'all') {
    describe('db.administration:p_exchange_rate_type_read', function () {

        var oMockstarPlc = null;

        var sMasterdataTimestamp = new Date().toJSON();
        var sCreatedOn = '2015-01-01T15:39:09.691Z';
        var sLastModifiedOn = '2015-06-01T15:39:09.691Z';
        var sLanguage = 'EN';
        var sUser = '#CONTROLLER'

        var oExchangeRateType = {
            "EXCHANGE_RATE_TYPE_ID": [sDefaultExchangeRateType, 'AVG'],
            "CREATED_ON": [sCreatedOn, sCreatedOn],
            "CREATED_BY": [sUser, sUser],
            "LAST_MODIFIED_ON": [sLastModifiedOn, sLastModifiedOn],
            "LAST_MODIFIED_BY": [sUser, sUser]
        };

        var oExchangeRateTypeText = {
            "EXCHANGE_RATE_TYPE_ID": [sDefaultExchangeRateType, 'AVG'],
            "LANGUAGE": [sLanguage, sLanguage],
            "EXCHANGE_RATE_TYPE_DESCRIPTION": ["Standard rate", "Average rate"],
            "CREATED_ON": [sCreatedOn, sCreatedOn],
            "CREATED_BY": [sUser, sUser],
            "LAST_MODIFIED_ON": [sLastModifiedOn, sLastModifiedOn],
            "LAST_MODIFIED_BY": [sUser, sUser]
        };

        beforeAll(function () {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.administration.procedures/p_exchange_rate_type_read", // procedure or view under test
                substituteTables: { // substitute all used tables in the procedure or view
                    exchange_rate_type: {
                        name: "sap.plc.db::basis.t_exchange_rate_type",
                        data: oExchangeRateType
                    },
                    exchange_rate_type_text: {
                        name: "sap.plc.db::basis.t_exchange_rate_type__text",
                        data: oExchangeRateTypeText
                    }
                }
            });
        });
        beforeEach(function () {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(function () {
        });

        it('should return only correct exchange rate types', function () {
            //arrange
            //act 
            var procedure = oMockstarPlc.loadProcedure();
            var result = procedure(sLanguage, sMasterdataTimestamp, '', 100, 0);

            //assert
            var actualExchangeRateType = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
            var expectedExchangeRateType = JSON.parse(JSON.stringify(oExchangeRateType));

            var expectedExchangeRateTypeWithoutDates = _.omit(expectedExchangeRateType, ["CREATED_ON", "LAST_MODIFIED_ON"]);

            expect(actualExchangeRateType.length).toBe(2);
            expect(actualExchangeRateType).toMatchData(expectedExchangeRateTypeWithoutDates, ["EXCHANGE_RATE_TYPE_ID", "CREATED_BY", "LAST_MODIFIED_BY"]);
            expect(actualExchangeRateType[0].CREATED_ON.toString()).toBe(new Date((expectedExchangeRateType.CREATED_ON[0])).toString());
            expect(actualExchangeRateType[0].LAST_MODIFIED_ON.toString()).toBe(new Date((expectedExchangeRateType.LAST_MODIFIED_ON[0])).toString());
        });

        it('should return correct after skip', function () {
            //act 
            var iSkip = 1;
            var procedure = oMockstarPlc.loadProcedure();
            var result = procedure(sLanguage, sMasterdataTimestamp, '', 100, iSkip);

            //assert
            var actualExchangeRateType = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
            var actualExchangeRateTypeText = Array.slice(result.OT_EXCHANGE_RATE_TYPE_TEXT);

            expect(actualExchangeRateType.length).toBe(oExchangeRateType.EXCHANGE_RATE_TYPE_ID.length - iSkip);
            expect(actualExchangeRateTypeText.length).toBe(oExchangeRateTypeText.EXCHANGE_RATE_TYPE_ID.length - iSkip);
        });

        it('should return correct exchange rate types if top parameter is set to 1', function () {
            //act 
            var iTop = 1;
            var procedure = oMockstarPlc.loadProcedure();
            var result = procedure(sLanguage, sMasterdataTimestamp, '', iTop, 0);

            //assert
            var actualExchangeRateType = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
            var actualExchangeRateTypeText = Array.slice(result.OT_EXCHANGE_RATE_TYPE_TEXT);

            expect(actualExchangeRateType.length).toBe(iTop);
            expect(actualExchangeRateTypeText.length).toBe(iTop);
        });

        it('should return no exchange rate types if top parameter is set to 0', function () {
            //act 
            var iTop = 0;
            var procedure = oMockstarPlc.loadProcedure();
            var result = procedure(sLanguage, sMasterdataTimestamp, '', iTop, 0);

            //assert
            var actualExchangeRateType = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
            var actualExchangeRateTypeText = Array.slice(result.OT_EXCHANGE_RATE_TYPE_TEXT);

            expect(actualExchangeRateType.length).toBe(iTop);
            expect(actualExchangeRateTypeText.length).toBe(iTop);
        });

        it('should return only correct exchange rate types when filtering EXCHANGE_RATE_TYPE_ID', function () {
            //act 
            var procedure = oMockstarPlc.loadProcedure();
            var result = procedure(sLanguage, sMasterdataTimestamp, "EXCHANGE_RATE_TYPE_ID = 'AVG'", 100, 0);

            //assert
            var actualExchangeRateType = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
            expect(actualExchangeRateType.length).toBe(1);
        });

    }).addTags(["All_Unit_Tests"]);
}
