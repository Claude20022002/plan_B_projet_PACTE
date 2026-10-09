import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Alert, Box, Button, Checkbox, Container, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ds } from '../design-system/tokens';

const messageDe = (error) => error?.response?.data?.error || error?.message || '';

/** Champ du code à 6 chiffres de l'application (ou d'un code de secours) */
function ChampCode({ value, onChange, label, autoFocus = false }) {
    return (
        <TextField
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="one-time-code"
            autoFocus={autoFocus}
            inputProps={{ maxLength: 12, style: { fontFamily: ds.font.board, fontSize: '1.375rem', letterSpacing: '0.2em' } }}
        />
    );
}

/** Codes de secours, montrés une seule fois : copier, télécharger, confirmer qu'ils sont rangés */
function CodesSecours({ codes, onFini }) {
    const { t } = useTranslation();
    const [ranges, setRanges] = useState(false);
    const texte = `${t('securite.codesFichier')}\n\n${codes.join('\n')}\n`;
    const telecharger = () => {
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(new Blob([texte], { type: 'text/plain' }));
        lien.download = 'hestim-codes-de-secours.txt';
        lien.click();
        URL.revokeObjectURL(lien.href);
    };
    return (
        <Stack spacing={2}>
            <Alert severity="warning">{t('securite.codesAide')}</Alert>
            <Box component="ol" sx={{ m: 0, p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, bgcolor: 'action.hover', borderRadius: `${ds.radius.xs}px`, listStylePosition: 'inside', fontFamily: ds.font.board, fontSize: '1.125rem', letterSpacing: '0.08em' }}>
                {codes.map((c) => (
                    <li key={c}>{c}</li>
                ))}
            </Box>
            <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => navigator.clipboard?.writeText(texte)}>
                    {t('securite.copier')}
                </Button>
                <Button variant="outlined" onClick={telecharger}>
                    {t('securite.telecharger')}
                </Button>
            </Stack>
            <FormControlLabel control={<Checkbox checked={ranges} onChange={(e) => setRanges(e.target.checked)} />} label={t('securite.codesRanges')} />
            <Button variant="contained" size="large" disabled={!ranges} onClick={onFini}>
                {t('securite.continuer')}
            </Button>
        </Stack>
    );
}

/**
 * Double authentification : obligatoire pour l'administration (configurée avant tout le reste),
 * possible pour les enseignants. Inscription par QR code, codes de secours montrés une seule fois,
 * nouveaux codes de secours, désactivation (enseignant).
 */
export default function Securite() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading, checkAuth, logout } = useAuth();
    const [etat, setEtat] = useState(null);
    const [inscription, setInscription] = useState(null);
    const [codes, setCodes] = useState(null);
    const [code, setCode] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const charger = useCallback(() => authAPI.mfaEtat().then(setEtat).catch((e) => setErreur(messageDe(e))), []);
    useEffect(() => {
        if (user) charger();
    }, [user, charger]);

    if (loading) return null;
    if (!user) return <Navigate to="/connexion" replace />;

    const action = async (fn) => {
        setErreur('');
        setEnvoi(true);
        try {
            await fn();
        } catch (e) {
            setErreur(messageDe(e));
        } finally {
            setEnvoi(false);
        }
    };

    const commencer = () =>
        action(async () => {
            const { secret, adresse } = await authAPI.mfaInscription();
            const image = await QRCode.toDataURL(adresse, { errorCorrectionLevel: 'M', margin: 2, width: 480 });
            setInscription({ secret, image });
            setCode('');
        });
    const activer = () =>
        action(async () => {
            const { codes_secours: nouveaux } = await authAPI.mfaConfirmation(code.trim());
            setInscription(null);
            setCodes(nouveaux);
            setCode('');
        });
    const regenerer = () =>
        action(async () => {
            const { codes_secours: nouveaux } = await authAPI.mfaCodesSecours(code.trim());
            setCodes(nouveaux);
            setCode('');
        });
    const desactiver = () =>
        action(async () => {
            await authAPI.mfaDesactivation(motDePasse, code.trim());
            setCode('');
            setMotDePasse('');
            await charger();
        });
    const terminer = async () => {
        setCodes(null);
        await checkAuth();
        await charger();
        navigate(`/dashboard/${user.role}`, { replace: true });
    };

    const titre = (cle) => (
        <Typography component="h1" variant="h5" sx={{ fontFamily: ds.font.board, fontWeight: 700, mb: 1 }}>
            {t(cle)}
        </Typography>
    );

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0B0B0D', p: 2 }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: `${ds.radius.sm}px` }}>
                    {titre('securite.titre')}
                    {erreur && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {erreur}
                        </Alert>
                    )}

                    {codes ? (
                        <CodesSecours codes={codes} onFini={terminer} />
                    ) : !etat ? null : !etat.possible ? (
                        <Typography color="text.secondary">{t('securite.reserve')}</Typography>
                    ) : inscription ? (
                        <Stack spacing={2}>
                            <Typography variant="body2" color="text.secondary">
                                {t('securite.scanner')}
                            </Typography>
                            <Box component="img" src={inscription.image} alt={t('securite.qr')} sx={{ width: 240, height: 240, alignSelf: 'center', border: '1px solid', borderColor: 'divider' }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('securite.sansQr')}{' '}
                                <Box component="code" sx={{ fontFamily: ds.font.board, letterSpacing: '0.12em', wordBreak: 'break-all' }}>
                                    {inscription.secret.match(/.{1,4}/g).join(' ')}
                                </Box>
                            </Typography>
                            <ChampCode label={t('securite.codeApp')} value={code} onChange={setCode} autoFocus />
                            <Button variant="contained" size="large" disabled={envoi || code.trim().length < 6} onClick={activer}>
                                {t('securite.activer')}
                            </Button>
                        </Stack>
                    ) : !etat.active ? (
                        <Stack spacing={2}>
                            <Typography variant="body2" color="text.secondary">
                                {t(etat.obligatoire ? 'securite.introObligatoire' : 'securite.intro')}
                            </Typography>
                            <Button variant="contained" size="large" disabled={envoi} onClick={commencer}>
                                {t('securite.commencer')}
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Alert severity="success">{t('securite.active', { count: etat.codes_restants })}</Alert>
                            <Typography variant="body2" color="text.secondary">
                                {t('securite.gestionAide')}
                            </Typography>
                            <ChampCode label={t('securite.codeApp')} value={code} onChange={setCode} />
                            <Button variant="outlined" disabled={envoi || !code.trim()} onClick={regenerer}>
                                {t('securite.regenerer')}
                            </Button>
                            {!etat.obligatoire && (
                                <>
                                    <TextField type="password" label={t('password.current')} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" />
                                    <Button color="error" variant="outlined" disabled={envoi || !code.trim() || !motDePasse} onClick={desactiver}>
                                        {t('securite.desactiver')}
                                    </Button>
                                </>
                            )}
                        </Stack>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                        {!user.mfa_a_configurer && !codes && <Button onClick={() => navigate(-1)}>{t('securite.retour')}</Button>}
                        <Button onClick={logout}>{t('common.logout')}</Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
