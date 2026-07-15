import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface ExportMessage {
  type: 'prompt' | 'response';
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
}

export interface ExportData {
  title: string;
  messages: ExportMessage[];
}

const apiURL = import.meta.env.VITE_API_URL;

// Hàm bổ trợ lấy ArrayBuffer cho DOCX
async function imageUrlToSharedBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Cannot retrieve ArrayBuffer for image:", error);
    return null;
  }
}

// Hàm bổ trợ lấy Base64 cho PDF
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
    console.error("Cannot convert image to Base64:", error);
    return null;
  }
}

// ==========================================
// 1. XUẤT FILE DOCX
// ==========================================
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
        spacing: { after: 150 },
      })
    );

    // Xử lý đính kèm file cho DOCX
    if (msg.fileUrl) {
      if (msg.fileType && msg.fileType.startsWith("image/")) {
        // TRƯỜNG HỢP LÀ ẢNH
        const arrayBuffer = await imageUrlToSharedBuffer(`${apiURL}${msg.fileUrl}`);
        if (arrayBuffer) {
          const uint8Array = new Uint8Array(arrayBuffer);
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: uint8Array,
                  type: "jpg",
                  transformation: { width: 400, height: 250 },
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
        // Thêm tên file ngay dưới ảnh
        if (msg.fileName) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `File: ${msg.fileName}`, italics: true, size: 20, color: "555555" })
              ],
              spacing: { after: 300 },
            })
          );
        }
      } else {
        // TRƯỜNG HỢP FILE KHÁC (Hiển thị icon và tên file)
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "📄 ", size: 24 }), 
              new TextRun({ text: msg.fileName || "Tệp đính kèm", bold: true, color: "1a73e8" })
            ],
            spacing: { after: 300 },
          })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${exportData.title || "export"}.docx`);
}

// ==========================================
// 2. XUẤT FILE PDF (Chống cắt trang & Sát lề)
// ==========================================
export async function generatePdf(exportData: ExportData): Promise<void> {
  // Tạo container ảo ẩn để tính toán kích thước từng block phần tử độc lập
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "720px"; // Tương đương độ rộng lòng trang A4 (chừa lề)
  container.style.fontFamily = "Arial, sans-serif";
  container.style.boxSizing = "border-box";
  document.body.appendChild(container);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  // Cấu hình lề trang PDF (Đơn vị: mm)
  const marginX = 15;
  const marginTop = 20;
  const marginBottom = 20;
  const pageHeightMM = 297;
  const pageWidthMM = 210;
  const contentWidthMM = pageWidthMM - (marginX * 2);
  const maxPageHeightMM = pageHeightMM - marginTop - marginBottom;

  let currentY_MM = marginTop; // Vị trí Y hiện tại trên trang PDF (đơn vị mm)

  // 1. Vẽ Tiêu Đề
  container.innerHTML = `<h1 style="text-align: center; margin: 0; font-size: 24px; color: #333; line-height: 1.4;">${exportData.title}</h1>`;
  let canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
  let imgHeightMM = (canvas.height * contentWidthMM) / canvas.width;
  
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", marginX, currentY_MM, contentWidthMM, imgHeightMM);
  currentY_MM += imgHeightMM + 10; // Cộng khoảng cách sau tiêu đề

  // 2. Duyệt qua từng tin nhắn để vẽ riêng biệt (Tránh cắt ngang dòng/ảnh)
  for (const msg of exportData.messages) {
    const label = msg.type === "prompt" ? "Prompt" : "Response";
    const labelColor = msg.type === "prompt" ? "#1a73e8" : "#1e8e3e";

    // Khởi tạo HTML cho một block tin nhắn
    let blockHtml = `
      <div style="padding: 10px 0; width: 100%; box-sizing: border-box;">
        <p style="margin: 0 0 10px 0; line-height: 1.6; font-size: 15px; color: #222; word-wrap: break-word;">
          <strong style="color: ${labelColor};">${label}:</strong> ${msg.content}
        </p>
    `;

    // Đính kèm file trong HTML
    if (msg.fileUrl) {
      if (msg.fileType && msg.fileType.startsWith("image/")) {
        const base64Image = await imageUrlToBase64(`${apiURL}${msg.fileUrl}`);
        if (base64Image) {
          blockHtml += `
            <div style="margin-top: 10px; text-align: left;">
              <img src="${base64Image}" style="max-width: 100%; max-height: 300px; border-radius: 4px; display: block; margin-bottom: 5px;" />
              ${msg.fileName ? `<span style="font-size: 12px; color: #666; font-style: italic;">File: ${msg.fileName}</span>` : ""}
            </div>
          `;
        }
      } else {
        // Giao diện File đính kèm không phải là ảnh (Có Icon kẹp giấy/tài liệu)
        blockHtml += `
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1a73e8; font-weight: bold;">
            <span style="font-size: 18px;">📄</span>
            <span>${msg.fileName}</span>
          </div>
        `;
      }
    }

    blockHtml += `</div>`;
    container.innerHTML = blockHtml;

    // Render block hiện tại thành canvas để đo chiều cao thực tế bằng mm
    canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    imgHeightMM = (canvas.height * contentWidthMM) / canvas.width;

    // KIỂM TRA TRÀN TRANG: Nếu block này đặt vào bị vượt quá lề dưới -> Sang trang mới luôn
    if (currentY_MM + imgHeightMM > maxPageHeightMM + marginTop) {
      pdf.addPage();
      currentY_MM = marginTop; // Reset lại tọa độ Y ở đầu trang mới
    }

    // Vẽ block tin nhắn vào PDF
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", marginX, currentY_MM, contentWidthMM, imgHeightMM);
    currentY_MM += imgHeightMM + 4; // Khoảng cách nhỏ giữa các block tin nhắn
  }

  // Dọn dẹp DOM ảo và lưu file
  document.body.removeChild(container);
  pdf.save(`${exportData.title || "export"}.pdf`);
}