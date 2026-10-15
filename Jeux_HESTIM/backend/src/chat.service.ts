import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Groupe } from './groupe.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Groupe)
    private groupesRepository: Repository<Groupe>,
  ) {}

  // Récupère toutes les infos nécessaires pour nourrir le chatbot
  async getContextForUser(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['groupe', 'groupe.participants'],
    });

    if (!user) return null;

    const groupe = user.groupe;
    const membres = groupe ? groupe.participants.map(p => p.nom + ' ' + p.prenom) : [];
    
    return {
      nom: user.nom,
      groupe: groupe ? groupe.nom : 'Aucun',
      membresDuGroupe: membres,
      progression: '45%', // Simulation
    };
  }

  // Assistant pour l'animateur : Synthèse globale
  async getAnimateurSummary() {
    const groupes = await this.groupesRepository.find({ relations: ['participants'] });
    
    return groupes.map(g => ({
      nom: g.nom,
      effectif: g.participants.length,
      scoreMoyen: g.participants.length > 0 
        ? g.participants.reduce((acc, p: any) => acc + (p.score || 0), 0) / g.participants.length 
        : 0
    }));
  }

  // Assistant pour l'animateur : Alertes groupes
  async getAlertesAnimateur() {
    return "Système : Tous les groupes sont actifs. Aucune alerte critique pour le moment.";
  }
}
