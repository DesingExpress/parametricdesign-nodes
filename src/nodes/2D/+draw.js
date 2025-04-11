import {
  fontloader,
  getMeshes2D,
} from "@nexivil/package-modules";
import { userlayers } from "./layer";
import { Pure } from "@design-express/fabrica";
import { draw2D3DCompare, genBranchDraw2 } from "./branch";

export class genDraw extends Pure {
  static path = "UserDefined";
  static title = "genDraw";
  static description =
    "Node to create an array of drawing objects from point data.";
  // Three.js의 폰트 파일 로드. Three.js에서 텍스트 객체를 사용하기 위해서 항시 필요.
  static isready = fontloader();

  constructor() {
    super();
    this.addInput("pointData", "parametric-design::pointData");
    this.addOutput("meshes", "array");
    this.addOutput("draws", "array");
    this.addOutput("fileName", "");
    this.addOutput("options", "");
  }

  onExecute() {
    const pointData = this.getInputData(1);
    //도면 속성 정의
    // const draw = genBranchDraw2(pointData);
    const draw = draw2D3DCompare(pointData);
    //pidConnection을 브랜치별로 구분하여 내용을 작성
    //threejs-mesh로 변환
    const meshes = getMeshes2D(draw, userlayers);
    //출력객체 정의
    let layer = { ...userlayers };
    let option = { layer };
    this.setOutputData(1, meshes);
    this.setOutputData(2, draw);
    this.setOutputData(3, "2D3D");
    this.setOutputData(4, option);
  }
}
