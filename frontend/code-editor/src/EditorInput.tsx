import { Box, Field, Input, Textarea, VStack } from "@chakra-ui/react";
import { type ChangeEvent, useState } from "react";

export interface EditorInputProps {
  /**
   * Label for the input field
   */
  label: string;
  
  /**
   * Initial value of the input
   */
  initialValue?: string;
  
  /**
   * Whether to use multiline text input
   */
  multiline?: boolean;
  
  /**
   * Callback for when the value changes
   */
  onChange?: (value: string) => void;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
}

/**
 * EditorInput component
 * 
 * A styled input/textarea component using Chakra UI v3 with modern API
 */
export function EditorInput({
  label,
  initialValue = "",
  multiline = false,
  onChange,
  placeholder = "Enter text...",
}: EditorInputProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Box width="100%">
      <Field.Root>
        <VStack align="start" gap={2}>
          <Field.Label 
            fontSize="sm" 
            fontWeight="medium" 
            color="fg.muted"
            mb={0}
          >
            {label}
          </Field.Label>
          
          {multiline ? (
            <Textarea
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              size="md"
              colorPalette="blue"
              borderColor="border.muted"
              _hover={{ borderColor: "border.emphasized" }}
              _focus={{ 
                borderColor: "colorPalette.solid", 
                boxShadow: "0 0 0 1px var(--chakra-colors-colorPalette-solid)" 
              }}
              minHeight="120px"
            />
          ) : (
            <Input
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              size="md"
              colorPalette="blue"
              borderColor="border.muted"
              _hover={{ borderColor: "border.emphasized" }}
              _focus={{ 
                borderColor: "colorPalette.solid", 
                boxShadow: "0 0 0 1px var(--chakra-colors-colorPalette-solid)" 
              }}
            />
          )}
        </VStack>
      </Field.Root>
    </Box>
  );
}