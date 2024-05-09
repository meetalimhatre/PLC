package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationReadView;
import com.sap.plc.backend.model.pks.CalculationInstancePrivilegeViewPrimaryKey;
import com.sap.plc.backend.repository.cust.instanceprivilege.calculation.CalculationReadViewCustomRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalculationReadViewRepository
        extends EntityRepository<CalculationReadView, CalculationInstancePrivilegeViewPrimaryKey>,
        CalculationReadViewCustomRepository {
}
