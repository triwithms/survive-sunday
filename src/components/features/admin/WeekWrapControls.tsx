import {
  WEEK_WRAP_TONE_LABEL,
  WEEK_WRAP_TONES,
  type WeekWrapBlocks,
  type WeekWrapTone,
  type WeekWrapWeekOption,
} from "@/lib/week-wrap-types";

const BLOCKS: { key: keyof WeekWrapBlocks; label: string }[] = [
  { key: "roster", label: "Won / lost / eliminated this week" },
  { key: "picks", label: "Each player's team helmet + pick" },
  { key: "board", label: "Pool leaderboard, NFL divisions, board link" },
  { key: "drama", label: "One-line drama (Funny email, once a banter paste exists)" },
];

const field =
  "w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3";

export function WeekWrapControls(props: {
  weeks: WeekWrapWeekOption[];
  weekNumber: number;
  onWeek: (week: number) => void;
  tone: WeekWrapTone;
  onTone: (tone: WeekWrapTone) => void;
  blocks: WeekWrapBlocks;
  onToggle: (key: keyof WeekWrapBlocks) => void;
  status: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Week</span>
        <select
          className={field}
          value={props.weekNumber}
          onChange={(e) => props.onWeek(Number(e.target.value))}
          data-testid="week-wrap-week"
        >
          {props.weeks.map((week) => (
            <option key={week.number} value={week.number}>
              Week {week.number}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-[var(--text-muted)]" data-testid="week-wrap-status">
        {props.status}
      </p>
      <fieldset className="space-y-1">
        <legend className="text-sm text-[var(--text-muted)]">Tone</legend>
        {WEEK_WRAP_TONES.map((tone) => (
          <label key={tone} className="flex items-center gap-2 min-h-11 text-sm">
            <input
              type="radio"
              name="week-wrap-tone"
              checked={props.tone === tone}
              onChange={() => props.onTone(tone)}
              data-testid={`week-wrap-tone-${tone}`}
            />
            {WEEK_WRAP_TONE_LABEL[tone]}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="text-sm text-[var(--text-muted)]">Include</legend>
        {BLOCKS.map((block) => (
          <label key={block.key} className="flex items-center gap-2 min-h-11 text-sm">
            <input
              type="checkbox"
              checked={props.blocks[block.key]}
              onChange={() => props.onToggle(block.key)}
              data-testid={`week-wrap-block-${block.key}`}
            />
            {block.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
