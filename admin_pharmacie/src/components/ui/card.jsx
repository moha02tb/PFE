import * as React from "react"

// Smart class merger to prevent Tailwind conflicts (especially padding)
function cn(base, custom = "") {
  if (!custom) return base;
  let merged = base;
  // If your layout passes custom paddings, remove the default ones so they don't fight
  if (/\bp-/.test(custom) || /\bpx-/.test(custom) || /\bpy-/.test(custom) || /\bpt-/.test(custom) || /\bpb-/.test(custom)) {
    merged = merged.replace(/\bp-\d+\b/g, "").replace(/\bpt-\d+\b/g, "").replace(/\bpb-\d+\b/g, "").replace(/\bpx-\d+\b/g, "").replace(/\bpy-\d+\b/g, "");
  }
  return `${merged} ${custom}`.trim().replace(/\s+/g, ' ');
}

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }