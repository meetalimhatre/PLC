package com.sap.plc.backend.exception;

import com.sap.plc.backend.error.ErrorCode;
import org.springframework.http.HttpStatus;

/**
 * General exception class to be used through the business logic.
 */
public class PlcException extends RuntimeException {

    private static final long serialVersionUID = -8598948747100706297L;

    private ErrorCode applicationCode;
    private HttpStatus httpStatus;

    public PlcException() {
        this(ErrorCode.GENERAL_UNEXPECTED_ERROR);
    }

    public PlcException(String message) {
        this(ErrorCode.GENERAL_UNEXPECTED_ERROR, message);
    }

    public PlcException(ErrorCode code) {
        this(code, code.getMessage());
    }

    public PlcException(ErrorCode code, HttpStatus httpStatus) {
        this(code, code.getMessage(), httpStatus);
    }

    public PlcException(ErrorCode code, String message) {
        this(code, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public PlcException(ErrorCode code, String message, HttpStatus httpStatus) {
        super(message);
        this.applicationCode = code;
        this.httpStatus = httpStatus;
    }

    public ErrorCode getApplicationCode() {
        return applicationCode;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
