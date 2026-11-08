import { useEffect, useState } from 'react';
import { Link } from '@mui/material';
import { MenuBook } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { supportsDuCours } from '../../utils/supports';

/** « Supports du cours (n) » : documents publiés pour ce module dans la bibliothèque. */
export default function SupportsCours({ code, color }) {
  const { t } = useTranslation();
  const [supports, setSupports] = useState(null);
  useEffect(() => {
    let actif = true;
    supportsDuCours(code).then((s) => actif && setSupports(s));
    return () => {
      actif = false;
    };
  }, [code]);
  if (!supports?.documents) return null;
  return (
    <Link href={supports.url} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1.5, color, fontWeight: 600 }}>
      <MenuBook fontSize="small" aria-hidden />
      {t('board.supports', { count: supports.documents })}
    </Link>
  );
}
