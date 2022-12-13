import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VirtualColumn } from '../../common/decorators';
import { Bookmark } from '../../tweet/entities/tweet-bookmark.entity';
import { Like } from '../../tweet/entities/tweet-like.entity';
import { Tweet } from '../../tweet/entities/tweet.entity';
import { User } from '../../user/entities/user.entity';
import { Following } from './following.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  description: string;

  @Column({ unique: true })
  userId: number;

  @VirtualColumn()
  numberOfFollowers: number;

  @VirtualColumn()
  numberOfFollowings: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Tweet, (tweet) => tweet.author)
  tweets: Tweet[];

  @OneToMany(() => Tweet, (tweet) => tweet.parentAuthor)
  parentTweets: Tweet[];

  @OneToMany(() => Like, (like) => like.profile, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  likedRecords: Like[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.profile, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  bookmarkRecords: Bookmark[];

  @OneToMany(() => Following, (f) => f.follower, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  followers: Following[];

  @OneToMany(() => Following, (f) => f.following, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  followings: Following[];
}
