package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CostCenterTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

@IdClass(CostCenterTextPrimaryKey.class)
@Entity
@Table(name = "`sap.plc.db::basis.t_cost_center__text`")
public class CostCenterText extends com.sap.plc.backend.model.Entity<CostCenterText, CostCenterTextPrimaryKey> {

    private static final long serialVersionUID = -4395607158713388322L;

    @Id
    @Column(name = "COST_CENTER_ID", nullable = false, length = 10)
    private String costCenterId;

    @Id
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Id
    @Column(name = "LANGUAGE", nullable = false, length = 11)
    private String language;

    @Id
    @Column(name = "_VALID_FROM", nullable = false)
    private Timestamp validFrom;

    @Column(name = "COST_CENTER_DESCRIPTION", length = 250)
    private String description;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    @Column(name = "_SOURCE", length = 3)
    private Integer source;

    @Column(name = "_CREATED_BY", length = 256)
    private String createdBy;

    public CostCenterText() {
    }

    public CostCenterText(String costCenterId, String description) {
        this.costCenterId = costCenterId;
        this.description = description;
    }

    public CostCenterText(String costCenterId, String language, String description) {
        this.costCenterId = costCenterId;
        this.language = language;
        this.description = description;
    }

    public CostCenterText(String costCenterId, String language, Timestamp validFrom) {
        this.costCenterId = costCenterId;
        this.language = language;
        this.validFrom = validFrom;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getCostCenterId() {
        return costCenterId;
    }

    public void setCostCenterId(String costCenterId) {
        this.costCenterId = costCenterId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Timestamp getValidTo() {
        return validTo;
    }

    public void setValidTo(Timestamp validTo) {
        this.validTo = validTo;
    }

    public Integer getSource() {
        return source;
    }

    public void setSource(Integer source) {
        this.source = source;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getId() {
        return this.getCostCenterId()
                .replace("#", "%23");
    }

    public String getUniqueQuery() {
        StringBuilder sb = new StringBuilder("validFrom=");
        return sb.append(this.getValidFrom())
                .append(" and language=")
                .append(this.getLanguage())
                .toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CostCenterText that = (CostCenterText) o;

        return new EqualsBuilder()
                .append(costCenterId, that.costCenterId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(costCenterId)
                .append(controllingAreaId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }
}