import {
  Extrude,
  getMeshes3D,
  Loft,
  Point,
  RefPoint,
} from "@nexivil/package-modules";
import { userMaterials } from "./material";

/**
 * 포인트데이터로부터 모델 객체 배열을 생성하기 위한 함수
 * @param {*} pointData genPointfn() 함수를 이용하여 생성된 데이터
 * @returns Array<model>
 */
export function genModelfn(pointData) {
  let model = [];
  const { top, btm, input } = pointData;
  //로컬좌표계 정의
  let ref = new RefPoint(new Point(1000, 0), new Point(0, 1), Math.PI / 2);
  //모델 객체 생성
  model.push(
    new Loft([btm, top], true, "red", { name: "입체", part: "빨강", key: "1" }),
    new Extrude(btm, input.d, { refPoint: ref }, "blue", {
      name: "입체",
      part: "파랑",
      key: "2",
    })
  );
  //threejs-mesh로 변환
  return getMeshes3D(model, null, userMaterials);
}
