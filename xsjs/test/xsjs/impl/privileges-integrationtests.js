var _ = require("lodash");
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var Persistency = PersistencyImport.Persistency;
var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
var Dispatcher = DispatcherLibrary.Dispatcher;
var oCtx = DispatcherLibrary.prepareDispatch($);

describe('xsjs.impl.privilege-integrationtests', function() {

	var oMockstar = null;

	var oDefaultResponseMock = null;
	var oPersistency = null;

	beforeOnce(function() {

		oMockstar = new MockstarFacade(
				{
					substituteTables : {
						user_privileges: 'sap.plc.db::auth.t_auth_user',
						project: 'sap.plc.db::basis.t_project',
						open_projects : 'sap.plc.db::basis.t_open_projects',
						group_privileges: 'sap.plc.db::auth.t_auth_usergroup',
						usergroup: "sap.plc.db::auth.t_usergroup",
						session : {
							name : "sap.plc.db::basis.t_session",
							data : testData.oSessionTestData
						},
						authorization: {
							name: 'sap.plc.db::auth.t_auth_project',
							data: {
								"PROJECT_ID": ['PR1', 'PR3'],
								"USER_ID": [testData.sSessionId, testData.sSessionId],
								"PRIVILEGE": ['ADMINISTRATE', 'ADMINISTRATE']
							}
						}
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

	function buildRequest(params, iHttpMethod, oPrivilege) {
		// parameter object to simulate the list of parameters from request
					
		var oRequest = {
				queryPath : "privileges",
				method : iHttpMethod				
		};
		if(!_.isNull(params)){
			params.get = function(sArgument) {
				var oParam = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});

				return oParam !== undefined ? oParam.value : undefined;
			};
			oRequest.parameters = params;
		}
		if(!_.isNull(oPrivilege)){
			var oBody = {
					asString : function() {
						return JSON.stringify(oPrivilege);
					}
			};
			oRequest.body = oBody;
		}
		return oRequest;
	}

	if(jasmine.plcTestRunParameters.mode === 'all'){

		describe('get', function() {

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.initializeData();
				oMockstar.insertTableData("user_privileges", testData.oPrivilege);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
			});

			it('should read all privileges for the project with the id from the parameters', function() {
				//arrange
				var params = [ {
											name : "entity_type",
											value : "Project"
										},{
											name : "entity_id",
											value : "PR1"
										}];
				var oRequest = buildRequest(params, $.net.http.GET, null);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				var oReturnedObject = oResponseObject.body;
				//check data from the response
				expect(oReturnedObject.ENTITY_TYPE).toBe("Project");
				expect(oReturnedObject.ENTITY_ID).toBe("PR1");
				expect(oReturnedObject.USER_PRIVILEGES.length).toBe(4);
				expect(oReturnedObject.GROUP_PRIVILEGES.length).toBe(3);
			});
			
			it('should throw exception if the entity type is not one of the defined ones', function() {
				//arrange
				var params = [ {
											name : "entity_type",
											value : "Testing"
										},{
											name : "entity_id",
											value : "PR1"
										}];
				var oRequest = buildRequest(params, $.net.http.GET, null);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_VALIDATION_ERROR');
			});
			
			it('should throw exception when instance based privileges are not defined', function() {
				//arrange
				//clear user user_privileges table
				oMockstar.clearTable("authorization");
				var params = [ {
											name : "entity_type",
											value : "Project"
										},{
											name : "entity_id",
											value : "PR1"
										}];
				var oRequest = buildRequest(params, $.net.http.GET, null);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ACCESS_DENIED');
			});
		});
		
		describe('edit (batch operation)', function() {

			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables
				oMockstar.initializeData();
				oMockstar.insertTableData("user_privileges", testData.oPrivilege);
				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("group_privileges", testData.oGroupPrivilege);
				oMockstar.insertTableData("usergroup", testData.oUserGroups);
				oMockstar.insertTableData("open_projects", {
												"PROJECT_ID" : ["PR1", "PR3"],
												"SESSION_ID" : [testData.sSessionId,testData.sSessionId],
												"IS_WRITEABLE" : [1, 1]
										});
			});

			it('should throw error when the project id does not exist', function() {
				//arrange
				var oBody =  { 
						"ENTITY_TYPE": "Project",
						"ENTITY_ID": "ProjK",
						"CREATE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID": "Tester1",
						            "PRIVILEGE": "Administrate"
							      }
						]}};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			});
			
			it('should throw error when the project is not opened in edit mode', function() {
				//arrange
				oMockstar.clearTable("open_projects"); //clear open projects table
				var oBody =  { 
						"ENTITY_TYPE": "Project",
						"ENTITY_ID": "PR1",
						"CREATE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID": "Tester1",
						            "PRIVILEGE": "Administrate"
							      }
						]}};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages[0].code).toBe('PROJECT_NOT_WRITABLE_ERROR');
			});
			
			it('should throw batch validation error, on the response an array containing the problematic privileges with the issue is returned', function() {
				const sLongUserId = `
					SAP HANA functions as a comprehensive platform for the development and execution of native data-intensive 
					applications that run efficiently in SAP HANA, taking advantage of its in-memory architecture and parallel execution 
					capabilities. Structured accordingly, applications can profit from the increased performance provided by SAP HANA due 
					to the integration with the data source.
				`;
				const sSqlInjection = 'drop table t_auth_project';
				var oBody =  { 
						"ENTITY_TYPE": "Project",
						"ENTITY_ID": "PR1",
						"UPDATE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID": "Tester1"
							      },
							      { "USER_ID": "Tester2",
							     	"PRIVILEGE": "Administrate",
									"TEST": "Admin",
								  },
								  { "USER_ID": sSqlInjection,
							     	"PRIVILEGE": "Administrate",
								  },
								  { "USER_ID": sLongUserId,
							     	"PRIVILEGE": "Administrate",
								  },
						],
						"GROUP_PRIVILEGES": [
										      { "PRIVILEGE": "Usr"
										      },
										      { "GROUP_ID": "Usr",
										     	"PRIVILEGE": "Administrate",
												"TEST": "Admin",
										      }
						]},
						"DELETE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID1": "Tester3"
							      },
								  { "USER_ID": sSqlInjection },
								  { "USER_ID": sLongUserId },
								  { "USER_ID": "Tester4",
							    	"TEST": "Tst"
								  }],
							"GROUP_PRIVILEGES": [
							      { "GROUP_ID1": "GR Tester3"
							      },
							      { "GROUP_ID": "GR Tester4",
									"TEST": "Tst"
								  }]},
					    "CREATE":  {
								"USER_PRIVILEGES": [
							      { "USER_ID1": "I305774",
									"PRIVILEGE": "CREATE_EDIT"
								   },
								   { "USER_ID": "Usr11",
									 "PRIVILEGE": "CREATE_EDIT",
									 "TEST": "Tst"
								   },
								   { "USER_ID": sSqlInjection,
									 "PRIVILEGE": "CREATE_EDIT",
								   },
								   { "USER_ID": sLongUserId,
									 "PRIVILEGE": "CREATE_EDIT",
								   },
								   ]}};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST); //validation errors
				//check that for each object that has an error an error object exists
				//for update and delete the enitities were not found in table
				//for create the entities already exist in table
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(19);
				expect(oResponseObject.head.messages[0].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[1].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[2].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[3].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[4].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[5].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[6].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[7].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[8].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[9].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[10].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[11].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[12].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[13].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[14].validationInfoCode).toBe("VALUE_ERROR");
				expect(oResponseObject.head.messages[15].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[16].validationInfoCode).toBe("MISSING_MANDATORY_PROPERTY");
				expect(oResponseObject.head.messages[17].validationInfoCode).toBe("INVALID_PROPERTY");
				expect(oResponseObject.head.messages[18].validationInfoCode).toBe("INVALID_PROPERTY");
			});
			
			it('should have an error for each object from the batch for which the check failed on the response', function() {
				//arrange
				var oBody =  { 
						"ENTITY_TYPE": "Project",
						"ENTITY_ID": "PR1",
						"UPDATE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID": "Tester1",
						            "PRIVILEGE": "Administrate"
							      },
							      { "USER_ID": "Tester2",
							       "PRIVILEGE": "Administrate"
							      }
						]},
						"DELETE":  {
							"USER_PRIVILEGES": [
							      { "USER_ID": "Tester3"
							      },
							      { "USER_ID": "Tester4"
							      }]},
					    "CREATE":  {
								"USER_PRIVILEGES": [
							      { "USER_ID": "SYSTEM",
									"PRIVILEGE": "CREATE_EDIT"
								   },
								   { "USER_ID": "Usr11",
									"PRIVILEGE": "CREATE_EDIT"
								   }
								   ]}};
				var oRequest = buildRequest(null, $.net.http.POST, oBody);
				
				// act
				new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

				// assert
				expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
				//check that for each object that has an error an error object exists
				//for update and delete the enitities were not found in table
				//for create the entities already exist in table
				var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.head.messages.length).toBe(5);
				expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_ALREADY_EXISTS_ERROR');
				expect(oResponseObject.head.messages[0].operation).toBe('Create');
				expect(oResponseObject.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[1].operation).toBe('Delete');
				expect(oResponseObject.head.messages[2].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[2].operation).toBe('Delete');
				expect(oResponseObject.head.messages[3].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[3].operation).toBe('Update');
				expect(oResponseObject.head.messages[4].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
				expect(oResponseObject.head.messages[4].operation).toBe('Update');
			});
		
		it('should have an error only for objects which have failed check on the response', function() {
			//arrange
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR3",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "USR5",
					            "PRIVILEGE": "Read"
						      }
					]},
					"DELETE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Tester4"
						      }]},
				    "CREATE":  {
							"USER_PRIVILEGES": [
							  { "USER_ID": "SYSTEM",
								"PRIVILEGE": "Administrate"
							  },
							  { "USER_ID": "Usrr",
									"PRIVILEGE": "Administrate"
								  }]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			var resultBefore = oMockstar.execQuery("select * from {{user_privileges}}");
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
			//check that only for the 1 object with the failed check an error is returned
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(1);
		});
		
		it('should create, delete and update the objects from the request', function() {
			//arrange
			oMockstar.insertTableData("usergroup", testData.oUserGroups);
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR3",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr5",
					            "PRIVILEGE": "Read"
						      }
						 ],
						 "GROUP_PRIVILEGES": [
					          { "GROUP_ID": "UsrGr1",
								"PRIVILEGE": "CREATE_EDIT"
					          }
					     ]
					 },
					"DELETE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr3",
						      }],
						"GROUP_PRIVILEGES": [
						      { "GROUP_ID": "UGr6",
						      }],    
					 
					},
				    "CREATE":  {
							"USER_PRIVILEGES": [
							  { "USER_ID": "SYSTEM",
								"PRIVILEGE": "Administrate"
							  }],
							 "GROUP_PRIVILEGES": [
							  { "GROUP_ID": "UsrGr5",
								"PRIVILEGE": "Administrate"
							}]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		});
		
		it('should throw error when updating to another privilege the last user with administrate privilege for project', function() {
			//arrange
			oMockstar.insertTableData("authorization", {"PROJECT_ID" : 'PR2',
														"USER_ID" : testData.sSessionId,
														"PRIVILEGE" : 'ADMINISTRATE'
				
			});
			oMockstar.insertTableData("open_projects", {"PROJECT_ID" : 'PR2',
														"SESSION_ID" : testData.sSessionId,
														"IS_WRITEABLE" : 1
			});
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR2",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr1",
					            "PRIVILEGE": "Read"
						      }
						 ],
						 "GROUP_PRIVILEGES": [
					          { "GROUP_ID": "UsrGr1",
								"PRIVILEGE": "CREATE_EDIT"
					          }
					     ]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('PROJECT_WITH_NO_ADMINISTRATOR_ERROR');
		});
		
		it('should throw error when deleting the last user with administrate privilege for project', function() {
			//arrange
			oMockstar.insertTableData("authorization", {"PROJECT_ID" : 'PR2',
														"USER_ID" : testData.sSessionId,
														"PRIVILEGE" : 'ADMINISTRATE'
				
			});
			oMockstar.insertTableData("open_projects", {"PROJECT_ID" : 'PR2',
														"SESSION_ID" : testData.sSessionId,
														"IS_WRITEABLE" : 1
			});
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR2",
					"UPDATE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr5",
					            "PRIVILEGE": "Read"
						      }
						 ],
						 "GROUP_PRIVILEGES": [
					          { "GROUP_ID": "UsrGr1",
								"PRIVILEGE": "CREATE_EDIT"
					          }
					     ]
					 },
					"DELETE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr1",
						      }],
						"GROUP_PRIVILEGES": [
						      { "GROUP_ID": "UGr6",
						      }],    
					 
					},
				    "CREATE":  {
							"USER_PRIVILEGES": [
							  { "USER_ID": "SYSTEM",
								"PRIVILEGE": "Read"
							  }],
							 "GROUP_PRIVILEGES": [
							  { "GROUP_ID": "UsrGr5",
								"PRIVILEGE": "Administrate"
							}]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages[0].code).toBe('PROJECT_WITH_NO_ADMINISTRATOR_ERROR');
		});
		
		it('should create a new administrate privilege and not throw an error when deleting the last user with administrate privilege for project', function() {
			//arrange
			oMockstar.insertTableData("authorization", {"PROJECT_ID" : 'PR2',
														"USER_ID" : testData.sSessionId,
														"PRIVILEGE" : 'ADMINISTRATE'
				
			});
			oMockstar.insertTableData("open_projects", {"PROJECT_ID" : 'PR2',
														"SESSION_ID" : testData.sSessionId,
														"IS_WRITEABLE" : 1
			});
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR2",
					"DELETE":  {
						"USER_PRIVILEGES": [
						      { "USER_ID": "Usr1",
						      }]					 
					},
				    "CREATE":  {
							"USER_PRIVILEGES": [
							  { "USER_ID": "SYSTEM",
								"PRIVILEGE": "Administrate"
							  }]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.OK);
		});
		
		it('should have an error for created group privileges which have failed check on the response', function() {
			//arrange
			oMockstar.insertTableData("usergroup", testData.oUserGroups);
			var oBody =  { 
					"ENTITY_TYPE": "Project",
					"ENTITY_ID": "PR1",
				    "CREATE":  {
							"GROUP_PRIVILEGES": [
							  { "GROUP_ID": "UsrGr1",
								"PRIVILEGE": "Administrate"
							  },
							  { "GROUP_ID": "GR1",
									"PRIVILEGE": "Administrate"
								  }]}};
			var oRequest = buildRequest(null, $.net.http.POST, oBody);
			var resultBefore = oMockstar.execQuery("select * from {{user_privileges}}");
			
			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();

			// assert
			expect(oDefaultResponseMock.status).toEqual($.net.http.BAD_REQUEST);
			//check that only for the 2 objects with the failed check an error is returned
			var oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
			expect(oResponseObject.head.messages.length).toBe(2);
			expect(oResponseObject.head.messages[0].code).toBe('GENERAL_ENTITY_ALREADY_EXISTS_ERROR');
			expect(oResponseObject.head.messages[0].operation).toBe('Create');
			expect(oResponseObject.head.messages[1].code).toBe('GENERAL_ENTITY_NOT_FOUND_ERROR');
			expect(oResponseObject.head.messages[1].operation).toBe('Create');
		});
	});

	}
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);