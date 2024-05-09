var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;

describe("db.calculationmanager.procedure.p_item_set_active_states-tests", function() {
	
	var mockstar = null;

	var sSessionId = "session";
	var iCvId = 0;

	// basic test data; does not have any definition for IS_ACTIVE since test suits shall define it in accordance to their needs;
	// constructs the following item tree:
	// 					 1
	//				   /  \
	// 			      2	   5	
	// 			    /  \
	// 			   3   4
	var oItemTemporaryBaseData = {
		"SESSION_ID"            : [sSessionId, sSessionId, sSessionId, sSessionId, sSessionId],
		"ITEM_ID"               : [1, 2, 3, 4, 5],
		"CALCULATION_VERSION_ID": [iCvId, iCvId, iCvId, iCvId, iCvId],
		"ITEM_CATEGORY_ID"      : [1, 1, 1, 1, 1],
		"CHILD_ITEM_CATEGORY_ID": [1, 1, 1, 1, 1],
		"PARENT_ITEM_ID"        : [null, 1, 2, 2, 1],
		"PREDECESSOR_ITEM_ID"   : [null, null, 3, 2],
		"IS_DIRTY"              : [0, 0, 0, 0, 0],
		"IS_DELETED"            : [0, 0, 0, 0, 0]
	};

	beforeOnce(function() {

		mockstar = new MockstarFacade( // Initialize Mockstar
			{
				testmodel: "sap.plc.db.calculationmanager.procedures/p_item_set_active_states", // procedure or view under test
				substituteTables: // substitute all used tables in the procedure or view
				{
					item_temporary: "sap.plc.db::basis.t_item_temporary",
					item_changed_active_state: "sap.plc.db::temp.gtt_item_changed_active_state",
				}
			});
	});

	function runTest(oChangedActiveStateData, mExpectedIsActiveChange, iImportFlag) {
		// the following is done in each test:
		// 1. select state in t_item_temporary before execution
		// 2. insert in gtt_item_changed_active_state
		// 3. run procedure
		// 4. check returned procedure output
		// 5. check t_item_temporary
		// 5.1 IS_ACTIVE flags are correct
		// 5.2 nothing else was modified
		
		iImportFlag = iImportFlag || 0;

		// arrange
		var oDbBefore = mockstar.execQuery(`select * from {{item_temporary}} where SESSION_ID = '${sSessionId}' order by item_id`);
		mockstar.insertTableData("item_changed_active_state", oChangedActiveStateData);

		// act
		var oProcedureOutput = mockstar.call(iCvId, sSessionId, iImportFlag, null);

		// assert
		var oDbAfter = mockstar.execQuery(`select * from {{item_temporary}} where SESSION_ID = '${sSessionId}' order by item_id`);

		jasmine.log("checking contents of the data base after execution of the procedure");
		var iDbRowsBefore = oDbBefore.columns.ITEM_ID.rows.length;
		var iDbRowsAfter = oDbAfter.columns.ITEM_ID.rows.length;
		jasmine.log(`expecting that no db rows were deleted by procedure. result length should be ${iDbRowsAfter} and is ${iDbRowsBefore}.`);
		expect(iDbRowsBefore).toEqual(iDbRowsAfter);
		var aDbColumns = _.keys(oDbBefore.columns);
		// use the rows for ITEM_ID to iterate over the entire result set; by this approach the item id and its corresponding index in the result set are made available;
		// the item id is needed to access the expected value for is_active; the index in the result for this item id is needed to access the db value
		jasmine.log("checking contents of t_item_temporary after the procedure execution. no properties should be changed except is_active for the affected items");
		_.each(oDbAfter.columns.ITEM_ID.rows, function(iItemId, iIndex) {
			// can be commented in for debugging
			// jasmine.log(`checking properties of item with id ${iItemId}`);
			_.each(aDbColumns, function(sColumnName) {
				var vActual = oDbAfter.columns[sColumnName].rows[iIndex];
				// for all properties the expected value is the same as before the procedure execution; only if the property is IS_ACTIVE and it was expected that this
				// item needs to change the active state the expected must be retrieved from mExpectedIsActiveChange
				var vExpected = oDbBefore.columns[sColumnName].rows[iIndex];
				if (sColumnName === "IS_ACTIVE" && _.has(mExpectedIsActiveChange, iItemId)) {
				    vExpected = mExpectedIsActiveChange[iItemId];
				    //jasmine.log(`checking is_active of item ${iItemId}. should be ${vExpected} and is ${vActual}`);
				}
				if (sColumnName === "IS_DIRTY" && _.has(mExpectedIsActiveChange, iItemId)) {
				        vExpected = 1; // IS_DIRTY is set to 1 - modified , for the items that changed active states
				}
				// can be commented in for debugging
				// jasmine.log(`checking property ${sColumnName}. value should be ${vExpected} and is ${vActual}.`);
				expect(vActual).toEqual(vExpected);
			});
		});

		jasmine.log("checking output of the procedure is inline with the state of the db");
		var iProcedureOutputLength = oProcedureOutput.length;
		var iExpectedOutputLength = _.keys(mExpectedIsActiveChange).length;
		jasmine.log(`checking if the procedure output has the same length as the number of items with expected is_active state changed. should be ${iExpectedOutputLength} and is {iProcedureOutputLength}`);
		expect(iProcedureOutputLength).toEqual(iExpectedOutputLength);
		_.each(oProcedureOutput, function(obj, iIndex) {
			var bProcedureOutputContainsItemId = _.has(mExpectedIsActiveChange, obj.ITEM_ID);
			jasmine.log(`checking if item_id ${obj.ITEM_ID} is expected procedure output.`);
			expect(bProcedureOutputContainsItemId).toBe(true);
		});
	}

	// the entire item tree is active
	describe("deactivate items", function() {

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views
			var builder = new TestDataUtility(oItemTemporaryBaseData);
			var aIsActiveFlags = _.map(oItemTemporaryBaseData.ITEM_ID, function() {
				return 1;
			});
			var oAllItemsActiveTestData = builder.extend({
				IS_ACTIVE: aIsActiveFlags
			}).build();
			mockstar.insertTableData("item_temporary", oAllItemsActiveTestData);
		});

		it("should deactivate no other items if is_active = 0 is set for item 3 (leaf item)", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [3],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [0]
			};

			var mExpectedIsActiveChange = {
				3: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate no other items if is_active = 0 is set for item 4 (leaf item)", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [4],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [0]
			};
			var mExpectedIsActiveChange = {
				4: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate item 2 if is_active = 0 is set for item 3 and 4 (all children of item 2)", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [3, 4],
				"PARENT_ITEM_ID": [2, 2],
				"IS_ACTIVE": [0, 0]
			};
			var mExpectedIsActiveChange = {
				2: 0,
				3: 0,
				4: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate item 2 if is_active = 0 is set for item 3 and item 4 is deleted", function() {
			// arrange
			// this test ensures that only not deleted child items are considered to determine if an assembly 
			// has active child items
			mockstar.clearTable("item_temporary");
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [1, 1, 1, 1, 1],
				IS_DELETED: [0, 0, 0, 1, 0] // delete item 4 from the test data => item 4 was removed from t_item_temporary
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [3],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [0]
			};
			var mExpectedIsActiveChange = {
				2: 0,
				3: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate also item 3 and 4 if is_active = 0  is set for item 2", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [2],
				"PARENT_ITEM_ID": [1],
				"IS_ACTIVE": [0]
			};
			var mExpectedIsActiveChange = {
				2: 0,
				3: 0,
				4: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate item 1, 3 and 4 if is_active = 0 is set for item 2 and 5", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [2, 5],
				"PARENT_ITEM_ID": [1, 1],
				"IS_ACTIVE": [0, 0]
			};
			var mExpectedIsActiveChange = {
				1: 0,
				2: 0,
				3: 0,
				4: 0,
				5: 0
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should deactivate item 1, 2, 3, 4 and 5 if is_active = 0 is set for item 1", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [1],
				"PARENT_ITEM_ID": [null],
				"IS_ACTIVE": [0]
			};
			var mExpectedIsActiveChange = {
				1: 0,
				2: 0,
				3: 0,
				4: 0,
				5: 0
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});
		
		it("should also deactivate item 4 if is_active = 0 for item 2 and 3 and iv_preserve_substructures_flag = 0", function() {
			// passing this structure to the procedure a mass change of item 2 and 3, where item 3 was copied as inactive item
			var oChangedActiveStateData = {
				"ITEM_ID"       : [2, 3],
				"PARENT_ITEM_ID": [1, 2],
				"IS_ACTIVE"     : [0, 0]
			};

			// since there is no change on is_active for item 3 (=0) and item 2 (=1) only item 1 is expected in the output
			var mExpectedIsActiveChange = {
				2: 0,
				3: 0,
				4: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange, 0);
		});
	});

	describe("activate items", function() {
		beforeEach(function() {
			var builder = new TestDataUtility(oItemTemporaryBaseData);
			var aIsActiveFlags = _.map(oItemTemporaryBaseData.ITEM_ID, function() {
				return 0;
			});
			var oAllItemsDeactiveTestData = builder.extend({
				IS_ACTIVE: aIsActiveFlags
			}).build();
			mockstar.insertTableData("item_temporary", oAllItemsDeactiveTestData);
		});

		it("should activate items 1, 2 and 3 if is_active = 1 is set for item 3", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [3],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should activate items 1, 2 and 4 if is_active = 1 is set for item 4", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [4],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				4: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should activate item 1, 2, 3 and 4 if is_active = 1 is set for item 3 and 4", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [3, 4],
				"PARENT_ITEM_ID": [2, 2],
				"IS_ACTIVE": [1, 1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1,
				4: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should activate items 1, 2, 3 and 4 if is_active = 1 is set for item 2", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [2],
				"PARENT_ITEM_ID": [1],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1,
				4: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should activate items 1, 2, 3, 4 and 5 if is_active = 1 is set for items 2 and 5", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [2, 5],
				"PARENT_ITEM_ID": [1, 1],
				"IS_ACTIVE": [1, 1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1,
				4: 1,
				5: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should activate children items 1, 2, 3, 4 and 5 if is_active = 1 is set for item 1", function() {
			var oChangedActiveStateData = {
				"ITEM_ID": [1],
				"PARENT_ITEM_ID": [null],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1,
				4: 1,
				5: 1
			}
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});
		
		it("should also activate items 1,4 if is_active = 1 for item 2 and 3 and iv_preserve_substructures_flag = 0", function() {
			// passing this structure to the procedure, as it would be for mass change of item 2 and 3
			var oChangedActiveStateData = {
				"ITEM_ID"       : [2, 3],
				"PARENT_ITEM_ID": [1, 2],
				"IS_ACTIVE"     : [1, 1]
			};

			var mExpectedIsActiveChange = {
				1: 1,
				2: 1,
				3: 1,
				4: 1
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange, 0);
		});

	});

	describe("delete items", function() {

		// REMARK: these tests are kind of redundant to deactivate the last active child or deactivate an assembly, however I want to make sure that the logic is 
		// also running if is_deleted = 0 for the modified item

		it("should not include item 4 in the result of the procedure if item 4 was deleted", function() {
			// arrange
			// this tests simulates the execution of the procedure after the an item was deleted (IS_DELETED set to 1); the procedure will be invoked with the 
			// deleted item (item 4 in this case), whereas the active state of the item was not set to 0 necessarily (IS_ACTIVE: [1])
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [1, 1, 1, 1, 1],
				IS_DELETED: [0, 0, 0, 1, 0] // delete item 4 from the test data => item 4 was removed from t_item_temporary
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [4],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should not include child items 3 and 4 in the result of the procedure if assembly item 2 is deteled", function() {
			// arrange
			// this tests simulates the execution of the procedure after the an assembly item was deleted; the procedure will be invoked with the 
			// deleted item 2, whereas the active state of the item was not set to 0 necessarily (IS_ACTIVE: [1])
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [1, 0, 1, 1, 1], // deactivate item 3; item 4 is active, but as last acitve child deleted in test data
				IS_DELETED: [0, 1, 1, 1, 0] // delete item 4 from the test data => item 4 was removed from t_item_temporary
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [2],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			// there is no item expected in the output; item 2, 3, 4 are all delete and must be excluded from the output; no change of their active states
			// either
			var mExpectedIsActiveChange = {};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});


		it("should deactivate item 2 if item 4 is removed as last active child of 2", function() {
			// arrange
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [1, 1, 0, 1, 1], // deactivate item 3; item 4 is active, but as last active child deleted in test data
				IS_DELETED: [0, 0, 0, 1, 0] // delete item 4 from the test data => item 4 was removed from t_item_temporary
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [4],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {
				2: 0
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		it("should not deactivate item 2 if item 3 and 4 are deleted from item 2, which is becoming an leaf item afterwards", function() {
			// arrange
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [1, 1, 0, 1, 1], // deactivate item 3; item 4 is active, but as last active child deleted in test data
				IS_DELETED: [0, 0, 1, 1, 0] // delete item 3,4 from the test data => item 2 is now a leaf item
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [4],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};
			var mExpectedIsActiveChange = {};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});


	});
	describe("add items", function() {

		it("should activate item 1, 2 if item 6 was added to the children of item 2 and all items are deactivated before", function() {
			// this test simulates the scenario that an item was added to an deactivated assembly item; in contrast to activating a deactivated child of an assembly 
			// (see above), the setup of the test is a little bit different; if an item is added to an assembly it is already marked as active in t_item_temporary
			// (if it would just be activated, is_active would be 0 in db table); since the procedure would not have to change the active state of item 6, it
			// MUST NOT be included in the output

			// arrange
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			// all items are deactivated
			var aInactivateFlags = _.map(oItemTemporaryBaseData.ITEM_ID, function() {
				return 0;
			});
			var oTestData = oBuilder.extend({
				IS_ACTIVE: aInactivateFlags
			}).addObject({
				"SESSION_ID": sSessionId,
				"ITEM_ID": 6,
				"CALCULATION_VERSION_ID": iCvId,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"PARENT_ITEM_ID": 2,
				"PREDECESSOR_ITEM_ID": 4,
				"IS_DIRTY": 0,
				"IS_DELETED": 0
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			var oChangedActiveStateData = {
				"ITEM_ID": [6],
				"PARENT_ITEM_ID": [2],
				"IS_ACTIVE": [1]
			};

			// the expected out put is item 1, 2: item 6 was added as active child to item 2 => item 2 must become active; item 2 is 
			// now an active child of item 1 => item 1 must become active; item 6 is already active in the table => no change no output
			var mExpectedIsActiveChange = {
				1: 1,
				2: 1
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange);
		});

		// the following tests simulate different import or copy/paste scenario in which item hierarchies are added to t_item_temporary and the procedure is called with this hierarchy as input;
		// in contrast to adding single items and other scenarios, the procedure MUST NOT touch the active states inside the input hierarchy (would mean that after paste the items
		// have different active states as copied); therefore an hierarchy of items is passed as input to the procedure in the next tests

		it("should not override active state of item 3 but activate item 1 if item 2, 3 and 4 are passed as input structure and iv_preserve_substructures_flag = 1", function() {
			// arrange
			var oBuilder = new TestDataUtility(oItemTemporaryBaseData);
			var oTestData = oBuilder.extend({
				IS_ACTIVE: [0, 1, 0, 1, 0], // deactivate all items except item 2 and 4
			}).build();
			mockstar.insertTableData("item_temporary", oTestData);

			// passing this structure to the procedure simulates the paste of item 2 and 3, where item 3 was copied as inactive item
			var oChangedActiveStateData = {
				"ITEM_ID": [2, 3, 4],
				"PARENT_ITEM_ID": [1, 2, 2],
				"IS_ACTIVE": [1, 0, 1]
			};

			// since there is no change on is_active for item 3 (=0) and item 2 (=1) only item 1 is expected in the output
			var mExpectedIsActiveChange = {
				1: 1
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange, 1);
		});

		it("should not override active state of item 3 and 6 but activate item 1 if item 2, 3, 4, 6 and 7 are passed as input structure and parameter iv_preserve_substructures_flag = 1", function() {
			// this test ensures that the active states are also preserved on the second hierarchy level of the passed item input structure
			
			// arrange
			// setup with a completely deactivated test item hierarchy
			var oTestData = new TestDataUtility(oItemTemporaryBaseData).extend({
				IS_ACTIVE: [0, 1, 0, 1, 0], // deactivate all items except item 2 and 4
			}).addObject({
				"SESSION_ID": sSessionId,
				"ITEM_ID": 6,
				"CALCULATION_VERSION_ID": iCvId,
				"IS_ACTIVE": 0,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"PARENT_ITEM_ID": 4,
				"PREDECESSOR_ITEM_ID": null,
				"IS_DIRTY": 0,
				"IS_DELETED": 0
			}).addObject({
				"SESSION_ID": sSessionId,
				"ITEM_ID": 7,
				"CALCULATION_VERSION_ID": iCvId,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 1,
				"CHILD_ITEM_CATEGORY_ID": 1,
				"PARENT_ITEM_ID": 4,
				"PREDECESSOR_ITEM_ID": null,
				"IS_DIRTY": 0,
				"IS_DELETED": 0
			}).build(); 
			mockstar.insertTableData("item_temporary", oTestData);

			// passing this structure to the procedure simulates the paste of item 2 and 3, where item 3 was copied as inactive item
			var oChangedActiveStateData = {
				"ITEM_ID": [2, 3, 4, 6, 7],
				"PARENT_ITEM_ID": [1, 2, 2, 4, 4],
				"IS_ACTIVE": [1, 0, 1, 0, 1]
			};

			// since there is no change on is_active for item 3 (=0) and item 2 (=1) only item 1 is expected in the output
			var mExpectedIsActiveChange = {
				1: 1
			};
			runTest(oChangedActiveStateData, mExpectedIsActiveChange, 1);
		});
	});
}).addTags(["All_Unit_Tests"]);