### Sybols
- **x**: done & tested
- **?**: done (not tested)
- **✔**: tested & stable
- **!**: required fix/changes as soon as one busy man can dream of... >m<
- **I(n)**: done & tested but there are something to be improved (see Improvements)
- **q**: quick fix & tested (not a good way to fix things but if it works it works)



## Problems
- [x] **find didn't work** prob. somethings wrong with `find.ts: findAndReplaceText()`
- [x] **undo when replace text not working properly** Fix?: need to marge last history with unsaved history before replacing
- [x] **Actionmenu font search not working correctly** fix Tools.search()
- [x] **loading fonts tooltip (title) didn't go away after finish loading**
- [ ] **window flicker when moved quickly (on some device)**
- [ ] **thread got blocked for a second after finish loading fontlist**
- [x] **saving Editor state not working**
- [x] **actionmenu won't open when there're active editors**
- [x] **line wrap btn not working**
- [x] **restore editor state not working**
- [!] **editor is saved icon not working properly**
- [x] **the build app won't start**
      the suspect is `deferLoadDependencies()` other then that, I have NO idea T.T
      before [this commit](https://github.com/Type-Delta/Vitrum/commit/479fad3fb0a142393ba6136f1fed47ff3a92ab45) works
- [!] **when insert tab display area and interactive area not properly synced**
- [!] **actionmenu control not working properly**
- [ ] **some opened editors didn't save to state.json**
- [x] (#dm4k1) **displayarea f\**ked up... when displaying:** (different display area and interactive area scroll length?)
      ```js
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
      ```
      (edit) May also caused by display area having textwrap but interactive area didn't
- [!] **saving file and path not working properly**
- [!] **tab key doesn't work**
- [x] **OpenFile content not loaded**
- [!] **Fontloader sometimes picked up some trash**
- [!] **Replace ALL broke**
- [x] **scrollbar bug**
- [x] **typing single space at start doesn't produce any result in display area** could caused by how HTLM renders SPACE
- [ ] **when undo changes the cusor position will be set to one step older cusor position**
- [!] **when insert a NEWLINE char, sometimes will scroll down making the cusor sit on the top most visible line**
- [ ] **when placing long text, the program freeze for a bit**
- [!] **the program failed to restore it's last state**: have it saved it's state?, if so can it restore them?
- [q] **when scrolling to the very bottom: Editor's display and interactive area became out of sync**
      related to *#dm4k1*
      the cause is from the two element has a different `scrollHeight`.
      quick fixed by adding 2em more of bottom padding to the display area (@md3ia)
      this make their's `scrollHeight` close to the same
- [x] **zooming in (make font larger) too much make Editor's display and interactive area became out of sync**
      the display has somehow shift some line down while interactive doesn't?
      have someting to with text wrap of the display area?
      **Fixed:** turns out `<pre>` and `<code>` has `white-space: pre-wrap;` inside.
- [ ] **Ctrl key stuck after opening DevConsole**
- [ ] **when use tab insert it doesn't trigger History change**



## TODO
- [x] update when open
- [x] update his before replace
- [x] find in selected
- [x] preserves case
- [I1] add more scroll space when Findpanel is active
- [x] overwrite normal copy paste cut behavior
- [x] sync font size across all editors
- [x] changing editor font size var keybinds
- [x] add action panel
- [ ] add setting (Preferences)
- [x] add themes
- [ ] implement insert command
- [ ] implement open in new command
- [x] add log files
- [ ] implement writing of config file
- [x] implement editor state
- [x] reorganize items in the CustomSelect's dropdown menu back to its original order
      after its `selectedInputElement.value` is empty
- [ ] update effect when undo
- [?] optimize saving of opened Editor,
      trim unnecessary properties from the object (id, last\*\*, hasUI, history, timeline\*pos)
      and only save editor content when `filePath` is `null`
- [ ] encrypt editor content when writing to `state.json`
- [!] use a custom function to get the correct char when pressing `Shift`
      insead of using `string.toUpperCase()` in `Tools.KeyBind`
      (a -> A, 5 -> %, = -> +)
- [!] support for multiple window single instance
- [!] optimize startup and close time
      https://blog.inkdrop.app/how-to-make-your-electron-app-launch-1000ms-faster-32ce1e0bb52c
- [ ] auto bracket
- [!] add tab by insert SPACE not TAB char






## Improvements
- [ ] **I1**: add animation when Findpanel closed
- [ ] make `getNativeFontFamily()` more flexible
- [ ] reduce input delay when typing
- [x] add a bit more of padding on the left side of the Editor area





