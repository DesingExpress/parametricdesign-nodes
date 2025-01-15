import { Point } from "@nexivil/package-modules";

/**
 * 파라메트릭 디자인 설명을 위한 주요 절점 요소를 생성하기 위한 기본 함수
 * @returns object { top, btm, input }
 */
export function genPointfn() {
  //입력 파라미터
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

  //출력객체 정의
  let pointData = { top, btm, input };
  return pointData;
}
