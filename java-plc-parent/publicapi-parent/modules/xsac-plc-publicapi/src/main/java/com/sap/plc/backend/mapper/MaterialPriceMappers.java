package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.MaterialPriceCreateGeneratedDto;
import com.sap.plc.backend.dto.MaterialPriceGeneratedDto;
import com.sap.plc.backend.dto.MaterialPriceKeyGeneratedDto;
import com.sap.plc.backend.dto.MaterialPricePatchGeneratedDto;
import com.sap.plc.backend.dto.MaterialPriceUpsertGeneratedDto;
import com.sap.plc.backend.model.masterdata.MaterialPrice;
import com.sap.plc.backend.model.masterdata.MaterialPriceView;
import com.sap.plc.backend.model.pks.MaterialPricePrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class MaterialPriceMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPriceKeyGeneratedDtoMapper
            extends EntityMapper<MaterialPrice, MaterialPriceKeyGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPricePatchGeneratedDtoMapper extends MasterdataMapper<MaterialPrice,
            MaterialPricePatchGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPriceUpsertGeneratedDtoMapper extends MasterdataMapper<MaterialPrice,
            MaterialPriceUpsertGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPriceCreateGeneratedDtoMapper extends MasterdataMapper<MaterialPrice,
            MaterialPriceCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPriceGeneratedDtoMapper extends MasterdataMapper<MaterialPrice,
            MaterialPriceGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPriceViewGeneratedDtoMapper extends MasterdataMapper<MaterialPriceView,
            MaterialPriceGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialPricePKGeneratedDtoMapper extends PrimaryKeyMapper<MaterialPricePrimaryKey, MaterialPriceKeyGeneratedDto>{
    }
}
