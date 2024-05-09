package com.sap.plc.backend.model.instanceprivilege.calculation;

import com.sap.plc.backend.model.pks.CalculationInstancePrivilegeViewPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.sql.Timestamp;

@MappedSuperclass
public class CalculationInstancePrivilegeView<TEntity>
        extends
        com.sap.plc.backend.model.Entity<TEntity, CalculationInstancePrivilegeViewPrimaryKey> {

    private static final long serialVersionUID = -4158424302373279299L;

    public CalculationInstancePrivilegeView() {
    }

    public CalculationInstancePrivilegeView(String userId, String projectId, Integer calculationId) {
        this.userId = userId;
        this.calculationId = calculationId;
        this.projectId = projectId;
    }

    @Id
    @Column(name = "USER_ID", nullable = false, length = 256)
    private String userId;

    @Id
    @Column(name = "CALCULATION_ID", nullable = false)
    private Integer calculationId;

    @Id
    @Column(name = "PROJECT_ID", nullable = false)
    private String projectId;

    @Column(name = "CALCULATION_NAME", nullable = false)
    private String calculationName;

    @Column(name = "CURRENT_CALCULATION_VERSION_ID")
    private Integer currentCalculationVersionId;

    @Column(name = "CREATED_ON", nullable = false)
    private Timestamp createdOn;

    @Column(name = "CREATED_BY", nullable = false, length = 256)
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false, length = 256)
    private String lastModifiedBy;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public String getCalculationName() {
        return calculationName;
    }

    public void setCalculationName(String calculationName) {
        this.calculationName = calculationName;
    }

    public Integer getCurrentCalculationVersionId() {
        return currentCalculationVersionId;
    }

    public void setCurrentCalculationVersionId(Integer currentCalculationVersionId) {
        this.currentCalculationVersionId = currentCalculationVersionId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CalculationInstancePrivilegeView that = (CalculationInstancePrivilegeView) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .append(userId, that.userId)
                .append(projectId, that.projectId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .append(userId)
                .append(projectId)
                .toHashCode();
    }
}
