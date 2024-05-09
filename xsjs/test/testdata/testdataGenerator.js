var _ = require("lodash");
var helpers = require("../../lib/xs/util/helpers");
var testdata = require("./testdata");
var TestDataUtility = require("../testtools/testDataUtility").TestDataUtility;

/**
 * Creates an object for item extension
 * 
 * @param {array}
 *            aItemIds - Array with item ids
 * @param {array}
 *            aCalculationIds - Array with calculations ids
 * @param {object}
 *            oCustomFields - Object containing custom fields 
 *                  {"CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0],
                	"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_IS_MANUAL":[null,null,null,null,null]....}
 * @param {int} 
 *            iNoRows - Number of rows that must be read from oCustomFields
 * @returns {object} - Returns an object containing the entries:
 *            e.g: 	(for iNoRows = 5)
                   {
                   	"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ], (from aItemIds)
    	            "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ],(from aCalculationIds)
                	"CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0],
                	"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_IS_MANUAL":[null,null,null,null,null]....}
 */
function createItemExtObjectFromObject(aItemIds, aCalculationIds,oCustomFields,iNoRows){

	if (aItemIds.length!==iNoRows || aCalculationIds.length !== iNoRows) {
		throw new Error("aItemIds and aCalculationIds must have the same lenght as iNoRows");
	}	
	
	var aKeys = _.keys(oCustomFields);
	var oExtItem = {};

	_.each(aKeys,function(sKey,iIndex){
		if(oCustomFields[sKey].length < iNoRows)
			throw new Error("the lenght of the array of cutom fields must be greater then iNoRows");
		oExtItem[sKey] = oCustomFields[sKey].slice(0,iNoRows);
	});
	
	oExtItem["ITEM_ID"] = aItemIds;
	oExtItem["CALCULATION_VERSION_ID"] = aCalculationIds;
		
	return oExtItem;
}

/**
 * Creates an object for item extension
 * 
 * @param {array}
 *            aItemIds - Array with item ids
 * @param {array}
 *            aCalculationIds - Array with calculations ids
 * @param {array}
 *            aSessionIds - Array with session ids
 * @param {object}
 *            oCustomFields - Object containing custom fields 
 *                  {"CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0],
                	"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_IS_MANUAL":[null,null,null,null,null]....}
 * @param {int} 
 *            iNoRows - Number of rows that must be read from oCustomFields
 * @returns {object} - Returns an object containing the entries:
 *            e.g: 	(for iNoRows = 5)
                   {
                   	"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ], (from aItemIds)
    	            "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ],(from aCalculationIds)
                	"SESSION_ID" : [ "I000001", "I000001", "I000001", "I000001", "I000001" ]
                	"CUST_BOOLEAN_INT_MANUAL":[1,0,1,1,0],
                	"CUST_BOOLEAN_INT_CALCULATED":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_UNIT":[null,null,null,null,null],
                	"CUST_BOOLEAN_INT_IS_MANUAL":[null,null,null,null,null]....}
 */
function createItemTempExtObjectFromObject(aItemIds, aCalculationIds, aSessionIds, oCustomFields,iNoRows){

	var oExtItemTemp = {};
	if (aSessionIds.length!==iNoRows) {
		throw new Error("aSessionIds must have the same lenght as iNoRows");
	}
	oExtItemTemp = createItemExtObjectFromObject(aItemIds, aCalculationIds,oCustomFields,iNoRows)
	oExtItemTemp["SESSION_ID"] = aSessionIds;
	return oExtItemTemp;
}

/**
 * Build the test data for update - setting referenced calculation version tests
 */
