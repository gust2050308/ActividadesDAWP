import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { RegistroForm } from "@/components/RegistroForm";

interface AuthPageProps {
    onLoginSuccess: () => void;
}

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
    const [activeTab, setActiveTab] = useState<string>("login");

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Sistema de Gestión
                    </CardTitle>
                    <CardDescription>
                        Ingresa a tu cuenta o regístrate para comenzar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1">
                            <TabsTrigger value="login">
                                Iniciar Sesión
                            </TabsTrigger>
                            <TabsTrigger value="registro">
                                Registrarse
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <LoginForm onLoginSuccess={onLoginSuccess} />
                        </TabsContent>

                        <TabsContent value="registro">
                            <RegistroForm onRegisterSuccess={() => {
                                // Redirige al login. En el futuro se 
                                // podría pasar el email como prop al LoginForm para autocompletar.
                                setActiveTab("login");
                            }} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
