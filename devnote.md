### Sybols
- **x**: done & tested
- **?**: done (not tested)
- **✔**: tested & stable
- **!**: pending for fix/changes
- **I(n)**: to be improved (see Improvements)



## Problems
- [x] **find didn't work** prob. somethings wrong with `find.ts: findAndReplaceText()`
- [x] **undo when replace text not working properly** Fix?: need to marge last history with unsaved history before replacing
- [x] **Actionmenu font search not working correctly** fix Tools.search()
- [x] **loading fonts tooltip (title) didn't go away after finish loading**
- [ ] **window flicker when moved quickly**
- [ ] **thread got blocked for a second after finish loading fontlist**
- [x] **saving Editor state not working**
- [x] **actionmenu won't open when there're active editors**
- [x] **line wrap btn not working**
- [x] **restore editor state not working**



## TODO
- [x] update when open
- [x] update his before replace
- [x] find in selected
- [x] preserves case
- [I1] add more scroll space when Findpanel is active
- [x] overwrite normal copy paste cut behavior
- [?] sync font size across all editors
- [x] changing editor font size var keybinds
- [x] add action panel
- [ ] add setting (Preferences)
- [!] add themes
- [ ] implement insert command
- [ ] implement open in new command
- [?] add log files
- [ ] implement writing of config file
- [x] implement editor state
- [x] reorganize items in the CustomSelect's dropdown menu back to its original order
      after its `selectedInputElement.value` is empty
- [ ] update effect when undo
- [!] optimize saving of opened Editor,
      trim unnecessary properties from the object (id, last\*\*, hasUI, history, timeline\*pos)
      and only save editor content when `filePath` is `null`
- [!] encrypt editor content when writing to `state.json`
- [!] use a custom function to get the correct char when pressing `Shift`
      insead of using `string.toUpperCase()` in `Tools.KeyBind`
      (a -> A, 5 -> %, = -> +)




## Improvements
- [ ] **I1**: add animation when Findpanel closed
- [ ] make `getNativeFontFamily()` more flexible
- [ ] reduce input delay when typing





