/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { exportToSvg } from "@excalidraw/excalidraw";
import * as React from "react";
import { useEffect, useState } from "react";

// exportToSvg has fonts from excalidraw.com
// We don't want them to be used in open source
const removeStyleFromSvg_HACK = (svg) => {
  const styleTag = svg?.firstElementChild?.firstElementChild;

  // Generated SVG is getting double-sized by height and width attributes
  // We want to match the real size of the SVG element
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox != null) {
    const viewBoxDimensions = viewBox.split(" ");
    svg.setAttribute("width", viewBoxDimensions[2]);
    svg.setAttribute("height", viewBoxDimensions[3]);
  }

  if (styleTag && styleTag.tagName === "style") {
    styleTag.remove();
  }
};

/**
 * @explorer-desc
 * A component for rendering Excalidraw elements as a static image
 */
export default function ExcalidrawImage({
  elements,
  files,
  imageContainerRef,
  appState,
  rootClassName = null,
  width = "inherit",
  height = "inherit",
}) {
  const [Svg, setSvg] = useState(null);

  useEffect(() => {
    const setContent = async () => {
      const svg = await exportToSvg({
        appState,
        elements,
        files,
      });
      removeStyleFromSvg_HACK(svg);

      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("display", "block");

      setSvg(svg);
    };
    setContent();
  }, [elements, files, appState]);

  const containerStyle = {};
  if (width !== "inherit") {
    containerStyle.width = `${width}px`;
  }
  if (height !== "inherit") {
    containerStyle.height = `${height}px`;
  }

  return (
    <div
      ref={(node) => {
        if (node) {
          if (imageContainerRef) {
            imageContainerRef.current = node;
          }
        }
      }}
      className={rootClassName ?? ""}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: Svg?.outerHTML ?? "" }}
    />
  );
}
