package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sap.plc.backend.model.PrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class OneTimeCostLifecycleValuePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 3982832864424483472L;

    private Integer oneTimeCostId;
    private Integer calculationId;
    private Integer lifecyclePeriodFrom;

    public OneTimeCostLifecycleValuePrimaryKey() {

    }

    public OneTimeCostLifecycleValuePrimaryKey(Integer oneTimeCostId, Integer calculationId,
                                               Integer lifecyclePeriodFrom) {
        this.oneTimeCostId = oneTimeCostId;
        this.calculationId = calculationId;
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
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

    public Integer getLifecyclePeriodFrom() {
        return lifecyclePeriodFrom;
    }

    public void setLifecyclePeriodFrom(Integer lifecyclePeriodFrom) {
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(19, 41)
                .append(oneTimeCostId)
                .append(calculationId)
                .append(lifecyclePeriodFrom)
                .toHashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }

        OneTimeCostLifecycleValuePrimaryKey otclvPk = (OneTimeCostLifecycleValuePrimaryKey) obj;

        return new EqualsBuilder()
                .append(oneTimeCostId, otclvPk.oneTimeCostId)
                .append(calculationId, otclvPk.calculationId)
                .append(lifecyclePeriodFrom, otclvPk.lifecyclePeriodFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return "OneTimeCostLifecycleValuePrimaryKey{" +
                "oneTimeCostId=" + oneTimeCostId +
                ", calculationId=" + calculationId +
                ", lifecyclePeriodFrom=" + lifecyclePeriodFrom +
                '}';
    }
}
