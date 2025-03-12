import { Point } from "@nexivil/package-modules";

export function staadPoint(input) {
  let r = 1000;
  console.log(input);
  let steelMember = input.rawData.steelMember.data.map((o) => ({
    name: o.memberPartName,
    point: [
      new Point(o.startX * r, o.startY * r, o.startZ * r),
      new Point(o.endX * r, o.endY * r, o.endZ * r),
    ],
    width: o.steelWidth * r,
    height: o.steelDepth * r,
    angle: o.angle,
  }));
  let pipeLine = input.rawData.PipeLine.data.map((o) => ({
    name: o.partDescription,
    lineName: o.lineName,
    runName: o.runName,
    type: o.type,
    point: new Point(o.originX, o.originY, o.originZ),
  }));

  let support = input.rawData.support.data.map((o) => ({
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
  console.log(support)
  return { steelMember, pipeLine, support };
}
