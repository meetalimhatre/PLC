if ($.request.method === $.net.http.GET) {
    const licenseMetering = $.require('./lib/license-metering-cf').collectUsageData;
    licenseMetering($, $.request, $.response);
} else {
    $.response.status = $.net.http.NOT_FOUND;
}