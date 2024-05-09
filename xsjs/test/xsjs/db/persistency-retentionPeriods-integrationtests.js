var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var mockstar_helpers = require("../../testtools/mockstar_helpers");

var PersistencyImport = $.import("xs.db", "persistency");
var Persistency = PersistencyImport.Persistency;

describe('xsjs.db.persistency-retentionPeriods-integrationtests', function() {
	var mockstar = null;
	var persistency = null;

	const oPersonalDataValidity ={
		ENTITY:    ["CUSTOMER","VENDOR","CUSTOMER","CUSTOMER","PROJECT","PROJECT","VENDOR","PROJECT","VENDOR"],
		SUBJECT:   ["CU1"     ,"VD1"   ,"*"       ,"CU3"     , "*"     ,"PR1"    ,"*"     ,"PR3"    ,"VD4"   ],
		VALID_TO:  ["2029-01-14 08:00:00.0000000", "2029-05-14 08:00:00.0000000", null, "2020-01-14 08:00:00.0000000",null, "2019-05-14 08:00:00.0000000", null, "2029-05-14 08:00:00.0000000", "2019-05-14 08:00:00.0000000"],
		VALID_FOR: [null, null, 60, null, 48, null, 24, null, null]
	};

	beforeOnce(function() {
		mockstar = new MockstarFacade({
			substituteTables : {
                retention_periods: {
					name: "sap.plc.db::basis.t_personal_data_validity",
					data: oPersonalDataValidity
				}
			}
		});
	});

	afterOnce(function() {
		mockstar.cleanup();
	});

    if(jasmine.plcTestRunParameters.mode === 'all'){
		beforeEach(function() {
			mockstar.clearAllTables();
			mockstar.initializeData();
			persistency = new Persistency(jasmine.dbConnection);
		});

		it('should insert 1 retention periods from the input array', function() {
			// arrange
			let aRetentionPeriodsInsert = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "VDN",
                "VALID_TO": "2021-01-14 08:00:00.0000000"
			}];
			let iRetentionPeriodsCountBefore =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
		
			//act
			let result = persistency.RetentionPeriods.create(aRetentionPeriodsInsert);

			// assert
			//check that 2 new records were created
			let iRetentionPeriodsCountAfer =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
			expect(iRetentionPeriodsCountAfer).toEqual(iRetentionPeriodsCountBefore+1);					
		});	

		it('should insert more than 1 retention periods from the input array', function() {
			// arrange
			mockstar.clearTable("retention_periods");
			let aRetentionPeriodsInsert = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "*",
                "VALID_FOR": 20
			}, {
                "ENTITY": "USER",
				"SUBJECT": "USRN",
                "VALID_TO": "2021-01-14 08:00:00.0000000"
			},
			{
                "ENTITY": "CUSTOMER",
				"SUBJECT": "CUSTN",
                "VALID_TO": "2021-01-14 08:00:00.0000000"
			}];
			let iRetentionPeriodsCountBefore =  mockstar_helpers.getRowCount(mockstar, "retention_periods");

			//act
			let result = persistency.RetentionPeriods.create(aRetentionPeriodsInsert);

			// assert
			//check that 3 new records were created
			let iRetentionPeriodsCountAfer =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
			expect(iRetentionPeriodsCountAfer).toEqual(iRetentionPeriodsCountBefore+3);	
		});	

		it('should delete 1 retention period from the table', function() {
			// arrange
			let aRetentionPeriodsDelete = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "VD1"
			}];
			let iRetentionPeriodsCountBefore =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
		
			//act
			let result = persistency.RetentionPeriods.deletePeriods(aRetentionPeriodsDelete);

			// assert
			//check that 2 new records were created
			let iRetentionPeriodsCountAfer =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
			expect(iRetentionPeriodsCountAfer).toEqual(iRetentionPeriodsCountBefore-1);	
		});	

		it('should delete multiple retention periods from the table', function() {
			// arrange
			let aRetentionPeriodsDelete = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "VD1"
			},{
				"ENTITY": "PROJECT",
				"SUBJECT": "*"
			}];
			let iRetentionPeriodsCountBefore =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
		
			//act
			let result = persistency.RetentionPeriods.deletePeriods(aRetentionPeriodsDelete);

			// assert
			//check that 2 records were deleted
			let iRetentionPeriodsCountAfer =  mockstar_helpers.getRowCount(mockstar, "retention_periods");
			expect(iRetentionPeriodsCountAfer).toEqual(iRetentionPeriodsCountBefore-2);	
		});	

		it('should update 1 retention period in the table', function() {
			// arrange
			let aRetentionPeriodsUpdate = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "*",
				"VALID_TO": "2029-01-14 08:00:00.0000000"

			}];
					
			//act
			let result = persistency.RetentionPeriods.update(aRetentionPeriodsUpdate);

			// assert
			//check that the record wa updated
			let iRetentionPer = mockstar_helpers.getRowCount(mockstar, "retention_periods", "ENTITY = 'VENDOR' and SUBJECT = '*' and VALID_TO = '2029-01-14 08:00:00.0000000' and VALID_FOR is null");
			expect(iRetentionPer).toBe(1);
		});	

		it('should update the retention periods in the table', function() {
			// arrange
			let aRetentionPeriodsUpdate = [{
				"ENTITY": "VENDOR",
				"SUBJECT": "*",
				"VALID_TO": "2029-01-14 08:00:00.0000000"

			},
			{
				"ENTITY": "PROJECT",
				"SUBJECT": "PR3",
				"VALID_FOR": 22

			}];
					
			//act
			let result = persistency.RetentionPeriods.update(aRetentionPeriodsUpdate);

			// assert
			//check that 2 records were updated
			let iRetentionPerVendor = mockstar_helpers.getRowCount(mockstar, "retention_periods", "ENTITY = 'VENDOR' and SUBJECT = '*' and VALID_TO = '2029-01-14 08:00:00.0000000' and VALID_FOR is null");
			expect(iRetentionPerVendor).toBe(1);
			let iRetentionPerProject = mockstar_helpers.getRowCount(mockstar, "retention_periods", "ENTITY = 'PROJECT' and SUBJECT = 'PR3' and VALID_TO is null and VALID_FOR = 22");
			expect(iRetentionPerProject).toBe(1);
		});	
}	
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
