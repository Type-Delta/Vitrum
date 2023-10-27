if(!window.coreAPI) throw new Error('Handler not loaded by Electron!');

try{
   // for Definitions only
   const to = require('../../helper/Tools.js');
   const { EditorEffect } = require('./mainWindow.Class.js');
   const { setZeroTimeout } = require('../../../assets/code/setZeroTimeout.js');
   const { gsap } = require('gsap');
}catch{};


const {
   sendConsoleOutput
} = window.coreAPI;

const { WebKit, Timer } = to;
const {
   KeyBind,
   Keyboard,
   getChildWithClassName,
   isSelectedVisible,
   isVisible,
   onClickOutside,
   onceClickOutside,
   hideAllElements,
   hideOnClickOutside,
   hideOtherElements,
   handleTextarea_TabKeyPressed,
   sortElements,
   isPosInside
} = WebKit;




class EditorPackage {
   /**sidebar
    * @type {HTMLElement}
   */
   tabElement;
   /**interactive area (invisible)
    * @type {HTMLTextAreaElement}
   */
   textAreaElement;
   /**container for display element
    * @type {HTMLDivElement}
    */
   backdropElement;
   /**the visible part of the editor
    * we use normal element instead of Textarea for
    * text highlighting and more
    * @type {HTMLDivElement}
    */
   displayElement;
   /**container for `textAreaElement` and `backdropElement`
    * this element made sure everything is organized
    * @type {HTMLDivElement}
    */
   editorArea;
   constructor(tab, textarea, backdrop, display, editorArea){
      this.tabElement = tab;
      this.textAreaElement = textarea;
      this.backdropElement = backdrop;
      this.displayElement = display;
      this.editorArea = editorArea;
   }
}




class ElementSpecifier {
   /**@type {string} */
   id;
   /**@type {string} */
   class;
}



class FindOption {
   /**match with **Sensitive** casing
    */
   matchCase = false;
   /**result must match whole word or don't count
    */
   matchWholeWord = false;
   /**use regular expression
    */
   useRegex = false;
   /**match within selection area
    */
   matchSelected = false;
   /**find than replace
    */
   withReplace = false;
   /**when replacing keep the characters casing
    */
   preserveCase = false;
   /**search string
    */
   findStr;
   /**replacement string
    */
   replaceStr;
   /**selection area [start, end]
    * @type {number[]}
    */
   selection;
   /**index of selected match result
    * @type {number}
    */
   findIndex = 0;
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
   action;
   constructor(){}
}




class CustomSelect {
   /**the Custom Select element
    * @type {HTMLDivElement}
    */
   wrapperElement = null;
   /**the button or input that once clicked
    * will expand the dropdown menu
    * @type {HTMLDivElement}
    */
   selectElement = null;
   /**the lable for `selector` this can be edit
    * depending on `CustomElement.enableOptionSearch`
    * @type {HTMLInputElement}
    */
   selectedInputElement = null;
   /**dropdown menu that contains all the options
    * @type {HTMLUListElement}
    */
   dropdownElement = null;


   /**selected dropdown menu value this value is the `id` of
    * `li` elements in the dropdown menu
    * @type {string}
    */
   selectedValue;
   /**enable user to search all options
    * useful when there are a lot of option available,
    * default to `false`
    */
   enableOptionSearch = false;
   /**whether to update the `selectedInputElement` to
    * reflect what use have selected, default to `true`
    */
   showSelectedValue = true;
   enable = true;
   /**unique name for this instance of CustomSelect
    */
   name;

   /**store callback function for every Events
    * use Event name as Key and Callback function for value
    * @type {Map<string, Function>}
    */
   #events = new Map();
   #selectedLabel;
   /**array of Label for every option in the dropdown menu
    * @type {string[]}
    */
   #optionLabelList;
   #wrapperSelector;


   /**controller for custom Select element
    * @param {string} name unique name for this intance of CustomSelect
    * @param {string} wrapperSelector
    * @param {boolean} optionSearch
    */
   constructor(wrapperSelector, name, optionSearch = false){
      this.wrapperElement = document.querySelector(wrapperSelector);
      this.selectElement = document.querySelector(
         wrapperSelector + ' > .custom-select-selector'
      );
      this.selectedInputElement = document.querySelector(
         wrapperSelector + ' > .custom-select-selector > .selected-value'
      );
      this.dropdownElement = document.querySelector(
         wrapperSelector + ' > .custom-select-dropdown'
      );

      this.#wrapperSelector = wrapperSelector;
      this.name = name;


      this.enableOptionSearch = optionSearch;
      this.#refreshOptionLabel();


      this.selectElement.addEventListener("click", this.#handleSelectBtn_click);
      onClickOutside(this.wrapperElement, this.#handleClickOutside);

      if(optionSearch){
         this.selectedInputElement.addEventListener("input", this.#handleSelectBtn_input);
      }else this.selectedInputElement.readOnly = true;

      this.update();
   }


   static createOptionElement(valueID, optionName, innerHTML){
      const optionNode = document.createElement('li');
      const inputNode = document.createElement('input');
      const lableNode = document.createElement('label');

      inputNode.type = 'radio';
      inputNode.name = optionName;
      inputNode.id = valueID;

      lableNode.setAttribute('for', valueID);
      lableNode.innerHTML = innerHTML;

      optionNode.role = 'option';
      optionNode.appendChild(inputNode);
      optionNode.appendChild(lableNode);
      return optionNode;
   }


   update(){
      if(this.enableOptionSearch){
         this.selectedInputElement.readOnly = !this.enable;
      }

      for(const child of this.dropdownElement.children){
         child.removeEventListener("click", this.#handleDropdown_click);
         child.addEventListener("click", this.#handleDropdown_click);
      };
      this.#refreshOptionLabel();
      this.#updateSelectedValue();
   }


   setSelectedValue(valueID){
      if(this.selectedValue == valueID) return;
      this.selectedValue = valueID;
      this.#emits('value_change', valueID);

      const item = this.getDropdownMenuItemWithID(valueID);
      if(!item) return;

      if(this.showSelectedValue){
         this.selectedInputElement.value =
            this.#selectedLabel = item.children[1].textContent;
      }
      item.children[0].checked = true;
   }


   isExpanded(){
      return this.wrapperElement.classList.contains('active');
   }

   clearOptions(){
      if(!this.dropdownElement.children.length) return;

      while (this.dropdownElement.lastElementChild) {
         this.dropdownElement.removeChild(
            this.dropdownElement.lastElementChild
         );
      }
      this.#refreshOptionLabel();
   }

   /**add option element to the dropdown menu
    * `option` can be **innerHTML** for the lable or
    * an OptionElement created by `CustomSelect.createOptionElement()`
    * @param {HTMLLIElement} option
    * @param {string} valueID
    */
   addOption(valueID, option){
      if(this.includesOption(valueID)) return;

      if(option instanceof HTMLLIElement){
         this.dropdownElement.appendChild(option);
         return;
      }

      this.dropdownElement.appendChild(
         CustomSelect.createOptionElement(valueID, this.name, option)
      );
   }

   includesOption(valueID){
      for(const node of this.dropdownElement.children){
         if(node.children[0].id == valueID) return true;
      }
      return false;
   }

   getDropdownMenuItemWithID(valueID){
      for(const node of this.dropdownElement.children){
         if(node.children[0].id == valueID) return node;
      }
      return null;
   }

   closeDropdown(){
      if(!this.isExpanded()) return;

      this.wrapperElement.classList.remove("active");
      if(this.showSelectedValue&&this.enable){
         if(this.#selectedLabel)
            this.selectedInputElement.value = this.#selectedLabel;
         else{
            this.selectedInputElement.placeholder = 'Not Selected';
            this.selectedInputElement.value = '';
         }
      }
   }

   /**
    * @param {'selectelement_click'|'value_change'} eventName
    * @param {Function} callback
    */
   on(eventName, callback){
      if(!(
         eventName != 'selectelement_click'||
         eventName != 'value_change'
      )) throw new Error('#dl4ws | invalid eventName');

      this.#events.set(eventName, callback);
   }

   /**
    * @param {'selectelement_click'|'value_change'} eventName
    */
   removeListener(eventName){
      if(!(
         eventName != 'selectelement_click'||
         eventName != 'value_change'
      )) throw new Error('#n24ws | invalid eventName');

      this.#events.delete(eventName);
   }


   #refreshOptionLabel(){
      this.#optionLabelList = [];
      for(const option of this.dropdownElement.children){
         if(!isVisible(option)) continue;
         this.#optionLabelList.push(option.childNodes[1].textContent);
      }
   }


   #updateSelectedValue(){
      const item = this.getDropdownMenuItemWithID(this.selectedValue);
      if(!item) return;

      if(this.showSelectedValue){
         this.selectedInputElement.value =
            this.#selectedLabel = item.children[1].textContent;
      }
      item.children[0].checked = true;
   }



   /**
    * @param {MouseEvent} ev
    */
   #handleSelectBtn_click = (ev) => {
      if(!this.isExpanded()&&!this.enable) return;

      // add/remove active class on the container element
      const nowActive = this.wrapperElement.classList.toggle("active");
      // update the area-expanded attribute based on the current state
      this.selectElement.setAttribute(
         "area-expanded",
         this.selectElement.getAttribute("area-expanded") === "true" ? "false" : "true"
      );

      this.#emits('selectelement_click', ev);

      if(!this.enableOptionSearch) return;

      if(nowActive){
         this.selectedInputElement.select();
         this.selectedInputElement.style.cursor = 'text';
      }else{
         this.selectedInputElement.blur();
         this.selectedInputElement.style.cursor = 'pointer';
      }
   }

   /**
    * @param {InputEvent}ev
    */
   #handleSelectBtn_input = (ev) => {
      const searchValue = this.selectedInputElement.value;
      if(!searchValue){
         // make all option visible
         queueMicrotask(() => {
            sortElements(
               this.dropdownElement.children,
               (a, b) => {
                  if(a.hidden) a.hidden = false;
                  if(b.hidden) b.hidden = false;
                  return a.children[1].textContent.localeCompare(b.children[1].textContent);
               }
            );
         })
         return;
      }

      const searchRes = to.search(
         this.#optionLabelList,
         searchValue,
         { maxResult: 20, TF_IDFMaps: ActionmenuUI.fonts_TFIDFMap }
      );
      const scoreMax = Math.max(...searchRes.map(v => v.score));
      const filteredSearchRes = searchRes.filter(v => v.score > scoreMax * 0.5);


      let dropdownItems = [...this.dropdownElement.children];
      let topIndex = 0;
      for(const sRes of filteredSearchRes){
         const matchElem = dropdownItems.find(e => e.children[1].textContent == sRes.string);
         if(matchElem){
            if(matchElem.hidden) matchElem.hidden = false;
            this.dropdownElement.insertBefore(
               matchElem, dropdownItems[topIndex++]
            );
            continue;
         }
      }

      for(let i = topIndex; i < this.dropdownElement.children.length; i++){
         if(!this.dropdownElement.children[i].hidden)
            this.dropdownElement.children[i].hidden = true;
      }

   }

   #handleClickOutside = () => {
      this.closeDropdown();
   }


   /**
    * @param {MouseEvent} ev
    */
   #handleDropdown_click = (ev) => {
      if (ev.clientX == 0 && ev.clientY == 0) return;

      const id = ev.target.parentElement.children[0].id;
      if(!id) return;

      this.wrapperElement.classList.remove("active");

      if(this.selectedValue != id){
         if(this.showSelectedValue){
            this.selectedInputElement.value =
               this.#selectedLabel = ev.target.parentElement.children[1].textContent;
         }
         this.selectedValue = id;
         this.#emits('value_change', id);
      }
   }


