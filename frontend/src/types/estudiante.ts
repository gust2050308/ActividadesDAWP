/**
 * types/estudiante.ts
 * ===================
 * Definiciones de tipos TypeScript para el dominio Estudiante.
 *
 * BUENA PRÁCTICA: centralizar los tipos del dominio en un solo lugar
 * evita inconsistencias entre componentes y hace los refactors más fáciles.
 */

/** Estudiante tal como lo devuelve la API (incluye `id`). */
export interface Estudiante {
    id: number;
    nombre: string;
    matricula: string;
    email: string;
    edad: number;
    carrera: string;
    promedio: number;
    foto_perfil?: string | null;
    boleta_pdf?: string | null;
}

/** Payload para crear o editar (sin `id` ni las URLs de solo lectura). */
export type EstudiantePayload = Omit<Estudiante, "id" | "foto_perfil" | "boleta_pdf"> & {
    archivo_foto?: File | null;
    archivo_boleta?: File | null;
};

/**
 * Estructura de errores que devuelve DRF en respuestas 400.
 * Puede ser errores por campo: { nombre: ["msg..."] }
 * o errores generales de validación cruzada: { non_field_errors: ["msg..."] }
 */
export type ApiFieldErrors = Partial<
    Record<keyof EstudiantePayload | "non_field_errors", string[]>
>;

/** Error que lanza la capa API cuando el servidor devuelve 4xx/5xx. */
export interface ApiError {
    name: "ApiError";
    fieldErrors: ApiFieldErrors;
    status: number;
}

export function createApiError(fieldErrors: ApiFieldErrors, status: number): ApiError {
    return { name: "ApiError", fieldErrors, status };
}

export function isApiError(err: unknown): err is ApiError {
    return (
        typeof err === "object" &&
        err !== null &&
        (err as ApiError).name === "ApiError"
    );
}
