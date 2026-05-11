/**
 * hooks/api/index.js — Point d'entrée unique.
 *
 * Usage :
 *   import { useSallesList, useCreateSalle, useKPIs } from '@/hooks/api';
 */

// Shared
export { usePagination }   from './_shared/usePagination';
export { useFilters }      from './_shared/useFilters';
export { QK }              from './_shared/queryKeys';

// Domains
export * from './useSalles';
export * from './useAffectations';
export * from './useConflits';
export * from './useStatistiques';
export * from './useNotifications';
