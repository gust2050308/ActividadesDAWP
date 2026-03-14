import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { login } from "@/api/auth";
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

const loginSchema = z.object({
    email: z.string().email({ message: "Debe ser un correo válido." }),
    password: z.string().min(1, { message: "La contraseña es requerida." }),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [cargando, setCargando] = useState(false);

    const form = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginData) {
        setCargando(true);

        try {
            const resp = await login(data.email, data.password);

            localStorage.setItem("access_token", resp.access);
            localStorage.setItem("refresh_token", resp.refresh);

            toast.success("¡Bienvenido!");
            onLoginSuccess();
        } catch (error: unknown) {
            const axiosErr = error as { response?: { status?: number } };
            if (axiosErr.response?.status === 401) {
                toast.error("Usuario o contraseña incorrectos");
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
                    {cargando ? "Ingresando..." : "Entrar al Sistema"}
                </Button>
            </form>
        </Form>
    );
}
