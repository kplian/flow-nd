import {
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column
  } from 'typeorm';
  
  import { PxpEntity } from '@pxp-nd/common';
  
  @Entity({ name: 'twf_flow_log' })
  export default class FlowLog extends PxpEntity{
  
    @PrimaryGeneratedColumn({ name: 'flow_log_id' })
    flowLogId: number;

    @Column({ name: 'error_custom_message', type: 'varchar', nullable: false, length: 2000 })
    errorCustomMessage: string;
  
    @Column({ name: 'error_message', type: 'varchar', nullable: false, length: 2000 })
    errorMessage: string;
  
    @Column({ name: 'stack_trace', type: 'text', nullable: true})
    stackTrace: string;
  
  }
  