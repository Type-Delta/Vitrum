
import * as fs from 'fs';
import { sendConsoleOutput } from '../../utilities';


declare type V1RawObject = {
   version: 1,
   type: 'dark'|'white'
   [Symbol.iterator](): any
} & {
   [key: string]: string
}



export async function loadTheme(path: string){
   if(!fs.existsSync(path)) return null;

   const plainContent = fs.readFileSync(path, { encoding: 'utf-8' });
   const name = path.replace(/^.*[\\/]/, '').split('.')[0];

   let raw: any;
   try {
      raw = JSON.parse(plainContent);
   } catch(err) {
      sendConsoleOutput(
         `#md83k | unable to parse Theme, fallback to default theme\nError message: ${err.stack}`,
         'warn', 'ThemeLoader'
      );
      return null;
   }

   if(!raw) return null;

   switch(raw.version){
      default:
         sendConsoleOutput(
            'missing or invalid version number, try parsing with to version 1',
            'warn', 'ThemeLoader'
         );
      case 1:
         return parse_ver1(raw, name);
   }
}




function parse_ver1(rawObject: V1RawObject, name: string){
   const ignoreList = new Set(['version', 'type']);
   const varsMap: Map<string, string> = new Map();

   for(let key in rawObject){
      if(ignoreList.has(key)) continue;

      varsMap.set(key, rawObject[key]);
   }

   return {
      vars: Object.fromEntries(varsMap),
      type: rawObject.type,
      name
   };
}



