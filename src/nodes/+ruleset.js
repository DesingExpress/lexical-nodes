import { Pure } from "@design-express/fabrica";
// import { useState } from "react";
import { RulesetNode } from "../Component/Lexical/plugins/RulesetPlugin/node/RulesetNode";
import { RULESET } from "../Component/Lexical/plugins/RulesetPlugin/transformer";
import { SlotContext } from "src/Component/Lexical/context/SlotContext";

export class rulesetPluginNode extends Pure {
  static path = "Lexical/Plugin";
  static title = "Ruleset";
  static description = "";

  constructor() {
    super();
    // console.log(window.Prism);
    // if (typeof window.Prism === "undefined") {
    //   window.Prism = Prism;
    //   console.log(window.Prism);
    // }

    this.addInput("plugin", "lexical::plugin,object");
    this.addOutput("plugin", "lexical::plugin,object");
    this.addOutput("onExec", -1);
    this.addOutput("query", "string");
    // this._contexts=
  }

  onExecute() {
    const _pluginInfo = this.getInputData(1) ?? {
      plugins: [],
      nodes: [],
      shortcuts: [],
      contexts: [],
    };
    _pluginInfo.nodes.push(RulesetNode);
    _pluginInfo.shortcuts.push(RULESET);
    _pluginInfo.contexts.push([SlotContext, { node: this }]);
    this.setOutputData(1, _pluginInfo);
  }
}
