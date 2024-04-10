import { Wish } from 'src/wishes/entities/wish.entity';
import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

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

    static findUserById(id: number) {
        return this.createQueryBuilder('user')
            .where('user.id = :id', { id })
            .getOne();
    }

    static findUserByEmail(email: string) {
        return this.createQueryBuilder('user')
            .where('user.email = :email', {
                email,
            })
            .getOne();
    }

    static withWishes(user: User) {
        return this.createQueryBuilder('user')
            .leftJoinAndSelect('user.wishes', 'wish')
            .where('user.id = :id', { id: user.id })
            .getOne();
    }

    static withFriends(user: User) {
        return this.createQueryBuilder('user')
            .leftJoinAndSelect('user.followers', 'followers')
            .leftJoinAndSelect('user.followings', 'followings')
            .where('user.id = :id', { id: user.id })
            .getOne();
    }

    static findFullyPopulatedUser(id?: number, email?: string) {
        return this.createQueryBuilder('user')
            .leftJoinAndSelect('user.wishes', 'wishes')
            .leftJoinAndSelect('user.followers', 'followers')
            .leftJoinAndSelect('user.followings', 'followings')
            .where('user.id = :id', { id })
            .orWhere('user.email = :email', { email })
            .getOne();
    }
}
