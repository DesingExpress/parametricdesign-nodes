import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

import {
  ExtendPoint,
  Extrude,
  GetDirVector,
  GetPointBasedLength,
  GetPointBasedRatio,
  LineLength,
  Loft,
  Point,
  PointLength,
  PointToGlobal,
  PointToLocal,
  RefPoint,
  Tube,
  TwoPointsLength,
} from "@nexivil/package-modules";
import { flangeSize } from "./pipeData";
import { userMaterials } from "./material";

export function staadModel(pointData) {
  let model = [];
  let mesh = [];
  let initPoint = new Point(0, 0, 0);
  // let aquaLine = new THREE.LineBasicMaterial({ color: 0x00ffff });
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

  let pipe = [
    "PIPE",
    "NaN",
    "E45",
    "E90",
    "T",
    "LAT",
    "LRB",
    "TRB",
    "REDC",
    "REDE",
    "SWGE",
    "NIP",
  ];
  let flange = ["FBLD", "FRSW", "FOWN", "FSW", "FTHD", "FWN"];
  let valve = ["BALL", "BFYLP", "GAT", "GLO", "PLU"];
  let olet = [
    "FLGOL",
    "LOL",
    "Sockolet, flat",
    "SOL",
    "SWOL",
    "WOL",
    "Vesselet",
    "TOL",
  ];
  let lateral = ["LAT", "LOL", "LRB"];
  let pad = ["RPAD"]; //분기 보강용 구멍난 파이프 패드
  let degree = 16;
  let c = [...Array(degree + 1)].map((_, i) => i);
  let da = (Math.PI * 2) / degree;
  let e = 1;
  //파이프라인 3차원 모델링
  let flatItem = [];
  let refs = []; //refPoint집합
  let instrument = [];
  let pipeComp = [];
  for (let o of pointData.pipeLine) {
    let partName = o.lineName;
    let isPipe = pipe.includes(o.type);
    let isFlange = flange.includes(o.type);
    let isFLGOL = o.type === "FLGOL";
    let isValve = valve.includes(o.type);
    let isOlet = olet.includes(o.type);
    let isLateral = lateral.includes(o.type);
    let keyName = isPipe
      ? "pipeComp"
      : isFlange
      ? "flange"
      : isValve
      ? "valve"
      : isOlet
      ? "olet"
      : "etc"; //o.type; //지오메트리 머징을 위한 타입별 묶음
    let color = isPipe
      ? "green"
      : isFlange
      ? "blue"
      : isValve
      ? "magenta"
      : isOlet
      ? "cyan"
      : "yellow";
    if (o.type === "INSTRUMENT ITEM") {
      instrument.push(o);
    } else if (o.port1 && o.port2) {
      let org = o.point;
      let p1 = o.port1.point;
      let p2 = o.port2.point;
      let r1 = isOlet ? o.port2.dia / 2 : o.port1.dia / 2;
      let r2 = o.port2.dia / 2;
      let loft = [];
      if (isOlet) {
        if (LineLength([p1, p2]) < o.port2.dia / 2) {
          console.log(o);
        }
      }
      if (o.type === "NaN") {
        //90 or 45 elbow
        let l1 = LineLength([org, p1]);
        let l2 = LineLength([org, p2]);

        // let l12 = LineLength([p1, p2]);
        let l0 = Math.min(l1, l2);
        //l1 && l2는 반드시 0이 아니어야 함;
        let v1 = new Point(
          (p1.x - org.x) / l1,
          (p1.y - org.y) / l1,
          (p1.z - org.z) / l1
        );
        let v2 = new Point(
          (p2.x - org.x) / l2,
          (p2.y - org.y) / l2,
          (p2.z - org.z) / l2
        );

        let ca =
          Math.PI -
          Math.acos(
            Math.max(-1, Math.min(1, v1.x * v2.x + v1.y * v2.y + v1.z * v2.z))
          ); //중심각
        let dist = l0 / Math.sin(ca / 2); //org에서 중심점까지의 거리
        let ra = l0 / Math.tan(ca / 2);
        let dist0 =
          dist / PointLength(new Point(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)); //벡터합의 길이
        let div = 6; //6분할
        let dca = ca / div;
        let co = new Point( //중심좌표
          org.x + dist0 * (v1.x + v2.x),
          org.y + dist0 * (v1.y + v2.y),
          org.z + dist0 * (v1.z + v2.z)
        );
        let cv1 = new Point(
          (p1.x - co.x) / ra,
          (p1.y - co.y) / ra,
          (p1.z - co.z) / ra
        );
        let cv2 = new Point(
          (p2.x - co.x) / ra,
          (p2.y - co.y) / ra,
          (p2.z - co.z) / ra
        );
        let ay1 = 0;
        let ay2 = 0;
        let p1yVec = PointToGlobal(
          new Point(0, 1, 0),
          new RefPoint(new Point(0, 0, 0), new Point(-v1.x, -v1.y, -v1.z), 0)
        );
        let p2yVec = PointToGlobal(
          new Point(0, 1, 0),
          new RefPoint(new Point(0, 0, 0), new Point(v2.x, v2.y, v2.z), 0)
        );
        let theta1 = Math.atan2(p1yVec.y, p1yVec.x);
        let theta2 = Math.atan2(p2yVec.y, p2yVec.x);
        let isP1Vertical = v1.x === 0 && v1.y === 0;
        let isP2Vertical = v2.x === 0 && v2.y === 0;
        if (isP1Vertical || isP2Vertical) {
          if (isP1Vertical) {
            let sign = -v1.z > 0 ? 1 : -1;
            ay1 = sign * (theta2 - theta1);
          }
          if (isP2Vertical) {
            let sign = v2.z > 0 ? 1 : -1;
            ay2 = sign * (theta1 - theta2);
          }
        }
        let ref1 = new RefPoint(p1, new Point(-v1.x, -v1.y, -v1.z), ay1);
        let ref2 = new RefPoint(p2, new Point(v2.x, v2.y, v2.z), ay2);
        refs.push(ref1, ref2);
        loft.push(
          c.map((i) =>
            PointToGlobal(
              new Point(0, r1 * Math.cos(i * da), r1 * Math.sin(i * da)),
              ref1
            )
          )
        );
        for (
          let j = l1 - l0 > e ? 0 : 1;
          j < (l2 - l0 > e ? div + 1 : div);
          j++
        ) {
          let angle = dca * j;
          let d1 = (ra * Math.sin(ca - angle)) / Math.sin(ca);
          let d2 = (ra * Math.sin(angle)) / Math.sin(ca);
          let cp = new Point(
            co.x + d1 * cv1.x + d2 * cv2.x,
            co.y + d1 * cv1.y + d2 * cv2.y,
            co.z + d1 * cv1.z + d2 * cv2.z
          );
          let xAxis = new Point(
            (d1 * cv1.x + d2 * cv2.x) * Math.cos(angle) - ra * cv1.x,
            (d1 * cv1.y + d2 * cv2.y) * Math.cos(angle) - ra * cv1.y,
            (d1 * cv1.z + d2 * cv2.z) * Math.cos(angle) - ra * cv1.z
          );
          let ref = new RefPoint(cp, xAxis, 0);
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, r2 * Math.cos(i * da), r2 * Math.sin(i * da)),
                ref
              )
            )
          );
        }
        loft.push(
          c.map((i) =>
            PointToGlobal(
              new Point(0, r2 * Math.cos(i * da), r2 * Math.sin(i * da)),
              ref2
            )
          )
        );
        // //엘보우 로컬좌표계확인용
        // let p1y = PointToGlobal(new Point(0, r1 * 2, 0), ref1);
        // let line1 = [
        //   new THREE.Vector3(p1.x, p1.y, p1.z),
        //   new THREE.Vector3(p1y.x, p1y.y, p1y.z),
        // ];
        // let geo1 = new THREE.BufferGeometry().setFromPoints(line1);
        // let p2y = PointToGlobal(new Point(0, r2 * 2, 0), ref2);
        // let line2 = [
        //   new THREE.Vector3(p2.x, p2.y, p2.z),
        //   new THREE.Vector3(p2y.x, p2y.y, p2y.z),
        // ];
        // let geo2 = new THREE.BufferGeometry().setFromPoints(line2);
        // let lineMesh1 = new THREE.Line(geo1, aquaLine);
        // let lineMesh2 = new THREE.Line(geo2, aquaLine);
        // lineMesh1["userData"] = {
        //   name: "pipeLine",
        //   part: partName,
        //   key: o.lineName,
        // };
        // lineMesh2["userData"] = {
        //   name: "pipeLine",
        //   part: partName,
        //   key: o.lineName,
        // };
        // mesh.push(lineMesh1, lineMesh2);
      } else {
        let xAxis = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        if (o.type === "REDE") {
          xAxis.z = 0;
        }
        let ref1 = new RefPoint(p1, xAxis, 0);
        let ref2 = new RefPoint(p2, xAxis, 0);
        refs.push(ref1, ref2);
        if ((isFlange || isValve) && flangeSize[o.port1.npd]) {
          let rw = (flangeSize[o.port1.npd].OD * 25.4) / 2;
          let t = Math.min(
            flangeSize[o.port1.npd].t * 25.4,
            LineLength([p2, p1])
          ); //플랜지 길이가 두께보다 작을경우
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, r1 * Math.cos(i * da), r1 * Math.sin(i * da)),
                ref1
              )
            )
          );
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, rw * Math.cos(i * da), rw * Math.sin(i * da)),
                ref1
              )
            )
          );
          ref1 = new RefPoint(ExtendPoint(p2, p1, -t), xAxis, 0);
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, rw * Math.cos(i * da), rw * Math.sin(i * da)),
                ref1
              )
            )
          );
        }
        if (isOlet && o.type !== "Sockolet, flat") {
          ref1 = new RefPoint(ExtendPoint(p2, p1, -o.port1.dia / 2), xAxis, 0);
        }
        let circle1 = c.map((i) =>
          PointToGlobal(
            new Point(0, r1 * Math.cos(i * da), r1 * Math.sin(i * da)),
            ref1
          )
        );
        loft.push(circle1);
        if ((isValve || isFLGOL) && flangeSize[o.port2.npd]) {
          let t = flangeSize[o.port2.npd].t * 25.4;
          let rw = (flangeSize[o.port2.npd].OD * 25.4) / 2;
          ref2 = new RefPoint(ExtendPoint(p1, p2, -t), xAxis, 0);
          if (isValve) {
            let ref = new RefPoint(org, xAxis, 0);
            let l1 = LineLength([org, p1]);
            let l2 = LineLength([org, p2]);
            loft.push(
              c.map((i) =>
                PointToGlobal(
                  new Point(
                    (-l1 + t) * 0.3,
                    (r1 + (rw - r1) * 0.7) * Math.cos(i * da),
                    (r1 + (rw - r1) * 0.7) * Math.sin(i * da)
                  ),
                  ref
                )
              ),
              c.map((i) =>
                PointToGlobal(
                  new Point(
                    0,
                    (r1 + (rw - r1) * 0.8) * Math.cos(i * da),
                    (r1 + (rw - r1) * 0.8) * Math.sin(i * da)
                  ),
                  ref
                )
              ),
              c.map((i) =>
                PointToGlobal(
                  new Point(
                    (l2 - t) * 0.3,
                    (r1 + (rw - r1) * 0.7) * Math.cos(i * da),
                    (r1 + (rw - r1) * 0.7) * Math.sin(i * da)
                  ),
                  ref
                )
              )
            );
            pipeComp.push(...valveModel(o, ref));
          }
        }
        let circle2 = c.map((i) =>
          PointToGlobal(
            new Point(0, r2 * Math.cos(i * da), r2 * Math.sin(i * da)),
            ref2
          )
        );
        loft.push(circle2);
        if ((isValve || isFLGOL) && flangeSize[o.port2.npd]) {
          let rw = (flangeSize[o.port2.npd].OD * 25.4) / 2;
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, rw * Math.cos(i * da), rw * Math.sin(i * da)),
                ref2
              )
            )
          );
          ref2 = new RefPoint(p2, xAxis, 0);
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, rw * Math.cos(i * da), rw * Math.sin(i * da)),
                ref2
              )
            )
          );
          loft.push(
            c.map((i) =>
              PointToGlobal(
                new Point(0, r2 * Math.cos(i * da), r2 * Math.sin(i * da)),
                ref2
              )
            )
          );
        }
      }
      pipeComp.push(
        new Loft(loft, false, color, {
          name: "pipeLine",
          part: partName,
          key: keyName,
        })
      );
      if (o.port3) {
        let loft = [];
        let p3 = o.port3.point;
        let v1 = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        let v3 = new Point(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z);
        let h = (v1.x * v3.x + v1.y * v3.y + v1.z * v3.z) / PointLength(v1);
        let p0 = ExtendPoint(p2, p1, -h);
        let org = p0.x && !isLateral ? p0 : o.point;
        // let org = o.point;
        let r3 = o.port3.dia / 2;
        let xAxis = new Point(p3.x - org.x, p3.y - org.y, p3.z - org.z);
        let ref1 = new RefPoint(
          org, //GetPointBasedLength([org, p3], o.port1.dia / 2),
          xAxis,
          0
        );
        let circle1 = c.map((i) =>
          PointToGlobal(
            new Point(0, r3 * Math.cos(i * da), r3 * Math.sin(i * da)),
            ref1
          )
        );
        let ref2 = new RefPoint(p3, xAxis, 0);
        refs.push(ref2);
        let circle2 = c.map((i) =>
          PointToGlobal(
            new Point(0, r3 * Math.cos(i * da), r3 * Math.sin(i * da)),
            ref2
          )
        );
        loft.push(circle1, circle2);
        pipeComp.push(
          new Loft(loft, false, color, {
            name: "pipeLine",
            part: partName,
            key: keyName,
          })
        );
      }
      if (o.port4) {
        let loft = [];
        let p4 = o.port4.point;
        let v1 = new Point(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
        let v3 = new Point(p4.x - p1.x, p4.y - p1.y, p4.z - p1.z);
        let h = (v1.x * v3.x + v1.y * v3.y + v1.z * v3.z) / PointLength(v1);
        let p0 = ExtendPoint(p2, p1, -h);
        let org = p0.x && !isLateral ? p0 : o.point;
        let r4 = o.port4.dia / 2;
        let xAxis = new Point(p4.x - org.x, p4.y - org.y, p4.z - org.z);
        let ref1 = new RefPoint(
          org, //GetPointBasedLength([org, p4], o.port1.dia / 2),
          xAxis,
          0
        );
        let circle1 = c.map((i) =>
          PointToGlobal(
            new Point(0, r4 * Math.cos(i * da), r4 * Math.sin(i * da)),
            ref1
          )
        );
        let ref2 = new RefPoint(p4, xAxis, 0);
        refs.push(ref2);
        let circle2 = c.map((i) =>
          PointToGlobal(
            new Point(0, r4 * Math.cos(i * da), r4 * Math.sin(i * da)),
            ref2
          )
        );
        loft.push(circle1, circle2);
        pipeComp.push(
          new Loft(loft, false, color, {
            name: "pipeLine",
            part: partName,
            key: keyName,
          })
        );
      }
    } else {
      //port가 하나인 경우
      flatItem.push(o);
    }
  }
  for (let o of instrument) {
    //형상에 대한 추후 논의가 필요
    let color = "red";
    let partName = o.lineName;
    let keyName = "instrument"; //o.type;
    let org = o.point;
    let ports = [];
    let p1 = o.port1.point;
    let v1 = new Point(org.x - p1.x, org.y - p1.y, org.z - p1.z);
    if (o.port1) {
      ports.push(o.port1);
    }
    if (o.port2) {
      ports.push(o.port2);
    }
    if (o.port3) {
      ports.push(o.port3);
    }
    if (o.port4) {
      ports.push(o.port4);
      // partName = "INSTRUMENT-4Port";
    }
    let minZ = Infinity;
    let maxZ = -Infinity;
    let radius = Infinity;
    let orgZ = org.z;
    for (let ii = 0; ii < ports.length; ii++) {
      let port = ports[ii];
      let loft = [];
      let p = port.point;
      let r = port.dia / 2;
      let xAxis = new Point(p.x - org.x, p.y - org.y, p.z - org.z);
      let ref0 = refs.find(
        (pt) =>
          Math.abs(pt.x - p.x) < 10 &&
          Math.abs(pt.y - p.y) < 10 &&
          Math.abs(pt.z - p.z) < 10
      );
      if (ref0 && ports.length > 3) {
        //4port인 경우에만 파이프라인 방향 선정
        let xa = PointToGlobal(
          new Point(1, 0, 0),
          new RefPoint(new Point(0, 0, 0), ref0.xAxis, 0)
        );
        let h =
          (org.x - p.x) * xa.x + (org.y - p.y) * xa.y + (org.z - p.z) * xa.z;
        org = PointToGlobal(new Point(h, 0, 0), ref0);
        if (org.z - orgZ > maxZ) {
          maxZ = org.z - orgZ;
        }
        if (org.z - orgZ < minZ) {
          minZ = org.z - orgZ;
        }
        if (Math.abs(h) < radius) {
          radius = Math.abs(h);
        }
        xAxis = ref0.xAxis;
      }
      let ref1 = new RefPoint(org, xAxis, 0);
      let ref2 = new RefPoint(p, xAxis, 0);
      refs.push(ref2);
      let circle1 = c.map((i) =>
        PointToGlobal(
          new Point(0, r * Math.cos(i * da), r * Math.sin(i * da)),
          ref1
        )
      );
      let circle2 = c.map((i) =>
        PointToGlobal(
          new Point(0, r * Math.cos(i * da), r * Math.sin(i * da)),
          ref2
        )
      );
      loft.push(circle1, circle2);
      pipeComp.push(
        new Loft(loft, false, color, {
          name: "pipeLine",
          part: partName,
          key: keyName,
        })
      );
    }
    //4port instrument에 body 생성
    if (radius < Infinity && maxZ > minZ) {
      let body = [];
      let ref1 = new RefPoint(o.point, new Point(0, 0, 1), 0);
      let r = radius * 0.75;
      body.push(
        c
          .slice(1)
          .map((i) =>
            PointToGlobal(
              new Point(maxZ + 100, r * Math.cos(i * da), r * Math.sin(i * da)),
              ref1
            )
          ),
        c
          .slice(1)
          .map((i) =>
            PointToGlobal(
              new Point(minZ - 100, r * Math.cos(i * da), r * Math.sin(i * da)),
              ref1
            )
          )
      );
      pipeComp.push(
        new Loft(body, true, color, {
          name: "pipeLine",
          part: partName,
          key: keyName,
        })
      );
    }
  }

  for (let o of flatItem) {
    let color = "red";
    let p = o.port1.point;
    let r = o.port1.dia / 2;
    let partName = o.lineName;
    let keyName = "plug&cap"; //o.type;
    let ref = refs.find(
      (pt) =>
        Math.abs(pt.x - p.x) < 10 &&
        Math.abs(pt.y - p.y) < 10 &&
        Math.abs(pt.z - p.z) < 10
    );
    if (ref) {
      let circle2 = c
        .slice(0, -1)
        .map((i) =>
          PointToGlobal(
            new Point(0, r * Math.cos(i * da), r * Math.sin(i * da)),
            ref
          )
        );
      pipeComp.push(
        new Loft([circle2], true, color, {
          name: "pipeLine",
          part: partName,
          key: keyName,
        })
      );
    } else {
      console.log("Error", o);
    }
  }
  let pipeByLine = pipeComp.reduce((acc, cur) => {
    (acc[cur.meta.part] = acc[cur.meta.part] || []).push(cur);
    return acc;
    
  }, {});
  for (let part in pipeByLine) {
    let pipeByName = pipeByLine[part].reduce((acc, cur) => {
      (acc[cur.meta.key] = acc[cur.meta.key] || []).push(cur);
      return acc;
    }, {});
    for (let key in pipeByName) {
      let geos = pipeByName[key].map((o) => o.threeFunc(initPoint));
      let matColor = pipeByName[key][0].meta.material;
      let geo = BufferGeometryUtils.mergeGeometries(geos);
      let pipeMesh = new THREE.Mesh(geo, userMaterials[matColor]);
      pipeMesh["userData"] = {
        name: "pipeLine",
        part: part,
        key: key,
      };
      mesh.push(pipeMesh);
    }
  }

  let supports = [];
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
      supports.push(
        new Loft(loft, true, "yellow", {
          name: "support",
          part: a.lineName,
          key: a.name,
        })
      );
    }
  }
  let supportsByLine = supports.reduce((acc, cur) => {
    (acc[cur.meta.part] = acc[cur.meta.part] || []).push(cur);
    return acc;
  }, {});
  for (let part in supportsByLine) {
    let geos = supportsByLine[part].map((o) => o.threeFunc(initPoint));
    let matColor = supportsByLine[part][0].meta.material;
    let geo = BufferGeometryUtils.mergeGeometries(geos);
    let supportMesh = new THREE.Mesh(geo, userMaterials[matColor]);
    supportMesh["userData"] = {
      name: "support",
      part: part,
      key: "merged",
    };
    mesh.push(supportMesh);
  }
  // for (let part in supportsByLine) {
  //   let supportsByName = supportsByLine[part].reduce((acc, cur) => {
  //     (acc[cur.meta.key] = acc[cur.meta.key] || []).push(cur);
  //     return acc;
  //   }, {});
  //   for (let key in supportsByName) {
  //     let geos = supportsByName[key].map((o) => o.threeFunc(initPoint));
  //     let matColor = supportsByName[key][0].meta.material;
  //     let geo = BufferGeometryUtils.mergeGeometries(geos);
  //     let supportMesh = new THREE.Mesh(geo, userMaterials[matColor]);
  //     supportMesh["userData"] = {
  //       name: "support",
  //       part: part,
  //       key: key,
  //     };
  //     mesh.push(supportMesh);
  //   }
  // }
  console.log(model.length + mesh.length, "entities is generated");
  return { model, mesh };
}

