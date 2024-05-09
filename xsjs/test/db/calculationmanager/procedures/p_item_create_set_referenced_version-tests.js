var _ = require("lodash");
var MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var testdata = require("../../../testdata/testdata").data;


describe("p_item_create_set_referenced_version", function () {
	var oMockstar = null;

	var sSessionId = $.session.getUsername();
	var iCvId;

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					testmodel: "sap.plc.db.calculationmanager.procedures/p_item_create_set_referenced_version", // procedure or view under test
					substituteTables: // substitute all used tables in the procedure or view
					{
						session: {
							name: "sap.plc.db::basis.t_session", 
							data: testdata.oSessionTestData
						},
						calculation: {
							name: "sap.plc.db::basis.t_calculation"
						},
						calculation_version: {
							name: "sap.plc.db::basis.t_calculation_version"
						},
						calculation_version_temporary: {
							name: "sap.plc.db::basis.t_calculation_version_temporary"
						},
						itemTemporary: {
							name: "sap.plc.db::basis.t_item_temporary"                        
						},
						item: {
							name: "sap.plc.db::basis.t_item"
						},
						itemExt: "sap.plc.db::basis.t_item_ext",
						itemTemporaryExt: "sap.plc.db::basis.t_item_temporary_ext",
						gtt_item_ids :  "sap.plc.db::temp.gtt_item_ids"
					}
				});
	});

	afterOnce(function() {
		oMockstar.cleanup(); 
	});


	beforeEach(function() {
		oMockstar.clearAllTables(); 

		oMockstar.clearAllTables(); 
		oMockstar.insertTableData("calculation_version", testdata.oCalculationVersionTestData);
		oMockstar.insertTableData("item", testdata.oItemTestData);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			oMockstar.insertTableData("itemExt", testdata.oItemExtData);
		}

		iCvId = testdata.oCalculationVersionTestData.CALCULATION_VERSION_ID[0];	//2809
	});


	function fillTemporaryTable(iFirstItem,iSecondItem){

		var aItems = [
		              {
		            	  ITEM_ID:iFirstItem
		              }
		              ];

		if(iSecondItem){    	    
			aItems.push({
				ITEM_ID:iSecondItem
			});
		}
		oMockstar.insertTableData("gtt_item_ids", aItems);
	};
	
	function checkProperties(oNewItemsMasterCalcVer, oRootItemSourceCalcVer, aFields) {
		_.each(aFields, function(oField) {
			expect(oNewItemsMasterCalcVer.columns[oField].rows[0]).toBe(oRootItemSourceCalcVer[oField]);
		})
	};

	it('should not set the fields when creating a referenced version item and return the not-existing version if source version does not exist', function() {

		// arrange
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5810;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);

		//act
		var result = oMockstar.call(iCvId, sSessionId, null);

		//assert
		//ov_source_calculation_version_exists
		expect(result.columnInfo).toBeDefined();	
		expect(result[0].CALCULATION_VERSION_ID).toBe(5810);
		expect(result.length).toBe(1);
	});

	it('should not set the fields when creating referenced version items and return a a list of not-existing versions if source versions do not exist', function() {

		// arrange
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5810;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 999;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 4810;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998, 999);

		//act
		var result = oMockstar.call(iCvId, sSessionId, null);

		//assert
		//	ov_source_calculation_version_exists
		expect(result.columnInfo).toBeDefined();	
		expect(result.length).toBe(2);

		expect(result[0].CALCULATION_VERSION_ID).toBe(5810);
		expect(result[1].CALCULATION_VERSION_ID).toBe(4810);
	});

	it('should set the properties of the newly created item to the referenced version and return ov_source_calculation_version_exists = 1, when referenced version exists', function() {

		// arrange
		var iCalcVers = 4809;
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.CALCULATION_VERSION_ID = iCalcVers;
		oNewItem.ITEM_CATEGORY_ID = 10;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5809;
		oNewItem.QUANTITY_IS_MANUAL = 0;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);

		if(jasmine.plcTestRunParameters.generatedFields === true){
			var oNewItemExt = mockstar_helpers.convertToObject(testdata.oItemExtData, 4);
			oNewItemExt.SESSION_ID = sSessionId;
			oNewItemExt.ITEM_ID = 998;
			oNewItemExt.CALCULATION_VERSION_ID = iCalcVers;
			oMockstar.insertTableData("itemTemporaryExt", oNewItemExt);
		}
		
		//act
		var result = oMockstar.call(iCalcVers, sSessionId, null);

		//assert
		//ov_source_calculation_version_exists
		expect(result).toBeDefined();	
		expect(result.length).toBe(0);

		var oSourceCalcVer = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 2);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemTestData, 4);

		var oExpectedFieldValues = {
				"ITEM_ID" : [ 998 ],
				"CALCULATION_VERSION_ID" : [ 4809 ],
				"PARENT_ITEM_ID" : [ oNewItem.PARENT_ITEM_ID ],
				"PREDECESSOR_ITEM_ID" : [ oNewItem.PREDECESSOR_ITEM_ID ],
				"IS_ACTIVE" : [ oNewItem.IS_ACTIVE ],
				"ITEM_CATEGORY_ID" : [ 10 ],
				"QUANTITY" : [  oNewItem.QUANTITY],
				"QUANTITY_IS_MANUAL" : [ 1 ],
				"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.QUANTITY_UOM_ID ],
				"LOT_SIZE" : [ oNewItem.LOT_SIZE ], 
    			"LOT_SIZE_CALCULATED" : [ null ], 
    			"LOT_SIZE_IS_MANUAL" : [ 1 ],
				"TOTAL_QUANTITY" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
				"TOTAL_QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ oNewItem.TOTAL_QUANTITY_DEPENDS_ON],
				"BASE_QUANTITY" : [ oNewItem.BASE_QUANTITY],
				"BASE_QUANTITY_CALCULATED": [ null ],
				"BASE_QUANTITY_IS_MANUAL": [ 1 ],
				"PRICE_FIXED_PORTION":[oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION],
				"PRICE_VARIABLE_PORTION":[oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION],
				"PRICE" : [oRootItemSourceCalcVer.TOTAL_COST],
				"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID],
				"PRICE_UNIT" : [oRootItemSourceCalcVer.TOTAL_QUANTITY],
				"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],
				"PRICE_SOURCE_ID" : [oRootItemSourceCalcVer.PRICE_SOURCE_ID],
				"ITEM_DESCRIPTION" : [ oNewItem.ITEM_DESCRIPTION],
				"COMMENT" : [ oRootItemSourceCalcVer.COMMENT]
		};

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 998 and calculation_version_id = 4809");

		expect(oNewItemsMasterCalcVer).toMatchData(oExpectedFieldValues, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);

		if(jasmine.plcTestRunParameters.generatedFields === true){

			var oRootItemExtSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemExtData, 4);	
			//is_manual is set to 1 for all custom fields in case of item of type referenced field
            oRootItemExtSourceCalcVer.CUST_BOOLEAN_INT_IS_MANUAL  = 1;
            oRootItemExtSourceCalcVer.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL = 1;
            oRootItemExtSourceCalcVer.CUST_DECIMAL_WITHOUT_REF_IS_MANUAL = 1;
            oRootItemExtSourceCalcVer.CUST_INT_WITHOUT_REF_IS_MANUAL = 1;
            oRootItemExtSourceCalcVer.CUST_LOCAL_DATE_IS_MANUAL = 1;
            oRootItemExtSourceCalcVer.CUST_STRING_IS_MANUAL = 1;
            //since is_manual is null in the test data the manual fields are copied from the calculated
            oRootItemExtSourceCalcVer.CUST_BOOLEAN_INT_MANUAL = oRootItemExtSourceCalcVer.CUST_BOOLEAN_INT_CALCULATED;
            oRootItemExtSourceCalcVer.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL = oRootItemExtSourceCalcVer.CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_CALCULATED;
            oRootItemExtSourceCalcVer.CUST_DECIMAL_WITHOUT_REF_MANUAL = oRootItemExtSourceCalcVer.CUST_DECIMAL_WITHOUT_REF_CALCULATED;
            oRootItemExtSourceCalcVer.CUST_INT_WITHOUT_REF_MANUAL = oRootItemExtSourceCalcVer.CUST_INT_WITHOUT_REF_CALCULATED;
            oRootItemExtSourceCalcVer.CUST_STRING_MANUAL = oRootItemExtSourceCalcVer.CUST_STRING_CALCULATED;
			delete oRootItemExtSourceCalcVer.CUST_LOCAL_DATE_MANUAL;
			var oExpectedNewItemsExtMasterCalcVer = _.extend(mockstar_helpers.convertArrayOfObjectsToObjectOfArrays([oRootItemExtSourceCalcVer]), {"ITEM_ID" : [ 998 ], "CALCULATION_VERSION_ID" : [ 4809 ]});

			var oNewItemsExtMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporaryExt}} where item_id= 998");

			expect(oNewItemsExtMasterCalcVer).toMatchData(oExpectedNewItemsExtMasterCalcVer, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
		}	
	});

	it('should set the properties of the newly created item from a new unsaved version', function() {

		// arrange
		var iCalcVers = 999;
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.CALCULATION_VERSION_ID = iCalcVers;
		oNewItem.ITEM_CATEGORY_ID = 10;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5809;
		oNewItem.QUANTITY_IS_MANUAL = 1;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);
		
		var oNewVersion = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 1);
		oNewVersion.SESSION_ID = sSessionId;
		oNewVersion.CALCULATION_VERSION_ID = iCalcVers;
		oMockstar.insertTableData("calculation_version_temporary", oNewVersion);
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemTestData, 4);
		oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL = 0;
		oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL = 1;
		oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP = 1;
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);

		//act
		var result = oMockstar.call(iCalcVers, sSessionId, null);

		//assert
		//ov_source_calculation_version_exists
		expect(result).toBeDefined();	
		expect(result.length).toBe(0);

		var oSourceCalcVer = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 2);
		
		var oExpectedFieldValues = {
				"ITEM_ID" : [ 998 ],
				"CALCULATION_VERSION_ID" : [ iCalcVers ],
				"PARENT_ITEM_ID" : [ oNewItem.PARENT_ITEM_ID ],
				"PREDECESSOR_ITEM_ID" : [ oNewItem.PREDECESSOR_ITEM_ID ],
				"IS_ACTIVE" : [ oNewItem.IS_ACTIVE ],
				"ITEM_CATEGORY_ID" : [ 10 ],
				"QUANTITY" : [  oNewItem.QUANTITY],
				"QUANTITY_IS_MANUAL" : [  oNewItem.QUANTITY_IS_MANUAL ],
				"QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.QUANTITY_UOM_ID ],
				"TOTAL_QUANTITY" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY ],
				"TOTAL_QUANTITY_UOM_ID" : [ oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID ],
				"TOTAL_QUANTITY_DEPENDS_ON" : [ oNewItem.TOTAL_QUANTITY_DEPENDS_ON],
				"BASE_QUANTITY" : [ oNewItem.BASE_QUANTITY],
				"PRICE_FIXED_PORTION":[oRootItemSourceCalcVer.TOTAL_COST_FIXED_PORTION],
				"PRICE_VARIABLE_PORTION":[oRootItemSourceCalcVer.TOTAL_COST_VARIABLE_PORTION],
				"PRICE" : [oRootItemSourceCalcVer.TOTAL_COST],
				"TRANSACTION_CURRENCY_ID" : [ oSourceCalcVer.REPORT_CURRENCY_ID],
				"PRICE_UNIT" : [oRootItemSourceCalcVer.TOTAL_QUANTITY],
				"PRICE_UNIT_UOM_ID" : [oRootItemSourceCalcVer.TOTAL_QUANTITY_UOM_ID],
				"PRICE_SOURCE_ID" : [oRootItemSourceCalcVer.PRICE_SOURCE_ID],
				"IS_CONFIGURABLE_MATERIAL": [oRootItemSourceCalcVer.IS_CONFIGURABLE_MATERIAL],
				"IS_PHANTOM_MATERIAL": [oRootItemSourceCalcVer.IS_PHANTOM_MATERIAL],
				"IS_RELEVANT_TO_COSTING_IN_ERP": [oRootItemSourceCalcVer.IS_RELEVANT_TO_COSTING_IN_ERP],
				"ITEM_DESCRIPTION" : [ oNewItem.ITEM_DESCRIPTION],
				"COMMENT" : [ oRootItemSourceCalcVer.COMMENT]
		};

		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 998 and calculation_version_id = 999");

		expect(oNewItemsMasterCalcVer).toMatchData(oExpectedFieldValues, [ "ITEM_ID", "CALCULATION_VERSION_ID" ]);
	});
	
	it('should set the properties: overhead_group_id, company_code_id, plant_id, profit_center_id, business_area_id, confidence_level_id, price_source_id ' +
			'of the newly created item from a new unsaved version', function() {

		// arrange
		var iCalcVers = 999;
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.CALCULATION_VERSION_ID = iCalcVers;
		oNewItem.ITEM_CATEGORY_ID = 10;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5809;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);
		
		var oNewVersion = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 1);
		oNewVersion.SESSION_ID = sSessionId;
		oNewVersion.CALCULATION_VERSION_ID = iCalcVers;
		oMockstar.insertTableData("calculation_version_temporary", oNewVersion);
		
		//add in root item of the source version properties that need to be set
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemTestData, 4);
		oRootItemSourceCalcVer.PRICE_SOURCE_ID = "1111";
		oRootItemSourceCalcVer.CONFIDENCE_LEVEL_ID = 1;
		oRootItemSourceCalcVer.OVERHEAD_GROUP_ID =  "ov1";
		oRootItemSourceCalcVer.COMPANY_CODE_ID = "cc1";
		oRootItemSourceCalcVer.PLANT_ID = "PL1";
		oRootItemSourceCalcVer.PROFIT_CENTER_ID = "pc1";
		oRootItemSourceCalcVer.BUSINESS_AREA_ID = "Ba1";
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);
		
		//act
		var result = oMockstar.call(iCalcVers, sSessionId, null);

		//assert
		//check the newly set properties
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 998 and calculation_version_id = 999");

		checkProperties(oNewItemsMasterCalcVer, oRootItemSourceCalcVer, ["PRICE_SOURCE_ID","CONFIDENCE_LEVEL_ID","OVERHEAD_GROUP_ID","COMPANY_CODE_ID",
		                                                                 "PLANT_ID","PROFIT_CENTER_ID", "BUSINESS_AREA_ID"]); 		
	});
	
	it('should set the properties to reference root item values for account, document, material, engineering change number, valuation class, vendor, ' +
			'comment, local content, purchasing group, purchasing document', function() {

		// arrange
		var iCalcVers = 999;
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.CALCULATION_VERSION_ID = iCalcVers;
		oNewItem.ITEM_CATEGORY_ID = 10;
        oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5809;
        oNewItem.ACCOUNT_ID = null;
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);
		
		var oNewVersion = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 1);
		oNewVersion.SESSION_ID = sSessionId;
		oNewVersion.CALCULATION_VERSION_ID = iCalcVers;
		oMockstar.insertTableData("calculation_version_temporary", oNewVersion);
		
		//add in root item of the source version properties that need to be set
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemTestData, 4);
		oRootItemSourceCalcVer.ACCOUNT_ID = "ACC1";
		oRootItemSourceCalcVer.DOCUMENT_ID = "DOC1";
		oRootItemSourceCalcVer.DOCUMENT_PART = 'D1';
		oRootItemSourceCalcVer.MATERIAL_ID =  "MAT1";
		oRootItemSourceCalcVer.MATERIAL_SOURCE =  1;
		oRootItemSourceCalcVer.MATERIAL_TYPE_ID =  "MTP";
		oRootItemSourceCalcVer.VALUATION_CLASS_ID = "V1";
		oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID = "ENN1";
		oRootItemSourceCalcVer.COMMENT = "Comm 1";
		oRootItemSourceCalcVer.VENDOR_ID = "VEN1";
		oRootItemSourceCalcVer.PURCHASING_GROUP = "PRGR1";
		oRootItemSourceCalcVer.PURCHASING_DOCUMENT = "PRDOC";
		oRootItemSourceCalcVer.LOCAL_CONTENT = '17.0000000';	
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);
		
		//act
		var result = oMockstar.call(iCalcVers, sSessionId, null);

		//assert
		//check the newly set properties
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 998 and calculation_version_id = 999");

		checkProperties(oNewItemsMasterCalcVer, oRootItemSourceCalcVer, ["ACCOUNT_ID","DOCUMENT_ID","DOCUMENT_PART","MATERIAL_ID","VALUATION_CLASS_ID","COMMENT",
		                                                                 "ENGINEERING_CHANGE_NUMBER_ID","LOCAL_CONTENT","VENDOR_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT"]); 		
    });
    
    it('should set the properties to input values for account_id if defined ', function() {

		// arrange
		var iCalcVers = 999;
		var oNewItem = mockstar_helpers.convertToObject(testdata.oItemTestData, 0);
		oNewItem.SESSION_ID = sSessionId;
		oNewItem.ITEM_ID = 998;
		oNewItem.CALCULATION_VERSION_ID = iCalcVers;
		oNewItem.ITEM_CATEGORY_ID = 10;
		oNewItem.REFERENCED_CALCULATION_VERSION_ID = 5809;
		oNewItem.ACCOUNT_ID = "ACC2";
		oMockstar.insertTableData("itemTemporary", oNewItem);
		fillTemporaryTable(998);
		
		var oNewVersion = mockstar_helpers.convertToObject(testdata.oCalculationVersionTestData, 1);
		oNewVersion.SESSION_ID = sSessionId;
		oNewVersion.CALCULATION_VERSION_ID = iCalcVers;
		oMockstar.insertTableData("calculation_version_temporary", oNewVersion);
		
		//add in root item of the source version properties that need to be set
		var oRootItemSourceCalcVer = mockstar_helpers.convertToObject(testdata.oItemTestData, 4);
		oRootItemSourceCalcVer.ACCOUNT_ID = "ACC2";
		oRootItemSourceCalcVer.DOCUMENT_ID = "DOC1";
		oRootItemSourceCalcVer.DOCUMENT_PART = 'D1';
		oRootItemSourceCalcVer.MATERIAL_ID =  "MAT1";
		oRootItemSourceCalcVer.MATERIAL_SOURCE =  1;
		oRootItemSourceCalcVer.MATERIAL_TYPE_ID =  "MTP";
		oRootItemSourceCalcVer.VALUATION_CLASS_ID = "V1";
		oRootItemSourceCalcVer.ENGINEERING_CHANGE_NUMBER_ID = "ENN1";
		oRootItemSourceCalcVer.COMMENT = "Comm 1";
		oRootItemSourceCalcVer.VENDOR_ID = "VEN1";
		oRootItemSourceCalcVer.PURCHASING_GROUP = "PRGR1";
		oRootItemSourceCalcVer.PURCHASING_DOCUMENT = "PRDOC";
		oRootItemSourceCalcVer.LOCAL_CONTENT = '17.0000000';			
		oMockstar.clearTable("item");
		oMockstar.insertTableData("item", oRootItemSourceCalcVer);
		
		//act
		var result = oMockstar.call(iCalcVers, sSessionId, null);

		//assert
		//check the newly set properties
		var oNewItemsMasterCalcVer = oMockstar.execQuery("select * from {{itemTemporary}} where item_id= 998 and calculation_version_id = 999");

		checkProperties(oNewItemsMasterCalcVer, oRootItemSourceCalcVer, ["ACCOUNT_ID","DOCUMENT_ID","DOCUMENT_PART","MATERIAL_ID","VALUATION_CLASS_ID","COMMENT",
		                                                                 "ENGINEERING_CHANGE_NUMBER_ID","LOCAL_CONTENT","VENDOR_ID","PURCHASING_GROUP","PURCHASING_DOCUMENT"]); 		
	});
}).addTags(["All_Unit_Tests","CF_Unit_Tests"]);