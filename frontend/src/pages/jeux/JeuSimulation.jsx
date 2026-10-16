/** Simulation game page: existing navigation, panel, typography, and module access rules. */
import { useEffect, useRef } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import Panneau, { LignePanneau } from '../../components/jeux/Panneau';
import AtelierSimulation from '../../components/jeux/AtelierSimulation';
import { boutonPanneau } from '../../components/jeux/styles';
import { simulationParCode } from '../../../../shared/simulations/catalogue.js';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import useSimulation from '../../hooks/useSimulation';

/** Resolves only registered simulations; changing routes remounts the session. */
export default function JeuSimulation() {
    const { code } = useParams();
    const jeu = simulationParCode(code);
    const { t } = useTranslation();
    if (!jeu) return <DashboardLayout><Alert severity="warning">{t('simulations.acces')}</Alert><Button component={RouterLink} to="/jeux">{t('simulations.retour')}</Button></DashboardLayout>;
    return <Partie key={jeu.code} jeu={jeu} />;
}

function Partie({ jeu }) {
    const { t: traduire, i18n } = useTranslation();
    const t = (cle, valeurs) => traduire(`simulations.${cle}`, valeurs);
    const texte = (v) => libelle(v, i18n.language);
    const { etat, session } = useSimulation(jeu);
    const { resultat, occupe } = etat;
    const defi = jeu.defis.find((d) => d.id === etat.defiId);
    const prochain = jeu.defis[jeu.defis.indexOf(defi) + 1];
    const titre = useRef(null);
    useEffect(() => { if (etat.statut === 'pret') titre.current?.focus(); }, [etat.defiId, etat.statut]);
    return (
        <DashboardLayout>
            <Button component={RouterLink} to="/jeux" sx={{ mb: 1 }}>{t('retour')}</Button>
            <PageHeader title={texte(jeu.titre)} subtitle={texte(jeu.objectif)} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('cadre')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('regles')}</Typography>
            {etat.statut !== 'pret' ? (
                <Alert severity={etat.statut === 'chargement' ? 'info' : 'warning'}
                    action={etat.statut !== 'chargement' && <Button onClick={session.charger}>{t('reessayer')}</Button>}>
                    {t(etat.statut === 'chargement' ? 'charger' : etat.statut === 'interdit' ? 'acces' : 'chargementErreur')}
                </Alert>
            ) : (
                <>
                    <Typography variant="body2" sx={{ mb: 2 }}>{t('progression', { count: etat.reussis.length, total: jeu.defis.length, points: etat.points })}</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
                        <Panneau titre={t('parcours')} titreId="simulation-parcours">
                            <Box component="nav" aria-labelledby="simulation-parcours">
                                {jeu.defis.map((d, i) => <LignePanneau key={d.id} premier={i === 0}>
                                    <Button onClick={() => session.choisir(d.id)} sx={{ ...boutonPanneau, minHeight: 44, textAlign: 'left' }} aria-current={d.id === defi.id ? 'step' : undefined}>
                                        {t('niveau', { n: d.niveau })} · {texte(d.titre)}{etat.reussis.includes(d.id) ? ` · ${t('reussi')}` : ''}
                                    </Button>
                                </LignePanneau>)}
                            </Box>
                        </Panneau>
                        <Box component="article" sx={{ minWidth: 0 }}>
                            <Typography component="h2" variant="h2" ref={titre} tabIndex={-1} sx={{ mb: 1 }}>{texte(defi.titre)}</Typography>
                            <Typography sx={{ mb: 2 }}>{texte(defi.consigne)}</Typography>
                            <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); session.essayer(); }}>
                                <AtelierSimulation jeu={jeu} defi={defi} etat={etat} session={session} />
                                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', my: 2, '& button': { minHeight: 44 } }}>
                                    <Button type="submit" variant="contained" disabled={occupe}>{t(occupe ? 'testEnCours' : 'tester')}</Button>
                                    <Button type="button" variant="outlined" onClick={session.aider} disabled={etat.indice}>{t('indice')}</Button>
                                    <Button type="button" onClick={() => session.choisir(defi.id)}>{t('recommencer')}</Button>
                                    {resultat?.enregistre && prochain && <Button type="button" variant="outlined" onClick={() => session.choisir(prochain.id)}>{t('suivant')}</Button>}
                                </Stack>
                            </Box>
                            {etat.indice && <Alert severity="info" sx={{ mb: 2 }}>{texte(defi.indice)}</Alert>}
                            <Box role="status" aria-live="polite" aria-atomic="true">
                                {etat.erreur && <Alert severity="warning" sx={{ mb: 1 }}>{t(etat.erreur)}</Alert>}
                                {resultat && <Alert severity={resultat.ok ? 'success' : 'info'}>
                                    <Typography>{t(resultat.ok ? 'succes' : 'ajuste')}</Typography>
                                    {resultat.enregistre && <Typography>{t(resultat.cree ? 'sauvegarde' : 'deja', { points: resultat.points })}</Typography>}
                                    {resultat.problemes.length > 0 && <Box component="ul" sx={{ pl: 2, mb: 0 }}>{resultat.problemes.map((p, i) => <li key={i}>{t(`problemes.${p.code}`, p.valeurs)}</li>)}</Box>}
                                </Alert>}
                            </Box>
                            {resultat && <Box sx={{ mt: 2 }}><Typography variant="h3">{t('bilan')}</Typography><Typography>{texte(defi.bilan)}</Typography></Box>}
                        </Box>
                    </Box>
                </>
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>{t('source')}: <Link href={jeu.curriculum.url} target="_blank" rel="noopener noreferrer">{texte(jeu.curriculum.titre)}</Link></Typography>
        </DashboardLayout>
    );
}
