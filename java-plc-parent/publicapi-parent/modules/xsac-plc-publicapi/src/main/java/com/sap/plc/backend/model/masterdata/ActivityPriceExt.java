package com.sap.plc.backend.model.masterdata;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.sql.Timestamp;

@Entity
@Table(name = ActivityPriceExt.TABLE_NAME)
public class ActivityPriceExt implements Serializable {

    private static final long serialVersionUID = 4295705490334071216L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_activity_price_ext`";

    @Id
    @Column(name = "PRICE_ID", nullable = false, length = 32)
    private String priceId;

    @Id
    @Column(name = "_VALID_FROM", nullable = false, length = 27)
    private Timestamp validFrom;

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

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

        ActivityPriceExt that = (ActivityPriceExt) o;

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
}
