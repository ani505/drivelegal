import { useState } from 'react';
import { useQuery } from 'react-query';
import { violationsApi } from '@/utils/api';
import { useLocationStore } from '@/store/locationStore';
import type { Violation } from '@/types';

const MOCK_VIOLATIONS: Violation[] = [
  { id: 1, code: 'MV-184',  name: 'Overspeeding',            description: 'Driving above the prescribed speed limit.',            severity: 'moderate', fine_min: 1000, fine_max: 2000, fine_base: 1500, currency: 'INR', license_points: 2,    suspension_days: null, legal_section: 'Section 184',  act_name: 'Motor Vehicles Act 1988', is_cognizable: false, is_bailable: true,  appeal_window_days: 30, appeal_authority: 'RTO',             name_translations: null, description_translations: null },
  { id: 2, code: 'MV-183',  name: 'Dangerous Driving',       description: 'Driving in a manner dangerous to the public.',        severity: 'major',    fine_min: 1000, fine_max: 5000, fine_base: 3000, currency: 'INR', license_points: 4,    suspension_days: 30,   legal_section: 'Section 183',  act_name: 'Motor Vehicles Act 1988', is_cognizable: true,  is_bailable: false, appeal_window_days: 15, appeal_authority: 'Magistrate Court', name_translations: null, description_translations: null },
  { id: 3, code: 'MV-185',  name: 'Drunk Driving (DUI)',     description: 'Driving under the influence of alcohol or drugs.',    severity: 'criminal', fine_min: 10000, fine_max: 15000, fine_base: 10000, currency: 'INR', license_points: 6, suspension_days: 90,   legal_section: 'Section 185',  act_name: 'Motor Vehicles Act 1988', is_cognizable: true,  is_bailable: false, appeal_window_days: 30, appeal_authority: 'Sessions Court',  name_translations: null, description_translations: null },
  { id: 4, code: 'MV-177',  name: 'Signal Jumping',          description: 'Jumping a red traffic signal.',                      severity: 'minor',    fine_min: 500,  fine_max: 1000, fine_base: 500,  currency: 'INR', license_points: 1,    suspension_days: null, legal_section: 'Section 177',  act_name: 'Motor Vehicles Act 1988', is_cognizable: false, is_bailable: true,  appeal_window_days: 30, appeal_authority: 'RTO',             name_translations: null, description_translations: null },
  { id: 5, code: 'MV-194B', name: 'Mobile Phone While Driving', description: 'Using a hand-held mobile device while driving.',  severity: 'moderate', fine_min: 1000, fine_max: 5000, fine_base: 1000, currency: 'INR', license_points: 2,    suspension_days: null, legal_section: 'Section 194B', act_name: 'Motor Vehicles Act 2019', is_cognizable: false, is_bailable: true,  appeal_window_days: 30, appeal_authority: 'RTO',             name_translations: null, description_translations: null },
  { id: 6, code: 'MV-177A', name: 'Seat Belt Violation',     description: 'Driving without wearing a seat belt.',               severity: 'minor',    fine_min: 1000, fine_max: 1000, fine_base: 1000, currency: 'INR', license_points: 1,    suspension_days: null, legal_section: 'Section 177A', act_name: 'Motor Vehicles Act 2019', is_cognizable: false, is_bailable: true,  appeal_window_days: 30, appeal_authority: 'RTO',             name_translations: null, description_translations: null },
];

export function useViolations() {
  const { countryCode } = useLocationStore();
  const [search,   setSearch]   = useState('');
  const [severity, setSeverity] = useState('');
  const [page,     setPage]     = useState(1);
  const pageSize = 12;

  const { data, isLoading, isError } = useQuery(
    ['violations', countryCode, search, severity, page],
    () =>
      violationsApi.list({
        country_code: countryCode,
        q:            search || undefined,
        severity:     severity || undefined,
        page,
        page_size:    pageSize,
      }),
    { keepPreviousData: true, retry: 1 },
  );

  const violations: Violation[] =
    data?.data?.items ??
    MOCK_VIOLATIONS.filter((v) => {
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.code.toLowerCase().includes(search.toLowerCase());
      const matchSev = !severity || v.severity === severity;
      return matchSearch && matchSev;
    });

  const total      = data?.data?.total       ?? violations.length;
  const totalPages = data?.data?.total_pages ?? 1;

  return {
    violations, total, totalPages, isLoading, isError,
    search, setSearch, severity, setSeverity, page, setPage,
  };
}
