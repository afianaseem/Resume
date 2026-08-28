import { COUNTRY_CODES, findCountryByDial } from "../countryCodes";

/**
 * A phone number field made of a country-code <select> dropdown plus a
 * digits-only number input. The two pieces are combined by the parent
 * into a single "+92 3001234567" style string for storage/display.
 */
export default function PhoneField({
  countryDial,
  number,
  onCountryChange,
  onNumberChange,
  required = false,
  error,
}) {
  const country = findCountryByDial(countryDial);
  const allowedLengths = country?.nationalLengths || [7, 15];
  const maxDigits = Math.max(...allowedLengths);

  return (
    <label className="field-label">
      Phone {required && <span className="required-mark">*</span>}
      <div className={`phone-field ${error ? "field-invalid" : ""}`}>
        <select
          className="phone-country-select"
          value={countryDial}
          onChange={(e) => onCountryChange(e.target.value)}
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.iso}-${c.dial}`} value={c.dial}>
              {c.name} ({c.dial})
            </option>
          ))}
        </select>

        <input
          className="phone-number-input"
          type="tel"
          inputMode="numeric"
          value={number}
          maxLength={maxDigits}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
            onNumberChange(digits);
          }}
          placeholder={country?.iso === "PK" ? "3001234567" : "Enter digits only"}
          aria-label="Phone number"
        />
      </div>
      {error ? (
        <span className="field-error-text">{error}</span>
      ) : (
        <span className="field-help-text">
          {allowedLengths.length === 1
            ? `${allowedLengths[0]} digits required`
            : `${allowedLengths.join(" or ")} digits required`}
        </span>
      )}
    </label>
  );
}
