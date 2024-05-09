package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.OneTimeProjectCost;
import com.sap.plc.backend.model.pks.OneTimeProjectCostPrimaryKey;
import com.sap.plc.backend.repository.cust.onetimeprojectcost.OneTimeProjectCostCustomRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OneTimeProjectCostRepository
        extends EntityRepository<OneTimeProjectCost, OneTimeProjectCostPrimaryKey>, OneTimeProjectCostCustomRepository {

    List<OneTimeProjectCost> findByOneTimeCostIdIn(Collection<Integer> oneTimeCostIds);

    List<OneTimeProjectCost> findByCostDescriptionInAndProjectId(Collection<String> costDescriptions, String projectId);
}
