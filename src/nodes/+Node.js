import { Pure } from "@design-express/fabrica";
import { genPointfn } from "./basic/point";
import { genModelfn } from "./3D/model";
import { genDrawfn } from "./2D/draw";
import { fontloader } from "@nexivil/package-modules";

export class yourNode extends Pure {
  static path = "folder";
  static title = "NodeName";
  static description = "please describe your node";

  constructor() {
    super();
  }

  onExecute() {}
}

export class genPoint extends Pure {
  //editor에서 path/title로 표시됨
  static path = "UserDefined";
  static title = "genPoint";
  static description = "generate point data";

  constructor() {
    super();
    this.addOutput("pointData", "pointData");
  }
  onExecute() {
    let pointData = genPointfn();
    this.setOutputData(1, pointData);
  }
}

export class genModel extends Pure {
  static path = "UserDefined";
  static title = "genModel";
  static description = "generate model array";

  constructor() {
    super();
    //노드에 input, output 변수 명칭/형식 정의
    //변수 형식이 ""일 경우 호환성 검토하지 않음
    this.addInput("pointData", "pointData");
    this.addOutput("models", "");
  }
  onExecute() {
    //노드실행시 output 출력
    let pointData = genModelfn(this.getInputData(1));
    this.setOutputData(1, pointData);
  }
}

export class genDraw extends Pure {
  static path = "UserDefined";
  static title = "genDraw";
  static description = "generate Draw array";
  //아래와 같이 폰트생성이 없으면 치수선 등 사용이 불가함
  static isready = fontloader(); 
  constructor() {
    super();
    this.addInput("pointData", "pointData");
    this.addOutput("draws", "");
  }
  onExecute() {
    let pointData = genDrawfn(this.getInputData(1));
    this.setOutputData(1, pointData);
  }
}
