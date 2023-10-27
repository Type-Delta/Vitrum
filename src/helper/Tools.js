//////////// Tools ////////////
/**tools for Javascript
 * @version 2.10.13
 * @changes added Timer
 */
"use strict";

const onNodeJS = (typeof window === 'undefined');

/**for `Tools.getMatchAllResult()`
 */
class MatchResult {
   /**the matched string
    * @type {string}
    */
   value;
   /**start index
    * @type {number}
    */
   start;
   /**end index
    * @type {number}
    */
   end;
   constructor(v, s, e){
      this.value = v;
      this.start = s;
      this.end = e;
   }
}


class TFIDFValues {
   TF;
   IDF;
   TF_IDF;
   constructor(TF){
      this.TF = TF;
   }
}


const Tools = {
   /**format JSON string to make it more human-readable
    * ***Waring:* in the current version this function will remove any White-Space in the string which can cause MASSIVE INFORMATION LOSS!!**
    * @param {string}JsonString
    * @returns {string} the beautified JSON string
    */
   beautifyJson(JsonString){
      JsonString = JsonString.replace(/\s/, ""); //remove SPACE
      let _string = JsonString + "";
      let openBrackets = Tools.getMatchAllIndexs(JsonString.matchAll(/[{\[]/g))
         .sort((a, b) => a - b);
      let closeBrackets = Tools.getMatchAllIndexs(JsonString.matchAll(/[}\]]/g))
         .sort((a, b) => a - b);



      for(let layer = 0, addedLength = 0, reading = 0; reading < JsonString.length; ){
         let nearestOpen = openBrackets[findNearestBrack(openBrackets, reading)];
         let nearestClose = closeBrackets[findNearestBrack(closeBrackets, reading)];
         nearestOpen = nearestOpen == undefined? Infinity: nearestOpen;
         // console.log(nearestClose, nearestOpen);
         if(nearestOpen < nearestClose){
            layer++;
            reading = nearestOpen + 1;
         }
         else{
            layer--;
            reading = nearestClose + 1;
         }

         const nextNearestO = openBrackets[findNearestBrack(openBrackets, reading)];
         const nextNearestC = closeBrackets[findNearestBrack(closeBrackets, reading)];
         // console.log(nextNearestO);
         // console.log(nextNearestC);
         const nextNearest = nextNearestO < nextNearestC? nextNearestO: nextNearestC;
         const indent = "".padEnd(layer, "\t");


         if(isOpenBrack(_string[reading+addedLength-1])){
            _string = Tools.strSplice(_string, reading + addedLength, 0, '\n');
         }else{
            _string = Tools.strSplice(_string, reading + addedLength - 1, 0, '\n');
            _string = Tools.strSplice(_string, reading + addedLength, 0, indent);
            addedLength += indent.length;
         }
         addedLength++;
         // console.log(`S > "${_string}"`);

         //add \n
         // console.log(reading, nextNearest);
         let isolated = JsonString.substring(reading, nextNearest);
         let quoteIndex = Tools.getMatchAllIndexs(isolated.matchAll("\""))
            .filter(i => i != 0? isolated[i - 1] != "\\": true); //remove index of " that has \ as prefix
         if((quoteIndex.length % 2) != 0)
            throw new Error("cannot match Double-Quote correctly from String: \"" + isolated + '\"');

         let needNewLine = Tools.getMatchAllIndexs(isolated.matchAll(/[,]/g))
            .filter(i => {
               // remove commas that were inside any of ""
               for (let l = 0; l < quoteIndex.length; l += 2)
                  if (i > quoteIndex[l] && i < quoteIndex[l + 1]) return false;
               return true;
            });
         // const needSpace = Tools.getMatchAllIndexs(isolated.matchAll(/[:]/g))
         //    .filter(i => {
         //       // remove commas that were inside any of ""
         //       for (let l = 0; l < quoteIndex.length; l += 2)
         //          if (i > quoteIndex[l] && i < quoteIndex[l + 1]) return false;
         //       return true;
         //    });


         for(let i = 0; i < needNewLine.length + 1; i++){
            const writeIndex = i == 0? reading + addedLength: needNewLine[i - 1] + addedLength + reading + 1;

            if(isOpenBrack( _string[writeIndex - 1]) == null){
               _string = Tools.strSplice(_string, writeIndex, 0, indent);
               addedLength += indent.length;
            }


            if(!_string[(needNewLine[i]) + addedLength + reading]) break; // end of content...
            // add \n for each elements
            _string = Tools.strSplice(_string, (needNewLine[i] + 1) + addedLength + reading, 0, '\n');
            addedLength++;
         }
      }

      return _string;


      // Local Functions
      function isOpenBrack(str){
         const open = new RegExp(/[\{\[]/);
         const close = new RegExp(/[}\]]/);
         if(open.test(str)) return 1;
         if(close.test(str)) return 0;
         return null;
      }

      function findNearestBrack(brackets, reading) {
         let shortestGap = Infinity;
         let nearestIndex;
         for (let i = 0, n = brackets[i]; i < brackets.length; n = brackets[++i]) {
            const gap = n - reading;
            if (!gap) return i;
            if (gap < 0) continue;
            if (gap < shortestGap) {
               shortestGap = gap;
               nearestIndex = i;
            }
         }
         return nearestIndex;
      }
   },



   bucketSort(NumArr, bucketCount){
      const max = Math.max(...NumArr);
      const min = Math.min(...NumArr);
      const buckRange = (max - min) / bucketCount;


      //create empty Array the size of `bucketCount` for containing all buckets
      let buckContainer = [];
      while(buckContainer.length < bucketCount) buckContainer.push([]);


      //fill each bucket with numbers in `NumArr` in with accending order bucket
      for(let i = 0; i < NumArr.length; i++){
         let buckIndex = (Math.ceil((NumArr[i] - min) / buckRange) || 1) - 1;
         buckContainer[buckIndex].push(NumArr[i]);
      }

      NumArr = [];
      //sort each bucket
      for(let i = 0; i < buckContainer.length; i++){
         buckContainer[i].sort((a, b) => a - b);
         NumArr  = NumArr.concat(buckContainer[i]);
      }
   },




   /**clean array
    * @param {any[]} Arr array to clean
    * @param {any|any[]} itemToClean items to wipe off, optional(if None is provide,
    * will remove empty String, Array, Object),
    * can be array EX: ['0', '', 'g'] (those are Black-Listed items)
    * @returns new cleaned array
    */
   cleanArr(Arr, itemToClean = null){
      let _arr;

      if(itemToClean && itemToClean instanceof Array){
         itemToClean.forEach(item => {
            _arr = Arr.filter(function (itemInArr) {
               return itemInArr !== item;
            });
         })

      } else if(itemToClean){
         _arr = Arr.filter(function (itemInArr) {
            return itemInArr !== itemToClean;
         });

      } else{
         _arr = Arr.filter(itemInArr =>
            (itemInArr !== ''&&!this.isEmptyArray(itemInArr)&&!this.isEmptyObject(itemInArr))
         );
      }
      return _arr;
   },



   cleanString(string){
      return string.replace(/\[[0-9]+m/g, '');
   },



   DataScienceKit: {
      /**calculate how many times each unique elements
       * appears in the given array
       * @param {any[]|string} arr
       */
      frequencyOf(arr){
         const uniqueElems = [...new Set(arr)];
         let fqMap = new Map(
            uniqueElems.map(v => [v, 0])
         );

         for(const eachElem of arr){
            uniqueElems.forEach((e, i, a) => {
               if(e == eachElem){
                  fqMap.set(e, fqMap.get(e) + 1);
               }
            });
         }

         return fqMap;
      },


      /**return **Longest Common Subsequence** of two string or array
       * where each value can be compare with each other;
       * this is useful for determining how close those
       * Arrays/String are in terms of equality
       * @param {string|any[]} arrA
       * @param {string|any[]} arrB
       * @param comparator function that return `true` when the given values
       * is considered Equal
       */
      LCS_of(arrA, arrB, comparator = (a, b) => a === b){
         if(!(arrA?.length&&arrB?.length)) return [];

         /**3d matrix:
          * row: representative of strA
          * col: representative of strB
          * depth: [value, arrawDirection]
          * arrawRotation: (1: up (row--), 2: left (col--), 3: up left (row--, col--))
          * @type {number[][][]}
          */
         let lcsMatrix = [];
         const matrixWidth = arrB.length;
         const matrixHeight = arrA.length;
         while(lcsMatrix.length < matrixHeight) lcsMatrix.push(
            new Array(matrixWidth)
         );

         // fill matrix
         for(let row = 0; row < lcsMatrix.length; row++){
            for(let col = 0; col < lcsMatrix[row].length; col++){
               if(comparator(arrA[row], arrB[col])){
                  const upLeft_v = getValue(row - 1, col - 1);
                  lcsMatrix[row][col] = [upLeft_v + 1, 3];
                  continue;
               }

               const left_v = getValue(row, col - 1);
               const up_v = getValue(row - 1, col);
               if(left_v > up_v)
                  lcsMatrix[row][col] = [left_v, 2];
               else lcsMatrix[row][col] = [up_v, 1];
            }
         }


         let lcs = [];
         lcsTraverse(matrixHeight - 1, matrixWidth - 1);
         return lcs;

         /**recursively traverse from the last position of the matrix
          * by following the direction pointed by Arrow
          */
         function lcsTraverse(row, col){
            if(row < 0||col < 0) return;

            // switch arrow direction
            switch(lcsMatrix[row][col][1]){
               case 1: // up
                  lcsTraverse(row - 1, col);
                  break;
               case 2: // left
                  lcsTraverse(row, col - 1);
                  break;
               case 3: // up left
                  lcs.unshift(arrA[row]);
                  lcsTraverse(row - 1, col - 1)
                  break;
            }
         }

         function getValue(row, col){
            if(row < 0||col < 0) return 0;
            else return lcsMatrix[row][col][0];
         }
      },



      /**returns **Term Frequency - Inverse Documents Frequency**
       * of every words in the the `documents`, where `documents`
       * is a 2d Array of words:
       * row: each document
       * col: each word;
       * useful for determining the importance for each words
       * across all documents
       * @param {string[][]} documents
       * 2d Array of words:
       * row: each document
       * col: each word;
       * @returns {Map<string, TFIDFValues>[]}
       * array contain TFIDFValues for every words in every Document
       */
      TFIDF_of(documents){
         const docCount = documents.length;
         /**
          * @type {Map<string, TFIDFValues>[]}
          */
         let tfidf_map = new Array(docCount);
         let idf = new Map();


         for(let row = 0; row < docCount; row++){
            const wordCount = documents[row].length
            const fqMap = Tools.DataScienceKit.frequencyOf(documents[row]);
            tfidf_map[row] = new Map;

            for(let col = 0; col < wordCount; col++){
               if(!tfidf_map[row].has(documents[row][col])){
                  tfidf_map[row].set(
                     documents[row][col],
                     new TFIDFValues(
                        fqMap.get(documents[row][col]) / wordCount
                  ));
               }

               if(!idf.has(documents[row][col]))
                  idf.set(documents[row][col], 0);
            }
         }

         const allUniqueWords = [...idf.keys()];
         for(let i = 0; i < allUniqueWords.length; i++){
            for(const doc of documents){
               if(doc.includes(allUniqueWords[i]))
                  idf.set(allUniqueWords[i], idf.get(allUniqueWords[i]) + 1);
            }
         }


         for(const [word, appearsCount] of idf){
            idf.set(word, Math.log10(docCount / appearsCount));
         }


         for(const doc of tfidf_map){
            for(const [word, tfidf] of doc){
               tfidf.IDF = idf.get(word);
               tfidf.TF_IDF = tfidf.IDF * tfidf.TF;
            }
         }

         return tfidf_map;
      },



   },



   /**return digit in the given index as Number
    * (index can be negative)
    * @param {number}index digit index of the interest Number
    * @param {number}number Number to pick a digit from
    * @returns [Number] digit at given index
    */
   digitAt(index, number){
      try {
         return parseInt((number+'').at(index));
      } catch (error) {
         return 0;
      }
   },



   /**return digits in the given range as Number
    * @param {number}start digit start range of the interest Number
    * @param {number}start digit end range of the interest Number
    * @param {number}number Number to pick a digit from
    * @returns [Number] digit at given range
    */
   digitAtRange(start, end, number){
      if(!number) return;

      // if start is negative or falsy when start != 0; start = undefined;
      start = (start < 0?undefined:start??undefined);
      end = (end < 0?undefined:end??undefined);

      const snum = (number+'').slice(start, end);
      return parseInt(snum.length?snum:'0');
   },


   /**escape all Regular Expressions  control chars
    * @param {string} regexpStr
    */
   escapeRegExp(regexpStr){
      return regexpStr.replace(
         /[\[\]\{\}\.\*\$\^\|\-\?\+\,\:\\]/g, '\\$&'
      );
   },



   /**just like `.length` but exclude some special control char
    * given a bit more accurate results
    */
   ex_length(string){
      if(!string) return 0;
      return Tools.cleanString(string).length;
   },




   /**get Array if index matched by `String.matchAll()`
    * @param {IterableIterator<RegExpMatchArray>}matchArr
    * @returns {number[]}
    */
   getMatchAllIndexs(matchArr){
      if(!matchArr) return [];

      let indexs = [];
      for(const match of matchArr){
         indexs.push(match.index);
      }
      return indexs;
   },



   /**get Array if index matched by `String.matchAll()`
    * @param {IterableIterator<RegExpMatchArray>}matchArr
    * @returns {MatchResult[]}
    */
   getMatchAllResults(matchArr){
      if(!matchArr) return [];

      let res = [];
      for(const match of matchArr){
         res.push(new MatchResult(
            match[0], match.index, match.index + match[0].length
         ));
      }
      return res;
   },




   /**generate random int at a specified range;
    * use build-in function `Math.random()` to generate random numbers
    * @param {number}min
    * @param {number}max
    */
   getRandomInt(min, max) {
      return Math.round(Math.random() * (max - min) + min);
   },



   /**Generate a unique id base on ID-pallet
    * @param {Array<string>|Set<string>}alreadyExistedIDs Array of IDs that already existed to not generate a duplicated
    * @param {String}pallet the structure of ID, the length of it would be the same for generated ID.
    * @example Control characters are:
    *    `C` a random en Character (a-z, A-Z)
    *    `N` a random single Number
    *    `B` a random of BOTH Character and Number
    *
    * // to create a unique ID with 2 Numbers in the front followed by `-` and 3 Characters in the back
    * const oldIDs = ['aSer2234', '4467j', '39_mIq'];
    * const newUniqueID = IDGenerator(oldIDs, 'NN-CCC');
    */
   IDGenerator(alreadyExistedIDs = null, pallet = 'CCNNNN'){
      let foundDub = false;
      const st = new Tools.SafeTrue;

      while(st.True){
         let id = '';
         for(let i = 0; pallet.length > id.length; i++){
            switch (pallet[i]) {
               case 'C':
                  id += String.fromCharCode(
                     Tools.getRandomInt(97, 122) - (32 * Tools.getRandomInt(0, 1))
                  );
               continue;

               case 'N':
                  id += Tools.getRandomInt(0, 9).toString();
               continue;

               case 'B':
                  if(Tools.getRandomInt(0, 1)){
                     id += String.fromCharCode(
                        Tools.getRandomInt(97, 122) - (32 * Tools.getRandomInt(0, 1))
                     );
                  }else id += Tools.getRandomInt(0, 9).toString();
               continue;

               default:
                  id += pallet[i];
               break;
            }
         }


         if(alreadyExistedIDs){
            for(const existedID of alreadyExistedIDs){
               if(existedID == id){
                  foundDub = true;
                  break;
               }
            }

            if(!foundDub) return id;
         }else return id;
      };
      return null;
   },

   /** find Word in the given string
    *  if that Word isn't surrounded with en character
    *  return True if Word is found, a bit less sensitive than `string.includes()`
    * @param {String}word Word to search
    * @param {String}targetString string to search for Word
    * @param caseSensitive
    * @returns boolean
    */
   includesWord(word, targetString, caseSensitive = false){
      if(!caseSensitive){
         targetString = targetString.toLowerCase();
         word = word.toLowerCase();
      }
      targetString = targetString
         .padStart(targetString.length + 1, ' ')
         .padEnd(targetString.length + 2, ' ');

      const matchedWordIndex = targetString.search(word);

      if(matchedWordIndex !== -1){
         const targetStrFirstHalf = targetString.substring(matchedWordIndex-1)
         const targetStrLastHalf = targetString.substring(matchedWordIndex + word.length);
         const isUnique = (
            !(targetStrFirstHalf.search(/[a-z]/i) == 0)&&
            !(targetStrLastHalf.search(/[a-z]/i) == 0)
         );

         if(isUnique) return true;
      }

      return false;
   },



   /**this function will return **true** if
    * string is only numbers [0-9.+-] and NO characters
    * @param {string}str
    */
   isNumber: (str) => {
      return /^[0-9]+$|^[0-9]+\\.[0-9]+$/.test(str);
   },


   /**return True if the given Object is an array with nothing inside
    */
   isEmptyArray: obj => (obj instanceof Array)&&!obj.length,


   /**return True if the given Object is a standard Object (`{}`) with no property
    */
   isEmptyObject: obj =>
      !(obj instanceof Array)&&(obj instanceof Object)&&!this.propertiesCount(obj),




   /**clean file name by replace ALL invalid char with valid ones
    * @param rawName file name to clean
    * @param replaceChar char to replace, default to `_`
    * @returns cleaned name
    */
   fileNameCleaner(rawName, replaceChar = '_'){
      if(!rawName||typeof rawName != 'string')
         throw new Error('the given `rawName` isn\'t a String');
      return rawName.trim()
         .replace(/[\|/\*\\<>"\?\:]/g, replaceChar);
   },




   /**replace any invalid chars in the path
    * @param {string}path FileSystem path to fix
    * @param {string}replaceStr string to replace
    */
   fixFilePath(path, replaceStr = '_'){
      if(!path||!path?.length)
         throw 'path is either falsy or empty!';

      const badChars = new RegExp('[:?"<>|*]', 'g');
      if(badChars.test(path))
         return path.replace(badChars, replaceStr);

      return path;
   },



   /**reformat YouTube url in different variation
    * to a standard `https://www.youtube.com/watch?v=...`
    * @param {string}url
    */
   fixYTurl(url){
      url = url||undefined;
      if(!url) throw 'url can\'t be falsy!!';
      if(url.includes("youtu.be")){
         url = url.replace(
            "https://youtu.be/",
            "https://www.youtube.com/watch?v="
         );
      }

      if(url.includes("&list=")){
         let newUrl = url.split("&list=");
         url = newUrl[0];
      }

      if(url.includes("https") == false){
         url = "https://www." + url;
      }
      return url;
   },







   /**return type of content judging only from file Extension
    * @param {String}fileExt
    * @returns `'image'|'text'|'binary'|'media'|null`
    */
   fileTypeOf(fileName){
      const fileExt = fileName.slice(fileName.lastIndexOf('.') + 1)
         .toLowerCase();
      const images = (
         fileExt == 'jpg'||
         fileExt == 'png'||
         fileExt == 'svg'||
         fileExt == 'jfif'||
         fileExt == 'jpeg'
      );
      const text = (
         fileExt == 'txt'||fileExt == 'bat'||
         fileExt == 'text'||fileExt == 'md'||
         fileExt == 'json'||fileExt == 'step'||
         fileExt == 'js'||fileExt == 'cs'||
         fileExt == 'cpp'||fileExt == 'gitignore'||
         fileExt == 'java'||
         fileExt == 'py'||
         fileExt == 'config'||
         fileExt == 'cfg'||
         fileExt == 'ts'||
         fileExt == 'env'
      );
      const binary = (
         fileExt == 'exe'||
         fileExt == 'vpk'||
         fileExt == 'qc'||
         fileExt == 'smd'||
         fileExt == 'vmt'||
         fileExt == 'vtf'||
         fileExt == 'zip'||
         fileExt == '7z'||
         fileExt == 'bin'||
         fileExt == 'ipynb'||
         fileExt == 'pyc'||
         fileExt == 'jar'
      );
      const media = (
         fileExt == 'aiff'||
         fileExt == 'aif'||
         fileExt == 'aifc'||
         fileExt == 'flac'||
         fileExt == 'mp3'||
         fileExt == 'mp4'||
         fileExt == 'mp4a'||
         fileExt == 'm4a'||
         fileExt == 'mkv'||
         fileExt == 'mov'||
         fileExt == 'wav'||
         fileExt == 'webm'
      )

      if(images) return 'image';
      else if(text) return 'text';
      else if(binary) return 'binary';
      else if(media) return 'media';
      return null;
   },






   jsTime: {
      howLong: function(lastDate, nowDate = new Date()){
         let msDifference = nowDate.getTime() - lastDate.getTime();
         return this.getTimeFromMS(msDifference).modern();
      },
      getTimeFromMS: function(milliseconds){
         let year = 0, month = 0, days = 0, hr = 0, min = 0, sec = 0;
         const useDDMMYYYformat = (milliseconds > 262800200);
         while(milliseconds >= 1000){
            milliseconds -= 1000;
            sec++;
         }
         while(sec >= 60){
            sec -= 60;
            min++;
         }
         while(min >= 60){
            min -= 60;
            hr++;
         }

         if(useDDMMYYYformat){
            while(hr >= 24){
               hr -= 24;
               days++;
            }
            while(days >= 30.4167){
               days -= 30.4167;
               month++;
            }
            days = Math.round(days);
            while(month >= 12){
               month -= 12;
               year++;
            }

         }


         milliseconds = milliseconds.toString();
         while(milliseconds.length < 3&&milliseconds !== '00'){
            milliseconds = '0' + milliseconds;
         }


         if(useDDMMYYYformat){
            return {
               full: `${year}:${month}:${days}|${hr}:${min}:${sec}.${milliseconds}`,
               modern: function(){
                  if(year + month + days + sec + min + hr == 0){
                     return `${milliseconds}ms`;
                  }else if(year + month + days + min + hr == 0){
                     return `${sec}.${milliseconds}s`
                  }else if(year + month + days + hr == 0){
                     return `${min}min ${sec}s`
                  }else if(year + month + days == 0){
                     return `${hr}hr ${min}min`;
                  }else if(year + month == 0){
                     return `${days}days ${hr}hr`
                  }else if(year == 0){
                     return `${month}months ${days}days`
                  }else return `${year}year ${month}months`
               }
            }

         }else{
            return {
               full: `${hr}:${min}:${sec}.${milliseconds}`,
               modern: function(){
                  if(sec + min + hr == 0){
                     return `${milliseconds}ms`;
                  }else if(min + hr == 0){
                     return `${sec}.${milliseconds}s`
                  }else if(hr == 0){
                     return `${min}min ${sec}s`
                  }else return `${hr}hr ${min}min`
               }
            }
         }

      }
   },






   /**linear interpolation function:
    * this function will return any % of `Max` value
    * depends on `Percentage` if 0 will return `Min`, 1 return `Max`
    * and anything in between will return any value between `Min` and `Max`
    * @param {Number}Min min value return `Min` when `Percentage` == 0
    * @param {Number}Max max value return `Max` when `Percentage` == 1
    * @param {Number}Percentage percentage of the `Max` value
    *
    */
   lerp(Min, Max, Percentage){
      return Min + (Max - Min) * Percentage;
   },







   /**(**Node Console Color**) return the Node.js Console Text formats, use this format to change
    * how Console Text looks.
    * @param {String}Color color or format of choice (if omit: 'Reset', invlid: 'white')
    * @example
    * format available: `Reset, Bright, Dim, Italic, Blink, Invert, Hidden`
    * fontcolor: `Black, Red, Green, Yellow, Blue, Magenta, Cyan, White`
    * background color: `BgBlack, BgRed, BgGreen, BgYellow, BgBlue, BgMagenta, BgCyan, BgWhite`
    *
    * @returns {String} the format code for changing node.js Console Text formats
    * @example //Usage...
    * const fmRed = ncc('Red');
    * const resetFm = ncc('Reset');
    * const textToLog = 'I\'m Red boi!!!';
    *
    * //use Reset format to made sure only `textToLog` are effected
    * console.log(`${fmRed}%s${resetFm}`, textToLog);
    *
    * //Log red "I'm Red boi!!!" text on the Terminal
    */
   ncc(Color){
      if(!Color) return '\x1b[0m';//return 'reset'
      Color = Color.toLocaleLowerCase();

      switch (Color) {
         case 'black':
            return '\x1b[30m';
         break;

         case 'red':
            return '\x1b[31m';
         break;

         case 'green':
            return '\x1b[32m';
         break;

         case 'yellow':
            return '\x1b[33m';
         break;

         case 'blue':
            return '\x1b[34m';
         break;

         case 'magenta':
            return '\x1b[35m';
         break;

         case 'cyan':
            return '\x1b[36m';
         break;

         case 'white':
            return '\x1b[37m';
         break;




         case 'reset':
            return '\x1b[0m';
         break;

         case 'bright':
            return '\x1b[1m';
         break;

         case 'dim':
            return '\x1b[2m';
         break;

         case 'italic':
            return '\x1b[3m';
         break;

         case 'blink':
            return '\x1b[5m';
         break;

         case 'invert':
            return '\x1b[7m';
         break;

         case 'hidden':
            return '\x1b[8m';
         break;




         case 'bgblack':
            return '\x1b[40m';
         break;

         case 'bgred':
            return '\x1b[41m';
         break;

         case 'bggreen':
            return '\x1b[42m';
         break;

         case 'bgyellow':
            return '\x1b[43m';
         break;

         case 'bgblue':
            return '\x1b[44m';
         break;

         case 'bgmagenta':
            return '\x1b[45m';
         break;

         case 'bgcyan':
            return '\x1b[46m';
         break;

         case 'bgwhite':
            return '\x1b[47m';
         break;


         default:
            // return this.ncc('White');
            return '\x1b[37m';
         break;
      }
   },





   /**return the index of element in which its value is the closest
    * to the given number,
    * if the given Array is empty: return `null`
    * @param {Number[]}arr Array of Numbers
    * @param {Number}num the target Number
    */
   nearestNumber(arr, num){
      let shortestGap = Infinity;
      let nearestIndex = null;
      for(let i = 0, n = arr[i]; i < arr.length; ){
         const gap = Math.abs(num - n);
         if(!gap) return i;
         if(gap < shortestGap){
            shortestGap = gap;
            nearestIndex = i;
         }
         n = arr[++i]
      }

      return nearestIndex;
   },







   /**Find the number of Properties in an Object
    * Object Property can refer as Items in an Object while each Item consist of pair of `Key: Value`
    * @param {Object}object
    * @returns Number of Property inside
    */
   propertiesCount(object) {
      let count = 0;

      for(let property in object) {
         if(object.hasOwnProperty(property)) ++count;
      }

      return count;
   },

   /**Commandline argument parser
    * @example
    * let myParams = {
         name: {
            pattern: ['--name', '-n'], // <- required
            default: 'Timmy',
            type: 'string', // <- default to 'string' unless `isFlag` is true
            isFlag: false,
            required: true // <- force user to include this argument (default to false)
         },
         age: {
            pattern: ['--age'],
            type: 'int'
         },
         hasCar: {
            pattern: ['--hascar', '--car'],
            isFlag: true // <- required (only for Flags that doesn't need any Value)
         },
         gender: {
            pattern: ['-g'],
            type: 'choice', // <- force user to choose one of the choice if `default` is undefined
            choices: ['f', 'm'], // <- required for type 'choice'
            default: 'f'
         }
      }

      let a = ['myapp', 'bla bla', '-n', 'Jim', '--hascar', '--age', '34'];
      console.log(parseArgs(a, myParams)); // returns {name: 'Jim', age: 34, hasCar: true, gender: 'f'}
    * @param {string[]} args Node.js commandline args
    * @param {Object} params Paramiter rules object
    * @param {boolean} caseSensitive
    */
   parseArgs(args, template, caseSensitive = false){
      let parsed = {};
      let requiredList = new Set();
      for(const pName in template){
         if(template[pName]?.isFlag){
            parsed[pName] = false;
            continue;
         }
         if(template[pName]?.required)
            requiredList.add(pName);
         parsed[pName] = (template[pName]?.default?template[pName]?.default:null);
      }

      for(let i = 0; i < args.length; i++){
         for(const pName in template){
            if(!template[pName]?.pattern)
               throw new Error('invalid template: Object structure mismatched. every entries requires `pattern` property');

            if (!isKeyMatched(args[i], template[pName].pattern)) continue;
            requiredList.delete(pName);

            // Value Checking and Parsing
            if (template[pName]?.isFlag) {
               parsed[pName] = true;
               continue;
            }

            let nextArgNotAValue = false;
            for (const p in template) {
               if (isKeyMatched(args[i + 1], template[p].pattern))
                  nextArgNotAValue = true;
            }

            if (i + 1 == args.length || nextArgNotAValue)
               throw new Error(`argument '${args[i]}' requires a Value`);
            try {
               switch (template[pName]?.type) {
                  case 'int':
                     if (isNaN(parsed[pName] = parseInt(args[++i]))) throw new Error('typemismatched');
                     break;
                  case 'float':
                     if (isNaN(parsed[pName] = parseFloat(args[++i]))) throw new Error('typemismatched');
                     break;
                  case 'bool':
                     if ((parsed[pName] = parseBool(args[++i], true)) == null) throw new Error('typemismatched');
                     break;
                  case 'choice':
                     if (!template[pName]?.choices ?.length)
                        throw new Error('invalid template: Object structure mismatched. entry of type \'choice\' requires `choices` property');

                     if (!isKeyMatched(args[++i], template[pName].choices) &&
                        template[pName]?.default == undefined
                     ) {
                        throw new Error(`invalid value for '${args[i - 1]}' argument, requires any of these Choices: ${template[pName].choices}`);
                     }

                     parsed[pName] = args[i];
                     break;
                  default:
                     parsed[pName] = args[++i];
                     break;
               }
            } catch (err) {
               if (err.message == 'typemismatched')
                  throw new Error(`argument '${args[i - 1]}' requires a Value of type '${template[pName]?.type}'`);
               throw err;
            }
         }
      }

      if(requiredList.size > 0)
         throw new Error(`argument(s) '${[...requiredList]}' is required.`);

      return parsed;

      /**
       * @param {string} value
       * @param {string[]} keys
       */
      function isKeyMatched(value, keys){
         for(const k of keys){
            if(!caseSensitive){
               if(value.toLowerCase() == k.toLowerCase()) return true;
               continue;
            }

            if(value == k) return true;
         }
         return false;
      }
   },



   /**
    * parse boolean in string to Boolean data type
    * @param {String} stringBool boolean in string
    * @param {Boolean} strictMode if true will return null when stringBool is not 'true' | 'false' (default to false)
    * @returns Boolean data type
    */
   parseBool(stringBool, strictMode = false){
      const boolRes = (stringBool == 'true'?true:false);

      if(!strictMode) return boolRes;
      if(!(stringBool == 'true'||stringBool == 'false')) return null;
      return boolRes;
   },





   /**parse configuration file in UTF-8 encoding to a Javascript Object
    * @param {String}ConfigString configuration file content
    * @returns {Object} configuration in Javascript Object
    * @example //in main file
    * const fs = require('fs');
    *
    * const CONFIG = parseConfig(
    *    fs.readFileSync('./MyConfig.customextension', { encoding:'utf8', flag:'r' })
    * );
    *
    * const myConfigText = CONFIG.myText;
    * console.log(myConfigText); // Hello!!!
    *
    *
    * //in MyConfig.customextension file
    * # this is a comment :)
    *
    * #here are my text
    * myText = "Hello!!!"
    */
   parseConfig(ConfigString){
      var rows = Tools.cleanArr(ConfigString.trim().split('\n'), ['', '\s', '\r']);
      var configObj = new Map();
      const st = new Tools.SafeTrue();
      let indexOfSbeforeQ = 0;

      let json_str = '', jsonVar_key;
      let inJson = false;
      for(let rowIndex = 0; rowIndex < rows.length; rowIndex++){
         /**| row00
          * | row01
          * | row02
          * | row03
          */
         let eachRow = rows[rowIndex].trim();
         if(eachRow.startsWith('#')) continue;

         // | pair00 = pair01
         let eachPair = Tools.cleanArr(eachRow.split('='));
         if(eachPair.length > 2)
            throw new Error(`Tools.parseConfig(): invalid syntax, '=' cannot occur more than one time.  at \`${eachRow}\``);
         else if(eachPair.length == 1&&!inJson){
            if(eachRow.includes('='))
               throw new Error(`Tools.parseConfig(): invalid syntax, expected expresion after '='.  at \`${eachRow}\``);
            else throw new Error(`Tools.parseConfig(): expected expresion.  at \`${eachRow}\``);
         }
         else if(!eachPair.length)
            throw new Error(`Tools.parseConfig(): unknown operator. \`${eachRow}\``);




         // Parse JSON config
         if(inJson){
            if(jsonEnd(rowIndex, rows)){
               inJson = false;
               configObj.set(jsonVar_key, JSON.parse(json_str));
            }else{
               json_str += rows[rowIndex];
               continue;
            }
         }



         // Parse Normal config
         eachPair = [eachPair[0].trim(), eachPair[1].trim()];

         if(eachPair[1].startsWith('{')||eachPair[1].startsWith('[')){
            inJson = true;
            [jsonVar_key, json_str] = eachPair;
         }

         if(eachPair[0].search(/[0-9]/) == 0)
            throw new Error(`Tools.parseConfig(): Key cannot starts with Numbers. at \`${eachRow}\``);

         {
            const invalidChar = eachPair[0].replace(/[a-z$_0-9]/ig, '');
            if(invalidChar.length !== 0) throw new Error(`Tools.parseConfig(): these character(s) "${invalidChar}" can not be Parse. at \`${eachRow}\``);
         }


         if(eachPair[1].match('"')?.length > 0){
            let firstQ = eachPair[1].search('"');
            const secQ = eachPair[1].indexOf('"', firstQ+1);

            let firstS = eachPair[1].search('#');
            if(firstS != -1){
               //let indexOfSbeforeQ;
               while(st.True){
                  let secS = eachPair[1].indexOf('#', firstS + 1);
                  if(secS == -1&&firstS > secQ){
                     indexOfSbeforeQ = firstS;
                     break;
                  }

                  firstS = secS;
               }
            }
         }

         if(eachPair[1].includes('#')){
            eachPair[1] = eachPair[1].substring(0, eachPair[1].indexOf('#', indexOfSbeforeQ)).trim();
         }
         if(eachPair[1].startsWith('"')&&eachPair[1].endsWith('"')){
            eachPair[1] = eachPair[1].slice(1, -1);
         }

         configObj.set(eachPair[0], eachPair[1]);
      }

      configObj = Object.fromEntries(configObj);

      return configObj;



      function jsonEnd(i, rows) {
         if(i == rows.length - 1) return true;
         const b_closeIndexs = Tools.getMatchAllIndexs(rows[i].matchAll(/[}]]/g));

         for(const eachIndex of b_closeIndexs){
            const testBrack = rows[i].includes('}')? '}' :(rows[i].includes(']')? ']': false);

            if(
               testBrack&&
               !Tools.surroundedBy('"', rows[i].lastIndexOf(testBrack), rows[i])&&
               !rows[i].slice(eachIndex).trim().startsWith(',')
            ) return true;
         }

         return (
            rows[i].includes('=') &&
            !Tools.surroundedBy('"', rows[i].lastIndexOf('='), rows[i])
         );
      };
   },


   /**this function act as Passthrough (man in the Middle), it **return the given value**
    * and also pass that same value to the callback function
    * @example
    * // use case
    * let myNumber = pass(getNumber()); // print the return value of `getNumber()` and pass it to `mynumber`
    *
    * dostuff(pass(myNumber, doOtherStuff)); // pass `myNumber` to `dostuff()` and `doOtherStuff()`
    * @param {Function} callback
    * @param {any} value
    * @returns {any} the given value
    */
   pass(value, callback = null){
      if(callback) callback(value);
      else console?.log(value);
      return value;
   },




   /**a value snap function that tries to snap `X` to `originValue`;
    * **return** `originValue` if delta of `X` to `originValue` is smaller than
    * `maxOffset` otherwise return `X`
    *
    * @param {number}X
    * @param {number}originValue
    * @param {number}maxOffset
    * @returns snapped value
    */
   proximate(X, originValue, maxOffset){
      if(X < (originValue + maxOffset)&&X > (originValue - maxOffset)){
         return originValue;
      }else return X;
   },




   /**
    * *" I have a `Reg(Exp)`, I have an `indexOf`... Ahhh `redexOf`"* ...any further explanation needed?
    *  redexOf is an indexOf but with `RegExp` supported
    * @param {String}string string to search from (can be omitted if use as extension)
    * @param {String|RegExp}searcher The Keyword, string or RegExp to search for
    * @param {Number}position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string. Also, if **Negative** value is use will search string from the back, similar to **`string.lastIndexOf()`** but position is **Negative Index**
    * @returns {Number} position of the string that match the searcher, if none, `-1` would return
    */
   redexOf(string, searcher, position = 0){
      const thisNotStr = typeof(this) !== "string";

      if(!string&&thisNotStr) return -1;
      if(!thisNotStr) string = this;
      if(!string.length) return -1;
      if(!(searcher instanceof RegExp)){
         if(position >= 0) return string.indexOf(searcher, position);
         else return string.lastIndexOf(searcher, string.length + position);
      }


      let foundIndex, searchStr;
      if(position >= 0){
         foundIndex = -1;
         do {
            searchStr = string.substring(++foundIndex);
            const searchIndex = searchStr.search(searcher);
            if (searchIndex == -1) return -1;
            foundIndex = searchIndex + foundIndex;
         } while (foundIndex < position);

      }else{
         foundIndex = -1;
         do {
            searchStr = string.substring(++foundIndex);
            const searchIndex = searchStr.search(searcher);
            if (searchIndex == -1) return foundIndex - 1;
            foundIndex = searchIndex + foundIndex;
         } while (foundIndex < string.length + (position));
      }


      return foundIndex;
   },







   SafeTrue: class SafeTrue{
      #_i = 0;
      #_limit = 0;

      /**use for infinity-loops to prevent the loop from
       * unintentionally run forever
       * @param {Number}limit max loop iteration, default to 10*(10^9) (10 Billion)
       * @example
       * const st = new SafeTrue();
       * while(st.True){
       *    //do something
       * }
       */
      constructor(limit = 10e9){
         this.#_limit = limit;
      }

      /**always return `true` if the amount of time this value gets read
       * doesn't exceed the limits
       * @returns {boolean}
       */
      get True(){
         if(!(this.#_i++ < this.#_limit)){
            process?.emitWarning('SafeTrue limit reached');
            return false;
         }
         return true;
      }
   },





   /**Search Array of string for the top best match from the search query (like Google search w/o Linked List search),
    * **this function will also ranked the best match result**
    * @param {string[]}stringArr an Array of string to search from
    * @param {string}query the Search query
    * @param {{
    *    maxResult?: number,
    *    TF_IDFMaps?: Map<string, TFIDFValues>[]|'builtin'
    * }}option
    * **`maxResult`**: define the max result from the Top search result,
    * **`TF_IDFMaps`**: TF_IDF Maps for every string in the `stringArr` or
    * string "builtin" to use builtin function to automatically determine the TF_IDF values
    * (**Note that:** calculating TF_IDF value can be **VERY resources INTENSIVE** it's best
    * to precalculate them outside)
    * @example
    * const fonts = ["Kristen ITC", "Juice ITC"..."Symbol", "Kristen ITC"];
    * const fontTFIDF = TFIDF_of(
    *    fonts.map(v => v.toLowerCase().split(/\s/g))
    * );
    *
    * const res = search(fonts, 'itc j', {
    *    maxResult: 3,
    *    TF_IDFMaps: fontTFIDF
    * });
    * @returns Array of Top result, ranging from the lowest Index as best match
    * to the highest as the worst match
    */
   search(stringArr, query, option = {}){
      let maxResult = option.maxResult;
      let TF_IDFMaps = option.TF_IDFMaps;
      if(!maxResult){ // for backward compatibility with older versions
         if(typeof option == 'number') maxResult = option;
         else maxResult = Infinity;
      }


      query = query.trim().toLowerCase();
      if(query == '') return null;
      let strList = [...stringArr];
      strList.forEach((e, i, arr) => arr[i] = e.trim().toLowerCase());

      if(TF_IDFMaps === 'builtin'){
         TF_IDFMaps = Tools.DataScienceKit.TFIDF_of(strList.map(v => v.split(/\s/g)));
      }

      class Match{
         constructor(str, score, matchIndex = -1){
            this.score = score;
            this.string = str;
            this.matchIndex = matchIndex;
         }
      }
      const seperator = new RegExp(/[\s-_・⧸/\\;:()\[\],.'"!^*=+「【】」]/g);
      let bestMatchs = [];


      for(let i = 0; i < strList.length; i++){
         const lowProf = strList[i].replace(seperator, '');

         if(strList[i] == query||lowProf == query)
            bestMatchs.unshift(new Match(stringArr[i], query.length << 2, i));


         let score = 0;
         for(const w of query.split(seperator)){
            if(Tools.includesWord(w, strList[i], false)){
               if(TF_IDFMaps&&TF_IDFMaps[i]?.has(w)){
                  score += w.length * (1 + TF_IDFMaps[i].get(w).TF_IDF) * 1.6; // <- TF_IDF weight (1.6)
               }else score += w.length;
            } else if(strList[i].includes(w)) score += w.length * .6; // <- includes() weight (0.6)

            score += Tools.DataScienceKit.LCS_of(w, strList[i]).length * 1.8; // <- LCS weight (1.8)
         }

         bestMatchs.push(new Match(null, score, i));
      }


      // descending sort
      bestMatchs.sort((a, b) => b.score - a.score);
      for(let i = 0; i < maxResult; i++){
         if(!bestMatchs[i]) break;
         if(bestMatchs[i].string != null) continue;

         bestMatchs[i].string = stringArr[bestMatchs[i].matchIndex];
      }

      return bestMatchs.slice(0, maxResult);
   },







   /**pause the synchronous thread for the given duration
    * @param {Number}milliseconds how long to pause in milliseconds
    */
   sleep(milliseconds) {
      if(!milliseconds) return;
      const date = Date.now();
      let currentDate = null;
      do {
         currentDate = Date.now();
      } while (currentDate - date < milliseconds);
   },







   /**new type of *child_process* stdio "Mirror",
    * this combind 'inherit' and 'pipe' stdio type
    * to work as one.
    * allowing `'stdin'`, `'stdout'` and `'stder'` to show
    * on parent Terminal while also pipe output and error to
    * `stdout` and `stderr`.
    * ***Note:*** please note that this is not a full replacement for 'inherit'
    * the child process can and will detect if stdout is a pity and change output based on it
    * the terminal context is lost & ansi information (coloring) etc will be lost
    * @example
    * const child = spawn('ls', ['-al'], {
    *   stdio: SpawnMirror.STDIO_MIRROR
    * });
    *
    * SpawnMirror.createMirror(child);
    *
    * child.stdout.on('data', dat => {
    *    console.log(dat.toString());
    * });
    *
    */
   SpawnMirror: class SpawnMirror {
      /**setting for `'stdio'` property in `SpawnOptionsWithoutStdio`
       * this setting is **required** for `createMirror()` to work.
       * @example
       * const child = spawn('ls', ['-al'], {
            stdio: SpawnMirror.STDIO_MIRROR
         });
       */
      static STDIO_MIRROR = ['inherit', 'pipe', 'pipe'];


      /**create mirror for `'stdioout'` and `'stderr'`
       * to work as both `'inherit'` and `'pipe'` *child_process* stdio type
       * @example
       * const child = spawn('ls', ['-al'], {
       *   stdio: SpawnMirror.STDIO_MIRROR
       * });
       *
       * SpawnMirror.createMirror(child);
       *
       * child.stdout.on('data', dat => {
       *    console.log(dat.toString());
       * });
       *
       */
      static createMirror(child){

         child?.stdout?.pipe(process.stdout);
         child?.stderr?.pipe(process.stderr);
      }
   },


   /**clamp string's length to the given length
    * @param {string} str
    * @param {number} length target string length
    * @param {string} dropLocation 'mid', 'start' or 'end' determine location in which the string would
    * be dropped if the given str's length is smaller than `length`
    */
   strClamp(str, length, dropLocation = 'mid'){
      if(str.length <= length)
         return str.padEnd(length, ' ');

      // the length of str that won't be removed
      const leftoverAmu = str.length - (str.length - length) - 3;
      switch(dropLocation){
         default:
            if(onNodeJS) process?.emitWarning(`'${dropLocation}' is not a valid location type.`);
            else throw new Error(`'${dropLocation}' is not a valid location type.`);
         case 'mid':
            const haft_loa = (leftoverAmu >> 1);
            return str.slice(0, haft_loa) + "..." + str.slice(str.length - haft_loa);
         case 'end':
            return str.slice(0, leftoverAmu) + "...";
         case 'start':
            return "..." + str.slice(leftoverAmu);
      }
   },


   /**limit string lenght, similar to strClamp but doesn't pad to the target length
    * @param {string} str
    * @param {number} limit max string length allowed
    * @param {string} dropLocation 'mid', 'start' or 'end' determine location in which the string would
    * be dropped if the given str's length is smaller then `length`
    */
   strLimit(str, limit, dropLocation = 'mid'){
      if(str.length <= limit) return str;

      // the length of str that won't be removed
      const leftoverAmu = str.length - (str.length - limit) - 3;
      switch(dropLocation){
         default:
            if(onNodeJS) process?.emitWarning(`'${dropLocation}' is not a valid location type.`);
            else throw new Error(`'${dropLocation}' is not a valid location type.`);
         case 'mid':
            const haft_loa = (leftoverAmu >> 1);
            return str.slice(0, haft_loa) + "..." + str.slice(str.length - haft_loa);
         case 'end':
            return str.slice(0, leftoverAmu) + "...";
         case 'start':
            return "..." + str.slice(leftoverAmu);
      }
   },



   /**Splice but with String, **Note That: Unlike Array.splice() this method doesn't Overwrite
    * the original var**
    * @param {string}str
    * @param {number}index
    * @param {number}removeCount number of Chars to remove
    * @param {string}strToInsert
    */
   strSplice(str, index, removeCount, strToInsert = null){
      if(strToInsert){
         return str.slice(0, index) + strToInsert + str.slice(index + removeCount);
      }else return str.slice(0, index) + str.slice(index + removeCount);
   },




   /**check if the given index of string `str` is surrounded by `surroundStr`
    * @param {string}surroundStr
    * @param {number}index
    * @param {string}str
    * @returns {boolean} whether the given index is surrounded by `surroundStr`
    */
   surroundedBy(surroundStr, index, str){
      if(index < 0) return false;

      let sr_left = -Infinity, sr_right = Infinity;
      const usingBracket = (
         surroundStr == '{'||
         surroundStr == '['||
         surroundStr == '('||
         surroundStr == '<'
      );

      for(let p = index; p > 0; p -= 2){
         const left = str.lastIndexOf(surroundStr, p);

         if(left == -1) break;
         else sr_left = left;
         if(str[sr_left - 1] == '\\') sr_left = -Infinity;
      }

      for(let p = 0; p < str.length; p += 2){
         const right = str.indexOf(usingBracket? closeBracket(surroundStr) :surroundStr, p);

         if(right == -1) break;
         else sr_right = right;
         if(str[sr_right - 1] == '\\') sr_right = Infinity;
      }


      if(sr_left == -Infinity||sr_right == Infinity) return false;
      return sr_left < index && sr_right > index;

      /**return the closing version of a given Bracket
       */
      function closeBracket(brack){
         return String.fromCharCode(
            brack.charCodeAt(0) + (brack[0] == '('? 1 :2)
         );
      }
   },



   Timer: class Timer {
      /**time remaining in the clock
       * @type {number}
       */
      time;
      /**this also control how often should timer do the checking
       * @type {'ms','s','m'}
       */
      resolution;
      isRunning = false;
      maxTime;

      #res;
      #interval;
      #lastCheck = 0;
      #onceEndCallback;
      #waitCallback;
      /**a very simple Countdown Timer
       *
       * **Note That**: the highest resolution this timer can do is 4ms
       * because the minimum delay `setInterval()` can do is 4ms
       *
       * however, this can varies
       * @param {number} time start time
       * @param {'ms','s','m'} resolution
       */
      constructor(time, resolution = 'ms'){
         this.maxTime = this.time = time;
         this.resolution = resolution;

         switch(resolution){
            case 'ms':
               this.#res = 1;
               break;
            case 's':
               this.#res = 1000;
               break;
            case 'm':
               this.#res = 1e3 * 60;
               break;
         }
      }

      /**start the timer
       *
       * once `Timer.time` reach 0 will automatically stop
       */
      start(){
         if(this.isRunning||this.time <= 0) return;
         this.isRunning = true;
         this.#lastCheck = Date.now();
         this.#interval = setInterval(
            this.#checkTime, this.#res == 1? 4: this.#res / 100
         );
         return this;
      }

      /**stop and reset the Timer
       */
      stop(){
         if(!this.isRunning) return;
         clearInterval(this.#interval);
         this.isRunning = false;
         return this.reset();
      }

      /**pause Timer
       */
      pause(){
         if(!this.isRunning) return;
         clearInterval(this.#interval);
         this.isRunning = false;
         return;
      }

      reset(){
         this.time = this.maxTime;
         return this;
      }

      /**wait for Timer to end (finish counting)
       * @returns {Promise<void>}
       */
      async wait(){
         if(!this.isRunning) return;

         return new Promise((resolve, reject) => {
            this.#waitCallback = () => {
               this.#waitCallback = null;
               resolve();
            }
         });
      }

      /**@callback OnceEndCallback
       * @returns {void}
       */
      /**call a callback funtion once Timer finish counting
       * @param {OnceEndCallback} callback
       */
      onceEnd(callback){
         this.#onceEndCallback = callback;
         return this;
      }

      #checkTime = () => {
         const now = Date.now();
         const delta = (now - this.#lastCheck) / this.#res;
         this.time -= delta;
         this.#lastCheck = now;
         if(this.time > 0) return;

         this.stop();
         this.time = 0;
         if(this.#onceEndCallback){
            this.#onceEndCallback();
            this.#onceEndCallback = null;
         }
         if(this.#waitCallback) this.#waitCallback();
      }
   },



   /**convert Numbers to Place numbers
    * @param {Number}num
    */
   toPlace(num){
      switch(num){
         case 1: return '1st';
         case 2: return '2nd';
         case 3: return '3rd';
         default: return num + 'th';
      }
   },




   WebKit: {
      /**get childs that contains the given class in the parent element
       * @param {string} cName
       * @param {HTMLElement} parent
       */
      getChildWithClassName(cName, parent){
         const childs = [...parent.children];
         let targetchilds = [];
         for(let child of childs){
            if(child.classList.contains(cName))
               targetchilds.push(child);
         }
         return targetchilds;
      },



      /**callback when user clicked outside the given element
       * @param {HTMLElement} element
       * @param {Function} callback
       * @returns {Function} use this to clear event listener
       */
      onClickOutside(element, callback) {
         const outsideClickListener = event => {
            if (!element.contains(event.target)) {
               callback();
            }
         }

         document.addEventListener('click', outsideClickListener);
         return outsideClickListener;
      },

      /**callback when user clicked outside the given element
       * **Similar to `onClickOutside()` but only invoke ONCE!**
       * @param {HTMLElement} element
       * @param {Function} callback
       */
      onceClickOutside(element, callback) {
         const outsideClickListener = event => {
            if (!element.contains(event.target)) {
               callback();
               document.removeEventListener('click', outsideClickListener);
            }
         }

         document.addEventListener('click', outsideClickListener);
      },

      /**clear event listener for `onClickOutside()` and `hideOnClickOutside()`
       * @example
       * let listener = onClickOutside(elem, doStuff);
       * function doStuff(){
       *    // . . .
       *    clearClickOutside(listener);
       * }
       * @param {Function} listener
       */
      clearClickOutside(listener) {
         document.removeEventListener('click', listener);
      },



      /**make the element automatically hide itself when
       * user click outside this element
       * @param {HTMLElement} element
       * @param {string|HTMLElement} elemToHide
       * @returns {Function} use this to clear event listener
       */
      hideOnClickOutside(element, elemToHide = 'this') {
         const targetElem = elemToHide === 'this'?element:elemToHide;

         const outsideClickListener = event => {
            if (!element.contains(event.target) && Tools.WebKit.isVisible(targetElem)) { // or use: event.target.closest(selector) === null
               targetElem.style.display = 'none';
            }
         }

         document.addEventListener('click', outsideClickListener);
         return outsideClickListener;
      },



      /**set all selected elements that matched the `specifier` as visible
       * and hide others the that doesn't match
       * @param {string} selector querySelector for 'selected elements'
       * @param {{id: string, class: string}} specifier ID and or ClassName any selected element that
       * match this specifier will be visible
       * @param {string} displayType Element style.display
       */
      hideOtherElements(selector, specifier, displayType = null){
         const elements = document.querySelectorAll(selector);
         const hasId = !!specifier.id;
         const hasClass = !!specifier.class;

         for(const elem of [...elements]){
            // pls ignore this mess T^T
            const validId = hasId? elem.id == specifier.id:false;
            const validClass = hasClass? isClassMatched(elem.className):false;

            if((validClass&&(!hasId || validId)) || validId&&!hasClass){
               if(displayType) elem.style.display = displayType;
            }else elem.style.display = 'none';
         }

         function isClassMatched(className){
            if(specifier.class.includes(' ')){
               const eClassList = className.split(' ');
               if(eClassList.length <= 0) return false;

               for(const sClass of specifier.class.split(' ')){
                  if(!eClassList.includes(sClass)) return false;
               }
               return true;
            }

            return className == specifier.class;
         }
      },






      /**hides all element selected by the `selector`
       * this function hide elements by set its display type to 'none'
       * @param {string} selector querySelector
       */
      hideAllElements(selector){
         const elements = document.querySelectorAll(selector);
         for(const e of [...elements]){
            e.style.display = 'none';
         }
      },


      /**check if the given coordinates is inside
       * the element Rect or not
       * @param {DOMRect} elemRect
       * @param {number} x
       * @param {number} y
       */
      isPosInside(x, y, elemRect){
         return (
            x > elemRect.left&&x < elemRect.right&&
            y > elemRect.top&&y < elemRect.bottom
         );
      },



      /**predicates whether any of the selected element can be seen
       * @param {string} selector querySelector
       */
      isSelectedVisible(selector){
         const elements = document.querySelectorAll(selector);
         for(const e of [...elements]){
            if(Tools.WebKit.isVisible(e)) return true;
         }
         return false;
      },



      /**predicates whether the element is currenly visible or not
       * (source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js)
       * @param {HTMLElement} elem
       */
      isVisible: elem =>
         !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length),



      KeyBind: class KeyBind {
         /**raw keybinding, each keys separated by '+'
          */
         rawBinding;
         /**normalized keybinding stored in Set
          * each keys are normalize so that it can be compared directly
          * with `KeyboardEvent.Key`
          */
         keys;
         /**
          * @param {string} strKeyBind raw keybinding, each keys seperated by '+'
          */
         constructor(strKeyBind){
            this.rawBinding = strKeyBind;
            this.keys = this.#normalize(strKeyBind);
         }

         /**
          * @param {string} strKeyBind raw keybinding, each keys seperated by '+'
          */
         static key(strKeyBind){
            return new KeyBind(strKeyBind);
         }

         /**
          * @param {string} strKeyBind
          * @returns {Set<string>} normalized keybind
          */
         #normalize(strKeyBind){
            const keys = Tools.cleanArr(strKeyBind.split('+'));
            let hasShift = false;
            return new Set(keys.map((v, i, a) => {
               v = v.trim();
               switch(v.toLowerCase()){
                  case 'ctrl':
                     return 'Control';
                  case 'shift':
                     if(!hasShift) hasShift = true;
                     return 'Shift';
                  default:
                     if(v.length == 1){
                        return hasShift? v.toUpperCase(): v.toLowerCase();
                     }
                     return v;
               }
            }));
         }
      },




      Keyboard: class Keyboard {
         /**map every keys that's being pressed
          * @type {Set<string>}
          */
         activeKeys;
         /**
          * @type {Map<KeyBind, Function>}
          */
         catchList;
         constructor(){
            this.activeKeys = new Set();
            this.catchList = new Map();
         }
         /**Keep track of what key is currently being pressed
          * **this function should be called everytime `keydown` and `keyup`
          * Events trigger**
          * @param {KeyboardEvent} ev
          */
         handleKeyPress = (ev) => {
            if(ev.type == 'keydown'){
               this.activeKeys.add(ev.key);
               // console.log(this.activeKeys);

               for(const [keybind, callback] of this.catchList){
                  if(this.test(keybind)){
                     callback();
                     ev.preventDefault();
                  }
               }
            }else if(ev.type == 'keyup') this.activeKeys.delete(ev.key);
            else throw new Error('wrong Event type!');
         }

         /**test if the given keybind is being pressed by user
          * @param {KeyBind} keybind
          */
         test(keybind){
            for(const k of keybind.keys){
               if(!this.activeKeys.has(k)) return false;
            }
            return true;
         }

         /**
          * listen for the given keybind, `preventDefault()`
          * and call a callback function
          * @param {Function} callback
          * @param {KeyBind} keybind
          */
         catch(keybind, callback){
            this.catchList.set(keybind, callback);
         }

         /**remove catch listener
          * @param {KeyBind} keybind
          */
         unCatch(keybind){
            this.catchList.delete(keybind);
         }

      },




      /**HTMLElement handler for textarea 'keydown' event
       * this prevent Tab key from select other element
       * and make Tab works like it should in most text editors
       * @param {KeyboardEvent} event
       * @param {HTMLTextAreaElement} _this element that cause this `KeyboardEvent`
       */
      handleTextarea_TabKeyPressed(event, _this){
         if (event.key != 'Tab') return;
         event.preventDefault();
         const start = _this.selectionStart;
         const end = _this.selectionEnd;

         // if user didn't select any text, just place caret somewhere without selection
         if (start == end) {
            // set textarea value to: text before caret + tab + text after caret
            _this.value = _this.value.substring(0, start) +
               "\t" + _this.value.substring(end);

            // put caret at the right position again
            _this.selectionStart = _this.selectionEnd = start + 1;
            return;
         }


         let selectedText = _this.value.substring(start, end + 1);
         let addedLength = selectedText.length;
         selectedText = selectedText.replace(/\n/g, '\n\t');

         addedLength = selectedText.length - addedLength;
         /**
          * if there are no '\n' replace all content in `selectedText`
          * else remove trailing '\t' and it to the front
          *
          * (v no '\n' here, no indent added)
          * |some text to add
          * |tab indent
          * |         (^ extra '\n')
          */
         if (!addedLength) selectedText = '\t';
         else {
            if (selectedText.endsWith('\t'))
               selectedText = selectedText.slice(0, selectedText.length - 1);
            selectedText = '\t' + selectedText;
         }

         _this.value = _this.value.substring(0, start) +
            selectedText + _this.value.substring(end);

         _this.selectionStart = start;
         _this.selectionEnd = end + addedLength;
      },


      /**Function used to determine the order of the elements.
       * It is expected to return a negative value
       * if the first argument is less than the second argument,
       * zero if they're equal, and a positive value otherwise.
       * If omitted, the elements are sorted in ascending, ASCII character order,
       * judging from the `textContent` value.
       * @callback CompareFunction
       * @param {HTMLElement} elemA
       * @param {HTMLElement} elemB
       * @returns {number}
       */

      /**Sort elements inplace, this function does not modify the given Array/Collection
      * but the actual orders of those elements in the `document`
      * @param {HTMLCollection|HTMLElement[]} elements an array of Element or HTMLCollection
      * @param {CompareFunction} compareFn
      * Function used to determine the order of the elements.
      * It is expected to return a negative value
      * if the first argument is less than the second argument,
      * zero if they're equal, and a positive value otherwise.
      * If omitted, the elements are sorted in ascending, ASCII character order,
      * judging from the `textContent` value.
      */
      sortElements(
         elements,
         compareFn = (a, b) => a.textContent.localeCompare(b.textContent)
      ){
         if(elements instanceof HTMLCollection) elements = [...elements];
         const parent = elements[0].parentElement;

         quickSort(0, elements.length);

         function quickSort(start, end){
            if(end === start) return;
            const pivot = get3Median(start, end);
            let pivotIndex = elements.findIndex(e => e.isSameNode(pivot));

            for(let i = start; i < end; i++){
               if(elements[i].isSameNode(pivot)) continue;

               if(compareFn(elements[i], pivot) <= 0){
                  if(i < pivotIndex) continue;
                  pivot.insertAdjacentElement('beforebegin', elements[i]);
               }
               else{
                  if(i > pivotIndex) continue;
                  pivot.insertAdjacentElement('afterend', elements[i]);
               }
            }

            const sorted = [...parent.children];
            pivotIndex = sorted.findIndex(e => e.isSameNode(pivot));

            for(let i = start; i < end; i++) elements[i] = sorted[i];
            quickSort(start, pivotIndex);
            quickSort(pivotIndex + 1, end);
         }


         function get3Median(start, end){
            const first = elements[start];
            const mid = elements[(end - start) >> 1];
            const last = elements[end - 1];
            let medElem, belowMed;

            // find the potential median: the greater value of two is the potential median
            if(compareFn(first, mid) < 0){ // first is lessthen mid
               medElem = mid;
               belowMed = first;
            }else{
               medElem = first;
               belowMed = mid;
            }

            // find the real median
            if(compareFn(medElem, last) < 0);// potential median is less then last: potential median is median
            else if(compareFn(last, belowMed) < 0) medElem = belowMed;
            else medElem = last;
            return medElem;
         }
      }
   }
}



if(onNodeJS) module.exports = Tools; //for Node.js
else window.to = Tools; //for Web Javascript