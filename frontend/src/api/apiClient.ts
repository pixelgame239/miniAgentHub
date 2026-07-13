// lib/api.ts
import { createClient } from "@hyper-fetch/core";

export type GlobalErrorType = {
  message: string;
  status: number;
};
const apiURL = import.meta.env.VITE_API_URL;
export const client = createClient<{ error: GlobalErrorType }>({ 
  url: apiURL,
}).onError(async (error, request) => {
    // 3. Handle global errors (e.g., logging or 401 redirects)
    console.error(`[API Error] ${request.endpoint}:`, error);
    
    const isLoginRequest =
      request.endpoint.includes("/auth/login");
    const isRefreshRequest =
      request.endpoint.includes("/auth/refresh");

    if (error.status === 401 && !isLoginRequest && !isRefreshRequest && error.data.errorCode === "TOKEN_EXPIRED") {
      try{
        const refreshRequest = client.createRequest<{}>()(
          {
                method:"POST",
                endpoint: "/auth/refresh",
                auth: true
            }
        )
        await refreshRequest.send();
        return await request.send(); // Retry the original request after refreshing the token
        } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            window.location.href = "/";
        }
    }
    if (error.status === 401 && !isLoginRequest) {
      window.location.href = "/";
    }
    // You can return the error to propagate it or return null to 'swallow' it
    return error; 
  });