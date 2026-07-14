// lib/api.ts
import { createClient } from "@hyper-fetch/core";

export type GlobalErrorType = {
  message: string;
  status: number;
  errorCode?: string;
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

    if (error.status === 401 && !isLoginRequest && !isRefreshRequest && error.error&& error.error.errorCode === "TOKEN_EXPIRED") {
      try{
        console.log("Expired token detected. Attempting to refresh...");
        const refreshRequest = client.createRequest<{}>()(
          {
                method:"POST",
                endpoint: "/auth/refresh",
                options:{
                  credentials: "include"
                }
            }
        )
        await refreshRequest.send();
        console.log("Token refreshed successfully. Retrying the original request...");
        return await request.send(); // Retry the original request after refreshing the token
        } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            window.location.href = "/";
        }
    }
    if (error.status === 401 && !isLoginRequest) {
      console.log("Unauthorized access detected. Redirecting to login...");
      window.location.href = "/";
    }
    // You can return the error to propagate it or return null to 'swallow' it
    return error; 
  });