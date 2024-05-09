package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.StatusPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.sap.plc.backend.model.Status.TABLE_NAME;

@IdClass(StatusPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class Status extends com.sap.plc.backend.model.Entity<Status, StatusPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_status`";
    private static final long serialVersionUID = 3169625487518359126L;

    public Status() {
    }

    public Status(String statusId) {
        this.statusId = statusId;
    }

    @Id
    @Column(name = "STATUS_ID")
    @Size(max = 23)
    @NotNull
    private String statusId;

    @Column(name = "IS_DEFAULT")
    private Integer isDefault;

    @Column(name = "IS_ACTIVE")
    private Integer isActive;

    @Column(name = "IS_STATUS_COPYABLE")
    private Integer isStatusCopyable;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;

    @Transient
    private List<StatusText> texts;

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
    }

    public Integer getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Integer aDefault) {
        isDefault = aDefault;
    }

    public Integer getIsActive() {
        return isActive;
    }

    public void setIsActive(Integer active) {
        isActive = active;
    }

    public Integer getIsStatusCopyable() {
        return isStatusCopyable;
    }

    public void setIsStatusCopyable(Integer statusCopyable) {
        isStatusCopyable = statusCopyable;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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

    public List<StatusText> getTexts() {
        return texts;
    }

    public void setTexts(List<StatusText> texts) {
        this.texts = texts;
    }

    @Override
    public StatusPrimaryKey getEntityKey() {
        return new StatusPrimaryKey(this.statusId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Status status = (Status) o;

        return new EqualsBuilder()
                .append(statusId, status.statusId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(statusId)
                .toHashCode();
    }

    @Override
    public String getTextTableName() {
        return StatusText.TABLE_NAME;
    }
}
