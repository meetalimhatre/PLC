package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceDeterminationStrategy;
import com.sap.plc.backend.model.pks.PriceDeterminationStrategyPrimaryKey;
import com.sap.plc.backend.repository.cust.pricedeterminationstrategy.PriceDeterminationStrategyCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceDeterminationStrategyRepository
        extends EntityRepository<PriceDeterminationStrategy, PriceDeterminationStrategyPrimaryKey>,
        PriceDeterminationStrategyCustomRepository,
        JpaRepository<PriceDeterminationStrategy, PriceDeterminationStrategyPrimaryKey>,
        JpaSpecificationExecutor<PriceDeterminationStrategy> {
}
