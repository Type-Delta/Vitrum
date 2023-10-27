// const { app, BrowserWindow } = require('electron');
const EventEmitter = require('events');
const fs = require('fs');
const Diff = require('diff');

const editorEmitter = new EventEmitter();

const to = require('../helper/Tools.js');
const { editors, HTMLElementIDs } = require('../Global.js');
let {
   OPTIMIZATION_MODE,
   TRIM_TRAILING_WHITESPACE,
   MAX_HISTORY_SIZE
} = require('../config.js');
const { sendConsoleOutput } = require('../utilities.js')

class TextChange {
   added;
   removed;
   start;
   end;
   value
   /**
    * @param {Diff.Change} diffChange
    */
   constructor(diffChange, start){
      this.value = diffChange.value;
      this.added = diffChange.added;
      this.removed = diffChange.removed;

      this.start = start;
      this.end = start + diffChange.value.length;
   }
}


/**Store Edit event that triggered when Editor's Textarea content change
 * and more; EditorEdits stores in Array Queue called History, when there's a changed
 * Edits will be `unshift()` from the front and old Edit will be deleled from the back
 * when **undo** or **redo** manager will traverse back and forth if there are new Edit
 * during this moment all Edits in the front will be deleted to allow new one to slide in place;
 * this is similar to Branching of Timelines in time travel theory.
 *
 */
class EditorEdits {
   /**
    * @type {TextChange[]}
    */
   textChanges = [];
   /**selection on the editor at this time position
    * @type {number[]}
    */
   selection;


   constructor(){

   }
}


class Editor {
   /**editor id
    * @type {string}
    */
   id = null;
   /**name of the opened file
    * @type {number}
    */
   docName = null;
   lastDocName = null;
   /**whether the doc is saved to local disk
    */
   isSaved = false;
   lastIsSaved = false;
   /**doc path
    * @type {string}
    */
   filePath = null;
   /**whether this editor is readonly
    */
   readonly = false;
   /**text content inside this editor
    * @type {string}
    */
   content = '';
   lastContent = '';
   /**current selection on the editor
    * @type {number[]}
    */
   currentSelection;
   /**encoding use when write content to disk
    * @type {string}
    */
   encoding = 'utf-8';
   /**whether this Editor has created its UI or not
    */
   hasUI = false;
   /**stores a timeline of Edits being made to this Editor
    * @type {Array<EditorEdits>}
    */
   history = [];
   /**position in the history timeline that's considered **Present**.
    * this position changed when `undo()` or `redo()` is called,
    * 0 is most recent
    */
   timelineCurrentPos = -1;
   lastHistUpdate;
   lastContentUpdate;

   /**
    * @param {string} docName
    * @param {number} id
    */
   constructor(docName){
      this.docName = docName;

      const id = to.IDGenerator(HTMLElementIDs, 'BBBB');
      HTMLElementIDs.add(id);
      this.id = id;
      this.lastHistUpdate = Date.now();
      this.lastContentUpdate = Date.now();
   }

   /**reconstruct this class from a normal Object with a matching properties
    * this function is for reconstructing the instance of this class
    * that has been serialized
    * @param {Object} obj
    * @returns {Editor}
    */
   static reconstructor(obj){
      const editor = new Editor(obj.docName??'Unknown');
      if(obj.filePath&&fs.existsSync(obj.filePath)){
         editor.filePath = obj.filePath;
      }

      if(obj.isSaved) editor.isSaved = obj.isSaved;
      if(obj.content) editor.content = obj.content;
      if(obj.readonly) editor.readonly = obj.readonly;
      if(obj.encoding) editor.encoding = obj.encoding;
      if(obj.id){
         editor.id = obj.id;
         HTMLElementIDs.add(obj.id);
      }
      return editor;
   }

   /**
    * @param {Diff.Change[]} diff
    */
   #shouldUpdateHistory(diff){
      if(!diff.length) return false;

      for(const d of diff){
         if(/.+[\s,.]+$/.test(d.value)) return true; // match word by word
         if(d.count > 20) return true;
      }

