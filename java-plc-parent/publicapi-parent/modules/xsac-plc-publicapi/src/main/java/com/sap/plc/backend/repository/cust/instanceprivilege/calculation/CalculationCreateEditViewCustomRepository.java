package com.sap.plc.backend.repository.cust.instanceprivilege.calculation;

import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationCreateEditView;
import com.sap.plc.backend.repository.cust.CustomRepository;
import org.springframework.data.util.Pair;

import java.util.List;
import java.util.Set;

public interface CalculationCreateEditViewCustomRepository extends CustomRepository<CalculationCreateEditView> {

    List<CalculationCreateEditView> findByProjectIdAndCalculationIdIn(
            Set<Pair<String, Integer>> projectIdAndCalculationIdSet);
}
