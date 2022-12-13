import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Bookmark } from './tweet-bookmark.entity';
import { Like } from './tweet-like.entity';

@Tree('materialized-path')
@Entity()
export class Tweet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  isComment: boolean;

  @Column({ default: '' })
  text: string;

  @Column('varchar', { array: true, nullable: true })
  imageNames: string[];

  @Column({ default: 0 })
  likesNumber: number;

  @Column({ default: false })
  isPrivate: boolean;

  @RelationId('author')
  authorId: string;

  @RelationId('parentAuthor')
  parentAuthorId: string;

  @RelationId('parentRecord')
  parentRecordId: string;

  @ManyToOne(() => Profile, (profile) => profile.tweets, {
    onDelete: 'SET NULL',
    nullable: false,
  })
  author: Profile;

  @OneToMany(() => Like, (like) => like.tweet, {
    // cascade: true,
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  likes: Like[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.tweet, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  bookmarks: Bookmark[];

  @ManyToOne(() => Profile, (profile) => profile.parentTweets, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  parentAuthor: Profile;

  @TreeChildren()
  replies: Tweet[];

  @TreeParent({ onDelete: 'CASCADE' })
  parentRecord: Tweet;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
