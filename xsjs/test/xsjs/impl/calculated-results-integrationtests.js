/*jslint undef:true*/
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;
var InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

var PersistencyImport = $.import("xs.db", "persistency");
var oMockstar = null;
var Persistency = PersistencyImport.Persistency;

var _ = require("lodash");
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);
var MessageLibrary = require("../../../lib/xs/util/message");
var messageCode = MessageLibrary.Code;

var oDefaultResponseMock = null;

var oPersistency = null;

describe('xsjs.impl.calculated-results-integrationtests',	function() {
	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					substituteTables :
					{
						open_calculation_versions : "sap.plc.db::basis.t_open_calculation_versions",
						calculation_version_temporary : "sap.plc.db::basis.t_calculation_version_temporary",
						calculation_version : "sap.plc.db::basis.t_calculation_version",
						item_temporary : "sap.plc.db::basis.t_item_temporary",
						item_temporary_ext : "sap.plc.db::basis.t_item_temporary_ext",
						item : "sap.plc.db::basis.t_item",
						item_calculated_values_costing_sheet : "sap.plc.db::basis.t_item_calculated_values_costing_sheet",
						item_calculated_values_component_split : "sap.plc.db::basis.t_item_calculated_values_component_split",
						item_ext : "sap.plc.db::basis.t_item_ext",
						costing_sheet : {
							name : "sap.plc.db::basis.t_costing_sheet",
							data : testData.oCostingSheetTestData
						},
						session : "sap.plc.db::basis.t_session",
						calculation : "sap.plc.db::basis.t_calculation",
						project: "sap.plc.db::basis.t_project",
						authorization: "sap.plc.db::auth.t_auth_project",
						metadata : {
							name : "sap.plc.db::basis.t_metadata",
							data : testData.mCsvFiles.metadata
						},
						metadata_text : "sap.plc.db::basis.t_metadata__text",
						metadata_item_attributes : {
							name : "sap.plc.db::basis.t_metadata_item_attributes",
							data : testData.mCsvFiles.metadata_item_attributes
						},
						account: {
							name: "sap.plc.db::basis.t_account",
							data: testData.oAccountForItemTestData
						},
						price_component: {
								name: "sap.plc.db::basis.t_price_component",
								data: testData.oPriceComponentTestDataPlc
						}
					},
					csvPackage : testData.sCsvPackage
				});

	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;
	});
	
	function enterPrivilege(sProjectId, sUserId, sPrivilege){
        oMockstar.insertTableData("authorization",{
           PROJECT_ID   : [sProjectId],
           USER_ID      : [sUserId],
           PRIVILEGE    : [sPrivilege]
        });
    }

	describe('get calculated results', function() {

		beforeEach(function() {
		    oMockstar.clearAllTables();
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oMockstar.insertTableData("item", testData.oItemTestData);
			oMockstar.insertTableData("project", testData.oProjectTestData);
			oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
			oMockstar.insertTableData("session", testData.oSessionTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_ext", testData.oItemExtData);
			}
			oMockstar.insertTableData("item_temporary", testData.oItemTemporaryTestData);
			if(jasmine.plcTestRunParameters.generatedFields === true){
				oMockstar.insertTableData("item_temporary_ext", testData.oItemTemporaryExtData);
			}
			oMockstar.insertTableData("calculation", testData.oCalculationTestData);
			oMockstar.insertTableData("calculation_version_temporary", testData.oCalculationVersionTemporaryTestData);
			oMockstar.insertTableData("open_calculation_versions", testData.oOpenCalculationVersionsTestData);
			enterPrivilege(testData.oProjectTestData.PROJECT_ID[0], testData.sTestUser, InstancePrivileges.READ);

			oMockstar.initializeData();
		});

		afterEach(function() {
		});

		function buildGetRequest(iCalculationVersionId, bCalculate, params) {
			if (params === undefined) {
				params = [ {
					"name" : "id",
					"value" : iCalculationVersionId
				}, {
					"name" : "calculate",
					"value" : bCalculate
				}];
			}

			params.get = function(sArgument) {
				var foundParameter = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});
				
				if(foundParameter === undefined)
				    return foundParameter;
				else
				    return foundParameter.value;
			};
			
			var oRequest = {
					queryPath : "calculated-results",
					method : $.net.http.GET,
					parameters : params
			};
			return oRequest;
		}

		function buildRequestCompressedResult(iCalculationVersionId, bCalculate, bCompressedResult, params){
		    if(params === undefined){
		        params = [ {
					"name" : "id",
					"value" : iCalculationVersionId
				}, {
					"name" : "calculate",
					"value" : bCalculate
				},{
					"name" : "compressedResult",
					"value" : bCompressedResult
				}];
		    } 
				
			params.get = function(sArgument) {
				var foundParameter = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});
				
				if(foundParameter === undefined)
				    return foundParameter;
				else
				    return foundParameter.value;
			};
			
			var oRequest = {
					queryPath : "calculated-results",
					method : $.net.http.GET,
					parameters : params
			};
			return oRequest;
		}

		it('should get results for calculation version -> returns calculated results; [calculate: true]', function() {
			// arrange
			var oRequest = buildGetRequest(testData.iCalculationVersionId, true);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// check calculated fields
			expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS[0].ITEM_ID).toBe(testData.oItemTemporaryTestData.ITEM_ID[0]);
		});
		
		it('should get results for calculation version -> returns calculated results;[calculate is not set]', function() {
			// arrange
			var	params = [ {
					"name" : "id",
					"value" : testData.iCalculationVersionId
				}];
			
			var oRequest = buildGetRequest(testData.iCalculationVersionId, null, params);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// check calculated fields
			expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS[0].ITEM_ID).toBe(testData.oItemTemporaryTestData.ITEM_ID[0]);
		});
		
		it('should get results for calculation version -> returns calculated results; [calculate: false]', function() {
			// arrange
			var oRequest = buildGetRequest(testData.iCalculationVersionId, false);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// check calculated fields
			expect(oResponseObject.body.calculated.ITEM_CALCULATED_FIELDS[0].ITEM_ID).toBe(testData.oItemTemporaryTestData.ITEM_ID[0]);
		});
		
		it('should get results for calculation version -> returns calculated results compressed; [calculate: true]', function() {
			    
			// arrange
			var oRequest = buildRequestCompressedResult(testData.iCalculationVersionId, true, true);
        	
        	// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check compressed format and the calculated fields
			const oResponseCv = oResponseObject.body.calculated;
		    expect(oResponseCv.ITEM_CALCULATED_FIELDS_COMPRESSED).toMatchData(
        	    {'ITEM_ID': [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]]                                    
        	}, ['ITEM_ID']);
			    
		});
		
		it('should get results for frozen calculation version -> returns calculated results compressed; [calculate: true]', function() {
			    
			// arrange
			var oRequest = buildRequestCompressedResult(testData.iCalculationVersionId, true, true);
        	
        	var oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
        	oCalculationVersionTestData.IS_FROZEN='1';
        	oMockstar.clearTables("calculation_version");
        	oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
        	
        	// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check compressed format and the calculated fields
			const oResponseCv = oResponseObject.body.calculated;
		    expect(oResponseCv.ITEM_CALCULATED_FIELDS_COMPRESSED).toMatchData(
        	    {'ITEM_ID': [testData.oItemTemporaryTestData.ITEM_ID[0], testData.oItemTemporaryTestData.ITEM_ID[1], testData.oItemTemporaryTestData.ITEM_ID[2]],
        	     'TOTAL_COST_PER_UNIT' : ['39.0000000', '9.0000000', '9.0000000']                                           
        	}, ['ITEM_ID']);
			    
		});
		
		it('should get results for calculation version -> returns calculated results compressed; [calculate: false]', function() {
			// arrange
			var oRequest = buildRequestCompressedResult(testData.iCalculationVersionId, false, true);
		
        	var oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).getObject(0);
			
			var oItemCalculatedValues = new TestDataUtility(testData.oItemCalculatedTestData).getObject(0); 			
			var oItemCalculatedValuesCostingSheet = new TestDataUtility(testData.oItemCalculatedValuesCostingSheet).getObject(0);
			var oItemCalculatedValuesComponentSplit = new TestDataUtility(testData.oItemCalculatedValuesComponentSplit).getObject(0);
			// Load modified test data into mocked data set
			oMockstar.clearTables("calculation_version", "item", "item_calculated_values_costing_sheet", "item_calculated_values_component_split", "item_ext");
			oMockstar.insertTableData("calculation_version", oCalculationVersionTestData);
			
			oMockstar.insertTableData("item", oItemCalculatedValues);
			oMockstar.insertTableData("item_calculated_values_costing_sheet", oItemCalculatedValuesCostingSheet);
			oMockstar.insertTableData("item_calculated_values_component_split", oItemCalculatedValuesComponentSplit);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//check compressed format and the calculated fields
			const oResponseCv = oResponseObject.body.calculated;
		    expect(oResponseCv.ITEM_CALCULATED_FIELDS_COMPRESSED).toMatchData(
        	    {'ITEM_ID': [testData.oItemTemporaryTestData.ITEM_ID[0]],
        	     'TOTAL_COST_PER_UNIT' : [testData.oItemCalculatedTestData.TOTAL_COST_PER_UNIT[0]]                                           
        	}, ['ITEM_ID']);
        	
        	expect(oResponseCv.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT_COMPRESSED).toMatchData(
        	    {'COMPONENT_SPLIT_ID': [testData.oItemCalculatedValuesComponentSplit.COMPONENT_SPLIT_ID[0]],
        	     'ITEM_ID' : [testData.oItemCalculatedValuesComponentSplit.ITEM_ID[0]]                                           
        	}, ['COMPONENT_SPLIT_ID']);
        	
        	expect(oResponseCv.ITEM_CALCULATED_VALUES_COSTING_SHEET_COMPRESSED).toMatchData(
        	    {'COSTING_SHEET_ROW_ID': [testData.oItemCalculatedValuesCostingSheet.COSTING_SHEET_ROW_ID[0]],
        	     'ITEM_ID' : [testData.oItemCalculatedValuesCostingSheet.ITEM_ID[0]]                                           
        	}, ['COSTING_SHEET_ROW_ID']);
		});
		
		it('should get results if calculation version is temporary -> returns calculated results', function() {
			// arrange
			oMockstar.clearTable("calculation_version");
			var oRequest = buildGetRequest(testData.iCalculationVersionId, true);
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		});
		
		it('should return error if calculation version does not exist -> throw GENERAL_ENTITY_NOT_FOUND_ERROR', function() {
			// arrange
			var oRequest = buildGetRequest(989898, true);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
		});		
		
		it('should return error if calculation version is not opened -> throw CALCULATION_VERSION_NOT_OPEN_ERROR', function() {
			// arrange
			var oRequest = buildGetRequest(testData.iCalculationVersionId, true);
			oMockstar.clearTable("open_calculation_versions");

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(messageCode.CALCULATION_VERSION_NOT_OPEN_ERROR.code);
		});	
		
		it('should return error if calculation version in request is not valid -> throw GENERAL_VALIDATION_ERROR', function() {
			// arrange
			var oRequest = buildGetRequest(-1, true);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
		});	
		
		it('should return error if calculate parameter in request is invalid -> throw GENERAL_VALIDATION_ERROR', function() {
			// arrange
			var params = [ {
				"name" : "id",
				"value" : testData.iCalculationVersionId
			}, {
				"name" : "calculate",
				"value" : "INVALID"
			}];
			var oRequest = buildGetRequest(testData.iCalculationVersionId, params);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
			
			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			expect(oResponseObject.head.messages.length).toEqual(1);
			expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
		});	

	});

}).addTags(["Project_Calculation_Version_Integration"]);