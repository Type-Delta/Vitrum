const { readFileSync } = require('fs');
const { parseBool, parseConfig } = require('./helper/Tools.js');


const CONFIG_PATH = './config.conf';


class Config {
   /// App
   STATE_PATH = './state.json';


   /// Editor
   /**
    * @type {string}
    */
   LAST_OPENFILE_PATH;
   DEFAULT_ENCODING = 'utf-8';
   MAX_HISTORY_SIZE = 35;
   /**
    * @type {'lessmemory'|'lesscomputation'}
    */
   OPTIMIZATION_MODE = 'lessmemory';
   TRIM_TRAILING_WHITESPACE = true;


   /// Log
   /**control which message should be shown in the console
    * debug: 4, normal: 3, error: 2, critical: 1
    */
   DEBUGLEVEL = 4;
   MIN_LOG_CONTENT = 1000;
   LOG_FOLDER_PATH = './logs';
   MAX_LOG_FILE = 10;
   WRITE_LOG_FILE = false;


   constructor(){
      this.loadConfig();
   }

   loadConfig(){
      let CONFIG;
      try{
         CONFIG = parseConfig(readFileSync(CONFIG_PATH, { encoding:'utf-8' }));

         if(!CONFIG){
            console.warn("@elas2e | unable to load config.");
            return;
         }


         // General
         if(CONFIG.LAST_OPENFILE_PATH) this.LAST_OPENFILE_PATH = CONFIG.LAST_OPENFILE_PATH;
         if(CONFIG.DEFAULT_ENCODING) this.DEFAULT_ENCODING = CONFIG.DEFAULT_ENCODING;
         if(CONFIG.MAX_HISTORY_SIZE) this.MAX_HISTORY_SIZE = parseInt(CONFIG.MAX_HISTORY_SIZE);
         if(CONFIG.TRIM_TRAILING_WHITESPACE) this.TRIM_TRAILING_WHITESPACE = parseBool(CONFIG.TRIM_TRAILING_WHITESPACE);


      }catch(e){
         console.warn(`@e4asae | unable to load config.\n${e}`);
      }
   }

   writeConfig(){
      //TODO
   }
}



if(!(module.exports instanceof Config)) module.exports = new Config;