   #emits(eventName, ...params){
      if(!this.#events.has(eventName)) return;
      (this.#events.get(eventName))(...params);
   }
}










// Consts
const NAMESPACES = {
   svg: "http://www.w3.org/2000/svg"
};
const KeyboardManager = new Keyboard();
const KeyBindings = new Map([
   ['undo', new KeyBind('Ctrl+Z')],
   ['redo', new KeyBind('Ctrl+Shift+Z')],
   ['find', new KeyBind('Ctrl+F')],
   ['rename', new KeyBind('F2')],
   ['openfile', new KeyBind('Ctrl+O')],
   ['savefile', new KeyBind('Ctrl+S')],
   ['savefileas', new KeyBind('Ctrl+Shift+S')],
   ['closeapp', new KeyBind('Alt+F4')],
   ['editorzoomin', new KeyBind('Ctrl+=')],
   ['editorzoomout', new KeyBind('Ctrl+-')],
]);

const HTMLFix = new EditorEffect("htmlfix");
/**the maximum, minimum font size allowed in px
 * @type {number[]} - [minSize, maxSize]
 */
const ALLOWED_FONT_SIZES = [2, 80];




// Vars
/**interval controller that's used to defer
 * interactions with Actionmenu when it wasn't ready
 * @type {NodeJS.Timer}
 */
let actionmenuUIWaitInterval;











/////////////////////   Events   /////////////////////
///  `click` for both actual btn and the virtual ones ///
/**
 * @param {MouseEvent} ev
 */
function btn_closeApp_click(ev){
   window.coreAPI.sendCloseAppCmd();
}
/**
 * @param {MouseEvent} ev
 */
function btn_minimizeApp_click(ev){
   window.coreAPI.sendMinimizeAppCmd();

}
/**
 * @param {MouseEvent} ev
 */
function togglebtn_maximizeApp_click(ev){
   window.coreAPI.sendToggleMaximizeAppCmd();
}

/**
 * @param {MouseEvent} ev
 */
function togglebtn_maximizeApp_click(ev){
   window.coreAPI.sendToggleMaximizeAppCmd();
}
/**
 * @param {MouseEvent} ev
 */
function btn_newFile_click(ev){
   window.coreAPI.sendNewFileCmd();
}
/**
 * @param {MouseEvent} ev
 */
function btn_newFileInNewWindow_click(ev){
   window.coreAPI.sendNewFileWindowCmd();
}
/**
 * @param {MouseEvent} ev
 */
function btn_openFile_click(ev){
   window.coreAPI.sendOpenFileCmd();
}
/**
 * @param {MouseEvent} ev
 */
async function btn_renameFile_click(ev){
   if(ev&&isElementInactive(ev.target)) return;
   const { id, editor } = EditorUI.getActiveEditor();
   if(!id) return;

   const res = await PromptUI.prompt(
      'Enter New File Name...',
      EditorUI.getEditorTitle(editor)
   );

   if(!res) return;

   window.coreAPI.sendRenameFileCmd(id, res);
}
/**
 * @param {MouseEvent} ev
 */
function btn_saveFile_click(ev){
   if(ev&&isElementInactive(ev.target)) return;
   const id = EditorUI.getActiveEditorID();

   if(id == null) return;
   window.coreAPI.sendSaveFileCmd(id);
}
/**
 * @param {MouseEvent} ev
 */
function btn_saveFileAs_click(ev){
   if(ev&&isElementInactive(ev.target)) return;
   const id = EditorUI.getActiveEditorID();

   if(id == null) return;
   window.coreAPI.sendSaveFileAsCmd(id);
}
/**
 * @param {MouseEvent} ev
 */
function btn_undo_click(ev){
   if(ev&&isElementInactive(ev.target)) return;
   const id = EditorUI.getActiveEditorID();

   if(id == null) return;
   window.coreAPI.sendUndoCmd(id);
}
/**
 * @param {MouseEvent} ev
 */
function btn_redo_click(ev){
   if(ev&&isElementInactive(ev.target)) return;

   const id = EditorUI.getActiveEditorID();

   if(id == null) return;
   window.coreAPI.sendRedoCmd(id);
}
/**
 * @param {MouseEvent} ev
 */
function btn_cut_click(ev){
   if(ev&&isElementInactive(ev.target)) return;

   const { editor } = EditorUI.getActiveEditor();
   if(!editor) return;

   const selection = EditorUI.copySelectedContentToClipboard(editor);
   editor.textAreaElement.value = editor.textAreaElement.value.slice(0, selection[0]) +
      editor.textAreaElement.value.slice(selection[1]);
   EditorUI.handleTextarea_change(editor);
}
/**
 * @param {MouseEvent} ev
 */
function btn_copy_click(ev){
   if(ev&&isElementInactive(ev.target)) return;

   const { editor } = EditorUI.getActiveEditor();
   if(!editor) return;

   EditorUI.copySelectedContentToClipboard(editor);
}
/**
 * @param {MouseEvent} ev
 */
function btn_paste_click(ev){
   if(ev&&isElementInactive(ev.target)) return;

   const { editor } = EditorUI.getActiveEditor();
   if(!editor) return;

   navigator.clipboard.readText().then(text => {
      EditorUI.insertContent(text, editor);
   });
}
/**
 * @param {MouseEvent} ev
 */
function btn_findReplace_click(ev){
   // return if no active editor
   if(!EditorUI.getActiveEditorID()) return;
   FindpanelUI.toggleShow();
}
/**
 * @param {MouseEvent} ev
 */
function btn_insert_click(ev){
   console.log(`insert`);
   // TODO
}
/**
 * @param {MouseEvent} ev
 */
function btn_editPreferences_click(ev){
   console.log(`Preferences`);
}
/**
 * @param {MouseEvent} ev
 */
function btn_editorZoomIn_click(ev){
   console.log(`zoom in`);
   EditorUI.zoomIn();
}
/**
 * @param {MouseEvent} ev
 */
function btn_editorZoomOut_click(ev){
   console.log(`zoom out`);
   EditorUI.zoomOut();
}
/**
 * @param {MouseEvent} ev
 */
function menubarBtn_click(ev){
   const id = getComponentID(ev.target)??getComponentID(ev.target.parentElement);
   const dropdown = document.getElementById('MD-' + id);
   if(!dropdown){
      console.warn('cant find dropdown with id MD-' + id, ev.target);
      return;
   }


   const activeEditor = EditorUI.getActiveEditor();

   if(activeEditor){
      window.coreAPI.askCore('editorCanUndo', activeEditor.id).then(ans => {
         if(ans){
            document.querySelector('.dropdown-menu > .btn_undo').classList.remove('inactive');
         }else document.querySelector('.dropdown-menu > .btn_undo').classList.add('inactive');
      });

      window.coreAPI.askCore('editorCanRedo', activeEditor.id).then(ans => {
         if(ans){
            document.querySelector('.dropdown-menu > .btn_redo').classList.remove('inactive');
         }else document.querySelector('.dropdown-menu > .btn_redo').classList.add('inactive');
      });

      document.querySelector('.dropdown-menu > .btn_redo').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_find-replace').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_rename-file').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_save-file').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_save-file-as').classList.remove('inactive');
   }else{
      document.querySelector('.dropdown-menu > .btn_undo').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_redo').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_find-replace').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_rename-file').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_save-file').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_save-file-as').classList.add('inactive');
   }

   if( // has an active editor but no selection has been made or no active editor
      !activeEditor||
      (activeEditor&&
         activeEditor.editor.textAreaElement.selectionStart ==
         activeEditor.editor.textAreaElement.selectionStart&&
         activeEditor.editor.textAreaElement.selectionStart == 0)
   ){
      document.querySelector('.dropdown-menu > .btn_cut').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_copy').classList.add('inactive');
      document.querySelector('.dropdown-menu > .btn_paste').classList.add('inactive');
   }else{
      document.querySelector('.dropdown-menu > .btn_cut').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_copy').classList.remove('inactive');
      document.querySelector('.dropdown-menu > .btn_paste').classList.remove('inactive');
   }

   // if any of dropdown menu is visble hide them otherwise, show this dropdown menu
   if(isSelectedVisible('.menubar > .menubar-wrapper > .dropdown-menu')){
      hideAllElements('.menubar > .menubar-wrapper > .dropdown-menu');
   }
   else dropdown.style.display = 'block';
}



