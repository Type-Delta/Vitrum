

const _global = {
   version: '0.0.1',


   /**map that use `Editor.id` as key
   * @type {Map<string,Editor>}
   */
   editors: new Map(),
   HTMLElementIDs: new Set([
      "ko3m",
      "md21",
   ]),

   logs: {
      from: null,
      to: null,
      content: null,
   },

   /**
    * @type {State}
    */
   currentState: null
}




module.exports = _global;