const FOX_WATCH_URL = "https://youtu.be/6GWTb8Fs9g0";

/** Tiny muted fox under the Help topic list. Opens YouTube in a new tab. */
export function HelpFoxEgg() {
  return (
    <div className="mt-10 flex justify-center">
      <a
        href={FOX_WATCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Fox"
        aria-label="Fox"
        className="inline-flex min-h-11 min-w-11 items-center justify-center no-underline opacity-35 hover:opacity-55 active:opacity-70"
      >
        <span className="text-[16px] leading-none grayscale" aria-hidden>
          🦊
        </span>
      </a>
    </div>
  );
}
