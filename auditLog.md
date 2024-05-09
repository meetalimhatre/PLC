# Audit Log Report for Project Crown Jewels

This section documents SAP Product Lifecycle Costing’s Audit Log behavior service for reporting purposes of project Crown Jewels.

## Name of Service and Service Number

Service Name: SAP Product Lifecycle Costing

Service Number: 365

Link to Service Inventory: https://jtrack.wdf.sap.corp/projects/SERVICE/issues/SERVICE-365?filter=allopenissues

## Scope

SAP Product Lifecycle Costing uses the Audit Log service (part of SAP Cloud Platform / Cloud Foundry backing services offerings). 

The implementation of audit logging was aimed towards product standard SEC-215 version 6.3. 

The following applications are bound to the audit log service:

mt - multi tenancy module that provides Tenant on-boarding, decommissioning, provisioning, multitenancy functionality (https://github.wdf.sap.corp/plc/hana-xsa/tree/development/mt)


xsjs - node js module that exposes rest services for PLC (https://github.wdf.sap.corp/plc/hana-xsa/tree/development/xsjs)

## Separation of Cloud Provider and customer logs

The log messages are written into SAP’s tenant (as per Audit Log service binding).

## Which events are logged at SAP Product Lifecycle Costing 365 service

mt:

    - security message on all calls to the api storing: identity zone, client id, subaccount id, client ip, http method, request uri (com.sap.plc.mt.util.audit.AuditLogAccessFilter#beforeRequest)
    - security message on authorization failure events storing: user name, client ip, http method, request uri, authrization failure event source (com.sap.plc.mt.util.audit.AuditLogFailedAuthorizationListener#onApplicationEvent)

xsjs (read/update):

	- Vendor (read vendor - logs vendor name, timestamp, data subject SAP, key PLC, role VendorRead; update vendor - logs vendor name, timestamp old and new value, data subject SAP, key PLC, role VendorEdit)
	- Customer (read customer - logs customer name, timestamp, data subject SAP, key PLC, role CustRead ; update customer - logs customer name, timestamp old and new value, data subject SAP, key PLC, role CustEdit)
	- Custom Fields and Formulas - impacts our database structure (update custom fields and formulas - logs generic message 'Custom fields and formula Locking', timestamp old and new value, data subject SAP, key PLC, role CFFCreateUpdt)
	- Transportation tool - impacts out database structure (read custom fields and formulas - logs generic message 'Transportation tool', timestamp, data subject SAP, key PLC, role TransImp)

## Event list

Configuration Change Event (SEC-215)
    Tenant on-boarding
    Tenant decommissioning
    Tenant provisioning
    Authorization failure 

## Security Monitoring

There are no security Monitoring relevant Events

## Manual test Audit Log
