package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class PriceSourcePKAndTimestamp extends Entity implements PrimaryKey {

    private String priceSourceId;
    private Integer priceSourceTypeId;
    private Timestamp lastModifiedOn;

    public PriceSourcePKAndTimestamp(String priceSourceId, Integer priceSourceTypeId, Timestamp lastModifiedOn) {
        this.priceSourceId = priceSourceId;
        this.priceSourceTypeId = priceSourceTypeId;
        this.lastModifiedOn = lastModifiedOn;
    }

    public PriceSourcePKAndTimestamp() {
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
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

    public PriceSourcePrimaryKey getEntityKey() {
        return new PriceSourcePrimaryKey(this.priceSourceId, this.priceSourceTypeId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceSourcePKAndTimestamp that = (PriceSourcePKAndTimestamp) o;

        return new EqualsBuilder()
                .append(priceSourceId, that.priceSourceId)
                .append(priceSourceTypeId, that.priceSourceTypeId)
                .append(lastModifiedOn, that.lastModifiedOn)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceSourceId)
                .append(priceSourceTypeId)
                .append(lastModifiedOn)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceSourceId", priceSourceId)
                .append("priceSourceTypeId", priceSourceTypeId)
                .append("lastModifiedOn", lastModifiedOn)
                .toString();
    }
}
