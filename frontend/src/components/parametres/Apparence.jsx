import { Box, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

/** Apparence du site : thème Planner (panneau des départs) ou StudyLib (bibliothèque), clair ou sombre. */
export default function Apparence() {
    const { t } = useTranslation();
    const { famille, choisirFamille, mode, choisirMode } = useTheme();

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6">{t('common.apparence.titre')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('common.apparence.intro')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <ToggleButtonGroup exclusive size="small" value={famille} onChange={(_, v) => v && choisirFamille(v)} aria-label={t('common.apparence.theme')}>
                    <ToggleButton value="planner">{t('common.apparence.planner')}</ToggleButton>
                    <ToggleButton value="studylib">{t('common.apparence.studylib')}</ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && choisirMode(v)} aria-label={t('common.apparence.mode')}>
                    <ToggleButton value="light">
                        <LightModeOutlined fontSize="small" sx={{ mr: 0.75 }} />
                        {t('common.apparence.clair')}
                    </ToggleButton>
                    <ToggleButton value="dark">
                        <DarkModeOutlined fontSize="small" sx={{ mr: 0.75 }} />
                        {t('common.apparence.sombre')}
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Paper>
    );
}
