/**
 * lib/validaciones.ts
 * ====================
 * Schema Zod que espeja las reglas de validación del backend Django.
 *
 * BUENA PRÁCTICA — Por qué validar en el cliente si el servidor ya valida?
 *   1. Feedback INMEDIATO al usuario sin hacer un round-trip HTTP.
 *   2. Evita enviar peticiones que sabemos de antemano que fallarán.
 *   3. El SERVIDOR sigue siendo la fuente de verdad (segunda línea de defensa).
 *
 * IMPORTANTE: estas reglas deben mantenerse sincronizadas con:
 *   - estudiante/validators.py
 *   - estudiante/serializers.py (método validate())
 */

import { z } from "zod";

// Mirrors de los regex en validators.py
const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

/**
 * Espejo de validar_formato_matricula()
 * Formato: opcional una letra mayúscula, 4-5 dígitos, 2 letras minúsculas, 3+ dígitos.
 * Ejemplos válidos: "20233tn132", "I20233tn132"
 */
const MATRICULA_REGEX = /^[A-Z]?\d{4,5}[a-z]{2}\d{3,}$/;

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const estudianteSchema = z
    .object({
        nombre: z
            .string()
            .min(3, "El campo nombre debe tener al menos 3 caracteres.")
            .regex(SOLO_LETRAS, "El campo nombre solo puede contener letras y espacios."),

        matricula: z
            .string()
            .min(1, "La matrícula es requerida.")
            .regex(MATRICULA_REGEX, 'Formato inválido. Ejemplos válidos: "20233tn132", "I20233tn132".'),

        email: z
            .string()
            .min(1, "El correo electrónico es requerido.")
            .email("Debe ser un correo electrónico válido."),

        edad: z
            .number({ error: "La edad debe ser un número." })
            .int("La edad debe ser un número entero.")
            .min(6, "La edad debe estar entre 6 y 100 años.")
            .max(100, "La edad debe estar entre 6 y 100 años."),

        carrera: z
            .string()
            .min(3, "El campo carrera debe tener al menos 3 caracteres.")
            .regex(SOLO_LETRAS, "El campo carrera solo puede contener letras y espacios."),

        promedio: z
            .number({ error: "El promedio debe ser un número." })
            .min(0, "El promedio debe estar entre 0.0 y 10.0.")
            .max(10, "El promedio debe estar entre 0.0 y 10.0."),

        archivo_foto: z.any().optional(),

        archivo_boleta: z
            .instanceof(File)
            .refine(
                (file) => file.size <= MAX_FILE_SIZE_BYTES,
                `La boleta no puede exceder los ${MAX_FILE_SIZE_MB}MB.`,
            )
            .refine(
                (file) => file.type === "application/pdf",
                "La boleta debe ser un archivo PDF.",
            )
            .optional()
            .nullable(),
    })
    // Validaciones cruzadas — espejo del validate() del serializer DRF
    .superRefine((data, ctx) => {
        const carrera = data.carrera.trim().toLowerCase();

        if (carrera === "medicina" && data.edad < 18) {
            ctx.addIssue({
                code: "custom",
                path: ["edad"],
                message: "Para Medicina se requiere al menos 18 años.",
            });
        }

        if (carrera === "ingenieria" && data.promedio < 7.0) {
            ctx.addIssue({
                code: "custom",
                path: ["promedio"],
                message: "Para Ingeniería se requiere un promedio mínimo de 7.0.",
            });
        }
    });

/** Tipo inferido del schema — equivale al EstudiantePayload */
export type EstudianteFormData = z.infer<typeof estudianteSchema>;
