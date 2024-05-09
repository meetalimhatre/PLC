const _ = require("lodash");
const helpers = require("../../../lib/xs/util/helpers");
const BusinessObjectValidatorUtils = require("../../../lib/xs/validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;
const constants = require("../../../lib/xs/util/constants");
const BusinessObjectTypes = constants.BusinessObjectTypes;
const sDefaultExchangeRateType = constants.sDefaultExchangeRateType;
const MessageLibrary = require("../../../lib/xs/util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const itemValidatorLibrary = require("../../../lib/xs/validator/itemValidator");
const ItemValidator = itemValidatorLibrary.ItemValidator;
const Persistency = $.import("xs.db", "persistency").Persistency;
const TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;

if(jasmine.plcTestRunParameters.mode === 'all'){
	
	describe('xsjs.validator.itemValidator-tests', function() {
	
		var sSessionID = "TestSessionID";
		var oItemValidator;
	
		var oMetadataProviderMock = null;
		// partial mock of Persistency; functions that should explicitly not be executed, must be mocked
		var oPersistencyMock = null;
		var BusinessObjectValidatorUtilsMock = null;
		var mValidatedParameters = null;
		var iVersionID = 1234;
	
        var oExistingMasterdata = {
            COSTING_SHEETS: [{
                COSTING_SHEET_ID: "CS1"
            }],
            COMPONENT_SPLITS: [{
                COMPONENT_SPLIT_ID: "CS1"
            }],
            CURRENCIES: [{
                CURRENCY_ID: "CUR1"
            }],
            EXCHANGE_RATE_TYPES: [{
                EXCHANGE_RATE_TYPE_ID: sDefaultExchangeRateType
            }],
            ACCOUNTS: [{
                ACCOUNT_ID: "AC1"
            }],
            PRICE_SOURCES: [{
                PRICE_SOURCE_ID: "1"
            }],
            UNIT_OF_MEASURES: [{
                "UOM_ID": "PC"
            }],
            DOCUMENT_STATUSES: [{
                DOCUMENT_STATUS_ID: "#R"
            }],
            DOCUMENT_TYPES: [{
                DOCUMENT_TYPE_ID: "#DR"
            }],
            MATERIAL_TYPES: [{
                MATERIAL_TYPE_ID: "RAW"
            }],
            OVERHEADS: [{
                OVERHEAD_GROUP_ID: "#OG1"
            }],
            VALUATION_CLASSES: [{
                VALUATION_CLASS_ID: "#VC1"
            }],
            MATERIAL_GROUPS: [{
                MATERIAL_GROUP_ID: "#MG1"
            }]
        };

		beforeEach(function() {
			oMetadataProviderMock = jasmine.createSpyObj('metadataProvider', [ 'get' ]);

			// since some functions (esp. utilities of the persistency library must be executed, it is only partially mocked)
			oPersistencyMock = new Persistency(jasmine.dbConnection);
			spyOn(oPersistencyMock.CalculationVersion, "getExistingNonTemporaryMasterdata");
			oPersistencyMock.CalculationVersion.getExistingNonTemporaryMasterdata.and.returnValue(oExistingMasterdata);
			spyOn(oPersistencyMock.CalculationVersion, "isOpenedInSessionAndContext");
			oPersistencyMock.CalculationVersion.isOpenedInSessionAndContext.and.returnValue(true);
			spyOn(oPersistencyMock.CalculationVersion, "getProjectPropertiesForCalculationVersion");
			spyOn(oPersistencyMock.CalculationVersion, "getControllingAreasForCalculationVersions");

			spyOn($.trace, "error").and.returnValue(null);
			spyOn(helpers, "logError").and.callFake(function (msg) { $.trace.error(msg); });

			BusinessObjectValidatorUtilsMock = new BusinessObjectValidatorUtils(BusinessObjectTypes.Item);
			spyOn(BusinessObjectValidatorUtilsMock, "checkEntity");
			// arrange the mock of checkEntity that to return the entity with which it was called; bypasses any validation, but keeps the 
			// contract of the method
			BusinessObjectValidatorUtilsMock.checkEntity.and.callFake(function() {
				var oLastCallEntity = _.last(BusinessObjectValidatorUtilsMock.checkEntity.calls.all()).args[0].entity;
				return oLastCallEntity;
			});
			spyOn(BusinessObjectValidatorUtilsMock, "tryParseJson").and.callThrough();
	        
	       	spyOn(itemValidatorLibrary.authorizationManager, 'checkPrivilege').and.returnValue(null);
	        
			oItemValidator = new ItemValidator($, oPersistencyMock, sSessionID, $.session.getUsername(), oMetadataProviderMock, BusinessObjectValidatorUtilsMock);
			
			// mock all persistency functions that are called in the itemValidator
			spyOn(oPersistencyMock.Item, "getItem");
			oPersistencyMock.Item.getItem.and.returnValue({
				"CALCULATION_VERSION_ID" : iVersionID,
				"IS_ACTIVE" : 1,
				"ITEM_DESCRIPTION" : "Pump Precision 100",
				"ITEM_ID" : 1, 
				"ITEM_CATEGORY_ID" : 0
			});
			
			spyOn(oPersistencyMock.Item, "getItems");
			oPersistencyMock.Item.getItems.and.returnValue([{
				"CALCULATION_VERSION_ID" : iVersionID,
				"IS_ACTIVE" : 1,
				"ITEM_DESCRIPTION" : "Pump Precision 100",
				"ITEM_ID" : 1, 
				"ITEM_CATEGORY_ID" : 0,
				"CHILD_ITEM_CATEGORY_ID": 0
			}]);
			spyOn(oPersistencyMock.Item, "hasItemChildren");
			oPersistencyMock.Item.hasItemChildren.and.returnValue(false);
			
			spyOn(oPersistencyMock.Item, "getParentItemIds");
		    oPersistencyMock.Item.getParentItemIds.and.returnValue([1]); // only item_id 1 is parent for tests

			spyOn(oPersistencyMock.Item, "getValidItemIds");
		    oPersistencyMock.Item.getValidItemIds.and.returnValue([1]); // only item_id 1 is valid for tests
			
			mValidatedParameters = {
					"calculate" : true,
					'mode' : 'replace'
			};
		});
	
		var params = [];
		params.get = function() {
			return undefined;
		};

		function createRequest(oBody, oHTTPMethod) {
			var oRequest = {
					queryPath : "item",
					method : oHTTPMethod,
					body : {
						asString : function() {
							return JSON.stringify(oBody);
						}
					},
					parameters : params
			};
			return oRequest;
		}

        describe("tests for non-temporary masterdata", function () {

            const oExpectedErrorCode = MessageLibrary.Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR;
            const oValidItem = {
                CALCULATION_VERSION_ID: iVersionID,
                IS_ACTIVE: 1,
                ITEM_DESCRIPTION: "Pump Precision 100",
                ITEM_ID: 1,
                PARENT_ITEM_ID: 1,
                PREDECESSOR_ITEM_ID: null,
                ITEM_CATEGORY_ID: constants.ItemCategory.CalculationVersion,
				CHILD_ITEM_CATEGORY_ID: constants.ItemCategory.CalculationVersion,

                ACCOUNT_ID: oExistingMasterdata.ACCOUNTS[0].ACCOUNT_ID,
                PRICE_SOURCE_ID: oExistingMasterdata.PRICE_SOURCES[0].PRICE_SOURCE_ID,
                QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                TOTAL_QUANTITY_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                PRICE_UNIT_UOM_ID: oExistingMasterdata.UNIT_OF_MEASURES[0].UOM_ID,
                TRANSACTION_CURRENCY_ID: oExistingMasterdata.CURRENCIES[0].CURRENCY_ID,
                DOCUMENT_STATUS_ID: oExistingMasterdata.DOCUMENT_STATUSES[0].DOCUMENT_STATUS_ID,
                DOCUMENT_TYPE_ID: oExistingMasterdata.DOCUMENT_TYPES[0].DOCUMENT_TYPE_ID,
                MATERIAL_TYPE_ID: oExistingMasterdata.MATERIAL_TYPES[0].MATERIAL_TYPE_ID,
                MATERIAL_GROUP_ID: oExistingMasterdata.MATERIAL_GROUPS[0].MATERIAL_GROUP_ID,
                OVERHEAD_GROUP_ID: oExistingMasterdata.OVERHEADS[0].OVERHEAD_GROUP_ID,
                VALUATION_CLASS_ID: oExistingMasterdata.VALUATION_CLASSES[0].VALUATION_CLASS_ID
            };
            const mParametersToMethod = {
                POST : {
                    mode: "normal"
                },
                PUT : {}
            };

            ["POST", "PUT"].forEach(sMethod => {
                function checkMasterdataDoesNotExistsException(oInvalidCalculationVersion) {
                    var exception = null;
                    // act
                    try {
                        oItemValidator.validate(createRequest([oInvalidCalculationVersion], $.net.http[sMethod]), mParametersToMethod[sMethod]);
                    } catch (e) {
                        exception = e;
                    }

                    // assert
                    expect(exception.code).toEqual(oExpectedErrorCode);
                }

                describe(`${sMethod} requests`, () => {

                    it("should validate successfully a valid create calculation version request", () => {
                        // act
                        var oValidatedCalculation = oItemValidator.validate(createRequest([oValidItem], $.net.http[sMethod], mParametersToMethod[sMethod]), {
                            action: "create"
                        });

                        //assert
                        expect(oValidatedCalculation).toEqualObject([oValidItem]);
                    });

                    ["ACCOUNT_ID", "PRICE_SOURCE_ID", "QUANTITY_PER_BASE_UNIT_UOM_ID", "QUANTITY_UOM_ID", "TOTAL_QUANTITY_UOM_ID",
                        "PRICE_UNIT_UOM_ID", "TRANSACTION_CURRENCY_ID", "TARGET_COST_CURRENCY_ID", "DOCUMENT_TYPE_ID", "DOCUMENT_STATUS_ID", "MATERIAL_TYPE_ID"
                        , "MATERIAL_GROUP_ID", "OVERHEAD_GROUP_ID", "VALUATION_CLASS_ID"
                    ].forEach(sNonTemporaryMasterdata => {
                        it(`should throw GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR if root item contains unknown master data reference for ${sNonTemporaryMasterdata}`, () => {
                            // arrange
                            const oInvalidItem = new TestDataUtility(oValidItem).build();
                            oInvalidItem[sNonTemporaryMasterdata] = "ABC";

                            // act + assert
                            checkMasterdataDoesNotExistsException(oInvalidItem);
                        });
                    });
                });
            });
        });
	
		describe("tests of item structure", function() {
	
			function createValidRequestBody() {
				return [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"IS_ACTIVE" : 1,
					"ITEM_CATEGORY_ID" : constants.ItemCategory.CalculationVersion,
					"CHILD_ITEM_CATEGORY_ID" : constants.ItemCategory.CalculationVersion,
					"ITEM_DESCRIPTION" : "Pump Precision 100",
					"ITEM_ID" : 1,
					"PARENT_ITEM_ID" : null,
					"PREDECESSOR_ITEM_ID" : null
	
				}, {
					"CALCULATION_VERSION_ID" : iVersionID,
					"IS_ACTIVE" : 1,
					"ITEM_CATEGORY_ID" : 2,
					"CHILD_ITEM_CATEGORY_ID" : 2,
					"ITEM_DESCRIPTION" : "Item 3",
					"ITEM_ID" : -1,
					"PARENT_ITEM_ID" : 1
				}, {
					"CALCULATION_VERSION_ID" : iVersionID,
					"IS_ACTIVE" : 1,
					"ITEM_CATEGORY_ID" : 2,
					"CHILD_ITEM_CATEGORY_ID" : 2,
					"ITEM_DESCRIPTION" : "Item 1",
					"ITEM_ID" : -2,
					"PARENT_ITEM_ID" : 1
				}, {
					"CALCULATION_VERSION_ID" : iVersionID,
					"IS_ACTIVE" : 1,
					"ITEM_CATEGORY_ID" : 2,
					"CHILD_ITEM_CATEGORY_ID" : 2,
					"ITEM_DESCRIPTION" : "Item 2",
					"ITEM_ID" : -3,
					"PARENT_ITEM_ID" : -2
				} ];
			}
	
			function createInValidRequestBody() {
				var aRequestBody = createValidRequestBody();
				var iInvalidItemID = -4;
				aRequestBody[0].ITEM_ID = iInvalidItemID;
				aRequestBody[0].ITEM_CATEGORY_ID = 2;
				aRequestBody[0].CHILD_ITEM_CATEGORY_ID = 2;
				aRequestBody[1].PARENT_ITEM_ID = iInvalidItemID;
				aRequestBody[2].PARENT_ITEM_ID = iInvalidItemID;
				return aRequestBody;
			}
			
			function createInValidRequestBodyWithDifferentPositiveParentItemId() {
				var aRequestBody = createValidRequestBody().splice(1, 3);
				aRequestBody[2].PARENT_ITEM_ID = 2;
				return aRequestBody;
			}
		    
		    function createValidRequestBodyWithSamePositiveParentItemId() {
				var aRequestBody = createValidRequestBody().splice(1, 3);
				aRequestBody[2].PARENT_ITEM_ID = 1;
				return aRequestBody;
			}
			
			function createInValidRequestBodyWithTheSameItemId() {
				var aRequestBody = createValidRequestBody().splice(1, 3);
				aRequestBody[2].ITEM_ID = -1;
				aRequestBody[2].PARENT_ITEM_ID = 1;
				return aRequestBody;
			}
		
    		it("should return validated items if valid input items are provided and mode is 'replace'", function() {
    			// arrange		
    			var oRequest = createRequest(createValidRequestBody(), $.net.http.POST);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			// assert	
    			expect(result.length).toBe(4);
    		});

    		it("should throw an exception if no valid root item with positive ID is provided and mode is 'replace'", function() {
    			// arrange		
    
    			var oRequest = createRequest(createInValidRequestBody(), $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item structure to be created has multiple or no root items.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);
    		});

    		it("should throw an exception if no import mode is 'append'", function() {
    			// arrange		
    
    			var oRequest = createRequest(createValidRequestBody(), $.net.http.POST);
    			mValidatedParameters.mode = "append";
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item import with different mode than 'replace', 'updatemasterdataandprices' and 'noupdatemasterdataandprices' is not supported.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);
    		});

    		it("should throw an exception if root item has a negative parent_id  and mode is 'replace'", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[0].PARENT_ITEM_ID = -1;
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: 1234.`);
    		});

    		it("should throw an exception if root item has a negative predecessor_item_id  and mode is 'replace'", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[0].PREDECESSOR_ITEM_ID = -1;
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: 1234.`);    			
    		});

    		it("should throw an exception if the root items category is changed and mode is 'replace'", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[0].ITEM_CATEGORY_ID = constants.ItemCategory.Material;
				aRequestBody[0].CHILD_ITEM_CATEGORY_ID = constants.ItemCategory.Material;
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
            	const sClientMessage = "Category of item should not be changed during import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: ID 1; Calculation Version Id: 1234.`);			
    		});

    		it("should throw an exception if the item-list to create contains a loop (by not leading to the top level item)", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[1].PARENT_ITEM_ID = -3;
    			aRequestBody[2].PARENT_ITEM_ID = -1;
    			aRequestBody[3].PARENT_ITEM_ID = -2;
    
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item structure to be created is not a valid tree structure.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Expected 4 items in tree, found 1.`);    			
    		});

    		it("should throw an exception if the item-list to create contains a loop (by having two parents on one item)", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			var oSecondItemInstancePointingtoDifferentParent = aRequestBody[2];
    			oSecondItemInstancePointingtoDifferentParent.PARENT_ITEM_ID = -3;
    			aRequestBody.push(oSecondItemInstancePointingtoDifferentParent);
    
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item structure to be created is not a valid tree structure. It contains loops by having two parents on one item. Item Id: -2."
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);    			
    		});
    		
    		it("should throw an exception if the parent item does not exist", () => {
    		    //arrange
    		    var aRequestBody = createValidRequestBody();
    		    aRequestBody.splice(0,1);
    		    aRequestBody.splice(1,2);
    		    aRequestBody[0].PARENT_ITEM_ID = 9999;
    		    var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    			mValidatedParameters.mode = 'normal';
    			mValidatedParameters.compressedResult = true;
    		    
    		    //act
    		    try{
    		        var result = oItemValidator.validate(oRequest, mValidatedParameters);
    		    } catch (e) {
    		        exception = e;
    		    }
    		    
    		    //assert
    		    expect(exception).toBeDefined();
    		    const sClientMessage = "Parent item id is not valid";
    		    expect(exception.developerMessage).toBe(sClientMessage);
    		});

    		it("should throw an exception if the root item to be replaced does not exist", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);

    			oPersistencyMock.Item.getItem.and.throwError("item does not exist in calculation version");
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(oPersistencyMock.Item.getItem).toHaveBeenCalled();
    			expect(oPersistencyMock.Item.getItem).toThrowError("item does not exist in calculation version");
    			expect(exception).toBeDefined();
    			expect(exception.message).toBe("item does not exist in calculation version");
    		});

    		it("should throw an exception if the root item to be replaced has a different parent than the new item", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			oPersistencyMock.Item.getItem.and.returnValue({
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1,
    				"PARENT_ITEM_ID" : 0
    			});
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: 1234.`);    			
    		});

    		it("should throw an exception if the root item to be replaced has a parent and new item has not", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			oPersistencyMock.Item.getItem.and.returnValue({
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1,
    				"PARENT_ITEM_ID" : 0
    			});
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: ${iVersionID}.`);    			
    		});

    		it("should throw an exception if the root item to be replaced has no parent but the new item has one", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[0].PARENT_ITEM_ID = 100;
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			oPersistencyMock.Item.getItem.and.returnValue({
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1,
    				"PARENT_ITEM_ID" : null
    			});
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: ${iVersionID}.`);    			
    		});

    		it("should throw an exception if the root item to be replaced has a different predecessor than the new item", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			oPersistencyMock.Item.getItem.and.returnValue({
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1,
    				"PREDECESSOR_ITEM_ID" : 0
    			});
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item must not change its position on import.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: 1; Calculation Version Id: ${iVersionID}.`);    			
    		});

    		it("should throw an exception if two items have the same PREDECESSOR_ITEM_ID", function() {
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[2].PREDECESSOR_ITEM_ID = aRequestBody[1].ITEM_ID;
    			aRequestBody[3].PREDECESSOR_ITEM_ID = aRequestBody[1].ITEM_ID;
    
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Item structure to be created is not a valid tree structure. It contains loops by having two items with the same predecessor id. Predecessor Id: -1.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);    			
    		});

    		it("should throw an exception if items do not belong to the same calculation version", function(){
    			// arrange		
    			var aRequestBody = createValidRequestBody();
    			aRequestBody[2].CALCULATION_VERSION_ID = iVersionID + 1;
    
    
    			var oRequest = createRequest(aRequestBody,$.net.http.POST);
    
    			var exception;
    
    			// act
    			try{
    				var result = oItemValidator.validate(oRequest, mValidatedParameters );	
    			}catch(e){
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Some items in the request body reference another calculation version as the first item in the array.";
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Items: -2.`);
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect(exception.details.messageTextObj).toBe(sClientMessage);
    		});

			it("should throw an exception if the calculation version referenced by the items is not opened in the users session", function(){
				// arrange		
				var aRequestBody = createValidRequestBody();
				oPersistencyMock.CalculationVersion.isOpenedInSessionAndContext.and.returnValue(false);
				var oRequest = createRequest(aRequestBody,$.net.http.POST);

				var exception;

				// act
				try{
					var result = oItemValidator.validate(oRequest, mValidatedParameters );	
				}catch(e){
					exception = e;
				}

				// assert	
				expect(exception).toBeDefined();
				const sClientMessage = "Calculation Version not opened in current session.";
				expect(exception.developerMessage).toBe(sClientMessage);
				expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Id: ${aRequestBody[0].CALCULATION_VERSION_ID}.`);
			});

			it("should throw an exception if the category of the root item is subject to change for update", function(){
				// arrange		
				var aRequestBody = createValidRequestBody();
				aRequestBody[0].ITEM_CATEGORY_ID = 1;
				var oRequest = createRequest(aRequestBody, $.net.http.PUT);

				oPersistencyMock.Item.getItem.and.returnValue(_.extend({}, aRequestBody, {
					ITEM_CATEGORY_ID : 0
				}));

				var exception;

				// act
				try {
					var result = oItemValidator.validate(oRequest, mValidatedParameters);
				} catch (e) {
					exception = e;
				}

				// assert	
				expect(exception).toBeDefined();
				const sClientMessage = "Item category of root item should not be changed.";
			    expect(exception.developerMessage).toBe(sClientMessage);
			    expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Item Id: ${aRequestBody[0].ITEM_ID}, Calculation Version Id: ${aRequestBody[0].CALCULATION_VERSION_ID}.`);
			});

			it("should throw an exception if items are send to request with mode 'normal' and they have different positive PARENT_ITEM_ID", function(){
				// arrange
    			var oRequest = createRequest(createInValidRequestBodyWithDifferentPositiveParentItemId(), $.net.http.POST);
    			mValidatedParameters.mode = "normal";
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
    			const sClientMessage = "Item structure to be created is not valid since 'normal' mode does not allow to create structure with more then one positive parent.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);    			
			});
			
			it("should throw an exception if items are send to request with mode 'normal' and there are multiple items with the same ITEM_IDs", function(){
				// arrange
    			var oRequest = createRequest(createInValidRequestBodyWithTheSameItemId(), $.net.http.POST);
    			mValidatedParameters.mode = "normal";
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
    			const sClientMessage = "Item structure cannot be created since 'normal' mode does not allow to send items with same ITEM_IDs.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);    			
			});
			
			it("should return validated items if items are send to request with mode 'normal' and they have same positive PARENT_ITEM_ID", function(){
				// arrange
				var aRequestBody = createValidRequestBodyWithSamePositiveParentItemId();
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			mValidatedParameters.mode = "normal";
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).not.toBeDefined();
    			expect(result.length).toBe(3);
    			expect(result).toEqual(aRequestBody);
			});
			
			it("should throw an exception if local content value is not between 0 and 100", function() {
    			// arrange		
    			var aRequestBody = [{
					"CALCULATION_VERSION_ID" : iVersionID,
					"IS_ACTIVE" : 1,
					"ITEM_CATEGORY_ID" : constants.ItemCategory.CalculationVersion,
					"ITEM_DESCRIPTION" : "Pump Precision 100",
					"ITEM_ID" : 1,
					"PARENT_ITEM_ID" : null,
					"PREDECESSOR_ITEM_ID" : null,
					"LOCAL_CONTENT" : 105
				}];
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			expect(exception.code).toBe(Code.GENERAL_VALIDATION_ERROR);
    			
    		});
		});
		
		describe("tests for checkReferecedCalculationVersion", function() {
			
			var mValidatedParameters = {
					"calculate" : true,
					'mode' : 'replace'
			};
			
    		it("should return validated item if no self-reference exists (create item - POST)", function() {
    			// arrange		
    			oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.and.returnValue({"CONTROLLING_AREA_ID" : 1000});
    			var aRequestCreateBody = [ {
    				"REFERENCED_CALCULATION_VERSION_ID" : 2,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			var oRequest = createRequest(aRequestCreateBody, $.net.http.POST);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions).toHaveBeenCalled();
    			expect(result.length).toBe(1);
    			expect(result).toEqual(aRequestCreateBody);
    		});

    		it("should throw an exception if self-reference exists (create item - POST)", function() {
    			// arrange
    			var aRequestBody = [ {
    				"REFERENCED_CALCULATION_VERSION_ID" : iVersionID,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions).not.toHaveBeenCalled();
    			expect(exception).toBeDefined();
    			expect(exception.code.code).toBe("REFERENCED_CALCULATION_VALIDATION_ERROR");
    			const sClientMessage = `The selected calculation version cannot be referenced because this would lead to a circular dependency.`
    					+ ` Please select another calculation version.`;
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Selected Calculation Version Id: 1234.`);    			
    		});
			
			mValidatedParameters = {
					"calculate" : true
			};
		
    		it("should return validated item if no self-reference exists", function() {
    			// arrange		
    			oPersistencyMock.Item.getItems.and.returnValue([{
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1, 
    				"ITEM_CATEGORY_ID" : 3,
					"CHILD_ITEM_CATEGORY_ID" : 3
    			}]);
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1,
					"REFERENCED_CALCULATION_VERSION_ID" : 2
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert	
    			expect(result.length).toBe(1);
    			expect(result).toEqual(aRequestBody);
    		});
    		
    		it("should return validated items if no self-reference exists (in case of using batch operation)", function() {
    			// arrange		
    			oPersistencyMock.Item.getItems.and.returnValue([{
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1, 
    				"ITEM_CATEGORY_ID" : 3,
					"CHILD_ITEM_CATEGORY_ID" : 3
    			},{
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 200",
    				"ITEM_ID" : 2, 
    				"ITEM_CATEGORY_ID" : 3,
					"CHILD_ITEM_CATEGORY_ID" : 3
    			}]);
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1,
					"REFERENCED_CALCULATION_VERSION_ID" : 2
    			},{
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 2,
					"REFERENCED_CALCULATION_VERSION_ID" : 3
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert	
    			expect(result.length).toBe(2);
    			expect(result).toEqual(aRequestBody);
    		});

    		it("should throw an exception if mandatory property REFERENCED_CALCULATION_VERSION_ID is missing", function() {
    			// arrange
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1
				} ];
    
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			const sClientMessage = "Mandatory property REFERENCED_CALCULATION_VERSION_ID is missing (business object: Item)."
    					+ " The mandatory properties are ITEM_ID,CALCULATION_VERSION_ID,REFERENCED_CALCULATION_VERSION_ID.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(sClientMessage);	
    		});

    		it("should throw an exception if REFERENCED_CALCULATION_VERSION_ID is not a positive integer", function() {
    			// arrange
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1,
					"REFERENCED_CALCULATION_VERSION_ID" : -1
				} ];
    
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			expect(exception.code).toEqual(Code.GENERAL_VALIDATION_ERROR);
    		});
    		
    		it("should throw an exception if self-reference exists", function() {
    			// arrange
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1,
					"REFERENCED_CALCULATION_VERSION_ID" : iVersionID
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(exception).toBeDefined();
    			expect(exception.code.code).toBe("REFERENCED_CALCULATION_VALIDATION_ERROR");
    			const sClientMessage = "The selected calculation version cannot be referenced because this would lead to a circular dependency."
						+ " Please select another calculation version.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Selected Calculation Version Id: 1234.`);
    		});
    		
    		it("should throw an exception if the user does not have the instance-based READ privilege for the referenced version", function() {
    			// arrange		
    			oPersistencyMock.Item.getItems.and.returnValue([{
    				"CALCULATION_VERSION_ID" : iVersionID,
    				"IS_ACTIVE" : 1,
    				"ITEM_DESCRIPTION" : "Pump Precision 100",
    				"ITEM_ID" : 1, 
    				"ITEM_CATEGORY_ID" : 3
    			}]);
    			var aRequestBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : 1,
					"REFERENCED_CALCULATION_VERSION_ID" : 2
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.PUT);
                var exception;
                
                //let the authorization check fail
                itemValidatorLibrary.authorizationManager.checkPrivilege.and.callFake(function(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection) {
                    throw new PlcException(Code.GENERAL_ACCESS_DENIED, "", {});
                });
                
    			// act		
    			try{
    			    var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			}catch(e){
    			    exception = e;
    			}
    			
    			// assert	
    			expect(exception).toBeDefined();
    			expect(itemValidatorLibrary.authorizationManager.checkPrivilege).toHaveBeenCalled();
    			expect(exception.code.code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
    		});
		});
		
		describe("tests for checkControllingAreaOfReferecedCalculationVersion", function() {
			
			var mValidatedParameters = {
					"calculate" : true,
					'mode' : 'updatemasterdataandprices'
			};
			
    		it("should not check for controlling area if no item of type referenced version exist in request", function() {
    			// arrange		
    			var aRequestCreateBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 2,
					"CHILD_ITEM_CATEGORY_ID" : 2,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			var oRequest = createRequest(aRequestCreateBody, $.net.http.POST);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).not.toHaveBeenCalled();
    			expect(result.length).toBe(1);
    			expect(result).toEqual(aRequestCreateBody);
    		});

    		it("should throw an exception if controlling area (default settings) of calculation version not found in projects", function() {
    			// arrange
    			var aRequestBody = [ {
    				"REFERENCED_CALCULATION_VERSION_ID" : 2,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalledWith(1234, true);
    			expect(exception).toBeDefined();
    			expect(exception.code.code).toBe("GENERAL_ENTITY_NOT_FOUND_ERROR");
    			const sClientMessage = "Default settings for calculation version not found in project.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Calculation Version Id: 1234.`);    			
    		});
    		 		
    		it("should return validated item if controlling area of referenced calculation version is the same with controlling area of calculation version", function() {
    			// arrange		
    			var aRequestCreateBody = [ {
    				"REFERENCED_CALCULATION_VERSION_ID" : 2,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.and.returnValue({"CONTROLLING_AREA_ID" : 1000});
    			oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions.and.returnValue([1000]);
    			
    			var oRequest = createRequest(aRequestCreateBody, $.net.http.POST);
    
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.calls.count()).toEqual(1);
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions.calls.count()).toEqual(1);
    			expect(result.length).toBe(1);
    			expect(result).toEqual(aRequestCreateBody);
    		});
    		
    		it("should return validated items (in case of cut / copy / paste)", function() {
    			// This test simulates the copy / paste of 3 items (1 Material and 2 Referenced Versions).
    			// For items of type ReferencedVersion CONTROLLING_AREA_ID of Referenced Versions 
    			// should be the same as controlling area of the version where the new item is added to.
    			
    			// arrange	
    			var aRequestCreateBody = [ {
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 2,
					"CHILD_ITEM_CATEGORY_ID" : 2,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				},{ 
    				"REFERENCED_CALCULATION_VERSION_ID" : 2,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -2,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : -1
    			},{
    				"REFERENCED_CALCULATION_VERSION_ID" : 3,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"CHILD_ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -3,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" :-1
    			} ];
    			
    			oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.and.returnValue({"CONTROLLING_AREA_ID" : 1000});
    			oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions.and.returnValue([1000]);
    			
    			var oRequest = createRequest(aRequestCreateBody, $.net.http.POST);
    			
    			// act		
    			var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			
    			// assert	
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.calls.count()).toEqual(1);
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions.calls.count()).toEqual(1);
    			expect(result.length).toBe(3);
    			expect(result).toEqual(aRequestCreateBody);
    		});
    		
    		it("should throw an exception if controlling area of the referenced version is a different one " +
    				"than the controlling area of the version where the new item is added to", function() {
    			// arrange
    			var aRequestBody = [ {
    				"REFERENCED_CALCULATION_VERSION_ID" : 2,
					"CALCULATION_VERSION_ID" : iVersionID,
					"ITEM_CATEGORY_ID" : 10,
					"ITEM_ID" : -1,
					"IS_ACTIVE" : 1,
					"PARENT_ITEM_ID" : 1
				} ];
    			
    			oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion.and.returnValue({"CONTROLLING_AREA_ID" : 1000});
    			oPersistencyMock.CalculationVersion.getControllingAreasForCalculationVersions.and.returnValue([2000]);
    			
    			var oRequest = createRequest(aRequestBody, $.net.http.POST);
    			var exception;
    
    			// act
    			try {
    				var result = oItemValidator.validate(oRequest, mValidatedParameters);
    			} catch (e) {
    				exception = e;
    			}
    
    			// assert	
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalled();
    			expect(oPersistencyMock.CalculationVersion.getProjectPropertiesForCalculationVersion).toHaveBeenCalledWith(1234, true);
    			expect(exception).toBeDefined();
    			expect(exception.code.code).toBe("DIFFERENT_CONTROLLING_AREA_IN_TARGET_CALCULATION_VERSION");
    			
    			const sClientMessage = "Different controlling areas in referenced and opened calculation versions.";
    			expect(exception.developerMessage).toBe(sClientMessage);
    			expect($.trace.error).toHaveBeenCalledWith(`${sClientMessage} Referenced calculation version: 2000; current opened calculation version: 1000.`);
    		});
			
		});
		
	}).addTags(["All_Unit_Tests"]);
}