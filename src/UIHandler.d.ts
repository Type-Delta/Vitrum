
declare class SCOOption {
   /**color of this Message (only visible on TREMINAL)
    * @example color and fommats available:
    * `Reset, Bright, Dim, Underscore, Blink, Reverse, Hidden`
    * fontcolor:
    * `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * background color:
    * `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    * @type {string}
    */
   color: string;
   /**Int defind importance level of the Message,
    * ranging from 1 to 4;
    * **debug: 4, normal: 3, error: 2, critical: 1**
    * @type {number}
    */
   debugLevel: 4|3|2|1;
   /**prefix insert to the front of the message when logging
    * @type {string}
    */
   prefix: string;
}



declare class MCJsonText {
   /****console Color:**
    * `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * @type {string}
    */
   color: string;
   /****background Color:**
    * `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    * @type {string}
    */
   bgcolor: string;
   /****console Formats**
    * `Reset, Bright, Dim, Italic, Blink, Reverse, Hidden`
    * @type {string[]}
    */
   formats: string[] = [];
   /**make Forecolor Dim
    * @type {boolean}
    */
   dim: boolean = false;
   /**italic text
    * @type {boolean}
    */
   italic: boolean = false;
   /****Animated Text:** swich bettween Dim and Bright overtimes
    * @type {boolean}
    */
   blink: boolean = false;
   /**swich Background - Foreground
    * @type {boolean}
    */
   invert: boolean = false;
   /**make Text unreadable, to view it copy and paste else where
    * @type {boolean}
    */
   hidden: boolean = false;
   /**plain Text content
    * @type {string}
    */
   text: string;
   /**
    * @param {MCJsonText}mcText
    */
   static toString(mcText: MCJsonText): string

   toString(): string
}




export interface CoreAPI {
   handleCreateEditorUI: (Function: callback) => void
   handleSetActiveEditorUI: (Function: callback) => void
   handleDestroyEditorUI: (Function: callback) => void
   handleUpdateEditorSaveStatus: (Function: callback) => void
   handleSetEditorTabName: (Function: callback) => void
   handleUpdateEditorContent: (Function: callback) => void
   handleUpdateEditorEffects: (Function: callback) => void
   handleUpdateAvaliableFontlist: (Function: callback) => void
   handleUpdateAppState: (Function: callback) => void

   sendCloseAppCmd: () => void
   sendToggleMaximizeAppCmd: () => void
   sendMinimizeAppCmd: () => void
   sendNewFileCmd: () => void
   sendNewFileWindowCmd: () => void
   sendCloseEditorCmd: (id: string) => void
   sendSaveFileCmd: (id: string) => void
   sendSaveFileAsCmd: (id: string) => void
   sendOpenFileCmd: () => void
   sendRenameFileCmd: (id: string, newName: string) => void
   sendUndoCmd: (id: string) => void
   sendRedoCmd: (id: string) => void
   sendEditorContentUpdate: (id: string, content: string) => void
   sendFindnReplaceUpdate: (id: string, option) => void

   fetchAvaliableFontlist: () => void

   /**ask Questions to Core, this system works like
    * predicates where MainWorld ask something and the IsolatedWorld (Core)
    * will answer in **Yes** or **No** (true|false)
    * @returns  Answer in Promise if the Answer is `null` means either
    * the Core failed to respond in the set amout of time (control by `config.QUESTION_TIMEOUT_MS`) or
    * the question is invalid
    */
   askCore: (question: 'editorCanUndo'|'editorCanRedo', ...args: any[]) => Promise<boolean|null>

   /**send Text to Console
    * @param {String|MCJsonText|MCJsonText[]}Text Text to send or Json Text in the same format Minecraft used
    * @param {string}prefix the header for this message
    * @param {SCOOption|'debug'|'normal'|'warn'|'error'|'critical'} options [`options.color`] replace of `color: string`, [`options.debugLevel`] defind importance level of the Message; **Alternatively**, `options` can also be used as *Presets*: `"debug", "normal", "warn", "error", "critical"`
    * @param {string}color color or fommat of the Terminal(Node Console) Text.
    * @example
    * fommat available: `Reset, Bright, Dim, Italic, Blink, Invert, Hidden`
    * fontcolor: `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * background color: `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    * @example // Usage
    * sendConsoleOutput('some normal text...');
    *
    * sendConsoleOutput('oh no! an Error in the code :O', 'error');
    *
    * sendConsoleOutput('just some Green debug text', {
    *     color: 'Green',
    *     debugLevel: 4
    * });
    *
    * sendConsoleOutput('this text can only be seen on Console',{
    *     displayMode: "CONSOLE_ONLY"
    * });
    *
    * sendConsoleOutput('message with prefix', 'normal', 'Nice Prefix', 'green');
    *
    * sendConsoleOutput([
    *       {text: 'f', color: 'green', italic: true, bgcolor: 'white'},
    *       {text: 'a', color: 'yellow', italic: true, bgcolor: 'white'},
    *       {text: 'n', color: 'cyan', italic: true, bgcolor: 'white'},
    *       {text: 'c', color: 'white', italic: true, bgcolor: 'white'},
    *       {text: 'y', color: 'Magenta', italic: true, bgcolor: 'white'},
    * ]);
    * @returns {Promise<string>} text that has been send
   */
   async sendConsoleOutput(
      Text: string|MCJsonText|MCJsonText[],
      options?: SCOOption|'debug'|'normal'|'warn'|'error'|'critical',
      prefix?: string,
      color?: string
   ): Promise<string>
}

export interface _ {
   cloneDeep: (value: any) => any
}

export interface EditorPackage {
   tabElement: HTMLElement
   textAreaElement: HTMLElement
}






declare global {
   interface Window {
      coreAPI: CoreAPI
      _: _
   }
}
