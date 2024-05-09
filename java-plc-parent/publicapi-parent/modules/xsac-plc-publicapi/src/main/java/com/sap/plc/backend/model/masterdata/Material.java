package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.MaterialPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.List;
import java.util.Map;

@IdClass(MaterialPrimaryKey.class)
@Entity
@Table(name = Material.TABLE_NAME)
public class Material extends Masterdata<Material, MaterialPrimaryKey> {

    private static final long serialVersionUID = -6249546149512856525L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_material`";
    private static final String EXTENSION_TABLE_NAME = "\"sap.plc.db::basis.t_material_ext\"";

    @Id
    @Column(name = "MATERIAL_ID", nullable = false, length = 40)
    private String materialId;

    @Column(name = "BASE_UOM_ID", length = 3)
    @Fk(value = Uom.class, name = "uomId")
    private String baseUomId;

    @Column(name = "MATERIAL_GROUP_ID", length = 9)
    private String materialGroupId;

    @Column(name = "MATERIAL_TYPE_ID", length = 4)
    private String materialTypeId;

    @Column(name = "IS_CREATED_VIA_CAD_INTEGRATION")
    private Boolean isCreatedViaCadIntegration;

    @Column(name = "IS_PHANTOM_MATERIAL")
    private Boolean isPhantomMaterial;

    @Column(name = "IS_CONFIGURABLE_MATERIAL")
    private Boolean isConfigurableMaterial;

    @Transient
    private Map<String, Object> textsMap;

    @Transient
    private List<MaterialText> texts;

    public List<MaterialText> getTexts() {
        return texts;
    }

    public Material setTexts(List<MaterialText> texts) {
        this.texts = texts;
        return this;
    }

    public String getMaterialId() {
        return materialId;
    }

    public void setMaterialId(String materialId) {
        this.materialId = materialId;
    }

    public String getBaseUomId() {
        return baseUomId;
    }

    public void setBaseUomId(String baseUomId) {
        this.baseUomId = baseUomId;
    }

    public String getMaterialGroupId() {
        return materialGroupId;
    }

    public void setMaterialGroupId(String id) {
        this.materialGroupId = id;
    }

    public String getMaterialTypeId() {
        return materialTypeId;
    }

    public void setMaterialTypeId(String materialTypeId) {
        this.materialTypeId = materialTypeId;
    }

    public Boolean getIsCreatedViaCadIntegration() {
        return isCreatedViaCadIntegration;
    }

    public void setIsCreatedViaCadIntegration(Boolean isCreatedViaCadIntegration) {
        this.isCreatedViaCadIntegration = isCreatedViaCadIntegration;
    }

    public Boolean getIsPhantomMaterial() {
        return isPhantomMaterial;
    }

    public void setIsPhantomMaterial(Boolean isPhantomMaterial) {
        this.isPhantomMaterial = isPhantomMaterial;
    }

    public Boolean getIsConfigurableMaterial() {
        return isConfigurableMaterial;
    }

    public void setIsConfigurableMaterial(Boolean isConfigurableMaterial) {
        this.isConfigurableMaterial = isConfigurableMaterial;
    }

    public Map<String, Object> getTextsMap() {
        return this.textsMap;
    }

    public void setTextsMap(Map<String, Object> textsMap) {
        this.textsMap = textsMap;
    }

    @Override
    public String getEntityId() {
        return materialId;
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Material material = (Material) o;

        return new EqualsBuilder()
                .append(materialId, material.materialId)
                .append(validFrom, material.validFrom)
                .isEquals();
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Material material = (Material) o;

        return new EqualsBuilder()
                .append(materialId, material.materialId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(materialId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String getExtensionTableName() {
        return EXTENSION_TABLE_NAME;
    }

}