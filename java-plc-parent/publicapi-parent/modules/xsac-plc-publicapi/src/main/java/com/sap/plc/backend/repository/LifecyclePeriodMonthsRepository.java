package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.LifecyclePeriodMonth;
import com.sap.plc.backend.model.pks.LifecyclePeriodMonthsPrimaryKey;
import com.sap.plc.backend.repository.cust.lifecycleperiod.LifecyclePeriodMonthsCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LifecyclePeriodMonthsRepository extends EntityRepository<LifecyclePeriodMonth,
        LifecyclePeriodMonthsPrimaryKey>,
        LifecyclePeriodMonthsCustomRepository,
        JpaSpecificationExecutor<LifecyclePeriodMonth> {


    List<LifecyclePeriodMonth> findAllByProjectIdAndYear(String projectId, Integer year);
    void deleteByProjectIdAndYearIn(String projectId, List<Integer> years);
}
