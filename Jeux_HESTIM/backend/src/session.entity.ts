import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Classe } from './classe.entity';
import { User } from './user.entity';

@Entity()
export class SessionPedagogique {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  titre!: string;

  @Column({ type: 'date', nullable: true })
  dateDebut!: string;

  @Column({ type: 'date', nullable: true })
  dateFin!: string;

  @Column({ nullable: true })
  jeu!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 'Brouillon' })
  statut!: string;

  @Column({ nullable: true })
  duree!: string;

  @ManyToOne(() => Classe, { nullable: false })
  classe!: Classe;

  @ManyToOne(() => User, { nullable: false })
  enseignant!: User;

  @ManyToMany(() => User)
  @JoinTable()
  participants!: User[];
}
