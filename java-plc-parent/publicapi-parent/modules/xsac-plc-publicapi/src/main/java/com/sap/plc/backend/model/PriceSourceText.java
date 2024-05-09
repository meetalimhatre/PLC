package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceSourceTextKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.PriceSourceText.TABLE_NAME;

@IdClass(PriceSourceTextKey.class)
@Entity
@Table(name = TABLE_NAME)
public class PriceSourceText extends com.sap.plc.backend.model.Entity<PriceSourceText, PriceSourceTextKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_price_source__text`";

    @Id
    @Column(name = "PRICE_SOURCE_ID")
    private String priceSourceId;

    @Id
    @Column(name = "PRICE_SOURCE_TYPE_ID")
    private Integer priceSourceTypeId;

    @Id
    @Column(name = "LANGUAGE")
    private String language;

    @Column(name = "PRICE_SOURCE_DESCRIPTION")
    private String description;

    public PriceSourceText() {
    }

    public PriceSourceText(String language, String description) {
        this.language = language;
        this.description = description;
    }

    public PriceSourceText(String language, String description, String priceSourceId, int priceSourceTypeId) {
        this.language = language;
        this.description = description;
        this.priceSourceId = priceSourceId;
        this.priceSourceTypeId = priceSourceTypeId;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceSourceText that = (PriceSourceText) o;

        return new EqualsBuilder()
                .append(priceSourceId, that.priceSourceId)
                .append(priceSourceTypeId, that.priceSourceTypeId)
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
}
