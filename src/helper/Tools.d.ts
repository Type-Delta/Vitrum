declare class TFIDFValues {
    constructor(TF: any);
    TF: any;
    IDF: any;
    TF_IDF: any;
}
/**for `Tools.getMatchAllResult()`
 */
declare class MatchResult {
    constructor(v: any, s: any, e: any);
    /**the matched string
     * @type {string}
     */
    value: string;
    /**start index
     * @type {number}
     */
    start: number;
    /**end index
     * @type {number}
     */
    end: number;
}
export class SafeTrue {
    /**use for infinity-loops to prevent the loop from
     * unintentionally run forever
     * @param {Number}limit max loop iteration, default to 10*(10^9) (10 Billion)
     * @example
     * const st = new SafeTrue();
     * while(st.True){
     *    //do something
     * }
     */
    constructor(limit?: number);
    /**always return `true` if the amount of time this value gets read
     * doesn't exceed the limits
     * @returns {boolean}
     */
    get True(): boolean;
    #private;
}
export class SpawnMirror {
    /**setting for `'stdio'` property in `SpawnOptionsWithoutStdio`
     * this setting is **required** for `createMirror()` to work.
     * @example
     * const child = spawn('ls', ['-al'], {
          stdio: SpawnMirror.STDIO_MIRROR
       });
     */
    static STDIO_MIRROR: string[];
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
    static createMirror(child: any): void;
}
declare class KeyBind {
    /**
     * @param {string} strKeyBind raw keybinding, each keys seperated by '+'
     */
    constructor(strKeyBind: string);
    /**raw keybinding, each keys seperated by '+'
     */
    rawBinding: string;
    /**normalized keybinding stored in Set
     * each keys are normalize so that it can be compared directly
     * with `KeyboardEvent.Key`
     */
    keys: Set<string>;
    #private;
}
declare class Keyboard {
    /**map every keys that's being pressed
     * @type {Set<string>}
     */
    activeKeys: Set<string>;
    /**
     * @type {Map<KeyBind, Function>}
     */
    catchList: Map<KeyBind, Function>;
    /**Keep track of what key is currently being pressed
     * **this function should be called everytime `keydown` and `keyup`
     * Events trigger**
     * @param {KeyboardEvent} ev
     */
    handleKeyPress: (ev: KeyboardEvent) => void;
    /**test if the given keybind is being pressed by user
     * @param {KeyBind} keybind
     */
    test(keybind: KeyBind): boolean;
    /**
     * listen for the given keybind, `preventDefault()`
     * and call a callback function
     * @param {Function} callback
     * @param {KeyBind} keybind
     */
    catch(keybind: KeyBind, callback: Function): void;
    /**remove catch listener
     * @param {KeyBind} keybind
     */
    unCatch(keybind: KeyBind): void;
}
/**format JSON string to make it more human-readable
 * ***Waring:* in the current version this function will remove any White-Space in the string which can cause MASSIVE INFORMATION LOSS!!**
 * @param {string}JsonString
 * @returns {string} the beautified JSON string
 */
export declare function beautifyJson(JsonString: string): string;
export declare function bucketSort(NumArr: any, bucketCount: any): void;
/**clean array
 * @param {any[]} Arr array to clean
 * @param {any|any[]} itemToClean items to wipe off, optional(if None is provide,
 * will remove empty String, Array, Object),
 * can be array EX: ['0', '', 'g'] (those are Black-Listed items)
 * @returns new cleaned array
 */
export declare function cleanArr(Arr: any[], itemToClean?: any): any[];
export declare function cleanString(string: any): any;
export declare namespace DataScienceKit {
    /**calculate how many times each unique elements
     * appears in the given array
     * @param {any[]|string} arr
     */
    function frequencyOf(arr: string | any[]): Map<any, number>;
    /**return **Longest Common Subsequence** of two string or array
     * where each value can be compare with each other;
     * this is useful for determining how close those
     * Arrays/String are in terms of equality
     * @param {string|any[]} arrA
     * @param {string|any[]} arrB
     * @param comparator function that return `true` when the given values
     * is considered Equal
     */
    function LCS_of(arrA: string | any[], arrB: string | any[], comparator?: (a: any, b: any) => boolean): any[];
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
     * array contains TFIDFValues for every words in every Document
     */
    function TFIDF_of(documents: string[][]): Map<string, TFIDFValues>[];
}
/**return digit in the given index as Number
 * (index can be negative)
 * @param {number}index digit index of the interest Number
 * @param {number}number Number to pick a digit from
 * @returns [Number] digit at given index
 */
export declare function digitAt(index: number, number: number): number;
/**return digits in the given range as Number
 * @param {number}start digit start range of the interest Number
 * @param {number}start digit end range of the interest Number
 * @param {number}number Number to pick a digit from
 * @returns [Number] digit at given range
 */
export declare function digitAtRange(start: number, end: any, number: number): number;
/**escape all Regular Expressions  control chars
 * @param {string} regexpStr
 */
