/*jslint undef:true*/
if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.metadata.metadataProvider-tests', function() {
		var _ = require("lodash");
		var helpers = require("../../../lib/xs/util/helpers");
		var Persistency = $.import("xs.db", "persistency").Persistency;
	
		var MetadataImport = require("../../../lib/xs/metadata/metadataProvider");
		var MetadataProvider = MetadataImport.MetadataProvider;
		var oPersistencyMock = null;
	
		var oMetadataTest = {
			SCENARIO : "admin",
			BUSINESS_OBJECT : "material",
			COLUMN_ID : "MATERIAL_ID",
			PATH : "Path",
			IS_CUSTOM : 0,
			ROLLUP_TYPE_ID : 0,
			SIDE_PANEL_GROUP_ID : 0,
			DISPLAY_ORDER : 1,
			REF_UOM_CURRENCY_BUSINESS_OBJECT : "material",
			REF_UOM_CURRENCY_COLUMN : "MATERIAL_ID",
			UOM_CURRENCY_FLAG : 1,
			SEMANTIC_DATA_TYPE : "Integer",
			IS_IMMUTABLE_AFTER_SAVE : 1,
			IS_REQUIRED_IN_MASTERDATA : 0,
			TRIGGERS_PRICE_DETERMINATION : 0,
			TEXT : [ {
				SCENARIO : "admin",
				BUSINESS_OBJECT : "material",
				COLUMN_ID : "MATERIAL_ID",
				LANGUAGE : "EN",
				DISPLAY_NAME : "Material ID",
				DISPLAY_DESCRIPTION : "Identification Number for Material"
			}, {
				SCENARIO : "admin",
				BUSINESS_OBJECT : "material",
				COLUMN_ID : "MATERIAL_ID",
				LANGUAGE : "DE",
				DISPLAY_NAME : "Material ID",
				DISPLAY_DESCRIPTION : "Identifikationsnummer fÃ¼r Material"
			} ],
			ATTRIBUTES : [ {
				SCENARIO : "admin",
				BUSINESS_OBJECT : "material",
				COLUMN_ID : "MATERIAL_ID",
				ITEM_CATEGORY_ID : "1",
				PATH : "Path",
				SUBITEM_STATE : 1,
				IS_MANDATORY : 1,
				IS_READ_ONLY : 1,
				IS_TRANSFERABLE : 1
			}, {
				SCENARIO : "admin",
				BUSINESS_OBJECT : "material",
				COLUMN_ID : "MATERIAL_ID",
				ITEM_CATEGORY_ID : "1",
				PATH : "Path",
				SUBITEM_STATE : 2,
				IS_MANDATORY : 1,

				IS_READ_ONLY : 1,
				IS_TRANSFERABLE : 1
			} ],
			FORMULAS : []
		};
	
		function arrangeText(oMeta) {
			var oMetadataText = _.clone(oMeta);
			oMetadataText.TEXT[1].BUSINESS_OBJECT = "mat";
			oMetadataText.TEXT[1].COLUMN_ID = "id";
			var aMetaData = [ oMetadataText ];
			return aMetaData;
		}
	
		function arrangeAttributes(oMeta) {
			var oMetadataAttr = _.clone(oMeta);
			oMetadataAttr.ATTRIBUTES[0].BUSINESS_OBJECT = "mat";
			oMetadataAttr.ATTRIBUTES[0].COLUMN_ID = "id";
			oMetadataAttr.ATTRIBUTES[0].PATH = "p1";
			var aMetaData = [ oMetadataAttr ];
			return aMetaData;
		}
	
		function restoreMetadataTest() {
			oMetadataTest.ATTRIBUTES[0].BUSINESS_OBJECT = "material";
			oMetadataTest.ATTRIBUTES[0].COLUMN_ID = "MATERIAL_ID";
			oMetadataTest.ATTRIBUTES[0].PATH = "Path";
			oMetadataTest.TEXT[1].BUSINESS_OBJECT = "material";
			oMetadataTest.TEXT[1].COLUMN_ID = "MATERIAL_ID";
	
		}
	
		beforeEach(function() {
			oPersistencyMock = jasmine.createSpyObj("oPersistencyMock", [ "Persistency" ]);
			oPersistencyMock.constructor = Persistency;
		});
	
		describe("getColumnsForCategories", function() {
	
			var metadataProvider;
	
			beforeEach(function() {
				oPersistencyMock.Metadata = jasmine.createSpyObj("oPersistencyMock.Metadata", [ "getColumnsForCategories" ]);
				metadataProvider = new MetadataProvider();
			});
	
			it("should return empty object if no columns are defined in metadata for business object and path", function() {
				// arrange
				oPersistencyMock.Metadata.getColumnsForCategories.and.returnValue([]);
	
				// act
				var mColumnsPerCategory = metadataProvider.getColumnsForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock);
	
				// assert
				expect(helpers.isPlainObject(mColumnsPerCategory)).toBe(true);
				expect(_.keys(mColumnsPerCategory).length).toEqual(0);
			});
	
			it("should return columns only for wild card category if columns are only defined for wild card category", function() {
				// arrange
				oPersistencyMock.Metadata.getColumnsForCategories.and.returnValue([ {
					ITEM_CATEGORY_ID : -1,
					COLUMN_ID : "WILD_CARD_COLUMN_1"
				} ]);
	
				// act
				var mColumnsPerCategory = metadataProvider.getColumnsForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock);
	
				// assert
				expect(mColumnsPerCategory[-1].length).toBe(1);
				expect(mColumnsPerCategory[-1][0]).toEqual("WILD_CARD_COLUMN_1");
			});
	
			it("should return columns for category if the columns are defined for these categories", function() {
				// arrange
				oPersistencyMock.Metadata.getColumnsForCategories.and.returnValue([ {
					ITEM_CATEGORY_ID : 1,
					COLUMN_ID : "COLUMN_CAT_1"
				}, {
					ITEM_CATEGORY_ID : 2,
					COLUMN_ID : "COLUMN_CAT_2"
				} ]);
	
				// act
				var mColumnsPerCategory = metadataProvider.getColumnsForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock);
	
				// assert
				jasmine.log("Checking if there are no columns for the wild card item category");
				expect(mColumnsPerCategory[-1]).not.toBeDefined();
	
				jasmine.log(`Checking if the returned column for cat 1 is {0}", "COLUMN_CAT_1`);
				expect(mColumnsPerCategory[1]).toEqual([ "COLUMN_CAT_1" ]);
				jasmine.log(`Checking if the returned column for cat 2 is {0}", "COLUMN_CAT_2`);
				expect(mColumnsPerCategory[2]).toEqual([ "COLUMN_CAT_2" ]);
			});
	
			it("should return columns for category together with wild card columns if columns for specific categories and the"
					+ " wild card category are defined", function() {
				// arrange
				oPersistencyMock.Metadata.getColumnsForCategories.and.returnValue([ {
					ITEM_CATEGORY_ID : -1,
					COLUMN_ID : "WILD_CARD_COLUMN_1"
				}, {
					ITEM_CATEGORY_ID : -1,
					COLUMN_ID : "WILD_CARD_COLUMN_2"
				}, {
					ITEM_CATEGORY_ID : 1,
					COLUMN_ID : "COLUMN_CAT_1"
				}, {
					ITEM_CATEGORY_ID : 2,
					COLUMN_ID : "COLUMN_CAT_2"
				} ]);
	
				// act
				var mColumnsPerCategory = metadataProvider.getColumnsForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock);
	
				// assert
				jasmine.log("Checking if there are no columns for the wild card item category");
				expect(mColumnsPerCategory[-1]).not.toBeDefined();
	
				var aExpectedColumnsCat1 = [ "WILD_CARD_COLUMN_1", "WILD_CARD_COLUMN_2", "COLUMN_CAT_1" ].sort();
				var aActualColumnsCat1 = mColumnsPerCategory[1].sort();
				jasmine.log(`Checking if for category 1 the correct columns are returned. Expected: ${aExpectedColumnsCat1.join(", ")}, actual: ${aActualColumnsCat1.join(", ")}`);
				expect(_.isEqual(aExpectedColumnsCat1, aActualColumnsCat1)).toBe(true);
	
				var aExpectedColumnsCat2 = [ "WILD_CARD_COLUMN_1", "WILD_CARD_COLUMN_2", "COLUMN_CAT_2" ].sort();
				var aActualColumnsCat2 = mColumnsPerCategory[2].sort();
				jasmine.log(`Checking if for category 2 the correct columns are returned: Expected: ${aExpectedColumnsCat2.join(", ")}, actual: ${aActualColumnsCat2.join(", ")}`);
				expect(_.isEqual(aExpectedColumnsCat2, aActualColumnsCat2)).toBe(true);
			});
		});
		
		describe("getCustomFieldsWithDefaultValuesForCategories", function() {
			
			let metadataProvider;
	
			beforeEach(function() {
				oPersistencyMock.Metadata = jasmine.createSpyObj("oPersistencyMock.Metadata", [ "getCustomFieldsWithDefaultValuesForCategories" ]);
				metadataProvider = new MetadataProvider();
			});
	
			it("should return empty object if no columns are defined in metadata for business object and path", function() {
				// arrange
				oPersistencyMock.Metadata.getCustomFieldsWithDefaultValuesForCategories.and.returnValue([]);
	
				// act
				const mColumnsPerCategoryWithDefaultValues = metadataProvider.getCustomFieldsWithDefaultValuesForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock,{});
	
				// assert
				expect(helpers.isPlainObject(mColumnsPerCategoryWithDefaultValues)).toBe(true);
				expect(_.keys(mColumnsPerCategoryWithDefaultValues).length).toEqual(0);
			});
	
			it("should return columns with default values for category if the columns are defined for these categories", function() {
				// arrange
				oPersistencyMock.Metadata.getCustomFieldsWithDefaultValuesForCategories.and.returnValue([ 
					{
						ITEM_CATEGORY_ID : 1,
						COLUMN_ID : "CUST_STRING",
						DEFAULT_VALUE : "ABC",
						PROPERTY_TYPE : "3"
					}, 
					{
						ITEM_CATEGORY_ID : 1,
						COLUMN_ID : "CUST_DECIMAL_WITH_CURRENCY",
						DEFAULT_VALUE : "10.3",
						PROPERTY_TYPE : "2"
					}, 
					{
						ITEM_CATEGORY_ID : 1,
						COLUMN_ID : "CUST_DECIMAL_WITH_CURRENCY_UNIT",
						DEFAULT_VALUE : "USD",
						PROPERTY_TYPE : 7,
						UOM_CURRENCY_FLAG : 1
					}, 
					{
						ITEM_CATEGORY_ID : 1,
						COLUMN_ID : "CUST_DECIMAL_WITH_UOM",
						DEFAULT_VALUE : "10.3",
						PROPERTY_TYPE : "2"
					}, 
					{
						ITEM_CATEGORY_ID : 1,
						COLUMN_ID : "CUST_DECIMAL_WITH_UOM_UNIT",
						DEFAULT_VALUE : "CM",
						PROPERTY_TYPE : 6,
						UOM_CURRENCY_FLAG : 1
					}, 
					{
						ITEM_CATEGORY_ID : 2,
						COLUMN_ID : "CMAT_STRING",
						DEFAULT_VALUE : "DEF",
						PROPERTY_TYPE : "3"
					}, 
					{
						ITEM_CATEGORY_ID : 2,
						COLUMN_ID : "CMAT_DECIMAL_WITH_CURRENCY",
						DEFAULT_VALUE : "30.3",
						PROPERTY_TYPE : "2"
					}, 
					{
						ITEM_CATEGORY_ID : 2,
						COLUMN_ID : "CMAT_DECIMAL_WITH_CURRENCY_UNIT",
						DEFAULT_VALUE : "CAD",
						PROPERTY_TYPE : 7,
						UOM_CURRENCY_FLAG : 1
					}, 
					{
						ITEM_CATEGORY_ID : 2,
						COLUMN_ID : "CMAT_DECIMAL_WITH_UOM",
						DEFAULT_VALUE : "20.5",
						PROPERTY_TYPE : "2"
					},
					{
						ITEM_CATEGORY_ID : 2,
						COLUMN_ID : "CMAT_DECIMAL_WITH_UOM_UNIT",
						DEFAULT_VALUE : "KG",
						PROPERTY_TYPE : 6,
						UOM_CURRENCY_FLAG : 1
					},
				]);
				
				const oGeneralDefaultValues = {};
				oGeneralDefaultValues.ReportingCurrency = "EUR";
				const aExpectedDefaultValuesPerCategory1 = {"CUST_STRING_MANUAL": "ABC","CUST_DECIMAL_WITH_CURRENCY_MANUAL":"10.3",
                        "CUST_DECIMAL_WITH_CURRENCY_UNIT":oGeneralDefaultValues.ReportingCurrency,"CUST_DECIMAL_WITH_UOM_MANUAL":"10.3", 
                        "CUST_DECIMAL_WITH_UOM_UNIT": "CM"};
				const aExpectedDefaultValuesPerCategory2 = {"CMAT_STRING_MANUAL":"DEF", "CMAT_DECIMAL_WITH_CURRENCY_MANUAL":"30.3", 
                        "CMAT_DECIMAL_WITH_CURRENCY_UNIT":"CAD", "CMAT_DECIMAL_WITH_UOM_MANUAL":"20.5",
                        "CMAT_DECIMAL_WITH_UOM_UNIT":"KG"};
	
				// act
				const mColumnsPerCategory = metadataProvider.getCustomFieldsWithDefaultValuesForCategories("DummyPath", "DummyBusinessObject", oPersistencyMock,oGeneralDefaultValues);
	
				// assert	
				expect(mColumnsPerCategory[1]).toEqual(aExpectedDefaultValuesPerCategory1);
				expect(mColumnsPerCategory[2]).toEqual(aExpectedDefaultValuesPerCategory2);
			});
		});
		
		describe("batchCreateUpdateDelete", function() {
			var metadataProvider;
			var oMetaTest = {
					PATH : "Material",
					BUSINESS_OBJECT : "Material",
					COLUMN_ID : "CMAT_TEST123",
					IS_CUSTOM : 1,
					ROLLUP_TYPE_ID : 0,
					SIDE_PANEL_GROUP_ID : 0,
					DISPLAY_ORDER : 1,
					REF_UOM_CURRENCY_PATH : "Material",
					REF_UOM_CURRENCY_BUSINESS_OBJECT : "Material",
					REF_UOM_CURRENCY_COLUMN : "CMAT_TEST123_UNIT",
					UOM_CURRENCY_FLAG : 0,
					SEMANTIC_DATA_TYPE : "Integer",
					IS_IMMUTABLE_AFTER_SAVE : 1,
					IS_REQUIRED_IN_MASTERDATA : 0,
					TRIGGERS_PRICE_DETERMINATION : 0,
					TEXT : [],
					ATTRIBUTES : [ {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_TEST123",
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_MANDATORY : 1,
								IS_READ_ONLY : 1,
						IS_TRANSFERABLE : 1
					}],
					FORMULAS : []
			};
			var oMetaBoolTest = {
					PATH : "Material",
					BUSINESS_OBJECT : "Material",
					COLUMN_ID : "CMAT_BOOL",
					IS_CUSTOM : 1,
					ROLLUP_TYPE_ID : 0,
					SIDE_PANEL_GROUP_ID : 0,
					DISPLAY_ORDER : 1,
					UOM_CURRENCY_FLAG : 0,
					SEMANTIC_DATA_TYPE : "BooleanInt",
					IS_IMMUTABLE_AFTER_SAVE : 1,
					IS_REQUIRED_IN_MASTERDATA : 0,
					TRIGGERS_PRICE_DETERMINATION : 0,
					TEXT : [],
					ATTRIBUTES : [ {
						PATH : "Material",
						BUSINESS_OBJECT : "Material",
						COLUMN_ID : "CMAT_BOOL",
						DEFAULT_VALUE: "1",
						ITEM_CATEGORY_ID : -1,
						SUBITEM_STATE : -1,
						IS_MANDATORY : 1,
								IS_READ_ONLY : 1,
						IS_TRANSFERABLE : 1
					}],
					FORMULAS : []
			};
			
			var aBodyMetadata = {
					"CREATE" : [ oMetaTest ],
					"UPDATE" : [],
					"DELETE" : []
			};
			
			var aBoolMetadata = {
					"CREATE" : [ oMetaBoolTest ],
					"UPDATE" : [],
					"DELETE" : []
			};
			
			var aBodyMetadataDelete = {
					"CREATE" : [],
					"UPDATE" : [],
					"DELETE" : [oMetaTest]
			};
			
			beforeEach(function() {
				oPersistencyMock.Metadata = jasmine.createSpyObj("oPersistencyMock.Metadata", [ "create", "checkMetadataExists", 
				    "createDeleteAndGenerate", "setTransactionAutocommitDDLOff", "getTableDisplayOrder",
				    "copyItemsToItemExt", "updateUnitField", "updateManualField", "updateFieldWithDefaultValue",
				    "copyMasterdataToExtensionTable", "updateMasterdataFieldWithDefaultValue", "updateMasterdataUnitField", "remove",
				    "checkIsUsedInFormula", "removeLayoutData", "copyMasterdataToMasterdataExt", "checkIsUsedInCostingSheetFormula","checkIsUsedAsOverheadCustom"]);
				oPersistencyMock.Metadata.create.and.callFake(function(oMeta) {
					return oMeta;
				});
				oPersistencyMock.Metadata.remove.and.callFake(function(oMeta) {
					return 1;
				});
				oPersistencyMock.Metadata.checkIsUsedInFormula.and.callFake(function(oMeta) {
					return [];
				});
				oPersistencyMock.Metadata.removeLayoutData.and.callFake(function(oMeta) {
					return null;
				});
				
				
				metadataProvider = new MetadataProvider();
			});
			
			it("should return created custom fields for masterdata", function() {
				// arange
				oPersistencyMock.Metadata.checkMetadataExists.and.callFake(function() {
					return false;
				});
				
				// act
				var aResult = metadataProvider.batchCreateUpdateDelete(aBodyMetadata, oPersistencyMock);
				
				// assert
				expect(aResult.isBatchSuccess).toBe(true);
				expect(aResult.batchResults.CREATE[0]).toEqual(oMetaTest);
			});
						
			it("should return created custom fields for masterdata and copy the entries from masterdata main table to extension table", function() {
				// arange
				oPersistencyMock.Metadata.checkMetadataExists.and.callFake(function() {
					return false;
				});
				
				// act
				var aResult = metadataProvider.batchCreateUpdateDelete(aBoolMetadata, oPersistencyMock);
				
				// assert
				expect(aResult.isBatchSuccess).toBe(true);
				expect(aResult.batchResults.CREATE[0]).toEqual(oMetaBoolTest);
				expect(oPersistencyMock.Metadata.copyMasterdataToMasterdataExt).toHaveBeenCalled();
			});
			
			it("should return created custom fields for masterdata and update the unit", function() {
				// arange
				oPersistencyMock.Metadata.checkMetadataExists.and.callFake(function() {
					return false;
				});
				
				oPersistencyMock.Metadata.copyMasterdataToMasterdataExt.and.callFake(function() {
					return [];
				});
				
				// act
				var aResult = metadataProvider.batchCreateUpdateDelete(aBoolMetadata, oPersistencyMock);
				
				// assert
				expect(aResult.isBatchSuccess).toBe(true);
				expect(aResult.batchResults.CREATE[0]).toEqual(oMetaBoolTest);
				expect(oPersistencyMock.Metadata.updateUnitField).toHaveBeenCalled();
			});
			
			it("should return created custom fields for masterdata and update the default fields", function() {
				// arange
				oPersistencyMock.Metadata.checkMetadataExists.and.callFake(function() {
					return false;
				});
				
				oPersistencyMock.Metadata.copyMasterdataToMasterdataExt.and.callFake(function() {
					return [];
				});
				
				// act
				var aResult = metadataProvider.batchCreateUpdateDelete(aBoolMetadata, oPersistencyMock);
				
				// assert
				expect(aResult.isBatchSuccess).toBe(true);
				expect(aResult.batchResults.CREATE[0]).toEqual(oMetaBoolTest);
				expect(oPersistencyMock.Metadata.updateFieldWithDefaultValue).toHaveBeenCalled();
			});

			it("should call removeLayoutData if at least one custom field was deleted", function() {
				// arange
				oPersistencyMock.Metadata.checkMetadataExists.and.callFake(function() {
					return true;
				});

				oPersistencyMock.Metadata.checkIsUsedInCostingSheetFormula.and.callFake(function() {
					return {};
				});
				oPersistencyMock.Metadata.checkIsUsedAsOverheadCustom.and.callFake(function() {
					return {};
				});
				
				// act
				var aResult = metadataProvider.batchCreateUpdateDelete(aBodyMetadataDelete, oPersistencyMock);
				
				// assert
				expect(aResult.isBatchSuccess).toBe(true);
				expect(aResult.batchResults.DELETE[0]).toEqual(oMetaTest);
				expect(oPersistencyMock.Metadata.removeLayoutData).toHaveBeenCalled();
			});
		});
		
	}).addTags(["All_Unit_Tests"]);
}