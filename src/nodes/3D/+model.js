import {
  Extrude,
  getMeshes3D,
  Loft,
  Point,
  RefPoint,
} from "@nexivil/package-modules";
import { userMaterials } from "./material";
import { Pure } from "@design-express/fabrica";
import { staadModel } from "./staadModel";

export class genModel extends Pure {
  static path = "UserDefined";
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
    const pointData = this.getInputData(1);
    let staad = staadModel(pointData)    
    let model = staad.model;
        //threejs-mesh로 변환
    const output = [...getMeshes3D(model, null, userMaterials), ...staad.mesh];
    //출력객체 정의
    this.setOutputData(1, output);
  }
}
