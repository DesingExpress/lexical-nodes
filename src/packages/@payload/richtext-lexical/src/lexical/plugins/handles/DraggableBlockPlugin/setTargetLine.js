'use client';
import { getCollapsedMargins } from '../utils/getCollapsedMargins.js';
const TARGET_LINE_HALF_HEIGHT = 0;
const TEXT_BOX_HORIZONTAL_PADDING = -24;
const DEBUG = false;
let animationTimer = 0;
export function setTargetLine(offsetWidth, offsetLeft, targetLineElem, targetBlockElem, lastTargetBlock, mouseY, anchorElem, event, debugHighlightRef, isFoundNodeEmptyParagraph = false) {
    var _a;
    const { height: targetBlockElemHeight, top: targetBlockElemTop } = targetBlockElem.getBoundingClientRect(); // used to be getBoundingClientRectWithoutTransform. Not sure what's better, but the normal getBoundingClientRect seems to work fine
    const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect();
    const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElem);
    let lineTop = targetBlockElemTop;
    const isBelow = mouseY >= targetBlockElemTop + targetBlockElemHeight / 2 + window.scrollY;
    let willStayInSamePosition = false;
    /**
     * Do not run any transform or changes if the actual new line position would be the same (even if it's now inserted BEFORE rather than AFTER - position would still be the same)
     * This prevents unnecessary flickering.
     *
     * We still need to let it run even if the position (IGNORING the transform) would not change, as the transform animation is not finished yet. This is what animationTimer does. Otherwise, the positioning will be inaccurate
     */
    if (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) {
        if (targetBlockElem !== (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem)) {
            if (isBelow &&
                (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) &&
                (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) === targetBlockElem.nextElementSibling) {
                animationTimer++;
                if (animationTimer < 200) {
                    willStayInSamePosition = true;
                }
            }
            else if (!isBelow &&
                (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) &&
                (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) === targetBlockElem.previousElementSibling) {
                animationTimer++;
                if (animationTimer < 200) {
                    willStayInSamePosition = true;
                }
            }
        }
        else {
            animationTimer++;
            const lastBoundingBoxPosition = (_a = lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.boundingBox) === null || _a === void 0 ? void 0 : _a.y;
            const currentBoundingBoxPosition = targetBlockElem.getBoundingClientRect().y;
            if ((isBelow === (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.isBelow) &&
                lastBoundingBoxPosition === currentBoundingBoxPosition) ||
                animationTimer < 200) {
                willStayInSamePosition = false;
            }
        }
    }
    if (willStayInSamePosition) {
        return {
            isBelow,
            willStayInSamePosition,
        };
    }
    /**
     * Paragraphs need no isBelow/above handling,
     */
    if (!isFoundNodeEmptyParagraph) {
        //if (!isFoundNodeEmptyParagraph) {
        if (isBelow) {
            // below targetBlockElem
            lineTop += targetBlockElemHeight + marginBottom / 2;
        }
        else {
            // above targetBlockElem
            lineTop -= marginTop / 2;
        }
    }
    else {
        lineTop += targetBlockElemHeight / 2;
    }
    let targetElemTranslate2 = 0;
    if (!isFoundNodeEmptyParagraph) {
        if (isBelow) {
            targetElemTranslate2 = -TARGET_LINE_HALF_HEIGHT;
        }
        else {
            targetElemTranslate2 = TARGET_LINE_HALF_HEIGHT;
        }
    }
    const top = lineTop - anchorTop + targetElemTranslate2;
    const left = TEXT_BOX_HORIZONTAL_PADDING - offsetLeft;
    targetLineElem.style.width = `calc(${anchorWidth}px - ${offsetWidth})`;
    targetLineElem.style.opacity = '.8';
    // if (DEBUG) {
    //   //targetBlockElem.style.border = '3px solid red'
    //   highlightElemOriginalPosition(debugHighlightRef, targetBlockElem, anchorElem)
    // }
    targetLineElem.style.transform = `translate(${left}px, calc(${top}px - ${'2px'}))`;
    /**
     * Properly reset previous targetBlockElem styles
     */
    if (lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) {
        lastTargetBlock.elem.style.opacity = '';
        if ((lastTargetBlock === null || lastTargetBlock === void 0 ? void 0 : lastTargetBlock.elem) === targetBlockElem) {
            if (isBelow) {
                lastTargetBlock.elem.style.marginTop = '';
            }
            else {
                lastTargetBlock.elem.style.marginBottom = '';
            }
        }
        else {
            lastTargetBlock.elem.style.marginBottom = '';
            lastTargetBlock.elem.style.marginTop = '';
        }
    }
    animationTimer = 0;
    return {
        isBelow,
        willStayInSamePosition,
    };
}
