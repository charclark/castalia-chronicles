// Shared cover display — works in both server and client components.
// For uploaded covers: render an <img> pointing to the cover API route.
// For preset backgrounds: render the background image with a gradient scrim
// and the book title / author name overlaid.

type Props = {
  submissionId: string;
  hasCoverImage: boolean;
  coverBgIndex: number | null;
  bookTitle: string;
  authorName: string;
  width?: number;
};

export default function DiscoverBooksCover({
  submissionId,
  hasCoverImage,
  coverBgIndex,
  bookTitle,
  authorName,
  width = 200,
}: Props) {
  const height = Math.round(width * 1.5);

  if (hasCoverImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/discover-books-cover/${submissionId}`}
        alt={`Cover of ${bookTitle}`}
        style={{ width, height, objectFit: "cover", display: "block" }}
      />
    );
  }

  if (coverBgIndex) {
    const titleSize = Math.max(10, Math.round(width * 0.085));
    const authorSize = Math.max(8, Math.round(width * 0.065));
    return (
      <div style={{ position: "relative", width, height, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/cover-backgrounds/cover-bg-${coverBgIndex}.jpg`}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.08) 100%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "1rem 0.75rem 0.85rem",
          textAlign: "center",
        }}>
          {bookTitle && (
            <p style={{
              fontFamily: "var(--font-heading)", fontSize: `${titleSize}px`,
              fontWeight: 400, color: "#fff", letterSpacing: "0.04em", lineHeight: 1.2,
              margin: "0 0 0.35rem", wordBreak: "break-word",
            }}>
              {bookTitle}
            </p>
          )}
          {authorName && (
            <p style={{
              fontFamily: "var(--font-body)", fontSize: `${authorSize}px`,
              color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em",
              margin: 0, wordBreak: "break-word",
            }}>
              {authorName}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div style={{
      width, height,
      background: "linear-gradient(160deg, #1a1015 0%, #0d0810 100%)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0.75rem",
      textAlign: "center",
    }}>
      <p style={{
        fontFamily: "var(--font-heading)", fontSize: `${Math.max(10, Math.round(width * 0.08))}px`,
        color: "rgba(255,255,255,0.4)", lineHeight: 1.2, margin: 0, wordBreak: "break-word",
      }}>
        {bookTitle}
      </p>
    </div>
  );
}
