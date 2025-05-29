import { $getRoot } from "lexical";
import YAML from "yaml";

import { $isFrontmatterNode } from "../plugins/FrontmatterPlugin/node/FrontamatterNode";

export function $getFrontmatter() {
  const maybeFrontmatterNode = $getRoot().getFirstChild();
  if ($isFrontmatterNode(maybeFrontmatterNode))
    return YAML.parse(maybeFrontmatterNode.getTextContent());
  return undefined;
}
