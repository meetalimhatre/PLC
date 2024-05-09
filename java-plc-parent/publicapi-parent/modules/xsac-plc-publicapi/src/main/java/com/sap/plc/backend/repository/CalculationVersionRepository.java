package com.sap.plc.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.sap.plc.backend.model.CalculationVersion;
import com.sap.plc.backend.model.pks.CalculationVersionPrimaryKey;

@Repository
public interface CalculationVersionRepository extends JpaRepository<CalculationVersion, CalculationVersionPrimaryKey>,
        JpaSpecificationExecutor<CalculationVersion> {

    List<CalculationVersion> findAllByActivityPriceStrategyIdIn(Collection<String> activityPriceStrategyIdCollection);
    List<CalculationVersion> findAllByMaterialPriceStrategyIdIn(Collection<String> materialPriceStrategyIdCollection);
    List<CalculationVersion> findAllByCalculationId(Integer calculationId);
    boolean existsByCalculationVersionId(Integer calculationVersionId);
    List<CalculationVersion> findAllByCalculationVersionIdIn(List<Integer> calculationVersionIds);
    List<CalculationVersion> findAllByCalculationVersionIdIn(Set<Integer> findAllByCalculationVersionIdIn);
    List<CalculationVersion> findAllByStatusId(String statusId);
}