var testData         = require("../../../../testdata/testdata").data;
var mockstar_helpers = require("../../../../testtools/mockstar_helpers");
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;
var ProjectTables       = $.import("xs.db", "persistency-project").Tables;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
var TestDataUtility          = require("../../../../testtools/testDataUtility").TestDataUtility;
var _ = require("lodash");

describe('xsjs.db.administration.factory.costCenter-integrationtests', function() {

	
	var originalProcedures = null;
	var mockstar = null;
	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function() {

		mockstar = new MockstarFacade({
			testmodel : {
				"procRead" : "sap.plc.db.administration.procedures/p_cost_center_read"  
			},
			substituteTables : {
				cost_center : Resources["Cost_Center"].dbobjects.plcTable,
				gtt_cost_center: Resources["Cost_Center"].dbobjects.tempTable,
				cost_center_text : Resources["Cost_Center"].dbobjects.plcTextTable,
				gtt_cost_center_text : Resources["Cost_Center"].dbobjects.tempTextTable,
				controlling_area : Resources["Controlling_Area"].dbobjects.plcTable,
				currency : Resources["Currency"].dbobjects.plcTable,
				activity_price : Resources["Activity_Price"].dbobjects.plcTable,
				project : ProjectTables.project,
				project_activity_price_surcharges: ProjectTables.project_activity_price_surcharges,
				language : {
					name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
					data : testData.oLanguage
				},
				metadata : {
					name : "sap.plc.db::basis.t_metadata",
					data : testData.mCsvFiles.metadata
				},
				metadata_item_attributes : {
					name : "sap.plc.db::basis.t_metadata_item_attributes",
					data : testData.mCsvFiles.metadata_item_attributes
				},
				session : {
					name : "sap.plc.db::basis.t_session",
					data : testData.oSessionTestData
				},
				cost_center_ext : "sap.plc.db::basis.t_cost_center_ext"
			},
			csvPackage : testData.sCsvPackage
		});

		if (!mockstar.disableMockstar) {
            var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Cost_Center"];
            originalProcedures = MasterdataReadProcedures;
            MasterdataReadProcedures = Object.freeze({
            	"Cost_Center": procedureXsunit
            });
		}
		
	});

	afterOnce(function() {
		if (!mockstar.disableMockstar) {
			MasterdataReadProcedures = originalProcedures;
			mockstar.cleanup();
		}
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;
		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;
	});
	
	describe ("get", function (){
		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables and views		
			mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
			mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
			mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should return valid cost centers and texts', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
			var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(3);
		});

		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should return valid cost centers with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Cost_Center"
				} ];
				
				var aExpectedCostCentersExtPlc = [];
				var oCostCenters = new TestDataUtility(testData.oCostCenterTestDataPlc).build();
				var aCostCenters = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oCostCenters);
				var aExpectedCostCenters = _.filter(aCostCenters, function(oCostCenter) {
				    return (oCostCenter._VALID_TO === null);
			    }); 
				var oExpectedCostCenter = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedCostCenters);
				
				var oCostCentersExt = new TestDataUtility(testData.oCostCenterExtTestDataPlc).build();
				var aCostCentersExt = mockstar_helpers.convertObjectWithArraysToArrayOfObjects(oCostCentersExt);
				
				_.each(aExpectedCostCenters, function(oCostCenter){
				    var aExpectedCostCenterExtPart = _.filter(aCostCentersExt, function(oCostCenterExt){
				        return (oCostCenterExt.CONTROLLING_AREA_ID === oCostCenter.CONTROLLING_AREA_ID && oCostCenterExt.COST_CENTER_ID === oCostCenter.COST_CENTER_ID && oCostCenterExt._VALID_FROM === oCostCenter._VALID_FROM);
				    }) ;
				    aExpectedCostCentersExtPlc = _.union(aExpectedCostCentersExtPlc, aExpectedCostCenterExtPart);
				});

				var oExpectedExtCostCenter = _.pick(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(aExpectedCostCentersExtPlc),"CCEN_DATE_MANUAL", "CCEN_DATE_UNIT");
				var iLenDif = aExpectedCostCenters.length - aExpectedCostCentersExtPlc.length;
				for(var i = 0; i < iLenDif; i++){
				    oExpectedExtCostCenter.CCEN_DATE_MANUAL.push(null);
				    oExpectedExtCostCenter.CCEN_DATE_UNIT.push(null);
				}
				
				oExpectedCostCenter = _.extend(oExpectedCostCenter, oExpectedExtCostCenter);
				 
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
	            var returnedResult = mockstar_helpers.convertArrayOfObjectsToObjectOfArrays(oResponseBody.body.masterdata.COST_CENTER_ENTITIES);
	            expect(returnedResult).toMatchData(oExpectedCostCenter, ["CONTROLLING_AREA_ID", "COST_CENTER_ID", "_VALID_FROM"]);
			});
		}
		
		it('should return the filtered entries', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			},{
			    name : "filter",
			    value : "CONTROLLING_AREA_ID=#CA1"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(2);
            expect(oResponseBody.body.masterdata.COST_CENTER_TEXT_ENTITIES.length).toBe(2);
		});
		
		it('should return the entries using searchAutocomplete', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			},{
			    name : "filter",
			    value : "CONTROLLING_AREA_ID=#CA1"
			},{
			    name : "searchAutocomplete",
			    value : "C"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(2);
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES[0]).toMatchData(
        	                    {'COST_CENTER_ID': 'CC2',
        	                     'COST_CENTER_DESCRIPTION' : null,
        	                     'CONTROLLING_AREA_ID': '#CA1',
                                '_SOURCE': 1
                                }, ['COST_CENTER_ID']);
		});
		
		it('should return the entries using searchAutocomplete and multiple filters', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			},{
			    name : "filter",
			    value : "COST_CENTER_ID=CC2&CONTROLLING_AREA_ID=#CA1"
			},{
			    name : "searchAutocomplete",
			    value : "C"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(1);
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES[0]).toMatchData(
        	                    {'COST_CENTER_ID': 'CC2',
        	                     'COST_CENTER_DESCRIPTION' : null,
        	                     'CONTROLLING_AREA_ID': '#CA1',
                                '_SOURCE': 1
                                }, ['COST_CENTER_ID']);
		});
		
		it('should return the entries using searchAutocomplete that does not match the data', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			},{
			    name : "filter",
			    value : "CONTROLLING_AREA_ID=#CA1"
			},{
			    name : "searchAutocomplete",
			    value : "XY"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(0);
		});

		it('should not return any entries for an invalid controlling_area (filter)', function() {
		    // arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			},{
			    name : "filter",
			    value : "CONTROLLING_AREA_ID=#CAA"
			} ];
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			// assert
			expect(oDefaultResponseMock.status).toBe($.net.http.OK);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.COST_CENTER_ENTITIES.length).toBe(0);
            expect(oResponseBody.body.masterdata.COST_CENTER_TEXT_ENTITIES.length).toBe(0);
		});
	});

	describe ("remove", function (){
		const aParams = [ {
			name : "business_object",
			value : "Cost_Center"
		}];
	    
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
			mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
			mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			mockstar.insertTableData("activity_price", testData.oActivityPriceTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});
		
		it('should deactivate cost centers', function() {
			// arrange			
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                    							"COST_CENTER_ID" : "CC3",
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
                    						}]
                				        }
                				};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where CONTROLLING_AREA_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and COST_CENTER_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}'`));
					
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "cost_center");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where CONTROLLING_AREA_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and COST_CENTER_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}'`));
			var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "cost_center_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where CONTROLLING_AREA_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and COST_CENTER_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}'`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where CONTROLLING_AREA_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and COST_CENTER_ID = '${oItemsPayload.DELETE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.DELETE.COST_CENTER_ENTITIES[0]._VALID_TO).not.toBe(null);
            expect(oTestBefore._VALID_TO[0]).toBe(null);
            expect(oTestAfter._VALID_TO[0]).not.toBe(null);
            expect(mockstar_helpers.getRowCount(mockstar, "cost_center")).toBe(iTestBefore);
            if(jasmine.plcTestRunParameters.generatedFields === true){
                expect(mockstar_helpers.getRowCount(mockstar, "cost_center_ext")).toBe(iTestExtBefore);
            }
		});

		it('should not change _valid_to when trying to delete an inactive version', function() {
			// arrange
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                     	                        "COST_CENTER_ID" : "CC1",
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
                    						}]
                				        }
                				};
			
			var oTestBefore = mockstar.execQuery("select * from {{cost_center}} where COST_CENTER_ID = 'CC1'");
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			var oTestAfter = mockstar.execQuery("select * from {{cost_center}} where COST_CENTER_ID = 'CC1'");
			expect(oTestBefore).toEqual(oTestAfter);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a cost center for which mandatory fields are missing', function() {
            // arrange
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                     	                        "COST_CENTER_ID" : "CC3"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a cost center which is used in other business objects', function() {
			// arrange
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                     	                        	"COST_CENTER_ID" : "CC2",
                        							"CONTROLLING_AREA_ID" : "#CA1",
                        							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ActivityPrice);		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a cost center used in project activity price surcharges', function() {
			// arrange			
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                     	                        	"COST_CENTER_ID" : testData.oProjectActivityPriceSurcharges.COST_CENTER_ID[0],
                        							"CONTROLLING_AREA_ID" : testData.oProjectTestData.CONTROLLING_AREA_ID[0],
                        							"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
                    						}]
                				        }
                				};
			mockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
			mockstar.insertTableData("project",  testData.oProjectTestData);
			let oCostCenterData = {
					"COST_CENTER_ID" : [testData.oProjectActivityPriceSurcharges.COST_CENTER_ID[0]],
					"CONTROLLING_AREA_ID" : [testData.oProjectTestData.CONTROLLING_AREA_ID[0]],
					"_VALID_FROM" : ["2015-01-01T15:39:09.691Z"]
			}; 
			mockstar.insertTableData("cost_center", oCostCenterData);
			
		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            let oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectActivityPriceSurcharges);		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
		});			
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a cost center that does not exist', function() {
		    // arrange			
			var oItemsPayload = {"DELETE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                    	                        "COST_CENTER_ID" : "CC2",
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"_VALID_FROM" : "2015-05-01T15:39:09.691Z"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
			//assert
		    expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
		});
		
	});

	describe ("insert", function (){
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
			mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
			mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			mockstar.insertTableData("currency",testData.oCurrencySecond);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should insert cost_center and cost_center_text', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oTesta = mockstar.execQuery("select * from {{cost_center}}");
			var oTestTexta = mockstar.execQuery("select * from {{cost_center_text}}");
			
			var oItemsPayload = {"CREATE":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : '#CA1'
                    						},{
                    							"COST_CENTER_ID" : 'INS2',
                    							"CONTROLLING_AREA_ID" : '#CA1'
                    						}],
                    						"COST_CENTER_TEXT_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 EN',
                    							"LANGUAGE" : "EN"
                    						},{
                    							"COST_CENTER_ID" : 'INS1',
                      						    "CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 DE',
                    							"LANGUAGE" : "DE"
                    						},{
                    							"COST_CENTER_ID" : 'INS2',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test2 EN',
                    							"LANGUAGE" : "EN"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{cost_center}}");
			var oTestText = mockstar.execQuery("select * from {{cost_center_text}}");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
			expect(oTestText.columns.COST_CENTER_ID.rows.length).toBe(oTestTexta.columns.COST_CENTER_ID.rows.length + 3);
			expect(oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.COST_CENTER_TEXT_ENTITIES[0]._VALID_FROM);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert cost center with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Cost_Center"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "cost_center");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "cost_center_ext");
				
				var oItemsPayload = {"CREATE":
			       { 
						"COST_CENTER_ENTITIES" : [{
							"COST_CENTER_ID" : 'INS1',
							"CONTROLLING_AREA_ID" : '#CA1',
							"CCEN_DATE_MANUAL" : "2011-08-20"
						},{
							"COST_CENTER_ID" : 'INS2',
							"CONTROLLING_AREA_ID" : '#CA1'
						}]
			        }
			};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                                
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}'`));
						
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}'`));
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "cost_center")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "cost_center_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.CREATE.COST_CENTER_ENTITIES[0].CCEN_DATE_MANUAL).toBe(oTestExt.CCEN_DATE_MANUAL[0]);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a cost center that has a unit for a custom field that does not allow units', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Cost_Center"
				}];

				var oItemsPayload = {"CREATE":
	                				       { 
											"COST_CENTER_ENTITIES": [{
												"COST_CENTER_ID" : 'INS1',
												"CONTROLLING_AREA_ID" : '#CA1',
												"CCEN_DATE_UNIT" : 'EUR'
											}]
	                				        }
	                				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
	            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	            
	            //assert
	            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("CCEN_DATE_UNIT");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
		}
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a cost center that does not exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
                    					   "COST_CENTER_TEXT_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 EN',
                    							"LANGUAGE" : "EN"
                    						},{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 DE',
                    							"LANGUAGE" : "DE"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
			expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
		});

		it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a cost center that already exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
                    					   "COST_CENTER_ENTITIES" : [{
                    							"COST_CENTER_ID" : "CC3",
                    							"CONTROLLING_AREA_ID" : "#CA1"
                    						}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
		});
		
		it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a cost center text that already exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
										"COST_CENTER_TEXT_ENTITIES" : [{
											"COST_CENTER_ID" : 'CC3',
											"CONTROLLING_AREA_ID" : '#CA1',
											"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
											"COST_CENTER_DESCRIPTION" : 'Updated cost center description',
											"LANGUAGE" : "EN"
										}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR.code);
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'INS1',
												"CONTROLLING_AREA_ID" : '#CAA'
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a cost center for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"CREATE":
                				       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'INS1'
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
            //assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");			
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
	});

	describe ("upsert", function (){
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
			mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
			mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			mockstar.insertTableData("currency",testData.oCurrencySecond);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		it('should insert cost_center and cost_center_text', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oTesta = mockstar.execQuery("select * from {{cost_center}}");
			var oTestTexta = mockstar.execQuery("select * from {{cost_center_text}}");
			
			var oItemsPayload = {"UPSERT":
                				       { 
                    						"COST_CENTER_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : '#CA1'
                    						},{
                    							"COST_CENTER_ID" : 'INS2',
                    							"CONTROLLING_AREA_ID" : '#CA1'
                    						}],
                    						"COST_CENTER_TEXT_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 EN',
                    							"LANGUAGE" : "EN"
                    						},{
                    							"COST_CENTER_ID" : 'INS1',
                      						    "CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 DE',
                    							"LANGUAGE" : "DE"
                    						},{
                    							"COST_CENTER_ID" : 'INS2',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test2 EN',
                    							"LANGUAGE" : "EN"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			var oTest = mockstar.execQuery("select * from {{cost_center}}");
			var oTestText = mockstar.execQuery("select * from {{cost_center_text}}");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTest.columns.COST_CENTER_ID.rows.length).toBe(oTesta.columns.COST_CENTER_ID.rows.length + 2);
			expect(oTestText.columns.COST_CENTER_ID.rows.length).toBe(oTestTexta.columns.COST_CENTER_ID.rows.length + 3);
			expect(oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.COST_CENTER_TEXT_ENTITIES[0]._VALID_FROM);
		});
		
		if(jasmine.plcTestRunParameters.generatedFields === true){
			it('should insert cost center with custom fields', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Cost_Center"
				}];
				
				var iTestBefore = mockstar_helpers.getRowCount(mockstar, "cost_center");
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "cost_center_ext");
				
				var oItemsPayload = {"UPSERT":
									       { 
												"COST_CENTER_ENTITIES" : [{
													"COST_CENTER_ID" : 'INS1',
													"CONTROLLING_AREA_ID" : '#CA1',
													"CCEN_DATE_MANUAL" : "2011-08-20"
												},{
													"COST_CENTER_ID" : 'INS2',
													"CONTROLLING_AREA_ID" : '#CA1'
												}]
									        }
									};
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
	            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	                            
				var oTest = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}'`));
				var oTestExt = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}'`));
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(mockstar_helpers.getRowCount(mockstar, "cost_center")).toBe(iTestBefore+2);
				expect(mockstar_helpers.getRowCount(mockstar, "cost_center_ext")).toBe(iTestExtBefore+2);
				expect(oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oTest._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0]._VALID_FROM).toBe(oTestExt._VALID_FROM[0]);
				expect(oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0].CCEN_DATE_MANUAL).toBe(oTestExt.CCEN_DATE_MANUAL[0]);
			});
		}
		
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a cost center that does not exists', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
                    					   "COST_CENTER_TEXT_ENTITIES" : [{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 EN',
                    							"LANGUAGE" : "EN"
                    						},{
                    							"COST_CENTER_ID" : 'INS1',
                    							"CONTROLLING_AREA_ID" : "#CA1",
                    							"COST_CENTER_DESCRIPTION" : 'Test1 DE',
                    							"LANGUAGE" : "DE"
                    						}]
                				        }
                				};

		    // act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
		
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);		
			expect(oResponseBody.head.messages[1].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);
		});

		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (controlling area) does not exist', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'INS1',
												"CONTROLLING_AREA_ID" : '#CAA'
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

			//assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.MAIN_OBJ);		
			expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.ControllingArea);
		});
		
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a cost center for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oItemsPayload = {"UPSERT":
                				       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'INS1'
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
            //assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");			
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});
		
		it('should deactivate the current version of the upserted cost center text and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oTestMainBefore = mockstar.execQuery("select * from {{cost_center}} WHERE COST_CENTER_ID = 'CC3'");
			var oTestTextBefore = mockstar.execQuery("select * from {{cost_center_text}} WHERE COST_CENTER_ID = 'CC3'");
			
			var oItemsPayload = {"UPSERT":
                				       { 
											"COST_CENTER_TEXT_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"CONTROLLING_AREA_ID" : '#CA1',
												"COST_CENTER_DESCRIPTION" : 'Updated cost center description',
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			//when the entity is updated, the main entry and all the texts are copied
			var oTestMain = mockstar.execQuery("select * from {{cost_center}} WHERE COST_CENTER_ID = 'CC3'");
			var oTestText = mockstar.execQuery("select * from {{cost_center_text}} WHERE COST_CENTER_ID = 'CC3'");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			expect(oTestMain.columns.COST_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.COST_CENTER_ID.rows.length);
			expect(oTestText.columns.COST_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.COST_CENTER_ID.rows.length + 1);
		});
	
		it('should deactivate the current version of the upserted cost center and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oItemsPayload = {"UPSERT":
								       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"CONTROLLING_AREA_ID" : '#CA1',
											}]
								        }
								};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "cost_center");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "cost_center_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
	        var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	        
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_TO is null`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPSERT.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
	        expect(oResponseBody.body.masterdata.UPSERT.COST_CENTER_ENTITIES[0]._VALID_TO).toBe(null);
	        expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
	        expect(mockstar_helpers.getRowCount(mockstar, "cost_center")).toBe(iTestBefore+1);
	        if(jasmine.plcTestRunParameters.generatedFields === true){
	        	//oTestExtAfter.CMAT_STRING_MANUAL[0] will be empty if it's not set in the request
	        	expect(oTestExtAfter.CCEN_DATE_MANUAL[0]).not.toBe(oTestExtBefore.CCEN_DATE_MANUAL[0]);
	        	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
	        	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
	            expect(mockstar_helpers.getRowCount(mockstar, "cost_center_ext")).toBe(iTestExtBefore+1);
	        }
		});
	});
	
	describe ("update", function (){
		
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.insertTableData("cost_center", testData.oCostCenterTestDataPlc);
			mockstar.insertTableData("cost_center_text", testData.oCostCenterTextTestDataPlc);
			mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				mockstar.insertTableData("metadata", testData.oMetadataCustTestData);
				mockstar.insertTableData("metadata_item_attributes", testData.oMetadataItemAttributesCustTestData);
				mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
			}
			
			mockstar.initializeData();
		});

		
		it('should deactivate the current version of the updated cost center and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oItemsPayload = {"UPDATE":
								       { 
											"COST_CENTER_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"CONTROLLING_AREA_ID" : '#CA1',
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z'
											}]
								        }
								};
			
			var oTestBefore = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_TO is null`));
			var iTestBefore = mockstar_helpers.getRowCount(mockstar, "cost_center");
			
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtBefore = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_FROM = '${oTestBefore._VALID_FROM}'`));
				var iTestExtBefore = mockstar_helpers.getRowCount(mockstar, "cost_center_ext");
			}
			
			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
            
			var oTestAfter = mockstar_helpers.convertResultToArray(
					mockstar.execQuery(`select * from {{cost_center}} where COST_CENTER_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_TO is null`));
			if(jasmine.plcTestRunParameters.generatedFields === true){
				var oTestExtAfter = mockstar_helpers.convertResultToArray(
						mockstar.execQuery(`select * from {{cost_center_ext}} where COST_CENTER_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].COST_CENTER_ID}' and CONTROLLING_AREA_ID = '${oItemsPayload.UPDATE.COST_CENTER_ENTITIES[0].CONTROLLING_AREA_ID}' and _VALID_FROM = '${oTestAfter._VALID_FROM}'`));
			}
		    
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
            expect(oResponseBody.body.masterdata.UPDATE.COST_CENTER_ENTITIES[0]._VALID_TO).toBe(null);
            expect(oTestAfter._VALID_FROM[0]).not.toBe(oTestBefore._VALID_FROM[0]);
            expect(mockstar_helpers.getRowCount(mockstar, "cost_center")).toBe(iTestBefore+1);
            if(jasmine.plcTestRunParameters.generatedFields === true){
            	//oTestExtAfter.CCEN_DATE_MANUAL[0] will be empty if it's not set in the request
            	expect(oTestExtAfter.CCEN_DATE_MANUAL[0]).not.toBe(oTestExtBefore.CCEN_DATE_MANUAL[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).not.toBe(oTestExtBefore._VALID_FROM[0]);
            	expect(oTestExtAfter._VALID_FROM[0]).toBe(oTestAfter._VALID_FROM[0]);
                expect(mockstar_helpers.getRowCount(mockstar, "cost_center_ext")).toBe(iTestExtBefore+1);
            }
		});
		
		it('should deactivate the current version of the updated cost center text and create a new version', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];

			var oTestMainBefore = mockstar.execQuery("select * from {{cost_center}} WHERE COST_CENTER_ID = 'CC3'");
			var oTestTextBefore = mockstar.execQuery("select * from {{cost_center_text}} WHERE COST_CENTER_ID = 'CC3'");
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"COST_CENTER_TEXT_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"CONTROLLING_AREA_ID" : '#CA1',
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
												"COST_CENTER_DESCRIPTION" : 'Updated cost center description',
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			//when the entity is updated, the main entry and all the texts are copied
			var oTestMain = mockstar.execQuery("select * from {{cost_center}} WHERE COST_CENTER_ID = 'CC3'");
			var oTestText = mockstar.execQuery("select * from {{cost_center_text}} WHERE COST_CENTER_ID = 'CC3'");
			
			//assert
			expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
			expect(oResponseBody).toBeDefined();
			//expect(oTestMain.columns.COST_CENTER_ID.rows.length).toBe(oTestMainBefore.columns.COST_CENTER_ID.rows.length + 1);
			expect(oTestText.columns.COST_CENTER_ID.rows.length).toBe(oTestTextBefore.columns.COST_CENTER_ID.rows.length + 1);
		});
			
		it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a cost center text for which mandatory fields are missing', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"COST_CENTER_TEXT_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"COST_CENTER_DESCRIPTION" : 'Updated cost center description',
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
           
			//assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("CONTROLLING_AREA_ID");		
			expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
			expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
		});	
					
		it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update an cost center text and the cost center text is not available in system', function() {
			// arrange
			var aParams = [ {
				name : "business_object",
				value : "Cost_Center"
			}];
			
			var oItemsPayload = {"UPDATE":
                				       { 
											"COST_CENTER_TEXT_ENTITIES" : [{
												"COST_CENTER_ID" : 'CC3',
												"CONTROLLING_AREA_ID" : '#CA1',
												"_VALID_FROM" : '2015-05-01T15:39:09.691Z',
												"COST_CENTER_DESCRIPTION" : 'Updated cost center description',
												"LANGUAGE" : "EN"
											}]
                				        }
                				};

			// act
			new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
            var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			
            //assert
            expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
			expect(oResponseBody).toBeDefined();
			expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
			expect(oResponseBody.head.messages[0].details.administrationObjType).toBe(AdministrationObjType.TEXT_OBJ);
		});
		
	});
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);