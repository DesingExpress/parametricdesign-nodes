import { Point } from "@nexivil/package-modules";

export function pipeLinePoint(input) {
  console.log(input);
  //pidConnection의 경우 end1 end2로 항상 짝을 이루고 있는 데이터로 구성됨,
  //end1데이터가 end2과 연결이 안되는 경우 pipeRun 시점,
  //end2데이터가 다음 end1과 연결이 안되는 경우 종점으로 pipeRun 정의,
  //시점이나 종점의 데이터가 다른 세그먼트 내의 파트로 정의 된 경우에 연결관계 정의 (parent, children),
  //branch 번호별로 도식화하여 2D로 작성필요(그래프로 시각화)
  //pidConnection => pipeRun List => branch Point로 연결관계(분기포인트) 정의 => 그래프로 시각화
  let pidConnection = input["2D"].pidConnection.data.map((o, index) => ({
    LineName: o["Line ID"],
    ItemTag: o["Item Tag"],
    ItemSPID: o["Item SP_ID"],
    ItemName: o["Item Name"],
    ItemEnd: o["Item End"],
    TopoNo: o["Topo No"],
    SymbolName: o["Symbol Name"].split("\\"),
    index,
  }));
  for (let p of pidConnection) {
    let arr = p.LineName.split("-");
    p["LineID"] = `${arr[0]}-${arr[2]}-${arr[3]}`;
  }
  //connections의 각 파트의 중심좌표로 향후 커넥션즈 파트별 3차원 좌표 시각화에 활용(그래프로 시각화에는 사용이 안될 수 있음)
  let components = input["3D"].ComponentList.data.map((o) => ({
    point: new Point(o.LocationX, o.LocationY, o.LocationZ),
    partName: o.PartName,
    PartOID: o.PartOID,
  }));
  //파이프런 별로 분기를 구분이 될 수 있으며, connection 정보를 통해서 시퀀스를 재조합하여 순서를 정할 수 있다.
  //part별 runName이 같은 경우에는 동일 파이프런에 속해 있으며, runName이 다른 경우에는 양쪽 파이프런 그룹에 포함되어 있다.
  //분기의 시작점과 끝점은 파이프런을 통해 분류후 시퀀스를 내부 시퀀스를 정의함으로써 해결 될 수 있다.
  //connection 정보를 파이프런별로 분류 => 파이프런 시퀀스 정의, 분기포인트 정의 => 그래프로 시각화
  let conections = input["3D"].ConnectionList.data.map((o) => ({
    point: new Point(o.LocationX, o.LocationY, o.LocationZ),
    ConnectionOID: o.ConnectionOID,
    part1: {
      PartOID: o.Part01,
      PartName: o.Part01Name,
      PartType: o.Part01Type,
      RunOID: o.Run01,
      RunName: o.Run01Name,
    },
    part2: {
      PartOID: o.Part02,
      PartName: o.Part02Name,
      PartType: o.Part02Type,
      RunOID: o.Run02,
      RunName: o.Run02Name,
    },
  }));

  //상기 분기가 이루어지는 커넥션포인트와 동일한지 여부 판단후 중복데이터일시 소거해도 될 듯
  let runToRuns = input["3D"]["Run-RunConnectionwithRemark"].data.map((o) => ({
    point: new Point(o.LocationX, o.LocationY, o.LocationZ),
    ConnectionOID: o.ConnectionOID,
    Remark: o.Remark,
    run1: {
      LineName: o.LineName1,
      LindOID: o.LineOID1,
      Path1: o.Path1.split("\\"),
      RunName: o.RunName1,
      RunOID: o.RunOID1,
    },
    run2: {
      LineName: o.LineName2,
      LindOID: o.LineOID2,
      Path1: o.Path2.split("\\"),
      RunName: o.RunName2,
      RunOID: o.RunOID2,
    },
  }));
  let group3d = gen3DGroup(conections, components, runToRuns);
  let group2d = gen2DGroup(pidConnection);
  console.log("group2d", group2d);
  console.log("group3d", group3d);
  return { pidConnection, conections, components, runToRuns, group3d, group2d };
}

