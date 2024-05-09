# PLC Back-end Repository	

This repository contains the business logic of _SAP Product Lifecycle Costing_ (PLC), except the _Calculation Engine_, which is realized as AFL and [kept in its own repository](https://github.wdf.sap.corp/plc/afl).

PLC has two deployment options:

1. XSA (on-premise - see [here](https://github.wdf.sap.corp/xs2/xsa-docs/wiki) for details)
2. Cloud Foundry (cloud - [Cloud Foundry Developer Guide](https://docs.cloudfoundry.org/devguide/))

Depending on the option, different steps for development, building and deployment need to be done. The following guide describes these steps for each platform separately.

## Prerequisites 

We assume that all the installed tools are added to your `PATH` environment variable. If you don't want to do this, please add the absolute path to the binaries before you execute a tool.

- [Maven](https://maven.apache.org/download.cgi) ([Installation guide](https://github.com/apache/maven/blob/master/apache-maven/README.txt#L39))

  - Copy [`settings.xml`](https://int.repositories.cloud.sap/artifactory/build-releases/settings.xml) from internal Nexus to `%USERPROFILE%\.m2`  (create `.m2` if it does not exists)

- [Node.js **version 6.14.3**](https://nodejs.org/en/download/releases/)

  - Setup NPM to use internal registry:

    ```
    npm config set registry https://int.repositories.cloud.sap/artifactory/api/npm/build-releases-npm/
    ```
    For more information related to repositories (and consumption URLs) from Artifactory, please see ([Consumption-URLs](https://github.wdf.sap.corp/pages/Nexus/nexus/sunset/Consumption-URLs/))  

  > Note: It's mandatory to use `build-releases-npm` in order to ensure that our build is based on releasable software components. 

- [Visual Studio Code](https://code.visualstudio.com/)	

## Check-out and Build

```
git clone git@github.wdf.sap.corp:plc/hana.git
cd hana
mvn
```

> Note: After calling `mvn` you may have changes in a couple of files as result of the build process. You can ignore them and revert them via `git reset --hard HEAD ` (Make sure you haven't any other changes you want to preserve!).

> Hint: The Maven build might fail, because the directory `%APPDATA%\npm-cache` is read-only. If the build fails, make sure that isn't the case.

## Install AFL (Calculation Engine)

Before you deploy the application, you the current version the PLC ALF need to be installed on the targeted system.

**For our XSA-based development systems**, you can use the following Jenkins Job to do so: https://jxy.mo.sap.corp/view/Dxy/job/AFL_To_Dxy/build?delay=0sec.

**For Cloud Foundry**, the HaaS team is responsible for installing the AFL (this will hopefully change in future). Create a ticket for component TDB!!! to request the installation.

## Deploy on XSA

The _XSA command line tools_ are used to deploy the application. You can download them from here: https://wiki.wdf.sap.corp/wiki/display/xs2/XSA+Downloads

### XS Login

```
xs login -a https://<host>:30030 [--skip-ssl-validation]
```

You will be prompted for username and password. If you have multiple spaces on your system, you will be also asked for the space you want use. 

### Create UAA Service

Create a UAA service instance, which takes care of the authentication and authorization management. The service instance is called `xsac-plc-uaa-service` in the `devuser` plan.

If you deploy the application for the first time you need to create the service:

```
xs create-service xsuaa devuser xsac-plc-uaa-service -c xs-security.json
```

If the service is already created and `xs-security.json` has changed, use:

```
xs update-service xsac-plc-uaa-service -c xs-security-xsa.json
```

### Create Synonym Grantor Service
The `xsac-plc-synonym-grantor-service` is used to access the native HANA database beneath the HDI container. That's needed for some of PLC's database artefacts. Create it by the following command: 

```
xs cups xsac-plc-synonym-grantor-service -p "{\"host\":\"<your-host>.mo.sap.corp\",\"port\":\"30015\",\"user\":\"SYSTEM\",\"password\":\"Hana1234\", \"tags\":[\"hana\"]}"
```
> Note: Powershell escapes strings differently. If you use it, you need to escape the double quotes with ``"`.

**Change `host` in accordance to your HANA host.** `port` must only be changed if the underlying HANA is running with a different instance number (schema: `3<instancenumber>15 `). `user` and `password` must be changed if other credentials are provided during the installation of HANA XSA.

### XSA Deployment

```
xs deploy .\build\assembly-xsa\target\xsac-plc-assembly-xsa-4.1.2.mtar
```

### Assign Role Collection to Development users

Before you can execute the _Post-installation Tool_, you need to grant your user access to it. For the sake of simplicity, this guide will assign all available PLC roles to your user. After having the application deploy please do the following:

1. Use `xs` command line tool to find the global name of your deployed application (each time the application gets deployed, it gets a unique name; roles are bound to the name)

   ````
   xs env xsac-plc-xsjs | findstr xsappname
   ````

   Remember the value of the returned key-value pair (e.g. `xsac-plc!u4`)

2. Open _XS Advanced Administration_ UI (xsa-admin) as **Administrator** in your browser

   1. In _XS Advanced Administration_, open _Application Role Builder_
      1. In _Roll Collection_ tab, create a new _Role Collection_
      2. In _Application Role_ tab, find the application with the correct `xsappname`
      3. Assign all _Roles_ to the previously created _Role Collection_
   2. In _XS Advanced Administration_, open _User Management_ and assign created _Role Collection_ to your user

3. Logout _XS Advanced Administration_ UI

### Run _Post-installation Tool_

After you deployed PLC on a new HDI container (or an new version has been released), the application must be initialized using the _Post-installation Tool_.  

The _Post-installation Tool_ is web-based and in order to access it copy the URL from the `xsac-plc-web`  you have seen in the output of `xs apps` above and add `/postinstall`: `https://<host>:<port>/postinstall`. Paste the final path into your favorite browser.

> Hint: Adding the role collection to your user only has an effect after you re-login to the XAA. So, you see  and `403 Forbidden` when trying to access the _Post-installation Tool_ make sure you logged out completely, clear your cache and local storage or simply use a different browser.
>
> If you just recently changed the roles of your user wait ~10 minutes. It takes some time until your the roles are propagated correctly and your user is allowed to execute the _Post-installation Tool_. 
>
> If the problem persists, please try to execute the _Post-installation Tool_ directly (without UI): 
> `https://<your-host>:<your-application-port>/sap/plc/xs/postinstall/rest/run.xsjs?scenario=cli&mode=freshInstallation&optional=[]`
> Check progress with: `https://<your-host>:<your-application-port>/sap/plc/xs/postinstall/rest/run.xsjs?info=task&id=<your-task-id>`

## Deploy on Cloud Foundry

The _CF command line interface (CLI)_ is used to deploy in this description. On [docs.cloudfoundry.org](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) you can download the tool. Additionally, the _MultiApps CF CLI Plugin_ is needed, which adds support to deploy the MTA package: https://github.com/cloudfoundry-incubator/multiapps-cli-plugin.

### CF Login

```
cf login -a <api-endpoint-of-landscape>
```

Depending on the landscape (region) of the sub-account to be used, different API endpoints need to be used:

* Canary: https://api.cf.sap.hana.ondemand.com
* EU10: TBD
* US10: TBD

You're prompted for `USER_ID`, which might be user D-/I-/C-User and `PASSWORD`, which might be your _Global password_.  

### Create Synonym Grantor Service

The `xsac-plc-synonym-grantor-service` is used to access the native HANA database beneath the HDI container. During the deployment on CF only a placeholder service is needed, to bind the service to `xsac-plc-db`. During tenant onboarding this placeholder service is replaced one containing the credentials of the used HaaS instance.

```
cf cups xsac-plc-synonym-grantor-service -p "{\"user\":\"SYSTEM\",\"password\":\"Sap12345\", \"tags\":[\"hana\"]}"  
```

### CF Deployment

Depending on the targeted landscape, an appropriate [MTA Extension Descriptor](https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/50df803465324d36851c79fd07e8972c.html) needs to be chosen. These override landscape-specific settings, like ``TENANT_HOST_PATTERN` or used service plans. In the repository, 2 example descriptors are available:

- [xsac-plc-canary.mtaext](/build/assembly-cf/xsac-plc-canary.mtaext)
- [xsac-plc-production.mtaext](build/assembly-cf/xsac-plc-production.mtaext)

**Both files contain placeholders that need to be replaced before used.** We recommend to copy the file before making the adaptions because the copies are not under version control.

The deployment is initiated with this command and takes ~5-10 minutes:

```
cf deploy .\build\assembly-xsa\target\xsac-plc-assembly-cf-4.1.2.mtar -e xsac-plc-{canary, production, ...}.mtaext
```

### Create a job for license metering service

jobschduler provide REST API to call license metering service to create a daily job.
Before creating a job, grant job scheduler instance with scope JOBSCHEDULER.

1. Use `cf` command line tool to find the xsappname in uaa at jobscheduler service

   ```
   cf env xsac-plc-xsjs
   ```

   Remember the value of the returned key-value pair (e.g. `0e1cde77-a23f-49f7-bcd5-485713853aab!b8277|sap-jobscheduler!b3`)

2. update xs-security-cf-app.json

   ```
   {
        "name": "$XSAPPNAME.JOBSCHEDULER",
        "description": "Scope for Job Scheduler",
        "grant-as-authority-to-apps": [
            "replace-with-xsappname-of-jobscheduler-from-env-of-application"  //e.g.`0e1cde77-a23f-49f7-bcd5-485713853aab!b8277|sap-jobscheduler!b3`
        ]
    }
    ```

3. Use `cf` command line tool to update xsuaa

   ```
   cf update-service xsac-plc-uaa-service -c xs-security-cf-app.json
   ```

   After update done, unbind and bind jobscheduler instance to xsac-plc-xsjs.

4. Create job using postman
   #### Acquire token to create job

    Only authorized users are able to call REST API to create Job. A JWT needs to be acquired using the [OAuth client-credential-flow](https://wiki.wdf.sap.corp/wiki/display/xs2/Service+Authentication+with+OAuth).

    ```http
    POST /oauth/token HTTP/1.1
    Host: <auth-url>
    Content-Type: application/x-www-form-urlencoded
    grant_type=client_credentials
    token_format=jwt
    client_id=<client-id>
    client_secret=<client-secret>
    ```

    Resolve placeholders by `cf env xsac-plc-xsjs`:

    * `<auth-url>` =  `VCAP_SERVICES.jobscheduler.credentials.uaa.url`; e.g. `https://plc-test-eu10.authentication.eu10.hana.ondemand.com`
    * `<client-id>` = `VCAP_SERVICES.jobscheduler.credentials.uaa.clientid`; e.g. `sb-0e1cde77-a23f-49f7-bcd5-485713853aab!b8277|sap-jobscheduler!b3`
    * `<client-secret>` = `VCAP_SERVICES.jobscheduler.credentials.uaa.clientsecret`; e.g. `ifj43ClvZ1XjjITdy+wAg+0XeDU=`

    Copy value of `access_token` from response body. This is your JWT.

   #### Create job

    After the JWT was acquired, a second request need to be made in order to create job.

    ```http
    POST /scheduler/jobs HTTP/1.1
    Host: <jobscheduler-url>/scheduler/jobs
    Content-Type: application/json
    Authorization: Bearer <copied-JWT>
    {
      "name": "plc_license_metering",
      "action": "https://<app-url>/xs/ops/license-metering-cf.xsjs",
      "active": true,
      "description": "cron job that call license metering",
      "httpMethod": "GET",
      "schedules": [
          {
              "active": true,
              "description": "this schedule runs every day",
              "cron": "* * * * 23 0 0"
          }
      ]
    }
    ```

    Resolve placeholders by `cf env xsac-plc-xsjs`:

    * `<jobscheduler-url>` = `VCAP_SERVICES.jobscheduler.url`; e.g. https://jobscheduler-rest.cfapps.eu10.hana.ondemand.com
    * `<copied-JWT>`: JWT copied from the previous HTTP response; e.g. _eyXXXX..._
    * `<app-url>` = `VCAP_APPLICATION.application_uris[0]`; e.g. https://plc-test-eu10-test-xsac-plc-xsjs.cfapps.eu10.hana.ondemand.com

    If the response is 201, it has create a job successfully.

### Create a `saas-registry` service instance

To enable tenants to subscribe to the deployed PLC application, it's necessary to create a `saas-registry` service instance and bind it to `xsac-plc-web`. Details about the SaaS registration can be found here:https://wiki.wdf.sap.corp/wiki/display/CPC15N/SaaS+Application+Registration+in+CF.

```
cf create-service saas-registry application xsac-plc-saas-registry -c saas-registry-config.json
```

The `saas-registry-config.json` need to have this structure:

```json
{
  "appId": "<app-id>",
  "appName": "<xsappname>-<region>",
  "appUrls": {
    "getDependencies": "https://<route-to-web>/callback/v1.0/dependencies",
    "onSubscription": "https://<route-to-web>/callback/v1.0/tenants/{tenantId}"
  },
  "providerTenantId": "<paas-account-id>"
}
```

Placeholders resolve:

* `<app-id>`:  Application name with tenant index as suffix.
  *  `cf env xsac-plc-web | findstr xsappname`, e.g. _xsac-plc!t1248_
* `<xsappname>-<region>`: Used _XSAPPNAME_ without tenant suffix and the region of the PaaS account where PLC is deployed; needed to relate subscriptions to the deployed application if PLC is deployed in multiple data centers
  * Cut off `!t<number>` from `<app-id>`  and the region of PaaS account, e.g. _xsac-plc-eu10_ or _xsac-plc-us10_ ( _xsac-plc-canary_ for development)
  * **Note: The value of `<appName>` also influences the name of the tile in the sub-account subscriptions.**
* `<route-to-web>`: Route defined to `xsac-plc-web` service
  * `cf env xsac-plc-web | findstr USER_ROUTE`; e.g. _https://plc-d053727.cfapps.sap.hana.ondemand.com_
* `<paas-account-id>`: Id of the PaaS account, providing PLC (in other words, the CF account used to deploy the application)
  * Can be found in CF Cockpit under _Subaccount Details_: e.g. _f34d49f7-0869-4bd6-b496-08442fcdd0df_

**After the service is created, it needs to be bound to the `xsac-plc-web` and `xsac-plc-mt`:**

```
cf bind-service xsac-plc-web xsac-plc-saas-registry
cf bind-service xsac-plc-mt xsac-plc-saas-registry
```

### Tenant on-boarding

After the `saas-registry` service instance is created, tenants can subscribe to the deployed application. For this a new _Subaccount_ is needed, which must be entitled to make subscriptions to PLC. If this is the case a subscription can be made using the CF Cockpit: _Global Account_ > _Subaccount_ > _Subscriptions_.

> Note: If the subscription does not succeed, `cf logs xsac-plc-web --recent` and `cf logs xsac-plc-mt --recent` can be used for troubleshooting.

After successful subscription an email is sent to the address configured in the used [MTA extenstion file](#cf-deployment), informing about the new tenant. The next steps are usually performed by an operator, but during development/testing also done by others.

#### Create HaaS with PLC ALF

TBD

#### Acquire JWT to perform provisioning

Only authorized users are able to perform the tenant provisioning. A JWT needs to be acquired using the [OAuth client-credential-flow](https://wiki.wdf.sap.corp/wiki/display/xs2/Service+Authentication+with+OAuth).

```http
POST /oauth/token HTTP/1.1
Host: <auth-url>
Content-Type: application/x-www-form-urlencoded
cache-control: no-cache
Postman-Token: 41e3d3ec-6fc3-413a-a9b6-6f91aba01dd4
grant_type=client_credentials
response_type=token
client_id=<client-id>
client_secret=<client-secret>
```

Resolve placeholders by `cf env xsac-plc-web`:

* `<auth-url>` =  `VCAP_SERVICES.xsuaa.credentials.url`; e.g. `https://plc.authentication.sap.hana.ondemand.com`
* `<client-id>` = `VCAP_SERVICES.xsuaa.credentials.clientid`; e.g. `sb-xsac-plc-d053727-2!t1248`
* `<client-secret>` = `VCAP_SERVICES.xsuaa.credentials.clientsecret`; e.g. `H7WiWLs8FJhxxxxxtopSecretxxxx`

Copy value of `access_token` from response body. This is your JWT.

#### Trigger tenant provisioning

After the JWT was acquired, a second request need to be made in order to trigger the provisioning logic of the `xsac-plc-mt` service.

```http
POST /sap/plc/mt/deploy HTTP/1.1
Host: <xsac-plc-web-url>/sap/plc/mt/deploy
Content-Type: application/json
cache-control: no-cache
Authorization: Bearer <copied-JWT>
{
	"subscribedTenantId": "<tenant-id>",
	"databaseId": "<database-id>",
	"password": "<password-of-system-user>",
	"destroyExistingContainer": "(true|false)",
	"replaceDatabaseId" : "(true|false)"
}
```

* `<xsac-plc-web-url>` : URL of `xsac-plc-web`  service; find out with`cf env xsac-plc-web | findstr USER_ROUTE`; e.g. _https://plc-d053727.cfapps.sap.hana.ondemand.com_
* `<copied-JWT>`: JWT copied from the previous HTTP response; e.g. _eyXXXX..._
* `<tenant-id>`:  UUID of the subscribed tenant
* `<database-id>`: Id of the created HaaS instance; if a subsequent tenant is onboarded, this id can be taken from subscription email
* `<password-of-system-user>`: Password of system user of the HaaS instance
* `destroyExistingContainer`: if set to `true` and the tenant already has a HDI container, the existing container gets destroyed and recreated; meant to re-do provisioning in case some went wrong before; **dangerous if used on productive tenants!**
* `replaceDatabaseId`: if set to `true` and the tenant already has a database id assigned, the id is replaced; meant to migrate a tenant to another database; **dangerous if used on productive tenants!**

After the provisioning is triggered `cf logs xsac-plc-mt [--recent]` can be used to observe the provisioning process. If this success message appears

```
Provisioning of tenant <tenant-id> was SUCCESSFULLY finished.
```

 the provisioning was successfully completed.

### Install PLC Client

TBD

## Development

The different modules of the application are developed with different tools and programming languages. Consequently, the description how to establish a development environment differs from module to module. Please see

* [xsjs/README.md](xsjs/README.md)  for XSJS/JavaScript development (main business logic)
* [mt/README.md](mt/README.md) for development 

## Using Postman

Postman has troubles following the redirections done by the `web` module, the _UAA_ and the _IDP_. Setting it up manually is error-prone and cumbersome.

In order to ease the use of Postman, d053892/postman-automated-uaa-authentication can be used (still work in progress).

## Swagger documentation
To be able to use the swagger documentation:
1. Copy the `doc` folder and all it's content from the root to `web/xsa/resources`.
2. In the `web` module inside the `xsa` folder change the file `"xs-app.json"`;
* Change all `authenticationType` to `"basic"`;
* Change all `csrfProtection` to `false`;
* Save.
3. Start the `web` & `xsjs` modules.
* If changes are made in the swagger documentation restart the `web` module to see the changes.

4. In a browser open the following link:
http://localhost:5000/sap/plc/doc/index.html


# Create a live connection in SAP Analytics Cloud
To get the connection running using a direct connection you need to specify the SAP Analytics Cloud origin in the CORS configuration of your Application Router.
## Changing CORS configuration
In order to change the CORS configuration, please follow the following steps:
1.Create a CORS definition file (text file) with the following content (the protocol and port of each entry is optional; the protocol for PLC 4.0+ is "https")
```
[
  {
    "uriPattern": "^/sap/bc/ina/(.*)$",
    "allowedOrigin": [
                       {"host":"<server 1>","protocol":"<protocol 1>","port":"port 1"},
                       ....,
                       {"host":"<server n>","protocol":"<protocol n>","port":"port n"},
                     ],
    "allowedMethods": ["GET", "POST", "HEAD", "OPTIONS", "PUT", "DELETE"],
    "allowedHeaders": ["Origin", "Accept", "X-Requested-With", "Content-Type", "Access-Control-Request-Method", "Access-Control-Request-Headers", "Authorization", "X-Sap-Cid", "X-Csrf-Token"],
    "exposeHeaders": ["Accept", "Authorization", "X-Requested-With", "X-Sap-Cid", "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials", "X-Csrf-Token", "Content-Type"]
  }
]
```
2.Apply the new configuration:
```
xs set-env xsac-plc-web CORS --from-file <CORS definition file name of step 1>
xs set-env xsac-plc-web COOKIES '{"SameSite": "None"}' //this is for making it work with Crome
```
3.Stage and restart the Application Router for the new configuration to take effect:
```
xs restage xsac-plc-web
xs restart xsac-plc-web
```
It is then prudent to check the new configuration with the "xs env" command present here above.
In case you do not want the Application Router to block any CORS HTTP request, the CORS configuration can be cleared with the following command:
```
xs unset-env xsac-plc-web CORS
```
You have then to restage and restart the Application Router before the new configuration takes effect (see step 3).
