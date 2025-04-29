import * as THREE from "three";
import SpriteText from "three-spritetext";

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

export function pipeLineModel(pointData) {
  let model = [];
  let group = new THREE.Group();
  // const material = new THREE.PointsMaterial({ color: 0x888888 });
  const partDict = pointData.group3d.partDict;
  const runDict = pointData.group3d.runDict;
  const group3d = pointData.group3d.group;
  console.log(group3d);
  for (let id in partDict) {
    let o = partDict[id];
    let ref = new RefPoint(o.point, new Point(1, 0), 0);

    if (o) {
      let r = runDict[o.runOID];
      let isPipe = [
        "Pipe stock",
        "elbow",
        "Tee",
        "reducer",
        "olet",
        "flange",
      ].some((t) => o.type.includes(t));
      let isPlug = ["plug", "Plug"].some((t) => o.type.includes(t));
      let isValve = ["valve", "Valve"].some((t) => o.type.includes(t));
      let color = isPipe ? "green" : isValve ? "magenta" : "cyan";
      if (o.adjacent.length > 2) {
        //브랜치인 경우
        color = "red";
      }
      if (r) {
        let l = isPipe || isPlug ? 10 : 20;
        let shape = [
          new Point(l, l),
          new Point(-l, l),
          new Point(-l, -l),
          new Point(l, -l),
        ];
        model.push(
          new Extrude(shape, 2 * l, { refPoint: ref }, color, {
            name: r.lineName,
            part: r.runName,
            key: id,
          })
        );

        if (!isPipe) {
          let text = new SpriteText(o.name, 50, "yellow");
          text.position.set(o.point.x, o.point.y, o.point.z);
          text.layers.set(0);
          group.add(text);
        }
      }
    }
  }
  group["userData"] = {
    name: "Label",
    part: `PartName`,
    key: "None",
  };
  //선분표시
  let aquaLine = new THREE.LineBasicMaterial({ color: 0x00ffff });
  let mesh = [];
  for (let c of pointData.conections) {
    let p1 = partDict[c.part1.PartOID];
    let p2 = partDict[c.part2.PartOID];
    if (p1 && p2) {
      if (p1.RunOID === p2.RunOID) {
        let l = [
          new THREE.Vector3(p1.point.x, p1.point.y, p1.point.z),
          new THREE.Vector3(p2.point.x, p2.point.y, p2.point.z),
        ];
        let geo = new THREE.BufferGeometry().setFromPoints(l);
        let lineMesh = new THREE.Line(geo, aquaLine);
        let r = runDict[p1.runOID];
        lineMesh["userData"] = {
          name: r.lineName,
          part: r.runName,
          key: `${c.ConnectionOID}`,
        };
        mesh.push(lineMesh);
      } else {
        let l1 = [
          new THREE.Vector3(p1.point.x, p1.point.y, p1.point.z),
          new THREE.Vector3(c.point.x, c.point.y, c.point.z),
        ];
        let geo1 = new THREE.BufferGeometry().setFromPoints(l1);
        let lineMesh1 = new THREE.Line(geo1, aquaLine);
        let r = runDict[p1.runOID];
        lineMesh1["userData"] = {
          name: r.lineName,
          part: r.runName,
          key: `${c.ConnectionOID}`,
        };
        let l2 = [
          new THREE.Vector3(c.point.x, c.point.y, c.point.z),
          new THREE.Vector3(p2.point.x, p2.point.y, p2.point.z),
        ];
        let geo2 = new THREE.BufferGeometry().setFromPoints(l2);
        let lineMesh2 = new THREE.Line(geo2, aquaLine);
        let r2 = runDict[p2.RunOID];
        lineMesh2["userData"] = {
          name: r2.lineName,
          part: r2.runName,
          key: `${c.ConnectionOID}`,
        };
        mesh.push(lineMesh1, lineMesh2);
      }
    }
  }
  // for (let part of group3d) {
  //   for (let key of ["end", "mid"]) {
  //     let endNum = 0;
  //     for (let ids of part[key]) {
  //       let l = ids.map(
  //         (id) =>
  //           new THREE.Vector3(
  //             partDict[id].point.x,
  //             partDict[id].point.y,
  //             partDict[id].point.z
  //           )
  //       );
  //       let geo = new THREE.BufferGeometry().setFromPoints(l);
  //       let lineMesh = new THREE.Line(geo, aquaLine);
  //       let r = runDict[partDict[ids[ids.length - 2]].runOID];
  //       lineMesh["userData"] = {
  //         name: r.lineName,
  //         part: r.runName,
  //         key: `${key}${endNum}`,
  //       };
  //       mesh.push(lineMesh);
  //       endNum++;
  //     }
  //   }
  // }
  mesh.push(group);
  return { model, mesh };
}
