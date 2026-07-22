import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// ENCRYPTION_KEY phải đủ 32 bytes (256 bits), lưu trong file .env
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'); 
const IV_LENGTH = 12; // Chiều dài vector khởi tạo cho GCM

// 1. Hàm mã hóa để lưu vào DB
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Trả về chuỗi ghép bởi IV, AuthTag và bản mã để lưu vào 1 cột trong DB
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// 2. Hàm giải mã để lấy lại API Key gốc khi gọi API
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format.');
  }

  // Khai báo rõ ràng đây là một Tuple có đúng 3 phần tử kiểu string
  const [ivHex, authTagHex, encryptedText] = parts as [string, string, string];
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}