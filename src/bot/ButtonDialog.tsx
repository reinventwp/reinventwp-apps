import { useState, type ReactNode } from "react";
import DialogBlur from "./DialogBlur";

interface ButtonDialogProps {
  /** Dialog title. */
  title: string;
  /** The button that opens the dialog; it gets the open function. */
  button: (open: () => void) => ReactNode;
  /** Dialog content; it gets the close function (rendered only while open). */
  children: (close: () => void) => ReactNode;
  closeLabel: string;
  maxWidth?: "xs" | "sm" | "md";
}

/**
 * A button and the DialogBlur it opens, with the open state inside (same idea as ButtonDialog in
 * the Text to Speech admin). Copied here so bot.js stays self-contained.
 */
export default function ButtonDialog({ title, button, children, closeLabel, maxWidth = "xs" }: ButtonDialogProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {button(() => setOpen(true))}
      <DialogBlur title={title} open={open} onClose={close} closeLabel={closeLabel} maxWidth={maxWidth}>
        {open && children(close)}
      </DialogBlur>
    </>
  );
}
