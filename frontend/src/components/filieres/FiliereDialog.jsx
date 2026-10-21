import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';

/**
 * Création et modification d'une filière : code, intitulé, campus, régime, cycle et année où il
 * commence (pour écrire « 2ème année du cycle Ingénieur d'Etat »), double diplôme.
 * Pas de champ « École » : HESTIM, ce sont deux campus (retour du 21 octobre, R-3). Le champ
 * reste en base et garde sa valeur.
 */

const CYCLES = ['prepa', 'licence', 'ingenieur', 'master', 'executive'];
const REGIMES = ['initiale', 'continue', 'executive'];

/** Rend le dialogue ; onChamp(nom) rend le gestionnaire de saisie de ce champ. */
export default function FiliereDialog({ ouvert, modification, form, campus, onChamp, onFermer, onEnregistrer }) {
    const { t } = useTranslation();
    return (
        <Dialog open={ouvert} onClose={onFermer} maxWidth="sm" fullWidth>
            <form onSubmit={onEnregistrer}>
                <DialogTitle>{modification ? t('ref.programs.edit') : t('ref.programs.add')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField label={t('ref.programs.fields.code')} value={form.code_filiere} onChange={onChamp('code_filiere')} required autoFocus sx={{ minWidth: 140 }} />
                            <TextField fullWidth label={t('ref.programs.fields.name')} value={form.nom_filiere} onChange={onChamp('nom_filiere')} required />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.programs.fields.campus')} value={form.id_campus_prefere} onChange={onChamp('id_campus_prefere')}>
                                <MenuItem value="">{t('common.aucun')}</MenuItem>
                                {campus.map((c) => (
                                    <MenuItem key={c.id_campus} value={c.id_campus}>
                                        {c.nom}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField select fullWidth label={t('ref.programs.fields.regime')} value={form.regime} onChange={onChamp('regime')}>
                                {REGIMES.map((r) => (
                                    <MenuItem key={r} value={r}>
                                        {t(`ref.regimes.${r}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.programs.fields.cycle')} value={form.cycle} onChange={onChamp('cycle')}>
                                <MenuItem value="">{t('common.aucun')}</MenuItem>
                                {CYCLES.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {t(`ref.cycles.${c}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField type="number" label={t('ref.programs.fields.firstYear')} value={form.premiere_annee_cycle} onChange={onChamp('premiere_annee_cycle')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 190 }} />
                        </Stack>
                        <TextField
                            label={t('ref.programs.fields.cycleTitle')}
                            value={form.intitule_cycle}
                            onChange={onChamp('intitule_cycle')}
                            placeholder="cycle Ingénieur d'Etat"
                            helperText={t('ref.programs.fields.cycleTitleHelp')}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField fullWidth label={t('ref.programs.fields.partner')} value={form.partenaire} onChange={onChamp('partenaire')} placeholder="ESTIA" />
                            <TextField type="number" label={t('ref.programs.fields.yearsHere')} value={form.annees_a_hestim} onChange={onChamp('annees_a_hestim')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 150 }} />
                        </Stack>
                        <TextField label={t('ref.programs.fields.description')} value={form.description} onChange={onChamp('description')} multiline minRows={2} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onFermer}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
