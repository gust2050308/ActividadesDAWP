/**
 * components/EstudianteTable.tsx
 * ================================
 * DataTable de estudiantes construida con @tanstack/react-table.
 *
 * CARACTERÍSTICAS:
 *   - Ordenamiento por columna (click en cabecera)
 *   - Paginación con shadcn Pagination
 *   - Fila activa resaltada (estudiante en edición)
 *   - Componentes visuales de shadcn/ui Table
 *
 * BUENA PRÁCTICA: este componente sigue siendo "tonto" — solo renderiza
 * los datos que recibe y dispara callbacks hacia arriba.
 */

import {
    useState,
    useMemo,
} from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Estudiante } from "@/types/estudiante";

interface EstudianteTableProps {
    estudiantes: Estudiante[];
    /** ID del estudiante actualmente en edición, para resaltar su fila. */
    estudianteActivoId?: number | null;
    onEditar: (estudiante: Estudiante) => void;
    onEliminar: (id: number) => void;
}

const PAGE_SIZE = 5;
const columnHelper = createColumnHelper<Estudiante>();

export function EstudianteTable({
    estudiantes,
    estudianteActivoId,
    onEditar,
    onEliminar,
}: EstudianteTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns = useMemo(
        () => [
            columnHelper.accessor("nombre", {
                header: "Nombre",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        {row.original.foto_perfil ? (
                            <img
                                src={row.original.foto_perfil}
                                alt={row.original.nombre}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                        )}
                        <span className="font-medium">{row.getValue("nombre")}</span>
                    </div>
                ),
            }),
            columnHelper.accessor("matricula", {
                header: "Matrícula",
                cell: (info) => (
                    <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor("email", {
                header: "Correo",
                cell: (info) => (
                    <span className="text-sm text-muted-foreground">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor("edad", { header: "Edad" }),
            columnHelper.accessor("carrera", { header: "Carrera" }),
            columnHelper.accessor("promedio", {
                header: "Promedio",
                cell: (info) => {
                    const val = info.getValue();
                    const color =
                        val >= 8
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : val >= 6
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-destructive/10 text-destructive";
                    return (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                            {val.toFixed(1)}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: "boleta",
                header: "Boleta",
                cell: ({ row }) => {
                    const url = row.original.boleta_pdf;
                    if (!url) {
                        return <span className="text-xs text-muted-foreground">Sin boleta</span>;
                    }
                    return (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Ver boleta
                        </a>
                    );
                },
            }),
            columnHelper.display({
                id: "acciones",
                header: () => <span className="sr-only">Acciones</span>,
                cell: ({ row }) => (
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            onClick={() => onEditar(row.original)}
                            className="hover:scale-1.2 transition-all duration-200 ease-in-out bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Editar
                        </Button>
                        <Button
                            className="hover:scale-1.2 transition-all duration-200 ease-in-out"
                            size="sm"
                            variant="destructive"
                            onClick={() => onEliminar(row.original.id)}
                        >
                            Eliminar
                        </Button>
                    </div>
                ),
            }),
        ],
        [onEditar, onEliminar]
    );

    const table = useReactTable({
        data: estudiantes,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: PAGE_SIZE } },
    });

    const { pageIndex, pageSize } = table.getState().pagination;
    const pageCount = table.getPageCount();
    const totalRows = estudiantes.length;

    // Calcular los números de página a mostrar (max 5)
    const pages = useMemo(() => {
        const total = pageCount;
        const current = pageIndex;
        const delta = 2;
        const range: number[] = [];
        for (
            let i = Math.max(0, current - delta);
            i <= Math.min(total - 1, current + delta);
            i++
        ) {
            range.push(i);
        }
        return range;
    }, [pageIndex, pageCount]);

    if (estudiantes.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-muted/30 py-16 text-center text-muted-foreground">
                <p className="text-sm">No hay estudiantes registrados.</p>
                <p className="mt-1 text-xs">Usa el botón "Nuevo Estudiante" para agregar uno.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Tabla */}
            <div className="rounded-lg border border-border overflow-hidden w-full">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();
                                    return (
                                        <TableHead
                                            key={header.id}
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                            className={canSort ? "cursor-pointer select-none" : ""}
                                        >
                                            <div className="flex items-center gap-1">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                                {canSort && (
                                                    <span className="text-muted-foreground">
                                                        {sorted === "asc" ? (
                                                            <ChevronUpIcon className="size-3.5" />
                                                        ) : sorted === "desc" ? (
                                                            <ChevronDownIcon className="size-3.5" />
                                                        ) : (
                                                            <ChevronsUpDownIcon className="size-3.5 opacity-50" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => {
                            const isActive = row.original.id === estudianteActivoId;
                            return (
                                <TableRow
                                    key={row.id}
                                    data-state={isActive ? "selected" : undefined}
                                    className={isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Footer: conteo + paginación */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, totalRows)} de{" "}
                    {totalRows} estudiante{totalRows !== 1 ? "s" : ""}
                </p>

                {pageCount > 1 && (
                    <Pagination className="w-auto mx-0 justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => table.previousPage()}
                                    aria-disabled={!table.getCanPreviousPage()}
                                    className={!table.getCanPreviousPage() ? "pointer-events-none opacity-40" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {/* Ellipsis al inicio */}
                            {pages[0] > 0 && (
                                <>
                                    <PaginationItem>
                                        <PaginationLink onClick={() => table.setPageIndex(0)} className="cursor-pointer">
                                            1
                                        </PaginationLink>
                                    </PaginationItem>
                                    {pages[0] > 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                                </>
                            )}

                            {pages.map((p) => (
                                <PaginationItem key={p}>
                                    <PaginationLink
                                        isActive={p === pageIndex}
                                        onClick={() => table.setPageIndex(p)}
                                        className="cursor-pointer"
                                    >
                                        {p + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            {/* Ellipsis al final */}
                            {pages[pages.length - 1] < pageCount - 1 && (
                                <>
                                    {pages[pages.length - 1] < pageCount - 2 && (
                                        <PaginationItem><PaginationEllipsis /></PaginationItem>
                                    )}
                                    <PaginationItem>
                                        <PaginationLink onClick={() => table.setPageIndex(pageCount - 1)} className="cursor-pointer">
                                            {pageCount}
                                        </PaginationLink>
                                    </PaginationItem>
                                </>
                            )}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => table.nextPage()}
                                    aria-disabled={!table.getCanNextPage()}
                                    className={!table.getCanNextPage() ? "pointer-events-none opacity-40" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </div>
    );
}