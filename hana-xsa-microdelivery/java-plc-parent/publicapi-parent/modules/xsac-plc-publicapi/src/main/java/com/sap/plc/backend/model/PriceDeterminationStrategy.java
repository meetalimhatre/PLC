package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceDeterminationStrategyPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.sql.Timestamp;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@IdClass(PriceDeterminationStrategyPrimaryKey.class)
@Entity
@Table(name = PriceDeterminationStrategy.TABLE_NAME)
public class PriceDeterminationStrategy extends com.sap.plc.backend.model.Entity<PriceDeterminationStrategy,
        PriceDeterminationStrategyPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_price_determination_strategy`";
    private static final long serialVersionUID = 5165369670009369772L;
    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_ID", nullable = false)
    @Size(max = 20)
    @NotNull
    private String priceDeterminationStrategyId;
    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_TYPE_ID", nullable = false)
    @Positive
    @Max(2)
    @ColumnDefault(value = "1")
    private Integer priceDeterminationStrategyTypeId;
    @Column(name = "IS_VENDOR_VALUE_FILTER", nullable = false)
    @ColumnDefault(value = "0")
    private Boolean isVendorValueFilter;
    @Column(name = "IS_VENDOR_GENERIC_FILTER", nullable = false)
    @ColumnDefault(value = "0")
    private Boolean isVendorGenericFilter;
    @Column(name = "CREATED_ON")
    private Timestamp createdOn;
    @Column(name = "CREATED_BY")
    private String createdBy;
    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;
    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;
    @Transient
    private List<PriceDeterminationStrategyText> texts;
    @Transient
    private List<PriceDeterminationRule> rules;
    @ManyToMany
    @JoinTable(
            name = "`sap.plc.db::basis.t_price_determination_strategy_price_source`",
            joinColumns = {
                    @JoinColumn(name = "PRICE_DETERMINATION_STRATEGY_ID"),
                    @JoinColumn(name = "PRICE_DETERMINATION_STRATEGY_TYPE_ID"),
            },
            inverseJoinColumns = {
                    @JoinColumn(name = "PRICE_SOURCE_ID"),
                    @JoinColumn(name = "PRICE_SOURCE_TYPE_ID"),
            }
    )
    @OrderColumn(name = "DETERMINATION_SEQUENCE")
    private List<PriceSource> priceSourceList;
    @Transient
    private List<String> sourceSequence;

    public PriceDeterminationStrategy() {
        texts = new LinkedList<>();
        rules = new LinkedList<>();
        sourceSequence = new LinkedList<>();
        priceSourceList = new LinkedList<>();
    }

    public PriceDeterminationStrategy(String priceDeterminationStrategyId,
                                      Integer priceDeterminationStrategyTypeId) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        texts = new LinkedList<>();
        rules = new LinkedList<>();
        sourceSequence = new LinkedList<>();
        priceSourceList = new LinkedList<>();
    }

    public static PriceDeterminationStrategy updateSourceSequence(
            PriceDeterminationStrategy priceDeterminationStrategy) {
        if (priceDeterminationStrategy.getPriceSourceList() != null) {
            priceDeterminationStrategy.setSourceSequence(
                    priceDeterminationStrategy.getPriceSourceList()
                                              .stream()
                                              .map(PriceSource::getPriceSourceId)
                                              .collect(Collectors.toList())
            );
        }
        return priceDeterminationStrategy;
    }

    public static PriceDeterminationStrategy updatePriceSourceList(
            PriceDeterminationStrategy priceDeterminationStrategy, Map<String, PriceSource> priceSourceMap) {
        if (priceDeterminationStrategy.getSourceSequence() != null) {
            priceDeterminationStrategy.getPriceSourceList().clear();
            priceDeterminationStrategy.getSourceSequence()
                                      .forEach(source -> priceDeterminationStrategy.getPriceSourceList()
                                                                                   .add(priceSourceMap.get(source)));
        }
        return priceDeterminationStrategy;
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

    public Timestamp getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Timestamp createdOn) {
        this.createdOn = createdOn;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public List<PriceDeterminationStrategyText> getTexts() {
        return texts;
    }

    public void setTexts(List<PriceDeterminationStrategyText> texts) {
        this.texts = texts;
    }

    public List<PriceDeterminationRule> getRules() {
        return rules;
    }

    public void setRules(List<PriceDeterminationRule> rules) {
        this.rules = rules;
    }

    public List<PriceSource> getPriceSourceList() {
        return priceSourceList;
    }

    public void setPriceSourceList(List<PriceSource> priceSourceList) {
        this.priceSourceList = priceSourceList;
    }

    public List<String> getSourceSequence() {
        return sourceSequence;
    }

    public void setSourceSequence(List<String> sourceSequence) {
        this.sourceSequence = sourceSequence;
    }

    public Boolean getIsVendorValueFilter() {  return isVendorValueFilter; }

    public void setIsVendorValueFilter(Boolean isVendorValueFilter) { this.isVendorValueFilter = isVendorValueFilter; }

    public Boolean getIsVendorGenericFilter() { return isVendorGenericFilter; }

    public void setIsVendorGenericFilter(Boolean isVendorGenericFilter) { this.isVendorGenericFilter =
            isVendorGenericFilter; }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceDeterminationStrategy that = (PriceDeterminationStrategy) o;

        return new EqualsBuilder()
                .append(priceDeterminationStrategyId, that.priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId, that.priceDeterminationStrategyTypeId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceDeterminationStrategyId)
                .append(priceDeterminationStrategyTypeId)
                .toHashCode();
    }
}
