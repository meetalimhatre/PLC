package com.sap.plc.backend.controller.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.dto.apiResponse.SuccessResponse;
import com.sap.plc.backend.exception.PlcException;
import com.sap.plc.backend.mapper.EntityMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;

public class ResponseUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Logger LOGGER = LoggerFactory.getLogger(ResponseUtils.class);

    static {
        OBJECT_MAPPER.registerModule(new JavaTimeModule());
        OBJECT_MAPPER.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        SimpleFilterProvider filterProvider = new SimpleFilterProvider();
        filterProvider.setFailOnUnknownId(false);

        OBJECT_MAPPER.setFilterProvider(filterProvider);
    }

    /**
     * Builds response body and status code based on plcResponse
     *
     * @param response         result of the service method
     * @param entityMapper     mapper from tneity to dto
     * @param pathTarget       the URI fot the requested resource
     * @param returnFullEntity states if the resource will return the full entity or just part of it (the entity id)
     * @param defaultStatus    the default status of the resource
     * @param filterExcept     states what properties to show wneh returnFullEntity is false
     * @return response entity containing status code and body
     */
    public static ResponseEntity<String> createResult(PlcResponse response, EntityMapper entityMapper,
                                                      String pathTarget, Boolean returnFullEntity,
                                                      HttpStatus defaultStatus,
                                                      String filterExcept) {
        return ResponseEntity
                .status(getResponseStatus(response, defaultStatus, false))
                .body(getResponseBody(response, pathTarget, entityMapper, returnFullEntity, filterExcept));
    }

    public static ResponseEntity createResult(PlcResponse response, HttpStatus defaultStatus, String target) {
        addTargetToErrorResponse(response, target);
        return ResponseEntity
                .status(getResponseStatus(response, defaultStatus, false))
                .body(response);
    }

    private static void addTargetToErrorResponse(PlcResponse response, String target) {
        if (response != null && response.getErrorResponse() != null) {
            response.getErrorResponse().setTarget(target);
        }
    }

    /**
     * Builds response body and status code based on plcResponse
     * Particular case : Delete requests do not have success message
     *
     * @param response      result of the service method
     * @param pathTarget    the URI fot the requested resource
     * @param defaultStatus the default status of the resource
     * @return response entity containing status code and body
     */
    public static ResponseEntity<String> createDeleteResult(PlcResponse response, String pathTarget,
                                                            HttpStatus defaultStatus) {
        return ResponseEntity
                .status(getResponseStatus(response, defaultStatus, true))
                .body(getDeleteResponseBody(response, pathTarget));
    }

    private static HttpStatus getResponseStatus(PlcResponse plcResponse, HttpStatus defaultStatus,
                                                boolean isDeleteOperation) {
        if (plcResponse.getErrorResponse() == null && plcResponse.getSuccessResponse() != null && isDeleteOperation) {
            return HttpStatus.NO_CONTENT;
        } else if (plcResponse.getErrorResponse() != null && plcResponse.getSuccessResponse() == null) {
            return HttpStatus.BAD_REQUEST;
        }
        return defaultStatus;
    }

    private static String getResponseBody(PlcResponse response, String target, EntityMapper mapper,
                                          Boolean returnFullEntity, String filterExcept) {

        PlcResponse plcResponse = new PlcResponse(response.getSuccessResponse(), response.getErrorResponse());
        if (plcResponse.getErrorResponse() != null) {
            plcResponse.getErrorResponse().setTarget(target);
        }
        if (mapper != null && response.getSuccessResponse() != null) {
            plcResponse.setSuccessResponse(new SuccessResponse());
            plcResponse.getSuccessResponse()
                       .setEntities(mapper.entityToDto(response.getSuccessResponse().getEntities()));
        }
        if (mapper != null && !CollectionUtils.isEmpty(response.getEntities())) {
            plcResponse.setEntities(mapper.entityToDto(response.getEntities()));
        }

        return buildResponseBody(plcResponse, returnFullEntity, filterExcept);
    }

    private static String buildResponseBody(PlcResponse plcResponse, Boolean returnFullEntity, String filterExcept) {

        ObjectMapper objectMapper = new ObjectMapper();

        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

        SimpleFilterProvider filterProvider = new SimpleFilterProvider();
        filterProvider.setFailOnUnknownId(false);

        if (returnFullEntity == null || !returnFullEntity) {
            filterProvider.addFilter("idFilter", SimpleBeanPropertyFilter.filterOutAllExcept(filterExcept.split(",")));
        }

        objectMapper.setFilterProvider(filterProvider);

        try {
            return objectMapper.writeValueAsString(plcResponse);
        } catch (JsonProcessingException e) {
            LOGGER.error("Exception while calling com.sap.plc.backend.controller.utils.ResponseUtils.buildResponseBody",
                    e);
            throw new PlcException();
        }
    }

    private static String getDeleteResponseBody(PlcResponse response, String pathTarget) {

        if (response.getErrorResponse() != null) {
            response.getErrorResponse().setTarget(pathTarget);
        }

        response.setSuccessResponse(null);

        try {
            return OBJECT_MAPPER.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            LOGGER.error("Exception while calling com.sap.plc.backend.controller.utils.ResponseUtils" +
                    ".getDeleteResponseBody", e);
            throw new PlcException();
        }
    }
}
