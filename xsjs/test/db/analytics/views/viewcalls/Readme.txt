This folder contains calls to analytic external views via MDS service.
This allows to run the views and see performance results without starting BI tools.

To use the calls, just run the call in SQL console.

The calls run the views the default input variables (calculation version =1 or project = #P4). 
To change this, set the prompt variable in the corresponding sections, e.g.:

"Name": "VAR_CALCULATION_VERSION",
...
	"Low": "<Calculation_Version_Id>",
	
The requests can be by logging a request with Fiddler (e.g. from Analysis for Office Request towards any HANA System).