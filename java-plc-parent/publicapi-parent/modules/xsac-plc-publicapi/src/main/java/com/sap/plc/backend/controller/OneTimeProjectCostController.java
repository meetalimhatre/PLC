package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.controller.utils.ResponseUtils;
import com.sap.plc.backend.dto.OneTimeCostLifecycleValueGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostCreateGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostPatchGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostProjectIdGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostPutGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.ErrorResponse;
import com.sap.plc.backend.dto.apiResponse.ErrorResponseDetail;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponseBuilder;
import com.sap.plc.backend.dto.apiResponse.SuccessResponse;
import com.sap.plc.backend.mapper.OneTimeCostLifecycleValueMappers;
import com.sap.plc.backend.mapper.OneTimeProductCostMappers;
import com.sap.plc.backend.mapper.OneTimeProjectCostMappers;
import com.sap.plc.backend.model.OneTimeCostLifecycleValue;
import com.sap.plc.backend.model.OneTimeProductCost;
import com.sap.plc.backend.model.OneTimeProjectCost;
import com.sap.plc.backend.model.pks.OneTimeProductCostPrimaryKey;
import com.sap.plc.backend.model.pks.OneTimeProjectCostPrimaryKey;
import com.sap.plc.backend.service.DtoListValidatorService;
import com.sap.plc.backend.service.OneTimeCostLifecycleValueService;
import com.sap.plc.backend.service.OneTimeProductCostService;
import com.sap.plc.backend.service.OneTimeProjectCostService;
import com.sap.plc.backend.util.OffsetPageable;
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
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.sap.plc.backend.api.PublicAPI.CALCULATE;
import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = OneTimeProjectCostController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class OneTimeProjectCostController implements OneTimeProjectCostGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ONE_TIME_PROJECT_COSTS;
    public static final String CALCULATE_PATH = PublicAPI.API_BASE + "/" + PublicAPI.ONE_TIME_PROJECT_COSTS +
            "/" + CALCULATE;

    private static final String FILTER_PK = "oneTimeCostId";

    private final OneTimeProjectCostService oneTimeProjectCostService;

    private final OneTimeProductCostService oneTimeProductCostService;

    private final OneTimeCostLifecycleValueService oneTimeCostLifecycleValueService;

    private final DtoListValidatorService dtoListValidatorService;

    private final OneTimeProjectCostMappers.OneTimeProjectCostGeneratedDtoMapper oneTimeProjectCostMapper;

    private final OneTimeProjectCostMappers.OneTimeProjectCostPatchGeneratedDtoMapper patchGeneratedDtoMapper;

    private final OneTimeProjectCostMappers.OneTimeProjectCostCreateGeneratedDtoMapper createGeneratedDtoMapper;

    private final OneTimeProjectCostMappers.OneTimeProjectCostPutGeneratedDtoMapper putGeneratedDtoMapper;

    private final OneTimeProductCostMappers.OneTimeProductCostGeneratedDtoMapper oneTimeProductCostMapper;

    private final OneTimeCostLifecycleValueMappers.OneTimeCostLifecycleValueGeneratedDtoMapper lifecycleValueDtoMapper;

    public OneTimeProjectCostController(OneTimeProjectCostService oneTimeProjectCostService,
                                        OneTimeProductCostService oneTimeProductCostService,
                                        OneTimeCostLifecycleValueService oneTimeCostLifecycleValueService,
                                        DtoListValidatorService dtoListValidatorService,
                                        OneTimeProjectCostMappers.OneTimeProjectCostGeneratedDtoMapper oneTimeProjectCostMapper,
                                        OneTimeProjectCostMappers.OneTimeProjectCostPatchGeneratedDtoMapper patchGeneratedDtoMapper,
                                        OneTimeProjectCostMappers.OneTimeProjectCostCreateGeneratedDtoMapper createGeneratedDtoMapper,
                                        OneTimeProjectCostMappers.OneTimeProjectCostPutGeneratedDtoMapper putGeneratedDtoMapper,
                                        OneTimeProductCostMappers.OneTimeProductCostGeneratedDtoMapper oneTimeProductCostMapper,
                                        OneTimeCostLifecycleValueMappers.OneTimeCostLifecycleValueGeneratedDtoMapper lifecycleValueDtoMapper) {
        this.oneTimeProjectCostService = oneTimeProjectCostService;
        this.oneTimeProductCostService = oneTimeProductCostService;
        this.oneTimeCostLifecycleValueService = oneTimeCostLifecycleValueService;
        this.dtoListValidatorService = dtoListValidatorService;
        this.oneTimeProjectCostMapper = oneTimeProjectCostMapper;
        this.patchGeneratedDtoMapper = patchGeneratedDtoMapper;
        this.createGeneratedDtoMapper = createGeneratedDtoMapper;
        this.putGeneratedDtoMapper = putGeneratedDtoMapper;
        this.oneTimeProductCostMapper = oneTimeProductCostMapper;
        this.lifecycleValueDtoMapper = lifecycleValueDtoMapper;
    }

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(
            @NotEmpty @Size(min = 1, max = 100) List<OneTimeProjectCostDeleteGeneratedDto> body) {

        List<ErrorResponseDetail<OneTimeProjectCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProjectCostDeleteGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProjectCost, OneTimeProjectCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProjectCost, OneTimeProjectCostPrimaryKey>()
                        .setDeleteErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            List<Integer> oneTimeCostIds =
                    validDtos.stream().map(OneTimeProjectCostDeleteGeneratedDto::getOneTimeCostId)
                             .collect(Collectors.toList());

            response = oneTimeProjectCostService.delete(oneTimeCostIds);

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
            @Valid @Pattern(regexp = "^(productCosts|costLifecycleValues)$") @RequestParam(value = "expand", required =
                    false) String expand) {

        Pageable pageable = new OffsetPageable(skip, top, Sort.by(FILTER_PK).ascending());

        List<OneTimeProjectCostGeneratedDto> responseEntities =
                oneTimeProjectCostMapper.entityToDto(oneTimeProjectCostService.get(filter, fields, pageable));

        if ("productCosts".equals(expand)) {
            enhanceWithOneTimeProductCosts(responseEntities);
        } else if ("costLifecycleValues".equals(expand)) {
            enhanceWithOneTimeProductCosts(responseEntities);
            enhanceWithLifecycleValues(responseEntities);
        }

        PlcResponse response = new PlcResponse();
        response.setEntities(responseEntities);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProjectCostPatchGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$")
                                @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProjectCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProjectCostPatchGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProjectCost, OneTimeProjectCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProjectCost, OneTimeProjectCostPrimaryKey>()
                        .setPatchErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProjectCostService.patch(patchGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
    }

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProjectCostCreateGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$")
                               @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProjectCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProjectCostCreateGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProjectCost, OneTimeProjectCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProjectCost, OneTimeProjectCostPrimaryKey>()
                        .setCreateErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {
            response = oneTimeProjectCostService.create(createGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity update(@NotEmpty @Size(min = 1, max = 100) List<OneTimeProjectCostPutGeneratedDto> body,
                                 @Valid @Pattern(regexp = "^(ids|full)$")
                                 @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        List<ErrorResponseDetail<OneTimeProjectCostPrimaryKey>> errorDetails = new LinkedList<>();

        List<OneTimeProjectCostPutGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProjectCost, OneTimeProjectCostPrimaryKey> response =
                new PlcResponseBuilder<OneTimeProjectCost, OneTimeProjectCostPrimaryKey>()
                        .setUpdateErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = oneTimeProjectCostService.update(putGeneratedDtoMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
        }

        return ResponseUtils.createResult(response, oneTimeProjectCostMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, FILTER_PK);
    }

    @Override
    @PostMapping(path = "/" + CALCULATE)
    public ResponseEntity<PlcResponse<OneTimeProjectCostProjectIdGeneratedDto, OneTimeProjectCostProjectIdGeneratedDto>> calculate(
            @NotEmpty @Size(min = 1, max = 10) List<OneTimeProjectCostProjectIdGeneratedDto> body) {
        List<ErrorResponseDetail<OneTimeProjectCostProjectIdGeneratedDto>> errorDetails = new LinkedList<>();

        List<OneTimeProjectCostProjectIdGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<OneTimeProjectCostProjectIdGeneratedDto, OneTimeProjectCostProjectIdGeneratedDto> response =
                new PlcResponse<>();

        List<String> projectIdList = validDtos
                .stream()
                .map(OneTimeProjectCostProjectIdGeneratedDto::getProjectId)
                .collect(Collectors.toList());
        List<OneTimeProjectCostProjectIdGeneratedDto> calculateResult =
                oneTimeProjectCostService.calculate(projectIdList, errorDetails);
        if (!calculateResult.isEmpty()) {
            SuccessResponse<OneTimeProjectCostProjectIdGeneratedDto> successResponse = new SuccessResponse<>();
            successResponse.setEntities(calculateResult);
            response.setSuccessResponse(successResponse);
        }
        if (!errorDetails.isEmpty()) {
            ErrorResponse<OneTimeProjectCostProjectIdGeneratedDto> errorResponse = new ErrorResponse<>();
            errorResponse.setErrorDetails(errorDetails);
            errorResponse.setTarget(CALCULATE_PATH);
            response.setErrorResponse(errorResponse);
        }

        return new ResponseEntity(response, HttpStatus.OK);
    }

    private void enhanceWithOneTimeProductCosts(List<OneTimeProjectCostGeneratedDto> responseEntities) {

        Map<Integer, String> oneTimeCostIdAndProjectIds = responseEntities.stream().collect(Collectors
                .toMap(OneTimeProjectCostGeneratedDto::getOneTimeCostId, OneTimeProjectCostGeneratedDto::getProjectId));

        Map<Integer, List<OneTimeProductCost>> oneTimeProductCosts =
                oneTimeProductCostService.findByOneTimeCostIdAndProjectIdIn(oneTimeCostIdAndProjectIds);

        responseEntities.forEach(oneTimeProjectCostGeneratedDto -> {

            List<OneTimeProductCostGeneratedDto> productDtos = oneTimeProductCostMapper
                    .entityToDto(oneTimeProductCosts.get(oneTimeProjectCostGeneratedDto.getOneTimeCostId()));
            oneTimeProjectCostGeneratedDto.setOneTimeProductCosts(productDtos);
        });
    }

    private void enhanceWithLifecycleValues(List<OneTimeProjectCostGeneratedDto> responseEntities) {

        Set<Pair<Integer, Integer>> oneTimeCostIdAndProjectIds = responseEntities
                .stream()
                .map(OneTimeProjectCostGeneratedDto::getOneTimeProductCosts)
                .flatMap(Collection::stream)
                .map(product -> Pair.of(product.getOneTimeCostId(),
                        product.getCalculationId()))
                .collect(Collectors.toSet());

        Map<OneTimeProductCostPrimaryKey, List<OneTimeCostLifecycleValue>> lifecycleCostsMap =
                oneTimeCostLifecycleValueService.findByOneTimeCostIdAndCalculationIdIn(oneTimeCostIdAndProjectIds);

        responseEntities.forEach(oneTimeProjectCostGeneratedDto -> {
            oneTimeProjectCostGeneratedDto.getOneTimeProductCosts().forEach(oneTimeProductCostGeneratedDto -> {

                List<OneTimeCostLifecycleValueGeneratedDto> lifecycleValueDtos = lifecycleValueDtoMapper.entityToDto(
                        lifecycleCostsMap
                                .get(new OneTimeProductCostPrimaryKey(oneTimeProductCostGeneratedDto.getOneTimeCostId(),
                                        oneTimeProductCostGeneratedDto.getCalculationId())));
                oneTimeProductCostGeneratedDto.setOneTimeCostLifecycleValues(lifecycleValueDtos);
            });
        });
    }
}
