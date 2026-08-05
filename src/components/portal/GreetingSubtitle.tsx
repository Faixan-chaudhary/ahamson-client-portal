import { getStoredUser } from "@/lib/auth";
import { displayName, getTimeGreeting } from "@/lib/greeting";
import { GOLD } from "@/lib/constants";

export function GreetingSubtitle() {
  const user = getStoredUser();
  const { greeting, Icon } = getTimeGreeting();
  const name = displayName(user?.name);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-white/70">
        {greeting}
        {name ? (
          <>
            {", "}
            <span className="text-white/90 font-medium">{name}</span>
          </>
        ) : null}
      </span>
      <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-90 -translate-y-px" style={{ color: GOLD }} strokeWidth={2} />
    </span>
  );
}
