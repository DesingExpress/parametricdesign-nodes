import {
  Extrude,
  GetPointBasedRatio,
  LineLength,
  Loft,
  Point,
  PointToGlobal,
  PointToLocal,
  RefPoint,
  Tube,
  TwoPointsLength,
} from "@nexivil/package-modules";

export function staadModel(pointData) {
  let model = [];
  for (let a of pointData.steelMember) {
    let h = a.height;
    let w = a.width;
    let rotRef = new RefPoint(
      new Point(0, 0),
      new Point(Math.cos(a.angle), Math.sin(a.angle)),
      0
    );
    let shape = PointToLocal(steelShape(a), rotRef);
    let cp = GetPointBasedRatio(a.point, 0.5);
    let thickness = TwoPointsLength(a.point[0], a.point[1]);
    let refPoint = genMemberRefPoint(a.point, a.angle);
    new RefPoint(cp);
    let mat = "red";
    switch (a.typeCategory) {
      case "Column":
        mat = "blue";
        break;
      case "Girder":
        mat = "magenta";
        break;
      case "Beam":
        mat = "magenta";
        break;
      case "Brace":
        mat = "cyan";
        break;
      default:
        mat = "red";
    }
    model.push(
      new Extrude(shape, thickness, { refPoint }, mat, {
        name: "steelMember",
        part: a.typeCategory,
        key: a.name,
      })
    );
  }
  //라인별로 최단 경로로 파이프 중심점을 조합, 데이터 확장으로 사용되지 않음
  // let pline = pointData.pipeLine.reduce((output, obj) => {
  //   (output[obj.lineName] = output[obj.lineName] || []).push(obj.point);
  //   return output;
  // }, {});
  // for (let lineName in pline) {
  //   let radius = 50;
  //   let points = pline[lineName];
  //   if (points.length > 1) {
  //     let nPts = shortPath(points);
  //     model.push(
  //       new Tube(nPts, radius, true, "yellow", {
  //         name: "pipeLine",
  //         part: "pipe",
  //         key: lineName,
  //       })
  //     );
  //   }
  // }
  // comment end
  let flange = ["FBLD", "FLGOL", "FRSW", "FOWN", "FSW", "FTHD", "FWN"];
  let degree = 32;
  let c = [...Array(degree+1)].map((_, i) => i);
  let da = (Math.PI * 2) / degree;
  console.log(c);
  //파이프라인 3차원 모델링
  for (let o of pointData.pipeLine) {
    if (o.port1 && o.port2) {
      let xAxis = new Point(
        o.port2.point.x - o.port1.point.x,
        o.port2.point.y - o.port1.point.y,
        o.port2.point.z - o.port1.point.z
      );
      let ref1 = new RefPoint(o.port1.point, xAxis, 0);
      let ref2 = new RefPoint(o.port2.point, xAxis, 0);
      let r1 = o.port1.dia / 2;
      let r2 = o.port2.dia / 2;
      let circle1 = c.map((i) =>
        PointToGlobal(
          new Point(0, r1 * Math.cos(i * da), r1 * Math.sin(i * da)),
          ref1
        )
      );
      let circle2 = c.map((i) =>
        PointToGlobal(
          new Point(0, r2 * Math.cos(i * da), r2 * Math.sin(i * da)),
          ref2
        )
      );

      let nPts =
        o.type === "PIPE"
          ? [o.port1.point, o.port2.point]
          : [o.port1.point, o.point, o.port2.point];
      let color =
        o.type === "PIPE"
          ? "green"
          : flange.includes(o.type)
          ? "blue"
          : "yellow";
      //check, 중심점 테스트
      model.push(
        new Loft([circle1, circle2], false, color, {
          name: "pipeLine",
          part: o.type,
          key: o.lineName,
        })
        // new Tube(nPts, o.port1.dia / 2, true, color, {
        //   name: o.type,
        //   part: o.lineName,
        //   key: o.id,
        // })
      );
    }
    if (o.port3) {
      let nPts = [o.point, o.port3.point];
      let color =
        o.type === "PIPE"
          ? "green"
          : flange.includes(o.type)
          ? "blue"
          : "yellow";
      model.push(
        new Tube(nPts, o.port3.dia / 2, true, color, {
          name: o.type,
          part: o.lineName,
          key: o.id,
        })
      );
    }
  }

  // for (let a of pointData.support) {
  //   let p = a.point;
  //   if (
  //     a.componentName !== "Total Range" &&
  //     Math.abs(p[0].x - p[1].x) > 0 &&
  //     Math.abs(p[0].y - p[1].y) > 0 &&
  //     Math.abs(p[0].z - p[1].z) > 0
  //   ) {
  //     let loft = [
  //       [
  //         new Point(p[0].x, p[0].y, p[0].z),
  //         new Point(p[1].x, p[0].y, p[0].z),
  //         new Point(p[1].x, p[1].y, p[0].z),
  //         new Point(p[0].x, p[1].y, p[0].z),
  //       ],
  //       [
  //         new Point(p[0].x, p[0].y, p[1].z),
  //         new Point(p[1].x, p[0].y, p[1].z),
  //         new Point(p[1].x, p[1].y, p[1].z),
  //         new Point(p[0].x, p[1].y, p[1].z),
  //       ],
  //     ];
  //     model.push(
  //       new Loft(loft, true, "yellow", {
  //         name: "support",
  //         part: a.itemType,
  //         key: a.name,
  //       })
  //     );
  //   }
  // }

  return model;
}

