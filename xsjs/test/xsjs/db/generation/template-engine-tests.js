var TemplateEngine = require("../../../../lib/xs/db/generation/template-engine").TemplateEngine;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.generation.template-engine-tests', function() {

		var oTemplateEngine;

		beforeEach(function() {
			console.log("before each");
			oTemplateEngine = new TemplateEngine(); 
		});

		it("should return an empty string", function() {
			// arrange
			var sTemplate = "";
			var oContext = {};

			// act
			var result = oTemplateEngine.compile(sTemplate, oContext);

			// assert
			expect(result).toBe("");
		});

		it("should throw exception if template is undefined", function() {
			// arrange
			var sTemplate;
			var oContext = {};

			// act
			try {
				var result = oTemplateEngine.compile(sTemplate, oContext);
			} catch (e) {
				var exception = e
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it("should throw exception if context is undefined", function() {
			// arrange
			var sTemplate = "";
			var oContext;

			// act
			try {
				var result = oTemplateEngine.compile(sTemplate, oContext);
			} catch (e) {
				var exception = e
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it("should throw exception if helper function is not registered", function() {
			// arrange
			var oContext = {
					Item: {
						tableName: "sap.plc.db::basis.t_item",
						customFields: {
							CUST_TEST: {
								semanticDataType: "Integer",
								semanticDataTypeAttributes: null
							},
							CUST_TEST_ID: {
								semanticDataType: "NVARCHAR(4)",
								semanticDataTypeAttributes: null
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
			var sTemplate = " CREATE COLUMN TABLE {{extensionTable Item}} (	" +
			" {{Primary Item}} " + " {{fieldListCustom Item}} " +
			" {{ddl_primaryKeyDefinition Item}} " + "; ";

			// act
			try {
				var result = oTemplateEngine.compile(sTemplate, oContext);
			} catch (e) {
				var exception = e
			}

			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it("should return the expected string", function() {
			// arrange
			var oContext = {
					Item: {
						tableName: "sap.plc.db::basis.t_item",
						customFields: {
							CUST_TEST: {
								semanticDataType: "Integer",
								semanticDataTypeAttributes: null,
								dataType: "INTEGER",
							},
							CUST_TEST_ID: {
								semanticDataType: "String",
								semanticDataTypeAttributes: null,
								dataType: "NVARCHAR(4)",
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
			var sTemplate = "CREATE COLUMN TABLE {{t_extensionTable Item}} ({{ddl_primaryKeyFields Item}}, {{ddl_customFields Item}}, " +
			"{{ddl_primaryKeyDefinition Item}})";
			var expectedResult = 'CREATE COLUMN TABLE "sap.plc.db::basis.t_item_ext" ("ITEM_ID" NVARCHAR(10) NOT NULL, "CALCULATION_VERSION_ID" NVARCHAR(4) NOT NULL,' +
			' "CUST_TEST_MANUAL" INTEGER, "CUST_TEST_UNIT" NVARCHAR(3), "CUST_TEST_IS_MANUAL" INTEGER,' +
			' "CUST_TEST_ID_MANUAL" NVARCHAR(4), "CUST_TEST_ID_UNIT" NVARCHAR(3), "CUST_TEST_ID_IS_MANUAL" INTEGER,' +
			' PRIMARY KEY ("ITEM_ID", "CALCULATION_VERSION_ID"))';
			
			var result = oTemplateEngine.compile(sTemplate, oContext);

			// assert
			expect(result).toBe(expectedResult);
		});

	}).addTags(["All_Unit_Tests"]);
}