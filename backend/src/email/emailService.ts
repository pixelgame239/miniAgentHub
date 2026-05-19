import fs from 'fs';
import path from 'path';

export class EmailService {
    public static async sendFakeWelcomeEmail(email: string, fullname: string, temporaryPassword: string): Promise<string> {
        const rootDir = process.cwd(); 
        const templatePath = path.join(rootDir, 'src', 'email', 'emailTemplate.html');
        const outputDir = path.join(rootDir, 'src', 'email', 'tempEmails');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const fileName = `welcome-${email.replace(/[@.]/g, '-')}.html`;
        const outputPath = path.join(outputDir, fileName);
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');
        htmlContent = htmlContent
            .replace(/{{fullname}}/g, fullname)
            .replace('{{email}}', email)
            .replace('{{password}}', temporaryPassword);
        fs.writeFileSync(outputPath, htmlContent, 'utf-8');
        return `file://${outputPath}`;
    }
}