package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.CalculationVersionTemporaryPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.CalculationVersionTemporary.TABLE_NAME;

@IdClass(CalculationVersionTemporaryPrimaryKey.class)
@Table(name = TABLE_NAME)
@Entity
public class CalculationVersionTemporary extends com.sap.plc.backend.model.Entity<CalculationVersionTemporary,
        CalculationVersionTemporaryPrimaryKey> {

    private static final long serialVersionUID = -5988169848297798037L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_calculation_version_temporary`";

    @Id
    @Column(name = "SESSION_ID", length = 50)
    private String sessionId;

    @Id
    @Column(name = "CALCULATION_VERSION_ID")
    private Integer calculationVersionId;

    @Column(name = "CALCULATION_ID")
    private Integer calculationId;

    @Column(name = "CALCULATION_VERSION_TYPE")
    private Integer calculationVersionType;

    @Column(name = "LIFECYCLE_PERIOD_FROM")
    private Integer lifecyclePeriodFrom;

    @Column(name = "IS_FROZEN")
    private Integer isFrozen;

    @Column(name = "BASE_VERSION_ID")
    private Integer baseVersionId;

    @Column(name = "VARIANT_ID")
    private Integer variantId;

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

    @Column(name = "CUSTOMER_ID", length = 10)
    private String customerId;

    @Column(name = "SALES_DOCUMENT", length = 100)
    private String salesDocument;

    @Column(name = "SALES_PRICE", length = 28, precision = 7)
    private BigDecimal salesPrice;

    @Column(name = "CALCULATION_VERSION_NAME")
    private String calculationVersionName;

    @Column(name = "MATERIAL_PRICE_STRATEGY_ID")
    private String materialPriceStrategyId;

    @Column(name = "ACTIVITY_PRICE_STRATEGY_ID")
    private String activityPriceStrategyId;

    @Column(name = "SALES_PRICE_CURRENCY_ID", length = 3)
    private String salesPriceCurrencyId;

    @Column(name = "REPORT_CURRENCY_ID", length = 3)
    private String reportCurrencyId;

    @Column(name = "COSTING_SHEET_ID", length = 15)
    private String costingSheetId;

    @Column(name = "COMPONENT_SPLIT_ID", length = 35)
    private String componentSplitId;

    @Column(name = "START_OF_PRODUCTION")
    private Timestamp startOfProduction;

    @Column(name = "END_OF_PRODUCTION")
    private Timestamp endOfProduction;

    @Column(name = "EXCHANGE_RATE_TYPE_ID", length = 20)
    private String exchangeRateTypeId;

    @Fk(value = Status.class)
    @Column(name = "STATUS_ID", length = 20)
    private String statusId;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Integer getBaseVersionId() {
        return baseVersionId;
    }

    public void setBaseVersionId(Integer baseVersionId) {
        this.baseVersionId = baseVersionId;
    }

    public Integer getCalculationVersionType() {
        return calculationVersionType;
    }

    public void setCalculationVersionType(Integer calculationVersionType) {
        this.calculationVersionType = calculationVersionType;
    }

    public Integer getLifecyclePeriodFrom() {
        return lifecyclePeriodFrom;
    }

    public void setLifecyclePeriodFrom(Integer lifecyclePeriodFrom) {
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
    }

    public Integer getIsFrozen() {
        return isFrozen;
    }

    public void setIsFrozen(Integer isFrozen) {
        this.isFrozen = isFrozen;
    }

    public Integer getVariantId() {
        return variantId;
    }

    public void setVariantId(Integer variantId) {
        this.variantId = variantId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getSalesDocument() {
        return salesDocument;
    }

    public void setSalesDocument(String salesDocument) {
        this.salesDocument = salesDocument;
    }

    public BigDecimal getSalesPrice() {
        return salesPrice;
    }

    public void setSalesPrice(BigDecimal salesPrice) {
        this.salesPrice = salesPrice;
    }

    public String getReportCurrencyId() {
        return reportCurrencyId;
    }

    public void setReportCurrencyId(String reportCurrencyId) {
        this.reportCurrencyId = reportCurrencyId;
    }

    public String getCostingSheetId() {
        return costingSheetId;
    }

    public void setCostingSheetId(String costingSheetId) {
        this.costingSheetId = costingSheetId;
    }

    public String getComponentSplitId() {
        return componentSplitId;
    }

    public void setComponentSplitId(String componentSplitId) {
        this.componentSplitId = componentSplitId;
    }

    public Timestamp getStartOfProduction() {
        return startOfProduction;
    }

    public void setStartOfProduction(Timestamp startOfProduction) {
        this.startOfProduction = startOfProduction;
    }

    public Timestamp getEndOfProduction() {
        return endOfProduction;
    }

    public void setEndOfProduction(Timestamp endOfProduction) {
        this.endOfProduction = endOfProduction;
    }

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

        CalculationVersionTemporary that = (CalculationVersionTemporary) o;

        return new EqualsBuilder()
                .append(sessionId, that.sessionId)
                .append(calculationVersionId, that.calculationVersionId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(sessionId)
                .append(calculationVersionId)
                .toHashCode();
    }
}
