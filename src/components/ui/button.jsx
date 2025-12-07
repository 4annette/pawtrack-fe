import React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-blue-600 text-white shadow hover:bg-blue-700",
    outline: "border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
  };
  
  const variantClass = variants[variant] || variants.default;
  
  return (
    <button
      ref={ref}
      className={cn(baseStyles, variantClass, "h-9 px-4 py-2", className)}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };