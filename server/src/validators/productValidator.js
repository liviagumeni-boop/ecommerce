const NAME_MAX_LENGTH = 15;

function validateProductName(name) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Product name is required.";
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return `Product name must be ${NAME_MAX_LENGTH} characters or less.`;
  }
  return null;
}

module.exports = { validateProductName };