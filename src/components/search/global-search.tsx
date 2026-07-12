"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearch } from "@/actions/search";
import { SearchResult } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Search, FolderOpen, FileText, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="mx-auto mt-20 max-w-xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, documentation..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              id="global-search-input"
            />
            {isLoading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
            <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {results.length > 0 ? (
              <div className="p-2">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={
                      result.type === "project"
                        ? `/projects/${result.id}`
                        : `/documentation/${result.id}`
                    }
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className={cn(
                      "p-1.5 rounded-md shrink-0",
                      result.type === "project" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {result.type === "project" ? (
                        <FolderOpen className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.type === "project" ? (
                          <>
                            {result.framework && <span>{result.framework} • </span>}
                            {result.language && <span>{result.language} • </span>}
                          </>
                        ) : (
                          "Documentation • "
                        )}
                        {formatRelativeTime(result.created_at)}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No results for &quot;{query}&quot;
              </div>
            ) : query.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-xs">
                Type to search projects and documentation...
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
