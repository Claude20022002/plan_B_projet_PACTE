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

/**
 * Envoie un email de confirmation de report à l'enseignant
 * @param {Object} options - Options
 * @param {string} options.to - Email du destinataire (enseignant)
 * @param {Object} options.demande - Données de la demande
 * @param {Object} options.affectation - Données de l'affectation mise à jour
 * @returns {Promise<Object>}
 */
export const sendReportConfirmation = async ({ to, demande, affectation }) => {
    const subject = "Demande de report approuvée";
    const text = `
Bonjour,

Votre demande de report a été approuvée.

Détails :
- Ancienne date : ${affectation.date_seance}
- Nouvelle date : ${demande.nouvelle_date}
- Cours : ${affectation.cours?.nom_cours || "N/A"}
- Groupe : ${affectation.groupe?.nom_groupe || "N/A"}
- Salle : ${affectation.salle?.nom_salle || "N/A"}

La séance a été reportée avec succès. Les étudiants ont été notifiés de l'annulation de l'ancienne séance.

Cordialement,
HESTIM Planner
    `;

    return await sendEmail({ to, subject, text });
};

/**
 * Envoie un email de report de séance aux étudiants
 * @param {Object} options
 * @param {string} options.to - Email de l'étudiant
 * @param {Object} options.affectation - Affectation (avec ancienne date)
 * @param {string} options.nouvelle_date - Nouvelle date
 */
export const sendAnnulationSeance = async ({ to, affectation, nouvelle_date }) => {
    const coursNom    = affectation.cours?.nom_cours       || 'N/A';
    const groupeNom   = affectation.groupe?.nom_groupe     || 'N/A';
    const salleNom    = affectation.salle?.nom_salle       || 'N/A';
    const ensNom      = `${affectation.enseignant?.prenom || ''} ${affectation.enseignant?.nom || ''}`.trim() || 'N/A';
    const ancienneDate = new Date(affectation.date_seance).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const nouvelleDate = new Date(nouvelle_date).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const subject = `⚠️ Séance reportée — ${coursNom}`;

    const text = `
Bonjour,

La séance de cours suivante a été reportée à une nouvelle date.

Cours     : ${coursNom}
Groupe    : ${groupeNom}
Enseignant: ${ensNom}
Salle     : ${salleNom}

Ancienne date : ${ancienneDate}
Nouvelle date : ${nouvelleDate}

Veuillez consulter votre emploi du temps pour les détails complets.

Cordialement,
HESTIM Planner
    `;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
    .wrap{max-width:600px;margin:0 auto;padding:20px}
    .header{background:#ED7D31;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center}
    .header h2{margin:0;font-size:20px}
    .body{background:#fff8f5;padding:24px;border:1px solid #f0c6a0;border-top:none}
    .badge{display:inline-block;background:#ED7D31;color:white;padding:4px 12px;border-radius:12px;font-size:13px;margin-bottom:16px}
    .dates{display:flex;gap:16px;margin:16px 0}
    .date-box{flex:1;padding:12px;border-radius:6px;text-align:center}
    .date-old{background:#fef2f2;border:1px solid #fca5a5}
    .date-new{background:#f0fdf4;border:1px solid #86efac}
    .date-label{font-size:11px;text-transform:uppercase;font-weight:bold;color:#888;margin-bottom:4px}
    .date-value{font-size:14px;font-weight:bold}
    .date-old .date-value{color:#dc2626}
    .date-new .date-value{color:#16a34a}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    td{padding:8px 12px;border-bottom:1px solid #f3e4d6;font-size:14px}
    td:first-child{font-weight:bold;color:#555;width:40%}
    .footer{text-align:center;padding:16px;color:#999;font-size:12px;background:#f9f9f9;border:1px solid #f0c6a0;border-top:none;border-radius:0 0 8px 8px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h2>⚠️ Séance Reportée</h2>
    </div>
    <div class="body">
      <p>Bonjour,</p>
      <p>La séance de cours suivante a été <strong>reportée</strong> à une nouvelle date :</p>
      <span class="badge">Avis de report</span>
      <table>
        <tr><td>Cours</td><td>${coursNom}</td></tr>
        <tr><td>Groupe</td><td>${groupeNom}</td></tr>
        <tr><td>Enseignant</td><td>${ensNom}</td></tr>
        <tr><td>Salle</td><td>${salleNom}</td></tr>
      </table>
      <div class="dates">
        <div class="date-box date-old">
          <div class="date-label">Ancienne date</div>
          <div class="date-value">${ancienneDate}</div>
        </div>
        <div class="date-box date-new">
          <div class="date-label">Nouvelle date</div>
          <div class="date-value">${nouvelleDate}</div>
        </div>
      </div>
      <p style="font-size:13px;color:#666">Veuillez consulter votre emploi du temps sur HESTIM Planner pour confirmer les détails.</p>
    </div>
    <div class="footer">HESTIM Planner — Système de gestion des plannings</div>
  </div>
</body>
</html>
    `;

    return await sendEmail({ to, subject, text, html });
};