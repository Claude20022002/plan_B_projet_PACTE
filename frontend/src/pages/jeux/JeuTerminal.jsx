import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, ButtonBase, Link, Stack, Typography, useMediaQuery } from '@mui/material';
import { ArrowBack, ExpandMore, Replay } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Panneau, { Capitales } from '../../components/jeux/Panneau';
import TerminalPanneau from '../../components/jeux/TerminalPanneau';
import { useAuth } from '../../contexts/AuthContext';
import { jeuxAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import { INDICES_MAX, NIVEAU_REPONSE, PartieTerminal, defisLinux, niveauxLinux, pointsPour } from '../../../../shared/terminal/jeu.js';
import { jeuParCode } from '../../../../shared/jeux/catalogue.js';

const CODE = 'terminal-linux';
const JEU = jeuParCode(CODE);

/**
 * Jeu « Terminal Linux » : un parcours de défis (navigation, fichiers, recherche, tubes, droits,
 * processus, réseau, SSH…) joués dans un terminal simulé. L'objectif est vérifié après chaque
 * commande ; une réussite est enregistrée par Planner (points selon les indices utilisés).
 */
export default function JeuTerminal() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const large = useMediaQuery('(min-width:1100px)');
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const niveaux = useMemo(() => niveauxLinux(langue), [langue]);
  const terminal = useRef(null);

  const [reussis, setReussis] = useState(() => new Map());
  const [erreurChargement, setErreurChargement] = useState(false);
  const [indices, setIndices] = useState(0);
  const [retour, setRetour] = useState(null); // { ok, message, points }
  const [essai, setEssai] = useState(0); // « Recommencer » recrée le scénario

  const demande = params.get('defi');
  const courantId = defis.some((d) => d.id === demande) ? demande : (defis.find((d) => !reussis.has(d.id)) ?? defis[0]).id;
  const index = defis.findIndex((d) => d.id === courantId);
  const defi = defis[index];

  const partie = useMemo(
    () => new PartieTerminal(courantId, { joueur: user?.prenom || 'etudiant', langue }),
    // essai : nouvelle partie à « Recommencer »
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courantId, essai, user?.prenom]
  );

  useEffect(() => {
    let actif = true;
    jeuxAPI
      .getProgression(CODE)
      .then((p) => actif && setReussis(new Map((p?.defis ?? []).map((d) => [d.id, d]))))
      .catch(() => actif && setErreurChargement(true));
    return () => {
      actif = false;
    };
  }, []);

  // Nouveau défi : pas d'indice, pas de verdict
  useEffect(() => {
    setIndices(0);
    setRetour(null);
  }, [courantId, essai]);

  const choisir = (id) => {
    setParams({ defi: id }, { replace: false });
    setTimeout(() => terminal.current?.focus(), 0);
  };

  const enregistrer = useCallback(
    async (id, niveauIndice) => {
      if (reussis.has(id)) return reussis.get(id).points;
      try {
        const r = await jeuxAPI.reussir(CODE, id, niveauIndice);
        setReussis((m) => new Map(m).set(id, { id, points: r.points, indices: niveauIndice }));
        return r.points;
      } catch {
        // Hors ligne : la réussite compte à l'écran, elle sera enregistrée en rejouant le défi
        return pointsPour(defi.xp, niveauIndice);
      }
    },
    [reussis, defi]
  );

  // Après chaque commande : l'objectif est-il atteint ?
  const surCommande = async () => {
    if (retour?.ok) return;
    const v = partie.verifier();
    if (!v.ok) {
      if (retour) setRetour(null);
      return;
    }
    const points = await enregistrer(defi.id, indices);
    setRetour({ ok: true, points, deja: reussis.has(defi.id) });
  };

  const verifier = () => {
    const v = partie.verifier();
    if (v.ok) surCommande();
    else setRetour({ ok: false, message: v.message });
    terminal.current?.focus();
  };

  const suivant = defis[index + 1];
  const nbReussis = defis.filter((d) => reussis.has(d.id)).length;
  const points = [...reussis.values()].reduce((total, d) => total + (d.points || 0), 0);
  const indicesVisibles = defi.indices.slice(0, Math.min(indices, INDICES_MAX));

  const parcours = (
    <Panneau titre={t('jeux.terminal.parcours')} droite={`${nbReussis}/${defis.length}`} titreId="parcours-titre">
      <Box component="nav" aria-labelledby="parcours-titre" sx={{ maxHeight: large ? 'calc(100vh - 220px)' : 420, overflowY: 'auto' }}>
        {niveaux.map((n) => (
          <Box key={n.niveau}>
            <Capitales component="h3" sx={{ display: 'block', m: 0, px: 1.5, pt: 1.5, pb: 0.5, fontSize: '0.75rem', letterSpacing: '0.14em', color: ds.board.letterDim }}>
              {t('jeux.terminal.niveau', { n: n.niveau })} · {n.nom}
            </Capitales>
            {n.defis.map((id) => {
              const d = defis.find((x) => x.id === id);
              const fait = reussis.has(id);
              const actif = id === courantId;
              return (
                <ButtonBase
                  key={id}
                  onClick={() => choisir(id)}
                  aria-current={actif ? 'step' : undefined}
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '22px 1fr auto',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    minHeight: 44,
                    textAlign: 'left',
                    color: ds.board.letter,
                    bgcolor: actif ? 'rgba(255,255,255,0.09)' : 'transparent',
                    borderTop: `1px solid ${ds.board.seam}`,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: -2 },
                  }}
                >
                  <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', justifySelf: 'center', bgcolor: fait ? ds.board.live : 'transparent', border: fait ? 'none' : `1px solid ${ds.board.seam}` }} />
                  <Box sx={{ fontSize: '0.9375rem', fontWeight: actif ? 600 : 400, minWidth: 0 }}>
                    {d.titre}
                    {fait && <Box component="span" sx={visuallyHiddenSx}> · {t('jeux.terminal.reussi')}</Box>}
                  </Box>
                  {d.boss && <Capitales sx={{ fontSize: '0.6875rem', color: ds.board.letterDim }}>{t('jeux.terminal.boss')}</Capitales>}
                </ButtonBase>
              );
            })}
          </Box>
        ))}
      </Box>
    </Panneau>
  );

  return (
    <DashboardLayout>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Button component={RouterLink} to="/jeux" startIcon={<ArrowBack />} variant="text" sx={{ alignSelf: 'flex-start' }}>
          {t('jeux.tous')}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {t('jeux.progression', { count: nbReussis, total: defis.length, points })}
        </Typography>
      </Stack>

      {erreurChargement && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('jeux.horsLigne')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: large ? '320px minmax(0, 1fr)' : '1fr', gap: 2, alignItems: 'start' }}>
        {large ? (
          <Box sx={{ position: 'sticky', top: 80 }}>{parcours}</Box>
        ) : (
          <Accordion disableGutters sx={{ border: `1px solid ${ds.colors.border.default}`, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Capitales>{t('jeux.terminal.parcours')} · {nbReussis}/{defis.length}</Capitales>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>{parcours}</AccordionDetails>
          </Accordion>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Box component="article" sx={{ border: `1px solid ${ds.colors.border.default}`, borderRadius: `${ds.radius.md}px`, bgcolor: 'background.paper', px: { xs: 2, sm: 3 }, py: 2.5, mb: 2 }}>
            <Capitales sx={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'text.secondary' }}>
              {t('jeux.terminal.niveau', { n: defi.niveau })} · {defi.niveauNom}
              {defi.boss ? ` · ${t('jeux.terminal.boss')}` : ''}
            </Capitales>
            <Typography variant="h1" component="h2" sx={{ mt: 0.5, mb: 1 }}>
              {defi.titre}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '68ch' }}>
              {defi.explication}
            </Typography>
            <Box sx={{ mt: 2, pl: 1.5, borderLeft: `3px solid ${ds.brand.navy}` }}>
              <Capitales sx={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'text.secondary' }}>{t('jeux.terminal.objectif')}</Capitales>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                {defi.objectif}
              </Typography>
            </Box>

            {indicesVisibles.length > 0 && (
              <Box component="ol" sx={{ mt: 2, mb: 0, pl: 2.5, color: 'text.secondary', '& li': { mb: 0.5 } }}>
                {indicesVisibles.map((indice, i) => (
                  <li key={i}>
                    <Typography variant="body2" component="span" sx={i === INDICES_MAX - 1 ? { fontFamily: ds.font.mono } : undefined}>
                      {indice}
                    </Typography>
                  </li>
                ))}
              </Box>
            )}
            {indices >= NIVEAU_REPONSE && (
              <Box component="pre" sx={{ mt: 2, mb: 0, p: 1.5, bgcolor: ds.board.ground, color: ds.board.letter, borderRadius: `${ds.radius.sm}px`, fontFamily: ds.font.mono, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {defi.solution}
              </Box>
            )}

            <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2.5, flexWrap: 'wrap' }}>
              {!retour?.ok && (
                <Button variant="contained" onClick={verifier}>
                  {t('jeux.terminal.verifier')}
                </Button>
              )}
              {retour?.ok && suivant && (
                <Button variant="contained" onClick={() => choisir(suivant.id)}>
                  {t('jeux.terminal.suivant')}
                </Button>
              )}
              {!retour?.ok && indices < INDICES_MAX && (
                <Button variant="outlined" onClick={() => setIndices((n) => n + 1)}>
                  {t('jeux.terminal.indice', { n: indices + 1, total: INDICES_MAX })}
                </Button>
              )}
              {!retour?.ok && indices === INDICES_MAX && (
                <Button variant="outlined" onClick={() => setIndices(NIVEAU_REPONSE)}>
                  {t('jeux.terminal.reponse')}
                </Button>
              )}
              <Button variant="text" startIcon={<Replay />} onClick={() => setEssai((n) => n + 1)}>
                {t('jeux.terminal.recommencer')}
              </Button>
            </Stack>

            <Box role="status" aria-live="polite" sx={{ mt: retour ? 2 : 0 }}>
              {retour?.ok && (
                <Alert severity="success" variant="outlined">
                  {retour.deja ? t('jeux.terminal.dejaReussi') : t('jeux.terminal.reussite', { points: retour.points })}
                  {!suivant && ` ${t('jeux.terminal.fin')}`}
                </Alert>
              )}
              {retour && !retour.ok && <Alert severity="info">{retour.message}</Alert>}
            </Box>
            {!retour?.ok && indices > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('jeux.terminal.bareme', { points: pointsPour(defi.xp, indices), max: defi.xp })}
              </Typography>
            )}
          </Box>

          <TerminalPanneau
            ref={terminal}
            partie={partie}
            titre={t('jeux.terminal.titre')}
            etat={retour?.ok ? t('jeux.terminal.objectifAtteint') : t('jeux.terminal.simule')}
            onCommande={surCommande}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            {t('jeux.terminal.aide')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {t('jeux.source', { nom: JEU.source.nom, auteur: JEU.source.auteur, licence: JEU.source.licence })}{' '}
            <Link href={JEU.source.url} target="_blank" rel="noopener noreferrer">
              {t('jeux.voirSource')}
            </Link>
          </Typography>
        </Box>
      </Box>
    </DashboardLayout>
  );
}

const visuallyHiddenSx = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
