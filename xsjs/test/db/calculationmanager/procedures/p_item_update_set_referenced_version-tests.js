var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var testdata = require("../../../testdata/testdata").data;
var testDataGenerator = require("../../../testdata/testdataGenerator");
var TestDataUtility = require("../../../testtools/testDataUtility").TestDataUtility;
var ItemCategory = require("../../../../lib/xs/util/constants").ItemCategory;

describe("p_item_update_set_referenced_version", function () {
	var oMockstar = null;

	var sSessionId = $.session.getUsername();
	var iItemId;
	var iCvId;

	var oBuiltTestData = testDataGenerator.buildTestDataForSettingReferencedCalcVer(jasmine.plcTestRunParameters.generatedFields);

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_update_set_referenced_version", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						session: {
							name: "sap.plc.db::basis.t_session", 
							data: testdata.oSessionTestData
						},
						calculation: {
							name: "sap.plc.db::basis.t_calculation"
						},
						calculationVersion: {
							name: "sap.plc.db::basis.t_calculation_version"
						},
						itemTemporary: {
							name: "sap.plc.db::basis.t_item_temporary"                        
						},
						item: {
							name: "sap.plc.db::basis.t_item"
						},
						itemExt: "sap.plc.db::basis.t_item_ext",
						itemTemporaryExt: "sap.plc.db::basis.t_item_temporary_ext",
						gtt_reference_calculation_version_items :  "sap.plc.db::temp.gtt_reference_calculation_version_items"
					}
				});
	});

	afterOnce(function() {
		oMockstar.cleanup(); // clean up all test artefacts
	});


	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views

		oMockstar.insertTableData("calculation", oBuiltTestData.CalcTestData);	//"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
		oMockstar.insertTableData("calculationVersion", oBuiltTestData.CalcVerTestData);	//[ 2809, 4809, 5809 ]
		oMockstar.insertTableData("item", oBuiltTestData.ItemSourceTestData);	// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]
		// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ]
		// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809 3002 and 3003 are sub-items of 3001
		oMockstar.insertTableData("itemTemporary", oBuiltTestData.ItemMasterTempTestData);	

		if(jasmine.plcTestRunParameters.generatedFields === true){
			var aCustomFields = oBuiltTestData.CustomFields;	//["CUST_BOOLEAN_INT_MANUAL", "CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL", "CUST_STRING_MANUAL"];

			oMockstar.insertTableData("itemExt", oBuiltTestData.ItemExtTestData); 	//"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]	
			oMockstar.insertTableData("itemTemporaryExt", oBuiltTestData.ItemTempExtTestData); 	// we need only "ITEM_ID" : [ 3001, 3002, 3003 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
		}

		iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[0]; 	//3001
		iCvId = oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[0];	//2809
	});


	function fillTemporaryTable(iFirstReferenceVersionID,iSecondReferenceVersionID){

		var aItems = [
		              {
		            	  ITEM_ID:iItemId,
		            	  CALCULATION_VERSION_ID:iCvId,
		            	  ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
		            	  REFERENCED_CALCULATION_VERSION_ID:iFirstReferenceVersionID
		              }
		              ];

		if(iSecondReferenceVersionID){    	    
			aItems.push({
				ITEM_ID:oBuiltTestData.ItemMasterTempTestData.ITEM_ID[3],
				CALCULATION_VERSION_ID:iCvId,
				ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
				REFERENCED_CALCULATION_VERSION_ID:iSecondReferenceVersionID
			});
		}
		oMockstar.insertTableData("gtt_reference_calculation_version_items", aItems);
	}

	it('should not perform actual update and return a the not-existing version if source(referenced) calculation version does not exist', function() {

		// arrange
		var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");
		fillTemporaryTable(5810,oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result[0]).toBeDefined();	
		expect(result[0][0].CALCULATION_VERSION_ID).toBe(5810);
		//only one version does not exist - should also be reflected in the output
		expect(result[1].length).toBe(1);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");

		// nothing has changed
		expect(oNewItemsMasterCalcVer).toMatchData(oOldItemsMasterCalcVer, [ "ITEM_ID" ]);
	});

	it('should not perform actual update and return a a list of not-existing versions if source(referenced) calculation versions do not exist', function() {

		// arrange
		var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");
		fillTemporaryTable(5810,4810);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result[0]).toBeDefined();	
		//only one version does not exist - should also be reflected in the output
		expect(result[0].length).toBe(2);
		expect(result[1].length).toBe(2);

		expect(result[0][0].CALCULATION_VERSION_ID).toBe(5810);
		expect(result[0][1].CALCULATION_VERSION_ID).toBe(4810);


		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");

		// nothing has changed
		expect(oNewItemsMasterCalcVer).toMatchData(oOldItemsMasterCalcVer, [ "ITEM_ID" ]);
	});

	it('should not perform actual update and return ID of version that is not current if source(referenced) calculation version is not current', function() {

		// arrange
		var oCalculationTestData = new TestDataUtility(oBuiltTestData.CalcTestData)
		.deleteProperty("CURRENT_CALCULATION_VERSION_ID")
		.addProperty("CURRENT_CALCULATION_VERSION_ID", [ 2809, 4810, 5809 ])	//4809 is not current 
		.build();	
		oMockstar.clearTable("calculation"); 
		oMockstar.insertTableData("calculation", oCalculationTestData);

		var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");
		fillTemporaryTable(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();	
		expect(result[1].length).toBe(1);
		expect(result[1][0].CALCULATION_VERSION_ID).toBe(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");

		// nothing has changed
		expect(oNewItemsMasterCalcVer).toMatchData(oOldItemsMasterCalcVer, [ "ITEM_ID" ]);
	});

    it('should perform actual update if the referenced version is not current and has not been changed in the update', function() {

		// arrange
		var oCalculationTestData = new TestDataUtility(oBuiltTestData.CalcTestData)
		.deleteProperty("CURRENT_CALCULATION_VERSION_ID")
		.addProperty("CURRENT_CALCULATION_VERSION_ID", [ 2809, 4809, 5809 ])	//4809 is current 
		.build();	
		oMockstar.clearTable("calculation"); 
		oMockstar.insertTableData("calculation", oCalculationTestData);

		var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");
		fillTemporaryTable(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]);

		//act
		oMockstar.call(sSessionId, null, null);
		//update current version to be different
		oMockstar.execSingle("update {{calculation}} set CURRENT_CALCULATION_VERSION_ID=4810 where CURRENT_CALCULATION_VERSION_ID=4809");
		//run the same request again, ref-version id has not changed
        var result = oMockstar.call(sSessionId, null, null);
        
		//assert
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();	
		expect(result[1].length).toBe(0);
	});

	it('should not perform actual update and return IDs of versions that are not current if source(referenced) calculation versions are not current', function() {

		// arrange
		var oCalculationTestData = new TestDataUtility(oBuiltTestData.CalcTestData)
		.deleteProperty("CURRENT_CALCULATION_VERSION_ID")
		.addProperty("CURRENT_CALCULATION_VERSION_ID", [ 2809, 4810, 5810 ])	//4809 is not current 
		.build();	
		oMockstar.clearTable("calculation"); 
		oMockstar.insertTableData("calculation", oCalculationTestData);

		var oOldItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");
		fillTemporaryTable(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();
		expect(result[1].length).toBe(2);
		expect(result[1][0].CALCULATION_VERSION_ID).toBe(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]);
		expect(result[1][1].CALCULATION_VERSION_ID).toBe(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}}");

		// nothing has changed
		expect(oNewItemsMasterCalcVer).toMatchData(oOldItemsMasterCalcVer, [ "ITEM_ID" ]);
	});

	it('should perform actual update and return ov_source_calculation_version_exists = 1 and ov_source_calculation_version_is_current = 1, if calculation version exists and is current', function() {

		// arrange
		var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
		oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL = 0;
		oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL = 1;
		oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP = 1;
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);
		var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 2);	//the item in master calc ver before update

		iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[2]; 	//3003
		var aItems = [
		              {
		            	  ITEM_ID:iItemId,
		            	  CALCULATION_VERSION_ID:iCvId,
		            	  ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
		            	  REFERENCED_CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]
		              }
		              ];

		oMockstar.insertTableData("gtt_reference_calculation_version_items", aItems);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result[0]).toBeDefined();	
		expect(result[0].length).toBe(0);
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();
		expect(result[1].length).toBe(0);

		var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCvId + "' and IS_DELETED = 0"); 
		expect(iNewItemsMasterCalcVerCount).toBe(4);	// the item under the new ref version item should be deleted

		//values of non-identical fields
		var oExpectedNonIdenticalFieldsValues = {
				"ITEM_ID" : [ iItemId ], 
				"CALCULATION_VERSION_ID" : [ iCvId ], 
				"PARENT_ITEM_ID" : [ oItemMasterCalcVer.PARENT_ITEM_ID ], 
				"PREDECESSOR_ITEM_ID" : [ oItemMasterCalcVer.PREDECESSOR_ITEM_ID ],
				"REFERENCED_CALCULATION_VERSION_ID" : [ oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1] ],
				"ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion ],
				"CHILD_ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion ],
				"BASE_QUANTITY" : [ oItemMasterCalcVer.BASE_QUANTITY ], 
				"BASE_QUANTITY_IS_MANUAL" : [ 1 ],
				"BASE_QUANTITY_CALCULATED": [ null ],
				"QUANTITY" : [ oItemMasterCalcVer.QUANTITY ],
				"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
				"QUANTITY_CALCULATED" : [ null ],
				"QUANTITY_IS_MANUAL" : [ 1 ],
				"TOTAL_QUANTITY" : [ oItemMasterCalcVer.TOTAL_QUANTITY ],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ oItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON ],
				"PRICE_FIXED_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION ],
				"PRICE_VARIABLE_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION ],
				"PRICE" : [ oRootItemSourceCalcVer.TOTAL_COST ],
				"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID ],
				"PRICE_UNIT" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
				"PRICE_SOURCE_ID" : [ oRootItemSourceCalcVer.PRICE_SOURCE_ID],	//Calculated Costs
				"PRICE_SOURCE_TYPE_ID" : [ 4 ],	//Calculated Costs
				"LOT_SIZE" : [ oItemMasterCalcVer.LOT_SIZE ],
    			"LOT_SIZE_CALCULATED" : [ null ], 
    			"LOT_SIZE_IS_MANUAL" : [ 1 ],
				"IS_ACTIVE" : [ 1 ],
				"HIGHLIGHT_GREEN" : [ oItemMasterCalcVer.HIGHLIGHT_GREEN ],
				"HIGHLIGHT_ORANGE" : [ oItemMasterCalcVer.HIGHLIGHT_ORANGE ],
				"HIGHLIGHT_YELLOW" : [ oItemMasterCalcVer.HIGHLIGHT_YELLOW ],
				"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],

				"ACCOUNT_ID" : [oRootItemSourceCalcVer.ACCOUNT_ID],
				"DOCUMENT_TYPE_ID" : [oRootItemSourceCalcVer.DOCUMENT_TYPE_ID],
				"DOCUMENT_ID" : [oRootItemSourceCalcVer.DOCUMENT_ID],
				"DOCUMENT_VERSION" : [oRootItemSourceCalcVer.DOCUMENT_VERSION],
				"DOCUMENT_PART" : [oRootItemSourceCalcVer.DOCUMENT_PART],
				"MATERIAL_ID" : [oRootItemSourceCalcVer.MATERIAL_ID],
				"ACTIVITY_TYPE_ID" : [null],
				"PROCESS_ID" : [null],
				"LOT_SIZE_IS_MANUAL" : [oItemMasterCalcVer.LOT_SIZE_IS_MANUAL],
				"ENGINEERING_CHANGE_NUMBER_ID" : [oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID],
				"COMPANY_CODE_ID" : [oRootItemSourceCalcVer.COMPANY_CODE_ID],
				"COST_CENTER_ID" : [null],
				"PLANT_ID" : [oRootItemSourceCalcVer.PLANT_ID],
				"WORK_CENTER_ID" : [oRootItemSourceCalcVer.WORK_CENTER_ID],
				"BUSINESS_AREA_ID" : [oRootItemSourceCalcVer.BUSINESS_AREA_ID],
				"PROFIT_CENTER_ID" : [oRootItemSourceCalcVer.PROFIT_CENTER_ID],
				"CREATED_BY" : ['SecondTestUser'],
				"IS_CONFIGURABLE_MATERIAL": [oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL],
				"IS_PHANTOM_MATERIAL": [oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL],
				"IS_RELEVANT_TO_COSTING_IN_ERP": [oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP],
				"ITEM_DESCRIPTION" : [null],
				"COMMENT" : [oRootItemSourceCalcVer.COMMENT]
		};

		// expected values = identical fields values and non-identical fields values copied from source (referenced) calc ver root item to item in master calc ver
		var oExpectedNewItemsMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemSourceCalcVer]), oExpectedNonIdenticalFieldsValues);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);

		// dates are not relevant
		delete oExpectedNewItemsMasterCalcVer.CREATED_ON;
		delete oExpectedNewItemsMasterCalcVer.LAST_MODIFIED_ON;

		delete oNewItemsMasterCalcVer.columns.CREATED_ON;
		delete oNewItemsMasterCalcVer.columns.LAST_MODIFIED_ON;

		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST_VARIABLE_PORTION = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_VARIABLE_PORTION = null;

		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_IS_MANUAL = 1;
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_IS_MANUAL = 1;
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_IS_MANUAL = 1;


		expect(oNewItemsMasterCalcVer).toMatchData(oExpectedNewItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);

		if(jasmine.plcTestRunParameters.generatedFields === true){

			var iNewItemsExtMasterCalcVerCount = oMockstar.execQuery('select count(*) as count '+
					'from {{itemTemporary}} as item '+
					'right outer join {{itemTemporaryExt}} as ext '+
					'on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id '+
					'where item.is_deleted = 0 and ext.calculation_version_id = '+iCvId);

			//var iNewItemsExtMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporaryExt", "CALCULATION_VERSION_ID='" + iCvId + "'"); 
			//only root item + item_id = 3002 should be in master calculation version (sub-item 3003 should be marked as deleted)
			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(4);	


			//root item's custom fields values
			var oRootItemExtSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemExtTestData, 3);
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_IS_MANUAL = 1;
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_MANUAL = 'T4';
			var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemExtSourceCalcVer]), {"ITEM_ID" : [ iItemId ], "CALCULATION_VERSION_ID" : [ iCvId ]});

			var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + iItemId);

			expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		}	
	});

	it('should perform actual update (account included) and return ov_source_calculation_version_exists = 1 and ov_source_calculation_version_is_current = 1, if calculation version exists and is current', function() {

		// arrange
		var sAccountId = 'AC11';
		var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
		oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL = 0;
		oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL = 1;
		oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP = 1;
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);
		var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 2);	//the item in master calc ver before update

		iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[2]; 	//3003
		var aItems = [
		              {
		            	  ITEM_ID:iItemId,
		            	  CALCULATION_VERSION_ID:iCvId,
		            	  ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
		            	  REFERENCED_CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],
						  ACCOUNT_ID: sAccountId
		              }
		              ];

		oMockstar.insertTableData("gtt_reference_calculation_version_items", aItems);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result[0]).toBeDefined();	
		expect(result[0].length).toBe(0);
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();
		expect(result[1].length).toBe(0);

		var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCvId + "' and IS_DELETED = 0"); 
		expect(iNewItemsMasterCalcVerCount).toBe(4);	// the item under the new ref version item should be deleted

		//values of non-identical fields
		var oExpectedNonIdenticalFieldsValues = {
				"ITEM_ID" : [ iItemId ], 
				"CALCULATION_VERSION_ID" : [ iCvId ], 
				"PARENT_ITEM_ID" : [ oItemMasterCalcVer.PARENT_ITEM_ID ], 
				"PREDECESSOR_ITEM_ID" : [ oItemMasterCalcVer.PREDECESSOR_ITEM_ID ],
				"REFERENCED_CALCULATION_VERSION_ID" : [ oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1] ],
				"ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion ],
				"CHILD_ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion ],
				"BASE_QUANTITY" : [ oItemMasterCalcVer.BASE_QUANTITY ], 
				"BASE_QUANTITY_IS_MANUAL" : [ 1 ],
				"BASE_QUANTITY_CALCULATED": [ null ],
				"QUANTITY" : [ oItemMasterCalcVer.QUANTITY ],
				"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
				"QUANTITY_CALCULATED" : [ null ],
				"QUANTITY_IS_MANUAL" : [ 1 ],
				"TOTAL_QUANTITY" : [ oItemMasterCalcVer.TOTAL_QUANTITY ],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ oItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON ],
				"PRICE_FIXED_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION ],
				"PRICE_VARIABLE_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION ],
				"PRICE" : [ oRootItemSourceCalcVer.TOTAL_COST ],
				"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID ],
				"PRICE_UNIT" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
				"PRICE_SOURCE_ID" : [ oRootItemSourceCalcVer.PRICE_SOURCE_ID],	//Calculated Costs
				"PRICE_SOURCE_TYPE_ID" : [ 4 ],	//Calculated Costs
				"LOT_SIZE" : [ oItemMasterCalcVer.LOT_SIZE ],
    			"LOT_SIZE_CALCULATED" : [ null ], 
    			"LOT_SIZE_IS_MANUAL" : [ 1 ],
				"IS_ACTIVE" : [ 1 ],
				"HIGHLIGHT_GREEN" : [ oItemMasterCalcVer.HIGHLIGHT_GREEN ],
				"HIGHLIGHT_ORANGE" : [ oItemMasterCalcVer.HIGHLIGHT_ORANGE ],
				"HIGHLIGHT_YELLOW" : [ oItemMasterCalcVer.HIGHLIGHT_YELLOW ],
				"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],

				"ACCOUNT_ID" : [sAccountId],
				"DETERMINED_ACCOUNT_ID" : [sAccountId],
				"DOCUMENT_TYPE_ID" : [oRootItemSourceCalcVer.DOCUMENT_TYPE_ID],
				"DOCUMENT_ID" : [oRootItemSourceCalcVer.DOCUMENT_ID],
				"DOCUMENT_VERSION" : [oRootItemSourceCalcVer.DOCUMENT_VERSION],
				"DOCUMENT_PART" : [oRootItemSourceCalcVer.DOCUMENT_PART],
				"MATERIAL_ID" : [oRootItemSourceCalcVer.MATERIAL_ID],
				"ACTIVITY_TYPE_ID" : [null],
				"PROCESS_ID" : [null],
				"LOT_SIZE_IS_MANUAL" : [oItemMasterCalcVer.LOT_SIZE_IS_MANUAL],
				"ENGINEERING_CHANGE_NUMBER_ID" : [oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID],
				"COMPANY_CODE_ID" : [oRootItemSourceCalcVer.COMPANY_CODE_ID],
				"COST_CENTER_ID" : [null],
				"PLANT_ID" : [oRootItemSourceCalcVer.PLANT_ID],
				"WORK_CENTER_ID" : [oRootItemSourceCalcVer.WORK_CENTER_ID],
				"BUSINESS_AREA_ID" : [oRootItemSourceCalcVer.BUSINESS_AREA_ID],
				"PROFIT_CENTER_ID" : [oRootItemSourceCalcVer.PROFIT_CENTER_ID],
				"CREATED_BY" : ['SecondTestUser'],
				"IS_CONFIGURABLE_MATERIAL": [oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL],
				"IS_PHANTOM_MATERIAL": [oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL],
				"IS_RELEVANT_TO_COSTING_IN_ERP": [oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP],
				"ITEM_DESCRIPTION" : [null],
				"COMMENT" : [oRootItemSourceCalcVer.COMMENT]
		};

		// expected values = identical fields values and non-identical fields values copied from source (referenced) calc ver root item to item in master calc ver
		var oExpectedNewItemsMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemSourceCalcVer]), oExpectedNonIdenticalFieldsValues);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);

		// dates are not relevant
		delete oExpectedNewItemsMasterCalcVer.CREATED_ON;
		delete oExpectedNewItemsMasterCalcVer.LAST_MODIFIED_ON;

		delete oNewItemsMasterCalcVer.columns.CREATED_ON;
		delete oNewItemsMasterCalcVer.columns.LAST_MODIFIED_ON;

		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.OTHER_COST_VARIABLE_PORTION = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_FIXED_PORTION = null;
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_VARIABLE_PORTION = null;

		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_IS_MANUAL = 1;
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_IS_MANUAL = 1;
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_CALCULATED = null;
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_IS_MANUAL = 1;


		expect(oNewItemsMasterCalcVer).toMatchData(oExpectedNewItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);

		if(jasmine.plcTestRunParameters.generatedFields === true){

			var iNewItemsExtMasterCalcVerCount = oMockstar.execQuery('select count(*) as count '+
					'from {{itemTemporary}} as item '+
					'right outer join {{itemTemporaryExt}} as ext '+
					'on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id '+
					'where item.is_deleted = 0 and ext.calculation_version_id = '+iCvId);

			//var iNewItemsExtMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporaryExt", "CALCULATION_VERSION_ID='" + iCvId + "'"); 
			//only root item + item_id = 3002 should be in master calculation version (sub-item 3003 should be marked as deleted)
			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(4);	


			//root item's custom fields values
			var oRootItemExtSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemExtTestData, 3);
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_IS_MANUAL = 1;
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_MANUAL = 'T4';
			var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemExtSourceCalcVer]), {"ITEM_ID" : [ iItemId ], "CALCULATION_VERSION_ID" : [ iCvId ]});

			var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + iItemId);

			expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		}	
	});

	it('should perform actual update and set the properties: overhead_group_id, company_code_id, plant_id, profit_center_id, business_area_id, ' +
	 'confidence_level_id, price_source_id, account_id', function() {

		// arrange
		var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
		var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 2);	//the item in master calc ver before update
		
		//set the properties on the root item of the source version
		oRootItemSourceCalcVer.PRICE_SOURCE_ID = "1111";
		oRootItemSourceCalcVer.CONFIDENCE_LEVEL_ID = 1;
		oRootItemSourceCalcVer.OVERHEAD_GROUP_ID =  "ov1";
		oRootItemSourceCalcVer.COMPANY_CODE_ID = "cc1";
		oRootItemSourceCalcVer.PLANT_ID = "PL1";
		oRootItemSourceCalcVer.PROFIT_CENTER_ID = "pc1";
		oRootItemSourceCalcVer.BUSINESS_AREA_ID = "Ba1";
		oRootItemSourceCalcVer.ACCOUNT_ID = "AC1";
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);

		iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[2]; 	//3003
		var aItems = [
		              {
		            	  ITEM_ID:iItemId,
		            	  CALCULATION_VERSION_ID:iCvId,
		            	  ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
		            	  REFERENCED_CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]
		              }
		              ];

		oMockstar.insertTableData("gtt_reference_calculation_version_items", aItems);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);
		expect(oNewItemsMasterCalcVer.columns.PRICE_SOURCE_ID.rows[0]).toBe(oRootItemSourceCalcVer.PRICE_SOURCE_ID);
		expect(oNewItemsMasterCalcVer.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(oRootItemSourceCalcVer.CONFIDENCE_LEVEL_ID);
		expect(oNewItemsMasterCalcVer.columns.OVERHEAD_GROUP_ID.rows[0]).toBe(oRootItemSourceCalcVer.OVERHEAD_GROUP_ID);
		expect(oNewItemsMasterCalcVer.columns.COMPANY_CODE_ID.rows[0]).toBe(oRootItemSourceCalcVer.COMPANY_CODE_ID);
		expect(oNewItemsMasterCalcVer.columns.PLANT_ID.rows[0]).toBe(oRootItemSourceCalcVer.PLANT_ID);
		expect(oNewItemsMasterCalcVer.columns.PROFIT_CENTER_ID.rows[0]).toBe(oRootItemSourceCalcVer.PROFIT_CENTER_ID);
		expect(oNewItemsMasterCalcVer.columns.BUSINESS_AREA_ID.rows[0]).toBe(oRootItemSourceCalcVer.BUSINESS_AREA_ID);
        expect(oNewItemsMasterCalcVer.columns.ACCOUNT_ID.rows[0]).toBe(oRootItemSourceCalcVer.ACCOUNT_ID);
        
        //change account_id of referenced version and update again (the account previously set should be kept)
		oMockstar.execSingle("UPDATE {{itemTemporary}} SET ACCOUNT_ID = 'AC2';");
		var result = oMockstar.call(sSessionId, null, null);
		
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);
		expect(oNewItemsMasterCalcVer.columns.PRICE_SOURCE_ID.rows[0]).toBe(oRootItemSourceCalcVer.PRICE_SOURCE_ID);
		expect(oNewItemsMasterCalcVer.columns.CONFIDENCE_LEVEL_ID.rows[0]).toBe(oRootItemSourceCalcVer.CONFIDENCE_LEVEL_ID);
		expect(oNewItemsMasterCalcVer.columns.OVERHEAD_GROUP_ID.rows[0]).toBe(oRootItemSourceCalcVer.OVERHEAD_GROUP_ID);
		expect(oNewItemsMasterCalcVer.columns.COMPANY_CODE_ID.rows[0]).toBe(oRootItemSourceCalcVer.COMPANY_CODE_ID);
		expect(oNewItemsMasterCalcVer.columns.PLANT_ID.rows[0]).toBe(oRootItemSourceCalcVer.PLANT_ID);
		expect(oNewItemsMasterCalcVer.columns.PROFIT_CENTER_ID.rows[0]).toBe(oRootItemSourceCalcVer.PROFIT_CENTER_ID);
		expect(oNewItemsMasterCalcVer.columns.BUSINESS_AREA_ID.rows[0]).toBe(oRootItemSourceCalcVer.BUSINESS_AREA_ID);
		expect(oNewItemsMasterCalcVer.columns.ACCOUNT_ID.rows[0]).toBe("AC2");
	});
	
	it('should perform actual update on inactive item, the item remains inactive', function() {
		// arrange
		let oItemsTemporary = oBuiltTestData.ItemMasterTempTestData;
		oItemsTemporary.IS_ACTIVE = [0, 1, 0, 1];
		oMockstar.clearTable("itemTemporary");
		oMockstar.insertTableData("itemTemporary", oItemsTemporary);
		
		var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
		var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 2);	//the item in master calc ver before update
				
		//set the properties on the root item of the source version
		oRootItemSourceCalcVer.PRICE_SOURCE_ID = "1111";
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);

		iItemId = oItemsTemporary.ITEM_ID[2]; 	//3003
		var aItems = [{
				        ITEM_ID:iItemId,
				        CALCULATION_VERSION_ID:iCvId,
				        ITEM_CATEGORY_ID:ItemCategory.ReferencedVersion,
				        REFERENCED_CALCULATION_VERSION_ID:oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1]
				      }];

		oMockstar.insertTableData("gtt_reference_calculation_version_items", aItems);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId);
		expect(oNewItemsMasterCalcVer.columns.PRICE_SOURCE_ID.rows[0]).toBe(oRootItemSourceCalcVer.PRICE_SOURCE_ID);
		expect(oNewItemsMasterCalcVer.columns.IS_ACTIVE.rows[0]).toBe(0);
	});

	it('should perform actual update and return ov_source_calculation_version_exists = 1 and ov_source_calculation_version_is_current = 1, if calculation version exist and are current for two items', function() {

		// arrange
		var oSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 1);
		var oSecondSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.CalcVerTestData, 2);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 3);
		var oSecondRootItemSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemSourceTestData, 4);
		var oItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 1);	//the item in master calc ver before update
		var oSecondItemMasterCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemMasterTempTestData, 3);	//the item in master calc ver before update

		iItemId = oBuiltTestData.ItemMasterTempTestData.ITEM_ID[1]; 	//3002
		fillTemporaryTable(oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2]);

		//act
		var result = oMockstar.call(sSessionId, null, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result[0]).toBeDefined();	
		expect(result[0].length).toBe(0);
		//	ov_source_calculation_version_is_current
		expect(result[1]).toBeDefined();
		expect(result[1].length).toBe(0);

		var iNewItemsMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporary", "CALCULATION_VERSION_ID='" + iCvId + "' and IS_DELETED = 0"); 
		expect(iNewItemsMasterCalcVerCount).toBe(3);	// the item under the new ref version item should be deleted

		//values of non-identical fields
		var oExpectedNonIdenticalFieldsValues = {
				"ITEM_ID" : [ iItemId,3004 ], 
				"CALCULATION_VERSION_ID" : [ iCvId,iCvId ], 
				"PARENT_ITEM_ID" : [ oItemMasterCalcVer.PARENT_ITEM_ID, oSecondItemMasterCalcVer.PARENT_ITEM_ID ], 
				"PREDECESSOR_ITEM_ID" : [ oItemMasterCalcVer.PREDECESSOR_ITEM_ID, oSecondItemMasterCalcVer.PREDECESSOR_ITEM_ID ],
				"REFERENCED_CALCULATION_VERSION_ID" : [ oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[1],oBuiltTestData.CalcVerTestData.CALCULATION_VERSION_ID[2] ],
				"ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion,ItemCategory.ReferencedVersion ],
				"CHILD_ITEM_CATEGORY_ID" : [  ItemCategory.ReferencedVersion,ItemCategory.ReferencedVersion ],
				"QUANTITY" : ["1.0000000", "1.0000000"], 
				"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID,oSecondRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
				"TOTAL_QUANTITY" : [ oItemMasterCalcVer.TOTAL_QUANTITY, oSecondItemMasterCalcVer.TOTAL_QUANTITY ],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ oItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON, oSecondItemMasterCalcVer.TOTAL_QUANTITY_DEPENDS_ON ],
				"PRICE_FIXED_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION,oSecondRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION ],
				"PRICE_VARIABLE_PORTION" : [ oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION,oSecondRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION],
				"PRICE" : [ oRootItemSourceCalcVer.TOTAL_COST , oSecondRootItemSourceCalcVer.TOTAL_COST],
				"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID, oSecondSourceCalcVer.REPORT_CURRENCY_ID ],
				"PRICE_UNIT" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY,oSecondRootItemSourceCalcVer.TOTAL_QUANTITY ],
				"PRICE_SOURCE_ID" : [ oRootItemSourceCalcVer.PRICE_SOURCE_ID , oSecondRootItemSourceCalcVer.PRICE_SOURCE_ID],	//Calculated Costs
				"PRICE_SOURCE_TYPE_ID" : [ 4 , 4],	//Calculated Costs
				"LOT_SIZE" : [ oItemMasterCalcVer.LOT_SIZE, oSecondItemMasterCalcVer.LOT_SIZE ],
				"IS_ACTIVE" : [ 1 ,1],
				"HIGHLIGHT_GREEN" : [ oItemMasterCalcVer.HIGHLIGHT_GREEN, oSecondItemMasterCalcVer.HIGHLIGHT_GREEN ],
				"HIGHLIGHT_ORANGE" : [ oItemMasterCalcVer.HIGHLIGHT_ORANGE, oSecondItemMasterCalcVer.HIGHLIGHT_ORANGE ],
				"HIGHLIGHT_YELLOW" : [ oItemMasterCalcVer.HIGHLIGHT_YELLOW, oSecondItemMasterCalcVer.HIGHLIGHT_YELLOW ],
				"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID, oSecondRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],

				"ACCOUNT_ID" : [oRootItemSourceCalcVer.ACCOUNT_ID , oSecondRootItemSourceCalcVer.ACCOUNT_ID],
				"DOCUMENT_TYPE_ID" : [oRootItemSourceCalcVer.DOCUMENT_TYPE_ID, oSecondRootItemSourceCalcVer.DOCUMENT_TYPE_ID],
				"DOCUMENT_ID" : [oRootItemSourceCalcVer.DOCUMENT_ID, oSecondRootItemSourceCalcVer.DOCUMENT_ID],
				"DOCUMENT_VERSION" : [oRootItemSourceCalcVer.DOCUMENT_VERSION, oSecondRootItemSourceCalcVer.DOCUMENT_VERSION],
				"DOCUMENT_PART" : [oRootItemSourceCalcVer.DOCUMENT_PART, oSecondRootItemSourceCalcVer.DOCUMENT_PART],
				"MATERIAL_ID" : [oRootItemSourceCalcVer.MATERIAL_ID, oSecondRootItemSourceCalcVer.MATERIAL_ID],
				"ACTIVITY_TYPE_ID" : [null, null],
				"PROCESS_ID" : [null, null],
				"LOT_SIZE_IS_MANUAL" : [oItemMasterCalcVer.LOT_SIZE_IS_MANUAL, oSecondItemMasterCalcVer.LOT_SIZE_IS_MANUAL],
				"ENGINEERING_CHANGE_NUMBER_ID" : [oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID, oSecondRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID],
				"COMPANY_CODE_ID" : [oRootItemSourceCalcVer.COMPANY_CODE_ID , oSecondRootItemSourceCalcVer.COMPANY_CODE_ID],
				"COST_CENTER_ID" : [null, null],
				"PLANT_ID" : [oRootItemSourceCalcVer.PLANT_ID , oSecondRootItemSourceCalcVer.PLANT_ID],
				"WORK_CENTER_ID" : [oRootItemSourceCalcVer.WORK_CENTER_ID , oSecondRootItemSourceCalcVer.WORK_CENTER_ID],
				"BUSINESS_AREA_ID" : [oRootItemSourceCalcVer.BUSINESS_AREA_ID , oSecondRootItemSourceCalcVer.BUSINESS_AREA_ID],
				"PROFIT_CENTER_ID" : [oRootItemSourceCalcVer.PROFIT_CENTER_ID , oSecondRootItemSourceCalcVer.PROFIT_CENTER_ID],
				"QUANTITY_IS_MANUAL" : [oItemMasterCalcVer.QUANTITY_IS_MANUAL, oSecondItemMasterCalcVer.QUANTITY_IS_MANUAL],
				"CREATED_BY" : ['SecondTestUser','SecondTestUser'],
				"ITEM_DESCRIPTION" : [null, null],
				"COMMENT" : [oRootItemSourceCalcVer.COMMENT, oSecondRootItemSourceCalcVer.COMMENT]
		};

		// expected values = identical fields values and non-identical fields values copied from source (referenced) calc ver root item to item in master calc ver
		var oExpectedNewItemsMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemSourceCalcVer,oSecondRootItemSourceCalcVer]), oExpectedNonIdenticalFieldsValues);

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id=" + iItemId + " or item_id = 3004");

		// dates are not relevant
		delete oExpectedNewItemsMasterCalcVer.CREATED_ON;
		delete oExpectedNewItemsMasterCalcVer.LAST_MODIFIED_ON;

		delete oNewItemsMasterCalcVer.columns.CREATED_ON;
		delete oNewItemsMasterCalcVer.columns.LAST_MODIFIED_ON;

		oExpectedNewItemsMasterCalcVer.BASE_QUANTITY_IS_MANUAL = [1,1];
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY = [null,null];
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION = [null,null];
		oExpectedNewItemsMasterCalcVer.PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION = [null,null];
		oExpectedNewItemsMasterCalcVer.OTHER_COST = [null,null];
		oExpectedNewItemsMasterCalcVer.OTHER_COST_FIXED_PORTION = [null,null];
		oExpectedNewItemsMasterCalcVer.OTHER_COST_VARIABLE_PORTION = [null,null];
		oExpectedNewItemsMasterCalcVer.TOTAL_COST = [null,null];
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_FIXED_PORTION = [null,null];
		oExpectedNewItemsMasterCalcVer.TOTAL_COST_VARIABLE_PORTION = [null,null];

		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_CALCULATED = [null,null];
		oExpectedNewItemsMasterCalcVer.PRICE_FIXED_PORTION_IS_MANUAL = [1,1];
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_CALCULATED = [null,null];
		oExpectedNewItemsMasterCalcVer.PRICE_VARIABLE_PORTION_IS_MANUAL = [1,1];
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_CALCULATED = [null,null];
		oExpectedNewItemsMasterCalcVer.PRICE_UNIT_IS_MANUAL = [1,1];

		expect(oNewItemsMasterCalcVer).toMatchData(oExpectedNewItemsMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);

		if(jasmine.plcTestRunParameters.generatedFields === true){

			var iNewItemsExtMasterCalcVerCount = oMockstar.execQuery('select count(*) as count '+
					'from {{itemTemporary}} as item '+
					'right outer join {{itemTemporaryExt}} as ext '+
					'on item.item_id = ext.item_id and item.calculation_version_id = ext.calculation_version_id '+
					'where item.is_deleted = 0 and ext.calculation_version_id = '+iCvId);

			//var iNewItemsExtMasterCalcVerCount = mockstar_helpers.getRowCount(oMockstar, "itemTemporaryExt", "CALCULATION_VERSION_ID='" + iCvId + "'"); 
			//only root item + item_id = 3002 should be in master calculation version (sub-item 3003 should be marked as deleted)
			expect(parseInt(iNewItemsExtMasterCalcVerCount.columns.COUNT.rows[0],10)).toBe(3);	


			//root item's custom fields values
			var oRootItemExtSourceCalcVer = mockstar_helpers.convertToObject(oBuiltTestData.ItemExtTestData, 3);
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_IS_MANUAL = 1;
			oRootItemExtSourceCalcVer.CUST_STRING_FORMULA_MANUAL = 'T4';
			var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemExtSourceCalcVer]), {"ITEM_ID" : [ iItemId ], "CALCULATION_VERSION_ID" : [ iCvId ]});

			var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id=" + iItemId);

			expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		}	
	});
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);