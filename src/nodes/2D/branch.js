import {
  Circle,
  GetPointBasedLength,
  Line,
  Point,
  RotateTrans2D,
  Text,
} from "@nexivil/package-modules";

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
  let dy = 50 * fontSize;
  let cx = 0;
  let graphData2d = genLine(group2D);
  let graphData3d = genLine(group3D);
  console.log("2d", graphData2d);
  console.log("3d", graphData3d);
  for (let lineObj of graphData2d) {
    let subDraw = drawGraph(lineObj);
    draw.push(...RotateTrans2D(subDraw, new Point(0, 0), cx, cy, 0, 1));
    cy -= dy;
  }
  cy = 0;
  cx = 150 * fontSize;
  for (let lineObj of graphData3d) {
    let subDraw = drawGraph(lineObj);
    draw.push(...RotateTrans2D(subDraw, new Point(0, 0), cx, cy, 0, 1));
    cy -= dy;
  }
  return draw;
}

export function drawGraph(lineObj) {
  let draw = [];
  const scale = 10;
  const fontSize = scale * 2.5;
  // const style = new DimStyle("dimstyle1", scale, 3, { DIMADEC: 1 });
  let l = fontSize * 6;
  let r = fontSize;
  let nodeDict = {};
  let lineList = lineObj.lineList;
  let generation = lineObj.generation;
  let connections = lineObj.connections;

  for (let i = 0; i < lineList.length; i++) {
    let line = lineList[i];
    let dx = 0;
    let dy = 0;
    for (let j = 0; j < line.mainNodes.length; j++) {
      let node = line.mainNodes[j];
      nodeDict[node.id] = {
        ...node,
        point: new Point(dx, dy),
      };
      dx += l * 1.6;
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
      dx += l * 0.4;
      for (let j = 0; j < subNodes.length; j++) {
        let node = subNodes[j];
        nodeDict[node.id] = {
          ...node,
          point: new Point(dx, dy),
        };
        dx += l * 1.6;
      }
    }
    let endids = line.nodes.filter((n) => n.nodeType === "E").map((n) => n.id);
    for (let j = 0; j < line.nodes.length; j++) {
      let node = line.nodes[j];
      if (node.nodeType === "B" && nodeDict[node.id]) {
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
      //모든 노드 중심점 이동
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
          new Text(pt, String(node.nodeType), fontSize, 0, "center", "YELLOW")
        );
        // if (node.type === "E") {
        draw.push(
          new Text(pt2, String(node.name), fontSize / 3, 0, "left", "YELLOW")
        );
        // }
        draw.push(
          new Text(
            pt3,
            String(node.partType),
            fontSize / 3,
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

export function genLine(group) {
  let graphData = [];
  let partDict = group.partDict;
  //lineData = {대표라인이름, 라인객체배열 : {
  // lineName,
  // mainNodes,
  // subNodesList,
  // nodes: lineDict[lineName],
  // relations}
  // , 세대관계, 연결노드 배열}
  for (let segment of group.cluster) {
    let endNodeDict = {};
    let connections = [];
    for (let seg of [...segment.mid, ...segment.end]) {
      connections.push([seg[0], seg[seg.length - 1]]);
      for (let i of [0, seg.length - 1]) {
        let id = seg[i];
        let aid = i === 0 ? seg[seg.length - 1] : seg[0];
        if (!endNodeDict[id]) {
          let nodeType =
            partDict[id].adjacent.length > 2
              ? "B"
              : partDict[id].adjacent.length < 2
              ? "E"
              : "M";
          endNodeDict[id] = {
            ...partDict[id],
            id,
            nodeType,
            adjacent: [aid],
            line:
              nodeType === "E" ? partDict[aid].lineName : partDict[id].lineName,
          };
        } else {
          if (!endNodeDict[id].adjacent.includes(aid)) {
            endNodeDict[id].adjacent.push(aid);
          }
        }
      }
    }
    let lineDict = {};
    for (let id in endNodeDict) {
      (lineDict[endNodeDict[id].line] =
        lineDict[endNodeDict[id].line] || []).push(endNodeDict[id]);
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
      let align = alignNode(lineDict[lineName]);
      let mainNodes = align.mainNodes; //주라인 노드 목록
      let subNodesList = align.subNodesList;
      //다른 라인간의 연결 관계를 정의
      for (let node of lineDict[lineName]) {
        for (let aid of node.adjacent) {
          if (endNodeDict[aid].line !== lineName) {
            relations.push({
              parentID: node.id, //각각 포트번호가 명시되어야 함
              childrenID: aid, //각각 포트번호 명시 필요
              line: endNodeDict[aid].line,
            });
          }
        }
      }
      //mainNodes를 확장
      //3개 초과 이웃을 가진 B 노드 복재
      let nodes = [...lineDict[lineName]];
      let ids = nodes.map((n) => n.id); //동일라인 내에 있는 객체
      let newMainNodes = [];
      //메인노드와 서브노드는 모두 브랜치로만 구성되어 있으며, 브랜치는 자식노드의 개수만큼의 포트를 3개이상 보유하고 있음
      //모든 브랜치 노드는 포트별로 ID를 새로 구성하는 connections 정보를 갱신해야 하며, relation도 마찬가지임
      //부모노드와 자식노드가 상대적으로 서로 맞물려 있음
      //포트번호는 메인노드 서브노드 라인별로 구성되며, 포트번호는 시퀀스 순서에 맞추어 생성해야 한다.
      //3차원의 경우 시점에서부터 공간적 거리로 순차적으로 부여되며, 메인라인/서브라인의 방향에 따라 순서가 정의되어야 한다.
      //2차원의 경우 별도의 정보가 없지만, 입력항목의 순서(인덱스) 번호가 시퀀스번호와 동일하다고 가정한다.
      //현재 동일 라인의 시점과 종점 포트에 대한 순서정의 알고리즘이 없음.
      //console.log(lineName, mainNodes.map(n=>n.adjacent.map(a=>partDict[a].index)))

      for (let j = 0; j < mainNodes.length; j++) {
        let b = mainNodes[j];
        let excludeNodes = [];
        if (j === 0 || j === mainNodes.length - 1) {
          let adjs = b.adjacent
            .filter(
              (id) =>
                !mainNodes.map((n) => n.id).includes(id) && ids.includes(id)
            )
            .sort((a, b) => partDict[a].index - partDict[b].index); //메인노드라인에 단부를 추가하기 위한 함수를 정의해야함
          if (adjs.length > 0) {
            excludeNodes.push(...adjs.slice(0, mainNodes.length === 1 ? 2 : 1));
          }
        }
        if (j === 0) {
          if (excludeNodes.length > 0) {
            newMainNodes.push(endNodeDict[excludeNodes[0]]);
          }
        }
        newMainNodes.push(b);
        if (j === mainNodes.length - 1) {
          if (excludeNodes.length > 0) {
            let endId =
              excludeNodes.length > 1 ? excludeNodes[1] : excludeNodes[0];
            newMainNodes.push(endNodeDict[endId]);
          }
        }
      }

      // for (let j = 0; j < mainNodes.length; j++) {
      //   let b = mainNodes[j];
      //   let adjLength = b.adjacent.length;
      //   let lastID = b.id;

      //   if (j === 0 || j === mainNodes.length - 1) {
      //     let adjs = b.adjacent.filter(
      //       (id) =>
      //         ids.includes(id) &&
      //         endNodeDict[id].nodeType === "E" &&
      //         !newMainNodes.map((n) => n.id).includes(id)
      //     ); //메인노드라인에 단부를 추가하기 위한 함수를 정의해야함
      //     if (adjs.length > 0) {
      //       excludeNodes.push(...adjs.slice(0, mainNodes.length === 1 ? 2 : 1));
      //       if (j === 0) {
      //         newMainNodes.push(endNodeDict[adjs[0]]);
      //         connections.push([adjs[0], lastID]);
      //       }
      //     }
      //   }
      //   let adjRemains = b.adjacent.filter(
      //     (id) =>
      //       !excludeNodes.includes(id) &&
      //       !mainNodes.map((n) => n.id).includes(id)
      //   );
      //   if(adjLength<4){
      //     newMainNodes.push(b);
      //     connections.push([adjRemains[0], b.id])
      //   }
      //   for (let i = 0; i < adjLength - 3; i++) {

      //     let newID = b.id + "@" + String(i);
      //     connections.push([lastID, newID]);
      //     if(i===0){
      //       b.adjacent = [excludeNodes[0], adjRemains[0], newID]
      //       newMainNodes.push(b);
      //       connections.push(adjRemains[0], b.id)
      //     }
      //     let newNodes = {
      //       ...b,
      //       id: newID,
      //       adjacent: [lastID],
      //     };
      //     if (i < adjLength - 4) {
      //       newNodes.adjacent.push(b.id + "@" + String(i + 1));
      //     }
      //     newNodes.adjacent.push(adjRemains[i + 1]);
      //     connections.push([adjRemains[i + 1], newID]);
      //     // //본 노드에서는 값을 찾아서 splice를 해야함
      //     let li = b.adjacent.findIndex((id) => id === adjRemains[i + 1]);
      //     // b.adjacent.splice(li,1)
      //     lastID = newID;
      //     newMainNodes.push(newNodes);
      //     nodes.push(newNodes);
      //   }
      //   if (j < mainNodes.length - 1) {
      //     let nextID = mainNodes[j + 1].id;
      //     connections.push([lastID, nextID]);
      //   }
      //   if (j === mainNodes.length - 1) {
      //     if (excludeNodes.length > 0) {
      //       let endId =
      //         excludeNodes.length > 1 ? excludeNodes[1] : excludeNodes[0];
      //       newMainNodes.push(endNodeDict[endId]);
      //       connections.push([endId, lastID]);
      //     }
      //   }
      // }
      //E-B, B-B 노드 시퀀스 확장, 2port 주요 컴포넌트 추가 valve, reducer, instrument, blind flange 등
      //relation 노드이름 갱신
      lineList.push({
        lineName,
        mainNodes: newMainNodes,
        subNodesList,
        nodes,
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
//line별로 구성된 브랜치 노드만을 이용하여 mainNodes, subNodes 배열을 생성
export function alignNode(originNodes) {
  let nodes = [...originNodes].filter((o) => o.nodeType === "B");
  let mainNodes = [];
  let subNodesList = [];
  //시작점은 Branch Node로 구성, 시작점이 없는 경우에는 End만 존재하는 단일 라인임
  //1차 필터링
  let branchCountByRun = nodes.reduce((acc, cur) => {
    acc[cur.runName] = acc[cur.runName] || 0;
    acc[cur.runName] += cur.adjacent.length;
    return acc;
  }, {});
  if (Object.keys(branchCountByRun).length > 0) {
    let mainRun = Object.keys(branchCountByRun).sort(
      (a, b) => branchCountByRun[b] - branchCountByRun[a]
    )[0];
    let start = nodes.filter((n) => n.runName === mainRun);
    let startNode = start[0];
    mainNodes.push(startNode);
    let ii = nodes.findIndex((node) => node.id === startNode.id);
    nodes.splice(ii, 1);
    let iter = 0;
    let maxIter = nodes.length;
    while (iter < maxIter) {
      let first = mainNodes[0];
      let last = mainNodes[mainNodes.length - 1];
      let before = mainNodes.length > 1 ? nodesFilter(nodes, first) : null; //선행노드 검색 필터 함수 사용
      let next = nodesFilter(nodes, last); //후행노드 검색 필터 함수 사용
      if (before || next) {
        if (before) {
          mainNodes.unshift(before);
          let ni = nodes.findIndex((node) => node.id === before.id);
          nodes.splice(ni, 1);
        }
        if (next) {
          mainNodes.push(next);
          let ni = nodes.findIndex((node) => node.id === next.id);
          nodes.splice(ni, 1);
        }
      } else {
        //만약 후순위 노드가 없으면 반복문을 중단함
        break;
      }
      iter++;
    }
    //subNode가 존재하는 판별식
    let iter2 = 0;
    let maxIter2 = nodes.length;
    while (nodes.length > 0 && iter2 < maxIter2) {
      let cur = nodes[0];
      let subNodes = [cur];
      let ii = nodes.findIndex((node) => node.id === cur.id);
      nodes.splice(ii, 1);
      let iter = 0;
      let maxIter3 = nodes.length;
      while (iter < maxIter3) {
        let first = subNodes[0];
        let last = subNodes[subNodes.length - 1];
        let before = subNodes.length > 1 ? nodesFilter(nodes, first) : null; //선행노드 검색 필터 함수 사용
        let next = nodesFilter(nodes, last); //후행노드 검색 필터 함수 사용
        if (before || next) {
          if (before) {
            subNodes.unshift(before);
            let ni = nodes.findIndex((node) => node.id === before.id);
            nodes.splice(ni, 1);
          }
          if (next) {
            subNodes.push(next);
            let ni = nodes.findIndex((node) => node.id === next.id);
            nodes.splice(ni, 1);
          }
        } else {
          //만약 후순위 노드가 없으면 반복문을 중단함
          break;
        }
        iter++;
      }
      subNodesList.push(subNodes);
      iter2++;
    }
  }
  return { mainNodes, subNodesList };
}

//node filter 함수화
function nodesFilter(nodes, last) {
  let nextList = nodes.filter((node) => last.adjacent.includes(node.id));
  let nextList1 = nextList.filter((node) => node.runName === last.RunName);
  if (nextList1.length > 0) {
    nextList = nextList1;
  }
  if (nextList.length > 0) {
    return nextList[0];
  } else {
    return null;
  }
}
