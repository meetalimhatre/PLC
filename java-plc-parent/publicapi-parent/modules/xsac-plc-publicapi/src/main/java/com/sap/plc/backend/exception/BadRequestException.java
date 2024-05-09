package com.sap.plc.backend.exception;

import org.springframework.http.HttpStatus;

import static com.sap.plc.backend.error.ErrorCode.GENERAL_VALIDATION_ERROR;

public class BadRequestException extends PlcException {

    private static final long serialVersionUID = 6667596765115130216L;

    public BadRequestException() {
        super(GENERAL_VALIDATION_ERROR, GENERAL_VALIDATION_ERROR.getMessage(), HttpStatus.BAD_REQUEST);
    }

}
