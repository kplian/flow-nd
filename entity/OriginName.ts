import {
  OneToMany,
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import FieldMap from './FieldMap';

@Entity({ name: 'twf_origin_name' })
export default class OriginName extends BaseEntity{

  @PrimaryGeneratedColumn({ name: 'origin_name_id' })
  originNameId: number;

  @Column({ type: 'varchar', nullable: false, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'varchar', nullable: false, length: 150 })
  originKey: string;

  @OneToMany(() => FieldMap, (fieldMap) => fieldMap.originName)
  fields: FieldMap[];
}
