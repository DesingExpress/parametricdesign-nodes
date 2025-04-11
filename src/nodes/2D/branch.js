import {
  Circle,
  DimStyle,
  GetPointBasedLength,
  GetPointBasedRatio,
  Line,
  Point,
  RotateTrans2D,
  Text,
} from "@nexivil/package-modules";

export function genGraph(partDict, end, mid, dx = 0, dy = 0) {
  //각 브랜치당 대응되는 세그먼트
  let draw = [];
  const scale = 10;
  const fontSize = scale * 2.5;
  //브랜치별로 각 연결되어있는 세그먼트 개수,
  // endIndexList, trunIndexList
  // cp(드로잉을 위한 기준점),
  // motherAngle(외부에서 최초로 들어온 선의 각도)을 정의함(외부점->브랜치점)
  // childrenStatus 작도 여부
  //모든 브랜치에 대한 children 작도후 childrenStatus를 true로 하고 false인 점을 반복하여
  // 브랜치리스트에 대한 항목이 모두 true가 될때까지 반복수행,
  // 최종적으로 연결선이 남아있다면 체크필요(재귀되는 경우), 각 선마다 시점 종점 명시
  //브랜치가 없는 선이 있을 경우 엔드점간의 연결필요
  let branchID = [];
  let endID = [];
  //cp, angle, children으 구성되어있어 정의시
  let segs = [
    ...end.map((s, i) => ({
      name: `E${i}`,
      ids: [s[0], s[s.length - 1]],
    })),
    ...mid.map((s, i) => ({
      name: `M${i}`,
      ids: [s[0], s[s.length - 1]],
    })),
  ];
  for (let s of segs) {
    for (let i of [0, 1]) {
      if (partDict[s.ids[i]].adjacent.length > 2) {
        branchID.push(s.ids[i]);
      }
      if (partDict[s.ids[i]].adjacent.length < 2) {
        endID.push(s.ids[i]);
      }
    }
  }
  //init
  let l = 100;
  let sp = new Point(0, 0);
  let angle = Math.PI / 2;
  let nodeDict = {};
  let nodeNum = 1;
  nodeDict[branchID[0]] = {
    point: sp,
    nodeNum,
    nodeType:
      partDict[branchID[0]].adjacent.length > 2
        ? "B"
        : partDict[branchID[0]].adjacent.length < 2
        ? "E"
        : "M",
  };
  let iter = 0;
  while (branchID.length > 0 && iter < 50) {
    //만약 branchID의 개수가 감소하지 않는다면 연결이 끊긴 그래프일 경우가 있음
    for (let i = 0; i < branchID.length; i++) {
      let id = branchID[i];
      if (nodeDict[id]) {
        sp = nodeDict[id].point;
        branchID.splice(i, 1);
        let children = [];
        //세그먼트 양끝단을 정의
        for (let i = 0; i < segs.length; i++) {
          if (segs[i].ids.includes(id)) {
            children.push({
              segName: segs[i].name,
              id: segs[i].ids[0] === id ? segs[i].ids[1] : segs[i].ids[0],
            });
          }
        }
        let branchCount = children.length + 1;
        let pid = null;
        for (let i = 0; i < children.length; i++) {
          let cid = children[i].id;
          if (nodeDict[cid]) {
            pid = cid;
            children.splice(i, 1);
            break;
          }
        }
        angle = pid
          ? Math.atan2(
              nodeDict[pid].point.y - sp.y,
              nodeDict[pid].point.x - sp.x
            )
          : angle;
        let da = (Math.PI * 2) / branchCount;
        for (let i = 0; i < children.length; i++) {
          angle += da;
          let nodeType =
            partDict[children[i].id].adjacent.length > 2
              ? "B"
              : partDict[children[i].id].adjacent.length < 2
              ? "E"
              : "M";
          if (!nodeDict[children[i].id]) {
            nodeNum++;
            nodeDict[children[i].id] = {
              point: new Point(
                sp.x + Math.cos(angle) * l * (nodeType === "B" ? 2.5 : 1),
                sp.y + Math.sin(angle) * l * (nodeType === "B" ? 2.5 : 1)
              ),
              nodeNum,
              nodeType,
            };
          }
        }
      }
    }
    iter++;
  }
  for (let i in nodeDict) {
    let pt = nodeDict[i].point;
    let r = l / 5;
    let center = new Point(pt.x + dx, pt.y + dy);
    let center2 = new Point(center.x + r, center.y - r);
    let center3 = new Point(center.x + r, center.y + r);
    draw.push(new Circle(center, r, "RED", 32));
    draw.push(
      new Text(
        center,
        String(nodeDict[i].nodeNum),
        fontSize,
        0,
        "center",
        "YELLOW"
      )
    );
    draw.push(
      new Text(
        center3,
        String(partDict[i].lineName),
        fontSize / 2,
        0,
        "left",
        "YELLOW"
      )
    );
    if (nodeDict[i].nodeType === "E") {
      let partName = partDict[i].name;
      // if (partName.includes("N/A") && partDict[i].type) {
      //   partName = partDict[i].type;
      // }
      draw.push(new Text(center2, partName, fontSize / 2, 0, "left", "YELLOW"));
    }
  }
  for (let s of segs) {
    let n1 = nodeDict[s.ids[0]];
    let n2 = nodeDict[s.ids[1]];
    if (n1 && n2) {
      let pt1 = n1.point;
      let pt2 = n2.point;
      let ln = [
        new Point(pt1.x + dx, pt1.y + dy),
        new Point(pt2.x + dx, pt2.y + dy),
      ];
      draw.push(new Line(ln, "MAGENTA", false));
      draw.push(
        new Text(
          GetPointBasedRatio(ln, 0.5),
          String(s.name),
          fontSize / 2,
          0,
          "center",
          "GREEN"
        )
      );
    }
  }
  return draw;
}

