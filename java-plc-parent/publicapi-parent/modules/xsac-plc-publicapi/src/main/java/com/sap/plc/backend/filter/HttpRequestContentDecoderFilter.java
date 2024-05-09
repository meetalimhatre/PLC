package com.sap.plc.backend.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.plc.backend.exception.BadRequestException;
import com.sap.plc.backend.filter.util.InflaterServletInputStreamWrapper;
import com.sap.plc.backend.service.ThrowableProcessingService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.StringJoiner;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

import static java.text.MessageFormat.format;

@Component
public class HttpRequestContentDecoderFilter extends OncePerRequestFilter {

    private static final String CLIENT_PAYLOAD_CONTENT_ENCODING = "SAP-PLC-Content-Encoding";
    private static final String GZIP = "gzip";
    private static final String DEFLATE = "deflate";
    private static final String IDENTITY = "identity";
    private static final String SUPPORTED_ENCODINGS = new StringJoiner(", ", "[", "]")
            .add(GZIP)
            .add(DEFLATE)
            .add(IDENTITY)
            .toString();
    private static final String INVALID_ENCODING_MESSAGE_PATTERN =
            "Unsupported content encoding detected: ''{0}''. The supported encodings are: " +
                    SUPPORTED_ENCODINGS + ".";
    private static final Set<String> SUPPORTED_HTTP_VERB_SET = new HashSet<String>() {{
        add(HttpMethod.POST.name());
        add(HttpMethod.PUT.name());
        add(HttpMethod.PATCH.name());
        add(HttpMethod.DELETE.name());
    }};

    private Logger logger = LoggerFactory.getLogger(HttpRequestContentDecoderFilter.class);

    private ObjectMapper jacksonObjectMapper;
    private ThrowableProcessingService throwableProcessingService;

    @Autowired
    public HttpRequestContentDecoderFilter(ObjectMapper jacksonObjectMapper,
                                           ThrowableProcessingService throwableProcessingService) {
        this.jacksonObjectMapper = jacksonObjectMapper;
        this.throwableProcessingService = throwableProcessingService;
    }

    @Override
    public void destroy() {
        logger.debug("Destroyed filter: {}", getFilterName());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String contentEncoding = httpServletRequest.getHeader(CLIENT_PAYLOAD_CONTENT_ENCODING);
        if (StringUtils.isNotBlank(contentEncoding) &&
                SUPPORTED_HTTP_VERB_SET.contains(httpServletRequest.getMethod().toUpperCase())) {
            switch (contentEncoding) {
                case GZIP:
                    logger.debug("Filter {} - gzip content encoding detected", getFilterName());
                    httpServletRequest = new HttpServletRequestWrapper(httpServletRequest) {

                        @Override
                        public ServletInputStream getInputStream() throws IOException {
                            return new InflaterServletInputStreamWrapper(super.getInputStream(),
                                    new GZIPInputStream(super.getInputStream()));
                        }

                        @Override
                        public BufferedReader getReader() throws IOException {
                            return new BufferedReader(new InputStreamReader(getInputStream()));
                        }
                    };
                    break;
                case DEFLATE:
                    logger.debug("Filter {} - deflate content encoding detected", getFilterName());
                    httpServletRequest = new HttpServletRequestWrapper(httpServletRequest) {

                        @Override
                        public ServletInputStream getInputStream() throws IOException {
                            return new InflaterServletInputStreamWrapper(super.getInputStream(),
                                    new InflaterInputStream(super.getInputStream()));
                        }

                        @Override
                        public BufferedReader getReader() throws IOException {
                            return new BufferedReader(new InputStreamReader(getInputStream()));
                        }
                    };
                    break;
                case IDENTITY:
                    logger.debug("Filter {} - identity content encoding detected", getFilterName());
                    break;
                default:
                    String message = format(INVALID_ENCODING_MESSAGE_PATTERN, contentEncoding);
                    logger.debug(message);
                    throw new BadRequestException();
            }
        }
        filterChain.doFilter(httpServletRequest, httpServletResponse);
        logger.debug("Filter {} - after do filter", getFilterName());
    }
}
