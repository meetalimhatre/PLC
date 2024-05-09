package com.sap.plc.backend.model.instanceprivilege.project;

import com.sap.plc.backend.model.pks.ProjectInstancePrivilegeViewPrimaryKey;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.Objects;

@MappedSuperclass
public class ProjectInstancePrivilegeView<TEntity>
        extends com.sap.plc.backend.model.Entity<TEntity, ProjectInstancePrivilegeViewPrimaryKey> {

    private static final long serialVersionUID = -2560184517958106205L;

    @Id
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "USER_ID", nullable = false, length = 256)
    private String userId;

    @Column(name = "ENTITY_ID", nullable = false)
    private Integer entityId;

    @Column(name = "REFERENCE_PROJECT_ID", length = 24)
    private String referenceProjectId;

    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Column(name = "CUSTOMER_ID", length = 10)
    private String customerId;

    @Column(name = "COMPANY_CODE_ID", length = 4)
    private String companyCodeId;

    @Column(name = "PLANT_ID", length = 8)
    private String plantId;

    @Column(name = "BUSINESS_AREA_ID", length = 15)
    private String businessAreaId;

    @Column(name = "PROFIT_CENTER_ID", length = 10)
    private String profitCenterId;

    @Column(name = "REPORT_CURRENCY_ID", length = 3)
    private String reportCurrencyId;

    @Column(name = "COSTING_SHEET_ID", length = 15)
    private String costingSheetId;

    @Column(name = "COMPONENT_SPLIT_ID", length = 35)
    private String componentSplitId;

    @Column(name = "PROJECT_NAME", length = 100)
    private String projectName;

    @Column(name = "PROJECT_RESPONSIBLE", length = 256)
    private String projectResponsible;

    @Column(name = "SALES_DOCUMENT", length = 100)
    private String salesDocument;

    @Column(name = "SALES_PRICE", length = 28, scale = 7)
    private Integer salesPrice;

    @Column(name = "SALES_PRICE_CURRENCY_ID", length = 3)
    private String salesPriceCurrencyId;

    @Column(name = "COMMENT", length = 5000)
    private String comment;

    @Column(name = "START_OF_PROJECT")
    private Date startOfProject;

    @Column(name = "END_OF_PROJECT")
    private Date endOfProject;

    @Column(name = "START_OF_PRODUCTION")
    private Date startOfProduction;

    @Column(name = "END_OF_PRODUCTION")
    private Date endOfProduction;

    @Column(name = "VALUATION_DATE")
    private Date valuationDate;

    @Column(name = "LIFECYCLE_VALUATION_DATE")
    private Date lifecycleValuationDate;

    @Column(name = "LIFECYCLE_PERIOD_INTERVAL", length = 3)
    private Integer lifecyclePeriodInterval;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY", length = 256)
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", length = 256)
    private String lastModifiedBy;

    @Column(name = "EXCHANGE_RATE_TYPE_ID", length = 20)
    private String exchangeRateTypeId;

    @Column(name = "MATERIAL_PRICE_STRATEGY_ID", length = 20)
    private String materialPriceStrategyId;

    @Column(name = "ACTIVITY_PRICE_STRATEGY_ID", length = 20)
    private String activityPriceStrategyId;

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getReferenceProjectId() {
        return referenceProjectId;
    }

    public void setReferenceProjectId(String referenceProjectId) {
        this.referenceProjectId = referenceProjectId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public void setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
    }

    public String getPlantId() {
        return plantId;
    }

    public void setPlantId(String plantId) {
        this.plantId = plantId;
    }

    public String getBusinessAreaId() {
        return businessAreaId;
    }

    public void setBusinessAreaId(String businessAreaId) {
        this.businessAreaId = businessAreaId;
    }

    public String getProfitCenterId() {
        return profitCenterId;
    }

    public void setProfitCenterId(String profitCenterId) {
        this.profitCenterId = profitCenterId;
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

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getProjectResponsible() {
        return projectResponsible;
    }

    public void setProjectResponsible(String projectResponsible) {
        this.projectResponsible = projectResponsible;
    }

    public String getSalesDocument() {
        return salesDocument;
    }

    public void setSalesDocument(String salesDocument) {
        this.salesDocument = salesDocument;
    }

    public Integer getSalesPrice() {
        return salesPrice;
    }

    public void setSalesPrice(Integer salesPrice) {
        this.salesPrice = salesPrice;
    }

    public String getSalesPriceCurrencyId() {
        return salesPriceCurrencyId;
    }

    public void setSalesPriceCurrencyId(String salesPriceCurrencyId) {
        this.salesPriceCurrencyId = salesPriceCurrencyId;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Date getStartOfProject() {
        return startOfProject;
    }

    public void setStartOfProject(Date startOfProject) {
        this.startOfProject = startOfProject;
    }

    public Date getEndOfProject() {
        return endOfProject;
    }

    public void setEndOfProject(Date endOfProject) {
        this.endOfProject = endOfProject;
    }

    public Date getStartOfProduction() {
        return startOfProduction;
    }

    public void setStartOfProduction(Date startOfProduction) {
        this.startOfProduction = startOfProduction;
    }

    public Date getEndOfProduction() {
        return endOfProduction;
    }

    public void setEndOfProduction(Date endOfProduction) {
        this.endOfProduction = endOfProduction;
    }

    public Date getValuationDate() {
        return valuationDate;
    }

    public void setValuationDate(Date valuationDate) {
        this.valuationDate = valuationDate;
    }

    public Date getLifecycleValuationDate() {
        return lifecycleValuationDate;
    }

    public void setLifecycleValuationDate(Date lifecycleValuationDate) {
        this.lifecycleValuationDate = lifecycleValuationDate;
    }

    public Integer getLifecyclePeriodInterval() {
        return lifecyclePeriodInterval;
    }

    public void setLifecyclePeriodInterval(Integer lifecyclePeriodInterval) {
        this.lifecyclePeriodInterval = lifecyclePeriodInterval;
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

    public String getExchangeRateTypeId() {
        return exchangeRateTypeId;
    }

    public void setExchangeRateTypeId(String exchangeRateTypeId) {
        this.exchangeRateTypeId = exchangeRateTypeId;
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
        if (!(o instanceof ProjectInstancePrivilegeView)) {
            return false;
        }
        ProjectInstancePrivilegeView that = (ProjectInstancePrivilegeView) o;
        return projectId.equals(that.projectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(projectId);
    }
}
