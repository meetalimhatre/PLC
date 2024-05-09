package com.sap.plc.backend.dto.apiResponse;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.sap.plc.backend.dto.BaseErrorResponseGeneratedDto;
import com.sap.plc.backend.error.ErrorCode;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

@JsonPropertyOrder({
        "code",
        "message",
        "entityId",
        "currentVersionTimestamp",
        "correlationId"})
@JsonFilter("")
public class ErrorResponseDetail<TEntityId> extends BaseErrorResponseGeneratedDto {

    private TEntityId entityId;

    public ErrorResponseDetail(String code, String message, TEntityId entityId) {
        this.setCode(code);
        this.setMessage(message);
        this.entityId = entityId;
    }

    public ErrorResponseDetail(String code, String message) {
        this.setCode(code);
        this.setMessage(message);
    }

    public ErrorResponseDetail(ErrorCode code, TEntityId entityId) {
        this.setCode(code.getCode());
        this.setMessage(code.getMessage());
        this.entityId = entityId;
    }

    /**
     *
     * @param code
     * @param message
     * @param entityId
     * @param lastModifiedBy used for the error response details for OPTIMISTIC LOCK error code
     * @param currentVersionTimestamp used for the error response details for OPTIMISTIC LOCK error code
     *                                - the validFrom/lastModifiedOn timestamp that is current for the entity
     */
    public ErrorResponseDetail(String code, String message, TEntityId entityId, String lastModifiedBy, Timestamp currentVersionTimestamp) {
        this.setCode(code);
        this.setMessage(message);
        this.entityId = entityId;
        this.setLastModifiedBy(lastModifiedBy);
        this.setCurrentVersionTimestamp(currentVersionTimestamp);
    }

    /**
     *
     * @param code
     * @param entityId
     * @param lastModifiedBy used for the error response details for OPTIMISTIC LOCK error code
     * @param currentVersionTimestamp used for the error response details for OPTIMISTIC LOCK error code
     *                                - the validFrom/lastModifiedOn timestamp that is current for the entity
     */
    public ErrorResponseDetail(ErrorCode code, TEntityId entityId, String lastModifiedBy, Timestamp currentVersionTimestamp) {
        this.setCode(code.getCode());
        this.setMessage(code.getMessage());
        this.entityId = entityId;
        this.setLastModifiedBy(lastModifiedBy);
        this.setCurrentVersionTimestamp(currentVersionTimestamp);
    }

    public ErrorResponseDetail() {
    }

    public TEntityId getEntityId() {
        return entityId;
    }

    public void setEntityId(TEntityId entityId) {
        this.entityId = entityId;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getCode())
                .append(getMessage())
                .append(entityId)
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

        ErrorResponseDetail that = (ErrorResponseDetail) o;

        return new EqualsBuilder()
                .append(this.getCode(), that.getCode())
                .append(entityId, that.entityId)
                .append(this.getMessage(), that.getMessage())
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("code", this.getCode())
                .append("message", this.getMessage())
                .append("entityId", this.entityId)
                .toString();
    }
}
