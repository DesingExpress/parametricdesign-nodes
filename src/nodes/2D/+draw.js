import {
  continuedDim,
  DimStyle,
  fontloader,
  getMeshes2D,
  Line,
} from "@nexivil/package-modules";
import { userlayers } from "./layer";
import { Pure } from "@design-express/fabrica";

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

    this.addOutput("draws", "array");
  }

  onExecute() {
    const pointData = this.getInputData(1);
    const { top } = pointData;
    //도면 속성 정의
    const scale = 10;
    const fontSize = scale * 2.5;
    const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
    //도면 객체 생성
    const draw = [];
    draw.push(
      new Line(top, "CS-CONC", true),
      ...continuedDim(
        top,
        0,
        -Math.PI / 2,
        true,
        fontSize,
        1,
        0,
        false,
        "CS-DIML",
        style
      ),
      ...continuedDim(
        top,
        0,
        Math.PI,
        true,
        fontSize,
        1,
        0,
        false,
        "CS-DIML",
        style
      )
    );
    //threejs-mesh로 변환
    const meshes = getMeshes2D(draw, userlayers);
    //출력객체 정의
    this.setOutputData(1, meshes);
  }
}
