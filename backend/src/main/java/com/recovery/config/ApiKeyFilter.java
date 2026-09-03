package com.recovery.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class ApiKeyFilter implements Filter {

    @Value("${app.api-key:demo-api-key-123}")
    private String apiKey;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String uri = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }
        if (uri.startsWith("/api/")) {
            String provided = request.getHeader("X-API-Key");
            byte[] expectedBytes = apiKey.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            byte[] providedBytes = provided != null ? provided.getBytes(java.nio.charset.StandardCharsets.UTF_8) : new byte[0];
            if (provided == null || !java.security.MessageDigest.isEqual(expectedBytes, providedBytes)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":\"unauthorized\",\"error\":\"Missing or invalid API key\"}");
                return;
            }
        }
        chain.doFilter(req, res);
    }
}
