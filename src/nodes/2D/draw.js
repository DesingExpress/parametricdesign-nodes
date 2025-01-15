import {
  continuedDim,
  DimStyle,
  getMeshes2D,
  Line,
} from "@nexivil/package-modules";
import { userlayers } from "./layer";

export function genDrawfn(pointData) {
  let draw = [];

  const {
    top,
    // btm, input
  } = pointData;

  //도면 속성 정의
  const scale = 10;
  const fontSize = scale * 2.5;
  const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });

  //도면 객체 생성
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
  return getMeshes2D(draw, userlayers);
}
