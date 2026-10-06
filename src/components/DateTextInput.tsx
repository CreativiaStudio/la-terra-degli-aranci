"use client";

import { useId, useState } from "react";
import { isoToItalian, italianToIso, maskItalianDate } from "@/lib/dateInput";

interface DateTextInputProps {
  /** Data in formato ISO yyyy-mm-dd oppure stringa vuota. */
  value: string;
  onChange: (isoValue: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const INVALID_DATE_MESSAGE = "Data non valida (età compresa tra 16 e 110 anni)";

export default function DateTextInput({
  value,
  onChange,
  error,
  label,
  required,
  disabled,
  className,
}: DateTextInputProps) {
  const inputId = useId();
  const [display, setDisplay] = useState<string>(() => isoToItalian(value));
  const [invalid, setInvalid] = useState(false);

  const [prevValue, setPrevValue] = useState(value);

  // Riallinea il testo digitato quando il valore ISO cambia dall'esterno (es. ripristino bozza).
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const italian = isoToItalian(value);
      if (italian && italian !== display) {
        setDisplay(italian);
        setInvalid(false);
      }
    } else if (display && italianToIso(display)) {
      setDisplay("");
      setInvalid(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskItalianDate(e.target.value);
    setDisplay(masked);

    if (masked.length === 10) {
      const iso = italianToIso(masked);
      if (iso) {
        setInvalid(false);
        onChange(iso);
      } else {
        setInvalid(true);
        onChange("");
      }
      return;
    }

    setInvalid(false);
    if (value) onChange("");
  };

  const message = invalid ? INVALID_DATE_MESSAGE : error;
  const showAsterisk = required && label && !label.trim().endsWith("*");

  return (
    <div className={`form-group ${className ?? ""}`.trim()}>
      {label && (
        <label htmlFor={inputId}>
          {label}
          {showAsterisk ? " *" : ""}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        placeholder="gg/mm/aaaa"
        maxLength={10}
        autoComplete="bday"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${inputId}-error` : undefined}
        style={{
          letterSpacing: "0.06em",
          fontVariantNumeric: "tabular-nums",
          ...(message ? { borderColor: "var(--error)", background: "#fff8f8" } : null),
        }}
      />
      {message && (
        <span id={`${inputId}-error`} role="alert" className="error-msg">
          {message}
        </span>
      )}
    </div>
  );
}
