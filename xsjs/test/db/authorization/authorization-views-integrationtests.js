var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;

var testData = require("../../testdata/testdata").data;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;


describe('authorization_views-integrationtests', function() {
	$.import("xs.db", "persistency-administration"); // required forward declaration to break the import recursion cycle
	var mProjectTableNames = $.import("xs.db", "persistency-project").Tables;

	var oMockstar = null;
	var sCurrentUser = $.session.getUsername();
	
	var aViews = {
	        project_read        : '"sap.plc.db.authorization::privileges.v_project_read"',
			calculation_read    : '"sap.plc.db.authorization::privileges.v_calculation_read"',
			calculation_version_read    : '"sap.plc.db.authorization::privileges.v_calculation_version_read"'
	};
	
	var oProjectTestData = new TestDataUtility(testData.oProjectTestData).build();
	var oCalculationTestData = new TestDataUtility(testData.oCalculationTestData).
	    deleteProperty("PROJECT_ID").
	    addProperty("PROJECT_ID",[oProjectTestData.PROJECT_ID[0],oProjectTestData.PROJECT_ID[0],oProjectTestData.PROJECT_ID[1]]).
	    build();
	var oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).build();

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					substituteTables:                                            // substitute all used tables in the procedure or view
					{
						auth : {
							name: 'sap.plc.db::auth.t_auth_project'
						},
						project : {
									name : mProjectTableNames.project,
									data : oProjectTestData
						},
					    calculation : {
					                name : mProjectTableNames.calculation,
									data : oCalculationTestData
					    },
					    version : {
					                name : mProjectTableNames.calculation_version,
									data : oCalculationVersionTestData
					    }
					},
					csvPackage : testData.sCsvPackage				
				});
	});
	
	afterOnce(function(){				
		oMockstar.cleanup();
	});

	beforeEach(function() {
		oMockstar.clearAllTables(); // clear all specified substitute tables and views
		oMockstar.initializeData();
	});

    function enterPrivilege(sProjectId, sPrivilege){
        oMockstar.insertTableData("auth",{
           PROJECT_ID   : [sProjectId],
           USER_ID      : [sCurrentUser],
           PRIVILEGE    : [sPrivilege]
        });
    }

	describe("v_project_read", function() {
	    
	    it("should return an empty result if the current user has no privilege for any project", function(){
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(0);
	    });
	    
	    it("should return the project for which the current user has the READ privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows[0]).toEqual(oProjectTestData.PROJECT_ID[0]);
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(1);
	    });
	    
	    it("should return the project for which the current user has the CREATE_EDIT privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"CREATE_EDIT");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows[0]).toEqual(oProjectTestData.PROJECT_ID[0]);
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(1);
	    });
	    
	    it("should return the project for which the current user has the FULL_EDIT privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"FULL_EDIT");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows[0]).toEqual(oProjectTestData.PROJECT_ID[0]);
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(1);
	    });
	    
	    it("should return the project for which the current user has the ADMINISTRATE privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"ADMINISTRATE");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows[0]).toEqual(oProjectTestData.PROJECT_ID[0]);
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(1);
	    });
	    
	    it("should return two projects for which the current user has the READ privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       enterPrivilege(oProjectTestData.PROJECT_ID[1],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.project_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.PROJECT_ID.rows[0]).not.toEqual(oProjectTestData.PROJECT_ID[1]);
	       expect(result.columns.PROJECT_ID.rows.length).toEqual(2);
	    });
	});
	
	describe("v_calculation_read", function() {
	    
	    it("should return an empty calculation list if the current user has no privilege for any project", function(){
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(0);
	    });
	    
	    it("should return the calculations for which the current user has the READ privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows[0]).not.toEqual(oCalculationTestData.CALCULATION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculations for which the current user has the CREATE_EDIT privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"CREATE_EDIT");
	       
	      //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows[0]).not.toEqual(oCalculationTestData.CALCULATION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculations for which the current user has the FULL_EDIT privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"FULL_EDIT");
	       
	      //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows[0]).not.toEqual(oCalculationTestData.CALCULATION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculations for which the current user has the ADMINISTRATE privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"ADMINISTRATE");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows[0]).not.toEqual(oCalculationTestData.CALCULATION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return all calculations belonging to projects for which the current user has the READ privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       enterPrivilege(oProjectTestData.PROJECT_ID[1],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_ID.rows[0]).not.toEqual(oCalculationTestData.CALCULATION_ID[1]);
	       expect(result.columns.CALCULATION_ID.rows[1]).not.toEqual(oCalculationTestData.CALCULATION_ID[2]);
	       expect(result.columns.CALCULATION_ID.rows.length).toEqual(3);
	    });
	});
	
	describe("v_calculation_version_read", function() {
	    
	    it("should return an empty calculation-version list if the current user has no privilege for any project", function(){
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(0);
	    });
	    
	    it("should return the calculation-version for which the current user has the READ privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows[0]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculation-version for which the current user has the CREATE_EDIT privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"CREATE_EDIT");
	       
	      //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows[0]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculation-version for which the current user has the FULL_EDIT privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"FULL_EDIT");
	       
	      //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows[0]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return the calculation-version for which the current user has the ADMINISTRATE privilege for the parent project", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"ADMINISTRATE");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows[0]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[1]); //should be two different calculations
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(2); //there are two calculations in this project
	    });
	    
	    it("should return all calculation-version belonging to projects for which the current user has the READ privilege", function(){
	       //arrange
	       enterPrivilege(oProjectTestData.PROJECT_ID[0],"READ");
	       enterPrivilege(oProjectTestData.PROJECT_ID[1],"READ");
	       
	       //act
	       var result = oMockstar.execQuery("select * from "+aViews.calculation_version_read+ " where USER_ID = '"+sCurrentUser+"'");
	       
	       //assert
	       expect(result).toBeDefined();
	       expect(result.columns.CALCULATION_VERSION_ID.rows[0]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[1]);
	       expect(result.columns.CALCULATION_VERSION_ID.rows[1]).not.toEqual(oCalculationVersionTestData.CALCULATION_VERSION_ID[2]);
	       expect(result.columns.CALCULATION_VERSION_ID.rows.length).toEqual(3);
	    });
	});
	
	
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
