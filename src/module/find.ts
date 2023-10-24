/**Fine and Replace Module
 * for Find and Replace element
 */;
import { FindOption } from "../helper/Definitions";
import { getMatchAllResults, escapeRegExp, strSplice } from "../helper/Tools";
import { EditorEffect } from "../UIHandlerClass.js";


// to compile: tsc ./src/module/find.ts --target esnext --module commonjs

class FindnReplace {
   private _selectedIndex: number = 0;
   public get selectedIndex(): number {
      return this._selectedIndex;
   }

   public set selectedIndex(v: number) {
      if(v < 0) return;
      this._selectedIndex = v;
   }

   /**find and create EditorEffects base on the match result
    */
   public findAndCreateEffects(content: string, option: FindOption){
      const selectedEffect = new EditorEffect('selected-highlight', 'find');
      const effect = new EditorEffect('highlight', 'find');

      const matchs = this.findAndMatchAll(content, option);

      for(const match of matchs){
         if(match.isSelected){
            selectedEffect.positions.push([
               match.start, match.end
            ]);
            continue;
         }

         effect.positions.push([
            match.start, match.end
         ]);
      }

      if(!selectedEffect.positions.length) return null;

      if(!effect.positions.length){
         return [ selectedEffect ];
      }else return [
         selectedEffect,
         effect
      ];
   }


   public findAndMatchAll(content: string, option: FindOption){
      const reg = new RegExp(
         option.useRegex? option.findStr: escapeRegExp(option.findStr),
         option.matchCase? 'g': 'ig'
      );

      let useSelection = option.matchSelected&&option.selection[0] != option.selection[1];
      let offset = 0, _content: string;
      if(useSelection){
         _content = content.slice(option.selection[0], option.selection[1]);
         offset = option.selection[0];
      }else _content = content;

      const results = getMatchAllResults(_content.matchAll(reg));

      if(this._selectedIndex >= results.length) this._selectedIndex = results.length - 1;

      let resIndex = 0, res: FindnReplaceMatch[] = [];
      for(const match of results){
         if(option.matchWholeWord && !isMatchWholeWord(match, _content)) continue;

         res.push(new FindnReplaceMatch(
            match.start + offset,
            match.end + offset,
            match.value,
            (resIndex++ == this._selectedIndex)
         ));
      }

      return res;
   }



   public findAndReplaceText(content: string, option: FindOption, replaceAll?: boolean){
      if(replaceAll === undefined) replaceAll = option.action == 'replaceall';
      let _content = content + '';

      const matchs = this.findAndMatchAll(content, option);

      let offset = 0, oldLength: number;
      for(const match of matchs){
         if(!replaceAll){
            if(match.isSelected){
               return strSplice(
                  _content,
                  match.start,
                  match.value.length,
                  getReplaceStr(match.value)
               );
            }
            continue;
         }


         _content = strSplice(
            _content,
            match.start + offset,
            match.value.length,
            getReplaceStr(match.value)
         );
         offset += option.replaceStr.length - match.value.length;
      }

      return _content;

      /**get replacement string based on the `option`
       */
      function getReplaceStr(matchV: string){
         if(!option.preserveCase) return option.replaceStr;

         const { allUpperCase, upperCasePos } = extractCase(matchV);
         if(allUpperCase)
            return option.replaceStr.toUpperCase();

         // map casing
         let mapedStrArr = [...option.replaceStr];
         for(const p of upperCasePos){
            mapedStrArr[p] = option.replaceStr[p].toUpperCase();
         }
         return mapedStrArr.join('');
      }
   }

}

const FR = new FindnReplace();
export default FR;





class FindnReplaceMatch {
   start: number;
   end: number;
   value: string;
   isSelected: boolean;
   constructor(start: number, end: number, value: string, isSelected: boolean){
      this.start = start;
      this.end = end;
      this.value = value;
      this.isSelected = isSelected;
   }
}






function isMatchWholeWord(match: any, content: string){
   const frontIsWordBegin = match.start > 0?
      /\W/.test(content[match.start - 1]): true;
   const backIsWordEnd = match.end < content.length?
      /\W/.test(content[match.end]): true;
   return frontIsWordBegin && backIsWordEnd;
}


/**extract casing style from the given string
 */
function extractCase(str: string){
   let res: Res = {
      upperCasePos: [],
      allUpperCase: false
   };

   for(let i = 0; i < str.length; i++){
      if(isUpperCase(str[i])) res.upperCasePos.push(i);
   }

   if(res.upperCasePos.length == str.length)
      res.allUpperCase = true;

   return res;

   interface Res {
      upperCasePos: number[];
      allUpperCase: boolean;
   }
}


function isUpperCase(char: string){
   return char.charCodeAt(0) > 64&&char.charCodeAt(0) < 91;
}

