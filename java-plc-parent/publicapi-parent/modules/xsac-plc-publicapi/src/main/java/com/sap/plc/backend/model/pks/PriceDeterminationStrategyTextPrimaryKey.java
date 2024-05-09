package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceDeterminationStrategyTextPrimaryKey implements PrimaryKey {

    private String priceDeterminationStrategyId;
    private Integer priceDeterminationStrategyTypeId;
    private String language;

    public PriceDeterminationStrategyTextPrimaryKey() {
    }

    public PriceDeterminationStrategyTextPrimaryKey(String priceDeterminationStrategyId,
                                                    Integer priceDeterminationStrategyTypeId, String language) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        this.language = language;
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

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceDeterminationStrategyTextPrimaryKey that = (PriceDeterminationStrategyTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(priceDeterminationStrategyId, that.priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId, that.priceDeterminationStrategyTypeId)
                .append(language, that.language)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId)
                .append(language)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceDeterminationStrategyId", priceDeterminationStrategyId)
                .append("priceDeterminationStrategyTypeId", priceDeterminationStrategyTypeId)
                .append("language", language)
                .toString();
    }
}
