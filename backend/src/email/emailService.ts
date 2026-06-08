import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailUser = process.env.EMAIL_USER || "";
const emailPass = process.env.EMAIL_PASS || "";
const PROXY_URL = process.env.HTTPS_PROXY || ""; 
let transporter: nodemailer.Transporter;

// KIỂM TRA ĐIỀU KIỆN ĐỘNG
if (PROXY_URL) {
    console.log(`[SMTP Setup] Cấu hình tích hợp Proxy nội sàn...`);
    
    const proxyConfig: any = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        proxy: PROXY_URL, 
        
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false
        },
        logger: true,
        debug: true
    };
    
    transporter = nodemailer.createTransport(proxyConfig);
} else {
    console.log("[SMTP Setup] Không tìm thấy PROXY_URL. Chạy kết nối trực tiếp qua cổng 587...");
    
    const emailPort = Number(process.env.EMAIL_PORT) || 587;
    
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: emailPort,       
        secure: emailPort === 465, 
        auth: {
            user: emailUser, 
            pass: emailPass, 
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}

export class EmailService {
    
    private static getEmailHtmlContent(fullname: string, email: string, temporaryPassword: string, lang: string = "en"): string {
        const rootDir = process.cwd(); 
        const templatePath = path.join(rootDir, 'src', 'email', `emailTemplate${lang === "vi" ? "Vi" : ""}.html`);
        
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');
        
        return htmlContent
            .replace(/{{fullname}}/g, fullname)
            .replace(/{{email}}/g, email)
            .replace(/{{password}}/g, temporaryPassword);
    }

    // 1. Hàm Fake (Giữ nguyên logic của bạn)
    public static async sendFakeWelcomeEmail(email: string, fullname: string, temporaryPassword: string): Promise<string> {
        const rootDir = process.cwd(); 
        const outputDir = path.join(rootDir, 'src', 'email', 'tempEmails');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const fileName = `welcome-${email.replace(/[@.]/g, '-')}.html`;
        const outputPath = path.join(outputDir, fileName);
        
        const htmlContent = this.getEmailHtmlContent(fullname, email, temporaryPassword);
        
        fs.writeFileSync(outputPath, htmlContent, 'utf-8');
        return `file://${outputPath}`;
    }

    // 2. Hàm Gửi SMTP Thật
    public static async sendSMTPEmail(email: string, fullname: string, temporaryPassword: string, lang: string = "en"): Promise<void> {
        try {
            const htmlContent = this.getEmailHtmlContent(fullname, email, temporaryPassword, lang);

            const mailOptions = {
                from: `"Hệ Thống Đăng Ký" <${emailUser}>`, // Tên hiển thị người gửi
                to: email,                                           // Email người nhận
                subject: 'Chào mừng bạn! Thông tin tài khoản mới',    // Tiêu đề Email
                html: htmlContent,                                    // Nội dung dạng HTML
            };

            // Thực hiện gửi email qua SMTP Gmail
            const info = await transporter.sendMail(mailOptions);
            console.log(`[SMTP] Email đã được gửi tới ${email}. Message ID: ${info.messageId}`);
            
        } catch (error) {
            console.error(`[SMTP Error] Lỗi khi gửi email tới ${email}:`, error);
            throw error; // Throw error để controller hoặc nơi gọi hàm có thể bắt và xử lý tiếp
        }
    }
}