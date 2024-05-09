package com.sap.plc.backend.model.instanceprivilege.calculationversion;

import com.sap.plc.backend.model.pks.CalculationVersionPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.sql.Timestamp;

@MappedSuperclass
public class CalculationVersionInstancePrivilegeView<TEntity> extends
        com.sap.plc.backend.model.Entity<TEntity, CalculationVersionPrimaryKey> {

    private static final long serialVersionUID = -2426476777265336481L;

    @Id
    @Column(name = "USER_ID", nullable = false, length = 256)
    private String userId;

    @Id
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "CALCULATION_ID")
    private Integer calculationId;

    @Id
    @Column(name = "CALCULATION_VERSION_ID")
    private Integer calculationVersionId;

    @Column(name = "ROOT_ITEM_ID")
    private Integer rootItemId;

    @Column(name = "VALUATION_DATE")
    private Timestamp valuationDate;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "MASTER_DATA_TIMESTAMP")
    private Timestamp masterDataTimestamp;

    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;

    @Column(name = "CALCULATION_VERSION_NAME")
    private String calculationVersionName;

    @Column(name = "MATERIAL_PRICE_STRATEGY_ID")
    private String materialPriceStrategyId;

    @Column(name = "ACTIVITY_PRICE_STRATEGY_ID")
    private String activityPriceStrategyId;

    @Column(name = "SALES_PRICE_CURRENCY_ID", length = 3)
    private String salesPriceCurrencyId;

    @Column(name = "EXCHANGE_RATE_TYPE_ID", length = 20)
    private String exchangeRateTypeId;

    @Column(name = "STATUS_ID", length = 20)
    private String statusId;

    public Integer getRootItemId() {
        return rootItemId;
    }

    public void setRootItemId(Integer rootItemId) {
        this.rootItemId = rootItemId;
    }

    public String getSalesPriceCurrencyId() {
        return salesPriceCurrencyId;
    }

    public void setSalesPriceCurrencyId(String salesPriceCurrencyId) {
        this.salesPriceCurrencyId = salesPriceCurrencyId;
    }

    public String getExchangeRateTypeId() {
        return exchangeRateTypeId;
    }

    public void setExchangeRateTypeId(String exchangeRateTypeId) {
        this.exchangeRateTypeId = exchangeRateTypeId;
    }

    public Timestamp getValuationDate() {
        return valuationDate;
    }

    public void setValuationDate(Timestamp valuationDate) {
        this.valuationDate = valuationDate;
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    public Timestamp getMasterDataTimestamp() {
        return masterDataTimestamp;
    }

    public void setMasterDataTimestamp(Timestamp masterDataTimestamp) {
        this.masterDataTimestamp = masterDataTimestamp;
    }

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public Integer getCalculationVersionId() {
        return calculationVersionId;
    }

    public void setCalculationVersionId(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    public String getCalculationVersionName() {
        return calculationVersionName;
    }

    public void setCalculationVersionName(String calculationVersionName) {
        this.calculationVersionName = calculationVersionName;
    }

    public String getMaterialPriceStrategyId() {
        return materialPriceStrategyId;
    }

    public void setMaterialPriceStrategyId(String materialPriceStrategyId) {
        this.materialPriceStrategyId = materialPriceStrategyId;
    }

    public String getActivityPriceStrategyId() {
        return activityPriceStrategyId;
    }

    public void setActivityPriceStrategyId(String activityPriceStrategyId) {
        this.activityPriceStrategyId = activityPriceStrategyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CalculationVersionInstancePrivilegeView that = (CalculationVersionInstancePrivilegeView) o;

        return new EqualsBuilder()
                .append(userId, that.userId)
                .append(projectId, that.projectId)
                .append(calculationId, that.calculationId)
                .append(calculationVersionId, that.calculationVersionId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(userId)
                .append(projectId)
                .append(calculationId)
                .append(calculationVersionId)
                .toHashCode();
    }
}
