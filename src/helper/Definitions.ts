export interface FindOption {
   /**match with **Sensitive** casing
    */
   matchCase: boolean;
   /**result must match whole word or don't count
    */
   matchWholeWord: boolean;
   /**use regular expression
    */
   useRegex: boolean;
   /**match within selection area
    */
   matchSelected: boolean;
   /**find than replace
    */
   withReplace: boolean;
   /**when replacing keep the characters casing
    */
   preserveCase: boolean;
   /**search string
    */
   findStr: string;
   /**replacement string
    */
   replaceStr: string;
   /**selection area [start, end]
    * @type {number[]}
    */
   selection: number[];
   /**index of selected match result
    * @type {number}
    */
   findIndex: number;
   /**recent action happend to the Findpanel
    * **close:** user closed the find and replace panel;
    * **update:** find and replace option update;
    * **textupdate:** editor content changed;
    * **findnext:** user press "find next" button
    * **findprevious:** user press "find previous" button
    * **replace:** user press "replace single" button
    * **replaceall:** user press "replace all" button
    * @type {'close'|'update'|'textupdate'|'findnext'|'findprevious'|'replace'|'replaceall'}
    */
   action: 'close'|'update'|'textupdate'|'findnext'|'findprevious'|'replace'|'replaceall';
}







