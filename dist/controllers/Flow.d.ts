/**
 * Effex 2021
 *
 * MIT
 *
 * Flow Controller
 *
 * @summary Flow Controller
 * @author Jaime Figueroa
 *
 * Created at     : 2021-07-08 12:55:38
 * Last modified  :
 */
import { Controller } from '@pxp-nd/core';
declare class Flow extends Controller {
    get(params: Record<string, any>): Promise<unknown>;
}
export default Flow;
