import { Autocomplete } from '@base-ui/react/autocomplete';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState, type SubmitEvent } from 'react';

import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SuggestResult } from '@/lib/api';
import { suggestQuery } from '@/utils/feed';

type Suggestion =
  | { kind: 'source'; slug: string; label: string }
  | { kind: 'article'; id: string; label: string };

interface SuggestionGroup {
  value: string;
  items: Suggestion[];
}

function suggestionKey(item: Suggestion) {
  return item.kind === 'source' ? `source-${item.slug}` : `article-${item.id}`;
}

function groupSuggestions(data: SuggestResult | undefined): SuggestionGroup[] {
  if (!data) return [];
  const groups: SuggestionGroup[] = [];
  if (data.sources.length > 0) {
    groups.push({
      value: 'หน่วยงาน',
      items: data.sources.map((source) => ({
        kind: 'source',
        slug: source.slug,
        label: source.name_th,
      })),
    });
  }
  if (data.articles.length > 0) {
    groups.push({
      value: 'ข่าว',
      items: data.articles.map((article) => ({
        kind: 'article',
        id: article.id,
        label: article.title,
      })),
    });
  }
  return groups;
}

export function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hasHighlight, setHasHighlight] = useState(false);
  const debounced = useDebouncedValue(query);
  const { data, isFetching } = useQuery(suggestQuery(debounced));
  const groups = useMemo(() => groupSuggestions(data), [data]);

  let statusMessage: string | null = null;
  if (groups.length === 0) {
    if (isFetching) statusMessage = 'กำลังค้นหา…';
    else if (debounced.length > 0) statusMessage = 'ไม่พบคำแนะนำ';
  }
  const showPortal = groups.length > 0 || statusMessage !== null;

  function search() {
    void navigate({
      to: '/',
      search: {
        q: query.trim() || undefined,
        category: undefined,
        source: undefined,
        cursor: undefined,
      },
    });
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    search();
  }

  function select(item: Suggestion) {
    if (item.kind === 'source') {
      void navigate({
        to: '/',
        search: { q: undefined, category: undefined, source: item.slug, cursor: undefined },
      });
    } else {
      void navigate({ to: '/articles/$id', params: { id: item.id } });
    }
    setQuery('');
  }

  return (
    <Autocomplete.Root
      items={groups}
      value={query}
      onValueChange={(value, details) => {
        if (details.reason !== 'item-press') setQuery(value);
      }}
      itemToStringValue={(item) => item.label}
      onItemHighlighted={(item) => setHasHighlight(item !== undefined)}
      mode="none"
    >
      <search className="w-full border-2 border-foreground bg-card sm:w-72">
        <form onSubmit={submit} className="flex items-center">
          <label htmlFor="site-search" className="sr-only">
            ค้นหาข่าว
          </label>
          <Autocomplete.Input
            id="site-search"
            type="search"
            autoComplete="off"
            placeholder="ค้นหาข่าวหรือหน่วยงาน"
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !hasHighlight) {
                event.preventDefault();
                search();
              }
            }}
          />
          <Button type="submit" aria-label="ค้นหา" variant="solid" size="icon">
            <Search aria-hidden="true" className="size-4" />
          </Button>
        </form>
        <Autocomplete.Portal hidden={!showPortal}>
          <Autocomplete.Positioner sideOffset={4} className="z-50">
            <Autocomplete.Popup className="w-(--anchor-width) border-2 border-foreground bg-card">
              <Autocomplete.Status>
                {statusMessage !== null && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">{statusMessage}</div>
                )}
              </Autocomplete.Status>
              <Autocomplete.List className="max-h-80 overflow-y-auto py-1 data-empty:hidden">
                {(group: SuggestionGroup) => (
                  <Autocomplete.Group key={group.value} items={group.items}>
                    <Autocomplete.GroupLabel className="block px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground select-none">
                      {group.value}
                    </Autocomplete.GroupLabel>
                    <Autocomplete.Collection>
                      {(item: Suggestion) => (
                        <Autocomplete.Item
                          key={suggestionKey(item)}
                          value={item}
                          onClick={() => select(item)}
                          className="cursor-default px-3 py-2 text-sm text-foreground data-highlighted:bg-foreground data-highlighted:text-primary-foreground"
                        >
                          {item.label}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.Collection>
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </search>
    </Autocomplete.Root>
  );
}
