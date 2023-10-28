const { readFileSync, existsSync, writeFileSync } = require('fs');
const { parseBool, parseConfig } = require('./helper/Tools.js');


const CONFIG_PATH = './config.conf';
const DEFAULT_CONFIG = `
###################   Vitrum Configuration   ###################
# each setting is defined by pair (key) = (value)
# Note that: some value can be modified by Vitrum later to reflect
#            the changes made in Preference.


# /////  Paths  /////
# Path (with file name) for State file that store last use state of Vitrum
# allow user to continue where they left of.
# Type: string
# Default: "./state.json"
STATE_PATH = "./state.json"

# Path to Theme file (temporary: this config will deprecate soon!)
# Type: string
# Default: "./themes/Obsidian.json"
THEME_PATH = "./themes/Obsidian.json"



# /////  Editors  /////
# Default Encoding
# this encoding is used for newly created files
# or when opening any files w/o spacify the encoding
# Type: choice
# Value can be: utf-8, latin1, ucs-2, utf16le
# Default: utf-8
DEFAULT_ENCODING = utf-8

# The maximum History size for Virtum to keep track of,
# this number will control how many times user can use
# Undo command (Ctrl+Z) in a row.
# Type: Interger
# Default: 35
MAX_HISTORY_SIZE = 35
`;

class Config {
   /// App
   /**Path (with file name) for State file that store last use state of Vitrum
    * allow user to continue where they left of.
    */
   STATE_PATH = './state.json';
   /** Path to Theme file
    */
   THEME_PATH = './themes/Obsidian.json';

   /// Editor
   /** TODO
    * @type {string}
    */
   LAST_OPENFILE_PATH;
   /**Default Encoding
    * this encoding is used for newly created files
    * or when opening any files w/o spacify the encoding
    */
   DEFAULT_ENCODING = 'utf-8';
   /**The maximum History size for Virtum to keep track of,
    * this number will control how many times user can use
    * Undo command (Ctrl+Z) in a row.
    */
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
   LOG_FOLDER_PATH = './logs';
   MAX_LOG_FILE = 10;
   WRITE_LOG_FILE = true;


   constructor(){
      this.loadConfig();
   }

   loadConfig(){
      let CONFIG;
      try{
         if(!existsSync(CONFIG_PATH)){
            try{
               writeFileSync(CONFIG_PATH, DEFAULT_CONFIG, { encoding: 'utf-8' });
            }catch{}
            return;
         }

         CONFIG = parseConfig(readFileSync(CONFIG_PATH, { encoding:'utf-8' }));

         if(!CONFIG){
            return;
         }


         // General
         if(CONFIG.LAST_OPENFILE_PATH) this.LAST_OPENFILE_PATH = CONFIG.LAST_OPENFILE_PATH;
         if(CONFIG.DEFAULT_ENCODING) this.DEFAULT_ENCODING = CONFIG.DEFAULT_ENCODING;
         if(CONFIG.MAX_HISTORY_SIZE) this.MAX_HISTORY_SIZE = parseInt(CONFIG.MAX_HISTORY_SIZE);
         if(CONFIG.TRIM_TRAILING_WHITESPACE) this.TRIM_TRAILING_WHITESPACE = parseBool(CONFIG.TRIM_TRAILING_WHITESPACE);
         if(CONFIG.THEME_PATH) this.THEME_PATH = CONFIG.THEME_PATH;


      }catch(e){
         return e.stack;
      }
   }

   writeConfig(){
      //TODO
   }
}



if(!(module.exports instanceof Config)) module.exports = new Config;