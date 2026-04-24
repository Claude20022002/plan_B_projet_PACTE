/**
 * OfflineIndicator — Barre de statut visible uniquement en mode offline.
 * Se place en haut de l'application (dans App.jsx ou DashboardLayout).
 */

import React, { useState } from 'react';
import {
    Alert, Box, Button, Chip, CircularProgress, Collapse,
    Tooltip, Typography,
} from '@mui/material';
import { CloudOff, CloudDone, Sync, InfoOutlined } from '@mui/icons-material';
import { useOnlineStatus, useSync } from '../../hooks/useOnlineStatus';

export default function OfflineIndicator() {
    const isOnline               = useOnlineStatus();
    const { syncStatus, syncing, triggerSync } = useSync();
    const [dismissed, setDismissed] = useState(false);

    const isElectron = Boolean(window.electronAPI);
    if (!isElectron) return null; // Invisible en mode navigateur pur

    // ── Mode ONLINE ───────────────────────────────────────────────────────────
    if (isOnline) {
        return (
            <Box sx={{ px: 2, py: 0.5, bgcolor: 'success.light', display: 'flex',
                       alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                {syncing ? (
                    <>
                        <CircularProgress size={12} sx={{ color: 'success.dark' }} />
                        <Typography variant="caption" color="success.dark">
                            Synchronisation…
                        </Typography>
                    </>
                ) : (
                    <>
                        <CloudDone sx={{ fontSize: 14, color: 'success.dark' }} />
                        <Typography variant="caption" color="success.dark">
                            En ligne
                            {syncStatus?.lastSync && ` · Dernière sync : ${
                                new Date(syncStatus.lastSync).toLocaleTimeString('fr-FR')
                            }`}
                        </Typography>
                        <Tooltip title="Synchroniser maintenant">
                            <Sync
                                sx={{ fontSize: 14, cursor: 'pointer', color: 'success.dark',
                                      '&:hover': { color: 'success.contrastText' } }}
                                onClick={triggerSync}
                            />
                        </Tooltip>
                    </>
                )}
            </Box>
        );
    }

    // ── Mode OFFLINE ──────────────────────────────────────────────────────────
    return (
        <Collapse in={!dismissed}>
            <Alert
                severity="warning"
                icon={<CloudOff />}
                sx={{ borderRadius: 0, py: 0.5 }}
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {syncStatus?.pending > 0 && (
                            <Chip
                                label={`${syncStatus.pending} en attente`}
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        )}
                        <Button size="small" color="warning" onClick={() => setDismissed(true)}>
                            Fermer
                        </Button>
                    </Box>
                }
            >
                <Typography variant="caption" fontWeight="bold">
                    Mode hors-ligne — Les modifications sont enregistrées localement
                    et seront synchronisées automatiquement au retour de la connexion.
                </Typography>
            </Alert>
        </Collapse>
    );
}
