package com.sap.plc.backend.exception;

import org.springframework.http.HttpStatus;

import static com.sap.plc.backend.error.ErrorCode.SERVICE_UNAVAILABLE_ERROR;

public class SystemUnavailableException extends PlcException {

    public static final String MESSAGE = "Service Unavailable (System is locked).";

    private static final long serialVersionUID = 2822789523882895718L;

    public SystemUnavailableException() {
        super(SERVICE_UNAVAILABLE_ERROR, SERVICE_UNAVAILABLE_ERROR.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
    }
}
