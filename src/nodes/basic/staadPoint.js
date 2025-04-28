import { Point } from "@nexivil/package-modules";

export function staadPoint(input0) {
  let r = 1000;
  let input = {};
  for (let sheet of input0) {
    let arr = [];
    let column = sheet.data[0];
    for (let j = 1; j < sheet.data.length; j++) {
      let data = {};
      for (let i = 0; i < column.length; i++) {
        data[column[i]] = sheet.data[j][i];
      }
      arr.push(data)
    }
    input[sheet.name] = { column, data : arr}
  }
  console.log(input);
  let steelMember = input.steelMember.data.filter(o=> o.structureMember===0).map((o) => ({
    name: o.memberPartName,
    point: [
      new Point(o.startX * r, o.startY * r, o.startZ * r),
      new Point(o.endX * r, o.endY * r, o.endZ * r),
    ],
    type: o.type,
    section: o.section,
    typeCategory: o.typeCategory,
    width: o.steelWidth * r,
    height: o.steelDepth * r,
    angle: o.angle,
  }));
  let pipeLine = input.pipeLine.data.map((o) => {
    let out = {
      name: o.partDescription,
      lineName: o.lineName,
      runName: o.runName,
      id: o.partOid,
      type: o.type,
      point: new Point(o.originX, o.originY, o.originZ),
    };
    if (o.portIndex1) {
      out["port1"] = {
        dia: o.pipeOD1,
        wallTHK: o.wallTHK1,
        point: new Point(
          o.portPostitionX1,
          o.portPostitionY1,
          o.portPostitionZ1
        ),
        npd: o.npd1,
      };
    }
    if (o.portIndex2) {
      out["port2"] = {
        dia: o.pipeOD2,
        wallTHK: o.wallTHK2,
        point: new Point(
          o.portPostitionX2,
          o.portPostitionY2,
          o.portPostitionZ2
        ),
        npd: o.npd2,
      };
    }
    if (o.portIndex3) {
      out["port3"] = {
        dia: o.pipeOD3,
        wallTHK: o.wallTHK3,
        point: new Point(
          o.portPostitionX3,
          o.portPostitionY3,
          o.portPostitionZ3
        ),
        npd: o.npd3,
      };
    }
    if (o.portIndex4) {
      out["port4"] = {
        dia: o.pipeOD4,
        wallTHK: o.wallTHK4,
        point: new Point(
          o.portPostitionX4,
          o.portPostitionY4,
          o.portPostitionZ4
        ),
        npd: o.npd4,
      };
    }
    return out;
  });

  let support = input.support.data.map((o) => ({
    name: o.supportName,
    componentName: o.componentName,
    lineName: o.lineName,
    runName: o.runName,
    itemType: o.itemType,
    point: [
      new Point(o.max_X, o.max_Y, o.max_Z),
      new Point(o.min_X, o.min_Y, o.min_Z),
    ],
  }));
  return { steelMember, pipeLine, support };
}
