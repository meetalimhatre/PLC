package com.sap.plc.backend.repository.cust.instanceprivilege.calculation;

import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationReadView;
import com.sap.plc.backend.repository.cust.CustomRepository;
import org.springframework.data.util.Pair;

import java.util.List;
import java.util.Set;

public interface CalculationReadViewCustomRepository extends CustomRepository<CalculationReadView> {

    List<CalculationReadView> findByProjectIdAndCalculationIdIn(Set<Pair<String, Integer>> projectIdAndCalculationIdSet);
}
