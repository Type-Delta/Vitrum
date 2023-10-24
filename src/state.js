const { readFileSync, writeFileSync, readFile } = require('fs');
const { pass, propertiesCount, isNumber } = require('./helper/Tools');
const { Editor } = require('./editor.js');
const { getNativeFontFamily } = require('./utilities.js');



const _State = {
   State: class State {
      /**window width and height
       * @type {number[]}
       */
      windowSize;
      editor = {
         fontFamily: getNativeFontFamily(),
         fontSize: 16,
         encoding: 'utf-8',
         lineSpacing: 2.75,
         letterSpacing: 0.035
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
         if(stateObj.openedEditors?.length){
            state.openedEditors = [];
            for(const eObj of stateObj.openedEditors){
               state.openedEditors.push(
                  Editor.reconstructor(eObj)
               );
            }
         }
         if(typeof stateObj.editor == 'object'&&propertiesCount(stateObj.editor)){
            for(const key in stateObj.editor){
               state.editor[key] = isNumber(stateObj.editor[key])?
                  parseFloat(stateObj.editor[key]):stateObj.editor[key];
            }
         }
         return state;
      }
   },

   async loadState(path){
      return new Promise((resolve, reject) => {
         readFile(path, { encoding:'utf-8' }, (err, data) => {
            if(err) reject(err);

            resolve(
               _State.State.reconstructor(
                  JSON.parse(data)
               )
            );
         })
      });
   },

   /**
    * @param {string} path
    * @param {State} state
    */
   writeState(path, state){
      writeFileSync(
         path,
         JSON.stringify(state, undefined, 3),
         { encoding: 'utf-8' }
      );
   }
}

module.exports = _State;
