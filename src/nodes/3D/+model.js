import {
  Extrude,
  getMeshes3D,
  Loft,
  Point,
  RefPoint,
} from "@nexivil/package-modules";
import { userMaterials } from "./material";
import { Pure } from "@design-express/fabrica";

export class genModel extends Pure {
  static path = "Parametric/3D";
  static title = "genModel";
  static description = "generate model array";

  constructor() {
    super();
    //노드에 input, output 변수 명칭/형식 정의
    //변수 형식이 ""일 경우 호환성 검토하지 않음
    this.addInput("pointData", "parametric-design::pointData");

    this.addOutput("models", "array");
  }
  onExecute() {
    let model = [];
    const pointData = this.getInputData(1);
    const { top, btm, input } = pointData;
    //로컬좌표계 정의
    // let ref = new RefPoint(new Point(1000, 0), new Point(0, 1), Math.PI / 2);
    let ref = new RefPoint(new Point(1000, 0), new Point(0, 1), 0);
    console.log(ref);
    //모델 객체 생성
    model.push(
      new Loft([btm, top], true, "red", {
        name: "입체",
        part: "빨강",
        key: "1",
      }),
      new Extrude(btm, input.d, { refPoint: ref }, "blue", {
        name: "입체",
        part: "파랑",
        key: "2",
      })
    );
    //threejs-mesh로 변환
    const output = getMeshes3D(model, null, userMaterials);
    //출력객체 정의
    this.setOutputData(1, output);
  }
}
