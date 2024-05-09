const _ = require("lodash");
var oConnectionFactory = new (require("../../../../lib/xs/db/connection/connection")).ConnectionFactory($);
let dbArtefactControllerLibrary = require("../../../../lib/xs/db/generation/hdi-db-artefact-controller");
let DbArtefactController = dbArtefactControllerLibrary.DbArtefactController;
``

describe("sap.plc.db.connection", function() {
	
	var oDbArtefactController;
	var oControllerConnection;
	
	var bTableCreated;
	beforeOnce(function() {
		oControllerConnection = $.hdb.getConnection({ "treatDateAsUTC": true });
		oDbArtefactController = new DbArtefactController($, oControllerConnection);
		let aUpsertList = [
			{
				PATH: 'src/dynamic/db/commit_test.hdbtable',
				CONTENT: `column table "sap.plc.db::commit_test" (id int)`
			}
		];
		oDbArtefactController.hdiUpsertFiles(aUpsertList);
		bTableCreated = true;
		if (oConnectionFactory.realGetConnection !== undefined) {
			// replace the injected faked getConnection by the real getConnection 
			oConnectionFactory.getConnection = oConnectionFactory.realGetConnection; 
		}
	});
	
	afterOnce(function() {
		if (bTableCreated) {
			// only drop table if it has been successfully created in beforeOnce()
			oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/commit_test.hdbtable']);
		}
		if (oControllerConnection && _.isFunction(oControllerConnection.close)) {
			oControllerConnection.close();
		}
	});
	
	beforeEach(function() {
		if (bTableCreated) {
			jasmine.dbConnection.executeUpdate("truncate table \"sap.plc.db::commit_test\"");
			jasmine.dbConnection.commit(); // otherwise change is not visible to other transaction/connection
		}
	});
	
	it("getConnection should return Connection object and execute commit() if bCommitMode===true", function() {
		// arrange
		oConnectionFactory.bCommitMode = true;
		
		// act
		// get a connection, insert a row in a table and then commit the change
		var connection = oConnectionFactory.getConnection();
		connection.executeUpdate('insert into \"sap.plc.db::commit_test\" values (1)');
		connection.commit();
		connection.close();
		
		// assert
		// the row should really be in the database
		var result = jasmine.dbConnection.executeQuery("select id from \"sap.plc.db::commit_test\"")
		expect(result.length).toBe(1);
	});
	
	it("getConnection should return Connection object and not execute commit() if bCommitMode===false", function() {
		// arrange
		oConnectionFactory.bCommitMode = false;
		
		// act
		// get a connection, insert a row in a table and then commit the change
		var connection = oConnectionFactory.getConnection();
		connection.executeUpdate('insert into \"sap.plc.db::commit_test\" values (1)');
		connection.commit();
		connection.close();
		
		// assert
		// the row should not be in the database, because commit was not really executed
		var result = jasmine.dbConnection.executeQuery("select id from \"sap.plc.db::commit_test\"")
		expect(result.length).toBe(0);
	});	
}).addTags(["Analytics_Calcengine_Manag_Conn_Persistency_Integration"]);
