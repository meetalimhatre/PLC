var MockstarFacade = require("../../testtools/mockstar_facade").MockstarFacade;
var _ = require("lodash");
var MessageLibrary = require("../../../lib/xs/util/message");
var PlcMessage = MessageLibrary.Message;
var Code = MessageLibrary.Code;
var PlcException = MessageLibrary.PlcException;

var testData = require("../../testdata/testdata").data;
var TestDataUtility = require("../../testtools/testDataUtility").TestDataUtility;
var authorizationManager = require("../../../lib/xs/authorization/authorization-manager");



describe('authorization-manager-integrationtests', function() {
	var mProjectTableNames = $.import("xs.db", "persistency-project").Tables;
	
	var oMockstar = null;
	var sCurrentUser = $.session.getUsername();
	
	var oProjectTestData = new TestDataUtility(testData.oProjectTestData).build();
	var oCalculationTestData = new TestDataUtility(testData.oCalculationTestData).
	    deleteProperty("PROJECT_ID").
	    addProperty("PROJECT_ID",[oProjectTestData.PROJECT_ID[0],oProjectTestData.PROJECT_ID[0],oProjectTestData.PROJECT_ID[1]]).
	    build();
	var oCalculationVersionTestData = new TestDataUtility(testData.oCalculationVersionTestData).build();

	beforeOnce(function() {

		oMockstar = new MockstarFacade( // Initialize Mockstar
				{
					substituteTables: // substitute all used tables in the procedure or view
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
					    },
					    version_temporary : {
			                		name : mProjectTableNames.calculation_version_temporary
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

	describe("checkPrivilege", function() {
	    
	    it("should throw an exception if the current user does not have the privilege for the given project", function(){
	    	//arrange	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var sPrivilege = authorizationManager.Privileges.READ;
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    		authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
	    	}catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeDefined();
	    	expect(e instanceof PlcException).toBeTruthy();
	    	expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
	       
	    });
	    
	    
	    it("should not throw an exception if the current user does have the privilege for the given project", function(){
	    	//arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.READ);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var sPrivilege = authorizationManager.Privileges.READ;
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    		authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
	    	}catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeUndefined();
	       
	    });
	    
	    it("should not throw an exception if the user has a higher privilege than requested", function(){
	        //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.CREATE_EDIT);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var sPrivilege = authorizationManager.Privileges.READ;
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    		authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
	    	}catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeUndefined();
	    });
	    
	    it("should throw an exception if the user has a lower privilege than requested", function(){
	        //arrange	
	        enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.CREATE_EDIT);
	        
            var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
            var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
            var sPrivilege = authorizationManager.Privileges.FULL_EDIT;
            var oConnection = jasmine.dbConnection;
            var e;
            
            //act
            try{
            	authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
            }catch(exception){
            	e = exception;
            }
            
            //assert
            expect(e).toBeDefined();
            expect(e instanceof PlcException).toBeTruthy();
            expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
	    });
	    
	    it("should throw an exception if an invalid Privilege is passed", function(){
	        //arrange	
	        enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.CREATE_EDIT);
	        
            var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
            var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
            var sPrivilege = "InvalidPrivilege";
            var oConnection = jasmine.dbConnection;
            var e;
            
            //act
            try{
            	authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
            }catch(exception){
            	e = exception;
            }
            
            //assert
            expect(e).toBeDefined();
            expect(e instanceof PlcException).toBeTruthy();
            expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_UNEXPECTED_EXCEPTION.code);
	    });
	    
	    it("should not throw an exception if the user has the privilege for the requested calculation", function(){
	    	//arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.READ);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Calculation;
	    	var sBusinessObjectId = oCalculationTestData.CALCULATION_ID[0];
	    	var sPrivilege = authorizationManager.Privileges.READ;
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    		authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
	    	}catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeUndefined();	       
	    });
	    
	    it("should not throw an exception if the user has the privilege for the requested calculation-version", function(){
            //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.READ);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.CalculationVersion;
	    	var sBusinessObjectId = oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
	    	var sPrivilege = authorizationManager.Privileges.READ;
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    		authorizationManager.checkPrivilege(sBusinessObjectType, sBusinessObjectId, sPrivilege, oConnection, sCurrentUser);
	    	}catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeUndefined();	
	    });
	}); 
	   
	describe("getUserPrivilege", function() {
	    
	    it("should return READ if the user has the READ privilege for the requested project", function(){
	        //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.READ);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	
	    	//act
	    	var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	    	
	    	//assert
	    	expect(result).toEqual(authorizationManager.Privileges.READ);
	    });
	    
	    it("should return CREATE_EDIT if the user has the CREATE_EDIT privilege for a given temporary calculation-version", function(){
	        //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.CREATE_EDIT);
	    	oMockstar.clearTable("version"); 
	    	oMockstar.insertTableData("version_temporary", testData.oCalculationVersionTemporaryTestData);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.CalculationVersion;
	    	var sBusinessObjectId = oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	
	    	//act
	    	var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	    	
	    	//assert
	    	expect(result).toEqual(authorizationManager.Privileges.CREATE_EDIT);
	    });
	    
	    it("should throw an exception if the user has no privilege for the requested project", function(){
	        //arrange
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Project;
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    	    authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	        }catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeDefined();
	    	expect(e instanceof PlcException).toBeTruthy();
	    	expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_ACCESS_DENIED.code);
	    });
	    
	    it("should throw an exception if an invalid businessobjecttype is passed", function(){
	       //arrange
	    	var sBusinessObjectType = "InvalidBusinessObjectType";
	    	var sBusinessObjectId = oProjectTestData.PROJECT_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	var e;
	    	
	    	//act
	    	try{
	    	    authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	        }catch(exception){
	    		e = exception;
	    	}
	       
	    	//assert
	    	expect(e).toBeDefined();
	    	expect(e instanceof PlcException).toBeTruthy();
	    	expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_UNEXPECTED_EXCEPTION.code);
	    });
	    
	    it("should return the ADMINISTRATE privilege if the user has the ADMINISTRATE privilege for a given calculation", function(){
	        //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.ADMINISTRATE);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.Calculation;
	    	var sBusinessObjectId = oCalculationTestData.CALCULATION_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	
	    	//act
	    	var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	    	
	    	//assert
	    	expect(result).toEqual(authorizationManager.Privileges.ADMINISTRATE);
	    });
	    
	    it("should return the FULL_EDIT privilege if the user has the FULL_EDIT privilege for a given calculation-version", function(){
	        //arrange
	    	enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.FULL_EDIT);
	    	
	    	var sBusinessObjectType = authorizationManager.BusinessObjectTypes.CalculationVersion;
	    	var sBusinessObjectId = oCalculationVersionTestData.CALCULATION_VERSION_ID[0];
	    	var oConnection = jasmine.dbConnection;
	    	
	    	//act
	    	var result = authorizationManager.getUserPrivilege(sBusinessObjectType, sBusinessObjectId, oConnection, sCurrentUser);
	    	
	    	//assert
	    	expect(result).toEqual(authorizationManager.Privileges.FULL_EDIT);
	    });
	    
	    it("should throw a GENERAL_ENTITY_NOT_FOUND_ERROR exception if invalid business object ids are passed", function(){
	        //arrange	
	        enterPrivilege(oProjectTestData.PROJECT_ID[0], authorizationManager.Privileges.CREATE_EDIT);
	        
	        var aBusinessObjectTypes = [ authorizationManager.BusinessObjectTypes.Project,
	                                     authorizationManager.BusinessObjectTypes.Calculation,
	                                     authorizationManager.BusinessObjectTypes.CalculationVersion ];
            var aBusinessObjectIds = [ "InvalidID", 12121, 21212 ];
            var oConnection = jasmine.dbConnection;
            
            _.each(aBusinessObjectTypes, function(sBusinessObjectType, iIndex) {
            	var e;
            	
            	//act
            	try{
            		authorizationManager.getUserPrivilege(sBusinessObjectType, aBusinessObjectIds[iIndex], oConnection, sCurrentUser);
            	}catch(exception){
            		e = exception;
            	}

            	//assert
            	expect(e).toBeDefined();
            	expect(e instanceof PlcException).toBeTruthy();
            	expect(PlcMessage.fromPlcException(e).code).toEqual(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code);
            });
	    });
	});
	
	
}).addTags(["Impl_Postinstall_Validator_NoCF_Integration"]);