function buildTestDataForSettingReferencedCalcVer(bGenerateCustomFields){
	const testData = testdata.data; // dynamically generated, depending on $ session
	var oTestData = {};
	
	var sSessionId = $.session.getUsername();
	
	var iMasterCalcVerId = 2809;
	var iSourceCalcVerId = 4809;
	
	var oCalcTestData = new TestDataUtility(testData.oCalculationTestData) //"CURRENT_CALCULATION_VERSION_ID" : [ 2809, 4809, 5809 ]
										.build();	
	
	var oCalcVerTestData = new TestDataUtility(testData.oCalculationVersionTestData)	//[ 2809, 4809, 5809 ]
										.deleteProperty("REPORT_CURRENCY_ID")
										.addProperty("REPORT_CURRENCY_ID", [ "USD", "EUR", "EUR"])	//USD should be used 
										.build();	
	var oItemTestDataBuilder =  new TestDataUtility(testData.oItemTestData)
											// "ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001 ]
											// "CALCULATION_VERSION_ID" : [ iCalculationVersionId, iCalculationVersionId, iCalculationVersionId, 4809, 5809 ]
											// we would copy values from "ITEM_ID" : [ 5001 ] with "CALCULATION_VERSION_ID" : [ 4809 ]
											//alter some value so we could see those copied in the referenced item, but in different fields
											.deleteProperty("TOTAL_QUANTITY_UOM_ID")
											.addProperty("TOTAL_QUANTITY_UOM_ID", ["PC", "PC", "PC", "M", "PC" ]) 
											.deleteProperty("TOTAL_COST_FIXED_PORTION")
											.addProperty("TOTAL_COST_FIXED_PORTION", [ "0.0000000", "0.0000000", "0.0000000", "2590.9600000", "0.0000000" ])
											.deleteProperty("TOTAL_COST_VARIABLE_PORTION")
											.addProperty("TOTAL_COST_VARIABLE_PORTION", [ "0.0000000", "0.0000000", "0.0000000", "371.1100000", "0.0000000" ])
											.deleteProperty("TOTAL_COST")
											.addProperty("TOTAL_COST", ["0.0000000", "0.0000000", "0.0000000", "2962.0700000", "0.0000000" ]);
	oItemTestDataBuilder.addObject(oItemTestDataBuilder.getObject(1))
	                    .deleteProperty("ITEM_ID")
						.addProperty("ITEM_ID", [ 3001, 3002, 3003, 5001, 7001, 3004 ]);
	var oItemSourceTestData = oItemTestDataBuilder.build();

    var oItemMasterTempTestDataBuilder = new TestDataUtility(testData.oItemTestData) 
												.deleteObject(4)
												.deleteObject(3)	// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
												//3002 and 3004 are sub-items of 3001
												.addProperty("SESSION_ID", [ sSessionId, sSessionId, sSessionId ])
												//alter some value so we could see a change after update
												.deleteProperty("QUANTITY")
												.addProperty("QUANTITY", [ "2", "1.0000000", "1.0000000","1.0000000" ])	//here 2 should become 1 after update
												.deleteProperty("TOTAL_QUANTITY")
												.addProperty("TOTAL_QUANTITY", [ "3", "1.0000000", "1.0000000","1.0000000" ])	//here 3 should become 1
												.deleteProperty("TOTAL_QUANTITY_DEPENDS_ON")
												.addProperty("TOTAL_QUANTITY_DEPENDS_ON", [ 2, 1, 1,1 ])	//here 2 should become 1
												.deleteProperty("TOTAL_QUANTITY")
												.addProperty("TOTAL_QUANTITY", [ "10", "1.0000000", "1.0000000","1.0000000" ])	//here 10 should become 1
												.deleteProperty("LOT_SIZE")
												.addProperty("LOT_SIZE", [ "1", null, null,null ])	//here 1 should become null
												.deleteProperty("IS_ACTIVE")
												.addProperty("IS_ACTIVE", [ "0", "1", "1","1" ])	//here 0 should become 1
												.addProperty("HIGHLIGHT_GREEN", [ 1, 0, 0,0 ])	//here 1 should become 0
												.addProperty("HIGHLIGHT_ORANGE", [ 1, 0, 0,0 ])	//here 1 should become 0
												.addProperty("HIGHLIGHT_YELLOW", [ 1, 0, 0,0 ]);	//here 1 should become 0
	oItemMasterTempTestDataBuilder.addObject(oItemMasterTempTestDataBuilder.getObject(1))
	                    .deleteProperty("ITEM_ID")
						.addProperty("ITEM_ID", [ 3001, 3002, 3003, 3004 ]);
	var oItemMasterTempTestData = oItemMasterTempTestDataBuilder.build();
	
	oTestData["CalcTestData"] = oCalcTestData;
	oTestData["CalcVerTestData"] = oCalcVerTestData;
	oTestData["ItemSourceTestData"] = oItemSourceTestData;
	oTestData["ItemMasterTempTestData"] = oItemMasterTempTestData;
	
	if (bGenerateCustomFields === true) {
		var oItemExtTestData = {
				"ITEM_ID" : [ 3001, 3002, 3003, 5001, 7001,3004 ],	// ITEM_ID = 5001 is the root item of the source calculation version
		    	"CALCULATION_VERSION_ID" : [ iMasterCalcVerId, iMasterCalcVerId, iMasterCalcVerId, iSourceCalcVerId, 5809 ,iMasterCalcVerId],
		    	"CUST_BOOLEAN_INT_MANUAL":[1, 0, 1, 1, 0,0], 
		    	"CUST_BOOLEAN_INT_IS_MANUAL": [1,1,1,1,1],
		    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":["20.0000000", "300.5000000", "40.8800000", "50.9600000", "600.0000000", "300.5000000"],
		    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL":[1,1,1,1,1],
		    	"CUST_STRING_MANUAL":["Test 1", "Test 2", "Test 3", "Test 4", "Test 5","Test 6"],
		    	"CUST_STRING_IS_MANUAL": [1,1,1,1,1],
		    	"CUST_STRING_FORMULA_IS_MANUAL": [null, null, null, null, null, null],
		    	"CUST_STRING_FORMULA_MANUAL": ["Test 1", "Test 2", "Test 3", "Test 4", "Test 5","Test 6"],
		    	"CUST_STRING_FORMULA_CALCULATED": ["T1", "T2", "T3", "T4", "T5","T6"],
		    	"CUST_INT_FORMULA_IS_MANUAL": [1, 1, 1, 1, 1, 1],
		    	"CUST_INT_FORMULA_MANUAL": [1, 2, 3, 4, 5, 6],
		    	"CUST_INT_FORMULA_CALCULATED": [10, 20, 30, 40, 50, 60],
		};
		var oItemTempExtTestData = new TestDataUtility(oItemExtTestData)
												.deleteObject(4)
												.deleteObject(3)	// we need only "ITEM_ID" : [ 3001, 3002, 3003, 3004 ] for master calc ver iCvId = testData.iCalculationVersionId = 2809
												.addProperty("SESSION_ID", [ sSessionId, sSessionId, sSessionId,sSessionId ]) 
												.build();
		
		oTestData["ItemExtTestData"] = oItemExtTestData;
		oTestData["ItemTempExtTestData"] = oItemTempExtTestData;
	}
	
	return oTestData;
}

