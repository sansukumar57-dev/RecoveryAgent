package com.recovery.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window rate limiter for /api/** and /webhooks/**.
 *
 * Runs before {@link ApiKeyFilter} so a flood of unauthenticated requests is
 * rejected before doing any key comparison or DB work. Keyed by client IP +
 * path prefix. Deliberately in-memory: single-instance demo deployment. For a
 * multi-instance rollout move the counters to Redis.
 */
@Component
@Order(0)
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Value("${security.rate-limit.enabled:true}")
    private boolean enabled;

    /** Max requests per window for /api/** */
    @Value("${security.rate-limit.api-requests-per-minute:300}")
    private int apiLimit;

    /** Max requests per window for /webhooks/** (tighter — unauthenticated surface) */
    @Value("${security.rate-limit.webhook-requests-per-minute:60}")
    private int webhookLimit;

    @Value("${security.rate-limit.window-ms:60000}")
    private long windowMs;

    private static class Window {
        final long startMs;
        final AtomicInteger count = new AtomicInteger();

        Window(long startMs) {
            this.startMs = startMs;
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String uri = request.getRequestURI();
        int limit = limitFor(uri);

        if (!enabled || limit <= 0) {
            chain.doFilter(req, res);
            return;
        }

        String bucket = clientIp(request) + "|" + (uri.startsWith("/webhooks/") ? "webhooks" : "api");
        long now = System.currentTimeMillis();

        Window window = windows.compute(bucket, (k, existing) ->
                (existing == null || now - existing.startMs >= windowMs) ? new Window(now) : existing);

        int used = window.count.incrementAndGet();
        long resetInSec = Math.max(0, (window.startMs + windowMs - now) / 1000);

        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - used)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(resetInSec));

        if (used > limit) {
            log.warn("Rate limit exceeded for {} on {} ({}/{})", bucket, uri, used, limit);
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(resetInSec));
            response.getWriter().write("{\"status\":\"rate_limited\",\"error\":\"Too many requests\",\"retryAfterSeconds\":"
                    + resetInSec + "}");
            return;
        }

        // Opportunistic cleanup so the map cannot grow without bound.
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().startMs >= windowMs);
        }

        chain.doFilter(req, res);
    }

    private int limitFor(String uri) {
        if (uri.startsWith("/webhooks/")) return webhookLimit;
        if (uri.startsWith("/api/")) return apiLimit;
        return 0; // not rate limited
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String ip = request.getRemoteAddr();
        return ip != null ? ip : "unknown";
    }
}
