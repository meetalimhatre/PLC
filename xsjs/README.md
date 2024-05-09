# xsjs module

This package contains the code to define PLC's REST API and contains most of the business logic. The following contains a description how developers can work with in on the different platforms.

## XSA Development

### Install `xsjs` and `web` module

This only has to be done if you can freshly checked-out the code or changed dependencies in `package.json`. Note: This installation is independent from the the Maven build you executed earlier. This npm installation is needed to execute the the `xsjs` and `web` module locally. 

```
cd web
npm install
cd ..
cd xsjs
npm install
cd ..
```
### Creating `default-env.json` for...

In XSA and CF environment variables are provided to connect to services and other modules. These variables also need to be present if you want to locally develop. If a `default-env.json` is present in the module in local development (in production this file is ignored), the contents are use to set the environment variables for the local process.

> Note: If you deployed your application in the WebIDE then `xsac-plc-xsjs` and `xsac-plc-web` will have different names (e.g. they will have randomly generated letters and numbers in front of them, like `h9Y0PNsUOUuZzZSn-hana-xsjs` and `m4H2aL5yWWV4aEQP-hana-web`  )

#### ...the `xsjs` module
The `xsjs` module needs a connection to the database and the UAA in order to operate. During local development you will connect the remote HANA HDI container and the remote UAA on your development system. With `xs env` you can download and export the environment variables set for your deployed PLC modules. 

```
xs env xsac-plc-xsjs --export-json xsjs/default-env.json
```
Now open the default-env.json file and add the following after `VCAP_SERVICES`

```
"MTA_METADATA": {
	"description": "SAP Product Lifecycle Costing",
	"id": "com.sap.xsac.plc",
	"version": "4.1.0"
   },
```
**The version must be the same as your checked-out code!** This metadata is needed in order to retrieve the version, id and description of the application.

<span style="color:tomato"> If you restart the `xsjs` module from the WebIDE you **must** repeat the above steps (i.e. the ones starting from ...the `xsjs` module) else you will get an authentication error when trying to run the tests</span>

#### ...the `web` module
The `web` module needs to connect to the UAA in order to provide authentication and authorization. Download the setting for this module with:

```
xs env xsac-plc-web --export-json web/xsa/default-env.json
```

In local development, after a successful authentication you want to be forwarded to locally running process and not to one deployed on the system. For this reason, you need to replace the `destination` object with this content. Add also the additional `NODE_TLS_REJECT_UNAUTHORIZED`. 

```
"destinations": [{
	"name": "xsac-plc-xs-destination",
	"url": "http://localhost:3000",
	"forwardAuthToken": true
}, {
	"name": "xsac-plc-xsahaa-destination",
	"url": "http://localhost:3001",
	"forwardAuthToken": true
}],
"NODE_TLS_REJECT_UNAUTHORIZED": 0,
```

## Starting the modules

Now it's time to start the `web` and the `xsjs` module locally as separated (!) node processes. A running `web` module is required in order to do the authentication and the forwards to the locally running `xsjs` module.

