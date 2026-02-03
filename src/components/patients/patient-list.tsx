'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MoreVertical,
  User,
  Phone,
  Calendar,
  FileText,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Patient, PatientStatus } from '@/types/database.types';
import {
  formatDate,
  formatPhone,
  getInitials,
  stringToColor,
  formatPatientStatus,
  calculateAge,
} from '@/lib/utils';
import { deletePatient } from '@/actions/patients';

interface PatientListProps {
  patients: Patient[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string) => void;
}

export function PatientList({
  patients,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onStatusFilter,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!patientToDelete) return;

    startTransition(async () => {
      await deletePatient(patientToDelete.id);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    });
  };

  const getStatusBadgeVariant = (status: PatientStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'discharged':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con buscador y filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select onValueChange={onStatusFilter} defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="discharged">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Paciente</span>
          </Link>
        </Button>
      </div>

      {/* Lista de pacientes - Vista móvil (cards) */}
      <div className="grid gap-4 md:hidden">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No se encontraron pacientes
              </p>
            </CardContent>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className={stringToColor(patient.full_name)}>
                    <AvatarFallback className="text-white">
                      {getInitials(patient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">
                        {patient.full_name}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(patient.status)}>
                        {formatPatientStatus(patient.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhone(patient.phone)}</span>
                      </div>
                      {patient.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {calculateAge(patient.date_of_birth)} años
                          </span>
                        </div>
                      )}
                      {patient.diagnosis && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">{patient.diagnosis}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${patient.id}`}>
                          <Eye className="h-3 w-3" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Edit className="h-3 w-3" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Lista de pacientes - Vista desktop (tabla) */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Pacientes ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Paciente
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Contacto
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Diagnóstico
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Fecha registro
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {patients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No se encontraron pacientes
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar
                            className={`h-8 w-8 ${stringToColor(patient.full_name)}`}
                          >
                            <AvatarFallback className="text-white text-xs">
                              {getInitials(patient.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{patient.full_name}</p>
                            {patient.date_of_birth && (
                              <p className="text-xs text-muted-foreground">
                                {calculateAge(patient.date_of_birth)} años
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <p>{formatPhone(patient.phone)}</p>
                          {patient.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="truncate max-w-[200px]">
                          {patient.diagnosis || '-'}
                        </p>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={getStatusBadgeVariant(patient.status)}>
                          {formatPatientStatus(patient.status)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/patients/${patient.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/patients/${patient.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(patient)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar paciente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{patientToDelete?.full_name}</strong>? Esta acción no se
              puede deshacer y se eliminarán todas las notas clínicas y citas
              asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
