package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Calculation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalculationRepository extends CrudRepository<Calculation, Integer> {

    List<Calculation> findByProjectId(String projectId);

    List<Calculation> findAllByCalculationIdIn(List<Integer> calculationId);
}
