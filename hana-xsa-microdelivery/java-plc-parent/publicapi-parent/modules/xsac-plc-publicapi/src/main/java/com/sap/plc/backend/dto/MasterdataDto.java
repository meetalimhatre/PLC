package com.sap.plc.backend.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.validation.CustomFieldsMapValid;

@CustomFieldsMapValid
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public interface MasterdataDto extends Dto {

    @JsonProperty("version")
    String version = PublicAPI.API_VERSION;

    default Map<String, Object> getCustomFields() {
        return null;
    }

    default void setCustomFields(Map<String, Object> customFields) {
    }

}