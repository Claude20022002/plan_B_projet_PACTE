import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Groupe {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @Column({ default: 0 })
  progression!: number;

  @Column({ type: 'text', nullable: true })
  commentaireAnimateur!: string;

  @Column({ nullable: true })
  entreprise!: string;

  @OneToMany(() => User, (user) => user.groupe)
  participants!: User[];
}
