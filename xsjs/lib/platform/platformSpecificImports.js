module.exports.getPostinstallConnection = () => {

    if (module.exports.isCloud()) {
        return {
            postInstallConnection: "xs.postinstall.xslib.postinstallConnection-cf"
        }
    } else {
        return {
            postInstallConnection: "xs.postinstall.xslib.postinstallConnection-xsa"
        }
    }

};

module.exports.isCloud = () => {
    //  additional safety measures
    if (process.env.VCAP_APPLICATION) {
        const vcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
        return vcapApplication.cf_api && vcapApplication.cf_api.length > 0 && process.env.TENANT_HOST_PATTERN;
    }
    return false;
}