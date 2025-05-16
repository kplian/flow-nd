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
 * 14-May-2025      9141239986     Mercedes Zambrana    add flag_name and flag_value
 * ****************************************************************************/
import {
	OneToMany,
	JoinColumn,
	ManyToOne,
	BaseEntity,
	Entity,
	PrimaryGeneratedColumn,
	Column
} from 'typeorm';
import NodeInstance from './NodeInstance';
import Flow from './Flow';
import { PxpEntity } from '@pxp-nd/common';

@Entity({ name: 'twf_flow_instance' })
export default class FlowInstance extends PxpEntity{

	@PrimaryGeneratedColumn({ name: 'flow_instance_id' })
	flowInstanceId: number;

	@Column({ name: 'flow_id', type: 'numeric', nullable: false })
	flowId: number;

	@Column({ name: 'data_id', type: 'numeric', nullable: false })
	dataId: number;

	@Column({ name: 'action_id', type: 'numeric', nullable: false })
	actionId: number;

	@Column({ name: 'origin_name', type: 'varchar', length: 100 })
	originName: string;

	@Column({ name: 'status', type: 'varchar', length: 100 })
  	status: string;

  	@Column({ name: 'origin_key', type: 'varchar', length: 100 })
  	originKey: string;

	@Column({ name: 'process_number', type: 'varchar', nullable: false, length: 50 })
	processNumber: string;

	@Column({ name: 'result_from_origen', type: 'text', nullable: false })
	resultFromOrigen: string;

	@Column({ name: 'flag_name', type: 'text', nullable: false })
	flagName: string;

	@Column({ name: 'flag_value', type: 'numeric', nullable: false })
	flagValue: number;

	@OneToMany(() => NodeInstance, (nodeInstance) => nodeInstance.flowInstance, {eager:true})
	nodeInstances: NodeInstance[];

	@ManyToOne( () => Flow, flow => flow.instances)
	@JoinColumn({ name: 'flow_id' })
	flow: Flow;
}
