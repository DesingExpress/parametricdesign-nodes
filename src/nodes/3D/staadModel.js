import {
  Extrude,
  GetPointBasedRatio,
  LineLength,
  Loft,
  Point,
  RefPoint,
  Tube,
  TwoPointsLength,
} from "@nexivil/package-modules";

export function staadModel(pointData) {
  let model = [];
  for (let a of pointData.steelMember) {
    let h = a.height;
    let w = a.width;
    let shape = [
      new Point(w / 2, h / 2),
      new Point(-w / 2, h / 2),
      new Point(-w / 2, -h / 2),
      new Point(w / 2, -h / 2),
    ];
    // let cp = GetPointBasedRatio(a.point, 0.5);
    // let thickness = TwoPointsLength(a.point[0], a.point[1])
    // let refPoint = new RefPoint(
    //     cp,
    // )
    model.push(
      new Tube(a.point, w / 2, true, "red", {
        name: "steelMember",
        part: "member",
        key: a.name,
      })
      // new Extrude(btm, input.d, { refPoint: ref }, "blue", {
      //   name: "입체",
      //   part: "파랑",
      //   key: "2",
      // })
    );
  }
  let pline = pointData.pipeLine.reduce((output, obj) => {
    (output[obj.lineName] = output[obj.lineName] || []).push(obj.point);
    return output;
  }, {});

  for (let lineName in pline) {
    let radius = 50;
    // let cp = GetPointBasedRatio(a.point, 0.5);
    // let thickness = TwoPointsLength(a.point[0], a.point[1])
    // let refPoint = new RefPoint(
    //     cp,
    // )
    let points = pline[lineName];
    if (points.length > 1) {
      let nPts = shortPath(points);
      model.push(
        new Tube(nPts, radius, true, "green", {
          name: "pipeLine",
          part: "pipe",
          key: lineName,
        })
        // new Extrude(btm, input.d, { refPoint: ref }, "blue", {
        //   name: "입체",
        //   part: "파랑",
        //   key: "2",
        // })
      );
    }
  }

  for (let a of pointData.support) {
    let p = a.point;
    if (
      a.componentName !== "Total Range" &&
      Math.abs(p[0].x - p[1].x) > 0 &&
      Math.abs(p[0].y - p[1].y) > 0 &&
      Math.abs(p[0].z - p[1].z) > 0
    ) {
      let loft = [
        [
          new Point(p[0].x, p[0].y, p[0].z),
          new Point(p[1].x, p[0].y, p[0].z),
          new Point(p[1].x, p[1].y, p[0].z),
          new Point(p[0].x, p[1].y, p[0].z),
        ],
        [
          new Point(p[0].x, p[0].y, p[1].z),
          new Point(p[1].x, p[0].y, p[1].z),
          new Point(p[1].x, p[1].y, p[1].z),
          new Point(p[0].x, p[1].y, p[1].z),
        ],
      ];
      model.push(
        new Loft(loft, true, "yellow", {
          name: "support",
          part: a.itemType,
          key: a.name,
        })
      );
    }
  }

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
