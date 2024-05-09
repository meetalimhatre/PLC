var Handlebars = require("handlebars");
const _ = require("lodash");
var helpers = require("../../../../lib/xs/db/generation/template-engine-helpers");

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.generation.template-engine-helpers-tests', function() {

		var oContextTestIsNotMasterData= {
				Item: {
					tableName: "sap.plc.db::basis.t_item",
					customFields: {
						CUST_TEST: {
							semanticDataType: "Integer",
							semanticDataTypeAttributes: null,
							dataType: "INTEGER",
							rollupTypeId: 1,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: null,
							displayName: "Test",
							isMasterataField: false
						},
						CUST_TEST_ID: {
							semanticDataType: "String",
							semanticDataTypeAttributes: "length=10",
							dataType: "NVARCHAR(10)",
							rollupTypeId: 0,
							itemCategories: [2,3],
							defaultValue: "Abc",
							defaultValueUnit: null,
							propertyType: null,
							displayName: "TestId",
							isMasterdataField: false
						}
					},
					primaryKeys: {
						"ITEM_ID": { 
							dataType: "NVARCHAR(10)"
						},
						"CALCULATION_VERSION_ID": {
							dataType: "NVARCHAR(4)"
						} 
					},
					dependencies: [

					               ]
				}
		};
		
		var oContextTestIsMasterData = {
				Material: {
					tableName: "sap.plc.db::basis.t_material" ,
					isMasterdataObject: true,
					hasTemporaryTable: false,
				    hasStagingTable: false,
					customFields: {
						CMAT_TEST: {
							semanticDataType: "NVARCHAR(10)",
							semanticDataTypeAttributes: null,
							isMasterdataField: true,
							dataType: "NVARCHAR(10)"
						},
						CMAT_TEST_ID: {
							semanticDataType: "TIMESTAMP",
							semanticDataTypeAttributes: null,
							isMasterdataField: true,
							dataType: "TIMESTAMP"
						}
					},
					primaryKeys: {
						"MATERIAL_ID": { 
							dataType: "NVARCHAR(10)"
						},
						"_VALID_FROM": {
							dataType: "TIMESTAMP"
						} 
					},
					dependencies: [

					               ]
				}
		};  

		var oContextTestIsNotMasterDataCurrencyAndUoM= {
			Item: {
				tableName: "sap.plc.db::basis.t_item",
				customFields: {
					CUST_TEST: {
						semanticDataType: "Integer",
						semanticDataTypeAttributes: null,
						dataType: "INTEGER",
						rollupTypeId: 1,
						itemCategories: [1,2],
						defaultValue: 10,
						defaultValueUnit: null,
						propertyType: null,
						displayName: "Test",
						isMasterataField: false
					},
					CUST_TEST_ID: {
						semanticDataType: "String",
						semanticDataTypeAttributes: "length=10",
						dataType: "NVARCHAR(10)",
						rollupTypeId: 0,
						itemCategories: [2,3],
						defaultValue: "Abc",
						defaultValueUnit: null,
						propertyType: null,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_EUR: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: null,
						defaultValueUnit: 'EUR',
						propertyType: 7,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_EUR2: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: 23,
						defaultValueUnit: 'EUR',
						propertyType: 7,
						displayName: "TestId",
						isMasterdataField: false
					},				
					CUST_TEST_EUR3: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: null,
						defaultValueUnit: null,
						propertyType: 7,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_EUR4: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: 32,
						defaultValueUnit: null,
						propertyType: 7,
						displayName: "TestId",
						isMasterdataField: false
					},			
					CUST_TEST_UOM: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: null,
						defaultValueUnit: 'M',
						propertyType: 1,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_UOM2: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: 42,
						defaultValueUnit: 'M',
						propertyType: 1,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_UOM3: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: null,
						defaultValueUnit: null,
						propertyType: 1,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_UOM4: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: 43,
						defaultValueUnit: null,
						propertyType: 1,
						displayName: "TestId",
						isMasterdataField: false
					},
					CUST_TEST_MD: {
						semanticDataType: "Decimal",
						semanticDataTypeAttributes: "precision=24; scale=7",
						dataType: "decimal(28,7)",
						rollupTypeId: 1,
						itemCategories: [0,1,2,3,4,5,6,7,8,9,10],
						defaultValue: 44,
						defaultValueUnit: null,
						propertyType: 1,
						displayName: "TestId",
						isMasterdataField: true
					}
				},
				primaryKeys: {
					"ITEM_ID": { 
						dataType: "NVARCHAR(10)"
					},
					"CALCULATION_VERSION_ID": {
						dataType: "NVARCHAR(4)"
					} 
				},
				dependencies: [

							   ]
			}
	};

		var options = {
				noEscape : true
		};

		helpers.registerHelpers(Handlebars);

		it("ddl_primaryKeyFields should return defined string", function() {
			// arrange

			//act
			var listPK = '{{ddl_primaryKeyFields Item param1 param2}}';
			var template = Handlebars.compile(listPK, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '"ITEM_ID" NVARCHAR(10) NOT NULL, "CALCULATION_VERSION_ID" NVARCHAR(4) NOT NULL';
			expect(result).toBe(expectedResult);
		});

		it("ddl_primaryKeyDefinition should return defined string", function() {
			// arrange

			//act
			var listPK = '{{ddl_primaryKeyDefinition Item}}';
			var template = Handlebars.compile(listPK, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = 'PRIMARY KEY ("ITEM_ID", "CALCULATION_VERSION_ID")';
			expect(result).toBe(expectedResult);
		});

		it("customFields should return defined string", function() {
			// arrange

			//act
			var listCF = '{{customFields Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', CUST_TEST_MANUAL, CUST_TEST_UNIT, CUST_TEST_IS_MANUAL, ' + 
			'CUST_TEST_ID_MANUAL, CUST_TEST_ID_UNIT, CUST_TEST_ID_IS_MANUAL';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFields should return a string with _MANUAL and _UNIT columns for custom fields, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{customFields Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', CMAT_TEST_MANUAL, CMAT_TEST_UNIT, ' + 
			'CMAT_TEST_ID_MANUAL, CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldCalculated should return a string with custom field names, comma at the beginning, including calculated field", function() {
			// arrange

			//act
			var listCF = '{{customFieldsCalc Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', CUST_TEST_MANUAL, CUST_TEST_UNIT, CUST_TEST_CALCULATED, CUST_TEST_IS_MANUAL, ' + 
			'CUST_TEST_ID_MANUAL, CUST_TEST_ID_UNIT, CUST_TEST_ID_CALCULATED, CUST_TEST_ID_IS_MANUAL';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldCalculated should return a string with custom field names, comma at the beginning, without calculated field ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{customFieldsCalc Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', CMAT_TEST_MANUAL, CMAT_TEST_UNIT, ' + 
			'CMAT_TEST_ID_MANUAL, CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});
		
		
		
		it("customFieldsCalculated should list only calculated custom field names, comma at the beginning", function() {
			// arrange

			//act
			var listCF = '{{customFieldsCalculated Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', CUST_TEST, CUST_TEST_ID';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldCalculated should return empty string ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{customFieldsCalculated Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = "";	
			expect(result).toBe(expectedResult);
		});

		it("p_listErpExtFields should return defined string", function() {
			// arrange

			//act
			var listErp = '{{p_listErpExtFields Item}}';
			var template = Handlebars.compile(listErp, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', null AS CUST_TEST_MANUAL, null AS CUST_TEST_ID_MANUAL';
			expect(result).toBe(expectedResult);
		});

		it("customFieldsWithTablePrefix should return defined string", function() {
			// arrange

			//act
			var listPlcExt = '{{customFieldsWithTablePrefix Item}}';
			var template = Handlebars.compile(listPlcExt, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', plcExtTable.CUST_TEST_MANUAL, plcExtTable.CUST_TEST_UNIT, plcExtTable.CUST_TEST_IS_MANUAL' +
			', plcExtTable.CUST_TEST_ID_MANUAL, plcExtTable.CUST_TEST_ID_UNIT, plcExtTable.CUST_TEST_ID_IS_MANUAL'	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldsWithTablePrefix should return a string with _UNIT and _MANUAL columns, prefixed by the extension table, comma at the beggining ( isMasterDataField : TRUE )", function() {
			// arrange

			//act
			var listPlcExt = '{{customFieldsWithTablePrefix Material}}';
			var template = Handlebars.compile(listPlcExt, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', plcExtTable.CMAT_TEST_MANUAL, plcExtTable.CMAT_TEST_UNIT' +
			', plcExtTable.CMAT_TEST_ID_MANUAL, plcExtTable.CMAT_TEST_ID_UNIT'	
			expect(result).toBe(expectedResult);
		});

		it("ddl_customFields should return defined string", function() {
			// arrange

			//act
			var listCustomFields = '{{#if Item.customFields}}{{ddl_customFields Item}}{{/if}}';
			var template = Handlebars.compile(listCustomFields, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '"CUST_TEST_MANUAL" INTEGER, "CUST_TEST_UNIT" NVARCHAR(3), "CUST_TEST_IS_MANUAL" INTEGER, ' +
				'"CUST_TEST_ID_MANUAL" NVARCHAR(10), "CUST_TEST_ID_UNIT" NVARCHAR(3), "CUST_TEST_ID_IS_MANUAL" INTEGER';
			expect(result).toBe(expectedResult);
		});
		
		it("ddl_customFields list custom fields with data types, used in DDL statements( isMasterDataField : TRUE )", function() {
			// arrange

			//act
			var listCustomFields = '{{#if Material.customFields}}{{ddl_customFields Material}}{{/if}}';
			var template = Handlebars.compile(listCustomFields, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = '"CMAT_TEST_MANUAL" NVARCHAR(10), "CMAT_TEST_UNIT" NVARCHAR(3), "CMAT_TEST_ID_MANUAL" TIMESTAMP, "CMAT_TEST_ID_UNIT" NVARCHAR(3)';
			expect(result).toBe(expectedResult);
		});

		it("t_extensionTable should return defined string", function() {
			// arrange

			//act
			var leftOuterJoin = '{{t_extensionTable Item}}';
			var template = Handlebars.compile(leftOuterJoin, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '"sap.plc.db::basis.t_item_ext"';
			expect(result).toBe(expectedResult);
		});

		it("t_temporaryExtensionTable should return defined string", function() {
			// arrange

			//act
			var leftOuterJoin = '{{t_temporaryExtensionTable Item}}';
			var template = Handlebars.compile(leftOuterJoin, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '"sap.plc.db::basis.t_item_temporary_ext"';
			expect(result).toBe(expectedResult);
		});

		it("ddl_updateCustomFieldsCalculated should return defined string", function() {
			// arrange

			//act
			var updatecalculatedCF = '-- save calculated custom fields ' +
			       'UPDATE "sap.plc.db::basis.t_item_temporary_ext" AS stored ' +
		              'SET ' +  
		              	'{{ddl_updateCustomFieldsCalculated Item}} ' +
		            'FROM "sap.plc.db::basis.t_item_temporary_ext" AS stored INNER JOIN :item_calculated_prices AS calculated '+
		              'ON stored.item_id = calculated.item_id ' +
		            'WHERE stored.calculation_version_id = :calculation_version_id AND stored.session_id = :session_id; ';
			var template = Handlebars.compile(updatecalculatedCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '-- save calculated custom fields ' +
			'UPDATE "sap.plc.db::basis.t_item_temporary_ext" AS stored ' +
			'SET  CUST_TEST_CALCULATED = calculated.CUST_TEST, CUST_TEST_ID_CALCULATED = calculated.CUST_TEST_ID FROM ' + 
			'"sap.plc.db::basis.t_item_temporary_ext" AS stored ' + 
			'INNER JOIN :item_calculated_prices AS calculated ON stored.item_id = calculated.item_id WHERE stored.calculation_version_id = :calculation_version_id AND stored.session_id = :session_id; ';
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldsWithRollupType should return defined string", function() {
			// arrange

			//act
			var listCF = '{{customFieldsWithRollupType Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ' itemExt.CUST_TEST_MANUAL = CASE  WHEN item.ITEM_CATEGORY_ID IN  ( 1 , 2 )  THEN NULL  ELSE itemExt.CUST_TEST_MANUAL  END, ' +
								 'itemExt.CUST_TEST_IS_MANUAL = CASE  WHEN item.ITEM_CATEGORY_ID IN  ( 1 , 2 )  THEN 0  ELSE itemExt.CUST_TEST_IS_MANUAL  END';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldsDefaultValuesSelect should return defined string", function() {
			// arrange

			//act
			var listCF = '{{customFieldsDefaultValuesSelect Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 , 2 )  AND CUST_TEST_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 10 ELSE CUST_TEST_MANUAL  END AS CUST_TEST_MANUAL, ' + 
								'CUST_TEST_UNIT, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 , 2 )  AND CUST_TEST_IS_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 1  ELSE CUST_TEST_IS_MANUAL  END AS CUST_TEST_IS_MANUAL, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 2 , 3 )  AND CUST_TEST_ID_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN \'Abc\' ELSE CUST_TEST_ID_MANUAL  END AS CUST_TEST_ID_MANUAL, ' + 
								'CUST_TEST_ID_UNIT, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 2 , 3 )  AND CUST_TEST_ID_IS_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 1  ELSE CUST_TEST_ID_IS_MANUAL  END AS CUST_TEST_ID_IS_MANUAL';	
			expect(result).toBe(expectedResult);
		});

		it("customFieldsOneTimeCost should return ", function() {
			// arrange

			//act
			var listCF = '{{customFieldsOneTimeCost Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterDataCurrencyAndUoM);

			// assert
			var expectedResult = ', null AS CUST_TEST_MANUAL, null AS CUST_TEST_UNIT, null AS CUST_TEST_IS_MANUAL' +
			', null AS CUST_TEST_ID_MANUAL, null AS CUST_TEST_ID_UNIT, null AS CUST_TEST_ID_IS_MANUAL' +
			', null AS CUST_TEST_EUR_MANUAL, \'EUR\' AS CUST_TEST_EUR_UNIT, 1 AS CUST_TEST_EUR_IS_MANUAL' +
			', \'23\' AS CUST_TEST_EUR2_MANUAL, \'EUR\' AS CUST_TEST_EUR2_UNIT, 1 AS CUST_TEST_EUR2_IS_MANUAL' +
			', null AS CUST_TEST_EUR3_MANUAL, calculation_versions_one_time_toCreate.report_currency_id AS CUST_TEST_EUR3_UNIT, 1 AS CUST_TEST_EUR3_IS_MANUAL' +
			', \'32\' AS CUST_TEST_EUR4_MANUAL, calculation_versions_one_time_toCreate.report_currency_id AS CUST_TEST_EUR4_UNIT, 1 AS CUST_TEST_EUR4_IS_MANUAL' +
			', null AS CUST_TEST_UOM_MANUAL, null AS CUST_TEST_UOM_UNIT, 1 AS CUST_TEST_UOM_IS_MANUAL' +
			', \'42\' AS CUST_TEST_UOM2_MANUAL, null AS CUST_TEST_UOM2_UNIT, 1 AS CUST_TEST_UOM2_IS_MANUAL' +
			', null AS CUST_TEST_UOM3_MANUAL, null AS CUST_TEST_UOM3_UNIT, 1 AS CUST_TEST_UOM3_IS_MANUAL' +
			', \'43\' AS CUST_TEST_UOM4_MANUAL, null AS CUST_TEST_UOM4_UNIT, 1 AS CUST_TEST_UOM4_IS_MANUAL' +
			', \'44\' AS CUST_TEST_MD_MANUAL, null AS CUST_TEST_MD_UNIT';
			expect(result).toBe(expectedResult);
		});

		it("customFieldsDefaultValuesSelect should return defined string, with default value for link", function(){
			//act
			var oContextWithLinkTestIsNotMasterData = _.cloneDeep(oContextTestIsNotMasterData);
			oContextWithLinkTestIsNotMasterData.Item.customFields["CUST_LINK"] = {
																					semanticDataType: "Link",
																					semanticDataTypeAttributes: "length=100",
																					dataType: "NVARCHAR(100)",
																					rollupTypeId: 0,
																					itemCategories: [1],
																					defaultValue: "https://www.sap.com",
																					defaultValueUnit: null,
																					propertyType: null,
																					displayName: "Link Name",
																					isMasterdataField: false
																				};
			var listCF = '{{customFieldsDefaultValuesSelect Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextWithLinkTestIsNotMasterData);

			// assert
			var expectedResult = ', CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 , 2 )  AND CUST_TEST_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 10 ELSE CUST_TEST_MANUAL  END AS CUST_TEST_MANUAL, ' +
								'CUST_TEST_UNIT, ' +
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 , 2 )  AND CUST_TEST_IS_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 1  ELSE CUST_TEST_IS_MANUAL  END AS CUST_TEST_IS_MANUAL, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 2 , 3 )  AND CUST_TEST_ID_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN \'Abc\' ELSE CUST_TEST_ID_MANUAL  END AS CUST_TEST_ID_MANUAL, '+ 
								'CUST_TEST_ID_UNIT, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 2 , 3 )  AND CUST_TEST_ID_IS_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 1  ELSE CUST_TEST_ID_IS_MANUAL  END AS CUST_TEST_ID_IS_MANUAL, ' + 
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 )  AND CUST_LINK_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN \'https://www.sap.com\' ELSE CUST_LINK_MANUAL  END AS CUST_LINK_MANUAL, '+ 
								'CUST_LINK_UNIT, ' +
								'CASE  WHEN items.ITEM_CATEGORY_ID IN  ( 1 )  AND CUST_LINK_IS_MANUAL IS NULL  AND :iv_setDefaultValues = 1  THEN 1  ELSE CUST_LINK_IS_MANUAL  END AS CUST_LINK_IS_MANUAL';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldsDefaultValuesSelect should return defined string (isMasterDataField = true)", function() {
			// arrange

			//act
			var listCF = '{{customFieldsDefaultValuesSelect Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', CMAT_TEST_MANUAL, CMAT_TEST_UNIT, CMAT_TEST_ID_MANUAL, CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});
		
		it("cv_customFieldsTableFunctList should return defined string", function() {
			// arrange

			//act
			var listCF = '{{cv_customFieldsTableFunctList Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', "CUST_TEST" INTEGER, "CUST_TEST_ID" NVARCHAR(10)';	
			expect(result).toBe(expectedResult);
		});
		
		it("cv_customFieldsTableFunctSelect should return defined string", function() {
			// arrange

			//act
			var listCF = '{{cv_customFieldsTableFunctSelect Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', (CASE plcExtTable.CUST_TEST_IS_MANUAL when 1 then plcExtTable.CUST_TEST_MANUAL ELSE plcExtTable.CUST_TEST_CALCULATED END) as CUST_TEST, ' + 
			'(CASE plcExtTable.CUST_TEST_ID_IS_MANUAL when 1 then plcExtTable.CUST_TEST_ID_MANUAL ELSE plcExtTable.CUST_TEST_ID_CALCULATED END) as CUST_TEST_ID';
			expect(result).toBe(expectedResult);
		});	
		
		
		it("cv_customFieldsTableFunctSelect should return defined string (isMasterDataField = true)", function() {
			// arrange

			//act
			var listCF = '{{cv_customFieldsTableFunctSelect Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', plcExtTable.CMAT_TEST_MANUAL as CMAT_TEST, plcExtTable.CMAT_TEST_ID_MANUAL as CMAT_TEST_ID';
			expect(result).toBe(expectedResult);
		});
		
		it("cv_customFieldsAttrXml should return defined string", function() {
			// arrange

			//act
			var listCF = '{{cv_customFieldsAttrXml Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '<attribute id="CUST_TEST" attributeHierarchyActive="false" displayAttribute="false">\n' +
			'<descriptions defaultDescription="Test"/>\n' +
			'<keyMapping columnObjectName="TABLE_FUNCTION_undefined" columnName="CUST_TEST"/>\n' +
			'</attribute>\n' +
			'<attribute id="CUST_TEST_ID" attributeHierarchyActive="false" displayAttribute="false">\n' +
			'<descriptions defaultDescription="TestId"/>\n' +
			'<keyMapping columnObjectName="TABLE_FUNCTION_undefined" columnName="CUST_TEST_ID"/>\n' +
			'</attribute>\n';
			expect(result).toBe(expectedResult);
		});	
		
		it("cv_customFieldsAttrVXml should return defined string", function() {
			// arrange

			//act
			var listCF = '{{cv_customFieldsAttrVXml Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = '<attribute id="CUST_TEST_ID" attributeHierarchyActive="false" displayAttribute="false">\n' +
			'<descriptions defaultDescription="TestId"/>\n' +
			'<keyMapping columnObjectName="Fact_table" columnName="CUST_TEST_ID"/>\n' +
			'</attribute>\n';
			expect(result).toBe(expectedResult);
		});
		
		it('updateAllCustomFields_referencedCvId should return custom fields and their values of a business object containing custom fields', function(){
			//arrange
			var listCF = '{{updateAllCustomFields_referencedCvId Item}}';
			var template = Handlebars.compile(listCF, options);
			
			//act
			var result = template(oContextTestIsNotMasterData);
			
			//assert
			expect(result).toBeDefined();
			var expectedResult = 
			' CUST_TEST_CALCULATED = source_root_item_ext.CUST_TEST_CALCULATED,'+
            ' CUST_TEST_MANUAL = CASE  WHEN  source_root_item_ext.CUST_TEST_IS_MANUAL = 1 THEN source_root_item_ext.CUST_TEST_MANUAL  ELSE source_root_item_ext.CUST_TEST_CALCULATED END,'+
            ' CUST_TEST_UNIT = source_root_item_ext.CUST_TEST_UNIT,'+
            ' CUST_TEST_IS_MANUAL = 1,'+
            ' CUST_TEST_ID_CALCULATED = source_root_item_ext.CUST_TEST_ID_CALCULATED,'+
            ' CUST_TEST_ID_MANUAL = CASE  WHEN  source_root_item_ext.CUST_TEST_ID_IS_MANUAL = 1 THEN source_root_item_ext.CUST_TEST_ID_MANUAL  ELSE source_root_item_ext.CUST_TEST_ID_CALCULATED END,'+
            ' CUST_TEST_ID_UNIT = source_root_item_ext.CUST_TEST_ID_UNIT,'+
            ' CUST_TEST_ID_IS_MANUAL = 1';
			expect(result).toEqual(expectedResult);
			
		});
		
		it('updateAllCustomFields_referencedCvId should return custom fields and their values of a business object containing custom fields (isMasterDataField = true)', function(){
			//arrange
			var listCF = '{{updateAllCustomFields_referencedCvId Material}}';
			var template = Handlebars.compile(listCF, options);
			
			//act
			var result = template(oContextTestIsMasterData);
			
			//assert
			expect(result).toBeDefined();
			var expectedResult = ' CMAT_TEST_MANUAL = source_root_item_ext.CMAT_TEST_MANUAL, CMAT_TEST_UNIT = source_root_item_ext.CMAT_TEST_UNIT, CMAT_TEST_ID_MANUAL = source_root_item_ext.CMAT_TEST_ID_MANUAL, CMAT_TEST_ID_UNIT = source_root_item_ext.CMAT_TEST_ID_UNIT';
			expect(result).toEqual(expectedResult);
			
		});
		
		it("customFieldsWhenCreate should return a string with _MANUAL and _UNIT columns for custom fields, comma at the beginning", function() {
			// arrange

			//act
			var listCF = '{{customFieldsWhenCreate Item}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsNotMasterData);

			// assert
			var expectedResult = ', CUST_TEST_MANUAL, CUST_TEST_UNIT, CUST_TEST_IS_MANUAL , ' + 
			'CUST_TEST_ID_MANUAL, CUST_TEST_ID_UNIT, CUST_TEST_ID_IS_MANUAL ';	
			expect(result).toBe(expectedResult);
		});
		
		it("customFieldsWhenCreate should return a string with _MANUAL and _UNIT columns for custom fields, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{customFieldsWhenCreate Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', CASE when determined.item_id is not null then determined.CMAT_TEST_MANUAL ' + 
			' else items.CMAT_TEST_MANUAL  end as CMAT_TEST_MANUAL ' +
			', CASE when determined.item_id is not null then determined.CMAT_TEST_UNIT ' +
			' else items.CMAT_TEST_UNIT  end as CMAT_TEST_UNIT ' + 
			', CASE when determined.item_id is not null then determined.CMAT_TEST_ID_MANUAL ' + 
			' else items.CMAT_TEST_ID_MANUAL  end as CMAT_TEST_ID_MANUAL ' +
			', CASE when determined.item_id is not null then determined.CMAT_TEST_ID_UNIT ' +
			' else items.CMAT_TEST_ID_UNIT  end as CMAT_TEST_ID_UNIT ';	
			expect(result).toBe(expectedResult);
		});
		
		it("masterdataCustomFields should return a sorted list as string with _MANUAL and _UNIT columns for custom fields, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{masterdataCustomFields Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', CMAT_TEST_MANUAL, CMAT_TEST_UNIT, CMAT_TEST_ID_MANUAL, ' + 
			'CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});

		it("masterdataCustomFieldsWithoutUnit should return a sorted list as string with _MANUAL (and _UNIT columns for decimals) for custom fields, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange
			var oContext = _.cloneDeep(oContextTestIsMasterData);
			oContext.Material.customFields['CMAT_TEST_DECIMAL'] = {
				semanticDataType: "DECIMAL",
				semanticDataTypeAttributes:"precision=28; scale=7",
				isMasterdataField: true,
				dataType: "decimal(28,7)"
			};

			//act
			var listCF = '{{masterdataCustomFieldsWithoutUnit Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContext);

			// assert
			var expectedResult = ', CMAT_TEST_MANUAL, CMAT_TEST_DECIMAL_MANUAL, CMAT_TEST_DECIMAL_UNIT, CMAT_TEST_ID_MANUAL';
			expect(result).toBe(expectedResult);
		});
		
		it("masterdataCustomFieldsWithPrefix should return a sorted list as string with _MANUAL and _UNIT columns for custom fields, prefixed by a given string, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange
			//act
			var listCF = '{{masterdataCustomFieldsWithPrefix Material "prefix"}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', prefix.CMAT_TEST_MANUAL, prefix.CMAT_TEST_UNIT, prefix.CMAT_TEST_ID_MANUAL, ' + 
			'prefix.CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});

		it("masterdataCustomFieldsWithPrefixWithoutUnit should return a sorted list as string with _MANUAL and _UNIT columns for custom fields, prefixed by a given string, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange
			var oContext = _.cloneDeep(oContextTestIsMasterData);
			oContext.Material.customFields['CMAT_TEST_DECIMAL'] = {
				semanticDataType: "DECIMAL",
				semanticDataTypeAttributes:"precision=28; scale=7",
				isMasterdataField: true,
				dataType: "decimal(28,7)"
			};

			//act
			var listCF = '{{masterdataCustomFieldsWithPrefixWithoutUnit Material "prefix"}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContext);

			// assert
			var expectedResult = ', prefix.CMAT_TEST_MANUAL, prefix.CMAT_TEST_DECIMAL_MANUAL, prefix.CMAT_TEST_DECIMAL_UNIT, prefix.CMAT_TEST_ID_MANUAL';
			expect(result).toBe(expectedResult);
		});
		
		it("setMasterdataCustomFieldsWithPrefixes should return a list of conditions as string with _MANUAL and _UNIT columns for custom fields, prefixed by given strings, comma at the end ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{setMasterdataCustomFieldsWithPrefixes Material "prefix1" "prefix2"}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = 'prefix1.CMAT_TEST_MANUAL = prefix2.CMAT_TEST_MANUAL, prefix1.CMAT_TEST_UNIT = prefix2.CMAT_TEST_UNIT, ' + 
			'prefix1.CMAT_TEST_ID_MANUAL = prefix2.CMAT_TEST_ID_MANUAL, prefix1.CMAT_TEST_ID_UNIT = prefix2.CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});
		
		it("ddl_masterdataCustomFields should return a sorted list as string of master data custom fields used in DDL, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{ddl_masterdataCustomFields Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', "CMAT_TEST_MANUAL" NVARCHAR(10), "CMAT_TEST_UNIT" NVARCHAR(3), "CMAT_TEST_ID_MANUAL" TIMESTAMP, ' + 
			'"CMAT_TEST_ID_UNIT" NVARCHAR(3)';	
			expect(result).toBe(expectedResult);
		});

		it("ddl_masterdataCustomFieldsWithoutUnit should return a sorted list as string of master data custom fields used in DDL with units for only decimals, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange
			var oContext = _.cloneDeep(oContextTestIsMasterData);
			oContext.Material.customFields['CMAT_TEST_DECIMAL'] = {
				semanticDataType: "DECIMAL",
				semanticDataTypeAttributes:"precision=28; scale=7",
				isMasterdataField: true,
				dataType: "decimal(28,7)"
			}
			
			//act
			var listCF = '{{ddl_masterdataCustomFieldsWithoutUnit Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContext);

			// assert
			var expectedResult = ', "CMAT_TEST_MANUAL" NVARCHAR(10), "CMAT_TEST_DECIMAL_MANUAL" decimal(28,7), "CMAT_TEST_DECIMAL_UNIT" NVARCHAR(3), "CMAT_TEST_ID_MANUAL" TIMESTAMP'; 
		
			expect(result).toBe(expectedResult);
		});
		
		it("getMasterdataCustomFieldsAsNull should return a sorted list as string with _MANUAL and _UNIT columns for custom fields read as null, comma at the beginning ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{getMasterdataCustomFieldsAsNull Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ', null AS CMAT_TEST_MANUAL, null AS CMAT_TEST_UNIT, null AS CMAT_TEST_ID_MANUAL, ' + 
			'null AS CMAT_TEST_ID_UNIT';	
			expect(result).toBe(expectedResult);
		});
		
		it("setMasterdataCustomFieldsToNull should return a defined string with _MANUAL and _UNIT columns for custom fields set to null, prefixed by db ( isMasterDataField : TRUE ) ", function() {
			// arrange

			//act
			var listCF = '{{setMasterdataCustomFieldsToNull Material}}';
			var template = Handlebars.compile(listCF, options);
			var result = template(oContextTestIsMasterData);

			// assert
			var expectedResult = ' db.CMAT_TEST_MANUAL = null, db.CMAT_TEST_UNIT = null, ' + 
			' db.CMAT_TEST_ID_MANUAL = null, db.CMAT_TEST_ID_UNIT = null';	
			expect(result).toBe(expectedResult);
		});

		it("updateCustomFieldsWithCurrency ...", function() {

			// arrange
				var oContext= {
				Item: {
					tableName: "sap.plc.db::basis.t_item",
					customFields: {
						CUST_A: {
							semanticDataType: "Decimal",
							semanticDataTypeAttributes: "precision=24; scale=7",
							dataType: "decimal(28,7)",
							rollupTypeId: 1,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: 7,
							displayName: "Test",
							isMasterataField: false,							
							refUomCurrencyColumnId: "CUST_A_UNIT"
						},
						CUST_B: {
							semanticDataType: "Decimal",
							semanticDataTypeAttributes: "precision=24; scale=7",
							dataType: "decimal(28,7)",
							rollupTypeId: 1,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: 7,
							displayName: "Test",
							isMasterataField: false,							
							refUomCurrencyColumnId: "CUST_B_UNIT"
						},
						CUST_C: {
							semanticDataType: "Decimal",
							semanticDataTypeAttributes: "precision=24; scale=7",
							dataType: "INTEGER",
							rollupTypeId: 0,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: 7,
							displayName: "Test",
							isMasterataField: false,							
							refUomCurrencyColumnId: "CUST_B_UNIT"
						},
						CUST_D: {
							semanticDataType: "Integer",
							semanticDataTypeAttributes: null,
							dataType: "INTEGER",
							rollupTypeId: 0,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: null,
							displayName: "Test",
							isMasterataField: false
						},
						CUST_E: {
							semanticDataType: "Integer",
							semanticDataTypeAttributes: null,
							dataType: "INTEGER",
							rollupTypeId: 1,
							itemCategories: [1,2],
							defaultValue: 10,
							defaultValueUnit: null,
							propertyType: null,
							displayName: "Test",
							isMasterataField: false
						}
					},
					primaryKeys: {
						"ITEM_ID": { 
							dataType: "NVARCHAR(10)"
						},
						"CALCULATION_VERSION_ID": {
							dataType: "NVARCHAR(4)"
						} 
					},
					dependencies: [

					               ]
				}
		};
			var listCF = '{{updateCustomFieldsWithCurrency Item "1000"}}';
			var template = Handlebars.compile(listCF, options);

			// act
			var result = template(oContext);

			// assert			
            var sFields = ' T.CUST_A_UNIT = case when T.CUST_A_IS_MANUAL = 0 then :lv_report_currency_id  else T.CUST_A_UNIT end,';
			sFields += ' T.CUST_B_UNIT = case when T.CUST_B_IS_MANUAL = 0 then :lv_report_currency_id  else T.CUST_B_UNIT end';
			
			var expectedResult = `UPDATE "sap.plc.db::basis.t_item_temporary_ext" T SET ${sFields} 
			FROM "sap.plc.db::basis.t_item_temporary_ext" T INNER JOIN :lt_assemblies P on P.parent_item_id = T.item_id 
			WHERE T.session_id =:lv_session_id AND T.calculation_version_id = :iv_cv_id;`;			
			expect(result).toBe(expectedResult);

		});
		
		
	}).addTags(["All_Unit_Tests"]);
}