/**
 * useSalles.js — Référence CRUD complète.
 *
 * Ce fichier est le template à suivre pour migrer toutes les pages.
 * Il démontre :
 *   ✅ Liste paginée avec keepPreviousData
 *   ✅ Détail par ID
 *   ✅ Recherche / filtres
 *   ✅ Create / Update / Delete avec toast automatique
 *   ✅ Optimistic update sur Delete
 *   ✅ Invalidation ciblée
 *   ✅ Gestion erreurs locales (mutations uniquement)
 *   ✅ Loading + skeleton strategy
 *
 * ── Guide migration rapide (pattern à appliquer) ──────────────────────────
 *
 * AVANT (ancien pattern) :
 *   const [salles, setSalles] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState('');
 *   useEffect(() => {
 *     setLoading(true);
 *     salleAPI.getAll(params)
 *       .then(d => setSalles(d.data))
 *       .catch(e => setError(e.message))
 *       .finally(() => setLoading(false));
 *   }, [page, rowsPerPage]);
 *
 * APRÈS (React Query) :
 *   const { items, total, isLoading } = useSallesList({ page: 1, limit: 10 });
 *   // → cache automatique, retry, dedup, background refetch
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getUserMessage } from '../../services/errors';
import { sallesAPI } from '../../services/domains/salles.api';
import { QK } from './_shared/queryKeys';

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES (lecture)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste paginée + filtrée des salles.
 *
 * @param {{ page?: number, limit?: number, search?: string }} [params]
 *
 * @returns {{
 *   items: Salle[],
 *   total: number,
 *   isLoading: boolean,
 *   isFetching: boolean,   ← vrai pendant refetch en arrière-plan
 *   isPlaceholderData: boolean,  ← vrai pendant changement de page
 *   error: AppError | null,
 * }}
 *
 * Skeleton strategy :
 *   - Premier chargement : isLoading === true → afficher <SkeletonTable />
 *   - Changement de page : isPlaceholderData === true → opacité réduite
 *   - Refetch silencieux : isFetching && !isLoading → petit spinner dans le header
 */
export function useSallesList(params) {
  const result = useQuery({
    queryKey:        QK.salles.list(params),
    queryFn:         () => sallesAPI.getAll(params),
    placeholderData: keepPreviousData,   // Garde l'ancienne page visible pendant le chargement
    staleTime:       30_000,            // 30s avant refetch automatique
    select: (res) => ({
      items:      res.data       ?? [],
      total:      res.pagination?.total ?? 0,
      pagination: res.pagination ?? {},
    }),
  });

  return {
    items:             result.data?.items    ?? [],
    total:             result.data?.total    ?? 0,
    isLoading:         result.isLoading,
    isFetching:        result.isFetching,
    isPlaceholderData: result.isPlaceholderData,
    error:             result.error,
  };
}

/**
 * Détail d'une salle (chargé uniquement si id est défini).
 * @param {number | null | undefined} id
 */
export function useSalleDetail(id) {
  return useQuery({
    queryKey: QK.salles.detail(id),
    queryFn:  () => sallesAPI.getById(id),
    enabled:  !!id,
    select:   (res) => res.data,
    staleTime: 60_000,
  });
}

/**
 * Salles disponibles pour un créneau + date.
 * Désactivée si les paramètres sont incomplets.
 */
export function useSallesDisponibles(params) {
  return useQuery({
    queryKey: QK.salles.disponibles(params),
    queryFn:  () => sallesAPI.getDisponibles(params),
    enabled:  !!(params?.id_creneau && params?.date_seance),
    staleTime: 10_000,
    select: (res) => res.data ?? [],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS (écriture)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Créer une salle.
 *
 * Usage :
 *   const create = useCreateSalle();
 *   create.mutate(payload);                    // simple
 *   create.mutate(payload, {                   // avec callbacks locaux
 *     onSuccess: () => formik.resetForm(),
 *     onError:   (err) => formik.setErrors(getFieldErrors(err) ?? {}),
 *   });
 *
 * Toast automatique intégré : succès + erreur.
 */
export function useCreateSalle() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: sallesAPI.create,

    onSuccess: (_data, _vars, _ctx) => {
      // Invalide TOUTES les listes → refetch automatique
      qc.invalidateQueries({ queryKey: QK.salles.all() });
      toast.success('Salle créée avec succès');
    },

    onError: (error) => {
      toast.error(getUserMessage(error));
    },
  });
}

