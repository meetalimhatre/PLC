/*jslint undef:true*/
var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;
var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;

if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('xsjs.db.persistencyApplicationManagement-integrationtests', function() {

		var mockstar = null;
		var sVendor = "sap.com";

		var sVersion = "1";
		var sVersionSP = "0";
		var sVersionPatch = "0";
		var sVersionString = "1.0.0";

		var persistency;

		beforeOnce(function() {
			mockstar = new MockstarFacade({
			substituteTables : // substitute all used tables in the procedure or view
			{
				initialization_state: {
							name: 'sap.plc.db::basis.t_initialization_state',
					data : {
						"PLC_VERSION": sVersionString,
								"GENERATION_TIME": '2016-02-04 00:00:00'
					}
				}
			}
		});
		});

		afterOnce(function() {
		});

		beforeEach(function() {
			sVendor = "sap.com";
			sVersion = "1";
			sVersionSP = "0";
			sVersionPatch = "0";

			mockstar.clearAllTables(); // clear all specified substitute tables and views
			persistency = new Persistency(jasmine.dbConnection);

		});

		it('getApplicationVersion should return the version number if it\'s defined in mtaMetadata', function () {
			// assemble
			var t_mtaMetadata = {
				"description": "PROD LIFECYCLE COST HANA V2$|0002358940",
				"id": "HCO_PLC",
				"version": "1.0.0"
			};
			// act
			var result = persistency.ApplicationManagement.getApplicationVersion(t_mtaMetadata);

			// assert
			expect(result).toBe(sVersion + "." + sVersionSP + "." + sVersionPatch);
		});

		it('getApplicationVersion should throw an exception if mtaMetadata is null', function () {
			// assemble
			var exception;
			var t_mtaMetadata = null;

			// act + assert
			try {
				persistency.ApplicationManagement.getApplicationVersion(t_mtaMetadata);
			} catch (e) {
				exception = e;
			}
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it('getApplicationVersion should throw an exception if mtaMetadata is undefined', function () {
			// assemble
			var exception;
			var t_mtaMetadata;

			// act + assert
			try {
				persistency.ApplicationManagement.getApplicationVersion(t_mtaMetadata);
			} catch (e) {
				exception = e;
			}
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it('getApplicationVersion should throw an exception if the version number is null in mtaMetadata', function () {
			// assemble
			var exception;
			var t_mtaMetadata = {
				"description": "PROD LIFECYCLE COST HANA V2$|0002358940",
				"id": "HCO_PLC",
				"version": null
			};

			// act
			try {
				persistency.ApplicationManagement.getApplicationVersion(t_mtaMetadata);
			} catch (e) {
				exception = e;
			}
			// assert
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

		it('getApplicationVersion should throw an exception if version of mtaMetadata is undefined', function () {
			// assemble
			var exception;
			var t_mtaMetadata = {
				"description": "PROD LIFECYCLE COST HANA V2$|0002358940",
				"id": "HCO_PLC",
			};

			// act + assert
			try {
				persistency.ApplicationManagement.getApplicationVersion(t_mtaMetadata);
			} catch (e) {
				exception = e;
			}
			expect(exception.code.code).toBe("GENERAL_UNEXPECTED_EXCEPTION");
		});

	it('isPlcInitialized should return true if PLC is initialized with the given version', function() {
		// arrange
		mockstar.initializeData();
		
		// act
		var result = persistency.ApplicationManagement.isPlcInitialized(sVersionString);
		
		// assert
		expect(result).toBe(true);
	});
	
	it('isPlcInitialized should return false if PLC is initialized with the wrong version', function() {
		// arrange
		mockstar.initializeData();
		
		// act
		var result = persistency.ApplicationManagement.isPlcInitialized('1.0.1'); // version does not match
		
		// assert
		expect(result).toBe(false);
	});

	it('isPlcInitialized should return false if PLC is not initialized', function() {
		// arrange
		
		// act
		var result = persistency.ApplicationManagement.isPlcInitialized(sVersionString);
		
		// assert
		expect(result).toBe(false);
	});
	
	it('writePlcInitializationState should remove existing rows and add new row to table', function() {
		// arrange
		mockstar.initializeData();
		var sNewVersion = '1.0.1';
		
		// act
		persistency.ApplicationManagement.writePlcInitializationState(sNewVersion);
		
		// assert
		var result = mockstar.execQuery('select plc_version, generation_time from {{initialization_state}}');
		expect(result.getRowCount()).toBe(1);
		expect(result.columns.PLC_VERSION.rows[0]).toEqual(sNewVersion);
	});
	
	}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
}