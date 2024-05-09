package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class CalculationInstancePrivilegeViewPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -4739789075139952718L;

    private Integer calculationId;

    private String userId;

    public CalculationInstancePrivilegeViewPrimaryKey() {
    }

    public CalculationInstancePrivilegeViewPrimaryKey(Integer calculationId, String userId) {
        this.calculationId = calculationId;
        this.userId = userId;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CalculationInstancePrivilegeViewPrimaryKey that = (CalculationInstancePrivilegeViewPrimaryKey) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .append(userId, that.userId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .append(userId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("calculationId", calculationId)
                .append("userId", userId)
                .toString();
    }
}
