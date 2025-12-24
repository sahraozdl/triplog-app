interface TravelCardFilesProps {
  files: Array<{ name: string; url: string }>;
}

export function TravelCardFiles({ files }: TravelCardFilesProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
        Route Images ({files.length})
      </div>
      <div className="flex flex-wrap gap-1">
        {files.slice(0, 3).map((file, idx) => (
          <a
            key={idx}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
            aria-label={`View image: ${file.name}`}
          >
            {file.name}
          </a>
        ))}
        {files.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{files.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}
