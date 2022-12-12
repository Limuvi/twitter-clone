import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class Following {
  @PrimaryColumn()
  followerId: string;

  @PrimaryColumn()
  followingId: string;

  @ManyToOne(() => Profile, (p) => p.followers, {
    cascade: true,
  })
  follower: Profile;

  @ManyToOne(() => Profile, (p) => p.followings, {
    cascade: true,
  })
  following: Profile;
}
