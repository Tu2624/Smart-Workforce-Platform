"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNow = getNow;
exports.getOffsetMs = getOffsetMs;
exports.setOffsetMs = setOffsetMs;
exports.resetOffset = resetOffset;
let offsetMs = 0;
function getNow() {
    return new Date(Date.now() + offsetMs);
}
function getOffsetMs() {
    return offsetMs;
}
function setOffsetMs(ms) {
    offsetMs = ms;
}
function resetOffset() {
    offsetMs = 0;
}
