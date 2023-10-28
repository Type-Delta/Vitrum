const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
var fs; // fs = require('fs');
const path = require('node:path');
var FontList; // FontList = require('font-list');
const { propertiesCount, parseArgs, isValidFilePath } = require('../helper/Tools.js');

const { writeLog_file, sendConsoleOutput } = require('../utilities.js');
const { EditorManager } = require('./editor.js');
const { writeState, State, loadState } = require('./state.js');
const { loadTheme } = require('./module/themeLoader.js');
let {
   STATE_PATH,
   LAST_OPENFILE_PATH,
   DEFAULT_ENCODING,
   WRITE_LOG_FILE,
   THEME_PATH
} = require('../config.js');
let { currentState } = require('../Global.js');

// import { FindOption } from './helper/Definitions'; // for Definitions only
var FR; // FR = require('./module/find.js').default;









// Consts
const argv = process.argv.slice(2);
const ParamTemplate = {
   help: {
      pattern: ['--help', '-h'],
      isFlag: true
   },
   newWindow: {
      pattern: ['--window', '-w'],
      isFlag: true
   }
}
const allParamPattern = (() => {
   let all = [];
   for(const cmd in ParamTemplate) all.push(...ParamTemplate[cmd].pattern);
   return all;
})()
const ParsedArgs = parseArgs(argv, ParamTemplate, false);
const MAINWINDOW_HTML_PATH = './src/UI/mainWindow.html';
const CONFIRMDIALOG_HTML_PATH = './src/UI/confirmDialog.html';
const MESSAGEDIALOG_HTML_PATH = './src/UI/messageDialog.html';
const FileFilter = [
   { name: 'Plain Text', extensions: ['txt'] },
   { name: 'Mark Down', extensions: ['md'] },
   { name: 'All Files', extensions: ['*'] }
];


sendConsoleOutput(
   `received command line args: ${argv}`,
   'debug', 'Vitrum'
);



// Vars

/**installed and available font family names
 * @type {string[]}
 */
let AvailableFontsFamilies = null;
/**@type {BrowserWindow} */
let mainWindow;
const DragWindow = {
   dragStartWidth: null,
   dragStartHeight: null,
   mouseX: null,
   mouseY: null,
}
let theme;
let StartupMode = 'normal';





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
   const win = new BrowserWindow({
      width: currentState.windowSize?.[0] ?? 720,
      height: currentState.windowSize?.[1] ?? 420,
      frame: false,
      title: 'Vitrum',
      x: currentState.windowPos?.[0],
      y: currentState.windowPos?.[1],
      show: false,
      // titleBarStyle: 'hidden',
      webPreferences: {
         nodeIntegration: true,
         enableRemoteModule: true,
         preload: path.join(__dirname, 'preload.js'),
         contextIsolation: true
      }
   });
   // win.openDevTools();
   win.loadFile(MAINWINDOW_HTML_PATH);
   return win;
}




