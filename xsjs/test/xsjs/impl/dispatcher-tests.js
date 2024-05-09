if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.impl.dispatcher-tests', function() {
		var _ = require("lodash");
		var DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
		var Privileges = DispatcherLibrary.Privileges;
		var Dispatcher = DispatcherLibrary.Dispatcher;
		var oCtx = DispatcherLibrary.prepareDispatch($);
		var Resources = DispatcherLibrary.Resources;
		var Persistency  = oCtx.persistency; 
		var authorizationManager = require("../../../lib/xs/authorization/authorization-manager");
		var UrlParameterInfo = require("../../../lib/xs/validator/urlParameterInfo").UrlParameterInfo;
		var BusinessObjectTypes = require("../../../lib/xs/util/constants").BusinessObjectTypes;
		var testData = require("../../testdata/testdata").data;
		var helpers = require("../../../lib/xs/util/helpers");
		var constants = require("../../../lib/xs/util/constants");    
		var MasterDataObjectTypes = constants.MasterDataObjectTypes;
		var MessageLibrary = require("../../../lib/xs/util/message");
		const testUtil = require("../../utils/testUtil.js");
		const PlcException = MessageLibrary.PlcException;
		var Code = MessageLibrary.Code;
		var oResponseMock;
		var oResponseHeaderMock;
		var oValidatorMock;
		var oPersistencyMock;
		var sPlcServerVersion = "2.0.0";

		describe("dispatch", function() {		

			let oPersistencySessionMock;
			beforeEach(function() {
				DispatcherLibrary.clearVersion();
				oResponseMock = jasmine.createSpyObj("oResponseMock", ["setBody"]);
				oValidatorMock = jasmine.createSpyObj("oValidatorMock", ["validate"]);

				oValidatorMock.validate.and.returnValue({
					data : [],
					parameters : {}
				});

				oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
				oPersistencyMock.getConnection.and.returnValue({
					commit : function(){},
					close : function(){}
				});

				spyOn(authorizationManager, 'checkPrivilege');

				oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
				oResponseMock.headers = oResponseHeaderMock;

				oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "updateLastActivity", "getSessionDetails", "clearTemporaryTables", "updateLastUserActivity"]);
				oPersistencySessionMock.getSessionDetails.and.returnValue({lifetime: 100});
				oPersistencyMock.Session = oPersistencySessionMock;

				var oPersistencyApplicationManagementMock = jasmine.createSpyObj("oPersistencyApplicationManagementMock", [ "getApplicationVersion" ]);
				oPersistencyApplicationManagementMock.getApplicationVersion.and.returnValue(sPlcServerVersion);
				oPersistencyMock.ApplicationManagement = oPersistencyApplicationManagementMock;

				var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", [ "getLock", "getLockingUsers" ]);
				oPersistencyMiscMock.getLock.and.returnValue(1);
				oPersistencyMiscMock.getLockingUsers.and.returnValue(1);
				oPersistencyMock.Misc = oPersistencyMiscMock;

				var oPersistencyLockMock = jasmine.createSpyObj("oPersistencyLockMock", [ "isTaskInProgress", "cancelTasksWithStatusAndLastUpdatedOlderThan"]);
					oPersistencyLockMock.isTaskInProgress.and.returnValue(false);
					oPersistencyLockMock.cancelTasksWithStatusAndLastUpdatedOlderThan.and.returnValue(true);
					oPersistencyMock.Task = oPersistencyLockMock;

				oCtx.persistency = oPersistencyMock;
			});

			it("set in response header the backend version", function() {
				//arrange	
				var oRequest = {
						queryPath: "validator",
						method: $.net.http.GET			
				};

				oResponseHeaderMock.set.and.callThrough();

				//act
				new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

				//assert
				expect(oResponseHeaderMock.set).toHaveBeenCalled();
				expect(oResponseHeaderMock.set).toHaveBeenCalledWith("SAP-PLC-API-VERSION", sPlcServerVersion);
				expect(oResponseHeaderMock.set.calls.count()).toEqual(1);
				expect(oResponseMock.headers).toBeDefined();
			});

			it("set response status to NOT_FOUND if resource doesn't exist", function() {
				//arrange	
				var oRequest = {
						queryPath: "validator",
						method: $.net.http.GET			
				};
				//act
				new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

				//assert
				expect(oResponseMock.status).toBe($.net.http.NOT_FOUND);
			});	
			
            it("should set message code and details text if PlcException was thrown", function() {
                //arrange   
				const oRequest = {
						queryPath: "items",
						method: $.net.http.GET			
				};
				oResponseHeaderMock.set.and.callThrough();
				oResponseMock.setBody.and.callThrough();
				
				const oMessageCode = Code.GENERAL_VALIDATION_ERROR;
                const sClientMsg = "Client error message";
                oValidatorMock.validate.and.callFake(() => { throw new PlcException(oMessageCode, sClientMsg); });
                
                //act
                new Dispatcher(oCtx, oRequest, oResponseMock, oValidatorMock).dispatch();

                //assert
                expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
                const oResponseObject = JSON.parse(oResponseMock.setBody.calls.mostRecent().args[0]);
                expect(oResponseObject.head.messages.length).toEqual(1);
		        expect(oResponseObject.head.messages[0].code).toEqual(oMessageCode.code);
		        expect(oResponseObject.head.messages[0].details.messageTextObj).toEqual(sClientMsg);
            }); 			

			it("set response status to METHOD_NOT_ALLOWED if method doesn't exist for resource", function() {
				//arrange	
				var oRequest = {
						queryPath: "init-session",
						method: $.net.http.GET			
				};
				//act
				new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

				//assert
				expect(oResponseMock.status).toBe($.net.http.METHOD_NOT_ALLOWED);
			});	

			describe("updateActivityTime", () => {
				it("should update last_activity_time when last update was older than 60s", () => {
					// arrange: just call any service
					const oRequest = {
						queryPath: "items",
						method: $.net.http.GET			
					};
					// act
					new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

					// assert: check if updateActivityTime was called
					expect(oPersistencySessionMock.updateLastActivity).toHaveBeenCalled();
				});

				it("should not update last_activity_time when last update was newer than 60s", () => {
					// arrange: just call any service
					const oRequest = {
						queryPath: "items",
						method: $.net.http.GET			
					};
					oPersistencySessionMock.getSessionDetails.and.returnValue({lifetime: 30});

					// act
					new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

					// assert: check if updateActivityTime was not called
					expect(oPersistencySessionMock.updateLastActivity).not.toHaveBeenCalled();
				});
			});

			describe("updateUserActivity", () => {
				it("should update last activity for user", () => {
					// arrange: just call any service
					const oRequest = {
						queryPath: "items",
						method: $.net.http.GET			
					};
					// act
					new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

					// assert: check if updateLastUserActivity was called or not depending if the system is on cloud or not
					if (testUtil.isCloud()) {
						expect(oPersistencySessionMock.updateLastUserActivity).toHaveBeenCalled();
					} else{
						expect(oPersistencySessionMock.updateLastUserActivity).not.toHaveBeenCalled();
					}
				});
			});

			describe("Check privileges", function(){

				beforeOnce(function() {
					DispatcherLibrary.Resources = Object.freeze({
						"init-session": {
							"POST": {
								parameters: [new UrlParameterInfo("language", "String", true)], // add late client parameter - see init-session
								businessObjectType: BusinessObjectTypes.InitSession,
								businessLogic: function() {return [function(){}]}
							}
						},
						"calculation-versions/{calculation_version_id}": {
							pathVariables: [
								new UrlParameterInfo("calculation_version_id", "PositiveInteger", true)
							],
							"POST": {
								parameters: [],
								businessObjectType: BusinessObjectTypes.CalculationVersion,
								businessLogic: function() {return [() => {}]},
								privilege: ["CalcVerDel"],
								instancePrivilege : authorizationManager.Privileges.FULL_EDIT
							}
						}, 
						"calculation-versions": {
							"GET": {
								parameters: [new UrlParameterInfo("calculation_id", "PositiveInteger", false), new UrlParameterInfo("top","PositiveInteger", false), 
								             new UrlParameterInfo("recently_used", "Boolean", false), new UrlParameterInfo("id", "PositiveInteger", false), 
								             new UrlParameterInfo("loadMasterdata", "Boolean", false)],
								             businessObjectType: BusinessObjectTypes.CalculationVersion,
								             businessLogic: function() {return [function(){}]},
								             privilege: ["CalcVerOpen"]
							},
							"POST": {
								parameters: [DispatcherLibrary.urlParameterAction, new UrlParameterInfo("calculate", "Boolean", false)],
								businessObjectType: BusinessObjectTypes.CalculationVersion,
								businessLogic: function() {return [function(){}]},
								privilege:  {
									parameterName : "action",
									parameterPrivilegeMap: [
									                        {
									                        	parameterValues : ["save"],
									                        	requiredPrivilege: ["CalcVerCreateUpdt"]
									                        },
									                        {
									                        	parameterValues : ["save-as"],
									                        	requiredPrivilege: ["non.exisiting::Privilege"]
									                        },
									                        {
									                        	parameterValues : ["close"],
									                        	requiredPrivilege: ["CalcVerOpen"]
									                        }]
								}
							},
							"PUT" : {
								parameters : [ new UrlParameterInfo("calculate", "Boolean", false), new UrlParameterInfo("loadMasterdata", "Boolean", false), new UrlParameterInfo("updateMasterdataTimestamp", "Boolean", false) ],
								businessObjectType : BusinessObjectTypes.CalculationVersion,
								businessLogic : function() {return [function(){}]},
								privilege : [] //Note: Defined as an empty array to check if exception is thrown.
							},
							"DELETE" : {
								parameters : [],
								businessObjectType : BusinessObjectTypes.CalculationVersion,
								businessLogic : function() {return [function(){}]},
								privilege : "CalcVerDel" //Note: Defined as a string to check if exception is thrown.
							}
						},
						"global-search": {
							"GET": {
								parameters : [ DispatcherLibrary.urlGlobalSearchSortedColumn , DispatcherLibrary.urlGlobalSearchSortedDirection ,
								               new UrlParameterInfo("filter", "String", false), DispatcherLibrary.urlGlobalSearchEntityType,
								               new UrlParameterInfo("top", "PositiveInteger", false)],
								               businessObjectType : BusinessObjectTypes.GlobalSearch,
								               businessLogic : function() {return [function(){}]},
								               privilege : {
								            	   parameterName : "type",
								            	   parameterPrivilegeMap : [ {
								            		   parameterValues : [ "project" ],
								            		   requiredPrivilege : "PrjRead"
								            	   }, {
								            		   parameterValues : [ "calculation" ],
								            		   requiredPrivilege : ["CalcOpen"]
								            	   },
								            	   {
								            		   parameterValues : [ "calculationVersion" ],
								            		   requiredPrivilege : ["CalcVerOpen"]
								            	   },
								            	   {
								            		   parameterValues : [ "all" ],
								            		   requiredPrivilege : ["PrjRead", "CalcOpen", "CalcVerOpen"]
								            	   }]
								               }
							}
						},
						"masterdata": {
							"GET": {
								parameters: [new UrlParameterInfo("business_object", "String", true),
								             new UrlParameterInfo("filter", "String", false),
								             new UrlParameterInfo("top", "PositiveInteger", false),
								             new UrlParameterInfo("skip", "PositiveInteger", false),
								             new UrlParameterInfo("filterautocomplete", "String", false)
								],
								businessObjectType: BusinessObjectTypes.Administration,
								businessLogic: function() {return [function(){}]},
								privilege: {
									parameterName : "business_object",
									parameterPrivilegeMap: [
									                        { parameterValues : [MasterDataObjectTypes.MaterialPrice], requiredPrivilege: [Privileges.MATERIAL_PRICE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ActivityPrice], requiredPrivilege: [Privileges.ACTIVITY_PRICE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.CurrencyConversion], requiredPrivilege: [Privileges.CURRENCY_CONVERSION_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Account], requiredPrivilege: [Privileges.ACCOUNT_READ]},
									                        { parameterValues : [MasterDataObjectTypes.AccountGroup], requiredPrivilege: [Privileges.ACCOUNT_GROUP_READ]},
									                        { parameterValues : [MasterDataObjectTypes.MaterialAccountDetermination], requiredPrivilege: [Privileges.MATERIAL_ACCOUNT_DETERMINATION_READ]},
									                        { parameterValues : [MasterDataObjectTypes.OverheadGroup], requiredPrivilege: [Privileges.OVERHEAD_GROUP_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ValuationClass], requiredPrivilege: [Privileges.VALUATION_CLASS_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Process], requiredPrivilege: [Privileges.PROCESS_READ]},
									                        { parameterValues : [MasterDataObjectTypes.CostingSheet], requiredPrivilege: [Privileges.COSTING_SHEET_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ComponentSplit], requiredPrivilege: [Privileges.COMPONENT_SPLIT_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Plant], requiredPrivilege: [Privileges.PLANT_READ]},
									                        { parameterValues : [MasterDataObjectTypes.WorkCenter], requiredPrivilege: [Privileges.WORK_CENTER_READ]},
									                        { parameterValues : [MasterDataObjectTypes.MaterialType], requiredPrivilege: [Privileges.MATERIAL_TYPE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.MaterialGroup], requiredPrivilege: [Privileges.MATERIAL_GROUP_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Material], requiredPrivilege: [Privileges.MATERIAL_READ]},
									                        { parameterValues : [MasterDataObjectTypes.MaterialPlant], requiredPrivilege: [Privileges.MATERIAL_PLANT_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Document], requiredPrivilege: [Privileges.DOCUMENT_READ]},
									                        { parameterValues : [MasterDataObjectTypes.DocumentType], requiredPrivilege: [Privileges.DOCUMENT_TYPE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Customer], requiredPrivilege: [Privileges.CUSTOMER_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Vendor], requiredPrivilege: [Privileges.VENDOR_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ControllingArea], requiredPrivilege: [Privileges.CONTROLLING_AREA_READ]},
									                        { parameterValues : [MasterDataObjectTypes.CompanyCode], requiredPrivilege: [Privileges.COMPANY_CODE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ProfitCenter], requiredPrivilege: [Privileges.PROFIT_CENTER_READ]},
									                        { parameterValues : [MasterDataObjectTypes.BusinessArea], requiredPrivilege: [Privileges.BUSINESS_AREA_READ]},
									                        { parameterValues : [MasterDataObjectTypes.CostCenter], requiredPrivilege: [Privileges.COST_CENTER_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ActivityType], requiredPrivilege: [Privileges.ACTIVITY_TYPE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Language], requiredPrivilege: [Privileges.LANGUAGE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.Currency], requiredPrivilege: [Privileges.CURRENCY_READ]},
									                        { parameterValues : [MasterDataObjectTypes.UnitOfMeasure], requiredPrivilege: [Privileges.UNIT_OF_MEASURE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.PriceSource], requiredPrivilege: [Privileges.PRICE_SOURCE_READ]},
									                        { parameterValues : [MasterDataObjectTypes.SalesOrganization], requiredPrivilege: [Privileges.SALES_ORGANIZATION_READ]},
									                        { parameterValues : [MasterDataObjectTypes.User], requiredPrivilege: [Privileges.USER_READ]},
									                        { parameterValues : [MasterDataObjectTypes.ConfidenceLevel], requiredPrivilege: [Privileges.CONFIDENCE_LEVEL_READ]},					
									                        { parameterValues : [MasterDataObjectTypes.DocumentStatus], requiredPrivilege: [Privileges.DOCUMENT_STATUS_READ]}
									                        ]  
								}
							}
						},
						"projects" : {
							"POST" : {
								parameters : [ new UrlParameterInfo("action", "String", true, [ "close", "create", "open" ]) ],
								businessObjectType : BusinessObjectTypes.Project,
								businessLogic : function() {return [function(){}]},
								privilege : {
									parameterName : "action",
									parameterPrivilegeMap : [ {
										parameterValues : [ "create" ],
										requiredPrivilege : ["PrjCreate"]
									}, {
										parameterValues : [ "close", "open" ],
										requiredPrivilege : ["PrjOpen"],
										instancePrivilege : "READ"
									}]
								}
							}
						},
						"layouts" : {
							"GET" : {
								parameters : [],
								businessObjectType : BusinessObjectTypes.Layout,
								businessLogic : function() {return [function(){}]},
								privilege : ["Base"] ,
								instancePrivilege : "READ" //Note: Defined just to test if exception is thrown.
							}
						}
					});

					oResponseMock = jasmine.createSpyObj("oResponseMock", ["setBody"]);
					oValidatorMock = jasmine.createSpyObj("oValidatorMock", ["validate"]);

					oValidatorMock.validate.and.returnValue({
						data : [],
						parameters : {}
					});

					oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
					oPersistencyMock.getConnection.and.returnValue({
						commit : function(){},
						close : function(){}
					});

					var oPersistencySessionMock = jasmine.createSpyObj("oPersistencySessionMock", [ "updateLastActivity"]);
					oPersistencySessionMock.updateLastActivity.and.returnValue(1);
					oPersistencyMock.Session = oPersistencySessionMock;
					
					var oPersistencyApplicationManagementMock = jasmine.createSpyObj("oPersistencyApplicationManagementMock", [ "getApplicationVersion" ]);
					oPersistencyApplicationManagementMock.getApplicationVersion.and.returnValue("2.0.0");
					oPersistencyMock.ApplicationManagement = oPersistencyApplicationManagementMock;

					var oPersistencyMiscMock = jasmine.createSpyObj("oPersistencyMiscMock", [ "getLock", "getLockingUsers" ]);
					oPersistencyMiscMock.getLock.and.returnValue(1);
					oPersistencyMiscMock.getLockingUsers.and.returnValue(1);
					oPersistencyMock.Misc = oPersistencyMiscMock;

					var oPersistencyLockMock = jasmine.createSpyObj("oPersistencyLockMock", [ "isTaskInProgress", "cancelTasksWithStatusAndLastUpdatedOlderThan"]);
					oPersistencyLockMock.isTaskInProgress.and.returnValue(false);
					oPersistencyLockMock.cancelTasksWithStatusAndLastUpdatedOlderThan.and.returnValue(true);
					oPersistencyMock.Task = oPersistencyLockMock;

					oCtx.persistency = oPersistencyMock;
				});

				afterOnce(function() {
					DispatcherLibrary.Resources = Resources;
					oCtx.persistency = Persistency;
				});

				function prepareSaveRequest(sAction, oCalculationVersion) {

					//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
					var params = createParamsObject([{
						"name": "action",
						"value": sAction
					}, {
						"name": "calculate",
						"value": "false"
					}]);
					var oRequest = {
							queryPath: "calculation-versions",
							method: $.net.http.POST,
							parameters: params,
							body: {
								asString: function() {
									return JSON.stringify(oCalculationVersion);
								}
							}
					};
					return oRequest;
				}

				var oCalculationVersionToSave = [{
					"CALCULATION_VERSION_ID": testData.iCalculationVersionId,
					"CALCULATION_ID": 1978,
					"CALCULATION_VERSION_NAME": "A Newly Saved Version"
				}];

				function prepareInitSessionRequest() {
					// create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
					var params = createParamsObject([{
						name: "language",
						value: "EN"
					}]);
					var oRequest = {
							queryPath: "init-session",
							method: $.net.http.POST,
							parameters: params
					};
					return oRequest;
				}

				function prepareMasterDataRequest(){
					// create a new calculation object as payload of the request; use data from testdata.xsjslib as basis
					var params = createParamsObject([{
						name: "business_object",
						value: "plant"
					}]);
					var oRequest = {
							queryPath: "masterdata",
							method: $.net.http.GET,
							parameters: params
					};
					return oRequest;
				}

				function createParamsObject(aNameValuePairs){
					var params = [];
					_.each(aNameValuePairs,function(oNameValuePair){
						params.push(oNameValuePair);  
					});
					params.get = function(sParameterName) {
						if (helpers.isNullOrUndefined(sParameterName)) {
							return null;
						} else {
							_.each(aNameValuePairs,function(oNameValuePair){
								if (sParameterName === oNameValuePair.name) {
									return oNameValuePair.value;
								}
							});
						}
					};
					return params;
				}

				it("should check privileges for service call if a required default privilege is defined in the resource description", function() {
					//arrange
					var params = [{
						name : "calculation_id",
						value: "2809"
					}];
					params.get = function(sParameterName) {
						if (helpers.isNullOrUndefined(sParameterName)) {
							return null;
						} else {
							if (sParameterName == "calculation_id") {
								return "2809";
							}
						}
					};

					var oRequest = {
							queryPath: "calculation-versions",
							method: $.net.http.GET,	
							parameters: params
					};
					//act
					new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock,oValidatorMock).dispatch();

					//assert
					expect(oResponseMock.status).toBe($.net.http.OK);
				});

				it("should pass the privileges check for service call if required privileges are defined for different values of a parameter and return OK (200)", function() {
					//arrange	

					//act
					new Dispatcher(oCtx, prepareSaveRequest("save",oCalculationVersionToSave), oResponseMock, oValidatorMock).dispatch();

					//assert
					expect(oResponseMock.status).toBe($.net.http.OK);
				});

				it("should pass the privileges check  for service call if required privileges are defined for arrays of parameter values defined by a function (see: masterdata resource definition) and return OK (200)", function() {
					//arrange	

					//act
					new Dispatcher(oCtx, prepareMasterDataRequest(), oResponseMock,oValidatorMock).dispatch();

					//assert
					expect(oResponseMock.status).toBe($.net.http.OK);
				});

				describe('getRequiredPrivileges', function() {

					// REVIEW (RF): test case description does not match assert
					//TODO: change behaviour, required privilege MUST be defined
					it("should return 500 (INTERNAL_SERVER_ERROR) if no privileges are defined in the resource description", function() {
						//arrange	
						//act
						new Dispatcher(oCtx, prepareInitSessionRequest(), oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});

					it("should return 500 (INTERNAL_SERVER_ERROR) if parameter defined in the resource description is not set", function() {
						//arrange
						var params = [{
							sortedColumnId : null, 
							sortedDirection : null, 
							filter : null, 
							type : "Project", 
							top : null
						}];

						var oRequest = {
								queryPath: "global-search",
								method: $.net.http.GET,	
								parameters: params
						};
						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});

					it("should return 500 (INTERNAL_SERVER_ERROR) if parameter values defined in the resource description are not set correclty for privilege determination", function() {
						//arrange	
						//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
						var params = createParamsObject([{
							"name": "action",
							"value": "invalidValue"
						}, {
							"name": "calculate",
							"value": "false"
						}]);
						var oRequest = {
								queryPath: "calculation-versions",
								method: $.net.http.POST,
								parameters: params,
								body: {
									asString: function() {
										return JSON.stringify(oCalculationVersionToSave);
									}
								}
						};
						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});
				});

				describe('checkPrivilege', function() {

					it("should return 500 (INTERNAL_SERVER_ERROR) if privileges are defined in dispatcher resources description as a string and not a array of privileges", function() {
						//arrange	
						//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
						var params = createParamsObject([{
							"name": "calculate",
							"value": "false"
						}]);
						var oRequest = {
								queryPath: "calculation-versions",
								method: $.net.http.DEL,
								parameters: [],
								body: {
									asString: function() {
										return JSON.stringify([{"CALCULATION_VERSION_ID": testData.iCalculationVersionId}]);
									}
								}
						};
						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});

					it("should return 500 (INTERNAL_SERVER_ERROR) if privileges are defined in dispatcher resources description as an empty", function() {
						//arrange	
						//parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
						var params = createParamsObject([{
							"name": "calculate",
							"value": "false"
						}]);
						var oRequest = {
								queryPath: "calculation-versions",
								method: $.net.http.PUT,
								parameters: [],
								body: {
									asString: function() {
										return JSON.stringify([{"CALCULATION_VERSION_ID": testData.iCalculationVersionId}]);
									}
								}
						};
						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});

					it("should return 403 (FORBIDDEN) if user does not have the necessary privilege", function() {
						//arrange	
						//act
						new Dispatcher(oCtx, prepareSaveRequest("save-as",oCalculationVersionToSave), oResponseMock, oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.FORBIDDEN);
					});
				});

				describe('checkInstancePrivilege', function() {

					it("should return 500 (INTERNAL_SERVER_ERROR) if instance-based privilege not defined for a business object", function() {
						//arrange	
						var oRequest = {
								queryPath: "layouts",
								method: $.net.http.GET,
								parameters: [],
								body: {}
						};

						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(authorizationManager.checkPrivilege).not.toHaveBeenCalled();
						expect(oResponseMock.status).toBe($.net.http.INTERNAL_SERVER_ERROR);
					});

					it("should not check for instance-based privileges if it's not defined in dispatcher resources description and return OK (200)", function() {
						//arrange	
						var params = createParamsObject([{
							"name": "action",
							"value": "create"
						}]);
						var oRequest = {
								queryPath: "projects",
								method: $.net.http.POST,
								parameters: params,
								body: {}
						};
						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(authorizationManager.checkPrivilege).not.toHaveBeenCalled();
						expect(oResponseMock.status).toBe($.net.http.OK);
					});

					it("should pass the instance-based privileges check for service call if required privileges are defined and return OK (200)", function() {
						//arrange	
						var params = createParamsObject([{
							"name": "action",
							"value": "open"
						}]);
						var oRequest = {
								queryPath: "projects",
								method: $.net.http.POST,
								parameters: params,
								body: {}
						};
						authorizationManager.checkPrivilege.and.returnValue(authorizationManager.Privileges.READ);

						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(oResponseMock.status).toBe($.net.http.OK);
					});
					
					it("should pass the instance-based privileges check for service call for resource definition with path variable and return OK (200)", () => {
						//arrange	
						var params = createParamsObject([]);
						var oRequest = {
								queryPath: "calculation-versions/1",
								method: $.net.http.POST,
								parameters: params,
								body: {}
						};
						authorizationManager.checkPrivilege.and.returnValue(authorizationManager.Privileges.FULL_EDIT);

						//act
						new Dispatcher(oCtx, oRequest, oResponseMock,oValidatorMock).dispatch();

						//assert
						expect(authorizationManager.checkPrivilege).toHaveBeenCalled();
						expect(oResponseMock.status).toBe($.net.http.OK);
					});
				});
			});
		});
	}).addTags(["All_Unit_Tests"]);
}