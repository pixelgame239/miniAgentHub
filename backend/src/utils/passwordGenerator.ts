const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateRandomPassword = (length: number): string => {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

const createRandomPassword = (): string => {
  return generateRandomPassword(6);
};
const createRandomMagicLink = (): string => {
  return generateRandomPassword(32);
}

export { createRandomPassword, createRandomMagicLink };