/**
 * Build the test data for update - setting referenced calculation version tests during creating of lifecycle versions
 */
function buildTestDataForSettingReferencedLifecycleCalculationVersion(bGenerateCustomFields, iLifecyclePeriod, iVersionNumber){
	const testData = testdata.data; // dynamically generated, depending on $ session
	var oTestData = buildTestDataForSettingReferencedCalcVer(bGenerateCustomFields);
	
	var oReferencedLifecycleVersion;
	var oReferencedLifecycleVersionItems;
	
	// Set second version from test data as referenced base version 
	oTestData.ItemSourceTestData.ITEM_CATEGORY_ID = [ 0, 1, 3, 0, 0, 10];
	oTestData.ItemSourceTestData.REFERENCED_CALCULATION_VERSION_ID = [ null, null, null, null, null, testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1] ];
	oTestData.ReferencingItemId = oTestData.ItemSourceTestData.ITEM_ID[5];
	
	
	if(helpers.isNullOrUndefined(iLifecyclePeriod) === false){
		// Create lifecycle version of referenced version for given lifecycle period
		var iReferencedBaseVersion = testData.oCalculationVersionTestData.CALCULATION_VERSION_ID[1];
		var iReferencedLifecycleVersion = iReferencedBaseVersion + iVersionNumber;  // Number is needed to differentiate between lifecycle versions
		
		// create version header
		var oReferencedLifecycleVersion =  new TestDataUtility(testData.oCalculationVersionTestData).getObject(1);	
			oReferencedLifecycleVersion.CALCULATION_VERSION_ID = iReferencedLifecycleVersion; 
			oReferencedLifecycleVersion.CALCULATION_VERSION_NAME = "Calc version " + iReferencedLifecycleVersion; 
			oReferencedLifecycleVersion.LIFECYCLE_PERIOD_FROM = iLifecyclePeriod;
			oReferencedLifecycleVersion.CALCULATION_VERSION_TYPE = 2;
			oReferencedLifecycleVersion.BASE_VERSION_ID = iReferencedBaseVersion;

		// create version root item
		var oReferencedLifecycleVersionItems =  new TestDataUtility(testData.oItemTestData).getObject(3);
			oReferencedLifecycleVersionItems.CALCULATION_VERSION_ID = iReferencedLifecycleVersion; 
			//alter some value so we could see them copied in the referenced item
			oReferencedLifecycleVersionItems.QUANTITY = 1;
			oReferencedLifecycleVersionItems.TOTAL_QUANTITY = "11.0000000";
			oReferencedLifecycleVersionItems.TOTAL_QUANTITY_DEPENDS_ON = 1;
			oReferencedLifecycleVersionItems.LOT_SIZE = 2;
			oReferencedLifecycleVersionItems.IS_ACTIVE = 1;	
			
		oTestData.ReferencedLifecycleVersion = oReferencedLifecycleVersion;
		oTestData.ReferencedLifecycleVersionItems = oReferencedLifecycleVersionItems;
		
		if (bGenerateCustomFields === true) {
			// set other values for the root item custom fields of referenced lifecycle version to see the difference 
			var oReferencedExtLifecycleVersionItems =  {
					"ITEM_ID" : [ 5001 ],	// ITEM_ID = 5001 is the root item of the source calculation version
			    	"CALCULATION_VERSION_ID" : [ iReferencedLifecycleVersion],
			    	"CUST_BOOLEAN_INT_MANUAL":[0], 
			    	"CUST_BOOLEAN_INT_IS_MANUAL": [1],
			    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_MANUAL":["300.5000000"],
			    	"CUST_DECIMAL_WITH_REF_CUSTOM_CURRENCY_IS_MANUAL":[1],
			    	"CUST_STRING_MANUAL":["Test 6"],
			    	"CUST_STRING_IS_MANUAL": [1],
			    	"CUST_STRING_FORMULA_CALCULATED": ["T6"],
			    	"CUST_INT_FORMULA_IS_MANUAL": [1],
			    	"CUST_INT_FORMULA_MANUAL": [6],
			    	"CUST_INT_FORMULA_CALCULATED": [60],
			};

			oTestData.ReferencedExtLifecycleVersionItems = oReferencedExtLifecycleVersionItems;
		}
		
	}
	
	return oTestData;
}