export declare function escapeRegExp(regexpStr: string): string;
/**just like `.length` but exclude some special control char
 * given a bit more accurate results
 */
export declare function ex_length(string: any): any;
/**get Array if index matched by `String.matchAll()`
 * @param {IterableIterator<RegExpMatchArray>}matchArr
 * @returns {number[]}
 */
export declare function getMatchAllIndexs(matchArr: IterableIterator<RegExpMatchArray>): number[];
/**get Array if index matched by `String.matchAll()`
 * @param {IterableIterator<RegExpMatchArray>}matchArr
 * @returns {MatchResult[]}
 */
export declare function getMatchAllResults(matchArr: IterableIterator<RegExpMatchArray>): MatchResult[];
/**generate random int at a specified range;
 * use build-in function `Math.random()` to generate random numbers
 * @param {number}min
 * @param {number}max
 */
export declare function getRandomInt(min: number, max: number): number;
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
export declare function IDGenerator(alreadyExistedIDs?: string[] | Set<string>, pallet?: string): string;
/** find Word in the given string
 *  if that Word isn't surrounded with en character
 *  return True if Word is found, a bit less sensitive than `string.includes()`
 * @param {String}word Word to search
 * @param {String}targetString string to search for Word
 * @param caseSensitive
 * @returns boolean
 */
export declare function includesWord(word: string, targetString: string, caseSensitive?: boolean): boolean;
export declare function isNumber(str: string): boolean;
export declare function isEmptyArray(obj: any): boolean;
export declare function isEmptyObject(obj: any): boolean;
/**clean file name by replace ALL invalid char with valid ones
 * @param rawName file name to clean
 * @param replaceChar char to replace, default to `_`
 * @returns cleaned name
 */
export declare function fileNameCleaner(rawName: any, replaceChar?: string): string;
/**replace any invalid chars in the path
 * @param {string}path FileSystem path to fix
 * @param {string}replaceStr string to replace
 */
export declare function fixFilePath(path: string, replaceStr?: string): string;
/**reformat YouTube url in different variation
 * to a standard `https://www.youtube.com/watch?v=...`
 * @param {string}url
 */
export declare function fixYTurl(url: string): string;
/**return type of content judging only from file Extension
 * @param {String}fileExt
 * @returns `'image'|'text'|'binary'|'media'|null`
 */
export declare function fileTypeOf(fileName: any): "image" | "text" | "binary" | "media";
export declare namespace jsTime {
    function howLong(lastDate: any, nowDate?: Date): string;
    function getTimeFromMS(milliseconds: any): {
        full: string;
        modern: () => string;
    };
}
/**linear interpolation function:
 * this function will return any % of `Max` value
 * depends on `Percentage` if 0 will return `Min`, 1 return `Max`
 * and anything in between will return any value between `Min` and `Max`
 * @param {Number}Min min value return `Min` when `Percentage` == 0
 * @param {Number}Max max value return `Max` when `Percentage` == 1
 * @param {Number}Percentage percentage of the `Max` value
 *
 */
export declare function lerp(Min: number, Max: number, Percentage: number): number;
/**(**Node Console Color**) return the Node.js Console Text formats, use this formmat to change
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
export declare function ncc(Color: string): string;
/**return the index of element in which its value is the closest
 * to the given number,
 * if the given Array is empty: return `null`
 * @param {Number[]}arr Array of Numbers
 * @param {Number}num the target Number
 */
export declare function nearestNumber(arr: number[], num: number): number;
/**Find the number of Properties in an Object
 * Object Property can refer as Items in an Object while each Item consist of pair of `Key: Value`
 * @param {Object}object
 * @returns Number of Property inside
 */
export declare function propertiesCount(object: any): number;
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
export declare function parseArgs(args: string[], template: any, caseSensitive?: boolean): {};
/**
 * parse boolean in string to Boolean data type
 * @param {String} stringBool boolean in string
 * @param {Boolean} strictMode if true will return null when stringBool is not 'true' | 'false' (default to false)
 * @returns Boolean data type
 */
export declare function parseBool(stringBool: string, strictMode?: boolean): boolean;
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
export declare function parseConfig(ConfigString: string): any;
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
export declare function pass(value: any, callback?: Function): any;
/**a value snap function that tries to snap `X` to `originValue`;
 * **return** `originValue` if delta of `X` to `originValue` is smaller than
 * `maxOffset` otherwise return `X`
 *
 * @param {number}X
 * @param {number}originValue
 * @param {number}maxOffset
 * @returns snapped value
 */
export declare function proximate(X: number, originValue: number, maxOffset: number): number;
/**
 * *" I have a `Reg(Exp)`, I have an `indexOf`... Ahhh `redexOf`"* ...any further explanation needed?
 *  redexOf is an indexOf but with `RegExp` supported
 * @param {String}string string to search from (can be omitted if use as extension)
 * @param {String|RegExp}searcher The Keyword, string or RegExp to search for
 * @param {Number}position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string. Also, if **Negative** value is use will search string from the back, similar to **`string.lastIndexOf()`** but position is **Negative Index**
 * @returns {Number} position of the string that match the searcher, if none, `-1` would return
 */
