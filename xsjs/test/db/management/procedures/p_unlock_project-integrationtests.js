/*jslint undef:true*/
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;


if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('sap.plc.db.management.procedures::p_unlock_project-integrationtests', function() {

		var sLockedProjectId = "PR1";
		var oLockData = {        
				"SESSION_ID": ["USER1", "USER2", "USER3"],
				"PROJECT_ID": ["PR1", "PR1", "PR2"],
				"IS_WRITEABLE": [1, 0, 1]
		};

		var mockstar = null;
		beforeOnce(function() {
			mockstar = new MockstarFacade( // Initialize Mockstar
					{
						testmodel: "sap.plc.db.management.procedures/p_unlock_project",
						substituteTables: {
							open_projects: {
								name: "sap.plc.db::basis.t_open_projects",
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

		it("should delete the lock of any project data  of the given project id", function() {
			// act
			var result = mockstar.call(sLockedProjectId);

			// assert
			var result = mockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
			expect(result).toMatchData({
				"SESSION_ID": ["USER1", "USER2", "USER3"],
				"PROJECT_ID": ["PR1", "PR1", "PR2"],
				"IS_WRITEABLE": [0, 0, 1]
			}, ["SESSION_ID", "PROJECT_ID", "IS_WRITEABLE"]);

		});

		it("should delete the lock of any project data of the given project id independent of uppper/lower case spelling", function() {
			// act
			var result = mockstar.call("pR2");        

			// assert
			var result = mockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
			expect(result).toMatchData({
				"SESSION_ID": ["USER1", "USER2", "USER3"],
				"PROJECT_ID": ["PR1", "PR1", "PR2"],
				"IS_WRITEABLE": [1, 0, 0]
			}, ["SESSION_ID", "PROJECT_ID", "IS_WRITEABLE"]);

		});

		it("should not delete any lock of any project data  if the given project is not valid", function() {
			// act
			var result = mockstar.call("notALockedProject");

			// assert
			var result = mockstar.execQuery("select session_id, project_id, is_writeable from {{open_projects}}");
			expect(result).toMatchData({
				"SESSION_ID": ["USER1", "USER2", "USER3"],
				"PROJECT_ID": ["PR1", "PR1", "PR2"],
				"IS_WRITEABLE": [1, 0, 1]
			}, ["SESSION_ID", "PROJECT_ID", "IS_WRITEABLE"]);

		});

	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}
