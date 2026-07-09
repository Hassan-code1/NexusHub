/**
 * @file utils.ts  (src/lib/utils.ts)
 * @description Shared utility functions for the NexusHub web application.
 *
 * `cn` (classNames):
 *  A thin wrapper that combines `clsx` + `tailwind-merge`.
 *
 *  - `clsx`          : Conditionally joins class names. Accepts strings, arrays,
 *                      and objects ({ 'text-red-500': hasError }).
 *  - `tailwind-merge`: Intelligently deduplicates Tailwind CSS classes so that
 *                      later utility classes win over earlier conflicting ones.
 *                      Example: cn('px-2 py-1', 'px-4') → 'py-1 px-4'
 *                      Without merging, both `px-2` and `px-4` would be present,
 *                      causing unpredictable CSS specificity behaviour.
 *
 * Usage:
 *  import { cn } from '@/lib/utils';
 *  <div className={cn('base-class', isActive && 'active-class', className)} />
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Merge and deduplicate Tailwind CSS class names.
 *
 * @param inputs - Any number of class strings, arrays, or conditional objects.
 * @returns      A single deduplicated class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}