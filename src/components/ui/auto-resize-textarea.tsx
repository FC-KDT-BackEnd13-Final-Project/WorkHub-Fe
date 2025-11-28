import React, { useRef, useEffect, useLayoutEffect } from "react";
import { cn } from "../ui/utils";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
}

const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(
  (
    {
      value,
      onChange,
      className,
      minHeight = "48px", // Default to h-12 equivalent
      maxHeight,
      style,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = useRef<HTMLTextAreaElement>(null);

    // Combine the passed ref with the internal ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(combinedRef.current);
        } else {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            combinedRef.current;
        }
      }
    }, [ref]);

    const adjustHeight = () => {
      if (combinedRef.current) {
        combinedRef.current.style.height = "auto"; // Reset height to recalculate
        let newHeight = combinedRef.current.scrollHeight;

        // Apply minHeight
        if (minHeight) {
          const minH = parseFloat(minHeight);
          if (newHeight < minH) {
            newHeight = minH;
          }
        }

        // Apply maxHeight
        if (maxHeight) {
          const maxH = parseFloat(maxHeight);
          if (newHeight > maxH) {
            newHeight = maxH;
            combinedRef.current.style.overflowY = "auto"; // Enable scroll if max height reached
          } else {
            combinedRef.current.style.overflowY = "hidden"; // Hide scroll otherwise
          }
        } else {
          combinedRef.current.style.overflowY = "hidden"; // Default to hidden if no max height
        }

        combinedRef.current.style.height = `${newHeight}px`;
      }
    };

    // Adjust height on initial mount and when value changes
    useLayoutEffect(adjustHeight, []); // Initial adjustment
    useEffect(adjustHeight, [value, minHeight, maxHeight]); // Adjust on value/height changes

    // Adjust height on window resize
    useEffect(() => {
      window.addEventListener("resize", adjustHeight);
      return () => {
        window.removeEventListener("resize", adjustHeight);
      };
    }, []);

    return (
      <textarea
        ref={combinedRef}
        value={value}
        onChange={onChange}
        className={cn(
          "resize-none overflow-hidden", // Important for auto-resize
          className
        )}
        style={{
          minHeight: minHeight,
          maxHeight: maxHeight,
          ...style,
        }}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };
