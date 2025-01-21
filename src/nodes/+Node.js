import { Pure } from "@design-express/fabrica";
import Editor from "../Component/Lexical";

import { LitegraphSlotContext } from "../Component/Lexical/context/litegraphContext";

export class lexicalNode extends Pure {
  static path = "UI";
  static title = "Lexical";
  static description = "please describe your node";

  constructor() {
    super();

    this.properties = { textOnly: false };
    this.contextMap = {};

    this.addInput("plugin", "lexical::plugin");
    this.addInput("toSave", -1);
    this.addOutput("component", "component");
    this.addOutput("onSave", -1);
    // @TODO: Apply Dynamic type
    this.addOutput("result", "object,string");

    this.addWidget("toggle", "textOnly", this.properties.textOnly, "textOnly");
  }

  onExecute() {
    const plugins = this.getInputData(1) ?? {};

    this.setOutputData(
      1,
      <LitegraphSlotContext node={this}>
        <Editor plugins={plugins} />
      </LitegraphSlotContext>
    );
  }

  onAction(name) {
    if (name !== "$$e$$") return this.useContext(name);
    return super.onAction(...arguments);
  }

  useContext(name) {
    if (!!this.contextMap[name]) {
      const _resultPromiseArr = [];
      for (let func of this.contextMap[name]) {
        _resultPromiseArr.push(func(this));
      }
      return Promise.all(_resultPromiseArr);
    }
    return;
  }
}
