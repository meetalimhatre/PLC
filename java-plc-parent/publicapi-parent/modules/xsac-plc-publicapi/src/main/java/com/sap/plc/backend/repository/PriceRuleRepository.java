package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceRule;
import com.sap.plc.backend.model.pks.PriceRulePrimaryKey;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceRuleRepository extends PLCRepository<PriceRule, PriceRulePrimaryKey> {
}
