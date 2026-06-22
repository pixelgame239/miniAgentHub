import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface ExportMessage {
  type: 'prompt' | 'response';
  content: string;
  imageUrl: string | null;
}

export interface ExportData {
  title: string;
  messages: ExportMessage[];
}

// Cải tiến hàm này để trả về chuẩn ArrayBuffer - Giúp 'docx' nuốt trọn dữ liệu không bao giờ báo đỏ
async function imageUrlToSharedBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer(); // Chuyển thẳng về ArrayBuffer gốc từ luồng Blob mạng
  } catch (error) {
    console.error("Lỗi lấy ArrayBuffer cho ảnh:", error);
    return null;
  }
}

// Hàm phụ riêng cho PDF vẫn dùng Base64 bình thường
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Lỗi chuyển đổi Base64 cho ảnh:", error);
    return null;
  }
}

export async function generateDocx(exportData: ExportData): Promise<void> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: exportData.title, bold: true, size: 32 }),
      ],
      spacing: { after: 400 },
    }),
  ];

  for (const msg of exportData.messages) {
    const label = msg.type === "prompt" ? "Prompt: " : "Response: ";

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: label, bold: true }),
          new TextRun({ text: msg.content }),
        ],
        spacing: { after: 200 },
      })
    );

    if (msg.imageUrl) {
        const arrayBuffer = await imageUrlToSharedBuffer(msg.imageUrl);
        if (arrayBuffer) {
            // Chuyển ArrayBuffer thành Uint8Array - Đây là kiểu dữ liệu chuẩn chạy được cả Web lẫn Node.js
            const uint8Array = new Uint8Array(arrayBuffer);

            children.push(
            new Paragraph({
                children: [
                new ImageRun({
                    data: uint8Array, 
                    type: "jpg", // BẮT BUỘC: Thêm dòng này để thỏa mãn kiểu 'SvgMediaOptions & CoreImageOptions'
                    transformation: { 
                    width: 400, 
                    height: 250 
                    },
                }),
                ],
                spacing: { after: 300 },
            })
            );
        }
        }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${exportData.title || "export"}.docx`);
}

export async function generatePdf(exportData: ExportData): Promise<void> {
  const container = document.createElement("div");
  container.style.width = "700px";
  container.style.padding = "40px";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.backgroundColor = "#ffffff";
  container.style.boxSizing = "border-box";

  let htmlContent = `<h1 style="text-align: center; margin-bottom: 35px; color: #333;">${exportData.title}</h1>`;

  for (const msg of exportData.messages) {
    const label = msg.type === "prompt" ? "Prompt" : "Response";
    const labelColor = msg.type === "prompt" ? "#1a73e8" : "#1e8e3e";

    htmlContent += `
      <p style="margin-bottom: 18px; line-height: 1.6; font-size: 15px; color: #222;">
        <strong style="color: ${labelColor};">${label}:</strong> ${msg.content}
      </p>
    `;

    if (msg.imageUrl) {
      const base64Image = await imageUrlToBase64(msg.imageUrl);
      if (base64Image) {
        htmlContent += `
          <div style="margin-bottom: 25px; text-align: left;">
            <img src="${base64Image}" style="max-width: 100%; max-height: 350px; border-radius: 4px; display: block;" />
          </div>
        `;
      }
    }
  }

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });

    document.body.removeChild(container);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${exportData.title || "export"}.pdf`);
  } catch (error) {
    console.error("Lỗi khi build file PDF:", error);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}