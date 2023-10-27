const { ipcRenderer, contextBridge } = require("electron");
const { cloneDeep } = require('lodash');
const QUESTION_TIMEOUT_MS = 3000;
const SCO_TIMEOUT_MS = 1000;


contextBridge.exposeInMainWorld('coreAPI', {
   // functions wrap in {} to prevent return value from `ipcRenderer.on()` to enter "main world"
   handleCreateEditorUI: (callback) => {ipcRenderer.on('create-editor-ui', callback)},
   handleSetActiveEditorUI: (callback) => {ipcRenderer.on('setActive-editor-ui', callback)},
   handleDestroyEditorUI: (callback) => {ipcRenderer.on('destroy-editor-ui', callback)},
   handleUpdateEditorSaveStatus: (callback) => {ipcRenderer.on('update-editor-save-status', callback)},
   handleSetEditorTabName: (callback) => {ipcRenderer.on('editor-set-tabname', callback)},
   handleUpdateEditorContent: (callback) => {ipcRenderer.on('editor-update-content', callback)},
   handleUpdateEditorEffects: (callback) => {ipcRenderer.on('update-editor-effects', callback)},
   handleUpdateAvaliableFontlist: (callback) => {ipcRenderer.on('update-fontlist', callback)},
   handleUpdateEditorState: (callback) => {ipcRenderer.on('update-editor-state', callback)},

   handleFetchUIState: (callback) => {ipcRenderer.on('fetch-ui-state_fetch', callback)},

   sendCloseAppCmd: () => ipcRenderer.send('cmd-closeapp'),
   sendToggleMaximizeAppCmd: () => ipcRenderer.send('cmd-toggle-maximizeapp'),
   sendMinimizeAppCmd: () => ipcRenderer.send('cmd-minimizeapp'),
   sendNewFileCmd: () => ipcRenderer.send('cmd-newfile', false),
   sendNewFileWindowCmd: () => ipcRenderer.send('cmd-newfile', true),
   sendCloseEditorCmd: (id) => ipcRenderer.send('cmd-close-editor', id),
   sendSaveFileCmd: (id) => ipcRenderer.send('cmd-save', id),
   sendSaveFileAsCmd: (id) => ipcRenderer.send('cmd-save', id, true),
   sendOpenFileCmd: () => ipcRenderer.send('cmd-openfile'),
   sendRenameFileCmd: (id, newName) => ipcRenderer.send('cmd-renamefile', id, newName),
   sendUndoCmd: (id) => ipcRenderer.send('cmd-undo', id),
   sendRedoCmd: (id) => ipcRenderer.send('cmd-redo', id),
   sendEditorContentUpdate: (id, content, selection) =>
      ipcRenderer.send('editor-content-changed', id, content, selection),
   sendFindnReplaceUpdate: (id, option) => ipcRenderer.send('find_replace-update', id, option),

   sendRespondUIState: (state) => ipcRenderer.send('fetch-ui-state_respond', state),

   fetchAvaliableFontlist: () => ipcRenderer.send('fetch-avaliable-fontlist'),


   sendUserDragWindow: (mouseX, mouseY) => ipcRenderer.send('user-drag-window', mouseX, mouseY),
   sendUserDragWindowStart: (x, y) => ipcRenderer.send('user-drag-window-start', x, y),
   sendUserDragWindowStop: () => ipcRenderer.send('user-drag-window-stop'),



   askCore: async (question, ...args) => {
      return new Promise((resolve, reject) => {
         ipcRenderer.send('ask', question, ...args);
         ipcRenderer.once('answer', handleCoresAnswer);
         const timeout = setTimeout(() => {
            resolve(null);
         }, QUESTION_TIMEOUT_MS);

         function handleCoresAnswer(eEvent, qAnswered, answer){
            if(qAnswered != question) return;

            clearTimeout(timeout);
            resolve(answer);
         }
      });
   },

   async sendConsoleOutput(Text, options, prefix = undefined, color = undefined){
      return new Promise((resolve, reject) => {
         ipcRenderer.send('sendConsoleOutput_send', [Text, options, prefix, color]);
         ipcRenderer.once('sendConsoleOutput_return', handleSCOReturn);
         const timeout = setTimeout(() => {
            resolve(null);
         }, SCO_TIMEOUT_MS);

         function handleSCOReturn(eEvent, returnValue){
            clearTimeout(timeout);
            resolve(returnValue);
         }
      });
   }
});



contextBridge.exposeInMainWorld('_', {
   cloneDeep
});


window.addEventListener('DOMContentLoaded', () => {
   // const replaceText = (selector, text) => {
   //    const element = document.getElementById(selector);
   //    if (element) element.innerText = text
   // }

   // for (const dependency of ['chrome', 'node', 'electron']) {
   //    replaceText(`${dependency}-version`, process.versions[dependency]);
   // }

   /**
    * <!-- <h1>Hello World!</h1>
      We are using Node.js <span id="node-version"></span>,
      Chromium <span id="chrome-version"></span>,
      and Electron <span id="electron-version"></span>. -->
    */
});