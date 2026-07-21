// validators/authValidator.js

const NAME_REGEX = /^(?=.*[a-zA-Z])[a-zA-Z0-9\s'-]+$/; // must contain letters, can't be only numbers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function validateName(name) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Name is required.";
  }
  if (!NAME_REGEX.test(name.trim())) {
    return "Name must contain letters and cannot be only numbers.";
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return "A valid email is required.";
  }
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return "Password is required.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[@!]/.test(password)) {
    return "Password must contain at least one @ or !.";
  }
  return null;
}

function validateSignupInput({ name, email, password }) {
  const errors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateSignupInput,
  validateName,
  validateEmail,
  validatePassword,
};