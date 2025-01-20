import { createContext, useContext, useState } from "react";

const Context = createContext();

export function SlotContext({ node, children }) {
  const [_node] = useState(node);

  function onSlot(slot, value) {
    if (_node.outputs[slot]?.type === -1) {
      node.triggerSlot(slot);
      return;
    }
    _node.setOutputData(slot, value);
  }

  return <Context.Provider value={onSlot}>{children}</Context.Provider>;
}

export function useSlot() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSlot must be used within SlotProvider");
  }
  return context;
}
