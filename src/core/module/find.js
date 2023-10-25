"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**Fine and Replace Module
 * for Find and Replace element
 */ ;
const Tools_1 = require("../../helper/Tools");
const mainWindow_Class_1 = require("../../UI/handler/mainWindow.Class");
// to compile: tsc ./src/module/find.ts --target esnext --module commonjs
class FindnReplace {
    _selectedIndex = 0;
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(v) {
        if (v < 0)
            return;
        this._selectedIndex = v;
    }
    /**find and create EditorEffects base on the match result
     */
    findAndCreateEffects(content, option) {
        const selectedEffect = new mainWindow_Class_1.EditorEffect('selected-highlight', 'find');
        const effect = new mainWindow_Class_1.EditorEffect('highlight', 'find');
        const matchs = this.findAndMatchAll(content, option);
        for (const match of matchs) {
            if (match.isSelected) {
                selectedEffect.positions.push([
                    match.start, match.end
                ]);
                continue;
            }
            effect.positions.push([
                match.start, match.end
            ]);
        }
        if (!selectedEffect.positions.length)
            return null;
        if (!effect.positions.length) {
            return [selectedEffect];
        }
        else
            return [
                selectedEffect,
                effect
            ];
    }
    findAndMatchAll(content, option) {
        const reg = new RegExp(option.useRegex ? option.findStr : (0, Tools_1.escapeRegExp)(option.findStr), option.matchCase ? 'g' : 'ig');
        let useSelection = option.matchSelected && option.selection[0] != option.selection[1];
        let offset = 0, _content;
        if (useSelection) {
            _content = content.slice(option.selection[0], option.selection[1]);
            offset = option.selection[0];
        }
        else
            _content = content;
        const results = (0, Tools_1.getMatchAllResults)(_content.matchAll(reg));
        if (this._selectedIndex >= results.length)
            this._selectedIndex = results.length - 1;
        let resIndex = 0, res = [];
        for (const match of results) {
            if (option.matchWholeWord && !isMatchWholeWord(match, _content))
                continue;
            res.push(new FindnReplaceMatch(match.start + offset, match.end + offset, match.value, (resIndex++ == this._selectedIndex)));
        }
        return res;
    }
    findAndReplaceText(content, option, replaceAll) {
        if (replaceAll === undefined)
            replaceAll = option.action == 'replaceall';
        let _content = content + '';
        const matchs = this.findAndMatchAll(content, option);
        let offset = 0, oldLength;
        for (const match of matchs) {
            if (!replaceAll) {
                if (match.isSelected) {
                    return (0, Tools_1.strSplice)(_content, match.start, match.value.length, getReplaceStr(match.value));
                }
                continue;
            }
            _content = (0, Tools_1.strSplice)(_content, match.start + offset, match.value.length, getReplaceStr(match.value));
            offset += option.replaceStr.length - match.value.length;
        }
        return _content;
        /**get replacement string based on the `option`
         */
        function getReplaceStr(matchV) {
            if (!option.preserveCase)
                return option.replaceStr;
            const { allUpperCase, upperCasePos } = extractCase(matchV);
            if (allUpperCase)
                return option.replaceStr.toUpperCase();
            // map casing
            let mapedStrArr = [...option.replaceStr];
            for (const p of upperCasePos) {
                mapedStrArr[p] = option.replaceStr[p].toUpperCase();
            }
            return mapedStrArr.join('');
        }
    }
}
const FR = new FindnReplace();
exports.default = FR;
class FindnReplaceMatch {
    start;
    end;
    value;
    isSelected;
    constructor(start, end, value, isSelected) {
        this.start = start;
        this.end = end;
        this.value = value;
        this.isSelected = isSelected;
    }
}
function isMatchWholeWord(match, content) {
    const frontIsWordBegin = match.start > 0 ?
        /\W/.test(content[match.start - 1]) : true;
    const backIsWordEnd = match.end < content.length ?
        /\W/.test(content[match.end]) : true;
    return frontIsWordBegin && backIsWordEnd;
}
/**extract casing style from the given string
 */
function extractCase(str) {
    let res = {
        upperCasePos: [],
        allUpperCase: false
    };
    for (let i = 0; i < str.length; i++) {
        if (isUpperCase(str[i]))
            res.upperCasePos.push(i);
    }
    if (res.upperCasePos.length == str.length)
        res.allUpperCase = true;
    return res;
}
function isUpperCase(char) {
    return char.charCodeAt(0) > 64 && char.charCodeAt(0) < 91;
}
