/**
 * App.tsx
 * ========
 * Layout de dos paneles redimensionables:
 *   - Panel izquierdo: DataTable de estudiantes
 *   - Panel derecho: Formulario crear / editar (se muestra al seleccionar)
 *
 * BUENA PRÁCTICA: App.tsx es el único lugar donde se consume useEstudiantes.
 * Los componentes hijos solo reciben props (datos + callbacks).
 */

import { useState } from "react";
import { useEstudiantes } from "@/hooks/useEstudiantes";
import { EstudianteTable } from "@/components/EstudianteTable";
import { EstudianteForm } from "@/components/EstudianteForm";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { Estudiante, EstudiantePayload } from "@/types/estudiante";
import { Button } from "./components/ui/button";

function App() {
  const { estudiantes, loading, error, crear, actualizar, eliminar } =
    useEstudiantes();

  // null  → panel derecho cerrado (solo tabla)
  // false → panel derecho abierto en modo "crear"
  // Estudiante → panel derecho abierto en modo "editar"
  const [panelData, setPanelData] = useState<Estudiante | false | null>(null);

  const estudianteEditar = panelData || null;
  const esEditar = !!estudianteEditar;

  function abrirEditar(est: Estudiante) {
    setPanelData(est);
  }

  function limpiarFormulario() {
    setPanelData(null);
  }

  async function handleCrear(data: EstudiantePayload) {
    await crear(data);
    limpiarFormulario();
  }

  async function handleActualizar(data: EstudiantePayload) {
    if (!estudianteEditar) return;
    await actualizar(estudianteEditar.id, data);
    limpiarFormulario();
  }

  async function handleEliminar(id: number) {
    if (!confirm("¿Seguro que deseas eliminar este estudiante?")) return;
    // Si se elimina el estudiante que estaba editando, limpiar el formulario
    if (estudianteEditar && estudianteEditar.id === id) limpiarFormulario();
    await eliminar(id);
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Encabezado */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Gestión de Estudiantes
          </h1>
          <p className="text-xs text-muted-foreground">
            Demostración de validación de datos — Django REST + React
          </p>
        </div>
      </header>

      {/* Cuerpo: paneles redimensionables */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          key="layout-v2"
          orientation="horizontal"
          className="min-h-[200px] w-full rounded-lg border"
        >
          {/* PANEL IZQUIERDO: Tabla (Protagonista) */}
          <ResizablePanel defaultSize="70%">
            <div className="flex h-full flex-col gap-4 overflow-y-auto no-scrollbar p-6">
              {loading && (
                <p className="text-sm text-muted-foreground">Cargando estudiantes…</p>
              )}
              {error && <ApiErrorAlert message={error} />}
              {!loading && !error && (
                <EstudianteTable
                  estudiantes={estudiantes}
                  estudianteActivoId={estudianteEditar?.id ?? null}
                  onEditar={abrirEditar}
                  onEliminar={handleEliminar}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* PANEL DERECHO: Formulario */}
          <ResizablePanel defaultSize="30%" minSize="25%" maxSize="45%">
            <div className="flex h-full flex-col bg-muted/20">
              {/* Header del panel */}
              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-background">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {esEditar ? "Editar Estudiante" : "Nuevo Estudiante"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {esEditar
                      ? "Modifica los datos y guarda los cambios."
                      : "Completa el formulario para registrar un nuevo estudiante."}
                  </p>
                </div>
                {esEditar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limpiarFormulario}
                    className="text-muted-foreground flex items-center gap-1 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Formulario con scroll */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5">
                <EstudianteForm
                  estudianteEditar={estudianteEditar}
                  onSubmit={esEditar ? handleActualizar : handleCrear}
                  onCancelar={limpiarFormulario}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;