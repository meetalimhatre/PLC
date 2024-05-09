package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class CalculationVersionTemporaryPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8663604862236632687L;

    private String sessionId;

    private Integer calculationVersionId;

    public CalculationVersionTemporaryPrimaryKey() {
    }

    public CalculationVersionTemporaryPrimaryKey(String sessionId, Integer calculationVersionId) {
        this.sessionId = sessionId;
        this.calculationVersionId = calculationVersionId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getCalculationVersionId() {
        return calculationVersionId;
    }

    public void setCalculationVersionId(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CalculationVersionTemporaryPrimaryKey that = (CalculationVersionTemporaryPrimaryKey) o;

        return new EqualsBuilder()
                .append(sessionId, that.sessionId)
                .append(calculationVersionId, that.calculationVersionId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(sessionId)
                .append(calculationVersionId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("sessionId", sessionId)
                .append("calculationVersionId", calculationVersionId)
                .toString();
    }
}
