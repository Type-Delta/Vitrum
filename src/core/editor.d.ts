export namespace EditorManager {
    /**Event handler
     * @param {string}eventName eventName can be `'request_update_element'`, `'request_setactive'`
     * @param {function}callback function to be called when event emits
     */
    function on(eventName: string, callback: Function): void;
    /**
     * @param {string} docName
     * @param {string} content
     */
    function createNewEditor(docName: string, content?: string, path?: any, readonly?: boolean): Editor;
    function getAllEditors(): any;
    /**
     * @param {string} id
     * @returns {Editor|null}
     */
    function getEditorWithID(id: string): Editor;
    /**
     * @param {string} id editor ID
     * @param {boolean} force if true: immediately close editor event if the document wasn't saved
     */
    function closeEditorWthID(id: string): void;
    /**
     * @param {Editor} editor
     * @param {boolean} force if true: immediately close editor event if the document wasn't saved
     */
    function closeEditor(editor: Editor): void;
    /**
     * @param {Editor} editor
     * @param {string} path path to write content to
     */
    function writeContentToFile(editor: Editor, path?: string): Promise<any>;
    /**update editor content and `isSaved` status
     * @param {string} id editor id
     * @param {string} newContent
     */
    function updateEditorContent(id: string, newContent: string): void;
}
export class Editor {
    /**reconstruct this class from a normal Object with a matching properties
     * this function is for reconstructing the instance of this class
     * that has been serialized
     * @param {Object} obj
     * @returns {Editor}
     */
    static reconstructor(obj: any): Editor;
    /**
     * @param {string} docName
     * @param {number} id
     */
    constructor(docName: string);
    /**editor id
     * @type {string}
     */
    id: string;
    /**name of the opened file
     * @type {number}
     */
    docName: number;
    lastDocName: any;
    /**whether the the doc is saved to local disk
     */
    isSaved: boolean;
    lastIsSaved: boolean;
    /**doc path
     * @type {string}
     */
    filePath: string;
    /**whether this editor is readonly
     */
    readonly: boolean;
    /**text content inside this editor
     * @type {string}
     */
    content: string;
    lastContent: string;
    /**encoding use when write content to disk
     * @type {string}
     */
    encoding: string;
    /**whether this Editor has created its UI or not
     */
    hasUI: boolean;
    /**stores a timeline of Edits being made to this Editor
     * @type {Array<EditorEdits>}
     */
    history: Array<EditorEdits>;
    /**position in the history timeline that's considered **Present**.
     * this position changed when `undo()` or `redo()` is called,
     * 0 is most recent
     */
    timelineCurrentPos: number;
    lastHistUpdate: number;
    lastContentUpdate: number;
    update(): void;
    updateHistory(forceUpdate?: boolean): void;
    updateContent(): void;
    setActive: (active: any) => void;
    createUI(): void;
    setEditorDocName(name: any): void;
    redo(): void;
    undo(): void;
    /**merge two EditorEdits in history together
     * @param {number} hisAIndex
     * @param {number} hisBIndex
     */
    mergeHistoryEdits(hisAIndex: number, hisBIndex: number): void;
    /**whether Undo operation is allowed on not
     */
    canUndo(): boolean;
    /**whether Redo operation is allowed on not
     */
    canRedo(): boolean;
    /**asynchronously load **content** from file
     */
    loadContent(path?: string, encoding?: string): Promise<any>;
    #private;
}
/**merge two EditorEdits in to one
 * @param {EditorEdits} edits_a
 * @param {EditorEdits} edits_b
 */
export function mergeEdits(edits_a: EditorEdits, edits_b: EditorEdits): EditorEdits;
/**Store Edit event that triggered when Editor's Textarea content change
 * and more; EditorEdits stores in Array Queue called History, when there's a changed
 * Edits will be `unshift()` from the front and old Edit will be deleled from the back
 * when **undo** or **redo** maneger will traverse back and forth if there are new Edit
 * during this moment all Edits in the front will be deleled to allow new one to slide in place;
 * this is similar to Branching of Timelines in time travel theory.
 *
 */
declare class EditorEdits {
    /**
     * @type {TextChange[]}
     */
    textChanges: TextChange[];
}
declare class TextChange {
    /**
     * @param {Diff.Change} diffChange
     */
    constructor(diffChange: Diff.Change, start: any);
    added: any;
    removed: any;
    start: any;
    end: any;
    value: any;
}
export {};
