const fs = require('fs/promises');

const fileExists = async (path) => {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  fileExists,
};
