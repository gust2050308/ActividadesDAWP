/**
 * api/auth.ts
 * ===========
 * Funciones de autenticación (login, registro).
 *
 * Usa axios PURO (no la instancia con interceptores) para evitar que
 * un 401 por credenciales incorrectas dispare el interceptor de refresh.
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface LoginResponse {
    access: string;
    refresh: string;
}

interface RegistroPayload {
    email: string;
    nombre_completo: string;
    password: string;
    telefono?: string;
}

/** POST /api/login/ — obtiene access y refresh tokens. */
export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_BASE}/api/login/`, {
        email,
        password,
    });
    return response.data;
}

/** POST /api/registro/ — registra un nuevo usuario. */
export async function registro(data: RegistroPayload): Promise<void> {
    await axios.post(`${API_BASE}/api/registro/`, data);
}