export function gen3DGroup(conections, components, runToRuns = []) {
  let runDict = {};
  let partDict = {};
  for (let r of runToRuns) {
    let r1 = r.run1;
    let r2 = r.run2;
    if (!runDict[r1.RunOID]) {
      runDict[r1.RunOID] = {
        lineName: r1.LineName,
        runName: r1.RunName,
      };
    }
    if (!runDict[r2.RunOID]) {
      runDict[r2.RunOID] = {
        lineName: r2.LineName,
        runName: r2.RunName,
      };
    }
  }
  // let pType = {};
  // let branchPoint = [];
  for (let c of conections) {
    let r1 = c.part1.RunOID;
    let r2 = c.part2.RunOID;
    if (!runDict[r1]) {
      let t = c.part1.RunName.split('"').map((a) => a.split("-"));
      runDict[r1] = {
        lineName:
          t.length > 1 ? `${t[0][0]}-${t[1][1]}-${t[1][2]}` : c.part1.RunName,
        runName: c.part1.RunName,
      };
    }
    if (!runDict[r2]) {
      let t = c.part2.RunName.split('"').map((a) => a.split("-"));
      runDict[r2] = {
        lineName:
          t.length > 1 ? `${t[0][0]}-${t[1][1]}-${t[1][2]}` : c.part2.RunName,
        runName: c.part2.RunName,
      };
    }
    let p1 = c.part1.PartOID;
    let p2 = c.part2.PartOID;
    let comp1 = components.find((o) => o.PartOID === p1);
    let comp2 = components.find((o) => o.PartOID === p2);

    if (!partDict[p1]) {
      partDict[p1] = {
        name: c.part1.PartName,
        adjacent: [c.part2.PartOID],
        runOID: c.part1.RunOID,
        type: c.part1.PartType,
        point: comp1 ? comp1.point : c.point,
        runName: runDict[c.part1.RunOID].runName,
        lineName: runDict[c.part1.RunOID].lineName,
      };
    } else {
      if (!partDict[p1].adjacent.includes(c.part2.PartOID)) {
        partDict[p1].adjacent.push(c.part2.PartOID);
      }
    }
    if (!partDict[p2]) {
      partDict[p2] = {
        name: c.part2.PartName,
        adjacent: [c.part1.PartOID],
        runOID: c.part2.RunOID,
        type: c.part2.PartType,
        point: comp2 ? comp2.point : c.point,
        runName: runDict[c.part2.RunOID].runName,
        lineName: runDict[c.part2.RunOID].lineName,
      };
    } else {
      if (!partDict[p2].adjacent.includes(c.part1.PartOID)) {
        partDict[p2].adjacent.push(c.part1.PartOID);
      }
    }
  }
  // console.log("check", branchPoint);
  // console.log("check", pType); //기준위치와 커넥션위치가 같은 부재
  let nodes = Object.keys(partDict);
  let endID = nodes.filter((id) => partDict[id].adjacent.length < 2);
  let branchID = nodes.filter((id) => partDict[id].adjacent.length > 2);
  //중간에 장비를 통해 브랜치가 되는 경우 라인네임이 NULL이며 서로다른 run으로 연결됨
  //segment : branch의 끝단에서부터 분기점까지의 세그먼트 + 분기점에서 시작해서 분기점으로 끝나는 세그먼트
  let endList = []; //endBranchList;
  for (let id of endID) {
    let segment = [id];
    let currentID = id;
    let nextID = "none";
    //분기나 엔드가 나올때까지 다음 노드를 찾아서 반복수행
    while (![...endID, ...branchID].includes(nextID)) {
      let adj = partDict[currentID].adjacent;
      for (let i = 0; i < adj.length; i++) {
        if (!segment.includes(adj[i])) {
          nextID = adj[i];
          break;
        }
      }
      segment.push(nextID);
      currentID = nextID;
    }
    if (!endID.includes(segment[segment.length - 1])) {
      //end - end로 끝나는 단구간의 중복을 방지하기 위함
      endList.push(segment);
    }
  }
  let midList = [];
  for (let id of branchID) {
    let adj = partDict[id].adjacent;
    for (let i = 0; i < adj.length; i++) {
      if (![...endList, ...midList].flat().includes(adj[i])) {
        let segment = [id, adj[i]];
        let currentID = adj[i];
        let nextID = adj[i];
        while (!branchID.includes(nextID)) {
          let adj = partDict[currentID].adjacent;
          for (let i = 0; i < adj.length; i++) {
            if (!segment.includes(adj[i])) {
              nextID = adj[i];
              break;
            }
          }
          segment.push(nextID);
          currentID = nextID;
        }
        midList.push(segment);
      } else if (branchID.includes(adj[i])) {
        //분기-분기끼리의 연결인 경우
        let segment = [id, adj[i]]; //두개의 노드를 동시에 가진 세그먼트가 없는경우 추가
        if (!midList.some((seg) => segment.every((id) => seg.includes(id)))) {
          midList.push(segment);
        }
      }
    }
  }
  let cluster = [];
  let maxIter = endList.length;
  let iter = 0;
  //각각의 세그먼트를 연결관계를 통해 클러스터링, 단부 분기가 모두 없어질 때까지 수행
  while (endList.length > 0 && iter < maxIter) {
    let ids = [endList[0][0], endList[0][endList[0].length - 1]];
    let segments = { end: [], mid: [] };
    let iter2 = 0;
    let maxIter2 = midList.length;
    while (
      midList.filter((seg) => ids.some((id) => seg.includes(id))).length > 0 &&
      iter2 < maxIter2
    ) {
      for (let i = midList.length - 1; i > -1; i--) {
        if (ids.some((id) => midList[i].includes(id))) {
          segments.mid.push(midList[i]);
          if (!ids.includes(midList[i][0])) {
            ids.push(midList[i][0]);
          }
          if (!ids.includes(midList[i][midList[i].length - 1])) {
            ids.push(midList[i][midList[i].length - 1]);
          }
          midList.splice(i, 1);
        }
      }
      iter2++;
    }
    for (let i = endList.length - 1; i > -1; i--) {
      if (ids.some((id) => endList[i].includes(id))) {
        segments.end.push(endList[i]);
        if (!ids.includes(endList[i][0])) {
          ids.push(endList[i][0]);
        }
        if (!ids.includes(endList[i][endList[i].length - 1])) {
          ids.push(endList[i][endList[i].length - 1]);
        }
        endList.splice(i, 1);
      }
    }
    //subGroup에 할당된 라인 이름을 lines에 할당
    if (segments.end.length + segments.mid.length > 0) {
      segments["lines"] = [];
      for (let seg of segments.end) {
        for (let id of seg.slice(1)) {
          //단부의 equipment의 경우 runOID가 null임, 단부가 다른 runOID로 정의되는 경우 예외처리
          let LineName = runDict[partDict[id].runOID].lineName;
          if (!segments["lines"].includes(LineName)) {
            segments["lines"].push(LineName);
          }
        }
      }
      for (let seg of segments.mid) {
        for (let id of seg) {
          let LineName = runDict[partDict[id].runOID].lineName;
          if (!segments["lines"].includes(LineName)) {
            segments["lines"].push(LineName);
          }
        }
      }
      cluster.push(segments);
    }
    iter++;
  }
  return { partDict, runDict, cluster };
}

