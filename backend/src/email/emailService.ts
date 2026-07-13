import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { MyError } from '../utils/MyError';

dotenv.config();

const emailUser = process.env.EMAIL_USER || "";
const emailPass = process.env.EMAIL_PASS || "";
const PROXY_URL = process.env.HTTPS_PROXY || ""; 
let transporter: nodemailer.Transporter;

// KIỂM TRA ĐIỀU KIỆN ĐỘNG
if (PROXY_URL) {
    
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
        // logger: true,
        // debug: true
    };
    
    transporter = nodemailer.createTransport(proxyConfig);
} else {
    
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
                from: `${lang=== "vi" ? "Hệ Thống Đăng Ký" : "System Registration"} <${emailUser}>`, // Tên hiển thị người gửi
                to: email,                                           // Email người nhận
                subject: `${lang=== "vi" ? "Chào mừng bạn!" : "Welcome!"} ${lang=== "vi" ? "Thông tin tài khoản mới" : "New Account Information"}`,    // Tiêu đề Email
                html: htmlContent,                                    // Nội dung dạng HTML
            };

            // Thực hiện gửi email qua SMTP Gmail
            const info = await transporter.sendMail(mailOptions);
            console.log(`[SMTP] Email sent to ${email}. Message ID: ${info.messageId}`);
            
        } catch (error) {
            console.error(`[SMTP Error] Error sending email to ${email}:`, error);
            throw new MyError("Cannot send email", 500);
        }
    }
}