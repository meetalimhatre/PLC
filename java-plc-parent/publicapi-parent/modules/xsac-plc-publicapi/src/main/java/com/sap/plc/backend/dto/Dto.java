package com.sap.plc.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public interface Dto extends Serializable {

}