      if(Date.now() - this.lastContentUpdate > 3e3) return true;
   }


   update(){
      if(this.lastIsSaved != this.isSaved){
         editorEmitter.emit('request_update-save-status',
            this.id,
            this.lastIsSaved = this.isSaved
         );
      }

      if(this.lastDocName != this.docName){
         editorEmitter.emit('request_update-doc-title',
            this.id,
            this.lastDocName = this.docName
         );
      }


      if(this.lastContent == this.content) return;
      this.lastContentUpdate = Date.now();

      const diff = Diff.diffChars(
         this.lastContent,
         this.content,
         { ignoreCase: false }
      ).filter(d => d.added||d.removed);

      if(this.#shouldUpdateHistory(diff)){
         this.updateHistory(false);
         this.lastContent = this.content;
      }
   }


   updateHistory(forceUpdate = true){
      if(this.lastContent == this.content) return;

      let diff;
      let edits = new EditorEdits();
      edits.selection = this.currentSelection;

      if(OPTIMIZATION_MODE === 'lessmemory'){
         diff = Diff.diffChars(
            this.lastContent,
            this.content,
            { ignoreCase: false }
         );
      }else{
         diff = Diff.diffLines(
            this.lastContent,
            this.content,
            { ignoreCase: false }
         );
      }

      if(!(diff.length&&diff.filter(d => d.added||d.removed).length)) return;

      let pos = 0;
      for (let i = 0; i < diff.length; i +=  1) {
         edits.textChanges.push(
            new TextChange(diff[i], pos)
         );

         pos += diff[i].count;
      }

      if(!forceUpdate&&this.timelineCurrentPos != 0){
         this.history = this.history.slice(this.timelineCurrentPos);
         this.timelineCurrentPos = 0;
      }

      this.history.unshift(edits);
      if(this.history.length > MAX_HISTORY_SIZE) this.history.pop();
      this.lastHistUpdate = Date.now();
   }


   updateContent(){
      editorEmitter.emit('request_update-content', this.id, this.content, this.currentSelection);
   }



   setActive = (active) => {
      editorEmitter.emit('request_setActive', this, active);
   }



   createUI(){
      if(this.hasUI){
         process?.emitWarning('#dmik4 | `createUI()` called twice.');
         return;
      }

      editorEmitter.emit('request_createEditorUI', this.docName, this.id, this.content, this.readonly);
      this.hasUI = true;
   }


   setEditorDocName(name){
      this.docName = name;
      editorEmitter.emit('request_update-doc-title', this.id, this.docName);
   }



   redo(){
      if(!this.canRedo()) return;
      this.updateHistory();

      this.content = '';
      const futureSelection = this.history[this.timelineCurrentPos - 1].selection;
      for(const c of this.history[--this.timelineCurrentPos].textChanges){
         if(c.removed) continue;
         this.content += c.value;
      }

      this.lastContent = this.content;
      this.currentSelection = futureSelection;
      this.updateContent();
   }


   undo(){
      if(!this.canUndo()) return;
      this.updateHistory();

      this.content = '';
      const pastSelection = this.history[this.timelineCurrentPos + 1].selection;
      for(const c of this.history[this.timelineCurrentPos++].textChanges){
         if(c.added) continue;
         this.content += c.value;
      }

      this.lastContent = this.content;
      this.currentSelection = pastSelection;
      this.updateContent();
   }

   /**merge two EditorEdits in history together
    * @param {number} hisAIndex
    * @param {number} hisBIndex
    */
   mergeHistoryEdits(hisAIndex, hisBIndex){
      if(
         hisAIndex >= this.history.length||hisBIndex >= this.history.length||
         hisAIndex < 0||hisBIndex < 0||hisAIndex == hisBIndex
      ){
         process?.emitWarning(
            `#9smnd | invalid paramiters given: (${hisAIndex}, ${hisBIndex})\ncurrent History length: ${this.history.length}`
         );
         return;
      }
      const mergedHis = mergeEdits(this.history[hisAIndex], this.history[hisBIndex]);
      this.history = this.history.slice(2);
      this.history.unshift(mergedHis);
   }


   /**whether Undo operation is allowed on not
    */
   canUndo(){
      return !(!this.history.length||this.timelineCurrentPos == this.history.length - 1);
   }

   /**whether Redo operation is allowed on not
    */
   canRedo(){
      return this.timelineCurrentPos > 0&&this.history.length > 1;
   }

   /**asynchronously load **content** from file
    */
   loadContent(path = this.filePath, encoding = this.encoding){
      return new Promise((resolve, reject) => {
         fs.readFile(
            path, encoding?encoding:'utf-8', (err, content) => {
               if(err){
                  sendConsoleOutput(err.stack, 'error', 'Editor');
                  return;
               }

               EditorManager.updateEditorContent(
                  this.id, content.toString()
               );
               resolve();
         });
      })
   }
}

