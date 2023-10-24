const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { readFileSync, renameSync } = require('fs');
const path = require('node:path');
const FontList = require('font-list');
const { pass } = require('./helper/Tools.js');

const { writeLog_file, sendConsoleOutput } = require('./utilities.js');
const { EditorManager, mergeEdits } = require('./editor.js');
const { writeState, State, loadState } = require('./state.js');
let {
   STATE_PATH,
   LAST_OPENFILE_PATH,
   DEFAULT_ENCODING,
   WRITE_LOG_FILE
} = require('./config.js');
let {
   currentState
} = require('./Global.js');

// import { FindOption } from './helper/Definitions'; // for Definitions only
const FR = require('./module/find.js').default;

const FileFilter = [
   { name: 'Plain Text', extensions: ['txt'] },
   { name: 'Mark Down', extensions: ['md'] },
   { name: 'All Files', extensions: ['*'] }
];



// Vars

/**installed and avaliable font family names
 * @type {string[]}
 */
let AvaliableFontsFamilies = null;
/**@type {BrowserWindow} */
let mainWindow;
let aleadySendStateToWindow = false;
let mainWindowReady = false;













app.whenReady().then(() => {

   // Setup stuff
   mainWindow = createMainWindow();
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
   });

   Vitrum.loadAvaliableFontsList();

   loadState(STATE_PATH).then(state => {
      currentState = state;

      // incase loadState() took longer to load than mainWindow
      if(!aleadySendStateToWindow&&mainWindowReady)
         mainWindow.webContents.send('update-state', currentState);
   }).catch(err => {
      sendConsoleOutput(
         '#mdo9d | failed to load state file\nError message: ' + err.stack,
         'warn', 'Vitrum'
      );
      currentState = new State();
   });




   // Aplication handler
   ipcMain.on('sendConsoleOutput_send', async (eEvent, SCOArgs) => {
      mainWindow.webContents.send(
         'sendConsoleOutput_return',
         await sendConsoleOutput(...SCOArgs)
      );
   });



   // Handle Commands Received
   ipcMain.on('cmd-closeapp', Vitrum.close);
   ipcMain.on("cmd-toggle-maximizeapp", Vitrum.toggleMaximize);
   ipcMain.on("cmd-minimizeapp", Vitrum.minimize);
   ipcMain.on('cmd-newfile', () => {
      Vitrum.newEditor();
   });

   ipcMain.on('cmd-close-editor', (eEvent, id) => {
      Vitrum.closeEditor(id);
   });

   ipcMain.on('cmd-save', async (eEvent, id, saveAs = false) => {
      Vitrum.savedFile(id, saveAs);
   });

   ipcMain.on('cmd-openfile', async (eEvent) => {
      Vitrum.openFiles();
   });

   ipcMain.on('cmd-renamefile', async (eEvent, id, newName) => {
      Vitrum.renameEditorFile(id, newName);
   });

   ipcMain.on('cmd-undo', (eEvent, id) => {
      const editor = EditorManager.getEditorWithID(id);
      if(!editor){
         sendConsoleOutput(
            '#dda2k | can\'t find Editor with id \'' + id + "'",
            'warn', 'Vitrum'
         );
         return;
      }
      editor.undo();
   });

   ipcMain.on('cmd-redo', (eEvent, id) => {
      const editor = EditorManager.getEditorWithID(id);
      if(!editor){
         sendConsoleOutput(
            '#dda2k | can\'t find Editor with id \'' + id + "'",
            'warn', 'Vitrum'
         );
         return;
      }
      editor.redo();
   });


   ipcMain.on('find_replace-update', Vitrum.handleFindnReplaceUpdate);
   ipcMain.on('ask', Vitrum.handleQuestionAsk);
   ipcMain.on('fetch-avaliable-fontlist', () => {
      if(!AvaliableFontsFamilies?.length) return;

      mainWindow.webContents.send(
         'update-fontlist', AvaliableFontsFamilies
      );
   });






   // Editor stuff
   ipcMain.on('editor-content-changed', async (eEvent, id, content) => {
      EditorManager.updateEditorContent(id, content);
   });

   EditorManager.on('request_createEditorUI', (docName, id, content, readonly) => {
      mainWindow.webContents.send('create-editor-ui', docName, id, content, readonly);
   });
   EditorManager.on('request_setActiveEditor', (id) =>
      mainWindow.webContents.send('setActive-editor-ui', id));
   EditorManager.on('request_destroyEditorUI', (id) =>
      mainWindow.webContents.send('destroy-editor-ui', id));
   EditorManager.on('request_update-save-status', (id, isSaved) =>
      mainWindow.webContents.send('update-editor-save-status', id, isSaved));
   EditorManager.on('request_update-doc-title', (id, title) =>
      mainWindow.webContents.send('editor-set-tabname', id, title));
   EditorManager.on('request_update-content', (id, content) =>{
      mainWindow.webContents.send('editor-update-content', id, content);
   });



   // When mainWindow is loaded
   mainWindow.once('ready-to-show', () => {
      mainWindowReady = true;

      if(currentState)
         mainWindow.webContents.send('update-state', currentState);
   })
});








