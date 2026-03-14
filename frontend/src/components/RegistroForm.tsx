import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { registro } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const registroSchema = z.object({
    email: z.string().email({ message: "Debe ser un correo válido." }),
    nombre_completo: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    telefono: z.string().optional(),
    password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
});

type RegistroData = z.infer<typeof registroSchema>;

interface RegistroFormProps {
    onRegisterSuccess: () => void;
}

export function RegistroForm({ onRegisterSuccess }: RegistroFormProps) {
    const [cargando, setCargando] = useState(false);

    const form = useForm<RegistroData>({
        resolver: zodResolver(registroSchema),
        defaultValues: {
            email: "",
            nombre_completo: "",
            telefono: "",
            password: "",
        },
    });

    async function onSubmit(data: RegistroData) {
        setCargando(true);

        try {
            await registro(data);
            toast.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
            onRegisterSuccess();
        } catch (error: any) {
            const respData = error.response?.data;
            if (respData) {
                // Mostramos el primer mensaje de error que encontremos
                const firstError = Object.values(respData)[0] as string[];
                toast.error(firstError?.[0] || "Error en el registro");
            } else {
                toast.error("Error al conectar con el servidor");
            }
        } finally {
            setCargando(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="correo@ejemplo.com" {...field} disabled={cargando} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="nombre_completo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Juan Pérez" {...field} disabled={cargando} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teléfono (opcional)</FormLabel>
                            <FormControl>
                                <Input type="tel" placeholder="555-1234" {...field} disabled={cargando} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} disabled={cargando} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={cargando}>
                    {cargando ? "Registrando..." : "Crear Cuenta"}
                </Button>
            </form>
        </Form>
    );
}
