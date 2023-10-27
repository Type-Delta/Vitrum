/**contains Classes that need to be accessible
 * from both inside UIHandler.js and outside
*/;


try{
   const to = require('./helper/Tools.js');
   const _ = require('lodash');
}catch{};



//////////////////   Helper   /////////////////////
/**Node in Dendrogram this diagram is to represent a nesting map
 * of EditorEffects
 * @example
 *             node1
 *               |
 *         |-----------|
 *         |           |
 *    |-------|      node2
 *    |       |
 *  node3    node4
 */
class EffectDendroNode {
   /**effect index, index of EditorEffect that this node originates from
    * @type {number}
    */
   fxIndex;
   fxPiority;
   start;
   end;
   /**
    * @type {EffectDendroNode[]}
    */
   innerBranch = null;

   /**
    * @param {number} fxIndex - index of EditorEffect that this node originates from
    * @param {number|'root'} fxPiority - the nesting order of this node the smaller the number
    *    the deeper this node will be, if set to 'root' this node will stay at the most top layer
    *    and other parameters will be ignored.
    * @param {number[]} position
    */
   constructor(fxPiority, fxIndex, position){
      if(fxPiority === 'root'){
         this.fxPiority = Infinity;
         return;
      }

      this.fxIndex = fxIndex;
      this.fxPiority = fxPiority;

      if(position) [this.start, this.end] = position;
   }

   /**
    * @param {EffectDendroNode} node
    */
   insert(node){
      if(!this.innerBranch?.length){
         this.innerBranch = [ node ];
         return;
      }

      for(let i = 0; i < this.innerBranch.length; i++){
         const travNode = _.cloneDeep(this.innerBranch[i]);

         // node end is OUTSIDE the travere node:  ...] )  or  ...}
         if(node.end >= travNode.end){
            if(node.start >= travNode.end){ // passing: ...] ()
               if(i + 1 < this.innerBranch.length&&node.end <= this.innerBranch[i + 1].start){
                  // insert node behind traveres node
                  this.innerBranch.splice(i + 1, 0, node);
                  return;

               }else if(i + 1 == this.innerBranch.length){ // there are no more element in the Array
                  this.innerBranch.push(node);
                  return;
               }
               continue;
            }

            // perfect overlap: {...}
            if(node.start == travNode.start&&node.end == travNode.end){
               if(node.fxPiority > travNode.fxPiority){
                  node.insert(travNode);
                  this.innerBranch[i] = node;
               }else this.innerBranch[i].insert(node);

               return;
            }

            // overlapping to the right:  [ (  ] )
            if(node.start >= travNode.start){
               if(node.fxPiority > travNode.fxPiority){

                  // split traverse node at `node.start`
                  const [tnodeL, tnodeR] = splitNode(travNode, node.start);

                  /**insert `tnodeR` in to the `node` then
                   * swap travarse node with `node` and insert `tnodeL` to the same layer as `node`
                   *      this               this
                   *        |                  |
                   *       -|-      =>   -|----*---|-
                   *     travNode      tnodeL     node
                   *                              -|-
                   *                             tnodeR
                   *     [ (  ] )          [ ]{  ] )
                  */
                  node.insert(tnodeR);
                  this.innerBranch.splice(i, 1);
                  this.insert(tnodeL);
                  this.insert(node);
                  return;

               }else{
                  // split `node`
                  const [nodeL, nodeR] = splitNode(node, travNode.end);
                  /** insert `nodeL` in to the traverse node and `nodeR`
                   *  to the same layer as traverse node
                   *      this               this
                   *        |                  |
                   *       -|-      =>   -|----*---|-
                   *     travNode     travNode   nodeR
                   *                     -|-
                   *                    nodeL
                   *     [ (  ] )          [ (  }( )
                  */
                  this.innerBranch[i].insert(nodeL);
                  this.insert(nodeR);
                  return;
               }
            }


            // nesting (the traverse node is INSIDE): ( [...] )
            node.insert(travNode);
            this.innerBranch.splice(i, 1);
            this.insert(node);
            return;


         }else if(node.end >= travNode.end){ // node end is INSIDE the travere node: ...[ ...) ]
            // overlapping to the left:  ( [  ) ]
            if(node.start < travNode.start){
               if(node.fxPiority > travNode.fxPiority){
                  // split traverse node at `node.start`
                  const [tnodeL, tnodeR] = splitNode(travNode, node.end);

                  /**insert `tnodeL` in to the `node` then
                   * swap travarse node with `node` and insert `tnodeR` to the same layer as `node`
                   *      this               this
                   *        |                  |
                   *       -|-      =>   -|----*---|-
                   *     travNode        node    tnodeR
                   *                     -|-
                   *                    tnodeL
                   *     ( [  ) ]          ( [  }[ ]
                  */
                  node.insert(tnodeL);
                  this.innerBranch.splice(i, 1);
                  this.insert(tnodeR);
                  this.insert(node);
                  return;

               }else{
                  // split `node`
                  const [nodeL, nodeR] = splitNode(node, travNode.start);

                  /** insert `nodeR` in to the traverse node and `nodeL`
                   *  to the same layer as traverse node
                   *      this               this
                   *        |                  |
                   *       -|-      =>   -|----*---|-
                   *     travNode       nodeL   travNode
                   *                              -|-
                   *                             nodeR
                   *     ( [  ) ]          ( ){  ) ]
                  */
                  this.innerBranch[i].insert(nodeR);
                  this.insert(nodeL);
                  return;
               }
            }

            // nesting (the traversing node is OUTSIDE): [ (...) ]
            this.innerBranch[i].insert(node);
            return;

         } else { // passing: () [...
            if(node.end <= travNode.start){
               // insert node in front of traveres node
               this.innerBranch.splice(i, 0, node);
               return;
            }
            continue;
         }
      }


      /**
       * @param {EffectDendroNode} node
       * @param {number} splitPos
       */
      function splitNode(node, splitPos){
         return [
            new EffectDendroNode(
               node.fxIndex, node.fxPiority, [node.start, splitPos]
            ),
            new EffectDendroNode(
               node.fxIndex, node.fxPiority, [splitPos, node.end]
            )
         ];
      }
   }

