/**
 * MIGRATION_EXAMPLE.jsx
 * Comparaison AVANT / APRÈS pour un développeur qui migre une page.
 * Ce fichier est une référence — ne pas importer dans l'application.
 */

// ═══════════════════════════════════════════════════════════════════════════
// ❌ AVANT — Pattern useEffect + useState (200+ lignes de boilerplate)
// ═══════════════════════════════════════════════════════════════════════════

function SallesAVANT() {
  // 6 états pour gérer UNE liste
  const [salles, setSalles]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch]         = useState('');
  const [total, setTotal]           = useState(0);
  // + open, editing, confirmDialog, importErrors... = 15+ useState

  // Fetch manuel : retry nul, pas de cache, pas de dedup
  useEffect(() => {
    setLoading(true);
    salleAPI.getAll({ page: page + 1, limit: rowsPerPage })
      .then(d => { setSalles(d.data || []); setTotal(d.pagination?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ?')) {
      try {
        await salleAPI.delete(id);
        setSuccess('Salle supprimée');
        // Re-fetch MANUEL — pas d'invalidation intelligente
        salleAPI.getAll({ page: page + 1, limit: rowsPerPage })
          .then(d => setSalles(d.data || []));
      } catch (e) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  // Résultat : 200+ lignes, toast dupliqué, retry absent, cache absent.
}

// ═══════════════════════════════════════════════════════════════════════════
// ✅ APRÈS — React Query (30 lignes de logique réelle)
// ═══════════════════════════════════════════════════════════════════════════

import { useState }                     from 'react';
import { usePagination }                from './usePagination';
import { useFilters }                   from './useFilters';
import {
  useSallesList, useCreateSalle,
  useUpdateSalle, useDeleteSalle,
}                                        from '../useSalles';
import ConfirmDialog                    from '../../../components/common/ConfirmDialog';
import SkeletonTable                    from '../../../components/common/SkeletonTable';
import EmptyState                       from '../../../components/common/EmptyState';

function SallesAPRES() {
  // ── État UI pur (pas de données) ─────────────────────────────────────────
  const [open, setOpen]                 = useState(false);
  const [editing, setEditing]           = useState(null);
  const [confirmId, setConfirmId]       = useState(null);

  // ── Pagination + Filtres ──────────────────────────────────────────────────
  const pg      = usePagination({ defaultLimit: 10 });
  const filters = useFilters({ search: '' }, { onFilterChange: pg.resetPage });

  // ── Data : 1 ligne, cache automatique, retry, dedup ──────────────────────
  const { items, total, isLoading, isFetching, isPlaceholderData } =
    useSallesList({ ...pg.params, ...filters.apiParams });

  // ── Mutations : toast intégré, invalidation automatique ──────────────────
  const create      = useCreateSalle();
  const deleteSalle = useDeleteSalle();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = (values) => {
    if (editing) {
      // useUpdateSalle instancié ici avec l'id courant
    } else {
      create.mutate(values, { onSuccess: () => setOpen(false) });
    }
  };

  const handleDeleteConfirm = () => {
    deleteSalle.mutate(confirmId, { onSuccess: () => setConfirmId(null) });
  };

  // ── Skeleton strategy ─────────────────────────────────────────────────────
  // isLoading      → premier chargement → SkeletonTable (rien à afficher)
  // isFetching     → refetch silencieux → petit indicateur dans le header
  // isPlaceholderData → changement de page → ancienne page visible, légèrement grisée

  return (
    <div>
      {/* Indicateur de refetch silencieux */}
      {isFetching && !isLoading && <LinearProgress />}

      {isLoading ? (
        <SkeletonTable columns={7} rows={10} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune salle"
          actionLabel="Ajouter une salle"
          onAction={() => setOpen(true)}
        />
      ) : (
        <TableContainer sx={{ opacity: isPlaceholderData ? 0.7 : 1, transition: 'opacity .2s' }}>
          {/* Table avec items */}
        </TableContainer>
      )}

      {/* Dialog confirm suppression */}
      <ConfirmDialog
        open={!!confirmId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmId(null)}
        title="Supprimer la salle ?"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUIDE : Stratégie de migration progressive
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ÉTAPE 1 — Setup (1 heure, fait)
 *   ✅ AppProviders.jsx avec QueryClientProvider
 *   ✅ queryClient.js configuré
 *   ✅ ToastContext pour les toasts centralisés
 *   ✅ useGlobalQueryError pour les erreurs automatiques
 *
 * ÉTAPE 2 — Migrer page par page (sans toucher les autres pages)
 *   Pour chaque page :
 *   1. Créer hooks/api/useMaDomaine.js avec le pattern useSalles
 *   2. Remplacer les useState/useEffect dans la page
 *   3. Vérifier que les tests Playwright passent
 *   4. Supprimer le code mort (états non utilisés)
 *
 * ÉTAPE 3 — Ordre de migration recommandé (par impact/risque)
 *   1. Conflits      ← plus simple, peu de mutations
 *   2. Salles        ← template de référence
 *   3. Cours         ← idem Salles
 *   4. Utilisateurs  ← + import bulk
 *   5. Affectations  ← le plus complexe (attendre 1-4 fait)
 *   6. Statistiques  ← lecture seule, très simple
 *   7. Dashboard     ← dernier (dépend des autres)
 *
 * ÉTAPE 4 — Supprimer l'ancien api.js
 *   Quand toutes les pages sont migrées :
 *   grep -r "from '../../services/api'" src/pages/
 *   Si 0 résultats → supprimer api.js
 */
