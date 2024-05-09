package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.controller.utils.ResponseUtils;
import com.sap.plc.backend.dto.OneTimeCostLifecycleValueGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostCreateGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostPatchGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostPutGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.ErrorResponseDetail;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponseBuilder;
import com.sap.plc.backend.mapper.OneTimeCostLifecycleValueMappers;
import com.sap.plc.backend.mapper.OneTimeProductCostMappers;
import com.sap.plc.backend.model.OneTimeCostLifecycleValue;
import com.sap.plc.backend.model.OneTimeProductCost;
import com.sap.plc.backend.model.pks.OneTimeProductCostPrimaryKey;
import com.sap.plc.backend.service.DtoListValidatorService;
import com.sap.plc.backend.service.OneTimeCostLifecycleValueService;
import com.sap.plc.backend.service.OneTimeProductCostService;
import com.sap.plc.backend.util.OffsetPageable;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.util.Pair;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = OneTimeProductCostController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class OneTimeProductCostController implements OneTimeProductCostGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ONE_TIME_PRODUCT_COSTS;

    private static final String FILTER_PK = "oneTimeCostId,calculationId";

    private final OneTimeProductCostService oneTimeProductCostService;

    private final DtoListValidatorService dtoListValidatorService;

    private final OneTimeCostLifecycleValueService oneTimeCostLifecycleValueService;

    private final OneTimeProductCostMappers.OneTimeProductCostGeneratedDtoMapper oneTimeProductCostMapper;

    private final OneTimeProductCostMappers.OneTimeProductCostCreateGeneratedDtoMapper createGeneratedDtoMapper;

    private final OneTimeProductCostMappers.OneTimeProductCostDeleteGeneratedDtoMapper deleteGeneratedDtoMapper;

    private final OneTimeProductCostMappers.OneTimeProductCostPutGeneratedDtoMapper putGeneratedDtoMapper;

    private final OneTimeProductCostMappers.OneTimeProductCostPatchGeneratedDtoMapper patchGeneratedDtoMapper;

    private final OneTimeCostLifecycleValueMappers.OneTimeCostLifecycleValueGeneratedDtoMapper lifecycleValueDtoMapper;

    public OneTimeProductCostController(OneTimeProductCostService oneTimeProductCostService,
                                        DtoListValidatorService dtoListValidatorService,
                                        OneTimeCostLifecycleValueService oneTimeCostLifecycleValueService,
                                        OneTimeProductCostMappers.OneTimeProductCostGeneratedDtoMapper oneTimeProductCostMapper,
                                        OneTimeProductCostMappers.OneTimeProductCostCreateGeneratedDtoMapper createGeneratedDtoMapper,
                                        OneTimeProductCostMappers.OneTimeProductCostDeleteGeneratedDtoMapper deleteGeneratedDtoMapper,
                                        OneTimeProductCostMappers.OneTimeProductCostPutGeneratedDtoMapper putGeneratedDtoMapper,
                                        OneTimeProductCostMappers.OneTimeProductCostPatchGeneratedDtoMapper patchGeneratedDtoMapper,
                                        OneTimeCostLifecycleValueMappers.OneTimeCostLifecycleValueGeneratedDtoMapper lifecycleValueDtoMapper) {
        this.oneTimeProductCostService = oneTimeProductCostService;
        this.dtoListValidatorService = dtoListValidatorService;
        this.oneTimeCostLifecycleValueService = oneTimeCostLifecycleValueService;
        this.oneTimeProductCostMapper = oneTimeProductCostMapper;
        this.createGeneratedDtoMapper = createGeneratedDtoMapper;
        this.deleteGeneratedDtoMapper = deleteGeneratedDtoMapper;
        this.putGeneratedDtoMapper = putGeneratedDtoMapper;
        this.patchGeneratedDtoMapper = patchGeneratedDtoMapper;
        this.lifecycleValueDtoMapper = lifecycleValueDtoMapper;
    }

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(
            @NotEmpty @Size(min = 1, max = 100) List<OneTimeProductCostDeleteGeneratedDto> body) {

        List<ErrorResponseDetail<OneTimeProductCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProductCostDeleteGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProductCost, OneTimeProductCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProductCost, OneTimeProductCostPrimaryKey>()
                        .setDeleteErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProductCostService.delete(deleteGeneratedDtoMapper.dtoToPK(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createDeleteResult(response, PATH, HttpStatus.NO_CONTENT);
        }

        return ResponseUtils.createDeleteResult(response, PATH, HttpStatus.NO_CONTENT);
    }

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse> get(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "filter", required = false) String filter,
            @Valid @RequestParam(value = "fields", required = false) String fields,
            @Valid @Pattern(regexp = "^(costLifecycleValues)$") @RequestParam(value = "expand", required =
                    false) String expand) {

        Pageable pageable = new OffsetPageable(skip, top, Sort.by(FILTER_PK.split(",")).ascending());

        List<OneTimeProductCostGeneratedDto> responseEntities =
                oneTimeProductCostMapper.entityToDto(oneTimeProductCostService.get(filter, fields, pageable));

        if (StringUtils.isNotBlank(expand)) {
            enhanceWithLifecycleValues(responseEntities);
        }

        PlcResponse response = new PlcResponse();
        response.setEntities(responseEntities);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProductCostPatchGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$")
                                @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProductCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProductCostPatchGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProductCost, OneTimeProductCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProductCost, OneTimeProductCostPrimaryKey>()
                        .setPatchErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProductCostService.patch(patchGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
    }

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProductCostCreateGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$")
                               @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProductCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProductCostCreateGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProductCost, OneTimeProductCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProductCost, OneTimeProductCostPrimaryKey>()
                        .setCreateErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProductCostService.create(createGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity update(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProductCostPutGeneratedDto> body,
                                 @Valid @Pattern(regexp = "^(ids|full)$")
                                 @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProductCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProductCostPutGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProductCost, OneTimeProductCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProductCost, OneTimeProductCostPrimaryKey>()
                        .setUpdateErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProductCostService.update(putGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProductCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
    }

    private void enhanceWithLifecycleValues(List<OneTimeProductCostGeneratedDto> responseEntities) {

        Set<Pair<Integer, Integer>> oneTimeCostIdAndProjectIds = responseEntities
                .stream()
                .map(product -> Pair.of(product.getOneTimeCostId(), product.getCalculationId()))
                .collect(Collectors.toSet());

        Map<OneTimeProductCostPrimaryKey, List<OneTimeCostLifecycleValue>> lifecycleCostsMap =
                oneTimeCostLifecycleValueService.findByOneTimeCostIdAndCalculationIdIn(oneTimeCostIdAndProjectIds);

        responseEntities.forEach(oneTimeProductCostGeneratedDto -> {

            List<OneTimeCostLifecycleValueGeneratedDto> lifecycleValueDtos = lifecycleValueDtoMapper.entityToDto(
                    lifecycleCostsMap
                            .get(new OneTimeProductCostPrimaryKey(oneTimeProductCostGeneratedDto.getOneTimeCostId(),
                                    oneTimeProductCostGeneratedDto.getCalculationId())));
            oneTimeProductCostGeneratedDto.setOneTimeCostLifecycleValues(lifecycleValueDtos);
        });

    }
}
