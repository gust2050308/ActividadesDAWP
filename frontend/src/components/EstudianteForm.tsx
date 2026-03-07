/**
 * components/EstudianteForm.tsx
 * ==============================
 * Formulario para crear o editar un estudiante.
 *
 * FLUJO DE VALIDACIÓN (dos capas):
 *   1. CLIENTE — zodResolver ejecuta estudianteSchema en onSubmit (y opcionalmente
 *      en onChange). Si hay errores, se muestran bajo cada campo sin hacer el fetch.
 *
 *   2. SERVIDOR — si el servidor devuelve 400, los errores por campo de DRF
 *      se inyectan con form.setError(campo), y los errores generales
 *      (non_field_errors) se muestran arriba del formulario.
 *
 * BUENA PRÁCTICA:
 *   - react-hook-form + zodResolver reemplaza el useState-por-campo manual.
 *   - El schema Zod (validaciones.ts) se mantiene en sincronía con el backend.
 *   - Los errores de API por campo se inyectan directamente en el form state.
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { estudianteSchema, type EstudianteFormData } from "@/lib/validaciones";
import { isApiError, type Estudiante, type EstudiantePayload } from "@/types/estudiante";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";

interface EstudianteFormProps {
    /** Si se pasa, el formulario estará en modo "editar". */
    estudianteEditar?: Estudiante | null;
    onSubmit: (data: EstudiantePayload) => Promise<void>;
    onCancelar: () => void;
}

const CAMPOS_VACIOS: EstudianteFormData = {
    nombre: "",
    matricula: "",
    email: "",
    edad: 18,
    carrera: "",
    promedio: 0,
    archivo_foto: undefined,
    archivo_boleta: undefined,
};

export function EstudianteForm({
    estudianteEditar,
    onSubmit,
    onCancelar,
}: EstudianteFormProps) {
    /** Error general que no corresponde a ningún campo (non_field_errors del servidor). */
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<EstudianteFormData>({
        resolver: zodResolver(estudianteSchema),
        defaultValues: CAMPOS_VACIOS,
    });

    const { handleSubmit, control, reset, setError, formState: { isSubmitting } } = form;

    const esEditar = !!estudianteEditar;

    // Pre-llenar o limpiar el formulario cuando cambia el estudiante a editar
    useEffect(() => {
        if (estudianteEditar) {
            const { id, foto_perfil, boleta_pdf, ...payload } = estudianteEditar;
            void id;
            void boleta_pdf;
            reset({ ...payload, archivo_foto: undefined, archivo_boleta: undefined });
            setImagePreview(foto_perfil || null);
        } else {
            reset(CAMPOS_VACIOS);
            setImagePreview(null);
        }
        setErrorGeneral(null);
    }, [estudianteEditar, reset]);

    async function handleFormSubmit(data: EstudianteFormData) {
        setErrorGeneral(null);
        try {
            await onSubmit(data);
            form.reset(CAMPOS_VACIOS);
            setImagePreview(null);
        } catch (err) {
            if (isApiError(err)) {
                // Inyectar errores por campo del servidor en el estado del form
                for (const [campo, mensajes] of Object.entries(err.fieldErrors)) {
                    if (campo === "non_field_errors") {
                        setErrorGeneral((mensajes as string[]).join(" "));
                    } else {
                        setError(campo as keyof EstudianteFormData, {
                            message: (mensajes as string[])[0],
                        });
                    }
                }
            } else {
                setErrorGeneral(
                    err instanceof Error
                        ? `Error de conexión: ${err.message}`
                        : "Error inesperado. Intenta de nuevo."
                );
            }
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar solo en frontend si excede 5MB
            if (file.size > 5 * 1024 * 1024) {
                setErrorGeneral("La imagen no puede exceder los 5MB.");
                return;
            }
            setErrorGeneral(null);

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Inyectar al form
            form.setValue("archivo_foto", file);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-1">

            {/* Error general del servidor (non_field_errors) */}
            {errorGeneral && (
                <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                >
                    {errorGeneral}
                </div>
            )}

            {/* Selector de Foto de Perfil */}
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative group">
                    {imagePreview ? (
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-muted"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-sm">
                            <User className="w-10 h-10 text-muted-foreground" />
                        </div>
                    )}

                    <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-lg border-2 border-background z-10 hover:bg-secondary/80 focus-within:ring-2 focus-within:ring-ring"
                    >
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleImageSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Sube o cambia tu foto de perfil"
                            title="Sube o cambia tu foto de perfil"
                        />
                        <Camera className="w-4 h-4 text-secondary-foreground text-white" />
                    </Button>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG o WebP. Máx. 5MB
                    </p>
                </div>
            </div>

            <FieldGroup>
                {/* Nombre */}
                <Controller
                    name="nombre"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-nombre">Nombre</FieldLabel>
                            <Input
                                {...field}
                                id="field-nombre"
                                placeholder="Ej. Ana García"
                                autoComplete="off"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Matrícula */}
                <Controller
                    name="matricula"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-matricula">Matrícula</FieldLabel>
                            <Input
                                {...field}
                                id="field-matricula"
                                placeholder="Ej. 20233tn132"
                                autoComplete="off"
                                aria-invalid={fieldState.invalid}
                            />
                            <FieldDescription>
                                Formato: opcional una mayúscula, 4-5 dígitos, 2 minúsculas, 3+ dígitos.
                            </FieldDescription>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Email */}
                <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-email">Correo Electrónico</FieldLabel>
                            <Input
                                {...field}
                                id="field-email"
                                type="email"
                                placeholder="Ej. usuario@ejemplo.com"
                                autoComplete="off"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Edad */}
                <Controller
                    name="edad"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-edad">Edad</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    {...field}
                                    id="field-edad"
                                    type="number"
                                    min={6}
                                    max={100}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>años</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Carrera */}
                <Controller
                    name="carrera"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-carrera">Carrera</FieldLabel>
                            <Input
                                {...field}
                                id="field-carrera"
                                placeholder="Ej. Sistemas"
                                autoComplete="off"
                                aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {/* Promedio */}
                <Controller
                    name="promedio"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-promedio">Promedio</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    {...field}
                                    id="field-promedio"
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    aria-invalid={fieldState.invalid}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>/ 10</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
            </FieldGroup>

            {/* Boleta de calificaciones (PDF) */}
            <FieldGroup className="mt-5">
                <Controller
                    name="archivo_boleta"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="field-boleta">Boleta de calificaciones (PDF)</FieldLabel>
                            <Input
                                id="field-boleta"
                                type="file"
                                accept="application/pdf"
                                aria-invalid={fieldState.invalid}
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    field.onChange(file);
                                }}
                            />
                            <FieldDescription>
                                Solo archivos PDF. Máx. 5MB.
                            </FieldDescription>
                            {field.value instanceof File && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Archivo seleccionado: {field.value.name}
                                </p>
                            )}
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
            </FieldGroup>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t mt-4">
                <Button type="button" variant="outline" className="w-full sm:w-auto font-medium text-white" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto font-medium shadow-md">
                    {isSubmitting ? "Guardando…" : esEditar ? "Guardar cambios" : "Crear estudiante"}
                </Button>
            </div>

        </form>
    );
}
