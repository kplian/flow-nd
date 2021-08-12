import { BaseEntity } from 'typeorm';
import FieldMap from './FieldMap';
export default class OriginName extends BaseEntity {
    originNameId: number;
    name: string;
    description: string;
    originKey: string;
    fields: FieldMap[];
}
