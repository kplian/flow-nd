import {
  OneToMany,
  JoinColumn,
  ManyToOne,
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import Action from './Action';

@Entity({ name: 'twf_event' })
export default class Event extends BaseEntity{

  @PrimaryGeneratedColumn({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'action_id', type: 'int', nullable: false })
  actionId: number;

  @Column({ name: 'desc_job_name', type: 'varchar', nullable: false, length: 200 })
  descJobName: string;

  @Column({ name: 'data_id', type: 'int', nullable: false })
  dataId: number;

  @ManyToOne(() => Action, action => action.nodes)
  @JoinColumn({ name: 'action_id' })
  action: Action;
}
