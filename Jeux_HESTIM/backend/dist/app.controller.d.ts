import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    login(loginData: any): Promise<any>;
    register(userData: any): Promise<import("./user.entity").User>;
    getClasses(): Promise<import("./classe.entity").Classe[]>;
    getMatieresByClasse(classeId: number): Promise<import("./matiere.entity").Matiere[]>;
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
    createSession(sessionData: any): Promise<import("./session.entity").SessionPedagogique>;
    getSessions(): Promise<import("./session.entity").SessionPedagogique[]>;
    getParticipantDashboard(id: number): Promise<{
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
    getEnseignantDashboard(id: number): Promise<{
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
    getSession(id: number): Promise<{
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
    assignGroups(id: number, body: {
        assignments: {
            userId: number;
            groupeId: number;
        }[];
    }): Promise<{
        success: boolean;
    }>;
    removeFromGroup(id: number): Promise<{
        success: boolean;
    }>;
    updateProgression(id: number, progression: number): Promise<{
        success: boolean;
    }>;
    updateCommentaire(id: number, commentaire: string): Promise<{
        success: boolean;
    }>;
    getGroupes(): Promise<import("./groupe.entity").Groupe[]>;
    updateSession(id: number, sessionData: any): Promise<import("./session.entity").SessionPedagogique>;
    deleteSession(id: number): Promise<{
        message: string;
    }>;
    endSession(id: number): Promise<{
        success: boolean;
    }>;
    deleteUser(id: number): Promise<{
        message: string;
    }>;
    updateUser(id: number, data: any): Promise<{
        message: string;
    }>;
    autoAssigner(classeId: number): Promise<{
        message: string;
        nbGroupes: number;
    }>;
    getContext(userId: number): Promise<{
        nom: string;
        groupeId: number | null;
        groupe: string;
        membresDuGroupe: string[];
        progression: string;
        commentaireAnimateur: string;
    } | null>;
    getAnimateurSummary(classeId?: number): Promise<{
        id: number;
        nom: string;
        effectif: number;
        scoreMoyen: number;
        commentaire: string;
    }[]>;
    getAlertes(): Promise<string>;
    getReactikState(sessionId: number, groupeId: number): Promise<import("./reactik-state.entity").ReactikState>;
    updateReactikPhase(sessionId: number, groupeId: number, body: {
        phase: number;
        data?: any;
    }): Promise<import("./reactik-state.entity").ReactikState>;
}
//# sourceMappingURL=app.controller.d.ts.map