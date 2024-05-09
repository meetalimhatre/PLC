const _ = require("lodash");
const helpers = require("../../../lib/xs/util/helpers");
const testdata = require("../../testdata/testdata").data;
const Constants = require("../../../lib/xs/util/constants");

const PersistencyImport = $.import("xs.db", "persistency");
const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const Persistency = PersistencyImport.Persistency;

const PersistencyMiscImport = require("../../../lib/xs/db/persistency-misc");
const PersistencySessionImport = require("../../../lib/xs/db/persistency-session");
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const mTables = PersistencySessionImport.Tables;
const mTableNames = PersistencyMiscImport.Tables;

const Resources = require("../../../lib/xs/util/masterdataResources").MasterdataResource;

var MasterdataReadProcedures = require("../../../lib/xs/util/masterdataResources").MasterdataReadProcedures;
var oDefaultResponseMock = null;
var oPersistency = null;
var mockstarHelpers  = require("../../testtools/mockstar_helpers");

describe('xsjs.impl.init-session-integrationtests',
    function() {

        describe("init", function() {
            var oMockstar = null;
            var sDUVersion = MTA_METADATA.version;
            var oYesterday = new Date();
            var sValidFromDate = oYesterday.toJSON();
            var originalProcedures = null;
            const iItemCategoryDefaultValue = -1;
             
            beforeOnce(function() {
                oMockstar = new MockstarFacade( // Initialize Mockstar
                    {
                        testmodel: {
                           "procLanguage" : "sap.plc.db.administration.procedures/p_language_read",
                           "procCurrency" : "sap.plc.db.administration.procedures/p_currency_read",
                           "procUOM" : "sap.plc.db.administration.procedures/p_unit_of_measures_read"
                        },
                        substituteTables: // substitute all used tables in the procedure or view
                        {
                            session: mTables.session,
                            formula : {
                                name : "sap.plc.db::basis.t_formula",
                                data : {
                                    "FORMULA_ID": [1, 2, 3, 4],
                                    "PATH": ["Item", "Item", "Item", "Item"],
                                    "BUSINESS_OBJECT": ["Item", "Item", "Item", "Item"],
                                    "COLUMN_ID": ["IS_ACTIVESSS", "QUANTITY", "QUANTITY", "QUANTITY"],
                                    "ITEM_CATEGORY_ID": [-1, iItemCategoryDefaultValue, Constants.ItemCategory.CalculationVersion, Constants.ItemCategory.Process],
                                    "IS_FORMULA_USED": [1, 1, 1, 1],
                                    "FORMULA_STRING" : ["1+1", "1+1", "2+2", "3+3"]
                                }
                            },
                            item_temporary: mTables.item_temporary,
                            calculation_version_temporary: mTables.calculation_version_temporary,
                            open_calculation_versions: mTables.open_calculation_versions,
                            group: {
                            	name: mTableNames.group,
                                data: {
        			            	SIDE_PANEL_GROUP_ID : [101, 201],
        			            	SIDE_PANEL_GROUP_DISPLAY_ORDER : [1, 1]
                                }
                            },
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
                            lock: {
                            	name: mTables.lock,
                                data: {
                                	LOCK_OBJECT: 'metadata',
						            USER_ID: 'I305774',
						            LAST_UPDATED_ON: new Date()
                                }
                            },                             
                            unitOfMeasureCodesTablePlc: {
                                name: Resources["Unit_Of_Measure"].dbobjects.plcTable,
                                data: {
                                	UOM_ID: ["MIN", "H"],
                                    DENOMINATOR: [1, 1],
                                    DIMENSION_ID: ["TIME", "TIME"],
                                    EXPONENT_BASE10: [0, 0],
                                    NUMERATOR: [60, 3600],
                                    SI_CONSTANT: [0, 0],
                            		_VALID_FROM: [sValidFromDate, sValidFromDate],
                            		_VALID_TO: [null,null],
                            		_SOURCE: [1, 1]
                                }
                            },
                            unitOfMeasureTablePlc: {
                                name: Resources["Unit_Of_Measure"].dbobjects.plcTextTable,
                                data: {
                                    LANGUAGE: ["DE", "DE", "IT"],
                                    UOM_ID: ["H", "MIN", "MIN"],
                                    UOM_CODE: ["H", "MIN", "MIN"],
                                    UOM_DESCRIPTION: ["Stunde", "Minute", "Minuto"],
                            		_VALID_FROM: [sValidFromDate, sValidFromDate, sValidFromDate],
                            		_VALID_TO: [null,null, null],
                            		_SOURCE: [1, 1, 1]
                                }
                            },
                            tcurcPlc: {
                                name: Resources["Currency"].dbobjects.plcTable,
                                data: {
                                    CURRENCY_ID: ["EUR", "USD"],
                            		_VALID_FROM: [sValidFromDate, sValidFromDate],
                            		_VALID_TO: [null,null],
                            		_SOURCE: [1, 1]
                                }
                            },
                            tcurtPlc: {
                                name: Resources["Currency"].dbobjects.plcTextTable,
                                data: {
                                	LANGUAGE: ["DE", "EN", "DE"],
                                	CURRENCY_ID: ["EUR", "EUR", "USD"],
                                	CURRENCY_CODE: ["EUR", "EUR", "USD"],
                                	CURRENCY_DESCRIPTION: ["Europäischer Euro", "European Euro", "US Amerikanische Dollar"],
                            		_VALID_FROM: [sValidFromDate, sValidFromDate, sValidFromDate],
                            		_VALID_TO: [null,null, null],
                            		_SOURCE: [1, 1, 1]
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
            		 var procedureCurrency = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures.Currency;
            		 var procedureUom = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures.Unit_Of_Measure;
            		 var procedureLanguage = 'xsunit.' + $.session.getUsername().toLowerCase() + '.' + MasterdataReadProcedures.Language;
                     originalProcedures = MasterdataReadProcedures;
                     MasterdataReadProcedures = Object.freeze({
                     	"Currency": procedureCurrency,
                     	"Unit_Of_Measure": procedureUom,
                     	"Language": procedureLanguage 	
                     }); 
            	}
            });

            beforeEach(function() {
                oMockstar.clearAllTables();
                oMockstar.initializeData();
                oPersistency = new Persistency(jasmine.dbConnection);
                oCtx.persistency = oPersistency;
                
                spyOn(oPersistency.ApplicationManagement, "isPlcInitialized").and.callThrough();

            });
            oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
            var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;

            afterOnce(function() {
            	if (!oMockstar.disableMockstar) {
            		MasterdataReadProcedures = originalProcedures;
	                oMockstar.cleanup();
            	}
            });

            function prepareRequest(sLanguage) {
                // create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
                var params = [{
                    name: "language",
                    value: sLanguage
                }];
                params.get = function(sParameterName) {
                    if (helpers.isNullOrUndefined(sParameterName)) {
                        return null;
                    } else {
                        if (sParameterName === "language") {
                            return sLanguage;
                        }
                    }
                };
                var oRequest = {
                    queryPath: "init-session",
                    method: $.net.http.POST,
                    parameters: params
                };
                return oRequest;
            }

            it("should return basic data when valid parameters in request", function() {
                //arrange
                var oRequest = prepareRequest("EN");
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(mockstarHelpers .getRowCount(oMockstar, "lock")).toBe(0);
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(_.isObject(oResponseObject)).toBe(true);
                expect(_.isObject(oResponseObject.head)).toBe(true);
                expect(oResponseObject.body).toBeDefined();

                var oResponseBasicData = oResponseObject.body;
                expect(_.isArray(oResponseBasicData.CURRENCIES)).toBe(true);
                expect(_.isArray(oResponseBasicData.UNITSOFMEASURE)).toBe(true);
                expect(_.isObject(oResponseBasicData.SYSTEMMESSAGES)).toBe(true);
                expect(_.isObject(oResponseBasicData.METADATA)).toBe(true);
                expect(_.isObject(oResponseBasicData.GROUPS)).toBe(true);
                expect(_.isObject(oResponseBasicData.CURRENTUSER)).toBe(true);
                expect(oResponseBasicData.CURRENTUSER.ID).toBe($.session.getUsername());
                expect(oResponseBasicData.APPLICATION[Constants.ServiceMetaInformation.ServerVersion]).toBe(sDUVersion);           

                expect(oPersistency.ApplicationManagement.isPlcInitialized).toHaveBeenCalled();
            });


            it("should throw Exception when invalid language in request", function() {
                var aInvalidLanguages = [];
                aInvalidLanguages.get = function() {
                    return undefined;
                };

                _.each(aInvalidLanguages, function(sInvalidLanguage) {
                    // arrange
                    var oRequest = {
                        method: $.net.http.POST,
                        // Set an empty language code
                        parameters: sInvalidLanguage
                    };
                    var exception;

                    // act
                    try {
                        new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
                    } catch (e) {
                        exception = e;
                    }

                    // assert
                    expect(exception.code.code).toBe('GENERAL_UNEXPECTED_EXCEPTION');
                });
            });
            
            it("should throw Exception when logon language is not supported", function() {

            	 var oRequest = prepareRequest("FR");

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                
                // assert
                //session should be empty
                var oSession = oMockstar.execQuery("select count(*) as rowcount from {{session}}");
                expect(parseInt(oSession.columns.ROWCOUNT.rows[0],10)).toBe(0);
                expect(oResponseObject.head.messages[0].code).toBe('LOGON_LANGUAGE_NOT_SUPPORTED_ERROR');    

            });
            
            it("should return basic data(with no currency and UoM) if currency and unit of measure table are empty", function() {
            	
            	//arrange
            	oMockstar.clearTable("unitOfMeasureCodesTablePlc");
            	oMockstar.clearTable("unitOfMeasureTablePlc");
            	oMockstar.clearTable("tcurcPlc");
            	oMockstar.clearTable("tcurtPlc"); 

                var oRequest = prepareRequest("EN");
                
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oDefaultResponseMock.setBody).toHaveBeenCalled();

                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(_.isObject(oResponseObject)).toBe(true);
                expect(_.isObject(oResponseObject.head)).toBe(true);
                expect(oResponseObject.body).toBeDefined();
                
                var oResponseBasicData = oResponseObject.body;
                expect(oResponseBasicData.CURRENCIES.length).toBe(0);
                expect(oResponseBasicData.UNITSOFMEASURE.length).toBe(0);
                expect(_.isObject(oResponseBasicData.SYSTEMMESSAGES)).toBe(true);
                expect(_.isObject(oResponseBasicData.METADATA)).toBe(true);
                expect(_.isObject(oResponseBasicData.GROUPS)).toBe(true);
                expect(_.isObject(oResponseBasicData.CURRENTUSER)).toBe(true);
                expect(oResponseBasicData.CURRENTUSER.ID).toBe($.session.getUsername());
                expect(oResponseBasicData.CURRENTUSER.HIDE_ADMIN_VIEW).toBe($.session.hasAppPrivilege("HdAdmV") ? 1 : 0);
                expect(oResponseBasicData.APPLICATION[Constants.ServiceMetaInformation.ServerVersion]).toBe(sDUVersion);  
            });

            it('should assign "PLC_ALL_USERS" to the current user if the group exists', () => {
                //arrange
                const sUserId = $.session.getUsername();
                const sDefaultUserGroup = "PLC_ALL_USERS";
                const aDefaultUserGroup = [sDefaultUserGroup].map(group => `'${group}'`).join(',');
                const aUsergroupsToBeCreated = [{
                    GROUP_ID: sDefaultUserGroup,
                    DESCRIPTION: 'Default usergroup of PLC'
                }];
                oPersistency.Group.insertUsergroups(aUsergroupsToBeCreated);
                var oRequest = prepareRequest("EN");
                
                //act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                //assert
                expect(oDefaultResponseMock.status).toBe($.net.http.OK);
                expect(oDefaultResponseMock.setBody).toHaveBeenCalled();
                expect(oPersistency.Group.getGroups(aDefaultUserGroup).length).toBeGreaterThan(0);
                const aMembersDetails = oPersistency.Group.getGroupMembers(sDefaultUserGroup).USERS;
                const aMemberIds = aMembersDetails.map(oUser => oUser.USER_ID);
                expect(aMemberIds.indexOf(sUserId)).not.toBe(-1);
            });
            
        });
    }).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);