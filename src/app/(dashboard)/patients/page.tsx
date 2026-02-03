'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientList } from '@/components/patients/patient-list';
import { getPatients } from '@/actions/patients';
import type { Patient } from '@/types/database.types';
import { debounce } from '@/lib/utils';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 10;

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    const result = await getPatients(currentPage, pageSize, search, status);
    setPatients(result.data);
    setTotalCount(result.count);
    setIsLoading(false);
  }, [currentPage, search, status]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, 300);

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="page-header">
        <h1 className="page-title">Pacientes</h1>
        <p className="page-description">
          Gestiona tus pacientes y sus expedientes clínicos
        </p>
      </div>

      <PatientList
        patients={patients}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
      />
    </div>
  );
}
