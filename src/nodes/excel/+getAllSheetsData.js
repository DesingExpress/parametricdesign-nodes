import { Pure } from "@design-express/fabrica";

export class getAllSheetsData extends Pure {
  static path = "excel";
  static title = "getAllSheetsData";
  static description = "";

  constructor() {
    super();
    this.addInput("workbook", "exceljs::workbook");

    this.addOutput("data", "array");
  }

  async onExecute() {
    const wb = this.getInputData(1);
    if (!wb) return;
    this.setOutputData(1, extractWorkbookData(wb));
  }
}

/**
 * 엑셀 워크북에서 각 시트의 정보를 추출하는 함수
 * @param {ExcelJS.Workbook} workbook - ExcelJS 워크북 객체
 * @returns {Array<{sheetName: string, usedRange: string, values: Array<Array<any>>}>} - 각 시트의 정보
 */
function extractWorkbookData(workbook) {
  // 결과를 저장할 배열
  const result = [];

  // 워크북의 모든 워크시트를 순회
  workbook.eachSheet((worksheet, sheetId) => {
    // 시트 이름 가져오기
    const name = worksheet.name;

    // Used Range 계산하기
    const usedRange = worksheet.usedRange;
    let startCell = "A1";
    let endCell = "A1";

    if (usedRange) {
      const { s: start, e: end } = usedRange;
      startCell = `${getCellAddress(start.c, start.r)}`;
      endCell = `${getCellAddress(end.c, end.r)}`;
    } else {
      // usedRange가 없을 경우 직접 계산
      let maxRow = 1;
      let maxCol = 1;

      worksheet.eachRow((row, rowNumber) => {
        maxRow = Math.max(maxRow, rowNumber);
        row.eachCell((cell, colNumber) => {
          maxCol = Math.max(maxCol, colNumber);
        });
      });

      if (maxRow > 0 && maxCol > 0) {
        startCell = "A1";
        endCell = `${getCellAddress(maxCol - 1, maxRow - 1)}`;
      }
    }

    const usedRangeString = `${startCell}:${endCell}`;

    // 셀 값들을 2차원 배열로 추출
    const data = [];

    // usedRange에서 행과 열 범위 계산
    const startColIndex = getColIndex(startCell);
    const startRowIndex = getRowIndex(startCell);
    const endColIndex = getColIndex(endCell);
    const endRowIndex = getRowIndex(endCell);

    // 범위 내 모든 셀 값 추출
    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
      const rowValues = [];
      for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
        const cellAddress = getCellAddress(colIndex, rowIndex);
        const cell = worksheet.getCell(cellAddress);
        rowValues.push(cell.value);
      }
      data.push(rowValues);
    }

    // 결과 배열에 시트 정보 추가
    result.push({
      name,
      usedRange: usedRangeString,
      data,
    });
  });

  return result;
}

/**
 * 열 인덱스와 행 인덱스로 셀 주소 생성 (예: 0,0 -> 'A1')
 * @param {number} colIndex - 열 인덱스 (0부터 시작)
 * @param {number} rowIndex - 행 인덱스 (0부터 시작)
 * @returns {string} - 셀 주소
 */
function getCellAddress(colIndex, rowIndex) {
  // 열 인덱스를 알파벳으로 변환 (0 -> 'A', 25 -> 'Z', 26 -> 'AA' 등)
  let colAddress = "";
  let tempColIndex = colIndex;

  do {
    const remainder = tempColIndex % 26;
    colAddress = String.fromCharCode(65 + remainder) + colAddress;
    tempColIndex = Math.floor(tempColIndex / 26) - 1;
  } while (tempColIndex >= 0);

  // 행 인덱스는 1부터 시작하므로 1을 더함
  const rowAddress = rowIndex + 1;

  return `${colAddress}${rowAddress}`;
}

/**
 * 셀 주소에서 열 인덱스 추출 (예: 'A1' -> 0)
 * @param {string} cellAddress - 셀 주소
 * @returns {number} - 열 인덱스 (0부터 시작)
 */
function getColIndex(cellAddress) {
  const colPart = cellAddress.replace(/[0-9]/g, "");
  let colIndex = 0;

  for (let i = 0; i < colPart.length; i++) {
    colIndex = colIndex * 26 + (colPart.charCodeAt(i) - 64);
  }

  return colIndex - 1; // 0-based 인덱스로 변환
}

/**
 * 셀 주소에서 행 인덱스 추출 (예: 'A1' -> 0)
 * @param {string} cellAddress - 셀 주소
 * @returns {number} - 행 인덱스 (0부터 시작)
 */
function getRowIndex(cellAddress) {
  const rowPart = cellAddress.replace(/[A-Za-z]/g, "");
  return parseInt(rowPart, 10) - 1; // 0-based 인덱스로 변환
}

// 사용 예시:
// const ExcelJS = require('exceljs');
// const workbook = new ExcelJS.Workbook();
// await workbook.xlsx.readFile('example.xlsx');
// const data = extractWorkbookData(workbook);
// console.log(data);
