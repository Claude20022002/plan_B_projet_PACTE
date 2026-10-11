import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    Snackbar,
    Button,
    Divider,
} from "@mui/material";
import {
    CheckCircle,
    Notifications as NotificationsIcon,
    OpenInNew,
    DoneAll,
} from "@mui/icons-material";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { notificationAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TYPE_COLOR = {
    success: "success",
    warning: "warning",
    error:   "error",
    info:    "primary",
};

/** Mes notifications : la liste, marquer comme lu, ouvrir l'élément concerné. */
export default function Notifications() {
    const { t, i18n } = useTranslation();
    const { user }    = useAuth();
    const navigate    = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState("");
    const [success, setSuccess]             = useState("");

    useEffect(() => {
        if (user?.id_user) loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        try {
            const data = await notificationAPI.getByUser(user.id_user);
            setNotifications(data.data || data || []);
        } catch {
            setError(t("notifs.erreurChargement"));
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id, e) => {
        e?.stopPropagation();
        try {
            await notificationAPI.marquerCommeLue(id);
            loadNotifications();
        } catch {
            setError(t("notifs.erreurMaj"));
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.marquerToutesLues(user.id_user);
            setSuccess(t("notifs.toutesLues"));
            loadNotifications();
        } catch {
            setError(t("notifs.erreurMaj"));
        }
    };

    const handleClick = async (notif) => {
        if (!notif.lue) {
            await handleMarkAsRead(notif.id_notification);
        }
        if (notif.lien) {
            navigate(notif.lien);
        }
    };

    const unreadCount = notifications.filter((n) => !n.lue).length;

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h5" fontWeight="bold">
                            {t("notifs.titre")}
                        </Typography>
                        {unreadCount > 0 && (
                            <Chip
                                label={t("notifs.nonLues", { count: unreadCount })}
                                color="primary"
                                icon={<NotificationsIcon />}
                                size="small"
                            />
                        )}
                    </Box>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            startIcon={<DoneAll />}
                            onClick={handleMarkAllRead}
                            variant="outlined"
                        >
                            {t("notifs.toutLu")}
                        </Button>
                    )}
                </Box>

                <Snackbar open={!!error}   autoHideDuration={6000} onClose={() => setError("")}>
                    <Alert severity="error"   onClose={() => setError("")}   sx={{ width: "100%" }}>{error}</Alert>
                </Snackbar>
                <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")}>
                    <Alert severity="success" onClose={() => setSuccess("")} sx={{ width: "100%" }}>{success}</Alert>
                </Snackbar>

                <Paper>
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: "center" }}>
                            <Typography>{t("common.loading")}</Typography>
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography color="text.secondary">{t("notifs.aucune")}</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {notifications.map((notif, idx) => (
                                <React.Fragment key={notif.id_notification}>
                                    {idx > 0 && <Divider component="li" />}
                                    <ListItem
                                        disablePadding
                                        sx={{
                                            bgcolor: notif.lue ? "inherit" : "action.hover",
                                            borderLeft: notif.lue ? "4px solid transparent" : "4px solid",
                                            borderColor: notif.lue ? "transparent" : "primary.main",
                                        }}
                                        secondaryAction={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                {notif.lien && (
                                                    <Tooltip title={t("notifs.ouvrir")}>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleClick(notif)}
                                                            aria-label={t("notifs.ouvrir")}
                                                        >
                                                            <OpenInNew fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {!notif.lue && (
                                                    <Tooltip title={t("notifs.marquerLu")}>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={(e) => handleMarkAsRead(notif.id_notification, e)}
                                                            aria-label={t("notifs.marquerLu")}
                                                        >
                                                            <CheckCircle fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        }
                                    >
                                        <ListItemButton
                                            onClick={() => handleClick(notif)}
                                            disabled={!notif.lien}
                                            sx={{
                                                cursor: notif.lien ? "pointer" : "default",
                                                pr: 10,
                                                "&.Mui-disabled": { opacity: 1 },
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            fontWeight={notif.lue ? "normal" : "bold"}
                                                            component="span"
                                                        >
                                                            {notif.titre}
                                                        </Typography>
                                                        <Chip
                                                            label={t(`notifs.types.${notif.type_notification}`, { defaultValue: notif.type_notification })}
                                                            size="small"
                                                            color={TYPE_COLOR[notif.type_notification] || "default"}
                                                        />
                                                        {notif.lien && (
                                                            <Chip
                                                                label={t("notifs.cliquable")}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                                icon={<OpenInNew sx={{ fontSize: "12px !important" }} />}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box component="span">
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            component="span"
                                                            sx={{ display: "block" }}
                                                        >
                                                            {notif.message}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.disabled"
                                                            component="span"
                                                            sx={{ display: "block", mt: 0.5 }}
                                                        >
                                                            {new Date(notif.date_envoi || notif.date_creation).toLocaleString(i18n.language)}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
        </DashboardLayout>
    );
}
