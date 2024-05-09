package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.ProjectPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.Project.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
@IdClass(ProjectPrimaryKey.class)
public class Project extends com.sap.plc.backend.model.Entity<Project, ProjectPrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_project`";
    private static final long serialVersionUID = 5240801016648579233L;

    @Id
    @Column(name = "PROJECT_ID", nullable = false)
    private String projectId;

    @Column(name = "ENTITY_ID", nullable = false)
    private Integer entityId;

    @Column(name = "REFERENCE_PROJECT_ID", length = 24)
    private String referenceProjectId;

    @Column(name = "PROJECT_NAME")
    private String projectName;

    @Column(name = "PROJECT_RESPONSIBLE")
    private String projectResponsible;

    @Column(name = "CONTROLLING_AREA_ID", nullable = false)
    private String controllingAreaId;

    @Column(name = "CUSTOMER_ID")
    private String customerId;

    @Column(name = "SALES_DOCUMENT")
    private String salesDocument;

    @Column(name = "SALES_PRICE")
    private BigDecimal salesPrice;

    @Column(name = "SALES_PRICE_CURRENCY_ID")
    private String salesPriceCurrencyId;

    @Column(name = "COMMENT")
    private String comment;

    @Column(name = "COMPANY_CODE_ID")
    private String companyCodeId;

    @Column(name = "PLANT_ID")
    private String plantId;

    @Column(name = "BUSINESS_AREA_ID")
    private String businessAreaId;

    @Column(name = "PROFIT_CENTER_ID")
    private String profitCenterId;

    @Column(name = "REPORT_CURRENCY_ID", nullable = false)
    private String reportCurrencyId;

    @Column(name = "COSTING_SHEET_ID")
    private String costingSheetId;

    @Column(name = "COMPONENT_SPLIT_ID")
    private String componentSplitId;

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

    @Column(name = "LIFECYCLE_PERIOD_INTERVAL", nullable = false)
    private Integer lifecyclePeriodInterval;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false)
    private String lastModifiedBy;

    @Column(name = "EXCHANGE_RATE_TYPE_ID")
    private String exchangeRateTypeId;

    @Column(name = "MATERIAL_PRICE_STRATEGY_ID")
    private String materialPriceStrategyId;

    @Column(name = "ACTIVITY_PRICE_STRATEGY_ID")
    private String activityPriceStrategyId;

    public String getReferenceProjectId() {
        return referenceProjectId;
    }

    public void setReferenceProjectId(String referenceProjectId) {
        this.referenceProjectId = referenceProjectId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
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

    public Project setMaterialPriceStrategyId(String materialPriceStrategyId) {
        this.materialPriceStrategyId = materialPriceStrategyId;
        return this;
    }

    public String getActivityPriceStrategyId() {
        return activityPriceStrategyId;
    }

    public Project setActivityPriceStrategyId(String activityPriceStrategyId) {
        this.activityPriceStrategyId = activityPriceStrategyId;
        return this;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public Project setEntityId(Integer entityId) {
        this.entityId = entityId;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Project project = (Project) o;

        return new EqualsBuilder()
                .append(projectId, project.projectId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .toHashCode();
    }
}