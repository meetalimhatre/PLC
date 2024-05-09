package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.sap.plc.backend.controller.utils.JsonTimestampSerializer;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class ActivityPricePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -3906254330891590290L;

    private String priceId;
    private Timestamp validFrom;

    public ActivityPricePrimaryKey(String priceId, Timestamp validFrom) {
        this.priceId = priceId;
        this.validFrom = validFrom;
    }

    public ActivityPricePrimaryKey() {
    }

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

    @JsonSerialize(using = JsonTimestampSerializer.class)
    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ActivityPricePrimaryKey that = (ActivityPricePrimaryKey) o;

        return new EqualsBuilder()
                .append(priceId, that.priceId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceId", priceId)
                .append("validFrom", validFrom)
                .toString();
    }
}
