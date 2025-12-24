"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Copy } from "lucide-react";

export default function InviteView({ tripId }: { tripId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);
  //not working well right know since there is no invite logic entegrated yet
  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) setCode(data.code);
    } finally {
      setLoading(false);
    }
  };

  if (!code) {
    return (
      <Button onClick={generate} disabled={loading} className="w-full mt-4">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Code
      </Button>
    );
  }

  return (
    <div className="space-y-6 mt-4 text-center">
      <div className="p-4 bg-muted/50 rounded-xl font-mono text-3xl font-bold tracking-widest">
        {code}
      </div>
      <div className="flex items-center gap-2 p-2 bg-muted/30 border rounded-lg text-xs text-muted-foreground">
        <span className="truncate flex-1">
          {origin}/join/{code}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() =>
            navigator.clipboard.writeText(`${origin}/join/${code}`)
          }
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
