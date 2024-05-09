if ($.request.method === $.net.http.GET) {
    const checkAvailability = $.require("./lib/availabilityCheck-cf").checkAvailability;
    checkAvailability($, $.request, $.response);
} else {
    $.response.status = $.net.http.NOT_FOUND;
}