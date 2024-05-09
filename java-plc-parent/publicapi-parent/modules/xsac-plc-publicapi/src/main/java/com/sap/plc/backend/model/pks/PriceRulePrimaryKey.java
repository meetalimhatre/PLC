package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceRulePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8793982119034002823L;

    private String ruleCode;
    private Integer ruleTypeId;

    public PriceRulePrimaryKey(String ruleCode, Integer ruleTypeId) {
        this.ruleCode = ruleCode;
        this.ruleTypeId = ruleTypeId;
    }

    public PriceRulePrimaryKey() {
    }

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    public Integer getRuleTypeId() {
        return ruleTypeId;
    }

    public void setRuleTypeId(Integer ruleTypeId) {
        this.ruleTypeId = ruleTypeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceRulePrimaryKey that = (PriceRulePrimaryKey) o;

        return new EqualsBuilder()
                .append(ruleCode, that.ruleCode)
                .append(ruleTypeId, that.ruleTypeId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(ruleCode)
                .append(ruleTypeId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("ruleCode", ruleCode)
                .append("ruleTypeId", ruleTypeId)
                .toString();
    }
}
