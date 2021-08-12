import { BaseEntity } from 'typeorm';
import OriginName from './OriginName';
export default class FieldMap extends BaseEntity {
    fieldMapId: number;
    name: string;
    alias: string;
    type: string;
    originNameId: number;
    description: string;
    originName: OriginName;
}
