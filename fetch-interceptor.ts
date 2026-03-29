// Intercept all fetch requests to inject the authorization token
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = localStorage.getItem("dimeprivy_token");
    
    if (token) {
      const headers = new Headers(init?.headers);
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      init = {
        ...init,
        headers,
      };
    }

    const response = await originalFetch(input, init);
    
    // Auto-logout on 401
    if (response.status === 401) {
      const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
      // Don't loop on login/me routes
      if (!path.includes('/auth/login') && !path.includes('/auth/me')) {
        localStorage.removeItem("dimeprivy_token");
        localStorage.removeItem("dimeprivy_user");
        window.dispatchEvent(new Event("dimeprivy:unauthorized"));
      }
    }
    
    return response;
  };
}
