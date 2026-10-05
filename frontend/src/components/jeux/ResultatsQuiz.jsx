import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { quizAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import { Capitales } from './Panneau';

/** Couleurs du nuage : celles des lignes de filière (orange, rouge et vert restent aux statuts) */
const COULEURS_NUAGE = ds.lines;

/**
 * Nuage de mots d'une question à réponse libre : taille selon le nombre de réponses, les plus
 * fréquentes au centre. Lu par les lecteurs d'écran comme une liste « mot : nombre ».
 */
export function NuageMots({ question, mots }) {
  const { t } = useTranslation();
  const max = Math.max(1, ...mots.map((m) => m.nombre));
  const centre = [];
  mots.forEach((m, i) => (i % 2 ? centre.push(m) : centre.unshift(m)));
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Typography component="figcaption" variant="subtitle2" sx={{ mb: 1 }}>
        {question}
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 2.5, rowGap: 1, bgcolor: ds.colors.bg.subtle, borderRadius: `${ds.radius.lg}px` }}>
        {centre.map((m, i) => (
          <Box
            component="li"
            key={m.texte}
            title={t('jeux.resultats.reponses', { count: m.nombre })}
            aria-label={`${m.texte} : ${t('jeux.resultats.reponses', { count: m.nombre })}`}
            sx={{ fontFamily: ds.font.board, fontWeight: 700, lineHeight: 1.1, fontSize: `${1 + 2.2 * Math.sqrt(m.nombre / max)}rem`, color: COULEURS_NUAGE[i % COULEURS_NUAGE.length] }}
          >
            {m.texte}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const Section = ({ titre, children }) => (
  <Box component="section" sx={{ mt: 3, '&:first-of-type': { mt: 0 } }}>
    <Capitales component="h3" sx={{ display: 'block', m: 0, mb: 1, fontSize: '0.875rem', letterSpacing: '0.12em', color: ds.colors.text.secondary }}>
      {titre}
    </Capitales>
    {children}
  </Box>
);

/**
 * Résultats d'une partie ClassQuiz : mon score (étudiant), le défi par équipes (groupes de TP de
 * la séance, classés par moyenne), le classement et les nuages de mots des réponses libres.
 */
export default function ResultatsQuiz({ idPartie, onClose }) {
  const { t, i18n } = useTranslation();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!idPartie) return undefined;
    let actif = true;
    quizAPI
      .getResultats(idPartie)
      .then((d) => actif && setDonnees(d))
      .catch(() => actif && setErreur(true));
    return () => {
      actif = false;
    };
  }, [idPartie]);

  const p = donnees?.partie;
  const nombre = (n) => Number(n ?? 0).toLocaleString(i18n.language);
  const meilleureMoyenne = Math.max(1, ...(donnees?.equipes ?? []).map((e) => e.moyenne));

  return (
    <Dialog open={Boolean(idPartie)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {p ? p.titre : t('jeux.resultats.titre')}
        {p && (
          <Typography variant="body2" color="text.secondary">
            {[p.module ? `${p.module.code} · ${p.module.nom}` : null, t('jeux.resultats.joueurs', { count: p.nb_joueurs ?? 0 }), p.nb_questions ? t('jeux.resultats.questions', { count: p.nb_questions }) : null].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {erreur && <Alert severity="warning">{t('jeux.resultats.erreur')}</Alert>}
        {!donnees && !erreur && <Skeleton variant="rectangular" height={160} />}
        {donnees && (
          <>
            {donnees.moi && (
              <Section titre={t('jeux.resultats.monScore')}>
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Capitales sx={{ fontSize: '2.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{nombre(donnees.moi.score)} pts</Capitales>
                  <Typography>{t('jeux.resultats.rang', { count: donnees.moi.rang, ordinal: true, total: p.nb_joueurs })}</Typography>
                  {p.nb_questions ? <Typography color="text.secondary">{t('jeux.resultats.bonnes', { bonnes: donnees.moi.bonnes, total: p.nb_questions })}</Typography> : null}
                </Box>
              </Section>
            )}

            {donnees.equipes.length > 0 && (
              <Section titre={t('jeux.resultats.equipes')}>
                <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
                  {donnees.equipes.map((e) => (
                    <Box component="li" key={e.id_groupe} sx={{ display: 'grid', gridTemplateColumns: '2rem minmax(5rem, 9rem) 1fr auto', alignItems: 'center', gap: 1.5 }}>
                      <Capitales sx={{ fontSize: '1.25rem', fontWeight: 700, color: e.rang === 1 ? ds.brand.navy : ds.colors.text.muted }}>{e.rang}</Capitales>
                      <Capitales sx={{ fontWeight: 700 }}>{e.nom}</Capitales>
                      <Box aria-hidden sx={{ height: 10, borderRadius: 5, bgcolor: ds.colors.bg.subtle, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${Math.round((100 * e.moyenne) / meilleureMoyenne)}%`, bgcolor: e.rang === 1 ? ds.brand.navy : ds.lines[1], borderRadius: 5 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {t('jeux.resultats.moyenne', { moyenne: nombre(e.moyenne), count: e.joueurs })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            <Section titre={donnees.moi ? t('jeux.resultats.podium') : t('jeux.resultats.classement')}>
              {donnees.classement.length === 0 ? (
                <Typography color="text.secondary">{t('jeux.resultats.aucun')}</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 48 }}>#</TableCell>
                      <TableCell>{t('jeux.resultats.joueur')}</TableCell>
                      {donnees.classement[0]?.etudiant !== undefined && <TableCell>{t('jeux.modules.etudiant')}</TableCell>}
                      <TableCell align="right">{t('jeux.resultats.bonnesCourt')}</TableCell>
                      <TableCell align="right">{t('jeux.modules.points')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {donnees.classement.map((c) => (
                      <TableRow key={c.pseudo} selected={donnees.moi?.pseudo === c.pseudo}>
                        <TableCell>{c.rang}</TableCell>
                        <TableCell>{c.pseudo}</TableCell>
                        {c.etudiant !== undefined && <TableCell>{c.etudiant ? `${c.etudiant.prenom} ${c.etudiant.nom}` : <Typography component="span" variant="body2" color="text.secondary">{t('jeux.resultats.nonRelie')}</Typography>}</TableCell>}
                        <TableCell align="right">{c.bonnes}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{nombre(c.score)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            {donnees.nuages.length > 0 && (
              <Section titre={t('jeux.resultats.nuages')}>
                <Box sx={{ display: 'grid', gap: 2.5 }}>
                  {donnees.nuages.map((n) => (
                    <NuageMots key={n.index} question={n.question} mots={n.mots} />
                  ))}
                </Box>
              </Section>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
