var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../../testdata/testdata").data;
var MessageLibrary = require("../../../../lib/xs/util/message");
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
var messageCode = MessageLibrary.Code;

describe('db.calculationmanager.procedures:p_item_determine_dependent_fields',function() {

	var mockstar = null;
	var sessionId = 'testsession';
	var calcVersionId = 1;
	var controllingAreaId = testData.oCompanyCodeTestDataPlc.CONTROLLING_AREA_ID[0];

	var cv1 = calcVersionId;
	var s1 = sessionId;
	var pt1 = testData.oPlantTestDataPlc.PLANT_ID[0];
	var cc1 = testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0];
	var ptT = 'PTX'; // temporary plant
	var cc2 = testData.oCostCenterTestDataPlc.COST_CENTER_ID[3];

	var oItemTemporary = {
			SESSION_ID :                           [   s1,    s1,   s1,   s1,   s1,   s1],
			CALCULATION_VERSION_ID :               [  cv1,   cv1,  cv1,  cv1,  cv1,  cv1],
			MATERIAL_ID:						   [ '10',  null, null, null, testData.oMaterialTestDataPlc.MATERIAL_ID[0], null],
			ACTIVITY_TYPE_ID:					   [ '10',  null, null, null, null, null],
			PROCESS_ID:				   			   [ '10',  null, null, null, null, null],
			PLANT_ID:							   [ pt1,   null,  pt1,  ptT, testData.oMaterialPlantTestDataPlc.PLANT_ID[0], null],
			COMPANY_CODE_ID:					   [ cc1,    cc1, null, null, null, null],
			COST_CENTER_ID:					       [ null,  null, null, null, null, null],
			ITEM_ID :                              [    1,     2,    3,    4,    5,    6],
			PARENT_ITEM_ID :                       [ null,     1,    2,    2,    2,    2],
			ITEM_CATEGORY_ID :                     [  "2",   "2",  "1",  "1",  "2", "3"],
			CHILD_ITEM_CATEGORY_ID :               [  "2",   "2",  "1",  "1",  "2", "3"],
			ITEM_DESCRIPTION:   				   ['Des', 'Des','Des','Des','Des','Des'],
			IS_ACTIVE :                            [    1,     1,    1,    1,    1,    1],
			TOTAL_QUANTITY_DEPENDS_ON :            ["1.0000000",     "1.0000000",    "1.0000000",    "1.0000000",    "1.0000000"],
			TOTAL_QUANTITY :                       [ "10.0000000",    "20.0000000",   "40.0000000",   "60.0000000",    "70.0000000"],
			ACCOUNT_ID :                      	   [ "50",  "50", "40", "40", "40", "40"],
			QUANTITY:             				   [ null, "4.0000000",    "5.0000000",    "6.0000000", null],
			QUANTITY_UOM_ID:      				   [ null,  "St", "St", "St", "St", null],
			TOTAL_QUANTITY_UOM_ID :                [ "S0",  "S0", "S0", "S0", "S0", "S0"],
			PRICE_FIXED_PORTION:                   ["1.0000000",     "1.0000000",    "1.0000000",    "1.0000000",    "1.0000000"],
			PRICE_VARIABLE_PORTION:                ["0.0000000",     "0.0000000",    "0.0000000",    "0.0000000",    "0.0000000"],
			TRANSACTION_CURRENCY_ID:               ['EUR', 'EUR','EUR','EUR','EUR','EUR'],
			PRICE_UNIT:                            ["1.0000000",     "1.0000000",    "1.0000000",    "1.0000000",    "1.0000000"],
			PRICE_UNIT_UOM_ID:                     ['EUR', 'EUR','EUR','EUR','EUR','EUR'],
			WORK_CENTER_ID:						   [ null,  null, null, null, null, null],
			WORK_CENTER_CATEGORY:				   [ null,  null, null, null, null, null],
            EFFICIENCY: 						   [ null,  null, null, null, null, null],
            MATERIAL_TYPE_ID:                      [ null,  null, null, null, testData.oMaterialTestDataPlc.MATERIAL_TYPE_ID[0], null],
            MATERIAL_GROUP_ID:                     [ null,  null, null, null, testData.oMaterialTestDataPlc.MATERIAL_GROUP_ID[1], null],
            OVERHEAD_GROUP_ID:                     [ null,  null, null, null, 'OG9', null],
            VALUATION_CLASS_ID:                    [ null,	null, null, null, null, null],
            DOCUMENT_TYPE_ID:   		           [ null,  null, null, null, testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0], null], 
			DOCUMENT_ID:  			               [ null,  null, null, null, testData.oDocumentTestDataPlc.DOCUMENT_ID[0], null], 
			DOCUMENT_VERSION:  	 		           [ null,  null, null, null, testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0], null], 
			DOCUMENT_PART:   		               [ null,  null, null, null, testData.oDocumentTestDataPlc.DOCUMENT_PART[0], null],
			DOCUMENT_STATUS_ID:   		           [ null,  null, null, null, testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[0], null],
			DESIGN_OFFICE_ID:           		   [ null,	null, null, null, testData.oDocumentTestDataPlc.DESIGN_OFFICE_ID[0], null]
	};

	var existingMatTexts = testData.oMaterialTextTestDataPlc;

	// Procedure inputs:     0:1st item with existing material |1:2nd item with existing material|2: item with non-updated material|3: plant updated
	var oItemInputTestData = {
			ITEM_ID: 					[	   oItemTemporary.ITEM_ID[0],      oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[2], oItemTemporary.ITEM_ID[4]],
			MATERIAL_ID: 				[existingMatTexts.MATERIAL_ID[5],existingMatTexts.MATERIAL_ID[6],                      null, oItemTemporary.MATERIAL_ID[2], oItemTemporary.MATERIAL_ID[4]],
			MATERIAL_TYPE_ID:			[                           null,                           null,                      null, null, null], 
			MATERIAL_GROUP_ID:			[                           null,                           null,                      null, null, null], 
			IS_PHANTOM_MATERIAL:		[                           null,                           null,                      null, null, null], 
			IS_CONFIGURABLE_MATERIAL:	[                           null,                           null,                      null, null, null], 
			DOCUMENT_TYPE_ID:   		[                           null,                           null,                      null, null, null], 
			DOCUMENT_ID:  				[                           null,                           null,                      null, null, null], 
			DOCUMENT_VERSION:  	 		[                           null,                           null,                      null, null, null], 
			DOCUMENT_PART:   			[                           null,                           null,                      null, null, null], 
			DOCUMENT_STATUS_ID:			[                           null,                           null,                      null, null, null], 
			PLANT_ID: 					[     oItemTemporary.PLANT_ID[0],     oItemTemporary.PLANT_ID[1],                      null, oItemTemporary.PLANT_ID[2], oItemTemporary.PLANT_ID[4]],
			COMPANY_CODE_ID:			[                            cc1,                            cc1,                      cc1,  null, null],
			ITEM_DESCRIPTION:   		[                          'Des',                           'Des',                    'Des', 'Desc', 'Desc'],
			VALUATION_CLASS_ID: 		[                           null,                           null,                      null, null, null], 
			OVERHEAD_GROUP_ID: 			[                           null,                           null,                      null, null, null], 
			DESIGN_OFFICE_ID:			[                           null,                           null,                      null, null, null],
			COST_CENTER_ID:             [                            cc2,                           null,                      null, null, null],
			WORK_CENTER_ID:             [                           null, 							null,					   null, null, null],
			WORK_CENTER_CATEGORY:		[                           null, 							null,					   null, null, null],
			EFFICIENCY:					[							null, 							null,					   null, null, null],
			VALUATION_CLASS_ID:         [                           null, 							null,					   null, null, null],
			ACTIVITY_TYPE_ID: 			[oItemTemporary.ACTIVITY_TYPE_ID[0], 	oItemTemporary.ACTIVITY_TYPE_ID[1], oItemTemporary.ACTIVITY_TYPE_ID[2], oItemTemporary.ACTIVITY_TYPE_ID[3], oItemTemporary.ACTIVITY_TYPE_ID[4]],
			ITEM_CATEGORY_ID:			[							'2',		oItemTemporary.ITEM_CATEGORY_ID[1], oItemTemporary.ITEM_CATEGORY_ID[2], oItemTemporary.ITEM_CATEGORY_ID[3], oItemTemporary.ITEM_CATEGORY_ID[4]],
			PROCESS_ID: 				[	oItemTemporary.PROCESS_ID[0], 		oItemTemporary.PROCESS_ID[1],		oItemTemporary.PROCESS_ID[2], 		oItemTemporary.PROCESS_ID[3], 		oItemTemporary.PROCESS_ID[4]],
		};

	var existingActTexts = testData.oActivityTypeTextTestDataPlc;
	
	var oActivityItemInputTestData = {
			ITEM_ID: 					[oItemTemporary.ITEM_ID[5], oItemTemporary.ITEM_ID[4]],
			ACTIVITY_TYPE_ID:			[existingActTexts.ACTIVITY_TYPE_ID[1], existingActTexts.ACTIVITY_TYPE_ID[4]],
			ITEM_CATEGORY_ID: 			[oItemTemporary.ITEM_CATEGORY_ID[5], oItemTemporary.ITEM_CATEGORY_ID[4]]
	};

	var existingDocTexts = testData.oDocumentTextTestDataPlc;

	var oDocumentItemInputTestData = {
			ITEM_ID: 					[oItemTemporary.ITEM_ID[0]],
			DOCUMENT_ID:				[existingDocTexts.DOCUMENT_ID[6]],
			DOCUMENT_VERSION:			[existingDocTexts.DOCUMENT_VERSION[6]],
			DOCUMENT_PART:				['1'],
			DOCUMENT_TYPE_ID:			['DT5'],
			ITEM_CATEGORY_ID:			['1']
	};

	var existingProcTexts = testData.oProcessTextTestDataPlc;
	var existingWorkCenterTexts = testData.oWorkCenterTextTestDataPlc;

	var oProcessItemInputTestData = {
		ITEM_ID: 						[oItemTemporary.ITEM_ID[5], oItemTemporary.ITEM_ID[5], oItemTemporary.ITEM_ID[5]],
		PROCESS_ID:						[existingProcTexts.PROCESS_ID[6], existingProcTexts.PROCESS_ID[6], null],
		WORK_CENTER_ID: 				[existingWorkCenterTexts.WORK_CENTER_ID[4], null, existingWorkCenterTexts.WORK_CENTER_ID[4]],
		PLANT_ID:						[testData.oMaterialPlantTestDataPlc.PLANT_ID[0], testData.oMaterialPlantTestDataPlc.PLANT_ID[0], testData.oMaterialPlantTestDataPlc.PLANT_ID[0]],
		ITEM_CATEGORY_ID: 				['5', '5', '5']
	};
	
	const oCompanyCodeOtherControllingArea = {
												"COMPANY_CODE_ID" : 'CC5',
												"CONTROLLING_AREA_ID" : '#CA1',
												"COMPANY_CODE_CURRENCY_ID" : 'EUR',
												"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
												"_SOURCE" : 1
											 };
	
	const oPlantOtherControllingArea = {
											"PLANT_ID" : 'PL5',
											"COMPANY_CODE_ID" : 'CC5',
											"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
											"_SOURCE" :1
									   };
	
	const oMaterialPlantOtherControllingArea = {
													"MATERIAL_ID" : 'MAT1',
													"PLANT_ID" : 'PL5',
													"OVERHEAD_GROUP_ID":  null,
													"VALUATION_CLASS_ID": 'V1',
													"_VALID_FROM" : '2015-01-01T15:39:09.691Z',
													"_SOURCE" : 1
												};
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		var oItemExtInputTestData = {
				ITEM_ID: 		     [oItemTemporary.ITEM_ID[0], oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[2], oItemTemporary.ITEM_ID[4]],
				CCEN_DATE_MANUAL:    [                     null,                      null,                      null,                     null, null ],
	    		CCEN_DATE_UNIT:      [                     null,                      null,                      null,                     null, null ],
	    		CMAT_STRING_MANUAL:  [          'Test String 8',           'Test String 9',           'Test String 10',          'Test String 11', 'Test String 12'],
	    		CMAT_STRING_UNIT:    [                     null,                      null,                      null,                     null, null ],
	    		CMPL_INTEGER_MANUAL: [                        8,                         9,                         10,                      11, null ],
	    		CMPL_INTEGER_UNIT:   [                     null,                      null,                      null,                     null, null ],
	    		CWCE_DECIMAL_MANUAL: [  			"10.0000000",              "20.0000000",              "30.0000000",             "40.0000000", null],
	    		CWCE_DECIMAL_UNIT:   [                     null,                      null,                      null,                     null, null ]
		
		}
		oItemInputTestData = _.extend(oItemInputTestData, oItemExtInputTestData);
	}
	
	function runAndCheck(oInput, oToMatchDataInput){
		var procedure = mockstar.loadProcedure();
		var result = procedure([oInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

		var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);
		expect(oEntity).toMatchData(oToMatchDataInput, ["ITEM_ID"]);		
	};

	beforeOnce(function() {
		mockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_determine_dependent_fields",   // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						activity_type: {
							name: "sap.plc.db::basis.t_activity_type",
							data: testData.oActivityTypeTestDataPlc
						},
						activity_type__text: {
							name:"sap.plc.db::basis.t_activity_type__text",
							data: testData.oActivityTypeTextTestDataPlc
						},
						process: {
							name: "sap.plc.db::basis.t_process",
							data: testData.oProcessTestDataPlc
						},
						process__text: {
							name:"sap.plc.db::basis.t_process__text",
							data: testData.oProcessTextTestDataPlc
						},
						company_code: {
							name: "sap.plc.db::basis.t_company_code",
							data: testData.oCompanyCodeTestDataPlc
						},	
						document_material: {
							name: "sap.plc.db::basis.t_document_material",
							data: testData.oDocumentMaterialTestData
						},				    	
						item_temporary: {
							name: "sap.plc.db::basis.t_item_temporary",
							data: oItemTemporary
						},
						material: {
							name: "sap.plc.db::basis.t_material",
							data: testData.oMaterialTestDataPlc
						},						
						material__text: {
							name: "sap.plc.db::basis.t_material__text",
							data: testData.oMaterialTextTestDataPlc
						},
						material_type : {
							name: "sap.plc.db::basis.t_material_type",
							data: testData.oMaterialTypeTestDataPlc
						},
						material_group : {
							name: "sap.plc.db::basis.t_material_group",
							data: testData.oMaterialGroupTestDataPlc
						},
						document : {
							name: "sap.plc.db::basis.t_document",
							data: testData.oDocumentTestDataPlc
						},
						document__text : {
							name: "sap.plc.db::basis.t_document__text",
							data: testData.oDocumentTextTestDataPlc
						},
						document_status : {
							name: "sap.plc.db::basis.t_document_status",
							data: testData.oDocumentStatusTestDataPlc
						},
						document_type : {
						    name: "sap.plc.db::basis.t_document_type",
						    data: testData.oDocumentTypeTestDataPlc
						},
						plant: {
							name: "sap.plc.db::basis.t_plant",
							data:  testData.oPlantTestDataPlc
						},
						material_plant: {
							name: "sap.plc.db::basis.t_material_plant",
							data:  testData.oMaterialPlantTestDataPlc
						},
						session: {
							name: "sap.plc.db::basis.t_session",
							data: testData.oSessionTestData
						},
						overhead_group: {
							name: "sap.plc.db::basis.t_overhead_group",
							data:  testData.oOverheadGroupTestDataPlc
						},
						valuation_class: {
							name: "sap.plc.db::basis.t_valuation_class",
							data:  testData.oValuationClassTestDataPlc
						},
						design_office: {
							name: "sap.plc.db::basis.t_design_office",
							data:  testData.oDesignOfficeTestDataPlc
						},
						cost_center: {
							name: "sap.plc.db::basis.t_cost_center",
							data:  testData.oCostCenterTestDataPlc
						},
						work_center: {
							name: "sap.plc.db::basis.t_work_center",
							data:  testData.oWorkCenterTestDataPlc
						},
						work_center__text: {
							name: "sap.plc.db::basis.t_work_center__text",
							data:  testData.oWorkCenterTextTestDataPlc
						},
						material_ext : "sap.plc.db::basis.t_material_ext",
						material_plant_ext: "sap.plc.db::basis.t_material_plant_ext",
						cost_center_ext:  "sap.plc.db::basis.t_cost_center_ext",
						item_temporary_ext:  "sap.plc.db::basis.t_item_temporary_ext"
					}
				}
		);
	});

	afterOnce(function(){				
		mockstar.cleanupMultiple(["sap.plc.db.calculationmanager.procedures", "sap.plc.db.calculationmanager.views"]);
	});

	beforeEach(function() {
		mockstar.clearAllTables();
		if(jasmine.plcTestRunParameters.generatedFields === true){
			mockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
			mockstar.insertTableData("material_plant_ext", testData.oMaterialPlantExtTestDataPlc);
			mockstar.insertTableData("cost_center_ext", testData.oCostCenterExtTestDataPlc);
		}
		mockstar.initializeData();
	});


	// NOTE (RF): the tested procedure is dealing with version masterdata entities; because of the amount of different cases we did not implemented tests for
	// the masterdata timestamp handling

	describe("item_description-is-affected", function(){

		describe("item category: material", function(){
			it('1 old item with existing material updated: material_id updated to existing Id --> dependent item_description set to existing description', function() {
				//arrange
				console.log(oItemInputTestData);
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);

				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [   oItemTemporary.ITEM_ID[0]],
					ITEM_DESCRIPTION:  [  existingMatTexts.MATERIAL_DESCRIPTION[5]]
				}, ["ITEM_ID", "ITEM_DESCRIPTION"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [oItemTemporary.ITEM_ID[0]],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code]
				}, ["MSG_ID","ITEM_ID"]);
			});
			
			it('1 old item with existing material has item_description updated: material_id not update --> dependent item_description set from database', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([4]);
				oItemsInput[0].ITEM_DESCRIPTION = 'New Description';
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [oItemTemporary.ITEM_ID[4]],
					ITEM_DESCRIPTION:  [existingMatTexts.MATERIAL_DESCRIPTION[1]]
				}, ["ITEM_ID"]);
			});
	
			it('1 old item with temporary material updated: material_id updated to existing Id --> dependent item_description set to database value', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([1]);
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [   oItemTemporary.ITEM_ID[1]],
					ITEM_DESCRIPTION:  [  existingMatTexts.MATERIAL_DESCRIPTION[6]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [oItemTemporary.ITEM_ID[1]],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code]
				}, ["MSG_ID","ITEM_ID"]);
			});
			
			it('1 new item updated: material_id updated to existing Id --> dependent item_description set to database value', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);
				
				var newItemId = -1;
				oItemsInput[0].ITEM_ID = newItemId;
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  newItemId],
					ITEM_DESCRIPTION:  [  existingMatTexts.MATERIAL_DESCRIPTION[5]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [newItemId, newItemId],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code,
								 messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code]
				}, ["MSG_ID","ITEM_ID"]);
			});
			
			it('1 old item updated: material_id updated to non-existing (temporary) Id --> dependent item_description taken from input', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);
				oItemsInput[0].MATERIAL_ID = 'False_MAT';
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[0]],
					ITEM_DESCRIPTION:  [  oItemInputTestData.ITEM_DESCRIPTION[0]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [oItemTemporary.ITEM_ID[0]],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code]
				}, ["MSG_ID","ITEM_ID"]);
			});
	
			it('1 old item updated: material_id updated to null --> dependent item_description taken from input', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);
				oItemsInput[0].MATERIAL_ID = null;
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[0]],
					ITEM_DESCRIPTION:  [  oItemInputTestData.ITEM_DESCRIPTION[0] ]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [oItemTemporary.ITEM_ID[0]],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code]
				}, ["MSG_ID","ITEM_ID"]);
			});
			
			it('2 old items updated: 1st and 2nd material updated to existing Id --> dependent item_description set to database value for both materials', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0, 1]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [ oItemTemporary.ITEM_ID[0], oItemTemporary.ITEM_ID[1]],
					ITEM_DESCRIPTION:  [ existingMatTexts.MATERIAL_DESCRIPTION[5], existingMatTexts.MATERIAL_DESCRIPTION[6]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [ oItemTemporary.ITEM_ID[0] , oItemTemporary.ITEM_ID[1] ],
					"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code, messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
				}, ["MSG_ID","ITEM_ID"]);
			});	
	
			it('2 old items updated: 1st material updated to existing Id, 2nd material not updated --> dependent item_description set to database value only for updated material', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0, 2]);
				
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[0],  oItemInputTestData.ITEM_ID[2]],
					ITEM_DESCRIPTION:  [  existingMatTexts.MATERIAL_DESCRIPTION[5],  oItemInputTestData.ITEM_DESCRIPTION[2]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [ oItemTemporary.ITEM_ID[0] ],
					"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
				}, ["MSG_ID","ITEM_ID"]);
			});
	
			it('1 new item updated and 1 old item not changed --> dependent item_description set to database value', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0, 2]);
				
				var newItemId = -1;
				oItemsInput[0].ITEM_ID = newItemId;
	
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
	
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  newItemId,  oItemInputTestData.ITEM_ID[2] ],
					ITEM_DESCRIPTION:  [  existingMatTexts.MATERIAL_DESCRIPTION[5], oItemInputTestData.ITEM_DESCRIPTION[2]]
				}, ["ITEM_ID"]);
				
				var oMessages = Array.slice(result.OT_MESSAGES);
				expect(oMessages).toMatchData({
					"ITEM_ID":  [ newItemId, newItemId],
					"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code, 
								 messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code
								]
				}, ["MSG_ID","ITEM_ID"]);
			});
		});

		describe("item_category:_activity", function(){
			it('1 old item with existing activity updated: activity_type_id updated to existing Id --> dependent item_description set to database value', function() {
				//arrange
				console.log(oActivityItemInputTestData);
				var oItemsInput = new TestDataUtility(oActivityItemInputTestData).getObjects([0]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [   oItemTemporary.ITEM_ID[5]],
					ITEM_DESCRIPTION:  [  existingActTexts.ACTIVITY_TYPE_DESCRIPTION[1]]
				}, ["ITEM_ID"]);
				
			});

			it('1 old item with existing activity updated: activity_type_id updated to existing Id with _valid_to different than null --> dependent item_description set to null ', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oActivityItemInputTestData).getObjects([1]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[4]],
					ITEM_DESCRIPTION:  [  null]
				}, ["ITEM_ID"]);
				
			});

			it('1 old item updated: activity_type_id updated to non-existing (temporary) Id --> dependent item_description taken from input ', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oActivityItemInputTestData).getObjects([1]);
				oItemsInput[0].ACTIVITY_TYPE_ID = 'False_ACT';
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[4]],
					ITEM_DESCRIPTION:  [  null]
				}, ["ITEM_ID"]);
				
			});
		});

		describe("item_category: document", function(){
			it('1 old item with existing document updated: document_id updated to existing Id --> dependent item_description set to database value', function() {
				//arrange
				console.log(oDocumentItemInputTestData);
				var oItemsInput = new TestDataUtility(oDocumentItemInputTestData).getObjects([0]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [ oItemTemporary.ITEM_ID[0]],
					ITEM_DESCRIPTION:  [ existingDocTexts.DOCUMENT_DESCRIPTION[6]]
				}, ["ITEM_ID"]);
			});

			it('1 old item updated: document_id updated to non-existing (temporary) Id --> dependent item_description taken from input ', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oDocumentItemInputTestData).getObjects([0]);
				oItemsInput[0].DOCUMENT_ID = 'False_DOC';
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[0]],
					ITEM_DESCRIPTION:  [  null]
				}, ["ITEM_ID"]);
			});
		});
		
		describe("item_category: process", function(){
			it('1 old item with existing process updated: process_id and work_center_id updated to existing Id --> dependent item_description set to database value', function() {
				//arrange
				mockstar.clearTable("item_temporary");
				oItemTemporary.ITEM_CATEGORY_ID[5] = "5";
				mockstar.insertTableData("item_temporary", oItemTemporary);

				console.log(oProcessItemInputTestData);
				var oItemsInput = new TestDataUtility(oProcessItemInputTestData).getObjects([0]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [ oItemTemporary.ITEM_ID[5]],
					ITEM_DESCRIPTION:  [ existingProcTexts.PROCESS_DESCRIPTION[6] + ' - ' + existingWorkCenterTexts.WORK_CENTER_DESCRIPTION[4]]
				}, ["ITEM_ID"]);
			});

			it('1 old item with existing process updated: process_id updated to existing id, work_center_id updated to non existing id--> dependent item_description set to database value', function() {
				//arrange
				mockstar.clearTable("item_temporary");
				oItemTemporary.ITEM_CATEGORY_ID[5] = "5";
				mockstar.insertTableData("item_temporary", oItemTemporary);

				var oItemsInput = new TestDataUtility(oProcessItemInputTestData).getObjects([1]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [ oItemTemporary.ITEM_ID[5]],
					ITEM_DESCRIPTION:  [ existingProcTexts.PROCESS_DESCRIPTION[6]]
				}, ["ITEM_ID"]);
			})

			it('1 old item with existing process updated: process_id updated to non existing id, work_center_id updated to existing id--> dependent item_description set to database value', function() {
				//arrange
				mockstar.clearTable("item_temporary");
				oItemTemporary.ITEM_CATEGORY_ID[5] = "5";
				mockstar.insertTableData("item_temporary", oItemTemporary);

				var oItemsInput = new TestDataUtility(oProcessItemInputTestData).getObjects([2]);
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [ oItemTemporary.ITEM_ID[5]],
					ITEM_DESCRIPTION:  [ existingWorkCenterTexts.WORK_CENTER_DESCRIPTION[4]]
				}, ["ITEM_ID"]);
			})

			it('1 old item updated: process_id and work_center_id updated to non-existing (temporary) Id --> dependent item_description taken from input ', function() {
				//arrange
				var oItemsInput = new TestDataUtility(oProcessItemInputTestData).getObjects([0]);
				oItemsInput[0].PROCESS_ID = 'False_Proc';
				oItemsInput[0].WORK_CENTER_ID = 'False_Work';
				//act
				var procedure = mockstar.loadProcedure();
				var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
				
				//assert
				var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
				expect(oEntity).toMatchData({
					ITEM_ID:           [  oItemTemporary.ITEM_ID[5]],
					ITEM_DESCRIPTION:  [  null]
				}, ["ITEM_ID"]);
			});
		});
	});

	describe("document fields affected", function(){
		it('1 new item updated: material_id set to null --> dependent document fields not set', function() {
			//arrange
			var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);
			var newItemId = -1;
			oItemsInput[0].ITEM_ID = newItemId;
			oItemsInput[0].MATERIAL_ID = null;

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:          [  newItemId],
				DOCUMENT_TYPE_ID: [  null],
				DOCUMENT_ID:      [  null],
				DOCUMENT_VERSION: [  null],
				DOCUMENT_PART:    [  null]
			}, ["ITEM_ID"]);
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [newItemId],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('1 old item updated: material_id updated to existing Id --> dependent document fields set', function() {
			//arrange
			var oItemsInput = new TestDataUtility(oItemInputTestData).getObjects([0]);

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure(oItemsInput, calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:            [  oItemInputTestData.ITEM_ID[0]],
				DOCUMENT_TYPE_ID:  	[  testData.oDocumentMaterialTestData.DOCUMENT_TYPE_ID[0]],
				DOCUMENT_ID:  		[  testData.oDocumentMaterialTestData.DOCUMENT_ID[0]],
				DOCUMENT_VERSION:  	[  testData.oDocumentMaterialTestData.DOCUMENT_VERSION[0]],
				DOCUMENT_PART:  	[  testData.oDocumentMaterialTestData.DOCUMENT_PART[0]]
			}, ["ITEM_ID"]);	
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [oItemTemporary.ITEM_ID[0]],
				"MSG_ID": 	[messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code]
			}, ["MSG_ID","ITEM_ID"]);
		});

		it('1 old item updated: material_id updated to existing Id 2 documents are available --> newest document selected and values set', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oDocumentMaterialTestData.MATERIAL_ID[2], // for this material exist 2 docments
				IS_PHANTOM_MATERIAL: 1
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_TYPE_ID: [testData.oDocumentMaterialTestData.DOCUMENT_TYPE_ID[2]], // newest document in test data
				DOCUMENT_ID: [testData.oDocumentMaterialTestData.DOCUMENT_ID[2]],
				DOCUMENT_VERSION: [testData.oDocumentMaterialTestData.DOCUMENT_VERSION[2]],
				DOCUMENT_PART: [testData.oDocumentMaterialTestData.DOCUMENT_PART[2]]
			});
		});
		
		it('1 old item updated : DOCUMENT ID is removed -> document related fields are not modified(document becomes temporary)', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID : null,
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID], // newest document in test data
				DOCUMENT_ID: [null],
				DOCUMENT_VERSION: [testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0]],
				DOCUMENT_PART: [testData.oDocumentTestDataPlc.DOCUMENT_PART[0]]
			});
		});
		
		it('1 old item updated : DOCUMENT PART is removed -> document related fields are not modified(document becomes temporary)', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID : testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: null
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID], // newest document in test data
				DOCUMENT_ID: [testData.oDocumentTestDataPlc.DOCUMENT_ID[0]],
				DOCUMENT_VERSION: [testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0]],
				DOCUMENT_PART: [null]
			});
		});
		
		it('document id changed -> all document related fields are reset', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID], // newest document in test data
				DOCUMENT_TYPE_ID: [testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0]],
				DOCUMENT_ID: [testData.oDocumentTestDataPlc.DOCUMENT_ID[0]],
				DOCUMENT_VERSION: [testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0]],
				DOCUMENT_PART: [testData.oDocumentTestDataPlc.DOCUMENT_PART[0]],
				DOCUMENT_STATUS_ID: [testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[0]],
				DESIGN_OFFICE_ID: [testData.oDocumentTestDataPlc.DESIGN_OFFICE_ID[0]]
			});
		});
		
		it('document status id is cleared -> document type id and other document related fields are unchanged', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
			    DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0],
				DOCUMENT_STATUS_ID: null,
				DESIGN_OFFICE_ID: testData.oDocumentTestDataPlc.DESIGN_OFFICE_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID], // newest document in test data
				DOCUMENT_TYPE_ID: [testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0]],
				DOCUMENT_ID: [testData.oDocumentTestDataPlc.DOCUMENT_ID[0]],
				DOCUMENT_VERSION: [testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0]],
				DOCUMENT_PART: [testData.oDocumentTestDataPlc.DOCUMENT_PART[0]],
				DOCUMENT_STATUS_ID: [null],
				DESIGN_OFFICE_ID: [testData.oDocumentTestDataPlc.DESIGN_OFFICE_ID[0]]
			});
		});
	});

	describe("company_code_id is affected", function(){
		it('1 old item updated: plant_id updated to existing id --> dependent company_code_id set', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemInputTestData).getObject(1);
			oItemInput.PLANT_ID = testData.oPlantTestDataPlc.PLANT_ID[0]; // changed plant id

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				PLANT_ID:  		[  oItemInput.PLANT_ID],   						// should be set as in input
				COMPANY_CODE_ID:[  testData.oPlantTestDataPlc.COMPANY_CODE_ID[0]] 	// should be defined as dependent from plant
			}, ["ITEM_ID"]);
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID, oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code, 
					messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('1 new item updated: plant_id set to existing id --> dependent company_code_id set', function() {
			//arrange
			var newItemId = -1;
			var oItemInput = new TestDataUtility(oItemInputTestData).getObject(1);
			oItemInput.ITEM_ID = newItemId;
			oItemInput.PLANT_ID = testData.oPlantTestDataPlc.PLANT_ID[0]; // changed plant id

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([ oItemInput ], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				PLANT_ID:  		[  oItemInput.PLANT_ID],   						// should be set as in input
				COMPANY_CODE_ID:[  testData.oPlantTestDataPlc.COMPANY_CODE_ID[0]] 	// should be defined as dependent from plant
			}, ["ITEM_ID"]);
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID, oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code,
					 messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('1 new item updated: plant_id set to existing id which is not valid for controlling area that is set in  cv --> dependent company_code_id is not changed', function() {
			//arrange
			const newItemId = -1;
			const oItemInput = new TestDataUtility(oItemInputTestData).getObject(1);
			oItemInput.ITEM_ID = newItemId;
			oItemInput.PLANT_ID = oPlantOtherControllingArea.PLANT_ID; // changed plant id
			mockstar.insertTableData("company_code", oCompanyCodeOtherControllingArea);
			mockstar.insertTableData("plant", oPlantOtherControllingArea);
			
			//act
			const procedure = mockstar.loadProcedure();
			const result = procedure([ oItemInput ], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			const oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				PLANT_ID:  		[  oItemInput.PLANT_ID],   						// should be set as in input
				COMPANY_CODE_ID:[  oItemInput.COMPANY_CODE_ID] 	
			}, ["ITEM_ID"]);
			
			const oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('1 old item updated: plant_id updated from existing to temporary id --> company_code_id not changed', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemInputTestData).getObject(1);
			oItemInput.PLANT_ID = 'PTT'; // changed plant id to temporary
			
			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				PLANT_ID:  		[  oItemInput.PLANT_ID],   				// should be set as in input
				COMPANY_CODE_ID:[  oItemTemporary.COMPANY_CODE_ID[1]] 		// should not be changed
			}, ["ITEM_ID"]);
			
			// compared to the data base state, the material_id was set to MAT7 for oItemInput; for this reason the message is expected
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
	});
	
	describe("plant_id is affected", function(){
		it('1 old item updated: company_code_id changed to existing Id --> plant_id set to null if it was not temporary', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemInputTestData).getObject(3); // item with non-temporary plant 
			oItemInput.COMPANY_CODE_ID = testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]; // changed company code

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				COMPANY_CODE_ID:[  oItemInput.COMPANY_CODE_ID],		// should be as in request
				PLANT_ID:		[  null]									// plant id set to ''
			}, ["ITEM_ID"]);	
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('1 old item updated: company_code_id changed to existing Id --> plant_id not changed if it was temporary', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemInputTestData).getObject(3); // item with non-temporary plant 
			oItemInput.PLANT_ID = "PTT"; // change to temporary plant
			oItemInput.COMPANY_CODE_ID = testData.oCompanyCodeTestDataPlc.COMPANY_CODE_ID[0]; // changed company code

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [  oItemInput.ITEM_ID],
				COMPANY_CODE_ID:[  oItemInput.COMPANY_CODE_ID],			// should be as in request
				PLANT_ID:		[  oItemInput.PLANT_ID]	// plant id not changed
			}, ["ITEM_ID"]);	

			expect(result.OT_MESSAGES.length).toEqual(0); // No message should be generated
		});
	});
	
	describe("is_phantom_material is affected", function(){
		
		it('material_id updated to existing Id --> dependent is_phantom_material set', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(oBaseInput, {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_PHANTOM_MATERIAL:[  testData.oMaterialTestDataPlc.IS_PHANTOM_MATERIAL[5]]
			});				
		});

		it('material_id updated to existing Id and is_phantom_material updated --> is_phantom_material set to input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[3], // material with is_phantom_material = null
				IS_PHANTOM_MATERIAL : 1
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_PHANTOM_MATERIAL:[ 1 ]
			});				
		});
				
		it('material_id set to non-existing id (temporary material) --> dependent is_phantom_material no modified', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				IS_PHANTOM_MATERIAL: 1,
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_PHANTOM_MATERIAL: [ 1 ]
			});
		});
		
		it('is_phantom_material set from input --> dependent is_phantom_material is modified', function(){
		    var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
		    runAndCheck(_.extend(oBaseInput, { // material with is_phantom_material = 1
				IS_PHANTOM_MATERIAL : 0
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_PHANTOM_MATERIAL:[ 0 ]
			});				
		});
	});

	describe("is_configurable_material is affected", function(){
		
		it('material_id updated to existing Id --> dependent is_configurable_material set', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(oBaseInput, {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_CONFIGURABLE_MATERIAL:[  testData.oMaterialTestDataPlc.IS_PHANTOM_MATERIAL[5]]
			});					
		});
		
		it('material_id updated to existing Id and is configurable material updated --> dependent is_configurable_material set to input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[3], // material with is_phantom_material = null
				IS_CONFIGURABLE_MATERIAL : 1
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_CONFIGURABLE_MATERIAL:[ 1 ]
			});				
		});
		
		it('material_id set to non-existing id (temporary material) --> dependent is_configurable_material not modified', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				IS_CONFIGURABLE_MATERIAL: 1,
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_CONFIGURABLE_MATERIAL: [ 1 ]
			});	
		});
		
		it('is_configurable_material set from input --> dependent is_configurable_material is modified', function(){
		    var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
		    runAndCheck(_.extend(oBaseInput, { // material with is_configurable_material = 1
				IS_CONFIGURABLE_MATERIAL : 0
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				IS_CONFIGURABLE_MATERIAL:[ 0 ]
			});				
		});
	});
	
	describe("material_type_id is affected", function() {
		it('material_id set to existing id --> material_type_id set to material_type_id from t_material', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[0],
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_TYPE_ID: [testData.oMaterialTestDataPlc.MATERIAL_TYPE_ID[0]]
			});
		});
		
		it('material_id and material type id set to existing id --> material_type_id set to input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[3], // for material_type_id is null
				MATERIAL_TYPE_ID : testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1] // valid value (masterdata!), to ensure that it is not null initially 
			}), {
				ITEM_ID: 			[ oBaseInput.ITEM_ID ],
				MATERIAL_ID:        [ testData.oMaterialTestDataPlc.MATERIAL_ID[3] ],
				MATERIAL_TYPE_ID: 	[ testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1] ]
			});
		});
		
		it('material_type_id is set to existing id --> material_type_id set to material_type_id from t_material_type ', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_TYPE_ID : testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1] // valid value (masterdata!), to ensure that it is not null initially 
			}), {
				ITEM_ID: 			[ oBaseInput.ITEM_ID ],
				MATERIAL_TYPE_ID: 	[ testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1]]
			});
		});
		
		it('material_id set to non-existing id (temporary material) --> material_type_id from input kept if it does exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				MATERIAL_TYPE_ID: testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_TYPE_ID: [testData.oMaterialTypeTestDataPlc.MATERIAL_TYPE_ID[1]]
			});
		});

		it('material_id set to non-existing id (temporary material) --> material_type_id set to null if it does not exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				MATERIAL_TYPE_ID: "XYZ"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_TYPE_ID: [null]
			});
		});
	});
	
	describe("material_group_id is affected", function() {
		it('material_id set to existing id --> material_group_id set to material_group_id from t_material', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[0],
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_GROUP_ID: [testData.oMaterialTestDataPlc.MATERIAL_GROUP_ID[0]]
			});
		});
		
		it('material_id and material_group_id set to existing id --> material_group_id set to input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[3], // for material_type_id is null
				MATERIAL_GROUP_ID : testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1] // valid value (masterdata!), to ensure that it is not null initially 
			}), {
				ITEM_ID: 			[ oBaseInput.ITEM_ID ],
				MATERIAL_GROUP_ID: 	[ testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1] ]
			});
		});
		
		it('material_group_id is set to existing id --> material_group_id set to material_group_id from t_material_group ', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_GROUP_ID : testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[2] // valid value (masterdata!), to ensure that it is not null initially 
			}), {
				ITEM_ID: 			[ oBaseInput.ITEM_ID ],
				MATERIAL_GROUP_ID: 	[ testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[2]]
			});
		});
		
		it('material_id set to non-existing id (temporary material) --> material_group_id from input kept if it does exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				MATERIAL_GROUP_ID: testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_GROUP_ID: [testData.oMaterialGroupTestDataPlc.MATERIAL_GROUP_ID[1]]
			});
		});

		it('material_id set to non-existing id (temporary material) --> material_group_id set to null if it does not exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: "TEMP",
				MATERIAL_GROUP_ID: "XYZ"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				MATERIAL_TYPE_ID: [null]
			});
		});
	});
	
	describe("document_status_id is affected", function() {
		it('set to existing document --> document_status_id is set from t_document', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				"DOCUMENT_TYPE_ID": testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				"DOCUMENT_ID": testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				"DOCUMENT_VERSION": testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				"DOCUMENT_PART": testData.oDocumentTestDataPlc.DOCUMENT_PART[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[0]]
			});
		});
		
		it('set to existing document --> document_status_id is set to null if this is the value in t_document', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[4], // document_status_id is null for this document
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[4],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[4],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[4],
				DOCUMENT_STATUS_ID : testData.oDocumentStatusTestDataPlc.DOCUMENT_STATUS_ID[4] // valid status for document type DT5
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [ null ]
			});
		});
		
		it('set document_status_id to existing document_status --> document_status_id is set from t_document_status', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
			    DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0],
				DOCUMENT_STATUS_ID: testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[2]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[2]]
			});
		});
		
		it('set document_status_id to non-valid --> document_status_id is set to last valid value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
			    DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0],
                DOCUMENT_STATUS_ID:  "TM" 
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [ testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[0] ]
			});
		});

		it('set to non-existing document --> document_status_id from input kept if it does exist for document_type_id', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID: "XYZ",
				DOCUMENT_TYPE_ID: "DT1",
				DOCUMENT_STATUS_ID: testData.oDocumentStatusTestDataPlc.DOCUMENT_STATUS_ID[0] // _valid_to is not set and therewith still valid
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [testData.oDocumentStatusTestDataPlc.DOCUMENT_STATUS_ID[0]]
			});
		});

		it('set to non-existing document_id --> document_status_id set to null if it does not exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID: "TEMP",
				DOCUMENT_TYPE_ID: "DT1",
				DOCUMENT_STATUS_ID: "XY"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_STATUS_ID: [null]
			});
		});
		
		it('set document type id--> document_status_id is kept if it is a valid value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				"DOCUMENT_TYPE_ID": testData.oDocumentTypeTestDataPlc.DOCUMENT_TYPE_ID[4],
				"DOCUMENT_ID": testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				"DOCUMENT_VERSION": testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				"DOCUMENT_PART": testData.oDocumentTestDataPlc.DOCUMENT_PART[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DOCUMENT_TYPE_ID: [testData.oDocumentTypeTestDataPlc.DOCUMENT_TYPE_ID[4]],
				DOCUMENT_STATUS_ID: [testData.oDocumentTestDataPlc.DOCUMENT_STATUS_ID[0]]
			});
		});
	});
	
	describe("overhead_group_id is affected", function() {		
		it('set material_id to non-existing material and plant+material to existing combination in t_material_plant --> overhead_group_id set from t_material_plant', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				"MATERIAL_ID": testData.oMaterialPlantTestDataPlc.MATERIAL_ID[0],
				"PLANT_ID": testData.oMaterialPlantTestDataPlc.PLANT_ID[0],
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [testData.oMaterialPlantTestDataPlc.OVERHEAD_GROUP_ID[0]]
			});
		});
		
		it('set plant+material and overhead_group_id to existing combination in t_material_plant --> overhead_group_id set to input value if it exists in t_overhead_group', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[3],
				PLANT_ID: testData.oMaterialPlantTestDataPlc.PLANT_ID[3],
				OVERHEAD_GROUP_ID : testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [ testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0] ]
			});
		});
		
		it('set overhead_group_id --> overhead_group_id is set if this is a valid value in t_overhead_groups', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				OVERHEAD_GROUP_ID : testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [ testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]]
			});
		});
		
		it('set overhead_group_id to non existing id  --> overhead_group_id is to null if it is not a valid value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				OVERHEAD_GROUP_ID : "09"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [ null ]
			});
		});
		
		it('set existing material and overhead group but non-existing plant+material combination in t_material_plant --> overhead_group_id set to input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[1],
				PLANT_ID: testData.oMaterialPlantTestDataPlc.PLANT_ID[0],
				OVERHEAD_GROUP_ID : testData.oMaterialPlantTestDataPlc.OVERHEAD_GROUP_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [ testData.oMaterialPlantTestDataPlc.OVERHEAD_GROUP_ID[0] ]
			});
		});

		it('set material_id to non-existing material and to non-existing plant+material combination --> overhead_group_id from input kept if it does exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: null,
				OVERHEAD_GROUP_ID: testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0] // _valid_to is not set and therewith still valid
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [testData.oOverheadGroupTestDataPlc.OVERHEAD_GROUP_ID[0]]
			});
		});

		it('set to non-existing plant+material combination --> overhead_group_id set to null if it does not exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[0],
				PLANT_ID: null,
				OVERHEAD_GROUP_ID: "XY"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				OVERHEAD_GROUP_ID: [null]
			});
		});
	});
	
	describe("valuation_class_id is affected", function() {		
		it('set valuation class and plant+material to existing combination in t_material_plant --> valuation_class_id set from t_valuation_classes', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[3],
				PLANT_ID: testData.oMaterialPlantTestDataPlc.PLANT_ID[3],
				VALUATION_CLASS_ID : testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [ testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[0] ]
			});
		});
		
		it('set plant+material to existing combination in t_material_plant --> valuation_class_id set set to null if this is the value in t_material_plant', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				"MATERIAL_ID": testData.oMaterialPlantTestDataPlc.MATERIAL_ID[0],
				"PLANT_ID": testData.oMaterialPlantTestDataPlc.PLANT_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [testData.oMaterialPlantTestDataPlc.VALUATION_CLASS_ID[0]]
			});
		});
		
		it('set valuation_class_id --> valuation_class_id is set if this is a valid value in t_valuation_class', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				VALUATION_CLASS_ID : testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[1]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [ testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[1]]
			});
		});
		
		it('set valuation_class_id to non existing id  --> valuation_class_id is null', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				VALUATION_CLASS_ID : testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[2]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [ null ]
			});
		});
		
		it('set existing material and valuation class but non-existing plant+material combination in t_material_plant --> valuation_class_id set input value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[1],
				PLANT_ID: testData.oMaterialPlantTestDataPlc.PLANT_ID[0],
				VALUATION_CLASS_ID : testData.oMaterialPlantTestDataPlc.VALUATION_CLASS_ID[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [ testData.oMaterialPlantTestDataPlc.VALUATION_CLASS_ID[0] ]
			});
		});

		it('set to non-existing plant+material combination --> valuation_class_id from input kept if it does exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: null,
				VALUATION_CLASS_ID: testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[0] // _valid_to is not set and therewith still valid
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[0]]
			});
		});

		it('set plant+material to existing combination in t_material_plant --> valuation_class_id from input kept because plant is assigned no other controlling area', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			mockstar.insertTableData("company_code", oCompanyCodeOtherControllingArea);
			mockstar.insertTableData("plant", oPlantOtherControllingArea);
			mockstar.insertTableData("material_plant", oMaterialPlantOtherControllingArea);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: oMaterialPlantOtherControllingArea.MATERIAL_ID,
				PLANT_ID: oMaterialPlantOtherControllingArea.PLANT_ID,
				VALUATION_CLASS_ID : testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[1]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [ testData.oValuationClassTestDataPlc.VALUATION_CLASS_ID[1] ]
			});
		});

		it('set to non-existing plant+material combination --> overhead_group_id set to null if it does not exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				MATERIAL_ID: testData.oMaterialPlantTestDataPlc.MATERIAL_ID[0],
				PLANT_ID: null,
				VALUATION_CLASS_ID: "XY"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				VALUATION_CLASS_ID: [null]
			});
		});
	});
	
	describe("design_office_id is affected", function() {		
		
		it('set document --> design_office_id set from t_document', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: [testData.oDocumentTestDataPlc.DESIGN_OFFICE_ID[0]]
			});
		});
		
		it('set document --> design_office_id set to null if this is the value in t_document', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[4],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[4],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[4],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[4]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: [ null ]
			});
		});
		
		it('set design_office_id --> design_office_id set from t_design_office', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(4);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[0],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[0],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[0],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[0],
				DESIGN_OFFICE_ID: testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[1]
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: [testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[1]]
			});
		});
		
		it('set design_office_id to non existing id --> design_office_id is set to temporary new value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_TYPE_ID: testData.oDocumentTestDataPlc.DOCUMENT_TYPE_ID[3],
				DOCUMENT_ID: testData.oDocumentTestDataPlc.DOCUMENT_ID[3],
				DOCUMENT_VERSION: testData.oDocumentTestDataPlc.DOCUMENT_VERSION[3],
				DOCUMENT_PART: testData.oDocumentTestDataPlc.DOCUMENT_PART[3],
				DESIGN_OFFICE_ID: "LB9"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: ['LB9']
			});
		});

		it('set to non-existing document --> design_office_id from input kept if it does exist', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID: "XYZ",
				DESIGN_OFFICE_ID: testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[0] // _valid_to is not set and therewith still valid
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: [testData.oDesignOfficeTestDataPlc.DESIGN_OFFICE_ID[0]]
			});
		});

		it('set to non-existing document --> design_office_id set to temporary new value', function() {
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
			runAndCheck(_.extend(oBaseInput, {
				DOCUMENT_ID: "XYZ",
				DESIGN_OFFICE_ID: "XY"
			}), {
				ITEM_ID: [oBaseInput.ITEM_ID],
				DESIGN_OFFICE_ID: ['XY']
			});
		});
	});
	
	if(jasmine.plcTestRunParameters.generatedFields === true){
		
		describe("set custom fields", function() {		
			
			it('set material id --> custom field CMAT_STRING_MANUAL set from t_material_ext', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[0]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMAT_STRING_MANUAL: [testData.oMaterialExtTestDataPlc.CMAT_STRING_MANUAL[0]],
					CMAT_STRING_UNIT: [testData.oMaterialExtTestDataPlc.CMAT_STRING_UNIT[0]]
				});
			});
			
			it('material id remains the same --> custom field CMAT_STRING_MANUAL is not changed', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: oItemInputTestData.MATERIAL_ID[3]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMAT_STRING_MANUAL: [oItemInputTestData.CMAT_STRING_MANUAL[3]],
					CMAT_STRING_UNIT: [oItemInputTestData.CMAT_STRING_UNIT[3]]
				});
			});
			
			it('set material id, set plant_id --> custom field CMPL_INTEGER_MANUAL set from t_material_plant_ext', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[1],
					PLANT_ID: testData.oPlantTestDataPlc.PLANT_ID[2]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMPL_INTEGER_MANUAL: [testData.oMaterialPlantExtTestDataPlc.CMPL_INTEGER_MANUAL[1]],
					CMPL_INTEGER_UNIT: [testData.oMaterialPlantExtTestDataPlc.CMPL_INTEGER_UNIT[1]]
				});
			});
			
			it('set material id, plant id is the same --> custom field CMPL_INTEGER_MANUAL set from t_material_plant_ext', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: testData.oMaterialTestDataPlc.MATERIAL_ID[0],
					PLANT_ID: pt1
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMPL_INTEGER_MANUAL: [testData.oMaterialPlantExtTestDataPlc.CMPL_INTEGER_MANUAL[0]],
					CMPL_INTEGER_UNIT: [testData.oMaterialPlantExtTestDataPlc.CMPL_INTEGER_UNIT[0]]
				});
			});
			
			it('material id is the same, set plant id --> custom field CMPL_INTEGER_MANUAL is not changed because no entry(combination) was found in t_material_plant_ext', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: oItemInputTestData.MATERIAL_ID[3],
					PLANT_ID: testData.oPlantTestDataPlc.PLANT_ID[2]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMPL_INTEGER_MANUAL: [oItemInputTestData.CMPL_INTEGER_MANUAL[3]],
					CMPL_INTEGER_UNIT: [oItemInputTestData.CMPL_INTEGER_UNIT[3]]
				});
			});
			
			it('material id, plant id remains the same --> custom field CMPL_INTEGER_MANUAL is not changed because nothing changed', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					MATERIAL_ID: oItemInputTestData.MATERIAL_ID[3],
					PLANT_ID: oItemInputTestData.PLANT_ID[3]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CMPL_INTEGER_MANUAL: [oItemInputTestData.CMPL_INTEGER_MANUAL[3]],
					CMPL_INTEGER_UNIT: [oItemInputTestData.CMPL_INTEGER_UNIT[3]]
				});
			});
			
			it('set cost center id --> custom field CCEN_DATE_MANUAL set from t_cost_center_ext', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					COST_CENTER_ID: cc2
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CCEN_DATE_MANUAL: [new Date (testData.oCostCenterExtTestDataPlc.CCEN_DATE_MANUAL[3])],
					CCEN_DATE_UNIT: [testData.oCostCenterExtTestDataPlc.CCEN_DATE_UNIT[3]]
				});
			});
			
			it('set cost center id to temporary cost center --> custom field CCEN_DATE_MANUAL is not changed', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					COST_CENTER_ID: "CC21"
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CCEN_DATE_MANUAL: [oItemInputTestData.CCEN_DATE_MANUAL[3]],
					CCEN_DATE_UNIT: [oItemInputTestData.CCEN_DATE_UNIT[3]]
				});
			});
			
			it('cost center id remains the same --> custom field CCEN_DATE_MANUAL is not changed', function() {
				var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(3);
				runAndCheck(_.extend(oBaseInput, {
					COST_CENTER_ID: oItemInputTestData.COST_CENTER_ID[3]
				}), {
					ITEM_ID: [oBaseInput.ITEM_ID],
					CCEN_DATE_MANUAL: [oItemInputTestData.CCEN_DATE_MANUAL[3]],
					CCEN_DATE_UNIT: [oItemInputTestData.CCEN_DATE_UNIT[3]]
				});
			});			
		});		
	}
	
	describe("work center determination", function(){
		var oItemTemporaryWC = {
				SESSION_ID :                           [   s1,    s1,   s1,   s1],
				CALCULATION_VERSION_ID :               [  cv1,   cv1,  cv1,  cv1],
				MATERIAL_ID:						   [ '10',  null, null, null],
				ACTIVITY_TYPE_ID:					   [ '10',  null, null, null],
				PROCESS_ID:				   [ '10',  null, null, null],
				PLANT_ID:							   [ pt1,   null,  pt1,  ptT],
				COMPANY_CODE_ID:					   [ cc1,    cc1, null, null],
				COST_CENTER_ID:					       [ null,  null, null, null],
				ITEM_ID :                              [    1,     2,    3,    4],
				PARENT_ITEM_ID :                       [ null,     1,    2,    2],
				ITEM_CATEGORY_ID :                     [  "1",   "1",  "1",  "1"],
				ITEM_DESCRIPTION:   				   ['Des', 'Des','Des','Des'],
				IS_ACTIVE :                            [    1,     1,    1,    1],
				TOTAL_QUANTITY_DEPENDS_ON :             [    1,     1,    1,    1],
				TOTAL_QUANTITY :                       ["10.0000000",    "20.0000000",   "40.0000000",   "60.0000000"],
				ACCOUNT_ID :                      	   [ "50",  "50", "40", "40"],
				QUANTITY:             [ null, "4.0000000",    "5.0000000",    "6.0000000"],
				QUANTITY_UOM_ID:      [ null,  "St", "St", "St"],
				TOTAL_QUANTITY_UOM_ID :                [ "S0",  "S0", "S0", "S0"],
				PRICE_FIXED_PORTION:                   ["1.0000000",     "1.0000000",    "1.0000000",    "1.0000000"],
				PRICE_VARIABLE_PORTION:                ["0.0000000",     "0.0000000",    "0.0000000",    "0.0000000"],
				TRANSACTION_CURRENCY_ID:         ['EUR', 'EUR','EUR','EUR'],
				PRICE_UNIT:                            ["1.0000000",     "1.0000000",    "1.0000000",    "1.0000000"],
				PRICE_UNIT_UOM_ID:                     ['EUR', 'EUR','EUR','EUR'],
				WORK_CENTER_ID:						   [ 'WC',  'WC', 'WC', 'WC'],
				WORK_CENTER_CATEGORY:				   ['WCC', 'WCC','WCC','WCC'],
				EFFICIENCY: 						   [ null,  null, null, null]
		};
		
		var oItemWCInputTestData = {
				ITEM_ID: 					[	   oItemTemporary.ITEM_ID[0],      oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[1], oItemTemporary.ITEM_ID[2]],
				MATERIAL_ID: 				[     						null,							null,                      null, 					null],
				MATERIAL_TYPE_ID:			[                           null,                           null,                      null, 					null], 
				MATERIAL_GROUP_ID:			[                           null,                           null,                      null, null], 
				IS_PHANTOM_MATERIAL:		[                           null,                           null,                      null, null], 
				IS_CONFIGURABLE_MATERIAL:	[                           null,                           null,                      null, null], 
				DOCUMENT_TYPE_ID:   		[                           null,                           null,                      null, null], 
				DOCUMENT_ID:  				[                           null,                           null,                      null, null], 
				DOCUMENT_VERSION:  	 		[                           null,                           null,                      null, null], 
				DOCUMENT_PART:   			[                           null,                           null,                      null, null], 
				DOCUMENT_STATUS_ID:			[                           null,                           null,                      null, null], 
				PLANT_ID: 					[     oItemTemporary.PLANT_ID[0],     oItemTemporary.PLANT_ID[1],                      null, oItemTemporary.PLANT_ID[2]],
				COMPANY_CODE_ID:			[                            cc1,                            cc1,                      cc1,  null],
				ITEM_DESCRIPTION:   		[                          'Des',                           'Des',                    'Des', 'Desc'],
				OVERHEAD_GROUP_ID: 			[                           null,                           null,                      null, null], 
				VALUATION_CLASS_ID: 		[                           null,                           null,                      null, null], 
				OVERHEAD_GROUP_ID: 			[                           null,                           null,                      null, null], 
				DESIGN_OFFICE_ID:			[                           null,                           null,                      null, null],
				COST_CENTER_ID:             [                           cc2,                            null,                      null, null],
				WORK_CENTER_ID:				[ 							'WC',  							'WC', 					   'WC', 'WC'],
				WORK_CENTER_CATEGORY:		[						   'WCC', 							'WCC',					  'WCC','WCC'],
				EFFICIENCY:					[                           null,                           null,                      null, null],
				ACTIVITY_TYPE_ID: 			[                           null,                           null,                      null, null],
				ITEM_CATEGORY_ID:			[                           '1',                            '1',                        '1',  '1'],
				PROCESS_ID: 				[                           null,                           null,                      null, null],
		};
		
		oItemWCInputTestData = _.extend(oItemWCInputTestData, oItemExtInputTestData);
		
		beforeEach(function() {
			mockstar.clearTable("item_temporary");
			mockstar.insertTableData("item_temporary", oItemTemporaryWC);
		});
		
		it('work center and plant changed to an existing work center -> cost_center, work_center_category changed to corresponding existing Id', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemWCInputTestData).getObject(2); 
			oItemInput.MATERIAL_ID = null; 
			oItemInput.WORK_CENTER_ID = 'WC3'; 
			oItemInput.PLANT_ID = 'PL3';

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [oItemInput.ITEM_ID],
				WORK_CENTER_ID:['WC3'],		// should be as in request
				PLANT_ID:		['PL3'],				// should be as in request
				WORK_CENTER_CATEGORY: ['ZONE'],
				COST_CENTER_ID: ['CC2'],
				COMPANY_CODE_ID: ['CC2']
			}, ["ITEM_ID"]);	
			
			var oMessages = Array.slice(result.OT_MESSAGES);
			expect(oMessages).toMatchData({
				"ITEM_ID":  [ oItemInput.ITEM_ID, oItemInput.ITEM_ID ],
				"MSG_ID": 	[ messageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code, messageCode.DEPENDENTFIELDSDETERMINATION_COST_CENTER_SET_FOR_CHANGED_WORK_CENTER_INFO.code ]
			}, ["MSG_ID","ITEM_ID"]);
		});
		
		it('should change efficiency to the one defined for work center in administration when updating masterdata', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemWCInputTestData).getObject(2); 
			oItemInput.MATERIAL_ID = null; 
			oItemInput.WORK_CENTER_ID = 'WC3'; 
			oItemInput.EFFICIENCY = 21; 
			oItemInput.PLANT_ID = 'PL3';

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', true);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [oItemInput.ITEM_ID],
				WORK_CENTER_ID:['WC3'],		// should be as in request
				PLANT_ID:		['PL3'],				// should be as in request
				WORK_CENTER_CATEGORY: ['ZONE'],
				COST_CENTER_ID: ['CC2'],
				COMPANY_CODE_ID: ['CC2'],
				EFFICIENCY : ["50.0000000"]
			}, ["ITEM_ID"]);	
		});
		
		it('should set efficiency to the input one if set together with the work center keys', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemWCInputTestData).getObject(2); 
			oItemInput.MATERIAL_ID = null; 
			oItemInput.WORK_CENTER_ID = 'WC3'; 
			oItemInput.EFFICIENCY = 21; 
			oItemInput.PLANT_ID = 'PL3';

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [oItemInput.ITEM_ID],
				WORK_CENTER_ID:['WC3'],		// should be as in request
				PLANT_ID:		['PL3'],				// should be as in request
				WORK_CENTER_CATEGORY: ['ZONE'],
				COST_CENTER_ID: ['CC2'],
				COMPANY_CODE_ID: ['CC2'],
				EFFICIENCY : ["21.0000000"]
			}, ["ITEM_ID"]);	
		});
		
		it('plant changed -> work center and category not changed', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemWCInputTestData).getObject(0); 
			oItemInput.MATERIAL_ID = null; 
			oItemInput.PLANT_ID = 'PL3';

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [oItemInput.ITEM_ID],
				WORK_CENTER_ID:['WC'],		// should be as in request
				PLANT_ID:		['PL3'],	// should be as in request
				WORK_CENTER_CATEGORY: ['WCC'],
				COST_CENTER_ID: ['CC2'],
				COMPANY_CODE_ID: ['CC2']
			}, ["ITEM_ID"]);	
		});
			
		
		it('cost center changed -> work center and category changed not changed', function() {
			//arrange
			var oItemInput = new TestDataUtility(oItemWCInputTestData).getObject(0); 
			oItemInput.MATERIAL_ID = null; 
			oItemInput.COST_CENTER_ID = 'ccc';

			//act
			var procedure = mockstar.loadProcedure();
			var result = procedure([oItemInput], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);

			//assert
			var oEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
			expect(oEntity).toMatchData({
				ITEM_ID:        [oItemInput.ITEM_ID],
				WORK_CENTER_ID:['WC'],		// should be as in request
				PLANT_ID:		['PL1'],	// should be as in request
				WORK_CENTER_CATEGORY: ['WCC'],
				COST_CENTER_ID: ['ccc'],
				COMPANY_CODE_ID: ['CC1']
			}, ["ITEM_ID"]);	
		});
	});
	
	describe("cost_center_id change", function(){
		
		it('should set the cost_center_id to an existing one with the same controlling_area_id as the input value of controlling_area_id --> no duplicates for different controlling areas are returned', function() {
			var oCostCenterTest = new TestDataUtility(testData.oCostCenterTestDataPlc).getObject(1);
			oCostCenterTest.CONTROLLING_AREA_ID = '#CA2';
			
			mockstar.insertTableData("cost_center", oCostCenterTest);
			
			var oBaseInput = new TestDataUtility(oItemInputTestData).getObject(0);
			
			var procedure = mockstar.loadProcedure();
    		var result = procedure([_.extend(oBaseInput, {
				COST_CENTER_ID: testData.oCostCenterTestDataPlc.COST_CENTER_ID[1]
			})], calcVersionId, sessionId, new Date(), controllingAreaId, '', false);
    
    		var aEntity = Array.slice(result.OT_UPDATED_DEPENDENT_FIELDS);	
    		expect(aEntity.length).toBe(1);
    		expect(aEntity[0]).toMatchData({
				ITEM_ID: [oBaseInput.ITEM_ID],
				COST_CENTER_ID: [testData.oCostCenterTestDataPlc.COST_CENTER_ID[1]]
			}, ["ITEM_ID"]);
		});
	});
	
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);
