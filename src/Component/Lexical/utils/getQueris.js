import { $dfsIterator } from "@lexical/utils";
import { $isRulesetNode } from "../plugins/RulesetPlugin/node/RulesetNode";

export function $getQueris() {
  const result = [];
  for (let { node } of $dfsIterator()) {
    if ($isRulesetNode(node)) {
      const { code, title } = node.getRawMeta();
      result.push({
        code,
        name: title,
        query: node.getTextContent(),
      });
    }
  }

  return result;
}
