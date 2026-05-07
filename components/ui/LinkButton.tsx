import Link from "next/link";
import { type ComponentProps } from "react";
import { buttonVariants, type ButtonVariant, type ButtonSize } from "./Button";

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonVariants({ variant, size, className })} {...props} />;
}
