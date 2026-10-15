"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const classe_entity_1 = require("./classe.entity");
const matiere_entity_1 = require("./matiere.entity");
const groupe_entity_1 = require("./groupe.entity");
const session_entity_1 = require("./session.entity");
const reactik_state_entity_1 = require("./reactik-state.entity");
const bcrypt = __importStar(require("bcrypt"));
const app_gateway_1 = require("./app.gateway");
let AppService = class AppService {
    constructor(usersRepository, classesRepository, matieresRepository, groupesRepository, sessionsRepository, reactikRepository, appGateway) {
        this.usersRepository = usersRepository;
        this.classesRepository = classesRepository;
        this.matieresRepository = matieresRepository;
        this.groupesRepository = groupesRepository;
        this.sessionsRepository = sessionsRepository;
        this.reactikRepository = reactikRepository;
        this.appGateway = appGateway;
    }
    async login(loginData) {
        const user = await this.usersRepository.findOne({ where: { email: loginData.email } });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        const isMatch = await bcrypt.compare(loginData.password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Mot de passe incorrect');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom,
        };
    }
    async register(userData) {
        if (userData.role === 'Administrateur') {
            const adminCount = await this.usersRepository.count({ where: { role: 'Administrateur' } });
            if (adminCount >= 5) {
                throw new Error('La limite maximale de 5 administrateurs est atteinte.');
            }
        }
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(userData.password, salt);
        const newUser = this.usersRepository.create({
            nom: userData.nom,
            prenom: userData.prenom,
            email: userData.email,
            passwordHash: hash,
            role: userData.role || 'Participant',
            statut: 'Validé',
            classe: userData.classeId ? { id: Number(userData.classeId) } : undefined,
            matiere: userData.matiereId ? { id: Number(userData.matiereId) } : undefined,
        });
        const savedUser = await this.usersRepository.save(newUser);
        return savedUser;
    }
    async getClasses() {
        return await this.classesRepository.find({ order: { id: 'ASC' } });
    }
    async getMatieresByClasse(classeId) {
        return await this.matieresRepository.find({
            where: { classe: { id: Number(classeId) } },
            relations: ['classe'],
        });
    }
    async getAdminDashboard() {
        const classes = await this.classesRepository.find({
            relations: ['participants', 'participants.matiere', 'participants.groupe'],
            order: { id: 'ASC' },
        });
        const enseignants = await this.usersRepository.find({
            where: { role: 'Enseignant' },
            relations: ['classe', 'matiere'],
            order: { nom: 'ASC', prenom: 'ASC' },
        });
        const administrateurs = await this.usersRepository.find({
            where: { role: 'Administrateur' },
            order: { nom: 'ASC', prenom: 'ASC' },
        });
        const sessions = await this.sessionsRepository.find({
            relations: ['classe', 'enseignant', 'participants'],
            order: { dateDebut: 'DESC', id: 'DESC' },
        });
        const classesAvecParticipants = classes.map((classe) => {
            const participants = (classe.participants || []).filter((user) => user.role === 'Participant');
            return {
                id: classe.id,
                nom: classe.nom,
                nombreParticipants: participants.length,
                participants: participants.map((participant) => ({
                    id: participant.id,
                    nom: participant.nom,
                    prenom: participant.prenom,
                    email: participant.email,
                    role: participant.role,
                    statut: participant.statut,
                    matiere: participant.matiere?.nom || 'Non définie',
                    groupe: participant.groupe?.nom || 'Aucun groupe',
                })),
            };
        });
        return {
            totalParticipants: classesAvecParticipants.reduce((total, classe) => total + classe.nombreParticipants, 0),
            totalEnseignants: enseignants.length,
            totalAdministrateurs: administrateurs.length,
            totalSessions: sessions.length,
            classes: classesAvecParticipants,
            enseignants: enseignants.map((enseignant) => ({
                id: enseignant.id,
                nom: enseignant.nom,
                prenom: enseignant.prenom,
                email: enseignant.email,
                role: enseignant.role,
                statut: enseignant.statut,
                classeId: enseignant.classe?.id,
                classe: enseignant.classe?.nom || 'Non définie',
                matiere: enseignant.matiere?.nom || 'Non définie',
            })),
            administrateurs: administrateurs.map((administrateur) => ({
                id: administrateur.id,
                nom: administrateur.nom,
                prenom: administrateur.prenom,
                email: administrateur.email,
                role: administrateur.role,
                statut: administrateur.statut,
            })),
            sessions: sessions.map((session) => ({
                id: session.id,
                titre: session.titre,
                dateDebut: session.dateDebut,
                dateFin: session.dateFin,
                statut: session.statut || 'Ouverte',
                description: session.description,
                classeId: session.classe?.id,
                classe: session.classe?.nom || 'Non définie',
                enseignantId: session.enseignant?.id,
                enseignant: session.enseignant ? `${session.enseignant.nom} ${session.enseignant.prenom}` : 'Non défini',
                participantIds: session.participants?.map((participant) => participant.id) || [],
                nombreParticipants: session.participants?.length || 0,
            })),
        };
    }
    async createSession(data) {
        const classeId = Number(data.classeId);
        const enseignantId = Number(data.enseignantId);
        const classe = await this.classesRepository.findOne({ where: { id: classeId } });
        if (!classe) {
            throw new Error('Classe introuvable');
        }
        const enseignant = await this.usersRepository.findOne({ where: { id: enseignantId, role: 'Enseignant' } });
        if (!enseignant) {
            throw new Error('Enseignant introuvable');
        }
        let participants = [];
        if (Array.isArray(data.participantIds) && data.participantIds.length > 0) {
            participants = await this.usersRepository.find({
                where: {
                    id: (0, typeorm_2.In)(data.participantIds.map((id) => Number(id))),
                    role: 'Participant',
                },
            });
        }
        else {
            participants = await this.usersRepository.find({
                where: {
                    classe: { id: classeId },
                    role: 'Participant',
                },
            });
        }
        const session = this.sessionsRepository.create({
            titre: data.titre || 'Nouvelle session pédagogique',
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            description: data.description || '',
            classe,
            enseignant,
            participants,
        });
        const savedSession = await this.sessionsRepository.save(session);
        // Notification temps réel à l'enseignant
        this.appGateway.notifyNewSession(enseignantId, {
            id: savedSession.id,
            titre: savedSession.titre,
            dateDebut: savedSession.dateDebut,
            dateFin: savedSession.dateFin,
        });
        return savedSession;
    }
    async getSessions() {
        return await this.sessionsRepository.find({
            relations: ['classe', 'enseignant', 'participants'],
            order: { dateDebut: 'DESC', id: 'DESC' },
        });
    }
    async getParticipantDashboard(participantId) {
        const user = await this.usersRepository.findOne({
            where: { id: Number(participantId) },
            relations: ['classe', 'matiere', 'groupe'],
        });
        if (!user) {
            throw new Error('Participant non trouvé');
        }
        const sessions = await this.sessionsRepository.find({
            where: { participants: { id: Number(participantId) } },
            relations: ['classe', 'enseignant'],
            order: { dateDebut: 'DESC' },
        });
        return {
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                classe: user.classe?.nom || 'Non définie',
                matiere: user.matiere?.nom || 'Non définie',
                groupe: user.groupe?.nom || 'Aucun groupe',
                commentaireAnimateur: user.groupe?.commentaireAnimateur || '',
            },
            sessions: sessions.map((s) => ({
                id: s.id,
                titre: s.titre,
                dateDebut: s.dateDebut,
                dateFin: s.dateFin,
                statut: s.statut || 'Ouverte',
                enseignant: s.enseignant ? `${s.enseignant.nom} ${s.enseignant.prenom}` : 'Non défini',
                jeu: s.description || 'Jeu pédagogique',
            })),
        };
    }
    async getEnseignantDashboard(enseignantId) {
        const user = await this.usersRepository.findOne({
            where: { id: Number(enseignantId) },
            relations: ['classe'],
        });
        if (!user) {
            throw new Error('Enseignant non trouvé');
        }
        const sessions = await this.sessionsRepository.find({
            where: { enseignant: { id: Number(enseignantId) } },
            relations: ['classe', 'participants'],
            order: { dateDebut: 'DESC' },
        });
        return {
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                classeId: user.classe?.id,
                classeNom: user.classe?.nom,
            },
            sessions: sessions.map((s) => ({
                id: s.id,
                titre: s.titre,
                dateDebut: s.dateDebut,
                dateFin: s.dateFin,
                statut: s.statut || 'Ouverte',
                classe: s.classe?.nom || 'Non définie',
                jeu: s.description || 'Jeu pédagogique',
                nombreParticipants: s.participants?.length || 0,
            })),
        };
    }
    async getSessionDetails(id) {
        const session = await this.sessionsRepository.findOne({
            where: { id: Number(id) },
            relations: ['classe', 'enseignant', 'participants', 'participants.groupe'],
        });
        if (!session) {
            throw new Error('Session introuvable');
        }
        return {
            id: session.id,
            titre: session.titre,
            jeu: session.jeu || 'Jeu pédagogique',
            statut: session.statut || 'Ouverte',
            classe: session.classe?.nom,
            participants: session.participants.map(p => ({
                id: p.id,
                nom: p.nom,
                prenom: p.prenom,
                groupeId: p.groupe?.id || null,
                groupeNom: p.groupe?.nom || 'Aucun',
                score: p.groupe?.progression || 0
            }))
        };
    }
    async getGroupes() {
        return await this.groupesRepository.find({ order: { nom: 'ASC' } });
    }
    async updateGroupeProgression(id, progression) {
        await this.groupesRepository.update(id, { progression });
        // Notification temps réel à tous les participants du groupe
        const groupe = await this.groupesRepository.findOne({
            where: { id: Number(id) },
            relations: ['participants']
        });
        if (groupe) {
            groupe.participants.forEach(p => {
                this.appGateway.server.to(`user_${p.id}`).emit('progression_updated', { progression });
            });
        }
        return { success: true };
    }
    async updateGroupeCommentaire(id, commentaire) {
        await this.groupesRepository.update(id, { commentaireAnimateur: commentaire });
        const groupe = await this.groupesRepository.findOne({
            where: { id: Number(id) },
            relations: ['participants']
        });
        if (groupe) {
            groupe.participants.forEach(p => {
                this.appGateway.server.to(`user_${p.id}`).emit('comment_updated', { commentaire });
            });
        }
        return { success: true };
    }
    async assignGroupsToSessionParticipants(assignments) {
        for (const assignment of assignments) {
            await this.usersRepository.update(assignment.userId, {
                groupe: { id: assignment.groupeId }
            });
            // Notification temps réel à chaque étudiant
            this.appGateway.notifyGroupAssignment(assignment.userId, {
                groupeId: assignment.groupeId
            });
        }
        return { success: true };
    }
    async removeUserFromGroup(userId) {
        await this.usersRepository.update(userId, {
            groupe: null
        });
        // Notification temps réel à l'étudiant
        this.appGateway.notifyGroupAssignment(userId, {
            groupeId: null
        });
        return { success: true };
    }
    async updateSession(id, data) {
        const session = await this.sessionsRepository.findOne({
            where: { id: Number(id) },
            relations: ['classe', 'enseignant', 'participants'],
        });
        if (!session) {
            throw new Error('Session introuvable');
        }
        const classeId = Number(data.classeId);
        const enseignantId = Number(data.enseignantId);
        const classe = await this.classesRepository.findOne({ where: { id: classeId } });
        if (!classe) {
            throw new Error('Classe introuvable');
        }
        const enseignant = await this.usersRepository.findOne({ where: { id: enseignantId, role: 'Enseignant' } });
        if (!enseignant) {
            throw new Error('Enseignant introuvable');
        }
        let participants = [];
        if (Array.isArray(data.participantIds) && data.participantIds.length > 0) {
            participants = await this.usersRepository.find({
                where: {
                    id: (0, typeorm_2.In)(data.participantIds.map((participantId) => Number(participantId))),
                    role: 'Participant',
                },
            });
        }
        session.titre = data.titre || session.titre;
        session.dateDebut = data.dateDebut || session.dateDebut;
        session.dateFin = data.dateFin || session.dateFin;
        session.description = data.description || '';
        session.classe = classe;
        session.enseignant = enseignant;
        session.participants = participants;
        return await this.sessionsRepository.save(session);
    }
    async endSession(id) {
        const session = await this.sessionsRepository.findOne({ where: { id: Number(id) } });
        if (!session)
            throw new Error('Session introuvable');
        session.statut = 'Terminée';
        await this.sessionsRepository.save(session);
        this.appGateway.server.emit('session_ended', { sessionId: id });
        return { success: true };
    }
    async deleteSession(id) {
        const session = await this.sessionsRepository.findOne({
            where: { id: Number(id) },
            relations: ['participants'],
        });
        if (!session) {
            throw new Error('Session introuvable');
        }
        if (session.participants && session.participants.length > 0) {
            for (const participant of session.participants) {
                await this.usersRepository.update(participant.id, { groupe: null });
                this.appGateway.notifyGroupAssignment(participant.id, { groupeId: null });
            }
        }
        await this.sessionsRepository.remove(session);
        return { message: 'Session supprimée avec succès' };
    }
    async deleteUser(id) {
        const user = await this.usersRepository.findOne({ where: { id: Number(id) } });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        if (user.id === 1) {
            throw new Error('Impossible de supprimer l’administrateur principal.');
        }
        await this.usersRepository.remove(user);
        return { message: 'Utilisateur supprimé avec succès' };
    }
    async updateUser(id, data) {
        const user = await this.usersRepository.findOne({ where: { id: Number(id) } });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        user.nom = data.nom || user.nom;
        user.prenom = data.prenom || user.prenom;
        user.email = data.email || user.email;
        if (data.classeId) {
            user.classe = { id: Number(data.classeId) };
        }
        if (data.password) {
            const salt = await bcrypt.genSalt();
            user.passwordHash = await bcrypt.hash(data.password, salt);
        }
        await this.usersRepository.save(user);
        return { message: 'Utilisateur mis à jour avec succès' };
    }
    async autoAssignerGroupes(classeId) {
        const etudiants = await this.usersRepository.find({
            where: { classe: { id: Number(classeId) }, role: 'Participant' },
        });
        const nbParticipants = etudiants.length;
        if (nbParticipants < 6) {
            throw new Error(`Nombre de participants insuffisant (${nbParticipants}). Le jeu nécessite au moins 6 personnes.`);
        }
        let nbGroupesCibles = 4;
        if (nbParticipants <= 9) {
            nbGroupesCibles = 3;
        }
        const groupes = await this.groupesRepository.find({
            order: { id: 'ASC' },
            take: nbGroupesCibles
        });
        for (let i = 0; i < etudiants.length; i++) {
            const groupe = groupes[i % nbGroupesCibles];
            await this.usersRepository.update(etudiants[i].id, {
                groupe: { id: groupe.id },
            });
            this.appGateway.notifyGroupAssignment(etudiants[i].id, {
                groupeId: groupe.id
            });
        }
        return {
            message: `Répartition effectuée : ${nbParticipants} élèves répartis sur ${nbGroupesCibles} entreprises.`,
            nbGroupes: nbGroupesCibles
        };
    }
    async getAnimateurSummary(classeId) {
        const groupes = await this.groupesRepository.find({ relations: ['participants', 'participants.classe'] });
        return groupes.map((g) => {
            const participantsFiltrés = classeId
                ? g.participants.filter(p => p.classe?.id === Number(classeId))
                : g.participants;
            return {
                id: g.id,
                nom: g.nom,
                effectif: participantsFiltrés.length,
                scoreMoyen: g.progression,
                commentaire: g.commentaireAnimateur || '',
            };
        });
    }
    async getAlertesAnimateur() {
        return 'Système : Tous les groupes sont actifs. Aucune alerte critique pour le moment.';
    }
    async getContextForUser(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: Number(userId) },
            relations: ['groupe', 'groupe.participants'],
        });
        if (!user)
            return null;
        const groupe = user.groupe;
        const membres = groupe ? groupe.participants.map((p) => p.nom + ' ' + p.prenom) : [];
        return {
            nom: user.nom,
            groupeId: groupe ? groupe.id : null,
            groupe: groupe ? groupe.nom : 'Aucun',
            membresDuGroupe: membres,
            progression: groupe ? `${groupe.progression}%` : '0%',
            commentaireAnimateur: groupe?.commentaireAnimateur || '',
        };
    }
    async getReactikState(sessionId, groupeId) {
        let state = await this.reactikRepository.findOne({
            where: { session: { id: sessionId }, groupe: { id: groupeId } },
            relations: ['groupe']
        });
        if (!state) {
            state = this.reactikRepository.create({
                session: { id: sessionId },
                groupe: { id: groupeId },
                phase: 0,
                delais: 15,
                stocks: 500,
                partsDeMarche: 0,
                paysConquis: '[]'
            });
            await this.reactikRepository.save(state);
        }
        return state;
    }
    async updateReactikPhase(sessionId, groupeId, phase, data) {
        const state = await this.getReactikState(sessionId, groupeId);
        state.phase = phase;
        if (data) {
            if (data.fluxData)
                state.fluxData = JSON.stringify(data.fluxData);
            if (data.delais !== undefined)
                state.delais = data.delais;
            if (data.stocks !== undefined)
                state.stocks = data.stocks;
            if (data.partsDeMarche !== undefined)
                state.partsDeMarche = data.partsDeMarche;
            if (data.paysConquis)
                state.paysConquis = JSON.stringify(data.paysConquis);
        }
        await this.reactikRepository.save(state);
        this.appGateway.server.to(`user_group_${groupeId}`).emit('reactik_state_updated', state);
        return state;
    }
    getHello() {
        return 'Plateforme Jeux Pédagogiques HESTIM API est en ligne !';
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(classe_entity_1.Classe)),
    __param(2, (0, typeorm_1.InjectRepository)(matiere_entity_1.Matiere)),
    __param(3, (0, typeorm_1.InjectRepository)(groupe_entity_1.Groupe)),
    __param(4, (0, typeorm_1.InjectRepository)(session_entity_1.SessionPedagogique)),
    __param(5, (0, typeorm_1.InjectRepository)(reactik_state_entity_1.ReactikState)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        app_gateway_1.AppGateway])
], AppService);
//# sourceMappingURL=app.service.js.map