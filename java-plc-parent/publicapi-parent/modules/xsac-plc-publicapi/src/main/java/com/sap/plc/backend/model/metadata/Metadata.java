package com.sap.plc.backend.model.metadata;

import com.sap.plc.backend.model.pks.MetadataPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.List;

@IdClass(MetadataPrimaryKey.class)
@Entity
@Table(name = "`sap.plc.db::basis.t_metadata`")
public class Metadata implements Serializable {

    private static final long serialVersionUID = -6667720828760718178L;

    @Id
    @Column(name = "PATH", nullable = false, length = 127)
    private String path;

    @Id
    @Column(name = "BUSINESS_OBJECT", nullable = false, length = 127)
    private String businessObject;

    @Id
    @Column(name = "COLUMN_ID", nullable = false, length = 127)
    private String columnId;

    @Column(name = "IS_CUSTOM")
    private Integer isCustom;

    @Column(name = "SEMANTIC_DATA_TYPE", nullable = false, length = 35)
    private String semanticDataType;

    @Column(name = "SEMANTIC_DATA_TYPE_ATTRIBUTES", length = 250)
    private String semanticDataTypeAttributes;

    @Column(name = "PROPERTY_TYPE")
    private Integer propertyType;

    @OneToMany(mappedBy = "metadata")
    private List<MetadataItemAttributes> metadataItemAttributes;

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

    public Integer getIsCustom() {
        return isCustom;
    }

    public void setIsCustom(Integer custom) {
        isCustom = custom;
    }

    public String getSemanticDataType() {
        return semanticDataType;
    }

    public void setSemanticDataType(String semanticDataType) {
        this.semanticDataType = semanticDataType;
    }

    public String getSemanticDataTypeAttributes() {
        return semanticDataTypeAttributes;
    }

    public void setSemanticDataTypeAttributes(String semanticDataTypeAttributes) {
        this.semanticDataTypeAttributes = semanticDataTypeAttributes;
    }

    public Integer getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(Integer propertyType) {
        this.propertyType = propertyType;
    }

    public List<MetadataItemAttributes> getMetadataItemAttributes() {
        return metadataItemAttributes;
    }

    public void setMetadataItemAttributes(
            List<MetadataItemAttributes> metadataItemAttributes) {
        this.metadataItemAttributes = metadataItemAttributes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Metadata metadata = (Metadata) o;

        return new EqualsBuilder()
                .append(path, metadata.path)
                .append(businessObject, metadata.businessObject)
                .append(columnId, metadata.columnId)
                .append(isCustom, metadata.isCustom)
                .append(semanticDataType, metadata.semanticDataType)
                .append(semanticDataTypeAttributes, metadata.semanticDataTypeAttributes)
                .append(propertyType, metadata.propertyType)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(path)
                .append(businessObject)
                .append(columnId)
                .append(isCustom)
                .append(semanticDataType)
                .append(semanticDataTypeAttributes)
                .append(propertyType)
                .toHashCode();
    }
}