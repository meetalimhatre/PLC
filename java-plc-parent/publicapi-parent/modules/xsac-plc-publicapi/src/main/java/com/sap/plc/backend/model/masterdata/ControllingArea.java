package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.ControllingAreaPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.sap.plc.backend.model.masterdata.ControllingArea.TABLE_NAME;

@IdClass(ControllingAreaPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class ControllingArea extends Masterdata<ControllingArea, ControllingAreaPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_controlling_area`";

    @Id
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Column(name = "CONTROLLING_AREA_CURRENCY_ID", length = 3)
    private String controllingAreaCurrencyId;

    @Transient
    private List<ControllingAreaText> texts;

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getControllingAreaCurrencyId() {
        return controllingAreaCurrencyId;
    }

    public void setControllingAreaCurrencyId(String controllingAreaCurrencyId) {
        this.controllingAreaCurrencyId = controllingAreaCurrencyId;
    }

    public List<ControllingAreaText> getTexts() {
        return texts != null ? texts : new LinkedList<>();
    }

    public void setTexts(List<ControllingAreaText> texts) {
        this.texts = texts;
    }

    public ControllingArea(String controllingAreaId, String controllingAreaCurrencyId,
                           List<ControllingAreaText> texts) {
        this.controllingAreaId = controllingAreaId;
        this.controllingAreaCurrencyId = controllingAreaCurrencyId;
        this.texts = texts;
    }

    public ControllingArea() {
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ControllingArea that = (ControllingArea) o;
        return Objects.equals(controllingAreaId, that.controllingAreaId) &&
                Objects.equals(validFrom, that.validFrom);
    }

    @Override
    public int hashCode() {
        return Objects.hash(controllingAreaId, validFrom);
    }

    @Override
    public String getEntityId() {
        return controllingAreaId;
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public Map getTextsMap() {
        return null;
    }

    @Override
    public void setTextsMap(Map<String, Object> textsMap) {

    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ControllingArea that = (ControllingArea) o;

        return new EqualsBuilder()
                .append(controllingAreaId, that.controllingAreaId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return null;
    }
}
