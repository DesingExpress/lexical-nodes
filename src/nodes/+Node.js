import { Pure } from "@design-express/fabrica";
import Editor from "./Component/Lexical";

export class lexicalNode extends Pure {
  static path = "UI";
  static title = "Lexical";
  static description = "please describe your node";

  constructor() {
    super();
    this.addOutput("component", "component");
  }

  onExecute() {
    this.setOutputData(1, <Editor />);
  }
}
