import {
  OneToMany,
  JoinColumn,
  ManyToOne,
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import ActionType from './ActionType';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';

@Entity({ name: 'twf_action' })
export default class Action extends PxpEntity{

  @PrimaryGeneratedColumn({ name: 'action_id' })
  actionId: number;

  @Column({ name: 'action_type_id', type: 'numeric', nullable: true })
  actionTypeId: number;


  @Column({ type: 'varchar', nullable: false, length: 50 })
  code: string;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'origin_name', type: 'varchar', length: 100 })
  originName: string;

  @Column({ name: 'origin_key', type: 'varchar', length: 100 })
  originKey: string;

  @Column({ name: 'controller_function', type: 'varchar', length: 100 })
  controllerFunction: string;

  @Column({ name: 'config_json_template', type: 'text' })
  configJsonTemplate: string;

  @Column({ name: 'event_config', type: 'text' })
  eventConfig: string;

  @Column({ type: 'varchar', nullable: false, length: 1, default: 'N' })
  hidden: string;

  @ManyToOne( () => ActionType, actionType => actionType.actions, {eager: true})
  @JoinColumn({ name: 'action_type_id' })
  actionType: ActionType;

  @OneToMany( () => Node, node => node.action)
  nodes: Node[];

  @OneToMany( () => Node, eventNode => eventNode.actionEvent)
  eventNodes: Node[];
}
