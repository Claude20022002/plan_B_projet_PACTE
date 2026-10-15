import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getContext(userId: number): Promise<{
        nom: string;
        groupe: string;
        membresDuGroupe: string[];
        progression: string;
    } | null>;
    getAnimateurSummary(): Promise<{
        nom: string;
        effectif: number;
        scoreMoyen: number;
    }[]>;
    getAlertes(): Promise<string>;
}
//# sourceMappingURL=chat.controller.d.ts.map