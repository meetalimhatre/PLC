var _ = $.require("lodash");
var ArgumentException = $.require("./exceptions").ArgumentException;


function buildRequestMessage(oRequest) {
    if (!(oRequest instanceof $.web.WebRequest.constructor)) {
        throw new ArgumentException("oRequest has be instance of $.web.WebRequest");
    }

    var aStringBuilder = [];
    aStringBuilder.push("Handling request:");
    aStringBuilder.push(oRequest.headers.get("~request_line"));
    aStringBuilder.push("-");

    var sBody = oRequest.body ? oRequest.body.asString() : undefined;
    if (!_.isString(sBody) || sBody.length === 0) {
        aStringBuilder.push("no body");
    } else {
        aStringBuilder.push("body: " + sBody + "");
    }

    return aStringBuilder.join(" ");
}

function buildResponseMessage(oResponse) {
    if (!(oResponse instanceof $.web.WebRequest.constructor)) {
        throw new ArgumentException("oResponse has be instance of $.web.WebResponse");
    }

    var aStringBuilder = [];
    aStringBuilder.push("Sending response:");
    aStringBuilder.push("status:");
    aStringBuilder.push(oResponse.status);
    aStringBuilder.push("-");
    aStringBuilder.push("content-type:");
    aStringBuilder.push(oResponse.contentType);

    return aStringBuilder.join(" ");
}

function buildExceptionMessage(oRequest, oException) {
    if (!(oRequest instanceof $.web.WebRequest.constructor)) {
        throw new ArgumentException("oRequest has be instance of $.web.WebRequest");
    }
    if (!(oException instanceof Error)) {
        throw new ArgumentException("oException has be instance of Error");
    }
    
    var aStringBuilder = [];
    aStringBuilder.push("Exception occured during handling request: ");
    aStringBuilder.push(oRequest.headers.get("~request_line"));
    aStringBuilder.push("-");
    aStringBuilder.push("type:");
    aStringBuilder.push(oException.name);
    aStringBuilder.push("-");
    aStringBuilder.push("message:");
    aStringBuilder.push(oException.message);
    aStringBuilder.push("-");
    aStringBuilder.push("stack:");
    aStringBuilder.push(oException.stack);
    
    return aStringBuilder.join(" ");
}
