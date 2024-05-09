const _ = require("lodash");
const testData = require("../../testdata/testdata").data;

const InstancePrivileges = require("../../../lib/xs/authorization/authorization-manager").Privileges;
const SimilarPartsSearchImport = require("../../../lib/xs/db/persistency-similarPartsSearch").Tables;

const MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
const DispatcherLibrary = require("../../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLibrary.Dispatcher;
const oCtx = DispatcherLibrary.prepareDispatch($);
const Persistency = $.import("xs.db", "persistency").Persistency;

const sUserId = testData.sTestUser;

if (jasmine.plcTestRunParameters.mode === 'all') {
	describe('xsjs.impl.similar-parts-search-integrationtests', function() {
		let oMockstar = null;
		let oDefaultResponseMock = null;
		let oPersistency = null;

		beforeOnce(function() {
			oMockstar = new MockstarFacade({
				substituteTables: {
					project: "sap.plc.db::basis.t_project",
					calculation: "sap.plc.db::basis.t_calculation",
					calculation_version: "sap.plc.db::basis.t_calculation_version",
					item: SimilarPartsSearchImport.item,
					item_ext: SimilarPartsSearchImport.item_ext,
					material_price: SimilarPartsSearchImport.material_price,
					material_price_ext: SimilarPartsSearchImport.material_price_ext,
					material: SimilarPartsSearchImport.material,
					material_ext: SimilarPartsSearchImport.material_ext,
					material__text: SimilarPartsSearchImport.material__text,
					vendor: SimilarPartsSearchImport.vendor,
					session: "sap.plc.db::basis.t_session",
					authorization: "sap.plc.db::auth.t_auth_project"
				}
			});
		});

		afterOnce(function() {
			oMockstar.cleanup();
		});

		beforeEach(function() {
			oDefaultResponseMock = jasmine.createSpyObj("oDefaultResponseMock", ["setBody", "status"]);
			var oResponseHeaderMock = jasmine.createSpyObj("oResponseHeaderMock", ["set"]);
			oDefaultResponseMock.headers = oResponseHeaderMock;
			oPersistency = new Persistency(jasmine.dbConnection);
			oCtx.persistency = oPersistency;
		});

		function buildRequest(params, iHttpMethod, oBody) {
			// parameter object to simulate the TupleList type of parameters in $.web.WebEntityRequest
			params.get = function(sArgument) {
				var oSearchedParam = _.find(params, function(oParam) {
					return sArgument === oParam.name;
				});

				return oSearchedParam !== undefined ? oSearchedParam.value : undefined;
			};

			let oRequest = {
				queryPath: "similar-parts-search",
				method: iHttpMethod,
				parameters: params,
				body: oBody
			};
			return oRequest;
		}

		function executeRequest(oSimilarSearchBody) {
			let oBody = {
				asString: function() {
					return JSON.stringify(oSimilarSearchBody);
				}
			};
			let oRequest = buildRequest([], $.net.http.POST, oBody);

			// act
			new Dispatcher(oCtx, oRequest, oDefaultResponseMock).dispatch();
		}

		describe('SimilarPartsSearch POST Request', function() {
			let oItemTestData = JSON.parse(JSON.stringify(testData.oItemTestData));
			_.extend(oItemTestData, {
				"ITEM_DESCRIPTION": ["description 01", "description 02", "description 03", "description 04", "description 05"],
				"MATERIAL_ID": testData.oMaterialTestDataPlc.MATERIAL_ID.slice(0, 5),
				"PRICE_UNIT": [1, 100, 100, 100, 1],
				"VENDOR_ID": ['V1', 'V2', 'V3', 'V1', 'V2']
			});
			let sProjectSourceId = 'PLC_PROJECT_PRICE';
			let oPriceTestData = JSON.parse(JSON.stringify(testData.oMaterialPriceTestDataPlc));
			_.extend(oPriceTestData, {
				"PRICE_ID": ["2A0000E0B2BDB9671600A4000936462B", "2B0000E0B2BDB9671600A4000936462B", "2C0000E0B2BDB9671600A4000936462B", "2D0000E0B2BDB9671600A4000936462B"],
                "PRICE_SOURCE_ID": [ sProjectSourceId, sProjectSourceId, sProjectSourceId, sProjectSourceId ],
                "PROJECT_ID": testData.oProjectTestData.PROJECT_ID.concat('PR4'),
                "VENDOR_ID": ['V1', 'V2', 'V3', 'V3']
			});
			const oPriceExtTestData = _.cloneDeep(testData.oMaterialPriceExtTestDataPlc);

			beforeEach(function() {
				// set autocommit off because of dynamic procedure generation
				jasmine.dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL OFF");
				oMockstar.clearAllTables();

				oMockstar.insertTableData("project", testData.oProjectTestData);
				oMockstar.insertTableData("item", oItemTestData);
				oMockstar.insertTableData("calculation", testData.oCalculationTestData);
				oMockstar.insertTableData("calculation_version", testData.oCalculationVersionTestData);
				oMockstar.insertTableData("material", testData.oMaterialTestDataPlc);
				oMockstar.insertTableData("material__text", testData.oMaterialTextTestDataPlc);
				oMockstar.insertTableData("material_price", oPriceTestData);
				oMockstar.insertTableData("vendor", testData.oVendorTestDataPlc);
				if (jasmine.plcTestRunParameters.generatedFields === true) {
					oMockstar.insertTableData("item_ext", testData.oItemExtData);
					oMockstar.insertTableData("material_ext", testData.oMaterialExtTestDataPlc);
					oMockstar.insertTableData("material_price_ext", oPriceExtTestData);
				}
				oMockstar.insertTableData("session", testData.oSessionTestData);
				oMockstar.insertTableData("authorization", {
					PROJECT_ID	: [testData.oProjectTestData.PROJECT_ID[0]],
					USER_ID		: [sUserId],
					PRIVILEGE	: [InstancePrivileges.READ]
				});
			});

			it('should throw error on invalid request Body (missing attribute value)', function() {
				//arrange
				let oInvalidSimilarSearchBody =
				[
					{
						"CALCULATION_VERSION_ID": 2809,
						"ITEM_ID": 3001,
						"Attributes": [
							{
								"Name": "MATERIAL_ID",
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"CalculationVersions": {}
						}
					}
				];
				// act
				executeRequest(oInvalidSimilarSearchBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe(500);
				expect(oResponseObject.body).toEqualObject({});
				expect(oResponseObject.head.messages[0].code).toBe("GENERAL_VALIDATION_ERROR");
			});

			it('should return one search result for a single request (fuzzy search ITEM_DESCRIPTION)', function() {
				let oSimilarPartsRequestBody = [
					{
						"CALCULATION_VERSION_ID": 2809,
						"Attributes": [
							{
								"Name": "ITEM_DESCRIPTION",
								"Value": "description",
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"CalculationVersions": {}
						}
					}
				];

				// act
				executeRequest(oSimilarPartsRequestBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);
				expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBeDefined();

				expect(oResponseObject.body.transactionaldata[0].SimilarParts).toBeDefined();
				expect(_.isArray(oResponseObject.body.transactionaldata[0].SimilarParts)).toBe(true);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBeGreaterThan(0);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts[0].Attributes).toBeDefined();
				expect(oResponseObject.body.transactionaldata[0].SimilarParts).toMatchData({
					'MATERIAL_ID'         : ['MAT1',             'MAT2', 'MAT3', 'MAT4'],
					'VENDOR_ID'           : ['V1',               'V2',   'V3',   'V1'],
					'VENDOR_NAME'         : ['N1',               'N2',   null,   'N1'],  // For Vendor Id 'V3', its _VALID_TO < MASTER_DATA_TIMESTAMP
					'MATERIAL_DESCRIPTION': ['Material MAT1 DE', null,   null,   null]   // Other material ids have description only in 'EN', not 'DE'
				}, ['MATERIAL_ID', 'VENDOR_ID', 'VENDOR_NAME', 'MATERIAL_DESCRIPTION']);
			});

			it('should return one search result for a single request (fuzzy search CREATED_ON and PRICE_FIXED_PORTION)', function() {
				let oSimilarPartsRequestBody = [
					{
						"CALCULATION_VERSION_ID": 2809,
						"Attributes": [
							{
								"Name": "CREATED_ON",
								"Value": testData.sExpectedDate,
								"Weight": 1,
								"IsFuzzySearch": 1
							},
							{
								"Name": "PRICE_FIXED_PORTION",
								"Value": 2500.0,
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"CalculationVersions": {}
						}
					}
				];

				// act
				executeRequest(oSimilarPartsRequestBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);
				expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBeDefined();

				expect(oResponseObject.body.transactionaldata[0].SimilarParts).toBeDefined();
				expect(_.isArray(oResponseObject.body.transactionaldata[0].SimilarParts)).toBe(true);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBeGreaterThan(0);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts[0].Attributes).toBeDefined();
				_.each(oResponseObject.body.transactionaldata[0].SimilarParts, function(oSimilarPart) {
					expect(oSimilarPart.Attributes[0].Name).toBe("CREATED_ON");
					expect(oSimilarPart.Attributes[0].Score).toBeGreaterThan(0);
					expect(oSimilarPart.Attributes[1].Name).toBe("PRICE_FIXED_PORTION");
					expect(oSimilarPart.Attributes[1].Score).toBeGreaterThan(0);
				});
			});

			if (jasmine.plcTestRunParameters.generatedFields === true) {
				it('should return one search result for a single request (fuzzy search CUST_STRING_MANUAL)', function() {
					let oSimilarPartsRequestBody = [
						{
							"CALCULATION_VERSION_ID": 2809,
							"Attributes": [
								{
									"Name": "CUST_STRING_MANUAL",
									"Value": "Test",
									"Weight": 1,
									"IsFuzzySearch": 1
								}
							],
							"Source": {
								"CalculationVersions": {}
							}
						}
					];

					// act
					executeRequest(oSimilarPartsRequestBody);

					// assert
					let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oDefaultResponseMock.status).toBe($.net.http.OK);
					expect(oResponseObject.body.transactionaldata.length).toBe(1);
					expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBeDefined();

					expect(oResponseObject.body.transactionaldata[0].SimilarParts).toBeDefined();
					expect(_.isArray(oResponseObject.body.transactionaldata[0].SimilarParts)).toBe(true);
					expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBeGreaterThan(0);
					expect(oResponseObject.body.transactionaldata[0].SimilarParts[0].Attributes).toBeDefined();
				});

				it('should return search results for batch requests: one for fuzzy search ITEM_DESCRIPTION and another for pattern compare CUST_STRING_MANUAL', function() {
					let oSimilarPartsBatchRequestBody = [
						{
							"CALCULATION_VERSION_ID": 2809,
							"Attributes": [
								{
									"Name": "ITEM_DESCRIPTION",
									"Value": "description",
									"Weight": 1,
									"IsFuzzySearch": 1
								}
							],
							"Source": {
								"CalculationVersions": {}
							}
						},
						{
							"CALCULATION_VERSION_ID": 4809,
							"Attributes": [
								{
									"Name": "CUST_STRING_MANUAL",
									"Value": "Test 1",
									"Weight": 1,
									"IsFuzzySearch": 0,
									"Pattern": {
										"Value": "([a-zA-Z]{4}) ([0-9]{1})",
										"Groups": [
											{
												"Index": 1,
												"Name": "M_TYPE",
												"Weight": 1,
												"Dict": [
													{
														"Key": [ "Test" ],
														"Value": "Test"
													}
												]
											}
										]
									}
								}
							],
							"Source": {
								"CalculationVersions": {}
							}
						}
					];
					// act
					executeRequest(oSimilarPartsBatchRequestBody);

					// assert
					let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oDefaultResponseMock.status).toBe($.net.http.OK);
					expect(oResponseObject.body.transactionaldata.length).toBe(2);
					expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBeDefined();
					expect(oResponseObject.body.transactionaldata[0].SimilarParts).toBeDefined();

					expect(oResponseObject.body.transactionaldata[1].CALCULATION_VERSION_ID).toBeDefined();
					expect(oResponseObject.body.transactionaldata[1].SimilarParts).toBeDefined();
				});

				it("should return similar materials for fuzzy search CMPR_DECIMAL_WITH_CURRENCY_MANUAL", function() {
					let oSimilarPartsRequestBody = [
						{
							"CALCULATION_VERSION_ID": 2809,
							"Attributes": [
								{
									"Name": "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
									"Value": "200",
									"Weight": 1,
									"IsFuzzySearch": 1
								}
							],
							"Source": {
								"MasterData": {}
							}
						}
					];

					// act
					executeRequest(oSimilarPartsRequestBody);

					// assert
					let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oDefaultResponseMock.status).toBe($.net.http.OK);
					expect(oResponseObject.body.transactionaldata.length).toBe(1);
					expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(2809);
					expect(oResponseObject.body.transactionaldata[0].SimilarParts).toMatchData({
						"MATERIAL_ID":				[ "MAT1"	],
						"PRICE_FIXED_PORTION":		[ "123.45"	],
						"PRICE_VARIABLE_PORTION":	[ "234.56"	],
						"MATERIAL_DESCRIPTION":		[ "Material MAT1 DE"]
					}, ["MATERIAL_ID"]);
					expect(oResponseObject.body.transactionaldata[0].SimilarParts[0].Attributes).toMatchData({
						"Name":		[ "CMPR_DECIMAL_WITH_CURRENCY_MANUAL" ],
						"Value":	[ "234.5600000 (1)" ]
					}, ["Name"]);
				});

				// Testing custom field which shows in items and master data tables
				it("should return similar items and materials for fuzzy search CMPR_DECIMAL_WITH_CURRENCY_UNIT", function() {
					oMockstar.execSingle(`UPDATE {{item_ext}} SET CMPR_DECIMAL_WITH_CURRENCY_UNIT = 'EUR'`);
					let oSimilarPartsRequestBody = [
						{
							"CALCULATION_VERSION_ID": 2809,
							"Attributes": [
								{
									"Name": "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
									"Value": "EUR",
									"Weight": 1,
									"IsFuzzySearch": 0,
									"Pattern": {
										"Value": "([a-zA-Z]{1})([a-zA-Z]{1})([a-zA-Z]{1})",
										"Groups": [
											{
												"Index": 1,
												"Name": "EUR",
												"Weight": 1,
												"Dict": [
													{
														"Key": [ "E" ],
														"Value": "E"
													}
												]
											}
										]
									}
								}
							],
							"Source": {
								"CalculationVersions": {},
								"MasterData": {}
							}
						}
					];

					// act
					executeRequest(oSimilarPartsRequestBody);

					// assert
					let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
					expect(oDefaultResponseMock.status).toBe($.net.http.OK);
					expect(oResponseObject.body.transactionaldata.length).toBe(1);
					expect(oResponseObject.body.transactionaldata[0].CALCULATION_VERSION_ID).toBe(2809);

					expect(oResponseObject.body.transactionaldata[0].SimilarParts).toMatchData({
						"MATERIAL_ID":		[ "MAT1", "MAT1", "MAT2", "MAT3", "MAT4"],
						"Source":			[ "MasterData", "CalculationVersions", "CalculationVersions", "CalculationVersions", "CalculationVersions" ],
						"ITEM_DESCRIPTION":	[ null, "description 01", "description 02", "description 03", "description 04"]
					}, ["MATERIAL_ID", "Source"]);
					_.each(oResponseObject.body.transactionaldata[0].SimilarParts, function(oSimilarPart) {
						expect(oSimilarPart.Attributes).toMatchData({
							"Name":		[ "EUR" ],
							"Value":	[ "E (1)" ]
						}, ["Name"]);
					});
				});
			}

			it('should return no data when user has no privilege to read one calculation', function() {
				oMockstar.clearTable('authorization');
				oMockstar.insertTableData("authorization", {
					PROJECT_ID	: [ 'PR4' ],
					USER_ID	  	: [ sUserId ],
					PRIVILEGE	: [ InstancePrivileges.READ ]
				});
				let oSimilarPartsRequestBody = [
					{
						"CALCULATION_VERSION_ID": 5809,
						"Attributes": [
							{
								"Name": "ITEM_DESCRIPTION",
								"Value": "description",
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"CalculationVersions": {},
							"OnlyCurrent": 1
						}
					}
				];
				// act
				executeRequest(oSimilarPartsRequestBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBe(0);
			});

			it('should return no data when user has no privilege to read material price', function() {
				oMockstar.clearTable('authorization');
				oMockstar.insertTableData("authorization", {
					PROJECT_ID  : [ 'PR4' ],
					USER_ID     : [ sUserId ],
					PRIVILEGE   : [ InstancePrivileges.READ ]
				});
				let oSimilarPartsRequestBody = [
					{
						"CALCULATION_VERSION_ID": 5809,
						"Attributes": [
							{
								"Name": "MATERIAL_DESCRIPTION",
								"Value": "Material MAT",
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"MasterData": {}
						}
					}
				];

				// act
				executeRequest(oSimilarPartsRequestBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);
				// Tester only has privilege to read project 'PR4', not the projects in test data
				expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBe(0);
			});

			it('should return expected property values when fuzzy search MATERIAL_DESCRIPTION from master data', function() {
				let oSimilarPartsRequestBody = [
					{
						"CALCULATION_VERSION_ID": 2809,
						"Attributes": [
							{
								"Name": "MATERIAL_DESCRIPTION",
								"Value": "Material MAT",
								"Weight": 1,
								"IsFuzzySearch": 1
							}
						],
						"Source": {
							"MasterData": {}
						}
					}
				];

				// act
				executeRequest(oSimilarPartsRequestBody);

				// assert
				let oResponseObject = JSON.parse(oDefaultResponseMock.setBody.calls.mostRecent().args[0]);
				expect(oDefaultResponseMock.status).toBe($.net.http.OK);
				expect(oResponseObject.body.transactionaldata.length).toBe(1);

				expect(oResponseObject.body.transactionaldata[0].SimilarParts).toBeDefined();
				expect(_.isArray(oResponseObject.body.transactionaldata[0].SimilarParts)).toBe(true);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts.length).toBeGreaterThan(0);
				expect(oResponseObject.body.transactionaldata[0].SimilarParts[0].Attributes).toBeDefined();
				expect(oResponseObject.body.transactionaldata[0].SimilarParts).toMatchData({
					'MATERIAL_ID'         : [ 'MAT1'],  // In table t_material_price, 'MAT1' shows in 'PR1', which is only project tester has privilege to read
					'VENDOR_ID'           : [ 'V1' ],
					'VENDOR_NAME'         : [ 'N1' ],
					'MATERIAL_DESCRIPTION': [ 'Material MAT1 DE']
				}, ['MATERIAL_ID', 'VENDOR_ID', 'VENDOR_NAME', 'MATERIAL_DESCRIPTION']);
			});
		});

	}).addTags(["All_Unit_Tests"]);
}
