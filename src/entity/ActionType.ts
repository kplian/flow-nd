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

@Entity({ name: 'twf_action_type' })
export default class ActionType extends PxpEntity{

  @PrimaryGeneratedColumn({ name: 'action_type_id' })
  actionTypeId: number;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ name: 'schema_json', type: 'text' })
  schemaJson: string;

  @Column({ name: 'is_start', type: 'varchar', nullable: false, length: 1, default: 'N' })
  isStart: string;

  @Column({ name: 'is_delay', type: 'varchar', nullable: false, length: 1, default: 'N' })
  isDelay: string;

  @Column({ name: 'have_condition', type: 'varchar', nullable: false, length: 1, default: 'N' })
  haveCondition: string;

  @Column({ name: 'hidden', type: 'varchar', nullable: false, length: 1, default: 'N' })
  hidden: string;

  @Column({ type: 'varchar', length: 100 })
  controller: string;

  @Column({ name: 'extra_schema_json', type: 'text' })
  extraSchemaJson: string;

  @Column({ name: 'actions_json', type: 'text' })
  actionsJson: string;

  @OneToMany(() => Action, (action) => action.actionType)
  actions: Action[];
}
