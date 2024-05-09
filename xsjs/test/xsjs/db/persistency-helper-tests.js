var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var testData = require("../../testdata/testdata").data;

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

describe('xsjs.db.persistency-helper-integrationtests', function() {

	var mockstar = null;
	var persistency = null;

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
				regex: "sap.plc.db::basis.t_regex",
			}
		});
	});

	beforeEach(function() {
	});

	afterOnce(function() {
		mockstar.cleanup();
	});

	describe('get functions', function() {

		beforeEach(function() {
			mockstar.clearAllTables(); // clear all specified substitute tables
			mockstar.insertTableData("regex", testData.mCsvFiles.regex);
			persistency = new Persistency(jasmine.dbConnection);
		});

        it('getRegexValue should return a regex value for a regex id', function() {
			//act
			var sRetrievedObject = persistency.Helper.getRegexValue("LINK");

			// assert
            expect(sRetrievedObject).not.toBe(null);
            expect(sRetrievedObject).not.toBe(undefined);			
		});

		it('getRegexValue should return null if a regex value for a regex id is not found', function() {
			//act
			var sRetrievedObject = persistency.Helper.getRegexValue("TESTABC");

			// assert
			expect(sRetrievedObject).toBe(null);
        });
        
    });
    
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);