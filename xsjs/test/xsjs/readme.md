How to run the ut locally
1. cd hanaxsa/xsjs
2. npm install
3. prepare your default-services.json
    3.1 add getServices.xsjs file to the folder xsjs/lib/ in your web IDE.
    3.2 start your xsjs application in web IDE.
    3.3 query out the content of this service and copy it into default-services.json
4. NODE_ENV=development node testrun.js
5. goto folder .../hanaxsa/xsjs/xsjs/testresults/*-report.html
6.open the html file with browser, there comes the report.


tips:
1. Wet your npm registry in SAP internal "http://nexus....:8081/nexus/content/groups/build.milestones.npm"
2. Pay attention of the json content in default-services.json. The key in json should be surrounded with quotation marks