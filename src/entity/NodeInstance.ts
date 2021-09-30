import {
  OneToMany,
  JoinColumn,
  ManyToOne,
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import FlowInstance from './FlowInstance';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';

@Entity({ name: 'twf_node_instance' })
export default class NodeInstance extends PxpEntity{


  @PrimaryGeneratedColumn({ name: 'node_instance_id' })
  nodeInstanceId: number;

  @Column({ name: 'node_id', type: 'numeric', nullable: true })
  nodeId: number;

  @Column({ name: 'flow_instance_id', type: 'numeric', nullable: true })
  flowInstanceId: number;

  @Column({ name: 'run_time', type: 'timestamp', nullable: false })
  runTime: Date;

  @Column({ name: 'schedule', type: 'timestamp', nullable: false })
  schedule: Date;

  @Column({ name: 'status', type: 'varchar', nullable: false, length: 50 })
  status: string;

  @ManyToOne(() => FlowInstance, flowInstance => flowInstance.nodeInstances)
  @JoinColumn({ name: 'flow_instance_id' })
  flowInstance: FlowInstance;

  @ManyToOne(() => Node, node => node.nodeInstances, {eager: true})
  @JoinColumn({ name: 'node_id' })
  node: Node;


}
