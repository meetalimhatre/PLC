# PLC Hana RESTful Services
This is a API documentation of the RESTful web service provided by the PLC Hana backenend. The documentation is based on the [API Blueprint language](https://github.com/apiaryio/api-blueprint).

The PLC Web Service has currently the following resources:

+ [init-session](#init-session)
+ [logout](#logout)
+ [addins](#addins)
+ [projects](#projects)
+ [calculations](#calculations)
+ [calculation-versions](#calculation-versions)
+ [items](#items)
+ [customfieldsformula](#customfieldsformula)
+ [lock](#lock)
+ [plugin](#plugin)
+ [ping](#ping)
+ [default-settings](#default-settings)
+ [administration-account](#administration-account)
+ [administration-account-group](#administration-account-group)
+ [administration-activity-price](#administration-activity-price)
+ [administration-activity-type](#administration-activity-type)
+ [administration-business-area](#administration-business-area)
+ [administration-process](#administration-process)
+ [administration-company-code](#administration-company-code)
+ [administration-component-split](#administration-component-split)
+ [administration-confidence-level](#administration-confidence-level)
+ [administration-controlling-area](#administration-controlling-area)
+ [administration-controlling-version](#administration-controlling-version)
+ [administration-cost-center](#administration-cost-center)
+ [administration-costing-sheet](#administration-costing-sheet)
+ [administration-costing-sheet-row](#administration-costing-sheet-row)
+ [administration-currency](#administration-currency)
+ [administration-currency-conversion](#administration-currency-conversion)
+ [administration-customer](#administration-customer)
+ [administration-dimension](#administration-dimension)
+ [administration-document](#administration-document)
+ [administration-document-status](#administration-document-status)
+ [administration-document-type](#administration-document-type)
+ [administration-language](#administration-language)
+ [administration-material](#administration-material)
+ [administration-material-account](#administration-material-account)
+ [administration-material-group](#administration-material-group)
+ [administration-material-plant](#administration-material-plant)
+ [administration-material-price](#administration-material-price)
+ [administration-material-type](#administration-material-type)
+ [administration-overhead-group](#administration-overhead-group)
+ [administration-plant](#administration-plant)
+ [administration-price-source](#administration-price-source)
+ [administration-profit-center](#administration-profit-center)
+ [administration-unit-of-measure](#administration-unit-of-measure)
+ [administration-valuation-class](#administration-valuation-class)
+ [administration-vendor](#administration-vendor)
+ [plc-api-response-codes](#plc-api-response-codes)

#/sap/plc/xs/rest/dispatcher.xsjs/init-session/{?language}<a name="init-session"></a>

## Initialize [POST]
Initialize a server-side session. Client needs to specify the language which shall be used for this session and the server returns basic data. This call MUST be made before any other call by the client!

+ Parameters
	+ **language** *(required, string, 'DE')* ... Two digit language code in upper case
		+ Values
			+ 'DE' 
			+ 'EN' 
			+ 'IT' 
			+ 'ES'
			+ ...

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	

+ Response 200 (content-type:application/json; charset=utf-8)
    + Body
	
			{
				"head": {
					"metadata": {
						"plcServerVersion": "1.1.0"
					}
				},
				"body": {
					"LANGUAGES": [{
						"LANGUAGE": "DE",
						"TEXTS_MAINTAINABLE": 1
					},
					{
						"LANGUAGE": "EN",
						"TEXTS_MAINTAINABLE": 1
					}],
					"CURRENCIES": [{
						"CURRENCY_ID": "USD",
						"CURRENCY_CODE": "USD",
						"CURRENCY_DESCRIPTION": "United States Dollar"
					},
					{
						"CURRENCY_ID": "EUR",
						"CURRENCY_CODE": "EUR",
						"CURRENCY_DESCRIPTION": "Euro"
					}],
					"SYSTEMMESSAGES": [{
						"MESSAGE": "System will be rebooted at 12:00"
					}],
					"UNITSOFMEASURE": [{
						"UOM_ID": "CM",
						"UOM_CODE": "cm",
						"UOM_DESCRIPTION": "Centimeter"
					},
					{
						"UOM_ID": "EA",
						"UOM_CODE": "EA",
						"UOM_DESCRIPTION": "Each"
					}],
					"METADATA": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "ITEM_SPLITTING",
						"IS_CUSTOM": 0,
						"ROLLUP_TYPE_ID": 0,
						"SEMANTIC_DATA_TYPE": "String",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "length=10",
						"SIDE_PANEL_GROUP_ID": 101,
						"DISPLAY_ORDER": 3,
						"TABLE_DISPLAY_ORDER": 1,
						"REF_UOM_CURRENCY_PATH": "Material_Plant",
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": "Material_Plant",
						"REF_UOM_CURRENCY_COLUMN_ID": "MATERIAL_LOT_SIZE_UOM_ID",
						"UOM_CURRENCY_FLAG": 1,
						"PROPERTY_TYPE": 9,
						"IS_IMMUTABLE_AFTER_SAVE": 1,
						"IS_REQUIRED_IN_MASTERDATA": 1,
						"IS_WILDCARD_ALLOWED": 0,
						"IS_USABLE_IN_FORMULA": null,
						"RESOURCE_KEY_DISPLAY_NAME": "XFLD_SidePanel_DisplayName_ItemCategory",
						"RESOURCE_KEY_DISPLAY_DESCRIPTION": "XFLD_SidePanel_DisplayName_ItemCategory",
						CREATED_ON: null,
						"CREATED_BY": null,
						"LAST_MODIFIED_ON": null,
						"LAST_MODIFIED_BY": null,
						"VALIDATION_REGEX_ID": null,
						"VALIDATION_REGEX_VALUE": null,
						"TEXT": [{
							"PATH": "Item",
							"COLUMN_ID": "SPLITTING",
							"LANGUAGE": "EN",
							"DISPLAY_NAME": "Splitting",
							"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters",
							CREATED_ON: null,
							"CREATED_BY": null,
							"LAST_MODIFIED_ON": null,
							"LAST_MODIFIED_BY": null
						},
						{
							"PATH": "Item",
							"COLUMN_ID": "SPLITTING",
							"LANGUAGE": "DE",
							"DISPLAY_NAME": "Teilung",
							"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter",
							CREATED_ON: null,
							"CREATED_BY": null,
							"LAST_MODIFIED_ON": null,
							"LAST_MODIFIED_BY": null
						}],
						"ATTRIBUTES": [{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "ITEM_ID",
							"ITEM_CATEGORY_ID": 0,
							"SUBITEM_STATE": 0,
							"IS_ACTIVE": 0,
							"IS_MANDATORY": 1,
							"IS_READ_ONLY": null,
							"IS_TRANSFERABLE": null,
							"DEFAULT_VALUE": null,
							CREATED_ON: null,
							"CREATED_BY": null,
							"LAST_MODIFIED_ON": null,
							"LAST_MODIFIED_BY": null
						}],
						"FORMULAS": [],
						"SELECTION_FILTER": [{
							"PATH": "Item.Document",
							"BUSINESS_OBJECT": "Document",
							"COLUMN_ID": "DOCUMENT_ID",
							"FILTER_PATH": "Item.Document_Type",
							"FILTER_BUSINESS_OBJECT": "Document_Type",
							"FILTER_COLUMN_ID": "DOCUMENT_TYPE_ID"
						}],
						"SELECTION_DISPLAYED": [{
							"PATH": "Item.Document_Type",
							"BUSINESS_OBJECT": "Document_Type",
							"COLUMN_ID": "DOCUMENT_TYPE_ID",
							"DISPLAY_ORDER": 1,
							"DISPLAYED_PATH": "Item.Document_Type",
							"DISPLAYED_BUSINESS_OBJECT": "Document_Type",
							"DISPLAYED_COLUMN_ID": "DOCUMENT_TYPE_ID"
						},
						{
							"PATH": "Item.Document_Type",
							"BUSINESS_OBJECT": "Document_Type",
							"COLUMN_ID": "DOCUMENT_TYPE_ID",
							"DISPLAY_ORDER": 2,
							"DISPLAYED_PATH": "Item.Document_Type",
							"DISPLAYED_BUSINESS_OBJECT": "Document_Type",
							"DISPLAYED_COLUMN_ID": "DOCUMENT_TYPE_DESCRIPTION"
						}]
					}],
					"GROUPS": [{
						"SIDE_PANEL_GROUP_ID": 101,
						"SIDE_PANEL_GROUP_DISPLAY_ORDER": 1,
						"RESOURCE_KEY_GROUP_DESCRIPTION": "XGRP_SidePanel_General"
					},
					{
						"SIDE_PANEL_GROUP_ID": 102,
						"SIDE_PANEL_GROUP_DISPLAY_ORDER": 2,
						"RESOURCE_KEY_GROUP_DESCRIPTION": "XGRP_SidePanel_Organization"
					}]
				}
			}

+ Response 400 (application/json; charset=utf-8)

	If the service was called using wrong value for the language parameter
	+ Body
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "LOGON_LANGUAGE_NOT_SUPPORTED_ERROR",
							"severity": "Error"
						}
					]
				}
			}
		
+ Response 500 (application/json; charset=utf-8)

	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error",
							"details": {}
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

#/sap/plc/xs/rest/dispatcher.xsjs/logout<a name="logout"></a>

## Logout [POST]
Logout a server-side session. This call MUST be made after the initialization of the session!


+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
    + Body
	
			{
				"body": {},
				"head": {}
			}

+ Response 400 (application/json; charset=utf-8)

	If the service was called while a calculation version is opened
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [{
						"code": "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
						"severity": "Error",
						"details": {
							"userObjs": [{
								"id": "I305774"
							}]
						}
					}]
				}
			}
	
+ Response 404 (application/json; charset=utf-8)

	If the service was called before the initialization of session
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [{
						"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
						"severity": "Error",
						"details": {
							"userObjs": [{
								"id": "I305774"
							}]
						}
					}]
				}
			}
		
+ Response 500 (application/json; charset=utf-8)

	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error",
							"details": {}
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

			
#/sap/plc/xs/rest/dispatcher.xsjs/addins/{mode}{?include_config}{?guid}{?version}{?use_previous_version}<a name="addins"></a>

## Get [GET]
Read addin version

+ Parameters
	+ **mode** *(required, string, 'use')* ... If all add-ins should be send or only activated add-ins
		+ Values
			+ 'maintain' ... All addins will be retrieved. 
			+ 'use' ... Only activated addins will be retrieved in this case.
	+ **include_config** *(optional, boolean, 'true')* ... If the configuration items should be sent with the addin data
	+ **guid** *(optional, string, '1237834837267462')* ... Add-In GUID
	+ **version** *(optional, string, '2.12.4.5')* ... Add-In Version
	+ **use_previous_version** *(optional, boolean, 'true')* ... If system should check if there is a configuration available from an earlier version of this add-in

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{ 
				"body": [{
					"FULL_QUALIFIED_NAME": "com.sap.plc.extensibility.testAddIn1",
					"ADDIN_GUID": "1234567890123456789",
					"ADDIN_VERSION": "2.12.1.2",
					"NAME": "Test Add-In1",
					"DESCRIPTION": "Add-In 1 for testing the installation process",
					"PUBLISHER": "SAP SE",
					"STATUS": "Registered",
					"APPLICATION_AREA": "calculation",
					"CERTIFICATE_ISSUER": "CN=VeriSign Class 3 Code Signing 2010 CA",
					"CERTIFICATE_SUBJECT": "CN = TFS Development, O = mySAP.com Software, C = DE",
					"CERTIFICATE_VALID_FROM": "2015-01-01T01:00Z",
					"CERTIFICATE_VALID_TO": "2019-01-01T01:00Z",
					CREATED_ON: "2015-12-06T11:42Z",
					"CREATED_BY": "I305774",
					"LAST_MODIFIED_ON": "2015-12-08T11:42Z",
					"LAST_MODIFIED_BY": "I305774",
					"CONFIGURATION": {
						CREATED_ON: "2015-12-06T11:42Z",
						"CREATED_BY": "I305774",
						"LAST_MODIFIED_ON": "2015-12-08T11:42Z",
						"LAST_MODIFIED_BY": "I305774"
					}
				}],
				"head": {}
			}

+ Response 403
	If the user has not permission to change the addin state
	
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ACCESS_DENIED",
							"severity": "Error"
						}
					]
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
	
## Register [POST]
	
+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
			
	+ Body
		
			{
				"FULL_QUALIFIED_NAME": "Sap.Plc.ExampleAddIns.AssemblyImageExampleAddIn.AddInMainController",
				"ADDIN_GUID": "09342CAF-BA6A-4AF2-B632-5A13B7BA58A0",
				"ADDIN_VERSION": "1.0.0.0",
				"NAME": "Assembly Image Add-In",
				"DESCRIPTION": "Demo Add-In to show image of an selected assembly out of a SAP ERP System",
				"PUBLISHER": "SAP SE",
				"APPLICATION_AREA": "Calculation",
				"CERTIFICATE_ISSUER": "CN = mySAP.com Software CA, O = mySAP.com Software,C = DE",
				"CERTIFICATE_SUBJECT": "PLC Testing Team",
				"CERTIFICATE_VALID_FROM": "0001-01-01T00:00:00",
				"CERTIFICATE_VALID_TO": "9999-12-31T23:59:59.9999999"
			}

+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
		
			{
				"body": {
					"FULL_QUALIFIED_NAME": "Sap.Plc.ExampleAddIns.AssemblyImageExampleAddIn.AddInMainController",
					"ADDIN_GUID": "09342CAF-BA6A-4AF2-B632-5A13B7BA58A0",
					"ADDIN_VERSION": "1.0.0.0",
					"NAME": "Assembly Image Add-In",
					"DESCRIPTION": "Demo Add-In to show image of an selected assembly out of a SAP ERP System",
					"PUBLISHER": "SAP SE",
					"APPLICATION_AREA": "Calculation",
					"CERTIFICATE_ISSUER": "CN = mySAP.com Software CA, O = mySAP.com Software,C = DE",
					"CERTIFICATE_SUBJECT": "PLC Testing Team",
					"CERTIFICATE_VALID_FROM": "0001-01-01T00:00:00.000Z",
					"CERTIFICATE_VALID_TO": "9999-12-31T23:59:59.999Z",
					"ADDIN_MAJOR_VERSION": "1",
					"ADDIN_MINOR_VERSION": "0",
					"ADDIN_REVISION_NUMBER": "0",
					"ADDIN_BUILD_NUMBER": "0",
					"STATUS": "registered",
					CREATED_ON: "2016-04-20T13:05:52.881Z",
					"CREATED_BY": "SYSTEM",
					"LAST_MODIFIED_ON": "2016-04-20T13:05:52.881Z",
					"LAST_MODIFIED_BY": "SYSTEM"
				},
				"head": {
					
				}
			}

+ Response 307 (content-type:application/json; charset=utf-8)
	If the addin does not exist
	
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_SESSION_NOT_FOUND_EXCEPTION",
							"severity": "Error",
							"details": {
								"userObjs": [
									{
										"id": "I305774"
									}
								]
							}
						}
					]
				}
			}

+ Response 403
	If the user has not permission to change the addin state
	
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ACCESS_DENIED",
							"severity": "Error"
						}
					]
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}		
		
		
## Update [PUT]
Updates an addin version, e.g. its status. The status is set as a usual update in body, e.g. Status = "Activated"

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	+ Body
		
			{
				"ADDIN_GUID": "1234567890123456789",
				"ADDIN_VERSION": "2.12.1.2",
				"LAST_MODIFIED_ON": "2015-12-08T11:42Z",
				"STATUS": "Activated"
			}
			
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"ADDIN_GUID": "1234567890123456789",
					"ADDIN_VERSION": "2.12.1.2",
					"LAST_MODIFIED_ON": "2016-02-08T11:42Z",
					"LAST_MODIFIED_BY": "I305774",
					"STATUS": "Activated"
				},
				"head": {}
			}

+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "ADDIN_STATUS_ALREADY_SET_INFO",
							"severity": "Info"
						}
					]
				}
			}
		
+ Response 307 (content-type:application/json; charset=utf-8)
	If the addin does not exist
	
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_SESSION_NOT_FOUND_EXCEPTION",
							"severity": "Error",
							"details": {
								"userObjs": [
									{
										"id": "I305774"
									}
								]
							}
						}
					]
				}
			}

+ Response 403
	If the user has not permission to change the addin state
	
	+ Body
		
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ACCESS_DENIED",
							"severity": "Error"
						}
					]
				}
			}
		
+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}		
		

## Unregister [DELETE]	

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
			
	+ Body
	
			{
				"ADDIN_GUID": "123456789",
				"ADDIN_VERSION": "1.2.3.4"
			}
		
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {},
				"head": {}
			}
		
+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			

#/sap/plc/xs/rest/dispatcher.xsjs/projects<a name="projects"></a>

+ Parameters
	
## Get [GET]
Get all the available projects from the system. Response contains a list of projects and a list of all customers referenced in projects.

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{	
				"head": {},
				"body": {
					"transactionaldata": [{
						"PROJECT_ID": "#P1",
						"REFERENCE_PROJECT_ID": "P-9990",
						"PROJECT_NAME": "#SAP Example: Pumps Project",
						"PROJECT_RESPONSIBLE": "#CONTROLLER",
						"CONTROLLING_AREA_ID": "#CA1",
						"CUSTOMER_ID": "#CU1",
						"SALES_DOCUMENT": "10000022",
						"SALES_PRICE": "100000",
						"SALES_PRICE_CURRENCY_ID": "USD",
						"COMMENT": "linked to a PS project and to an SD inquiry",
						"COMPANY_CODE_ID": "#C1",
						"PLANT_ID": "#PT1",
						"BUSINESS_AREA_ID": "#BA1",
						"PROFIT_CENTER_ID": "#PC1",
						"REPORT_CURRENCY_ID": "USD",
						"COSTING_SHEET_ID": "#COGSL",
						"COMPONENT_SPLIT_ID": "#SPLIT_DETAILED",
						"START_OF_PROJECT": null,
						"END_OF_PROJECT": null,
						"START_OF_PRODUCTION": null,
						"END_OF_PRODUCTION": null,
						"VALUATION_DATE": "2015-01-01T00:00:00.000Z",
						CREATED_ON: "2015-09-01T09:00:00.000Z",
						"CREATED_BY": "#CONTROLLER",
						"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
						"LAST_MODIFIED_BY": "#CONTROLLER",
						"IS_FROZEN": null,
						"CALCULATION_NO": 1
					}],
					"masterdata": {
						"CUSTOMER_ENTITIES": [{
							"CUSTOMER_ID": "#CU1",
							"CUSTOMER_NAME": "Kunde 1",
							"COUNTRY": "Germany",
							"POSTAL_CODE": "12345",
							"REGION": null,
							"CITY": "Dresden",
							"STREET_NUMBER_OR_PO_BOX": "Kundenstraße 1",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null
						}]
					}
				}
			}

+ Response 500 (application/json; charset=utf-8)

	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

#/sap/plc/xs/rest/dispatcher.xsjs/calculations/{action}{?id}{?calculate}<a name="calculations"></a>

+ Parameters
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
		+ Values
			+ 'true' 
			+ 'false'
	+ **action** *(required, string, 'create')* ... Parameter that specifies the action to be performed
		+ Values
			+ 'create' ... creates a blank calculation, specified in the request body
			+ 'copy-version' ... copy an existing calculation version with a specified id in a new calculation - the request body is empty
	+ **id** *(optional, PositiveInteger, all)* ... Parameter that specifies the id of calculation version to be copied

## Get [GET]
Get all calculations currently required in the system. Response contains a list of calculations with all calculation versions, but each version only contains its root item. Hence, the transmitted calculation versions lack information, which must be retrieved by an additional service call if needed. 

+ Parameters
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
		+ Values
			+ 'true' 
			+ 'false'

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"head": {
					
				},
				"body": {
					"transactionaldata": [{
						"CALCULATION_ID": 1,
						"CALCULATION_NAME": "#SAP Example: Pump P-100",
						"CONTROLLING_AREA_ID": "#CA1",
						CREATED_ON: "2015-09-01T09:00:00.000Z",
						"CREATED_BY": "#CONTROLLER",
						"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
						"LAST_MODIFIED_BY": "#CONTROLLER",
						"CALCULATION_VERSIONS": [{
							"CALCULATION_VERSION_ID": 1,
							"CALCULATION_ID": 1,
							"CALCULATION_VERSION_NAME": "#Version 1",
							"ROOT_ITEM_ID": 3952,
							"CUSTOMER_ID": "#CU1",
							"SALES_PRICE": null,
							"SALES_PRICE_CURRENCY_ID": null,
							"IS_QUANTITY_PASSED_ON": 0,
							"REPORT_CURRENCY_ID": "EUR",
							"PRICE_DETERMINATION_STRATEGY": "Standard",
							"COSTING_SHEET_ID": "#COGSL",
							"COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
							"START_OF_INVESTMENT": "2015-01-01T00:00:00.000Z",
							"END_OF_INVESTMENT": "2015-06-30T00:00:00.000Z",
							"START_OF_PRODUCTION": "2015-07-01T00:00:00.000Z",
							"END_OF_PRODUCTION": "2017-12-31T00:00:00.000Z",
							"VALUATION_DATE": "2015-09-01T00:00:00.000Z",
							"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
							"LAST_MODIFIED_BY": "#CONTROLLER",
							"MASTER_DATA_TIMESTAMP": "2015-09-01T09:00:00.000Z",
							"ITEMS": [{
								"ITEM_ID": 3952,
								"CALCULATION_VERSION_ID": 1,
								"IS_ACTIVE": 1,
								"ITEM_CATEGORY_ID": 0,
								"ACCOUNT_ID": "#AC13",
								"MATERIAL_ID": "#P-100",
								"COMPANY_CODE_ID": "#C1",
								"PLANT_ID": "#PT1",
								"BUSINESS_AREA_ID": "#BA1",
								"PROFIT_CENTER_ID": "#PC1",
								"TOTAL_QUANTITY": "10",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"PRICE_FIXED_PORTION": "0",
								"PRICE_VARIABLE_PORTION": "0",
								"TRANSACTION_CURRENCY_ID": "EUR",
								"PRICE_UNIT": "1",
								"PRICE_UNIT_UOM_ID": "PC",
								CREATED_ON: "2015-09-01T09:00:00.000Z",
								"CREATED_BY": "#CONTROLLER",
								"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
								"LAST_MODIFIED_BY": "#CONTROLLER",
								"TOTAL_COST": "8115.0168",
								"TOTAL_COST_FIXED_PORTION": "2998.6704",
								"TOTAL_COST_VARIABLE_PORTION": "5116.3464"
							}]
						}]
					}]
				}
			}

+ Response 500 (application/json; charset=utf-8)

	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## Create [POST]
Creates a new calculation with an initial calculation version and root item. The client POSTs a serialized calculation, calculation version and root item to the server, where as all the server generated Ids are set to -1 (undefined) and the server responds with a calculation, calculation version and root item with generated Id and all other server-generated values.

+ Parameters
	+ **calculate** *(optional, boolean, 'false')* ... Flag that indicates if a calculation is triggered for this calculation version
	+ **action** *(required, string, 'create')* ... Parameter that specifies the action to be performed
			
+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			[{
				"CALCULATION_ID": -1,
				"CALCULATION_NAME": "Calculation",
				"CALCULATION_VERSIONS": [{
					"CALCULATION_ID": -1,
					"CALCULATION_VERSION_ID": -1,
					"CALCULATION_VERSION_NAME": "Version 1",
					"IS_QUANTITY_PASSED_ON": 0,
					"PRICE_DETERMINATION_STRATEGY": "Standard",
					"REPORT_CURRENCY_ID": "EUR",
					"ROOT_ITEM_ID": -1,
					"SALES_PRICE_CURRENCY_ID": "EUR",
					"VALUATION_DATE": "2016-04-07T00:00:00Z",
					"ITEMS": [{
						"CALCULATION_VERSION_ID": -1,
						"IS_ACTIVE": 1,
						"ITEM_ID": -1,
						"PRICE_FIXED_PORTION": 0,
						"TRANSACTION_CURRENCY_ID": "EUR",
						"PRICE_UNIT": 1,
						"PRICE_UNIT_UOM_ID": "PC",
						"PRICE_VARIABLE_PORTION": 0,
						"TARGET_COST_CURRENCY_ID": "EUR",
						"TOTAL_QUANTITY": 1,
						"TOTAL_QUANTITY_UOM_ID": "PC"
					}]
				}]
			}]

+ Response 201 (content-type:application/json; charset=utf-8)
	+ Body
			
			{
				"body": {
					"masterdata": {
						"COMPONENT_SPLIT_ENTITIES": [],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES": [],
						"COSTING_SHEET_ENTITIES": [],
						"COSTING_SHEET_ROW_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"ACCOUNT_GROUP_ENTITIES": [],
						"WORK_CENTER_ENTITIES": [],
						"WORK_CENTER_CATEGORY_ENTITIES": [],
						"PROCESS_ENTITIES": [],
						"OVERHEAD_GROUP_ENTITIES": [],
						"PLANT_ENTITIES": [],
						"COST_CENTER_ENTITIES": [],
						"PROFIT_CENTER_ENTITIES": [],
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACCOUNT_ENTITIES": [],
						"COMPANY_CODE_ENTITIES": [],
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID": "#CA1",
							"CONTROLLING_AREA_CURRENCY_ID": "EUR",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null,
							"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
						}],
						"BUSINESS_AREA_ENTITIES": [],
						"MATERIAL_ENTITIES": [],
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_PLANT_ENTITIES": [],
						"MATERIAL_TYPE_ENTITIES": [],
						"VALUATION_CLASS_ENTITIES": [],
						"VENDOR_ENTITIES": [],
						"CUSTOMER_ENTITIES": [],
						"DOCUMENT_ENTITIES": [],
						"DOCUMENT_TYPE_ENTITIES": [],
						"DOCUMENT_STATUS_ENTITIES": [],
						"DESIGN_OFFICE_ENTITIES": []
					},
					"transactionaldata": [{
						"CALCULATION_ID": 2309,
						"CALCULATION_NAME": "Calculation I305774",
						"CALCULATION_VERSIONS": [{
							"CALCULATION_ID": 2309,
							"CALCULATION_VERSION_ID": 3013,
							"CALCULATION_VERSION_NAME": "Version 1",
							"IS_QUANTITY_PASSED_ON": 0,
							"PRICE_DETERMINATION_STRATEGY": "Standard",
							"REPORT_CURRENCY_ID": "EUR",
							"ROOT_ITEM_ID": 102084,
							"SALES_PRICE_CURRENCY_ID": "EUR",
							"VALUATION_DATE": "2016-04-07T00:00:00.000Z",
							"ITEMS": [{
								"SESSION_ID": "I305774",
								"ITEM_ID": 102084,
								"CALCULATION_VERSION_ID": 3013,
								"PARENT_ITEM_ID": null,
								"PREDECESSOR_ITEM_ID": null,
								"IS_ACTIVE": 1,
								"STATUS": null,
								"ITEM_CATEGORY_ID": 0,
								"ACCOUNT_ID": null,
								"DOCUMENT_TYPE_ID": null,
								"DOCUMENT_ID": null,
								"DOCUMENT_VERSION": null,
								"DOCUMENT_PART": null,
								"DOCUMENT_STATUS_ID": null,
								"DESIGN_OFFICE_ID": null,
								"MATERIAL_ID": null,
								"MATERIAL_TYPE_ID": null,
								"MATERIAL_GROUP_ID": null,
								"OVERHEAD_GROUP_ID": null,
								"VALUATION_CLASS_ID": null,
								"ACTIVITY_TYPE_ID": null,
								"PROCESS_ID": null,
								"LOT_SIZE": null,
								"LOT_SIZE_CALCULATED": null,
								"LOT_SIZE_IS_MANUAL": null,
								"ENGINEERING_CHANGE_NUMBER_ID": null,
								"COMPANY_CODE_ID": null,
								"COST_CENTER_ID": null,
								"PLANT_ID": null,
								"WORK_CENTER_ID": null,
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"QUANTITY": null,
								"QUANTITY_CALCULATED": null,
								"QUANTITY_IS_MANUAL": null,
								"QUANTITY_UOM_ID": null,
								"TOTAL_QUANTITY": "1",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"TOTAL_QUANTITY_DEPENDS_ON": null,
								"IS_RELEVANT_TO_COSTING_IN_ERP": null,
								"PRICE_FIXED_PORTION": "0",
								"PRICE_FIXED_PORTION_CALCULATED": null,
								"PRICE_FIXED_PORTION_IS_MANUAL": null,
								"PRICE_VARIABLE_PORTION": "0",
								"PRICE_VARIABLE_PORTION_CALCULATED": null,
								"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
								"PRICE": null,
								"TRANSACTION_CURRENCY_ID": "EUR",
								"PRICE_UNIT": "1",
								"PRICE_UNIT_CALCULATED": null,
								"PRICE_UNIT_IS_MANUAL": null,
								"PRICE_UNIT_UOM_ID": "PC",
								"CONFIDENCE_LEVEL_ID": null,
								"PRICE_SOURCE_ID": null,
								"VENDOR_ID": null,
								"TARGET_COST": null,
								"TARGET_COST_CALCULATED": null,
								"TARGET_COST_IS_MANUAL": null,
								"TARGET_COST_CURRENCY_ID": "EUR",
								CREATED_ON: "2016-04-07T10:56:52.017Z",
								"CREATED_BY": "I305774",
								"LAST_MODIFIED_ON": "2016-04-07T10:56:52.017Z",
								"LAST_MODIFIED_BY": "I305774",
								"PRICE_FOR_TOTAL_QUANTITY": null,
								"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": null,
								"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": null,
								"OTHER_COST": null,
								"OTHER_COST_FIXED_PORTION": null,
								"OTHER_COST_VARIABLE_PORTION": null,
								"TOTAL_COST": null,
								"TOTAL_COST_FIXED_PORTION": null,
								"TOTAL_COST_VARIABLE_PORTION": null,
								"ITEM_DESCRIPTION": null,
								"COMMENT": null,
								"IS_DIRTY": 1,
								"IS_DELETED": 0,
								"HANDLE_ID": -1
							}],
							"MASTER_DATA_TIMESTAMP": "2016-04-07T10:56:51.307Z",
							"SESSION_ID": "I305774",
							"CONTROLLING_VERSION_ID": "1"
						}],
						"CONTROLLING_AREA_ID": "#CA1",
						CREATED_ON: "2016-04-07T10:56:51.312Z",
						"CREATED_BY": "I305774",
						"LAST_MODIFIED_ON": "2016-04-07T10:56:51.312Z",
						"LAST_MODIFIED_BY": "I305774"
					}]
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3013,
							"IS_DIRTY": 1
						}]
					}
				}
			}

+ Response 500 (application/json; charset=utf-8)
	If the service was called using wrong HTTP method
	
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## Create calculation as copy [POST]
Creates a new calculation with an existing calculation version and all its items. The client POSTs a serialized calculation, calculation version and root item to the server, where as all the server generated Ids are set to -1 (undefined) and the server responds with a calculation, calculation version and root item with generated Id and all other server-generated values.

+ Parameters
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
	+ **action** *(required, string, 'copy-version')* ... Parameter that specifies the action to be performed
	+ **id** *(required, PositiveInteger, all)* ... Parameter that specifies the id of calculation version to be copied
			
+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

+ Response			
	+ Body
	
			{
				"body": {
					"masterdata": {
						"COMPONENT_SPLIT_ENTITIES": [],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES": [],
						"COSTING_SHEET_ENTITIES": [],
						"COSTING_SHEET_ROW_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"ACCOUNT_GROUP_ENTITIES": [],
						"WORK_CENTER_ENTITIES": [],
						"WORK_CENTER_CATEGORY_ENTITIES": [],
						"PROCESS_ENTITIES": [],
						"OVERHEAD_GROUP_ENTITIES": [],
						"PLANT_ENTITIES": [],
						"COST_CENTER_ENTITIES": [],
						"PROFIT_CENTER_ENTITIES": [],
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACCOUNT_ENTITIES": [],
						"COMPANY_CODE_ENTITIES": [],
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID": "#CA1",
							"CONTROLLING_AREA_CURRENCY_ID": "EUR",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null,
							"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
						}],
						"BUSINESS_AREA_ENTITIES": [],
						"MATERIAL_ENTITIES": [],
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_PLANT_ENTITIES": [],
						"MATERIAL_TYPE_ENTITIES": [],
						"VALUATION_CLASS_ENTITIES": [],
						"VENDOR_ENTITIES": [],
						"CUSTOMER_ENTITIES": [],
						"DOCUMENT_ENTITIES": [],
						"DOCUMENT_TYPE_ENTITIES": [],
						"DOCUMENT_STATUS_ENTITIES": [],
						"DESIGN_OFFICE_ENTITIES": []
					},
					"transactionaldata": [{
						"CALCULATION_ID": 2313,
						"PROJECT_ID": null,
						"CALCULATION_NAME": "Calculation I305774 (2)",
						"CURRENT_CALCULATION_VERSION_ID": null,
						"CONTROLLING_AREA_ID": "#CA1",
						CREATED_ON: "2016-04-07T12:19:37.458Z",
						"CREATED_BY": "I305774",
						"LAST_MODIFIED_ON": "2016-04-07T12:19:37.747Z",
						"LAST_MODIFIED_BY": "I305774",
						"CALCULATION_VERSIONS": [{
							"SESSION_ID": "I305774",
							"CALCULATION_VERSION_ID": 3017,
							"CALCULATION_ID": 2313,
							"CALCULATION_VERSION_NAME": "Version 1",
							"ROOT_ITEM_ID": 102086,
							"CUSTOMER_ID": null,
							"CONTROLLING_VERSION_ID": "1",
							"SALES_PRICE": null,
							"SALES_PRICE_CURRENCY_ID": "EUR",
							"IS_QUANTITY_PASSED_ON": 0,
							"REPORT_CURRENCY_ID": "EUR",
							"PRICE_DETERMINATION_STRATEGY": "Standard",
							"COSTING_SHEET_ID": null,
							"COMPONENT_SPLIT_ID": null,
							"START_OF_INVESTMENT": null,
							"END_OF_INVESTMENT": null,
							"START_OF_PRODUCTION": null,
							"END_OF_PRODUCTION": null,
							"VALUATION_DATE": "2016-04-07T00:00:00.000Z",
							"LAST_MODIFIED_ON": null,
							"LAST_MODIFIED_BY": null,
							"MASTER_DATA_TIMESTAMP": "2016-04-07T11:06:57.536Z",
							"IS_FROZEN": null,
							"IS_DIRTY": 1,
							"ITEMS": [{
								"SESSION_ID": "I305774",
								"ITEM_ID": 102086,
								"CALCULATION_VERSION_ID": 3017,
								"PARENT_ITEM_ID": null,
								"PREDECESSOR_ITEM_ID": null,
								"IS_ACTIVE": 1,
								"STATUS": null,
								"ITEM_CATEGORY_ID": 0,
								"ACCOUNT_ID": null,
								"DOCUMENT_TYPE_ID": null,
								"DOCUMENT_ID": null,
								"DOCUMENT_VERSION": null,
								"DOCUMENT_PART": null,
								"DOCUMENT_STATUS_ID": null,
								"DESIGN_OFFICE_ID": null,
								"MATERIAL_ID": null,
								"MATERIAL_TYPE_ID": null,
								"MATERIAL_GROUP_ID": null,
								"OVERHEAD_GROUP_ID": null,
								"VALUATION_CLASS_ID": null,
								"ACTIVITY_TYPE_ID": null,
								"PROCESS_ID": null,
								"LOT_SIZE": null,
								"LOT_SIZE_CALCULATED": null,
								"LOT_SIZE_IS_MANUAL": null,
								"ENGINEERING_CHANGE_NUMBER_ID": null,
								"COMPANY_CODE_ID": null,
								"COST_CENTER_ID": null,
								"PLANT_ID": null,
								"WORK_CENTER_ID": null,
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"QUANTITY": null,
								"QUANTITY_CALCULATED": null,
								"QUANTITY_IS_MANUAL": null,
								"QUANTITY_UOM_ID": null,
								"TOTAL_QUANTITY": "1",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"TOTAL_QUANTITY_DEPENDS_ON": null,
								"IS_RELEVANT_TO_COSTING_IN_ERP": null,
								"PRICE_FIXED_PORTION": "0",
								"PRICE_FIXED_PORTION_CALCULATED": null,
								"PRICE_FIXED_PORTION_IS_MANUAL": null,
								"PRICE_VARIABLE_PORTION": "0",
								"PRICE_VARIABLE_PORTION_CALCULATED": null,
								"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
								"PRICE": null,
								"TRANSACTION_CURRENCY_ID": "EUR",
								"PRICE_UNIT": "1",
								"PRICE_UNIT_CALCULATED": null,
								"PRICE_UNIT_IS_MANUAL": null,
								"PRICE_UNIT_UOM_ID": "PC",
								"CONFIDENCE_LEVEL_ID": null,
								"PRICE_SOURCE_ID": null,
								"VENDOR_ID": null,
								"TARGET_COST": null,
								"TARGET_COST_CALCULATED": null,
								"TARGET_COST_IS_MANUAL": null,
								"TARGET_COST_CURRENCY_ID": "EUR",
								CREATED_ON: "2016-04-07T12:19:12.639Z",
								"CREATED_BY": "I305774",
								"LAST_MODIFIED_ON": "2016-04-07T12:19:12.639Z",
								"LAST_MODIFIED_BY": "I305774",
								"PRICE_FOR_TOTAL_QUANTITY": "0",
								"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
								"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
								"OTHER_COST": "0",
								"OTHER_COST_FIXED_PORTION": "0",
								"OTHER_COST_VARIABLE_PORTION": "0",
								"TOTAL_COST": "0",
								"TOTAL_COST_FIXED_PORTION": "0",
								"TOTAL_COST_VARIABLE_PORTION": "0",
								"ITEM_DESCRIPTION": null,
								"COMMENT": null,
								"IS_DIRTY": 1,
								"IS_DELETED": 0
							}]
						}]
					}],
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 102086,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "1",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": null,
							"PRICE_UNIT_UOM_ID": null,
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": null,
							"PRICE_VARIABLE_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3017,
							"IS_DIRTY": 1
						}]
					}
				}
			}
		
+ Response 400 (application/json; charset=utf-8)	

	If the specified id refers to a temporary calculation version
	+ Body
	
			{
				"body": {
					
				},
				"head": {
					"messages": [{
						"code": "CALCULATIONVERSION_IS_TEMPORARY_ERROR",
						"severity": "Error",
						"details": {
							"calculationVersionObjs": [{
								"id": 3014
							}]
						}
					}]
				}
			}	
		
+ Response 404 (application/json; charset=utf-8)
	
	If the calculation version with the specified id doesn't exist
	+ Body
	
			{
				"body": {
					
				},
				"head": {
					"messages": [{
						"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
						"severity": "Error",
						"details": {
							"calculationVersionObjs": [{
								"id": 12354342
							}]
						}
					}]
				}
			}
		
+ Response 500 (application/json; charset=utf-8)
	
	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
	
	If the service was called using wrong parameters or request body is not empty - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
						
## Delete [DELETE]
Deletes a calculation with all its associated calculation versions, if none of this version is currently opened by any client. Responds with a BAD REQUEST if this condition cannot be satisfied.
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	+ Body
	
			[
				{
					"CALCULATION_ID":2
				}
			]
			
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_ID": 2
						}]
					}
				}
			}
			
