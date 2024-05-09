var helpers = require("./mockstar_helpers");

if(jasmine.plcTestRunParameters.mode === 'all'){
describe("mockstar_helpers-tests", function() {
	describe("convertObjectWithArraysToArrayOfObjects", function() {
		it("should successfully convert object with 3 rows", function() {
			// Arrange
			var input = {
					col1: [1,2,3],
					col2: [4,5,6]
			};
			
			// Act
			var result = helpers.convertObjectWithArraysToArrayOfObjects(input);
			
			// Assert
			expect(result).toEqual([
    			{
    				col1: 1,
    				col2: 4
    			},
    			{
    				col1: 2,
    				col2: 5
    			},
    			{
    				col1: 3,
    				col2: 6
    			}
			]);
		});
		it("should successfully convert object with 1 row", function() {
			// Arrange
			var input = {
					col1: [1],
					col2: [4]
			};
			
			// Act
			var result = helpers.convertObjectWithArraysToArrayOfObjects(input);
			
			// Assert
			expect(result).toEqual([
    			{
    				col1: 1,
    				col2: 4
    			},
			]);
		});
	});
	
	describe("addRowToTableData", function() {
		it("should add a row to a table object with mulitple columns", function() {
			// Arrange
			var input1 = {
					col1: [1,2,3],
					col2: [4,5,6]
			};
			
			var input2 = {
					col1: 4,
					col2: 7
			};
			
			// Act
			var result = helpers.addRowToTableData(input1, input2);
			
			// Assert
			expect(result).toEqual({
					col1: [1,2,3,4],
					col2: [4,5,6,7]
    		});
		});
		it("should add multiple rows to a table object with mulitple columns", function() {
			// Arrange
			var input1 = {
					col1: [1,2,3],
					col2: [4,5,6]
			};
			
			var input2 = {
					col1: [4, 5],
					col2: [7, 8]
			};
			
			// Act
			var result = helpers.addRowToTableData(input1, input2);
			
			// Assert
			expect(result).toEqual({
					col1: [1,2,3,4,5],
					col2: [4,5,6,7,8]
    		});
		});
		it("should not change input objects", function() {
			// Arrange
			var input1 = {
					col1: [1,2,3],
					col2: [4,5,6]
			};
			
			var input2 = {
					col1: 4,
					col2: 7
			};
			
			// Act
			var result = helpers.addRowToTableData(input1, input2);
			
			// Assert
			expect(input1).toEqual({
					col1: [1,2,3],
					col2: [4,5,6]
    		});
			expect(input2).toEqual({
					col1: 4,
					col2: 7
			});
		});
	});	
}).addTags(["All_Unit_Tests"]);
}