package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceDeterminationRule;
import com.sap.plc.backend.model.pks.PriceDeterminationRulePrimaryKey;
import com.sap.plc.backend.repository.cust.pricedeterminationstrategy.PriceDeterminationRuleCustomRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceDeterminationRuleRepository extends PLCRepository<PriceDeterminationRule,
        PriceDeterminationRulePrimaryKey>, PriceDeterminationRuleCustomRepository {

    List<PriceDeterminationRule> findByPriceDeterminationStrategyIdAndPriceDeterminationStrategyTypeId(
            String priceDeterminationStrategyId, Integer priceDeterminationStrategyTypeId);
}
