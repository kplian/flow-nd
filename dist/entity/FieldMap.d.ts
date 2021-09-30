import OriginName from './OriginName';
import { PxpEntity } from '@pxp-nd/common';
export default class FieldMap extends PxpEntity {
    fieldMapId: number;
    name: string;
    alias: string;
    type: string;
    originNameId: number;
    description: string;
    originName: OriginName;
}
