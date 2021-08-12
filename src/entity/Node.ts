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
import NodeConnection from './NodeConnection';
import NodeInstance from './NodeInstance';
import Flow from './Flow';

@Entity({ name: 'twf_node' })
export default class Node extends BaseEntity {

  @PrimaryGeneratedColumn({ name: 'node_id' })
  nodeId: number;

  @Column({ name: 'flow_id', type: 'numeric', nullable: false })
  flowId: number;

  @Column({ name: 'action_id', type: 'numeric', nullable: true })
  actionId: number;

  @Column({ name: 'is_init', type: 'varchar', nullable: false, length: 1 })
  isInit: string;

  @Column({ name: 'status_event', type: 'varchar', length: 50 })
  statusEvent: string;

  @Column({ name: 'is_end', type: 'varchar', nullable: false, length: 1 })
  isEnd: string;

  @Column({ name: 'action_config_json', type: 'text' })
  actionConfigJson: string;

  @Column({ name: 'approval_config', type: 'text' })
  approvalConfig: string;

  @Column({ name: 'type_delay', type: 'varchar' })
  typeDelay: string;

  @Column({ name: 'delay', type: 'numeric' })
  delay: number;

  @ManyToOne(() => Flow, flow => flow.nodes)
  @JoinColumn({ name: 'flow_id' })
  flow: Flow;

  @ManyToOne(() => Action, action => action.nodes, { eager: true })
  @JoinColumn({ name: 'action_id' })
  action: Action;

  @ManyToOne(() => Action, actionEvent => actionEvent.eventNodes)
  @JoinColumn({ name: 'action_id_listening_event' })
  actionEvent: Action;


  @OneToMany(() => NodeConnection, nodeConnection => nodeConnection.masterNode)
  masterConnections: NodeConnection[];

  @OneToMany(() => NodeConnection, nodeConnection => nodeConnection.childNode)
  childConnections: NodeConnection[];


  @OneToMany(() => NodeInstance, (nodeInstance) => nodeInstance.nodes)
  nodeInstances: NodeInstance[];

}
