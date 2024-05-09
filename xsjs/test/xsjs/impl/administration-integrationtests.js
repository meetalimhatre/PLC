/*jslint undef:true*/

var _ = require("lodash");
var testData = require("../../testdata/testdata").data;
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var MessageLibrary = require("../../../lib/xs/util/message");
var Code = MessageLibrary.Code;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;
var Operation = MessageLibrary.Operation;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

var helpers = require("../../../lib/xs/util/helpers");
var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
var ServiceMetaInformation  = require("../../../lib/xs/util/constants").ServiceMetaInformation;
var Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.administration-integrationtests', function() {

		var oPersistency = null;
		var mockstar = null;
		var oDefaultResponseMock = null;

		var oTestCostingSheetRows = {
			"COSTING_SHEET_ROW_ID" : ["MEK", "MGK", "FEK", "FGK", "HK", "HH"],
			"COSTING_SHEET_ID" : ["COGM", "COGM", "COGM", "COGM", "COGM", "COGM"],
			"COSTING_SHEET_ROW_TYPE":[1,3,1,3,4,2],
			"COSTING_SHEET_BASE_ID":[,,,,,1],
			"ACCOUNT_GROUP_AS_BASE_ID": [ 13,, 15,,,],
			"COSTING_SHEET_OVERHEAD_ID": [ , 4,, 5,6,7],
			"CALCULATION_ORDER": [0, 1, 2, 3, 4, 5],
			"IS_RELEVANT_FOR_TOTAL": [1,1,1,1,1,1],
			"IS_RELEVANT_FOR_TOTAL2": [1,1,1,0,1,1],
			"IS_RELEVANT_FOR_TOTAL3": [1,1,1,0,0,1],
			"_VALID_FROM": [ '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z', '2015-01-01T00:00:00.000Z'],
			"_VALID_TO": [ null, null, null, null, null,null],
			"_SOURCE": [ 1, 1, 1, 1, 1, 1],
			"_CREATED_BY": [ 'U000001', 'U000001', 'U000001', 'U000001', 'U000001', 'U000001']
		};

		var oCostingSheetTestData = {
			"COSTING_SHEET_ID" : [ "COGM" ],
			"CONTROLLING_AREA_ID" : [ '1000' ],
			"IS_TOTAL_COST2_ENABLED" : [ 1 ],
			"IS_TOTAL_COST3_ENABLED" : [ 1 ],
			"_VALID_FROM" : [ '2015-01-01T00:00:00.000Z' ],
			"_VALID_TO" :[ null ],
			"_SOURCE" : [ 1 ],
			"_CREATED_BY" : [ 'U000001' ]
		};

		beforeOnce(function() {

			mockstar = new MockstarFacade({
				substituteTables : {
					account_group : Resources[BusinessObjectTypes.AccountGroup].dbobjects.plcTable,
					account_group_text : Resources[BusinessObjectTypes.AccountGroup].dbobjects.plcTextTable,
					account_account_group : Resources[BusinessObjectTypes.AccountAccountGroup].dbobjects.plcTable,
					account : Resources[BusinessObjectTypes.Account].dbobjects.plcTable,
					account_text : Resources[BusinessObjectTypes.Account].dbobjects.plcTextTable,
					activity_price : Resources[BusinessObjectTypes.ActivityPrice].dbobjects.plcTable,
					price_source : Resources[BusinessObjectTypes.PriceSource].dbobjects.plcTable,
					price_source_text : Resources[BusinessObjectTypes.PriceSource].dbobjects.plcTextTable,
					activity_type : Resources[BusinessObjectTypes.ActivityType].dbobjects.plcTable,
					activity_type_text : Resources[BusinessObjectTypes.ActivityType].dbobjects.plcTextTable,
					cost_center : Resources[BusinessObjectTypes.CostCenter].dbobjects.plcTable,
					cost_center_text : Resources[BusinessObjectTypes.CostCenter].dbobjects.plcTextTable,
					controlling_area : Resources[BusinessObjectTypes.ControllingArea].dbobjects.plcTable,
					controlling_area_text : Resources[BusinessObjectTypes.ControllingArea].dbobjects.plcTextTable,
					currency : Resources[BusinessObjectTypes.Currency].dbobjects.plcTable,
					currency_text : Resources[BusinessObjectTypes.Currency].dbobjects.plcTextTable,
					uom : Resources[BusinessObjectTypes.UnitOfMeasure].dbobjects.plcTable,
					session : "sap.plc.db::basis.t_session",
					uom_text : Resources[BusinessObjectTypes.UnitOfMeasure].dbobjects.plcTextTable,
					lock : "sap.plc.db::basis.t_lock",
					metadata : {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					material : Resources[BusinessObjectTypes.Material].dbobjects.plcTable,
					material_price : Resources[BusinessObjectTypes.MaterialPrice].dbobjects.plcTable,
					material_plant : Resources[BusinessObjectTypes.MaterialPlant].dbobjects.plcTable,
					material_type : Resources[BusinessObjectTypes.MaterialType].dbobjects.plcTable,
					costing_sheet : Resources[BusinessObjectTypes.CostingSheet].dbobjects.plcTable,
					costing_sheet_text : Resources[BusinessObjectTypes.CostingSheet].dbobjects.plcTextTable,					
					costing_sheet_row : Resources[BusinessObjectTypes.CostingSheetRow].dbobjects.plcTable,
					costing_sheet_row_text : Resources[BusinessObjectTypes.CostingSheetRow].dbobjects.plcTextTable,
					costing_sheet_overhead : Resources["Costing_Sheet_Overhead"].dbobjects.plcTable,
					costing_sheet_overhead_row : Resources["Costing_Sheet_Overhead_Row"].dbobjects.plcTable,
					costing_sheet_overhead_row_formula : Resources["Costing_Sheet_Overhead_Row_Formula"].dbobjects.plcTable,
					costing_sheet_base : Resources["Costing_Sheet_Base"].dbobjects.plcTable,
					costing_sheet_base_row : Resources["Costing_Sheet_Base_Row"].dbobjects.plcTable,
					costing_sheet_row_dependencies: "sap.plc.db::basis.t_costing_sheet_row_dependencies",
					exchange_rate_type : Resources[BusinessObjectTypes.ExchangeRateType].dbobjects.plcTable,
					exchange_rate_type_text : Resources[BusinessObjectTypes.ExchangeRateType].dbobjects.plcTextTable
				},
				csvPackage : testData.sCsvPackage
			});

		});

		afterOnce(function() {

		});

		beforeEach(function() {
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});	 

		describe ("batch operations", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("account_group", testData.oAccountGroupValidTo);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextValidTo);
				mockstar.insertTableData("account_account_group", testData.oAccountRangeValidTo);
				mockstar.insertTableData("account", testData.oAccountValidTo);
				mockstar.insertTableData("account_text", testData.oAccountTextValidTo);
				mockstar.insertTableData("activity_price", testData.oActivityPriceTestDataPlc);	
				mockstar.insertTableData("price_source", testData.oPriceSourceTestDataPlc);
				mockstar.insertTableData("price_source_text", testData.oPriceSourceTextTestDataPlc);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);				
				mockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
				mockstar.insertTableData("costing_sheet_text", testData.oCostingSheetTextTestData);
				mockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
				mockstar.insertTableData("costing_sheet_row_text", testData.oCostingSheetRowTextTestData);
				mockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
				mockstar.insertTableData("costing_sheet_overhead_row", testData.oCostingSheetOverheadRowTestData);
				mockstar.insertTableData("costing_sheet_overhead_row_formula", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
				mockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
				mockstar.insertTableData("costing_sheet_row_dependencies", testData.oCostingSheetRowDependenciesTestData);
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.insertTableData("uom", testData.oUOM);
				mockstar.insertTableData("uom_text", testData.oUOMText);
			    mockstar.insertTableData("session", testData.oSessionTestData);
			    mockstar.insertTableData("material_type", testData.oMaterialTypeTestDataPlc);
			    mockstar.insertTableData("material", testData.oMaterialTestDataPlc);
			    mockstar.insertTableData("exchange_rate_type", testData.oExchangeRateTypeTestDataPlc);
			    mockstar.insertTableData("exchange_rate_type_text", testData.oExchangeRateTypeTextTestDataPlc);
			});

			function buildBatchRequest(oBatchObject, sObjectName, sIgnoreBadData) {

				// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [ {
					"name" : "business_object",
					"value" : sObjectName
				},
				{
					"name" : "ignoreBadData",
					"value" : sIgnoreBadData
				}];

				params.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};

				var oRequest = {
						queryPath : "administration",
						method : $.net.http.POST,
						parameters : params,
						body : {
							asString : function() {
								return JSON.stringify(oBatchObject);
							}
						}
				};
				return oRequest;
			}
			
			it('should return a GENERAL_VALIDATION_ERROR when Material ID starts with a white space', function() {
				// arrange
				var oBatchObject = { 
						"CREATE":{
						    "MATERIAL_ENTITIES":[{
							"MATERIAL_ID" : " #123",
							"MATERIAL_TYPE_ID" : "MT2",
							"IS_PHANTOM_MATERIAL" : 0
						}]
				}};
				
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.Material);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
						
			it('should insert no material in case all materials have errors in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"CREATE":{
						    "MATERIAL_ENTITIES":[{
						    "MATERIAL_ID" : "MAT2",
                            "IS_PHANTOM_MATERIAL" : 0,
                            "IS_CONFIGURABLE_MATERIAL" : 0
						},
						{
							"MATERIAL_ID" : "MAT1",
                            "IS_PHANTOM_MATERIAL" : 0,
                            "IS_CONFIGURABLE_MATERIAL" : 0
						},
						{
							"MATERIAL_ID" : "MAT5",
                            "IS_PHANTOM_MATERIAL" : 0,
                            "IS_CONFIGURABLE_MATERIAL" : 0
						}]
				}};
				var oTestBefore = mockstar.execQuery("select * from {{material}}");
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.Material, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{material}}");
			    expect(oResponseObject.body.masterdata.CREATE.MATERIAL_ENTITIES.length).toBe(0);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oTestAfter.columns.MATERIAL_ID.rows.length).toBe(oTestBefore.columns.MATERIAL_ID.rows.length);
				expect(oResponseObject.head.messages.length).toBe(3);
			});
			
			it('should insert 2 materials materials and return in head messages bad material in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"CREATE":{
						    "MATERIAL_ENTITIES":[{
						    "MATERIAL_ID" : "MAT99",
                            "IS_PHANTOM_MATERIAL" : 1,
                            "IS_CONFIGURABLE_MATERIAL" : 1
						},
						{
							"MATERIAL_ID" : "MAT100",
                            "IS_PHANTOM_MATERIAL" : 1,
                            "IS_CONFIGURABLE_MATERIAL" : 1
						},
						{
							"MATERIAL_ID" : "MAT1",
                            "IS_PHANTOM_MATERIAL" : 1,
                            "IS_CONFIGURABLE_MATERIAL" : 1
						}]
				}};
				var oTestBefore = mockstar.execQuery("select * from {{material}}");
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.Material, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{material}}");
			    expect(oResponseObject.body.masterdata.CREATE.MATERIAL_ENTITIES.length).toBe(2);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oTestAfter.columns.MATERIAL_ID.rows.length).toBe(oTestBefore.columns.MATERIAL_ID.rows.length + 2);
				expect(oResponseObject.head.messages.length).toBe(1);
			});
			
			it('should update 2 materials materials and return in head messages bad material in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"UPDATE":{
						    "MATERIAL_ENTITIES":[{
						    "MATERIAL_ID" : testData.oMaterialTestDataPlc.MATERIAL_ID[0],
                            "IS_PHANTOM_MATERIAL" : testData.oMaterialTestDataPlc.IS_PHANTOM_MATERIAL[0],
                            "IS_CONFIGURABLE_MATERIAL" :  testData.oMaterialTestDataPlc.IS_CONFIGURABLE_MATERIAL[0],
                            "_VALID_FROM" :  testData.oMaterialTestDataPlc._VALID_FROM[0]
						},
						{
						    "MATERIAL_ID" : testData.oMaterialTestDataPlc.MATERIAL_ID[1],
                            "IS_PHANTOM_MATERIAL" : testData.oMaterialTestDataPlc.IS_PHANTOM_MATERIAL[1],
                            "IS_CONFIGURABLE_MATERIAL" :  testData.oMaterialTestDataPlc.IS_CONFIGURABLE_MATERIAL[1],
                            "_VALID_FROM" :  testData.oMaterialTestDataPlc._VALID_FROM[1]
						},
						{
							"MATERIAL_ID" : "MAT99",
                            "IS_PHANTOM_MATERIAL" : 1,
                            "IS_CONFIGURABLE_MATERIAL" : 0,
                            "_VALID_FROM" : '2015-01-01T15:39:09.691Z'
						}]
				}};
				var oTestBefore = mockstar.execQuery("select * from {{material}}");
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.Material, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTestAfter = mockstar.execQuery("select * from {{material}}");
			    expect(oResponseObject.body.masterdata.UPDATE.MATERIAL_ENTITIES.length).toBe(2);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oTestAfter.columns.MATERIAL_ID.rows.length).toBe(oTestBefore.columns.MATERIAL_ID.rows.length+2);
				expect(oResponseObject.head.messages.length).toBe(1);
			});
			
			
			it('should delete 2 materials and return in head messages bad material in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"DELETE":{
						    "MATERIAL_ENTITIES":[{
						    "MATERIAL_ID" : testData.oMaterialTestDataPlc.MATERIAL_ID[0],
                            "_VALID_FROM" : testData.oMaterialTestDataPlc._VALID_FROM[0]
						},
						{
							"MATERIAL_ID" : testData.oMaterialTestDataPlc.MATERIAL_ID[1],
                            "_VALID_FROM" : testData.oMaterialTestDataPlc._VALID_FROM[1]
						},
						{
							"MATERIAL_ID" : "MAT99",
                            "_VALID_FROM" : '2015-01-01T15:39:09.691Z'
						}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.Material, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    expect(oResponseObject.body.masterdata.DELETE.MATERIAL_ENTITIES.length).toBe(2);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oResponseObject.head.messages.length).toBe(1);
			});
			
			
			it('should create 2 account groups and return in head messages bad account group in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"CREATE":{
						    "ACCOUNT_GROUP_ENTITIES":[{
						    "ACCOUNT_GROUP_ID": 999,
			                "CONTROLLING_AREA_ID": "#CA1",
			                "COST_PORTION": 3
						},
						{
						    "ACCOUNT_GROUP_ID": 998,
			                "CONTROLLING_AREA_ID": "#CA1",
			                "COST_PORTION": 3
						},
						{
						    "ACCOUNT_GROUP_ID": 701,
			                "CONTROLLING_AREA_ID": "#CA1",
			                "COST_PORTION": 7
						}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.AccountGroup, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    expect(oResponseObject.body.masterdata.CREATE.ACCOUNT_GROUP_ENTITIES.length).toBe(2);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oResponseObject.head.messages.length).toBe(1);
			});
			
			it('should delete 1 account group and return in head messages bad account group in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"DELETE":{
						    "ACCOUNT_GROUP_ENTITIES":[{
						    "ACCOUNT_GROUP_ID": 998,
			                "CONTROLLING_AREA_ID": "#CA1",
			                "COST_PORTION": 3,
			                "_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						},
						{
						    "ACCOUNT_GROUP_ID": testData.oAccountGroupValidTo.ACCOUNT_GROUP_ID[0],
			                "CONTROLLING_AREA_ID": testData.oAccountGroupValidTo.CONTROLLING_AREA_ID[0],
			                "COST_PORTION": testData.oAccountGroupValidTo.COST_PORTION[0],
			                "_VALID_FROM" : testData.oAccountGroupValidTo._VALID_FROM[0]
						}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.AccountGroup, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    expect(oResponseObject.body.masterdata.DELETE.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oResponseObject.head.messages.length).toBe(1);
			});
			
			it('should update 1 account groups and return in head messages bad account group in case parameter ignoreBadData is set to true in request', function(){
			   //arrange
			   var oBatchObject = { 
						"UPDATE":{
						    "ACCOUNT_GROUP_ENTITIES":[{
						    "ACCOUNT_GROUP_ID": 998,
			                "CONTROLLING_AREA_ID": "#CA1",
			                "COST_PORTION": 3,
			                "_VALID_FROM" : "2015-01-01T00:00:00.000Z"
						},
						{
						    "ACCOUNT_GROUP_ID": testData.oAccountGroupValidTo.ACCOUNT_GROUP_ID[0],
			                "CONTROLLING_AREA_ID": testData.oAccountGroupValidTo.CONTROLLING_AREA_ID[0],
			                "COST_PORTION": testData.oAccountGroupValidTo.COST_PORTION[0],
			                "_VALID_FROM" : testData.oAccountGroupValidTo._VALID_FROM[0]
						}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.AccountGroup, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    expect(oResponseObject.body.masterdata.UPDATE.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				expect(oResponseObject.head.messages.length).toBe(1);
			});

			it('should return GENERAL_VALIDATION_ERROR when trying to add dependencies that do no keep a valid distribution for IS_RELEVANT_FOR TOTAL fields', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.insertTableData("costing_sheet", oCostingSheetTestData);
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES" : [{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "FGK",
							"COSTING_SHEET_ID": "COGM",
						}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oExpectedValidationObj = {
					"columnIds":[
						{"columnId": "IS_RELEVANT_FOR_TOTAL2"},
						{"columnId": "IS_RELEVANT_FOR_TOTAL3"}
					],
					"validationInfoCode": "VALUE_ERROR"
				}

				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseObject.head.messages[0].details.validationObj).toEqual(oExpectedValidationObj);
			});

			it('should return GENERAL_VALIDATION_ERROR when trying to update dependencies that do no keep a valid distribution for IS_RELEVANT_FOR TOTAL fields', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.insertTableData("costing_sheet", oCostingSheetTestData);
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}],
					},
					"UPDATE":{
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES" : [{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "FGK",
							"COSTING_SHEET_ID": "COGM",
						}]
					}
				};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oExpectedValidationObj = {
					"columnIds":[
						{"columnId": "IS_RELEVANT_FOR_TOTAL2"},
						{"columnId": "IS_RELEVANT_FOR_TOTAL3"}
					],
					"validationInfoCode": "VALUE_ERROR"
				}

				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseObject.head.messages[0].details.validationObj).toEqual(oExpectedValidationObj);
			});

			it('should return GENERAL_VALIDATION_ERROR when trying to insert/update dependencies or to update rows that do no keep a valid distribution for IS_RELEVANT_FOR TOTAL fields', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.insertTableData("costing_sheet", oCostingSheetTestData);
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES" : [{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "MGK",
							"COSTING_SHEET_ID": "COGM",
						}]
					},
					"UPDATE":{
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "MGK",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 0,
							"IS_RELEVANT_FOR_TOTAL3": 0,
							"_VALID_TO": null,
							"_VALID_FROM": "2015-01-01T00:00:00.000Z",
						}],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES" : [{
							"SOURCE_ROW_ID": "S1",
							"TARGET_ROW_ID": "FGK",
							"COSTING_SHEET_ID": "COGM",
						}]
					}
				};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oExpectedValidationObj = {
					"columnIds":[
						{"columnId": "IS_RELEVANT_FOR_TOTAL2"},
						{"columnId": "IS_RELEVANT_FOR_TOTAL3"}
					],
					"validationInfoCode": "VALUE_ERROR"
				}

				expect(oResponseObject.head.messages.length).toBe(2);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseObject.head.messages[1].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseObject.head.messages[0].details.validationObj).toEqual(oExpectedValidationObj);
				expect(oResponseObject.head.messages[1].details.validationObj).toEqual(oExpectedValidationObj);
			});
			
			it('should not return GENERAL_VALIDATION_ERROR when trying to insert rows that have IS_RELEVANT_FOR_TOTAL fields enabled but the updated costing sheet have them disabled', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.insertTableData("costing_sheet", oCostingSheetTestData);
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}]
					},
					"UPDATE":{
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID" :"COGM",
							"CONTROLLING_AREA_ID" : '1000',
							"IS_TOTAL_COST2_ENABLED" : 0,
							"IS_TOTAL_COST3_ENABLED" : 0,
							"_VALID_FROM" : '2015-01-01T00:00:00.000Z'
						}]
					}
				};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL2).toBe(1);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL3).toBe(1);
			});

			it('should not return GENERAL_VALIDATION_ERROR when trying to insert rows that have IS_RELEVANT_FOR_TOTAL fields enabled but the created costing sheet have them disabled', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"CONTROLLING_AREA_ID" : '1000',
							"IS_TOTAL_COST2_ENABLED" : 0,
							"IS_TOTAL_COST3_ENABLED" : 0
						}],
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}]
					}
				};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				

				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST2_ENABLED).toBe(0);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST3_ENABLED).toBe(0);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL2).toBe(1);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL3).toBe(1);
			});
			
			it('should succesfully insert rows that have IS_RELEVANT_FOR_TOTAL fields enabled and the created costing sheet have them enabled too', function(){
				
				//arrange
				mockstar.clearTable("costing_sheet");
				mockstar.clearTable("costing_sheet_row");
				mockstar.insertTableData("costing_sheet_row", oTestCostingSheetRows);
				var oBatchObject = { 
					"CREATE":{
						"COSTING_SHEET_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"CONTROLLING_AREA_ID" : '1000',
							"IS_TOTAL_COST2_ENABLED" : 1,
							"IS_TOTAL_COST3_ENABLED" : 1
						}],
						"COSTING_SHEET_ROW_ENTITIES":[{
							"COSTING_SHEET_ID" : "COGM",
							"COSTING_SHEET_ROW_ID": "S1",
							"COSTING_SHEET_ROW_TYPE": 4,
							"CALCULATION_ORDER":7,
							"IS_RELEVANT_FOR_TOTAL2": 1,
							"IS_RELEVANT_FOR_TOTAL3": 1
						}]
					}
				};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				

				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST2_ENABLED).toBe(1);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ENTITIES[0].IS_TOTAL_COST3_ENABLED).toBe(1);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL2).toBe(1);
				expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_ROW_ENTITIES[0].IS_RELEVANT_FOR_TOTAL3).toBe(1);
			});

			it('should return GENERAL_VALIDATION_ERROR for update formula with FORMULA_ID and FORMULA_DESCRIPTION not null and FORMULA_STRING null', function(){
			   //arrange
			   var oBatchObject = { 
						"UPDATE":{
						    "COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
								"COSTING_SHEET_OVERHEAD_ID": 5,
								"VALID_FROM": "2020-12-31T00:00:00.000Z",
								"VALID_TO": "2020-12-31T00:00:00.000Z",
								"_VALID_FROM": "2015-01-01T00:00:00.000Z",
								"FORMULA_ID": "5",
								"FORMULA_DESCRIPTION": "general validation error",
								"_SOURCE": 1,
								"_CREATED_BY": "U000001"
							}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should return GENERAL_VALIDATION_ERROR for update formula with FORMULA_DESCRIPTION not null and FORMULA_STRING and FORMULA_ID null', function(){
			   //arrange
			   var oBatchObject = { 
						"UPDATE":{
						    "COSTING_SHEET_OVERHEAD_ROW_ENTITIES" : [{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 1,
								"COSTING_SHEET_OVERHEAD_ID": 5,
								"VALID_FROM": "2020-12-31T00:00:00.000Z",
								"VALID_TO": "2020-12-31T00:00:00.000Z",
								"_VALID_FROM": "2015-01-01T00:00:00.000Z",
								"FORMULA_DESCRIPTION": "general validation error",
								"_SOURCE": 1,
								"_CREATED_BY": "U000001"
							}]
				}};
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet, true);
				
				//act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				
				expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should return a GENERAL_ENTITY_NOT_FOUND_ERROR when trying to insert and update the same exchange rate type', function() {
				// arrange
				var oBatchObject = {
                                  "CREATE": {
                                    "EXCHANGE_RATE_TYPE_ENTITIES": [
                                      {
                                        "EXCHANGE_RATE_TYPE_ID": "A"
                                      }
                                    ],
                                    "EXCHANGE_RATE_TYPE_TEXT_ENTITIES": [
                                      {
                                        "EXCHANGE_RATE_TYPE_ID": "A",
                                        "EXCHANGE_RATE_TYPE_DESCRIPTION": "EN",
                                        "LANGUAGE": "EN"
                                      }
                                    ]
                                  },
                                  "UPDATE": {
                                    "EXCHANGE_RATE_TYPE_ENTITIES": [
                                      {
                                        "EXCHANGE_RATE_TYPE_ID": "A",
                                        "LAST_MODIFIED_ON": "2017-09-07T13:57:56.963Z"
                                      }
                                    ],
                                    "EXCHANGE_RATE_TYPE_TEXT_ENTITIES": [
                                      {
                                        "EXCHANGE_RATE_TYPE_ID": "A",
                                        "EXCHANGE_RATE_TYPE_DESCRIPTION": "EN",
                                        "LANGUAGE": "EN",
                                        "LAST_MODIFIED_ON": "2017-09-07T13:57:56.963Z"
                                      }
                                    ]
                                  }
                                };
				
				var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(2);
				expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
				expect(oResponseObject.head.messages[1].code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
                expect(oResponseObject.head.messages[0].details.administrationObjType).toEqual("MainObj");
                expect(oResponseObject.head.messages[1].details.administrationObjType).toEqual("TextObj");
			});
			
		it('should return a GENERAL_VALIDATION_ERROR when trying to insert a value less than 0 for CREDIT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "CREATE": {
								"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
									"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
									"COSTING_SHEET_OVERHEAD_ID": "-2",
									"PROFIT_CENTER_ID":"P4",
									"VALID_FROM": "2015-09-30T00:00:00.000Z",
									"VALID_TO": "2099-12-31T00:00:00",
									"CONTROLLING_AREA_ID": "1000",
									"CREDIT_FIXED_COST_PORTION": "-1",
									"OVERHEAD_PERCENTAGE": 22
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
			
		it('should return a GENERAL_VALIDATION_ERROR when trying to insert a value greater than 100 for CREDIT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "CREATE": {
								"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
									"COSTING_SHEET_OVERHEAD_ROW_ID": -1,
									"COSTING_SHEET_OVERHEAD_ID": "-2",
									"PROFIT_CENTER_ID":"P4",
									"VALID_FROM": "2015-09-30T00:00:00.000Z",
									"VALID_TO": "2099-12-31T00:00:00",
									"CONTROLLING_AREA_ID": "1000",
									"CREDIT_FIXED_COST_PORTION": "101",
									"OVERHEAD_PERCENTAGE": 22
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		});
			
		it('should return a GENERAL_VALIDATION_ERROR when trying to update a value less than 0 for CREDIT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "UPDATE": {
								"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
									"COSTING_SHEET_OVERHEAD_ID":"5",
									"COSTING_SHEET_OVERHEAD_ROW_ID":1,
									"VALID_FROM":"2013-01-01T00:00:00Z",
									"VALID_TO":"2015-12-31T00:00:00Z",
									"CONTROLLING_AREA_ID":"1000",
									"PROFIT_CENTER_ID":"P4",
									"CREDIT_FIXED_COST_PORTION": "-1",
									"OVERHEAD_PERCENTAGE":15.0,
									"_VALID_FROM":"2015-01-01T00:00:00.000Z"
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});
			
		it('should return a GENERAL_VALIDATION_ERROR when trying to update a value greater than 100 for CREDIT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "UPDATE": {
								"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
									"COSTING_SHEET_OVERHEAD_ID":"5",
									"COSTING_SHEET_OVERHEAD_ROW_ID":1,
									"VALID_FROM":"2013-01-01T00:00:00Z",
									"VALID_TO":"2015-12-31T00:00:00Z",
									"CONTROLLING_AREA_ID":"1000",
									"PROFIT_CENTER_ID":"P4",
									"CREDIT_FIXED_COST_PORTION": "101",
									"OVERHEAD_PERCENTAGE":15.0,
									"_VALID_FROM":"2015-01-01T00:00:00.000Z"
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		});

		it('should return a GENERAL_VALIDATION_ERROR when trying to insert a value less than 0 for USE_DEFAULT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "CREATE": {
								"COSTING_SHEET_OVERHEAD_ENTITIES": [{
                                    "COSTING_SHEET_OVERHEAD_ID": "-2",
                                    "USE_DEFAULT_FIXED_COST_PORTION": -1,
                                    "CREDIT_FIXED_COST_PORTION": 20,
                                    "IS_ROLLED_UP": 1
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});

		it('should return a GENERAL_VALIDATION_ERROR when trying to insert a value greater than 1 for USE_DEFAULT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "CREATE": {
								"COSTING_SHEET_OVERHEAD_ENTITIES": [{
                                    "COSTING_SHEET_OVERHEAD_ID": "-2",
                                    "USE_DEFAULT_FIXED_COST_PORTION": 2,
                                    "CREDIT_FIXED_COST_PORTION": 20,
                                    "IS_ROLLED_UP": 1
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		});

		it('should successfully save CREDIT_FIXED_COST_PORTION in db', function() {
			// arrange
			var oBatchObject = {
				"CREATE": {
				  "COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
					  "COSTING_SHEET_OVERHEAD_ROW_ID": -1,
					  "COSTING_SHEET_OVERHEAD_ID": "5",
					  "VALID_FROM": "2015-09-30T00:00:00.000Z",
					  "VALID_TO": "2099-12-31T00:00:00",
					  "CREDIT_FIXED_COST_PORTION": "22",
					  "OVERHEAD_PERCENTAGE": 22
				  }]
				}
			  };

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].CREDIT_FIXED_COST_PORTION).toBe(oBatchObject.CREATE.COSTING_SHEET_OVERHEAD_ROW_ENTITIES[0].CREDIT_FIXED_COST_PORTION);
		});

		it('should successfully save USE_DEFAULT_FIXED_COST_PORTION in db', function() {
			// arrange
			var oBatchObject = {
							  "CREATE": {
								"COSTING_SHEET_OVERHEAD_ENTITIES": [{
                                    "COSTING_SHEET_OVERHEAD_ID": "-2",
                                    "USE_DEFAULT_FIXED_COST_PORTION": 1,
                                    "CREDIT_FIXED_COST_PORTION": 20,
                                    "IS_ROLLED_UP": 1
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.CostingSheet);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.body.masterdata.CREATE.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION).toBe(oBatchObject.CREATE.COSTING_SHEET_OVERHEAD_ENTITIES[0].USE_DEFAULT_FIXED_COST_PORTION);
		});

		it('should return a GENERAL_VALIDATION_ERROR when trying to update a value less than 0 for USE_DEFAULT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "UPDATE": {
								"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [{
                                    "COSTING_SHEET_OVERHEAD_ID":"5",
                                    "CREDIT_ACCOUNT_ID":"655200",
                                    "USE_DEFAULT_FIXED_COST_PORTION": -1,
                                    "IS_ROLLED_UP":1,
                                    "_VALID_FROM":"2015-01-01T00:00:00.000Z"
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
			});

		it('should return a GENERAL_VALIDATION_ERROR when trying to update a value greater than 1 for USE_DEFAULT_FIXED_COST_PORTION', function() {
			// arrange
			var oBatchObject = {
							  "UPDATE": {
								"COSTING_SHEET_OVERHEAD_ENTITIES": [{
                                    "COSTING_SHEET_OVERHEAD_ID":"5",
                                    "CREDIT_ACCOUNT_ID":"655200",
                                    "USE_DEFAULT_FIXED_COST_PORTION": 2,
                                    "IS_ROLLED_UP":1,
                                    "_VALID_FROM":"2015-01-01T00:00:00.000Z"
								}]
							  }
							};

			var oRequest = buildBatchRequest(oBatchObject, BusinessObjectTypes.ExchangeRateType);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
			expect(oResponseObject.head.messages[0].code).toEqual(Code.GENERAL_VALIDATION_ERROR.code);
		});
			
	});
		
		describe ("get", function (){
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.initializeData();
				mockstar.insertTableData("account_group", testData.oAccountGroupValidTo);
				mockstar.insertTableData("account_group_text", testData.oAccountGroupTextValidTo);
				mockstar.insertTableData("account_account_group", testData.oAccountRangeValidTo);
				mockstar.insertTableData("account", testData.oAccountValidTo);
				mockstar.insertTableData("account_text", testData.oAccountTextValidTo);
				mockstar.insertTableData("activity_price", testData.oActivityPriceTestDataPlc);	
				mockstar.insertTableData("price_source", testData.oPriceSourceTestDataPlc);
				mockstar.insertTableData("price_source_text", testData.oPriceSourceTextTestDataPlc);
				mockstar.insertTableData("activity_type", testData.oActivityTypeTestDataPlc);
				mockstar.insertTableData("activity_type_text", testData.oActivityTypeTextTestDataPlc);
				mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
				mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.insertTableData("controlling_area_text", testData.oControllingAreaTextTestDataPlc);
				mockstar.insertTableData("currency", testData.oCurrency);
				mockstar.insertTableData("currency_text", testData.oCurrencyText);
				mockstar.insertTableData("uom", testData.oUOM);
				mockstar.insertTableData("uom_text", testData.oUOMText);
				mockstar.insertTableData("session", testData.oSessionTestData);				
				mockstar.insertTableData("costing_sheet", testData.oCostingSheetTestData);
				mockstar.insertTableData("costing_sheet_text", testData.oCostingSheetTextTestData);
				mockstar.insertTableData("costing_sheet_row", testData.oCostingSheetRowTestData);
				mockstar.insertTableData("costing_sheet_row_text", testData.oCostingSheetRowTextTestData);
				mockstar.insertTableData("costing_sheet_overhead", testData.oCostingSheetOverheadTestData);
				mockstar.insertTableData("costing_sheet_overhead_row", testData.oCostingSheetOverheadRowTestData);
				mockstar.insertTableData("costing_sheet_base", testData.oCostingSheetBaseTestData);
				mockstar.insertTableData("costing_sheet_base_row", testData.oCostingSheetBaseRowTestData);
				mockstar.insertTableData("costing_sheet_row_dependencies", testData.oCostingSheetRowDependenciesTestData);
			});

			function buildGetRequest(sObjectName, bLock) {

				// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
				var params = [ {
					"name" : "business_object",
					"value" : sObjectName
				} ];
				
				if( bLock !== undefined ) {
					params.push({
						"name" : "lock",
						"value": bLock
					});
				}

				params.get = function(sArgument) {
					var value;
					_.each(this, function(oParameter) {
						if (oParameter.name === sArgument) {
							value = oParameter.value;
						}
					});
					return value;
				};

				var oRequest = {
						queryPath : "administration",
						method : $.net.http.GET,
						parameters : params,
						body : {
							asString : function() {
								return "";
							}
						}
				};
				return oRequest;
			}
			
			it('should return Account Groups, associated objects and lock status', function() {

				// arrange
				var oRequest = buildGetRequest(BusinessObjectTypes.AccountGroup, true);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.masterdata.ACCOUNT_GROUP_ENTITIES.length).toBe(1);
				expect(oResponseObject.body.masterdata.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(2);

				
				// Check that associated objects are delivered
				expect(oResponseObject.body.masterdata.ACCOUNT_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseObject.body.masterdata.ACCOUNT_RANGES_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseObject.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
				
				// Check locking information
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(0);			
			});
			
			it('should return Component Split, associated objects and lock status', function() {

				// arrange
				var oRequest = buildGetRequest(BusinessObjectTypes.ComponentSplit, true);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.masterdata.COMPONENT_SPLIT_ENTITIES.length).toBe(7);
				expect(oResponseObject.body.masterdata.COMPONENT_SPLIT_TEXT_ENTITIES.length).toBe(14);
				
				// Check that associated objects are delivered
				expect(oResponseObject.body.masterdata.ACCOUNT_GROUP_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseObject.body.masterdata.SELECTED_ACCOUNT_GROUPS_ENTITIES.length).toBeGreaterThan(0);
				
				// Check locking information
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(0);			
			});
			
			it('should return Costing Sheet, associated objects and lock status', function() {
				
				// arrange
				var oRequest = buildGetRequest(BusinessObjectTypes.CostingSheet, true);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ENTITIES.length).toBe(1);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_TEXT_ENTITIES.length).toBe(2);
				
				// Check that associated objects are delivered
				expect(oResponseObject.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
				
				// Check locking information
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(0);					
			});

			it('should return Costing Sheet Rows, associated objects and lock status', function() {

				// arrange
				var oRequest = buildGetRequest(BusinessObjectTypes.CostingSheetRow, true);

				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ENTITIES.length).toBe(testData.oCostingSheetTestData.COSTING_SHEET_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ROW_ENTITIES.length).toBe(testData.oCostingSheetRowTestData.COSTING_SHEET_ID.length);
				
				// Fetch all costing sheet row dependencies that are currently valid to enable row-by-row test result comparison
				var	oCostingSheetRowDependenciesTestData = _.filter(testData.oCostingSheetRowDependenciesTestData._VALID_TO, function(sCsRowValidTo) {
					return ((new Date(sCsRowValidTo)).getTime() >= (new Date(testData.sExpectedDate)).getTime() || sCsRowValidTo === null);
				});
					
				// Check that associated objects are delivered				
				expect(oResponseObject.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBeGreaterThan(0);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_BASE_ENTITIES.length).toBe(testData.oCostingSheetBaseTestData.COSTING_SHEET_BASE_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_BASE_ROW_ENTITIES.length).toBe(testData.oCostingSheetBaseRowTestData.COSTING_SHEET_BASE_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_OVERHEAD_ENTITIES.length).toBe(testData.oCostingSheetOverheadTestData.COSTING_SHEET_OVERHEAD_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_OVERHEAD_ROW_ENTITIES.length).toBe(testData.oCostingSheetOverheadRowTestData.COSTING_SHEET_OVERHEAD_ROW_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES.length).toBe(oCostingSheetRowDependenciesTestData.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ROW_TEXT_ENTITIES.length).toBe(testData.oCostingSheetRowTextTestData.COSTING_SHEET_ID.length);
				
				// Check that only objects are delivered following the specification, but not those as follows
				expect(oResponseObject.body.masterdata.ACCOUNT_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.ACCOUNT_GROUP_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.ACCOUNT_GROUP_TEXT_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.BUSINESS_AREA_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.PLANT_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.PROFIT_CENTER_ENTITIES.length).toBe(0);
				expect(oResponseObject.body.masterdata.OVERHEAD_GROUP_ENTITIES.length).toBe(0);
				
				// Check locking information
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(0);	
			});
			
			it('[CostingSheetRow is locked] should return Costing Sheet Rows and lock status with locking user id', function() {

				// arrange
				var oRequest = buildGetRequest(BusinessObjectTypes.CostingSheetRow, true);
				
				// Set lock by another user
				var sLockingUserId = "anotherUser";
				var oSession = {
						SESSION_ID : [ sLockingUserId ],
						USER_ID : [ sLockingUserId ],
						LANGUAGE : [ "EN" ],
						LAST_ACTIVITY_TIME : [ new Date()]
				};
				mockstar.insertTableData("session", oSession);
				oPersistency.Misc.setLock(BusinessObjectTypes.CostingSheet, sLockingUserId);
				oPersistency.Misc.setLock(BusinessObjectTypes.CostingSheetRow, sLockingUserId);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ENTITIES.length).toBe(testData.oCostingSheetTestData.COSTING_SHEET_ID.length);
				expect(oResponseObject.body.masterdata.COSTING_SHEET_ROW_ENTITIES.length).toBe(testData.oCostingSheetRowTestData.COSTING_SHEET_ID.length);

				// Check locking information
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.IsLocked]).toBe(1);	
				expect(oResponseObject.body.masterdata[ServiceMetaInformation.LockStatus][ServiceMetaInformation.UserId]).toBe(sLockingUserId);	
			});
			
			
		});

	}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
}
