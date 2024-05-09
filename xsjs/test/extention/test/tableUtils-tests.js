if(jasmine.plcTestRunParameters.mode === 'all'){
	describe('extention.tableUtils-tests', function() {
		var toArray = require("lodash/toArray");
		var extendedTableUtil = require("../tableUtils").TableUtils;
		var fullTableName ='"sap.plc.db::basis.t_metadata"';
		var csvPackage = "extention.test.data";
		var csvFile = "testdata_sap_t_metadata.csv";
		var tableUtils;

		beforeEach(function() {
			tableUtils = new extendedTableUtil(jasmine.dbConnection);
			clearTable(fullTableName);
		});

		function clearTable(tableName){
			var selectString = "delete from " + tableName;
			jasmine.dbConnection.executeUpdate(selectString);
		}

		function selectAllFromTable(tableName) {
			var selectString = "select * from " + tableName;
			var resultSet = jasmine.dbConnection.executeQuery(selectString);
			return resultSet;
		}

		describe("fillFromCsvFile", function() {

			it("should upload csv file into an existing table if the csv file has header, or csv is commaSeparated, or csv has null parameters, or csv doesn't have empty lines", function() {
				var csvProperties = {
					separator : ",",
					headers : true,
					decSeparator : "."
				};
				 tableUtils.fillFromCsvFile(fullTableName, csvPackage, csvFile, csvProperties);
				 var resultSet = selectAllFromTable(fullTableName);
				 var iterator = resultSet.getIterator();
				 var firstRow = toArray(iterator)[0][0];
				 expect(firstRow["PATH"]).toBe('Item');
			});

			 it("should upload a csv file if it has no headers", function() {
				var exception;
				var csvPropertiesWithoutHeader = {
					separator : ",",
					headers : false,
					decSeparator : "."
				};
				//act
				tableUtils.fillFromCsvFile(fullTableName, csvPackage, "testdata_sap_t_metadata_NoHeader.csv", csvPropertiesWithoutHeader);
				var resultSet = selectAllFromTable(fullTableName);
				var iterator = resultSet.getIterator();
				var firstRow = toArray(iterator)[0][0];
				expect(firstRow["PATH"]).toBe('Item');
			});

			it("should upload a csv file if it has empty lines", function() {
				var exception;
				var csvPropertiesSkipEmptyLine = {
					separator : ",",
					headers : true,
					decSeparator : ".",
					skip_empty_lines: true
				};
				//act
				tableUtils.fillFromCsvFile(fullTableName, csvPackage, "testdata_sap_t_metadata_withEmptyLine.csv", csvPropertiesSkipEmptyLine);
				var resultSet = selectAllFromTable(fullTableName);
				var iterator = resultSet.getIterator();
				var firstRow = toArray(iterator)[0][0];
				expect(firstRow["PATH"]).toBe('Item');
			});

			it("should throw exception when csv file not find", function() {
				var exception;
				var csvProperties = {
					separator : ",",
					headers : true,
					decSeparator : ".",
					skip_empty_lines: true
				};
				//act
				try{
					tableUtils.fillFromCsvFile(fullTableName, csvPackage, "notfound.csv", csvProperties);
				} catch (e){
					exception = e;
				}
				expect(exception).toBeDefined();
			});

			it("should throw exception for wrong input data type in csv", function() {
				var exception;
				var csvProperties = {
					separator : ",",
					headers : true,
					decSeparator : ".",
					skip_empty_lines: true
				};
				//act
				try{
					tableUtils.fillFromCsvFile(fullTableName, csvPackage, "testdata_sap_t_metadata_wrongInput.csv", csvProperties);
				} catch (e){
					exception = e;
				}
				expect(exception).toBeDefined();
			});
		});
	}).addTags(["All_Unit_Tests"]);
}
