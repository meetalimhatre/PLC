package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CurrencyPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.Map;

@IdClass(CurrencyPrimaryKey.class)
@Entity
@Table(name = Currency.TABLE_NAME)
public class Currency extends Masterdata<Currency, CurrencyPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_currency`";
    private static final long serialVersionUID = -1455450890085154946L;
    @Id
    @Column(name = "CURRENCY_ID", nullable = false, length = 3)
    private String currencyId;

    @Transient
    private Map textsMap;

    public String getCurrencyId() {
        return currencyId;
    }

    public void setCurrencyId(String currencyId) {
        this.currencyId = currencyId;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(currencyId)
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

        Currency currency = (Currency) o;

        return new EqualsBuilder()
                .append(currencyId, currency.currencyId)
                .append(validFrom, currency.validFrom)
                .isEquals();
    }

    @Override
    public String getEntityId() {
        return currencyId.replace("#", "%23");
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public Map getTextsMap() {
        return this.textsMap;
    }

    public void setTextsMap(Map textsMap) {
        this.textsMap = textsMap;
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Currency currency = (Currency) o;

        return new EqualsBuilder()
                .append(currencyId, currency.currencyId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }
}