const EditorManager = {
   /**Event handler
    * @param {string}eventName eventName can be `'request_update_element'`, `'request_setactive'`
    * @param {function}callback function to be called when event emits
    */
   on(eventName, callback){
      const eventNameIsValid = (
         eventName == 'request_setActive'||
         eventName == 'request_setActiveEditor'||
         eventName == 'request_createEditorUI'||
         eventName == 'request_destroyEditorUI'||
         eventName == 'request_update-save-status'||
         eventName == 'request_update-doc-title'||
         eventName == 'request_update-content'
      );
      if(!eventNameIsValid) throw new Error(`No such Event, given "${eventName}"`);

      editorEmitter.on(eventName, callback);
   },

   /**
    * @param {string} docName
    * @param {string} content
    */
   createNewEditor(docName, content = null, path = null, readonly = false){
      const editor = new Editor(docName);
      if(content) {
         editor.content = content;
         editor.lastContent = content;
         editor.filePath = path;
         editor.readonly = readonly;
      }
      editors.set(editor.id, editor);
      editor.createUI();
      return editor;
   },

   getAllEditors(){
      return editors;
   },

   /**
    * @param {string} id
    * @returns {Editor|null}
    */
   getEditorWithID(id){
      return editors.get(id)??null;
   },

   /**
    * @param {string} id editor ID
    * @param {boolean} force if true: immediately close editor event if the document wasn't saved
    */
   closeEditorWthID(id){
      const editor = editors.get(id);
      if(!editor) process?.emitWarning('#dkar2 | can\'t find Editor with id \'' + id + "'");

      HTMLElementIDs.delete(id);
      editors.delete(id);

      editorEmitter.emit('request_destroyEditorUI', id);
   },

   /**
    * @param {Editor} editor
    * @param {boolean} force if true: immediately close editor event if the document wasn't saved
    */
   closeEditor(editor){
      HTMLElementIDs.delete(editor.id);
      editors.delete(editor.id);

      editorEmitter.emit('request_destroyEditorUI', editor.id);
   },

   /**
    * @param {Editor} editor
    * @param {string} path path to write content to
    */
   async writeContentToFile(editor, path = null){
      return new Promise((resolve, reject) => {
         if(!path) path = editor.filePath;
         if(!path) reject(new Error('#adk4d | path is null'));
         try {
            fs.writeFile(
               path,
               editor.content??'',
               { encoding: editor.encoding },
               () => resolve()
            );

         }catch(e){
            reject(`unable to write to path '${path}'\n${e}`);
         }
         editor.update();
      });
   },

   /**update editor content and `isSaved` status
    * @param {string} id editor id
    * @param {string} newContent
    * @param {number[]} selection current selection on the editor
    */
   updateEditorContent(id, newContent, selection){
      const editor = editors.get(id);
      if(!editor) process?.emitWarning('#dadw5 | can\'t find Editor with id \'' + id + "'");

      editor.content = newContent;
      editor.currentSelection = selection;
      editor.isSaved = false;
      if(editor.isSaved) editor.isSaved = false;
      editor.update();
   },


   restoreEditors(state){
      if(!state.openedEditors?.size||!(state.openedEditors instanceof Map)) return;

      for(const [id, editor] of state.openedEditors){
         editors.set(id, editor);
         editor.createUI();
      }
   }
}




////////////////////   Utilities   //////////////////////
/**merge two EditorEdits in to one
 * @param {EditorEdits} edits_a
 * @param {EditorEdits} edits_b
 */
function mergeEdits(edits_a, edits_b){
   const newEdits = new EditorEdits();
   newEdits.textChanges = edits_a.textChanges.concat(edits_b.textChanges);
   return newEdits;
}








module.exports.EditorManager = EditorManager;
module.exports.Editor = Editor;
module.exports.mergeEdits = mergeEdits;

