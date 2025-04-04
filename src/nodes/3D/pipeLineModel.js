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
  const material = new THREE.PointsMaterial({ color: 0x888888 });
  let l = 50;
  let shape = [
    new Point(l, l),
    new Point(-l, l),
    new Point(-l, -l),
    new Point(l, -l),
  ];
  console.log(pointData);
  let vertices = [];
  for (let a of pointData.components) {
    vertices.push(a.point.x, a.point.y, a.point.z);
    let ref = new RefPoint(a.point, new Point(1, 0), 0);
    model.push(
      new Extrude(shape, 2 * l, { refPoint: ref }, "cyan", {
        name: "component",
        part: "particle",
        key: a.partOID,
      })
    );
    let text = new SpriteText(a.partName, 150, "yellow");
    text.position.set(a.point.x, a.point.y, a.point.z);
    text.layers.set(0);
    // text.backgroundColor = "red"
    group.add(text);
  }
  // let geometry = new THREE.BufferGeometry();
  // geometry.setAttribute(
  //   "position",
  //   new THREE.Float32BufferAttribute(vertices, 3)
  // );
  // group.add(new THREE.Points(geometry, material));
  //선분표시
  let aquaLine = new THREE.LineBasicMaterial({ color: 0x00ffff });
  for (let k = 0; k < pointData.conections.length; k++) {
    let cn = pointData.conections[k];
    let id1 = cn.part1.PartOID;
    let id2 = cn.part2.PartOID;
    let comp1 = pointData.components.find((o) => o.PartOID === id1);
    let comp2 = pointData.components.find((o) => o.PartOID === id2);
    if (comp1 && comp2) {
      let p1 = new THREE.Vector3(comp1.point.x, comp1.point.y, comp1.point.z);
      let p2 = new THREE.Vector3(comp2.point.x, comp2.point.y, comp2.point.z);
      let geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      group.add(new THREE.Line(geo, aquaLine));
    } else {
      if (!comp1) {
        console.log(
          cn.ConnectionOID,
          cn.part1.PartType,
          "don't have part1 items in the component list",
          id1
        );
      }
      if (!comp2) {
        console.log(
          cn.ConnectionOID,
          cn.part2.PartType,
          "don't have part2 items in the component list",
          id2
        );
      }
    }
  }
  return { model, group };
}
