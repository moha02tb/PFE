import * as React from "react"
import PropTypes from "prop-types"

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      className={`shrink-0 bg-slate-200 dark:bg-slate-800 ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} ${className || ""}`}
      {...props}
    />
  )
)
Separator.displayName = "Separator"
Separator.propTypes = {
  className: PropTypes.string,
  orientation: PropTypes.string,
  decorative: PropTypes.bool,
}

export { Separator }