/**
 * Build the test data for update - setting referenced calculation version tests
 * 
 * @param {boolean}
 *            bGenerateCustomFields - if test data for custom fields will also be generated
 * @returns {object} - returns needed test data that will be inserted into relevant mocked tables
 */
function buildTestDataForReferencedCalcVer(){
	const testData = testdata.data; // dynamically generated, depending on $ session
	var oTestData = {};
	var sSessionId = testData.sSessionId;
	var iSourceCalcVerId = testData.iSecondVersionId; //4809;
	
	var oItemTestDataBuilder =  new TestDataUtility(testData.oItemTestData)
	            .deleteProperty("ITEM_ID")
				.addProperty("ITEM_ID", [ 3001, 3002, 3003, 5001, 7001, 3004 ])
				.deleteProperty("ITEM_CATEGORY_ID")
				.addProperty("ITEM_CATEGORY_ID", [ 0, 1, 3, 0, 0, 10])
				.addProperty("REFERENCED_CALCULATION_VERSION_ID", [ null, null, null, null, null, iSourceCalcVerId ]);
	var oItemSourceTestData = oItemTestDataBuilder.build();
	
	var oItemTempTestDataBuilder =  new TestDataUtility(oItemSourceTestData)
	            .addProperty("SESSION_ID", [ sSessionId, sSessionId, sSessionId, sSessionId, sSessionId,sSessionId ]);
    var oItemSourceTempTestData = oItemTempTestDataBuilder.build();
    
	var oReferenceVersionComponentSplitBuilderTemporary =  new TestDataUtility(testData.oReferencedVersionComponentSplitTemporaryTestData);
	var oReferenceVersionComponentSplitTemporary = oReferenceVersionComponentSplitBuilderTemporary.build();

	var oReferenceVersionComponentSplitBuilder =  new TestDataUtility(testData.oReferencedVersionComponentSplitTestData);
	var oReferenceVersionComponentSplit = oReferenceVersionComponentSplitBuilder.build();
	
	oTestData.ItemSourceTestData = oItemSourceTestData;
	oTestData.ItemSourceTempTestData = oItemSourceTempTestData;
	oTestData.ReferenceVersionComponentSplitTemporary = oReferenceVersionComponentSplitTemporary;
	oTestData.ReferenceVersionComponentSplit = oReferenceVersionComponentSplit;
	
	return oTestData;
}

module.exports = {
	createItemExtObjectFromObject,
	createItemTempExtObjectFromObject,
	buildTestDataForSettingReferencedCalcVer,
	buildTestDataForSettingReferencedLifecycleCalculationVersion,
	buildTestDataForReferencedCalcVer
};
