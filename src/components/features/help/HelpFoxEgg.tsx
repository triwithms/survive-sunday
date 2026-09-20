const FOX_WATCH_URL = "https://youtu.be/6GWTb8Fs9g0";
const FOX_SRC = "/help/silver-fox.png";
const FOX_SIZE_PX = 64;

/** Quiet fox under the Help topic list. Opens YouTube in a new tab. */
export function HelpFoxEgg() {
  return (
    <div className="mt-10 flex justify-center">
      <a
        href={FOX_WATCH_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Fox"
        aria-label="Fox"
        className="inline-flex min-h-11 min-w-11 items-center justify-center no-underline opacity-80 hover:opacity-95 active:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOX_SRC}
          alt=""
          width={FOX_SIZE_PX}
          height={FOX_SIZE_PX}
          className="object-contain"
          style={{ width: FOX_SIZE_PX, height: FOX_SIZE_PX }}
          aria-hidden
        />
      </a>
    </div>
  );
}
