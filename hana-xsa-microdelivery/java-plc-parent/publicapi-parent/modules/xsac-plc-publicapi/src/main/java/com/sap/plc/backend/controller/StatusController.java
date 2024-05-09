package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.StatusCreateGeneratedDto;
import com.sap.plc.backend.dto.StatusKeyAndTimestampGeneratedDto;
import com.sap.plc.backend.dto.StatusUpdateGeneratedDto;
import com.sap.plc.backend.mapper.StatusMappers;
import com.sap.plc.backend.service.masterdata.StatusService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
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
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = StatusController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class StatusController implements StatusGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.STATUS;
    private static final String FILTER_PK = "statusId,lastModifiedOn";

    @Resource
    private StatusService statusService;

    @Resource
    private StatusMappers.StatusGeneratedDtoMapper statusGeneratedDtoMapper;

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @RequestBody List<StatusCreateGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = "returnType", required =
                                       false) String returnType) {
        return createResult(statusService.create(body),
                statusGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }

    @Override
    @GetMapping
    public ResponseEntity get(@Valid @Min(1) @Max(10000) @RequestParam(value = "top", defaultValue = "1000", required =
            false) Integer top,
                              @Valid @Min(0) @RequestParam(value = "skip", defaultValue = "0", required = false)
                                      Integer skip,
                              @Valid @RequestParam(value = "language", required = false) String language,
                              @Valid @RequestParam(value = "filter", required = false) String filter,
                              @Valid @RequestParam(value = "fields", required = false) String fields,
                              @Valid @RequestParam(value = "expand", required = false) String expand) {
        return new ResponseEntity<>(
                statusService.getAllStatuses(top, skip, filter, fields, language, expand),
                HttpStatus.OK);
    }

    @Override
    @GetMapping(value = "/{statusId}")
    public ResponseEntity getById(@Valid @NotNull @PathVariable("statusId") String statusId,
                                  @Valid @RequestParam(value = "language", required = false) String language,
                                  @Valid @RequestParam(value = "fields", required = false) String fields,
                                  @Valid @RequestParam(value = "expand", required = false) String expand) {
        return new ResponseEntity<>(
                statusService.getStatusById(statusId, fields, language, expand),
                HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty @RequestBody List<StatusUpdateGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$") @RequestParam(value = "returnType", required
                                        = false) String returnType) {
        return createResult(statusService.patch(body),
                statusGeneratedDtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(@NotEmpty @RequestBody List<StatusKeyAndTimestampGeneratedDto> body) {
        return createDeleteResult(
                statusService.delete(body),
                PATH,
                HttpStatus.OK);
    }

}