export declare function redexOf(string: string, searcher: string | RegExp, position?: number): number;
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
 * string "builtin" to use builtin function to automaticly determine the TF_IDF values
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
export declare function search(stringArr: string[], query: string, option?: {
    maxResult?: number;
    TF_IDFMaps?: Map<string, TFIDFValues>[] | "builtin";
}): {
    score: any;
    string: any;
    matchIndex: number;
}[];
/**pause the synchronous thread for the given duration
 * @param {Number}milliseconds how long to pause in milliseconds
 */
export declare function sleep(milliseconds: number): void;
/**clamp string's length to the given length
 * @param {string} str
 * @param {number} length target string length
 * @param {string} dropLocation 'mid', 'start' or 'end' determine location in which the string would
 * be dropped if the given str's length is smaller then `length`
 */
export declare function strClamp(str: string, length: number, dropLocation?: string): string;
/**limit string lenght, similar to strClamp but doesn't pad to the target length
 * @param {string} str
 * @param {number} limit max string length allowed
 * @param {string} dropLocation 'mid', 'start' or 'end' determine location in which the string would
 * be dropped if the given str's length is smaller then `length`
 */
export declare function strLimit(str: string, limit: number, dropLocation?: string): string;
/**Splice but with String, **Note That: Unlike Array.splice() this method doesn't Overwrite
 * the original var**
 * @param {string}str
 * @param {number}index
 * @param {number}removeCount number of Chars to remove
 * @param {string}strToInsert
 */
export declare function strSplice(str: string, index: number, removeCount: number, strToInsert?: string): string;
/**check if the given index of string `str` is surrounded by `surroundStr`
 * @param {string}surroundStr
 * @param {number}index
 * @param {string}str
 * @returns {boolean} whether the given index is surrounded by `surroundStr`
 */
export declare function surroundedBy(surroundStr: string, index: number, str: string): boolean;
/**convert Numbers to Place numbers
 * @param {Number}num
 */
export declare function toPlace(num: number): string;
export declare namespace WebKit {
    /**get childs that contains the given class in the parent element
     * @param {string} cName
     * @param {HTMLElement} parent
     */
    export function getChildWithClassName(cName: string, parent: HTMLElement): any[];
    /**callback when user clicked outside the given element
     * @param {HTMLElement} element
     * @param {Function} callback
     * @returns {Function} use this to clear event listener
     */
    export function onClickOutside(element: HTMLElement, callback: Function): Function;
    /**callback when user clicked outside the given element
     * **Similar to `onClickOutside()` but only invoke ONCE!**
     * @param {HTMLElement} element
     * @param {Function} callback
     */
    export function onceClickOutside(element: HTMLElement, callback: Function): void;
    /**clear event listener for `onClickOutside()` and `hideOnClickOutside()`
     * @example
     * let listener = onClickOutside(elem, doStuff);
     * function doStuff(){
     *    // . . .
     *    clearClickOutside(listener);
     * }
     * @param {Function} listener
     */
    export function clearClickOutside(listener: Function): void;
    /**make the element automatically hide its self when
     * user click outside this element
     * @param {HTMLElement} element
     * @param {string|HTMLElement} elemToHide
     * @returns {Function} use this to clear event listener
     */
    export function hideOnClickOutside(element: HTMLElement, elemToHide?: string | HTMLElement): Function;
    /**set all selected elements that matched the `specifier` as visible
     * and hide others the that doesn't match
     * @param {string} selector querySelector for 'selected elements'
     * @param {{id: string, class: string}} specifier ID and or ClassName any selected element that
     * match this specifier will be visible
     * @param {string} displayType Element style.display
     */
    export function hideOtherElements(selector: string, specifier: {
        id: string;
        class: string;
    }, displayType?: string): void;
    /**hides all element selected by the `selector`
     * this function hide elements by set its disply type to 'none'
     * @param {string} selector querySelector
     */
    export function hideAllElements(selector: string): void;
    /**predicates whether any of the selected element can be seen
     * @param {string} selector querySelector
     */
    export function isSelectedVisible(selector: string): boolean;
    export function isVisible(elem: HTMLElement): boolean;
    export { KeyBind };
    export { Keyboard };
    /**HTMLElement handler for textarea 'keydown' event
     * this prevent Tab key from select other element
     * and make Tab works like it should in most text editors
     * @param {KeyboardEvent} event
     * @param {HTMLTextAreaElement} _this element that cause this `KeyboardEvent`
     */
    export function handleTextarea_TabKeyPressed(event: KeyboardEvent, _this: HTMLTextAreaElement): void;
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
    export function sortElements(elements: HTMLCollection | HTMLElement[], compareFn?: (elemA: HTMLElement, elemB: HTMLElement) => number): void;
}
export {};
