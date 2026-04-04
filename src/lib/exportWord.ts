import { buildTemplate, type TemplateParams } from "@/lib/pdfTemplates";

/**
 * Exporta Word (.doc) reutilizando o mesmo HTML do PDF,
 * com namespace Microsoft Word para edição completa.
 */
export function exportAsWord(params: TemplateParams) {
  const html = buildTemplate(params);

  const wordHtml = `<html
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8"/>
  <meta name="ProgId" content="Word.Document"/>
  <meta name="Generator" content="Microsoft Word 15"/>
  <meta name="Originator" content="Microsoft Word 15"/>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 21cm 29.7cm;
      margin: 3cm 2cm 2cm 2cm;
      mso-header-margin: 1cm;
      mso-footer-margin: 1cm;
      mso-paper-source: 0;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-after: always;
      mso-page-break-before: always;
    }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1pt solid #ccc; padding: 4pt 8pt; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${html.replace(/<html[^>]*>|<\/html>|[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, "")}
  </div>
</body>
</html>`;

  const filename = buildFilename(params, "doc");
  downloadBlob(
    new Blob(["\uFEFF" + wordHtml], {
      type: "application/msword;charset=utf-8",
    }),
    filename
  );
}

function buildFilename(p: TemplateParams, ext: string): string {
  const client = (p.clientName || "relatorio").replace(/[^a-zA-Z0-9]/g, "-");
  const date = new Date().toISOString().slice(0, 10);
  return `relatorio-${client}-${date}.${ext}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
