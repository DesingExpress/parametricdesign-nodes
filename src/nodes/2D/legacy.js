// export function genGraph(partDict, end, mid, dx = 0, dy = 0) {
//   //각 브랜치당 대응되는 세그먼트
//   let draw = [];
//   const scale = 10;
//   const fontSize = scale * 2.5;
//   //브랜치별로 각 연결되어있는 세그먼트 개수,
//   // endIndexList, trunIndexList
//   // cp(드로잉을 위한 기준점),
//   // motherAngle(외부에서 최초로 들어온 선의 각도)을 정의함(외부점->브랜치점)
//   // childrenStatus 작도 여부
//   //모든 브랜치에 대한 children 작도후 childrenStatus를 true로 하고 false인 점을 반복하여
//   // 브랜치리스트에 대한 항목이 모두 true가 될때까지 반복수행,
//   // 최종적으로 연결선이 남아있다면 체크필요(재귀되는 경우), 각 선마다 시점 종점 명시
//   //브랜치가 없는 선이 있을 경우 엔드점간의 연결필요
//   let branchID = [];
//   let endID = [];
//   //cp, angle, children으 구성되어있어 정의시
//   let segs = [
//     ...end.map((s, i) => ({
//       name: `E${i}`,
//       ids: [s[0], s[s.length - 1]],
//     })),
//     ...mid.map((s, i) => ({
//       name: `M${i}`,
//       ids: [s[0], s[s.length - 1]],
//     })),
//   ];
//   for (let s of segs) {
//     for (let i of [0, 1]) {
//       if (partDict[s.ids[i]].adjacent.length > 2) {
//         branchID.push(s.ids[i]);
//       }
//       if (partDict[s.ids[i]].adjacent.length < 2) {
//         endID.push(s.ids[i]);
//       }
//     }
//   }
//   //init
//   let l = 100;
//   let sp = new Point(0, 0);
//   let angle = Math.PI / 2;
//   let nodeDict = {};
//   let nodeNum = 1;
//   nodeDict[branchID[0]] = {
//     point: sp,
//     nodeNum,
//     nodeType:
//       partDict[branchID[0]].adjacent.length > 2
//         ? "B"
//         : partDict[branchID[0]].adjacent.length < 2
//         ? "E"
//         : "M",
//   };
//   let iter = 0;
//   while (branchID.length > 0 && iter < 50) {
//     //만약 branchID의 개수가 감소하지 않는다면 연결이 끊긴 그래프일 경우가 있음
//     for (let i = 0; i < branchID.length; i++) {
//       let id = branchID[i];
//       if (nodeDict[id]) {
//         sp = nodeDict[id].point;
//         branchID.splice(i, 1);
//         let children = [];
//         //세그먼트 양끝단을 정의
//         for (let i = 0; i < segs.length; i++) {
//           if (segs[i].ids.includes(id)) {
//             children.push({
//               segName: segs[i].name,
//               id: segs[i].ids[0] === id ? segs[i].ids[1] : segs[i].ids[0],
//             });
//           }
//         }
//         let branchCount = children.length + 1;
//         let pid = null;
//         for (let i = 0; i < children.length; i++) {
//           let cid = children[i].id;
//           if (nodeDict[cid]) {
//             pid = cid;
//             children.splice(i, 1);
//             break;
//           }
//         }
//         angle = pid
//           ? Math.atan2(
//               nodeDict[pid].point.y - sp.y,
//               nodeDict[pid].point.x - sp.x
//             )
//           : angle;
//         let da = (Math.PI * 2) / branchCount;
//         for (let i = 0; i < children.length; i++) {
//           angle += da;
//           let nodeType =
//             partDict[children[i].id].adjacent.length > 2
//               ? "B"
//               : partDict[children[i].id].adjacent.length < 2
//               ? "E"
//               : "M";
//           if (!nodeDict[children[i].id]) {
//             nodeNum++;
//             nodeDict[children[i].id] = {
//               point: new Point(
//                 sp.x + Math.cos(angle) * l * (nodeType === "B" ? 2.5 : 1),
//                 sp.y + Math.sin(angle) * l * (nodeType === "B" ? 2.5 : 1)
//               ),
//               nodeNum,
//               nodeType,
//             };
//           }
//         }
//       }
//     }
//     iter++;
//   }
//   for (let i in nodeDict) {
//     let pt = nodeDict[i].point;
//     let r = l / 5;
//     let center = new Point(pt.x + dx, pt.y + dy);
//     let center2 = new Point(center.x + r, center.y - r);
//     let center3 = new Point(center.x + r, center.y + r);
//     draw.push(new Circle(center, r, "RED", 32));
//     draw.push(
//       new Text(
//         center,
//         String(nodeDict[i].nodeNum),
//         fontSize,
//         0,
//         "center",
//         "YELLOW"
//       )
//     );
//     draw.push(
//       new Text(
//         center3,
//         String(partDict[i].lineName),
//         fontSize / 2,
//         0,
//         "left",
//         "YELLOW"
//       )
//     );
//     if (nodeDict[i].nodeType === "E") {
//       let partName = partDict[i].name;
//       // if (partName.includes("N/A") && partDict[i].type) {
//       //   partName = partDict[i].type;
//       // }
//       draw.push(new Text(center2, partName, fontSize / 2, 0, "left", "YELLOW"));
//     }
//   }
//   for (let s of segs) {
//     let n1 = nodeDict[s.ids[0]];
//     let n2 = nodeDict[s.ids[1]];
//     if (n1 && n2) {
//       let pt1 = n1.point;
//       let pt2 = n2.point;
//       let ln = [
//         new Point(pt1.x + dx, pt1.y + dy),
//         new Point(pt2.x + dx, pt2.y + dy),
//       ];
//       draw.push(new Line(ln, "MAGENTA", false));
//       draw.push(
//         new Text(
//           GetPointBasedRatio(ln, 0.5),
//           String(s.name),
//           fontSize / 2,
//           0,
//           "center",
//           "GREEN"
//         )
//       );
//     }
//   }
//   return draw;
// }
// export function genBranchDraw2(pointData) {
//   let draw = [];
//   const scale = 10;
//   const fontSize = scale * 2.5;
//   // const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
//   const group2D = pointData.group2d;
//   const group3D = pointData.group3d;
//   const partDict3D = group3D.partDict;
//   const partDict2D = group2D.partDict;

