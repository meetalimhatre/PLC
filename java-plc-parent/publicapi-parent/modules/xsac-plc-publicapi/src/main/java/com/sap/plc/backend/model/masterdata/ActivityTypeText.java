package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.ActivityTypeTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

@IdClass(ActivityTypeTextPrimaryKey.class)
@Entity
@Table(name = ActivityTypeText.TABLE_NAME)
public class ActivityTypeText extends com.sap.plc.backend.model.Entity<ActivityTypeText, ActivityTypeTextPrimaryKey> {

    private static final long serialVersionUID = -271437842990493891L;
    static final String TABLE_NAME = "`sap.plc.db::basis.t_activity_type__text`";

    @Id
    @Column(name = "ACTIVITY_TYPE_ID", nullable = false, length = 12)
    private String activityTypeId;

    @Id
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Id
    @Column(name = "LANGUAGE", nullable = false, length = 11)
    private String language;

    @Column(name = "ACTIVITY_TYPE_DESCRIPTION", length = 250)
    private String description;

    @Id
    @Column(name = "_VALID_FROM", nullable = false)
    private Timestamp validFrom;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    @Column(name = "_SOURCE", length = 3)
    private Integer source;

    @Column(name = "_CREATED_BY", length = 256)
    private String createdBy;

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getActivityTypeId() {
        return activityTypeId;
    }

    public void setActivityTypeId(String activityTypeId) {
        this.activityTypeId = activityTypeId;
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

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        ActivityTypeText that = (ActivityTypeText) o;

        return new EqualsBuilder()
                .append(activityTypeId, that.activityTypeId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(activityTypeId)
                .append(controllingAreaId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }
}
