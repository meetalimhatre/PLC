/*to run all tests, without generation of custom fields, use this URL
* http://<YOUR_HANA>....:8000/sap/plc_test/testtools/testrunner/testrunner.xsjs?package=testtools.testrunner&pattern=*-testexamples&mode=all&generate=no
*/

/*to run only custom field dependend tests, without generation of custom fields, use this URL
* http://<YOUR_HANA>....:8000/sap/plc_test/testtools/testrunner/testrunner.xsjs?package=testtools.testrunner&pattern=*-testexamples&mode=cf&generate=no
*/

/*to run all tests, with generation of custom fields, use this URL 
* http://<YOUR_HANA>....:8000/sap/plc_test/testtools/testrunner/testrunner.xsjs?package=testtools.testrunner&pattern=*-testexamples&mode=all&generate=yes
*/

/*to run only custom field dependend tests, with generation of custom fields, use this URL
* http://<YOUR_HANA>....:8000/sap/plc_test/testtools/testrunner/testrunner.xsjs?package=testtools.testrunner&pattern=*-testexamples&mode=cf&generate=yes
*/

/*
 * MK: internal URLs/information are not allowed
 */

xdescribe("parameterizedtests", function() {

	//This test is only run, if the plcTestRunParameters.mode is set to 'all'
    if(jasmine.plcTestRunParameters.mode === 'all'){
	    it("should only be run if no mode is set to 'all'", function() {
	    	expect(true).toBeTruthy();
	    });
    }

    //this test is run always.
    it("should also be run if mode is set to  'cf'", function() {
    	expect(true).toBeTruthy();
    	//This expectation is only done, if the plcTestRunParameters.generatedFields is set to true, i.e. if custom field have been generated before running the tests.
    	if(jasmine.plcTestRunParameters.generatedFields === true){
    		jasmine.log("Expect depending on one CF existing");
    		expect(jasmine.plcTestRunParameters.generatedFields).toBeTruthy();
    	}
    });

    //you can even run whole describe blocks conditionally
    if(jasmine.plcTestRunParameters.mode === 'all'){
    	xdescribe("decribe with condition", function() {
	    	it("should only be run if no mode is set to 'all'", function() {
		    	expect(true).toBeTruthy();
		    });
    	});
    }

  //This test tries to read data written by the testrunner before. Runs only if fields have been generated.
  if(jasmine.plcTestRunParameters.generatedFields === true){
      it("should only be run if no mode is set to 'all'", function() {
    	  var oExtensionColumns = jasmine.dbConnection.executeQuery("select count(COLUMN_NAME) as COUNT from sys.table_columns where schema_name=CURRENT_SCHEMA and table_name='sap.plc.db::basis.t_item_ext'");
    	  expect(oExtensionColumns[0].COUNT).not.toBeLessThan(3);
      });
  }

});
