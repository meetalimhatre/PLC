/*
 * This creates a stub of the object returned as the reponse of an request.
 * It allows to retrieve the response body as an object instead of an JSON string.
 */
function ResponseObjectStub() {
    this.headers = new Map();
    let sBody = null;

    this.setBody = function (sJson) {
        sBody = sJson;
    };

    /*
     * Retrieves the response body as an object instead of an JSON string.
     */
    this.getParsedBody = function () {
        return JSON.parse(sBody);
    };
}
ResponseObjectStub.prototype = Object.create(ResponseObjectStub.prototype);
ResponseObjectStub.constructor = ResponseObjectStub;

module.exports = {
    ResponseObjectStub
};
