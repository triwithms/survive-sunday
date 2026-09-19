import {
  defaultWeekForPath,
  parseWeekParam,
  resolvePageWeekNumber,
  weekNavForPath,
} from "@/lib/weeks";

export function headerWeekSelection({
  pathname,
  weekParam,
  weekNumbers,
  currentWeek,
  pickActionWeek,
}: {
  pathname: string;
  weekParam: string | null;
  weekNumbers: number[];
  currentWeek: number;
  pickActionWeek?: number;
}) {
  const route = weekNavForPath(pathname);
  const defaultWeek = defaultWeekForPath({
    basePath: route?.basePath ?? "",
    poolCurrentWeek: currentWeek,
    pickActionWeek,
  });
  const selectedWeek = resolvePageWeekNumber({
    requested: route ? parseWeekParam(weekParam) : null,
    weekNumbers,
    basePath: route?.basePath ?? "",
    poolCurrentWeek: currentWeek,
    pickActionWeek,
    allowFuture: route?.allowFuture ?? false,
  });
  return { route, defaultWeek, selectedWeek };
}