export function genBranchDraw2(pointData) {
  let draw = [];
  const scale = 10;
  const fontSize = scale * 2.5;
  // const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
  const group2D = pointData.group2d;
  const group3D = pointData.group3d;
  const partDict3D = group3D.partDict;
  const partDict2D = group2D.partDict;

  let cy = 0;
  let dx = 35 * fontSize;
  let cx = 0;
  console.log("2d", genLine(group2D));
  console.log("3d", genLine(group3D));
  for (let group of group3D.group) {
    cx = 0;
    draw.push(
      ...genGraph(
        partDict3D,
        group.end,
        group.mid,
        cx - fontSize * 200,
        cy - 300
      )
    );
    for (let i = 0; i < group.end.length; i++) {
      let dy = -75 * fontSize;
      draw.push(
        new Text(
          new Point(cx, cy + dy),
          `End${i}`,
          fontSize * 2,
          0,
          "left",
          "CZ-TEX1"
        )
      );
      for (let j = 0; j < group.end[i].length; j++) {
        let cur = group.end[i][j];
        draw.push(
          new Text(
            new Point(cx, cy + dy - fontSize * 3),
            `${partDict3D[cur].name}`,
            fontSize,
            0,
            "left",
            "CS-TEXT"
          )
        );
        dy -= fontSize * 2;
      }
      cx += dx;
    }
    for (let i = 0; i < group.mid.length; i++) {
      let dy = -75 * fontSize;
      draw.push(
        new Text(
          new Point(cx, cy + dy),
          `Mid${i}`,
          fontSize * 2,
          0,
          "left",
          "CZ-TEX1"
        )
      );
      for (let j = 0; j < group.mid[i].length; j++) {
        let cur = group.mid[i][j];
        draw.push(
          new Text(
            new Point(cx, cy + dy - fontSize * 3),
            `${partDict3D[cur].name}`,
            fontSize,
            0,
            "left",
            "CS-TEXT"
          )
        );
        dy -= fontSize * 2;
      }
      cx += dx;
    }
    cy -= 150 * fontSize;
  }
  cy = 0;
  for (let group of group2D.group) {
    cx = 0;
    draw.push(
      ...genGraph(
        partDict2D,
        group.end,
        group.mid,
        cx - fontSize * 100,
        cy - 300
      )
    );
    let lineName = group.lines;
    for (let i = 0; i < lineName.length; i++) {
      draw.push(
        new Text(
          new Point(cx - fontSize * 20, cy - 2.5 * fontSize * i),
          `${lineName[i]}`,
          fontSize * 2,
          0,
          "left",
          "CS-TEXT"
        )
      );
    }
    for (let i = 0; i < group.end.length; i++) {
      let dy = 0;
      draw.push(
        new Text(
          new Point(cx, cy),
          `End${i}`,
          fontSize * 2,
          0,
          "left",
          "CZ-TEX1"
        )
      );
      for (let j = 0; j < group.end[i].length; j++) {
        let cur = group.end[i][j];
        draw.push(
          new Text(
            new Point(cx, cy + dy - fontSize * 3),
            `${partDict2D[cur].name}`,
            fontSize,
            0,
            "left",
            "CS-TEXT"
          )
        );
        dy -= fontSize * 2;
      }
      cx += dx;
    }
    for (let i = 0; i < group.mid.length; i++) {
      let dy = 0;
      draw.push(
        new Text(
          new Point(cx, cy),
          `Mid${i}`,
          fontSize * 2,
          0,
          "left",
          "CZ-TEX1"
        )
      );
      for (let j = 0; j < group.mid[i].length; j++) {
        let cur = group.mid[i][j];
        draw.push(
          new Text(
            new Point(cx, cy + dy - fontSize * 3),
            `${partDict2D[cur].name}`,
            fontSize,
            0,
            "left",
            "CS-TEXT"
          )
        );
        dy -= fontSize * 2;
      }
      cx += dx;
    }
    let lineNum =
      Math.max(...[...group.end, ...group.mid].map((a) => a.length)) * 2 + 5;
    cy -= fontSize * 150;
    cx = 0;
  }
  return draw;
}
export function genLine(group) {
  // let group = pointData.group2d;
  let graphData = [];
  let partDict = group.partDict;
  for (let branch of group.group) {
    let nodeDict = {};
    let connections = [];
    for (let seg of [...branch.mid, ...branch.end]) {
      connections.push([seg[0], seg[seg.length - 1]]);
      for (let i of [0, seg.length - 1]) {
        let id = seg[i];
        let aid = i === 0 ? seg[seg.length - 1] : seg[0];
        if (!nodeDict[id]) {
          let type =
            partDict[id].adjacent.length > 2
              ? "B"
              : partDict[id].adjacent.length < 2
              ? "E"
              : "M";
          nodeDict[id] = {
            id,
            type,
            line: type === "E" ? partDict[aid].lineName : partDict[id].lineName,
            adjacent: [aid],
            name: partDict[id].name,
            partType: partDict[id].type,
          };
        } else {
          if (!nodeDict[id].adjacent.includes(aid)) {
            nodeDict[id].adjacent.push(aid);
          }
        }
      }
    }
    let lineDict = {};
    for (let id in nodeDict) {
      (lineDict[nodeDict[id].line] = lineDict[nodeDict[id].line] || []).push(
        nodeDict[id]
      );
    }
    //가장 번호가 낮은 순서로 선조를 정의 향후 객체 생성시 활용
    let ancientLineNum = Object.keys(lineDict)
      .map((ln) => ln.split("-").pop())
      .sort();
    let representLineName = Object.keys(lineDict).find((a) =>
      a.includes(ancientLineNum[0])
    );
    let lineList = [];
    for (let lineNum of ancientLineNum) {
      let lineName = Object.keys(lineDict).find((a) => a.includes(lineNum));
      let relations = []; //브랜치와 연결된 다른 라인 이름 목록
      let nodes = [...lineDict[lineName]]; //clone
      let mainNodes = []; //주라인 노드 목록
      let subNodesList = [];
      //시작점은 End로 구성함 만약 시작점이 없는 경우 임의점으로 시작
      //1차 필터링
      let start = lineDict[lineName].filter(
        (n) => n.type === "E" && !n.name.includes("N/A")
      );
      //2차 필터링, 미포함 언어
      if (start.length > 1) {
        let start2 = start.filter(
          (n) => !n.partType.includes("Plug") && !n.partType.includes("Branch")
        );
        if (start2.length > 0) {
          start = start2;
        }
      }
      //3차 필터링 포함 언어
      if (start.length > 1) {
        let start3 = start.filter(
          (n) => n.partType.includes("Equip") || n.partType.includes("Nozzle")
        );
        if (start3.length > 0) {
          start = start3;
        }
      }
      let endNode = start.length > 0 ? start[0] : lineDict[lineName][0];
      if (endNode.type === "E") {
        let cur = endNode;
        let ii = nodes.findIndex((node) => node.id === cur.id);
        nodes.splice(ii, 1);
        let iter = 0;
        let maxIter = nodes.length;
        mainNodes.push(cur);
        while (iter < maxIter) {
          let adj = cur.adjacent ?? [];
          let nextList = nodes.filter((node) => adj.includes(node.id));
          for (let i = nodes.length - 1; i > -1; i--) {
            if (nextList.some((node) => node.id === nodes[i].id)) {
              // nodes.splice(i, 1);
            }
          }
          //재귀조건으로 자손이 브랜치인 노드를 우선적으로 선별, 만약 엔드노드인 경우 시작 엔드노드 조회방법을 활용해야함
          let nextList2 = nextList.filter((node) => node.type === "B");
          if (nextList2.length > 0) {
            nextList = nextList2;
          }
          let nextList3 = nextList.filter((node) =>
            node.adjacent.some((id) => nodeDict[id].type === "B")
          );
          if (nextList3.length > 0) {
            nextList = nextList3;
          }
          //4차필터링 브랜치랑 연결된 노드가 다른 라인에 있는 경우 우선 선별
          let nextList4 = nextList.filter((node) =>
            node.adjacent.some((id) => nodeDict[id].line !== lineName)
          );
          if (nextList4.length > 0) {
            nextList = nextList4;
          }
          if (nextList.length > 0) {
            let next = nextList[0]; //우선순위를 선별해서 넣어야 함. 임시로 첫번째 항목을 넣음
            mainNodes.push(next);
            let ni = nodes.findIndex((node) => node.id === next.id);
            nodes.splice(ni, 1);
            cur = next;
          } else {
            //만약 후순위 노드가 없으면 반복문을 중단함
            break;
          }
          iter++;
        }

        //subNode가 존재하는 판별식
        let subEndnodes = nodes.filter(
          (node) =>
            node.type === "B" &&
            ![mainNodes, ...subNodesList]
              .flat()
              .map((n) => n.id)
              .includes(node.id)
        );
        let iter2 = 0;
        let maxIter2 = subEndnodes.length;
        while (subEndnodes.length > 0 && iter2 < maxIter2) {
          cur = subEndnodes[0];
          let subNodes = [];
          let ii = nodes.findIndex((node) => node.id === cur.id);
          nodes.splice(ii, 1);
          subNodes.push(cur);
          //위의 반복문 복붙
          let iter = 0;
          while (iter < maxIter) {
            let adj = cur.adjacent ?? [];
            let nextList = nodes.filter((node) => adj.includes(node.id));
            for (let i = nodes.length - 1; i > -1; i--) {
              if (nextList.some((node) => node.id === nodes[i].id)) {
                nodes.splice(i, 1);
              }
            }
            //재귀조건으로 자손이 브랜치인 노드를 우선적으로 선별, 만약 엔드노드인 경우 시작 엔드노드 조회방법을 활용해야함
            let nextList2 = nextList.filter((node) => node.type === "B");
            if (nextList2.length > 0) {
              nextList = nextList2;
            }
            let nextList3 = nextList.filter((node) =>
              node.adjacent.some((id) => nodeDict[id].type === "B")
            );
            if (nextList3.length > 0) {
              nextList = nextList3;
            }
            //4차필터링 브랜치랑 연결된 노드가 다른 라인에 있는 경우 우선 선별
            let nextList4 = nextList.filter((node) =>
              node.adjacent.some((id) => nodeDict[id].line !== lineName)
            );
            if (nextList4.length > 0) {
              nextList = nextList4;
            }
            if (nextList.length > 0) {
              let next = nextList[0]; //우선순위를 선별해서 넣어야 함. 임시로 첫번째 항목을 넣음
              subNodes.push(next);
              let ni = nodes.findIndex((node) => node.id === next.id);
              nodes.splice(ni, 1);
              cur = next;
            } else {
              //만약 후순위 노드가 없으면 반복문을 중단함
              break;
            }
            iter++;
          }
          subNodesList.push(subNodes);
          //
          subEndnodes = lineDict[lineName].filter(
            (node) =>
              node.type === "B" &&
              ![mainNodes, ...subNodesList]
                .flat()
                .map((n) => n.id)
                .includes(node.id)
          );
          iter2++;
        }
        //만약 branch노드가 남아있을 경우 mainNodes가 정의되는 방식으로 브랜치로 갈라져나오는 subNodes를 정의
      } else {
        //현재는 모든 라인 케이스가 엔드노드(type ==="E")를 포함하고 있어서 고려하지 않음
      }
      //다른 라인간의 연결 관계를 정의
      for (let node of lineDict[lineName]) {
        for (let aid of node.adjacent) {
          if (nodeDict[aid].line !== lineName) {
            relations.push({
              parentID: node.id,
              childrenID: aid,
              line: nodeDict[aid].line,
            });
          }
        }
      }
      lineList.push({
        lineName,
        mainNodes,
        subNodesList,
        nodes: lineDict[lineName],
        relations,
      });
    }
    //드로잉 순서를 정하기 위한 세대 배열 생성
    let generation = [[representLineName]]; //1세대
    let lineNameList = lineList.slice(1).map((l) => l.lineName); //첫번째를 리스트를 제거 후 목록
    let iter = 0;
    let maxIter = lineNameList.length;
    while (lineNameList.length > 0 && iter < maxIter) {
      let sub = [];
      for (let lineName of generation[generation.length - 1]) {
        let line = lineList.find((a) => a.lineName === lineName);
        for (let rel of line.relations) {
          let ri = lineNameList.findIndex((a) => a === rel.line);
          if (ri > -1) {
            sub.push(rel.line);
            lineNameList.splice(ri, 1);
          }
        }
      }
      if (sub.length > 0) {
        generation.push(sub.sort());
      }
      iter++;
    }
    graphData.push({ representLineName, lineList, generation, connections });
  }
  return graphData;
}

