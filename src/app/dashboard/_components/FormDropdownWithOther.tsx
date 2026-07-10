"use client";

import { FormDropdown, type FormDropdownOption } from "./FormDropdown";

export const CUSTOM_OPTION_VALUE = "__custom__";

const inputClass =
  "h-10 w-full rounded-xl border border-black/10 bg-[#F9FAFB] px-3 text-[12px] text-[#1f2b20] outline-none placeholder:text-[#9aa39a] focus:border-[#214e3a]/35 focus:ring-1 focus:ring-[#214e3a]/20";

export function FormDropdownWithOther({
  options,
  value,
  customValue,
  onValueChange,
  onCustomValueChange,
  placeholder,
  "aria-label": ariaLabel,
  customPlaceholder = "Specifica valore",
  otherLabel = "Altro",
  disabled = false,
}: {
  options: string[];
  value: string;
  customValue: string;
  onValueChange: (value: string) => void;
  onCustomValueChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  customPlaceholder?: string;
  otherLabel?: string;
  disabled?: boolean;
}) {
  const dropdownOptions: FormDropdownOption[] = [
    ...options.map((option) => ({ value: option, label: option })),
    { value: CUSTOM_OPTION_VALUE, label: otherLabel },
  ];

  return (
    <div className="space-y-2">
      <FormDropdown
        options={dropdownOptions}
        value={value}
        onChange={onValueChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
      />
      {value === CUSTOM_OPTION_VALUE ? (
        <input
          type="text"
          value={customValue}
          onChange={(event) => onCustomValueChange(event.target.value)}
          placeholder={customPlaceholder}
          className={inputClass}
        />
      ) : null}
    </div>
  );
}

export function resolvePresetSelection(presets: string[], rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return { selection: "", custom: "" };
  if (presets.includes(trimmed)) return { selection: trimmed, custom: "" };
  return { selection: CUSTOM_OPTION_VALUE, custom: trimmed };
}

export function getPresetOrCustomValue(selection: string, custom: string) {
  if (!selection) return "";
  if (selection === CUSTOM_OPTION_VALUE) return custom.trim();
  return selection;
}