+ Response 400 (content-type:application/json; charset=utf-8)
	
	If the calculation, which is supposed to be deleted, still contains version opened by users the service responses with a 400 (Bad Request). The body content contains information about the opened versions and the users who have the versions opened.
	+ Body
	
			{
				"head": {
					"messages": [
						{
							"code": "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
							"severity": "Error",
							"details": {
								"calculationObjs": [
									{
										"id": 1978
									}
								],
								"calculationVersionObjs": [
									{
										"id": 2809,
										"name": "SAP-Beispiel: Version 1.0",
										"openingUsers": [
											{
												"id": "D063494"
											},
											{
												"id": "D053727"
											}
										]
									}
								]
							}
						}
					]
				},
				"body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)

	If the calculation with the specified id cannot be found, the server responses with a 404 error and the following body content: 
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "calculationObjs": [
			                        {
			                            "id": 100417
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
		
+ Response 500 (application/json; charset=utf-8)

	If the service was called using wrong HTTP method
	+ Body
			
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_METHOD_NOT_ALLOWED_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)

	If the service was called using wrong parameters or request body is wrong - backend validation fails
	+ Body
				
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
							
					
#/sap/plc/xs/rest/dispatcher.xsjs/calculation-versions/{?calculate}<a name="calculation-versions"></a>		
Similar request to GET but without the Id as url segment

+ Parameters
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version	
	
## Update [PUT]			
Updates a calculation version. Only properties of the the calculation version resource can be updated and properties of a root item.
	
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_ID": 1,
				"CALCULATION_VERSION_ID": 1034,
				"CALCULATION_VERSION_NAME": "Calculation Version 2",
				"COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
				"COSTING_SHEET_ID": "#COGSL",
				"CUSTOMER_ID": "#CU1",
				"END_OF_INVESTMENT": "2015-06-30T00:00:00Z",
				"END_OF_PRODUCTION": "2017-12-31T00:00:00Z",
				"EXPLOSION_DATE": "2015-09-01T00:00:00Z",
				"IS_QUANTITY_PASSED_ON": 0,
				"PRICE_DETERMINATION_STRATEGY": "Standard",
				"REPORT_CURRENCY_ID": "EUR",
				"ROOT_ITEM_ID": 3952,
				"START_OF_INVESTMENT": "2015-01-01T00:00:00Z",
				"START_OF_PRODUCTION": "2015-07-01T00:00:00Z",
				"VALUATION_DATE": "2015-09-01T00:00:00Z"
			}]

+ Response
	+ Body
	
			{
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 2809,
							"IS_DIRTY": 0,
							"IS_LOCKED": 0
						}]
					}
				},
				"body": {
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 3002,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": 37220.49531,
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": 10239.26341,
							"OTHER_COST_FIXED_PORTION": 750,
							"OTHER_COST_VARIABLE_PORTION": 210,
							"TOTAL_COST_FIXED_PORTION": 37220.49531,
							"TOTAL_COST_VARIABLE_PORTION": 10239.26341
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [{
							"ITEM_ID": 3002,
							"COSTING_SHEET_ROW_ID": "MEK",
							"IS_ROLLED_UP": 1,
							"HAS_SUBITEMS": 1,
							"COST_FIXED_PORTION": 0,
							"COST_VARIABLE_PORTION": 6024
						}],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": [{
							"ITEM_ID": 3002,
							"COMPONENT_SPLIT_ID": "1",
							"COST_COMPONENT_ID": 10,
							"COST_FIXED_PORTION": 0,
							"COST_VARIABLE_PORTION": 6024
						}]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
		                "severity": "Error",
		                "details": {
		                    "calculationObjs": [
		                        {
		                            "id": 3
		                        }
		                    ]
		                }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/calculation-versions/{action}{?id}{?calculate}
Requests to create, copy or modify the state of a calculation version.

+ Parameters
	+ **action** *(required, string, 'close')* ... Parameter that specifies the action to be performed
		+ Values
			+ 'create' ... creates a version specified in the request body
			+ 'copy' ... copy the version with the specified id in the same calculation
			+ 'close' ... closes the version specified in the request body
			+ 'save' ... save the version specified in the request body
			+ 'save-as' ... save the version specified in the request body as a new version
			+ 'open' ... open a version with the specified id
	+ **id** *(optional, PositiveInteger, all)* ... The id of the calculation version
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version	


## Create [POST]
Creates a blank calculation version and root item in an existing calculation.

+ Parameters
	+ **action** *(required, string, 'create')* ... The value 'create' must be given as value for the action parameter in order to create a new calculation version
	
+ Request
	+ Headers
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_ID": 2310,
				"CALCULATION_VERSION_ID": -1,
				"CALCULATION_VERSION_NAME": "Version 1",
				"IS_QUANTITY_PASSED_ON": 0,
				"PRICE_DETERMINATION_STRATEGY": "Standard",
				"REPORT_CURRENCY_ID": "EUR",
				"ROOT_ITEM_ID": -1,
				"SALES_PRICE_CURRENCY_ID": "EUR",
				"VALUATION_DATE": "2016-04-07T00:00:00Z",
				"ITEMS": [{
					"CALCULATION_VERSION_ID": -1,
					"IS_ACTIVE": 1,
					"ITEM_ID": -1,
					"PRICE_FIXED_PORTION": 0,
					"TRANSACTION_CURRENCY_ID": "EUR",
					"PRICE_UNIT": 1,
					"PRICE_UNIT_UOM_ID": "PC",
					"PRICE_VARIABLE_PORTION": 0,
					"TARGET_COST_CURRENCY_ID": "EUR",
					"TOTAL_QUANTITY": 1,
					"TOTAL_QUANTITY_UOM_ID": "PC"
				}]
			}]
		
+ Response 201 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"transactionaldata": [{
						"CALCULATION_ID": 2310,
						"CALCULATION_VERSION_ID": 3018,
						"CALCULATION_VERSION_NAME": "Version 1 (2)",
						"IS_QUANTITY_PASSED_ON": 0,
						"PRICE_DETERMINATION_STRATEGY": "Standard",
						"REPORT_CURRENCY_ID": "EUR",
						"ROOT_ITEM_ID": 102087,
						"SALES_PRICE_CURRENCY_ID": "EUR",
						"VALUATION_DATE": "2016-04-07T00:00:00.000Z",
						"ITEMS": [{
							"SESSION_ID": "I305774",
							"ITEM_ID": 102087,
							"CALCULATION_VERSION_ID": 3018,
							"PARENT_ITEM_ID": null,
							"PREDECESSOR_ITEM_ID": null,
							"IS_ACTIVE": 1,
							"STATUS": null,
							"ITEM_CATEGORY_ID": 0,
							"ACCOUNT_ID": null,
							"DOCUMENT_TYPE_ID": null,
							"DOCUMENT_ID": null,
							"DOCUMENT_VERSION": null,
							"DOCUMENT_PART": null,
							"DOCUMENT_STATUS_ID": null,
							"DESIGN_OFFICE_ID": null,
							"MATERIAL_ID": null,
							"MATERIAL_TYPE_ID": null,
							"MATERIAL_GROUP_ID": null,
							"OVERHEAD_GROUP_ID": null,
							"VALUATION_CLASS_ID": null,
							"ACTIVITY_TYPE_ID": null,
							"PROCESS_ID": null,
							"LOT_SIZE": null,
							"LOT_SIZE_CALCULATED": null,
							"LOT_SIZE_IS_MANUAL": null,
							"ENGINEERING_CHANGE_NUMBER_ID": null,
							"COMPANY_CODE_ID": null,
							"COST_CENTER_ID": null,
							"PLANT_ID": null,
							"WORK_CENTER_ID": null,
							"BUSINESS_AREA_ID": null,
							"PROFIT_CENTER_ID": null,
							"QUANTITY": null,
							"QUANTITY_CALCULATED": null,
							"QUANTITY_IS_MANUAL": null,
							"QUANTITY_UOM_ID": null,
							"TOTAL_QUANTITY": "1",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY_DEPENDS_ON": null,
							"IS_RELEVANT_TO_COSTING_IN_ERP": null,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_FIXED_PORTION_CALCULATED": null,
							"PRICE_FIXED_PORTION_IS_MANUAL": null,
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_VARIABLE_PORTION_CALCULATED": null,
							"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
							"PRICE": null,
							"TRANSACTION_CURRENCY_ID": "EUR",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_CALCULATED": null,
							"PRICE_UNIT_IS_MANUAL": null,
							"PRICE_UNIT_UOM_ID": "PC",
							"CONFIDENCE_LEVEL_ID": null,
							"PRICE_SOURCE_ID": null,
							"VENDOR_ID": null,
							"TARGET_COST": null,
							"TARGET_COST_CALCULATED": null,
							"TARGET_COST_IS_MANUAL": null,
							"TARGET_COST_CURRENCY_ID": "EUR",
							CREATED_ON: "2016-04-07T16:53:09.742Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-07T16:53:09.742Z",
							"LAST_MODIFIED_BY": "I305774",
							"PRICE_FOR_TOTAL_QUANTITY": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": null,
							"OTHER_COST": null,
							"OTHER_COST_FIXED_PORTION": null,
							"OTHER_COST_VARIABLE_PORTION": null,
							"TOTAL_COST": null,
							"TOTAL_COST_FIXED_PORTION": null,
							"TOTAL_COST_VARIABLE_PORTION": null,
							"ITEM_DESCRIPTION": null,
							"COMMENT": null,
							"IS_DIRTY": 1,
							"IS_DELETED": 0,
							"HANDLE_ID": -1
						}],
						"MASTER_DATA_TIMESTAMP": "2016-04-07T16:53:09.040Z",
						"SESSION_ID": "I305774",
						"CONTROLLING_VERSION_ID": "1"
					}],
					"masterdata": {
						"COMPONENT_SPLIT_ENTITIES": [],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES": [],
						"COSTING_SHEET_ENTITIES": [],
						"COSTING_SHEET_ROW_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"ACCOUNT_GROUP_ENTITIES": [],
						"WORK_CENTER_ENTITIES": [],
						"WORK_CENTER_CATEGORY_ENTITIES": [],
						"PROCESS_ENTITIES": [],
						"OVERHEAD_GROUP_ENTITIES": [],
						"PLANT_ENTITIES": [],
						"COST_CENTER_ENTITIES": [],
						"PROFIT_CENTER_ENTITIES": [],
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACCOUNT_ENTITIES": [],
						"COMPANY_CODE_ENTITIES": [],
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID": "#CA1",
							"CONTROLLING_AREA_CURRENCY_ID": "EUR",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null,
							"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
						}],
						"BUSINESS_AREA_ENTITIES": [],
						"MATERIAL_ENTITIES": [],
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_PLANT_ENTITIES": [],
						"MATERIAL_TYPE_ENTITIES": [],
						"VALUATION_CLASS_ENTITIES": [],
						"VENDOR_ENTITIES": [],
						"CUSTOMER_ENTITIES": [],
						"DOCUMENT_ENTITIES": [],
						"DOCUMENT_TYPE_ENTITIES": [],
						"DOCUMENT_STATUS_ENTITIES": [],
						"DESIGN_OFFICE_ENTITIES": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3018,
							"IS_DIRTY": 1
						}]
					}
				}
			}

+ Response 404 (content-type:application/json; charset=utf-8)
	
	If the calculation with the specified id does not exist
	
	+ Body
	
			{
				"body": {
					"transactionaldata": []
				},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
							"severity": "Error"
						}
					]
				}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_VALIDATION_ERROR",
							"severity": "Error"
						}
					]
				}
			}

## Copy [POST]
Copy an existing calculation version and its items in the same calculation.

+ Parameters
	+ **action** *(required, string, 'copy')* ... The value 'create' must be given as value for the action parameter in order to create a new calculation version
	+ **id** *(required, PositiveInteger, all)* ... The id of calculation version to be copied. It can be any positive integer number.
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version	
	
+ Request
	+ Headers
			Host:<hana host>:<port><instance> 
			Accept:application/json

+ Response
	+ Body
		
			{
				"body": {
					"transactionaldata": [{
						"SESSION_ID": "I305774",
						"CALCULATION_VERSION_ID": 3021,
						"CALCULATION_ID": 1,
						"CALCULATION_VERSION_NAME": "#Version 1 (2)",
						"ROOT_ITEM_ID": 3952,
						"CUSTOMER_ID": "#CU1",
						"CONTROLLING_VERSION_ID": null,
						"SALES_PRICE": null,
						"SALES_PRICE_CURRENCY_ID": null,
						"IS_QUANTITY_PASSED_ON": 0,
						"REPORT_CURRENCY_ID": "EUR",
						"PRICE_DETERMINATION_STRATEGY": "Standard",
						"COSTING_SHEET_ID": "#COGSL",
						"COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
						"START_OF_INVESTMENT": "2015-01-01T00:00:00.000Z",
						"END_OF_INVESTMENT": "2015-06-30T00:00:00.000Z",
						"START_OF_PRODUCTION": "2015-07-01T00:00:00.000Z",
						"END_OF_PRODUCTION": "2017-12-31T00:00:00.000Z",
						"VALUATION_DATE": "2015-09-01T00:00:00.000Z",
						"LAST_MODIFIED_ON": null,
						"LAST_MODIFIED_BY": null,
						"MASTER_DATA_TIMESTAMP": "2015-09-01T09:00:00.000Z",
						"IS_FROZEN": null,
						"IS_DIRTY": 1,
						"ITEMS": [{
							"SESSION_ID": "I305774",
							"ITEM_ID": 3952,
							"CALCULATION_VERSION_ID": 3021,
							"PARENT_ITEM_ID": null,
							"PREDECESSOR_ITEM_ID": null,
							"IS_ACTIVE": 1,
							"STATUS": null,
							"ITEM_CATEGORY_ID": 0,
							"ACCOUNT_ID": "#AC13",
							"DOCUMENT_TYPE_ID": null,
							"DOCUMENT_ID": null,
							"DOCUMENT_VERSION": null,
							"DOCUMENT_PART": null,
							"DOCUMENT_STATUS_ID": null,
							"DESIGN_OFFICE_ID": null,
							"MATERIAL_ID": "#P-100",
							"MATERIAL_TYPE_ID": null,
							"MATERIAL_GROUP_ID": null,
							"OVERHEAD_GROUP_ID": null,
							"VALUATION_CLASS_ID": null,
							"ACTIVITY_TYPE_ID": null,
							"PROCESS_ID": null,
							"LOT_SIZE": null,
							"LOT_SIZE_CALCULATED": null,
							"LOT_SIZE_IS_MANUAL": null,
							"ENGINEERING_CHANGE_NUMBER_ID": null,
							"COMPANY_CODE_ID": "#C1",
							"COST_CENTER_ID": null,
							"PLANT_ID": "#PT1",
							"WORK_CENTER_ID": null,
							"BUSINESS_AREA_ID": "#BA1",
							"PROFIT_CENTER_ID": "#PC1",
							"QUANTITY": null,
							"QUANTITY_CALCULATED": null,
							"QUANTITY_IS_MANUAL": null,
							"QUANTITY_UOM_ID": null,
							"TOTAL_QUANTITY": "10",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY_DEPENDS_ON": null,
							"IS_RELEVANT_TO_COSTING_IN_ERP": 1,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_FIXED_PORTION_CALCULATED": null,
							"PRICE_FIXED_PORTION_IS_MANUAL": null,
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_VARIABLE_PORTION_CALCULATED": null,
							"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
							"PRICE": null,
							"TRANSACTION_CURRENCY_ID": "EUR",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_CALCULATED": null,
							"PRICE_UNIT_IS_MANUAL": null,
							"PRICE_UNIT_UOM_ID": "PC",
							"CONFIDENCE_LEVEL_ID": null,
							"PRICE_SOURCE_ID": "902",
							"VENDOR_ID": null,
							"TARGET_COST": null,
							"TARGET_COST_CALCULATED": null,
							"TARGET_COST_IS_MANUAL": null,
							"TARGET_COST_CURRENCY_ID": null,
							CREATED_ON: "2015-09-01T09:00:00.000Z",
							"CREATED_BY": "#CONTROLLER",
							"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
							"LAST_MODIFIED_BY": "#CONTROLLER",
							"PRICE_FOR_TOTAL_QUANTITY": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": null,
							"OTHER_COST": null,
							"OTHER_COST_FIXED_PORTION": null,
							"OTHER_COST_VARIABLE_PORTION": null,
							"TOTAL_COST": null,
							"TOTAL_COST_FIXED_PORTION": null,
							"TOTAL_COST_VARIABLE_PORTION": null,
							"ITEM_DESCRIPTION": null,
							"COMMENT": null,
							"IS_DIRTY": 1,
							"IS_DELETED": 0
						},
						{
							"SESSION_ID": "I305774",
							"ITEM_ID": 3998,
							"CALCULATION_VERSION_ID": 3021,
							"PARENT_ITEM_ID": 3952,
							"PREDECESSOR_ITEM_ID": 4017,
							"IS_ACTIVE": 1,
							"STATUS": null,
							"ITEM_CATEGORY_ID": 2,
							"ACCOUNT_ID": "#AC12",
							"DOCUMENT_TYPE_ID": null,
							"DOCUMENT_ID": null,
							"DOCUMENT_VERSION": null,
							"DOCUMENT_PART": null,
							"DOCUMENT_STATUS_ID": null,
							"DESIGN_OFFICE_ID": null,
							"MATERIAL_ID": "#100-300",
							"MATERIAL_TYPE_ID": null,
							"MATERIAL_GROUP_ID": null,
							"OVERHEAD_GROUP_ID": null,
							"VALUATION_CLASS_ID": null,
							"ACTIVITY_TYPE_ID": null,
							"PROCESS_ID": null,
							"LOT_SIZE": null,
							"LOT_SIZE_CALCULATED": null,
							"LOT_SIZE_IS_MANUAL": null,
							"ENGINEERING_CHANGE_NUMBER_ID": null,
							"COMPANY_CODE_ID": "#C2",
							"COST_CENTER_ID": null,
							"PLANT_ID": "#PT2",
							"WORK_CENTER_ID": null,
							"BUSINESS_AREA_ID": "#BA2",
							"PROFIT_CENTER_ID": "#PC2",
							"QUANTITY": "1",
							"QUANTITY_CALCULATED": null,
							"QUANTITY_IS_MANUAL": null,
							"QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY": "10",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY_DEPENDS_ON": 1,
							"IS_RELEVANT_TO_COSTING_IN_ERP": 1,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_FIXED_PORTION_CALCULATED": null,
							"PRICE_FIXED_PORTION_IS_MANUAL": null,
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_VARIABLE_PORTION_CALCULATED": null,
							"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
							"PRICE": null,
							"TRANSACTION_CURRENCY_ID": "EUR",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_CALCULATED": null,
							"PRICE_UNIT_IS_MANUAL": null,
							"PRICE_UNIT_UOM_ID": "PC",
							"CONFIDENCE_LEVEL_ID": null,
							"PRICE_SOURCE_ID": "902",
							"VENDOR_ID": "#VD3",
							"TARGET_COST": null,
							"TARGET_COST_CALCULATED": null,
							"TARGET_COST_IS_MANUAL": null,
							"TARGET_COST_CURRENCY_ID": null,
							CREATED_ON: "2015-09-01T09:00:00.000Z",
							"CREATED_BY": "#CONTROLLER",
							"LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
							"LAST_MODIFIED_BY": "#CONTROLLER",
							"PRICE_FOR_TOTAL_QUANTITY": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": null,
							"OTHER_COST": null,
							"OTHER_COST_FIXED_PORTION": null,
							"OTHER_COST_VARIABLE_PORTION": null,
							"TOTAL_COST": null,
							"TOTAL_COST_FIXED_PORTION": null,
							"TOTAL_COST_VARIABLE_PORTION": null,
							"ITEM_DESCRIPTION": null,
							"COMMENT": null,
							"IS_DIRTY": 1,
							"IS_DELETED": 0
						}]
					}],
					"masterdata": {},
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 3952,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "10",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_UOM_ID": "PC",
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": "272.6064",
							"PRICE_VARIABLE_PORTION": "465.1224",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "2726.064",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "4651.224",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "2998.6704",
							"TOTAL_COST_VARIABLE_PORTION": "5116.3464"
						},
						{
							"ITEM_ID": 3998,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "10",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_UOM_ID": "PC",
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": "10.224",
							"PRICE_VARIABLE_PORTION": "9.384",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "102.24",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "93.84",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "123.7104",
							"TOTAL_COST_VARIABLE_PORTION": "113.5464"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [{
							"ITEM_ID": 3952,
							"COSTING_SHEET_ROW_ID": "COGM",
							"IS_ROLLED_UP": 0,
							"HAS_SUBITEMS": 1,
							"COST_FIXED_PORTION": "2726.064",
							"COST_VARIABLE_PORTION": "4651.224"
						},
						{
							"ITEM_ID": 3998,
							"COSTING_SHEET_ROW_ID": "COGM",
							"IS_ROLLED_UP": 0,
							"HAS_SUBITEMS": 1,
							"COST_FIXED_PORTION": "112.464",
							"COST_VARIABLE_PORTION": "103.224"
						}],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": [{
							"ITEM_ID": 3952,
							"COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
							"COST_COMPONENT_ID": 110,
							"COST_FIXED_PORTION": "0",
							"COST_VARIABLE_PORTION": "1206"
						},
						{
							"ITEM_ID": 3998,
							"COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
							"COST_COMPONENT_ID": 110,
							"COST_FIXED_PORTION": "0",
							"COST_VARIABLE_PORTION": "6"
						}]
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3021,
							"IS_DIRTY": 1
						}]
					}
				}
			}

+ Response 400
	If the calculation version with the specified id is temporary 
	+ Body
		
			{
				"body": {
					"transactionaldata": []
				},
				"head": {
					"messages": [
						{
							"code": "CALCULATIONVERSION_IS_TEMPORARY_ERROR",
							"severity": "Error",
							"details": {
								"calculationVersionObjs": [
									{
										"id": 3021
									}
								]
							}
						}
					]
				}
			}		
		
+ Response 404 (content-type:application/json; charset=utf-8)
	If the calculation version with the specified id does not exist
	+ Body
	
			{
				"body": {
					"transactionaldata": []
				},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
							"severity": "Error",
							"details": {
								"calculationVersionObjs": [
									{
										"id": 1242342
									}
								]
							}
						}
					]
				}
			}
		
+ Response 500 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_VALIDATION_ERROR",
							"severity": "Error"
						}
					]
				}
			}

	
## Close [POST]
Closes a specific calculation version. 

+ Parameters
	+ **action** *(required, string, 'close')* ... The value 'close' must be given as value for the action parameter in order to close the calculation version
	
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[
				{
					"CALCULATION_VERSION_ID":1
				}
			]
	
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"head":{},
				"body":{}
			}

+ Response 500 (content-type:application/json; charset=utf-8)	
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [{
			            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
		                "severity": "Error",
		                "details": {
		                    "calculationObjs": [
		                        {
		                            "id": 3
		                        }
		                    ]
		                }
			        ]
			    },
			    "body": {}
			}
						
## Save [POST]
+ Parameters
	+ **action** (required, string, 'save') ... The value 'save' must be given as value for the action parameter in order to save the calculation version
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
	
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_ID":1,
				"CALCULATION_VERSION_ID":3022,
				"CALCULATION_VERSION_NAME":"#Version 1 (3)"
			}]
	
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3022,
							"IS_DIRTY": 0,
							"IS_WRITEABLE": 1
						}]
					}
				},
				"body": {
					"transactionaldata": [{
						"CALCULATION_VERSION_ID": 3022,
						"LAST_MODIFIED_ON": "2016-04-07T17:46:48.189Z",
						"LAST_MODIFIED_BY": "I305774",
						"ITEMS": [{
							"ITEM_ID": 3952,
							"CALCULATION_VERSION_ID": 3022,
							CREATED_ON: "2016-04-07T17:46:48.148Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-07T17:46:48.127Z",
							"LAST_MODIFIED_BY": "I305774",
							"IS_DIRTY": 0
						},
						{
							"ITEM_ID": 3998,
							"CALCULATION_VERSION_ID": 3022,
							CREATED_ON: "2016-04-07T17:46:48.168Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-07T17:46:48.127Z",
							"LAST_MODIFIED_BY": "I305774",
							"IS_DIRTY": 0
						}]
					}],
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 3952,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "1",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": null,
							"PRICE_UNIT_UOM_ID": null,
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": null,
							"PRICE_VARIABLE_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [{
			            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
		                "severity": "Error",
		                "details": {
		                    "calculationObjs": [
		                        {
		                            "id": 3
		                        }
		                    ]
		                }
			        ]
			    },
			    "body": {}
			}
			
## Save as [POST]
+ Parameters
	+ **action** (required, string, 'save-as') ... The value 'save-as' must be given as value for the action parameter in order to save the calculation version
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version

