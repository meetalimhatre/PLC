if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.service.calculationVersionService-tests', function() {
		var CalculationVersionService =  require("../../../lib/xs/service/calculationVersionService");
		var ServiceParameters = require("../../../lib/xs/util/constants").ServiceParameters;
		
		var MessageLibrary = require("../../../lib/xs/util/message");
		var PlcException = MessageLibrary.PlcException;
		var oPersistencyMock;
		var ServiceOutput = require("../../../lib/xs/util/serviceOutput");

		describe("addCalculatedValuesToOutput", function() {	
		    var oServiceOutput;
		    var iValidVersionId = 333;
		    var oValidatedRequestContent;

			beforeEach(function() {
				oResponseMock = jasmine.createSpyObj("oResponseMock", ["setBody"]);

				oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", ["getConnection"]);
				oPersistencyMock.getConnection.and.returnValue({
					commit : function(){
					}
				});
				
    			oServiceOutput = new ServiceOutput();
    			oValidatedRequestContent = {
						parameters : {
						    calculate : true
						}
					};
    			
    			var oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [ "getCalculationResults", "isFrozen", "isDirty", "getSavedCalculationResults" , "addCurrencyUnitsToCalculationResults"]);
    			oPersistencyCalculationVersionMock.isFrozen.and.returnValue(false);
    			oPersistencyCalculationVersionMock.isDirty.and.returnValue(true);
    			oPersistencyCalculationVersionMock.getCalculationResults.and.callFake(function(iCalculationVersionId){
    				return {
    					ITEM_CALCULATED_PRICES: [{
    						CALCULATION_VERSION_ID : iCalculationVersionId
    					    }],
    					ITEM_CALCULATED_VALUES_COSTING_SHEET: [],
    					ITEM_CALCULATED_VALUES_COMPONENT_SPLIT: [],
    					ERRORS: ""
    				};
    			});
    			oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;
			});
			
				it("should calculate for version in request.parameters.id ", function() {
					//arrange	
					oValidatedRequestContent.parameters.id = iValidVersionId;

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("should calculate for version in request.data.CALCULATION_VERSION_ID", function() {
					//arrange	
					oValidatedRequestContent.data = [{
						    CALCULATION_VERSION_ID : iValidVersionId
					}];

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("[action=copy] should calculate for version not in request, but in response.transactionaldata[0].CALCULATION_VERSION_ID", function() {
					//arrange	
					oValidatedRequestContent.parameters.id = 12345;
					oValidatedRequestContent.parameters.action = ServiceParameters.Copy;
					
					oServiceOutput.setTransactionalData(
					    {
					        CALCULATION_VERSION_ID : iValidVersionId
					    }
					);

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("should calculate for version in response.transactionaldata[0].CALCULATION_VERSION_ID", function() {
					//arrange	
					oValidatedRequestContent.data = [];
					
					oServiceOutput.setTransactionalData(
					    {
					        CALCULATION_VERSION_ID : iValidVersionId
					    }
					);

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("should calculate for version in response.transactionaldata.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID", function() {
					//arrange	
					oValidatedRequestContent.data = [];
					
					oServiceOutput.setTransactionalData(
					    { CALCULATION_VERSIONS : [
					                { CALCULATION_VERSION_ID : iValidVersionId }
					            ]
					    }
					);

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("should calculate for version in response.transactionaldata[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID", function() {
					//arrange	
					oValidatedRequestContent.data = [
					    { CALCULATION_ID :- 1,
					      CALCULATION_VERSIONS : [
					                { CALCULATION_VERSION_ID : -1 }
					            ]
					    }
					];
					
					oServiceOutput.setTransactionalData(
					    { CALCULATION_ID : 1,
					      CALCULATION_VERSIONS : [
					                { CALCULATION_VERSION_ID : iValidVersionId }
					            ]
					    }
					);

					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
	
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
				});
				
				it("should throw exception if version id could not be identified", function() {
					//arrange	
					oServiceOutput.setTransactionalData(
					    { }
					);

					var exception = null;

					// act
					try {
						CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
							$.session.getUsername(), $.session.getUsername());
					} catch (e) {
						exception = e;
					}

					// assert
					expect(exception instanceof PlcException).toBe(true);
					expect(exception.code.code).toBe('GENERAL_UNEXPECTED_EXCEPTION');
				});

				it("should handle the FAKE_CUSTOM_BOOL Warning code by replacing it with the CALCULATIONENGINE_INVALID_CUSTOM_OVERHEAD_FIELD_REFERENCE", function(){
					//arrange

					let oPersistencyCalculationVersionMock = jasmine.createSpyObj("oPersistencyCalculationVersionMock", [ "getCalculationResults", "isFrozen", "isDirty", "getSavedCalculationResults" , "addCurrencyUnitsToCalculationResults"]);
					oPersistencyCalculationVersionMock.getCalculationResults.and.callFake(function(iCalculationVersionId){
						return {
							ITEM_CALCULATED_PRICES: [{
								CALCULATION_VERSION_ID : iCalculationVersionId
								}],
							ITEM_CALCULATED_VALUES_COSTING_SHEET: [],
							ITEM_CALCULATED_VALUES_COMPONENT_SPLIT: [],
							ERRORS: [{
								CALCULATION_VERSION_ID : iCalculationVersionId,
								ERROR_CODE: 4,
								ERROR_DETAILS: '"columnId":"FAKE_CUSTOM_BOOL"',
								ITEM_ID: 1
							}]
						};
					});

					oPersistencyMock.CalculationVersion = oPersistencyCalculationVersionMock;

					oServiceOutput.setTransactionalData(
					    { CALCULATION_ID : 1,
					      CALCULATION_VERSIONS : [
					                { CALCULATION_VERSION_ID : iValidVersionId }
					            ]
					    }
					);


					//act
					CalculationVersionService.addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistencyMock,
						$.session.getUsername(), $.session.getUsername());
					//assert
					expect(oServiceOutput.payload.body.calculated.ITEM_CALCULATED_FIELDS[0].CALCULATION_VERSION_ID).toBe(iValidVersionId);
					expect(oServiceOutput.payload.head.messages.length).toBe(1);
					expect(oServiceOutput.payload.head.messages[0].code).toBe("CALCULATIONENGINE_COSTING_SHEET_OVERHEAD_ROW_FORMULA_DIVISION_BY_ZERO_WARNING");	

				});
		});
	}).addTags(["All_Unit_Tests"]);
}
