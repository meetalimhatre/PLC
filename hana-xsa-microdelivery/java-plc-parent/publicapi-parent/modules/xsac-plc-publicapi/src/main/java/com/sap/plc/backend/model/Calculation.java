package com.sap.plc.backend.model;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.Calculation.TABLE_NAME;

@jakarta.persistence.Entity
@Table(name = TABLE_NAME)
public class Calculation extends Entity<Calculation, Integer> {

    private static final long serialVersionUID = 7836920415806832732L;

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_calculation`";
    public static final String TABLE_NAME_DOUBLE_QUOTES = "\"sap.plc.db::basis.t_calculation\"";

    public Calculation() {
    }

    public Calculation(Integer calculationId) {
        this.calculationId = calculationId;
    }

    @Id
    @Column(name = "CALCULATION_ID", nullable = false)
    private Integer calculationId;

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

        Calculation that = (Calculation) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .toHashCode();
    }
}
