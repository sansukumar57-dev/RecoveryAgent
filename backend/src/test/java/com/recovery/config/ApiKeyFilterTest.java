package com.recovery.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ApiKeyFilterTest {

    private ApiKeyFilter filter() {
        ApiKeyFilter f = new ApiKeyFilter();
        ReflectionTestUtils.setField(f, "apiKey", "demo-api-key-123");
        return f;
    }

    @Test
    void rejectsApiRequestWithoutKey() throws Exception {
        ApiKeyFilter f = filter();
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/config/gateway");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        f.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void rejectsApiRequestWithWrongKey() throws Exception {
        ApiKeyFilter f = filter();
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/config/gateway");
        req.addHeader("X-API-Key", "wrong-key");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        f.doFilter(req, res, chain);

        assertEquals(401, res.getStatus());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    void allowsApiRequestWithValidKey() throws Exception {
        ApiKeyFilter f = filter();
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/config/gateway");
        req.addHeader("X-API-Key", "demo-api-key-123");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        f.doFilter(req, res, chain);

        assertEquals(200, res.getStatus());
        verify(chain).doFilter(any(), any());
    }

    @Test
    void doesNotRequireKeyForWebhooks() throws Exception {
        ApiKeyFilter f = filter();
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/webhooks/razorpay");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        f.doFilter(req, res, chain);

        verify(chain).doFilter(any(), any());
    }
}
