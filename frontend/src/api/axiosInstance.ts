/**
 * api/axiosInstance.ts
 * ====================
 * Instancia de Axios con interceptores para JWT.
 *
 * - Interceptor de solicitud: agrega el header Authorization automáticamente.
 * - Interceptor de respuesta: ante un 401, intenta refrescar el access token
 *   usando el refresh token y reintenta la petición original.
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const api = axios.create({
    baseURL: API_BASE,
});

// Interceptor de Solicitud — agrega el token si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Interceptor de Respuesta — maneja 401 y refresca el token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) throw new Error("No refresh token");

                // Usamos axios global para no disparar este mismo interceptor
                const response = await axios.post(
                    `${API_BASE}/api/token/refresh/`,
                    { refresh: refreshToken },
                );

                localStorage.setItem("access_token", response.data.access);
                if (response.data.refresh) {
                    localStorage.setItem("refresh_token", response.data.refresh);
                }

                originalRequest.headers["Authorization"] =
                    `Bearer ${response.data.access}`;
                return api(originalRequest);
            } catch {
                // Si el refresh token también expiró, limpiar y redirigir al login
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    },
);

export default api;
