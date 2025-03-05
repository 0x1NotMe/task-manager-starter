"use client";

import * as React from "react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TermTooltipProps {
  term: string;
  explanation: string;
  showIcon?: boolean;
}

export function TermTooltip({ term, explanation, showIcon = true }: TermTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center cursor-help">
          {term}
          {showIcon && (
            <InfoCircledIcon className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-sm">{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
} 