//   let cy = 0;
//   let dx = 35 * fontSize;
//   let cx = 0;
//   console.log("2d", genLine(group2D));
//   console.log("3d", genLine(group3D));
//   for (let group of group3D.group) {
//     cx = 0;
//     draw.push(
//       ...genGraph(
//         partDict3D,
//         group.end,
//         group.mid,
//         cx - fontSize * 200,
//         cy - 300
//       )
//     );
//     for (let i = 0; i < group.end.length; i++) {
//       let dy = -75 * fontSize;
//       draw.push(
//         new Text(
//           new Point(cx, cy + dy),
//           `End${i}`,
//           fontSize * 2,
//           0,
//           "left",
//           "CZ-TEX1"
//         )
//       );
//       for (let j = 0; j < group.end[i].length; j++) {
//         let cur = group.end[i][j];
//         draw.push(
//           new Text(
//             new Point(cx, cy + dy - fontSize * 3),
//             `${partDict3D[cur].name}`,
//             fontSize,
//             0,
//             "left",
//             "CS-TEXT"
//           )
//         );
//         dy -= fontSize * 2;
//       }
//       cx += dx;
//     }
//     for (let i = 0; i < group.mid.length; i++) {
//       let dy = -75 * fontSize;
//       draw.push(
//         new Text(
//           new Point(cx, cy + dy),
//           `Mid${i}`,
//           fontSize * 2,
//           0,
//           "left",
//           "CZ-TEX1"
//         )
//       );
//       for (let j = 0; j < group.mid[i].length; j++) {
//         let cur = group.mid[i][j];
//         draw.push(
//           new Text(
//             new Point(cx, cy + dy - fontSize * 3),
//             `${partDict3D[cur].name}`,
//             fontSize,
//             0,
//             "left",
//             "CS-TEXT"
//           )
//         );
//         dy -= fontSize * 2;
//       }
//       cx += dx;
//     }
//     cy -= 150 * fontSize;
//   }
//   cy = 0;
//   for (let group of group2D.group) {
//     cx = 0;
//     draw.push(
//       ...genGraph(
//         partDict2D,
//         group.end,
//         group.mid,
//         cx - fontSize * 100,
//         cy - 300
//       )
//     );
//     let lineName = group.lines;
//     for (let i = 0; i < lineName.length; i++) {
//       draw.push(
//         new Text(
//           new Point(cx - fontSize * 20, cy - 2.5 * fontSize * i),
//           `${lineName[i]}`,
//           fontSize * 2,
//           0,
//           "left",
//           "CS-TEXT"
//         )
//       );
//     }
//     for (let i = 0; i < group.end.length; i++) {
//       let dy = 0;
//       draw.push(
//         new Text(
//           new Point(cx, cy),
//           `End${i}`,
//           fontSize * 2,
//           0,
//           "left",
//           "CZ-TEX1"
//         )
//       );
//       for (let j = 0; j < group.end[i].length; j++) {
//         let cur = group.end[i][j];
//         draw.push(
//           new Text(
//             new Point(cx, cy + dy - fontSize * 3),
//             `${partDict2D[cur].name}`,
//             fontSize,
//             0,
//             "left",
//             "CS-TEXT"
//           )
//         );
//         dy -= fontSize * 2;
//       }
//       cx += dx;
//     }
//     for (let i = 0; i < group.mid.length; i++) {
//       let dy = 0;
//       draw.push(
//         new Text(
//           new Point(cx, cy),
//           `Mid${i}`,
//           fontSize * 2,
//           0,
//           "left",
//           "CZ-TEX1"
//         )
//       );
//       for (let j = 0; j < group.mid[i].length; j++) {
//         let cur = group.mid[i][j];
//         draw.push(
//           new Text(
//             new Point(cx, cy + dy - fontSize * 3),
//             `${partDict2D[cur].name}`,
//             fontSize,
//             0,
//             "left",
//             "CS-TEXT"
//           )
//         );
//         dy -= fontSize * 2;
//       }
//       cx += dx;
//     }
//     let lineNum =
//       Math.max(...[...group.end, ...group.mid].map((a) => a.length)) * 2 + 5;
//     cy -= fontSize * 150;
//     cx = 0;
//   }
//   return draw;
// }