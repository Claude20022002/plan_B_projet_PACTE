import dotenv from "dotenv";

dotenv.config();

/**
 * Configuration du transporteur d'email
 * Note: En production, installez nodemailer: npm install nodemailer
 * et configurez ces variables dans votre .env
 */
const createTransporter = async () => {
    try {
        // Import dynamique de nodemailer (optionnel)
        const nodemailer = await import("nodemailer").then((m) => m.default);

        // Configuration pour Gmail (exemple)
        if (process.env.EMAIL_SERVICE === "gmail") {
            return nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        }

        // Configuration SMTP générique
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour autres ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } catch (error) {
        // nodemailer n'est pas installé
        return null;
    }
};

/**
 * Envoie un email
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.text - Corps du message (texte)
 * @param {string} options.html - Corps du message (HTML, optionnel)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // Si l'envoi d'email n'est pas configuré, logger seulement
        if (!process.env.EMAIL_USER && !process.env.SMTP_USER) {
            console.log("📧 Email (mode développement):", {
                to,
                subject,
                text,
            });
            return {
                success: true,
                message: "Email logué (mode développement)",
            };
        }

        const transporter = await createTransporter();

        // Si nodemailer n'est pas installé, logger seulement
        if (!transporter) {
            console.log("📧 Email (nodemailer non installé):", {
                to,
                subject,
                text,
            });
            return {
                success: true,
                message: "Email logué (nodemailer non installé)",
            };
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: html || text,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email envoyé:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email:", error);
        throw error;
    }
};

/**
 * Envoie un email de notification de nouvelle affectation
 * @param {Object} options - Options
 * @param {string} options.to - Email du destinataire
 * @param {Object} options.affectation - Données de l'affectation
 * @returns {Promise<Object>}
 */
export const sendAffectationNotification = async ({ to, affectation }) => {
    const subject = "Nouvelle affectation de cours";
    const text = `
Bonjour,

Une nouvelle affectation de cours a été créée pour vous.

Détails :
- Date : ${affectation.date_seance}
- Cours : ${affectation.cours?.nom_cours || "N/A"}
- Groupe : ${affectation.groupe?.nom_groupe || "N/A"}
- Salle : ${affectation.salle?.nom_salle || "N/A"}
- Créneau : ${affectation.creneau?.jour_semaine} de ${
        affectation.creneau?.heure_debut
    } à ${affectation.creneau?.heure_fin}

Cordialement,
HESTIM Planner
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nouvelle Affectation de Cours</h1>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            <p>Une nouvelle affectation de cours a été créée pour vous.</p>
            <div class="details">
                <p><strong>Date :</strong> ${affectation.date_seance}</p>
                <p><strong>Cours :</strong> ${
                    affectation.cours?.nom_cours || "N/A"
                }</p>
                <p><strong>Groupe :</strong> ${
                    affectation.groupe?.nom_groupe || "N/A"
                }</p>
                <p><strong>Salle :</strong> ${
                    affectation.salle?.nom_salle || "N/A"
                }</p>
                <p><strong>Créneau :</strong> ${
                    affectation.creneau?.jour_semaine
                } de ${affectation.creneau?.heure_debut} à ${
        affectation.creneau?.heure_fin
    }</p>
            </div>
        </div>
        <div class="footer">
            <p>Cordialement,<br>HESTIM Planner</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail({ to, subject, text, html });
};

/**
 * Envoie un email de notification de conflit
 * @param {Object} options - Options
 * @param {string} options.to - Email du destinataire
 * @param {Object} options.conflit - Données du conflit
 * @returns {Promise<Object>}
 */
export const sendConflitNotification = async ({ to, conflit }) => {
    const subject = "⚠️ Conflit d'horaires détecté";
    const text = `
Bonjour,

Un conflit d'horaires a été détecté dans votre planning.

Type de conflit : ${conflit.type_conflit}
Description : ${conflit.description}

Veuillez contacter l'administration pour résoudre ce conflit.

Cordialement,
HESTIM Planner
    `;

    return await sendEmail({ to, subject, text });
};

/**
 * Envoie un email de notification de demande de report
 * @param {Object} options - Options
 * @param {string} options.to - Email du destinataire (admin)
 * @param {Object} options.demande - Données de la demande
 * @returns {Promise<Object>}
 */
export const sendDemandeReportNotification = async ({ to, demande }) => {
    const subject = "Nouvelle demande de report";
    const text = `
Bonjour,

Une nouvelle demande de report a été soumise.

Détails :
- Enseignant : ${demande.enseignant?.nom || "N/A"} ${
        demande.enseignant?.prenom || ""
    }
- Motif : ${demande.motif}
- Nouvelle date proposée : ${demande.nouvelle_date}
- Statut : ${demande.statut_demande}

Veuillez traiter cette demande.

Cordialement,
HESTIM Planner
    `;

    return await sendEmail({ to, subject, text });
};
