package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.OneTimeCostLifecycleValue;
import com.sap.plc.backend.model.pks.OneTimeCostLifecycleValuePrimaryKey;
import com.sap.plc.backend.repository.cust.onetimecostlifecyclevalue.OneTimeCostLifecycleValueCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OneTimeCostLifecycleValueRepository
        extends EntityRepository<OneTimeCostLifecycleValue, OneTimeCostLifecycleValuePrimaryKey>,
        OneTimeCostLifecycleValueCustomRepository,
        JpaSpecificationExecutor<OneTimeCostLifecycleValue> {

    @Procedure("\"sap.plc.db.calculationmanager.procedures::p_project_calculate_one_time_costs\"")
    void calculateOneTimeCosts(String projectId);

    @Modifying
    void deleteByOneTimeCostIdIn(List<Integer> oneTimeCostIds);

    List<OneTimeCostLifecycleValue> findByOneTimeCostIdIn(List<Integer> oneTimeCostIds);
}
