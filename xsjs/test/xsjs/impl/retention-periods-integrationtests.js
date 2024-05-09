var _ = require("lodash");
var helpers = require("../../../lib/xs/util/helpers");
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

var MessageLibrary           = require("../../../lib/xs/util/message");
var messageCode              = MessageLibrary.Code;

describe('xsjs.impl.retention-periods-integrationtests', function() {

	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;
    const oPersonalDataValidity ={
		ENTITY:    ["CUSTOMER","VENDOR","CUSTOMER","CUSTOMER","PROJECT","PROJECT","VENDOR","PROJECT","VENDOR"],
		SUBJECT:   ["CU1"     ,"VD1"   ,"*"       ,"CU3"     , "*"     ,"PR1"    ,"*"     ,"PR3"    ,"VD4"   ],
		VALID_TO:  ["2029-01-14 08:00:00.0000000", "2029-05-14 08:00:00.0000000", null, "2020-01-14 08:00:00.0000000",null, "2019-05-14 08:00:00.0000000", null, "2029-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000"],
		VALID_FOR: [null, null, 60, null, 48, null, 24, null, null]
	};

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					substituteTables : {
						retention_periods: 'sap.plc.db::basis.t_personal_data_validity'
					}
				});
	});

	beforeEach(function() {
		oPersistency = new Persistency(jasmine.dbConnection);
		oCtx.persistency = oPersistency;

		oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", [ "setBody", "status" ]);
		var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
		oDefaultResponseMock.headers = oResponseHeaderMock;

		oMockstar.clearAllTables(); // clear all specified substitute tables
		oMockstar.insertTableData("retention_periods", oPersonalDataValidity);
	});

    var params = [];
    params.get = function() {
        return undefined;
    };
    
    function buildRequest(iHttpMethod, aRetentionPeriods) {
        // parameter object to simulate the list of parameters from request

        var oRequest = {
            queryPath : "retention-periods",
            method : iHttpMethod,
            parameters : params,
            body : {
                asString : function() {
                    return JSON.stringify(aRetentionPeriods);
                }
            }
        };
        return oRequest;
    } 

	if(jasmine.plcTestRunParameters.mode === 'all') {
    
        describe('create retention periods for personal data', function() {
    
            it('should create retention periods for customer, vendor, project and user', function () {
                //arrange
                oMockstar.clearAllTables();
                let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                }, {
                    "ENTITY": "PROJECT",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                },{
                    "ENTITY": "USER",
                    "SUBJECT": "USRN",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                },
                {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CUSTN",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                }];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.body[0]).toEqualObject({
                    "ENTITY": "VENDOR",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                });
                expect(oResponseObject.body[1]).toEqualObject({
                    "ENTITY": "PROJECT",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                });
                expect(oResponseObject.body[2]).toEqualObject({
                    "ENTITY": "USER",
                    "SUBJECT": "USRN",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                });
                expect(oResponseObject.body[3]).toEqualObject({
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CUSTN",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                });
                expect(oResponseObject.body.length).toBe(4);
            });

            
            it('should create 1 retention period for personal data', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "VVV",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                }];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.CREATED);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.body[0]).toEqualObject({
                    "ENTITY": "VENDOR",
                    "SUBJECT": "VVV",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                        });
                expect(oResponseObject.body.length).toBe(1);
            });

            it('should throw exception if there is already a record with the same key', function () {
                //arrange
                let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                }];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
                //returns empty body
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
            });

            it('should throw exception if there are already more records with the same key', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "*",
                    "VALID_FOR": 20
                }, {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CC12",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                }, {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*",
                    "VALID_FOR": 40
                }
            ];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
                //returns empty body
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code);
            });    
            
            it('should throw exception if there are mandatory properties missing', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "VALID_FOR": 20
                }, {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CC12",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                }, {
                    "SUBJECT": "*",
                    "VALID_FOR": 40
                }
            ];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                //returns empty body
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
            });  
            
            it('should throw exception if valid to or valid for is not defined for customer', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CC12",
                    "VALID_FOR": null
                }
            ];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                //returns empty body
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
            }); 

            it('should throw exception if valid for is defined for user', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "USER",
                    "SUBJECT": "CC12",
                    "VALID_FOR": 12
                }
            ];

                var oRequest = buildRequest($.net.http.POST, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                //returns empty body
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(1);
				expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
            }); 
        });

        describe('get retention periods for personal data', function() {

           var oRequest = {
					queryPath : "retention-periods",
					method : $.net.http.GET,
					parameters : params
			};

            it('should get 0 retention period for personal data', function () {
                //arrange
                oMockstar.clearAllTables();

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.body.length).toBe(0);
            });

            it('should get 1 retention period for personal data', function () {
                //arrange
                oMockstar.clearAllTables();
                let oPersonalDataValidityOne = {
                    ENTITY:    [ "CUSTOMER"],
                    SUBJECT:   [ "CU3"],
                    VALID_FOR: [ 20 ]
                };
                oMockstar.insertTableData("retention_periods", oPersonalDataValidityOne);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.body[0]).toEqualObject({
                    ENTITY:  "CUSTOMER",
                    SUBJECT:   "CU3",
                    VALID_TO: null,
                    VALID_FOR: 20 
                });
                expect(oResponseObject.body.length).toBe(1);
            });


            it('should get multiple retention period for personal data', function () {
                
                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
                var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.body.length).toBe(9);
            });
        });

        describe('delete retention periods for personal data', function() {

            it('should delete 1 retention period from personal data validity', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "VD1"
                }];

                var oRequest = buildRequest($.net.http.DEL, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
            });

            it('should delete multiple retention periods from personal data validity', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "VD1"
                }, {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*"
                }, {
                    "ENTITY": "PROJECT",
                    "SUBJECT": "*"
                }];

                var oRequest = buildRequest($.net.http.DEL, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
            });

            it('should throw exception if multiple retention periods are not found from personal data validity', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "VENDOR",
                    "SUBJECT": "VD1"
                }, {
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "CCC"
                }, {
                    "ENTITY": "PROJECT",
                    "SUBJECT": "TT"
                }];

                var oRequest = buildRequest($.net.http.DEL, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.NOT_FOUND);
                //returns empty body
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            });

            it('should throw exception if 1 retention period is not found from personal data validity', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "TT"
                }];

                var oRequest = buildRequest($.net.http.DEL, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.NOT_FOUND);
                //returns empty body
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            });

            it('should throw exception if other properties than the key are on the request body', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*",
                    "VALID_FOR": 10
                }];

                var oRequest = buildRequest($.net.http.DEL, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
            });
        });

        describe('update retention periods for personal data', function() {

            it('should throw exception if other properties than the key are on the request body', function () {
                //arrange
            let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*",
                    "VALID_FOR": 10,
                    "TESTT": 10
                }];

                var oRequest = buildRequest($.net.http.PUT, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.INTERNAL_SERVER_ERROR);
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_VALIDATION_ERROR.code);
            });

            it('should throw exception if multiple retention periods are not found in personal data validity', function () {
                //arrange
                oMockstar.clearAllTables();
                let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*",
                    "VALID_FOR": 22
                }, {
                    "ENTITY": "PROJECT",
                    "SUBJECT": "*",
                    "VALID_TO": "2021-01-24T16:24:32.057Z"
                }];

                var oRequest = buildRequest($.net.http.PUT, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.NOT_FOUND);
                //returns empty body
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            });

            it('should throw exception if 1 retention period is not found in personal data validity', function () {
                //arrange
                oMockstar.clearAllTables();
                let aBody = [{
                    "ENTITY": "CUSTOMER",
                    "SUBJECT": "*",
                    "VALID_FOR": 22
                }];

                var oRequest = buildRequest($.net.http.PUT, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.NOT_FOUND);
                //returns empty body
                let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toBe(1);
                expect(oResponseObject.head.messages[0].code).toEqual(messageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            });

            it('should update multiple retention periods ', function () {
                //arrange
                let aBody = [{  "ENTITY": "VENDOR",
                            "SUBJECT": "*",
                            "VALID_FOR": 22
                        }, {
                            "ENTITY": "PROJECT",
                            "SUBJECT": "*",
                            "VALID_TO": "2021-01-24T16:24:32.057Z"
                        },{
                            "ENTITY": "VENDOR",
                            "SUBJECT": "VD4",
                            "VALID_TO": "2021-01-24T16:24:32.057Z"
                        },
                        {
                            "ENTITY": "CUSTOMER",
                            "SUBJECT": "CU1",
                            "VALID_TO": "2021-01-24T16:24:32.057Z"
                        }];

                var oRequest = buildRequest($.net.http.PUT, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
            });

            it('should update 1 retention period', function () {
                //arrange
                let aBody = [{  "ENTITY": "VENDOR",
                            "SUBJECT": "*",
                            "VALID_FOR": 22
                        }];

                var oRequest = buildRequest($.net.http.PUT, aBody);

                // act
                new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

                // assert
                expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
            });
        });
    }
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);