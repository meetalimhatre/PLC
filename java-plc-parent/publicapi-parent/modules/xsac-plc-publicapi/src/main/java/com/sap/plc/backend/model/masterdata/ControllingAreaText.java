package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.ControllingAreaTextKey;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;
import java.util.Objects;

import static com.sap.plc.backend.model.masterdata.ControllingAreaText.TABLE_NAME;

@IdClass(ControllingAreaTextKey.class)
@Entity
@Table(name = TABLE_NAME)
public class ControllingAreaText extends com.sap.plc.backend.model.Entity<ControllingAreaText, ControllingAreaTextKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_controlling_area__text`";
    private static final long serialVersionUID = 767809672955299250L;

    @Id
    @Column(name = "CONTROLLING_AREA_ID")
    private String controllingAreaId;

    @Column(name = "CONTROLLING_AREA_DESCRIPTION")
    private String description;

    @Id
    @Column(name = "LANGUAGE")
    private String language;

    @Id
    @Column(name = "_VALID_FROM")
    private Timestamp validFrom;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    public ControllingAreaText() {
    }

    public ControllingAreaText(String controllingAreaId, String description, String language, Timestamp validFrom) {
        this.controllingAreaId = controllingAreaId;
        this.description = description;
        this.language = language;
        this.validFrom = validFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ControllingAreaText that = (ControllingAreaText) o;
        return Objects.equals(controllingAreaId, that.controllingAreaId) &&
                Objects.equals(language, that.language) &&
                Objects.equals(validFrom, that.validFrom);
    }

    @Override
    public int hashCode() {
        return Objects.hash(controllingAreaId, language, validFrom);
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Timestamp getValidTo() {
        return validTo;
    }

    public void setValidTo(Timestamp validTo) {
        this.validTo = validTo;
    }
}
