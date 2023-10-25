const fs = require('fs');

const { ncc, redexOf, sleep } = require('./helper/Tools.js');
const { VERSION, logs } = require('./Global.js');
const {
   MIN_LOG_CONTENT,
   LOG_FOLDER_PATH,
   MAX_LOG_FILE,
   DEBUGLEVEL
} = require('./config.js');

class SCOOption {
   /**color of this Message (only visible on TREMINAL)
    * @example color and fommats available:
    * `Reset, Bright, Dim, Underscore, Blink, Reverse, Hidden`
    * fontcolor:
    * `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * background color:
    * `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    * @type {string}
    */
   color;
   /**Int defind importance level of the Message,
    * ranging from 1 to 4;
    * **debug: 4, normal: 3, error: 2, critical: 1**
    * @type {number}
    */
   debugLevel;
   /**prefix insert to the front of the message when logging
    * @type {string}
    */
   prefix;

   constructor(){
      this.important = false;
      this.debugLevel = 3;
   }
}



class MCJsonText {
   /****console Color:**
    * `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * @type {string}
    */
   color;
   /****background Color:**
    * `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    * @type {string}
    */
   bgcolor;
   /****console Formats**
    * `Reset, Bright, Dim, Italic, Blink, Reverse, Hidden`
    * @type {string[]}
    */
   formats = [];
   /**make Forecolor Dim
    * @type {boolean}
    */
   dim = false;
   /**italic text
    * @type {boolean}
    */
   italic = false;
   /****Animated Text:** swich bettween Dim and Bright overtimes
    * @type {boolean}
    */
   blink = false;
   /**swich Background - Foreground
    * @type {boolean}
    */
   invert = false;
   /**make Text unreadable, to view it copy and paste else where
    * @type {boolean}
    */
   hidden = false;
   /**plain Text content
    * @type {string}
    */
   text;
   /**
    * @param {MCJsonText}mcText
    */
   static toString(mcText){
      let plain = '';
      if(mcText.formats&&mcText.formats instanceof Array)
         mcText.formats.forEach(f => { plain += ncc(f) });
      if(mcText.dim) plain += ncc('dim');
      if(mcText.italic) plain += ncc('italic');
      if(mcText.blink) plain += ncc('blink');
      if(mcText.invert) plain += ncc('invert');
      if(mcText.hidden) plain += ncc('hidden');

      if(mcText.color) plain += ncc(mcText.color);
      if(mcText.bgcolor) plain += ncc(mcText.bgcolor);

      return plain.concat(mcText.text + ncc('reset'));
   }

   toString(){
      return def.MCJsonText.toString(this);
   }
}

