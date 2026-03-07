/**
 * hooks/useEstudiantes.ts
 * ========================
 * Custom hook que encapsula todo el estado y las operaciones CRUD.
 *
 * BUENA PRÁCTICA:
 *   Los componentes SOLO interactúan con este hook.
 *   No saben nada de fetch, URLs ni manejo de errores HTTP.
 *   Esto hace que los componentes sean simples y puros (solo UI).
 *
 * PATRÓN:
 *   useEffect → cargar lista al montar
 *   useState  → estudiantes, loading, error
 *   funciones → crear, actualizar, eliminar (actualizan estado optimistamente)
 */

import { useState, useEffect, useCallback } from "react";
import {
    getEstudiantes,
    createEstudiante,
    updateEstudiante,
    deleteEstudiante,
} from "@/api/estudiantes";
import { isApiError, type Estudiante, type EstudiantePayload } from "@/types/estudiante";

interface UseEstudiantesReturn {
    estudiantes: Estudiante[];
    loading: boolean;
    /** Error general (red o servidor), distinto de errores de validación por campo. */
    error: string | null;
    crear: (data: EstudiantePayload) => Promise<void>;
    actualizar: (id: number, data: EstudiantePayload) => Promise<void>;
    eliminar: (id: number) => Promise<void>;
}

export function useEstudiantes(): UseEstudiantesReturn {
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar lista al montar el componente
    useEffect(() => {
        let cancelled = false;

        async function cargar() {
            try {
                setLoading(true);
                setError(null);
                const data = await getEstudiantes();
                if (!cancelled) setEstudiantes(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        isApiError(err)
                            ? `Error ${err.status} al cargar estudiantes.`
                            : "No se pudo conectar con el servidor."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        cargar();
        // Cleanup: evitar actualizar estado si el componente se desmontó
        return () => { cancelled = true; };
    }, []);

    const crear = useCallback(async (data: EstudiantePayload): Promise<void> => {
        // Lanzamos el error hacia arriba para que el componente lo maneje
        // (puede ser ApiError con errores de campo)
        const nuevo = await createEstudiante(data);
        setEstudiantes((prev) => [...prev, nuevo]);
    }, []);

    const actualizar = useCallback(
        async (id: number, data: EstudiantePayload): Promise<void> => {
            const actualizado = await updateEstudiante(id, data);
            setEstudiantes((prev) =>
                prev.map((e) => (e.id === id ? actualizado : e))
            );
        },
        []
    );

    const eliminar = useCallback(async (id: number): Promise<void> => {
        await deleteEstudiante(id);
        setEstudiantes((prev) => prev.filter((e) => e.id !== id));
    }, []);

    return { estudiantes, loading, error, crear, actualizar, eliminar };
}
