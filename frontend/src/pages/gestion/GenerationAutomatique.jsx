import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Tab, Tabs } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LancementGeneration from '../../components/generation/LancementGeneration';
import VersionsGeneration from '../../components/generation/VersionsGeneration';
import { localeEcran } from '../../utils/dates';

/**
 * Génération automatique (phase E) : la semaine type est calculée par le service Timefold, puis
 * déployée sur le semestre sous les règles de planification. Onglet « Générer » : lancement sans
 * réglage, attente, rapport et exploration des emplois du temps (R-4, components/generation) ;
 * onglet « Versions » : revenir à une version précédente.
 */
export default function GenerationAutomatique() {
    const { t, i18n } = useTranslation();
    const [onglet, setOnglet] = useState(0);
    const dateHeure = useMemo(() => new Intl.DateTimeFormat(localeEcran(i18n.language), { dateStyle: 'medium', timeStyle: 'short' }), [i18n.language]);

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab label={t('gen.tabs.run')} />
                    <Tab label={t('gen.tabs.versions')} />
                </Tabs>
                {onglet === 0 ? <LancementGeneration dateHeure={dateHeure} /> : <VersionsGeneration dateHeure={dateHeure} />}
            </Paper>
        </DashboardLayout>
    );
}
