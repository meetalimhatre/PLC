var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;
var testDataGenerator = require("../../testdata/testdataGenerator");
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var PersistencyImport = $.import("xs.db", "persistency");
var PersistencyItemImport = require("../../../lib/xs/db/persistency-item");
var Persistency = PersistencyImport.Persistency;

var helpers = require("../../../lib/xs/util/helpers");

var mTableNames = PersistencyItemImport.Tables;

var ItemCategory = require("../../../lib/xs/util/constants").ItemCategory;
var MapStandardFieldsWithFormulas = require("../../../lib/xs/util/constants").mapStandardFieldsWithFormulas;
const sStandardPriceStrategy = testData.sStandardPriceStrategy;
describe('xsjs.db.persistency-item-integrationtests', function() {

	
	var originalProcedures = null;
	var mockstar = null;

	var sExpectedDateWithoutTime = new Date("2011-08-20T00:00:00.000Z"); // "2011-08-20";

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			testmodel : {
				create_item : "sap.plc.db.calculationmanager.procedures/p_item_create",
				item_delelte_with_children : "sap.plc.db.calculationmanager.procedures/p_item_delete_item_with_children",
				get_items : "sap.plc.db.calculationmanager.procedures/p_item_get_items",
				delete_items : "sap.plc.db.calculationmanager.procedures/p_item_delete_items_marked_for_deletion"
			},
			substituteTables : {
				calculation: "sap.plc.db::basis.t_calculation",
				calculation_version: "sap.plc.db::basis.t_calculation_version", 
				calculation_version_temp: "sap.plc.db::basis.t_calculation_version_temporary",
				item : mTableNames.item,
				item_ext : mTableNames.item_ext,
				item_temporary : mTableNames.item_temporary,
				item_temporary_ext : mTableNames.item_temporary_ext,
				open_calculation_versions : "sap.plc.db::basis.t_open_calculation_versions",
				gtt_reference_calculation_version_items :  "sap.plc.db::temp.gtt_reference_calculation_version_items",
                material : {
                    name: "sap.plc.db::basis.t_material",
                    data: testData.oMaterialTestDataPlc
                },
                material_ext : "sap.plc.db::basis.t_material_ext",
                material_price : {
                    name: "sap.plc.db::basis.t_material_price"
                },
                material_price_ext : "sap.plc.db::basis.t_material_price_ext",
				metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes: {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				},
				project : "sap.plc.db::basis.t_project",
				formula: "sap.plc.db::basis.t_formula",
				defaultSettings : {
					name : "sap.plc.db::basis.t_default_settings",
					data : {
						"USER_ID" : [ "" ],
						"CONTROLLING_AREA_ID" : [ "1000" ],
						"COMPANY_CODE_ID" : [ "CC1" ],
						"PLANT_ID" : [ "PL1" ],
						"REPORT_CURRENCY_ID" : [ "EUR" ],
						"COMPONENT_SPLIT_ID" : [ "1" ],
						"COSTING_SHEET_ID" : [ "COGM" ]
					}
				},
			},
			csvPackage : testData.sCsvPackage
		});
		if (!mockstar.disableMockstar) {
			var procedurePrefix = 'xsunit.' + $.session.getUsername().toLowerCase() + '.';

			originalProcedures = PersistencyItemImport.Procedures;
			PersistencyItemImport.Procedures = Object.freeze({
				calculation_version_save : procedurePrefix + originalProcedures.calculation_version_save,
				calculation_version_close : procedurePrefix + originalProcedures.calculation_version_close,
				calculation : procedurePrefix + originalProcedures.calculation,
				delete_item : procedurePrefix + originalProcedures.delete_item,
				get_items : procedurePrefix + originalProcedures.get_items,
				delete_items : procedurePrefix + originalProcedures.delete_items_marked_for_deletion
			});
		}
	});

	afterOnce(function() {
		if (!mockstar.disableMockstar) {
			PersistencyItemImport.Procedures = originalProcedures;
			// mockstar.cleanup();
		}
	});

	// with the old function, a strange error was received: property 3 is non-configurable and can't be deleted
	function deleteNullProperties(oObject) {
		var allKeys = _.keys(oObject);
		var newObject = {};
		_.each(allKeys, function(key, index) {
			if (oObject[key] !== undefined && oObject[key] !== null) {
				newObject[key] = oObject[key];
			}
		});
		return newObject;
	}

	describe('getItem', function() {

		var oItemTemporaryTestData = {
			"SESSION_ID" : testData.sSessionId,
			"ITEM_ID" : 1234,
			"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,//45,
			"IS_ACTIVE" : 1,
			"ITEM_CATEGORY_ID" : 1,
			"CHILD_ITEM_CATEGORY_ID" : 1,
			"IS_DIRTY" : 0,
			"IS_DELETED" : 0,
			"TOTAL_QUANTITY_DEPENDS_ON" : 1,
			"BASE_QUANTITY" : '1.0000000',
			"PRICE_FIXED_PORTION" : '1.0000000',
			"PRICE_VARIABLE_PORTION" : '0.0000000',
			"TRANSACTION_CURRENCY_ID" : 'EUR',
			"PRICE_UNIT" : '1.0000000',
			"PRICE_UNIT_UOM_ID" : 'EUR',
			"IS_PRICE_SPLIT_ACTIVE":0,
			"IS_DISABLING_ACCOUNT_DETERMINATION": 0
		};

		var oItemTemporaryExtData = {
			"SESSION_ID" : testData.sSessionId,
			"ITEM_ID" : 1234,
			"CALCULATION_VERSION_ID" : testData.iCalculationVersionId,//45,
			"CUST_BOOLEAN_INT_MANUAL" : 1,
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL" : '20.0000000',
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT" : "EUR",
			"CUST_DECIMAL_WITHOUT_REF_MANUAL" : '30.0000000',
			"CUST_INT_WITHOUT_REF_MANUAL" : 30,
			"CUST_LOCAL_DATE_MANUAL" : sExpectedDateWithoutTime,
			"CUST_STRING_MANUAL" : "Test 1"
		};

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			// and views
			mockstar.insertTableData("item_temporary", oItemTemporaryTestData);
		    mockstar.insertTableData("calculation_version_temp", testData.oCalculationVersionTemporaryTestData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("item_temporary_ext", oItemTemporaryExtData);
			}
			mockstar.initializeData();
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return existing item', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			var oItemTemporaryTestDataClone = _.clone(oItemTemporaryTestData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone, oItemTemporaryExtData),
						testData.aCalculatedCustomFields);
			}
            var before = mockstar.execQuery("select * from {{calculation_version_temp}}"); 
			// act
			var oRetrievedItem = persistency.Item.getItem(oItemTemporaryTestData.ITEM_ID, oItemTemporaryTestData.CALCULATION_VERSION_ID,
					oItemTemporaryTestData.SESSION_ID);

			// assert
			expect(deleteNullProperties(oRetrievedItem)).toEqualObject(oItemTemporaryTestDataClone);
		});

		if (jasmine.plcTestRunParameters.mode === 'all') {
			it('should return exception when item does NOT exists', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				try {
					persistency.Item.getItem(9999, oItemTemporaryTestData.CALCULATION_VERSION_ID, oItemTemporaryTestData.SESSION_ID);
				} catch (e) {
					var exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
			});
		}

		if (jasmine.plcTestRunParameters.mode === 'all') {
			it('should return exception when SessionId is invalid', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				try {
					persistency.Item.getItem(oItemTemporaryTestData.ITEM_ID, oItemTemporaryTestData.CALCULATION_VERSION_ID, 'invalid_session_id');
				} catch (e) {
					var exception = e;
				}

				// assert
				expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
			});
		}
	});

	describe('getItems', function() {

		var oItemTemporaryTestData = {
			"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId ],
			"ITEM_ID" : [ 1, 2, 3 ],
			"CALCULATION_VERSION_ID" : [testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId],//[ 45, 45, 45 ],
			"IS_ACTIVE" : [ 1, 1, 1 ],
			"ITEM_CATEGORY_ID" : [ 1, 1, 1 ],
			"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1 ],
			"IS_DIRTY" : [ 0, 0, 0 ],
			"IS_DELETED" : [ 0, 0, 0 ],
			"PRICE_FIXED_PORTION" : ['1.0000000', '1.0000000', '1.0000000'],
			"PRICE_VARIABLE_PORTION" : [ '0.0000000', '0.0000000', '0.0000000'],
			"TRANSACTION_CURRENCY_ID" : [ 'EUR', 'EUR', 'EUR' ],
			"PRICE_UNIT" : ['1.0000000', '1.0000000', '1.0000000' ],
			"PRICE_UNIT_UOM_ID" : [ 'EUR', 'EUR', 'EUR' ],
			"TOTAL_QUANTITY_OF_VARIANTS" : [ '32.0000000', '50.0000000', '0.0000000' ]
		};

		var oItemTemporaryExtData = {
			"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId ],
			"ITEM_ID" : [ 1, 2, 3 ],
			"CALCULATION_VERSION_ID" : [testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId],//[ 45, 45, 45 ],
			"CUST_BOOLEAN_INT_MANUAL" : [ 1, 0, 1 ],
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL" : ['20.0000000', '300.5000000', '40.8800000'],
			"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT" : [ "EUR", "EUR", "EUR" ],
			"CUST_DECIMAL_WITHOUT_REF_MANUAL" : [  '30.0000000', '400.5000000', '50.8800000' ],
			"CUST_INT_WITHOUT_REF_MANUAL" : [ 30, 40, 50 ],
			"CUST_LOCAL_DATE_MANUAL" : [ sExpectedDateWithoutTime, sExpectedDateWithoutTime, sExpectedDateWithoutTime ],
			"CUST_STRING_MANUAL" : [ "Test 1", "Test 2", "Test 3" ]
		};

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			// and views
			mockstar.insertTableData("item_temporary", oItemTemporaryTestData);
			mockstar.insertTableData("calculation_version_temp", testData.oCalculationVersionTemporaryTestData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("item_temporary_ext", oItemTemporaryExtData);
			}
			mockstar.initializeData();
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return requested items when they all exists', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var aItemIds = [ oItemTemporaryTestData.ITEM_ID[0], oItemTemporaryTestData.ITEM_ID[1] ];

			// remove the not expected data from initial data set
			var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestData));
			_.each(oExpectedItemData, function(value, key) {
				oExpectedItemData[key] = value.splice(0, value.length - 1);
			});

			var oItemTemporaryTestDataClone = _.clone(oExpectedItemData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var oExpectedItemExtData = JSON.parse(JSON.stringify(oItemTemporaryExtData));
				_.each(oExpectedItemExtData, function(value, key) {
					oExpectedItemExtData[key] = value.splice(0, value.length - 1);
				});
				oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone, oExpectedItemExtData),
						testData.aCalculatedCustomFields);
			}

			// act
			var aRetrievedItems = persistency.Item.getItems(aItemIds, oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
					oItemTemporaryTestData.SESSION_ID[0]);

			// assert
			var oCompactResult = convertResultToArray(aRetrievedItems);
			expect(aRetrievedItems.length).toBe(aItemIds.length);
			expect(oCompactResult).toMatchData(oItemTemporaryTestDataClone, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);

		});

		it('should return valid items and omit Not existing items', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var iNonExsistentId = 1337;
			var aItemIds = [ oItemTemporaryTestData.ITEM_ID[0], iNonExsistentId ];
			// remove the non-expected data from initial data set
			var oExpectedItemData = JSON.parse(JSON.stringify(oItemTemporaryTestData));
			_.each(oExpectedItemData, function(value, key) {
				oExpectedItemData[key] = value.splice(0, value.length - 2);
			});

			var oItemTemporaryTestDataClone = _.clone(oExpectedItemData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var oExpectedItemExtData = JSON.parse(JSON.stringify(oItemTemporaryExtData));
				_.each(oExpectedItemExtData, function(value, key) {
					oExpectedItemExtData[key] = value.splice(0, value.length - 2);
				});
				oItemTemporaryTestDataClone = _.omit(_.extend(oItemTemporaryTestDataClone, oExpectedItemExtData),
						testData.aCalculatedCustomFields);
			}

			// act
			var aRetrievedItems = persistency.Item.getItems(aItemIds, oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
					oItemTemporaryTestData.SESSION_ID[0]);

			// assert
			var oCompactResult = convertResultToArray(aRetrievedItems);
			expect(aRetrievedItems.length).toBe(1);
			expect(oCompactResult).toMatchData(oItemTemporaryTestDataClone, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		});

		if (jasmine.plcTestRunParameters.mode === 'all') {
			it('should return empty result array when requested items do NOT exist', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var iNonExsistentId = 1337;
				var aItemIds = [ iNonExsistentId, iNonExsistentId + 1 ];

				// act
				var aRetrievedItems = persistency.Item.getItems(aItemIds, oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
						oItemTemporaryTestData.SESSION_ID[0]);

				// assert
				expect(aRetrievedItems.length).toBe(0);
			});

			it('should return empty result array when SessionId does not NOT exist', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var sInvalidSessionId = "invalid_session";
				var aItemIds = [ oItemTemporaryTestData.ITEM_ID[0], oItemTemporaryTestData.ITEM_ID[1] ];

				// act
				var aRetrievedItems = persistency.Item.getItems(aItemIds, oItemTemporaryTestData.CALCULATION_VERSION_ID[0],
						sInvalidSessionId);

				// assert
				expect(aRetrievedItems.length).toBe(0);
			});
		}
	});

	if (jasmine.plcTestRunParameters.mode === 'all') {

		describe("getIdsOfDirtyItems", function() {

			var sSessionId = "s";
			var iCvId = 1;
			var oTestData = {
				SESSION_ID : [ sSessionId, sSessionId, sSessionId, sSessionId ],
				ITEM_ID : [ 1, 2, 3, 4 ],
				CALCULATION_VERSION_ID : [ iCvId, iCvId, iCvId, 2 ],
				IS_ACTIVE : [ 1, 1, 1, 1 ],
				ITEM_CATEGORY_ID : [ 1, 1, 1, 1 ],
				CHILD_ITEM_CATEGORY_ID : [ 1, 1, 1, 1 ],
				IS_DIRTY : [ 1, 1, 1, 1 ],
				IS_DELETED : [ 0, 0, 1, 0 ],
			};

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("item_temporary", oTestData);
			});

			it("should return all dirty items for specified calculation version and session id", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var aIdsOfDirtyItems = persistency.Item.getIdsOfDirtyItems(sSessionId, iCvId);

				// assert
				expect(aIdsOfDirtyItems).toEqual([ 1, 2 ]);
			});

			it("should not return dirty items marked for deletion", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var iItemIdMarkedForDeletion = 3;

				// act
				var aIdsOfDirtyItems = persistency.Item.getIdsOfDirtyItems(sSessionId, iCvId);

				// assert
				expect(_.includes(aIdsOfDirtyItems, iItemIdMarkedForDeletion)).toBe(false);
			});

			it("should return an empty array if no dirty items are found", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				mockstar.clearAllTables();

				// act
				var aIdsOfDirtyItems = persistency.Item.getIdsOfDirtyItems(sSessionId, iCvId);

				// assert
				expect(aIdsOfDirtyItems).toEqual([]);
			})
		});
	}

	if (jasmine.plcTestRunParameters.mode === 'all') {

		describe("getSaveRelevantFields", function() {

			var sSessionId = null;
			var iCvId = null;
			var aAuditFields = [ "ITEM_ID", "CALCULATION_VERSION_ID", "CREATED_ON", "CREATED_BY", "LAST_MODIFIED_ON",
					"LAST_MODIFIED_BY", "IS_DIRTY", "PRICE_SOURCE_ID", "PRICE_SOURCE_TYPE_ID" ];
			var aItemIdsOfVersion = [];

			beforeOnce(function() {
				sSessionId = testData.oItemTemporaryTestData.SESSION_ID[0];
				iCvId = testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0];

				_.each(testData.oItemTemporaryTestData.CALCULATION_VERSION_ID, function(iTestDataCvId, iIndex) {
					if (iTestDataCvId === iCvId) {
						aItemIdsOfVersion.push(testData.oItemTemporaryTestData.ITEM_ID[iIndex]);
					}
				})

			});

			beforeEach(function() {
				mockstar.clearAllTables();
				mockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should contain only items the specified version", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(null, sSessionId, iCvId);

				// assert
				expect(aItemsWithOnlyAuditFields.length).toBeGreaterThan(0);
				_.each(aItemsWithOnlyAuditFields, function(oItem) {
					jasmine.log(`Checking item ${oItem.ITEM_ID} if its calculation version id is ${iCvId}`);
					expect(oItem.CALCULATION_VERSION_ID).toEqual(iCvId);
				});
			});

			it("should only return items with the specified ids", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aOnlyASubsetOfItemIds = aItemIdsOfVersion.slice(0, 2);

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(aOnlyASubsetOfItemIds, sSessionId, iCvId);

				// assert
				var aReturnedItemIds = [];
				_.each(aItemsWithOnlyAuditFields, function(oReturnedItem) {
					aReturnedItemIds.push(oReturnedItem.ITEM_ID);
				});
				expect(aReturnedItemIds).toEqual(aOnlyASubsetOfItemIds);
			});

			it("should an return audit fields of all items for the specified version if null or undefined is passed as parameter",
					function() {
						_.each([ null, undefined ], function(itemIdsValues) {
							jasmine.log("Checking " + itemIdsValues);

							// arrange
							var persistency = new Persistency(jasmine.dbConnection);

							// act
							var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(itemIdsValues, sSessionId, iCvId);

							// assert
							var aReturnedItemIds = [];
							_.each(aItemsWithOnlyAuditFields, function(oReturnedItem) {
								aReturnedItemIds.push(oReturnedItem.ITEM_ID);
							});
							expect(aReturnedItemIds).toEqual(aItemIdsOfVersion);
						});
					});

			it("should an return an empty array if an empty array is passed as parameter", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields([], sSessionId, iCvId);

				// assert
				expect(aItemsWithOnlyAuditFields).toEqual([]);

			});

			it("should not return items that are marked as deleted", function() {
				// arrange
				var oTestData = {
					SESSION_ID : [ sSessionId, sSessionId ],
					ITEM_ID : [ 1, 2 ],
					CALCULATION_VERSION_ID : [ iCvId, iCvId ],
					IS_ACTIVE : [ 1, 1 ],
					ITEM_CATEGORY_ID : [ 1, 1 ],
					IS_DIRTY : [ 1, 1 ],
					IS_DELETED : [ 0, 1 ]
				};
				mockstar.clearAllTables();
				mockstar.insertTableData("item_temporary", oTestData);
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(null, sSessionId, iCvId);

				// assert
				var bDeletedItemContained = _.some(aItemsWithOnlyAuditFields, function(oItem) {
					return oItem.ITEM_ID === 2;
				});
				expect(bDeletedItemContained).toBe(false);
			});

			it("should contain only audit fields", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aItemIds = testData.oItemTemporaryTestData.ITEM_ID;

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(aItemIds, sSessionId, iCvId);

				// assert
				expect(aItemsWithOnlyAuditFields.length).toBeGreaterThan(0);
				_.each(aItemsWithOnlyAuditFields, function(oItemWithOnlyAuditFields) {
					var aOtherProperties = _.keys(_.omit(oItemWithOnlyAuditFields, aAuditFields));
					if (aOtherProperties.length > 0) {
						jasmine.log(`Item ${oItemWithOnlyAuditFields.ITEM_ID} does contain the following additional properties: ${aOtherProperties.join(", ")} (only ${aAuditFields.join(", ")} are allowed)`);
					}
					expect(aOtherProperties.length).toBe(0);
				});
			});

			it("should return all the requested items when a max limit is set", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aOnlyASubsetOfItemIds = aItemIdsOfVersion.slice(0, 4);

				// act
				var aItemsWithOnlyAuditFields = persistency.Item.getSaveRelevantFields(aOnlyASubsetOfItemIds, sSessionId, iCvId, 3);

				// assert
				var aReturnedItemIds = [];
				_.each(aItemsWithOnlyAuditFields, function(oReturnedItem) {
					aReturnedItemIds.push(oReturnedItem.ITEM_ID);
				});
				expect(aReturnedItemIds).toEqual(aOnlyASubsetOfItemIds);
			});
		});
	}

	function convertResultToArray(result) {
		// this function does not check for null values in objects. This will
		// result in arrays which does not have the
		// same amount of values for each array.
		expect(result).toBeDefined();

		var convertedResult = {};
		_.each(result, function(value) {
			value = deleteNullProperties(value);
			_.each(value, function(value, key) {
				if (!(key in convertedResult)) {
					convertedResult[key] = [];
				}
				if (value instanceof Date) {
					convertedResult[key].push(value.toJSON());
				} else {
					convertedResult[key].push(value);
				}
			});

		});

		return convertedResult;
	}

    
        describe('create', function() {
            var iCvId = testData.iCalculationVersionId;
            var iCalculationId = testData.iCalculationId;
            var sMasterDataDateTime = new Date().toJSON();
            var sSessionId = testData.sSessionId;
            
			var oLastYearDate = new Date();
			oLastYearDate.setFullYear(oLastYearDate.getFullYear() - 1);

			var sLastYearDate = oLastYearDate.toJSON();
			var oImportTestData = {
					"SESSION_ID" : [ sSessionId ],
					                 "ITEM_ID" : [ 1 ],
					                 "CALCULATION_VERSION_ID" : [ iCvId ],
					                 "PARENT_ITEM_ID" : [ null ],
					                 "PREDECESSOR_ITEM_ID" : [ null ],
									 "ITEM_CATEGORY_ID" : [ 0 ],
									 "CHILD_ITEM_CATEGORY_ID" : [ 0 ],
					                 "IS_ACTIVE" : [ 1 ],
					                 "CREATED_ON" : [ sLastYearDate ],
					                 "CREATED_BY" : [ "some_user" ],
					                 "LAST_MODIFIED_ON" : [ sLastYearDate ],
					                 "LAST_MODIFIED_BY" : [ "some_user" ],
                                     'PRICE_FIXED_PORTION' : [ 1 ],
                                     'PRICE_VARIABLE_PORTION' : [ 0 ],
                                     'TRANSACTION_CURRENCY_ID' : [ 'EUR' ],
                                     'PRICE_UNIT' : [ 1 ],
                                     'PRICE_UNIT_UOM_ID' : [ 'PC' ]
			};
			
        	var oCalculationVersion = {
        			SESSION_ID : [ sSessionId ],
        			CALCULATION_VERSION_ID : [ iCvId ],
        			CALCULATION_ID : [ iCalculationId ],
        			CALCULATION_VERSION_NAME : [ "Version" ],
        			ROOT_ITEM_ID : [ 3001 ],
        			REPORT_CURRENCY_ID : [ "EUR" ],
        			COSTING_SHEET_ID : [ "COGS" ],
        			VALUATION_DATE : [ "2018-01-01" ],
        			MASTER_DATA_TIMESTAMP : [ sMasterDataDateTime ],
        			MATERIAL_PRICE_STRATEGY_ID: [sStandardPriceStrategy],
        			ACTIVITY_PRICE_STRATEGY_ID: [sStandardPriceStrategy]
        	};

			if(jasmine.plcTestRunParameters.generatedFields === true){
			    var oImportExtTestData = {
					"SESSION_ID" : [ sSessionId ],
					 "ITEM_ID" : [ 1 ],
					 "CALCULATION_VERSION_ID" : [ iCvId ],
					 "CUST_BOOLEAN_INT_MANUAL":[1],
					 "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":[null],
			         "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_UNIT":['EUR']
			    };
			}
			

            beforeEach(function() {
                mockstar.clearAllTables(); 
                
                mockstar.insertTableData("item_temporary", oImportTestData);
				mockstar.insertTableData("calculation_version_temp", oCalculationVersion);
                mockstar.insertTableData("project", testData.oProjectTestData);
                mockstar.insertTableData("calculation", testData.oCalculationTestData);
				mockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);

				if(jasmine.plcTestRunParameters.generatedFields === true){
				    mockstar.insertTableData("item_temporary_ext", oImportExtTestData);
				    mockstar.insertTableData("item_ext", testData.oItemExtData);
				    mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				    mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				    
				    mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
                    mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
				}
            });

            afterOnce(function() {
                mockstar.cleanup();
            });

            if (jasmine.plcTestRunParameters.generatedFields === true) {

				it("should convert from string to int the default value of the custom field", function() {
                    // arrange
                    var persistency = new Persistency(jasmine.dbConnection);
    
                    let aInputItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0, 1, 2]);
                    const sMaterialId = testData.oMaterialExtTestDataPlc.MATERIAL_ID[0]
                    
                    aInputItems[0].ITEM_ID = -1;
                    aInputItems[0].CUST_BOOLEAN_INT_MANUAL = null;
                    aInputItems[0].ITEM_CATEGORY_ID = 1;
                    aInputItems[0].PARENT_ITEM_ID = 0;

					aInputItems[1].ITEM_ID = -2;
                    aInputItems[1].CUST_BOOLEAN_INT_MANUAL = null;
                    aInputItems[1].MATERIAL_ID = sMaterialId;
                    aInputItems[1].ITEM_CATEGORY_ID = 2;
                    aInputItems[1].PARENT_ITEM_ID = -1;

					mockstar.execSingle("update {{metadata_item_attributes}} set DEFAULT_VALUE = '01' WHERE COLUMN_ID = 'CUST_BOOLEAN_INT';");
                    
                    
                    // act
					const oResult = persistency.Item.create(aInputItems, aInputItems[0].SESSION_ID, aInputItems[0].CALCULATION_VERSION_ID, 1, 1, 1);
                    const oTempTable = mockstar.execQuery("select ITEM_ID, CUST_BOOLEAN_INT_MANUAL from {{item_temporary_ext}}");
    
                    // assert
                    expect(oTempTable).toMatchData({  
						ITEM_ID: [1, 2, 3],
						CUST_BOOLEAN_INT_MANUAL: [1, 1, null]
					}, ["ITEM_ID"]);
                });

                it("should set CMAT_STRING_MANUAL dependent on input and return NULL_MASTERDATA_CUSTOM_FIELDS", function() {
                    // arrange
                    var persistency = new Persistency(jasmine.dbConnection);
    
                    let aInputItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0, 1, 2]);
                    const sCustomValue = "Custom value 0";
                    const sMaterialId = testData.oMaterialExtTestDataPlc.MATERIAL_ID[0]
                    
                    // Should set the custom field value to that from input
                    aInputItems[0].ITEM_ID = -1;
                    aInputItems[0].CMAT_STRING_MANUAL = sCustomValue;
                    aInputItems[0].MATERIAL_ID = sMaterialId;
                    aInputItems[0].ITEM_CATEGORY_ID = 2;
                    aInputItems[0].PARENT_ITEM_ID = 1;
                    
                    // Should set to the managed master data value if null in input (setting to null is done then in higher level function)
                    aInputItems[1].ITEM_ID = -2;
                    aInputItems[1].CMAT_STRING_MANUAL = null;
                    aInputItems[1].MATERIAL_ID = sMaterialId;
                    aInputItems[1].ITEM_CATEGORY_ID = 2;
                    aInputItems[1].PARENT_ITEM_ID = 1;
                    
                    // Should set to null if master data value not managed
                    aInputItems[2].ITEM_ID = -3;
                    aInputItems[2].MATERIAL_ID = sMaterialId;
                    aInputItems[2].ITEM_CATEGORY_ID = 2;
                    aInputItems[2].PARENT_ITEM_ID = 1;
                    
                    
                    // act               
                    const oResult = persistency.Item.create(aInputItems, aInputItems[0].SESSION_ID, aInputItems[0].CALCULATION_VERSION_ID, 1, 1, 1);
                    const oTempTable = mockstar.execQuery("select ITEM_ID, CMAT_STRING_MANUAL from {{item_temporary_ext}}");
    
                    // assert
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMAT_STRING_MANUAL[0].VALUE).toBe(sCustomValue);
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMAT_STRING_MANUAL[1].VALUE).toBeNull();
                    expect(oTempTable).toMatchData(
                        {   ITEM_ID: [1, 2, 3, 4],
                            CMAT_STRING_MANUAL: [
                                null,
                                sCustomValue,
                                null,
                                testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]
                            ]
                        },["ITEM_ID"]);
                });
                
                xit("should not set CMPR_DECIMAL_WITH_UOM_UNIT, CMPR_BOOLEAN_INT_MANUAL to null, if null value comes on the request", function() {
                    // arrange
                	mockstar.insertTableData("material_price", testData.oMaterialPriceTestDataPlc);
                    mockstar.insertTableData("material_price_ext", testData.oMaterialPriceExtTestDataPlc);
                    var persistency = new Persistency(jasmine.dbConnection);
    
                    let aInputItems = new TestDataUtility(testData.oItemTemporaryTestData).getObjects([0, 1, 2]);
                    const sCustomUnitValue = "MIN";
                    const sDefaultUnitValue = "PC";
                    const sCustomBoolValue = 0;
                    const sDefaultBoolValue = 1;
                    
                    // Should set the custom field value to that from input
                    aInputItems[0].ITEM_ID = -1;
                    aInputItems[0].CMPR_DECIMAL_WITH_UOM_UNIT = sCustomUnitValue;
                    aInputItems[0].CMPR_BOOLEAN_INT_MANUAL = sCustomBoolValue;
                    aInputItems[0].MATERIAL_ID = testData.oMaterialPriceTestDataPlc.MATERIAL_ID[0];
                    aInputItems[0].PLANT_ID = testData.oMaterialPriceTestDataPlc.PLANT_ID[0];
                    aInputItems[0].ITEM_CATEGORY_ID = 2;
                    aInputItems[0].PARENT_ITEM_ID = 1;
                    
                    // Should not sett null
                    aInputItems[1].ITEM_ID = -2;
                    aInputItems[1].CMPR_DECIMAL_WITH_UOM_UNIT = null;
                    aInputItems[1].CMPR_BOOLEAN_INT_MANUAL = null;
                    aInputItems[1].MATERIAL_ID = testData.oMaterialPriceTestDataPlc.MATERIAL_ID[0];
                    aInputItems[1].PLANT_ID = testData.oMaterialPriceTestDataPlc.PLANT_ID[0];
                    aInputItems[1].ITEM_CATEGORY_ID = 2;
                    aInputItems[1].PARENT_ITEM_ID = 1;                    
                    
                    // act               
                    const oResult = persistency.Item.create(aInputItems, aInputItems[0].SESSION_ID, aInputItems[0].CALCULATION_VERSION_ID, 1, 1, 1);
                    const oTempTable = mockstar.execQuery("select ITEM_ID, CMPR_DECIMAL_WITH_UOM_UNIT, CMPR_BOOLEAN_INT_MANUAL from {{item_temporary_ext}}");
    
                    // assert
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_DECIMAL_WITH_UOM_UNIT[0].VALUE).toBe(sCustomUnitValue);
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_DECIMAL_WITH_UOM_UNIT[1].VALUE).toBe(sDefaultUnitValue);
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_BOOLEAN_INT_MANUAL[0].VALUE).toBe(sCustomBoolValue);
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_BOOLEAN_INT_MANUAL[1].VALUE).toBe(sDefaultBoolValue.toString());
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_DECIMAL_WITH_UOM_UNIT.length).toBe(2);
                    expect(oResult.OT_CUSTOM_FIELDS_FROM_REQUEST.CMPR_BOOLEAN_INT_MANUAL.length).toBe(2);
                    expect(oTempTable).toMatchData(
                        {   ITEM_ID: [1, 2, 3],
                        	CMPR_DECIMAL_WITH_UOM_UNIT: [
                                null,
                                sCustomUnitValue,
                                sDefaultUnitValue
                            ],
                            CMPR_BOOLEAN_INT_MANUAL: [
                                 null,
                                 sCustomBoolValue,
                                 sDefaultBoolValue
                             ]
                        },["ITEM_ID"]);
                });
                
            }
        });
    
	

	describe("update", function() {
		
		var oItemTemporaryTestData = {
				"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId, testData.sSessionId],
				"ITEM_ID" : [ 1, 2, 3, 4],
				"CALCULATION_VERSION_ID" : [testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId],//[ 45, 45, 45],
				"IS_ACTIVE" : [ 1, 1, 1, 1 ],
				"ITEM_CATEGORY_ID" : [ 3, 1, 2, 0 ],
				"IS_DIRTY" : [ 0, 0, 0, 0],
				"IS_DELETED" : [ 0, 0, 0, 0],
				"PRICE_FIXED_PORTION" : [ 1, 1, 1, 1 ],
				"PRICE_VARIABLE_PORTION" : [ 0, 0, 1, 1 ],
				"TRANSACTION_CURRENCY_ID" : [ 'EUR', 'EUR', 'EUR', 'EUR' ],
				"PRICE_UNIT" : [ 1, 1, 1, 1 ],
				"PRICE_UNIT_UOM_ID" : [ 'EUR', 'EUR', 'EUR', 'EUR' ],
				"BASE_QUANTITY_IS_MANUAL": [ 5, 5, 5, 5 ],
				"LOT_SIZE_IS_MANUAL": [ 5, 5, 5, 5 ],
				"PRICE_UNIT_IS_MANUAL": [ 5, 5, 5, 5 ],
				"PRICE_FIXED_PORTION_IS_MANUAL": [ 5, 5, 5, 5 ],
				"PRICE_VARIABLE_PORTION_IS_MANUAL": [ 5, 5, 5, 5 ],
				"QUANTITY_IS_MANUAL": [ 5, 5, 5, 5 ],
				"TARGET_COST_IS_MANUAL": [ 5, 5, 5, 5 ]
			};

		var oItemTemporaryExtData = {
			"SESSION_ID" : [ testData.sSessionId, testData.sSessionId, testData.sSessionId],
			"ITEM_ID" : [ 1, 2, 3 ],
			"CALCULATION_VERSION_ID" : [testData.iCalculationVersionId, testData.iCalculationVersionId, testData.iCalculationVersionId],//[ 45, 45, 45 ],
			"CUST_DECIMAL_WITHOUT_REF_MANUAL" : [ '30', '50.88', , '40' ],
			"CUST_DECIMAL_WITHOUT_REF_IS_MANUAL" : [ null, 1, null ],
			"CUST_DECIMAL_FORMULA_MANUAL" : [ '30', '50.88', , '40' ],
			"CUST_DECIMAL_FORMULA_IS_MANUAL" : [ null, 1, 0 ],
		};
			
		var oDbItem = mockstar_helpers.convertToObject(testData.oItemTemporaryTestData, 0);
		if (jasmine.plcTestRunParameters.generatedFields === true) {
			var oDbItemExt = _.omit(mockstar_helpers.convertToObject(testData.oItemTemporaryExtData, 0), testData.aCalculatedCustomFields);
		}

		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("item_temporary", oDbItem);
			mockstar.insertTableData("calculation_version_temp", testData.oCalculationVersionTemporaryTestData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("item_temporary_ext", oDbItemExt);
			}
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it("should update every column of the item in the table except ITEM_ID, CALCULATION_VERSION_ID and SESSION_ID", function() {
			// arrange
			var aPropertiesToSkip = [ "ITEM_ID", "CALCULATION_VERSION_ID", "SESSION_ID" ]
			var aColumns = mockstar.execQuery("select * from {{item_temporary}}").getColumns();
			var persistency = new Persistency(jasmine.dbConnection);

			var fCreateUpdateObject = function(sColumnId, sTypeName) {
				var oUpdateObject = {
					ITEM_ID : oDbItem.ITEM_ID,
					CALCULATION_VERSION_ID : oDbItem.CALCULATION_VERSION_ID
				}

				var mTypeValueMap = {
					"NVARCHAR" : "ab",
					"INTEGER" : 1337,
					"TINYINT" : 254,
					"DECIMAL" : "1337.3300000",
					"TIMESTAMP" : new Date(),
					"BOOLEAN" : 1,
					"DATE" : sExpectedDateWithoutTime
				}

				var value = mTypeValueMap[sTypeName];
				if (value === undefined) {
					throw new Error(`Unknown column type ${sTypeName}`);
				}
				oUpdateObject[sColumnId] = mTypeValueMap[sTypeName];
				return oUpdateObject;
			};

			var fCheckColumns = function(oPersistency, aColumns, aPropertiesToSkip, sTable) {
				_.each(aColumns, function(oColumn) {
					if (_.includes(aPropertiesToSkip, oColumn.metaData.ColumnLabel)) {
						return;
					}

					var oColumnMetdata = oColumn.metaData;
					var sColumnId = oColumnMetdata.ColumnLabel;
					var sColumnTypeName = oColumnMetdata.ColumnTypeName
					var oUpdateObject = fCreateUpdateObject(sColumnId, sColumnTypeName);
					var updateValue = oUpdateObject[oColumnMetdata.ColumnLabel];

					// act
					jasmine.log(`Testing update on column ${sColumnId}: should have the value ${updateValue}`);
					var iAffectedRows = oPersistency.Item.update(oUpdateObject, oDbItem.SESSION_ID);
					var oDbContent = mockstar.execQuery("select * from {{" + sTable + "}}");

					// assert
					expect(oDbContent.columns[sColumnId].rows[0]).toEqual(updateValue);
				});
			};

			fCheckColumns(persistency, aColumns, aPropertiesToSkip, 'item_temporary');

			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var aPropertiesCustToSkip = [ "ITEM_ID", "CALCULATION_VERSION_ID", "SESSION_ID" ].concat(testData.aCalculatedCustomFields);
				var aColumnsCust = mockstar.execQuery("select * from {{item_temporary_ext}}").getColumns();
				fCheckColumns(persistency, aColumnsCust, aPropertiesCustToSkip, 'item_temporary_ext');
			}

		});

		it("should delete column value from table if the item contains null as property value for this column", function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var oItem = _.clone(oDbItem);
			var aUpdateFields = [ "ITEM_ID", "CALCULATION_VERSION_ID", "ITEM_DESCRIPTION" ];
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				aUpdateFields.push("CUST_BOOLEAN_INT_MANUAL");
				oItem = _.extend(oItem, oDbItemExt);
			}
			var oItemToUpdate = _.pick(oItem, aUpdateFields);

			expect(oItemToUpdate.ITEM_DESCRIPTION).toBeDefined();
			oItemToUpdate.ITEM_DESCRIPTION = null;
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				// just make sure that the custom property is defined first:
				expect(oItemToUpdate.CUST_BOOLEAN_INT_MANUAL).toBeDefined();
				oItemToUpdate.CUST_BOOLEAN_INT_MANUAL = null;
			}

			// act
			var iAffectedRows = persistency.Item.update(oItemToUpdate, oDbItem.SESSION_ID);

			// assert
			expect(iAffectedRows).toEqual(1);
			var oDbContent = mockstar.execQuery("select * from {{item_temporary}}");
			expect(oDbContent.columns.ITEM_DESCRIPTION.rows[0]).toEqual(null);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				var oDbContentExt = mockstar.execQuery("select * from {{item_temporary_ext}}");
				expect(oDbContentExt.columns.CUST_BOOLEAN_INT_MANUAL.rows[0]).toEqual(null);
			}
		});

		if (jasmine.plcTestRunParameters.generatedFields === true) {
			it("should add a new entry in t_item_temporary_ext when the first custom field is set (on a update request)", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				var oExistingItem = mockstar_helpers.convertToObject(testData.oItemTemporaryTestData, 1);
				mockstar.insertTableData("item_temporary", oExistingItem);

				var oDbContentExt = mockstar.execQuery("select count(*) as rowcount from {{item_temporary_ext}}");
				var iOriginalItemExtCount = parseInt(oDbContentExt.columns.ROWCOUNT.rows[0], 10);

				var oItemToUpdate = _.pick(oExistingItem, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
				oItemToUpdate.CUST_BOOLEAN_INT_MANUAL = 1;

				// act
				var iAffectedRows = persistency.Item.update(oItemToUpdate, oDbItem.SESSION_ID);

				// assert
				oDbContentExt = mockstar.execQuery("select count(*) as rowcount from {{item_temporary_ext}}");
				expect(parseInt(oDbContentExt.columns.ROWCOUNT.rows[0], 10)).toEqual(iOriginalItemExtCount + 1);
			});
		}

		if (jasmine.plcTestRunParameters.mode === 'all') {
			it("should return 0 and not modify the item if given item object's ITEM_ID is invalid", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oItemToUpdate = _.pick(oDbItem, [ "ITEM_ID", "CALCULATION_VERSION_ID", "ITEM_DESCRIPTION" ]);
				oItemToUpdate.ITEM_ID = -1;
				var oDbContentBeforeUpdate = mockstar.execQuery("select * from {{item_temporary}}");

				// act
				var iAffectedRows = persistency.Item.update(oItemToUpdate, oDbItem.SESSION_ID);
				var oDbContentAfterUpdate = mockstar.execQuery("select * from {{item_temporary}}");

				// assert
				expect(iAffectedRows).toEqual(0);
				expect(oDbContentAfterUpdate).toMatchData(oDbContentBeforeUpdate, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});

			it("should return 0 and not modify the item if given item object's SESSION_ID is invalid", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oItemToUpdate = _.pick(oDbItem, [ "ITEM_ID", "CALCULATION_VERSION_ID", "ITEM_DESCRIPTION" ]);
				var oDbContentBeforeUpdate = mockstar.execQuery("select * from {{item_temporary}}");

				// act
				var iAffectedRows = persistency.Item.update(oItemToUpdate, "invalid_session_id");
				var oDbContentAfterUpdate = mockstar.execQuery("select * from {{item_temporary}}");

				// assert
				expect(iAffectedRows).toEqual(0);
				expect(oDbContentAfterUpdate).toMatchData(oDbContentBeforeUpdate, [ "SESSION_ID", "ITEM_ID", "CALCULATION_VERSION_ID" ]);
			});

			it('should update PREDECESSOR_ITEM_ID of the successor if the item has a new predecessor', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				mockstar.clearAllTables();
				// data in calculation version temp is needed for p_item_get_items procedure
                mockstar.insertTableData("calculation_version_temp", testData.oCalculationVersionTemporaryTestData);
				var oItemParent = _.clone(oDbItem);
				oItemParent.ITEM_ID = 999;
				oItemParent.PARENT_ITEM_ID = null;

				// scenario: items A <= B <= C, C is moved: A <= C <= B
				var oItemA = _.clone(oDbItem);
				oItemA.ITEM_ID = 1000;
				oItemA.PARENT_ITEM_ID = oItemParent.ITEM_ID;

				// this is the first item, thus it should have no predecessor
				delete oItemA.PREDECESSOR_ITEM_ID;
				var oItemB = _.clone(oDbItem);
				oItemB.ITEM_ID = 1001;
				oItemB.PREDECESSOR_ITEM_ID = oItemA.ITEM_ID;
				oItemB.PARENT_ITEM_ID = oItemParent.ITEM_ID;
				var oItemC = _.clone(oDbItem);
				oItemC.ITEM_ID = 1002;
				oItemC.PREDECESSOR_ITEM_ID = oItemB.ITEM_ID;
				oItemC.PARENT_ITEM_ID = oItemParent.ITEM_ID;

				mockstar.insertTableData("item_temporary", oItemA);
				mockstar.insertTableData("item_temporary", oItemB);
				mockstar.insertTableData("item_temporary", oItemC);

				// Move ItemC
				oItemC.PREDECESSOR_ITEM_ID = 1000;

				// act
				var iAffectedRows = persistency.Item.update(oItemC, oItemC.SESSION_ID);

				// assert
				var oRecievedItemA = persistency.Item.getItem(oItemA.ITEM_ID, oItemA.CALCULATION_VERSION_ID, oItemA.SESSION_ID);
				var oRecievedItemB = deleteNullProperties(persistency.Item.getItem(oItemB.ITEM_ID, oItemB.CALCULATION_VERSION_ID,
						oItemB.SESSION_ID));
				var oRecievedItemC = deleteNullProperties(persistency.Item.getItem(oItemC.ITEM_ID, oItemC.CALCULATION_VERSION_ID,
						oItemC.SESSION_ID));

				expect(iAffectedRows).toBe(1);
				expect(oRecievedItemB.PREDECESSOR_ITEM_ID).toEqual(oItemC.ITEM_ID);
			});
		}
	});
	
	////
	
	describe("update referenced calculation version", function() {
		
		var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);
		
		var persistency;
		var sSessionId = $.session.getUsername();
		var aItems;
		
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views

			mockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);	//"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
			mockstar.insertTableData("calculation_version", oBuiltTestData.CalcVerTestData);	//[ 2809, 4809, 5809 ]
			mockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);	// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3004 ]
																					// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809, iCalculationVersionId ]
			mockstar.insertTableData("item_temporary", oBuiltTestData.ItemMasterTempTestData);	// we need only "ITEM_ID" : [ 3001, 3002, 3003 , 3004] for master calc ver iCvId = testData.iCalculationVersionId = 2809
																								//3002 and 3004 are sub-items of 3001
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("item_ext", oBuiltTestData.ItemExtTestData); 	//"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001, 3004 ]	
				mockstar.insertTableData("item_temporary_ext", oBuiltTestData.ItemTempExtTestData); 	// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
			}	
			
			aItems = [
			    {
			        ITEM_ID:3002,
			        CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0],//2809
			        ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
			        REFERENCED_CALCULATION_VERSION_ID:4809
			    },
			    {
			        ITEM_ID:3004,
			        CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0],//2809
			        ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
			        REFERENCED_CALCULATION_VERSION_ID:5809
			    }
			];
			
			persistency = new Persistency(jasmine.dbConnection);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});
		
		it("should throw an exception when the input array is not defined", function() {
			// arrange
			var aItemToUpdateReferencedVersion;

			// act
			try {
			    persistency.Item.updateReferencedCalculationVersionID(aItemToUpdateReferencedVersion, sSessionId);
			} catch (e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});
		
        it("should throw an exception if a deleted version is referenced", function() {
			// arrange
			var aInValidItems = aItems;
			aInValidItems[0].REFERENCED_CALCULATION_VERSION_ID = 123;

			// act
			try {
			    persistency.Item.updateReferencedCalculationVersionID(aInValidItems, sSessionId);
			} catch (e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
			
		});
		
		it("should throw an exception if two deleted versions are referenced", function() {
			// arrange
			var aInValidItems = aItems;
			aInValidItems[0].REFERENCED_CALCULATION_VERSION_ID = 123;
			aInValidItems[1].REFERENCED_CALCULATION_VERSION_ID = 456;

			// act
			try {
			    persistency.Item.updateReferencedCalculationVersionID(aInValidItems, sSessionId);
			} catch (e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
		});
		
		it("should throw an exception if a not current version is referenced", function() {
			// arrange
			var oChangedCalculation = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields).CalcTestData;
			oChangedCalculation.CURRENT_CALCULATION_VERSION_ID[1] = 123;
			//Note: When upsert one row, make sure parameters are one object and one where condition.
			mockstar.upsertTableData("calculation", mockstar_helpers.convertToObject(oChangedCalculation, 1),  "CALCULATION_ID = "+oChangedCalculation.CALCULATION_ID[1]);
			
			// act
			try {
			    persistency.Item.updateReferencedCalculationVersionID(aItems, sSessionId);
			} catch (e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_CURRENT_ERROR");
		});
		
		it("should throw an exception if two not current versions are referenced", function() {
			// arrange
			var oChangedCalculation = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields).CalcTestData;
			oChangedCalculation.CURRENT_CALCULATION_VERSION_ID[1] = 123;
			mockstar.upsertTableData("calculation", mockstar_helpers.convertToObject(oChangedCalculation, 1),  "CALCULATION_ID = "+oChangedCalculation.CALCULATION_ID[1]);
			oChangedCalculation.CURRENT_CALCULATION_VERSION_ID[2] = 123;
			mockstar.upsertTableData("calculation", mockstar_helpers.convertToObject(oChangedCalculation, 2),  "CALCULATION_ID = "+oChangedCalculation.CALCULATION_ID[2]);
			
			// act
			try {
			    persistency.Item.updateReferencedCalculationVersionID(aItems, sSessionId);
			} catch (e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_CURRENT_ERROR");
		});

		it("should insert all updated reference version items into the global temporary table before invoking the procedure", function() {
			// act
			var aItemsCloned = _.cloneDeep(aItems);
			persistency.Item.updateReferencedCalculationVersionID(aItemsCloned, sSessionId);
			// assert
			var oTempTableContent = mockstar.execQuery("select * from {{gtt_reference_calculation_version_items}} order by ITEM_ID" );
			
			expect(oTempTableContent).toMatchData({
			        "ITEM_ID":[3002,3004],
			        "CALCULATION_VERSION_ID":[2809,2809],
			        "ITEM_CATEGORY_ID":[ItemCategory.ReferencedVersion,ItemCategory.ReferencedVersion],
			        "REFERENCED_CALCULATION_VERSION_ID":[4809,5809]
		    },[ "ITEM_ID" ]);
		});

		it("should insert all updated reference version items (accounts included) into the global temporary table before invoking the procedure", function() {
			// act
			var aItemsCloned = _.cloneDeep(aItems);
			var sAccountId = 'AC11';
			aItemsCloned[0].ACCOUNT_ID = sAccountId;
			aItemsCloned[1].ACCOUNT_ID = sAccountId;
			persistency.Item.updateReferencedCalculationVersionID(aItemsCloned, sSessionId);
			// assert
			var oTempTableContent = mockstar.execQuery("select * from {{gtt_reference_calculation_version_items}} order by ITEM_ID" );
			
			expect(oTempTableContent).toMatchData({
			        "ITEM_ID":[3002,3004],
			        "CALCULATION_VERSION_ID":[2809,2809],
			        "ITEM_CATEGORY_ID":[ItemCategory.ReferencedVersion,ItemCategory.ReferencedVersion],
			        "REFERENCED_CALCULATION_VERSION_ID":[4809,5809],
					"ACCOUNT_ID": [sAccountId, sAccountId]
		    },[ "ITEM_ID" ]);
			
		});
		
		it("should update the reference version items in the master calculation version", function(){
			//arrange
			var oReferencedItemValues = mockstar.execQuery("select * from {{item}} where item_id = 5001 or item_id = 7001 order by ITEM_ID");
			var oReferencedVersionValue = mockstar.execQuery("select REPORT_CURRENCY_ID, calculation_version_id from {{calculation_version}} where calculation_version_id = "
			        +aItems[0].REFERENCED_CALCULATION_VERSION_ID+" or calculation_version_id = "
			        +aItems[1].REFERENCED_CALCULATION_VERSION_ID+" order by calculation_version_id");
			
			// act
			persistency.Item.updateReferencedCalculationVersionID(aItems, sSessionId);
			// assert
			var oValuesAfter = mockstar.execQuery("select ITEM_ID, ITEM_CATEGORY_ID, REFERENCED_CALCULATION_VERSION_ID, QUANTITY, QUANTITY_UOM_ID, " +
			" TOTAL_QUANTITY, TOTAL_QUANTITY_DEPENDS_ON, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, PRICE_SOURCE_ID, LOT_SIZE, IS_ACTIVE, " +
			" HIGHLIGHT_GREEN, HIGHLIGHT_ORANGE, HIGHLIGHT_YELLOW, ACCOUNT_ID, COMPANY_CODE_ID, PLANT_ID, BUSINESS_AREA_ID , PROFIT_CENTER_ID " +
			" from {{item_temporary}} where item_id = "+aItems[0].ITEM_ID+
			" or item_id = "+aItems[1].ITEM_ID+" order by ITEM_ID");
			
			function referencedValues(field){
			    return oReferencedItemValues.columns[field].rows;
			}
			var oOrigItems = oBuiltTestData.ItemMasterTempTestData;
			
			// keep existing values of QUANTITY, TOTAL_QUANTITY, LOT_SIZE, and HIGHLIGHT_*
			// update the following columns with values from referenced version: REFERENCED_CALCULATION_VERSION_ID, QUANTITY_UOM_ID,
			// PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, PRICE, TRANSACTION_CURRENCY_ID, PRICE_UNIT, PRICE_UNIT_UOM_ID, PRICE_SOURCE_ID, 
			// ACCOUNT_ID, COMPANY_CODE_ID, PLANT_ID, BUSINESS_AREA_ID, PROFIT_CENTER_ID, ...
			var oExpectedData = {
			    "ITEM_ID": [aItems[0].ITEM_ID, aItems[1].ITEM_ID],
				"ITEM_CATEGORY_ID":[ItemCategory.ReferencedVersion,ItemCategory.ReferencedVersion],
                "REFERENCED_CALCULATION_VERSION_ID":[aItems[0].REFERENCED_CALCULATION_VERSION_ID, aItems[1].REFERENCED_CALCULATION_VERSION_ID],
                "QUANTITY":[oOrigItems.QUANTITY[1], oOrigItems.QUANTITY[3]], 
                "QUANTITY_UOM_ID":[referencedValues("TOTAL_QUANTITY_UOM_ID")[0], referencedValues("TOTAL_QUANTITY_UOM_ID")[1]], 
                "TOTAL_QUANTITY":[oOrigItems.TOTAL_QUANTITY[1], oOrigItems.TOTAL_QUANTITY[3]], 
                "TOTAL_QUANTITY_DEPENDS_ON":[oOrigItems.TOTAL_QUANTITY_DEPENDS_ON[1], oOrigItems.TOTAL_QUANTITY_DEPENDS_ON[3]],
                "PRICE_FIXED_PORTION":[referencedValues("TOTAL_COST_FIXED_PORTION")[0], referencedValues("TOTAL_COST_FIXED_PORTION")[1]], 
                "PRICE_VARIABLE_PORTION":[referencedValues("TOTAL_COST_VARIABLE_PORTION")[0], referencedValues("TOTAL_COST_VARIABLE_PORTION")[1]], 
                "PRICE":[referencedValues("TOTAL_COST")[0], referencedValues("TOTAL_COST")[1]], 
                "TRANSACTION_CURRENCY_ID":[oReferencedVersionValue.columns.REPORT_CURRENCY_ID.rows[0], oReferencedVersionValue.columns.REPORT_CURRENCY_ID.rows[1]], 
                "PRICE_UNIT":[referencedValues("TOTAL_QUANTITY")[0], referencedValues("TOTAL_QUANTITY")[1]], 
                "PRICE_UNIT_UOM_ID":[referencedValues("TOTAL_QUANTITY_UOM_ID")[0], referencedValues("TOTAL_QUANTITY_UOM_ID")[1]],
                "PRICE_SOURCE_ID":[referencedValues("PRICE_SOURCE_ID")[0], referencedValues("PRICE_SOURCE_ID")[1]], 	
                "LOT_SIZE":[oOrigItems.LOT_SIZE[1], oOrigItems.LOT_SIZE[3]], 
                "IS_ACTIVE":[1,1], 
                "HIGHLIGHT_GREEN":[oOrigItems.HIGHLIGHT_GREEN[1], oOrigItems.HIGHLIGHT_GREEN[3]], 
                "HIGHLIGHT_ORANGE":[oOrigItems.HIGHLIGHT_ORANGE[1], oOrigItems.HIGHLIGHT_ORANGE[3]], 
                "HIGHLIGHT_YELLOW":[oOrigItems.HIGHLIGHT_YELLOW[1], oOrigItems.HIGHLIGHT_YELLOW[3]], 
                //check values that are taken from referenced root item (not all values checked)
				"ACCOUNT_ID": [referencedValues("ACCOUNT_ID")[0], referencedValues("ACCOUNT_ID")[1]],
				"COMPANY_CODE_ID": [referencedValues("COMPANY_CODE_ID")[0], referencedValues("COMPANY_CODE_ID")[1]],
				"PLANT_ID": [referencedValues("PLANT_ID")[0], referencedValues("PLANT_ID")[1]],
				"BUSINESS_AREA_ID": [referencedValues("BUSINESS_AREA_ID")[0], referencedValues("BUSINESS_AREA_ID")[1]],
				"PROFIT_CENTER_ID": [referencedValues("PROFIT_CENTER_ID")[0], referencedValues("PROFIT_CENTER_ID")[1]],	
			};
			
			expect(oValuesAfter).toMatchData(oExpectedData, ["ITEM_ID"]);
		});
		
	});
	

	if (jasmine.plcTestRunParameters.mode === 'all') {
		describe('hasItemChildren', function() {

			var oParentItemData = {
				'SESSION_ID' : '10101',
				'ITEM_ID' : 3001,
				'CALCULATION_VERSION_ID' : 2809,
				'ITEM_CATEGORY_ID' : 1,
				'CHILD_ITEM_CATEGORY_ID' : 1,
				'IS_ACTIVE' : 1,
				'TOTAL_QUANTITY' : 1337,
				"PRICE_FIXED_PORTION" : 1,
				"PRICE_VARIABLE_PORTION" : 0,
				"TRANSACTION_CURRENCY_ID" : 'EUR',
				"PRICE_UNIT" : 1,
				"PRICE_UNIT_UOM_ID" : 'EUR'
			};

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables
				// and views
				mockstar.insertTableData("item_temporary", oParentItemData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return true when item has one child", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oChild = _.clone(oParentItemData);
				oChild.ITEM_ID = 2;
				oChild.PARENT_ITEM_ID = oParentItemData.ITEM_ID;
				mockstar.insertTableData("item_temporary", oChild);

				// act
				var bSubitemState = persistency.Item.hasItemChildren(oParentItemData, oParentItemData.SESSION_ID);

				// assert
				expect(bSubitemState).toBe(true);
			});

			it("should return true when item has two children", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oChild1 = _.clone(oParentItemData);
				var oChild2 = _.clone(oParentItemData);
				oChild1.ITEM_ID = 2;
				oChild1.PARENT_ITEM_ID = oParentItemData.ITEM_ID;
				oChild2.ITEM_ID = 3;
				oChild2.PARENT_ITEM_ID = oParentItemData.ITEM_ID;
				mockstar.insertTableData("item_temporary", oChild1);
				mockstar.insertTableData("item_temporary", oChild2);

				// act
				var bSubitemState = persistency.Item.hasItemChildren(oParentItemData, oParentItemData.SESSION_ID);

				// assert
				expect(bSubitemState).toBe(true);
			});

			it("should return false when item has NO children", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var bSubitemState = persistency.Item.hasItemChildren(oParentItemData, oParentItemData.SESSION_ID);

				// assert
				expect(bSubitemState).toBe(false);
			});

			it("should return false when item has one deleted children", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oChild = _.clone(oParentItemData);
				oChild.ITEM_ID = 2;
				oChild.IS_DELETED = 1;
				oChild.PARENT_ITEM_ID = oParentItemData.ITEM_ID;
				mockstar.insertTableData("item_temporary", oChild);

				// act
				var bSubitemState = persistency.Item.hasItemChildren(oParentItemData, oParentItemData.SESSION_ID);

				// assert
				expect(bSubitemState).toBe(false);
			});
		});
	}

	// TODO: remark: here we are testing the stored procedure, not the
	// markItemForDeletion procedure.
	// The reason is that mockstar replaces the stored procedure call with
	// "xsunit.<userschema>" instead of
	// "<userschema>" due to db rights.
	if (jasmine.plcTestRunParameters.mode === 'all') {
		describe('markItemForDeletion.p_item_delete_item_with_children', function() {
			var mockstar = null;
			var sSessionId = '10101';

			// Tree structure of the items:
			// 0: 3001
			// |_1: 3002
			// | |_2: 3003
			// |_3: 3004
			var oItemData = {
				"SESSION_ID" : [ sSessionId, sSessionId, sSessionId, sSessionId ],
				"ITEM_ID" : [ 3001, 3002, 3003, 3004 ],
				"CALCULATION_VERSION_ID" : [ 2809, 2809, 2809, 2809 ],
				"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
				"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
				"MATERIAL_ID" : [ 'P-100', 'P-100', 'P-100', 'P-100' ],
				"ITEM_DESCRIPTION" : [ 'Kalkulation Pumpe P-100 Baseline Version', 'Pumpe Part 1', 'Pumpe Part 1.1', 'Pumpe Part 2' ],
				"IS_ACTIVE" : [ 1, 1, 1, 1 ],
				"PARENT_ITEM_ID" : [ null, 3001, 3002, 3001 ],
				"PREDECESSOR_ITEM_ID" : [ null, null, null, 3002 ],
				"IS_DIRTY" : [ 0, 0, 0, 0 ],
				"IS_DELETED" : [ 0, 0, 0, 0 ],
				'PRICE_FIXED_PORTION' : [ 1, 1, 1, 1, 1 ],
				'PRICE_VARIABLE_PORTION' : [ 0, 0, 0, 0, 0 ],
				'TRANSACTION_CURRENCY_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR', 'EUR' ],
				'PRICE_UNIT' : [ 1, 1, 1, 1, 1 ],
				'PRICE_UNIT_UOM_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR', 'EUR' ]
			};

			beforeOnce(function() {

				mockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel : "sap.plc.db.calculationmanager.procedures/p_item_delete_item_with_children", // procedure
					// or view
					// under
					// test
					substituteTables : // substitute all used tables in the
					// procedure or view
					{
						item_temporary : "sap.plc.db::basis.t_item_temporary"
					}
				});
			});

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables
				// and views
				mockstar.insertTableData("item_temporary", oItemData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				// mockstar.cleanup();
			});

			it('should mark node item (3002) and its children (3003) as deleted and update predecessors', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oItem = helpers.toObject(oItemData, 1);
				var iIsDeleted = 1;

				// act
				var oResult = persistency.Item.markItemForDeletion(sSessionId, oItem, mockstar.copiedTestModel.runTimePath);

				// assert
				expect(oResult.CALCULATION_VERSION_ID).toBe(oItemData.CALCULATION_VERSION_ID[1]);
				expect(oResult.DELETED_ITEM_COUNT).toEqual(1);

				// check the number of items - it should be same because we only set
				// the is_deleted flag
				var iCount = mockstar_helpers.getRowCount(mockstar, "item_temporary", "session_id=" + sSessionId);
				expect(iCount).toEqual(oItemData.ITEM_ID.length);

				var result = mockstar.execQuery("select item_id, predecessor_item_id from {{item_temporary}} where session_id="
						+ sSessionId);

				// check if item still exists
				iCount = mockstar_helpers.getRowCount(mockstar, "item_temporary", "item_id=" + oItem.ITEM_ID);
				expect(iCount).toEqual(1);

				// check if the predecessor_item_id of the following item has been
				// changed // predecessor_item_id
				result = mockstar.execQuery("select predecessor_item_id from {{item_temporary}} where item_id=" + oItemData.ITEM_ID[3]);

				var sResult = String(result.columns.PREDECESSOR_ITEM_ID.rows[0]);
				expect(sResult).toEqual('null');

				// check if childitems are deleted
				result = mockstar.execQuery("select item_id from {{item_temporary}} where is_deleted =" + iIsDeleted);
				expect(result).toBeDefined();
				var expectedResultJsonData = [ {
					"ITEM_ID" : 3002
				}, {
					"ITEM_ID" : 3003
				} ];
				expect(result).toMatchData(expectedResultJsonData, [ 'ITEM_ID' ]);
			});

			it('should mark leaf item (3003) for deletion', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oItem = helpers.toObject(oItemData, 3);
				var iIsDeleted = 1;

				// act
				var oResult = persistency.Item.markItemForDeletion(sSessionId, oItem, mockstar.copiedTestModel.runTimePath);

				// assert
				expect(oResult.CALCULATION_VERSION_ID).toBe(oItemData.CALCULATION_VERSION_ID[1]);
				expect(oResult.DELETED_ITEM_COUNT).toEqual(1);

				// check the number of items - it should be the same since we only
				// mark for deletion
				var expectedCount = oItemData.ITEM_ID.length;
				expect(mockstar_helpers.getRowCount(mockstar, "item_temporary", "session_id=" + sSessionId)).toBe(expectedCount);

				// check that item has been marked as deleted
				expect(
						mockstar_helpers.getRowCount(mockstar, "item_temporary", "item_id=" + oItem.ITEM_ID + " AND is_deleted="
								+ iIsDeleted)).toBe(1);

				// check if item is deleted
				var result = mockstar.execQuery("select item_id from {{item_temporary}} where is_deleted =" + iIsDeleted);
				var expectedResultJsonData = [ {
					"ITEM_ID" : oItem.ITEM_ID
				} ];
				expect(result).toMatchData(expectedResultJsonData, [ 'ITEM_ID' ]);
			});

			it('should do nothing if item does NOT exist', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oItem = helpers.toObject(oItemData, 0);
				oItem.ITEM_ID = 2999;

				// act
				var oResult = persistency.Item.markItemForDeletion(sSessionId, oItem, mockstar.copiedTestModel.runTimePath);

				// assert
				expect(oResult.DELETED_ITEM_COUNT).toEqual(0);
				var expectedCount = oItemData.ITEM_ID.length;
				expect(mockstar_helpers.getRowCount(mockstar, "item_temporary")).toBe(expectedCount);
			});

			it('should do nothing if session does NOT exist', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				sSessionId = "incorrect_session";
				var oItem = helpers.toObject(oItemData, 3);
				oItem.SESSION_ID = sSessionId;
				var expectedCount = oItemData.ITEM_ID.length;

				// act
				var oResult = persistency.Item.markItemForDeletion(sSessionId, oItem, mockstar.copiedTestModel.runTimePath);

				// assert
				expect(oResult.DELETED_ITEM_COUNT).toEqual(0);
				expect(mockstar_helpers.getRowCount(mockstar, "item_temporary")).toBe(expectedCount);

			});
		});
	}

	describe("delete items (permanently)", function() {
		var sSessionID = $.session.getUsername();

		var iCalcVersionID = 2809;

		var oItemData = {
			"ITEM_ID" : [ 3001, 3002, 3003, 3004 ],
			"CALCULATION_VERSION_ID" : [ iCalcVersionID, iCalcVersionID, iCalcVersionID, iCalcVersionID ],
			"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
			"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
			"MATERIAL_ID" : [ 'P-100', 'P-100', 'P-100', 'P-100' ],
			"IS_ACTIVE" : [ 1, 1, 1, 1 ],
			"PARENT_ITEM_ID" : [ null, 3001, 3002, 3001 ],
			"PREDECESSOR_ITEM_ID" : [ null, null, null, 3002 ],
			"CREATED_ON" : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
			"CREATED_BY" : [ "User1", "User1", "User1", "User1" ],
			"LAST_MODIFIED_ON" : [ new Date().toJSON(), new Date().toJSON(), new Date().toJSON(), new Date().toJSON() ],
			"LAST_MODIFIED_BY" : [ "User1", "User1", "User1", "User1" ],
			'PRICE_FIXED_PORTION' : [ 1, 1, 1, 1 ],
			'PRICE_VARIABLE_PORTION' : [ 0, 0, 0, 0 ],
			'TRANSACTION_CURRENCY_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ],
			'PRICE_UNIT' : [ 1, 1, 1, 1 ],
			'PRICE_UNIT_UOM_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ]
		};

		var oItemTempData = {
			"SESSION_ID" : [ sSessionID, sSessionID, sSessionID, sSessionID ],
			"ITEM_ID" : [ 3001, 3002, 3003, 3004 ],
			"CALCULATION_VERSION_ID" : [ iCalcVersionID, iCalcVersionID, iCalcVersionID, iCalcVersionID ],
			"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
			"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
			"MATERIAL_ID" : [ 'P-100', 'P-100', 'P-100', 'P-100' ],
			"ITEM_DESCRIPTION" : [ 'Kalkulation Pumpe P-100 Baseline Version', 'Pumpe Part 1', 'Pumpe Part 1.1', 'Pumpe Part 2' ],
			"IS_ACTIVE" : [ 1, 1, 1, 1 ],
			"PARENT_ITEM_ID" : [ null, 3001, 3002, 3001 ],
			"PREDECESSOR_ITEM_ID" : [ null, null, null, 3002 ],
			'PRICE_FIXED_PORTION' : [ 1, 1, 1, 1 ],
			'PRICE_VARIABLE_PORTION' : [ 0, 0, 0, 0 ],
			'TRANSACTION_CURRENCY_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ],
			'PRICE_UNIT' : [ 1, 1, 1, 1 ],
			'PRICE_UNIT_UOM_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ]
		};

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			// and views
			mockstar.insertTableData("item", oItemData);
			mockstar.insertTableData("item_temporary", oItemTempData);
			mockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				mockstar.insertTableData("item_ext", testData.oItemExtData);
				mockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			mockstar.initializeData();
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should delete all items that are marked for deletion of an opened calculation version in one session', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var expectedCount = 3;
			// mark an item to be deleted
			mockstar.execSingle("update {{item_temporary}} set IS_DELETED = 1 where ITEM_ID = 3001 and CALCULATION_VERSION_ID="
					+ iCalcVersionID + " and SESSION_ID='" + sSessionID + "'");
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				expect(mockstar_helpers.getRowCount(mockstar, "item_ext")).toBe(5);
				expect(mockstar_helpers.getRowCount(mockstar, "item_temporary_ext")).toBe(5);
			}
			// get number of items before deletion
			expect(mockstar_helpers.getRowCount(mockstar, "item")).toBe(4);
			expect(mockstar_helpers.getRowCount(mockstar, "item_temporary")).toBe(4);

			// act
			persistency.Item.deleteItems(sSessionID, iCalcVersionID);

			// assert
			expect(mockstar_helpers.getRowCount(mockstar, "item")).toBe(expectedCount);
			expect(mockstar_helpers.getRowCount(mockstar, "item_temporary")).toBe(expectedCount);

			if (jasmine.plcTestRunParameters.generatedFields === true) {
				expect(mockstar_helpers.getRowCount(mockstar, "item_temporary_ext")).toBe(4);
				expect(mockstar_helpers.getRowCount(mockstar, "item_ext")).toBe(4);
			}
		});
	});

	if (jasmine.plcTestRunParameters.mode === 'all') {
		describe('setPriceTransactionCurrencyForAssemblyItems', function() {
			var sSessionID = "10101";
			var iCalcVersionID = 2809;

			var oItemTempData = {
				"SESSION_ID" : [ sSessionID, sSessionID, sSessionID, sSessionID ],
				"ITEM_ID" : [ 3001, 3002, 3003, 3004 ],
				"CALCULATION_VERSION_ID" : [ iCalcVersionID, iCalcVersionID, iCalcVersionID, iCalcVersionID ],
				"ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
				"CHILD_ITEM_CATEGORY_ID" : [ 1, 1, 1, 1 ],
				"MATERIAL_ID" : [ 'P-100', 'P-100', 'P-100', 'P-100' ],
				"ITEM_DESCRIPTION" : [ 'Kalkulation Pumpe P-100 Baseline Version', 'Pumpe Part 1', 'Pumpe Part 1.1', 'Pumpe Part 2' ],
				"IS_ACTIVE" : [ 1, 1, 1, 1 ],
				"PARENT_ITEM_ID" : [ null, 3001, 3002, 3001 ],
				"PREDECESSOR_ITEM_ID" : [ null, null, null, 3002 ],
				'PRICE_FIXED_PORTION' : [ 1, 1, 1, 1 ],
				'PRICE_VARIABLE_PORTION' : [ 0, 0, 0, 0 ],
				'TRANSACTION_CURRENCY_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ],
				'PRICE_UNIT' : [ 1, 1, 1, 1 ],
				'PRICE_UNIT_UOM_ID' : [ 'EUR', 'EUR', 'EUR', 'EUR' ]
			};

			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables
				// and views
				mockstar.insertTableData("item_temporary", oItemTempData);
				mockstar.initializeData();
			});

			afterOnce(function() {
				mockstar.cleanup();
			});

			it("should return true when transaction_currency_id of assambly items is updated", function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				persistency.Item.setPriceTransactionCurrencyForAssemblyItems(sSessionID, iCalcVersionID, "USD");

				// assert				
				var result = mockstar.execQuery("select TRANSACTION_CURRENCY_ID, ITEM_ID from {{item_temporary}} "
						+ "where session_id = '" + sSessionID + "' and calculation_version_id = " + iCalcVersionID);
				expect(result).toMatchData({
					"ITEM_ID" : [ 3001, 3002, 3003, 3004 ],
					'TRANSACTION_CURRENCY_ID' : [ 'USD', 'USD', 'EUR', 'EUR' ]
				}, [ 'ITEM_ID', 'TRANSACTION_CURRENCY_ID' ]);

			});

			it("should return false when transaction_currency_id of assambly items is not updated (calculation version not found)",
					function() {
						// arrange
						var persistency = new Persistency(jasmine.dbConnection);

						var iCalcVersionID = 1234;

						// act
						persistency.Item.setPriceTransactionCurrencyForAssemblyItems(sSessionID, iCalcVersionID, "USD");

						// assert						
						var result = mockstar.execQuery("select TRANSACTION_CURRENCY_ID from {{item_temporary}} "
								+ "where session_id = '" + sSessionID + "' and calculation_version_id = " + iCalcVersionID);
						expect(result.columns.TRANSACTION_CURRENCY_ID.rows.length).toEqual(0);

					});
		});
	}

	describe('getFormulasAndRollupsForStandardAndCustomFields', () => {
		it('return information about standard and custom fields', () => {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			// act
			const result = persistency.Item.getFormulasAndRollupsForStandardAndCustomFields();

			// assert
			// check some values for standard fields
			if (jasmine.plcTestRunParameters.generatedFields === true) {
				// make sure that only item related custom fields are returned
				Object.keys(result).forEach(iItemCategory => {
					Object.keys(result[iItemCategory]).forEach(sFieldName => {
						if (!MapStandardFieldsWithFormulas.has(sFieldName)){
							expect(sFieldName.startsWith("CUST_")).toBe(true);
						}
					});
				});

				// formulas for standard fields; make sure that no other custom fields lie CCEN_, ... are included
				["1", "2", "3", "4", "5", "6", "7", "8"].forEach(iItemCategoryId => {
					jasmine.log(`Checking custom fields for item category ${iItemCategoryId}`)
					expect(result[iItemCategoryId].PRICE_UNIT.hasFormula).toBe(true);
					expect(result[iItemCategoryId].PRICE_FIXED_PORTION.hasFormula).toBe(true);
					expect(result[iItemCategoryId].PRICE_VARIABLE_PORTION.hasFormula).toBe(true);
				});

				// custom fields
				expect(result[0].CUST_INT_FORMULA).toBe(undefined); // field not defined for item category 0
				expect(result[1].CUST_INT_FORMULA.hasFormula).toBe(true);
				expect(result[1].CUST_INT_FORMULA.isRolledUp).toBe(true);
				
				expect(result[0].CUST_DECIMAL_FORMULA).toBe(undefined); // field not defined for item category 0
				expect(result[2].CUST_DECIMAL_FORMULA.hasFormula).toBe(true);
				expect(result[2].CUST_DECIMAL_FORMULA.isRolledUp).toBe(true);
			} else {
				expect(result[0].PRICE_UNIT.isRolledUp).toBe(true); // rolled up by CalcEngine
				expect(result[0].PRICE_FIXED_PORTION.isRolledUp).toBe(true); // rolled up by CalcEngine
				expect(result[0].PRICE_VARIABLE_PORTION.isRolledUp).toBe(true); // rolled up by CalcEngine
				expect(result[0].QUANTITY).toBeUndefined; // field not defined for item category 0
				expect(result[1].QUANTITY.hasFormula).toBe(false);
				expect(result[1].QUANTITY.isRolledUp).toBe(false);
				
				expect(result[0].PRICE_UNIT.hasFormula).toBe(false);
				expect(result[0].PRICE_FIXED_PORTION.hasFormula).toBe(false);
				expect(result[0].PRICE_VARIABLE_PORTION.hasFormula).toBe(false);
			}
		});
	});

	describe("getParentItemIds", () => {
		let oPersistency = null;
		beforeEach(() => {
			mockstar.clearAllTables();
			mockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);

			oPersistency = new Persistency(jasmine.dbConnection);

		});

		const iCvId = testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0];
		const sSessionId = testData.oItemTemporaryTestData.SESSION_ID[0];

		it("should return empty array if t_item_temporary is empty", () => {
			// arrange
			mockstar.clearAllTables();

			// act
			const result = oPersistency.Item.getParentItemIds(iCvId, sSessionId);

			// assert
			expect(result).toEqual([]);
		});

		it(`should return 3001, 3002 for calculation version ${iCvId} and session ${sSessionId}`, () => {
			// act
			const result = oPersistency.Item.getParentItemIds(iCvId, sSessionId);

			// assert
			expect(result.length).toBe(2);
			expect(result.indexOf(3001) > -1).toBe(true);
			expect(result.indexOf(3002) > -1).toBe(true);
		});

		it(`should return parent item id 3001 only once even this is the parent to multiple items`, () => {
			// arrange
			const oAdditionalItem = new TestDataUtility(testData.oItemTemporaryTestData).getObject(0);
			oAdditionalItem.ITEM_ID = 3004;
			oAdditionalItem.PARENT_ITEM_ID = 3001;
			mockstar.insertTableData("item_temporary", oAdditionalItem);
			
			// act
			const result = oPersistency.Item.getParentItemIds(iCvId, sSessionId);

			// assert
			expect(result.length).toBe(2);
			expect(result.indexOf(3001) > -1).toBe(true);
			expect(result.indexOf(3002) > -1).toBe(true);
		});
		
        it(`should not return parent item id 3003 if it has only deleted children`, () => {
            // arrange
            const oDeletedItem = new TestDataUtility(testData.oItemTemporaryTestData).getObject(0);
            oDeletedItem.ITEM_ID = 3004;
            oDeletedItem.PARENT_ITEM_ID = 3003;
            oDeletedItem.IS_DELETED = 1;
            mockstar.insertTableData("item_temporary", oDeletedItem);
            
            // act
            const result = oPersistency.Item.getParentItemIds(iCvId, sSessionId);

            // assert
            expect(result.length).toBe(2);
            expect(result.indexOf(3003) > -1).toBe(false);
        });
        
        it(`should return parent item id 3003 if it has both deleted and non-deleted children`, () => {
            // arrange
            const oDeletedItem = new TestDataUtility(testData.oItemTemporaryTestData).getObject(0);
            oDeletedItem.ITEM_ID = 3004;
            oDeletedItem.PARENT_ITEM_ID = 3003;
            oDeletedItem.IS_DELETED = 1;
            mockstar.insertTableData("item_temporary", oDeletedItem);
            
            const oNonDeletedItem = new TestDataUtility(testData.oItemTemporaryTestData).getObject(0);
            oNonDeletedItem.ITEM_ID = 3005;
            oNonDeletedItem.PARENT_ITEM_ID = 3003;
            oNonDeletedItem.IS_DELETED = 0;
            mockstar.insertTableData("item_temporary", oNonDeletedItem);
            
            // act
            const result = oPersistency.Item.getParentItemIds(iCvId, sSessionId);

            // assert
            expect(result.length).toBe(3);
            expect(result.indexOf(3003) > -1).toBe(true);
        });        

		it(`should return empty array for calculation version ${iCvId} and different session id`, () => {
			// act
			const result = oPersistency.Item.getParentItemIds(iCvId, "different_session");

			// assert
			expect(result).toEqual([]);
		});

		it(`should return empty array for different calculation version id and session ${sSessionId}`, () => {
			// act
			const result = oPersistency.Item.getParentItemIds(-123, sSessionId);

			// assert
			expect(result).toEqual([]);
		});
	});

	describe("getParentsForItems", () => {

		let oMockstar = null;
		let oPersistency = null;
		const sDate = "2021-07-21 09:35:31.544000000";

		let temporary_data = {
			"ITEM_ID": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
			"CALCULATION_VERSION_ID": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			"PARENT_ITEM_ID": [null, 1, 2, 2, 4, 4, 4, 7, 7, 7, 1, 1, 1, 11, 11, 12, 16, 17, 17, 19],
			"IS_ACTIVE": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			"ITEM_CATEGORY_ID": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			"CREATED_ON": [ sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate ],
			"CREATED_BY": [ "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user"],
			"LAST_MODIFIED_ON": [ sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate, sDate ],
			"LAST_MODIFIED_BY": [ "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user", "some_user"]
		};

		beforeOnce(() => {
			oMockstar = new MockstarFacade({
				
				substituteTables: {
					
					item: {
						name: mTableNames.item,
						data: temporary_data
					}
				}
			});
		});

		beforeEach(() => {
			oMockstar.initializeData();

			oPersistency = new Persistency(jasmine.dbConnection);
		});

		it(`should return the list of parents for the given items all the way to the root`, () => {
			// act 
			const result = oPersistency.Item.getParentsForItems(1, 1, [14, 15, 8, 9, 3]);

			// assert 
			expect(result).toEqual([ 2, 7, 11, 1, 4 ]);
		});
	});
	
	describe("getValidItemIds", () => {
		let oPersistency = null;
		beforeEach(() => {
			mockstar.clearAllTables();
			mockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);

			oPersistency = new Persistency(jasmine.dbConnection);

		});

		const iCvId = testData.oItemTemporaryTestData.CALCULATION_VERSION_ID[0];
		const sSessionId = testData.oItemTemporaryTestData.SESSION_ID[0];

		it("should return empty array if t_item_temporary is empty", () => {
			// arrange
			mockstar.clearAllTables();
			const aItemIds = [1, 2, 3]; // some item_ids to check

			// act
			const result = oPersistency.Item.getValidItemIds(aItemIds, iCvId, sSessionId);

			// assert
			expect(result).toEqual([]);
		});

		it("should only return existing item_ids in t_item_temporary", () => {
			// arrange
			const aItemIds = [1, 2, 3001, 3002]; // some item_ids to check, only 3001 and 3002 exist

			// act
			const result = oPersistency.Item.getValidItemIds(aItemIds, iCvId, sSessionId);

			// assert
			result.sort(); // make the test reliable as ordering is not guaranteed
			expect(result).toEqual([3001, 3002]); // only existing item_ids must be returned
		});

		it("should return empty array if no item_id exists in t_item_temporary", () => {
			// arrange
			const aItemIds = [1, 2]; // some item_ids to check, non exists in db

			// act
			const result = oPersistency.Item.getValidItemIds(aItemIds, iCvId, sSessionId);

			// assert
			expect(result).toEqual([]);
		});
	});

	describe('getItemCategories', () => {
		let oPersistency = null;
		beforeEach(() => {
			mockstar.clearAllTables();
			mockstar.insertTableData("item_category", testData.oItemTemporaryTestData);

			oPersistency = new Persistency(jasmine.hdbConnection);

		});
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);