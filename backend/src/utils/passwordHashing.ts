import bcrypt from 'bcrypt';

const saltRounds = 10;

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const isValid = await bcrypt.compare(password, hash);
  return isValid;
};

export { hashPassword, comparePassword };