+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[
				{
					"CALCULATION_ID":2314,
					"CALCULATION_VERSION_ID":3024,
					"CALCULATION_VERSION_NAME":"Version 3"
				}
			]
	
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"transactionaldata": [{
						"SESSION_ID": "I305774",
						"CALCULATION_VERSION_ID": 3025,
						"CALCULATION_ID": 2314,
						"CALCULATION_VERSION_NAME": "Version 3",
						"ROOT_ITEM_ID": 102090,
						"CUSTOMER_ID": null,
						"CONTROLLING_VERSION_ID": "1",
						"SALES_PRICE": null,
						"SALES_PRICE_CURRENCY_ID": "EUR",
						"IS_QUANTITY_PASSED_ON": 0,
						"REPORT_CURRENCY_ID": "EUR",
						"PRICE_DETERMINATION_STRATEGY": "Standard",
						"COSTING_SHEET_ID": null,
						"COMPONENT_SPLIT_ID": null,
						"START_OF_INVESTMENT": null,
						"END_OF_INVESTMENT": null,
						"START_OF_PRODUCTION": null,
						"END_OF_PRODUCTION": null,
						"VALUATION_DATE": "2016-04-08T00:00:00.000Z",
						"LAST_MODIFIED_ON": "2016-04-08T07:52:15.695Z",
						"LAST_MODIFIED_BY": "I305774",
						"MASTER_DATA_TIMESTAMP": "2016-04-08T07:48:39.257Z",
						"IS_FROZEN": null,
						"IS_DIRTY": 0,
						"ITEMS": [{
							"SESSION_ID": "I305774",
							"ITEM_ID": 102090,
							"CALCULATION_VERSION_ID": 3025,
							"PARENT_ITEM_ID": null,
							"PREDECESSOR_ITEM_ID": null,
							"IS_ACTIVE": 1,
							"STATUS": null,
							"ITEM_CATEGORY_ID": 0,
							"ACCOUNT_ID": null,
							"DOCUMENT_TYPE_ID": null,
							"DOCUMENT_ID": null,
							"DOCUMENT_VERSION": null,
							"DOCUMENT_PART": null,
							"DOCUMENT_STATUS_ID": null,
							"DESIGN_OFFICE_ID": null,
							"MATERIAL_ID": null,
							"MATERIAL_TYPE_ID": null,
							"MATERIAL_GROUP_ID": null,
							"OVERHEAD_GROUP_ID": null,
							"VALUATION_CLASS_ID": null,
							"ACTIVITY_TYPE_ID": null,
							"PROCESS_ID": null,
							"LOT_SIZE": null,
							"LOT_SIZE_CALCULATED": null,
							"LOT_SIZE_IS_MANUAL": null,
							"ENGINEERING_CHANGE_NUMBER_ID": null,
							"COMPANY_CODE_ID": null,
							"COST_CENTER_ID": null,
							"PLANT_ID": null,
							"WORK_CENTER_ID": null,
							"BUSINESS_AREA_ID": null,
							"PROFIT_CENTER_ID": null,
							"QUANTITY": null,
							"QUANTITY_CALCULATED": null,
							"QUANTITY_IS_MANUAL": null,
							"QUANTITY_UOM_ID": null,
							"TOTAL_QUANTITY": "1",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY_DEPENDS_ON": null,
							"IS_RELEVANT_TO_COSTING_IN_ERP": null,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_FIXED_PORTION_CALCULATED": null,
							"PRICE_FIXED_PORTION_IS_MANUAL": null,
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_VARIABLE_PORTION_CALCULATED": null,
							"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
							"PRICE": null,
							"TRANSACTION_CURRENCY_ID": "EUR",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_CALCULATED": null,
							"PRICE_UNIT_IS_MANUAL": null,
							"PRICE_UNIT_UOM_ID": "PC",
							"CONFIDENCE_LEVEL_ID": null,
							"PRICE_SOURCE_ID": null,
							"VENDOR_ID": null,
							"TARGET_COST": null,
							"TARGET_COST_CALCULATED": null,
							"TARGET_COST_IS_MANUAL": null,
							"TARGET_COST_CURRENCY_ID": "EUR",
							CREATED_ON: "2016-04-08T07:52:15.691Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-08T07:52:15.688Z",
							"LAST_MODIFIED_BY": "I305774",
							"PRICE_FOR_TOTAL_QUANTITY": "0",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0",
							"ITEM_DESCRIPTION": null,
							"COMMENT": null,
							"IS_DIRTY": 0,
							"IS_DELETED": 0
						}]
					}],
					"masterdata": {
						"COMPONENT_SPLIT_ENTITIES": [],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES": [],
						"COSTING_SHEET_ENTITIES": [],
						"COSTING_SHEET_ROW_ENTITIES": [],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
						"ACCOUNT_GROUP_ENTITIES": [],
						"WORK_CENTER_ENTITIES": [],
						"WORK_CENTER_CATEGORY_ENTITIES": [],
						"PROCESS_ENTITIES": [],
						"OVERHEAD_GROUP_ENTITIES": [],
						"PLANT_ENTITIES": [],
						"COST_CENTER_ENTITIES": [],
						"PROFIT_CENTER_ENTITIES": [],
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACCOUNT_ENTITIES": [],
						"COMPANY_CODE_ENTITIES": [],
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID": "#CA1",
							"CONTROLLING_AREA_CURRENCY_ID": "EUR",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null,
							"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
						}],
						"BUSINESS_AREA_ENTITIES": [],
						"MATERIAL_ENTITIES": [],
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_PLANT_ENTITIES": [],
						"MATERIAL_TYPE_ENTITIES": [],
						"VALUATION_CLASS_ENTITIES": [],
						"VENDOR_ENTITIES": [],
						"CUSTOMER_ENTITIES": [],
						"DOCUMENT_ENTITIES": [],
						"DOCUMENT_TYPE_ENTITIES": [],
						"DOCUMENT_STATUS_ENTITIES": [],
						"DESIGN_OFFICE_ENTITIES": []
					},
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 102090,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "1",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": null,
							"PRICE_UNIT_UOM_ID": null,
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": null,
							"PRICE_VARIABLE_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3025,
							"IS_DIRTY": 0,
							"IS_WRITEABLE": 1
						}]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [{
			            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
		                "severity": "Error",
		                "details": {
		                    "calculationObjs": [
		                        {
		                            "id": 3
		                        }
		                    ]
		                }
			        ]
			    },
			    "body": {}
			}

## Open [POST]
Retrieves a complete calculation version with a specific Id with all its items. Through the ?calculate parameter clients can trigger a calculation for the requested version. The results will be incorporated in the response.

+ Parameters
	+ **action** *(required, string, 'open')* ... The value 'open' must be given as value for the action parameter in order to open the calculation version
	+ **id** *(required, long, '2809')* ... Id of the calculation version that shall be retrieved
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
	+ **loadMasterdata** *(optional, boolean, 'true')* ... Flag that indicates if a master data objects needs to be retrieved as well
	
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"head": {
					 "messages": [
						{
							"code": "ENTITY_NOT_WRITABLE_INFO",
							"severity": "Warning",
							"details": {
								"userObjs": [
									{
										"id": "#CONTROLLER"
									}
								],
								"calculationObjs": [
									{
										"id": 1
									}
								]
							}
						}
					],
					"metadata": {
						"CalculationVersions": [
							{
								"CALCULATION_VERSION_ID": 1,
								"IS_DIRTY": 0,
								"IS_LOCKED": 0
							}
						]
					}
				},
				"body": {
					"transactionaldata": [
						{
							"SESSION_ID": "I309362",
			                "CALCULATION_VERSION_ID": 1,
			                "CALCULATION_ID": 1,
			                "CALCULATION_VERSION_NAME": "#Version 1",
			                "ROOT_ITEM_ID": 3952,
			                "CUSTOMER_ID": "#CU1",
							"CONTROLLING_VERSION_ID": null,
							"SALES_PRICE": null,
							"SALES_PRICE_CURRENCY_ID": null,
			                "IS_QUANTITY_PASSED_ON": 0,
			                "REPORT_CURRENCY_ID": "EUR",
			                "PRICE_DETERMINATION_STRATEGY": "Standard",
			                "COSTING_SHEET_ID": "#COGSL",
			                "COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
			                "START_OF_INVESTMENT": "2015-01-01T00:00:00.000Z",
			                "END_OF_INVESTMENT": "2015-06-30T00:00:00.000Z",
			                "START_OF_PRODUCTION": "2015-07-01T00:00:00.000Z",
			                "END_OF_PRODUCTION": "2017-12-31T00:00:00.000Z",
			                "VALUATION_DATE": "2015-09-01T00:00:00.000Z",
			                "LAST_MODIFIED_ON": "2015-09-01T09:00:00.000Z",
			                "LAST_MODIFIED_BY": "#CONTROLLER",
			                "MASTER_DATA_TIMESTAMP": "2015-09-01T09:00:00.000Z",
							"IS_FROZEN": null,
							"IS_DIRTY": 0,
							"ITEMS": [
			                    {
			                        "SESSION_ID": "I305774",
									"ITEM_ID": 3952,
									"CALCULATION_VERSION_ID": 1,
									"PARENT_ITEM_ID": null,
									"PREDECESSOR_ITEM_ID": null,
									"IS_ACTIVE": 1,
									"STATUS": null,
									"ITEM_CATEGORY_ID": 0,
									"ACCOUNT_ID": "#AC13",
									"DOCUMENT_TYPE_ID": null,
									"DOCUMENT_ID": null,
									"DOCUMENT_VERSION": null,
									"DOCUMENT_PART": null,
									"DOCUMENT_STATUS_ID": null,
									"DESIGN_OFFICE_ID": null,
									"MATERIAL_ID": "#P-100",
									"MATERIAL_TYPE_ID": null,
									"MATERIAL_GROUP_ID": null,
									"OVERHEAD_GROUP_ID": null,
									"VALUATION_CLASS_ID": null,
									"ACTIVITY_TYPE_ID": null,
									"PROCESS_ID": null,
									"LOT_SIZE": null,
									"LOT_SIZE_CALCULATED": null,
									"LOT_SIZE_IS_MANUAL": null,
									"ENGINEERING_CHANGE_NUMBER_ID": null,
									"COMPANY_CODE_ID": "#C1",
									"COST_CENTER_ID": null,
									"PLANT_ID": "#PT1",
									"WORK_CENTER_ID": null,
									"BUSINESS_AREA_ID": "#BA1",
									"PROFIT_CENTER_ID": "#PC1",
									"QUANTITY": null,
									"QUANTITY_CALCULATED": null,
									"QUANTITY_IS_MANUAL": null,
									"QUANTITY_UOM_ID": null,
									"TOTAL_QUANTITY": "10",
									"TOTAL_QUANTITY_UOM_ID": "PC",
									"TOTAL_QUANTITY_DEPENDS_ON": null,
									"IS_RELEVANT_TO_COSTING_IN_ERP": null,
									"PRICE_FIXED_PORTION": "0",
									"PRICE_FIXED_PORTION_CALCULATED": "272.6064",
									"PRICE_FIXED_PORTION_IS_MANUAL": null,
									"PRICE_VARIABLE_PORTION": "0",
									"PRICE_VARIABLE_PORTION_CALCULATED": "465.1224",
									"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
									"PRICE": null,
									"TRANSACTION_CURRENCY_ID": "EUR",
									"PRICE_UNIT": "1",
									"PRICE_UNIT_CALCULATED": "1",
									"PRICE_UNIT_IS_MANUAL": null,
									"PRICE_UNIT_UOM_ID": "PC",
									"CONFIDENCE_LEVEL_ID": null,
									"PRICE_SOURCE_ID": "902",
									"VENDOR_ID": null,
									"TARGET_COST": null,
									"TARGET_COST_CALCULATED": null,
									"TARGET_COST_IS_MANUAL": null,
									"TARGET_COST_CURRENCY_ID": null,
									CREATED_ON: "2015-09-01T09:00:00.000Z",
									"CREATED_BY": "#CONTROLLER",
									"LAST_MODIFIED_ON": "2016-04-07T08:03:32.403Z",
									"LAST_MODIFIED_BY": "D062529",
									"PRICE_FOR_TOTAL_QUANTITY": "7377.288",
									"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "2726.064",
									"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "4651.224",
									"OTHER_COST": "0",
									"OTHER_COST_FIXED_PORTION": "0",
									"OTHER_COST_VARIABLE_PORTION": "0",
									"TOTAL_COST": "8115.0168",
									"TOTAL_COST_FIXED_PORTION": "2998.6704",
									"TOTAL_COST_VARIABLE_PORTION": "5116.3464",
									"ITEM_DESCRIPTION": null,
									"COMMENT": null,
									"IS_DIRTY": 0,
									"IS_DELETED": 0
			                    },
			                    {
			                        "SESSION_ID": "I305774",
									"ITEM_ID": 3998,
									"CALCULATION_VERSION_ID": 1,
									"PARENT_ITEM_ID": 3952,
									"PREDECESSOR_ITEM_ID": 4017,
									"IS_ACTIVE": 1,
									"STATUS": null,
									"ITEM_CATEGORY_ID": 2,
									"ACCOUNT_ID": "#AC12",
									"DOCUMENT_TYPE_ID": null,
									"DOCUMENT_ID": null,
									"DOCUMENT_VERSION": null,
									"DOCUMENT_PART": null,
									"DOCUMENT_STATUS_ID": null,
									"DESIGN_OFFICE_ID": null,
									"MATERIAL_ID": "#100-300",
									"MATERIAL_TYPE_ID": null,
									"MATERIAL_GROUP_ID": null,
									"OVERHEAD_GROUP_ID": null,
									"VALUATION_CLASS_ID": null,
									"ACTIVITY_TYPE_ID": null,
									"PROCESS_ID": null,
									"LOT_SIZE": "50",
									"LOT_SIZE_CALCULATED": null,
									"LOT_SIZE_IS_MANUAL": null,
									"ENGINEERING_CHANGE_NUMBER_ID": null,
									"COMPANY_CODE_ID": "#C2",
									"COST_CENTER_ID": null,
									"PLANT_ID": "#PT2",
									"WORK_CENTER_ID": null,
									"BUSINESS_AREA_ID": "#BA2",
									"PROFIT_CENTER_ID": "#PC2",
									"QUANTITY": "1",
									"QUANTITY_CALCULATED": null,
									"QUANTITY_IS_MANUAL": null,
									"QUANTITY_UOM_ID": "PC",
									"TOTAL_QUANTITY": "10",
									"TOTAL_QUANTITY_UOM_ID": "PC",
									"TOTAL_QUANTITY_DEPENDS_ON": 1,
									"IS_RELEVANT_TO_COSTING_IN_ERP": null,
									"PRICE_FIXED_PORTION": "0",
									"PRICE_FIXED_PORTION_CALCULATED": "10.224",
									"PRICE_FIXED_PORTION_IS_MANUAL": null,
									"PRICE_VARIABLE_PORTION": "0",
									"PRICE_VARIABLE_PORTION_CALCULATED": "9.384",
									"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
									"PRICE": null,
									"TRANSACTION_CURRENCY_ID": "EUR",
									"PRICE_UNIT": "1",
									"PRICE_UNIT_CALCULATED": "1",
									"PRICE_UNIT_IS_MANUAL": null,
									"PRICE_UNIT_UOM_ID": "PC",
									"CONFIDENCE_LEVEL_ID": null,
									"PRICE_SOURCE_ID": "902",
									"VENDOR_ID": "#VD3",
									"TARGET_COST": null,
									"TARGET_COST_CALCULATED": null,
									"TARGET_COST_IS_MANUAL": null,
									"TARGET_COST_CURRENCY_ID": null,
									CREATED_ON: "2015-09-01T09:00:00.000Z",
									"CREATED_BY": "#CONTROLLER",
									"LAST_MODIFIED_ON": "2016-04-07T08:03:32.403Z",
									"LAST_MODIFIED_BY": "D062529",
									"PRICE_FOR_TOTAL_QUANTITY": "196.08",
									"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "102.24",
									"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "93.84",
									"OTHER_COST": "0",
									"OTHER_COST_FIXED_PORTION": "0",
									"OTHER_COST_VARIABLE_PORTION": "0",
									"TOTAL_COST": "237.2568",
									"TOTAL_COST_FIXED_PORTION": "123.7104",
									"TOTAL_COST_VARIABLE_PORTION": "113.5464",
									"ITEM_DESCRIPTION": null,
									"COMMENT": null,
									"IS_DIRTY": 0,
									"IS_DELETED": 0
			                    }
			                 ]
						}
					],
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [
							{
								"ITEM_ID": 3952,
								"QUANTITY": null,
								"TOTAL_QUANTITY": "10",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"PRICE_UNIT": "1",
								"PRICE_UNIT_UOM_ID": "PC",
								"TARGET_COST": null,
								"LOT_SIZE": null,
								"PRICE_FIXED_PORTION": "272.6064",
								"PRICE_VARIABLE_PORTION": "465.1224",
								"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "2726.064",
								"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "4651.224",
								"OTHER_COST_FIXED_PORTION": "0",
								"OTHER_COST_VARIABLE_PORTION": "0",
								"TOTAL_COST_FIXED_PORTION": "2998.6704",
								"TOTAL_COST_VARIABLE_PORTION": "5116.3464"
							},
							{
								"ITEM_ID": 3998,
								"QUANTITY": null,
								"TOTAL_QUANTITY": "10",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"PRICE_UNIT": "1",
								"PRICE_UNIT_UOM_ID": "PC",
								"TARGET_COST": null,
								"LOT_SIZE": null,
								"PRICE_FIXED_PORTION": "10.224",
								"PRICE_VARIABLE_PORTION": "9.384",
								"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "102.24",
								"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "93.84",
								"OTHER_COST_FIXED_PORTION": "0",
								"OTHER_COST_VARIABLE_PORTION": "0",
								"TOTAL_COST_FIXED_PORTION": "123.7104",
								"TOTAL_COST_VARIABLE_PORTION": "113.5464"
							}
						],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [
							{
			                    "ITEM_ID": 3952,
			                    "COSTING_SHEET_ROW_ID": "DMC",
			                    "IS_ROLLED_UP": 0,
			                    "HAS_SUBITEMS": 1,
			                    "COST_FIXED_PORTION": "2726.064",
			                    "COST_VARIABLE_PORTION": "4651.224"
			                },
			                {
			                    "ITEM_ID": 3952,
			                    "COSTING_SHEET_ROW_ID": "DMC",
			                    "IS_ROLLED_UP": 1,
			                    "HAS_SUBITEMS": 1,
			                    "COST_FIXED_PORTION": "0",
			                    "COST_VARIABLE_PORTION": "1206"
			                }
						],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": [
							{
			                    "ITEM_ID": 3952,
			                    "COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
			                    "COST_COMPONENT_ID": 110,
			                    "COST_FIXED_PORTION": "0",
			                    "COST_VARIABLE_PORTION": "1206"
			                },
			                {
			                    "ITEM_ID": 3952,
			                    "COMPONENT_SPLIT_ID": "#SPLIT_CONDENSED",
			                    "COST_COMPONENT_ID": 120,
			                    "COST_FIXED_PORTION": "2263.19999",
			                    "COST_VARIABLE_PORTION": "2762.7"
			                }
						]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 404 (content-type:application/json; charset=utf-8)

	If the calculation version with the specified id does not exist		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
		                "severity": "Error",
		                "details": {
		                    "calculationObjs": [
		                        {
		                            "id": 3
		                        }
		                    ]
		                }
			        ]
			    },
			    "body": {}
			}			
			
## Delete [DELETE]
Deletes a calculation version, if the version is not opened by any client. Responds with a BAD REQUEST if this condition cannot be satisfied.

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	+ Body
	
			[ 
				{
					"CALCULATION_VERSION_ID":3024 
				}
			]
			
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3024
						}]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
	
	If the version that should be deleted is still opened by other users, the service responses with 400 and specify the opening user in the response body.
	+ Body
	
			{
				"head": {
					"messages": [
						{
							"code": "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
							"severity": "Error",
							"details": {
								"calculationVersionObjs": [
									{
										"id": 2809,
										"openingUsers": [
											{
												"id": "I054806"
											}
										]
									}
								]
							}
						}
					]
				},
				"body": {}
			}


