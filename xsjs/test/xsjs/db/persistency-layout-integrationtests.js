var mockstar_helpers = require("../../testtools/mockstar_helpers");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;


describe('xsjs.db.persistency-layout-integrationtests', function() {

	var mockstar = null;

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				layout: 'sap.plc.db::basis.t_layout',
				layout_personal: 'sap.plc.db::basis.t_layout_personal',
				layout_columns: 'sap.plc.db::basis.t_layout_column',
				layout_hidden_field:'sap.plc.db::basis.t_layout_hidden_field'
			}
		});
	});

	describe('get', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
			mockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
			mockstar.insertTableData("layout_columns", testData.oLayoutColumns);
			mockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return all corporate layouts and the ones defined by the user', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var oRetrievedObject = persistency.Layout.getLayouts(testData.sTestUser, 1);

			// assert
			//there are 2 corporate layouts and 2 defined by the current user in the testdata
			//these 4 layouts have defined 9 columns, and 6 hidden fields in testdata
			expect(oRetrievedObject.LAYOUT.length).toEqual(4);
			expect(oRetrievedObject.LAYOUT_COLUMN.length).toEqual(9);
			expect(oRetrievedObject.HIDDEN_FIELDS.length).toEqual(6);
		});
	});

	describe('create', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
			mockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
			mockstar.insertTableData("layout_columns", testData.oLayoutColumns);
			mockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should create the corporate layout', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var oCreatedLayout = {
					"LAYOUT_ID": -1,
					"LAYOUT_NAME": "Test",
					"LAYOUT_COLUMNS": [{
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 430
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 43
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 34
					},
					{
						"DISPLAY_ORDER": 3,
						"COSTING_SHEET_ROW_ID": "DMC",
						"COLUMN_WIDTH": 25
					},
					{
						"DISPLAY_ORDER": 4,
						"COST_COMPONENT_ID": 3,
						"COLUMN_WIDTH": 25
					}],
					"HIDDEN_FIELDS": [{
						"PATH": "Item.Vendor",
						"BUSINESS_OBJECT": "Vendor",
						"COLUMN_ID": "VENDOR_ID"
					},
					{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CONFIDENCE_LEVEL_ID"
					}]
			}

			//number of records in tables before the creation of new layout
			var iLayoutBefore = mockstar_helpers.getRowCount(mockstar, "layout");
			var iLayoutPersBefore = mockstar_helpers.getRowCount(mockstar, "layout_personal");
			var iLayoutColumnsBefore = mockstar_helpers.getRowCount(mockstar, "layout_columns");
			var iLayoutHiddenFieldsBefore = mockstar_helpers.getRowCount(mockstar, "layout_hidden_field");

			//act
			var result = persistency.Layout.create(oCreatedLayout, testData.sTestUser, 1);

			//assert
			expect(result).toBeGreaterThan(0);
			//check tables
			expect(mockstar_helpers.getRowCount(mockstar, "layout")).toBe(iLayoutBefore+1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_personal")).toBe(iLayoutPersBefore);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns")).toBe(iLayoutColumnsBefore+5);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field")).toBe(iLayoutHiddenFieldsBefore+2);

		});
		
		it('should create the corporate layout, cost component id will remains be 0 in database as in the request', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var oCreatedLayout = {
					"LAYOUT_ID": -1,
					"LAYOUT_NAME": "Test",
					"LAYOUT_TYPE": 2,
					"LAYOUT_COLUMNS": [
					{
						"DISPLAY_ORDER": 4,
						"COST_COMPONENT_ID": 0,
						"COLUMN_WIDTH": 25
					}]
			}

			//act
			var result = persistency.Layout.create(oCreatedLayout, testData.sTestUser, 1);

			//assert
			expect(mockstar_helpers.getRowCount(mockstar, "layout", " LAYOUT_TYPE = 2")).toBe(1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns", "COST_COMPONENT_ID = 0 and DISPLAY_ORDER = 4")).toBe(1);
		});

		it('should create the personal layout', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var oCreatedLayout = {
					"LAYOUT_ID": -1,
					"IS_CURRENT": 1,
					"LAYOUT_COLUMNS": [{ 
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 430
					},
					{ 
						"DISPLAY_ORDER": 1,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 43
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 34
					},
					{
						"DISPLAY_ORDER": 3,
						"COSTING_SHEET_ROW_ID": "DMC",
						"COLUMN_WIDTH": 25
					},
					{
						"DISPLAY_ORDER": 4,
						"COST_COMPONENT_ID": 3,
						"COLUMN_WIDTH": 25
					}],
					"HIDDEN_FIELDS": [{
						"PATH": "Item.Vendor",
						"BUSINESS_OBJECT": "Vendor",
						"COLUMN_ID": "VENDOR_ID"
					},
					{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CONFIDENCE_LEVEL_ID"
					}]
			}

			//number of records in tables before the creation of new layout
			var iLayoutBefore = mockstar_helpers.getRowCount(mockstar, "layout");
			var iLayoutPersBefore = mockstar_helpers.getRowCount(mockstar, "layout_personal");
			var iLayoutColumnsBefore = mockstar_helpers.getRowCount(mockstar, "layout_columns");
			var iLayoutHiddenFieldsBefore = mockstar_helpers.getRowCount(mockstar, "layout_hidden_field");

			//act
			var result = persistency.Layout.create(oCreatedLayout, testData.sTestUser, 0);

			// assert
			expect(result).toBeGreaterThan(0);
			//check tables
			expect(mockstar_helpers.getRowCount(mockstar, "layout")).toBe(iLayoutBefore+1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_personal")).toBe(iLayoutPersBefore+1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns")).toBe(iLayoutColumnsBefore+5);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field")).toBe(iLayoutHiddenFieldsBefore+2);
		});
	});

	describe('exist', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return false if layout does not exist', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var response = persistency.Layout.exists(100);

			// assert
			expect(response).toEqual(false);
		});

		it('should return true if layout exists', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var response = persistency.Layout.exists(2);

			// assert
			expect(response).toEqual(true);
		});
	});

	describe('update', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
			mockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
			mockstar.insertTableData("layout_columns", testData.oLayoutColumns);
			mockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should update the corporate layout', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			//the layout with id should be updated in t_layout
			//the existing columns and hidden fields that have layout_id=2 should be deleted
			//and the columns and hidden_fields from the request should be created
			var oUpdateLayout = {
					"LAYOUT_ID": 2,
					"LAYOUT_NAME": "Test update",
					"LAYOUT_COLUMNS": [{
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 430
					},
					{
						"DISPLAY_ORDER": 1,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 43
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 34
					},
					{
						"DISPLAY_ORDER": 3,
						"COSTING_SHEET_ROW_ID": "DMC",
						"COLUMN_WIDTH": 25
					},
					{
						"DISPLAY_ORDER": 4,
						"COST_COMPONENT_ID": 3,
						"COLUMN_WIDTH": 25
					}],
					"HIDDEN_FIELDS": [{
						"PATH": "Item.Vendor",
						"BUSINESS_OBJECT": "Vendor",
						"COLUMN_ID": "VENDOR_ID"
					},
					{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CONFIDENCE_LEVEL_ID"
					}]
			}

			//act
			var result = persistency.Layout.update(oUpdateLayout, testData.sTestUser, 1);

			//assert
			expect(result).toBe(2);
			//check tables
			expect(mockstar_helpers.getRowCount(mockstar, "layout", "LAYOUT_ID=2 and LAYOUT_NAME='Test update'")).toBe(1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns", "LAYOUT_ID= 2")).toBe(5);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field", "LAYOUT_ID=2")).toBe(2);

		});

		it('should update the personal layout', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var oUpdateLayout = {
					"LAYOUT_ID": 7,
					"IS_CURRENT": 0,
					"LAYOUT_COLUMNS": [{ 
						"DISPLAY_ORDER": 0,
						"COLUMN_WIDTH": 430
					},
					{ 
						"DISPLAY_ORDER": 1,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 43
					},
					{
						"DISPLAY_ORDER": 2,
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY_UOM_ID",
						"COLUMN_WIDTH": 34
					},
					{
						"DISPLAY_ORDER": 3,
						"COSTING_SHEET_ROW_ID": "DMC",
						"COLUMN_WIDTH": 25
					},
					{
						"DISPLAY_ORDER": 4,
						"COST_COMPONENT_ID": 3,
						"COLUMN_WIDTH": 25
					}],
					"HIDDEN_FIELDS": [{
						"PATH": "Item.Vendor",
						"BUSINESS_OBJECT": "Vendor",
						"COLUMN_ID": "VENDOR_ID"
					},
					{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CONFIDENCE_LEVEL_ID"
					}]
			}

			//act
			var result = persistency.Layout.update(oUpdateLayout, testData.sTestUser, 0);

			// assert
			expect(result).toBe(7);
			//check tables
			expect(mockstar_helpers.getRowCount(mockstar, "layout_personal", "LAYOUT_ID=7 and IS_CURRENT=0")).toBe(1);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns", "LAYOUT_ID=7")).toBe(5);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field", "LAYOUT_ID=7")).toBe(2);
		});
	});

	describe('isNameUnique', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
			mockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should return true if layout name is not the same as a corporate name or personal name (for the same user)', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var response = persistency.Layout.isNameUnique(10, 'Test10', testData.sTestUser);
			var response1 = persistency.Layout.isNameUnique(7, 'Test7', testData.sTestUser);

			// assert
			expect(response).toEqual(true);
			expect(response1).toEqual(true);
		});

		it('should return false if layout name is the same as a corporate name or personal name (for the same user)', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var response = persistency.Layout.isNameUnique(3, 'Test', testData.sTestUser);
			var response1 = persistency.Layout.isNameUnique(4, 'Test6', testData.sTestUser);

			// assert
			expect(response).toEqual(false);
			expect(response1).toEqual(false);
		});
		
		it('should return true if layout name is the same as the old name', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);

			//act
			var response = persistency.Layout.isNameUnique(6, 'test6', testData.sTestUser); //personal layout
			var response1 = persistency.Layout.isNameUnique(2, 'Test', testData.sTestUser); //corporate layout

			// assert
			expect(response).toEqual(true);
			expect(response1).toEqual(true);
		});
	});

	describe('delete', function() {
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("layout", testData.oLayout);
			mockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
			mockstar.insertTableData("layout_columns", testData.oLayoutColumns);
			mockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
		});

		afterOnce(function() {
			mockstar.cleanup();
		});

		it('should delete a personal layout for the current logged in user', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var iLayoutId = 3;

			//act
			var result = persistency.Layout.deleteLayout(iLayoutId, testData.sTestUser, 0);

			// assert
			expect(result).toEqual(1);
			//check tables
			expect(mockstar_helpers.getRowCount(mockstar, "layout", "LAYOUT_ID= " + iLayoutId)).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_personal", "LAYOUT_ID= " + iLayoutId)).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns", "LAYOUT_ID= " + iLayoutId)).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field", "LAYOUT_ID= " + iLayoutId)).toBe(0);
		});

		it('should throw exception when trying to delete a personal layout for another user than the logged in one', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var iLayoutId = 1;

			//act
			try {
				var result = persistency.Layout.deleteLayout(iLayoutId, testData.sTestUser, 0);
			} catch(e) {
				var exception = e;
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
		});

		it('should delete a corporate layout', function() {
			// arrange
			var persistency = new Persistency(jasmine.dbConnection);
			var iLayoutId = 4;

			//act
			var result = persistency.Layout.deleteLayout(iLayoutId, testData.sTestUser, 1);

			// assert
			expect(result).toEqual(1);
			//check table
			expect(mockstar_helpers.getRowCount(mockstar, "layout", "LAYOUT_ID= " + iLayoutId)).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_columns", "LAYOUT_ID= " + iLayoutId)).toBe(0);
			expect(mockstar_helpers.getRowCount(mockstar, "layout_hidden_field", "LAYOUT_ID= " + iLayoutId)).toBe(0);
		});
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);