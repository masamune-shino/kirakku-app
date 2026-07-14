import ExcelJS from "exceljs";

const STATUS_OPTIONS = ["受付", "入荷済"];

export function buildPendingWorkbook(header: string[], rows: string[][]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("発注残");

  sheet.addRow(header);
  rows.forEach((row) => sheet.addRow(row));

  const statusColIndex = header.indexOf("ステータス") + 1;
  if (statusColIndex > 0) {
    for (let r = 2; r <= rows.length + 1; r++) {
      sheet.getCell(r, statusColIndex).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`"${STATUS_OPTIONS.join(",")}"`],
      };
    }
  }

  sheet.columns.forEach((col) => {
    col.width = 16;
  });

  return workbook;
}

export async function downloadXlsx(filename: string, workbook: ExcelJS.Workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseXlsxRows(buffer: ArrayBuffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: string[][] = [];
  sheet.eachRow((row) => {
    const values = row.values as ExcelJS.CellValue[];
    // row.values is 1-indexed; index 0 is unused
    const cells = values.slice(1).map((v) => (v === null || v === undefined ? "" : String(v)));
    rows.push(cells);
  });
  return rows;
}