const Vitrum = {
   OnceReadyCallbacks: [],

   onceReady(callback){
      Vitrum.OnceReadyCallbacks.push(callback);
   },

   /**close the application
    */
   async close(fastExit = false){
      const quitTimeout = setTimeout(() => {
         sendConsoleOutput(
            `Timeout when waiting for exit process, exit immediately.`,
            'error', 'Vitrum'
         );
         app.quit();
      }, 3000);

      let write_state, write_log;
      if(currentState&&!fastExit){
         const uiState = await Vitrum.fetchUIState();
         if(uiState){
            currentState.windowSize = mainWindow.getSize();
            currentState.windowPos = mainWindow.getPosition();
            currentState.openedEditors = EditorManager.getAllEditors();
            currentState.editor = uiState.editor;
            write_state = writeState(STATE_PATH, currentState);
         }
      }

      if(WRITE_LOG_FILE){
         write_log = writeLog_file();
      }

      await Promise.all([write_state, write_log]);
      clearTimeout(quitTimeout);
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
      if(fpath == null&&docName == null){
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

         await dialogWin.loadFile(CONFIRMDIALOG_HTML_PATH);

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

         await dialogWin.loadFile(MESSAGEDIALOG_HTML_PATH);

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
         sendConsoleOutput(
            '#dvsl2 | can\'t find Editor with id \'' + id + "'",
            'warn', 'Vitrum'
         );
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
         sendConsoleOutput(
            '#adwl2 | can\'t find Editor with id \'' + id + "'",
            'warn', 'Vitrum'
         );
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
         fs.renameSync(
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

   /**this function is responsible for updating the position of effect applied by
    * Find and Replace, changing the options in the Findpanel as well as
    * all the replace operation
    * @param {string} activeEditorID
    * @param {} eEvent
    * @param {FindOption} findOption
    */
   handleFindnReplaceUpdate(eEvent,  activeEditorID, findOption){
      console.log(`find and replace`);
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
               sendConsoleOutput(
                  '#adql8 | can\'t find Editor with id \'' + activeEditorID + "'",
                  'warn', 'Vitrum'
               );
               return;
            }

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
            sendConsoleOutput(
               '#adiw1 | can\'t find Editor with id \'' + activeEditorID + "'",
               'warn', 'Vitrum'
            );
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
    * predicates where MainWorld asks something and the IsolatedWorld (Core)
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

   /**handle Command line arguments
    * @returns {boolean} true == exit app
    */
   handleCLI(){
      if(ParsedArgs.help){
         sendConsoleOutput([
            {
               text: ' Usage \n',
               formats: ['bgwhite', 'black']
            },{
               text: 'vitrum <filepath> [<options>...]\n',
               color: 'magenta'}
            // ,{
            //    text: '\tOptions\n',
            //    formats: ['bgwhite', 'black']
            // },{
            //    text: '\t--window, -w\t\t',
            //    color: 'cyan'
            // },{
            //    text: 'open file in new window'
            // }
         ]);
         app.quit();
         return true;
      }

      if(!isValidFilePath(argv[0])&&(!allParamPattern.includes(argv[0])||argv.length > 1)){
         sendConsoleOutput(
            `'${argv[0]}' is not a file path. use 'vitrum -h' to see help message`,
            'normal', 'Vitrum'
         );
         return true;
      }

      // if(!path.isAbsolute(argv[0])){
      //    argv[0] = path.join(path.dirname(__dirname), argv[0]);
      // }
      if(argv[0] === '.') return false;
      Vitrum.onceReady(() => {
         if(fs.existsSync(argv[0]))
            Vitrum.openFiles(DEFAULT_ENCODING, argv[0]);
         else Vitrum.newEditor(
            false, null,
            argv[0].split(/[/\\]/g).at(-1),
            argv[0]
         );
      });

      // if(ParsedArgs.newWindow) StartupMode = 'newwindow';
      return false;
   },


   /**
    * @typedef {Object} UIState
    * @property {{
    *    fontFamily: string,
    *    fontSize: number,
    *    encoding: string,
    *    lineSpacing: number,
    *    letterSpacing: number
    * }} editor - editor settings
    */
   /**fetch editor settings and UI layout from the mainWorld
    * @returns {Promise<UIState>}
    */
   async fetchUIState(){
      return new Promise((resolve, reject) => {
         mainWindow.webContents.send('fetch-ui-state_fetch');
         ipcMain.once('fetch-ui-state_respond', handleUIStateRes);
         const timeout = setTimeout(() => {
            resolve(null);
         }, 1000);

         function handleUIStateRes(eEvent, state){
            clearTimeout(timeout);
            resolve(state);
         }
      });
   },


   /**load installed and available font families
    * and send update signal to Every components that depends on it
    */
   loadAvailableFontsList(){
      sendConsoleOutput(`looking for installed Fonts...`, 'debug', 'Vitrum');
      FontList.getFonts().then(list => {
         AvailableFontsFamilies = list;
         sendConsoleOutput(`found ${list.length} Font Families`, 'debug', 'Vitrum');

         mainWindow.webContents.send('update-fontlist', list);
      });
   },


   sendLoadedTheme(){
      sendConsoleOutput(
         `loading Theme "${theme.name}" from '${THEME_PATH}' with ${propertiesCount(theme.vars)} modifiers.`,
         'normal', 'Vitrum'
      );
      mainWindow.webContents.send('update-theme', theme);
   },


   async StartUp(){
      console.timeEnd('electron startup');
      console.time(`Vitrum startup`);

      sendConsoleOutput('starting...', 'debug', 'Vitrum');
      if(Vitrum.handleCLI()) return;

      sendConsoleOutput('loading Dependencies...', 'debug', 'Vitrum');
      Vitrum.deferLoadDependencies();



      sendConsoleOutput('starting with ' + StartupMode, 'debug', 'Vitrum');

      let isPrimaryIns = app.requestSingleInstanceLock();
      if (!isPrimaryIns) {
         sendConsoleOutput(
            'Other instance is running, it will handle the rest\nexiting...',
            'normal', 'Vitrum'
         );
         return app.quit();
      }

      try {
         currentState = await loadState(STATE_PATH);
      } catch (err) {
         sendConsoleOutput(
            '#mdo9d | failed to load state file\nError message: ' + err.stack,
            'warn', 'Vitrum'
         );
         currentState = new State();
      }


      // temporary, trust me
      theme = await loadTheme(THEME_PATH);

      sendConsoleOutput('starting web content...', 'debug', 'Vitrum');
      mainWindow = createMainWindow();
      app.on('activate', () => {
         if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
      });



      queueMicrotask(Vitrum.loadAvailableFontsList);



      // Application handler
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

      ipcMain.on('cmd-undo', (eEvent, id, selection) => {
         const editor = EditorManager.getEditorWithID(id);
         if(!editor){
            sendConsoleOutput(
               '#dda2k | can\'t find Editor with id \'' + id + "'",
               'warn', 'Vitrum'
            );
            return;
         }
         editor.undo(selection);
      });

      ipcMain.on('cmd-redo', (eEvent, id, selection) => {
         const editor = EditorManager.getEditorWithID(id);
         if(!editor){
            sendConsoleOutput(
               '#dda2k | can\'t find Editor with id \'' + id + "'",
               'warn', 'Vitrum'
            );
            return;
         }
         editor.redo(selection);
      });


      ipcMain.on('find_replace-update', Vitrum.handleFindnReplaceUpdate);
      ipcMain.on('request-reload-theme', async () => {
         theme = await loadTheme(THEME_PATH);
         Vitrum.sendLoadedTheme();
      });
      ipcMain.on('request-load-inspector', async () => {
         mainWindow.openDevTools();
      });
      ipcMain.on('ask', Vitrum.handleQuestionAsk);
      ipcMain.on('fetch-available-fontlist', () => {
         if(!AvailableFontsFamilies?.length) return;

         mainWindow.webContents.send(
            'update-fontlist', AvailableFontsFamilies
         );
      });



      /**make window draggable by manualy moving them to the pointer position (relative)
       *
       * and for some reason, use setInterval() directly in mainprocess
       * is laggy when compare to using it in renderprocess to then
       * evoke 'user-drag-window' for every frame
       */
      ipcMain.on('user-drag-window', () => {
         const { x, y } = screen.getCursorScreenPoint();

         /**cann't use `mainWindow.setPosition()` because on Windows
          * divice with scalling that's not 100%
          * `mainWindow.setPosition()` will also change the window size.
          * https://github.com/electron/electron/issues/9477
          */
         mainWindow.setBounds({
            x: x - DragWindow.mouseX,
            y: y - DragWindow.mouseY,
            width: DragWindow.dragStartWidth,
            height: DragWindow.dragStartHeight,
         }, false);
      });

      ipcMain.on('user-drag-window-start', (eEvent, mouseX, mouseY) => {
         [
            DragWindow.dragStartWidth,
            DragWindow.dragStartHeight
         ] = mainWindow.getSize();

         DragWindow.mouseX = mouseX;
         DragWindow.mouseY = mouseY;
      });


      // Editor stuff
      ipcMain.on('editor-content-changed', async (eEvent, id, content, selection) => {
         EditorManager.updateEditorContent(id, content, selection);
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
      EditorManager.on('request_update-content', (id, content, selection) => {
         mainWindow.webContents.send('editor-update-content', id, content, selection);
      });

      // When mainWindow is loaded
      mainWindow.once('ready-to-show', () => {
         console.timeEnd(`Vitrum startup`);

         sendConsoleOutput('web content is ready', 'debug', 'Vitrum');
         if(currentState){
            mainWindow.webContents.send('update-editor-state', currentState.editor);
            EditorManager.restoreEditors(currentState);
         }

         if(theme){
            Vitrum.sendLoadedTheme();
         }

         mainWindow.show();

         while(Vitrum.OnceReadyCallbacks.length){
            (Vitrum.OnceReadyCallbacks.pop())();
         }
      });
   },


   deferLoadDependencies(){
      setTimeout(() => {
         fs = require('fs');
         FontList = require('font-list');
         FR = require('./module/find.js').default;
      }, 4);
   }
}










console.time('electron startup');
app.whenReady().then(Vitrum.StartUp);

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') app?.quit();
});

app.on('render-process-gone', (eEvent, webc, details) => {
   if(details.reason === 'clean-exit') return;
   sendConsoleOutput(
      `Render Process Killed:\n\treason: ${details.reason}\n\texitCode: ${details.exitCode}, exiting app.`,
      'critical', 'Vitrum'
   );
   Vitrum.close();
});

app.on('child-process-gone', (eEvnet, details) => {
   if(details.reason === 'clean-exit') return;
   sendConsoleOutput(
      `${details.type} Process Killed:\n\treason: ${details.reason}\n\tprocess: ${details.name||'-'}\n\tserviceName: ${details.serviceName||'-'}, \nexiting app.`,
      'critical', 'Vitrum'
   );
   Vitrum.close();
});

app.on('second-instance', (eEvent, argv, dir, data) => {
   argv = argv.slice(2);
   // const parsed = parseArgs(argv, ParamTemplate, false);

   if(!isValidFilePath(argv[0])&&(!allParamPattern.includes(argv[0])||argv.length > 1)){
      sendConsoleOutput(
         `'${argv[0]}' is not a file path. use 'vitrum -h' to see help message`,
         'normal', 'Vitrum'
      );
      return;
   }

   if(!path.isAbsolute(argv[0])){
      argv[0] = path.join(path.dirname(dir), argv[0]);
   }

   if(fs.existsSync(argv[0]))
      Vitrum.openFiles(DEFAULT_ENCODING, argv[0]);
   else Vitrum.newEditor(
      false, null,
      argv[0].split(/[/\\]/g).at(-1),
      argv[0]
   );
});







