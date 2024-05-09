package com.sap.plc.backend.dto.apiResponse;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.sap.hcp.cf.logging.common.LogContext;
import com.sap.plc.backend.dto.BaseErrorResponseGeneratedDto;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import java.util.List;

@JsonPropertyOrder({
        "code",
        "message",
        "target",
        "correlationId"})
@JsonFilter("")
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ErrorResponse<TEntityId> extends BaseErrorResponseGeneratedDto {

    private static final long serialVersionUID = 1276455819769808029L;

    @JsonIgnore
    private HttpStatusCode httpStatus;
    @JsonProperty("details")
    private List<ErrorResponseDetail<TEntityId>> errorDetails;

    public ErrorResponse(String code, String message, String target, HttpStatusCode httpStatus, String correlationId,
                         List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.setCode(code);
        this.setMessage(message);
        this.setTarget(target);
        this.setCorrelationId(correlationId);
        this.httpStatus = httpStatus;
        this.errorDetails = errorDetails;
    }

    public ErrorResponse(String code, String message, String target, HttpStatus httpStatus,
                         List<ErrorResponseDetail<TEntityId>> errorDetails) {

        this(code, message, target, httpStatus, LogContext.getCorrelationId(), errorDetails);
    }

    public ErrorResponse(String code, String message, String target, HttpStatus httpStatus, String correlationId) {
        this(code, message, target, httpStatus, correlationId, null);
    }

    public ErrorResponse() {
    }

    public HttpStatusCode getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(HttpStatusCode httpStatus) {
        this.httpStatus = httpStatus;
    }

    public List<ErrorResponseDetail<TEntityId>> getErrorDetails() {
        return errorDetails;
    }

    public void setErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.errorDetails = errorDetails;
    }

    public void addAllErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        if (CollectionUtils.isEmpty(this.errorDetails)) {
            this.errorDetails = errorDetails;
        } else {
            this.errorDetails.addAll(errorDetails);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ErrorResponse that = (ErrorResponse) o;

        return new EqualsBuilder()
                .append(getCode(), that.getCode())
                .append(getMessage(), that.getMessage())
                .append(getTarget(), that.getTarget())
                .append(getCorrelationId(), that.getCorrelationId())
                .append(errorDetails, that.errorDetails)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getCode())
                .append(getMessage())
                .append(getTarget())
                .append(getCorrelationId())
                .append(errorDetails)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("target", getTarget())
                .append("correlationId", getCorrelationId())
                .append("httpStatus", httpStatus)
                .append("errorDetails", errorDetails)
                .append("code", getCode())
                .append("message", getMessage())
                .toString();
    }

    public static class ErrorResponseBuilder<TEntityId extends PrimaryKey> {

        private static final Logger LOGGER = LoggerFactory.getLogger(ErrorResponseBuilder.class);

        private String code;
        private String message;
        private String target;
        private HttpStatus httpStatus;
        private String correlationId;
        private List<ErrorResponseDetail<TEntityId>> errorDetails;

        public ErrorResponseBuilder() {
        }

        public ErrorResponseBuilder<TEntityId> setCode(String code) {
            this.code = code;
            return this;
        }

        public ErrorResponseBuilder<TEntityId> setMessage(String message) {
            this.message = message;
            return this;
        }

        public ErrorResponseBuilder<TEntityId> setTarget(String target) {
            this.target = target;
            return this;
        }

        public ErrorResponseBuilder<TEntityId> setHttpStatus(HttpStatus httpStatus) {
            this.httpStatus = httpStatus;
            return this;
        }

        public ErrorResponseBuilder<TEntityId> setCorrelationId(String correlationId) {
            this.correlationId = correlationId;
            return this;
        }

        public ErrorResponseBuilder<TEntityId> setErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
            this.errorDetails = errorDetails;
            return this;
        }

        public ErrorResponse<TEntityId> build() {
            ErrorResponse<TEntityId> errorResponse =
                    new ErrorResponse<>(code, message, target, httpStatus, correlationId, errorDetails);
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Created {}", errorResponse);
            }
            return errorResponse;
        }
    }
}
