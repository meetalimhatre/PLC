package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.PriceSource;
import com.sap.plc.backend.model.pks.PriceSourcePrimaryKey;
import com.sap.plc.backend.repository.cust.pricesource.PriceSourceCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceSourceRepository extends EntityRepository<PriceSource, PriceSourcePrimaryKey>,
        PriceSourceCustomRepository, JpaRepository<PriceSource, PriceSourcePrimaryKey>,
        JpaSpecificationExecutor<PriceSource> {

    @Query(value = "SELECT ps.priceSourceId FROM PriceSource ps WHERE ps.priceSourceId IN :priceSourceIds AND priceSourceTypeId = :priceSourceTypeId")
    List<String> findByPriceSourceIdInAndPriceSourceTypeId(@Param("priceSourceIds") List<String> priceSourceIds,
                                                                @Param("priceSourceTypeId") Integer priceSourceTypeId);
}
