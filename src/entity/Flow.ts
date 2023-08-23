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

@Entity({ name: 'twf_flow' })
export default class Flow extends PxpEntity{

	@PrimaryGeneratedColumn({ name: 'flow_id' })
	flowId: number;

	@Column({ name: 'vendor_id', type: 'int', nullable: false })
	vendorId: number;

	@Column({ type: 'int', nullable: false })
	code: number;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	name: string;

	@Column({ type: 'text', nullable: false })
	description: string;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	enabled: string;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	type: string;

	@OneToMany( () => FlowInstance, flowInstance => flowInstance.flow)
	instances: FlowInstance[];

	@OneToMany( () => Node, node => node.flow)
	nodes: Node[];

	@Column({ type: 'varchar',   length: 200 })
	icon: string;

	@Column({ type: 'varchar',   length: 30 })
	status: string;

}
