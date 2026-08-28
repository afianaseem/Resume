const COMMON_WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789",
  "qwerty123", "letmein", "iloveyou", "admin123", "welcome1",
  "abc12345", "111111111", "changeme", "qwertyuiop", "1q2w3e4r",
]);

// Returns { score (0-4), label, checks: {...}, isStrongEnough }.
// isStrongEnough mirrors the backend's minimum bar so the frontend never
// lets a person submit a password the API will reject anyway.
export function evaluatePassword(password) {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(password),
    notCommon: !COMMON_WEAK_PASSWORDS.has(password.toLowerCase()),
  };

  const isStrongEnough =
    checks.length &&
    checks.lowercase &&
    checks.uppercase &&
    checks.number &&
    checks.special &&
    checks.notCommon;

  let score = 0;
  if (password.length > 0) score = 1;
  if (checks.length && (checks.lowercase || checks.uppercase)) score = 2;
  if (checks.length && checks.lowercase && checks.uppercase && checks.number) score = 3;
  if (isStrongEnough) score = 4;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return {
    score,
    label: labels[score],
    checks,
    isStrongEnough,
  };
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const { score, label, checks } = evaluatePassword(password);
  const barClass = ["weak", "weak", "fair", "good", "strong"][score];

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`password-strength-bar ${
              i < score ? barClass : ""
            }`}
          />
        ))}
      </div>

      <div className={`password-strength-label ${barClass}`}>{label}</div>

      <ul className="password-strength-checklist">
        <li className={checks.length ? "met" : ""}>At least 8 characters</li>
        <li className={checks.uppercase ? "met" : ""}>One uppercase letter</li>
        <li className={checks.lowercase ? "met" : ""}>One lowercase letter</li>
        <li className={checks.number ? "met" : ""}>One number</li>
        <li className={checks.special ? "met" : ""}>One special character</li>
      </ul>
    </div>
  );
}
