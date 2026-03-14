/**
 * api/estudiantes.ts
 * ==================
 * Capa de acceso a la API REST de Django.
 *
 * BUENA PRÁCTICA: todo el código de red vive aquí.
 * Los componentes y hooks NUNCA hacen peticiones directamente.
 * Si cambia la URL base o el formato de la API, solo se edita este archivo.
 *
 * Usa la instancia de Axios con interceptores JWT (axiosInstance.ts)
 * para agregar automáticamente el header Authorization.
 *
 * MANEJO DE ERRORES:
 *   - 400 → parsea el body JSON y lanza ApiError con errores por campo.
 *   - Otros errores → lanza ApiError con mensaje genérico.
 */

import api from "./axiosInstance";
import { createApiError, type Estudiante, type EstudiantePayload } from "@/types/estudiante";
import type { AxiosError } from "axios";

const ESTUDIANTES_URL = "/api/estudiante";

/** Extrae errores de campo de una respuesta Axios y lanza ApiError. */
function handleAxiosError(error: unknown): never {
    const axiosErr = error as AxiosError<Record<string, string[]>>;
    const status = axiosErr.response?.status ?? 500;
    const fieldErrors = axiosErr.response?.data ?? {};
    console.error(`[api] ${status} →`, fieldErrors);
    throw createApiError(fieldErrors, status);
}

/** Helper para empaquetar datos en FormData o JSON según corresponda. */
function buildPayload(data: EstudiantePayload): FormData | EstudiantePayload {
    const debeUsarFormData = !!data.archivo_foto || !!data.archivo_boleta;

    if (debeUsarFormData) {
        const formData = new FormData();
        formData.append("nombre", data.nombre);
        formData.append("matricula", data.matricula);
        formData.append("email", data.email);
        formData.append("edad", String(data.edad));
        formData.append("carrera", data.carrera);
        formData.append("promedio", String(data.promedio));

        if (data.archivo_foto) {
            formData.append("archivo_foto", data.archivo_foto);
        }
        if (data.archivo_boleta) {
            formData.append("archivo_boleta", data.archivo_boleta);
        }
        return formData;
    }

    return data;
}

/** GET /api/estudiante/ — lista todos los estudiantes. */
export async function getEstudiantes(): Promise<Estudiante[]> {
    try {
        const res = await api.get<Estudiante[]>(`${ESTUDIANTES_URL}/`);
        return res.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

/** POST /api/estudiante/ — crea un nuevo estudiante. */
export async function createEstudiante(data: EstudiantePayload): Promise<Estudiante> {
    try {
        const payload = buildPayload(data);
        const res = await api.post<Estudiante>(`${ESTUDIANTES_URL}/`, payload);
        return res.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

/** PUT /api/estudiante/{id}/ — actualiza un estudiante completo. */
export async function updateEstudiante(
    id: number,
    data: EstudiantePayload,
): Promise<Estudiante> {
    try {
        const payload = buildPayload(data);
        const res = await api.put<Estudiante>(`${ESTUDIANTES_URL}/${id}/`, payload);
        return res.data;
    } catch (error) {
        handleAxiosError(error);
    }
}

/** DELETE /api/estudiante/{id}/ — elimina un estudiante. */
export async function deleteEstudiante(id: number): Promise<void> {
    try {
        await api.delete(`${ESTUDIANTES_URL}/${id}/`);
    } catch (error) {
        handleAxiosError(error);
    }
}
