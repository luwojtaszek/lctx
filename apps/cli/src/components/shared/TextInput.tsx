import { Text, useInput } from "ink";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "./AppContext.js";

interface TextInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  validate?: (value: string) => string | null;
  focus?: boolean;
}

export function TextInput({
  placeholder = "",
  value: controlledValue,
  onChange,
  onSubmit,
  validate,
  focus = true,
}: TextInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const { setSuppressExit, setShowExitHint } = useContext(AppContext);

  const value = controlledValue ?? internalValue;
  const setValue = onChange ?? setInternalValue;

  // Use ref to track latest value to avoid stale closure issues during paste
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Suppress exit when focused and has content
  useEffect(() => {
    if (focus) {
      setSuppressExit(!!value);
    }
    return () => setSuppressExit(false);
  }, [value, focus, setSuppressExit]);

  useInput(
    (input, key) => {
      if (!focus) return;

      // Handle Ctrl+C: clear if has content
      if (input === "c" && key.ctrl) {
        if (valueRef.current) {
          setValue("");
          setError(null);
          setShowExitHint(true);
        }
        return;
      }

      if (key.return) {
        if (validate) {
          const validationError = validate(valueRef.current);
          if (validationError) {
            setError(validationError);
            return;
          }
        }
        setError(null);
        onSubmit?.(valueRef.current);
      } else if (key.backspace || key.delete) {
        setValue(valueRef.current.slice(0, -1));
        setError(null);
      } else if (!key.ctrl && !key.meta && input) {
        setValue(valueRef.current + input);
        setError(null);
      }
    },
    { isActive: focus },
  );

  const displayValue = value || placeholder;
  const isPlaceholder = !value && placeholder;

  return (
    <Text>
      <Text color={isPlaceholder ? "gray" : undefined}>{displayValue}</Text>
      {focus && cursorVisible && <Text color="cyan">█</Text>}
      {error && <Text color="red"> {error}</Text>}
    </Text>
  );
}
