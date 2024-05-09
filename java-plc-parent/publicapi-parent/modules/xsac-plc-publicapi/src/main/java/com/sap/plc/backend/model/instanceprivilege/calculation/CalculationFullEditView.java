package com.sap.plc.backend.model.instanceprivilege.calculation;

import com.sap.plc.backend.model.pks.CalculationInstancePrivilegeViewPrimaryKey;

import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.instanceprivilege.calculation.CalculationFullEditView.VIEW_NAME;

@IdClass(CalculationInstancePrivilegeViewPrimaryKey.class)
@jakarta.persistence.Entity
@Table(name = VIEW_NAME)
public class CalculationFullEditView extends CalculationInstancePrivilegeView<CalculationFullEditView> {
    static final String VIEW_NAME = "`sap.plc.db.authorization::privileges.v_calculation_full_edit`";
}
