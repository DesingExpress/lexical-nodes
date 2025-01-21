import { createContext, useCallback, useContext } from "react";

const Context = createContext();

export function LitegraphSlotContext({ node, children }) {
  const registerCommand = useCallback(
    (slotName, _func) => {
      (
        node.contextMap[slotName] ?? (node.contextMap[slotName] = new Set())
      ).add(_func);
      return () => {
        node.contextMap[slotName].delete(_func);
      };
    },
    [node]
  );

  return (
    <Context.Provider value={registerCommand}>{children}</Context.Provider>
  );
}

export function useLitegraphSlot() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSlot must be used within LitegraphSlotContextProvider");
  }
  return context;
}
