const { existsSync, writeFile, readFile } = require('fs');
const { pass, propertiesCount, isNumber } = require('../helper/Tools');
const { Editor } = require('./editor.js');
const { getNativeFontFamily, sendConsoleOutput } = require('../utilities.js');



const _State = {
   State: class State {
      /**window width and height
       * @type {number[]}
       */
      windowSize;
      /**window position
       * @type {number[]}
       */
      windowPos;
      editor = {
         fontFamily: getNativeFontFamily(),
         fontSize: 16,
         encoding: 'utf-8',
         lineSpacing: 2.75,
         letterSpacing: 0.035,
         useLineWrap: false
      }
      /**
       * @type {Map<string, Editor>}
       */
      openedEditors;

      constructor(windowSize, editors){
         if(windowSize) this.windowSize = windowSize;
         if(editors) this.openedEditors = editors;
      }

      static reconstructor(stateObj){
         const state = new State();

         if(stateObj.windowSize instanceof Array) state.windowSize = stateObj.windowSize;
         if(stateObj.openedEditors?.size){
            state.openedEditors = new Map;
            for(const [id, eObj] of stateObj.openedEditors){
               state.openedEditors.set(
                  id, Editor.reconstructor(eObj)
               );
            }
         }
         if(typeof stateObj.editor == 'object'&&propertiesCount(stateObj.editor)){
            for(const key in stateObj.editor){
               if(!stateObj.editor[key]) continue;
               state.editor[key] = isNumber(stateObj.editor[key])?
                  parseFloat(stateObj.editor[key]):stateObj.editor[key];
            }
         }
         return state;
      }
   },

   async loadState(path){
      if(!existsSync(path)){
         sendConsoleOutput(
            '`state.json` not found, fallback to default State',
            'normal', 'State'
         );
         return new _State.State;
      }

      return new Promise((resolve, reject) => {
         readFile(path, { encoding:'utf-8' }, (err, data) => {
            if(err){
               sendConsoleOutput(
                  'failed to read `state.json`, fallback to default State\nError message: ' + err.stack,
                  'warn', 'State'
               );
               resolve(new _State.State);
            }

            try{
               resolve(
                  _State.State.reconstructor(
                     JSON.parse(data, JSONReviver)
                  )
               );
            }catch(err){
               sendConsoleOutput(
                  'failed to parse `state.json`, fallback to default State\nError message: ' + err.stack,
                  'warn', 'State'
               );
               resolve(new _State.State);
            }
         })
      });
   },

   /**
    * @param {string} path
    * @param {State} state
    */
   async writeState(path, state){
      return new Promise((resolve, reject) => {
         writeFile(
            path,
            JSON.stringify(pass(state), JSONReplacer, 3),
            { encoding: 'utf-8' },
            (err) => {
               if(err){
                  sendConsoleOutput(
                     'failed to write `state.json`, skip state file writing\nError message: ' + err.stack,
                     'warn', 'State'
                  );
               }
               resolve();
            }
         );
      })
   }
}

module.exports = _State;



function JSONReplacer(key, value) {
   if (value instanceof Map) {
      return {
         dataType: 'Map',
         value: Array.from(value.entries()),
      };
   } else {
      return value;
   }
}

function JSONReviver(key, value) {
   if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
         return new Map(value.value);
      }
   }
   return value;
}
