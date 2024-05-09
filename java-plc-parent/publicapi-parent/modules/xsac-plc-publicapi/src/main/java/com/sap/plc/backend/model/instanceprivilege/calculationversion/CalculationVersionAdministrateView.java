package com.sap.plc.backend.model.instanceprivilege.calculationversion;

import com.sap.plc.backend.model.pks.CalculationInstancePrivilegeViewPrimaryKey;

import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.instanceprivilege.calculationversion.CalculationVersionAdministrateView.VIEW_NAME;

@IdClass(CalculationInstancePrivilegeViewPrimaryKey.class)
@jakarta.persistence.Entity
@Table(name = VIEW_NAME)
public class CalculationVersionAdministrateView extends CalculationVersionInstancePrivilegeView<CalculationVersionCreateEditView> {
    static final String VIEW_NAME = "`sap.plc.db.authorization::privileges.v_calculation_version_administrate`";
}
