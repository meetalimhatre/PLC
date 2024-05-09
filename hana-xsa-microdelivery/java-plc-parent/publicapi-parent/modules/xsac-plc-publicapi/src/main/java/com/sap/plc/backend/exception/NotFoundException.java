package com.sap.plc.backend.exception;

import org.springframework.http.HttpStatus;

import static com.sap.plc.backend.error.ErrorCode.GENERAL_ENTITY_NOT_FOUND_ERROR;

public class NotFoundException extends PlcException {

    private static final long serialVersionUID = -8469740948988388223L;

    public NotFoundException() {
        super(GENERAL_ENTITY_NOT_FOUND_ERROR, GENERAL_ENTITY_NOT_FOUND_ERROR.getMessage(), HttpStatus.NOT_FOUND);
    }
}