> Note: [You can create multiple instances of the _integrated terminal_ in VS Code.](https://code.visualstudio.com/docs/editor/integrated-terminal)

Terminal 1:

```
cd web
npm start
```

Terminal 2:

```
cd xsjs
npm start
```

Now you can open a browser and access http://localhost:5000/sap/plc/xs/rest/dispatcher.xsjs/ping. You should be forwarded to an login page of the UAA and after authenticating see an error message that you don't have a session in PLC.


### Run Unit Tests (in `xsjs` Module)

Also the tests are executed locally. In order to connect to the necessary services (especially, the database), **make sure you have [set-up _default-env.json_](#the-xsjs-module).**

You can control which tests are executed by modifying `.tests`:

```
mode=all
generate=no
pattern=.*(tests|test)$
package=sap.plc_test
spec=
tags=
```
With `pattern` and `package` you can select the tests which are executed. 
With `spec` you can select a specific `describe` with all it's tests or specific `it` test.

For example to run only a specific `it` test from a specific `describe`
```
describe("xsjs.db.persistency-variant-integrationtests", () => { ...
    describe("getVariants", () => { ...
    describe("getVariantsInternal", () => { ...
        it("should return only the variants that exist for the given calculation version", () => { ...
```
In `.tests` the `spec` property should be defined by declaring the hierarchy to the test that needs to be executed.
In this example we have a first describe `xsjs.db.persistency-variant-integrationtests` that contains multiple describes.
Next we need to declare the parent `getVariantsInternal` describe of the `it` test to be executet.
Last we declare the `it` test we need to execute `should return only the variants that exist for the given calculation version`.

```
mode=all
generate=no
pattern=.*(tests|test)$
package=xsjs.db.persistency-variant-integrationtests
spec=xsjs.db.persistency-variant-integrationtests getVariantsInternal should return only the variants that exist for the given calculation version
tags=
```
If you want to execute all the tests in a specific `describe` only define in the `spec` the describe hierarchy.
In the example above if you would like to run all the `getVariantsInternal` tests `spec` should be defined as`spec=xsjs.db.persistency-variant-integrationtests getVariantsInternal`.

**Execute tests with: `npm test`**. After the test run is complete, the results can be found in `.testresults`.

## Clound Foundry Development

### How to run test cases in multi-tenant CF environment

Tests only can be run on CF environment after PLC application is deployed to CF and we run the post install service to create the DB artifacts. Our solution is to cf push the whole xsjs module using manifest.yml file after post install. In the manifest file it binds to the deployed DB instance and set the start as "node testrun.js". But It gets cf crash error when running node testrun.js in CF, the resolution is to modify the testframework and to make xsjs-test run on a server and keep the process live. 
Below is the guide for how to run tests in CF multi-tenancy environment

#### local configuration
 - Run npm install
    ```
    cd xsjs
    npm install
    ```
    node_modules folder will be created under xsjs module, when run cf push, it will be uploaded to CF environment.
 - Add manifest.yml file under xsjs module - `hana/xsjs/manifest.yml`
    ```
    applications:
    - name: cf_xsac_plc_test
      memory: 700M
      instances: 1
      OPTIMIZE_MEMORY: true,
      timeout: 600
      env:
        MTA_METADATA: '{ "description": "SAP Product Lifecycle Costing", "id": "plc-nj", "version": "4.1.0" }'
        TENANT_HOST_PATTERN: '^(.*)-plc-I076744.cfapps.sap.hana.ondemand.com'
      services:
      - xsac-plc-service-manager
      - xsac-plc-synonym-grantor-service
      - xsac-plc-postgres
    ```
    - memory: `memory should be no less than 700M`
    - env: The variables belong to the container environment.
    - TENANT_HOST_PATTERN: `Retrieve from the environment parameter by running "cf env <application-name>"`
    - MTA_METADATA: `Retrieve MTA_METADATA from the environment parameter by running "cf env <application-name>"`
    - services: Bind application to the already deployed Database serice instances, which is defined in the mta.yaml file. `Retrieve the service names from mta.yaml file`
    
- Configure .test file - `hana/xsjs/.test`
     ```
     mode=all
     generate=no
     pattern=.*(tests|test)$
     package=
     tags=
     tenantId="your own tenant id"
     ```
    - Add tenantId in .test file. tenantId is the guid of subscribed subaccount(tenant), i.e. "7636ca37-7c6f-4d7c-bf00-a62205be9abc", you can get it from CF cockpit: `Global Account` => `subaccount` =>`ID` in `Subaccount Details` section
- Configure package.json file - `hana/xsjs/package.json`
   ```
     "scripts": {
       "start": "node testrun.js",
     }
     ```
    Change value of `start` to "node testrun.js", when xsjs application is pushed to CF, it will execute "node testrun.js" to run tests
    
#### Push the App
Run the following command to deploy an app with a manifest:
```
cd xsjs
cf push
```
Scale the memory to run all cases:
```
cf scale cf_xsac_plc_phoebe_test -m 2048M
```
Execute below command to see the logs of running tests: 
```
cf logs cf_xsac_plc_test --recent
```
You will see the test results as below in the logs:
```
   2018-09-10T14:08:38.30+0800 [APP/PROC/WEB/0] OUT Summary:
   2018-09-10T14:08:38.30+0800 [APP/PROC/WEB/0] OUT Suites:  4 of 4
   2018-09-10T14:08:38.30+0800 [APP/PROC/WEB/0] OUT Specs:   30 of 30
   2018-09-10T14:08:38.30+0800 [APP/PROC/WEB/0] OUT Expects: 85 (0 failures)
   2018-09-10T14:08:38.30+0800 [APP/PROC/WEB/0] OUT Finished in 0.105 seconds
   2018-09-10T14:08:38.40+0800 [APP/PROC/WEB/0] OUT Exit status 0
   2018-09-10T14:08:38.40+0800 [CELL/SSHD/0] OUT Exit status 0
```
#### Get Test Report
Get app guid
```
cf app <your-app> --guid
0803cac6-ed75-4afd-b121-2e261ee411f7
```
Get ssh endpoint:
```
cf curl /v2/info | grep ssh_endpoint
ssh.cf.sap.hana.ondemand.com:2222
```
Get temporary password
```
cf ssh-code
v5X9cpoX8v
```
Download the report:
```
scp -r -P 2222 -o User=cf:<APP-GUID>/0 <ssh_endpoint>:/<report_path> ./<local_path>
```
After executing the command, you will be required to enter the password for the ssh in the above step. After password is authenticated, the report will be download to local environment.
example: scp -r -P 2222 -o User=cf:0803cac6-ed75-4afd-b121-2e261ee411f7/0 ssh.cf.sap.hana.ondemand.com:/home/vcap/app/cf_testresults/report.html ./report.html

### Other useful commands
- Export application VCAP_SERVICES and VCAP_APPLICATION onto the local machine.
Applications running on Cloud Foundry rely on the VCAP_SERVICES environment variable to provide service credentials. Application specific configuration environment is provided in VCAP_APPLICATION.
    ```
    cf install-plugin copyenv //install copyenv
    cf copyenv xsac-plc-xsjs > default-env.json
    ```
- sync local folder to CF app container
 cf syc is used to synchronize a local folder to a remote folder inside a Cloud Foundry app.
    ```
    cf install-plugin sync //install sync
    cd hana
    cf sync -s xsjs  <application-name>
    ```
    Any change locally will be reflected in CF environment, but cahnges will be reverted back after restart the application
### Links:
- CF CLI Plugins: https://plugins.cloudfoundry.org/
- https://docs.cloudfoundry.org/buildpacks/node/node-tips.html
- https://docs.cloudfoundry.org/buildpacks/node/node-service-bindings.html


## Debugging

Unfortunately, the debugging the either tests or the production code isn't optimal yet. It's currently impossible to set break point directly in the editor window of VS Code. In accordance to an JIRA Ticket (see also this GitHub Issue), this is caused by a node inspector bug, which might be solved in future Node versions.

If you want to debug for the first time, press F5 or select Debug -> Start Debugging in the menu. You are asked to select an environment. Select Node.js and ignore the error that no program can be found. Instead paste this below into the now open file launch.json:

    {		
        "version": "0.2.0",
        "configurations": [
            {
                "type": "node",
                "request": "launch",
                "name": "run xsjs",
                "program": "${workspaceFolder}/xsjs/main.js",
                "cwd": "${workspaceFolder}/xsjs"
            },
            {
                "type": "node",
                "request": "launch",
                "name": "run tests",
                "program": "${workspaceFolder}/xsjs/testrun.js",
                "cwd": "${workspaceFolder}/xsjs"
            }
        ]
    }

In order for the above configuration to work you must have the hana folder opened in your Visual Studio Code (File -> Open Folder -> Select the hana folder)

Note: This file can be checked in, if it makes your life easier. Currently artefacts in .vscode are ignored

To insert an breakpoint you can write debugger; in the code where the debugger should stop. For example:

    this.validate = function(oValdiatorInput, oServiceOutput) {
    	debugger;
    	if (!(oValdiatorInput instanceof ValidatorInput)) {
    		// ...
    	}
    	// ...
    }

If you now switch to the debug view (CRTL + SHIFT + D  or View -> Debug ), you can either select

- run tests to execute all tests configured in .tests.
- run xsjs to start the xsjs module. The debugger will stop at debugger; statements upon incoming requests.



