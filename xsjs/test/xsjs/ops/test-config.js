module.exports.appEnv = {
    isLocal: true,
    app: {
        "application_id": "testAppId",
        "application_name": "testAppName",
        "application_uris": [
            "test-product-lifecycle-costing-dev.cfapps.sap.hana.ondemand.com"
        ],
        "application_version": "testAppVersion",
        "cf_api": "https://test.api.cf.sap.hana.ondemand.com",
        "limits": {
            "disk": 1024,
            "fds": 16384,
            "mem": 1024
        },
        "name": "testAppName",
        "space_id": "testSpaceId",
        "space_name": "Metering_DEV",
        "uris": [
            "test-product-lifecycle-costing-dev-metering-dev-xsac-plc.cfapps.sap.hana.ondemand.com"
        ],
        "users": null,
        "version": "testVersion"
    },
    services: {
        "metering-service": [
            {
                "binding_name": null,
                "credentials": {
                    "client_id": "testClientId",
                    "client_secret": "testClientSecret",
                    "metering_url": "https://maas-metering.cfapps.sap.hana.ondemand.com/dev",
                    "token_url": "https://team1a.authentication.sap.hana.ondemand.com",
                    "region": "cf-eu10-canary"
                },
                "instance_name": "metering-service",
                "label": "metering",
                "name": "metering-service",
                "plan": "development",
                "provider": null,
                "syslog_drain_url": null,
                "tags": [
                    "metering",
                    "reporting"
                ],
                "volume_mounts": []
            }
        ]
    },
    name: 'test-app',
    port: 3000,
    bind: 'localhost',
    urls: ['http://localhost:3000'],
    url: 'http://localhost:3000'
};