export function draw2D3DCompare(pointData) {
  let draw = [];
  const scale = 10;
  const fontSize = scale * 2.5;
  // const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
  const group2D = pointData.group2d;
  const group3D = pointData.group3d;
  // const partDict3D = group3D.partDict;
  // const partDict2D = group2D.partDict;
  let cy = 0;
  let dy = 100 * fontSize;
  let cx = 0;
  let graphData2d = genLine(group2D);
  let graphData3d = genLine(group3D);
  console.log("2d", graphData2d);
  console.log("3d", graphData3d);
  for (let lineObj of graphData2d) {
    let subDraw = drawGraph(lineObj);
    draw.push(RotateTrans2D(subDraw, new Point(0, 0), cx, cy, 0, 1));
    cy -= dy;
  }
  cy = 0;
  cx = 200 * fontSize;
  for (let lineObj of graphData3d) {
    let subDraw = drawGraph(lineObj);
    draw.push(RotateTrans2D(subDraw, new Point(0, 0), cx, cy, 0, 1));
    cy -= dy;
  }
  return draw;
}

export function drawGraph(lineObj) {
  let draw = [];
  const scale = 10;
  const fontSize = scale * 2.5;
  // const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
  let l = fontSize * 10;
  let r = fontSize;
  let nodeDict = {};
  let lineList = lineObj.lineList;
  let generation = lineObj.generation;
  let connections = lineObj.connections;

  for (let i = 0; i < lineList.length; i++) {
    let line = lineList[i];
    let dx = 0;
    let dy = 0;
    if (i > 0) {
      line.mainNodes.reverse();
    }
    let node0 = line.mainNodes[0];
    nodeDict[node0.id] = {
      ...node0,
      point: new Point(dx, dy),
    };
    for (let j = 1; j < line.mainNodes.length; j++) {
      let node1 = line.mainNodes[j - 1];
      let node = line.mainNodes[j];
      dx += l * (node.type === "B" && node1.type === "B" ? 2.5 : 1);
      nodeDict[node.id] = {
        ...node,
        point: new Point(dx, dy),
      };
    }
    for (let s = 0; s < line.subNodesList.length; s++) {
      dy -= (s + 1) * l * 1.5;
      let subNodes = line.subNodesList[s];
      let subNode0 = subNodes[0];
      //dx에 대한 갱신
      let parentOfSubNode = line.mainNodes.find((n) =>
        subNode0.adjacent.includes(n.id)
      );
      if (parentOfSubNode) {
        dx = nodeDict[parentOfSubNode.id].point.x;
      }
      dx += l*0.4;
      nodeDict[subNode0.id] = {
        ...subNode0,
        point: new Point(dx, dy),
      };
      for (let j = 1; j < subNodes.length; j++) {
        let node1 = subNodes[j - 1];
        let node = subNodes[j];
        dx += l * (node.type === "B" && node1.type === "B" ? 2.5 : 1);
        nodeDict[node.id] = {
          ...node,
          point: new Point(dx, dy),
        };
      }
    }

    let endids = line.nodes.filter((n) => n.type === "E").map((n) => n.id);
    for (let j = 0; j < line.nodes.length; j++) {
      let node = line.nodes[j];
      if (node.type === "B" && nodeDict[node.id]) {
        let endNodes = [];
        let pt = nodeDict[node.id].point;
        for (let id of node.adjacent) {
          if (!nodeDict[id] && endids.includes(id)) {
            endNodes.push(line.nodes.find((n) => n.id === id));
          }
        }
        let angle = -Math.PI;
        let da = Math.PI / (endNodes.length + 1);
        for (let k = 0; k < endNodes.length; k++) {
          angle += da;
          let node = endNodes[k];
          nodeDict[node.id] = {
            ...node,
            point: new Point(
              pt.x + Math.cos(angle) * l,
              pt.y + Math.sin(angle) * l
            ),
          };
        }
      }
    }
  }
  //generation 순으로 평행이동
  for (let i = 1; i < generation.length; i++) {
    let parent = generation[i - 1];
    for (let j = 0; j < generation[i].length; j++) {
      let lineName = generation[i][j];
      let line = lineList.find((a) => a.lineName === lineName);
      let relations = line.relations;
      let dx = 0;
      let dy = -l * 2.5 * i;
      let sign = j % 2 === 0 ? 1 : -1;
      let dist = (Math.floor(j / 2) + 1) * l * 2.5;
      for (let rel of relations) {
        if (
          parent.includes(rel.line) &&
          nodeDict[rel.childrenID] &&
          nodeDict[rel.parentID]
        ) {
          dx =
            nodeDict[rel.childrenID].point.x -
            nodeDict[rel.parentID].point.x +
            l * 1.25;
          dy =
            nodeDict[rel.childrenID].point.y -
            nodeDict[rel.parentID].point.y -
            sign * dist;
          break;
        }
      }
      for (let node of line.nodes) {
        if (nodeDict[node.id]) {
          nodeDict[node.id].point = new Point(
            nodeDict[node.id].point.x + dx,
            nodeDict[node.id].point.y + dy
          );
        }
      }
    }
  }
  for (let line of lineList) {
    let pt0 = nodeDict[line.mainNodes[0].id].point;
    let anchor = new Point(pt0.x - r * 2, pt0.y);
    draw.push(
      new Text(
        anchor,
        String(line.lineName),
        fontSize * 2,
        0,
        "right",
        "MAGENTA"
      )
    );
    for (let i = 0; i < line.nodes.length; i++) {
      let id = line.nodes[i].id;
      let node = nodeDict[id];
      if (node) {
        let pt = node.point;
        let pt2 = new Point(pt.x + r, pt.y - r);
        let pt3 = new Point(pt.x + r, pt.y + r);
        draw.push(new Circle(node.point, r, "RED", 32));
        draw.push(
          new Text(pt, String(node.type), fontSize, 0, "center", "YELLOW")
        );
        if (node.type === "E") {
          draw.push(
            new Text(pt2, String(node.name), fontSize / 2, 0, "left", "YELLOW")
          );
        }
        draw.push(
          new Text(
            pt3,
            String(node.partType),
            fontSize / 2,
            0,
            "left",
            "YELLOW"
          )
        );
      }
    }
  }
  for (let c of connections) {
    let n1 = nodeDict[c[0]];
    let n2 = nodeDict[c[1]];
    if (n1 && n2) {
      let l = [n1.point, n2.point];
      let p1 = GetPointBasedLength(l, r);
      let p2 = GetPointBasedLength(l.reverse(), r);
      draw.push(new Line([p1, p2], "MAGENTA", false));
    }
  }
  return draw;
}
