package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class PriceSourcePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 1427854090233673405L;

    private String priceSourceId;
    private Integer priceSourceTypeId;

    public PriceSourcePrimaryKey(String priceSourceId, Integer priceSourceTypeId) {
        this.priceSourceId = priceSourceId;
        this.priceSourceTypeId = priceSourceTypeId;
    }

    public PriceSourcePrimaryKey(String priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public PriceSourcePrimaryKey() {
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

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceSourceId)
                .append(priceSourceTypeId)
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

        PriceSourcePrimaryKey that = (PriceSourcePrimaryKey) o;

        return new EqualsBuilder()
                .append(priceSourceId, that.priceSourceId)
                .append(priceSourceTypeId, that.priceSourceTypeId)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceSourceId", priceSourceId)
                .append("priceSourceTypeId", priceSourceTypeId)
                .toString();
    }
}
