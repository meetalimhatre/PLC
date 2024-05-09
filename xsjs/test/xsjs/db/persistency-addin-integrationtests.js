var _ = require("lodash");
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");
var testData = require("../../testdata/testdata").data;

var AddinImport = $.import("xs.db", "persistency-addin");
var AddinStates = require("../../../lib/xs/util/constants").AddinStates;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var MessageLibrary = require("../../../lib/xs/util/message");


if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.persistency-addin-integrationtests', function() {

		
		var oMockstar = null;

		beforeOnce(function() {
			oMockstar = new MockstarFacade({
				substituteTables : {
					version : {
						name: AddinImport.Tables.version,
						data: testData.oAddinVersionTestData
					},
					configuration_header : {
						name: AddinImport.Tables.configuration_header,
						data: testData.oAddinConfigurationHeaderTestData
					},
					configuration_items : {
						name: AddinImport.Tables.configuration_items,
						data: testData.oAddinConfigurationItemsTestData
					}
				},
				csvPackage: testData.sCsvPackage
			});
		});

		afterOnce(function() {
			oMockstar.cleanup();
		});
		
		describe('getAddin', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should return addin including config header for addin WITH config', function() {
				// arrange				
				var iIndex = 1;
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[iIndex], oAddin.ADDIN_MINOR_VERSION[iIndex], oAddin.ADDIN_REVISION_NUMBER[iIndex], oAddin.ADDIN_BUILD_NUMBER[iIndex]];

				// act
				var result = persistency.Addin.getAddin(oAddin.ADDIN_GUID[iIndex], aAddinVersions);
				
				// assert
				var oAddinVersionTestData = testData.oAddinVersionTestData;
				var oAddinConfigurationHeaderTestData = testData.oAddinConfigurationHeaderTestData;				
				
				var oExpectedResult = {};	
						
				var sHeader_created_on = null;
				var sHeader_created_by = null;
				var sHeader_last_modified_on = null;
				var sHeader_last_modified_by = null;
				
				for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
					
					// check testdata for matching config entries
					if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddinVersionTestData.ADDIN_GUID[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]
					) {
						sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
						sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
						sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
						sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
					}
				}
				
				oExpectedResult = {
					"ADDIN_GUID":oAddinVersionTestData.ADDIN_GUID[iIndex],
					"ADDIN_MAJOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]),
					"ADDIN_MINOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]),
					"ADDIN_REVISION_NUMBER":parseInt(oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]),
					"ADDIN_BUILD_NUMBER":parseInt(oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]),
					"NAME":oAddinVersionTestData.NAME[iIndex],
					"FULL_QUALIFIED_NAME":oAddinVersionTestData.FULL_QUALIFIED_NAME[iIndex],
					"DESCRIPTION":oAddinVersionTestData.DESCRIPTION[iIndex],
					"PUBLISHER":oAddinVersionTestData.PUBLISHER[iIndex],
					"STATUS":oAddinVersionTestData.STATUS[iIndex],
					"CERTIFICATE_ISSUER":oAddinVersionTestData.CERTIFICATE_ISSUER[iIndex],
					"CERTIFICATE_SUBJECT":oAddinVersionTestData.CERTIFICATE_SUBJECT[iIndex],
					"CERTIFICATE_VALID_FROM":oAddinVersionTestData.CERTIFICATE_VALID_FROM[iIndex],
					"CERTIFICATE_VALID_TO":oAddinVersionTestData.CERTIFICATE_VALID_TO[iIndex],
					"CREATED_ON":oAddinVersionTestData.CREATED_ON[iIndex],
					"CREATED_BY":oAddinVersionTestData.CREATED_BY[iIndex],
					"LAST_MODIFIED_ON":oAddinVersionTestData.LAST_MODIFIED_ON[iIndex],
					"LAST_MODIFIED_BY":oAddinVersionTestData.LAST_MODIFIED_BY[iIndex],
					"HEADER_CREATED_ON":sHeader_created_on,
					"HEADER_CREATED_BY":sHeader_created_by,
					"HEADER_LAST_MODIFIED_ON":sHeader_last_modified_on,
					"HEADER_LAST_MODIFIED_BY":sHeader_last_modified_by
				};
	
				
				jasmine.log(JSON.stringify(oExpectedResult));
				jasmine.log(JSON.stringify(result));				
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedResult)));
			});

			it('should return addin including config header for addin WITHOUT config', function() {
				// arrange				
				var iIndex = 2;
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[iIndex], oAddin.ADDIN_MINOR_VERSION[iIndex], oAddin.ADDIN_REVISION_NUMBER[iIndex], oAddin.ADDIN_BUILD_NUMBER[iIndex]];

				// act
				var result = persistency.Addin.getAddin(oAddin.ADDIN_GUID[iIndex], aAddinVersions);
				
				// assert
				var oAddinVersionTestData = testData.oAddinVersionTestData;
				var oAddinConfigurationHeaderTestData = testData.oAddinConfigurationHeaderTestData;				
				
				var oExpectedResult = {};	
						
				var sHeader_created_on = null;
				var sHeader_created_by = null;
				var sHeader_last_modified_on = null;
				var sHeader_last_modified_by = null;
				
				for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
					
					// check testdata for matching config entries
					if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddinVersionTestData.ADDIN_GUID[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]
						&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]
					) {
						sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
						sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
						sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
						sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
					}
				}
				
				oExpectedResult = {
					"ADDIN_GUID":oAddinVersionTestData.ADDIN_GUID[iIndex],
					"ADDIN_MAJOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]),
					"ADDIN_MINOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]),
					"ADDIN_REVISION_NUMBER":parseInt(oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]),
					"ADDIN_BUILD_NUMBER":parseInt(oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]),
					"NAME":oAddinVersionTestData.NAME[iIndex],
					"FULL_QUALIFIED_NAME":oAddinVersionTestData.FULL_QUALIFIED_NAME[iIndex],
					"DESCRIPTION":oAddinVersionTestData.DESCRIPTION[iIndex],
					"PUBLISHER":oAddinVersionTestData.PUBLISHER[iIndex],
					"STATUS":oAddinVersionTestData.STATUS[iIndex],
					"CERTIFICATE_ISSUER":oAddinVersionTestData.CERTIFICATE_ISSUER[iIndex],
					"CERTIFICATE_SUBJECT":oAddinVersionTestData.CERTIFICATE_SUBJECT[iIndex],
					"CERTIFICATE_VALID_FROM":oAddinVersionTestData.CERTIFICATE_VALID_FROM[iIndex],
					"CERTIFICATE_VALID_TO":oAddinVersionTestData.CERTIFICATE_VALID_TO[iIndex],
					"CREATED_ON":oAddinVersionTestData.CREATED_ON[iIndex],
					"CREATED_BY":oAddinVersionTestData.CREATED_BY[iIndex],
					"LAST_MODIFIED_ON":oAddinVersionTestData.LAST_MODIFIED_ON[iIndex],
					"LAST_MODIFIED_BY":oAddinVersionTestData.LAST_MODIFIED_BY[iIndex],
					"HEADER_CREATED_ON":sHeader_created_on,
					"HEADER_CREATED_BY":sHeader_created_by,
					"HEADER_LAST_MODIFIED_ON":sHeader_last_modified_on,
					"HEADER_LAST_MODIFIED_BY":sHeader_last_modified_by
				};
	
				
				jasmine.log(JSON.stringify(oExpectedResult));
				jasmine.log(JSON.stringify(result));				
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedResult)));
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if no addin version can be found', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1]+1, oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				try {
					var result = persistency.Addin.getAddin(oAddin.ADDIN_GUID[1], aAddinVersions);
				} catch(e) {
					var exception = e;
				}
				
				jasmine.log(exception.code);
				jasmine.log(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
				
				expect(exception).toBeDefined();
				expect(exception.code).toEqualObject(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
				
			});
		});

		describe('getAddinsByStatus', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should return all addins', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var result = persistency.Addin.getAddinsByStatus();

				// assert				
				var oAddinVersionTestData = testData.oAddinVersionTestData;
				var oAddinConfigurationHeaderTestData = testData.oAddinConfigurationHeaderTestData;
				
				
				var oExpectedResult = [];
				
				_.each(oAddinVersionTestData.ADDIN_GUID, function(aValues, iIndex) {
						
					var sHeader_created_on = null;
					var sHeader_created_by = null;
					var sHeader_last_modified_on = null;
					var sHeader_last_modified_by = null;
					
					for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
						
						// check testdata for matching config entries
						if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddinVersionTestData.ADDIN_GUID[iIndex]
							&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]
							&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]
							&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]
							&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]
						) {
							sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
							sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
							sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
							sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
						}
					}
					
					oExpectedResult.push({
						"ADDIN_GUID":oAddinVersionTestData.ADDIN_GUID[iIndex],
						"ADDIN_MAJOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]),
						"ADDIN_MINOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]),
						"ADDIN_REVISION_NUMBER":parseInt(oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]),
						"ADDIN_BUILD_NUMBER":parseInt(oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]),
						"NAME":oAddinVersionTestData.NAME[iIndex],
						"FULL_QUALIFIED_NAME":oAddinVersionTestData.FULL_QUALIFIED_NAME[iIndex],
						"DESCRIPTION":oAddinVersionTestData.DESCRIPTION[iIndex],
						"PUBLISHER":oAddinVersionTestData.PUBLISHER[iIndex],
						"STATUS":oAddinVersionTestData.STATUS[iIndex],
						"CERTIFICATE_ISSUER":oAddinVersionTestData.CERTIFICATE_ISSUER[iIndex],
						"CERTIFICATE_SUBJECT":oAddinVersionTestData.CERTIFICATE_SUBJECT[iIndex],
						"CERTIFICATE_VALID_FROM":oAddinVersionTestData.CERTIFICATE_VALID_FROM[iIndex],
						"CERTIFICATE_VALID_TO":oAddinVersionTestData.CERTIFICATE_VALID_TO[iIndex],
						"CREATED_ON":oAddinVersionTestData.CREATED_ON[iIndex],
						"CREATED_BY":oAddinVersionTestData.CREATED_BY[iIndex],
						"LAST_MODIFIED_ON":oAddinVersionTestData.LAST_MODIFIED_ON[iIndex],
						"LAST_MODIFIED_BY":oAddinVersionTestData.LAST_MODIFIED_BY[iIndex],
						"HEADER_CREATED_ON":sHeader_created_on,
						"HEADER_CREATED_BY":sHeader_created_by,
						"HEADER_LAST_MODIFIED_ON":sHeader_last_modified_on,
						"HEADER_LAST_MODIFIED_BY":sHeader_last_modified_by
					});
				});
				
				jasmine.log(JSON.stringify(oExpectedResult));
				jasmine.log(JSON.stringify(result));
				result = [result[0], result[2], result[1]];			
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedResult)));
			});

			it('should return addins with status activated', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var result = persistency.Addin.getAddinsByStatus(AddinStates.Activated);

				// assert				
				var oAddinVersionTestData = testData.oAddinVersionTestData;
				var oAddinConfigurationHeaderTestData = testData.oAddinConfigurationHeaderTestData;
				
				
				var oExpectedResult = [];
				
				var j = 0;				
				_.each(oAddinVersionTestData.ADDIN_GUID, function(aValues, iIndex) {
					
					if(oAddinVersionTestData.STATUS[iIndex] == AddinStates.Activated) {
						
						var sHeader_created_on = null;
						var sHeader_created_by = null;
						var sHeader_last_modified_on = null;
						var sHeader_last_modified_by = null;
						
						for(var i = 0; i < oAddinConfigurationHeaderTestData.ADDIN_GUID.length; i++) {
							
							// check testdata for matching config entries
							if(	oAddinConfigurationHeaderTestData.ADDIN_GUID[i] == oAddinVersionTestData.ADDIN_GUID[iIndex]
								&& oAddinConfigurationHeaderTestData.ADDIN_MAJOR_VERSION[i] == oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]
								&& oAddinConfigurationHeaderTestData.ADDIN_MINOR_VERSION[i] == oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]
								&& oAddinConfigurationHeaderTestData.ADDIN_REVISION_NUMBER[i] == oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]
								&& oAddinConfigurationHeaderTestData.ADDIN_BUILD_NUMBER[i] == oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]
							) {
								sHeader_created_on = oAddinConfigurationHeaderTestData.CREATED_ON[i];
								sHeader_created_by = oAddinConfigurationHeaderTestData.CREATED_BY[i];
								sHeader_last_modified_on = oAddinConfigurationHeaderTestData.LAST_MODIFIED_ON[i];
								sHeader_last_modified_by = oAddinConfigurationHeaderTestData.LAST_MODIFIED_BY[i];
							}
						}
						
						oExpectedResult.push({
							"ADDIN_GUID":oAddinVersionTestData.ADDIN_GUID[iIndex],
							"ADDIN_MAJOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MAJOR_VERSION[iIndex]),
							"ADDIN_MINOR_VERSION":parseInt(oAddinVersionTestData.ADDIN_MINOR_VERSION[iIndex]),
							"ADDIN_REVISION_NUMBER":parseInt(oAddinVersionTestData.ADDIN_REVISION_NUMBER[iIndex]),
							"ADDIN_BUILD_NUMBER":parseInt(oAddinVersionTestData.ADDIN_BUILD_NUMBER[iIndex]),
							"NAME":oAddinVersionTestData.NAME[iIndex],
							"FULL_QUALIFIED_NAME":oAddinVersionTestData.FULL_QUALIFIED_NAME[iIndex],
							"DESCRIPTION":oAddinVersionTestData.DESCRIPTION[iIndex],
							"PUBLISHER":oAddinVersionTestData.PUBLISHER[iIndex],
							"STATUS":oAddinVersionTestData.STATUS[iIndex],
							"CERTIFICATE_ISSUER":oAddinVersionTestData.CERTIFICATE_ISSUER[iIndex],
							"CERTIFICATE_SUBJECT":oAddinVersionTestData.CERTIFICATE_SUBJECT[iIndex],
							"CERTIFICATE_VALID_FROM":oAddinVersionTestData.CERTIFICATE_VALID_FROM[iIndex],
							"CERTIFICATE_VALID_TO":oAddinVersionTestData.CERTIFICATE_VALID_TO[iIndex],
							"CREATED_ON":oAddinVersionTestData.CREATED_ON[iIndex],
							"CREATED_BY":oAddinVersionTestData.CREATED_BY[iIndex],
							"LAST_MODIFIED_ON":oAddinVersionTestData.LAST_MODIFIED_ON[iIndex],
							"LAST_MODIFIED_BY":oAddinVersionTestData.LAST_MODIFIED_BY[iIndex],
							"HEADER_CREATED_ON":sHeader_created_on,
							"HEADER_CREATED_BY":sHeader_created_by,
							"HEADER_LAST_MODIFIED_ON":sHeader_last_modified_on,
							"HEADER_LAST_MODIFIED_BY":sHeader_last_modified_by
						});
						
						j++;
					}
				});
				
				jasmine.log(JSON.stringify(oExpectedResult));
				jasmine.log(JSON.stringify(result));				
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedResult)));
			});

			it('should return an empty list if no addins available', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				oMockstar.clearAllTables();

				// act
				var result = persistency.Addin.getAddinsByStatus();

				// assert				
				var oExpectedResult = [];
				
				jasmine.log(JSON.stringify(oExpectedResult));
				jasmine.log(JSON.stringify(result));				
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedResult)));
			
			});

		});

		describe('getAddinVersion', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should return addin version without configuration', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				var result = persistency.Addin.getAddinVersion(oAddin.ADDIN_GUID[1], aAddinVersions);
				
				// assert
				var oExpectedAddinVersion = {
						"ADDIN_GUID"              : oAddin.ADDIN_GUID[1],
						"ADDIN_MAJOR_VERSION"     : parseInt(oAddin.ADDIN_MAJOR_VERSION[1]),
						"ADDIN_MINOR_VERSION"     : parseInt(oAddin.ADDIN_MINOR_VERSION[1]),
						"ADDIN_REVISION_NUMBER"   : parseInt(oAddin.ADDIN_REVISION_NUMBER[1]),
						"ADDIN_BUILD_NUMBER"      : parseInt(oAddin.ADDIN_BUILD_NUMBER[1]),
						"NAME"                    : oAddin.NAME[1],
						"FULL_QUALIFIED_NAME"     : oAddin.FULL_QUALIFIED_NAME[1],
						"DESCRIPTION"             : oAddin.DESCRIPTION[1],
						"PUBLISHER"               : oAddin.PUBLISHER[1],
						"STATUS"                  : oAddin.STATUS[1],
						"CERTIFICATE_ISSUER"      : oAddin.CERTIFICATE_ISSUER[1],
						"CERTIFICATE_SUBJECT"     : oAddin.CERTIFICATE_SUBJECT[1],
						"CERTIFICATE_VALID_FROM"  : oAddin.CERTIFICATE_VALID_FROM[1],
						"CERTIFICATE_VALID_TO"    : oAddin.CERTIFICATE_VALID_TO[1],
						"CREATED_ON"              : oAddin.CREATED_ON[1],
						"CREATED_BY"      : oAddin.CREATED_BY[1],
						"LAST_MODIFIED_ON"        : oAddin.LAST_MODIFIED_ON[1],
						"LAST_MODIFIED_BY": oAddin.LAST_MODIFIED_BY[1]
				};
				
				jasmine.log(JSON.stringify(oExpectedAddinVersion));
				jasmine.log(JSON.stringify(result));				
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedAddinVersion)));
			});

			it('should raise exception (GENERAL_ENTITY_NOT_FOUND_ERROR) if no addin version can be found', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1]+1, oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				try {
					var result = persistency.Addin.getAddinVersion(oAddin.ADDIN_GUID[1], aAddinVersions);
				} catch(e) {
					var exception = e;
				}
				
				jasmine.log(exception.code);
				jasmine.log(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
				
				expect(exception).toBeDefined();
				expect(exception.code).toEqualObject(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR);
				
			});

		});

		describe('getAddinConfiguration', function() {
			
			var oAddin = JSON.parse(JSON.stringify(testData.oAddinVersionTestData));
			var oAddinConfigHeaderTestData = JSON.parse(JSON.stringify(testData.oAddinConfigurationHeaderTestData));	
			var oAddinConfigItemTestData = JSON.parse(JSON.stringify(testData.oAddinConfigurationItemsTestData));

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should return addin configuration if it exists for guid and version', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				var result = persistency.Addin.getAddinConfiguration(oAddin.ADDIN_GUID[1], aAddinVersions);
				
				// assert
				var oConfig = _.clone(oAddinConfigItemTestData);
				var oExpectedConfiguration = {
						ConfigurationHeader: {
							ADDIN_GUID:					oAddin.ADDIN_GUID[1],
							ADDIN_MAJOR_VERSION:		parseInt(oAddin.ADDIN_MAJOR_VERSION[1]),
							ADDIN_MINOR_VERSION:		parseInt(oAddin.ADDIN_MINOR_VERSION[1]),
							ADDIN_REVISION_NUMBER:		parseInt(oAddin.ADDIN_REVISION_NUMBER[1]),
							ADDIN_BUILD_NUMBER:			parseInt(oAddin.ADDIN_BUILD_NUMBER[1]),							
							CREATED_ON : 				new Date(oAddin.CREATED_ON[1]),
							CREATED_BY :		oAddin.CREATED_BY[1],
							LAST_MODIFIED_ON : 			new Date(oAddin.LAST_MODIFIED_ON[1]),
							LAST_MODIFIED_BY :	oAddin.LAST_MODIFIED_BY[1]
						},
						ConfigurationItems: [
							{CONFIG_KEY : oConfig.CONFIG_KEY[0], CONFIG_VALUE : oConfig.CONFIG_VALUE[0]},
							{CONFIG_KEY : oConfig.CONFIG_KEY[1], CONFIG_VALUE : oConfig.CONFIG_VALUE[1]}
						]
				};
								
				jasmine.log(JSON.stringify(result));
				jasmine.log(JSON.stringify(oExpectedConfiguration));
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedConfiguration)));
			});

			it('should return previous addin configuration if addin configuration does not exist and bUsePreviousVersion = true', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[2], oAddin.ADDIN_MINOR_VERSION[2], oAddin.ADDIN_REVISION_NUMBER[2], oAddin.ADDIN_BUILD_NUMBER[2]];				

				oMockstar.clearTables(['configuration_header', 'configuration_items']);

				var oConfigHeaderTestData = _.clone(oAddinConfigHeaderTestData);
				oConfigHeaderTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigHeaderTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigHeaderTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigHeaderTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigHeaderTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigHeaderTestData.CREATED_ON.push(oAddin.CREATED_ON[2]);
				oConfigHeaderTestData.CREATED_BY.push(oAddin.CREATED_BY[2]);
				oConfigHeaderTestData.LAST_MODIFIED_ON.push(oAddin.LAST_MODIFIED_ON[2]);
				oConfigHeaderTestData.LAST_MODIFIED_BY.push(oAddin.LAST_MODIFIED_BY[2]);

				var oConfigItemTestData = _.clone(oAddinConfigItemTestData);
				oConfigItemTestData.ADDIN_GUID.push(oAddin.ADDIN_GUID[2]);
				oConfigItemTestData.ADDIN_MAJOR_VERSION.push(String(oAddin.ADDIN_MAJOR_VERSION[2] - 1)); // Lower version number
				oConfigItemTestData.ADDIN_MINOR_VERSION.push(oAddin.ADDIN_MINOR_VERSION[2]);
				oConfigItemTestData.ADDIN_REVISION_NUMBER.push(oAddin.ADDIN_REVISION_NUMBER[2]);
				oConfigItemTestData.ADDIN_BUILD_NUMBER.push(oAddin.ADDIN_BUILD_NUMBER[2]);
				oConfigItemTestData.CONFIG_KEY.push('TestKeyOld');
				oConfigItemTestData.CONFIG_VALUE.push('SomeValue_OldVersion');

				oMockstar.insertTableData("configuration_header", oConfigHeaderTestData);
				oMockstar.insertTableData("configuration_items", oConfigItemTestData);

				// act
				var result = persistency.Addin.getAddinConfiguration(oAddin.ADDIN_GUID[2], aAddinVersions, true);

				// assert
				var oConfig = _.clone(oAddinConfigItemTestData);
				var oExpectedConfiguration = {
						ConfigurationHeader: {
							ADDIN_GUID:					oAddin.ADDIN_GUID[2],
							ADDIN_MAJOR_VERSION:		oAddin.ADDIN_MAJOR_VERSION[2] - 1,
							ADDIN_MINOR_VERSION:		parseInt(oAddin.ADDIN_MINOR_VERSION[2]),
							ADDIN_REVISION_NUMBER:		parseInt(oAddin.ADDIN_REVISION_NUMBER[2]),
							ADDIN_BUILD_NUMBER:			parseInt(oAddin.ADDIN_BUILD_NUMBER[2]),							
							CREATED_ON : 				new Date(oAddin.CREATED_ON[2]),
							CREATED_BY :		oAddin.CREATED_BY[2],
							LAST_MODIFIED_ON : 			new Date(oAddin.LAST_MODIFIED_ON[2]),
							LAST_MODIFIED_BY :	oAddin.LAST_MODIFIED_BY[2]
						},
						ConfigurationItems: [
							    {
								CONFIG_KEY : oConfigItemTestData.CONFIG_KEY[oConfigItemTestData.CONFIG_KEY.length - 1], 
								CONFIG_VALUE : oConfigItemTestData.CONFIG_VALUE[oConfigItemTestData.CONFIG_VALUE.length - 1]
								}
						]
				};
								
				jasmine.log(JSON.stringify(result));
				jasmine.log(JSON.stringify(oExpectedConfiguration));
				
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(JSON.parse(JSON.stringify(oExpectedConfiguration)));
			});

			it('should return empty if addin configuration does not exist and bUsePreviousVersion = false', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[2], oAddin.ADDIN_MINOR_VERSION[2], oAddin.ADDIN_REVISION_NUMBER[2], oAddin.ADDIN_BUILD_NUMBER[2]];

				// act
				var result = persistency.Addin.getAddinConfiguration(oAddin.ADDIN_GUID[2], aAddinVersions, false);

				// assert
				expect(result).toBe(undefined);
			});

			it('should return empty if addin configuration does not exist and bUsePreviousVersion = undefined', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[2], oAddin.ADDIN_MINOR_VERSION[2], oAddin.ADDIN_REVISION_NUMBER[2], oAddin.ADDIN_BUILD_NUMBER[2]];

				// act
				var result = persistency.Addin.getAddinConfiguration(oAddin.ADDIN_GUID[2], aAddinVersions);

				// assert
				expect(result).toBe(undefined);
			});

			it('should return empty if addin configuration and previous versions do not exist and bUsePreviousVersion = true', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var result = persistency.Addin.getAddinConfiguration("Guid_without_config", [9,9,9,9], true);

				// assert
				expect(result).toBe(undefined);
			});

		});

		describe('versionExists', function() {
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should return true if version with guid and version exists', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				var result = persistency.Addin.versionExists(oAddin.ADDIN_GUID[1], aAddinVersions);

				// assert
				expect(result).toBe(true);
			});

			it('should return false if version with guid and version does not exist', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var result = persistency.Addin.versionExists('999999999', [9, 9, 9, 9]);

				// assert
				expect(result).toBe(false);
			});

		});

		describe('register', function() {
			var oNewAddinVersion = {
					"ADDIN_GUID":  "234567891",
					"ADDIN_VERSION" : "3.14.4.3",
					"NAME":  "Test Add-In 3",
					"FULL_QUALIFIED_NAME": "com.sap.plc.extensibility.testAddIn_3",
					"DESCRIPTION" :  "Test addin desc 3",
					"PUBLISHER":  "SAP SE",
					"CERTIFICATE_ISSUER":  "CN=VeriSign Class 3",
					"CERTIFICATE_SUBJECT":  "CN = TFS, O = mySAP.com",
					"CERTIFICATE_VALID_FROM":  new Date(testData.oAddinVersionTestData.CERTIFICATE_VALID_FROM[0]),
					"CERTIFICATE_VALID_TO":  new Date(testData.oAddinVersionTestData.CERTIFICATE_VALID_TO[0])
			};

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should register addin version including optional fields', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);

				// act
				var result = persistency.Addin.register(oNewAddinVersion);

				// assert
				var oExpectedAddin = _.clone(oNewAddinVersion);
				var resultWithoutDates = _.omit(result, ['LAST_MODIFIED_ON', 'CREATED_ON']);

				var oExpectedAddinWithoutDates = _.omit(oExpectedAddin, ['LAST_MODIFIED_ON', 'CREATED_ON']);
				
				jasmine.log(JSON.stringify(resultWithoutDates));
				jasmine.log(JSON.stringify(oExpectedAddinWithoutDates));				
				
				// Check method resultset
				expect(resultWithoutDates).toEqualObject(oExpectedAddinWithoutDates);

				// Check that data has been written
				result = oMockstar.execQuery("select * from {{version}} where addin_guid=" + oNewAddinVersion.ADDIN_GUID);
				result.columns.ADDIN_BUILD_NUMBER.rows[0] = result.columns.ADDIN_BUILD_NUMBER.rows[0].toString();
				result.columns.ADDIN_MAJOR_VERSION.rows[0] = result.columns.ADDIN_MAJOR_VERSION.rows[0].toString();
				result.columns.ADDIN_MINOR_VERSION.rows[0] = result.columns.ADDIN_MINOR_VERSION.rows[0].toString();
				result.columns.ADDIN_REVISION_NUMBER.rows[0] = result.columns.ADDIN_REVISION_NUMBER.rows[0].toString();
				expect(result).toMatchData(_.omit(oExpectedAddinWithoutDates, ['CONFIGURATION', 'ADDIN_VERSION']), ["ADDIN_GUID"]);
			});
			
			it('should register addin version NOT including optional fields', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oNewAddinVersionMinimal = _.omit(_.clone(oNewAddinVersion), ['DESCRIPTION', 'PUBLISHER']);

				// act
				var result = persistency.Addin.register(oNewAddinVersionMinimal);

				// assert
				var oExpectedAddin = _.clone(oNewAddinVersionMinimal);
				var resultWithoutDates = _.omit(result, ['LAST_MODIFIED_ON', 'CREATED_ON']);

				var oExpectedAddinWithoutDates = _.omit(oExpectedAddin, ['LAST_MODIFIED_ON', 'CREATED_ON']);
				
				jasmine.log(JSON.stringify(resultWithoutDates));
				jasmine.log(JSON.stringify(oExpectedAddinWithoutDates));			
					
				// Check method resultset
				expect(resultWithoutDates).toEqualObject(oExpectedAddinWithoutDates);

				// Check that data has been written
				result = oMockstar.execQuery("select * from {{version}} where addin_guid=" + oNewAddinVersionMinimal.ADDIN_GUID);
				result.columns.ADDIN_BUILD_NUMBER.rows[0] = result.columns.ADDIN_BUILD_NUMBER.rows[0].toString();
				result.columns.ADDIN_MAJOR_VERSION.rows[0] = result.columns.ADDIN_MAJOR_VERSION.rows[0].toString();
				result.columns.ADDIN_MINOR_VERSION.rows[0] = result.columns.ADDIN_MINOR_VERSION.rows[0].toString();
				result.columns.ADDIN_REVISION_NUMBER.rows[0] = result.columns.ADDIN_REVISION_NUMBER.rows[0].toString();
				expect(result).toMatchData(_.omit(oExpectedAddinWithoutDates, ['CONFIGURATION', 'ADDIN_VERSION']), ["ADDIN_GUID"]);
			});
		});

		describe('unregister', function() {
			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.clearTables(['configuration_items']);
				oMockstar.initializeData();
			});

			it('should unregister addins including configuration', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;				
				var sGuid = oAddin.ADDIN_GUID[1];
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];
				
				var sWhere = ["addin_guid=" + sGuid,
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[1],
				              ].join(" ");

				expect(mockstar_helpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header")).toBe(testData.oAddinConfigurationHeaderTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items")).toBe(testData.oAddinConfigurationItemsTestData.ADDIN_GUID.length);

				expect(mockstar_helpers.getRowCount(oMockstar, "version", sWhere)).toBe(1);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header", sWhere)).toBe(1);
				var iConfigItems = mockstar_helpers.getRowCount(oMockstar, "configuration_items", sWhere);
				expect(iConfigItems).toBe(2);
				
				// act
				persistency.Addin.unregister(sGuid, aAddinVersions);

				// assert				
				expect(mockstar_helpers.getRowCount(oMockstar, "version", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items", sWhere)).toBe(0);

				// Check that data for addin and no other data has been deleted
				expect(mockstar_helpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length-1);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header")).toBe(testData.oAddinConfigurationHeaderTestData.ADDIN_GUID.length-1);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items")).toBe(testData.oAddinConfigurationItemsTestData.ADDIN_GUID.length - iConfigItems);
			});
			
			it('should NOT unregister any addin / config if addin version is not covered in DB', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;				
				var sGuid = "9999999999";
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];
				
				var sWhere = ["addin_guid=" + sGuid,
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[1],
				              ].join(" ");

				expect(mockstar_helpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header")).toBe(testData.oAddinConfigurationHeaderTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items")).toBe(testData.oAddinConfigurationItemsTestData.ADDIN_GUID.length);

				expect(mockstar_helpers.getRowCount(oMockstar, "version", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items", sWhere)).toBe(0);

				// act
				persistency.Addin.unregister(sGuid, aAddinVersions);

				// assert		
				expect(mockstar_helpers.getRowCount(oMockstar, "version")).toBe(testData.oAddinVersionTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header")).toBe(testData.oAddinConfigurationHeaderTestData.ADDIN_GUID.length);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items")).toBe(testData.oAddinConfigurationItemsTestData.ADDIN_GUID.length);

				expect(mockstar_helpers.getRowCount(oMockstar, "version", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_header", sWhere)).toBe(0);
				expect(mockstar_helpers.getRowCount(oMockstar, "configuration_items", sWhere)).toBe(0);
			});
			
		});

		describe('updateVersion', function() {

			beforeEach(function() {
				oMockstar.clearAllTables();
				oMockstar.initializeData();
			});

			it('should update addin version to status = activated', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var sAddinVersion = [oAddin.ADDIN_MAJOR_VERSION[0], oAddin.ADDIN_MINOR_VERSION[0], oAddin.ADDIN_REVISION_NUMBER[0], oAddin.ADDIN_BUILD_NUMBER[0]].join(".");
				var oNewAddinVersion = {
						"ADDIN_GUID":  oAddin.ADDIN_GUID[0],
						"ADDIN_VERSION" : sAddinVersion,
						"STATUS" : AddinStates.Activated,
						"LAST_MODIFIED_ON" : oAddin.LAST_MODIFIED_ON[0]
				};

				// act
				var result = persistency.Addin.updateVersion(oNewAddinVersion);

				// assert
				result = JSON.parse(JSON.stringify(result));
				jasmine.log(JSON.stringify(result));
				var oExpectedData = JSON.parse(JSON.stringify({				
					"STATUS" : AddinStates.Activated,
					"LAST_MODIFIED_BY" : $.session.getUsername()
				}));
				expect(result).toMatchData(oExpectedData, [ "STATUS", "LAST_MODIFIED_BY" ]);
				expect(result.LAST_MODIFIED_ON).toBeGreaterThan(oAddin.LAST_MODIFIED_ON[0]);

				//Check that data for addin have been updated in db
				var sWhere = ["addin_guid=" + oAddin.ADDIN_GUID[0],
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[0],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[0],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[0],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[0],
				              "and status = '" + AddinStates.Activated + "'"
				              ].join(" ");
				expect(mockstar_helpers.getRowCount(oMockstar, "version", sWhere)).toBe(1);
			});

		});

		describe('createConfigurationHeader', function() {
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
			});

			it('should create addin configuration header', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[2], oAddin.ADDIN_MINOR_VERSION[2], oAddin.ADDIN_REVISION_NUMBER[2], oAddin.ADDIN_BUILD_NUMBER[2]];
				
				// act
				var result = persistency.Addin.createConfigurationHeader(oAddin.ADDIN_GUID[2], aAddinVersions);

				// assert
				var oExpectedData = {
					ADDIN_GUID: 				oAddin.ADDIN_GUID[2],
					ADDIN_MAJOR_VERSION: 		aAddinVersions[0],
					ADDIN_MINOR_VERSION: 		aAddinVersions[1],
					ADDIN_REVISION_NUMBER: 		aAddinVersions[2],
					ADDIN_BUILD_NUMBER: 		aAddinVersions[3],
					CREATED_BY: 		$.session.getUsername(),
					LAST_MODIFIED_BY:	$.session.getUsername()
				};
				
				var oResultWithoutDates = _.omit(_.clone(result), ['CREATED_ON', 'LAST_MODIFIED_ON']);
				expect(JSON.parse(JSON.stringify(oResultWithoutDates))).toEqualObject(JSON.parse(JSON.stringify(oExpectedData)));
				
				jasmine.log(JSON.stringify(oResultWithoutDates));
				jasmine.log(JSON.stringify(oExpectedData));

				//Check that data for addin configuration have been created in db
				var sWhere = [" where addin_guid=" + oAddin.ADDIN_GUID[2],
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[2],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[2],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[2],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[2]
				].join(" ");
				var oResultConfigHeader = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{configuration_header}}" + sWhere));
				expect(oResultConfigHeader.LAST_MODIFIED_ON[0]).toBeGreaterThan(oAddin.LAST_MODIFIED_ON[2]);
			});

		});

		describe('updateConfigurationHeader', function() {
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
			});

			it('should update addin configuration header', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];

				// act
				var result = persistency.Addin.updateConfigurationHeader(oAddin.ADDIN_GUID[1], aAddinVersions);

				// assert
				var oExpectedData ={
					LAST_MODIFIED_BY : $.session.getUsername()
				};
				
				var oResultWithoutModifiedDate = _.omit(_.clone(result), ['LAST_MODIFIED_ON']);
				expect(JSON.parse(JSON.stringify(oResultWithoutModifiedDate))).toEqualObject(JSON.parse(JSON.stringify(oExpectedData)));
				
				jasmine.log(JSON.stringify(oResultWithoutModifiedDate));
				jasmine.log(JSON.stringify(oExpectedData));

				//Check that data for addin configuration have been updated in db
				var sWhere = [" where addin_guid=" + oAddin.ADDIN_GUID[1],
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[1]
				].join(" ");
				var oResultConfigHeader = mockstar_helpers.convertResultToArray(oMockstar.execQuery("select * from {{configuration_header}}" + sWhere));
				expect(oResultConfigHeader.LAST_MODIFIED_ON[0]).toBeGreaterThan(oAddin.LAST_MODIFIED_ON[1]);
			});

		});

		describe('updateConfigurationItems', function() {
			beforeEach(function() {
				oMockstar.clearAllTables(); // clear all specified substitute tables and views
				oMockstar.initializeData();
			});

			it('should update addin configuration items with new set of items', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];
				var aConfigData = [
				                   {CONFIG_KEY : 'NewKey_1', CONFIG_VALUE : 'NewValue_1'},
				                   {CONFIG_KEY : 'NewKey_2', CONFIG_VALUE : 'NewValue_2'}
				                   ];

				// act
				var result = persistency.Addin.updateConfigurationItems(aConfigData, oAddin.ADDIN_GUID[1], aAddinVersions);

				// assert
				jasmine.log(JSON.stringify(result));
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(aConfigData, [ "CONFIG_KEY" ]);

				//Check that data for addin configuration have been updated in db
				var sWhere = [" where addin_guid=" + oAddin.ADDIN_GUID[1],
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[1]
				].join(" ");

				result = oMockstar.execQuery("select CONFIG_KEY, CONFIG_VALUE from {{configuration_items}}" + sWhere);
				var expectedResultJsonData = {
						"CONFIG_KEY" : [ aConfigData[0].CONFIG_KEY, aConfigData[1].CONFIG_KEY ],
						"CONFIG_VALUE" : [ aConfigData[0].CONFIG_VALUE, aConfigData[1].CONFIG_VALUE ]
				};
				expect(result).toMatchData(expectedResultJsonData, [ 'CONFIG_KEY' ]);
			});
			
			it('should update and therefore clear addin configuration items when list of items is empty', function() {
				// arrange
				var persistency = new Persistency(jasmine.dbConnection);
				var oAddin = testData.oAddinVersionTestData;
				var aAddinVersions = [oAddin.ADDIN_MAJOR_VERSION[1], oAddin.ADDIN_MINOR_VERSION[1], oAddin.ADDIN_REVISION_NUMBER[1], oAddin.ADDIN_BUILD_NUMBER[1]];
				var aConfigData = [];

				// act
				var result = persistency.Addin.updateConfigurationItems(aConfigData, oAddin.ADDIN_GUID[1], aAddinVersions);

				// assert
				jasmine.log(JSON.stringify(result));
				expect(JSON.parse(JSON.stringify(result))).toEqualObject(aConfigData, [ "CONFIG_KEY" ]);

				//Check that data for addin configuration have been updated in db
				var sWhere = [" where addin_guid=" + oAddin.ADDIN_GUID[1],
				              "and addin_major_version = " + 	oAddin.ADDIN_MAJOR_VERSION[1],
				              "and addin_minor_version = " + 	oAddin.ADDIN_MINOR_VERSION[1],
				              "and addin_revision_number = " + oAddin.ADDIN_REVISION_NUMBER[1],
				              "and addin_build_number = " + 	oAddin.ADDIN_BUILD_NUMBER[1]
				].join(" ");

				result = oMockstar.execQuery("select CONFIG_KEY, CONFIG_VALUE from {{configuration_items}}" + sWhere);
				var expectedResultJsonData = {
				};
				expect(result).toMatchData(expectedResultJsonData, [ 'CONFIG_KEY' ]);
			});
		});
		
	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}