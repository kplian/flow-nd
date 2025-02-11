/*****************************************************************************
 * Copyright(c) 2023 Qorus Inc
 * All rights reserved
 *****************************************************************************
 * NAME: FlowListGridView.tsx
 * DEVELOPER: Favio Figueroa
 * DESCRIPTION:
 * REVISIONS:
 * Date Change      ID              Author              Description
 * -----------      -----------     --------------      ------------------------------------
 * 04-Sep-2023      SP08SEP23       Rensi Arteaga       add modified at and by
 * 06-Dec-2024		8001237262		Mercedes Zambrana	add flow_type
 * 31-Jan-2025		8035304698		Mercedes Zambrana	Change code to string
  ****************************************************************************/
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

	@Column({ type: 'varchar', nullable: false, length: 20 })
	code: string;

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

	@Column({ name: 'modified_at', type: 'timestamp', nullable: false, default: 'CURRENT_TIMESTAMP' })
	modifiedAt: Date;

	@Column({ name: 'modified_by', type: 'varchar', length: 500 })
	modifiedBy: string;

	@Column({ name: 'template_type', type: 'varchar', nullable: false, length: 15 })
	templateType:string;

	@Column({ name: 'flow_type', type: 'varchar', nullable: true, length: 100 })
	flowType:string;


}
