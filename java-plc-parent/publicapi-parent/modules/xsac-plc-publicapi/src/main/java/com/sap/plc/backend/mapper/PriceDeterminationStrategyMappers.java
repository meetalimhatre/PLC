package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.PriceDeterminationRuleGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyCreateGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyDeleteGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyGeneratedDto;
import com.sap.plc.backend.dto.PriceDeterminationStrategyUpdateGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.PriceDeterminationStrategy;
import com.sap.plc.backend.model.PriceDeterminationRule;
import com.sap.plc.backend.model.PriceDeterminationStrategyText;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

import java.util.List;

public class PriceDeterminationStrategyMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyGeneratedDtoMapper extends EntityMapper<PriceDeterminationStrategy,
            PriceDeterminationStrategyGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyTextGeneratedDtoMapper
            extends EntityMapper<PriceDeterminationStrategyText,
            TextsGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyDeleteGeneratedDtoMapper extends EntityMapper<PriceDeterminationStrategy,
            PriceDeterminationStrategyDeleteGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyCreateGeneratedDtoMapper extends EntityMapper<PriceDeterminationStrategy,
            PriceDeterminationStrategyCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyUpdateGeneratedDtoMapper extends EntityMapper<PriceDeterminationStrategy,
            PriceDeterminationStrategyUpdateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationRuleGeneratedDtoMapper extends EntityMapper<PriceDeterminationRule,
            PriceDeterminationRuleGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceDeterminationStrategyUpdateToCreateGeneratedDtoMapper {

        PriceDeterminationStrategyCreateGeneratedDto updateToCreate(PriceDeterminationStrategyUpdateGeneratedDto updateDto);

        List<PriceDeterminationStrategyCreateGeneratedDto> updateToCreate(List<PriceDeterminationStrategyUpdateGeneratedDto> updateDtoList);
    }
}
