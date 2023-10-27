"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTheme = void 0;
const fs = require("fs");
const utilities_1 = require("../../utilities");
async function loadTheme(path) {
    if (!fs.existsSync(path))
        return null;
    const plainContent = fs.readFileSync(path, { encoding: 'utf-8' });
    const name = path.replace(/^.*[\\/]/, '').split('.')[0];
    let raw;
    try {
        raw = JSON.parse(plainContent);
    }
    catch (err) {
        (0, utilities_1.sendConsoleOutput)(`#md83k | unable to parse Theme, fallback to default theme\nError message: ${err.stack}`, 'warn', 'ThemeLoader');
        return null;
    }
    if (!raw)
        return null;
    switch (raw.version) {
        default:
            (0, utilities_1.sendConsoleOutput)('missing or invalid version number, try parsing with to version 1', 'warn', 'ThemeLoader');
        case 1:
            return parse_ver1(raw, name);
    }
}
exports.loadTheme = loadTheme;
function parse_ver1(rawObject, name) {
    const ignoreList = new Set(['version', 'type']);
    const varsMap = new Map();
    for (let key in rawObject) {
        if (ignoreList.has(key))
            continue;
        varsMap.set(key, rawObject[key]);
    }
    return {
        vars: Object.fromEntries(varsMap),
        type: rawObject.type,
        name
    };
}
