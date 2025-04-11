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
  let l = 50;
  let shape = [
    new Point(l, l),
    new Point(-l, l),
    new Point(-l, -l),
    new Point(l, -l),
  ];
  const partDict = pointData.group3d.partDict;
  const runDict = pointData.group3d.runDict;
  const group3d = pointData.group3d.group;
  for (let a of pointData.components) {
    let ref = new RefPoint(a.point, new Point(1, 0), 0);
    if(partDict[a.PartOID]){
      let r = runDict[partDict[a.PartOID].runOID];
      if (r) {
        model.push(
          new Extrude(shape, 2 * l, { refPoint: ref }, "cyan", {
            name: r.lineName,
            part: r.runName,
            key: a.PartOID,
          })
        );
        let text = new SpriteText(a.partName, 150, "yellow");
        text.position.set(a.point.x, a.point.y, a.point.z);
        text.layers.set(0);
        group.add(text);
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
  for (let part of group3d) {
    for (let key of ["end", "mid"]) {
      let endNum = 0;
      for (let ids of part[key]) {
        let l = ids.map(
          (id) =>
            new THREE.Vector3(
              partDict[id].point.x,
              partDict[id].point.y,
              partDict[id].point.z
            )
        );
        // let group = new THREE.Group();
        // for (let id of ids) {
        //   let a = partDict[id];
        //   let ref = new RefPoint(a.point, new Point(1, 0), 0);
        //   model.push(
        //     new Extrude(shape, 2 * l, { refPoint: ref }, "cyan", {
        //       name: `part${partNum}`,
        //       part: `${key}${endNum}`,
        //       key: "component",
        //     })
        //   );
        //   let text = new SpriteText(a.partName, 150, "yellow");
        //   text.position.set(a.point.x, a.point.y, a.point.z);
        //   text.layers.set(0);
        //   group.add(text);
        // }
        // group["userData"] = {
        //   name: `part${partNum}`,
        //   part: `${key}${endNum}`,
        //   key: "label",
        // };
        // mesh.push(group)
        let geo = new THREE.BufferGeometry().setFromPoints(l);
        let lineMesh = new THREE.Line(geo, aquaLine);
        let r = runDict[partDict[ids[ids.length-2]].runOID];
        lineMesh["userData"] = {
          name: r.lineName,
          part: r.runName,
          key: `${key}${endNum}`,
        };
        mesh.push(lineMesh);
        endNum++;
      }
    }
  }
  mesh.push(group);
  return { model, mesh };
}
