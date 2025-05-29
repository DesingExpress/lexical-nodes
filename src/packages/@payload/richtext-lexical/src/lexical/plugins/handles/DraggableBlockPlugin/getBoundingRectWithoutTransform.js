'use client';
export function getBoundingClientRectWithoutTransform(elem) {
    const rect = elem.getBoundingClientRect();
    // Extract the translation value from the transform style
    const transformValue = getComputedStyle(elem).getPropertyValue('transform');
    if (!transformValue || transformValue === 'none') {
        return rect;
    }
    const lastNumberOfTransformValue = transformValue.split(',').pop();
    rect.y = rect.y - Number(lastNumberOfTransformValue === null || lastNumberOfTransformValue === void 0 ? void 0 : lastNumberOfTransformValue.replace(')', ''));
    // Return the original bounding rect if no translation is applied
    return rect;
}
