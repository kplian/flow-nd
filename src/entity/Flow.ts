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

@Entity({ name: 'twf_flow' })
export default class Flow extends BaseEntity{

	@PrimaryGeneratedColumn({ name: 'flow_id' })
	flowId: number;

	@Column({ name: 'vendor_id', type: 'int', nullable: false })
	vendorId: number;

	@Column({ type: 'int', nullable: false })
	code: number;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	name: string;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	enabled: string;

	@Column({ type: 'varchar', nullable: false, length: 100 })
	type: string;

	@OneToMany( () => FlowInstance, flowInstance => flowInstance.flow)
	instances: FlowInstance[];

	@OneToMany( () => Node, node => node.flow, {eager: true})
	nodes: Node[];



}
