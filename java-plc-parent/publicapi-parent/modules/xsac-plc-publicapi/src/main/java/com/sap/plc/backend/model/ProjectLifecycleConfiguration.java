package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.ProjectLifecycleConfigurationPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.sql.Timestamp;

import static com.sap.plc.backend.model.ProjectLifecycleConfiguration.TABLE_NAME;

@jakarta.persistence.Entity
@IdClass(ProjectLifecycleConfigurationPrimaryKey.class)
@Table(name = TABLE_NAME)
public class ProjectLifecycleConfiguration extends Entity<ProjectLifecycleConfiguration,
        ProjectLifecycleConfigurationPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_project_lifecycle_configuration`";

    @Id
    @Column(name = "CALCULATION_ID", nullable = false)
    private Integer calculationId;

    @Id
    @Column(name = "PROJECT_ID", nullable = false)
    private String projectId;

    @Column(name = "CALCULATION_VERSION_ID")
    private Integer calculationVersionId;

    @Column(name = "IS_ONE_TIME_COST_ASSIGNED")
    private Integer isOneTimeCostAssigned;

    @Column(name = "MATERIAL_PRICE_SURCHARGE_STRATEGY", nullable = false)
    private String materialPriceSurchargeStrategy;

    @Column(name = "ACTIVITY_PRICE_SURCHARGE_STRATEGY", nullable = false)
    private String activityPriceSurchargeStrategy;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false)
    private String lastModifiedBy;

    public ProjectLifecycleConfiguration() {
    }

    public ProjectLifecycleConfiguration(ProjectLifecycleConfigurationPrimaryKey pk) {
        this.projectId = pk.getProjectId();
        this.calculationId = pk.getCalculationId();
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Integer getCalculationVersionId() {
        return calculationVersionId;
    }

    public void setCalculationVersionId(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
    }

    public Integer getIsOneTimeCostAssigned() {
        return isOneTimeCostAssigned;
    }

    public void setIsOneTimeCostAssigned(Integer isOneTimeCostAssigned) {
        this.isOneTimeCostAssigned = isOneTimeCostAssigned;
    }

    public String getMaterialPriceSurchargeStrategy() {
        return materialPriceSurchargeStrategy;
    }

    public void setMaterialPriceSurchargeStrategy(String materialPriceSurchargeStrategy) {
        this.materialPriceSurchargeStrategy = materialPriceSurchargeStrategy;
    }

    public String getActivityPriceSurchargeStrategy() {
        return activityPriceSurchargeStrategy;
    }

    public void setActivityPriceSurchargeStrategy(String activityPriceSurchargeStrategy) {
        this.activityPriceSurchargeStrategy = activityPriceSurchargeStrategy;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ProjectLifecycleConfiguration that = (ProjectLifecycleConfiguration) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .append(projectId, that.projectId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .append(projectId)
                .toHashCode();
    }
}
