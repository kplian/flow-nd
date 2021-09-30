import {
    OneToMany,
    BaseEntity,
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
  } from 'typeorm';
  import OriginName from './OriginName';
import { PxpEntity } from '@pxp-nd/common';

  @Entity({ name: 'twf_field_map' })
  export default class FieldMap extends PxpEntity{

    @PrimaryGeneratedColumn({ name: 'field_map_id' })
    fieldMapId: number;

    @Column({ type: 'varchar', nullable: false, length: 100 })
    name: string;

    @Column({ type: 'varchar', nullable: false, length: 100 })
    alias: string;

    @Column({ type: 'varchar', nullable: false, length: 100 })
    type: string;

    @Column({ name: 'origin_name_id', type: 'integer', nullable: false })
    originNameId: number;

    @Column({ type: 'text', nullable: false })
    description: string;

    @ManyToOne( () => OriginName, originName => originName.fields)
    @JoinColumn({ name: 'origin_name_id' })
    originName: OriginName;
  }
