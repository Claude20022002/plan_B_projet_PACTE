import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';
import { SessionPedagogique } from './session.entity';
import { ReactikState } from './reactik-state.entity';
import { AppGateway } from './app.gateway';
export declare class AppService {
    private usersRepository;
    private classesRepository;
    private matieresRepository;
    private groupesRepository;
    private sessionsRepository;
    private reactikRepository;
    private appGateway;
    constructor(usersRepository: Repository<User>, classesRepository: Repository<Classe>, matieresRepository: Repository<Matiere>, groupesRepository: Repository<Groupe>, sessionsRepository: Repository<SessionPedagogique>, reactikRepository: Repository<ReactikState>, appGateway: AppGateway);
    login(loginData: any): Promise<any>;
    register(userData: any): Promise<User>;
    getClasses(): Promise<Classe[]>;
    getMatieresByClasse(classeId: number): Promise<Matiere[]>;
    getAdminDashboard(): Promise<{
        totalParticipants: number;
        totalEnseignants: number;
        totalAdministrateurs: number;
        totalSessions: number;
        classes: {
            id: number;
            nom: string;
            nombreParticipants: number;
            participants: {
                id: number;
                nom: string;
                prenom: string;
                email: string;
                role: string;
                statut: string;
                matiere: string;
                groupe: string;
            }[];
        }[];
        enseignants: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            statut: string;
            classeId: number;
            classe: string;
            matiere: string;
        }[];
        administrateurs: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            statut: string;
        }[];
        sessions: {
            id: number;
            titre: string;
            dateDebut: string;
            dateFin: string;
            statut: string;
            description: string;
            classeId: number;
            classe: string;
            enseignantId: number;
            enseignant: string;
            participantIds: number[];
            nombreParticipants: number;
        }[];
    }>;
    createSession(data: any): Promise<SessionPedagogique>;
    getSessions(): Promise<SessionPedagogique[]>;
    getParticipantDashboard(participantId: number): Promise<{
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            classe: string;
            matiere: string;
            groupe: string;
            commentaireAnimateur: string;
        };
        sessions: {
            id: number;
            titre: string;
            dateDebut: string;
            dateFin: string;
            statut: string;
            enseignant: string;
            jeu: string;
        }[];
    }>;
    getEnseignantDashboard(enseignantId: number): Promise<{
        user: {
            id: number;
            nom: string;
            prenom: string;
            classeId: number;
            classeNom: string;
        };
        sessions: {
            id: number;
            titre: string;
            dateDebut: string;
            dateFin: string;
            statut: string;
            classe: string;
            jeu: string;
            nombreParticipants: number;
        }[];
    }>;
    getSessionDetails(id: number): Promise<{
        id: number;
        titre: string;
        jeu: string;
        statut: string;
        classe: string;
        participants: {
            id: number;
            nom: string;
            prenom: string;
            groupeId: number | null;
            groupeNom: string;
            score: number;
        }[];
    }>;
    getGroupes(): Promise<Groupe[]>;
    updateGroupeProgression(id: number, progression: number): Promise<{
        success: boolean;
    }>;
    updateGroupeCommentaire(id: number, commentaire: string): Promise<{
        success: boolean;
    }>;
    assignGroupsToSessionParticipants(assignments: {
        userId: number;
        groupeId: number;
    }[]): Promise<{
        success: boolean;
    }>;
    removeUserFromGroup(userId: number): Promise<{
        success: boolean;
    }>;
    updateSession(id: number, data: any): Promise<SessionPedagogique>;
    endSession(id: number): Promise<{
        success: boolean;
    }>;
    deleteSession(id: number): Promise<{
        message: string;
    }>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
    updateUser(id: number, data: any): Promise<{
        message: string;
    }>;
    autoAssignerGroupes(classeId: number): Promise<{
        message: string;
        nbGroupes: number;
    }>;
    getAnimateurSummary(classeId?: number): Promise<{
        id: number;
        nom: string;
        effectif: number;
        scoreMoyen: number;
        commentaire: string;
    }[]>;
    getAlertesAnimateur(): Promise<string>;
    getContextForUser(userId: number): Promise<{
        nom: string;
        groupeId: number | null;
        groupe: string;
        membresDuGroupe: string[];
        progression: string;
        commentaireAnimateur: string;
    } | null>;
    getReactikState(sessionId: number, groupeId: number): Promise<ReactikState>;
    updateReactikPhase(sessionId: number, groupeId: number, phase: number, data?: any): Promise<ReactikState>;
    getHello(): string;
}
//# sourceMappingURL=app.service.d.ts.map