import {
	OneToMany,
	JoinColumn,
	ManyToOne,
	BaseEntity,
	Entity,
	PrimaryGeneratedColumn,
	Column
} from 'typeorm';
import Node from './Node';
import { PxpEntity } from '@pxp-nd/common';

@Entity({ name: 'twf_node_connection' })
export default class NodeConnection extends PxpEntity{

	@PrimaryGeneratedColumn({ name: 'node_connection_id' })
	nodeConnectionId: number;

	@Column({ type: 'varchar', nullable: false, length: 200 })
	condition: string;

	@Column({ name: 'node_id_master', type: 'int', nullable: false })
	nodeIdMaster: number;

	@Column({ name: 'node_id_child', type: 'int', nullable: false })
	nodeIdChild: number;

	@ManyToOne(() => Node, node => node.masterConnections)
	@JoinColumn({ name: 'node_id_master' })
	masterNode: Node;

	@ManyToOne(() => Node, node => node.childConnections)
	@JoinColumn({ name: 'node_id_child' })
	childNode: Node;


}
