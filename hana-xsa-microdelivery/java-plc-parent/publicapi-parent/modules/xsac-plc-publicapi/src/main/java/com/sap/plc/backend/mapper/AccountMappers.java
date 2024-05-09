package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.AccountGeneratedDto;
import com.sap.plc.backend.dto.AccountSearchGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.masterdata.Account;
import com.sap.plc.backend.model.masterdata.AccountText;
import com.sap.plc.backend.model.pks.AccountPrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class AccountMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface AccountGeneratedDtoMapper extends MasterdataMapper<Account, AccountGeneratedDto>{
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface AccountSearchGeneratedDtoMapper extends PrimaryKeyMapper<AccountPrimaryKey, AccountSearchGeneratedDto>{
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface AccountTextGeneratedDtoMapper extends EntityMapper<AccountText, TextsGeneratedDto>{
    }
}
