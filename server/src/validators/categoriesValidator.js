const NAME_MAX_LENGTH = 15;

function validateCategoryName(name) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Category name is required.";
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    return `Category name must be ${NAME_MAX_LENGTH} characters or less.`;
  }
  return null;
}

module.exports = { validateCategoryName };