export function valveModel(o, ref) {
  let color = "magenta";
  let partName = o.lineName;
  let keyName = "valve"; //o.type;
  let pipeComp = [];
  let loft = [];
  let degree = 12;
  let c = [...Array(degree + 1)].map((_, i) => i);
  let da = (Math.PI * 2) / degree;
  let e = 1;
  let r1 = o.port1.dia / 2;
  let rw = Math.min(r1 * 0.3, 10);
  let hr = Math.min(r1 * 2, 200);
  let dz = (flangeSize[o.port1.npd].OD * 25.4 ?? r1 * 3) * 0.6; //height ratio of radius
  let p0 = PointToGlobal(new Point(0, 0, dz), ref);
  loft.push(
    c.map((i) =>
      PointToGlobal(
        new Point(rw * Math.cos(i * da), rw * Math.sin(i * da), r1),
        ref
      )
    ),
    c.map((i) =>
      PointToGlobal(
        new Point(rw * Math.cos(i * da), rw * Math.sin(i * da), dz),
        ref
      )
    )
  );
  for (let i = 0; i < c.length; i += 2) {
    let p1 = PointToGlobal(
      new Point(hr * Math.cos(i * da), hr * Math.sin(i * da), dz),
      ref
    );
    let axis = new Point(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
    let barRef = new RefPoint(p0, axis, 0);
    let bar = [
      c.map((i) =>
        PointToGlobal(
          new Point(0, rw * Math.cos(i * da), rw * Math.sin(i * da)),
          barRef
        )
      ),
      c.map((i) =>
        PointToGlobal(
          new Point(hr, rw * Math.cos(i * da), rw * Math.sin(i * da)),
          barRef
        )
      ),
    ];
    pipeComp.push(
      new Loft(bar, false, color, {
        name: "pipeLine",
        part: partName,
        key: keyName,
      })
    );
  }
  let handle = c.map((i) =>
    PointToGlobal(
      c.map(
        (j) =>
          new Point(
            (hr + rw * Math.cos(j * da)) * Math.cos(i * da),
            (hr + rw * Math.cos(j * da)) * Math.sin(i * da),
            dz + rw * Math.sin(j * da)
          )
      ),
      ref
    )
  );
  pipeComp.push(
    new Loft(handle, false, color, {
      name: "pipeLine",
      part: partName,
      key: keyName,
    })
  );
  pipeComp.push(
    new Loft(loft, false, color, {
      name: "pipeLine",
      part: partName,
      key: keyName,
    })
  );

  return pipeComp;
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
