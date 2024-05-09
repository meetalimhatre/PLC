package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceDeterminationStrategyPrimaryKey implements PrimaryKey {

    private String priceDeterminationStrategyId;
    private Integer priceDeterminationStrategyTypeId;

    public PriceDeterminationStrategyPrimaryKey(String priceDeterminationStrategyId,
                                                Integer priceDeterminationStrategyTypeId) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
    }

    public PriceDeterminationStrategyPrimaryKey() {
    }

    public String getPriceDeterminationStrategyId() {
        return priceDeterminationStrategyId;
    }

    public void setPriceDeterminationStrategyId(String priceDeterminationStrategyId) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
    }

    public Integer getPriceDeterminationStrategyTypeId() {
        return priceDeterminationStrategyTypeId;
    }

    public void setPriceDeterminationStrategyTypeId(Integer priceDeterminationStrategyTypeId) {
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceDeterminationStrategyPrimaryKey that = (PriceDeterminationStrategyPrimaryKey) o;

        return new EqualsBuilder()
                .append(priceDeterminationStrategyId, that.priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId, that.priceDeterminationStrategyTypeId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceDeterminationStrategyId", priceDeterminationStrategyId)
                .append("priceDeterminationStrategyTypeId", priceDeterminationStrategyTypeId)
                .toString();
    }
}
