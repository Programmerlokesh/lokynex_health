"use client";

import { EyeIcon, EyeOffIcon } from "@/components/icons/lab-icons";
import type { TextFieldProps } from "@mui/material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";

// Password input with a show / hide (eye) button, so the user can see what
// they typed. Drop-in replacement for <TextField type="password" ... />:
// every normal TextField prop works (label, value, onChange, helperText,
// slotProps.htmlInput, ...). Do not pass `type` — this component owns it.
export type PasswordTextFieldProps = Omit<TextFieldProps, "type" | "variant">;

export function PasswordTextField({
  slotProps,
  ...props
}: PasswordTextFieldProps) {
  const [visible, setVisible] = useState(false);

  // Keep any slotProps the caller passed (e.g. htmlInput minLength) and
  // only add our own eye button on the input's end.
  const inputSlot = (slotProps?.input ?? {}) as Record<string, unknown>;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...inputSlot,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                size="small"
                tabIndex={-1}
                aria-label={visible ? "Hide password" : "Show password"}
              >
                {visible ? (
                  <EyeOffIcon fontSize="small" />
                ) : (
                  <EyeIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
