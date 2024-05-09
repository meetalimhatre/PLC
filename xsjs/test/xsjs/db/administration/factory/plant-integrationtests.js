var testData         = require("../../../../testdata/testdata").data;
var MockstarFacade   = require("../../../../testtools/mockstar_facade").MockstarFacade;
var Administration      = require("../administration-util");
var PersistencyImport   = $.import("xs.db", "persistency");
var Persistency         = PersistencyImport.Persistency;

var Resources = require("../../../../../lib/xs/util/masterdataResources").MasterdataResource;
var ProjectTables			= $.import("xs.db", "persistency-project").Tables;

var MessageLibrary 	        = require("../../../../../lib/xs/util/message");
var MessageCode    	        = MessageLibrary.Code;
var ValidationInfoCode 	    = MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var BusinessObjectTypes     = require("../../../../../lib/xs/util/constants").BusinessObjectTypes;
var DispatcherLibrary       = require("../../../../../lib/xs/impl/dispatcher");
var Dispatcher              = DispatcherLibrary.Dispatcher;
var oCtx                    = DispatcherLibrary.prepareDispatch($);
var MasterdataReadProcedures = require("../../../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.db.administration.plant-integrationtests', function() {
	
		
		var originalProcedures = null;
		var mockstar = null;
		var oDefaultResponseMock = null;
		var oPersistency = null;
	
		beforeOnce(function() {
	
			mockstar = new MockstarFacade({
				testmodel : {
					"procRead": "sap.plc.db.administration.procedures/p_plant_read"
				},
				substituteTables : {
					plant : {
						name : Resources["Plant"].dbobjects.plcTable
					},
					gtt_plant: Resources["Plant"].dbobjects.tempTable,
					plant_text : {
						name : Resources["Plant"].dbobjects.plcTextTable
					},
					gtt_cost_center_text : Resources["Plant"].dbobjects.tempTextTable,
					company_code : {
						name : Resources["Company_Code"].dbobjects.plcTable
					},
					company_code_text : {
						name : Resources["Company_Code"].dbobjects.plcTextTable
					},
					controlling_area : {
						name : Resources["Controlling_Area"].dbobjects.plcTable
					},
					controlling_area_text : {
						name : Resources["Controlling_Area"].dbobjects.plcTextTable
					},
					overhead_group : {
						name : Resources["Overhead_Group"].dbobjects.plcTable
					},
					currency : {
						name : Resources["Currency"].dbobjects.plcTable
					},
					project : ProjectTables.project,
					project_activity_price_surcharges: ProjectTables.project_activity_price_surcharges,
					project_material_price_surcharges: ProjectTables.project_material_price_surcharges,					
					language : {
						name : Resources[BusinessObjectTypes.Language].dbobjects.plcTable,
						data : testData.oLanguage
					},
					metadata :  {
						name : "sap.plc.db::basis.t_metadata",
						data : testData.mCsvFiles.metadata
					},
					session : {
						name : "sap.plc.db::basis.t_session",
						data : testData.oSessionTestData
					},
					work_center : {
						name: Resources["Work_Center"].dbobjects.plcTable
					}
				},
				csvPackage : testData.sCsvPackage
			});
	
			if (!mockstar.disableMockstar) {
                var procedureXsunit = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures["Plant"];
                originalProcedures = MasterdataReadProcedures;
                MasterdataReadProcedures = Object.freeze({
                	"Plant": procedureXsunit
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
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.insertTableData("controlling_area", testData.oControllingAreaTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should return valid plants and texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
			});
			
			it('should return the valid filtered entries', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "PLANT_ID=PL1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(1);
			});

			it('should return the valid filtered entries by _VALID_FROM', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
					value : "_VALID_FROM>=2015-01-01T15:39:09.69Z&_VALID_FROM<=2015-01-01T15:40:09.69Z"
				} ];

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
				expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(2);
			});
			
			it('should return the valid filtered entries using CONTROLLING_AREA_ID and PLANT_ID', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000&PLANT_ID=PL1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			});
			
			
			it('should return the valid filtered entries using CONTROLLING_AREA_ID and PLANT_ID and "not equal" operator', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000&PLANT_ID!=#PL1"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
                expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(2);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			});
			
			
			it('should return the valid filtered entries using CONTROLLING_AREA_ID and PLANT_ID and "containing" operator', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000&PLANT_ID=%PL%"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
                expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(2);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
			});
			
			it('should return the entries filtered by controlling area', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
                
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES).toMatchData({
                   PLANT_ID: [testData.oPlantTestDataPlc.PLANT_ID[0], testData.oPlantTestDataPlc.PLANT_ID[2], testData.oPlantTestDataPlc.PLANT_ID[3]],
                   COMPANY_CODE_ID: [testData.oPlantTestDataPlc.COMPANY_CODE_ID[0], testData.oPlantTestDataPlc.COMPANY_CODE_ID[2], testData.oPlantTestDataPlc.COMPANY_CODE_ID[3]],
                   PLANT_DESCRIPTION: [null, null, null],
                   _SOURCE: [testData.oPlantTestDataPlc._SOURCE[0], testData.oPlantTestDataPlc._SOURCE[2], testData.oPlantTestDataPlc._SOURCE[3]]
                }, ["PLANT_ID"]);
                             
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(2);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES).toMatchData({
      			   COMPANY_CODE_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[1]],
      			   CONTROLLING_AREA_ID: [testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[0], testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[1]],
      			   COMPANY_CODE_CURRENCY_ID: [testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[0], testData.oCompanyCodeTestDataPlc.COMPANY_CODE_CURRENCY_ID[1]],
                   COMPANY_CODE_DESCRIPTION: [null, null],
                   _SOURCE: [testData.oCompanyCodeTestDataPlc._SOURCE[0], testData.oCompanyCodeTestDataPlc._SOURCE[1]]
                 }, ["COMPANY_CODE_ID"]);
               
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_ID[3],
        	                     'CONTROLLING_AREA_CURRENCY_ID' : testData.oControllingAreaTestDataPlc.CONTROLLING_AREA_CURRENCY_ID[3],
        	                     'CONTROLLING_AREA_DESCRIPTION': null,
                                 '_SOURCE': testData.oControllingAreaTestDataPlc._SOURCE[3]
                                }, ['CONTROLLING_AREA_ID']);
			});

			it('should return the entries filtered by controlling area when no company code is found', function () {
				// arrange
				const aParams = [{
					name: "business_object",
					value: "Plant"
				}, {
					name: "filter",
					value: "CONTROLLING_AREA_ID=1000"
				}, {
					name: "searchAutocomplete",
					value: "P"
				}];
				mockstar.clearTable("company_code");
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				const oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);

				expect(oResponseBody.body.masterdata.PLANT_ENTITIES).toMatchData({
					PLANT_ID: [testData.oPlantTestDataPlc.PLANT_ID[0], testData.oPlantTestDataPlc.PLANT_ID[2], testData.oPlantTestDataPlc.PLANT_ID[3]],
					COMPANY_CODE_ID: [testData.oPlantTestDataPlc.COMPANY_CODE_ID[0], testData.oPlantTestDataPlc.COMPANY_CODE_ID[2], testData.oPlantTestDataPlc.COMPANY_CODE_ID[3]],
					PLANT_DESCRIPTION: [null, null, null],
					_SOURCE: [testData.oPlantTestDataPlc._SOURCE[0], testData.oPlantTestDataPlc._SOURCE[2], testData.oPlantTestDataPlc._SOURCE[3]]
				}, ["PLANT_ID"]);

				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
				expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
			
			it('should return the filtered entries using autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "PLANT_ID=PL1"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES[0]).toMatchData(
        	                    {'PLANT_ID': 'PL1',
        	                     'COMPANY_CODE_ID' : 'CC1',
        	                     'PLANT_DESCRIPTION': null,
                                '_SOURCE': 1
                                }, ['PLANT_ID']);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES[0]).toMatchData(
        	                    {'COMPANY_CODE_ID': 'CC1',
        	                     'COMPANY_CODE_CURRENCY_ID' : 'EUR',
        	                     'COMPANY_CODE_DESCRIPTION': null,
        	                     'CONTROLLING_AREA_ID': '1000',
                                '_SOURCE': 1
                                }, ['COMPANY_CODE_ID']);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '1000',
        	                     'CONTROLLING_AREA_CURRENCY_ID' : 'EUR',
        	                     'CONTROLLING_AREA_DESCRIPTION': null,
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
			});
			
			it('should return the  entries filtered by company code using autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "COMPANY_CODE_ID=CC1"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(2);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES).toMatchData(
                                {
                                     'PLANT_ID'         : ['PL1', 'PL4'],
                                     'COMPANY_CODE_ID'  : ['CC1', 'CC1'],
                                     'PLANT_DESCRIPTION': [null, null],
                                     '_SOURCE'          : [1, 1]
                                }, ['PLANT_ID']);
                                
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES[0]).toMatchData(
        	                    {'COMPANY_CODE_ID': 'CC1',
        	                     'COMPANY_CODE_CURRENCY_ID' : 'EUR',
        	                     'COMPANY_CODE_DESCRIPTION': null,
        	                     'CONTROLLING_AREA_ID': '1000',
                                '_SOURCE': 1
                                }, ['COMPANY_CODE_ID']);
                                
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '1000',
        	                     'CONTROLLING_AREA_CURRENCY_ID' : 'EUR',
        	                     'CONTROLLING_AREA_DESCRIPTION': null,
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
			});
			
			it('should return the entries filtered by controlling area having autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(3);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES).toMatchData(
                                {
                                    'PLANT_ID'                : ['PL1', 'PL3', 'PL4'],
                                    'COMPANY_CODE_ID'         : ['CC1', 'CC2', 'CC1'],
                                    'PLANT_DESCRIPTION'       : [null, null, null],
                                    '_SOURCE'                 : [1, 1, 1]
                                }, ['PLANT_ID']);
                                
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(2);
				expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES).toMatchData(
                                {
                                    'COMPANY_CODE_ID'          : ['CC1', 'CC2'],
                                    'COMPANY_CODE_CURRENCY_ID' : ['EUR', 'EUR'],
                                    'COMPANY_CODE_DESCRIPTION' : [null, null],
                                    'CONTROLLING_AREA_ID'      : ['1000', '1000'],
                                    '_SOURCE'                  : [1, 1]
                                }, ['COMPANY_CODE_ID']);
                                
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '1000',
        	                     'CONTROLLING_AREA_CURRENCY_ID' : 'EUR',
        	                     'CONTROLLING_AREA_DESCRIPTION': null,
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
			});
			
			it('should return the valid entries having autocomplete using multi filters', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "CONTROLLING_AREA_ID=1000&COMPANY_CODE_ID=CC1"
				},{
				    name : "searchAutocomplete",
				    value : "P"
				}];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(2);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES[0]).toMatchData(
        	                    {'COMPANY_CODE_ID': 'CC1',
        	                     'COMPANY_CODE_CURRENCY_ID' : 'EUR',
        	                     'COMPANY_CODE_DESCRIPTION': null,
        	                     'CONTROLLING_AREA_ID': '1000',
                                '_SOURCE': 1
                                }, ['COMPANY_CODE_ID']);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(1);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES[0]).toMatchData(
        	                    {'CONTROLLING_AREA_ID': '1000',
        	                     'CONTROLLING_AREA_CURRENCY_ID' : 'EUR',
        	                     'CONTROLLING_AREA_DESCRIPTION': null,
                                '_SOURCE': 1
                                }, ['CONTROLLING_AREA_ID']);
			});
	
			it('should not return any entries for an invalid plant (filter)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "PLANT_ID=PID"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.PLANT_TEXT_ENTITIES.length).toBe(0);
			});
			
			it('should not return any entries using wrong autocomplete', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
				    name : "filter",
				    value : "PLANT_ID=PL1"
				},{
				    name : "searchAutocomplete",
				    value : "XZ"
				} ];
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				
				// assert
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oResponseBody.body.masterdata.PLANT_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.COMPANY_CODE_ENTITIES.length).toBe(0);
                expect(oResponseBody.body.masterdata.CONTROLLING_AREA_ENTITIES.length).toBe(0);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use top and skip parameters with values greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iTop = 214748364899;
				var iSkip = 2147483648;
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
					name : "skip",
					value : iSkip
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use skip parameter with a value greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iSkip = 2147483648;
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
					name : "skip",
					value : iSkip
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
			
			it('should throw GENERAL_VALIDATION_ERROR when trying to use top parameter with a value greater that the max accepted by SQL(2147483647)', function() {
				// arrange
				var iTop = 214748364899;
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				},{
					name : "top",
					value : iTop
				}];
	
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.GET, {}, aParams), oDefaultResponseMock).dispatch();
				var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
	
				// assert
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
			});
		});
		
		describe ("remove", function (){
			var aParams = [ {
				name : "business_object",
				value : "Plant"
			}];
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate plants and texts', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "PL3",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			    
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
                expect(oResponseBody.body.masterdata.DELETE.PLANT_ENTITIES[0]._VALID_TO).not.toBe(null);
			});

			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a plant for which mandatory fields are missing', function() {
				// arrange			
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES" : [{
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to delete a plant that does not exist', function() {
				// arrange			
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES": [{
													"PLANT_ID":"PLC",
													"_VALID_FROM" : "2015-02-01T15:39:09.691Z"
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a plant used in other business objects', function() {
				// arrange
				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES": [{
													"PLANT_ID": "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};

				var oOverheadGroup = {
						"OVERHEAD_GROUP_ID" : ['O4'],
						"PLANT_ID" : ['PL1'],
						"_VALID_FROM": ["2015-01-01T00:00:00.000Z"],
						"_VALID_TO": [null],
						"_SOURCE": [1],
						"_CREATED_BY": ['U000001']
				};
				mockstar.insertTableData("overhead_group", oOverheadGroup);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.OverheadGroup);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a plant used in project activity price surcharges', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES": [{
													"PLANT_ID": testData.oProjectActivityPriceSurcharges.PLANT_ID[0],
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				mockstar.insertTableData("project_activity_price_surcharges",  testData.oProjectActivityPriceSurcharges);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectActivityPriceSurcharges);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to delete a plant used in project material price surcharges', function() {
				// arrange				
				var oItemsPayload = {"DELETE":
                    				       { 
												"PLANT_ENTITIES": [{
													"PLANT_ID": testData.oProjectMaterialPriceSurcharges.PLANT_ID[0],
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z"
												}]
                    				        }
                    				};
				
				mockstar.insertTableData("project_material_price_surcharges",  testData.oProjectMaterialPriceSurcharges);
				
			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.BAD_REQUEST);
				expect(oResponseBody).toBeDefined();
				expect(oResponseBody.head.messages[0].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);
				expect(oResponseBody.head.messages[0].details.validationObj.dependencyObjects[0].businessObj).toBe(BusinessObjectTypes.ProjectMaterialPriceSurcharges);		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.DEPENDENCY_ERROR);
			});
		});
	
		describe ("insert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert plant and plant texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{plant}}");
				var oTestTexta = mockstar.execQuery("select * from {{plant_text}}");
				
				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"COMPANY_CODE_ID" : "CC1"
												},{
													"PLANT_ID" : "INS2",
													"COMPANY_CODE_ID" : "CC2"
												}],
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"PLANT_ID" : "INS2",
													"PLANT_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{plant}}");
				var oTestText = mockstar.execQuery("select * from {{plant_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTestText.columns.PLANT_ID.rows.length).toBe(oTestTexta.columns.PLANT_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.CREATE.PLANT_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.CREATE.PLANT_TEXT_ENTITIES[0]._VALID_FROM);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to insert texts for a plant that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 DE",
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
			
			it('should throw exception (GENERAL_ENTITY_DUPLICATE_ERROR) when try to insert a plant that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"COMPANY_CODE_ID" : "CC1"
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
			
			it('should throw exception (GENERAL_ENTITY_NOT_CURRENT_ERROR) when try to insert a plant text that already exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"PLANT_DESCRIPTION" : "Updated plant description",
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
	
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to insert a plant for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"COMPANY_CODE_ID" : "CC1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT" : "INS3",
													"COMPANY_CODE_ID" : "CC1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("PLANT");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (company code) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"CREATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "INS3",
													"COMPANY_CODE_ID" : "###"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.CompanyCode);
			});
		});
		
		describe ("upsert", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should insert plant and plant texts', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{plant}}");
				var oTestTexta = mockstar.execQuery("select * from {{plant_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"COMPANY_CODE_ID" : "CC1"
												},{
													"PLANT_ID" : "INS2",
													"COMPANY_CODE_ID" : "CC2"
												}],
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"PLANT_ID" : "INS2",
													"PLANT_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{plant}}");
				var oTestText = mockstar.execQuery("select * from {{plant_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTestText.columns.PLANT_ID.rows.length).toBe(oTestTexta.columns.PLANT_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.PLANT_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.PLANT_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should insert plant and plant texts with PLANT_ID length set to 8 charachters', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oTesta = mockstar.execQuery("select * from {{plant}}");
				var oTestTexta = mockstar.execQuery("select * from {{plant_text}}");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "LONGPL01",
													"COMPANY_CODE_ID" : "CC1"
												},{
													"PLANT_ID" : "LONGPL02",
													"COMPANY_CODE_ID" : "CC2"
												}],
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "LONGPL01",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "LONGPL01",
													"PLANT_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"PLANT_ID" : "LONGPL02",
													"PLANT_DESCRIPTION" : "Test2 EN",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

			    // act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oTest = mockstar.execQuery("select * from {{plant}}");
				var oTestText = mockstar.execQuery("select * from {{plant_text}}");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTest.columns.PLANT_ID.rows.length).toBe(oTesta.columns.PLANT_ID.rows.length + 2);
				expect(oTestText.columns.PLANT_ID.rows.length).toBe(oTestTexta.columns.PLANT_ID.rows.length + 3);
				expect(oResponseBody.body.masterdata.UPSERT.PLANT_ENTITIES[0]._VALID_FROM).toBe(oResponseBody.body.masterdata.UPSERT.PLANT_TEXT_ENTITIES[0]._VALID_FROM);
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when plant with PLANT_ID length set to more than 8 charachters', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "LONGPL01F",
													"COMPANY_CODE_ID" : "CC1"
												},{
													"PLANT_ID" : "LONGPL02F",
													"COMPANY_CODE_ID" : "CC2"
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
				expect(oResponseBody.head.messages[0].details.administrationObj.PLANT_ENTITIES[0].PLANT_ID).toBe("LONGPL01F");		
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObj.PLANT_ENTITIES[0].PLANT_ID).toBe("LONGPL02F");
			});
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when plant text with PLANT_ID length set to more than 8 charachters', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "LONGPL01F",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "LONGPL01F",
													"PLANT_DESCRIPTION" : "Test1 DE",
													"LANGUAGE" : "DE"
												},{
													"PLANT_ID" : "LONGPL02F",
													"PLANT_DESCRIPTION" : "Test2 EN",
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
				expect(oResponseBody.head.messages[0].details.administrationObj.PLANT_TEXT_ENTITIES[0].PLANT_ID).toBe("LONGPL01F");		
				expect(oResponseBody.head.messages[1].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);		
				expect(oResponseBody.head.messages[1].details.administrationObj.PLANT_TEXT_ENTITIES[0].PLANT_ID).toBe("LONGPL01F");
				expect(oResponseBody.head.messages[2].code).toBe(MessageCode.GENERAL_VALIDATION_ERROR.code);		
				expect(oResponseBody.head.messages[2].details.administrationObj.PLANT_TEXT_ENTITIES[0].PLANT_ID).toBe("LONGPL02F");
			});
			
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to upsert texts for a plant that does not exists', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 EN",
													"LANGUAGE" : "EN"
												},{
													"PLANT_ID" : "INS1",
													"PLANT_DESCRIPTION" : "Test1 DE",
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
				
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to upsert a plant for which mandatory fields are missing', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"COMPANY_CODE_ID" : "CC1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("PLANT_ID");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});
	
			it('should throw exception in case of invalid request (Inconsistent Metadata - wrong field name)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT" : "INS3",
													"COMPANY_CODE_ID" : "CC1"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnId).toBe("PLANT");			
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.METADATA_ERROR);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when referenced object (company code) does not exist', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "INS3",
													"COMPANY_CODE_ID" : "###"
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
				expect(oResponseBody.head.messages[0].details.businessObj).toBe(BusinessObjectTypes.CompanyCode);
			});
			
			it('should deactivate the current version of the upserted plant text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{plant}} WHERE PLANT_ID = 'PL1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{plant_text}} WHERE PLANT_ID = 'PL1'");
				
				var oItemsPayload = {"UPSERT":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"PLANT_DESCRIPTION" : "Updated plant description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{plant}} WHERE PLANT_ID = 'PL1'");
				var oTestText = mockstar.execQuery("select * from {{plant_text}} WHERE PLANT_ID = 'PL1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				expect(oTestMain.columns.PLANT_ID.rows.length).toBe(oTestMainBefore.columns.PLANT_ID.rows.length);
				expect(oTestText.columns.PLANT_ID.rows.length).toBe(oTestTextBefore.columns.PLANT_ID.rows.length + 1);
			});		
		});
	
		describe ("update", function (){
			
			beforeEach(function() {
				mockstar.clearAllTables(); // clear all specified substitute tables and views
				mockstar.insertTableData("plant", testData.oPlantTestDataPlc);
				mockstar.insertTableData("plant_text", testData.oPlantTextTestDataPlc);
				mockstar.insertTableData("company_code", testData.oCompanyCodeTestDataPlc);
				mockstar.initializeData();
			});
	
			it('should deactivate the current version of the updated plant text and create a new version', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oTestMainBefore = mockstar.execQuery("select * from {{plant}} WHERE PLANT_ID = 'PL1'");
				var oTestTextBefore = mockstar.execQuery("select * from {{plant_text}} WHERE PLANT_ID = 'PL1'");
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"PLANT_DESCRIPTION" : "Updated plant description",
													"LANGUAGE" : "EN"
												}]
                    				        }
                    				};

				// act
				new Dispatcher(oCtx, Administration.prepareAdministrationRequest($.net.http.POST, oItemsPayload, aParams), oDefaultResponseMock).dispatch();
                var oResponseBody = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				//when the entity is updated, the main entry and all the texts are copied
				var oTestMain = mockstar.execQuery("select * from {{plant}} WHERE PLANT_ID = 'PL1'");
				var oTestText = mockstar.execQuery("select * from {{plant_text}} WHERE PLANT_ID = 'PL1'");
				
				//assert
				expect(oDefaultResponseMock.status).toBe($.net.http.CREATED);
				expect(oResponseBody).toBeDefined();
				//expect(oTestMain.columns.PLANT_ID.rows.length).toBe(oTestMainBefore.columns.PLANT_ID.rows.length + 1);
				expect(oTestText.columns.PLANT_ID.rows.length).toBe(oTestTextBefore.columns.PLANT_ID.rows.length + 1);
			});
	
			it('should throw error (GENERAL_VALIDATION_ERROR) when plant is updated (company code is changed)', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];

				var oItemsPayload = {"UPDATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-01-01T15:39:09.691Z",
													"COMPANY_CODE_ID" : "CC2"
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
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.READONLY_FIELD_ERROR);
			});
	
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a plant that does not exists', function() {
				 // arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PLANT_ENTITIES" : [{
													"PLANT_ID" : "PLC",
													"_VALID_FROM" : "2015-07-01T15:39:09.691Z",
													"COMPANY_CODE_ID" : "CC1"
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
						
			it('should throw exception (GENERAL_ENTITY_NOT_FOUND_ERROR) when try to update a plant text and the plant text is not available in system', function() {
				// arrange
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"_VALID_FROM" : "2015-05-01T15:39:09.691Z",
													"PLANT_DESCRIPTION" : "Updated plant description",
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
			
			it('should throw exception (GENERAL_VALIDATION_ERROR) when try to update a plant text for which mandatory fields are missing', function() {
				var aParams = [ {
					name : "business_object",
					value : "Plant"
				}];
				
				var oItemsPayload = {"UPDATE":
                    				       { 
												"PLANT_TEXT_ENTITIES" : [{
													"PLANT_ID" : "PL1",
													"PLANT_DESCRIPTION" : "Updated plant description"
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
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[0].columnId).toBe("_VALID_FROM");		
				expect(oResponseBody.head.messages[0].details.validationObj.columnIds[1].columnId).toBe("LANGUAGE");		
				expect(oResponseBody.head.messages[0].details.validationObj.validationInfoCode).toBe(ValidationInfoCode.MISSING_MANDATORY_ENTRY);
			});			
		});
	}).addTags(["Administration_NoCF_Integration"]);
}