import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    Typography,
    Chip,
    IconButton,
    Alert,
    Snackbar,
} from '@mui/material';
import { CheckCircle, Notifications as NotificationsIcon } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { notificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.id_user) {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const data = await notificationAPI.getByUser(user.id_user);
            setNotifications(data.data || data || []);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.marquerCommeLue(id);
            setSuccess('Notification marquée comme lue');
            loadNotifications();
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors de la mise à jour');
        }
    };

    const unreadCount = notifications.filter((n) => !n.lue).length;

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Mes Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                            color="primary"
                            icon={<NotificationsIcon />}
                        />
                    )}
                </Box>

                {error && (
                    <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                        <Alert onClose={() => setError('')} severity="error">
                            {error}
                        </Alert>
                    </Snackbar>
                )}

                {success && (
                    <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
                        <Alert onClose={() => setSuccess('')} severity="success">
                            {success}
                        </Alert>
                    </Snackbar>
                )}

                <Paper>
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography>Chargement...</Typography>
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                Aucune notification
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {notifications.map((notif) => (
                                <ListItem
                                    key={notif.id_notification}
                                    sx={{
                                        bgcolor: notif.lue ? 'inherit' : 'action.hover',
                                        borderLeft: notif.lue ? 'none' : '4px solid',
                                        borderColor: 'primary.main',
                                    }}
                                    secondaryAction={
                                        !notif.lue && (
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleMarkAsRead(notif.id_notification)}
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={notif.lue ? 'normal' : 'bold'}>
                                                    {notif.titre}
                                                </Typography>
                                                <Chip
                                                    label={notif.type_notification}
                                                    size="small"
                                                    color={
                                                        notif.type_notification === 'error'
                                                            ? 'error'
                                                            : notif.type_notification === 'warning'
                                                              ? 'warning'
                                                              : 'primary'
                                                    }
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {notif.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(notif.date_creation).toLocaleString('fr-FR')}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
        </DashboardLayout>
    );
}