   /**this function gets called every time `traverse()` visits a node
    * @callback NodeVisitCB
    * @param {EffectDendroNode} node - the current node
    * @param {boolean} isLastTime - is this that last time we will ever visit this node
    * @returns {void}
    */

   /**traverse through the **innerBranch** using **LRV** (postorder tree traversal)
    * basically this function loop through nodes from the left, *visit* (calls a callback())
    * then check if this node has any innerBranch, if not: *visit* this same node for the last time
    * and continues to the next node in the same branch layer otherwise, traverse through the innerBranch
    * back to this node, *visit* it for the last time and continues
    * @param {NodeVisitCB} callback
    */
   traverse(callback){
      if(!this.innerBranch) return;
      for(let node of this.innerBranch){
         callback(node, false);
         if(node.innerBranch){
            node.traverse(callback);
         }
         callback(node, true);
      }
   }
}




//////////////////   Main Classes   /////////////////////
class EditorEffect {
   /**Effect type
    * **highlight**:  highlight text with normal `highlight` color;
    * **selected-highlight**:  highlight text with a special `highlight` color;
    * **htmlfix**: fix spacing and new line characters that wouldn't work with HTML;
    * @type {'highlight'|'selected-highlight'|'htmlfix'}
    */
   type;
   /**Position selections, each row represents one selection,
    * the first and second column in every row represent [start, end] position.
    * @type {number[][]}
    */
   positions = [];
   /**template use for `String.replace()`, '$&' represents
    * matched value
    * @type {string}
    */
   replaceTemplate;
   /**string to indentify what process
    * is this effect originates from
    * @type {string}
    */
   tag;
   /**this number is used to calculate the nesting order
    * this Effect should apply in case of overlaยping (or sometimes remove lower priority effects)
    * **Note: This Number is automatically calculated and should not be modified.**
    * @type {number}
    */
   effectPiority;
   /**
    * @param {'highlight'|'selected-highlight'|'htmlfix'} type
    * @param {RegExp} regex
    */
   constructor(type, tag, regex = null){
      this.type = type;
      this.tag = tag;
      this.regex = regex;

      switch(type){
         case "highlight":
            this.effectPiority = 3;
            break;
         case "selected-highlight":
            this.effectPiority = 4;
            break;
         case "htmlfix":
            this.effectPiority = -1;
            break;
      }
   }


