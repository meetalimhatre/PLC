package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.ActivityPriceCreateGeneratedDto;
import com.sap.plc.backend.dto.ActivityPriceGeneratedDto;
import com.sap.plc.backend.dto.ActivityPriceKeyGeneratedDto;
import com.sap.plc.backend.dto.ActivityPricePatchGeneratedDto;
import com.sap.plc.backend.dto.ActivityPriceUpsertGeneratedDto;
import com.sap.plc.backend.model.masterdata.ActivityPrice;
import com.sap.plc.backend.model.pks.ActivityPricePrimaryKey;

import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ActivityPriceMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPriceKeyGeneratedDtoMapper
            extends EntityMapper<ActivityPrice, ActivityPriceKeyGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPricePatchGeneratedDtoMapper extends MasterdataMapper<ActivityPrice,
            ActivityPricePatchGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPriceUpsertGeneratedDtoMapper extends MasterdataMapper<ActivityPrice,
            ActivityPriceUpsertGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPriceCreateGeneratedDtoMapper extends MasterdataMapper<ActivityPrice,
            ActivityPriceCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPriceGeneratedDtoMapper extends MasterdataMapper<ActivityPrice,
            ActivityPriceGeneratedDto> {
    }
    
    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityPricePKGeneratedDtoMapper extends PrimaryKeyMapper<ActivityPricePrimaryKey, ActivityPriceKeyGeneratedDto>{
    }

}
