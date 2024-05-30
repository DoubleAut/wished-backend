import {
    AfterLoad,
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';

@Entity()
export class Wish extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    price: number;

    @Column({ default: false })
    canBeAnon: boolean;

    @Column({ default: false })
    isHidden: boolean;

    @Column({ default: false })
    isReserved: boolean;

    @ManyToOne(() => User, (user) => user.reservations)
    reservedBy: User | null;

    @Column({ nullable: true })
    picture: string;

    @ManyToOne(() => User, (user) => user.wishes)
    owner: User;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
    })
    public created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
    })
    public updated_at: Date;

    @AfterLoad()
    updateReservation() {
        if (this.reservedBy) {
            this.isReserved = true;
        } else {
            this.isReserved = false;
        }
    }

    static async getWishes(userId: number) {
        return await this.createQueryBuilder('wish')
            .leftJoinAndSelect('wish.reservedBy', 'user')
            .where('wish.ownerId = :id', { id: userId })
            .getMany();
    }

    static async getWishWithReserver(wishId: number) {
        return await this.createQueryBuilder('wish')
            .where('wish.id = :id', { id: wishId })
            .leftJoinAndSelect('wish.reservedBy', 'user')
            .getOne();
    }
}
