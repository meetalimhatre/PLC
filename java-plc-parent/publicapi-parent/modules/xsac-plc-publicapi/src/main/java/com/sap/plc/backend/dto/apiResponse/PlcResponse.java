package com.sap.plc.backend.dto.apiResponse;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.plc.backend.error.ErrorCode;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.springframework.util.CollectionUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class PlcResponse<T, Key> implements Serializable {

    private static final long serialVersionUID = 5788391684202403154L;

    @JsonProperty("success")
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private SuccessResponse<T> successResponse;

    @JsonProperty("error")
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private ErrorResponse<Key> errorResponse;

    @JsonProperty("entities")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<T> entities;

    public PlcResponse(SuccessResponse successResponse, ErrorResponse errorResponse) {
        this.successResponse = successResponse;
        this.errorResponse = errorResponse;
    }

    public PlcResponse(ErrorResponse errorResponse) {
        this.successResponse = null;
        this.errorResponse = errorResponse;
    }

    public PlcResponse(SuccessResponse successResponse) {
        this.successResponse = successResponse;
        this.errorResponse = null;
    }

    public PlcResponse() {
    }

    public static <T, Key> PlcResponse<T, Key> buildResponseWithEntities(List<T> entitiesList) {
        PlcResponse<T, Key> plcResponse = new PlcResponse<>();

        plcResponse.setEntities(new ArrayList<>());

        if (CollectionUtils.isEmpty(entitiesList)) {
            return plcResponse;
        }

        plcResponse.setEntities(entitiesList);
        return plcResponse;
    }

    public SuccessResponse<T> getSuccessResponse() {
        return successResponse;
    }

    public void setSuccessResponse(SuccessResponse<T> successResponse) {
        this.successResponse = successResponse;
    }

    public ErrorResponse<Key> getErrorResponse() {
        return errorResponse;
    }

    public void setErrorResponse(ErrorResponse<Key> errorResponse) {
        this.errorResponse = errorResponse;
    }

    public List<T> getEntities() {
        return entities;
    }

    public void setEntities(List<T> entities) {
        this.entities = entities;
    }

    public PlcResponse<T, Key> merge(PlcResponse<T, Key> toBeMerged, ErrorCode generalErrorCode) {
        if (toBeMerged.getSuccessResponse() != null) {

            if (getSuccessResponse() == null) {
                setSuccessResponse(toBeMerged.getSuccessResponse());
            } else {
                if (!CollectionUtils.isEmpty(toBeMerged.getSuccessResponse().getEntities())) {
                    if (getSuccessResponse().getEntities() == null) {
                        getSuccessResponse().setEntities(toBeMerged.getSuccessResponse().getEntities());
                    } else {
                        getSuccessResponse().getEntities().addAll(toBeMerged.getSuccessResponse().getEntities());
                    }

                }
            }
        }

        if (toBeMerged.getErrorResponse() != null) {
            if (this.getErrorResponse() == null) {
                this.setErrorResponse(toBeMerged.getErrorResponse());
            } else {
                if (!CollectionUtils.isEmpty(toBeMerged.getErrorResponse().getErrorDetails())) {

                    if (this.getErrorResponse().getErrorDetails() == null) {
                        this.getErrorResponse().setErrorDetails(toBeMerged.getErrorResponse().getErrorDetails());
                    } else {
                        this.getErrorResponse().getErrorDetails()
                            .addAll(toBeMerged.getErrorResponse().getErrorDetails());
                    }
                }
            }
        }

        if (this.getErrorResponse() != null) {
            ErrorResponse errorResponse =
                    new ErrorResponse(generalErrorCode.getCode(), generalErrorCode.getMessage(),
                            "", null, this.getErrorResponse().getErrorDetails());
            setErrorResponse(errorResponse);
        }
        return this;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(successResponse)
                .append(errorResponse)
                .toHashCode();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PlcResponse<?, ?> that = (PlcResponse<?, ?>) o;

        return new EqualsBuilder()
                .append(successResponse, that.successResponse)
                .append(errorResponse, that.errorResponse)
                .isEquals();
    }
}
