/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;


if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('sap.plc.db.management.procedures::p_unlock_masterdata-integrationtests', function() {

		var sLockingUser1 = "User 1";
		var sLastUpdateTime = new Date();
		var oLockData = {        
				"LOCK_OBJECT": ["Lock 1", "Lock 2"],
				"USER_ID": [sLockingUser1, "User 2"],
				"LAST_UPDATED_ON": [sLastUpdateTime, sLastUpdateTime]
		};

		var mockstar = null;
		beforeOnce(function() {
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel: "sap.plc.db.management.procedures/p_unlock_masterdata",
						substituteTables: {
							lock: {
								name: "sap.plc.db::basis.t_lock",
								data: oLockData
							}
						}
					});
		});

		afterOnce(function() {
			mockstar.cleanup("sap.plc.db.management.procedures");
		});

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			mockstar.initializeData();
		});

		it("should delete the lock of any administration data  of the given user", function() {
			// act
			var result = mockstar.call(sLockingUser1);

			// assert
			var result = mockstar.execQuery("select lock_object, user_id, last_updated_on from {{lock}}");
			expect(result).toMatchData({
				LOCK_OBJECT:     ["Lock 2"],
				USER_ID :   ["User 2"],
				LAST_UPDATED_ON : [sLastUpdateTime]
			}, ["LOCK_OBJECT", "USER_ID"]);

		});

		it("should delete the lock of any administration data of the given user independent of uppper/lower case spelling", function() {
			// act
			var result = mockstar.call("usEr 1");        

			// assert
			var result = mockstar.execQuery("select lock_object, user_id, last_updated_on from {{lock}}");
			expect(result).toMatchData({
				LOCK_OBJECT:     ["Lock 2"],
				USER_ID :   ["User 2"],
				LAST_UPDATED_ON : [sLastUpdateTime]
			}, ["LOCK_OBJECT", "USER_ID"]);

		});

		it("should not delete any lock of any administration data  if the given user has not locked anything", function() {
			// act
			var result = mockstar.call("someBodyElse");

			// assert
			var result = mockstar.execQuery("select lock_object, user_id, last_updated_on from {{lock}}");
			expect(result).toMatchData(oLockData, ["LOCK_OBJECT", "USER_ID", "LAST_UPDATED_ON"]);

		});

	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}