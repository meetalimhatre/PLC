package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.sap.plc.backend.controller.utils.JsonTimestampSerializer;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class MaterialPricePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 5474872812634112376L;

    private String priceId;
    private Timestamp validFrom;

    public MaterialPricePrimaryKey() {
    }

    public MaterialPricePrimaryKey(String priceId, Timestamp validFrom) {
        this.priceId = priceId;
        this.validFrom = validFrom;
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
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceId)
                .append(validFrom)
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

        MaterialPricePrimaryKey that = (MaterialPricePrimaryKey) o;

        return new EqualsBuilder()
                .append(priceId, that.priceId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceId", priceId)
                .append("validFrom", validFrom)
                .toString();
    }
}
