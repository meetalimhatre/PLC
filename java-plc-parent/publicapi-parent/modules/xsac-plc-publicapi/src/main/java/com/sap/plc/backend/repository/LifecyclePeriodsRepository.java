package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.LifecyclePeriod;
import com.sap.plc.backend.model.pks.LifecyclePeriodPrimaryKey;
import com.sap.plc.backend.repository.cust.lifecycleperiod.LifecyclePeriodsCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LifecyclePeriodsRepository
        extends EntityRepository<LifecyclePeriod, LifecyclePeriodPrimaryKey>,
        LifecyclePeriodsCustomRepository,
        JpaSpecificationExecutor<LifecyclePeriod> {
}
