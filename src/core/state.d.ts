export class State {
    static reconstructor(stateObj: any): {
        /**window width and height
         * @type {number[]}
         */
        windowSize: number[];
        /**window position
         * @type {number[]}
         */
        windowPos: number[];
        editor: {
            fontFamily: "Segoe UI" | "San Francisco" | "Noto Sans";
            fontSize: number;
            encoding: string;
            lineSpacing: number;
            letterSpacing: number;
        };
        /**
         * @type {Map<string, Editor>}
         */
        openedEditors: Map<string, Editor>;
    };
    constructor(windowSize: any, editors: any);
    /**window width and height
     * @type {number[]}
     */
    windowSize: number[];
    /**window position
     * @type {number[]}
     */
    windowPos: number[];
    editor: {
        fontFamily: "Segoe UI" | "San Francisco" | "Noto Sans";
        fontSize: number;
        encoding: string;
        lineSpacing: number;
        letterSpacing: number;
    };
    /**
     * @type {Map<string, Editor>}
     */
    openedEditors: Map<string, Editor>;
}
import { Editor } from "./editor.js";
export declare function loadState(path: any): Promise<any>;
/**
 * @param {string} path
 * @param {State} state
 */
export declare function writeState(path: string, state: State): Promise<any>;