   /**reconstruct this class from a normal Object with a matching properties
    * this function is for reconstructing the instance of this class
    * that has been serialized by Electron ipc
    * @param {Object} obj
    * @returns {EditorEffect}
    */
   static reconstructor(obj){
      let editorEffect = new EditorEffect();
      for(const key in editorEffect){
         if(obj[key]) editorEffect[key] = obj[key];
      }
      return editorEffect;
   }

   /**apply a single effect to the given string using HTML Markdown
    * this Markdown text can be displayed on `innerHTML` field
    * @param {string} text
    * @param {number} offset position offset when applying effect position
    */
   applyTo(text, offset){
      let oldLength, _text = text + '';
      let effectTags = this.getHTMLTags();
      let quickApply;
      if(offset??true){
         quickApply = true;
         offset = 0;
      }else quickApply = false;

      switch(this.type){
         case 'selected-highlight':
         case 'highlight':
         {
            if(this.regex){
               oldLength = _text.length;
               _text = _text.replace(this.regex, `${effectTags[0]}$&${effectTags[1]}`);

               offset += _text.length - oldLength;
            }
            if(!(this.positions?.length)) break;

            for(const pos of this.positions){
               oldLength = _text.length;
               _text = _text.slice(0, pos[0] + offset) + effectTags[0] +
                  _text.slice(pos[0] + offset, pos[1] + offset) + effectTags[1] +
                  _text.slice(pos[1] + offset);

               offset += _text.length - oldLength;
            }
            break;
         }
         case 'htmlfix':
         {
            oldLength = _text.length;
            _text = _text.replace(/\n/g, '<br>'); // newline fix
            _text = _text.replace(/ {2,}/g, '<code>$&</code>'); // spacing fix using <code>
            offset += _text.length - oldLength;
            break;
         }
      }
      if(quickApply) return _text;
      return { text: _text, offset };
   }

   /**get HTML tag for this Effect
    * @returns {string[]|null}
    */
   getHTMLTags(){
      switch(this.type){
         case 'selected-highlight':
            return ['<mark class="selected">', '</mark>'];
         case 'highlight':
            return ['<mark>', '</mark>'];
      }
      return null;
   }

   /**apply all effect to the given string using HTML Markdown
    * this Markdown text can be displayed on `innerHTML` field
    * @param {EditorEffect[]} effects
    * @param {string} text position offset when applying effect position
    * @param {boolean} useHTMLFix apply `htmlfix` effect
    */
   static applyAll(effects, text, useHTMLFix = true){
      let root = new EffectDendroNode(null, 'root');
      let offset = 0, index = 0;
      let _text = text + '';

      console.log(effects);
      // create Dendrogram Map
      for(const e of effects){
         for(const pos of e.positions){
            const node = new EffectDendroNode(e.effectPiority, index, pos);

            console.log(`insert`);
            root.insert(node);
         }
         index++;
      }


      // traverse through all nodes and apply effects one by one
      root.traverse((node, isLast) => {
         let addedLength, pos = [node.start, node.end];
         let tags = effects[node.fxIndex].getHTMLTags();

         if(!isLast){
            _text = _text.slice(0, pos[0] + offset) + tags[0] +
               _text.slice(pos[0] + offset, pos[1] + offset) +
               _text.slice(pos[1] + offset);
            addedLength = tags[0].length;
         }else{
            _text = _text.slice(0, pos[0] + offset) +
               _text.slice(pos[0] + offset, pos[1] + offset) + tags[1] +
               _text.slice(pos[1] + offset);
            addedLength = tags[1].length;
         }

         offset += addedLength;
      });


      if(useHTMLFix){
         const { text } = new EditorEffect('htmlfix').applyTo(_text, 0);
         _text = text;
      }
      return _text;
   }
}


if(typeof window === 'undefined') module.exports = {
   EditorEffect
}; //for Node.js
else {
   // window.UIClass = {
   //    EditorEffect
   // };

   // window
}; //for Web Javascript