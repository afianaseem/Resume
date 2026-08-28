// Calendar date pickers for a start/end date pair, with a "currently
// ongoing" checkbox that disables + clears the end date, and inline
// validation display (start date required, end date after start date).
export default function DateRangeFields({
  startDate,
  endDate,
  current,
  onStartChange,
  onEndChange,
  onCurrentChange,
  required = false,
  errors = {},
  currentLabel = "I currently work here",
  showCurrent = true,
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="date-range-fields">
      <label className="field-label">
        Start date {required && <span className="required-mark">*</span>}
        <input
          type="date"
          className={errors.start ? "field-invalid" : ""}
          value={startDate || ""}
          max={today}
          onChange={(e) => onStartChange(e.target.value)}
        />
        {errors.start && (
          <span className="field-error-text">{errors.start}</span>
        )}
      </label>

      <label className="field-label">
        End date {required && !current && <span className="required-mark">*</span>}
        <input
          type="date"
          className={errors.end ? "field-invalid" : ""}
          value={endDate || ""}
          min={startDate || undefined}
          disabled={current}
          onChange={(e) => onEndChange(e.target.value)}
        />
        {errors.end && <span className="field-error-text">{errors.end}</span>}

        {showCurrent && (
          <span className="date-current-check">
            <label>
              <input
                type="checkbox"
                checked={!!current}
                onChange={(e) => onCurrentChange(e.target.checked)}
              />
              {currentLabel}
            </label>
          </span>
        )}
      </label>
    </div>
  );
}
