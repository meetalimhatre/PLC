package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceDeterminationStrategyTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@IdClass(PriceDeterminationStrategyTextPrimaryKey.class)
@Entity
@Table(name = PriceDeterminationStrategyText.TABLE_NAME)
public class PriceDeterminationStrategyText extends com.sap.plc.backend.model.Entity<PriceDeterminationStrategyText,
        PriceDeterminationStrategyTextPrimaryKey> {

    private static final long serialVersionUID = 6549233968376727531L;
    static final String TABLE_NAME = "`sap.plc.db::basis.t_price_determination_strategy__text`";

    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_ID")
    @Size(max = 20)
    @NotNull
    private String priceDeterminationStrategyId;

    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_TYPE_ID")
    @NotNull
    @Positive
    @Max(2)
    @ColumnDefault(value = "1")
    private Integer priceDeterminationStrategyTypeId;

    @Id
    @Column(name = "LANGUAGE", nullable = false)
    @Size(max = 11)
    @NotNull
    private String language;

    @Column(name = "PRICE_DETERMINATION_STRATEGY_DESCRIPTION")
    @Size(max = 250)
    @NotNull
    private String description;

    public PriceDeterminationStrategyText() {
    }

    public PriceDeterminationStrategyText(
            @Size(max = 20) @NotNull String priceDeterminationStrategyId,
            @NotNull @Positive @Max(2) Integer priceDeterminationStrategyTypeId,
            @Size(max = 11) @NotNull String language,
            @Size(max = 250) @NotNull String description) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        this.language = language;
        this.description = description;
    }

    public String getPriceDeterminationStrategyId() {
        return priceDeterminationStrategyId;
    }

    public PriceDeterminationStrategyText setPriceDeterminationStrategyId(String priceDeterminationStrategyId) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        return this;
    }

    public Integer getPriceDeterminationStrategyTypeId() {
        return priceDeterminationStrategyTypeId;
    }

    public PriceDeterminationStrategyText setPriceDeterminationStrategyTypeId(
            Integer priceDeterminationStrategyTypeId) {
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        return this;
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

        PriceDeterminationStrategyText that = (PriceDeterminationStrategyText) o;

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
}
