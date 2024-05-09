const _ = require("lodash");
const testdata = require("../../testdata/testdata").data;

const Persistency = $.import("xs.db", "persistency").Persistency;
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;

const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);

const Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;
var MasterdataReadProcedures = require("../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
var oDefaultResponseMock = null;
var oPersistency = null;

describe('xsjs.impl.applicationdata-integrationtests', function() {

        describe("currentuser", function() {
            beforeEach(function() {
                oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
                var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
                oDefaultResponseMock.headers = oResponseHeaderMock;
            });

            function prepareRequest() {
                var oRequest = {
                    queryPath: "applicationdata/currentuser",
                    method: $.net.http.GET,
                    parameters: []
                };
                return oRequest;
            }

            it("should return current user", function() {
                //arrange
                var oRequest = prepareRequest();
                
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                var oResponseBasicData = oResponseObject.body;

                const expectedCurrentUser = 
                    [
                        {USER_ID: $.session.getUsername()}
                    ];
                expect(oResponseBasicData).toEqualObject(expectedCurrentUser);
            });     
        });

        describe("languages", function() {
            var oMockstar = null;
            var oYesterday = new Date();
            var sValidFromDate = oYesterday.toJSON();
            var originalProcedures = null;
             
            beforeOnce(function() {
                oMockstar = new MockstarFacade( // Initialize Mockstar
                    {
                        testmodel: {
                           "procLanguage" : "sap.plc.db.administration.procedures/p_language_read",
                        },
                        substituteTables: // substitute all used tables in the procedure or view
                        {
                            languageTable: {
                            	name: Resources["Language"].dbobjects.plcTable,
                                data: {
                                	LANGUAGE: ["DE", "EN", "IT", "FR"],
                                    TEXTS_MAINTAINABLE: [1, 1, 0, 0],
                            		_VALID_FROM: [sValidFromDate, sValidFromDate, sValidFromDate, sValidFromDate],
                            		_VALID_TO: [null,null, null, null],
                            		_SOURCE: [1, 1, 1, 1]
                                }
                            },
            				metadata : {
            					name : "sap.plc.db::basis.t_metadata",
                                data : testdata.mCsvFiles.metadata
            				},
            				initialization_state: {
            					name : "sap.plc.db::basis.t_initialization_state",
            					data : {
            						"PLC_VERSION": MTA_METADATA.version,
            						"GENERATION_TIME": '2016-02-04 00:00:00'
                                    }
                                }
                        } 
                    });
                
            	if (!oMockstar.disableMockstar) {
            		 var procedureLanguage = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures.Language;
                     originalProcedures = MasterdataReadProcedures;
                     MasterdataReadProcedures = Object.freeze({
                     	"Language": procedureLanguage 	
                     }); 
            	}
            });

            beforeEach(function() {
                oMockstar.clearAllTables();
                oMockstar.initializeData();

                oTraceHelperMock = jasmine.createSpyObj("oTraceHelperMock", ["buildRequestMessage", "buildResponseMessage",
                    "buildExceptionMessage"
                ]);
                oPersistency = new Persistency(jasmine.dbConnection, oMockstar.userSchema, oMockstar.userSchema);
                oCtx.persistency = oPersistency;

                oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
                var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
                oDefaultResponseMock.headers = oResponseHeaderMock;
            });

            afterOnce(function() {
            	if (!oMockstar.disableMockstar) {
            		MasterdataReadProcedures = originalProcedures;
	                oMockstar.cleanup();
            	}
            });

            function prepareRequest() {
                var oRequest = {
                    queryPath: "applicationdata/languages",
                    method: $.net.http.GET,
                    parameters: []
                };
                return oRequest;
            }

            it("should return maintainable languages", function() {
                //arrange
                var oRequest = prepareRequest();
                
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                var oResponseBasicData = oResponseObject.body;

                const expectedLanguages = [
                    {LANGUAGE: "DE"},
                    {LANGUAGE: "EN"}
                ];
                expect(oResponseBasicData).toEqualObject(expectedLanguages);
            });     
            
            it("should return empty when language table is empty", function() {
                //arrange
                var oRequest = prepareRequest();
                oMockstar.clearTable("languageTable"); 

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);

                var oResponseBasicData = oResponseObject.body;
                expect(_.isArray(oResponseBasicData)).toBe(true);

                const expectedLanguages = [ ];
                expect(oResponseBasicData).toEqualObject(expectedLanguages);
            });  

        });
    }).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);