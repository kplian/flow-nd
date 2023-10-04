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
import { PxpEntity } from '@pxp-nd/common';

@Entity({ name: 'twf_event' })
export default class Event extends PxpEntity{

  @PrimaryGeneratedColumn({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'action_id', type: 'int', nullable: false })
  actionId: number;

  @Column({ name: 'desc_job_name', type: 'varchar', nullable: false, length: 200 })
  descJobName: string;

  @Column({ name: 'data_id', type: 'int', nullable: false })
  dataId: number;

  @Column({ name: 'status', type: 'varchar',  length: 30, nullable: false, default: 'pending' })
  status: string;

  @ManyToOne(() => Action, action => action.nodes)
  @JoinColumn({ name: 'action_id' })
  action: Action;
}