export function gen2DGroup(pidConnection) {
  let partDict = {};
  let opcDict = {};
  let runDict = {};
  let connections = [];
  for (let i = 0; i < pidConnection.length; i++) {
    let p1 = pidConnection[i];
    if (p1.ItemName.includes("OPC")) {
      if (!opcDict[p1.ItemTag]) {
        opcDict[p1.ItemTag] = [p1.ItemSPID];
      } else {
        if (!opcDict[p1.ItemTag].includes(p1.ItemSPID)) {
          opcDict[p1.ItemTag].push(p1.ItemSPID);
        }
      } //OPC이름이 같은 경우
    }
  }
  let runNumber = 0;
  let dummyTag = "nan";
  for (let i = 0; i < pidConnection.length; i += 2) {
    let p1 = pidConnection[i];
    let p2 = pidConnection[i + 1];
    if (p1.ItemTag !== dummyTag) {
      runNumber++;
    }
    dummyTag = p2.ItemTag;
    connections.push({
      part1: {
        PartOID: opcDict[p1.ItemTag] ? opcDict[p1.ItemTag][0] : p1.ItemSPID,
        PartName:
          p1.ItemTag === "N/A"
            ? p1.SymbolName[p1.SymbolName.length - 1].slice(0, -4)
            : p1.ItemTag, //OPC이름이 같은 경우
        PartType: p1.ItemName, //OPC인 경우
        RunName: String(p1.ItemTag).includes('"') ? p1.ItemTag : p1.LineName,
        runNumber: runNumber,
        index: i,
      },
      part2: {
        PartOID: opcDict[p2.ItemTag] ? opcDict[p2.ItemTag][0] : p2.ItemSPID,
        PartName:
          p2.ItemTag === "N/A"
            ? p2.SymbolName[p2.SymbolName.length - 1].slice(0, -4)
            : p2.ItemTag,
        PartType: p2.ItemName,
        RunName: String(p2.ItemTag).includes('"') ? p2.ItemTag : p2.LineName,
        runNumber: runNumber,
        index: i + 1,
      },
    });
  }

  for (let c of connections) {
    let p1 = c.part1.PartOID;
    let p2 = c.part2.PartOID;
    if (p1 === p2) {
      partDict[p1].count++;
    }
    if (!partDict[p1]) {
      let t = c.part1.RunName.split('"').map((a) => a.split("-"));
      let lineName = `${t[0][0]}-${t[1][1]}-${t[1][2]}`;
      partDict[p1] = {
        name: c.part1.PartName,
        type: c.part1.PartType,
        adjacent: [c.part2.PartOID],
        runName: c.part1.RunName + String(c.part1.runNumber),
        lineName,
        index: c.part1.index,
        count: 1,
      };
    } else {
      if (!partDict[p1].adjacent.includes(c.part2.PartOID)) {
        partDict[p1].adjacent.push(c.part2.PartOID);
      }
    }
    if (!partDict[p2]) {
      let t = c.part2.RunName.split('"').map((a) => a.split("-"));
      let lineName = `${t[0][0]}-${t[1][1]}-${t[1][2]}`;
      partDict[p2] = {
        name: c.part2.PartName,
        type: c.part1.PartType,
        adjacent: [c.part1.PartOID],
        runName: c.part2.RunName + String(c.part2.runNumber),
        lineName,
        index: c.part2.index,
        count: 1,
      };
    } else {
      if (!partDict[p2].adjacent.includes(c.part1.PartOID)) {
        partDict[p2].adjacent.push(c.part1.PartOID);
      }
    }
  }
  let endID = Object.keys(partDict).filter(
    (id) => partDict[id].adjacent.length < 2
  );
  let branchID = Object.keys(partDict).filter(
    (id) => partDict[id].adjacent.length > 2
  );
  //segment : branch의 끝단에서부터 분기점까지의 세그먼트 + 분기점에서 시작해서 분기점으로 끝나는 세그먼트
  let endList = []; //endBranchList;
  for (let id of endID) {
    let segment = [id];
    let currentID = id;
    let nextID = "none";
    while (![...endID, ...branchID].includes(nextID)) {
      let adj = partDict[currentID].adjacent;
      for (let i = 0; i < adj.length; i++) {
        if (!segment.includes(adj[i])) {
          nextID = adj[i];
          break;
        }
      }
      segment.push(nextID);
      currentID = nextID;
    }
    if (!endID.includes(segment[segment.length - 1])) {
      //end - end로 끝나는 단구간의 중복을 방지하기 위함
      endList.push(segment);
    }
  }
  let midList = [];
  for (let id of branchID) {
    let adj = partDict[id].adjacent;
    for (let i = 0; i < adj.length; i++) {
      if (![...endList, ...midList].flat().includes(adj[i])) {
        let segment = [id, adj[i]];
        let currentID = adj[i];
        let nextID = adj[i];
        while (!branchID.includes(nextID)) {
          let adj = partDict[currentID].adjacent;
          for (let i = 0; i < adj.length; i++) {
            if (!segment.includes(adj[i])) {
              nextID = adj[i];
              break;
            }
          }
          segment.push(nextID);
          currentID = nextID;
        }
        midList.push(segment);
      } else if (branchID.includes(adj[i])) {
        //분기-분기끼리의 연결인 경우
        let segment = [id, adj[i]]; //두개의 노드를 동시에 가진 세그먼트가 없는경우 추가
        if (!midList.some((seg) => segment.every((id) => seg.includes(id)))) {
          midList.push(segment);
        }
      }
    }
  }
  let cluster = [];
  let maxIter = endList.length;
  let iter = 0;
  while (endList.length > 0 && iter < maxIter) {
    let ids = [endList[0][0], endList[0][endList[0].length - 1]];
    let subGroup = { end: [], mid: [] };
    let iter2 = 0;
    let maxIter2 = midList.length;
    while (
      midList.filter((seg) => ids.some((id) => seg.includes(id))).length > 0 &&
      iter2 < maxIter2
    ) {
      for (let i = midList.length - 1; i > -1; i--) {
        if (ids.some((id) => midList[i].includes(id))) {
          subGroup.mid.push(midList[i]);
          if (!ids.includes(midList[i][0])) {
            ids.push(midList[i][0]);
          }
          if (!ids.includes(midList[i][midList[i].length - 1])) {
            ids.push(midList[i][midList[i].length - 1]);
          }
          midList.splice(i, 1);
        }
      }
      iter2++;
    }
    for (let i = endList.length - 1; i > -1; i--) {
      if (ids.some((id) => endList[i].includes(id))) {
        subGroup.end.push(endList[i]);
        if (!ids.includes(endList[i][0])) {
          ids.push(endList[i][0]);
        }
        if (!ids.includes(endList[i][endList[i].length - 1])) {
          ids.push(endList[i][endList[i].length - 1]);
        }
        endList.splice(i, 1);
      }
    }
    if (subGroup.end.length + subGroup.mid.length > 0) {
      subGroup["lines"] = [];
      for (let seg of subGroup.end) {
        for (let id of seg.slice(1)) {
          let runName = partDict[id].runName;
          let t1 = runName.split('"').map((a) => a.split("-"));
          let LineID = `${t1[0][0]}-${t1[1][1]}-${t1[1][2]}`;
          if (!subGroup["lines"].includes(LineID)) {
            subGroup["lines"].push(LineID);
          }
        }
      }
      for (let seg of subGroup.mid) {
        for (let id of seg) {
          let runName = partDict[id].runName;
          let t1 = runName.split('"').map((a) => a.split("-"));
          let LineID = `${t1[0][0]}-${t1[1][1]}-${t1[1][2]}`;
          if (!subGroup["lines"].includes(LineID)) {
            subGroup["lines"].push(LineID);
          }
        }
      }
      cluster.push(subGroup);
    }
    iter++;
  }
  return { partDict, cluster, connections };
}
