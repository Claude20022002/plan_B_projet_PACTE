import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SessionPedagogique } from './session.entity';
import { Groupe } from './groupe.entity';

@Entity()
export class ReactikState {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SessionPedagogique, { onDelete: 'CASCADE' })
  session!: SessionPedagogique;

  @ManyToOne(() => Groupe)
  groupe!: Groupe;

  @Column({ default: 0 })
  phase!: number;

  @Column({ type: 'text', nullable: true })
  fluxData!: string;

  @Column({ type: 'float', default: 15 })
  delais!: number;

  @Column({ type: 'float', default: 500 })
  stocks!: number;

  @Column({ type: 'float', default: 0 })
  partsDeMarche!: number;

  @Column({ type: 'text', nullable: true })
  paysConquis!: string;
}
