/** Inputs and inspectable simulation results in the existing HESTIM panel materials. */
import { Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Panneau from './Panneau';
import { ds } from '../../design-system/tokens';
import { caseRobot, champsSimulation, resumeSimulation, tableauxSimulation } from '../../../../shared/simulations/presentation.js';

const cellule = { color: ds.board.letter, borderColor: ds.board.seam, overflowWrap: 'anywhere' };

/** Renders a coordinate-labeled robot grid, with symbols instead of color-only information. */
function GrilleRobot({ defi, resultat, t }) {
    return (
        <Panneau titre={t('grille')} titreId="simulation-grille">
            <Table size="small" aria-labelledby="simulation-grille" sx={{ tableLayout: 'fixed', maxWidth: 420, mx: 'auto' }}>
                <TableBody>
                    {Array.from({ length: defi.taille }, (_, y) => (
                        <TableRow key={y}>
                            {Array.from({ length: defi.taille }, (_, x) => {
                                const c = caseRobot(defi, x, y, resultat, t);
                                return <TableCell key={x} aria-label={c.label} align="center" sx={{ ...cellule, height: 44, px: 0.5, fontFamily: ds.font.mono, border: `1px solid ${ds.board.seam}`, bgcolor: c.type === 'obstacle' ? ds.board.cell : undefined }}>
                                    <Box component="span" aria-hidden="true">{c.symbole || '–'}</Box>
                                </TableCell>;
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Typography sx={{ px: 1.5, py: 1, color: ds.board.letterDim, fontSize: '0.8125rem' }}>{t('legende')}</Typography>
        </Panneau>
    );
}

/** Composes game-specific controls and shared tables without creating a second quiz engine. */
export default function AtelierSimulation({ jeu, defi, etat, session }) {
    const { t: traduire, i18n } = useTranslation();
    const langue = String(i18n.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
    const bilingue = (v) => (typeof v === 'string' ? v : v?.[langue] ?? v?.fr ?? '');
    const t = (cle, valeurs) => traduire(`simulations.${cle}`, valeurs);
    const { resultat, valeurs, occupe } = etat;
    const programme = valeurs.programme ?? '';
    return (
        <Stack spacing={2}>
            {jeu.moteur === 'robot' && <GrilleRobot defi={defi} resultat={resultat} t={t} />}
            {jeu.moteur === 'stock' && <Box>
                <Typography>{t('stockInfos', defi)}</Typography>
                <Typography variant="body2" color="text.secondary">{t('stockRegles')}</Typography>
            </Box>}
            {tableauxSimulation(jeu, defi, resultat, t, langue, bilingue).map((table, i) => (
                <Panneau key={table.titre} titre={table.titre} titreId={`simulation-table-${i}`}>
                    <TableContainer tabIndex={0} role="region" aria-labelledby={`simulation-table-${i}`} sx={{ overflowX: 'auto' }}>
                        <Table size="small" aria-labelledby={`simulation-table-${i}`}>
                            <TableHead><TableRow>{table.colonnes.map((c) => <TableCell key={c} sx={{ ...cellule, bgcolor: ds.board.cell }} scope="col">{c}</TableCell>)}</TableRow></TableHead>
                            <TableBody>{table.lignes.map((ligne, j) => <TableRow key={j}>{ligne.map((v, k) => <TableCell key={k} sx={cellule}>{v}</TableCell>)}</TableRow>)}</TableBody>
                        </Table>
                    </TableContainer>
                </Panneau>
            ))}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: jeu.moteur === 'stock' ? 'repeat(3, minmax(0, 1fr))' : jeu.moteur === 'sprint' ? 'repeat(5, minmax(0, 1fr))' : (['triage', 'sql', 'reseau', 'cpu', 'budget'].includes(jeu.moteur)) ? 'repeat(4, minmax(0, 1fr))' : '1fr' }, gap: 2 }}>
                {champsSimulation(jeu, defi, t, langue, bilingue).map((champ) => (
                    <TextField key={champ.cle} id={`simulation-${champ.cle}`} label={champ.label} value={valeurs[champ.cle] ?? ''}
                        disabled={occupe} fullWidth type={champ.texte ? 'text' : 'number'} sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
                        onChange={(e) => session.saisir(champ.cle, e.target.value)}
                        error={etat.erreur === 'saisie'}
                        helperText={champ.aide ?? (champ.texte ? t('programmeAide') : undefined)}
                        slotProps={{ htmlInput: champ.texte ? { maxLength: 160, autoComplete: 'off', spellCheck: false } : { min: champ.min ?? 0, max: champ.max ?? 100, step: 1, inputMode: 'numeric' } }} />
                ))}
            </Box>
            {jeu.moteur === 'robot' && (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {['N', 'E', 'S', 'W'].map((direction) => <Button key={direction} variant="outlined" disabled={occupe || programme.replace(/\s/g, '').length >= 40}
                        sx={{ minHeight: 44 }} onClick={() => session.saisir('programme', `${programme}${direction}`)}>{t(direction)}</Button>)}
                    <Button disabled={occupe || !programme} onClick={() => session.saisir('programme', programme.trimEnd().slice(0, -1))} sx={{ minHeight: 44 }}>{t('effacer')}</Button>
                </Stack>
            )}
            {resultat && <Typography sx={{ overflowWrap: 'anywhere' }}>{resumeSimulation(jeu, defi, resultat, t)}</Typography>}
        </Stack>
    );
}