const Utilities = {
   /**send Text to Console
    * @param {String|MCJsonText|MCJsonText[]}Text Text to send or Json Text in the same format Minecraft used
    * @param {SCOOption|'debug'|'normal'|'warn'|'error'|'critical'} options [`options.color`] replace of `color: string`, [`options.debugLevel`] defind importance level of the Message; **Alternatively**, `options` can also be used as *Presets*: `"debug", "normal", "warn", "error", "critical"`
    * @param {string}prefix the header for this message
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
      Text,
      options = new SCOOption(),
      prefix = undefined,
      color = undefined
   ){
      let ignoreDefColor = false;
      let dbLevel = 0;
      let consTxt = parseStr(Text);
      let pconsTxt = parsePlain(Text);
      let prefixTxt = null;

      if(typeof options != 'object'||options === null){
         switch(options){ //switch preset
            case 'debug':
               dbLevel++;
            case 'normal':
            case null:
               // if `important` or  `color` is set, break;
               if(((typeof prefix == 'string'?false:prefix)??false)||color){
                  dbLevel = 0;
                  break;
               }
               dbLevel++;
            case 'warn':
            case 'error':
               dbLevel++;
            case 'critical':
               dbLevel++;
               options = {
                  important: dbLevel < 3&&options != 'warn',
                  color: dbLevel == 4? color||'Dim': (dbLevel > 2? color: (options == 'warn'?'yellow':'Red')),
                  debugLevel: dbLevel, //debug: 4, normal: 3, error: 2, critical: 1
                  /**arg `important` also can be use for definding `prefix`
                   * and in that case `important` would be a string
                  */
                  prefix: typeof prefix == 'string'? prefix:undefined
               }
               break;
         }

         // if preset is omited and/or options is not an Object
         if(!dbLevel){
            options = {
               important: (typeof prefix == 'string'?false:prefix)??false,
               color: color,
               debugLevel: 3
            }
         }
      }

      if(options?.prefix){
         prefixTxt = `\x1b[7m\x1b[2m ${options.prefix} \x1b[0m `;
         pconsTxt = `${options.prefix}: `.concat(pconsTxt);
      }

      Utilities.writeLog_cache(pconsTxt);


      if(options.debugLevel > DEBUGLEVEL) return;


      if (options.color) {
         if(options.color == 'None') options.color = undefined;
         else options.color = ncc(options.color);
      }

      if (options.color&&!ignoreDefColor) {
         if(options.debugLevel == 1) console.warn(
            `${ncc('yellow')}${ncc('bgred')} Critical \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${options.color}${consTxt}\x1b[0m`
         );
         else if(options.important&&options.debugLevel == 2) console.warn(
            `${ncc('black')}${ncc('bgred')} Error \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${options.color}${consTxt}\x1b[0m`
         );
         else if(options.debugLevel == 2) console.warn(
            `${ncc('black')}${ncc('bgyellow')} Warning! \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${options.color}${consTxt}\x1b[0m`
         );
         else console.log((prefixTxt? prefixTxt:'') + `${options.color}%s\x1b[0m`, consTxt);

      } else { //ignores options.color
         if(options.debugLevel == 1) console.warn(
            `${ncc('yellow')}${ncc('bgred')} Critical \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${consTxt}`
         );
         else if(options.important&&options.debugLevel == 2) console.warn(
            `${ncc('black')}${ncc('bgred')} Error \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${consTxt}`
         );
         else if(options.debugLevel == 2) console.warn(
            `${ncc('black')}${ncc('bgyellow')} Warning! \x1b[0m` + (prefixTxt? prefixTxt:'') + ` ${consTxt}`
         );
         else console.log((prefixTxt? prefixTxt:'') + consTxt);
      }

      return pconsTxt;


      /**
       * @param {string|MCJsonText|MCJsonText[]}cText
       */
      function parseStr(cText){
         let plain = '';
         if(cText instanceof Array){
            for(ct of cText){
               if(typeof ct == 'string') plain += ct;
               else if(ct instanceof Object&&!(ct instanceof Array)){
                  plain = plain.concat(MCJsonText.toString(ct));
                  if(ct.color) ignoreDefColor = true;
               }
            }
         }else if(cText instanceof Object){
            plain = plain.concat(MCJsonText.toString(cText));
            if(cText.color) ignoreDefColor = true;
         }else if(typeof(cText) == 'string') plain = cText;
         else throw new Error('@slmo5f | Object not a valid format');

         return plain;
      }

      /**similar to parseStr() but ignores all formating
       * @param {string|MCJsonText|MCJsonText[]}cText
       */
      function parsePlain(cText){
         let plain = '';
         if(cText instanceof Array){
            for(ct of cText){
               if(typeof ct == 'string') plain += ct;
               else if(ct instanceof Object&&!(ct instanceof Array)){
                  plain.concat(ct.text);
               }
            }
         }else if(cText instanceof Object)
            plain.concat(cText.text);
         else if(typeof(cText) == 'string') plain = cText;
         else throw new Error('@mu35a2 | Object not a valid format');

         return plain;
      }
   },





   /**
    * write logs from cache to log folder
    */
   async writeLog_file(coreLogs = logs){
      return new Promise((resolve, reject) => {
         sleep(1000 * 10); // TEST

         if(coreLogs.content == null||coreLogs.content.length < MIN_LOG_CONTENT) resolve();

         const D = new Date();
         if(
            coreLogs.to?.startsWith(
               `${D.getFullYear()}-${D.getMonth()+1}-${D.getDate()}_${D.getHours()}:${D.getMinutes()}`
            )
         ) resolve();

         let currentLogFileName = `${coreLogs.from.split(':')[0]}`;
         const logFileList = fs.readdirSync(LOG_FOLDER_PATH).filter(file => file.endsWith('.log'));
         let logFileMStimelist = [];
         let sameLogCount = 0;
         let logFileCount = 0;
         for(const logFile of logFileList){
            logFileMStimelist.push(parseInt(logFile.split('#')[1].replace('.log', '')));
            logFileCount++;
            if(logFile.startsWith(currentLogFileName)) sameLogCount++;
         }

         if(logFileCount >= MAX_LOG_FILE){
            logFileMStimelist.sort((a, b) => a - b);

            for(const logFile of logFileList){
               if(logFile.includes(logFileMStimelist[0].toString())){
                     fs.rmSync(LOG_FOLDER_PATH.concat(logFile));
               }
            }
         }

         coreLogs.to = `${D.getFullYear()}-${D.getMonth()+1}-${D.getDate()}_${D.getHours()}:${D.getMinutes()}:${D.getSeconds()}`;

         let headers = `___________________________________
   Session from: ${coreLogs.from}
   To: ${coreLogs.to}
   Version: ${VERSION}
   ___________________________________\n\n`;

         currentLogFileName = currentLogFileName.concat(`_id${sameLogCount + 1}_#${D.getTime()}.log`);
         fs.writeFile(
            LOG_FOLDER_PATH.concat(currentLogFileName),
            headers.concat(coreLogs.content),
            { encoding: 'utf-8' },
            () => {
               coreLogs.content = null;
               resolve();
         });
      });
   },








   /**
    * cache Message to the Log file cache,
    * the cache will be write to the real file when writeLog_file() is called
    * @param {String}message Message to cache
    */
   writeLog_cache(message){
      const D = new Date();
      if(logs.content == null){
         logs.from = `${D.getFullYear()}-${D.getMonth()+1}-${D.getDate()}_${D.getHours()}:${D.getMinutes()}:${D.getSeconds()}`;
         logs.content = '';
      }

      let times = [
         D.getHours().toString(),
         D.getMinutes().toString(),
         D.getSeconds().toString()
      ];

      for(let i = 0; i < times.length; i++){
         times[i] = times[i].padStart(2, '0');
      }

      const timeStamp = `${times[0]}:${times[1]}:${times[2]}| `;
      const timeStamp_blank = `        | `;
      let isFirstLine = true;
      const maxLine = 90; //max line length
      message = message.toString().split('\n');


      logs.content += timeStamp;
      for(let eachLine of message){
         while(eachLine.length > maxLine){
            if(!isFirstLine) logs.content += timeStamp_blank;
            else isFirstLine = false;

            let indexOfSep = redexOf(eachLine, /[\s:,|>=+-;})]/g, Math.round(maxLine * 0.6));
            indexOfSep = ((indexOfSep > maxLine)||(indexOfSep == -1)? maxLine: indexOfSep);
            indexOfSep++;

            logs.content += eachLine.substring(0, indexOfSep).concat('\n');
            eachLine = eachLine.substring(indexOfSep);
         }

         if(!isFirstLine) logs.content += timeStamp_blank;
         else isFirstLine = false;

         logs.content += eachLine.concat('\n');
      }
   },



   getNativeFontFamily(){
      switch(process.platform){
         case 'win32':
            return 'Segoe UI';
         case 'darwin':
            return 'San Francisco';
         case 'linux':
            return 'Noto Sans';
      }
   }
}


// elaina.sendConsoleOutput(
//    `Successfully saved log, Session from: ${coreLogs.from}  to: ${coreLogs.to}`,
//    'debug', 'MMS'
// );
// elaina.sendConsoleOutput('@m3ibaw | Failed to write Log file: ' + error, 'error', 'MMS');



module.exports = Utilities;