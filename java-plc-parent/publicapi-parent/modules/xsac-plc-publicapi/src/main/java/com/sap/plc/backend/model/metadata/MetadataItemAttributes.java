package com.sap.plc.backend.model.metadata;

import com.sap.plc.backend.model.pks.MetadataItemAttributesPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.sql.Timestamp;

@IdClass(MetadataItemAttributesPrimaryKey.class)
@Entity
@Table(name = "`sap.plc.db::basis.t_metadata_item_attributes`")
public class MetadataItemAttributes implements Serializable {

    private static final long serialVersionUID = -8329253175801453174L;
    @Id
    @Column(name = "PATH", nullable = false, length = 127)
    private String path;

    @Id
    @Column(name = "BUSINESS_OBJECT", nullable = false, length = 127)
    private String businessObject;

    @Id
    @Column(name = "COLUMN_ID", nullable = false, length = 127)
    private String columnId;

    @Id
    @Column(name = "ITEM_CATEGORY_ID", nullable = false)
    private Integer itemCategoryId;

    @Id
    @Column(name = "SUBITEM_STATE", nullable = false)
    private Integer subitemState;

    @Column(name = "IS_MANDATORY")
    private Integer isMandatory;

    @Column(name = "IS_READ_ONLY")
    private Integer isReadOnly;

    @Column(name = "IS_TRANSFERABLE")
    private Integer isTransferable;

    @Column(name = "DEFAULT_VALUE", length = 5000)
    private String defaultValue;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY", length = 256)
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", length = 256)
    private String lastModifiedBy;

    @ManyToOne
    @JoinColumns({
            @JoinColumn(name = "PATH", referencedColumnName = "path", insertable = false, updatable = false),
            @JoinColumn(name = "BUSINESS_OBJECT", referencedColumnName = "BUSINESS_OBJECT", insertable = false,
                    updatable = false),
            @JoinColumn(name = "COLUMN_ID", referencedColumnName = "COLUMN_ID", insertable = false, updatable = false)
    })

    private Metadata metadata;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getBusinessObject() {
        return businessObject;
    }

    public void setBusinessObject(String businessObject) {
        this.businessObject = businessObject;
    }

    public String getColumnId() {
        return columnId;
    }

    public void setColumnId(String columnId) {
        this.columnId = columnId;
    }

    public Integer getItemCategoryId() {
        return itemCategoryId;
    }

    public void setItemCategoryId(Integer itemCategoryId) {
        this.itemCategoryId = itemCategoryId;
    }

    public Integer getSubitemState() {
        return subitemState;
    }

    public void setSubitemState(Integer subitemState) {
        this.subitemState = subitemState;
    }

    public Integer getIsMandatory() {
        return isMandatory;
    }

    public void setIsMandatory(Integer isMandatory) {
        this.isMandatory = isMandatory;
    }

    public Integer getIsReadOnly() {
        return isReadOnly;
    }

    public void setIsReadOnly(Integer isReadOnly) {
        this.isReadOnly = isReadOnly;
    }

    public Integer getIsTransferable() {
        return isTransferable;
    }

    public void setIsTransferable(Integer isTransferable) {
        this.isTransferable = isTransferable;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
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

    public Metadata getMetadata() {
        return metadata;
    }

    public void setMetadata(Metadata metadata) {
        this.metadata = metadata;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MetadataItemAttributes that = (MetadataItemAttributes) o;

        return new EqualsBuilder()
                .append(path, that.path)
                .append(businessObject, that.businessObject)
                .append(columnId, that.columnId)
                .append(itemCategoryId, that.itemCategoryId)
                .append(subitemState, that.subitemState)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(path)
                .append(businessObject)
                .append(columnId)
                .append(itemCategoryId)
                .append(subitemState)
                .toHashCode();
    }
}