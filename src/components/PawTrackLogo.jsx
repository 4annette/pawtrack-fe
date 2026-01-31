import React from "react";
import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

const PawTrackLogo = ({ className, size = "md" }) => {
  
  const boxClasses = {
    sm: "p-1 rounded-md",
    md: "p-1.5 rounded-lg",
    lg: "p-2 rounded-xl",
    xl: "p-5 rounded-2xl shadow-md",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-20 h-20",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-5xl",
  };

  return (
    <div className={cn("flex items-center gap-3 font-bold text-gray-900", className)}>
      
      <Link 
        to="/dashboard" 
        className={cn(
          "bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors", 
          boxClasses[size]
        )}
      >
        <PawPrint className={cn(iconSizes[size])} />
      </Link>

      <span className={cn("font-display tracking-tight", textClasses[size])}>
        Paw<span className="text-emerald-600">Track</span>
      </span>
      
    </div>
  );
};

export default PawTrackLogo;