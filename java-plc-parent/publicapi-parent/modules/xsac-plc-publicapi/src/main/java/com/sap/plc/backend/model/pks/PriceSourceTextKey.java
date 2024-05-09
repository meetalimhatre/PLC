package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceSourceTextKey implements PrimaryKey {

    private static final long serialVersionUID = -4255721258800820940L;

    private String priceSourceId;
    private Integer priceSourceTypeId;
    private String language;

    public PriceSourceTextKey() {
    }

    public PriceSourceTextKey(String priceSourceId, int priceSourceTypeId, String language) {
        this.priceSourceId = priceSourceId;
        this.priceSourceTypeId = priceSourceTypeId;
        this.language = language;
    }

    public String getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(String priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public Integer getPriceSourceTypeId() {
        return priceSourceTypeId;
    }

    public void setPriceSourceTypeId(Integer priceSourceTypeId) {
        this.priceSourceTypeId = priceSourceTypeId;
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

        PriceSourceTextKey that = (PriceSourceTextKey) o;

        return new EqualsBuilder()
                .append(priceSourceTypeId, that.priceSourceTypeId)
                .append(priceSourceId, that.priceSourceId)
                .append(language, that.language)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceSourceId)
                .append(priceSourceTypeId)
                .append(language)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceSourceId", priceSourceId)
                .append("priceSourceTypeId", priceSourceTypeId)
                .append("language", language)
                .toString();
    }
}
