import FieldMap from './FieldMap';
import { PxpEntity } from '@pxp-nd/common';
export default class OriginName extends PxpEntity {
    originNameId: number;
    name: string;
    description: string;
    originKey: string;
    fields: FieldMap[];
}
