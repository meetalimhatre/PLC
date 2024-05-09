package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.OneTimeProductCost;
import com.sap.plc.backend.model.pks.OneTimeProductCostPrimaryKey;
import com.sap.plc.backend.repository.cust.onetimeproductcost.OneTimeProductCostCustomRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OneTimeProductCostRepository
        extends EntityRepository<OneTimeProductCost, OneTimeProductCostPrimaryKey>, OneTimeProductCostCustomRepository {

    List<OneTimeProductCost> findByOneTimeCostIdIn(List<Integer> oneTimeCostIds);

    @Modifying
    void deleteByOneTimeCostIdIn(List<Integer> oneTimeCostIds);
}
