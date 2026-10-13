import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Heure courante (hh:mm) en chiffres tabulaires, rafraîchie toutes les 30 secondes. */
export default function Horloge() {
  const { i18n } = useTranslation();
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const libelle = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(maintenant);
  return (
    <Box component="time" sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
      {libelle}
    </Box>
  );
}
