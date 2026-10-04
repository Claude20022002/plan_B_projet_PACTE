import { Expo } from "expo-server-sdk";
import { Op } from "sequelize";
import { PushToken, Users } from "../models/index.js";

/**
 * Notifications push de l'application mobile (phase D3), par le service Expo (qui relaie à FCM
 * pour Android). Chaque Notification créée dans Planner part aussi en push vers les appareils
 * du destinataire. Un jeton signalé « DeviceNotRegistered » (application désinstallée) est
 * supprimé. EXPO_ACCESS_TOKEN active la « sécurité renforcée » d'Expo : sans lui, quiconque
 * connaît un jeton d'appareil peut lui envoyer un push ; avec lui, seul Planner le peut.
 *
 * Contenu : titre et message de la notification, et le lien interne ; rien d'autre.
 */

let client = null;
const clientPush = () => {
    client ??= new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });
    return client;
};

/** Pour les tests : remplace le client Expo (null rétablit le vrai). */
export const definirClientPush = (fauxClient) => {
    client = fauxClient;
};

const actif = () => process.env.PUSH_DISABLED !== "true" && (process.env.NODE_ENV !== "test" || client !== null);

export class JetonPushInvalide extends Error {
    constructor() {
        super("Jeton de notification invalide");
        this.status = 400;
    }
}

/*
 * File d'envoi : les notifications créées ensemble (un report prévient tout un groupe) partent
 * en un seul appel à Expo, regroupées par contenu, 100 ms après la première.
 */
let file = [];
let minuterie = null;
let envoiEnCours = Promise.resolve();

const viderFile = () => {
    const lot = file;
    file = [];
    minuterie = null;
    const parContenu = new Map();
    for (const { idUser, contenu } of lot) {
        const cle = JSON.stringify(contenu);
        if (!parContenu.has(cle)) parContenu.set(cle, { contenu, ids: new Set() });
        parContenu.get(cle).ids.add(idUser);
    }
    envoiEnCours = envoiEnCours.then(() => Promise.all([...parContenu.values()].map(({ contenu, ids }) => envoyerPush([...ids], contenu))));
    return envoiEnCours;
};

/** Ajoute une notification à la file d'envoi (appelé à chaque Notification créée). */
export const planifierPush = (idUser, contenu) => {
    if (!actif()) return;
    file.push({ idUser, contenu });
    minuterie ??= setTimeout(viderFile, 100);
};

/** Pour les tests : envoie tout de suite ce qui attend, et attend la fin des envois. */
export const attendreFilePush = async () => {
    if (minuterie) {
        clearTimeout(minuterie);
        await viderFile();
    }
    await envoiEnCours;
};

/** Enregistre le jeton de l'appareil pour le compte connecté (il quitte un éventuel autre compte). */
export const enregistrerJeton = async (idUser, token, plateforme = "android") => {
    if (typeof token !== "string" || token.length > 255 || !Expo.isExpoPushToken(token)) throw new JetonPushInvalide();
    if (!["android", "ios"].includes(plateforme)) throw new JetonPushInvalide();
    const existant = await PushToken.findOne({ where: { token } });
    if (existant) {
        await existant.update({ id_user: idUser, plateforme });
        return existant;
    }
    return PushToken.create({ id_user: idUser, token, plateforme });
};

/** Supprime le jeton de l'appareil, seulement s'il appartient au compte connecté. */
export const supprimerJeton = async (idUser, token) => PushToken.destroy({ where: { id_user: idUser, token } });

/**
 * Envoie un push aux appareils des utilisateurs (comptes actifs seulement).
 * N'échoue jamais : une notification reste créée même si Expo est injoignable.
 */
export const envoyerPush = async (idUsers, { titre, message, lien = null }) => {
    if (!actif() || !idUsers.length) return { envoyes: 0 };
    try {
        const jetons = await PushToken.findAll({
            where: { id_user: { [Op.in]: idUsers } },
            include: [{ model: Users, as: "user", attributes: [], where: { actif: true } }],
        });
        if (!jetons.length) return { envoyes: 0 };
        const messages = jetons.map((j) => ({
            to: j.token,
            sound: "default",
            title: String(titre).slice(0, 120),
            body: String(message ?? "").slice(0, 240),
            data: lien ? { lien } : {},
            channelId: "planning",
        }));
        const expo = clientPush();
        const tickets = [];
        for (const lot of expo.chunkPushNotifications(messages)) {
            tickets.push(...(await expo.sendPushNotificationsAsync(lot)));
        }
        // Appareils désinscrits : leurs jetons ne servent plus
        const morts = tickets.map((t, i) => (t.status === "error" && t.details?.error === "DeviceNotRegistered" ? messages[i].to : null)).filter(Boolean);
        if (morts.length) await PushToken.destroy({ where: { token: morts } });
        return { envoyes: tickets.filter((t) => t.status === "ok").length, supprimes: morts.length };
    } catch (error) {
        console.error("[push] envoi impossible :", error.message);
        return { envoyes: 0, erreur: error.message };
    }
};
