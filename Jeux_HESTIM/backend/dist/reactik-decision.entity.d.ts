import { SessionPedagogique } from './session.entity';
import { Groupe } from './groupe.entity';
export declare class ReactikDecision {
    id: number;
    session: SessionPedagogique;
    groupe: Groupe;
    roundNumber: number;
    prixVente: number;
    quantiteProduite: number;
    investissementMarketing: number;
    ventesRealisees: number;
    resultatProfit: number;
    partDeMarche: number;
    createdAt: Date;
}
//# sourceMappingURL=reactik-decision.entity.d.ts.map