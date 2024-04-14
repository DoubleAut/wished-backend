import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Wish } from '../../wishes/entities/wish.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column()
    surname: string;

    @Column({ nullable: true })
    picture: string;

    @Column({ default: false })
    isActive: boolean;

    @OneToMany(() => Wish, (wish) => wish.owner)
    wishes: Wish[];

    @OneToMany(() => Wish, (wish) => wish.reservedBy)
    reservations: Wish[];

    @ManyToMany(() => User, (user) => user.id)
    @JoinTable({
        name: 'user_followings',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'friend_id', referencedColumnName: 'id' },
    })
    followings: User[];

    @ManyToMany(() => User, (user) => user.id)
    @JoinTable({
        name: 'user_followers',
        joinColumn: { name: 'follower_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'users_id', referencedColumnName: 'id' },
    })
    followers: User[];
}