/**
 * Modifier une salle.
 * Optimistic update : l'UI est mise à jour immédiatement, rollback si erreur.
 *
 * @param {number} id
 */
export function useUpdateSalle(id) {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload) => sallesAPI.update(id, payload),

    // ── Optimistic update ───────────────────────────────────────────────
    onMutate: async (newData) => {
      // 1. Annuler les requêtes en cours sur ce détail (éviter les overwrites)
      await qc.cancelQueries({ queryKey: QK.salles.detail(id) });

      // 2. Snapshot de l'ancienne valeur (pour rollback)
      const previousDetail = qc.getQueryData(QK.salles.detail(id));

      // 3. Mise à jour optimiste du cache
      qc.setQueryData(QK.salles.detail(id), (old) =>
        old ? { ...old, data: { ...old.data, ...newData } } : old,
      );

      // 4. Mettre à jour aussi dans les listes (optionnel, plus complexe)
      qc.setQueriesData(
        { queryKey: QK.salles.lists() },
        (oldList) => {
          if (!oldList?.items) return oldList;
          return {
            ...oldList,
            items: oldList.items.map((s) =>
              s.id_salle === id ? { ...s, ...newData } : s,
            ),
          };
        },
      );

      // 5. Retourner le contexte pour le rollback
      return { previousDetail };
    },

    onError: (error, _vars, ctx) => {
      // Rollback : restaurer l'ancienne valeur
      if (ctx?.previousDetail) {
        qc.setQueryData(QK.salles.detail(id), ctx.previousDetail);
      }
      // Re-invalider pour synchroniser avec le serveur
      qc.invalidateQueries({ queryKey: QK.salles.all() });
      toast.error(getUserMessage(error));
    },

    onSuccess: () => {
      toast.success('Salle modifiée avec succès');
    },

    onSettled: () => {
      // Toujours re-valider après succès ou erreur pour rester en sync
      qc.invalidateQueries({ queryKey: QK.salles.all() });
    },
  });
}

/**
 * Supprimer une salle.
 * Optimistic : retire la salle de la liste immédiatement, rollback si erreur.
 */
export function useDeleteSalle() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: sallesAPI.delete,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.salles.lists() });

      // Snapshot de toutes les listes (plusieurs pages peuvent coexister)
      const snapshots = qc
        .getQueriesData({ queryKey: QK.salles.lists() })
        .map(([key, data]) => ({ key, data }));

      // Retrait optimiste
      qc.setQueriesData(
        { queryKey: QK.salles.lists() },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            total: (old.total ?? 0) - 1,
            items: old.items.filter((s) => s.id_salle !== id),
          };
        },
      );

      return { snapshots };
    },

    onError: (error, _id, ctx) => {
      // Rollback : restaurer toutes les listes
      ctx?.snapshots?.forEach(({ key, data }) => {
        qc.setQueryData(key, data);
      });
      toast.error(getUserMessage(error));
    },

    onSuccess: () => {
      toast.success('Salle supprimée avec succès');
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.salles.all() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK COMPOSITE (pattern "une page = un hook")
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook composite qui regroupe tout ce dont la page Salles a besoin.
 * Élimine 100% du boilerplate useState/useEffect de l'ancienne page.
 *
 * Usage dans Salles.jsx :
 *   const {
 *     items, total, isLoading, isFetching,
 *     pg, filters,
 *     create, update, deleteSalle,
 *   } = useSallesPage();
 *
 * @param {{ defaultLimit?: number }} [opts]
 */
export function useSallesPage({ defaultLimit = 10 } = {}) {
  // On importe usePagination et useFilters ici pour le hook composite
  const { usePagination } = require('./_shared/usePagination');
  const { useFilters }    = require('./_shared/useFilters');

  const pg      = usePagination({ defaultLimit });
  const filters = useFilters({ search: '' }, { onFilterChange: pg.resetPage });

  const { items, total, isLoading, isFetching, isPlaceholderData } =
    useSallesList({ ...pg.params, ...filters.apiParams });

  const create      = useCreateSalle();
  const deleteSalle = useDeleteSalle();

  // update nécessite l'id → instancié dans le composant quand l'id est connu

  return {
    // Data
    items,
    total,
    isLoading,
    isFetching,
    isPlaceholderData,
    // Pagination
    pg,
    // Filtres
    filters,
    // Mutations
    create,
    deleteSalle,
    // Statuts de chargement pour les boutons
    isCreating:  create.isPending,
    isDeleting:  deleteSalle.isPending,
  };
}
