package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sap.plc.backend.model.PrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

public class OneTimeProjectCostPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 317226140301640664L;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer oneTimeCostId;

    public OneTimeProjectCostPrimaryKey() {
    }

    public OneTimeProjectCostPrimaryKey(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    public Integer getOneTimeCostId() {
        return oneTimeCostId;
    }

    public void setOneTimeCostId(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(oneTimeCostId)
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

        OneTimeProjectCostPrimaryKey that = (OneTimeProjectCostPrimaryKey) o;

        return new EqualsBuilder()
                .append(oneTimeCostId, that.oneTimeCostId)
                .isEquals();
    }

    @Override
    public String toString() {
        return "OneTimeProjectCostPrimaryKey{" +
                "oneTimeCostId=" + oneTimeCostId +
                '}';
    }
}