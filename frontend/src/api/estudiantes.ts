/**
 * api/estudiantes.ts
 * ==================
 * Capa de acceso a la API REST de Django.
 *
 * BUENA PRÁCTICA: todo el código de `fetch` vive aquí.
 * Los componentes y hooks NUNCA hacen fetch directamente.
 * Si cambia la URL base o el formato de la API, solo se edita este archivo.
 *
 * MANEJO DE ERRORES:
 *   - 400 → parsea el body JSON y lanza ApiError con errores por campo.
 *   - Otros errores → lanza ApiError con mensaje genérico.
 */

import { createApiError, type Estudiante, type EstudiantePayload } from "@/types/estudiante";


// NOTA: En Vite las variables de .env deben tener prefijo VITE_ para ser accesibles.
const BASE_URL: string = import.meta.env.VITE_API_URL ?? "";
if (!BASE_URL) {
    console.error(
        "[api] VITE_API_URL no está definida en .env. " +
        "Todas las peticiones fallarán."
    );
}

/** Headers comunes para todas las peticiones. */
const JSON_HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

/** Parsea la respuesta y lanza ApiError si el status es 4xx/5xx. */
async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        // 204 No Content (DELETE exitoso) no tiene body
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
    }

    // Error del servidor — intentamos parsear errores de campo DRF
    let fieldErrors: Record<string, string[]> = {};
    try {
        fieldErrors = await res.json();
    } catch {
        // Si el body no es JSON válido, dejamos errores vacíos
    }

    // Incluimos status y texto HTTP para facilitar la depuración
    const statusText = res.statusText || `HTTP ${res.status}`;
    console.error(`[api] ${res.status} ${statusText} →`, res.url, fieldErrors);

    throw createApiError(fieldErrors, res.status);
}

/** GET /api/estudiante/ — lista todos los estudiantes. */
export async function getEstudiantes(): Promise<Estudiante[]> {
    const res = await fetch(`${BASE_URL}/`, { headers: JSON_HEADERS });
    return handleResponse<Estudiante[]>(res);
}

/** Helper genérico para empaquetar datos en FormData o JSON según corresponda. */
function buildBodyAndHeaders(data: EstudiantePayload): { body: BodyInit; headers: HeadersInit } {
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

        return {
            body: formData,
            headers: { Accept: "application/json" }, // El navegador asume multipart/form-data
        };
    }

    // Fallback JSON simple sin archivos
    return {
        body: JSON.stringify(data),
        headers: JSON_HEADERS,
    };
}

/** POST /api/estudiante/ — crea un nuevo estudiante. */
export async function createEstudiante(data: EstudiantePayload): Promise<Estudiante> {
    const { body, headers } = buildBodyAndHeaders(data);

    const res = await fetch(`${BASE_URL}/`, {
        method: "POST",
        headers,
        body,
    });

    return handleResponse<Estudiante>(res);
}

/** PUT /api/estudiante/{id}/ — actualiza un estudiante completo. */
export async function updateEstudiante(
    id: number,
    data: EstudiantePayload
): Promise<Estudiante> {
    const { body, headers } = buildBodyAndHeaders(data);

    const res = await fetch(`${BASE_URL}/${id}/`, {
        method: "PUT",
        headers,
        body,
    });
    return handleResponse<Estudiante>(res);
}

/** DELETE /api/estudiante/{id}/ — elimina un estudiante. */
export async function deleteEstudiante(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}/`, {
        method: "DELETE",
        headers: JSON_HEADERS,
    });
    return handleResponse<void>(res);
}
