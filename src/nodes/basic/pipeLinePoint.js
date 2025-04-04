import { Point } from "@nexivil/package-modules";

export function pipeLinePoint(input) {
  console.log(input);
  //pidConnection의 경우 end1 end2로 항상 짝을 이루고 있는 데이터로 구성됨,
  //end1데이터가 end2과 연결이 안되는 경우 pipeRun 시점,
  //end2데이터가 다음 end1과 연결이 안되는 경우 종점으로 pipeRun 정의,
  //시점이나 종점의 데이터가 다른 세그먼트 내의 파트로 정의 된 경우에 연결관계 정의 (parent, children),
  //branch 번호별로 도식화하여 2D로 작성필요(그래프로 시각화)
  //pidConnection => pipeRun List => branch Point로 연결관계(분기포인트) 정의 => 그래프로 시각화
  let pidConnection = input["2D"].pidConnection.data.map((o) => ({
    LineName : o["Line ID"],
    ItemTag : o["Item Tag"],
    ItemSPID : o["Item SP_ID"],
    ItemName : o["Item Name"],
    ItemEnd : o["Item End"],
    TopoNo : o["Topo No"],
    SymbolName : o["Symbol Name"].split("\\")
  }));
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
    part1 : {
        PartOID : o.Part01,
        PartName : o.Part01Name,
        PartType : o.Part01Type,
        RunOID : o.Run01,
        RunName : o.Run01Name
    },
    part2 : {
        PartOID : o.Part02,
        PartName : o.Part02Name,
        PartType : o.Part02Type,
        RunOID : o.Run02,
        RunName : o.Run02Name
    }
  }));
  //상기 분기가 이루어지는 커넥션포인트와 동일한지 여부 판단후 중복데이터일시 소거해도 될 듯
  let runToRuns = input["3D"]["Run-RunConnectionwithRemark"].data.map((o) => ({
    point: new Point(o.LocationX, o.LocationY, o.LocationZ),
    ConnectionOID: o.ConnectionOID,
    Remark : o.Remark,
    run1 : {
        LineName : o.LineName1,
        LindOID : o.LineOID1,
        Path1 : o.Path1.split("\\"),
        RunName : o.RunName1,
        RunOID : o.RunOID1
    },
    run2 : {
        LineName : o.LineName2,
        LindOID : o.LineOID2,
        Path1 : o.Path2.split("\\"),
        RunName : o.RunName2,
        RunOID : o.RunOID2
    },
  }));
  return { pidConnection, conections, components, runToRuns};
}
