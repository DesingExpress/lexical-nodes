/**
 * Copyright (c) 2022 Eric Chen and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @repository https://github.com/show-docs/markdown-code-block-meta
 */

const regexp =
  /((?<k1>(?!=)\S+)=((?<v1>(["'`])(.*?)\5)|(?<v2>\S+)))|(?<k2>\S+)/g;

const removeQuotes = /(["'`])(?<value>.*?)\1/;

export function parse(string) {
  const io = (string ?? "").matchAll(regexp);

  return Object.fromEntries(
    [...io]
      .map((item) => item?.groups)
      .map(({ k1, k2, v1, v2 }) => [
        k1 ?? k2,
        removeQuotes.exec(v1 ?? v2 ?? "")?.groups?.value ?? v1 ?? v2,
      ])
  );
}