///  `mouseenter` ///
/**
 * @param {HTMLElement} event
 * @param {MouseEvent} ev
 */
function menubarBtn_mouseenter(event, ev){
   if(!isSelectedVisible('.menubar > .menubar-wrapper > .dropdown-menu')) return;

   const id = getComponentID(event.target);
   const dropdownWithID = document.getElementById('MD-' + id, event.target);
   if(!dropdownWithID){
      console.warn('cant find dropdown with id MD-' + id);
      return;
   }

   hideOtherElements(
      '.menubar > .menubar-wrapper > .dropdown-menu',
      { id: 'MD-' + id },
      'block'
   );
}


function fontToValueID(fontFamily){
   return 'FS-' + fontFamily.replace(/"/g, '').replace(/ /g, '_');
}

function valueIDToFont(valueID){
   const v_id = valueID.slice(3);
   if(v_id.includes('_')){
      return `"${v_id.replace(/_/g, ' ')}"`;
   }
   return v_id;
}




















////////////////////   Utilities   //////////////////////
/**get Component ID from HTML Element; id stored in HTML Element is made of `NAME-COMPONENT_ID`
 * @param {HTMLElement} element
 * @returns {string|null}  Component ID return null if could not find `id` property
 * or couldn't match the pattern correctly.
 */
function getComponentID(element){
   if(!element?.id) return null;
   return (element.id.split('-')[1])??null;
}

/**set listener for every elements with the given `className`
 * @param {string} className
 * @param {string} eventName
 * @param {Function} callback
 */
function addListenerByClass(className, eventName, callback){
   [...document.getElementsByClassName(className)].forEach(e => {
      e.addEventListener(eventName, callback);
   });
}

/**filter all EditorEffect with matching tag
 * fron the array
 * @param {EditorEffect[]} effects
 * @param {string} tag
 */
function filterAllEffectWithTag(tag, effects){
   return effects.filter(e => e.tag !== tag);
}

/**whether this element or its parent has class 'inactive'
 * @param {HTMLElement} element
 */
function isElementInactive(element){
   return (
      element.classList.contains('inactive')||
      element.parentElement.classList.contains('inactive')
   );
}







/**UI manager for Editor
 */
const EditorUI = {
   /**
    * @type {Map<string, EditorPackage>}
    */
   editors: new Map(),
   /**store effects for every Editor, using Editor ID as Key
    * @type {Map<string, EditorEffect[]>}
    */
   EffectBase: new Map(),
   global: {
      /**font size in px
       * @type {number}
       */
      fontSize: null,
      /**line spacing (aka. line height) in ch
       * @type {number}
       */
      lineSpacing: null,
      /**letter spacing in ch
       * @type {number}
       */
      letterSpacing: null,
      /**whether to use line wrap or not
       * @type {boolean}
       */
      useLineWrap: null,
      /**encoding type
       * @type {string}
       */
      encoding: null,
      /**font family name
       * @type {string}
       */
      fontFamily: null
   },
   /**modifier for the fontsize in px
    * this number will get added to the fontsize
    * when setting `style`
    * @type {number}
    */
   zoomSizeModifier: 0,



   update(){
      const noEditorText = document.getElementById('no-editor-text');
      if(this.editors.size > 2) noEditorText.hidden = true;
      else if(noEditorText.hidden){
         noEditorText.hidden = false;
         return;
      }

      const whiteSpaceStyle = (this.global.useLineWrap?'pre-line':'nowrap');
      for(const [ /*id*/, editor ] of this.editors){
         if(
            parseFloat(
               editor.displayElement.style.fontSize.slice(0, -2)
            ) - this.zoomSizeModifier != this.global.fontSize
         ){
            editor.displayElement.style.fontSize =
               editor.textAreaElement.style.fontSize =
               (this.global.fontSize + this.zoomSizeModifier) + 'px';
         }

         if(editor.displayElement.style.lineHeight.slice(0, -2) != this.global.lineSpacing){
            editor.displayElement.style.lineHeight =
               editor.textAreaElement.style.lineHeight = this.global.lineSpacing + 'ch';
         }

         if(editor.displayElement.style.letterSpacing.slice(0, -2) != this.global.letterSpacing){
            editor.displayElement.style.letterSpacing =
               editor.textAreaElement.style.letterSpacing = this.global.letterSpacing + 'ch';
         }

         if(editor.textAreaElement.style.whiteSpace != whiteSpaceStyle){
            editor.displayElement.style.whiteSpace =
               editor.textAreaElement.style.whiteSpace = whiteSpaceStyle;
         }

         if(editor.displayElement.style.fontFamily != this.global.fontFamily){
            editor.displayElement.style.fontFamily =
               editor.textAreaElement.style.fontFamily = this.global.fontFamily;
         }
      }
   },


   updateEditorDisplay(id){
      const editor = this.editors.get(id);
      const effects = this.EffectBase.get(id);
      if(!editor){
         console.warn(`can't find editor with id: `, id);
         return;
      }

      let content = editor.textAreaElement.value + '';

      if(effects?.length)
         content = EditorEffect.applyAll(effects, content, true);
      else content = HTMLFix.applyTo(content);

      editor.displayElement.innerHTML = content;
   },


   /**
    * @param {MouseEvent} ev
    */
   onEditorTab_click(ev){
      if(!(ev.target.classList.contains('editor-tab'))) return;
      // tab and textarea's id has `Editor.index` inside separated by '-'
      EditorUI.setActiveEditor(ev.target.id.split('-')[1]);
   },

   /**
    * @param {MouseEvent} ev
    */
   onEditorTabCloseBtn_click(ev){
      // target = svg; target.parentElement = button; target.parentElement.parentElement = tab;
      const id = getComponentID(ev.target.parentElement)??getComponentID(ev.target.parentElement.parentElement)??
         getComponentID(ev.target.parentElement.parentElement.parentElement);

      if(!id) return;

      window.coreAPI.sendCloseEditorCmd(
         id
      );
   },

   /**zoom in by changing the actual fontsize of the editor element
    * this will not modify `EditorUI.global.fontSize` value
    * @param {number} amu how much the actual font size would change in px
    */
   zoomIn(amu = 5){
      EditorUI.zoomSizeModifier += amu;
      console.log(EditorUI.zoomSizeModifier);
      // max zoom in reached
      if(EditorUI.global.fontSize + EditorUI.zoomSizeModifier > ALLOWED_FONT_SIZES[1]) return;

      for(const [/*id*/, editor] of EditorUI.editors){
         editor.displayElement.style.fontSize =
               editor.textAreaElement.style.fontSize =
               (this.global.fontSize + this.zoomSizeModifier) + 'px';
      }
   },

   /**zoom out by changing the actual fontsize of the editor element
    * this will not modify `EditorUI.global.fontSize` value
    * @param {number} amu how much the actual font size would change in px
    */
   zoomOut(amu = 5){
      EditorUI.zoomSizeModifier -= amu;
      console.log(EditorUI.zoomSizeModifier);
      // max zoom out reached
      if(EditorUI.global.fontSize + EditorUI.zoomSizeModifier < ALLOWED_FONT_SIZES[0]) return;

      for(const [/*id*/, editor] of EditorUI.editors){
         editor.displayElement.style.fontSize =
               editor.textAreaElement.style.fontSize =
               (this.global.fontSize + this.zoomSizeModifier) + 'px';
      }
   },

   /****handler function** this function should be called
    * every time there's any change on the Textarea content
    * that's not from the Core program
    * @param {InputEvent|EditorPackage} ev InputEvent or EditorPackage
    */
   handleTextarea_change(ev){
      const textarea = ev?.target??ev.textAreaElement;

      EditorUI.updateEditorDisplay(
         getComponentID(textarea)
      );


      window.coreAPI.sendEditorContentUpdate(
         getComponentID(textarea),
         textarea.value,
         [
            textarea.selectionStart, textarea.selectionEnd
         ]
      );


      if(FindpanelUI.isActive){
         FindpanelUI.updateFindnReplace('textupdate');
      }
   },

   /**handle scrolling of the editor
    * this function made sure the scrolling of **display**
    * and **interactive area** (textarea) are pinned together
    * @param {Event} ev
    */
   handleTextarea_scroll(ev){
      const id = getComponentID(ev.target);
      const editor = EditorUI.editors.get(id);
      const bd = document.getElementById('EDA-' + id);
      if(!editor)
         return console.warn(`can't find editor from: `, ev.target);

      // Have no f clue why `editor.backdropElement` won't work here...
      bd.scrollTop = editor.textAreaElement.scrollTop;
      bd.scrollLeft = editor.textAreaElement.scrollLeft;
   },

   /**
    * @param {WheelEvent} ev
    */
   handleTextarea_wheelTick(ev){
      if(!KeyboardManager.test(KeyBind.key('ctrl'))) return;

      ev.preventDefault();
      if(ev.deltaY > 0) // scroll down == zoom out
         EditorUI.zoomOut();
      else EditorUI.zoomIn();
   },


   /**
    * @param {string}id Editor ID
    */
   getEditorWithID(id){
      return this.editors.get(id);
   },

   /**get effect associated with the target editor
    * @param {string} id Editor ID
    */
   getEffectsForEditor(id){
      return this.EffectBase.get(id);
   },



   /**Set editor as active
    * @param {Map<string,Editor>}editors
    * @param {string|number} index index of editor or editor ID
    * @returns {boolean} wether this function succeed or not
    */
   setActiveEditor(index){
      let succsess = false;
      let i = 0;

      if(typeof index === 'number'&&index < 0)
         index = this.editors.size + index;


      for(let [id, editor] of this.editors){
         if(id == index||index === i){
            editor.textAreaElement.style.display = 'unset';
            editor.tabElement.classList.replace('deselected', 'selected');
            if(FindpanelUI.isActive) editor.editorArea.classList.add('findactive');
            else editor.editorArea.classList.remove('findactive');
            succsess = true;
            continue;
         }

         editor.textAreaElement.style.display = 'none';
         editor.tabElement.classList.replace('selected', 'deselected');
         i++;
      }
      return succsess;
   },


   setEditorContent(id, content, selection){
      const editor = EditorUI.getEditorWithID(id);
      if(!editor){
         console.warn(`can't find editor with id: `, id);
         return;
      }

      editor.textAreaElement.value = content;
      if(selection?.[0]??true){
         editor.textAreaElement.selectionStart = selection[0];
         editor.textAreaElement.selectionEnd = selection[1];
      }
      if(FindpanelUI.isActive)
         FindpanelUI.updateFindnReplace('textupdate');

      this.updateEditorDisplay(id);
   },



   /**Create and append new Editor to the Window
    * @param {string} documentName
    * @param {string} id
    * @param {string} content text to load to the editor
    */
   appendNewEditor(documentName, id, content = null, readonly = false){
      const tab = createTabElement();
      const { editor, backdrop, display, textarea } = createEditorElements();

      tab.addEventListener('click', EditorUI.onEditorTab_click);

      const container = document.getElementsByClassName("editor-container")[0];
      container.children[0].appendChild(tab); // first children is the sidebar container
      container.appendChild(editor);

      this.editors.set(id,
         new EditorPackage(tab, textarea, backdrop, display, editor)
      );
      // this.EffectBase.set(id, [
      //    new EditorEffect("highlight", 'test', /[A-Z].*?\b/g)
      // ]);

      this.update();
      this.setActiveEditor(-1); // set active recent Editor




      function createTabElement(){
         const node = document.createElement("li");
         const closeBtn = document.createElement('button');
         const btnIcon_close = document.createElementNS(NAMESPACES.svg, 'svg');
         const svgPath_close = document.createElementNS(NAMESPACES.svg, 'path');
         const btnIcon_nosave = document.createElementNS(NAMESPACES.svg, 'svg');
         const svgPath_nosave = document.createElementNS(NAMESPACES.svg, 'path');

         svgPath_close.setAttribute('d', 'm250.923-218.924-31.999-31.999L448.001-480 218.924-709.077l31.999-31.999L480-511.999l229.077-229.077 31.999 31.999L511.999-480l229.077 229.077-31.999 31.999L480-448.001 250.923-218.924Z');
         btnIcon_close.setAttribute('viewBox', '0 -960 960 960');
         btnIcon_close.setAttribute('class', 'icon-close');
         btnIcon_close.setAttribute('xmlns', NAMESPACES.svg);
         btnIcon_close.appendChild(svgPath_close);

         svgPath_nosave.setAttribute('d', 'M791-55 686-160H240q-33 0-56.5-23.5T160-240v-120h80v120h366L503-343l-23 23-200-200 23-23L55-791l57-57 736 736-57 57ZM617-457l-57-57 64-64 56 58-63 63Zm-97-97-80-80v-166h80v246Zm280 280-80-80v-6h80v86Z');
         btnIcon_nosave.setAttribute('viewBox', '0 -960 960 960');
         btnIcon_nosave.setAttribute('class', 'icon-nosave');
         btnIcon_nosave.setAttribute('xmlns', NAMESPACES.svg);
         btnIcon_nosave.appendChild(svgPath_nosave);

         closeBtn.setAttribute('id', `ETB-${id}`); // editor tab button
         closeBtn.addEventListener('click', EditorUI.onEditorTabCloseBtn_click);
         closeBtn.appendChild(btnIcon_close);
         closeBtn.appendChild(btnIcon_nosave);

         node.setAttribute('id', `ET-${id}`); // Editor Tab
         node.setAttribute('class', `editor-tab deselected${content?' saved':' nosaved'}`);
         node.appendChild(
            document.createTextNode(to.strLimit(documentName, 14))
         );
         node.appendChild(closeBtn);
         return node;
      }

      /**create all elements to made up an editor area;
       * editor area is separated to two main parts
       * **1. display area**: this is a normal `div` element hence user can't
       * directly interact with it, this element is also the only visible part
       * of the editor area
       * **2. interactive area (textarea)**: this element user can directly interact with,
       * but it's **invisible** to the user and need JS to manually copy content here to the
       * *display area* so user can actually see what they're doing
       * @example
       * // editor (area) structure
       * <li class="editor">
            <div class="backdrop">
               <div class="display-area"></div>
            </div>
            <textarea class="interactive-area"></textarea>
         </li>
       */
      function createEditorElements(){
         const editor = document.createElement("li");
         const backdrop = document.createElement("div");
         const display = document.createElement("div");
         const textarea = document.createElement("textarea");

         textarea.addEventListener('input', EditorUI.handleTextarea_change);
         textarea.addEventListener('scroll', EditorUI.handleTextarea_scroll);
         textarea.addEventListener('wheel', EditorUI.handleTextarea_wheelTick);
         textarea.addEventListener('keydown', function (ev){
            if(ev.key == 'Tab'){
               handleTextarea_TabKeyPressed(ev, this);
               EditorUI.handleTextarea_change(ev);
            }
         });

         textarea.setAttribute('id', `EIA-${id}`); // editor interactive area
         textarea.classList.add('interactive-area');
         if(content) textarea.value = content;
         textarea.readOnly = readonly;

         display.setAttribute('id', `EDA-${id}`);
         if(content) display.innerHTML = HTMLFix.applyTo(content);
         display.classList.add('display-area');

         backdrop.setAttribute('id', `EBD-${id}`);
         backdrop.classList.add('backdrop');
         backdrop.appendChild(display);

         editor.classList.add('editor');
         editor.setAttribute('id', `E-${id}`);
         editor.appendChild(backdrop);
         editor.appendChild(textarea);

         return {
            editor,
            backdrop,
            display,
            textarea
         }
      }
   },

   /**
    * @param {EditorPackage|string} editor EditorPackage or editor ID
    * @param {string} title
    */
   setEditorTitle(editor, title){
      if(typeof editor == 'string'){
         editor = EditorUI.getEditorWithID(editor);
      }

      editor.tabElement.childNodes[0].nodeValue = to.strLimit(title, 14);
   },

   /**
    * @param {EditorPackage} editorPack
    */
   getEditorTitle(editorPack){
      return editorPack.tabElement.childNodes[0].nodeValue;
   },

   destroyEditorUI(id){;
      const editor = EditorUI.getEditorWithID(id);
      if(!editor){
         console.warn(`can't find editor with id: `, id);
         return;
      }

      editor.editorArea.remove();
      editor.tabElement.remove();
      this.editors.delete(id);

      EditorUI.setActiveEditor(-1);
      EditorUI.update();
   },

   /**return id of the Active editor,
    * `null` if no editor is active
    */
   getActiveEditorID(){
      for(const [id, editor] of this.editors){
         if(editor.tabElement.classList.contains('selected')) return id;
      }
      return null;
   },

   /**return object with `id` and `EditorPackage`
    * `null` if no editor is active
    * @returns {{id:string, editor:EditorPackage}}
    */
   getActiveEditor(){
      for(const [id, editor] of this.editors){
         if(editor.tabElement.classList.contains('selected')) return { id, editor };
      }
      return null;
   },

   setEditorSaveStatus(id, isSaved){
      const editor = EditorUI.getEditorWithID(id);
      if(!editor){
         console.warn('cant find editor with id ' + id);
         return;
      }

      const tabClasses = editor.tabElement.classList;
      if(isSaved){
         if(tabClasses.contains('nosaved'))
            tabClasses.replace('nosaved', 'saved');
      }else{
         if(tabClasses.contains('saved'))
            tabClasses.replace('saved', 'nosaved');
      }
   },

   /**copy selected content in side the given EditorPackage
    * @param {EditorPackage} editor
    * @returns {number[]} the copied selection
    */
   copySelectedContentToClipboard(editor){
      let selectedContent, selection;
      const textarea = editor.textAreaElement;

      if(textarea.selectionStart == textarea.selectionEnd){
         const [ lStr, rStr ] = [
            textarea.value.slice(0, textarea.selectionStart),
            textarea.value.slice(textarea.selectionEnd)
         ];

         // if lastIndexOf() couldn't find any '\n' will return -1 and startIndex will automatically be 0
         // this could happen when user place caret in the first line
         const startIndex = lStr.lastIndexOf('\n') + 1;

         let endIndex = rStr.indexOf('\n');
         if(endIndex == -1) endIndex = textarea.value.length;
         else endIndex += lStr.length;

         selection = [startIndex, endIndex];
         selectedContent = textarea.value.slice(startIndex, endIndex) + '\n';

      }else{
         selectedContent = textarea.value.slice(
            textarea.selectionStart, textarea.selectionEnd
         );
         selection = [
            textarea.selectionStart, textarea.selectionEnd
         ];
      }

      navigator.clipboard.writeText(selectedContent);
      return selection;
   },


   /**insert text content to the Selected section in the editor
    * @param {EditorPackage} editor
    * @param {string} text
    */
   insertContent(text, editor){
      const textarea = editor.textAreaElement;
      textarea.value = textarea.value.slice(0, textarea.selectionStart) +
         text + textarea.value.slice(textarea.selectionEnd);
      EditorUI.handleTextarea_change(editor);
   },
}









const PromptUI = {
   defaultValue: null,

   setActive(active = true){
      document.getElementById('prompt').hidden = !active;
      const input = document.getElementById('prompt-input');
      input.value = '';
      input.focus();
   },


   insertDefault(){
      if(!PromptUI.defaultValue) return;
      /**
       * @type {HTMLInputElement}
      */
      const input = document.getElementById('prompt-input');
      input.value = PromptUI.defaultValue;
      input.select();

      PromptUI.defaultValue = null;
   },


   /**show a prompt asking user and return what user has entered
    * @param {string} msg placeholder message
    * @param {string} defaultValue
    * @returns {Promise<string|null>}
    */
   async prompt(msg, defaultValue = null){
      return new Promise((resolve, reject) => {
         /**
          * @type {HTMLInputElement}
          */
         const input = document.getElementById('prompt-input');

         input.placeholder = msg;
         PromptUI.defaultValue = defaultValue;
         PromptUI.setActive();

         /**
          * @param {KeyboardEvent} ev
          */
         function waitForRespond(ev){
            let value = null;
            if(ev?.key == 'Escape');
            else if(ev?.key == 'Enter')
               value = input.value;
            else {
               // ev.preventDefault();
               // setTimeout is necessarily otherwise keyboard input would override `defaultValue`
               if(PromptUI.defaultValue)
                  setTimeout(PromptUI.insertDefault, 0);

               return;
            }


            input.removeEventListener('keydown', waitForRespond);
            PromptUI.setActive(false);
            resolve(value);
         };

         input.addEventListener('keydown', waitForRespond);
         onceClickOutside(
            document.getElementById('prompt'),
            waitForRespond
         );
      });
   }
}








const FindpanelUI = {
   expandBtn: document.getElementById('findpanel-expand-btn'),
   replaceMenu: document.getElementById('findpanel-replace'),
   /**
    * @type {HTMLInputElement}
    */
   findInput: document.getElementById('findpanel-find-input'),
   /**
    * @type {HTMLInputElement}
    */
   replaceInput: document.getElementById('findpanel-replace-input'),
   resultCounter: document.getElementById('findpanel-resultcount'),
   /**
    * @type {FindOption}
    */
   findOption: new FindOption(),
   isActive: false,

   toggleShow(){
      let { editor, id } = EditorUI.getActiveEditor();
      if(editor){
         editor.editorArea.classList.toggle('findactive');
      }

      // when Showing the Findpanel
      if(FindpanelUI.isActive = !FindpanelUI.isActive){
         FindpanelUI.findInput.focus();
         FindpanelUI.updateFindnReplace('update');
         if(editor)
            editor.editorArea.classList.add('findactive');

      }else if(editor){
         editor.editorArea.classList.remove('findactive');
         let effect = EditorUI.EffectBase.get(id);
         if(effect){
            effect = effect.filter(e => e.tag != 'find');
            EditorUI.EffectBase.set(id, effect);
            EditorUI.updateEditorDisplay(id);
         }
      }

      document.getElementById('findpanel').hidden = !FindpanelUI.isActive;
   },

   setupEventListeners(){
      this.expandBtn.addEventListener('click', this.handleExpandBtn_click);
      this.findInput.addEventListener('focusin', this.handleInputFields_focusin);
      this.replaceInput.addEventListener('focusin', this.handleInputFields_focusin);
      this.findInput.addEventListener('focusout', this.handleInputFields_focusout);
      this.replaceInput.addEventListener('focusout', this.handleInputFields_focusout);
      this.findInput.addEventListener('input', this.handleFindFields_input);
      this.replaceInput.addEventListener('input', this.handleReplaceFields_input);

      document.getElementById('findpanel-matchcase-btn')
         .addEventListener('click', this.handleMatchCaseBtn_click);
      document.getElementById('findpanel-matchword-btn')
         .addEventListener('click', this.handleMatchWordBtn_click);
      document.getElementById('findpanel-useregex-btn')
         .addEventListener('click', this.handleUseRegexBtn_click);
      document.getElementById('findpanel-matchinselected-btn')
         .addEventListener('click', this.handleMatchSelectedBtn_click);
      document.getElementById('findpanel-preservecase-btn')
         .addEventListener('click', this.handlePreserveCaseBtn_click);
      document.getElementById('findpanel-next-btn')
         .addEventListener('click', this.handleFindNextBtn_click);
      document.getElementById('findpanel-previous-btn')
         .addEventListener('click', this.handleFindPreviousBtn_click);
      document.getElementById('findpanel-close-btn')
         .addEventListener('click', this.handleCloseBtn_click);
      document.getElementById('findpanel-replace-btn')
         .addEventListener('click', this.handleReplaceBtn_click);
      document.getElementById('findpanel-replaceall-btn')
         .addEventListener('click', this.handleReplaceAllBtn_click);
   },


   handleExpandBtn_click(){
      const isExpanded = FindpanelUI.expandBtn.classList.toggle('expanded');
      FindpanelUI.replaceMenu.hidden = !isExpanded;
      FindpanelUI.findOption.withReplace = isExpanded;

      if(isExpanded){
         FindpanelUI.expandBtn.title = "Hide Replace Option";
      }else FindpanelUI.expandBtn.title = "Show Replace Option";
   },

   handleMatchCaseBtn_click(){
      FindpanelUI.findOption.matchCase = this.classList.toggle('selected');
      FindpanelUI.updateFindnReplace('update');
   },

   handleMatchWordBtn_click(){
      FindpanelUI.findOption.matchWholeWord = this.classList.toggle('selected');
      FindpanelUI.updateFindnReplace('update');
   },

   handleUseRegexBtn_click(){
      FindpanelUI.findOption.useRegex = this.classList.toggle('selected');
      FindpanelUI.updateFindnReplace('update');
   },

   handleMatchSelectedBtn_click(){
      FindpanelUI.findOption.matchSelected = this.classList.toggle('selected');
      FindpanelUI.updateFindnReplace('update');
   },

   handlePreserveCaseBtn_click(){
      FindpanelUI.findOption.preserveCase = this.classList.toggle('selected');
   },

   handleFindNextBtn_click(){
      FindpanelUI.updateFindnReplace('findnext');
   },

   handleFindPreviousBtn_click(){
      FindpanelUI.updateFindnReplace('findprevious');
   },

   handleCloseBtn_click(){
      if(FindpanelUI.findOption.action != 'close') FindpanelUI.findOption.action = 'close';

      if(!EditorUI.getActiveEditorID()) return;
      FindpanelUI.toggleShow();
   },

   handleReplaceBtn_click(){
      FindpanelUI.updateFindnReplace('replace');
   },

   handleReplaceAllBtn_click(){
      FindpanelUI.updateFindnReplace('replaceall');
   },

   handleInputFields_focusin(){
      this.classList.add('selected');
   },

   handleInputFields_focusout(){
      this.classList.remove('selected');
   },

   handleFindFields_input(ev){
      FindpanelUI.findOption.findStr = FindpanelUI.findInput.value;
      FindpanelUI.updateFindnReplace('update');
   },

   handleReplaceFields_input(ev){
      FindpanelUI.findOption.replaceStr = FindpanelUI.replaceInput.value;
   },

   /**send Find n Replace information
    * along with currently active Editor ID
    * for Core to process as well as handle some update operation
    * that doesn't need much work by itself
    * @param {'close'|'update'|'textupdate'|'findnext'|'findprevious'|'replace'|'replaceall'} actionType
    */
   updateFindnReplace(actionType = null){
      if(actionType&&this.findOption.action != actionType)
         this.findOption.action = actionType;
      // if findStr is undefined means user just open a blank findpanel
      // and there are nothing in the find input element
      if(this.findOption.findStr === undefined) return;


      const { id, editor } = EditorUI.getActiveEditor();
      if(!id){
         console.warn('can\'t find editor with id ' + id);
         return;
      }

      // if the `length` is 0 means user just clear the find input element
      if(!this.findOption.findStr.length){
         EditorUI.EffectBase.set(id,
            EditorUI.EffectBase.get(id).filter(e => e.tag != 'find')
         );
         EditorUI.updateEditorDisplay(id);
         FindpanelUI.updateResultCount();
         return;
      }

      this.findOption.selection = [
         editor.textAreaElement.selectionStart, editor.textAreaElement.selectionEnd
      ];
      window.coreAPI.sendFindnReplaceUpdate(id, this.findOption);
   },


   updateResultCount(){
      const id = EditorUI.getActiveEditorID();
      if(!id){
         console.warn('can\'t find editor with id ' + id);
         return;
      }

      let effectCount = 0;
      for(const e of EditorUI.EffectBase.get(id)){
         if(e.tag != 'find') continue;
         effectCount += e.positions.length;
      }

      this.resultCounter.textContent = `${effectCount} found`;
   }

}









const ActionmenuUI = {
   Common: {
      /**
       * @type {CustomSelect}
       */
      fontFamilySelect: null,
      /**
       * @type {CustomSelect}
       */
      letterSpacingSelect: null,
      /**
       * @type {CustomSelect}
       */
      lineSpacingSelect: null,
      /**
       * @type {CustomSelect}
       */
      encodingSelect: null,
      /**
       * @type {HTMLDivElement}
       */
      fontPreview: null,
      /**
       * @type {HTMLDivElement}
       */
      lineWrapToggle: null
   },

   /**the Actionmenu element
    * @type {HTMLUListElement}
    */
   actionmenuElement: null,

   valueMap: {
      lineSpacingSelect: [
         ['LS-tight', 1.4],
         ['LS-compact', 2.1],
         ['LS-normal', 2.23],
         ['LS-microspread', 2.75],
         ['LS-spread', 3.18],
         ['LS-neighborhood', 3.5],
         ['LS-solarsystem', 4]
      ],
      letterSpacingSelect: [
         ['LTS-tight', -0.12],
         ['LTS-compact', -0.068, '-68m'],
         ['LTS-normal', 0.035, '35m'],
         ['LTS-microspread', 0.1],
         ['LTS-spread', 0.29],
         ['LTS-neighborhood', 0.42],
         ['LTS-solarsystem', 0.73]
      ],

      /**get valueID from the given value if it match the valueMap
       * record
       * @param {(string | number)[][]} map the value map to get ID from
       * @param {number} value
       */
      getValueIDFromValue(value, map){
         for(const record of map){
            if(record[1] == value) return record[0];
         }
         return null;
      },

      /**get record ([valueID, value, alias]) from the given valueID if it match the valueMap
       * record
       * @param {(string | number)[][]} map the value map to get ID from
       * @param {number} valueID
       */
      getRecordFromValueID(valueID, map){
         for(const record of map){
            if(record[0] == valueID) return record;
         }
         return null;
      }
   },

   fetchFontlistInterval: null,
   isReady: false,
   /**TF-IDF map for fontlist
    */
   fonts_TFIDFMap: null,
   /**indicated that mouse is currently on the Actionmenu or not
    */
   isMouseHover: false,
   /**
    * @type {Timer}
    */
   expandTimer: null,
   retractDelay: 500,
   isExplanded: false,

   init(){
      this.Common.fontFamilySelect = new CustomSelect(
         '.actionmenu > .actionmenu-wrapper > #actionmenu-font-select',
         'CS-font-select', true
      );
      this.Common.fontFamilySelect.on('value_change', this.handleFontSelect_change);
      this.Common.fontFamilySelect.enable = false;
      this.Common.fontFamilySelect.selectedInputElement.value = '';
      this.Common.fontFamilySelect.selectedInputElement.placeholder = 'Loading Fonts';
      this.Common.fontFamilySelect.selectedInputElement.title = 'Looking for installed Fonts Families in your System...';
      this.Common.fontFamilySelect.update();
      this.fetchFontlistInterval = setInterval(window.coreAPI.fetchAvaliableFontlist, 500);


      this.Common.lineSpacingSelect = new CustomSelect(
         '.actionmenu > .actionmenu-wrapper > #actionmenu-line-spacing-select',
         'CS-line-spacing', false
      );
      this.Common.lineSpacingSelect.showSelectedValue = false;
      this.Common.lineSpacingSelect.on('value_change', this.handleLineSpacing_change);


      this.Common.letterSpacingSelect = new CustomSelect(
         '.actionmenu > .actionmenu-wrapper > #actionmenu-letter-spacing-select',
         'CS-letter-spacing', false
      );
      this.Common.letterSpacingSelect.showSelectedValue = false;
      this.Common.letterSpacingSelect.on('value_change', this.handleLetterSpacing_chnge);


      this.Common.encodingSelect = new CustomSelect(
         '.actionmenu > .actionmenu-wrapper > #actionmenu-encoding-select',
         'CS-encoding', false
      );
      this.Common.encodingSelect.on('value_change', this.handleEncodingSelect_change);


      document.querySelector(
         '.actionmenu .actionmenu-wrapper > #actionmenu-font-increase-btn'
      ).addEventListener('click', this.handleIncreaseFontSize_click);

      document.querySelector(
         '.actionmenu .actionmenu-wrapper > #actionmenu-font-decrease-btn'
      ).addEventListener('click', this.handleDecreaseFontSize_click);

      this.Common.lineWrapToggle = document.querySelector(
         '.actionmenu > .actionmenu-wrapper > #actionmenu-toggle-wrap-btn'
      );
      this.Common.lineWrapToggle.addEventListener('click', this.handleLineWrapToggle_click);

      {
         this.actionmenuElement = document.querySelector('body > .actionmenu');
         this.actionmenuElement.addEventListener('mouseenter', this.handleMouseEnter);
         this.actionmenuElement.addEventListener('mouseleave', this.handleMouseLeave);

         const { height } = this.actionmenuElement.getBoundingClientRect();
         this.actionmenuElement.style.transform = `translateY(-${height})`;
         this.isReady = true;
      }

      this.expandTimer = new Timer(500, 'ms');
      ActionbarUI.onMouseEnter(this.triggerExpand);
      ActionbarUI.onMouseLeave(this.triggerRetractWait);
   },


   setLineSpacingDisplay(string){
      document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #line-spacing-display'
      ).innerText = string;
   },

   setLetterSpacingDisplay(string){
      document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #letter-spacing-display'
      ).innerText = string;
   },



   /**handle changed of the selected value
    * @param {string} newValueID
    * @param independentChange whether the change only apply to this element
    */
   handleFontSelect_change: (newValueID, independentChange = true) => {
      const display = document.querySelector(
         '.actionmenu #actionmenu-font-preview text'
      );

      const font = valueIDToFont(newValueID);
      display.style.fontFamily = font;
      if(EditorUI.global.fontFamily != font) EditorUI.global.fontFamily = font;
      if(independentChange) EditorUI.update();
   },


   handleIncreaseFontSize_click(){
      const size = EditorUI.global.fontSize + 1;
      if(size > ALLOWED_FONT_SIZES[1]) return;

      const display = document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #fontsize-display'
      );
      display.innerText = size.toString();

      EditorUI.global.fontSize = size;
      EditorUI.update();
   },

   handleDecreaseFontSize_click(){
      const size = EditorUI.global.fontSize - 1;
      if(size < ALLOWED_FONT_SIZES[0]) return;

      const display = document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #fontsize-display'
      );
      display.innerText = size.toString();

      EditorUI.global.fontSize = size;
      EditorUI.update();
   },

   handleLineWrapToggle_click(){
      const nowActive = ActionmenuUI.Common.lineWrapToggle.classList.toggle('active');
      EditorUI.global.useLineWrap = nowActive;
      EditorUI.update();
   },

   /**handle changed of the selected value
    * @param {string} newValueID
    * @param independentChange whether the change only apply to this element
    */
   handleLineSpacing_change: (newValueID, independentChange = true) => {
      const display = document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #line-spacing-display'
      );

      const [, value] = ActionmenuUI.valueMap.getRecordFromValueID(
         newValueID,
         ActionmenuUI.valueMap.lineSpacingSelect
      )??[];

      if(!value) return;
      display.innerText = value.toString();
      EditorUI.global.lineSpacing = value;
      if(independentChange) EditorUI.update();
   },

   /**handle changed of the selected value
    * @param {string} newValueID
    * @param independentChange whether the change only apply to this element
    */
   handleLetterSpacing_chnge: (newValueID, independentChange = true) => {
      const display = document.querySelector(
         '.actionmenu #actionmenu-font-preview sup #letter-spacing-display'
      );

      const [, value, alias] = ActionmenuUI.valueMap.getRecordFromValueID(
         newValueID,
         ActionmenuUI.valueMap.letterSpacingSelect
      )??[];

      if(!value) return;
      display.innerText = alias?alias: value.toString();
      EditorUI.global.letterSpacing = value;
      if(independentChange) EditorUI.update();
   },

   handleEncodingSelect_change(newValueID){
      EditorUI.global.encoding = newValueID.slice(3);
   },

   handleMouseEnter(){
      if(!ActionmenuUI.isExplanded||!ActionmenuUI.expandTimer) return;
      ActionmenuUI.triggerExpand();
      ActionmenuUI.isMouseHover = true;
   },

   handleMouseLeave(){
      if(!ActionmenuUI.isExplanded||!ActionmenuUI.expandTimer) return;
      ActionmenuUI.isMouseHover = false;
      ActionmenuUI.triggerRetractWait();
   },


   update(){
      const fontID = fontToValueID(EditorUI.global.fontFamily);
      const letterSpcID = this.valueMap.getValueIDFromValue(
         EditorUI.global.letterSpacing,
         this.valueMap.letterSpacingSelect
      );
      const lineSpcID = this.valueMap.getValueIDFromValue(
         EditorUI.global.lineSpacing,
         this.valueMap.lineSpacingSelect
      );
      const encID = 'EC-' + EditorUI.global.encoding;


      if(fontID&&fontID != this.Common.fontFamilySelect.selectedValue){
         this.Common.fontFamilySelect.setSelectedValue(fontID);
         this.handleFontSelect_change(fontID, false);
      }

      if(
         EditorUI.global.letterSpacing != null&&
         letterSpcID != this.Common.letterSpacingSelect.selectedValue
      ){
         if(letterSpcID){
            this.Common.letterSpacingSelect.setSelectedValue(letterSpcID);
            this.handleLetterSpacing_chnge(letterSpcID, false);
         }else this.setLetterSpacingDisplay(EditorUI.global.letterSpacing.toString());
      }

      if(
         EditorUI.global.lineSpacing != null&&
         lineSpcID != this.Common.lineSpacingSelect.selectedValue
      ){
         if(lineSpcID){
            this.Common.lineSpacingSelect.setSelectedValue(lineSpcID);
            this.handleLineSpacing_change(lineSpcID, false);
         }else this.setLineSpacingDisplay(EditorUI.global.lineSpacing.toString());
      }

      if(EditorUI.global.encoding&&encID != this.Common.encodingSelect.selectedValue){
         this.Common.encodingSelect.setSelectedValue(encID);
         this.handleEncodingSelect_change(encID);
      }


      if(EditorUI.global.useLineWrap)
         this.Common.lineWrapToggle.classList.add('active');
      else this.Common.lineWrapToggle.classList.remove('active');


      {// update displayed fontsize
         const display = document.querySelector(
            '.actionmenu #actionmenu-font-preview sup #fontsize-display'
         );
         display.innerText = EditorUI.global.fontSize.toString();
      }
      EditorUI.update();
   },


   updateFontlist(fontList){
      queueMicrotask(() => {
         // calculating TF-IDF is quite resources hungry
         this.fonts_TFIDFMap = to.DataScienceKit.TFIDF_of(
            fontList.map(fontName => fontName.replace(/"/g, '').split(/\s/g))
         );
      });

      const select = this.Common.fontFamilySelect;
      if(this.fetchFontlistInterval){
         clearInterval(this.fetchFontlistInterval);
         this.fetchFontlistInterval = null;
         select.enable = true;
      }

      this.Common.fontFamilySelect.selectedInputElement.title = 'Select Font Family';

      select.clearOptions();
      for(const fontName of fontList){
         const v_id = fontToValueID(fontName);
         const option = CustomSelect.createOptionElement(
            v_id,
            select.name,
            fontName.includes('"')? fontName.slice(1, -1):fontName
         );

         option.children[1].style.fontFamily = fontName;
         select.addOption(v_id, option);
      }

      select.update();
   },



   triggerExpand(){
      ActionmenuUI.actionmenuElement.hidden = false;
      gsap.to('body > .actionmenu', {
         translateY: 0, duration: .22
      });
      ActionmenuUI.isExplanded = true;
      if(ActionmenuUI.expandTimer.isRunning){
         ActionmenuUI.expandTimer.stop().reset();
      }
   },


   triggerRetractWait(){
      if(!ActionmenuUI.isExplanded) return;

      ActionmenuUI.expandTimer.start()
         .onceEnd(ActionmenuUI.triggerRetract);
   },


   triggerRetract(){
      const { height } = ActionmenuUI.actionmenuElement.getBoundingClientRect();
      gsap.to('body > .actionmenu', {
         translateY: -height, duration: .2,
         onComplete() {
            ActionmenuUI.actionmenuElement.hidden = true;
         }
      });
      ActionmenuUI.expandTimer.reset();
      ActionmenuUI.isExplanded = false;
      ActionmenuUI.isMouseHover = false;

      ActionmenuUI.Common.fontFamilySelect.closeDropdown();
      ActionmenuUI.Common.letterSpacingSelect.closeDropdown();
      ActionmenuUI.Common.lineSpacingSelect.closeDropdown();
      ActionmenuUI.Common.encodingSelect.closeDropdown();
   }
}




const ActionbarUI = {
   /**
    * @type {HTMLDivElement}
    */
   wrapperElement: null,
   onMouseEnterCallback: null,
   onMouseLeaveCallback: null,



   init(){
      this.wrapperElement = document.querySelector('.menubar > .actionbar');

      this.wrapperElement.addEventListener('mouseenter',
         this.handleMouseEnter
      );
      this.wrapperElement.addEventListener('mouseleave',
         this.handleMouseLeave
      );
   },

   /**
    * @param {Function} callback
    */
   onMouseEnter(callback){
      this.onMouseEnterCallback = callback;
   },

   onMouseLeave(callback){
      this.onMouseLeaveCallback = callback;
   },

   handleMouseEnter: () => {
      if(ActionbarUI.onMouseEnterCallback) ActionbarUI.onMouseEnterCallback();
   },


   handleMouseLeave: () => {
      if(ActionbarUI.onMouseLeaveCallback) ActionbarUI.onMouseLeaveCallback();
   }
}




/**because using -webkit-app-region would disable all element's
 * MouseEvent, we have to manually make it draggable
 * https://github.com/electron/electron/issues/1354
 */
const DraggableWindow = {
   moveWindowInterval: null,

   init(){
      // element that will be the draggable part of window
      document.querySelector('.menubar > .actionbar')
         .addEventListener('mousedown', this.onMouseDown);
   },

   onMouseDown(e) {
      document.addEventListener('mouseup', DraggableWindow.onMouseUp);
      window.coreAPI.sendUserDragWindowStart(
         e.clientX,
         e.clientY
      );
      DraggableWindow.moveWindowInterval = setInterval(DraggableWindow.moveWindow, 8);
   },

   onMouseUp(e) {
      document.removeEventListener('mouseup', DraggableWindow.onMouseUp);
      clearInterval(DraggableWindow.moveWindowInterval);
   },

   moveWindow() {
      window.coreAPI.sendUserDragWindow();
   },
}



function init(){
   // window control
   addListenerByClass('btn_close-app', 'click', btn_closeApp_click);
   document.getElementById("btn-maximize_toggle").addEventListener("click", togglebtn_maximizeApp_click);
   document.getElementById("btn-minimize").addEventListener("click", btn_minimizeApp_click);

   // menubar
   addListenerByClass('menubar-btn', 'click', menubarBtn_click);
   addListenerByClass('menubar-btn', 'mouseenter', menubarBtn_mouseenter);
   const menubarWrapper = document.getElementsByClassName('menubar-wrapper');
   for(const wrapper of [...menubarWrapper]){
      hideOnClickOutside(
         getChildWithClassName('menubar-btn', wrapper)[0],
         getChildWithClassName('dropdown-menu', wrapper)[0]
      );
   }

   // prompt
   document.addEventListener('click', PromptUI.insertDefault);


   // menubar file
   addListenerByClass('btn_new-file', 'click', btn_newFile_click);
   addListenerByClass('btn_new-file-window', 'click', btn_newFileInNewWindow_click);
   addListenerByClass('btn_open-file', 'click', btn_openFile_click);
   addListenerByClass('btn_rename-file', 'click', btn_renameFile_click);
   addListenerByClass('btn_save-file', 'click', btn_saveFile_click);
   addListenerByClass('btn_save-file-as', 'click', btn_saveFileAs_click);

   // menubar edit
   addListenerByClass('btn_undo', 'click', btn_undo_click);
   addListenerByClass('btn_redo', 'click', btn_redo_click);
   addListenerByClass('btn_cut', 'click', btn_cut_click);
   addListenerByClass('btn_copy', 'click', btn_copy_click);
   addListenerByClass('btn_paste', 'click', btn_paste_click);
   addListenerByClass('btn_find-replace', 'click', btn_findReplace_click);
   addListenerByClass('btn_insert', 'click', btn_insert_click);
   addListenerByClass('btn_edit-preferences', 'click', btn_editPreferences_click);


   FindpanelUI.setupEventListeners();
   ActionbarUI.init();
   ActionmenuUI.init();
   DraggableWindow.init();


   // KeyboardEvents
   onkeydown = onkeyup = KeyboardManager.handleKeyPress;

   KeyboardManager.catch(KeyBindings.get('undo'), btn_undo_click);
   KeyboardManager.catch(KeyBindings.get('redo'), btn_redo_click);
   KeyboardManager.catch(KeyBindings.get('find'), btn_findReplace_click);
   KeyboardManager.catch(KeyBindings.get('openfile'), btn_openFile_click);
   KeyboardManager.catch(KeyBindings.get('closeapp'), btn_closeApp_click);
   KeyboardManager.catch(KeyBindings.get('savefile'), btn_saveFile_click);
   KeyboardManager.catch(KeyBindings.get('savefileas'), btn_saveFileAs_click);
   KeyboardManager.catch(KeyBindings.get('rename'), btn_renameFile_click);
   KeyboardManager.catch(KeyBindings.get('editorzoomin'), btn_editorZoomIn_click);
   KeyboardManager.catch(KeyBindings.get('editorzoomout'), btn_editorZoomOut_click);
}




window.coreAPI.handleCreateEditorUI((eEvent, docName, id, content, readonly) => {
   EditorUI.appendNewEditor(docName, id, content, readonly);
});

window.coreAPI.handleSetActiveEditorUI((eEvent, id) => {
   EditorUI.setActiveEditor(id);
});

window.coreAPI.handleDestroyEditorUI((eEvent, id) => {
   EditorUI.destroyEditorUI(id);
});

window.coreAPI.handleSetEditorTabName((eEvent, id, tabName) => {
   EditorUI.setEditorTitle(id, tabName);
});

window.coreAPI.handleUpdateEditorSaveStatus((eEvent, id, isSaved) => {
   EditorUI.setEditorSaveStatus(id, isSaved);
});

window.coreAPI.handleUpdateEditorContent((eEvent, id, content, selection) => {
   EditorUI.setEditorContent(id, content, selection);
});

window.coreAPI.handleUpdateEditorEffects((eEvent, id, newEffects) => {
   let effect = EditorUI.EffectBase.get(id);
   if(!effect) effect = [];
   else effect = effect.filter(e => e.tag != 'find');

   if(newEffects){
      for(const newE of newEffects){
         effect.push(
            EditorEffect.reconstructor(newE)
         );
      }
   }

   EditorUI.EffectBase.set(id, effect);
   EditorUI.updateEditorDisplay(id);
   FindpanelUI.updateResultCount();
});

window.coreAPI.handleUpdateAvaliableFontlist((eEvent, fontList) => {
   setZeroTimeout(
      () => ActionmenuUI.updateFontlist(fontList), 0
   );
});

window.coreAPI.handleUpdateEditorState((eEvent, state) => {
   EditorUI.global.fontFamily = state.fontFamily;
   EditorUI.global.fontSize = state.fontSize;
   EditorUI.global.encoding = state.encoding;
   EditorUI.global.lineSpacing = state.lineSpacing;
   EditorUI.global.letterSpacing = state.letterSpacing;
   EditorUI.global.useLineWrap = state.useLineWrap;

   if(ActionmenuUI.isReady)
      ActionmenuUI.update();
   else{
      if(actionmenuUIWaitInterval){
         sendConsoleOutput(
            'Actionmenu wait interval set twice in a row, the old interval will be cleared',
            'warn', 'UIHandler'
         );
         clearInterval(actionmenuUIWaitInterval);
      }

      actionmenuUIWaitInterval = setInterval(() => {
         console.log(`wait update state`);
         if(!ActionmenuUI.isReady) return;
         ActionmenuUI.update();

         clearInterval(actionmenuUIWaitInterval);
         actionmenuUIWaitInterval = null;
      }, 10);
   }
});


window.coreAPI.handleFetchUIState(() => {
   window.coreAPI.sendRespondUIState({
      editor: {
         encoding: EditorUI.global.encoding,
         fontFamily: EditorUI.global.fontFamily,
         fontSize: EditorUI.global.fontSize,
         letterSpacing: EditorUI.global.letterSpacing,
         lineSpacing: EditorUI.global.lineSpacing,
         useLineWrap: EditorUI.global.useLineWrap
      }
   });
});



init();
console.log(`UIHandler loaded`);
