package com.recovery.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    private RateLimitFilter filter(int apiLimit, int webhookLimit, long windowMs) {
        RateLimitFilter f = new RateLimitFilter();
        ReflectionTestUtils.setField(f, "enabled", true);
        ReflectionTestUtils.setField(f, "apiLimit", apiLimit);
        ReflectionTestUtils.setField(f, "webhookLimit", webhookLimit);
        ReflectionTestUtils.setField(f, "windowMs", windowMs);
        return f;
    }

    private MockHttpServletRequest req(String uri, String ip) {
        MockHttpServletRequest r = new MockHttpServletRequest("GET", uri);
        r.setRemoteAddr(ip);
        return r;
    }

    @Test
    void allowsRequestsUpToTheLimitThenReturns429() throws Exception {
        RateLimitFilter f = filter(3, 3, 60_000);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 1; i <= 3; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            f.doFilter(req("/api/dashboard", "1.1.1.1"), res, chain);
            assertEquals(200, res.getStatus(), "request " + i + " should pass");
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "1.1.1.1"), blocked, chain);

        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("rate_limited"));
        assertNotNull(blocked.getHeader("Retry-After"));
        verify(chain, times(3)).doFilter(any(), any());
    }

    @Test
    void setsRateLimitHeaders() throws Exception {
        RateLimitFilter f = filter(10, 10, 60_000);
        MockHttpServletResponse res = new MockHttpServletResponse();

        f.doFilter(req("/api/dashboard", "2.2.2.2"), res, mock(FilterChain.class));

        assertEquals("10", res.getHeader("X-RateLimit-Limit"));
        assertEquals("9", res.getHeader("X-RateLimit-Remaining"));
        assertNotNull(res.getHeader("X-RateLimit-Reset"));
    }

    @Test
    void countersAreIsolatedPerClientIp() throws Exception {
        RateLimitFilter f = filter(1, 1, 60_000);
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletResponse first = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "3.3.3.3"), first, chain);
        assertEquals(200, first.getStatus());

        // different IP gets its own budget
        MockHttpServletResponse other = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "4.4.4.4"), other, chain);
        assertEquals(200, other.getStatus());

        // original IP is now over budget
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "3.3.3.3"), blocked, chain);
        assertEquals(429, blocked.getStatus());
    }

    @Test
    void webhookAndApiBudgetsAreSeparate() throws Exception {
        RateLimitFilter f = filter(1, 1, 60_000);
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletResponse api = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "5.5.5.5"), api, chain);
        assertEquals(200, api.getStatus());

        // same IP, different bucket -> still allowed
        MockHttpServletResponse hook = new MockHttpServletResponse();
        f.doFilter(req("/webhooks/razorpay", "5.5.5.5"), hook, chain);
        assertEquals(200, hook.getStatus());
    }

    @Test
    void windowResetsAfterExpiry() throws Exception {
        RateLimitFilter f = filter(1, 1, 30); // 30ms window
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletResponse first = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "6.6.6.6"), first, chain);
        assertEquals(200, first.getStatus());

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "6.6.6.6"), blocked, chain);
        assertEquals(429, blocked.getStatus());

        Thread.sleep(50);

        MockHttpServletResponse afterReset = new MockHttpServletResponse();
        f.doFilter(req("/api/dashboard", "6.6.6.6"), afterReset, chain);
        assertEquals(200, afterReset.getStatus(), "a new window must restore the budget");
    }

    @Test
    void nonApiPathsAreNotRateLimited() throws Exception {
        RateLimitFilter f = filter(1, 1, 60_000);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            f.doFilter(req("/actuator/health", "7.7.7.7"), res, chain);
            assertEquals(200, res.getStatus());
        }
        verify(chain, times(5)).doFilter(any(), any());
    }

    @Test
    void usesForwardedForWhenBehindProxy() throws Exception {
        RateLimitFilter f = filter(1, 1, 60_000);
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest a = req("/api/dashboard", "10.0.0.1");
        a.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.1");
        MockHttpServletResponse resA = new MockHttpServletResponse();
        f.doFilter(a, resA, chain);
        assertEquals(200, resA.getStatus());

        // same proxy, different real client -> separate budget
        MockHttpServletRequest b = req("/api/dashboard", "10.0.0.1");
        b.addHeader("X-Forwarded-For", "203.0.113.9, 10.0.0.1");
        MockHttpServletResponse resB = new MockHttpServletResponse();
        f.doFilter(b, resB, chain);
        assertEquals(200, resB.getStatus());

        // repeat of the first real client -> limited
        MockHttpServletRequest c = req("/api/dashboard", "10.0.0.1");
        c.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.1");
        MockHttpServletResponse resC = new MockHttpServletResponse();
        f.doFilter(c, resC, chain);
        assertEquals(429, resC.getStatus());
    }

    @Test
    void disabledFilterLetsEverythingThrough() throws Exception {
        RateLimitFilter f = filter(1, 1, 60_000);
        ReflectionTestUtils.setField(f, "enabled", false);
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 4; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            f.doFilter(req("/api/dashboard", "8.8.8.8"), res, chain);
            assertEquals(200, res.getStatus());
        }
        verify(chain, times(4)).doFilter(any(), any());
    }
}
