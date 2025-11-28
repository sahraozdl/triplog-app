"use client";

import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (isoString: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DateTimePicker({ value, onChange, className }: Props) {
  const toLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange("");
      return;
    }
    const date = new Date(e.target.value);
    onChange(date.toISOString());
  };

  return (
    <Input
      type="datetime-local"
      value={toLocalDatetime(value)}
      onChange={handleChange}
      className={className}
    />
  );
}