app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') app?.quit();
});


// win.on('app-command', (e, cmd) => {
//    // Navigate the window back when the user hits their mouse back button
//    if (cmd === 'browser-backward' && win.webContents.canGoBack()) {
//       // win.webContents.goBack();
//    }
// });


/**
 * @returns {BrowserWindow}
 */
const createMainWindow = () => {
   let win = new BrowserWindow({
      width: 900,
      height: 600,
      frame: false,
      title: 'Vitrum',

      // titleBarStyle: 'hidden',
      webPreferences: {
         nodeIntegration: true,
         enableRemoteModule: true,
         preload: path.join(__dirname, 'preload.js'),
         contextIsolation: true
      }
   });
   win.openDevTools();
   win.loadFile('./UI/index.html');
   // require('@electron/remote/main').enable(win.webContents);
   return win;
}




const Vitrum = {
   /**close the application
    */
   async close(){
      const state = new State(
         mainWindow.getSize(),
         EditorManager.getAllEditors()
      );
      writeState(STATE_PATH, state);

      if(WRITE_LOG_FILE) await writeLog_file();
      app.quit();
   },

   minimize(){
      const win = BrowserWindow.getFocusedWindow();
      win.minimize();
   },

   toggleMaximize(){
      const win = BrowserWindow.getFocusedWindow();

      if(win.isMaximized()) win.unmaximize();
      else win.maximize();
   },

   newEditor(onNewWindow = false, content = null, docName = null, fpath = null){
      if(fpath == null&& docName == null){
         const editor = EditorManager.getAllEditors();
         let lastUntitled = 1;
         for(let [/*id*/, e] of editor){
            if(!e.docName.startsWith('Untitled')) continue;

            let uNumber = parseInt(e.docName.split(' ')[1]);
            if(isNaN(uNumber)) continue;
            if(lastUntitled <= uNumber) lastUntitled = uNumber + 1;
         }

         return EditorManager.createNewEditor('Untitled ' + lastUntitled);
      }

      return EditorManager.createNewEditor(docName, content, fpath);
   },







   /**show Comfirm modal window and return user's respond
    * @param {string} description
    * @param {string} title
    * @returns {Promise<string>} 'confirm' or 'cancel'
    */
   async showConfirmDialog(title, description){
      return new Promise(async (resolve, reject) => {
         const win = BrowserWindow.getFocusedWindow();
         const dialogWin = new BrowserWindow({
            parent: win,
            modal: true,
            width: 350, height: 300,
            frame: false,
            center: true,
            transparent: true,

            webPreferences: {
               nodeIntegration: true,
               contextIsolation: false
            }
         });

         await dialogWin.loadFile('./UI/confirmDialog.html');

         dialogWin.webContents.send('confirm-dialog_setText', title, description);

         const waitForRespond = (eEvent, value) => {
            ipcMain.removeListener('confirm-dialog_respond', waitForRespond);
            try{
               if(!dialogWin.isDestroyed())
                  dialogWin.destroy();

            }catch(err){
               process?.emitWarning(err);
            }
            resolve(value);
         };

         ipcMain.on('confirm-dialog_respond', waitForRespond);
      });
   },

   /**show Message modal window and return when user close it
    * @param {string} description
    * @param {string} title
    * @returns {Promise<void>}
    */
   async showMessageDialog(title, description){
      return new Promise(async (resolve, reject) => {
         const win = BrowserWindow.getFocusedWindow();
         const dialogWin = new BrowserWindow({
            parent: win,
            modal: true,
            width: 350, height: 300,
            frame: false,
            center: true,
            transparent: true,

            webPreferences: {
               nodeIntegration: true,
               contextIsolation: false
            }
         });

         await dialogWin.loadFile('./UI/messageDialog.html');

         dialogWin.webContents.send('message-dialog_setText', title, description);

         const waitForRespond = (eEvent) => {
            ipcMain.removeListener('message-dialog_respond', waitForRespond);
            try{
               if(!dialogWin.isDestroyed())
                  dialogWin.destroy();

            }catch(err){
               process?.emitWarning(err);
            }
            resolve();
         };

         ipcMain.on('message-dialog_respond', waitForRespond);
      });
   },


   async closeEditor(id){
      const editor = EditorManager.getEditorWithID(id);
      if(!editor) process?.emitWarning('#dkal2 | can\'t find Editor with id \'' + id + "'");

      if(!editor.isSaved){
         let res = await Vitrum.showConfirmDialog(
            'Confirm Close?',
            'There\'s Document that haven\'t been saved.<br>close this tab anyways?...'
         );
         if(res != 'confirm') return;
      }

      EditorManager.closeEditorWthID(id);
   },


   async savedFile(id, saveAs = false){
      const editor = EditorManager.getEditorWithID(id);
      if(!editor){
         process?.emitWarning('#dvsl2 | can\'t find Editor with id \'' + id + "'");
         return;
      }

      if(editor.isSaved) return;

      let savePath;
      if(!editor.filePath||saveAs){
         const res = await dialog.showSaveDialog(mainWindow, {
            title: 'Save As',
            filters: FileFilter,
            defaultPath: LAST_OPENFILE_PATH? path.join(LAST_OPENFILE_PATH, editor.docName): undefined
         });

         if(res.canceled||!res.filePath) return;

         const pathSplit = res.filePath.split('\\');
         LAST_OPENFILE_PATH = pathSplit.slice(0, pathSplit.length - 1).join('\\');

         if(saveAs) savePath = res.filePath;
         else {
            editor.filePath = res.filePath;
            editor.isSaved = true;
            editor.docName = pathSplit.at(-1);
         }
      }

      try {
         await EditorManager.writeContentToFile(editor, savePath);
      } catch (error) {
         sendConsoleOutput(
            `#dmk4c | an error when saving file '${savePath}'\nError message: ${error.stack}`,
            'error', 'Vitrum'
         );
      }
   },


   async openFiles(encoding = DEFAULT_ENCODING, paths = null){
      if(!paths){
         const res = await dialog.showOpenDialog(mainWindow, {
            title: 'Open',
            filters: FileFilter,
            properties: ['openFile', 'multiSelections'],
            defaultPath: LAST_OPENFILE_PATH
         });

         if(res.canceled||!res.filePaths.length) return;

         {
            const pathSplit = res.filePaths[0].split('\\');
            LAST_OPENFILE_PATH = pathSplit.slice(0, pathSplit.length - 1).join('\\');
         }
         paths = res.filePaths;
      }

      for(const filePath of paths){
         try{
            const editor = Vitrum.newEditor(
               false,
               null,
               filePath.split('\\').at(-1),
               filePath
            );
            editor.loadContent(filePath, encoding);
         }catch{

         }
      }
   },


   renameEditorFile(id, newName){
      const editor = EditorManager.getEditorWithID(id);
      if(!editor){
         process?.emitWarning('#adwl2 | can\'t find Editor with id \'' + id + "'");
         return;
      }

      if(!editor.filePath){
         editor.setEditorDocName(newName);
         return;
      }

      const newPath = path.join(
         editor.filePath.slice(0, editor.filePath.lastIndexOf('\\')),
         newName
      );

      try{
         renameSync(
            editor.filePath,
            newPath
         );
         editor.filePath;
         editor.setEditorDocName(newName);

      }catch(e){
         sendConsoleOutput(
            `#dmk4c | an error when renaming file '${savePath}'\nError message: ${error.stack}`,
            'error', 'Vitrum'
         );
         Vitrum.showMessageDialog(
            'Somthing went wrong',
            `looks like we can't <strong>rename</strong> this file<br>reason: ${e.message}`
         );
      }
   },

   /**this function is resposible for updating the position of effect applied by
    * Find and Replace, changing the options in the Findpanel as well as
    * all the replace operation
    * @param {string} activeEditorID
    * @param {} eEvent
    * @param {FindOption} findOption
    */
   handleFindnReplaceUpdate(eEvent,  activeEditorID, findOption){
      switch(findOption.action){
         case 'findnext':
            FR.selectedIndex++;
            updateEffects();
            break;
         case 'findprevious':
            if(FR.selectedIndex <= 0) return;
            FR.selectedIndex--;
            updateEffects();
            break;

         case 'update':
            FR.selectedIndex = 0;
         case 'textupdate':
            updateEffects();
            break;


         case 'replace':
         case 'replaceall':
         {
            const editor = EditorManager.getEditorWithID(activeEditorID);
            if(!editor){
               process?.emitWarning('#adql8 | can\'t find Editor with id \'' + activeEditorID + "'");
               return;
            }

            // console.log('replace| ', editor.content, findOption, FR.selectedIndex);

            editor.updateHistory();
            if(editor.history.length >= 2)
               editor.mergeHistoryEdits(0, 1);

            const content = FR.findAndReplaceText(editor.content, findOption);
            EditorManager.updateEditorContent(activeEditorID, content);
            mainWindow.webContents.send('editor-update-content', activeEditorID, content);
            break;
         }
      }




      function updateEffects(){
         const editor = EditorManager.getEditorWithID(activeEditorID);
         if(!editor){
            process?.emitWarning('#adiw1 | can\'t find Editor with id \'' + activeEditorID + "'");
            return;
         }
         // console.log(editor.content, findOption);

         mainWindow.webContents.send('update-editor-effects',
            activeEditorID,
            FR.findAndCreateEffects(editor.content, findOption)
         );
      }
   },



   /**handle Questions from MainWorld, this system works like
    * predicates where MainWorld ask something and the IsolatedWorld (Core)
    * will answer in **Yes** or **No** (true|false)
    * @param {'editorCanUndo'|'editorCanRedo'} question
    */
   handleQuestionAsk(eEvent, question, ...args){
      switch(question){
         case 'editorCanRedo':
         case 'editorCanUndo':
         {
            const editor = EditorManager.getEditorWithID(args[0]);
            if(!editor){
               mainWindow.webContents.send('answer',
                  question,
                  null // invalid
               );
               break;
            }

            mainWindow.webContents.send('answer',
               question,
               question == 'editorCanRedo'? editor.canRedo(): editor.canUndo()
            );
            break;
         }
      }
   },

   /**load installed and avaliable font families
    * and send update signal to Every components that depends on it
    */
   loadAvaliableFontsList(){
      sendConsoleOutput(`looking for installed Fonts...`, 'debug', 'Vitrum');
      FontList.getFonts().then(list => {
         AvaliableFontsFamilies = list;
         sendConsoleOutput(`found ${list.length} Font Families`, 'debug', 'Vitrum');

         mainWindow.webContents.send('update-fontlist', list);
      });
   }
}








