package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.controller.utils.ResponseUtils;
import com.sap.plc.backend.dto.LifecycleQuantityGeneratedDto;
import com.sap.plc.backend.dto.LifecycleQuantityKeyGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.ErrorResponseDetail;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.dto.apiResponse.PlcResponseBuilder;
import com.sap.plc.backend.mapper.LifecycleQuantityMappers;
import com.sap.plc.backend.model.LifecycleQuantity;
import com.sap.plc.backend.model.pks.LifecycleQuantityPrimaryKey;
import com.sap.plc.backend.service.DtoListValidatorService;
import com.sap.plc.backend.service.LifecycleQuantityService;
import com.sap.plc.backend.util.OffsetPageable;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.LinkedList;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = LifecycleQuantityController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
public class LifecycleQuantityController implements LifecycleQuantityGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.LIFECYCLE_QUANTITIES;

    @Resource
    private LifecycleQuantityService service;

    @Resource
    private DtoListValidatorService dtoListValidatorService;

    @Resource
    private LifecycleQuantityMappers.LifecycleQuantityKeyGeneratedDtoMapper pkMapper;

    @Resource
    private LifecycleQuantityMappers.LifecycleQuantityGeneratedDtoMapper entityMapper;

    @Resource
    private LifecycleQuantityMappers.LifecycleQuantityWithAuditFieldsGeneratedDtoMapper entityWithAuditFieldsMapper;

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(@NotEmpty @RequestBody List<LifecycleQuantityKeyGeneratedDto> body) {

        List<ErrorResponseDetail<LifecycleQuantityPrimaryKey>> errorDetails = new LinkedList<>();

        List<LifecycleQuantityKeyGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<LifecycleQuantity, LifecycleQuantityPrimaryKey> response =
                new PlcResponseBuilder<LifecycleQuantity, LifecycleQuantityPrimaryKey>()
                        .setDeleteErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = service.delete(pkMapper.dtoToPK(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createDeleteResult(response, PATH, HttpStatus.NO_CONTENT);
        }

        return ResponseUtils.createDeleteResult(response, PATH, HttpStatus.NO_CONTENT);
    }

    @Override
    @GetMapping(path = "/{projectId}")
    public ResponseEntity get(@Valid @NotNull @PathVariable("projectId") String projectId,
                              @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false) Integer top,
                              @Valid @Min(0) @RequestParam(value = "skip", required = false) Integer skip,
                              @Valid @RequestParam(value = "filter", required = false) String filter,
                              @Valid @RequestParam(value = "fields", required = false) String fields) {

        Pageable pageable =
                new OffsetPageable(skip, top,
                        Sort.by("projectId", "calculationId", "lifecyclePeriodFrom").ascending());

        PlcResponse response = new PlcResponse();
        response.setEntities(entityWithAuditFieldsMapper.entityToDto(service.get(projectId, filter, fields, pageable)));

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty @RequestBody List<LifecycleQuantityGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$")
                                @RequestParam(value = "returnType", required = false) String returnType) {

        List<ErrorResponseDetail<LifecycleQuantityPrimaryKey>> errorDetails = new LinkedList<>();

        List<LifecycleQuantityGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<LifecycleQuantity, LifecycleQuantityPrimaryKey> response =
                new PlcResponseBuilder<LifecycleQuantity, LifecycleQuantityPrimaryKey>()
                        .setPatchErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = service.patch(entityMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, entityWithAuditFieldsMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK,
                    "calculationId,projectId,lifecyclePeriodFrom");
        }

        return ResponseUtils.createResult(response, entityWithAuditFieldsMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK,
                "calculationId,projectId,lifecyclePeriodFrom");
    }

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @RequestBody List<LifecycleQuantityGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$")
                               @RequestParam(value = "returnType", required = false) String returnType) {

        List<ErrorResponseDetail<LifecycleQuantityPrimaryKey>> errorDetails = new LinkedList<>();

        List<LifecycleQuantityGeneratedDto> validDtos =
                dtoListValidatorService.validateDtoConstraints(body, errorDetails);

        PlcResponse<LifecycleQuantity, LifecycleQuantityPrimaryKey> response =
                new PlcResponseBuilder<LifecycleQuantity, LifecycleQuantityPrimaryKey>()
                        .setCreateErrorDetails(errorDetails).build();

        if (!validDtos.isEmpty()) {

            response = service.create(entityMapper.dtoToEntity(validDtos));

            if (response.getErrorResponse() != null) {
                response.getErrorResponse().addAllErrorDetails(errorDetails);
            }

            return ResponseUtils.createResult(response, entityWithAuditFieldsMapper, PATH,
                    FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED,
                    "calculationId,projectId,lifecyclePeriodFrom");
        }

        return ResponseUtils.createResult(response, entityWithAuditFieldsMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED,
                "calculationId,projectId,lifecyclePeriodFrom");
    }
}
