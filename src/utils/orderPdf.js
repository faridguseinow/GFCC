import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import JsBarcode from "jsbarcode";

pdfMake.addVirtualFileSystem(pdfFonts);
pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  }
};

const pad = (value) => String(value).padStart(2, "0");

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const sanitizeFileSegment = (value, fallback = "Клиент") => {
  const safeValue = toText(value)
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return safeValue || fallback;
};

const parseOrderDate = (value) => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const directDate = new Date(value);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    const match = value.match(
      /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/
    );

    if (match) {
      const [, day, month, year, hours = "00", minutes = "00"] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes)
      );
    }
  }

  return new Date("");
};

const formatOrderDate = (value) => {
  const date = parseOrderDate(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  ].join(" ");
};

const normalizeRows = (items = []) =>
  items.map((item, index) => ([
    { text: String(index + 1), alignment: "center" },
    { text: item?.name || "Товар" },
    { text: `${item?.quantity || 1} шт`, alignment: "center" }
  ]));

const buildBarcodeSvg = (value) => {
  const safeValue = toText(value);

  if (!safeValue || typeof document === "undefined") {
    return "";
  }

  try {
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    JsBarcode(svgNode, safeValue, {
      format: "CODE128",
      width: 1.35,
      height: 42,
      margin: 0,
      displayValue: false,
      background: "#ffffff",
      lineColor: "#111111"
    });

    if (typeof XMLSerializer === "function") {
      return new XMLSerializer().serializeToString(svgNode);
    }

    return svgNode.outerHTML || "";
  } catch {
    return "";
  }
};

export function buildOrderFileName(orderData) {
  const date = parseOrderDate(orderData?.createdAt);
  const clientName = sanitizeFileSegment(orderData?.clientName);

  if (Number.isNaN(date.getTime())) {
    return `Заказ ${clientName}.pdf`;
  }

  return `Заказ ${clientName} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}.pdf`;
}

export function buildOrderPdfBlob(orderData) {
  const comment = orderData?.comment?.trim();
  const clientCode = toText(orderData?.clientCode);
  const clientSklad = toText(orderData?.clientSklad) || "Склад клиента";
  const clientName = toText(orderData?.clientName) || "Клиент GFCC";
  const barcodeSvg = buildBarcodeSvg(clientCode);
  const documentDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 44, 40, 44],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.2
    },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: clientSklad,
                fontSize: 20,
                bold: true,
                margin: [0, 0, 0, 10]
              },
              {
                text: clientName,
                fontSize: 12,
                margin: [0, 0, 0, 6]
              },
              {
                text: formatOrderDate(orderData?.createdAt),
                fontSize: 11
              }
            ]
          },
          barcodeSvg
            ? {
                width: 170,
                stack: [
                  {
                    svg: barcodeSvg,
                    fit: [170, 44],
                    alignment: "right",
                    margin: [0, 4, 0, 4]
                  },
                  {
                    text: clientCode,
                    fontSize: 10,
                    alignment: "right",
                    color: "#555555"
                  }
                ]
              }
            : { width: 0, text: "" }
        ],
        columnGap: 18,
        margin: [0, 0, 0, 16]
      },
      {
        table: {
          headerRows: 1,
          widths: [26, "*", 70],
          body: [
            [
              { text: "№", bold: true, alignment: "center" },
              { text: "Наименование", bold: true },
              { text: "Кол-во", bold: true, alignment: "center" }
            ],
            ...normalizeRows(orderData?.items)
          ]
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#f5f5f5" : null),
          hLineColor: () => "#dddddd",
          vLineColor: () => "#dddddd",
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 7,
          paddingBottom: () => 7
        }
      }
    ]
  };

  if (comment) {
    documentDefinition.content.push(
      {
        text: "Комментарий:",
        bold: true,
        fontSize: 12,
        margin: [0, 18, 0, 6]
      },
      {
        text: comment,
        fontSize: 11
      }
    );
  }

  return pdfMake.createPdf(documentDefinition).getBlob();
}
