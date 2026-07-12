"use client";

import { useState, useEffect } from "react";
import { globalSearch } from "@/actions/search";
import { SearchResult } from "@/types";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Search, FolderOpen, FileText, ArrowUpRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      const data = await globalSearch(query);
      setResults(data);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Search across all your projects and documentation</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="search-input"
          className="pl-10 pr-10 h-11"
          placeholder="Search by project name, framework, language, or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {isLoading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState
              icon={Search}
              title="Start searching"
              description="Type at least 2 characters to search across your projects and documentation."
            />
          </motion.div>
        ) : results.length === 0 && !isLoading ? (
          <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState
              icon={Search}
              title={`No results for "${query}"`}
              description="Try different keywords or check your spelling."
            />
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {results.map((result, i) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={result.type === "project" ? `/projects/${result.id}` : `/documentation/${result.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      result.type === "project" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {result.type === "project" ? <FolderOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {result.type === "project" ? "Project" : "Documentation"}
                        </Badge>
                        {result.framework && (
                          <span className="text-xs text-muted-foreground">{result.framework}</span>
                        )}
                        {result.language && (
                          <span className="text-xs text-muted-foreground">{result.language}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatRelativeTime(result.created_at)}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
