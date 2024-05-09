package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceDeterminationRulePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 1791410114829185294L;

    private Integer priceDeterminationStrategyTypeId;
    private String priceDeterminationStrategyId;
    private String ruleCode;

    public PriceDeterminationRulePrimaryKey(Integer priceDeterminationStrategyTypeId,
                                            String priceDeterminationStrategyId,
                                            String ruleCode) {
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.ruleCode = ruleCode;
    }

    public PriceDeterminationRulePrimaryKey() {
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

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceDeterminationRulePrimaryKey that = (PriceDeterminationRulePrimaryKey) o;

        return new EqualsBuilder()
                .append(priceDeterminationStrategyTypeId, that.priceDeterminationStrategyTypeId)
                .append(priceDeterminationStrategyId, that.priceDeterminationStrategyId)
                .append(ruleCode, that.ruleCode)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceDeterminationStrategyTypeId)
                .append(priceDeterminationStrategyId)
                .append(ruleCode)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceDeterminationStrategyTypeId", priceDeterminationStrategyTypeId)
                .append("priceDeterminationStrategyId", priceDeterminationStrategyId)
                .append("ruleCode", ruleCode)
                .toString();
    }
}
