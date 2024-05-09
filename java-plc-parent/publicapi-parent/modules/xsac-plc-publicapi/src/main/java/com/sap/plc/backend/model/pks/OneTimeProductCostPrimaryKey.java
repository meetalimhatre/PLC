package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sap.plc.backend.model.PrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

public class OneTimeProductCostPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 317226140301640664L;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer oneTimeCostId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer calculationId;

    public OneTimeProductCostPrimaryKey() {
    }

    public OneTimeProductCostPrimaryKey(Integer oneTimeCostId, Integer calculationId) {
        this.oneTimeCostId = oneTimeCostId;
        this.calculationId = calculationId;
    }

    public Integer getOneTimeCostId() {
        return oneTimeCostId;
    }

    public void setOneTimeCostId(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(oneTimeCostId)
                .append(calculationId)
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

        OneTimeProductCostPrimaryKey that = (OneTimeProductCostPrimaryKey) o;

        return new EqualsBuilder()
                .append(oneTimeCostId, that.oneTimeCostId)
                .append(calculationId, that.calculationId)
                .isEquals();
    }

    @Override
    public String toString() {
        return "OneTimeProductCostPrimaryKey{" +
                "oneTimeCostId=" + oneTimeCostId +
                ", calculationId=" + calculationId +
                '}';
    }
}