+ Response 404 (content-type:application/json; charset=utf-8)

	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "calculationVersionObjs": [
			                        {
			                            "id": 100527
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/items/{?calculate}<a name="items"></a>

+ Parameters
	+ **calculate** *(required, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
	
## Update [PUT]
Updates a specific item , that was sent into request body with specified values

+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_VERSION_ID": 1031,
				"ITEM_ID": 100254,
				"MATERIAL_ID": "#100-110",
				"PLANT_ID": "#PT1"
			}]
			
+ Response (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"transactionaldata": [
						{
							"SESSION_ID": "I305774",
							"ITEM_ID": 102092,
							"CALCULATION_VERSION_ID": 3028,
							"PARENT_ITEM_ID": null,
							"PREDECESSOR_ITEM_ID": null,
							"IS_ACTIVE": 1,
							"STATUS": null,
							"ITEM_CATEGORY_ID": 0,
							"ACCOUNT_ID": null,
							"DOCUMENT_TYPE_ID": null,
							"DOCUMENT_ID": null,
							"DOCUMENT_VERSION": null,
							"DOCUMENT_PART": null,
							"DOCUMENT_STATUS_ID": null,
							"DESIGN_OFFICE_ID": null,
							"MATERIAL_ID": "#100-110",
							"MATERIAL_TYPE_ID": null,
							"MATERIAL_GROUP_ID": null,
							"OVERHEAD_GROUP_ID": null,
							"VALUATION_CLASS_ID": null,
							"ACTIVITY_TYPE_ID": null,
							"PROCESS_ID": null,
							"LOT_SIZE": null,
							"LOT_SIZE_CALCULATED": null,
							"LOT_SIZE_IS_MANUAL": null,
							"ENGINEERING_CHANGE_NUMBER_ID": null,
							"COMPANY_CODE_ID": "#C1",
							"COST_CENTER_ID": null,
							"PLANT_ID": "#PT1",
							"WORK_CENTER_ID": null,
							"BUSINESS_AREA_ID": null,
							"PROFIT_CENTER_ID": null,
							"QUANTITY": null,
							"QUANTITY_CALCULATED": null,
							"QUANTITY_IS_MANUAL": null,
							"QUANTITY_UOM_ID": null,
							"TOTAL_QUANTITY": "5",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"TOTAL_QUANTITY_DEPENDS_ON": null,
							"IS_RELEVANT_TO_COSTING_IN_ERP": null,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_FIXED_PORTION_CALCULATED": null,
							"PRICE_FIXED_PORTION_IS_MANUAL": null,
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_VARIABLE_PORTION_CALCULATED": null,
							"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
							"PRICE": null,
							"TRANSACTION_CURRENCY_ID": "EUR",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_CALCULATED": null,
							"PRICE_UNIT_IS_MANUAL": null,
							"PRICE_UNIT_UOM_ID": "PC",
							"CONFIDENCE_LEVEL_ID": null,
							"PRICE_SOURCE_ID": null,
							"VENDOR_ID": null,
							"TARGET_COST": null,
							"TARGET_COST_CALCULATED": null,
							"TARGET_COST_IS_MANUAL": null,
							"TARGET_COST_CURRENCY_ID": "EUR",
							CREATED_ON: "2016-04-08T09:28:23.327Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-08T09:28:23.327Z",
							"LAST_MODIFIED_BY": "I305774",
							"PRICE_FOR_TOTAL_QUANTITY": "0",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0",
							"ITEM_DESCRIPTION": "",
							"COMMENT": null,
							"IS_DIRTY": 1,
							"IS_DELETED": 0
						}
					],
					"masterdata": {},
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [
							{
								"ITEM_ID": 102092,
								"QUANTITY": null,
								"TOTAL_QUANTITY": "5",
								"TOTAL_QUANTITY_UOM_ID": "PC",
								"PRICE_UNIT": null,
								"PRICE_UNIT_UOM_ID": null,
								"TARGET_COST": null,
								"LOT_SIZE": null,
								"PRICE_FIXED_PORTION": null,
								"PRICE_VARIABLE_PORTION": null,
								"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
								"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
								"OTHER_COST_FIXED_PORTION": "0",
								"OTHER_COST_VARIABLE_PORTION": "0",
								"TOTAL_COST_FIXED_PORTION": "0",
								"TOTAL_COST_VARIABLE_PORTION": "0"
							}
						],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [
							{
								"CALCULATION_VERSION_ID": 3028,
								"IS_DIRTY": 1
							}
						]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 404 (content-type:application/json; charset=utf-8)

	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "itemObjs": [
			                        {
			                            "id": 100254
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
						
## Create [POST]
Creates an item , that was sent into request body with specified values

+ Parameters
	+ **calculate** *(required, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version
	+ **mode** *(required, string, 'normal')* ... If the parameter mode=replace is set, an import is executed; the request must contain a parent item for the import
		+ Values
			+ 'normal'
			+ 'replace'
			
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_VERSION_ID": 3028,
				"IS_ACTIVE": 1,
				"ITEM_CATEGORY_ID": 2,
				"ITEM_ID": -1,
				"PARENT_ITEM_ID": 102092,
				"PRICE_FIXED_PORTION": 0,
				"TRANSACTION_CURRENCY_ID": "EUR",
				"PRICE_UNIT": 1,
				"PRICE_UNIT_UOM_ID": "PC",
				"PRICE_VARIABLE_PORTION": 0,
				"TOTAL_QUANTITY_DEPENDS_ON": 1,
				"QUANTITY": 1,
				"QUANTITY_UOM_ID": "PC",
				"TARGET_COST_CURRENCY_ID": "EUR"
			}]
			
+ Response (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"transactionaldata": [{
						"SESSION_ID": "I305774",
						"ITEM_ID": 102095,
						"CALCULATION_VERSION_ID": 3028,
						"PARENT_ITEM_ID": 102092,
						"PREDECESSOR_ITEM_ID": null,
						"IS_ACTIVE": 1,
						"STATUS": null,
						"ITEM_CATEGORY_ID": 2,
						"ACCOUNT_ID": null,
						"DOCUMENT_TYPE_ID": null,
						"DOCUMENT_ID": null,
						"DOCUMENT_VERSION": null,
						"DOCUMENT_PART": null,
						"DOCUMENT_STATUS_ID": null,
						"DESIGN_OFFICE_ID": null,
						"MATERIAL_ID": null,
						"MATERIAL_TYPE_ID": null,
						"MATERIAL_GROUP_ID": null,
						"OVERHEAD_GROUP_ID": null,
						"VALUATION_CLASS_ID": null,
						"ACTIVITY_TYPE_ID": null,
						"PROCESS_ID": null,
						"LOT_SIZE": null,
						"LOT_SIZE_CALCULATED": null,
						"LOT_SIZE_IS_MANUAL": null,
						"ENGINEERING_CHANGE_NUMBER_ID": null,
						"COMPANY_CODE_ID": null,
						"COST_CENTER_ID": null,
						"PLANT_ID": null,
						"WORK_CENTER_ID": null,
						"BUSINESS_AREA_ID": null,
						"PROFIT_CENTER_ID": null,
						"QUANTITY": "1",
						"QUANTITY_CALCULATED": null,
						"QUANTITY_IS_MANUAL": null,
						"QUANTITY_UOM_ID": "PC",
						"TOTAL_QUANTITY": null,
						"TOTAL_QUANTITY_UOM_ID": null,
						"TOTAL_QUANTITY_DEPENDS_ON": 1,
						"IS_RELEVANT_TO_COSTING_IN_ERP": null,
						"PRICE_FIXED_PORTION": "0",
						"PRICE_FIXED_PORTION_CALCULATED": null,
						"PRICE_FIXED_PORTION_IS_MANUAL": null,
						"PRICE_VARIABLE_PORTION": "0",
						"PRICE_VARIABLE_PORTION_CALCULATED": null,
						"PRICE_VARIABLE_PORTION_IS_MANUAL": null,
						"PRICE": null,
						"TRANSACTION_CURRENCY_ID": "EUR",
						"PRICE_UNIT": "1",
						"PRICE_UNIT_CALCULATED": null,
						"PRICE_UNIT_IS_MANUAL": null,
						"PRICE_UNIT_UOM_ID": "PC",
						"CONFIDENCE_LEVEL_ID": null,
						"PRICE_SOURCE_ID": null,
						"VENDOR_ID": null,
						"TARGET_COST": null,
						"TARGET_COST_CALCULATED": null,
						"TARGET_COST_IS_MANUAL": null,
						"TARGET_COST_CURRENCY_ID": "EUR",
						CREATED_ON: "2016-04-08T12:33:19.540Z",
						"CREATED_BY": "I305774",
						"LAST_MODIFIED_ON": "2016-04-08T12:33:19.540Z",
						"LAST_MODIFIED_BY": "I305774",
						"PRICE_FOR_TOTAL_QUANTITY": null,
						"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": null,
						"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": null,
						"OTHER_COST": null,
						"OTHER_COST_FIXED_PORTION": null,
						"OTHER_COST_VARIABLE_PORTION": null,
						"TOTAL_COST": null,
						"TOTAL_COST_FIXED_PORTION": null,
						"TOTAL_COST_VARIABLE_PORTION": null,
						"ITEM_DESCRIPTION": null,
						"COMMENT": null,
						"IS_DIRTY": 1,
						"IS_DELETED": 0,
						"HANDLE_ID": -1
					}],
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 102095,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "5",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": null,
							"PRICE_UNIT_UOM_ID": null,
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": null,
							"PRICE_VARIABLE_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						},
						{
							"ITEM_ID": 102092,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "5",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_UOM_ID": "PC",
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3028,
							"IS_DIRTY": 1
						}]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 404 (content-type:application/json; charset=utf-8)

	+ Body
	
			 {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "calculationVersionObjs": [
			                        {
			                            "id": CALCULATION_VERSION_ID
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
						
## Delete [DELETE]
Deletes an specific item from a speicifed calculation version

+ Parameters
	+ **calculate** *(optional, boolean, 'true')* ... Flag that indicates if a calculation is triggered for this calculation version

+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	+ Body
	
			[{
				"CALCULATION_VERSION_ID": 1031,
				"ITEM_ID": 100255
			}]
+ Response (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"transactionaldata": [],
					"calculated": {
						"ITEM_CALCULATED_FIELDS": [{
							"ITEM_ID": 102094,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "5",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": null,
							"PRICE_UNIT_UOM_ID": null,
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": null,
							"PRICE_VARIABLE_PORTION": null,
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						},
						{
							"ITEM_ID": 102092,
							"QUANTITY": null,
							"TOTAL_QUANTITY": "5",
							"TOTAL_QUANTITY_UOM_ID": "PC",
							"PRICE_UNIT": "1",
							"PRICE_UNIT_UOM_ID": "PC",
							"TARGET_COST": null,
							"LOT_SIZE": null,
							"PRICE_FIXED_PORTION": "0",
							"PRICE_VARIABLE_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_FIXED_PORTION": "0",
							"PRICE_FOR_TOTAL_QUANTITY_VARIABLE_PORTION": "0",
							"OTHER_COST_FIXED_PORTION": "0",
							"OTHER_COST_VARIABLE_PORTION": "0",
							"TOTAL_COST_FIXED_PORTION": "0",
							"TOTAL_COST_VARIABLE_PORTION": "0"
						}],
						"ITEM_CALCULATED_VALUES_COSTING_SHEET": [],
						"ITEM_CALCULATED_VALUES_COMPONENT_SPLIT": []
					}
				},
				"head": {
					"metadata": {
						"CalculationVersions": [{
							"CALCULATION_VERSION_ID": 3028,
							"IS_DIRTY": 1
						}]
					}
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 404 (content-type:application/json; charset=utf-8)

	+ Body
	
			 {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "itemObjs": [
			                        {
			                            "id": 100255
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/customfieldsformula/{?path, business_object , column, is_custom, lock}<a name="customfieldsformula"></a>
Service that provides CRUD opperations for metadata fields objects

## GET
Depends on parameters retrives an array that contains a complete metadata field or an array of complete metadata fields.
Requests to retrieve medata field that corespond for a given PATH, BUSINESS_OBJECT and COLUMN 
If no parameter is given then all fields are returned
For a given path return data that fits to the selected path, Ex. Admin, master data maintenance, calculation view, calculation version sidepane in calculation view, pane in calculation view
For given table_id return data for all columns for every entity: item, material 
For a given column_id and table_id will return actual field
Response will contain also if the data is locked or not by another user

+ Parameters
	+ **path** *(optional, string, 'cost_center.controlling_area')* ... used to describe what path is used to navigate through the client side models (business objects)
	+ **business_object** *(optional, string, 'material')* ... table from where the metadata field is taken, if not provided then will return for all, Ex: t_item, t_item_ext, t_material, t_material_ext fields. Must be validated if provided to be one of accepted values: item, material, etc
	+ **column** *(optional, string, 'ITEM')* ... column from base table or from extensions(t_item, t_item_ext, t_material, t_material_ext), if not provided then all fields for given table will be provided
	+ **is_custom** *(optional, boolean, 'false')* ... flag that specifies if the field is standard or custom
	+ **lock** *(optional, boolean, 'false')* ... flag used to set the lock on metadata business object
	
+ Request
	+ Headers
	
			Host:<hana host>:<port><instance> 
			Accept:application/json
	
+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"METADATA": [
						{
							"PATH": "Item.Calculation_Version",
							"BUSINESS_OBJECT": "Calculation_Version",
							"COLUMN_ID": "CALCULATION_VERSION_ID",
							"IS_CUSTOM": 0,
							"ROLLUP_TYPE_ID": 0,
							"SIDE_PANEL_GROUP_ID": null,
							"DISPLAY_ORDER": null,
							"TABLE_DISPLAY_ORDER": null,
							"REF_UOM_CURRENCY_PATH": null,
							"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
							"REF_UOM_CURRENCY_COLUMN_ID": null,
							"DIMENSION_ID": null,
							"UOM_CURRENCY_FLAG": null,
							"SEMANTIC_DATA_TYPE": "PositiveInteger",
							"SEMANTIC_DATA_TYPE_ATTRIBUTES": null,
							"PROPERTY_TYPE": null,
							"IS_IMMUTABLE_AFTER_SAVE": null,
							"IS_REQUIRED_IN_MASTERDATA": null,
							"IS_WILDCARD_ALLOWED": null,
							"IS_USABLE_IN_FORMULA": null,
							"RESOURCE_KEY_DISPLAY_NAME": null,
							"RESOURCE_KEY_DISPLAY_DESCRIPTION": null,
							CREATED_ON: null,
							"CREATED_BY": null,
							"LAST_MODIFIED_ON": null,
							"LAST_MODIFIED_BY": null,
							"VALIDATION_REGEX_ID": null,
							"VALIDATION_REGEX_VALUE": null,
							"TEXT": [],
							"ATTRIBUTES": [],
							"FORMULAS": [],
							"SELECTION_FILTER": [],
							"SELECTION_DISPLAYED": []
						}
					]
				},
				"head": {
					"metadata": {
						"metadata": [
							{
								"IS_LOCKED": 0,
								"ACTIVE_USERS": []
							}
						]
					}
				}
			}
	
			

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 404 (content-type:application/json; charset=utf-8)

	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "itemObjs": [
			                        {
			                            "id": 100255
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST 
Creates a new metadata entry field with an initial data stored, not all formulas must be provided. The client POSTs a serialized metadataField and the server will respond with the same object if everything is ok. There are no ID generated so we cannot send -1 or NULL so we will receive generated values! ?.
Create triggers for custom fields an alter to extension table! Supports batch opperation create, update and delete(only one operation is possible at a time/per request for the same field).

+ Request
	+ Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	 
			{
				"CREATE": [{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST",
					"ROLLUP_TYPE_ID": 0,
					"SIDE_PANEL_GROUP_ID": 1,
					"REF_UOM_CURRENCY_PATH": null,
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
					"REF_UOM_CURRENCY_COLUMN_ID": null,
					"UOM_CURRENCY_FLAG": 0,
					"SEMANTIC_DATA_TYPE": "Decimal",
					"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=20; scale=5",
					"PROPERTY_TYPE": 2,
					"TEXT": [{
						"PATH": "Item",
						"COLUMN_ID": "CUST_TEST",
						"LANGUAGE": "EN",
						"DISPLAY_NAME": "Splitting",
						"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters"
					},
					{
						"PATH": "Item",
						"COLUMN_ID": "CUST_TEST",
						"LANGUAGE": "DE",
						"DISPLAY_NAME": "Teilung",
						"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter"
					}],
					"ATTRIBUTES": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ITEM_CATEGORY_ID": 2,
						"IS_MANDATORY": 0,
						"IS_READ_ONLY": 0,
						"DEFAULT_VALUE": "0.2"
					}]
				}],
				"UPDATE": [{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST",
					"ROLLUP_TYPE_ID": 0,
					"SIDE_PANEL_GROUP_ID": 1,
					"REF_UOM_CURRENCY_PATH": null,
					"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
					"REF_UOM_CURRENCY_COLUMN_ID": null,
					"UOM_CURRENCY_FLAG": 0,
					"PROPERTY_TYPE": 2,
					"TEXT": [{
						"PATH": "Item",
						"COLUMN_ID": "CUST_TEST",
						"LANGUAGE": "EN",
						"DISPLAY_NAME": "Splitting",
						"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters"
					},
					{
						"PATH": "Item",
						"COLUMN_ID": "CUST_TEST",
						"LANGUAGE": "DE",
						"DISPLAY_NAME": "Teilung",
						"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter"
					}],
					"ATTRIBUTES": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ITEM_CATEGORY_ID": 2,
						"IS_MANDATORY": 0,
						"IS_READ_ONLY": 0,
						"DEFAULT_VALUE": "0.2"
					}]
				}],
				"DELETE": [{
					"PATH": "Item",
					"BUSINESS_OBJECT": "Item",
					"COLUMN_ID": "CUST_TEST"
				}]
			}


+ Response 200 (content-type:application/json; charset=utf-8)
	+ Body
	
			{
				"body": {
					"CREATE": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ROLLUP_TYPE_ID": 0,
						"SIDE_PANEL_GROUP_ID": 1,
						"REF_UOM_CURRENCY_PATH": null,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
						"REF_UOM_CURRENCY_COLUMN_ID": null,
						"UOM_CURRENCY_FLAG": 0,
						"SEMANTIC_DATA_TYPE": "Decimal",
						"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=16; scale=5",
						"PROPERTY_TYPE": 2,
						"TEXT": [{
							"PATH": "Item",
							"COLUMN_ID": "CUST_TEST",
							"LANGUAGE": "EN",
							"DISPLAY_NAME": "Splitting",
							"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters",
							CREATED_ON: "2016-04-11T07:56:51.947Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-11T07:56:51.947Z",
							"LAST_MODIFIED_BY": "I305774"
						},
						{
							"PATH": "Item",
							"COLUMN_ID": "CUST_TEST",
							"LANGUAGE": "DE",
							"DISPLAY_NAME": "Teilung",
							"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter",
							CREATED_ON: "2016-04-11T07:56:51.947Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-11T07:56:51.947Z",
							"LAST_MODIFIED_BY": "I305774"
						}],
						"ATTRIBUTES": [{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "CUST_TEST",
							"ITEM_CATEGORY_ID": 2,
							"IS_MANDATORY": 0,

							"IS_READ_ONLY": 1,
							"DEFAULT_VALUE": "0.2",
							"SUBITEM_STATE": -1,
							"IS_ACTIVE": 0,
							CREATED_ON: "2016-04-11T07:56:51.947Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-11T07:56:51.947Z",
							"LAST_MODIFIED_BY": "I305774"
						},
						{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "CUST_TEST",
							"ITEM_CATEGORY_ID": 2,
							"IS_MANDATORY": 0,

							"IS_READ_ONLY": 0,
							"DEFAULT_VALUE": "0.2",
							"SUBITEM_STATE": -1,
							"IS_ACTIVE": 1,
							CREATED_ON: "2016-04-11T07:56:51.947Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-11T07:56:51.947Z",
							"LAST_MODIFIED_BY": "I305774"
						}],
						"IS_CUSTOM": 1,
						"DISPLAY_ORDER": 500,
						"TABLE_DISPLAY_ORDER": null,
						"IS_IMMUTABLE_AFTER_SAVE": null,
						"IS_REQUIRED_IN_MASTERDATA": null,
						"RESOURCE_KEY_DISPLAY_NAME": null,
						"RESOURCE_KEY_DISPLAY_DESCRIPTION": null,
						"IS_WILDCARD_ALLOWED": null,
						"IS_USABLE_IN_FORMULA": 1,
						"DIMENSION_ID": null,
						CREATED_ON: "2016-04-11T07:56:51.947Z",
						"CREATED_BY": "I305774",
						"LAST_MODIFIED_ON": "2016-04-11T07:56:51.947Z",
						"LAST_MODIFIED_BY": "I305774",
						"FORMULAS": []
					}],
					"UPDATE": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST",
						"ROLLUP_TYPE_ID": 0,
						"SIDE_PANEL_GROUP_ID": 1,
						"REF_UOM_CURRENCY_PATH": null,
						"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
						"REF_UOM_CURRENCY_COLUMN_ID": null,
						"UOM_CURRENCY_FLAG": 0,
						"PROPERTY_TYPE": 2,
						"TEXT": [{
							"PATH": "Item",
							"COLUMN_ID": "CUST_TEST",
							"LANGUAGE": "EN",
							"DISPLAY_NAME": "Splitting",
							"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters"
						},
						{
							"PATH": "Item",
							"COLUMN_ID": "CUST_TEST",
							"LANGUAGE": "DE",
							"DISPLAY_NAME": "Teilung",
							"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter"
						}],
						"ATTRIBUTES": [{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "CUST_TEST",
							"ITEM_CATEGORY_ID": 2,
							"SUBITEM_STATE": -1,
							"IS_ACTIVE": 0,
							"IS_MANDATORY": null,
							"IS_READ_ONLY": 1,
							"IS_TRANSFERABLE": null,
							"DEFAULT_VALUE": "0.2",
							CREATED_ON: "2016-04-08T15:53:35.530Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-08T15:53:35.530Z",
							"LAST_MODIFIED_BY": "I305774"
						},
						{
							"PATH": "Item",
							"BUSINESS_OBJECT": "Item",
							"COLUMN_ID": "CUST_TEST",
							"ITEM_CATEGORY_ID": 2,
							"SUBITEM_STATE": -1,
							"IS_ACTIVE": 1,
							"IS_MANDATORY": null,
							"IS_READ_ONLY": 0,
							"IS_TRANSFERABLE": null,
							"DEFAULT_VALUE": "0.2",
							CREATED_ON: "2016-04-08T15:53:35.530Z",
							"CREATED_BY": "I305774",
							"LAST_MODIFIED_ON": "2016-04-08T15:53:35.530Z",
							"LAST_MODIFIED_BY": "I305774"
						}],
						"FORMULAS": []
					}],
					"DELETE": [{
						"PATH": "Item",
						"BUSINESS_OBJECT": "Item",
						"COLUMN_ID": "CUST_TEST"
					}]
				},
				"head": {
					"metadata": {
						"metadata": [{
							"IS_LOCKED": 0,
							"ACTIVE_USERS": []
						}]
					}
				}
			}

+ Response 400 (content-type:application/json; charset=utf-8)

	+ Body 
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
							"operation": "Delete",
							"severity": "Error",
							"details": {
								"metadataObjs": [
									{
										"PATH": "Item",
										"BUSINESS_OBJECT": "Item",
										"COLUMN_ID": "CUST_TEST"
									}
								],
								"metadataEntity": {
									"PATH": "Item",
									"BUSINESS_OBJECT": "Item",
									"COLUMN_ID": "CUST_TEST"
								}
							}
						}
					]
				}
			}
						
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
+ Response 500 (content-type:application/json; charset=utf-8)
	
	+ Body
	
			{
				"body": {},
				"head": {
					"messages": [
						{
							"code": "GENERAL_VALIDATION_ERROR",
							"severity": "Error",
							"details": {
								"metadataObjs": [
									[
										{
											"PATH": "Item",
											"BUSINESS_OBJECT": "Item",
											"COLUMN_ID": "CUST_TEST",
											"IS_CUSTOM": 1,
											"ROLLUP_TYPE_ID": 0,
											"SIDE_PANEL_GROUP_ID": 1,
											"DISPLAY_ORDER": 500,
											"TABLE_DISPLAY_ORDER": null,
											"REF_UOM_CURRENCY_PATH": null,
											"REF_UOM_CURRENCY_BUSINESS_OBJECT": null,
											"REF_UOM_CURRENCY_COLUMN_ID": null,
											"DIMENSION_ID": null,
											"UOM_CURRENCY_FLAG": 0,
											"SEMANTIC_DATA_TYPE": "Decimal",
											"SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=16; scale=5",
											"PROPERTY_TYPE": 2,
											"IS_IMMUTABLE_AFTER_SAVE": null,
											"IS_REQUIRED_IN_MASTERDATA": null,
											"IS_WILDCARD_ALLOWED": null,
											"IS_USABLE_IN_FORMULA": 1,
				
											"RESOURCE_KEY_DISPLAY_NAME": null,
											"RESOURCE_KEY_DISPLAY_DESCRIPTION": null,
											CREATED_ON: "2016-04-11T08:50:29.993Z",
											"CREATED_BY": "I305774",
											"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
											"LAST_MODIFIED_BY": "I305774",
											"VALIDATION_REGEX_ID": null,
											"VALIDATION_REGEX_VALUE": null,
											"DISPLAY_NAME": "Splitting",
											"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters",
											"TEXT": [
												{
													"PATH": "Item",
													"COLUMN_ID": "CUST_TEST",
													"LANGUAGE": "EN",
													"DISPLAY_NAME": "Splitting",
													"DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												},
												{
													"PATH": "Item",
													"COLUMN_ID": "CUST_TEST",
													"LANGUAGE": "DE",
													"DISPLAY_NAME": "Teilung",
													"DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												}
											],
											"ATTRIBUTES": [
												{
													"PATH": "Item",
													"BUSINESS_OBJECT": "Item",
													"COLUMN_ID": "CUST_TEST",
													"ITEM_CATEGORY_ID": 2,
													"SUBITEM_STATE": 0,
													"IS_ACTIVE": 0,
													"IS_MANDATORY": 0,
						
													"IS_READ_ONLY": 1,
													"IS_TRANSFERABLE": null,
													"DEFAULT_VALUE": "0.2",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												},
												{
													"PATH": "Item",
													"BUSINESS_OBJECT": "Item",
													"COLUMN_ID": "CUST_TEST",
													"ITEM_CATEGORY_ID": 2,
													"SUBITEM_STATE": 1,
													"IS_ACTIVE": 0,
													"IS_MANDATORY": 0,
						
													"IS_READ_ONLY": 1,
													"IS_TRANSFERABLE": null,
													"DEFAULT_VALUE": "0.2",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												},
												{
													"PATH": "Item",
													"BUSINESS_OBJECT": "Item",
													"COLUMN_ID": "CUST_TEST",
													"ITEM_CATEGORY_ID": 2,
													"SUBITEM_STATE": 0,
													"IS_ACTIVE": 1,
													"IS_MANDATORY": 0,
						
													"IS_READ_ONLY": 0,
													"IS_TRANSFERABLE": null,
													"DEFAULT_VALUE": "0.2",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												},
												{
													"PATH": "Item",
													"BUSINESS_OBJECT": "Item",
													"COLUMN_ID": "CUST_TEST",
													"ITEM_CATEGORY_ID": 2,
													"SUBITEM_STATE": 1,
													"IS_ACTIVE": 1,
													"IS_MANDATORY": 0,
						
													"IS_READ_ONLY": 0,
													"IS_TRANSFERABLE": null,
													"DEFAULT_VALUE": "0.2",
													CREATED_ON: "2016-04-11T08:50:29.993Z",
													"CREATED_BY": "I305774",
													"LAST_MODIFIED_ON": "2016-04-11T08:50:29.993Z",
													"LAST_MODIFIED_BY": "I305774"
												}
											],
											"FORMULAS": [],
											"SELECTION_FILTER": [],
											"SELECTION_DISPLAYED": []
										}
									]
								],
								"validationObj": {
									"columnIds": [
										{
											"columnId": "ROLLUP_TYPE"
										}
									],
									"validationInfoCode": "METADATA_ERROR"
								}
							}
						}
					]
				}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            [
			                {
			                    "message": {
			                        "code": {
			                            "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                            "responseCode": 500
			                        },
			                        "operation": "Create"
			                    },
			                    "details": {
			                        "PATH": "Item",
			                        "BUSINESS_OBJECT": "Item",
			                        "COLUMN_ID": "TEST1",
			                        "IS_CUSTOM": 1,
			                        "ROLLUP_TYPE_ID": 0,
			                        "SIDE_PANEL_GROUP_ID": 1,
			                        "DISPLAY_ORDER": 40,
			                        "UOM_CURRENCY_FLAG": 0,
			                        "SEMANTIC_DATA_TYPE": "Decimal",
			                        "SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=20; scale=5",
			                        "PROPERTY_TYPE": 2,
			                        "TEXT": [
			                            {
			                                "PATH": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "LANGUAGE": "EN",
			                                "DISPLAY_NAME": "Splitting",
			                                "DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters"
			                            },
			                            {
			                                "PATH": "Item",
			                                "COLUMN_ID": "SPLITTING",
			                                "LANGUAGE": "DE",
			                                "DISPLAY_NAME": "Teilung",
			                                "DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter"
			                            }
			                        ],
			                        "ATTRIBUTES": [
			                            {
			                                "PATH": "Item",
			                                "BUSINESS_OBJECT": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "ITEM_CATEGORY_ID": 2,
			                                "SUBITEM_STATE": -1,
			                                "IS_ACTIVE": 1,
			                                "IS_MANDATORY": 0,
			                                "IS_READ_ONLY": 0,
			                                "IS_TRANSFERABLE": 1,
			                                "DEFAULT_VALUE": "0.2"
			                            },
			                            {
			                                "PATH": "Item",
			                                "BUSINESS_OBJECT": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "ITEM_CATEGORY_ID": 2,
			                                "SUBITEM_STATE": -1,
			                                "IS_ACTIVE": 1,
			                                "IS_MANDATORY": 0,
			                                "IS_READ_ONLY": 0,
			                                "IS_TRANSFERABLE": 1,
			                                "DEFAULT_VALUE": "0.2"
			                            }
			                        ]
			                    }
			                },
			                {
			                    "message": {
			                        "code": {
			                            "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                            "responseCode": 500
			                        },
			                        "operation": "Update"
			                    },
			                    "details": {
			                        "PATH": "Item",
			                        "BUSINESS_OBJECT": "Item",
			                        "COLUMN_ID": "TEST1",
			                        "IS_CUSTOM": 1,
			                        "ROLLUP_TYPE_ID": 0,
			                        "SIDE_PANEL_GROUP_ID": 1,
			                        "DISPLAY_ORDER": 40,
			                        "UOM_CURRENCY_FLAG": 0,
			                        "SEMANTIC_DATA_TYPE": "Decimal",
			                        "SEMANTIC_DATA_TYPE_ATTRIBUTES": "precision=20; scale=5",
			                        "PROPERTY_TYPE": 2,
			                        "TEXT": [
			                            {
			                                "PATH": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "LANGUAGE": "EN",
			                                "DISPLAY_NAME": "Splitting",
			                                "DISPLAY_DESCRIPTION": "Splitting gives the thickness of a metal split in millimeters"
			                            },
			                            {
			                                "PATH": "Item",
			                                "COLUMN_ID": "SPLITTING",
			                                "LANGUAGE": "DE",
			                                "DISPLAY_NAME": "Teilung",
			                                "DISPLAY_DESCRIPTION": "Teilung gibt die Dicke der geschnittenen Metallteile in Millimeter"
			                            }
			                        ],
			                        "ATTRIBUTES": [
			                            {
			                                "PATH": "Item",
			                                "BUSINESS_OBJECT": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "ITEM_CATEGORY_ID": 2,
			                                "SUBITEM_STATE": -1,
			                                "IS_ACTIVE": 1,
			                                "IS_MANDATORY": 0,
			                                "IS_READ_ONLY": 0,
			                                "IS_TRANSFERABLE": 1,
			                                "DEFAULT_VALUE": "0.2"
			                            },
			                            {
			                                "PATH": "Item",
			                                "BUSINESS_OBJECT": "Item",
			                                "COLUMN_ID": "TEST1",
			                                "ITEM_CATEGORY_ID": 2,
			                                "SUBITEM_STATE": -1,
			                                "IS_ACTIVE": 1,
			                                "IS_MANDATORY": 0,
			                                "IS_READ_ONLY": 0,
			                                "IS_TRANSFERABLE": 1,
			                                "DEFAULT_VALUE": "0.2"
			                            }
			                        ]
			                    }
			                },
			                {
			                    "message": {
			                        "code": {
			                            "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                            "responseCode": 404
			                        },
			                        "operation": "Delete"
			                    },
			                    "details": {
			                        "PATH": "Item",
			                        "BUSINESS_OBJECT": "Item",
			                        "COLUMN_ID": "TEST1"
			                    }
			                },
							{
								"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
								"operation": "Delete",
								"severity": "Error",
								"details": {
									"metadataObjs": [
										{
											"PATH": "Item",
											"BUSINESS_OBJECT": "Item",
											"COLUMN_ID": "CUST_TEST2"
										}
									],
									"metadataEntity": {
										"PATH": "Item",
										"BUSINESS_OBJECT": "Item",
										"COLUMN_ID": "CUST_TEST2"
									}
								}
							}
			            ]
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/lock/<a name="lock"></a>
Release locks all objects for logged / current user

## DELETE
Release all locks for a specific user

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
    + Body

            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_SYSTEMMESSAGE_INFO",
			                "severity": "Info",
			                "details": {}
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

#/sap/plc/xs/rest/dispatcher.xsjs/plugin/{addinId}<a name="plugin"></a>
Gets configuration properties for a specific plugin

## GET
+ Parameters
	+ **addinId** *(required, string, '12036987')* - hash over plugin class 

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
    + Body

            {
			    "head": {},
			    "body": {
			        "transactionaldata": [
			            {
			                "PLUGIN_SETTINGS": {
			                    "HOST": "test.wdf.sap.corp",
			                    "INSTANCE": "123",
			                    "CLIENT": "899",
			                    "SYSTEM": "test"
			                }
			            }
			        ]
			    }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
						
+ Response 404 (application/json; charset=utf-8)
	+ Body
	
            {
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "details": {
			                    "pluginObjs": [
			                        {
			                            "id": "12036987"
			                        }
			                    ]
			                }
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/ping/<a name="ping"></a>
Checks if a connection can be establish with Hana

## GET

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
    + Body

            {
			    "head": {},
			    "body": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

#/sap/plc/xs/rest/dispatcher.xsjs/default-settings/{type}{?lock}<a name="default-settings"></a>
Gets default settings setup for global or user

## GET

+ Parameters
	+ **type** *(required, string, 'global')* ... type of the default settings requested
		+ Values
			+ 'global' 
			+ 'user'
	+ **lock** *(optional, bool, true)* ... paramter used for locking default-settings in pesimistic mode ( user wants to change values)
		+ Values
			+ 'true' 
			+ 'false'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			    "head": {
			        "metadata": {
			            "Default_Settings": [
			                {
			                    "IS_LOCKED": 0
			                }
			            ]
			        }
			    },
			    "body": {
			        "transactionaldata": [
			            {
			                "DEFAULT_SETTINGS": {
			                    "CONTROLLING_AREA": {
			                        "CONTROLLING_AREA_ID": "#CA1",
			                        "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			                        "_SOURCE": 1,
			                        "_CREATED_BY": " #CONTROLLER",
			                        "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			                    },
			                    "CURRENCY": {
			                        "CURRENCY_ID": "EUR",
			                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			                        "_SOURCE": 1,
			                        "_CREATED_BY": "#CONTROLLER",
			                        "CURRENCY_CODE": "EUR",
			                        "CURRENCY_DESCRIPTION": "Euro"
			                    }
			                }
			            }
			        ]
			    }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## PUT

+ Parameters
	+ **type** *(required, string, 'global')* ... type of the default settings requested
		+ Values
			+ 'global' 
			+ 'user'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
                "CONTROLLING_AREA_ID": "#CA1",
				"CONTROLLING_AREA_CURRENCY_ID": "EUR",
				"_VALID_FROM": "2000-01-01T00:00:00.000Z",
				"_SOURCE": 1,
				"_CREATED_BY": " #CONTROLLER",
				"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
            }
	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
				"body": {
					"DEFAULT_SETTINGS": {
						"CONTROLLING_AREA_ID": "#CA1",
						"CONTROLLING_AREA_CURRENCY_ID": "EUR",
						"_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_SOURCE": 1,
						"_CREATED_BY": " #CONTROLLER",
						"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1",
						"CONTROLLING_VERSION_ID": "",
						"COMPANY_CODE_ID": "",
						"PLANT_ID": "",
						"REPORT_CURRENCY_ID": "",
						"COMPONENT_SPLIT_ID": "",
						"COSTING_SHEET_ID": ""
					}
				},
				"head": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}	
			
## POST

+ Parameters
	+ **type** *(required, string, 'global')* ... type of the default settings requested
		+ Values
			+ 'global' 
			+ 'user'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
			    "CONTROLLING_AREA_ID": "#CA1",
			    "REPORT_CURRENCY_ID": "EUR"
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			    "head": {},
			    "body": {
			        "transactionaldata": [
			            {
			                "DEFAULT_SETTINGS": {
			                    "CONTROLLING_AREA_ID": "#CA1",
			                    "REPORT_CURRENCY_ID": "EUR"
			                }
			                
			            }
			        ]
			    }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}


#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-account"></a>
Gets information about Account masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Account')* ... type of the business object that is requested, for this section is used Account
		+ Values
			+ 'Account'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'ACCOUNT_ID%3d1000')* ... filter that will be used to filter returned data, Ex. ACCOUNT_ID=1000
	+ **searchAutocomplete** *(optional, string, 'Inspection')* ... filter data to start with a string, Ex. Inspection
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date	
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
				"head": {
					"metadata": {
						
					}
				},
				"body": {
					"transactionaldata": [{
						"ACCOUNT_ENTITIES": [{
							"ACCOUNT_ID": "#AC10",
							"CONTROLLING_AREA_ID": "#CA2",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER",
							"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
							"_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
							"ACCOUNT_DESCRIPTION": "Unspecified materials (Account 10)"
						}],
						"ACCOUNT_TEXT_ENTITIES": [{
							"ACCOUNT_ID": "#AC14",
							"CONTROLLING_AREA_ID": "#CA2",
							"LANGUAGE": "EN",
							"ACCOUNT_DESCRIPTION": "Raw materials w/o plant (Account 14)",
							"_VALID_FROM": "2000-01-01T00:00:00.000Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": " #CONTROLLER"
						}],
						"CONTROLLING_AREA_ENTITIES": [{
							"CONTROLLING_AREA_ID": "CA02",
							"CONTROLLING_AREA_CURRENCY_ID": "EUR",
							"_VALID_FROM": null,
							"_VALID_TO": null,
							"_SOURCE": 2,
							"_CREATED_BY": null,
							"_VALID_FROM_FIRST_VERSION": null,
							"_CREATED_BY_FIRST_VERSION": null,
							"CONTROLLING_AREA_DESCRIPTION": "CO Europe"
						}]
					}]
				}
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Account. Supports batch opperation , user can create, update or delete multiple Account objects.

+ Parameters
	+ **business_object** *(required, string, 'Account')* ... type of the business object that is requested, for this section is used Account
		+ Values
			+ 'Account'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"ACCOUNT_ENTITIES": [{
						"ACCOUNT_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000"
					}],
					"ACCOUNT_TEXT_ENTITIES": [{
						"ACCOUNT_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"ACCOUNT_DESCRIPTION": "PLC Test"
					}]
				},
				"UPDATE": {
					"ACCOUNT_ENTITIES": [],
					"ACCOUNT_TEXT_ENTITIES": [{
						"ACCOUNT_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T11:38:05.271Z",
						"ACCOUNT_DESCRIPTION": "PLC Test Updated"
					}]
				},
				"DELETE": {
					"ACCOUNT_ENTITIES": [{
						"ACCOUNT_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"_VALID_FROM": "2015-10-07T11:38:05.197Z"
					}],
					"ACCOUNT_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)

    + Body

            {
				"head": {},
				"body": {
					"transactionaldata": [{
						"CREATE": {
							"ACCOUNT_ENTITIES": [{
								"ACCOUNT_ID": "ZTEST",
								"CONTROLLING_AREA_ID": "1000",
								"_VALID_FROM": "2015-11-16T14:03:37.003Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "I309362"
							}],
							"ACCOUNT_TEXT_ENTITIES": [{
								"ACCOUNT_ID": "ZTEST",
								"CONTROLLING_AREA_ID": "1000",
								"LANGUAGE": "EN",
								"ACCOUNT_DESCRIPTION": "PLC Test",
								"_VALID_FROM": "2015-11-16T14:03:37.086Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "I309362"
							}]
						}
					}]
				}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
				"head": {
					"messages": [{
						"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
						"severity": "Error",
						"operation": "Delete",
						"details": {
							"administrationObj": {
								"ACCOUNT_ENTITIES": [{
									"ACCOUNT_ID": "ZTEST",
									"CONTROLLING_AREA_ID": "1000",
									"_VALID_FROM": "2015-10-07T11:38:05.197Z"
								}]
							},
							"administrationObjType": "MainObj"
						}
					},
					{
						"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
						"severity": "Error",
						"operation": "Update",
						"details": {
							"administrationObj": {
								"ACCOUNT_TEXT_ENTITIES": [{
									"ACCOUNT_ID": "ZTEST",
									"CONTROLLING_AREA_ID": "1000",
									"LANGUAGE": "EN",
									"_VALID_FROM": "2015-10-07T11:38:05.271Z",
									"ACCOUNT_DESCRIPTION": "PLC Test Updated"
								}]
							},
							"administrationObjType": "TextObj"
						}
					}]
				},
				"body": {
					
				}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?lock}{?masterdataTimestamp}<a name="administration-account-group"></a>
Gets information about Account Group masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Account_Group')* ... type of the business object that is requested, for this section is used Account_Group
		+ Values
			+ 'Account_Group'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 110)* ... filter that will be used to filter returned data, Ex. ACCOUNT_GROUP_ID=110
	+ **searchAutocomplete** *(optional, string, 'CA1')* ... filter data to start with a string, Ex. CA1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	+ **lock** *(optional, bool, true)* ... parameter used for locking default-settings in pesimistic mode ( user wants to change values)
		+ Values
			+ 'true' 
			+ 'false'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "head": {
			    "metadata": {
			      "Account_Group": [
			        {}
			      ]
			    }
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "ACCOUNT_GROUP_ENTITIES": [
			          {
			            "ACCOUNT_GROUP_ID": 110,
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COST_PORTION": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "ACCOUNT_GROUP_DESCRIPTION": "Materials (AG 110)"
			          },
			          {
			            "ACCOUNT_GROUP_ID": 111,
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COST_PORTION": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "ACCOUNT_GROUP_DESCRIPTION": "Raw materials (AG 111)"
			          }
			        ],
			        "ACCOUNT_GROUP_TEXT_ENTITIES": [
			          {
			            "ACCOUNT_GROUP_ID": 110,
			            "LANGUAGE": "EN",
			            "ACCOUNT_GROUP_DESCRIPTION": "Materials (AG 110)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "ACCOUNT_GROUP_ID": 120,
			            "LANGUAGE": "EN",
			            "ACCOUNT_GROUP_DESCRIPTION": "Activities (AG 120)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ],
			        "ACCOUNT_RANGES_ENTITIES": [
			          {
			            "FROM_ACCOUNT_ID": "#AC10",
			            "TO_ACCOUNT_ID": "#AC19",
			            "ACCOUNT_GROUP_ID": 210,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER"
			          },
			          {
			            "FROM_ACCOUNT_ID": "#AC10",
			            "ACCOUNT_GROUP_ID": 214,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER"
			          }
			        ],
			        "ACCOUNT_ENTITIES": [
			          {
			            "ACCOUNT_ID": "#AC11",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "ACCOUNT_DESCRIPTION": "Raw materials (Account 11)"
			          },
			          {
			            "ACCOUNT_ID": "#AC11",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "ACCOUNT_DESCRIPTION": "Raw materials (Account 11)"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "CONTROLLING_AREA_CURRENCY_ID": "USD",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Account Group. Supports batch opperation , user can create, update or delete multiple Account Group objects.

+ Parameters
	+ **business_object** *(required, string, 'Account_Group')* ... type of the business object that is requested, for this section is used Account Group
		+ Values
			+ 'Account_Group'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"ACCOUNT_GROUP_ENTITIES": [{
						"ACCOUNT_GROUP_ID": 999,
						"CONTROLLING_AREA_ID": "1000",
						"COST_PORTION": 3
					}],
					"ACCOUNT_GROUP_TEXT_ENTITIES": [{
						"ACCOUNT_GROUP_ID": 999,
						"LANGUAGE": "EN",
						"ACCOUNT_GROUP_DESCRIPTION": "PLC TEST"
					}],
					"ACCOUNT_RANGES_ENTITIES": [{
						"FROM_ACCOUNT_ID": "21000",
						"TO_ACCOUNT_ID": "21000",
						"ACCOUNT_GROUP_ID": 999
					}]
				},
				"UPDATE": {
					"ACCOUNT_GROUP_ENTITIES": [{
						"ACCOUNT_GROUP_ID": 999,
						"CONTROLLING_AREA_ID": "1000",
						"COST_PORTION": 3,
						"_VALID_FROM": "2015-10-07T11:48:03.511Z"
					}],
					"ACCOUNT_GROUP_TEXT_ENTITIES": [{
						"ACCOUNT_GROUP_ID": 999,
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T11:48:03.605Z",
						"ACCOUNT_GROUP_DESCRIPTION": "PLC TEST UPODATED"
					}],
					"ACCOUNT_RANGES_ENTITIES": [{
						"FROM_ACCOUNT_ID": "21000",
						"TO_ACCOUNT_ID": "215600000",
						"ACCOUNT_GROUP_ID": 999
					}]
				},
				"DELETE": {
					"ACCOUNT_GROUP_ENTITIES": [{
						"ACCOUNT_GROUP_ID": 999,
						"_VALID_FROM": "2015-10-07T11:48:46.994Z"
					}],
					"ACCOUNT_GROUP_TEXT_ENTITIES": [],
					"ACCOUNT_RANGES_ENTITIES": []
				}
			}
	
+ Response 201 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "ACCOUNT_GROUP_ENTITIES": [
			            {
			              "ACCOUNT_GROUP_ID": 999,
			              "CONTROLLING_AREA_ID": "#CA1",
			              "COST_PORTION": 3,
			              "_VALID_FROM": "2015-11-16T14:44:15.663Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "ACCOUNT_GROUP_TEXT_ENTITIES": [
			            {
			              "ACCOUNT_GROUP_ID": 999,
			              "LANGUAGE": "EN",
			              "ACCOUNT_GROUP_DESCRIPTION": "PLC TEST",
			              "_VALID_FROM": "2015-11-16T14:44:15.675Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "ACCOUNT_RANGES_ENTITIES": [
			            {
			              "FROM_ACCOUNT_ID": "21000",
			              "TO_ACCOUNT_ID": "21000",
			              "ACCOUNT_GROUP_ID": 999,
			              "_VALID_FROM": "2015-11-16T14:44:15.687Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"ACCOUNT_GROUP_ENTITIES": [
							{
								"ACCOUNT_GROUP_ID": 999,
								"CONTROLLING_AREA_ID": "1000",
								"COST_PORTION": 4,
								"_VALID_FROM": "2016-04-11T13:35:15.805Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "I305774"
							}
						],
						"ACCOUNT_GROUP_TEXT_ENTITIES": [
							{
								"ACCOUNT_GROUP_ID": 999,
								"LANGUAGE": "EN",
								"_VALID_FROM": "2016-04-11T13:35:15.805Z",
								"ACCOUNT_GROUP_DESCRIPTION": "Test TEST",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "I305774"
							}
						],
						"ACCOUNT_RANGES_ENTITIES": [
							{
								"FROM_ACCOUNT_ID": "21000",
								"TO_ACCOUNT_ID": "21000",
								"ACCOUNT_GROUP_ID": 999,
								"_VALID_FROM": "2016-04-11T13:35:15.805Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "I305774"
							}
						]
					}
			      },
				  "DELETE": {
                    "ACCOUNT_GROUP_ENTITIES": [
                        {
                            "ACCOUNT_GROUP_ID": 999,
                            "CONTROLLING_AREA_ID": "1000",
                            "COST_PORTION": 4,
                            "_VALID_FROM": "2016-04-11T13:35:15.805Z",
                            "_VALID_TO": "2016-04-11T13:36:12.499Z",
                            "_SOURCE": 1,
                            "_CREATED_BY": "I305774"
                        }
                    ],
                    "ACCOUNT_GROUP_TEXT_ENTITIES": []
                  }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "ACCOUNT_GROUP_ENTITIES": [
			              {
			                "ACCOUNT_GROUP_ID": 999,
                            "_VALID_FROM": "2015-10-07T11:48:46.994Z"
			              }
			            ]
			          }
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "ACCOUNT_GROUP_TEXT_ENTITIES": [
			              {
			                "ACCOUNT_GROUP_ID": 999,
							"LANGUAGE": "EN",
							"_VALID_FROM": "2015-10-07T11:48:03.605Z",
							"ACCOUNT_GROUP_DESCRIPTION": "PLC TEST UPODATED"
			              }
			            ]
			          }
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-activity-price"></a>
Gets information about Activity Price masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Activity_Price')* ... type of the business object that is requested, for this section is used Activity Price
		+ Values
			+ 'Activity_Price'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, '#AT6')* ... filter that will be used to filter returned data, Ex. ACTIVITY_TYPE_ID=#AT6
	+ **searchAutocomplete** *(optional, string, '#AT6')* ... filter data to start with a string, Ex. #AT6
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "ACTIVITY_PRICE_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 301,
			            "CONTROLLING_AREA_ID": "#CA2",
			            "COST_CENTER_ID": "",
			            "ACTIVITY_TYPE_ID": "#AT6",
			            "CONTROLLING_VERSION_ID": "",
			            "VALID_FROM": "2017-01-01T00:00:00.000Z",
						"VALID_TO": null,
			            "PRICE_FIXED_PORTION": "18",
			            "PRICE_VARIABLE_PORTION": "9",
			            "TRANSACTION_CURRENCY_ID": "USD",
			            "PRICE_UNIT": "10",
			            "PRICE_UNIT_UOM_ID": "H",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ],
			        "ACTIVITY_TYPE_ENTITIES": [
			          {
			            "ACTIVITY_TYPE_ID": "#AT6",
			            "CONTROLLING_AREA_ID": "#CA2",
			            "ACCOUNT_ID": "#AC23",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "ACTIVITY_TYPE_DESCRIPTION": "Activity Type 6 (machine)"
			          }
			        ],
			        "ACCOUNT_ENTITIES": [
			          {
			            "ACCOUNT_ID": "#AC23",
			            "CONTROLLING_AREA_ID": "#CA2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null, 
			            "ACCOUNT_DESCRIPTION": "Activities - machine (Account 23)"
			          },
			          {
			            "ACCOUNT_ID": "#AC23",
			            "CONTROLLING_AREA_ID": "#CA2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "ACCOUNT_DESCRIPTION": "Activities - machine 1 (Account 23)"
			          }
			        ],
			        "COST_CENTER_ENTITIES": [],
			        "CONTROLLING_VERSION_ENTITIES": [],
			        "PRICE_SOURCE_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 301,
			            "CONFIDENCE_LEVEL_ID": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PRICE_SOURCE_DESCRIPTION": "PLC Standard Rate"
			          }
			        ],
			        "CONFIDENCE_LEVEL_ENTITIES": [
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Medium"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "CONTROLLING_AREA_CURRENCY_ID": "USD",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null, 
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Activity Price. Supports batch opperation , user can create, update or delete multiple Activity Price objects.

+ Parameters
	+ **business_object** *(required, string, 'Activity_Price')* ... type of the business object that is requested, for this section is used Activity Price
		+ Values
			+ 'Activity_Price'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
			  "CREATE": {
				"ACTIVITY_PRICE_ENTITIES": [
				  {
					"PRICE_SOURCE_ID": "301",
					"VALID_FROM": "2016-04-11T00:00:00Z",
					"PRICE_FIXED_PORTION": 12,
					"PRICE_VARIABLE_PORTION": 10,
					"TRANSACTION_CURRENCY_ID": "EUR",
					"PRICE_UNIT": 1,
					"PRICE_UNIT_UOM_ID": "H"
				  }
				]
			  },
			  "UPDATE": {
				"ACTIVITY_PRICE_ENTITIES": [
				  {
					"PRICE_SOURCE_ID": "301",
					"COST_CENTER_ID": "",
					"ACTIVITY_TYPE_ID": "",
					"VALID_FROM": "2016-04-11T00:00:00Z",
					"PRICE_FIXED_PORTION": 24,
					"PRICE_VARIABLE_PORTION": 10,
					"TRANSACTION_CURRENCY_ID": "BRL",
					"PRICE_UNIT": 1,
					"PRICE_UNIT_UOM_ID": "H",
					"_VALID_FROM": "2016-04-11T14:58:12.875Z"
				  }
				]
			  },
			  "DELETE": {
				"ACTIVITY_PRICE_ENTITIES": [
					{
						"PRICE_SOURCE_ID": "301",
						"VALID_FROM": "2016-04-12T00:00:00Z",
						"PRICE_FIXED_PORTION": 0,
						"PRICE_VARIABLE_PORTION": 0,
						"PRICE_UNIT": 0,
						"_VALID_FROM": "2016-04-12T10:34:41.757Z"
					}
				]
			  }
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "body": {
				"transactionaldata": [
				  {
					"CREATE": {
					  "ACTIVITY_PRICE_ENTITIES": [
						{
						  "PRICE_SOURCE_ID": "301",
						  "VALID_FROM": "2016-04-11",
						  "PRICE_FIXED_PORTION": 12,
						  "PRICE_VARIABLE_PORTION": 10,
						  "TRANSACTION_CURRENCY_ID": "EUR",
						  "PRICE_UNIT": 1,
						  "PRICE_UNIT_UOM_ID": "H",
						  "CONTROLLING_AREA_ID": "",
						  "COST_CENTER_ID": "",
						  "ACTIVITY_TYPE_ID": "",
						  "CONTROLLING_VERSION_ID": "",
						  "_VALID_FROM": "2016-04-11T14:58:12.875Z",
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ]
					},
					"UPDATE": {
					  "ACTIVITY_PRICE_ENTITIES": [
						{
						  "PRICE_SOURCE_ID": "301",
						  "COST_CENTER_ID": "",
						  "ACTIVITY_TYPE_ID": "",
						  "VALID_FROM": "2016-04-11",
						  "PRICE_FIXED_PORTION": 24,
						  "PRICE_VARIABLE_PORTION": 10,
						  "TRANSACTION_CURRENCY_ID": "BRL",
						  "PRICE_UNIT": 1,
						  "PRICE_UNIT_UOM_ID": "H",
						  "_VALID_FROM": "2016-04-12T08:33:22.832Z",
						  "CONTROLLING_AREA_ID": "",
						  "CONTROLLING_VERSION_ID": "",
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ]
					},
					"DELETE": {
					  "ACTIVITY_PRICE_ENTITIES": [
						{
						  "PRICE_SOURCE_ID": "301",
						  "CONTROLLING_AREA_ID": "",
						  "COST_CENTER_ID": "",
						  "ACTIVITY_TYPE_ID": "",
						  "CONTROLLING_VERSION_ID": "",
						  "VALID_FROM": "2016-04-12T00:00:00.000Z",
						  "VALID_TO": null,
						  "PRICE_FIXED_PORTION": "10",
						  "PRICE_VARIABLE_PORTION": "20",
						  "TRANSACTION_CURRENCY_ID": "EUR",
						  "PRICE_UNIT": "1",
						  "PRICE_UNIT_UOM_ID": "H",
						  "_VALID_FROM": "2016-04-12T10:34:41.757Z",
						  "_VALID_TO": "2016-04-12T10:35:11.942Z",
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ]
					}
				  }
				]
			  },
			  "head": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "ACTIVITY_PRICE_ENTITIES": [
			              {
								"PRICE_SOURCE_ID": "30234",
                                "CONTROLLING_AREA_ID": "",
                                "COST_CENTER_ID": "",
                                "ACTIVITY_TYPE_ID": "",
                                "VALID_FROM": "2015-10-07",
                                "VALID_TO": "2015-10-31",
                                "PRICE_FIXED_PORTION": 1,
                                "PRICE_VARIABLE_PORTION": 1,
                                "TRANSACTION_CURRENCY_ID": "EUR",
                                "PRICE_UNIT": 2,
                                "PRICE_UNIT_UOM_ID": "H",
                                "_VALID_FROM": "2016-04-11T14:58:12.875Z",
                                "CONTROLLING_VERSION_ID": ""
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "ACTIVITY_PRICE_ENTITIES": [
			              {
								"PRICE_SOURCE_ID": "30234",
                                "CONTROLLING_AREA_ID": "",
                                "COST_CENTER_ID": "",
                                "ACTIVITY_TYPE_ID": "",
                                "VALID_FROM": "2015-10-07",
                                "VALID_TO": "2015-10-31",
                                "PRICE_FIXED_PORTION": 1,
                                "PRICE_VARIABLE_PORTION": 1,
                                "TRANSACTION_CURRENCY_ID": "EUR",
                                "PRICE_UNIT": 2,
                                "PRICE_UNIT_UOM_ID": "H",
                                "_VALID_FROM": "2016-04-11T14:58:12.875Z",
                                "CONTROLLING_VERSION_ID": ""
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-activity-type"></a>
Gets information about Activity Type masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Activity_Type')* ... type of the business object that is requested, for this section is used Activity Type
		+ Values
			+ 'Activity_Type'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, '#AT6')* ... filter that will be used to filter returned data, Ex. ACTIVITY_TYPE_ID=#AT6
	+ **searchAutocomplete** *(optional, string, '#AT6')* ... filter data to start with a string, Ex. #AT6
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date		

+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
		
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "ACTIVITY_TYPE_ENTITIES": [
			          {
			            "ACTIVITY_TYPE_ID": "#AT1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "ACCOUNT_ID": "#AC21",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "ACTIVITY_TYPE_DESCRIPTION": "Activity Type 1 (setup)"
			          }
			        ],
			        "ACCOUNT_ENTITIES": [
			          {
			            "ACCOUNT_ID": "#AC21",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "ACCOUNT_DESCRIPTION": "Activities - setup (Account 21)"
			          },
			          {
			            "ACCOUNT_ID": "#AC21",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "ACCOUNT_DESCRIPTION": "Activities - setup 1 (Account 21)"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "ACTIVITY_TYPE_TEXT_ENTITIES": [
			          {
			            "ACTIVITY_TYPE_ID": "#AT1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "EN",
			            "ACTIVITY_TYPE_DESCRIPTION": "Activity Type 1 (setup)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "ACTIVITY_TYPE_ID": "#AT1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "DE",
			            "ACTIVITY_TYPE_DESCRIPTION": "Leistungsart 1 (Rüsten)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Activity Type. Supports batch opperation , user can create, update or delete multiple Activity Type objects.

+ Parameters
	+ **business_object** *(required, string, 'Activity_Type')* ... type of the business object that is requested, for this section is used Activity Type
		+ Values
			+ 'Activity_Type'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"ACTIVITY_TYPE_ENTITIES": [{
						"ACTIVITY_TYPE_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"ACCOUNT_ID": "11000"
					}],
					"ACTIVITY_TYPE_TEXT_ENTITIES": [{
						"ACTIVITY_TYPE_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"ACTIVITY_TYPE_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"ACTIVITY_TYPE_ENTITIES": [{
						"ACTIVITY_TYPE_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"ACCOUNT_ID": "21000",
						"_VALID_FROM": "2015-10-07T15:04:17.474Z"
					}],
					"ACTIVITY_TYPE_TEXT_ENTITIES": [{
						"ACTIVITY_TYPE_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T15:04:17.576Z",
						"ACTIVITY_TYPE_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"ACTIVITY_TYPE_ENTITIES": [{
						"ACTIVITY_TYPE_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"_VALID_FROM": "2015-10-07T15:04:32.274Z"
					}],
					"ACTIVITY_TYPE_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "ACTIVITY_TYPE_ENTITIES": [
			            {
			              "ACTIVITY_TYPE_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "ACCOUNT_ID": "11000",
			              "_VALID_FROM": "2015-11-17T08:32:22.015Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "ACTIVITY_TYPE_TEXT_ENTITIES": [
			            {
			              "ACTIVITY_TYPE_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "LANGUAGE": "EN",
			              "ACTIVITY_TYPE_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T08:32:22.070Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACTIVITY_TYPE_TEXT_ENTITIES": []
					},
					"DELETE": {
						"ACTIVITY_TYPE_ENTITIES": [],
						"ACTIVITY_TYPE_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "ACTIVITY_TYPE_ENTITIES": [
			              {
			                "ACTIVITY_TYPE_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "_VALID_FROM": "2015-10-07T15:04:32.274Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "ACTIVITY_TYPE_ENTITIES": [
			              {
			                "ACTIVITY_TYPE_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "ACCOUNT_ID": "21000",
			                "_VALID_FROM": "2015-10-07T15:04:17.474Z"
			              }
			            ]
			          }
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "ACTIVITY_TYPE_TEXT_ENTITIES": [
			              {
			                "ACTIVITY_TYPE_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T15:04:17.576Z",
			                "ACTIVITY_TYPE_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-business-area"></a>
Gets information about Business Area masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Business_Area')* ... type of the business object that is requested, for this section is used Business Area
		+ Values
			+ 'Business_Area'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, '4000')* ... filter that will be used to filter returned data, Ex. =BUSINESS_AREA_ID=4000
	+ **searchAutocomplete** *(optional, string, '4000')* ... filter data to start with a string, Ex. 4000
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
		
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "BUSINESS_AREA_ENTITIES": [
			          {
			            "BUSINESS_AREA_ID": "#BA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "BUSINESS_AREA_DESCRIPTION": "Business Area 1"
			          }
			        ],
			        "BUSINESS_AREA_TEXT_ENTITIES": [
			          {
			            "BUSINESS_AREA_ID": "#BA1",
			            "LANGUAGE": "EN",
			            "BUSINESS_AREA_DESCRIPTION": "Business Area 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "BUSINESS_AREA_ID": "#BA1",
			            "LANGUAGE": "DE",
			            "BUSINESS_AREA_DESCRIPTION": "Geschäftsbereich 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Business Area. Supports batch opperation , user can create, update or delete multiple Business Area objects.

+ Parameters
	+ **business_object** *(required, string, 'Business_Area')* ... type of the business object that is requested, for this section is used Business Area
		+ Values
			+ 'Business_Area'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"BUSINESS_AREA_ENTITIES": [{
						"BUSINESS_AREA_ID": "ZTES"
					}],
					"BUSINESS_AREA_TEXT_ENTITIES": [{
						"BUSINESS_AREA_ID": "ZTES",
						"LANGUAGE": "EN",
						"BUSINESS_AREA_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"BUSINESS_AREA_ENTITIES": [],
					"BUSINESS_AREA_TEXT_ENTITIES": [{
						"BUSINESS_AREA_ID": "ZTES",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T14:57:38.084Z",
						"BUSINESS_AREA_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"BUSINESS_AREA_ENTITIES": [{
						"BUSINESS_AREA_ID": "ZTES",
						"_VALID_FROM": "2015-10-07T14:57:38.063Z"
					}],
					"BUSINESS_AREA_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)

    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "BUSINESS_AREA_ENTITIES": [
			            {
			              "BUSINESS_AREA_ID": "ZTES",
			              "_VALID_FROM": "2015-11-17T08:41:31.530Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "BUSINESS_AREA_TEXT_ENTITIES": [
			            {
			              "BUSINESS_AREA_ID": "ZTES",
			              "LANGUAGE": "EN",
			              "BUSINESS_AREA_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T08:41:31.541Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"BUSINESS_AREA_ENTITIES": [],
						"BUSINESS_AREA_TEXT_ENTITIES": []
					},
					"DELETE": {
						"BUSINESS_AREA_ENTITIES": [],
						"BUSINESS_AREA_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "BUSINESS_AREA_ENTITIES": [
			              {
			                "BUSINESS_AREA_ID": "ZTES",
			                "_VALID_FROM": "2015-10-07T14:57:38.063Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "BUSINESS_AREA_TEXT_ENTITIES": [
			              {
			                "BUSINESS_AREA_ID": "ZTES",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T14:57:38.084Z",
			                "BUSINESS_AREA_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-process"></a>
Gets information about Process masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Process')* ... type of the business object that is requested, for this section is used Process
		+ Values
			+ 'Process'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, '#BP1')* ... filter that will be used to filter returned data, Ex. =PROCESS_ID=#BP1
	+ **searchAutocomplete** *(optional, string, '#BP1')* ... filter data to start with a string, Ex. #BP1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "PROCESS_ENTITIES": [
			          {
			            "PROCESS_ID": "#BP1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "ACCOUNT_ID": "#AC41",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "PROCESS_DESCRIPTION": "Plan work"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "ACCOUNT_ENTITIES": [
			          {
			            "ACCOUNT_ID": "#AC41",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "ACCOUNT_DESCRIPTION": "Plan work (Account 41)"
			          }
			        ],
			        "PROCESS_TEXT_ENTITIES": [
			          {
			            "PROCESS_ID": "#BP1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "DE",
			            "PROCESS_DESCRIPTION": "Arbeitsvorbereitung",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "PROCESS_ID": "#BP1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "EN",
			            "PROCESS_DESCRIPTION": "Plan work",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-company-code"></a>
Gets information about Company Code masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Company_Code')* ... type of the business object that is requested, for this section is used Company Code
		+ Values
			+ 'Company_Code'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'COMPANY_CODE_ID%3d0001')* ... filter that will be used to filter returned data, Ex. =COMPANY_CODE_ID=0001
	+ **searchAutocomplete** *(optional, string, 'AC')* ... filter data to start with a string, Ex. AC
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
		
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "COMPANY_CODE_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COMPANY_CODE_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "COMPANY_CODE_DESCRIPTION": "Company 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "COMPANY_CODE_TEXT_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "LANGUAGE": "EN",
			            "COMPANY_CODE_DESCRIPTION": "Company 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "LANGUAGE": "DE",
			            "COMPANY_CODE_DESCRIPTION": "Buchungskreis 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Company Code. Supports batch opperation , user can create, update or delete multiple Company Code objects.

+ Parameters
	+ **business_object** *(required, string, 'Company_Code')* ... type of the business object that is requested, for this section is used Company Code
		+ Values
			+ 'Company_Code'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"COMPANY_CODE_ENTITIES": [{
						"COMPANY_CODE_ID": "ZTES",
						"CONTROLLING_AREA_ID": "1000"
					}],
					"COMPANY_CODE_TEXT_ENTITIES": [{
						"COMPANY_CODE_ID": "ZTES",
						"LANGUAGE": "EN",
						"COMPANY_CODE_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"COMPANY_CODE_ENTITIES": [{
						"COMPANY_CODE_ID": "ZTES",
						"CONTROLLING_AREA_ID": "1000",
						"COMPANY_CODE_CURRENCY_ID": "EUR",
						"_VALID_FROM": "2015-10-07T14:31:04.121Z"
					}],
					"COMPANY_CODE_TEXT_ENTITIES": [{
						"COMPANY_CODE_ID": "ZTES",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T14:31:04.14Z",
						"COMPANY_CODE_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"COMPANY_CODE_ENTITIES": [{
						"COMPANY_CODE_ID": "ZTES",
						"_VALID_FROM": "2015-10-07T14:31:21.168Z"
					}],
					"COMPANY_CODE_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "COMPANY_CODE_ENTITIES": [
			            {
			              "COMPANY_CODE_ID": "ZTES",
			              "CONTROLLING_AREA_ID": "1000",
			              "_VALID_FROM": "2015-11-17T08:58:48.778Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "COMPANY_CODE_TEXT_ENTITIES": [
			            {
			              "COMPANY_CODE_ID": "ZTES",
			              "LANGUAGE": "EN",
			              "COMPANY_CODE_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T08:58:48.793Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"COMPANY_CODE_ENTITIES": [],
						"COMPANY_CODE_TEXT_ENTITIES": []
					},
					"DELETE": {
						"COMPANY_CODE_ENTITIES": [],
						"COMPANY_CODE_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "COMPANY_CODE_ENTITIES": [
			              {
			                "COMPANY_CODE_ID": "ZTES",
			                "_VALID_FROM": "2015-10-07T14:31:21.168Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COMPANY_CODE_ENTITIES": [
			              {
			                "COMPANY_CODE_ID": "ZTES",
			                "CONTROLLING_AREA_ID": "1000",
			                "COMPANY_CODE_CURRENCY_ID": "EUR",
			                "_VALID_FROM": "2015-10-07T14:31:04.121Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COMPANY_CODE_TEXT_ENTITIES": [
			              {
			                "COMPANY_CODE_ID": "ZTES",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T14:31:04.14Z",
			                "COMPANY_CODE_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?lock}{?masterdataTimestamp}<a name="administration-component-split"></a>
Gets information about Component Split masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Component Split
		+ Values
			+ 'Component_Split'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'COMPONENT_SPLIT_ID%TEST')* ... filter that will be used to filter returned data, Ex. =COMPONENT_SPLIT_ID=TEST
	+ **searchAutocomplete** *(optional, string, 'TEST')* ... filter data to start with a string, Ex. TEST
	+ **lock** *(optional, bool, true)* ... paramter used for locking default-settings in pesimistic mode ( user wants to change values)
		+ Values
			+ 'true' 
			+ 'false'
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "head": {
			    "metadata": {
			      "Component_Split": [
			        {
			          "IS_LOCKED": 0
			        }
			      ]
			    }
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "COMPONENT_SPLIT_ENTITIES": [
			          {
			            "COMPONENT_SPLIT_ID": "#SPLIT_ACTIVITIES",
			            "CONTROLLING_AREA_ID": "#CA2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "COMPONENT_SPLIT_DESCRIPTION": "Cost Component Split (activities)"
			          }
			        ],
			        "COMPONENT_SPLIT_TEXT_ENTITIES": [
			          {
			            "COMPONENT_SPLIT_ID": "#SPLIT_ACTIVITIES",
			            "LANGUAGE": "DE",
			            "COMPONENT_SPLIT_DESCRIPTION": "Kostenschichtung (Leistungen)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "COMPONENT_SPLIT_ID": "#SPLIT_ACTIVITIES",
			            "LANGUAGE": "EN",
			            "COMPONENT_SPLIT_DESCRIPTION": "Cost Component Split (activities)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ],
			        "SELECTED_ACCOUNT_GROUPS_ENTITIES": [
			          {
			            "ACCOUNT_GROUP_ID": 221,
			            "COMPONENT_SPLIT_ID": "#SPLIT_ACTIVITIES",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "ACCOUNT_GROUP_ID": 222,
			            "COMPONENT_SPLIT_ID": "#SPLIT_ACTIVITIES",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ],
			        "ACCOUNT_GROUP_ENTITIES": [
			          {
			            "ACCOUNT_GROUP_ID": 221,
			            "CONTROLLING_AREA_ID": "#CA2",
			            "COST_PORTION": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "ACCOUNT_GROUP_DESCRIPTION": "Activities 1 (AG 221)"
			          },
			          {
			            "ACCOUNT_GROUP_ID": 222,
			            "CONTROLLING_AREA_ID": "#CA2",
			            "COST_PORTION": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "ACCOUNT_GROUP_DESCRIPTION": "Activities 2 (AG 222)"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "CONTROLLING_AREA_CURRENCY_ID": "USD",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Component Split. Supports batch opperation , user can create, update or delete multiple Component Split objects.

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Component Split
		+ Values
			+ 'Component_Split'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"COMPONENT_SPLIT_ENTITIES": [{
						"COMPONENT_SPLIT_ID": "9",
						"CONTROLLING_AREA_ID": "1000"
					}],
					"COMPONENT_SPLIT_TEXT_ENTITIES": [{
						"COMPONENT_SPLIT_ID": "9",
						"LANGUAGE": "EN",
						"COMPONENT_SPLIT_DESCRIPTION": "Test"
					},
					{
						"COMPONENT_SPLIT_ID": "9",
						"LANGUAGE": "DE",
						"COMPONENT_SPLIT_DESCRIPTION": "Test"
					}],
					"SELECTED_ACCOUNT_GROUPS_ENTITIES": []
				},
				"UPDATE": {
					"COMPONENT_SPLIT_ENTITIES": [],
					"COMPONENT_SPLIT_TEXT_ENTITIES": [{
						"COMPONENT_SPLIT_ID": "9",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-08-17T10:03:49.822Z",
						"COMPONENT_SPLIT_DESCRIPTION": "Test Updated"
					},
					{
						"COMPONENT_SPLIT_ID": "9",
						"LANGUAGE": "DE",
						"_VALID_FROM": "2015-08-17T10:03:49.845Z",
						"COMPONENT_SPLIT_DESCRIPTION": "Test Updated"
					}],
					"SELECTED_ACCOUNT_GROUPS_ENTITIES": []
				},
				"DELETE": {
					"COMPONENT_SPLIT_ENTITIES": [{
						"COMPONENT_SPLIT_ID": "9",
						"_VALID_FROM": "2015-08-17T10:03:49.8Z"
					}],
					"COMPONENT_SPLIT_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "COMPONENT_SPLIT_ENTITIES": [
			            {
			              "COMPONENT_SPLIT_ID": "9",
			              "CONTROLLING_AREA_ID": "1000",
			              "_VALID_FROM": "2015-11-17T09:50:30.344Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "COMPONENT_SPLIT_TEXT_ENTITIES": [
			            {
			              "COMPONENT_SPLIT_ID": "9",
			              "LANGUAGE": "EN",
			              "COMPONENT_SPLIT_DESCRIPTION": "Test",
			              "_VALID_FROM": "2015-11-17T09:50:30.356Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            },
			            {
			              "COMPONENT_SPLIT_ID": "9",
			              "LANGUAGE": "DE",
			              "COMPONENT_SPLIT_DESCRIPTION": "Test",
			              "_VALID_FROM": "2015-11-17T09:50:30.367Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"COMPONENT_SPLIT_TEXT_ENTITIES":[],
						"COMPONENT_SPLIT_ENTITIES":[],
						"SELECTED_ACCOUNT_GROUPS_ENTITIES":[]
					},
					"DELETE": {
						"COMPONENT_SPLIT_ENTITIES":[],
						"COMPONENT_SPLIT_TEXT_ENTITIES":[]
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "COMPONENT_SPLIT_ENTITIES": [
			              {
			                "COMPONENT_SPLIT_ID": "9",
			                "_VALID_FROM": "2015-08-17T10:03:49.8Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COMPONENT_SPLIT_TEXT_ENTITIES": [
			              {
			                "COMPONENT_SPLIT_ID": "9",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-08-17T10:03:49.822Z",
			                "COMPONENT_SPLIT_DESCRIPTION": "Test Updated"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COMPONENT_SPLIT_TEXT_ENTITIES": [
			              {
			                "COMPONENT_SPLIT_ID": "9",
			                "LANGUAGE": "DE",
			                "_VALID_FROM": "2015-08-17T10:03:49.845Z",
			                "COMPONENT_SPLIT_DESCRIPTION": "Test Updated"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-confidence-level"></a>
Gets information about Confidence Level masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Confidence_Level')* ... type of the business object that is requested, for this section is used Confidence Level
		+ Values
			+ 'Confidence_Level'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONFIDENCE_LEVEL_ID=1')* ... filter that will be used to filter returned data, Ex. =CONFIDENCE_LEVEL_ID=1
	+ **searchAutocomplete** *(optional, string, '1')* ... filter data to start with a string, Ex. 1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
		
    + Body

           {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "CONFIDENCE_LEVEL_ENTITIES": [
			          {
			            "CONFIDENCE_LEVEL_ID": 1,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Very Low"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 2,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Low"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Medium"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 4,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "High"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 5,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Very High"
			          }
			        ],
			        "CONFIDENCE_LEVEL_TEXT_ENTITIES": [
			          {
			            "CONFIDENCE_LEVEL_ID": 1,
			            "LANGUAGE": "EN",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Very Low"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 2,
			            "LANGUAGE": "EN",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Low"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "LANGUAGE": "EN",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Medium"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 4,
			            "LANGUAGE": "EN",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "High"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 5,
			            "LANGUAGE": "EN",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Very High"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 1,
			            "LANGUAGE": "DE",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Sehr niedrig"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 2,
			            "LANGUAGE": "DE",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Niedrig"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "LANGUAGE": "DE",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Mittel"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 4,
			            "LANGUAGE": "DE",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Hoch"
			          },
			          {
			            "CONFIDENCE_LEVEL_ID": 5,
			            "LANGUAGE": "DE",
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Sehr hoch"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-controlling-area"></a>
Gets information about Controlling Area masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Controlling_Area')* ... type of the business object that is requested, for this section is used Controlling Area
		+ Values
			+ 'Controlling_Area'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_AREA_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=1000
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "CONTROLLING_AREA_CURRENCY_ID": "USD",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2"
			          },
					  {
                        "CONTROLLING_AREA_ID": "0001",
                        "CONTROLLING_AREA_CURRENCY_ID": "EUR",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null,
                        "_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
                        "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 0001"
                    }
			        ],
			        "CONTROLLING_AREA_TEXT_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "0001",
                        "LANGUAGE": "DE",
                        "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 0001",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
			          },
			          {
			            "CONTROLLING_AREA_ID": "0001",
                        "LANGUAGE": "EN",
                        "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 0001",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "EN",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "DE",
			            "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "LANGUAGE": "EN",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "LANGUAGE": "DE",
			            "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Controlling Area. Supports batch opperation , user can create, update or delete multiple Controlling Area objects.

+ Parameters
	+ **business_object** *(required, string, 'Controlling_Area')* ... type of the business object that is requested, for this section is used Controlling Area
		+ Values
			+ 'Controlling_Area'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"CONTROLLING_AREA_ENTITIES": [{
						"CONTROLLING_AREA_ID": "TEST",
						"CONTROLLING_AREA_CURRENCY_ID": "EUR"
					}],
					"CONTROLLING_AREA_TEXT_ENTITIES": [{
						"CONTROLLING_AREA_ID": "TEST",
						"LANGUAGE": "EN",
						"CONTROLLING_AREA_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"CONTROLLING_AREA_ENTITIES": [{
						"CONTROLLING_AREA_ID": "TEST",
						"CONTROLLING_AREA_CURRENCY_ID": "USD",
						"_VALID_FROM": "2015-10-07T14:25:07.768Z"
					}],
					"CONTROLLING_AREA_TEXT_ENTITIES": [{
						"CONTROLLING_AREA_ID": "TEST",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T14:25:07.782Z",
						"CONTROLLING_AREA_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"CONTROLLING_AREA_ENTITIES": [{
						"CONTROLLING_AREA_ID": "TEST",
						"_VALID_FROM": "2015-10-07T14:25:17.282Z"
					}],
					"CONTROLLING_AREA_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "CONTROLLING_AREA_ENTITIES": [
			            {
			              "CONTROLLING_AREA_ID": "TEST",
			              "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			              "_VALID_FROM": "2015-11-17T10:01:06.035Z",
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "CONTROLLING_AREA_TEXT_ENTITIES": [
			            {
			              "CONTROLLING_AREA_ID": "TEST",
			              "LANGUAGE": "EN",
			              "CONTROLLING_AREA_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T10:01:06.051Z",
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "CONTROLLING_AREA_ENTITIES": [
			              {
			                "CONTROLLING_AREA_ID": "TEST",
			                "_VALID_FROM": "2015-10-07T14:25:17.282Z"
			              }
			            ]
			          }
			        }
			      },
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "CONTROLLING_AREA_ENTITIES": [
			              {
			                "CONTROLLING_AREA_ID": "TEST",
			                "CONTROLLING_AREA_CURRENCY_ID": "USD",
			                "_VALID_FROM": "2015-10-07T14:25:07.768Z"
			              }
			            ]
			          }
			        }
			      },
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "CONTROLLING_AREA_TEXT_ENTITIES": [
			              {
			                "CONTROLLING_AREA_ID": "TEST",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T14:25:07.782Z",
			                "CONTROLLING_AREA_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          }
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-controlling-version"></a>
Gets information about Controlling Version masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Controlling_Version')* ... type of the business object that is requested, for this section is used Controlling Version
		+ Values
			+ 'Controlling_Version'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_VERSION_ID%TEST')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_VERSION_ID=000
	+ **searchAutocomplete** *(optional, string, '000')* ... filter data to start with a string, Ex. 000
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        {
                        "CONTROLLING_VERSION_ID": "000",
                        "CONTROLLING_AREA_ID": "0001",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null,
                        "_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
                        "CONTROLLING_VERSION_DESCRIPTION": "Plan/actual version"
                    }
			        ],
			        "CONTROLLING_VERSION_TEXT_ENTITIES": [
			          {
                        "CONTROLLING_VERSION_ID": "000",
                        "CONTROLLING_AREA_ID": "0001",
                        "LANGUAGE": "DE",
                        "CONTROLLING_VERSION_DESCRIPTION": "Plan/Ist - Version",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
                    },
					{
                        "CONTROLLING_VERSION_ID": "000",
                        "CONTROLLING_AREA_ID": "0001",
                        "LANGUAGE": "EN",
                        "CONTROLLING_VERSION_DESCRIPTION": "Plan/actual version",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
                    }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
                        "CONTROLLING_AREA_ID": "0001",
                        "CONTROLLING_AREA_CURRENCY_ID": "EUR",
                        "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null,
                        "_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
                        "CONTROLLING_AREA_DESCRIPTION": "Kostenrechnungskreis 0001"
                    }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-cost-center"></a>
Gets information about Cost Center masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Cost_Center')* ... type of the business object that is requested, for this section is used Component Split
		+ Values
			+ 'Cost_Center'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_AREA_ID=2000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=2000
	+ **searchAutocomplete** *(optional, string, 1000)* ... filter data to start with a string, Ex. 1000
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "COST_CENTER_ENTITIES": [
			          {
			            "COST_CENTER_ID": "#CC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "COST_CENTER_DESCRIPTION": "Cost Center 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "COST_CENTER_TEXT_ENTITIES": [
			          {
			            "COST_CENTER_ID": "#CC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "EN",
			            "COST_CENTER_DESCRIPTION": "Cost Center 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "COST_CENTER_ID": "#CC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "DE",
			            "COST_CENTER_DESCRIPTION": "Kostenstelle 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Cost Center. Supports batch opperation , user can create, update or delete multiple Cost Center objects.

+ Parameters
	+ **business_object** *(required, string, 'Cost_Center')* ... type of the business object that is requested, for this section is used Cost Center
		+ Values
			+ 'Cost_Center'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"COST_CENTER_ENTITIES": [{
						"COST_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000"
					}],
					"COST_CENTER_TEXT_ENTITIES": [{
						"COST_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"COST_CENTER_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"COST_CENTER_ENTITIES": [],
					"COST_CENTER_TEXT_ENTITIES": [{
						"COST_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T15:01:06.516Z",
						"COST_CENTER_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"COST_CENTER_ENTITIES": [{
						"COST_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"_VALID_FROM": "2015-10-07T15:01:06.494Z"
					}],
					"COST_CENTER_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "COST_CENTER_ENTITIES": [
			            {
			              "COST_CENTER_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "_VALID_FROM": "2015-11-17T10:11:16.834Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "COST_CENTER_TEXT_ENTITIES": [
			            {
			              "COST_CENTER_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "LANGUAGE": "EN",
			              "COST_CENTER_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T10:11:16.850Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"COST_CENTER_ENTITIES":[],
						"COST_CENTER_TEXT_ENTITIES":[]
					},
					"DELETE": {
						"COST_CENTER_ENTITIES":[],
						"COST_CENTER_TEXT_ENTITIES":[]
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "COST_CENTER_ENTITIES": [
			              {
			                "COST_CENTER_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "_VALID_FROM": "2015-10-07T15:01:06.494Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COST_CENTER_TEXT_ENTITIES": [
			              {
			                "COST_CENTER_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T15:01:06.516Z",
			                "COST_CENTER_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?lock}{?masterdataTimestamp}<a name="administration-costing-sheet"></a>
Gets information about Costing Sheet masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Costing_Sheet')* ... type of the business object that is requested, for this section is used Component Split
		+ Values
			+ 'Costing_Sheet'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'COSTING_SHEET_ID=#COGSL')* ... filter that will be used to filter returned data, Ex. =COSTING_SHEET_ID=#COGSL
	+ **searchAutocomplete** *(optional, string, #COGSL)* ... filter data to start with a string, Ex. #COGSL
	+ **lock** *(optional, bool, true)* ... paramter used for locking default-settings in pesimistic mode ( user wants to change values)
		+ Values
			+ 'true' 
			+ 'false'
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "head": {
			    "metadata": {
			      "Costing_Sheet": [
			        {
						"IS_LOCKED": 0
					}
			      ]
			    }
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "COSTING_SHEET_ENTITIES": [
			          {
			            "COSTING_SHEET_ID": "#COGSL",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "COSTING_SHEET_DESCRIPTION": "Cost of Goods Sold (low overhead)"
			          }
			        ],
			        "COSTING_SHEET_TEXT_ENTITIES": [
			          {
			            "COSTING_SHEET_ID": "#COGSL",
			            "LANGUAGE": "EN",
			            "COSTING_SHEET_DESCRIPTION": "Cost of Goods Sold (low overhead)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "COSTING_SHEET_ID": "#COGSL",
			            "LANGUAGE": "DE",
			            "COSTING_SHEET_DESCRIPTION": "Selbstkosten (niedrige Zuschläge)",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Costing Sheet. Supports batch opperation , user can create, update or delete multiple Costing Sheet objects.

+ Parameters
	+ **business_object** *(required, string, 'Costing_Sheet')* ... type of the business object that is requested, for this section is used Costing Sheet
		+ Values
			+ 'Costing_Sheet'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
			  "CREATE": {
				"COSTING_SHEET_ENTITIES": [
				  {
					"COSTING_SHEET_ID": "TEST",
					"CONTROLLING_AREA_ID": "#CA1"
				  }
				],
				"COSTING_SHEET_TEXT_ENTITIES": [
				  {
					"COSTING_SHEET_ID": "TEST",
					"LANGUAGE": "EN",
					"COSTING_SHEET_DESCRIPTION": "test"
				  }
				],
				"COSTING_SHEET_ROW_ENTITIES": [
				  {
					"COSTING_SHEET_ROW_ID": "test",
					"COSTING_SHEET_ROW_TYPE": 1,
					"COSTING_SHEET_ID": "TEST",
					"ACCOUNT_GROUP_AS_BASE_ID": 110,
					"CALCULATION_ORDER": 2
				  }
				]
			  },
			  "UPDATE": {
				"COSTING_SHEET_TEXT_ENTITIES": []
			  },
			  "DELETE": {
				"COSTING_SHEET_TEXT_ENTITIES": []
			  }
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			  "body": {
				"transactionaldata": [
				  {
					"CREATE": {
					  "COSTING_SHEET_ROW_ENTITIES": [
						{
						  "COSTING_SHEET_ROW_ID": "test",
						  "COSTING_SHEET_ROW_TYPE": 1,
						  "COSTING_SHEET_ID": "TEST",
						  "ACCOUNT_GROUP_AS_BASE_ID": 110,
						  "CALCULATION_ORDER": 2,
						  "_VALID_FROM": "2016-04-13T14:15:15.861Z",
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ],
					  "COSTING_SHEET_ROW_TEXT_ENTITIES": [],
					  "COSTING_SHEET_BASE_ENTITIES": [],
					  "COSTING_SHEET_BASE_ROW_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
					  "COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
					  "ACCOUNT_GROUP_ENTITIES": [],
					  "COSTING_SHEET_ENTITIES": [
						{
						  "COSTING_SHEET_ID": "ASD",
						  "CONTROLLING_AREA_ID": "#CA1",
						  "_VALID_FROM": "2016-04-13T11:43:41.922Z",
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ],
					  "COSTING_SHEET_TEXT_ENTITIES": [
						{
						  "COSTING_SHEET_ID": "ASD",
						  "LANGUAGE": "EN",
						  "COSTING_SHEET_DESCRIPTION": "asd",
						  "_VALID_FROM": "2016-04-13T11:43:41.922Z",
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": "I305774"
						}
					  ]
					},
					"UPDATE": {
					  "COSTING_SHEET_ROW_ENTITIES": [],
					  "COSTING_SHEET_ROW_TEXT_ENTITIES": [],
					  "COSTING_SHEET_BASE_ENTITIES": [],
					  "COSTING_SHEET_BASE_ROW_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
					  "COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
					  "ACCOUNT_GROUP_ENTITIES": [],
					  "COSTING_SHEET_ENTITIES": [],
					  "COSTING_SHEET_TEXT_ENTITIES": []
					},
					"DELETE": {
					  "COSTING_SHEET_ROW_ENTITIES": [],
					  "COSTING_SHEET_ROW_TEXT_ENTITIES": [],
					  "COSTING_SHEET_BASE_ENTITIES": [],
					  "COSTING_SHEET_BASE_ROW_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ENTITIES": [],
					  "COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [],
					  "COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [],
					  "ACCOUNT_GROUP_ENTITIES": [],
					  "COSTING_SHEET_ENTITIES": [],
					  "COSTING_SHEET_TEXT_ENTITIES": []
					}
				  }
				]
			  },
			  "head": {}
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "COSTING_SHEET_TEXT_ENTITIES": [
			              {
								"COSTING_SHEET_ID": "XYZ",
                                "LANGUAGE": "EN",
                                "COSTING_SHEET_DESCRIPTION": "test",
                                "_VALID_FROM": "2015-10-08T10:48:12.723Z"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?lock}{?masterdataTimestamp}<a name="administration-costing-sheet-row"></a>
Gets information about Costing Sheet Row masterdata object and related Masterdata objects. Update and Delete of Costing Sheet Rows are made using Costing Sheet administration services!!

## GET

+ Parameters
	+ **business_object** *(required, string, 'Costing_Sheet_Row')* ... type of the business object that is requested, for this section is used Costing Sheet Row
		+ Values
			+ 'Costing_Sheet_Row'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'COSTING_SHEET_ID%3d%23COGSL')* ... filter that will be used to filter returned data, Ex. =COSTING_SHEET_ID=#COGSL
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **lock** *(optional, bool, true)* ... paramter used for locking default-settings in pesimistic mode ( user wants to change values)
		+ Values
			+ 'true' 
			+ 'false'
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	"IS_LOCKED" value from header tells user that is locked by him ( value 0 ) or by somebodyelse (value 1 , also when locked by other user header contains information about UserId that locked object)
	
    + Body

            {
			"body": {
				"transactionaldata": [
					{
						"COSTING_SHEET_ROW_ENTITIES": [
							{
								"COSTING_SHEET_ROW_ID": "DMC",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 1,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": 110,
								"COSTING_SHEET_OVERHEAD_ID": null,
								"CALCULATION_ORDER": 1,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Materials (AG 110)"
							},
							{
								"COSTING_SHEET_ROW_ID": "DPC",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 1,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": 120,
								"COSTING_SHEET_OVERHEAD_ID": null,
								"CALCULATION_ORDER": 3,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Activities (AG 120)"
							},
							{
								"COSTING_SHEET_ROW_ID": "MOC",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 3,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": null,
								"COSTING_SHEET_OVERHEAD_ID": "11",
								"CALCULATION_ORDER": 2,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Material overhead cost"
							},
							{
								"COSTING_SHEET_ROW_ID": "POC",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 3,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": null,
								"COSTING_SHEET_OVERHEAD_ID": "16",
								"CALCULATION_ORDER": 4,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Production overhead cost"
							},
							{
								"COSTING_SHEET_ROW_ID": "COGM",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 4,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": null,
								"COSTING_SHEET_OVERHEAD_ID": null,
								"CALCULATION_ORDER": 5,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Cost of Goods Manufactured"
							},
							{
								"COSTING_SHEET_ROW_ID": "COGS",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 4,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": null,
								"COSTING_SHEET_OVERHEAD_ID": null,
								"CALCULATION_ORDER": 7,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Cost of Goods Sold"
							},
							{
								"COSTING_SHEET_ROW_ID": "SAO",
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_TYPE": 3,
								"COSTING_SHEET_BASE_ID": null,
								"ACCOUNT_GROUP_AS_BASE_ID": null,
								"COSTING_SHEET_OVERHEAD_ID": "17",
								"CALCULATION_ORDER": 6,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_ROW_DESCRIPTION": "Sales&Administration Overhead"
							}
						],
						"COSTING_SHEET_ROW_TEXT_ENTITIES": [
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "DMC",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Materials (AG 110)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "MOC",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Material overhead cost",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "MOC",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Materialgemeinkosten",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "DPC",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Activities (AG 120)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "DPC",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Leistungen (KG 120)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "POC",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Production overhead cost",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "POC",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Fertigungsgemeinkosten",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "COGM",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Cost of Goods Manufactured",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "COGM",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Herstellkosten",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "SAO",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Sales&Administration Overhead",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "SAO",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Verwaltungs- und Vertriebsgemeinkosten",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "COGS",
								"LANGUAGE": "EN",
								"COSTING_SHEET_ROW_DESCRIPTION": "Cost of Goods Sold",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "COGS",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Selbstkosten",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_ID": "#COGSL",
								"COSTING_SHEET_ROW_ID": "DMC",
								"LANGUAGE": "DE",
								"COSTING_SHEET_ROW_DESCRIPTION": "Materialien (KG 110)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							}
						],
						"COSTING_SHEET_BASE_ENTITIES": [],
						"COSTING_SHEET_BASE_ROW_ENTITIES": [],
						"COSTING_SHEET_OVERHEAD_ENTITIES": [
							{
								"COSTING_SHEET_OVERHEAD_ID": 11,
								"CREDIT_ACCOUNT_ID": "#AC31",
								"CREDIT_FIXED_COST_PORTION": null,
								"IS_ROLLED_UP": 1,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_OVERHEAD_ID": 16,
								"CREDIT_ACCOUNT_ID": "#AC32",
								"CREDIT_FIXED_COST_PORTION": null,
								"IS_ROLLED_UP": 1,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_OVERHEAD_ID": 17,
								"CREDIT_ACCOUNT_ID": "#AC33",
								"CREDIT_FIXED_COST_PORTION": null,
								"IS_ROLLED_UP": 0,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							}
						],
						"COSTING_SHEET_OVERHEAD_ROW_ENTITIES": [
							{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 6,
								"COSTING_SHEET_OVERHEAD_ID": 11,
								"VALID_FROM": "2015-01-01T00:00:00.000Z",
								"VALID_TO": "2099-12-31T00:00:00.000Z",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_ID": "#C1",
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"PLANT_ID": "#PT1",
								"OVERHEAD_GROUP_ID": "#OG3",
								"OVERHEAD_PERCENTAGE": "10",
								"PROJECT_ID": null,
								"CALCULATION_ID": null,
								"OVERHEAD_QUANTITY_BASED": null,
								"OVERHEAD_CURRENCY_ID": null,
								"OVERHEAD_PRICE_UNIT": null,
								"OVERHEAD_PRICE_UNIT_UOM_ID": null,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 7,
								"COSTING_SHEET_OVERHEAD_ID": 11,
								"VALID_FROM": "2015-01-01T00:00:00.000Z",
								"VALID_TO": "2099-12-31T00:00:00.000Z",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_ID": "#C2",
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"PLANT_ID": "#PT2",
								"OVERHEAD_GROUP_ID": null,
								"OVERHEAD_PERCENTAGE": "10",
								"PROJECT_ID": null,
								"CALCULATION_ID": null,
								"OVERHEAD_QUANTITY_BASED": null,
								"OVERHEAD_CURRENCY_ID": null,
								"OVERHEAD_PRICE_UNIT": null,
								"OVERHEAD_PRICE_UNIT_UOM_ID": null,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 13,
								"COSTING_SHEET_OVERHEAD_ID": 16,
								"VALID_FROM": "2015-01-01T00:00:00.000Z",
								"VALID_TO": "2099-12-31T00:00:00.000Z",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_ID": null,
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"PLANT_ID": null,
								"OVERHEAD_GROUP_ID": null,
								"OVERHEAD_PERCENTAGE": "20",
								"PROJECT_ID": null,
								"CALCULATION_ID": null,
								"OVERHEAD_QUANTITY_BASED": null,
								"OVERHEAD_CURRENCY_ID": null,
								"OVERHEAD_PRICE_UNIT": null,
								"OVERHEAD_PRICE_UNIT_UOM_ID": null,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
							},
							{
								"COSTING_SHEET_OVERHEAD_ROW_ID": 14,
								"COSTING_SHEET_OVERHEAD_ID": 17,
								"VALID_FROM": "2015-01-01T00:00:00.000Z",
								"VALID_TO": "2099-12-31T00:00:00.000Z",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_ID": null,
								"BUSINESS_AREA_ID": null,
								"PROFIT_CENTER_ID": null,
								"PLANT_ID": null,
								"OVERHEAD_GROUP_ID": null,
								"OVERHEAD_PERCENTAGE": "10",
								"PROJECT_ID": null,
								"CALCULATION_ID": null,
								"OVERHEAD_QUANTITY_BASED": null,
								"OVERHEAD_CURRENCY_ID": null,
								"OVERHEAD_PRICE_UNIT": null,
								"OVERHEAD_PRICE_UNIT_UOM_ID": null,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
							}
						],
						"ACCOUNT_GROUP_ENTITIES": [
							{
								"ACCOUNT_GROUP_ID": 110,
								"CONTROLLING_AREA_ID": "#CA1",
								"COST_PORTION": 3,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							},
							{
								"ACCOUNT_GROUP_ID": 120,
								"CONTROLLING_AREA_ID": "#CA1",
								"COST_PORTION": 3,
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							}
						],
						"ACCOUNT_GROUP_TEXT_ENTITIES": [
							{
								"ACCOUNT_GROUP_ID": 110,
								"LANGUAGE": "EN",
								"ACCOUNT_GROUP_DESCRIPTION": "Materials (AG 110)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							},
							{
								"ACCOUNT_GROUP_ID": 110,
								"LANGUAGE": "DE",
								"ACCOUNT_GROUP_DESCRIPTION": "Materialien (KG 110)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							},
							{
								"ACCOUNT_GROUP_ID": 120,
								"LANGUAGE": "EN",
								"ACCOUNT_GROUP_DESCRIPTION": "Activities (AG 120)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							},
							{
								"ACCOUNT_GROUP_ID": 120,
								"LANGUAGE": "DE",
								"ACCOUNT_GROUP_DESCRIPTION": "Leistungen (KG 120)",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER"
							}
						],
						"COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES": [
							{
								"SOURCE_ROW_ID": "MOC",
								"TARGET_ROW_ID": "DMC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "POC",
								"TARGET_ROW_ID": "DPC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGM",
								"TARGET_ROW_ID": "DMC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGM",
								"TARGET_ROW_ID": "MOC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGM",
								"TARGET_ROW_ID": "DPC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGM",
								"TARGET_ROW_ID": "POC",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "SAO",
								"TARGET_ROW_ID": "COGM",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGS",
								"TARGET_ROW_ID": "COGM",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							},
							{
								"SOURCE_ROW_ID": "COGS",
								"TARGET_ROW_ID": "SAO",
								"COSTING_SHEET_ID": "#COGSL",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER"
							}
						],
						"ACCOUNT_ENTITIES": [
							{
								"ACCOUNT_ID": "#AC31",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Material overheads (Account 31)"
							},
							{
								"ACCOUNT_ID": "#AC31",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Material overheads (Account 31)"
							},
							{
								"ACCOUNT_ID": "#AC32",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Production overheads (Account 32)"
							},
							{
								"ACCOUNT_ID": "#AC32",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Production overheads (Account 32)"
							},
							{
								"ACCOUNT_ID": "#AC33",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Other overheads (Account 33)"
							},
							{
								"ACCOUNT_ID": "#AC33",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"ACCOUNT_DESCRIPTION": "Other overheads (Account 33)"
							}
						],
						"COMPANY_CODE_ENTITIES": [
							{
								"COMPANY_CODE_ID": "#C1",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_CURRENCY_ID": "EUR",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"COMPANY_CODE_DESCRIPTION": "Company 1"
							},
							{
								"COMPANY_CODE_ID": "#C2",
								"CONTROLLING_AREA_ID": "#CA1",
								"COMPANY_CODE_CURRENCY_ID": "EUR",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"COMPANY_CODE_DESCRIPTION": "Company 2"
							}
						],
						"BUSINESS_AREA_ENTITIES": [],
						"PROFIT_CENTER_ENTITIES": [],
						"PLANT_ENTITIES": [
							{
								"PLANT_ID": "#PT1",
								"COMPANY_CODE_ID": "#C1",
								"COUNTRY": "Germany",
								"POSTAL_CODE": "12345",
								"REGION": null,
								"CITY": "Dresden",
								"STREET_NUMBER_OR_PO_BOX": "Werkstraße 1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"PLANT_DESCRIPTION": "Plant 1"
							},
							{
								"PLANT_ID": "#PT2",
								"COMPANY_CODE_ID": "#C2",
								"COUNTRY": "Romania",
								"POSTAL_CODE": "123456",
								"REGION": "Ilfov",
								"CITY": "Bucharest",
								"STREET_NUMBER_OR_PO_BOX": "Adresa uzina 1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"PLANT_DESCRIPTION": "Plant 2"
							}
						],
						"OVERHEAD_GROUP_ENTITIES": [
							{
								"OVERHEAD_GROUP_ID": "#OG3",
								"PLANT_ID": "#PT1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"OVERHEAD_GROUP_DESCRIPTION": "Overhead Group 3"
							}
						],
						"CONTROLLING_AREA_ENTITIES": [
							{
								"CONTROLLING_AREA_ID": "#CA1",
								"CONTROLLING_AREA_CURRENCY_ID": "EUR",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": " #CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": null,
								"_CREATED_BY_FIRST_VERSION": null,
								"CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
							}
						],
						"COSTING_SHEET_ENTITIES": [
							{
								"COSTING_SHEET_ID": "#COGSL",
								"CONTROLLING_AREA_ID": "#CA1",
								"_VALID_FROM": "2000-01-01T00:00:00.000Z",
								"_VALID_TO": null,
								"_SOURCE": 1,
								"_CREATED_BY": "#CONTROLLER",
								"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
								"_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
								"COSTING_SHEET_DESCRIPTION": "Cost of Goods Sold (low overhead)"
							}
						]
					}
				]
			},
			"head": {
				"metadata": {
					"Costing_Sheet_Row": [
						{
							"IS_LOCKED": 0
						}
					]
				}
			}
		}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-currency"></a>
Gets information about Currency masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Currency')* ... type of the business object that is requested, for this section is used Currency
		+ Values
			+ 'Currency'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CURRENCY_ID%3dEUR')* ... filter that will be used to filter returned data, Ex. =CURRENCY_ID=EUR
	+ **searchAutocomplete** *(optional, string, EUR)* ... filter data to start with a string, Ex. EUR
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "CURRENCY_ENTITIES": [
			          {
			            "CURRENCY_ID": "BRL",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "CURRENCY_CODE": "BRL",
			            "CURRENCY_DESCRIPTION": "Brazilian Real"
			          }
			        ],
			        "CURRENCY_TEXT_ENTITIES": [
			          {
			            "CURRENCY_ID": "BRL",
			            "LANGUAGE": "EN",
			            "CURRENCY_CODE": "BRL",
			            "CURRENCY_DESCRIPTION": "Brazilian Real",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "CURRENCY_ID": "BRL",
			            "LANGUAGE": "DE",
			            "CURRENCY_CODE": "BRL",
			            "CURRENCY_DESCRIPTION": "Brasilianische Real",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Currency. Supports batch opperation , user can create, update or delete multiple Currency objects.

+ Parameters
	+ **business_object** *(required, string, 'Currency')* ... type of the business object that is requested, for this section is used Currency
		+ Values
			+ 'Currency'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"CURRENCY_ENTITIES": [{
						"CURRENCY_ID": "ZZZ"
					}],
					"CURRENCY_TEXT_ENTITIES": [{
						"CURRENCY_ID": "ZZZ",
						"LANGUAGE": "EN",
						"CURRENCY_CODE": "EUR",
						"CURRENCY_DESCRIPTION": "TEST"
					},
					{
						"CURRENCY_ID": "ZZZ",
						"LANGUAGE": "DE",
						"CURRENCY_CODE": "EUR",
						"CURRENCY_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"CURRENCY_ENTITIES": [],
					"CURRENCY_TEXT_ENTITIES": [{
						"CURRENCY_ID": "ZZZ",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-08-17T11:48:51.154Z",
						"CURRENCY_CODE": "EUR",
						"CURRENCY_DESCRIPTION": "TEST UPDATED"
					},
					{
						"CURRENCY_ID": "ZZZ",
						"LANGUAGE": "DE",
						"_VALID_FROM": "2015-08-17T11:48:51.174Z",
						"CURRENCY_CODE": "EUR",
						"CURRENCY_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"CURRENCY_ENTITIES": [{
						"CURRENCY_ID": "ZZZ",
						"_VALID_FROM": "2015-08-17T11:48:51.145Z"
					}],
					"CURRENCY_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "CURRENCY_ENTITIES": [
			            {
			              "CURRENCY_ID": "ZZZ",
			              "_VALID_FROM": "2015-11-17T10:47:57.194Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "CURRENCY_TEXT_ENTITIES": [
			            {
			              "CURRENCY_ID": "ZZZ",
			              "LANGUAGE": "EN",
			              "CURRENCY_CODE": "EUR",
			              "CURRENCY_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T10:47:57.205Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            },
			            {
			              "CURRENCY_ID": "ZZZ",
			              "LANGUAGE": "DE",
			              "CURRENCY_CODE": "EUR",
			              "CURRENCY_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T10:47:57.219Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "CURRENCY_ENTITIES": [
			              {
			                "CURRENCY_ID": "ZZZ",
			                "_VALID_FROM": "2015-08-17T11:48:51.145Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "CURRENCY_TEXT_ENTITIES": [
			              {
			                "CURRENCY_ID": "ZZZ",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-08-17T11:48:51.154Z",
			                "CURRENCY_CODE": "EUR",
			                "CURRENCY_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "CURRENCY_TEXT_ENTITIES": [
			              {
			                "CURRENCY_ID": "ZZZ",
			                "LANGUAGE": "DE",
			                "_VALID_FROM": "2015-08-17T11:48:51.174Z",
			                "CURRENCY_CODE": "EUR",
			                "CURRENCY_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-currency-conversion"></a>
Gets information about Currency Conversion masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Currency_Conversion')* ... type of the business object that is requested, for this section is used Component Split
		+ Values
			+ 'Currency_Conversion'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'FROM_CURRENCY_ID%3dBRL')* ... filter that will be used to filter returned data, Ex. =FROM_CURRENCY_ID=BRL
	+ **searchAutocomplete** *(optional, string, BRL)* ... filter data to start with a string, Ex. BRL
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date		
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
		
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "CURRENCY_CONVERSION_ENTITIES": [
			          {
			            "FROM_CURRENCY_ID": "BRL",
			            "TO_CURRENCY_ID": "CAD",
			            "FROM_FACTOR": 1,
			            "TO_FACTOR": 1,
			            "RATE": "0.41415",
			            "VALID_FROM": "2015-01-01T00:00:00.000Z",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Currency Conversion. Supports batch opperation , user can create, update or delete multiple Currency Conversion objects.

+ Parameters
	+ **business_object** *(required, string, 'Currency_Conversion')* ... type of the business object that is requested, for this section is used Currency Conversion
		+ Values
			+ 'Currency_Conversion'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"CURRENCY_CONVERSION_ENTITIES": [{
						"FROM_CURRENCY_ID": "BRL",
						"TO_CURRENCY_ID": "CAD",
						"FROM_FACTOR": 2,
						"TO_FACTOR": 3,
						"RATE": 4.0,
						"VALID_FROM": "2015-10-21T00:00:00Z"
					}]
				},
				"UPDATE": {
					"CURRENCY_CONVERSION_ENTITIES": [{
						"FROM_CURRENCY_ID": "BRL",
						"TO_CURRENCY_ID": "CAD",
						"FROM_FACTOR": 2,
						"TO_FACTOR": 3,
						"RATE": 12.0,
						"VALID_FROM": "2015-10-21T00:00:00",
						"_VALID_FROM": "2015-10-07T13:00:43.353Z"
					}]
				},
				"DELETE": {
					"CURRENCY_CONVERSION_ENTITIES": [{
						"FROM_CURRENCY_ID": "BRL",
						"TO_CURRENCY_ID": "CAD",
						"FROM_FACTOR": 0,
						"TO_FACTOR": 0,
						"RATE": 0.0,
						"VALID_FROM": "2015-10-21T00:00:00",
						"_VALID_FROM": "2015-10-07T13:00:48.824Z"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "CURRENCY_CONVERSION_ENTITIES": [
			            {
			              "FROM_CURRENCY_ID": "BRL",
			              "TO_CURRENCY_ID": "CAD",
			              "FROM_FACTOR": 2,
			              "TO_FACTOR": 3,
			              "RATE": 4,
			              "VALID_FROM": "2015-10-21",
			              "_VALID_FROM": "2015-11-17T11:07:38.487Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"CURRENCY_CONVERSION_ENTITIES":[]
					},
					"DELETE": {
						"CURRENCY_CONVERSION_ENTITIES":[]
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "CURRENCY_CONVERSION_ENTITIES": [
			              {
			                "FROM_CURRENCY_ID": "BRL",
			                "TO_CURRENCY_ID": "CAD",
			                "FROM_FACTOR": 0,
			                "TO_FACTOR": 0,
			                "RATE": 0,
			                "VALID_FROM": "2015-10-21",
			                "_VALID_FROM": "2015-10-07T13:00:48.824Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "CURRENCY_CONVERSION_ENTITIES": [
			              {
			                "FROM_CURRENCY_ID": "BRL",
			                "TO_CURRENCY_ID": "CAD",
			                "FROM_FACTOR": 2,
			                "TO_FACTOR": 3,
			                "RATE": 12,
			                "VALID_FROM": "2015-10-21",
			                "_VALID_FROM": "2015-10-07T13:00:43.353Z"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-customer"></a>
Gets information about Customer masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Customer
		+ Values
			+ 'Component_Split'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CUSTOMER_ID%3d%251000')* ... filter that will be used to filter returned data, Ex. =CUSTOMER_ID=251000
	+ **searchAutocomplete** *(optional, string, #CU1)* ... filter data to start with a string, Ex. #CU1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "CUSTOMER_ENTITIES": [
			          {
			            "CUSTOMER_ID": "#CU1",
			            "CUSTOMER_NAME": "Kunde 1",
			            "COUNTRY": "Germany",
			            "POSTAL_CODE": "12345",
			            "CITY": "Dresden",
			            "STREET_NUMBER_OR_PO_BOX": "Kundenstraße 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Customer. Supports batch opperation , user can create, update or delete multiple Customer objects.

+ Parameters
	+ **business_object** *(required, string, 'Customer')* ... type of the business object that is requested, for this section is used Customer
		+ Values
			+ 'Customer'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"CUSTOMER_ENTITIES": [{
						"CUSTOMER_ID": "ZTEST",
						"CUSTOMER_NAME": "TEST",
						"COUNTRY": "RO"
					}]
				},
				"UPDATE": {
					"CUSTOMER_ENTITIES": [{
						"CUSTOMER_ID": "ZTEST",
						"CUSTOMER_NAME": "TEST UPDATED",
						"COUNTRY": "RO",
						"POSTAL_CODE": "311200",
						"_VALID_FROM": "2015-10-07T13:43:38.312Z"
					}]
				},
				"DELETE": {
					"CUSTOMER_ENTITIES": [{
						"CUSTOMER_ID": "ZTEST",
						"_VALID_FROM": "2015-10-07T13:43:52.043Z"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "CUSTOMER_ENTITIES": [
			            {
			              "CUSTOMER_ID": "ZTEST",
			              "CUSTOMER_NAME": "TEST",
			              "COUNTRY": "RO",
			              "_VALID_FROM": "2015-11-17T15:53:14.060Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"CUSTOMER_ENTITIES": []
					},
					"DELETE": {
						"CUSTOMER_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			                "severity": "Error",
			                "operation": "Delete",
			                "details": {
			                    "administrationObj": {
			                        "CUSTOMER_ENTITIES": [
			                            {
			                                "CUSTOMER_ID": "ZTEST",
			                                "_VALID_FROM": "2015-10-07T13:43:52.043Z"
			                            }
			                        ]
			                    },
								"administrationObjType": "MainObj"
			                }
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-dimension"></a>
Gets information about Dimension masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Dimension')* ... type of the business object that is requested, for this section is used Dimension
		+ Values
			+ 'Dimension'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'DIMENSION_ID%AREA')* ... filter that will be used to filter returned data, Ex. =DIMENSION_ID=AREA
	+ **searchAutocomplete** *(optional, string, AREA)* ... filter data to start with a string, Ex. AREA
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "DIMENSION_ENTITIES": [
			          {
			            "DIMENSION_ID": "AREA",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "DIMENSION_DESCRIPTION": "Area"
			          }
			        ],
			        "DIMENSION_TEXT_ENTITIES": [
			          {
			            "DIMENSION_ID": "AREA",
			            "LANGUAGE": "EN",
			            "DIMENSION_DESCRIPTION": "Area",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "DIMENSION_ID": "AREA",
			            "LANGUAGE": "DE",
			            "DIMENSION_DESCRIPTION": "Fläche",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-document"></a>
Gets information about Document masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Document')* ... type of the business object that is requested, for this section is used Document
		+ Values
			+ 'Document'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'DOCUMENT_TYPE_ID%3d#DR')* ... filter that will be used to filter returned data, Ex. =DOCUMENT_TYPE_ID=#DR
	+ **searchAutocomplete** *(optional, string, DR)* ... filter data to start with a string, Ex. DR
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
				  "DOCUMENT_ENTITIES": [
                    {
                        "DOCUMENT_TYPE_ID": "#DR",
                        "DOCUMENT_ID": "#DOC-100-210",
                        "DOCUMENT_VERSION": "#1",
                        "DOCUMENT_PART": "#01",
                        "IS_CREATED_VIA_CAD_INTEGRATION": 1,
                        "DOCUMENT_STATUS_ID": "#R",
                        "DESIGN_OFFICE_ID": "#L1",
                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
                        "_VALID_TO": null,
                        "_SOURCE": 1,
                        "_CREATED_BY": "#CONTROLLER",
                        "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
                        "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
                        "DOCUMENT_DESCRIPTION": "Drawing Slug for impeller"
                    },
			        "DOCUMENT_STATUS_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "DOCUMENT_STATUS_ID": "#R",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "DOCUMENT_STATUS_DESCRIPTION": "Released"
			          }
			        ],
			        "DOCUMENT_TYPE_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "DOCUMENT_TYPE_DESCRIPTION": "Drawing"
			          }
			        ],
			        "DOCUMENT_TEXT_ENTITIES": [
			          {
                        "DOCUMENT_TYPE_ID": "#DR",
                        "DOCUMENT_ID": "#DOC-100-210",
                        "DOCUMENT_VERSION": "#1",
                        "DOCUMENT_PART": "#01",
                        "LANGUAGE": "DE",
                        "DOCUMENT_DESCRIPTION": "Drawing Rohling für Laufrad",
                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
                        "_VALID_TO": null,
                        "_SOURCE": 1,
                        "_CREATED_BY": "#CONTROLLER"
					  }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-document-status"></a>
Gets information about Document Status masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Document_Status')* ... type of the business object that is requested, for this section is used Document Status
		+ Values
			+ 'Document_Status'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'DOCUMENT_STATUS_ID%3d#R')* ... filter that will be used to filter returned data, Ex. =DOCUMENT_STATUS_ID=#R
	+ **searchAutocomplete** *(optional, string, R)* ... filter data to start with a string, Ex. R
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "DOCUMENT_STATUS_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "DOCUMENT_STATUS_ID": "#R",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "DOCUMENT_STATUS_DESCRIPTION": "Released"
			          }
			        ],
			        "DOCUMENT_TYPE_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "DOCUMENT_TYPE_DESCRIPTION": "Drawing"
			          }
			        ],
			        "DOCUMENT_STATUS_TEXT_ENTITIES": [
			          {
			            "DOCUMENT_STATUS_ID": "#R",
			            "LANGUAGE": "EN",
			            "DOCUMENT_STATUS_DESCRIPTION": "Released",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "DOCUMENT_STATUS_ID": "#R",
			            "LANGUAGE": "DE",
			            "DOCUMENT_STATUS_DESCRIPTION": "Freigegeben",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-document-type"></a>
Gets information about Document Type masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Document_Type')* ... type of the business object that is requested, for this section is used Document Type
		+ Values
			+ 'Document_Type'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'DOCUMENT_TYPE_ID%3d#DR')* ... filter that will be used to filter returned data, Ex. =DOCUMENT_TYPE_ID=#DR
	+ **searchAutocomplete** *(optional, string, DR)* ... filter data to start with a string, Ex. DR
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "DOCUMENT_TYPE_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "DOCUMENT_TYPE_DESCRIPTION": "Drawing"
			          }
			        ],
			        "DOCUMENT_TYPE_TEXT_ENTITIES": [
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "LANGUAGE": "EN",
			            "DOCUMENT_TYPE_DESCRIPTION": "Drawing",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "DOCUMENT_TYPE_ID": "#DR",
			            "LANGUAGE": "DE",
			            "DOCUMENT_TYPE_DESCRIPTION": "Drawing",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-language"></a>
Gets information about Language masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Language')* ... type of the business object that is requested, for this section is used Language
		+ Values
			+ 'Language'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'LANGUAGE%EN')* ... filter that will be used to filter returned data, Ex. =LANGUAGE=EN
	+ **searchAutocomplete** *(optional, string, EN)* ... filter data to start with a string, Ex. EN
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "LANGUAGE_ENTITIES": [
			          {
			            "LANGUAGE": "AF",
			            "TEXTS_MAINTAINABLE": 0,
			            "_VALID_FROM": "2015-10-27T13:01:10.269Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "I055799",
			            "_VALID_FROM_FIRST_VERSION": "2015-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Updates a masterdata object Language. Supports batch opperation , user can update multiple Language objects.

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Language
		+ Values
			+ 'Component_Split'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
			  "UPDATE": {
			    "LANGUAGE_ENTITIES": [{
			    	"LANGUAGE": "TEST",
			        "TEXTS_MAINTAINABLE": 1,
			        "_VALID_FROM": "2015-06-24T07:25:54.683Z"
			    }]
			  }
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "UPDATE": {
			          "LANGUAGE_ENTITIES": [
			            {
			              "LANGUAGE": "AF",
			              "TEXTS_MAINTAINABLE": 0,
			              "_VALID_FROM": "2015-11-17T16:36:34.733Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "LANGUAGE_ENTITIES": [
			              {
			                "LANGUAGE": "TEST",
			                "TEXTS_MAINTAINABLE": 1,
			                "_VALID_FROM": "2015-06-24T07:25:54.683Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material"></a>
Gets information about Material masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material')* ... type of the business object that is requested, for this section is used Material
		+ Values
			+ 'Material'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'MATERIAL_ID%#100-100')* ... filter that will be used to filter returned data, Ex. =MATERIAL_ID=#100-100
	+ **searchAutocomplete** *(optional, string, Casings)* ... filter data to start with a string, Ex. Casings
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)

   + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_ENTITIES": [
			          {
			            "MATERIAL_ID": "#100-100",
                        "BASE_UOM_ID": "PC",
                        "MATERIAL_GROUP_ID": "#MECH",
                        "MATERIAL_TYPE_ID": "#SEM",
                        "IS_CREATED_VIA_CAD_INTEGRATION": null,
                        "IS_PHANTOM_MATERIAL": null,
                        "IS_CONFIGURABLE_MATERIAL": null,
                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
                        "_VALID_TO": null,
                        "_SOURCE": 1,
                        "_CREATED_BY": "#CONTROLLER",
                        "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
                        "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
                        "MATERIAL_DESCRIPTION": "Casing"
			          }
			        ],
			        "MATERIAL_GROUP_ENTITIES": [
			          {
			            "MATERIAL_GROUP_ID": "#MECH",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "MATERIAL_GROUP_DESCRIPTION": "Mechanical Components"
			          }
			        ],
			        "MATERIAL_TYPE_ENTITIES": [
			          {
			            "MATERIAL_TYPE_ID": "#SEM",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "MATERIAL_TYPE_DESCRIPTION": "Semi-finished products"
			          }
			        ],
			        "MATERIAL_TEXT_ENTITIES": [
			          {
			            "MATERIAL_ID": "#100-100",
			            "LANGUAGE": "EN",
			            "MATERIAL_DESCRIPTION": "Casing",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "MATERIAL_ID": "#100-100",
			            "LANGUAGE": "DE",
			            "MATERIAL_DESCRIPTION": "Gehäuse",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material. Supports batch opperation , user can create, update or delete multiple Material objects.

+ Parameters
	+ **business_object** *(required, string, 'Material')* ... type of the business object that is requested, for this section is used Material
		+ Values
			+ 'Material'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"MATERIAL_ENTITIES": [{
						"MATERIAL_ID": "ZTEST",
						"BASE_UOM_ID": "M",
						"MATERIAL_GROUP_ID": "0025",
						"MATERIAL_TYPE_ID": "AEM",
						"IS_PHANTOM_MATERIAL": 1
					}],
					"MATERIAL_TEXT_ENTITIES": [{
						"MATERIAL_ID": "ZTEST",
						"LANGUAGE": "EN",
						"MATERIAL_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"MATERIAL_ENTITIES": [{
						"MATERIAL_ID": "ZTEST",
						"BASE_UOM_ID": "M",
						"MATERIAL_GROUP_ID": "0025",
						"MATERIAL_TYPE_ID": "AEM",
						"IS_PHANTOM_MATERIAL": 0,
						"_VALID_FROM": "2015-10-07T13:38:39.777Z"
					}],
					"MATERIAL_TEXT_ENTITIES": [{
						"MATERIAL_ID": "ZTEST",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T13:38:39.898Z",
						"MATERIAL_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"MATERIAL_ENTITIES": [{
						"MATERIAL_ID": "ZTEST",
						"_VALID_FROM": "2015-10-07T13:38:47.094Z"
					}],
					"MATERIAL_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_ENTITIES": [
			            {
			              "MATERIAL_ID": "ZTEST",
			              "BASE_UOM_ID": "M",
			              "MATERIAL_GROUP_ID": "0025",
			              "MATERIAL_TYPE_ID": "AEM",
			              "IS_PHANTOM_MATERIAL": 1,
			              "_VALID_FROM": "2015-11-17T16:49:09.744Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "MATERIAL_TEXT_ENTITIES": [
			            {
			              "MATERIAL_ID": "ZTEST",
			              "LANGUAGE": "EN",
			              "MATERIAL_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T16:49:09.834Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_ENTITIES": [
			              {
			                "MATERIAL_ID": "ZTEST",
			                "_VALID_FROM": "2015-10-07T13:38:47.094Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_ENTITIES": [
			              {
			                "MATERIAL_ID": "ZTEST",
			                "BASE_UOM_ID": "M",
			                "MATERIAL_GROUP_ID": "0025",
			                "MATERIAL_TYPE_ID": "AEM",
			                "IS_PHANTOM_MATERIAL": 0,
			                "_VALID_FROM": "2015-10-07T13:38:39.777Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_TEXT_ENTITIES": [
			              {
			                "MATERIAL_ID": "ZTEST",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T13:38:39.898Z",
			                "MATERIAL_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material-account"></a>
Gets information about Material Account Determination masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material_Account_Determination')* ... type of the business object that is requested, for this section is used Material Account Determination
		+ Values
			+ 'Material_Account_Determination'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_AREA_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=1000
	+ **searchAutocomplete** *(optional, string, #FIN)* ... filter data to start with a string, Ex. #FIN
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "MATERIAL_TYPE_ID": "#FIN",
			            "PLANT_ID": "*",
			            "VALUATION_CLASS_ID": "*",
			            "ACCOUNT_ID": "#AC13",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "MATERIAL_TYPE_ENTITIES": [
			          {
			            "MATERIAL_TYPE_ID": "#FIN",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "MATERIAL_TYPE_DESCRIPTION": "Finished products"
			          }
			        ],
			        "PLANT_ENTITIES": [],
			        "COMPANY_CODE_ENTITIES": [],
			        "VALUATION_CLASS_ENTITIES": [],
			        "ACCOUNT_ENTITIES": [
			          {
			            "ACCOUNT_ID": "#AC13",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "ACCOUNT_DESCRIPTION": "Finished products (Account 13)"
			          },
			          {
			            "ACCOUNT_ID": "#AC13",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "ACCOUNT_DESCRIPTION": "Finished products (Account 13)"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material Account Determination. Supports batch opperation , user can create, update or delete multiple Material Account Determination objects.

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Material Account Determination
		+ Values
			+ 'Component_Split'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [{
						"CONTROLLING_AREA_ID": "2000",
						"MATERIAL_TYPE_ID": "#RAW",
						"PLANT_ID": "3000",
						"VALUATION_CLASS_ID": "#VC1",
						"ACCOUNT_ID": "11000"
					}]
				},
				"UPDATE": {
					"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [{
						"CONTROLLING_AREA_ID": "2000",
						"MATERIAL_TYPE_ID": "#RAW",
						"PLANT_ID": "3000",
						"VALUATION_CLASS_ID": "#VC1",
						"ACCOUNT_ID": "12000",
						"_VALID_FROM": "2015-10-07T12:23:00.681Z"
					}]
				},
				"DELETE": {
					"MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [{
						"CONTROLLING_AREA_ID": "2000",
						"MATERIAL_TYPE_ID": "#RAW",
						"PLANT_ID": "3000",
						"VALUATION_CLASS_ID": "#VC1",
						"_VALID_FROM": "2015-10-07T12:23:24.462Z"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [
			            {
			              "CONTROLLING_AREA_ID": "2000",
			              "MATERIAL_TYPE_ID": "#RAW",
			              "PLANT_ID": "3000",
			              "VALUATION_CLASS_ID": "#VC1",
			              "ACCOUNT_ID": "11000",
			              "_VALID_FROM": "2015-11-17T16:57:21.343Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [
			              {
			                "CONTROLLING_AREA_ID": "2000",
			                "MATERIAL_TYPE_ID": "#RAW",
			                "PLANT_ID": "3000",
			                "VALUATION_CLASS_ID": "#VC1",
			                "_VALID_FROM": "2015-10-07T12:23:24.462Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_ACCOUNT_DETERMINATION_ENTITIES": [
			              {
			                "CONTROLLING_AREA_ID": "2000",
			                "MATERIAL_TYPE_ID": "#RAW",
			                "PLANT_ID": "3000",
			                "VALUATION_CLASS_ID": "#VC1",
			                "ACCOUNT_ID": "12000",
			                "_VALID_FROM": "2015-10-07T12:23:00.681Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material-group"></a>
Gets information about Material Group masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material_Group')* ... type of the business object that is requested, for this section is used Material Group
		+ Values
			+ 'Material_Group'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_AREA_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=1000
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_GROUP_ENTITIES": [
			          {
			            "MATERIAL_GROUP_ID": "",
			            "_SOURCE": 2,
						"_VALID_FROM": null,
						"_VALID_TO": null,
						"_CREATED_BY": null,
						"_VALID_FROM_FIRST_VERSION": null,
						"_CREATED_BY_FIRST_VERSION": null,
			            "MATERIAL_GROUP_DESCRIPTION": ""
			          }
			        ],
			        "MATERIAL_GROUP_TEXT_ENTITIES": [
			          {
			            "MATERIAL_GROUP_ID": "",
			            "LANGUAGE": "EN",
			            "MATERIAL_GROUP_DESCRIPTION": "",
			            "_SOURCE": 2,
						"_VALID_FROM": null,
						"_VALID_TO": null,
						"_CREATED_BY": null,
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material Group. Supports batch opperation , user can create, update or delete multiple Material Group objects.

+ Parameters
	+ **business_object** *(required, string, 'Material_Group')* ... type of the business object that is requested, for this section is used Material Group
		+ Values
			+ 'Material_Group'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"MATERIAL_GROUP_ENTITIES": [{
						"MATERIAL_GROUP_ID": "ZTEST"
					}],
					"MATERIAL_GROUP_TEXT_ENTITIES": [{
						"MATERIAL_GROUP_ID": "ZTEST",
						"LANGUAGE": "EN",
						"MATERIAL_GROUP_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"MATERIAL_GROUP_ENTITIES": [],
					"MATERIAL_GROUP_TEXT_ENTITIES": [{
						"MATERIAL_GROUP_ID": "ZTEST",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T13:35:10.312Z",
						"MATERIAL_GROUP_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"MATERIAL_GROUP_ENTITIES": [{
						"MATERIAL_GROUP_ID": "ZTEST",
						"_VALID_FROM": "2015-10-07T13:35:10.288Z"
					}],
					"MATERIAL_GROUP_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_GROUP_ENTITIES": [
			            {
			              "MATERIAL_GROUP_ID": "ZTEST",
			              "_VALID_FROM": "2015-11-17T17:01:15.214Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "MATERIAL_GROUP_TEXT_ENTITIES": [
			            {
			              "MATERIAL_GROUP_ID": "ZTEST",
			              "LANGUAGE": "EN",
			              "MATERIAL_GROUP_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:01:15.233Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_GROUP_TEXT_ENTITIES": []
					},
					"DELETE": {
						"MATERIAL_GROUP_ENTITIES": [],
						"MATERIAL_GROUP_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_GROUP_ENTITIES": [
			              {
			                "MATERIAL_GROUP_ID": "ZTEST",
			                "_VALID_FROM": "2015-10-07T13:35:10.288Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_GROUP_TEXT_ENTITIES": [
			              {
			                "MATERIAL_GROUP_ID": "ZTEST",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T13:35:10.312Z",
			                "MATERIAL_GROUP_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material-plant"></a>
Gets information about Material Plant masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material_Plant')* ... type of the business object that is requested, for this section is used Material Plant
		+ Values
			+ 'Material_Plant'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'MATERIAL_ID%#100-100')* ... filter that will be used to filter returned data, Ex. =MATERIAL_ID=#100-100
	+ **searchAutocomplete** *(optional, string, 100-100)* ... filter data to start with a string, Ex. 100-100
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_PLANT_ENTITIES": [
			          {
			            "MATERIAL_ID": "#100-100",
			            "PLANT_ID": "#PT1",
			            "OVERHEAD_GROUP_ID": "#OG2",
			            "VALUATION_CLASS_ID": "#VC2",
			            "MATERIAL_LOT_SIZE": "100",
			            "MATERIAL_LOT_SIZE_UOM_ID": "PC",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ],
			        "MATERIAL_ENTITIES": [
			          {
			            "MATERIAL_ID": "#100-100",
			            "BASE_UOM_ID": "PC",
			            "MATERIAL_GROUP_ID": "#MECH",
			            "MATERIAL_TYPE_ID": "#SEM",
						"IS_CREATED_VIA_CAD_INTEGRATION": 1,
                        "IS_PHANTOM_MATERIAL": null,
                        "IS_CONFIGURABLE_MATERIAL": 1,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "MATERIAL_DESCRIPTION": "Casing"
			          }
			        ],
			        "PLANT_ENTITIES": [
			          {
			            "PLANT_ID": "#PT1",
			            "COMPANY_CODE_ID": "#C1",
			            "COUNTRY": "Germany",
			            "POSTAL_CODE": "12345",
			            "CITY": "Dresden",
			            "STREET_NUMBER_OR_PO_BOX": "Werkstraße 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PLANT_DESCRIPTION": "Plant 1"
			          }
			        ],
			        "OVERHEAD_GROUP_ENTITIES": [
			          {
			            "OVERHEAD_GROUP_ID": "#OG2",
			            "PLANT_ID": "#PT1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "OVERHEAD_GROUP_DESCRIPTION": "Overhead Group 2"
			          }
			        ],
			        "VALUATION_CLASS_ENTITIES": [
			          {
			            "VALUATION_CLASS_ID": "#VC2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "VALUATION_CLASS_DESCRIPTION": "Valuation Class 2"
			          }
			        ],
			        "COMPANY_CODE_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COMPANY_CODE_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "COMPANY_CODE_DESCRIPTION": "Company 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material Plant. Supports batch opperation , user can create, update or delete multiple Material Plant objects.

+ Parameters
	+ **business_object** *(required, string, 'Material_Plant')* ... type of the business object that is requested, for this section is used Material Plant
		+ Values
			+ 'Material_Plant'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
			      "MATERIAL_PLANT_ENTITIES": [{
			          "MATERIAL_ID": "0001",
			          "PLANT_ID": "0001",
			          "OVERHEAD_GROUP_ID": "0001",
			          "VALUATION_CLASS_ID": "0001",
			          "MATERIAL_LOT_SIZE": 10,
			          "MATERIAL_LOT_SIZE_UOM_ID":"PC"
			      }]
				},
				
				"UPDATE":{	
			      "MATERIAL_PLANT_ENTITIES": [{
			          "MATERIAL_ID": "0001",
			          "PLANT_ID": "0001",
			          "OVERHEAD_GROUP_ID": "0001",
			          "VALUATION_CLASS_ID": "0001",
			          "MATERIAL_LOT_SIZE": 10,
			          "MATERIAL_LOT_SIZE_UOM_ID":"PC",
			          "_VALID_FROM": "2015-06-24T13:26:11.865Z" 
			      }]	
				},
				
				"DELETE":{
			      "MATERIAL_PLANT_ENTITIES": [ {
			        "MATERIAL_ID": "0001",
			        "PLANT_ID": "0001",
			        "_VALID_FROM": "2015-06-24T13:26:11.865Z"
			      }]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_PLANT_ENTITIES": [
			            {
			              "MATERIAL_ID": "0001",
				          "PLANT_ID": "0001",
				          "OVERHEAD_GROUP_ID": "0001",
				          "VALUATION_CLASS_ID": "0001",
				          "MATERIAL_LOT_SIZE": 10,
				          "MATERIAL_LOT_SIZE_UOM_ID":"PC",
						  "_VALID_FROM": "2015-06-24T13:26:11.865Z"
						  "_VALID_TO": null,
						  "_SOURCE": 1,
						  "_CREATED_BY": " #CONTROLLER"
			            }
			          ]
			        },
					"UPDATE": {
						"MATERIAL_PLANT_ENTITIES": []
					},
					"DELETE": {
						"MATERIAL_PLANT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_PLANT_ENTITIES": [
			              {
			                "MATERIAL_ID": "0001",
			                "PLANT_ID": "0001",
			                "_VALID_FROM": "2015-06-24T13:26:11.865Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_PLANT_ENTITIES": [
			              {
			                "MATERIAL_ID": "0001",
			                "PLANT_ID": "0001",
			                "OVERHEAD_GROUP_ID": "0001",
			                "VALUATION_CLASS_ID": "0001",
			                "MATERIAL_LOT_SIZE": 10,
			                "MATERIAL_LOT_SIZE_UOM_ID": "PC",
			                "_VALID_FROM": "2015-06-24T13:26:11.865Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material-price"></a>
Gets information about Material Price masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material_Price')* ... type of the business object that is requested, for this section is used Material Price
		+ Values
			+ 'Material_Price'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'PRICE_SOURCE_ID%3d101')* ... filter that will be used to filter returned data, Ex. =PRICE_SOURCE_ID%3d101
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
	
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_PRICE_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 101,
			            "MATERIAL_ID": "#100-310",
			            "PLANT_ID": "#PT5",
			            "VALID_FROM": "2016-01-01T00:00:00.000Z",
						"VALID_TO": null,
			            "PRICE_FIXED_PORTION": "0",
			            "PRICE_VARIABLE_PORTION": "24",
			            "TRANSACTION_CURRENCY_ID": "USD",
			            "PRICE_UNIT": "5",
			            "PRICE_UNIT_UOM_ID": "PC",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER"
			          }
			        ],
			        "PRICE_SOURCE_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 101,
			            "CONFIDENCE_LEVEL_ID": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PRICE_SOURCE_DESCRIPTION": "PLC Standard Price"
			          }
			        ],
			        "CONFIDENCE_LEVEL_ENTITIES": [
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Medium"
			          }
			        ],
			        "MATERIAL_ENTITIES": [
			          {
			            "MATERIAL_ID": "#100-310",
			            "BASE_UOM_ID": "PC",
			            "MATERIAL_GROUP_ID": "#MECH",
			            "MATERIAL_TYPE_ID": "#RAW",
			            "IS_PHANTOM_MATERIAL": 1,
						"IS_CONFIGURABLE_MATERIAL": null,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "MATERIAL_DESCRIPTION": "Slug for impeller"
			          }
			        ],
			        "MATERIAL_GROUP_ENTITIES": [
			          {
			            "MATERIAL_GROUP_ID": "#MECH",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
						"_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "MATERIAL_GROUP_DESCRIPTION": "Mechanical Components"
			          }
			        ],
			        "MATERIAL_TYPE_ENTITIES": [
			          {
			            "MATERIAL_TYPE_ID": "#RAW",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "MATERIAL_TYPE_DESCRIPTION": "Raw materials"
			          }
			        ],
			        "PLANT_ENTITIES": [
			          {
			            "PLANT_ID": "#PT5",
			            "COMPANY_CODE_ID": "#C5",
			            "COUNTRY": "Romania",
			            "POSTAL_CODE": "654321",
			            "REGION": "Ilfov",
			            "CITY": "Bucharest",
			            "STREET_NUMBER_OR_PO_BOX": "Adresa uzina 2",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PLANT_DESCRIPTION": "Plant 5"
			          }
			        ],
			        "COMPANY_CODE_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C5",
			            "CONTROLLING_AREA_ID": "#CA2",
			            "COMPANY_CODE_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "COMPANY_CODE_DESCRIPTION": "Company 5"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA2",
			            "CONTROLLING_AREA_CURRENCY_ID": "USD",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 2"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material Price. Supports batch opperation , user can create, update or delete multiple Material Price objects.

+ Parameters
	+ **business_object** *(required, string, 'Material_Price')* ... type of the business object that is requested, for this section is used Material Price
		+ Values
			+ 'Material_Price'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"MATERIAL_PRICE_ENTITIES": [{
						"PRICE_SOURCE_ID": 101,
						"MATERIAL_ID": "#MA1",
						"PLANT_ID": "#PT1",
						"VALID_FROM": "2015-10-07T00:00:00Z",
						"VALID_TO": "2015-10-28T00:00:00",
						"PRICE_FIXED_PORTION": 1.0,
						"PRICE_VARIABLE_PORTION": 1.0,
						"TRANSACTION_CURRENCY_ID": "EUR",
						"PRICE_UNIT": 1.0,
						"PRICE_UNIT_UOM_ID": "PC"
					}]
				},
				"UPDATE": {
					"MATERIAL_PRICE_ENTITIES": [{
						"PRICE_SOURCE_ID": 101,
						"MATERIAL_ID": "#MA1",
						"PLANT_ID": "#PT1",
						"VALID_FROM": "2015-10-07T00:00:00Z",
						"VALID_TO": "2015-10-30T00:00:00",
						"PRICE_FIXED_PORTION": 1.0,
						"PRICE_VARIABLE_PORTION": 1.0,
						"TRANSACTION_CURRENCY_ID": "EUR",
						"PRICE_UNIT": 3.0,
						"PRICE_UNIT_UOM_ID": "PC",
						"_VALID_FROM": "2015-10-07T12:51:55.256Z"
					}]
				},
				"DELETE": {
					"MATERIAL_PRICE_ENTITIES": [{
						"PRICE_SOURCE_ID": 101,
						"MATERIAL_ID": "#MA1",
						"PLANT_ID": "#PT1",
						"VALID_FROM": "2015-10-07T00:00:00Z",
						"PRICE_FIXED_PORTION": 0.0,
						"PRICE_VARIABLE_PORTION": 0.0,
						"PRICE_UNIT": 0.0,
						"_VALID_FROM": "2015-10-07T12:52:05.572Z"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_PRICE_ENTITIES": [
			            {
			              "PRICE_SOURCE_ID": 101,
			              "MATERIAL_ID": "#MA1",
			              "PLANT_ID": "#PT1",
			              "VALID_FROM": "2015-10-07",
			              "VALID_TO": "2015-10-28",
			              "PRICE_FIXED_PORTION": 1,
			              "PRICE_VARIABLE_PORTION": 1,
			              "TRANSACTION_CURRENCY_ID": "EUR",
			              "PRICE_UNIT": 1,
			              "PRICE_UNIT_UOM_ID": "PC",
			              "_VALID_FROM": "2015-11-17T17:09:16.004Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"MATERIAL_PRICE_ENTITIES": []
					},
					"DELETE": {
						"MATERIAL_PRICE_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_PRICE_ENTITIES": [
			              {
			                "PRICE_SOURCE_ID": 101,
			                "MATERIAL_ID": "#MA1",
			                "PLANT_ID": "#PT1",
			                "VALID_FROM": "2015-10-07",
			                "PRICE_FIXED_PORTION": 0,
			                "PRICE_VARIABLE_PORTION": 0,
			                "PRICE_UNIT": 0,
			                "_VALID_FROM": "2015-10-07T12:52:05.572Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_PRICE_ENTITIES": [
			              {
			                "PRICE_SOURCE_ID": 101,
			                "MATERIAL_ID": "#MA1",
			                "PLANT_ID": "#PT1",
			                "VALID_FROM": "2015-10-07",
			                "VALID_TO": "2015-10-30",
			                "PRICE_FIXED_PORTION": 1,
			                "PRICE_VARIABLE_PORTION": 1,
			                "TRANSACTION_CURRENCY_ID": "EUR",
			                "PRICE_UNIT": 3,
			                "PRICE_UNIT_UOM_ID": "PC",
			                "_VALID_FROM": "2015-10-07T12:51:55.256Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-material-type"></a>
Gets information about Material Type masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Material_Type')* ... type of the business object that is requested, for this section is used Material Type
		+ Values
			+ 'Material_Type'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'MATERIAL_TYPE_ID%3dABF')* ... filter that will be used to filter returned data, Ex. =MATERIAL_TYPE_ID%3dABF
	+ **searchAutocomplete** *(optional, string, waste)* ... filter data to start with a string, Ex. waste
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "MATERIAL_TYPE_ENTITIES": [
			          {
			            "MATERIAL_TYPE_ID": "#FIN",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "MATERIAL_TYPE_DESCRIPTION": "Finished products"
			          }
			        ],
			        "MATERIAL_TYPE_TEXT_ENTITIES": [
			          {
			            "MATERIAL_TYPE_ID": "#FIN",
			            "LANGUAGE": "EN",
			            "MATERIAL_TYPE_DESCRIPTION": "Finished products",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "MATERIAL_TYPE_ID": "#FIN",
			            "LANGUAGE": "DE",
			            "MATERIAL_TYPE_DESCRIPTION": "Fertigerzeugnisse",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Material Type. Supports batch opperation , user can create, update or delete multiple Material Type objects.

+ Parameters
	+ **business_object** *(required, string, 'Material_Type')* ... type of the business object that is requested, for this section is used Material Type
		+ Values
			+ 'Material_Type'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"MATERIAL_TYPE_ENTITIES": [{
						"MATERIAL_TYPE_ID": "ZTES"
					}],
					"MATERIAL_TYPE_TEXT_ENTITIES": [{
						"MATERIAL_TYPE_ID": "ZTES",
						"LANGUAGE": "EN",
						"MATERIAL_TYPE_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"MATERIAL_TYPE_ENTITIES": [],
					"MATERIAL_TYPE_TEXT_ENTITIES": [{
						"MATERIAL_TYPE_ID": "ZTES",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T13:32:49.556Z",
						"MATERIAL_TYPE_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"MATERIAL_TYPE_ENTITIES": [{
						"MATERIAL_TYPE_ID": "ZTES",
						"_VALID_FROM": "2015-10-07T13:32:49.535Z"
					}],
					"MATERIAL_TYPE_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "MATERIAL_TYPE_ENTITIES": [
			            {
			              "MATERIAL_TYPE_ID": "ZTES",
			              "_VALID_FROM": "2015-11-17T17:13:19.897Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "MATERIAL_TYPE_TEXT_ENTITIES": [
			            {
			              "MATERIAL_TYPE_ID": "ZTES",
			              "LANGUAGE": "EN",
			              "MATERIAL_TYPE_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:13:19.909Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_TYPE_ENTITIES": [
			              {
			                "MATERIAL_TYPE_ID": "ZTES",
			                "_VALID_FROM": "2015-10-07T13:32:49.535Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "MATERIAL_TYPE_TEXT_ENTITIES": [
			              {
			                "MATERIAL_TYPE_ID": "ZTES",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T13:32:49.556Z",
			                "MATERIAL_TYPE_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-overhead-group"></a>
Gets information about Overhead Group masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Overhead_Group')* ... type of the business object that is requested, for this section is used Overhead Group
		+ Values
			+ 'Overhead_Group'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'OVERHEAD_GROUP_ID%3dSAP1')* ... filter that will be used to filter returned data, Ex. =OVERHEAD_GROUP_ID%3dSAP1
	+ **searchAutocomplete** *(optional, string, #OG1)* ... filter data to start with a string, Ex. #OG1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "OVERHEAD_GROUP_ENTITIES": [
			          {
			            "OVERHEAD_GROUP_ID": "#OG1",
			            "PLANT_ID": "#PT1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "OVERHEAD_GROUP_DESCRIPTION": "Overhead Group 1"
			          }
			        ],
			        "PLANT_ENTITIES": [
			          {
			            "PLANT_ID": "#PT1",
			            "COMPANY_CODE_ID": "#C1",
			            "COUNTRY": "Germany",
			            "POSTAL_CODE": "12345",
			            "CITY": "Dresden",
			            "STREET_NUMBER_OR_PO_BOX": "Werkstraße 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PLANT_DESCRIPTION": "Plant 1"
			          }
			        ],
			        "COMPANY_CODE_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COMPANY_CODE_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "COMPANY_CODE_DESCRIPTION": "Company 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "OVERHEAD_GROUP_TEXT_ENTITIES": [
			          {
			            "OVERHEAD_GROUP_ID": "#OG1",
			            "PLANT_ID": "#PT1",
			            "LANGUAGE": "EN",
			            "OVERHEAD_GROUP_DESCRIPTION": "Overhead Group 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "OVERHEAD_GROUP_ID": "#OG1",
			            "PLANT_ID": "#PT1",
			            "LANGUAGE": "DE",
			            "OVERHEAD_GROUP_DESCRIPTION": "Gemeinkostengruppe 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Overhead Group. Supports batch opperation , user can create, update or delete multiple Overhead Group objects.

+ Parameters
	+ **business_object** *(required, string, 'Overhead_Group')* ... type of the business object that is requested, for this section is used Overhead Group
		+ Values
			+ 'Overhead_Group'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"OVERHEAD_GROUP_ENTITIES": [{
						"OVERHEAD_GROUP_ID": "ZTEST",
						"PLANT_ID": "1000"
					}],
					"OVERHEAD_GROUP_TEXT_ENTITIES": [{
						"OVERHEAD_GROUP_ID": "ZTEST",
						"PLANT_ID": "1000",
						"LANGUAGE": "EN",
						"OVERHEAD_GROUP_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"OVERHEAD_GROUP_ENTITIES": [],
					"OVERHEAD_GROUP_TEXT_ENTITIES": [{
						"OVERHEAD_GROUP_ID": "ZTEST",
						"PLANT_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T12:27:51.847Z",
						"OVERHEAD_GROUP_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"OVERHEAD_GROUP_ENTITIES": [{
						"OVERHEAD_GROUP_ID": "ZTEST",
						"PLANT_ID": "1000",
						"_VALID_FROM": "2015-10-07T12:27:51.72Z"
					}],
					"OVERHEAD_GROUP_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "OVERHEAD_GROUP_ENTITIES": [
			            {
			              "OVERHEAD_GROUP_ID": "ZTEST",
			              "PLANT_ID": "1000",
			              "_VALID_FROM": "2015-11-17T17:16:41.261Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "OVERHEAD_GROUP_TEXT_ENTITIES": [
			            {
			              "OVERHEAD_GROUP_ID": "ZTEST",
			              "PLANT_ID": "1000",
			              "LANGUAGE": "EN",
			              "OVERHEAD_GROUP_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:16:41.431Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "OVERHEAD_GROUP_ENTITIES": [
			              {
			                "OVERHEAD_GROUP_ID": "ZTEST",
			                "PLANT_ID": "1000",
			                "_VALID_FROM": "2015-10-07T12:27:51.72Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "OVERHEAD_GROUP_TEXT_ENTITIES": [
			              {
			                "OVERHEAD_GROUP_ID": "ZTEST",
			                "PLANT_ID": "1000",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T12:27:51.847Z",
			                "OVERHEAD_GROUP_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-plant"></a>
Gets information about Plant masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Plant')* ... type of the business object that is requested, for this section is used Plant
		+ Values
			+ 'Plant'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'PLANT_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =PLANT_ID%3d1000
	+ **searchAutocomplete** *(optional, string, werk)* ... filter data to start with a string, Ex. werk
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "PLANT_ENTITIES": [
			          {
			            "PLANT_ID": "#PT1",
			            "COMPANY_CODE_ID": "#C1",
			            "COUNTRY": "Germany",
						"REGION": null,
			            "POSTAL_CODE": "12345",
			            "CITY": "Dresden",
			            "STREET_NUMBER_OR_PO_BOX": "Werkstraße 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "PLANT_DESCRIPTION": "Plant 1"
			          }
			        ],
			        "COMPANY_CODE_ENTITIES": [
			          {
			            "COMPANY_CODE_ID": "#C1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "COMPANY_CODE_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "COMPANY_CODE_DESCRIPTION": "Company 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						"_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "PLANT_TEXT_ENTITIES": [
			          {
			            "PLANT_ID": "#PT1",
			            "LANGUAGE": "EN",
			            "PLANT_DESCRIPTION": "Plant 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "PLANT_ID": "#PT1",
			            "LANGUAGE": "DE",
			            "PLANT_DESCRIPTION": "Werk 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Plant. Supports batch opperation , user can create, update or delete multiple Plant objects.

+ Parameters
	+ **business_object** *(required, string, 'Plant')* ... type of the business object that is requested, for this section is used Plant
		+ Values
			+ 'Plant'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"PLANT_ENTITIES": [{
						"PLANT_ID": "ZTES",
						"COMPANY_CODE_ID": "1000",
						"COUNTRY": "RO",
						"POSTAL_CODE": "31200",
						"REGION": "TIMIS",
						"CITY": "TIMISOARA"
					}],
					"PLANT_TEXT_ENTITIES": [{
						"PLANT_ID": "ZTES",
						"LANGUAGE": "EN",
						"PLANT_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"PLANT_ENTITIES": [{
						"PLANT_ID": "ZTES",
						"COMPANY_CODE_ID": "1000",
						"COUNTRY": "ROMANIA",
						"POSTAL_CODE": "31200",
						"REGION": "TIMIS",
						"CITY": "TIMISOARA",
						"STREET_NUMBER_OR_PO_BOX": "12",
						"_VALID_FROM": "2015-10-07T13:28:56.425Z"
					}],
					"PLANT_TEXT_ENTITIES": [{
						"PLANT_ID": "ZTES",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T13:28:56.442Z",
						"PLANT_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"PLANT_ENTITIES": [{
						"PLANT_ID": "ZTES",
						"_VALID_FROM": "2015-10-07T13:29:15.806Z"
					}],
					"PLANT_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "PLANT_ENTITIES": [
			            {
			              "PLANT_ID": "ZTES",
			              "COMPANY_CODE_ID": "1000",
			              "COUNTRY": "RO",
			              "POSTAL_CODE": "31200",
			              "REGION": "TIMIS",
			              "CITY": "TIMISOARA",
			              "_VALID_FROM": "2015-11-17T17:20:34.670Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "PLANT_TEXT_ENTITIES": [
			            {
			              "PLANT_ID": "ZTES",
			              "LANGUAGE": "EN",
			              "PLANT_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:20:34.685Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"PLANT_ENTITIES": [],
						"PLANT_TEXT_ENTITIES": []
					},
					"DELETE": {
						"PLANT_ENTITIES": [],
						"PLANT_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "PLANT_ENTITIES": [
			              {
			                "PLANT_ID": "ZTES",
			                "_VALID_FROM": "2015-10-07T13:29:15.806Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "PLANT_ENTITIES": [
			              {
			                "PLANT_ID": "ZTES",
			                "COMPANY_CODE_ID": "1000",
			                "COUNTRY": "ROMANIA",
			                "POSTAL_CODE": "31200",
			                "REGION": "TIMIS",
			                "CITY": "TIMISOARA",
			                "STREET_NUMBER_OR_PO_BOX": "12",
			                "_VALID_FROM": "2015-10-07T13:28:56.425Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-price-source"></a>
Gets information about Price Source masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Price_Source')* ... type of the business object that is requested, for this section is used Price Source
		+ Values
			+ 'Price_Source'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'PRICE_SOURCE_ID%101')* ... filter that will be used to filter returned data, Ex. =PRICE_SOURCE_ID=101
	+ **searchAutocomplete** *(optional, string, 101)* ... filter data to start with a string, Ex. 101
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "PRICE_SOURCE_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 101,
			            "CONFIDENCE_LEVEL_ID": 3,
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "PRICE_SOURCE_DESCRIPTION": "PLC Standard Price"
			          }
			        ],
			        "PRICE_SOURCE_TEXT_ENTITIES": [
			          {
			            "PRICE_SOURCE_ID": 101,
			            "LANGUAGE": "DE",
			            "PRICE_SOURCE_DESCRIPTION": "PLC Standardpreis",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "PRICE_SOURCE_ID": 101,
			            "LANGUAGE": "EN",
			            "PRICE_SOURCE_DESCRIPTION": "PLC Standard Price",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ],
			        "CONFIDENCE_LEVEL_ENTITIES": [
			          {
			            "CONFIDENCE_LEVEL_ID": 3,
			            "CONFIDENCE_LEVEL_DESCRIPTION": "Medium"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-profit-center"></a>
Gets information about Profit Center masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Profit_Center')* ... type of the business object that is requested, for this section is used Profit Center
		+ Values
			+ 'Profit_Center'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'PROFIT_CENTER_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=1000
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "PROFIT_CENTER_ENTITIES": [
			          {
			            "PROFIT_CENTER_ID": "#PC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "PROFIT_CENTER_DESCRIPTION": "Profit Center 1"
			          }
			        ],
			        "CONTROLLING_AREA_ENTITIES": [
			          {
			            "CONTROLLING_AREA_ID": "#CA1",
			            "CONTROLLING_AREA_CURRENCY_ID": "EUR",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
						 "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER",
			            "CONTROLLING_AREA_DESCRIPTION": "Controlling Area 1"
			          }
			        ],
			        "PROFIT_CENTER_TEXT_ENTITIES": [
			          {
			            "PROFIT_CENTER_ID": "#PC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "EN",
			            "PROFIT_CENTER_DESCRIPTION": "Profit Center 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          },
			          {
			            "PROFIT_CENTER_ID": "#PC1",
			            "CONTROLLING_AREA_ID": "#CA1",
			            "LANGUAGE": "DE",
			            "PROFIT_CENTER_DESCRIPTION": "Profitcenter 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Profit Center. Supports batch opperation , user can create, update or delete multiple Profit Center objects.

+ Parameters
	+ **business_object** *(required, string, 'Profit_Center')* ... type of the business object that is requested, for this section is used Profit Center
		+ Values
			+ 'Profit_Center'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"PROFIT_CENTER_ENTITIES": [{
						"PROFIT_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000"
					}],
					"PROFIT_CENTER_TEXT_ENTITIES": [{
						"PROFIT_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"PROFIT_CENTER_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"PROFIT_CENTER_ENTITIES": [],
					"PROFIT_CENTER_TEXT_ENTITIES": [{
						"PROFIT_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T14:35:22.533Z",
						"PROFIT_CENTER_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"UPDATE": {
					"PROFIT_CENTER_ENTITIES": [],
					"PROFIT_CENTER_TEXT_ENTITIES": [{
						"PROFIT_CENTER_ID": "ZTEST",
						"CONTROLLING_AREA_ID": "1000",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T14:35:22.533Z",
						"PROFIT_CENTER_DESCRIPTION": "TEST UPDATED"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "PROFIT_CENTER_ENTITIES": [
			            {
			              "PROFIT_CENTER_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "_VALID_FROM": "2015-11-17T17:28:09.784Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "PROFIT_CENTER_TEXT_ENTITIES": [
			            {
			              "PROFIT_CENTER_ID": "ZTEST",
			              "CONTROLLING_AREA_ID": "1000",
			              "LANGUAGE": "EN",
			              "PROFIT_CENTER_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:28:09.805Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        },
					"UPDATE": {
						"PROFIT_CENTER_ENTITIES": [],
						"PROFIT_CENTER_TEXT_ENTITIES": []
					},
					"DELETE": {
						"PROFIT_CENTER_ENTITIES": [],
						"PROFIT_CENTER_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "PROFIT_CENTER_TEXT_ENTITIES": [
			              {
			                "PROFIT_CENTER_ID": "ZTEST",
			                "CONTROLLING_AREA_ID": "1000",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T14:35:22.533Z",
			                "PROFIT_CENTER_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-unit-of-measure"></a>
Gets information about Unit Of Measure masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Unit_Of_Measure')* ... type of the business object that is requested, for this section is used Unit Of Measure
		+ Values
			+ 'Unit_Of_Measure'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'CONTROLLING_AREA_ID%3d1000')* ... filter that will be used to filter returned data, Ex. =CONTROLLING_AREA_ID=1000
	+ **searchAutocomplete** *(optional, string, 10)* ... filter data to start with a string, Ex. 10
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "DIMENSION_ENTITIES": [
			          {
			            "DIMENSION_ID": "NONE",
                        "_VALID_FROM": "2000-01-01T00:00:00.000Z",
                        "_VALID_TO": null,
                        "_SOURCE": 1,
                        "_CREATED_BY": "#CONTROLLER",
                        "_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
                        "DIMENSION_DESCRIPTION": "None"
			          }
			        ],
			        "UNIT_OF_MEASURE_ENTITIES": [
			          {
			            "UOM_ID": "%%",
			            "DIMENSION_ID": "NONE",
			            "NUMERATOR": 1,
			            "DENOMINATOR": 1,
			            "EXPONENT_BASE10": 0,
			            "SI_CONSTANT": "0",
						"_VALID_FROM": null,
                        "_VALID_TO": null,
			            "_SOURCE": 2,
						"_CREATED_BY": null,
                        "_VALID_FROM_FIRST_VERSION": null,
                        "_CREATED_BY_FIRST_VERSION": null,
			            "UOM_CODE": "010",
			            "UOM_DESCRIPTION": ""
			          }
			        ],
			        "UNIT_OF_MEASURE_TEXT_ENTITIES": [
			          {
			            "UOM_ID": "%%",
			            "LANGUAGE": "DE",
			            "UOM_CODE": "009",
			            "UOM_DESCRIPTION": "",
			            "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
			          },
			          {
			            "UOM_ID": "%%",
			            "LANGUAGE": "EN",
			            "UOM_CODE": "010",
			            "UOM_DESCRIPTION": "",
			            "_VALID_FROM": null,
                        "_VALID_TO": null,
                        "_SOURCE": 2,
                        "_CREATED_BY": null
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

## POST
Insert, Creates or Deletes a masterdata object Unit Of Measure. Supports batch opperation , user can create, update or delete multiple Unit Of Measure objects.

+ Parameters
	+ **business_object** *(required, string, 'Unit_Of_Measure')* ... type of the business object that is requested, for this section is used Unit Of Measure
		+ Values
			+ 'Unit_Of_Measure'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
			  "CREATE": {
			    "UNIT_OF_MEASURE_ENTITIES": [{
			        "UOM_ID": "TST",
			        "DIMENSION_ID": "TEST",
			        "NUMERATOR": 1,
			        "DENOMINATOR": 1,
			        "EXPONENT_BASE10": 0,
			        "SI_CONSTANT": 0
			     }],
			     "UNIT_OF_MEASURE_TEXT_ENTITIES": [{
			         "UOM_ID": "TST",
			         "LANGUAGE": "EN",
			         "UOM_CODE": "TST",
			         "UOM_DESCRIPTION": "Test"
			     }]         
			   },
			   
			  "UPDATE": {
			    "UNIT_OF_MEASURE_ENTITIES": [{
			        "UOM_ID": "TST",
			        "DIMENSION_ID": "TEST",
			        "NUMERATOR": 1,
			        "DENOMINATOR": 1,
			        "EXPONENT_BASE10": 0,
			        "SI_CONSTANT": 0,
			        "_VALID_FROM": "2015-06-24T07:25:54.683Z"
			     }],
			     "UNIT_OF_MEASURE_TEXT_ENTITIES": [{
			         "UOM_ID": "TST",
			         "LANGUAGE": "EN",
			         "UOM_CODE": "TST",
			         "UOM_DESCRIPTION": "Test",
			         "_VALID_FROM": "2015-06-24T07:25:54.700Z"
			     }]               
			  },
			  
			 "DELETE": {
			    "UNIT_OF_MEASURE_ENTITIES": [{
			        "UOM_ID": "TST",
			        "_VALID_FROM": "2015-06-24T07:26:28.517Z"
			     }],
			     "UNIT_OF_MEASURE_TEXT_ENTITIES": [{
			         "UOM_ID": "TST",
			         "LANGUAGE": "EN",
			         "_VALID_FROM": "2015-06-24T07:25:54.700Z"
			     }] 
			   }
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			         	"UNIT_OF_MEASURE_ENTITIES": [{
					        "UOM_ID": "TST",
					        "DIMENSION_ID": "TEST",
					        "NUMERATOR": 1,
					        "DENOMINATOR": 1,
					        "EXPONENT_BASE10": 0,
					        "SI_CONSTANT": 0,
							"_VALID_FROM": "2015-11-17T17:28:09.805Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": "I309362"
				     	}],
				    	"UNIT_OF_MEASURE_TEXT_ENTITIES": [{
					         "UOM_ID": "TST",
					         "LANGUAGE": "EN",
					         "UOM_CODE": "TST",
					         "UOM_DESCRIPTION": "Test",
							 "_VALID_FROM": "2015-11-17T17:28:09.805Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": "I309362"
				     	},
						{
					         "UOM_ID": "TST",
					         "LANGUAGE": "DE",
					         "UOM_CODE": "TST",
					         "UOM_DESCRIPTION": "Test DE",
							 "_VALID_FROM": "2015-11-17T17:28:09.805Z",
							"_VALID_TO": null,
							"_SOURCE": 1,
							"_CREATED_BY": "I309362"
				     	}]
			        },
					"UPDATE": {
						"UNIT_OF_MEASURE_ENTITIES": [],
						"UNIT_OF_MEASURE_TEXT_ENTITIES": []
					},
					"DELETE": {
						"UNIT_OF_MEASURE_ENTITIES": [],
						"UNIT_OF_MEASURE_TEXT_ENTITIES": []
					}
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_DUPLICATE_ERROR",
					"severity": "Error",
					"operation": "Create",
					"details": {
						"administrationObj": {
							"UNIT_OF_MEASURE_ENTITIES": [
								{
									"UOM_ID": "RTY",
									"DIMENSION_ID": "TEST",
									"NUMERATOR": 1,
									"DENOMINATOR": 1,
									"EXPONENT_BASE10": 0,
									"SI_CONSTANT": 0,
									"_VALID_FROM": "2015-06-24T07:25:54.683Z"
								}
							]
						},
						"administrationObjType": "MainObj"
					}
				},
				{
					"code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
					"severity": "Error",
					"operation": "Update",
					"details": {
						"administrationObj": {
							"UNIT_OF_MEASURE_TEXT_ENTITIES": [
								{
									"UOM_ID": "RTY",
									"LANGUAGE": "EN",
									"UOM_CODE": "TST",
									"UOM_DESCRIPTION": "Test",
									"_VALID_FROM": "2015-06-24T07:25:54.700Z"
								}
							]
						},
						"administrationObjType": "TextObj"
					}
				}
			    ]
			  },
			  "body": {}
			}


#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-valuation-class"></a>
Gets information about Valuation Class masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Valuation_Class')* ... type of the business object that is requested, for this section is used Valuation Class
		+ Values
			+ 'Valuation_Class'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'VALUATION_CLASS_ID%3d3000')* ... filter that will be used to filter returned data, Ex. =VALUATION_CLASS_ID%3d3000
	+ **searchAutocomplete** *(optional, string, #VC1)* ... filter data to start with a string, Ex. #VC1
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "VALUATION_CLASS_ENTITIES": [
			          {
			            "VALUATION_CLASS_ID": "#VC1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": "#CONTROLLER",
			            "VALUATION_CLASS_DESCRIPTION": "Valuation Class 1"
			          }
			        ],
			        "VALUATION_CLASS_TEXT_ENTITIES": [
			          {
			            "VALUATION_CLASS_ID": "#VC1",
			            "LANGUAGE": "EN",
			            "VALUATION_CLASS_DESCRIPTION": "Valuation Class 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          },
			          {
			            "VALUATION_CLASS_ID": "#VC1",
			            "LANGUAGE": "DE",
			            "VALUATION_CLASS_DESCRIPTION": "Bewertungsklasse 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": "#CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Valuation Class. Supports batch opperation , user can create, update or delete multiple Valuation Class objects.

+ Parameters
	+ **business_object** *(required, string, 'Valuation_Class')* ... type of the business object that is requested, for this section is used Valuation Class
		+ Values
			+ 'Valuation_Class'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"VALUATION_CLASS_ENTITIES": [{
						"VALUATION_CLASS_ID": "ZTES"
					}],
					"VALUATION_CLASS_TEXT_ENTITIES": [{
						"VALUATION_CLASS_ID": "ZTES",
						"LANGUAGE": "EN",
						"VALUATION_CLASS_DESCRIPTION": "TEST"
					}]
				},
				"UPDATE": {
					"VALUATION_CLASS_ENTITIES": [],
					"VALUATION_CLASS_TEXT_ENTITIES": [{
						"VALUATION_CLASS_ID": "ZTES",
						"LANGUAGE": "EN",
						"_VALID_FROM": "2015-10-07T12:31:08.033Z",
						"VALUATION_CLASS_DESCRIPTION": "TEST UPDATED"
					}]
				},
				"DELETE": {
					"VALUATION_CLASS_ENTITIES": [{
						"VALUATION_CLASS_ID": "ZTES",
						"_VALID_FROM": "2015-10-07T12:31:08.023Z"
					}],
					"VALUATION_CLASS_TEXT_ENTITIES": []
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "VALUATION_CLASS_ENTITIES": [
			            {
			              "VALUATION_CLASS_ID": "ZTES",
			              "_VALID_FROM": "2015-11-17T17:44:44.635Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ],
			          "VALUATION_CLASS_TEXT_ENTITIES": [
			            {
			              "VALUATION_CLASS_ID": "ZTES",
			              "LANGUAGE": "EN",
			              "VALUATION_CLASS_DESCRIPTION": "TEST",
			              "_VALID_FROM": "2015-11-17T17:44:44.650Z",
			              "_VALID_TO": null,
						  "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "VALUATION_CLASS_ENTITIES": [
			              {
			                "VALUATION_CLASS_ID": "ZTES",
			                "_VALID_FROM": "2015-10-07T12:31:08.023Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "VALUATION_CLASS_TEXT_ENTITIES": [
			              {
			                "VALUATION_CLASS_ID": "ZTES",
			                "LANGUAGE": "EN",
			                "_VALID_FROM": "2015-10-07T12:31:08.033Z",
			                "VALUATION_CLASS_DESCRIPTION": "TEST UPDATED"
			              }
			            ]
			          },
					  "administrationObjType": "TextObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#/sap/plc/xs/rest/dispatcher.xsjs/administration/{business_object}{?top}{?filter}{?searchAutocomplete}{?masterdataTimestamp}<a name="administration-vendor"></a>
Gets information about Vendor masterdata object and related Masterdata objects

## GET

+ Parameters
	+ **business_object** *(required, string, 'Vendor')* ... type of the business object that is requested, for this section is used Vendor
		+ Values
			+ 'Vendor'
	+ **top** *(optional, integer, all)* ... number of records that will be retrived
	+ **filter** *(optional, string, 'VENDOR_NAME%3d%25Vendor')* ... filter that will be used to filter returned data, Ex. =VENDOR_NAME=Vendor
	+ **searchAutocomplete** *(optional, string, Vendor)* ... filter data to start with a string, Ex. Vendor
	+ **masterdataTimestamp** *(optional, UTCTimestamp, "2000-01-01T00:00:00.000Z")* ... if it is not setted then its default value is current date
		
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json

	
+ Response 200 (content-type:application/json; charset=utf-8)

    + Body

            {
			  "head": {
			    "metadata": {}
			  },
			  "body": {
			    "transactionaldata": [
			      {
			        "VENDOR_ENTITIES": [
			          {
			            "VENDOR_ID": "#VD1",
			            "VENDOR_NAME": "Lieferant 1",
			            "COUNTRY": "Germany",
			            "POSTAL_CODE": "12345",
			            "CITY": "Dresden",
			            "STREET_NUMBER_OR_PO_BOX": "Lieferantenstraße 1",
			            "_VALID_FROM": "2000-01-01T00:00:00.000Z",
						"_VALID_TO": null,
			            "_SOURCE": 1,
			            "_CREATED_BY": " #CONTROLLER",
			            "_VALID_FROM_FIRST_VERSION": "2000-01-01T00:00:00.000Z",
			            "_CREATED_BY_FIRST_VERSION": " #CONTROLLER"
			          }
			        ]
			      }
			    ]
			  }
			}


+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
## POST
Insert, Updates or Deletes a masterdata object Vendor. Supports batch opperation , user can create, update or delete multiple Vendor objects.

+ Parameters
	+ **business_object** *(required, string, 'Component_Split')* ... type of the business object that is requested, for this section is used Vendor
		+ Values
			+ 'Component_Split'
			
+ Request
    + Headers
            Host:<hana host>:<port><instance> 
            Accept:application/json
	
	+ Body
	
			{
				"CREATE": {
					"VENDOR_ENTITIES": [{
						"VENDOR_ID": "ZTEST",
						"VENDOR_NAME": "TEST",
						"COUNTRY": "RO",
						"POSTAL_CODE": "123321"
					}]
				},
				"UPDATE": {
					"VENDOR_ENTITIES": [{
						"VENDOR_ID": "ZTEST",
						"VENDOR_NAME": "TEST UPDATED",
						"COUNTRY": "RO",
						"POSTAL_CODE": "123321",
						"REGION": "TIMIS",
						"STREET_NUMBER_OR_PO_BOX": "12",
						"_VALID_FROM": "2015-10-07T13:46:49.123Z"
					}]
				},
				"DELETE": {
					"VENDOR_ENTITIES": [{
						"VENDOR_ID": "ZTEST",
						"_VALID_FROM": "2015-10-07T13:47:01.503Z"
					}]
				}
			}
	
+ Response 200 (content-type:application/json; charset=utf-8)
	
    + Body

            {
			  "head": {},
			  "body": {
			    "transactionaldata": [
			      {
			        "CREATE": {
			          "VENDOR_ENTITIES": [
			            {
			              "VENDOR_ID": "ZTEST",
			              "VENDOR_NAME": "TEST",
			              "COUNTRY": "RO",
			              "POSTAL_CODE": "123321",
			              "_VALID_FROM": "2015-11-17T17:48:51.775Z",
						  "_VALID_TO": null,
			              "_SOURCE": 1,
			              "_CREATED_BY": "I309362"
			            }
			          ]
			        }
			      }
			    ]
			  }
			}

+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
	
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_UNEXPECTED_EXCEPTION",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}
			
+ Response 500 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			    "head": {
			        "messages": [
			            {
			                "code": "GENERAL_VALIDATION_ERROR",
			                "severity": "Error"
			            }
			        ]
			    },
			    "body": {}
			}

+ Response 400 (content-type:application/json; charset=utf-8)
		
	+ Body
			
			{
			  "head": {
			    "messages": [
			      {
			        "code": "GENERAL_ENTITY_NOT_FOUND_ERROR",
			        "severity": "Error",
			        "operation": "Delete",
			        "details": {
			          "administrationObj": {
			            "VENDOR_ENTITIES": [
			              {
			                "VENDOR_ID": "ZTEST",
			                "_VALID_FROM": "2015-10-07T13:47:01.503Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      },
			      {
			        "code": "GENERAL_UNEXPECTED_EXCEPTION",
			        "severity": "Error",
			        "operation": "Update",
			        "details": {
			          "administrationObj": {
			            "VENDOR_ENTITIES": [
			              {
			                "VENDOR_ID": "ZTEST",
			                "VENDOR_NAME": "TEST UPDATED",
			                "COUNTRY": "RO",
			                "POSTAL_CODE": "123321",
			                "REGION": "TIMIS",
			                "STREET_NUMBER_OR_PO_BOX": "12",
			                "_VALID_FROM": "2015-10-07T13:46:49.123Z"
			              }
			            ]
			          },
					  "administrationObjType": "MainObj"
			        }
			      }
			    ]
			  },
			  "body": {}
			}
			
#plc-api-response-codes<a name="plc-api-response-codes"></a>
Response codes that you can receive from the back-end

		PLC-API-CODE : "GENERAL_VALIDATION_ERROR",
		HTTP-MAPPING-CODE : 500

		PLC-API-CODE : "GENERAL_UNEXPECTED_EXCEPTION",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "GENERAL_GENERATION_EXCEPTION",
		HTTP-MAPPING-CODE : 500

		PLC-API-CODE : "GENERAL_SERVICERESOURCE_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 404

		PLC-API-CODE : "GENERAL_METHOD_NOT_ALLOWED_ERROR",
		HTTP-MAPPING-CODE : 405

		PLC-API-CODE : "GENERAL_ACCESS_DENIED",
		HTTP-MAPPING-CODE : 403

		PLC-API-CODE : "GENERAL_ENTITY_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 404
		
		PLC-API-CODE : "GENERAL_REF_UOM_CURRENCY_ENTITY_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 404
		
		PLC-API-CODE : "GENERAL_ENTITY_ALREADY_EXISTS_ERROR",
		HTTP-MAPPING-CODE : 422
		
		PLC-API-CODE : "GENERAL_FORMULA_ENTITY_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 404

		PLC-API-CODE : "GENERAL_ENTITY_NOT_CURRENT_ERROR",
		HTTP-MAPPING-CODE : 400

		PLC-API-CODE : "GENERAL_SYSTEMMESSAGE_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR",
		HTTP-MAPPING-CODE : 500

		PLC-API-CODE : "CALCULATION_NAME_NOT_UNIQUE_ERROR",
		HTTP-MAPPING-CODE : 409

		PLC-API-CODE : "CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR",
		HTTP-MAPPING-CODE : 400

		PLC-API-CODE : "CALCULATIONVERSION_NOT_WRITABLE_ERROR",
		HTTP-MAPPING-CODE : 400

		PLC-API-CODE : "ENTITY_NOT_WRITABLE_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONVERSION_IS_STILL_OPENED_ERROR",
		HTTP-MAPPING-CODE : 400

		PLC-API-CODE : "CALCULATIONVERSION_IS_SINGLE_ERROR",
		HTTP-MAPPING-CODE : 400
		
		PLC-API-CODE : "CALCULATIONVERSION_IS_TEMPORARY_ERROR",
		HTTP-MAPPING-CODE : 400
		
		PLC-API-CODE : "GENERAL_SESSION_NOT_FOUND_EXCEPTION",
		HTTP-MAPPING-CODE : 307
		
		PLC-API-CODE : "ADDIN_STATUS_ALREADY_SET_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_UOM_NOT_FOUND_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_DIMENSION_NOT_FOUND_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_UOM_INCOMPATIBLE_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_DIVISION_BY_ZERO_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_EXCHANGERATE_NOT_DEFINED_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "CALCULATIONENGINE_REQUIRED_FIELD_NOT_DEFINED_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "ACCOUNTDETERMINATION_ACCOUNT_SET_INFO",
		HTTP-MAPPING-CODE : 200

		PLC-API-CODE : "BATCH_OPPERATION_ERROR",
		HTTP-MAPPING-CODE : 400

		PLC-API-CODE : "LOGON_LANGUAGE_NOT_SUPPORTED_ERROR",
		HTTP-MAPPING-CODE : 400
		
		PLC-API-CODE : "GENERAL_ENTITY_DUPLICATE_ERROR",
		HTTP-MAPPING-CODE : 400
		
		PLC-API-CODE : "SERVICE_UNAVAILABLE_ERROR",
		HTTP-MAPPING-CODE : 503
		
		PLC-API-CODE : "FORMULAINTERPRETER_DIVISION_BY_ZERO_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_SYNTAX_ERROR_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_SEMANTIC_MAPPING_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_SEMANTIC_MAPPING_UNDEFINED_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_OPERAND_DATATYPES_INCOMPATIBLE_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_RECIEVING_FIELD_NOT_DEFINED_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_RECIEVING_FIELD_DATATYPE_MISMATCH_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_REFERENCED_FIELD_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_CYCLIC_OR_UNRESOLVABLE_REFERENCE_DETECTED_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_PRECONDITION_BREAK_FOR_REFERENCED_FIELD_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_FUNCTION_NOT_FOUND_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_UOM_CONVERSION_NOT_SUPPORTED_ERROR",
		HTTP-MAPPING-CODE : 500
		
		PLC-API-CODE : "FORMULAINTERPRETER_CURRENCY_CONVERSION_NOT_SUPPORTED_ERROR",
		HTTP-MAPPING-CODE : 500
		