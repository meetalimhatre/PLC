if(jasmine.plcTestRunParameters.mode === 'all'){

	describe('xsjs.db.persistency-calculationVersion-tests', function() {
		var persistencyLibrary =  require("../../../lib/xs/db/persistency-calculationVersion");
		var authorizationManager = require("../../../lib/xs/authorization/authorization-manager");
		const constants = require("../../../lib/xs/util/constants");
		
		describe("setVersionLock", function() {		

            var oPersistency;

			beforeEach(function() {
				
                var oHQueryMock = jasmine.createSpyObj("oHQueryMock", [ "statement" ]);
			    oHQueryMock.statement.and.callFake(function() {				    
					    return {
						    execute : function() {
							    return [];
						    }
					    };				    
			    }); 

				oPersistency = new persistencyLibrary.CalculationVersion($, jasmine.dbConnection, oHQueryMock, $.session.getUsername());
                spyOn(oPersistency, 'isOpenedInSessionAndContext').and.returnValue(false);
                spyOn(oPersistency, 'isFrozen').and.returnValue(false);
                spyOn(oPersistency, 'isLifecycleVersion').and.returnValue(false);
				
			});

			it("should return the current user if the version was locked for him", function() {
				//arrange	
				spyOn(oPersistency, 'getLockingUser').and.returnValue(null);
				spyOn(authorizationManager, 'getUserPrivilege').and.returnValue(authorizationManager.Privileges.CREATE_EDIT);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe($.session.getUsername());
			});	
			
			it("should return the locking user if the version was locked by somebody else", function() {
				//arrange	
				var sOtherUser = 'Rolf';
				spyOn(oPersistency, 'getLockingUser').and.returnValue(sOtherUser);
				spyOn(authorizationManager, 'getUserPrivilege').and.returnValue(authorizationManager.Privileges.CREATE_EDIT);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe(sOtherUser);
			});
			
			it("should return the locking user if the version is already opened by the current user and was locked by somebody else", function() {
				//arrange	
				var sOtherUser = 'Rolf';
				spyOn(oPersistency, 'getLockingUser').and.returnValue(sOtherUser);
				oPersistency.isOpenedInSessionAndContext.and.returnValue(true);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe(sOtherUser);
			});	
			
			it("should return the current user if the version is already opened by the current user and was locked by himself in the same context", function() {
				//arrange	
				spyOn(oPersistency, 'getLockingUser').and.returnValue($.session.getUsername());
				oPersistency.isOpenedInSessionAndContext.and.returnValue(true);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe($.session.getUsername());
			});

			it("should return the current user if the version is already opened by the current user and was locked by himself in a different context in write-mode", function() {
				//arrange	
				spyOn(oPersistency, 'getLockingUser').and.returnValue($.session.getUsername());
				spyOn(oPersistency, 'getLockingContext').and.returnValue(constants.CalculationVersionLockContext.VARIANT_MATRIX);
				oPersistency.isOpenedInSessionAndContext.and.returnValue(true);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe($.session.getUsername());
				expect(sLock.LockingContext).toBe(constants.CalculationVersionLockContext.VARIANT_MATRIX);
				expect(sLock.LockMode).toBe("read");
			});	
			
			it("should return lockMode = read if the version is frozen", function() {
				//arrange	
				spyOn(oPersistency, 'getLockingUser').and.returnValue(null);
				spyOn(authorizationManager, 'getUserPrivilege').and.returnValue(authorizationManager.Privileges.CREATE_EDIT);
				oPersistency.isFrozen.and.returnValue(true);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.IsFrozen).toBe(true);
				expect(sLock.LockMode).toBe("read");
			});

			it("should return the current user if the lifecycle version was locked for him", function() {
				//arrange	
				spyOn(oPersistency, 'getLockingUser').and.returnValue(null);
				spyOn(authorizationManager, 'getUserPrivilege').and.returnValue(authorizationManager.Privileges.CREATE_EDIT);
				oPersistency.isLifecycleVersion.and.returnValue(true);
				//act
				var sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe($.session.getUsername());
				expect(sLock.LockMode).toBe("write");
				expect(sLock.LockingContext).toBe("calculation_version");
			});	

			it("should return the locking user if the lifecycle version is already opened by the current user and was locked by somebody else", function() {
				//arrange	
				let sOtherUser = 'Rolf';
				oPersistency.isLifecycleVersion.and.returnValue(true);
				spyOn(oPersistency, 'getLockingUser').and.returnValue(sOtherUser);
				oPersistency.isOpenedInSessionAndContext.and.returnValue(true);
				//act
				let sLock = oPersistency.setVersionLock(1,$.session.getUsername(),$.session.getUsername(),constants.CalculationVersionLockContext.CALCULATION_VERSION);

				//assert
				expect(sLock.LockingUser).toBe(sOtherUser);
				expect(sLock.LockMode).toBe("read");
			});	

		});
		
	}).addTags(["All_Unit_Tests"]);
}