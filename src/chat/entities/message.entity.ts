import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Chat } from './chat.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @ManyToOne(() => Profile, (p) => p.messages)
  profile: Profile;

  @ManyToOne(() => Chat, (c) => c.messages)
  chat: Chat;

  @CreateDateColumn()
  createdAt: Date;
}
