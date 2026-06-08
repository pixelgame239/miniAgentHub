// lib/api.ts
import { createClient } from "@hyper-fetch/core";

export const getToken = () => localStorage.getItem("accessToken") || null;
export const removeToken = () => localStorage.removeItem("accessToken");
export const setToken = (newToken:string) => localStorage.setItem("accessToken", newToken);
export type GlobalErrorType = {
  message: string;
  status: number;
};
const apiURL = import.meta.env.VITE_API_URL;
export const client = createClient<{ error: GlobalErrorType }>({ 
  url: apiURL,
}).onAuth((request)=>{
    const token = getToken();
    if(token){
        return request.setHeaders({
            ...request.headers, 'Authorization': `Bearer ${token}` 
        });
    }
    return request;
}).onError((error, request) => {
    // 3. Handle global errors (e.g., logging or 401 redirects)
    console.error(`[API Error] ${request.endpoint}:`, error);
    
    const isLoginRequest =
      request.endpoint.includes("/auth/login");

    if (error.status === 401 && !isLoginRequest) {
      removeToken();
      window.location.href = "/";
    }

    // You can return the error to propagate it or return null to 'swallow' it
    return error; 
  });