export function shortPath(points) {
  if (points.length > 1) {
    let arr = [];
    let ia = []; // index arra
    let ra = []; //result index array
    for (let i = 0; i < points.length; i++) {
      ia.push(i);
      let p1 = points[i];
      for (let j = i + 1; j < points.length; j++) {
        let p2 = points[j];
        let d = TwoPointsLength(p1, p2);
        arr.push({ index: [i, j], dist: d });
      }
    }
    arr.sort((a, b) => a.dist - b.dist);
    let i0 = arr[arr.length - 1].index[0];
    ra.push(i0);
    let i1 = i0;
    for (let i = 0; i < points.length - 1; i++) {
      let d = Infinity;
      let k;
      for (let j = 0; j < arr.length; j++) {
        let i2 = arr[j].index[0] === i0 ? arr[j].index[1] : arr[j].index[0];
        if (arr[j].index.includes(i0) && arr[j].dist < d && !ra.includes(i2)) {
          d = arr[j].dist;
          i1 = i2;
          k = j;
        }
      }
      arr.splice(k, 1);
      ra.push(i1);
      i0 = i1;
    }
    let result = ra.map((i) => points[i]);
    return result;
  }
  return points;
}

export function genMemberRefPoint(points, angle) {
  let l2d = TwoPointsLength(points[0], points[1], true);
  // let l3d = TwoPointsLength(points[0], points[1]);
  let vec = new Point(
    points[1].x - points[0].x,
    points[1].y - points[0].y,
    points[1].z - points[0].z
  );
  let zRot = Math.atan2(vec.z, l2d);
  let xAxis = new Point(0, -1);
  let cp = GetPointBasedRatio(points, 0.5);

  let refPoint = new RefPoint(
    cp,
    new Point(Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2)),
    0
  );
  if (l2d > 0) {
    xAxis = new Point(points[0].y - points[1].y, points[1].x - points[0].x);
    // let tempRef = new RefPoint(new Point(0, 0, 0), xAxis, Math.PI / 2 - zRot);
    // let newXAxis = PointToGlobal(
    //   new Point(Math.cos(angle), Math.sin(angle)),
    //   tempRef
    // );
    // let yAxis = PointToGlobal(
    //   new Point(Math.sin(angle), Math.cos(angle)),
    //   tempRef
    // );
    // let yRot = Math.acos(Math.sqrt(yAxis.x ** 2 + yAxis.y ** 2));
    // tempRef = new RefPoint(new Point(0, 0), newXAxis, yRot);
    // let zAxis = PointToGlobal(new Point(0, 0, 1), tempRef);
    // let innerProduct = zAxis.x + vec.x + zAxis.y + vec.y + zAxis.z + vec.z;

    // if (innerProduct > 0) {
    //   refPoint = new RefPoint(cp, newXAxis, yRot);
    // } else {
    //   refPoint = new RefPoint(cp, newXAxis, yRot);
    // }
    refPoint = new RefPoint(cp, xAxis, Math.PI / 2 - zRot);
  }
  return refPoint;
}

export function steelShape(a) {
  let h = a.height;
  let w = a.width;
  let ut = 10;
  let wt = 10;
  let lt = 10;
  let isCT = a.section.includes("CT");
  let left = isCT
    ? [
        new Point(-w / 2, h / 2),
        new Point(-w / 2, h / 2 - ut),
        new Point(-wt / 2, h / 2 - ut),
        new Point(-wt / 2, -h / 2),
      ]
    : [
        new Point(-w / 2, h / 2),
        new Point(-w / 2, h / 2 - ut),
        new Point(-wt / 2, h / 2 - ut),
        new Point(-wt / 2, -h / 2 + lt),
        new Point(-w / 2, -h / 2 + lt),
        new Point(-w / 2, -h / 2),
      ];
  let shape = [
    ...left,
    ...left
      .slice()
      .reverse()
      .map((p) => new Point(-p.x, p.y)),
  ];
  //반시계방향으로 회전
  return shape;
}
