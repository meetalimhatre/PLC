const _ = require("lodash");
const ProjectService = require("../../../lib/xs/service/projectService");
const LifecycleInterval = require("../../../lib/xs/util/constants").LifecycleInterval;

describe('xsjs.service.projectService-tests', () => {

	describe("calculateLifecyclePeriodFrom", () => {

		var mDatesToExpectedPeriodFromYearly = {
			// first year from 1900 to check important first values
			"1900-01-01": 0,
			"1900-02-01": 0,
			"1900-03-01": 0,
			"1900-04-01": 0,
			"1900-05-01": 0,
			"1900-06-01": 0,
			"1900-07-01": 0,
			"1900-08-01": 0,
			"1900-09-01": 0,
			"1900-10-01": 0,
			"1900-11-01": 0,
			"1900-12-01": 0,
			"1901-01-01": 12,
			"1901-02-01": 12,
			// values to see if day is ignored
			"1900-01-02": 0,
			"1900-05-30": 0,
			// some more practical values from the application
			"2017-01-01": 1404,
			"2017-06-01": 1404,
			"2017-06-11": 1404,
			"2018-01-01": 1416,
			// some values beyond the lifetime of plc (dates must be ignored as well)
			"2027-10-24": 1524,
			"2074-08-11": 2088,
			"2112-05-04": 2544
		};

		var mDatesToExpectedPeriodFromQuaterly = {
			// first year from 1900 to check important first values
			"1900-01-01": 0,
			"1900-02-01": 0,
			"1900-03-01": 0,
			"1900-04-01": 3,  
			"1900-05-01": 3,
			"1900-06-01": 3,
			"1900-07-01": 6,
			"1900-08-01": 6,
			"1900-09-01": 6,
			"1900-10-01": 9,
			"1900-11-01": 9,
			"1900-12-01": 9,
			"1901-01-01": 12,
			"1901-02-01": 12,
			// values to see if day is ignored
			"1900-01-02": 0,
			"1900-05-30": 3,
			// some more practical values from the application
			"2017-01-01": 1404, //(2017 - 1900) * 12 + 0 since Jan is the first month in quater
			"2017-06-01": 1407, //(2017 - 1900) * 12 + 3 since April is the first month in quater
			"2017-06-11": 1407, //(2017 - 1900) * 12 + 3 since April is the first month in quater
			"2018-01-01": 1416,
			// some values beyond the lifetime of plc (dates must be ignored as well)
			"2027-10-24": 1533, //(2027 - 1900) * 12 + 9 since Oct is the first month in quater
			"2074-08-11": 2094, //(2074 - 1900) * 12 + 6 since Jul is the first month in quater
			"2112-05-04": 2547 //(2112 - 1900) * 12 + 3 since April is the first month in quater
		};

		var mDatesToExpectedPeriodFromMonthly = {
			// first year from 1900 to check important first values
			"1900-01-01": 0,
			"1900-02-01": 1,
			"1900-03-01": 2,
			"1900-04-01": 3,
			"1900-05-01": 4,
			"1900-06-01": 5,
			"1900-07-01": 6,
			"1900-08-01": 7,
			"1900-09-01": 8,
			"1900-10-01": 9,
			"1900-11-01": 10,
			"1900-12-01": 11,
			"1901-01-01": 12,
			"1901-02-01": 13,
			// values to see if day is ignored
			"1900-01-02": 0,
			"1900-05-30": 4,
			// some more practical values from the application
			"2017-01-01": 1404,
			"2017-06-01": 1409,
			"2017-06-11": 1409,
			"2018-01-01": 1416,
			// some values beyond the lifetime of plc (dates must be ignored as well)
			"2027-10-24": 1533,
			"2074-08-11": 2095,
			"2112-05-04": 2548
		};

		it("should ignore months when calculating lifecycle_period_from if the LifecycleInterval is yearly", () => {
			_.each(mDatesToExpectedPeriodFromYearly, (iExpectedValue, sDate) => {
				// arrange
				var dDateToTest = new Date(sDate);

				// act
				var iReturnedValue = ProjectService.calculateLifecyclePeriodFrom(dDateToTest, LifecycleInterval.YEARLY);

				//assert
				jasmine.log(`Checking ${sDate}: Should be ${iExpectedValue} and is ${iReturnedValue}`);
				expect(iReturnedValue).toEqual(iExpectedValue);
			})
		});

		it("should not ignore months when calculating lifecycle_period_from if the LifecycleInterval is quarterly", () => {
			_.each(mDatesToExpectedPeriodFromQuaterly, (iExpectedValue, sDate) => {
				// arrange
				var dDateToTest = new Date(sDate);

				// act
				var iReturnedValue = ProjectService.calculateLifecyclePeriodFrom(dDateToTest, LifecycleInterval.QUARTERLY);
				
				//assert
				jasmine.log(`Checking ${sDate}: Should be ${iExpectedValue} and is ${iReturnedValue}`);
				expect(iReturnedValue).toEqual(iExpectedValue);
			})
		});

		it("should not ignore months when calculating lifecycle_period_from if the LifecycleInterval is monthly", () => {
			_.each(mDatesToExpectedPeriodFromMonthly, (iExpectedValue, sDate) => {
				// arrange
				var dDateToTest = new Date(sDate);

				// act
				var iReturnedValue = ProjectService.calculateLifecyclePeriodFrom(dDateToTest, LifecycleInterval.MONTHLY);
				
				//assert
				jasmine.log(`Checking ${sDate}: Should be ${iExpectedValue} and is ${iReturnedValue}`);
				expect(iReturnedValue).toEqual(iExpectedValue);
			})
		});
	});

}).addTags(["All_Unit_Tests"]);