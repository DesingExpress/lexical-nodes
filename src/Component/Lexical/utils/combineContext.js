import React, { Fragment } from "react";

export default function combineContexts(...contexts) {
  return contexts.reduce(
    (AccumulatedContexts, _CurrentContext) => {
      return ({ children }) => {
        const [CurrentContext, props = {}] = Array.isArray(_CurrentContext)
          ? _CurrentContext
          : [_CurrentContext];
        return (
          <AccumulatedContexts>
            <CurrentContext {...props}>{children}</CurrentContext>
          </AccumulatedContexts>
        );
      };
    },
    ({ children }) => <Fragment>{children}</Fragment>
  );
}
