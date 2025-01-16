import { Pure } from "@design-express/fabrica";
import { Point } from "@nexivil/package-modules";

export class genPoint extends Pure {
  //editor에서 path/title로 표시됨
  static path = "UserDefined";
  static title = "genPoint";
  static description =
    "Node for generating key node elements for parametric design descriptions";

  constructor() {
    super();
    this.addOutput("pointData", "parametric-design::pointData");
  }

  onExecute() {
    let input = { a: 100, b: 100, c: 100, d: 300, e: 100, f: 200 };
    //절점 생성
    let btm = [
      new Point(0, 0, 0),
      new Point(input.a, 0, 0),
      new Point(input.a, input.e, 0),
      new Point(input.a + input.b, input.e, 0),
      new Point(input.a + input.b, 0, 0),
      new Point(input.a + input.b + input.c, 0, 0),
      new Point(input.a + input.b + input.c, input.e + input.f, 0),
      new Point(0, input.e + input.f, 0),
    ];
    let top = btm.map((p) => new Point(p.x, p.y, p.z + input.d));
    let output = { top, btm, input };
    //출력객체 정의
    this.setOutputData(1, output);
  }
}
