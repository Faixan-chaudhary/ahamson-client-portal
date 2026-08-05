export const portalControlBase =
  "rounded-xl border border-[#0B1F3A]/12 bg-[#F8F9FC] text-[#0B1F3A] text-sm " +
  "placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30 focus:border-[#F7931E] transition-all";

export const portalInputClass = `w-full py-1.5 ${portalControlBase}`;

export const portalInputPadding = {
  default: "px-3",
  withIcon: "pl-9 pr-3",
} as const;

export const portalControlIconLeft = "left-3";
