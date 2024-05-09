package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CostCenterPrimaryKey;
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

@IdClass(CostCenterPrimaryKey.class)
@Entity
@Table(name = CostCenter.TABLE_NAME)
public class CostCenter extends Masterdata<CostCenter, CostCenterPrimaryKey> {

    private static final long serialVersionUID = -6249546149512856525L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_cost_center`";
    private static final String EXTENSION_TABLE_NAME = "\"sap.plc.db::basis.t_cost_center_ext\"";

    @Id
    @Column(name = "COST_CENTER_ID", nullable = false, length = 10)
    private String costCenterId;

    @Id
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Transient
    private Map<String, Object> textsMap;

    @Transient
    private List<CostCenterText> texts;

    public List<CostCenterText> getTexts() {
        return texts;
    }

    public CostCenter setTexts(List<CostCenterText> texts) {
        this.texts = texts;
        return this;
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

    public Map<String, Object> getTextsMap() {
        return this.textsMap;
    }

    public void setTextsMap(Map<String, Object> textsMap) {
        this.textsMap = textsMap;
    }

    @Override
    public String getEntityId() {
        return costCenterId;
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

        CostCenter costCenter = (CostCenter) o;

        return new EqualsBuilder()
                .append(costCenterId, costCenter.costCenterId)
                .append(controllingAreaId, costCenter.controllingAreaId)
                .append(validFrom, costCenter.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(costCenterId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CostCenter costCenter = (CostCenter) o;

        return new EqualsBuilder()
                .append(costCenterId, costCenter.costCenterId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }

    @Override
    public String getExtensionTableName() {
        return EXTENSION_TABLE_NAME;
    }

}