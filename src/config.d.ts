declare const _exports: Config;
export = _exports;
declare class Config {
    STATE_PATH: string;
    /**
     * @type {string}
     */
    LAST_OPENFILE_PATH: string;
    DEFAULT_ENCODING: string;
    MAX_HISTORY_SIZE: number;
    /**
     * @type {'lessmemory'|'lesscomputation'}
     */
    OPTIMIZATION_MODE: 'lessmemory' | 'lesscomputation';
    TRIM_TRAILING_WHITESPACE: boolean;
    /**control which message should be shown in the console
     * debug: 4, normal: 3, error: 2, critical: 1
     */
    DEBUGLEVEL: number;
    MIN_LOG_CONTENT: number;
    LOG_FOLDER_PATH: string;
    MAX_LOG_FILE: number;
    WRITE_LOG_FILE: boolean;
    loadConfig(): void;
    writeConfig(): void;
}
