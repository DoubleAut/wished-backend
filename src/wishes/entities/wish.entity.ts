import { User } from 'src/users/entity/user.entity';
import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Wish extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    price: string;

    @Column({ default: false })
    canBeAnon: boolean;

    @Column({ default: false })
    isHidden: boolean;

    @Column({ default: false })
    isReserved: boolean;

    @Column({ nullable: true })
    picture: string;

    @ManyToOne(() => User, (user) => user.wishes)
    user: User;
}
