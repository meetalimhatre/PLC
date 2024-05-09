var _ = require("lodash");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

describe('xsjs.db.layout-integrationtests', function() {

	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					substituteTables : {
						layout: 'sap.plc.db::basis.t_layout',
						layout_personal: 'sap.plc.db::basis.t_layout_personal',
						layout_columns: 'sap.plc.db::basis.t_layout_column',
						layout_hidden_field:'sap.plc.db::basis.t_layout_hidden_field',
						session : {
							name : "sap.plc.db::basis.t_session",
							data : testData.oSessionTestData
						},
						metadata : {
							name : "sap.plc.db::basis.t_metadata",
							data : testData.mCsvFiles.metadata
						},
						costing_sheet_row : 'sap.plc.db::basis.t_costing_sheet_row',
					}
				});
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
	});

	function buildRequest(bValueParam, iHttpMethod, oLayout) {
		var params = [ {
			"name" : "is_corporate",
			"value" : bValueParam
		} ];


		params.get = function(sArgument) {
			var value;
			_.each(this, function(oParameter) {
				if (oParameter.name === sArgument) {
					value = oParameter.value;
				}
			});
			return value;
		};

		var oBody = {
				asString : function() {
					return JSON.stringify(oLayout);
				}
		};

		var oRequest = {
				queryPath : "layouts",
				method : iHttpMethod,
				parameters : params,
				body : oBody
		};
		return oRequest;
	}

	if(jasmine.plcTestRunParameters.mode === 'all'){

		describe('get', function() {

			var params = [];
			params.get = function() {
				return undefined;
			};
			var oRequest = {
					queryPath : "layouts",
					method : $.net.http.GET,
					parameters : params
			};

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.initializeData();
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				oMockstar.insertTableData("layout_columns", testData.oLayoutColumns);
				oMockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
				});

			it('should read all the corporate layouts and the personal layouts of the user that is logged in', function() {

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body.LAYOUTS;
				//check data from the response
				expect(oReturnedObject.length).toBe(4);
				expect(oReturnedObject).toMatchData({
					"LAYOUT_ID": [2, 3, 6, 5],
					"LAYOUT_NAME": ['Test', null, 'Test6', 'Test5'],
					"IS_CORPORATE": [ 1, 0, 0, 1,],
					"IS_CURRENT": [null, 1, 0, null],
					"LAYOUT_TYPE": [1, 1, 1, 1]
				},["LAYOUT_ID"]);
				
				expect(oReturnedObject[0].LAYOUT_COLUMNS.length).toBe(1);
				expect(oReturnedObject[0].HIDDEN_FIELDS.length).toBe(2);
				expect(oReturnedObject[1].LAYOUT_COLUMNS.length).toBe(1);
				expect(oReturnedObject[1].HIDDEN_FIELDS.length).toBe(1);
				expect(oReturnedObject[2].LAYOUT_COLUMNS.length).toBe(4);
				expect(oReturnedObject[2].HIDDEN_FIELDS.length).toBe(1);
				expect(oReturnedObject[3].LAYOUT_COLUMNS.length).toBe(3);
				expect(oReturnedObject[3].HIDDEN_FIELDS.length).toBe(2);
			});
		});

		describe('create (POST)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();		
				oMockstar.insertTableData("costing_sheet_row", {"COSTING_SHEET_ROW_ID" : "DMC",
																"COSTING_SHEET_ID" : "COGM", 
																"COSTING_SHEET_ROW_TYPE": 1,
																"CALCULATION_ORDER": 2,
																"_VALID_FROM":  '2015-01-01T00:00:00.000Z'});
			});


			it('should create corporate layout for valid input', function(){
				//arrange
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"LAYOUT_NAME": "Testing",
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 0,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY",
							"COLUMN_WIDTH": 43
						},
						{
							"DISPLAY_ORDER": 1,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY_UOM_ID",
							"COLUMN_WIDTH": 34
						},
						{
							"DISPLAY_ORDER": 2,
							"COSTING_SHEET_ROW_ID": "DMC",
							"COLUMN_WIDTH": 25
						},
						{
							"DISPLAY_ORDER": 3,
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
				};
				var oRequest = buildRequest('true', $.net.http.POST, oNewLayout);
								
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(_.isObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body).toBeDefined;

				var oResponseData = oResponseObject.body;				
				expect(oResponseData.LAYOUT_ID).toBeGreaterThan(0);
			});

			it('should create personal layout for valid input', function(){
				//arrange
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"IS_CURRENT": 1,
						"LAYOUT_COLUMNS": [{
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
							"DISPLAY_ORDER": 0,
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
				};

				var oRequest = buildRequest('false', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(_.isObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body).toBeDefined;

				var oResponseData = oResponseObject.body;				
				expect(oResponseData.LAYOUT_ID).toBeGreaterThan(0);
			});	
			
			it('should create personal layout for valid input, even if the hidden fields is empty array', function(){
				//arrange
				//the same column_id can appear multiple times in the layout_columns
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"IS_CURRENT": 1,
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 1,
							"PATH": "ITEM",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY",
							"COLUMN_WIDTH": 43
						}, {
						"DISPLAY_ORDER": 2,
						"PATH": "ITEM",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "QUANTITY",
						"COLUMN_WIDTH": 43
					}],
						"HIDDEN_FIELDS": []
				};

				var oRequest = buildRequest('false', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
			});	
		
			it('should throw error when the ids of metadata are not found in database', function(){
				//arrange
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"IS_CURRENT": 1,
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 1,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITYY",
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
							"DISPLAY_ORDER": 0,
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
				};

				var oRequest = buildRequest('false', $.net.http.POST, oNewLayout);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should throw error when trying to create layout that has the same name as an existing user personal layout', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"LAYOUT_NAME": "Test6"
				};

				var oRequest = buildRequest('true', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_LAYOUT_NAMING_CONFLICT');
			});
			
			it('should throw error when trying to create layout that has missing mandatory properties', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oNewLayout = {
						"LAYOUT_NAME": "Test6"
				};

				var oRequest = buildRequest('true', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should throw error when trying to create persona layout that has missing is current property', function(){
				//arrange
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 1,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY",
							"COLUMN_WIDTH": 43
						}],
						"HIDDEN_FIELDS": [{
							"PATH": "Item.Vendor",
							"BUSINESS_OBJECT": "Vendor",
							"COLUMN_ID": "VENDOR_ID"
						}]
				};

				var oRequest = buildRequest('false', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();


				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should throw error when trying to create layout that has the same name as an existing corporate layout', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oNewLayout = {
						"LAYOUT_ID": -1,
						"LAYOUT_NAME": "Test5",
				};

				var oRequest = buildRequest('true', $.net.http.POST, oNewLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_LAYOUT_NAMING_CONFLICT');
			});
		});
		
		describe('update (PUT)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();		
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				oMockstar.insertTableData("layout_columns", testData.oLayoutColumns);
				oMockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
				oMockstar.insertTableData("costing_sheet_row", {"COSTING_SHEET_ROW_ID" : "DMC",
																"COSTING_SHEET_ID" : "COGM", 
																"COSTING_SHEET_ROW_TYPE": 1,
																"CALCULATION_ORDER": 2,
																"_VALID_FROM":  '2015-01-01T00:00:00.000Z'});

			});


			it('should update corporate layout for valid input', function(){
				//arrange
				var oUpdatedLayout = {
						"LAYOUT_ID": 5,
						"LAYOUT_NAME": "Testing",
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 0,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY",
							"COLUMN_WIDTH": 43
						}],
						"HIDDEN_FIELDS": [{
							"PATH": "Item.Vendor",
							"BUSINESS_OBJECT": "Vendor",
							"COLUMN_ID": "VENDOR_ID"
						}]
				};

				var oRequest = buildRequest('true', $.net.http.PUT, oUpdatedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(_.isObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body).toBeDefined;

				var oResponseData = oResponseObject.body;				
				expect(oResponseData.LAYOUT_ID).toBe(5);
			});

			it('should update personal layout for valid input', function(){
				//arrange
				var oUpdatedLayout = {
						"LAYOUT_ID": 3,
						"LAYOUT_NAME": "Testing",
						"LAYOUT_COLUMNS": [{
							"DISPLAY_ORDER": 0,
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "QUANTITY",
							"COLUMN_WIDTH": 43
						}],
						"HIDDEN_FIELDS": [
						{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "CONFIDENCE_LEVEL_ID"
						}]
				};

				var oRequest = buildRequest('false', $.net.http.PUT, oUpdatedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				expect(_.isObject(oResponseObject)).toBe(true);
				expect(oResponseObject.body).toBeDefined;

				var oResponseData = oResponseObject.body;				
				expect(oResponseData.LAYOUT_ID).toBe(3);
			});

			it('should throw error when updating a name to a name which is the same name as an existing user personal layout', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oUpdatedLayout = {
						"LAYOUT_ID": 3,
						"LAYOUT_NAME": "Test5"
				};

				var oRequest = buildRequest('true', $.net.http.PUT, oUpdatedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_LAYOUT_NAMING_CONFLICT');
			});
			
			it('should throw error when updating a name to a name which is the same name as an existing corporate layout', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oUpdatedLayout = {
						"LAYOUT_ID": 2,
						"LAYOUT_NAME": "Test6",
				};

				var oRequest = buildRequest('true', $.net.http.PUT, oUpdatedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('WRITE_LAYOUT_NAMING_CONFLICT');
			});
			
			it('should throw error when the layout_id does not exist', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oUpdatedLayout = {
						"LAYOUT_ID": 22,
						"LAYOUT_NAME": "Test6",
				};

				var oRequest = buildRequest('true', $.net.http.PUT, oUpdatedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
		});
		
		describe('delete', function() {
						
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();		
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				oMockstar.insertTableData("layout_columns", testData.oLayoutColumns);
				oMockstar.insertTableData("layout_hidden_field", testData.oLayoutHiddenFields);
			});

			it('should delete layout for valid input', function(){
				//arrange
				var oDeletedLayout = {
						"LAYOUT_ID": 5
				};

				var oRequest = buildRequest('true', $.net.http.DEL, oDeletedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
			});
				
			it('should throw error when the layout_id does not exist', function(){
				//arrange
				oMockstar.insertTableData("layout", testData.oLayout);
				oMockstar.insertTableData("layout_personal", testData.oLayoutPersonal);
				var oDeletedLayout = {
						"LAYOUT_ID": 22
				};

				var oRequest = buildRequest('true', $.net.http.DEL, oDeletedLayout);

				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
		});
	}

}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);