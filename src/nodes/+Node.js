import { Pure } from "@design-express/fabrica";
import Editor from "../Component/Lexical";

export class lexicalNode extends Pure {
  static path = "UI";
  static title = "Lexical";
  static description = "please describe your node";

  constructor() {
    super();
    // console.log(window.Prism);
    // if (typeof window.Prism === "undefined") {
    //   window.Prism = Prism;
    //   console.log(window.Prism);
    // }
    this.addInput("plugin", "lexical::plugin");
    this.addOutput("component", "component");
  }

  onExecute() {
    const plugins = this.getInputData(1) ?? {};
    this.setOutputData(1, <Editor plugins={plugins} />);
  }
}
