package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.controller.utils.ResponseUtils;
import com.sap.plc.backend.dto.ActivityPriceCreateGeneratedDto;
import com.sap.plc.backend.dto.ActivityPriceKeyGeneratedDto;
import com.sap.plc.backend.dto.ActivityPricePatchGeneratedDto;
import com.sap.plc.backend.dto.ActivityPriceUpsertGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.mapper.ActivityPriceMappers;
import com.sap.plc.backend.service.masterdata.ActivityPriceService;
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
import org.springframework.web.bind.annotation.PutMapping;
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
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;
import static com.sap.plc.backend.controller.ActivityPriceController.PATH;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class ActivityPriceController implements ActivityPriceGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.ACTIVITY_PRICES;

    private static final String FILTER_PK = "priceId,validFrom";

    @Resource
    private ActivityPriceService activityPriceService;

    @Resource
    private ActivityPriceMappers.ActivityPriceGeneratedDtoMapper mapper;

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse> get(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "filter", required = false) String filter,
            @Valid @RequestParam(value = "fields", required = false) String fields,
            @Valid @RequestParam(value = "validAt", required = false) String validAt,
            @Valid @RequestParam(value = "expand", required = false) String expand) {

        return new ResponseEntity<>(
                activityPriceService.getAllActivityPricesUsingFilterCFText(top, skip, filter, fields, expand, validAt),
                HttpStatus.OK);
    }

    @Override
    @GetMapping(value = "/{priceId}/{validFrom}")
    public ResponseEntity<PlcResponse> getById(@Valid @NotNull @PathVariable("priceId") String priceId,
                                               @Valid @NotNull @PathVariable("validFrom") String validFrom,
                                               @Valid @RequestParam(value = "fields", required = false) String fields,
                                               @Valid @RequestParam(value = "expand", required = false) String expand) {

        return new ResponseEntity<>(
                activityPriceService.getActivityPriceById(priceId, validFrom, fields, expand), HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity<?> patch(
            @NotEmpty @Size(min = 1, max = 20000) @RequestBody List<ActivityPricePatchGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$")
            @RequestParam(value = RETURN_TYPE, required = false) String returnType) {
        return ResponseUtils.createResult(
                activityPriceService.patch(body),
                mapper,
                PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK, FILTER_PK);
    }

    @Override
    @PostMapping
    public ResponseEntity<?> post(
            @NotEmpty @Size(min = 1, max = 20000) @RequestBody List<ActivityPriceCreateGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$")
            @RequestParam(value = RETURN_TYPE, required = false) String returnType) {

        return ResponseUtils.createResult(activityPriceService.create(body), mapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, FILTER_PK);
    }

    @Override
    @PutMapping("/upsert")
    public ResponseEntity upsert(
            @NotEmpty @Size(min = 1, max = 20000) @RequestBody List<ActivityPriceUpsertGeneratedDto> body,
            @Valid @Pattern(regexp = "^(ids|full)$")
            @RequestParam(value = "returnType", required = false) String returnType) {
        return ResponseUtils.createResult(
                activityPriceService.upsert(body),
                mapper,
                PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK, FILTER_PK);
    }

    @Override
    @DeleteMapping
    public ResponseEntity<?> deleteAll(
            @NotEmpty @Size(min = 1, max = 20000) @RequestBody List<ActivityPriceKeyGeneratedDto> body) {
        return ResponseUtils.createDeleteResult(
                activityPriceService.delete(body),
                PATH,
                HttpStatus.OK);
    }
}