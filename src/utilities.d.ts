declare class MCJsonText {
    /**
     * @param {MCJsonText}mcText
     */
    static toString(mcText: MCJsonText): string;
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
    formats: string[];
    /**make Forecolor Dim
     * @type {boolean}
     */
    dim: boolean;
    /**italic text
     * @type {boolean}
     */
    italic: boolean;
    /****Animated Text:** swich bettween Dim and Bright overtimes
     * @type {boolean}
     */
    blink: boolean;
    /**swich Background - Foreground
     * @type {boolean}
     */
    invert: boolean;
    /**make Text unreadable, to view it copy and paste else where
     * @type {boolean}
     */
    hidden: boolean;
    /**plain Text content
     * @type {string}
     */
    text: string;
    toString(): any;
}
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
    debugLevel: number;
    /**prefix insert to the front of the message when logging
     * @type {string}
     */
    prefix: string;
    important: boolean;
}
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
export function sendConsoleOutput(Text: string | MCJsonText | MCJsonText[], options?: "normal" | "error" | SCOOption | "debug" | "warn" | "critical", prefix?: string, color?: string): Promise<string>;
/**
 * write logs from cache to log folder
 */
export function writeLog_file(coreLogs?: any): Promise<any>;
/**
 * cache Message to the Log file cache,
 * the cache will be write to the real file when writeLog_file() is called
 * @param {String}message Message to cache
 */
export function writeLog_cache(message: string): void;
export function getNativeFontFamily(): "Segoe UI" | "San Francisco" | "Noto Sans";
export {};
