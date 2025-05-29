'use client';
export function isOnHandleElement(element, handleElementClassName) {
    return !!element.closest(`.${handleElementClassName}`);
}
