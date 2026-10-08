import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState, type SubmitEvent } from 'react';

import {
  AutocompleteCollection,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompletePortal,
  AutocompletePositioner,
  AutocompleteRoot,
  AutocompleteStatus,
} from '@/components/ui/autocomplete';
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

interface SearchBoxProps {
  initialQuery?: string;
}

export function SearchBox({ initialQuery }: Readonly<SearchBoxProps>) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery ?? '');
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
    void navigate({ to: '/news', search: { q: query.trim() || undefined } });
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    search();
  }

  function select(item: Suggestion) {
    if (item.kind === 'source') {
      void navigate({
        to: '/',
        search: { source: item.slug },
      });
    } else {
      void navigate({ to: '/articles/$id', params: { id: item.id } });
    }
    setQuery('');
  }

  return (
    <AutocompleteRoot
      items={groups}
      value={query}
      onValueChange={(value, details) => {
        if (details.reason !== 'item-press') setQuery(value);
      }}
      itemToStringValue={(item) => item.label}
      onItemHighlighted={(item) => setHasHighlight(item !== undefined)}
      mode="none"
    >
      <search className="w-full border-2 border-foreground bg-card has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-3 has-[input:focus-visible]:outline-ring sm:w-72">
        <form onSubmit={submit} className="flex items-center">
          <label htmlFor="site-search" className="sr-only">
            ค้นหาข่าว
          </label>
          <AutocompleteInput
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
        <AutocompletePortal hidden={!showPortal}>
          <AutocompletePositioner sideOffset={4}>
            <AutocompletePopup>
              <AutocompleteStatus>
                {statusMessage !== null && <div className="px-3 py-2">{statusMessage}</div>}
              </AutocompleteStatus>
              <AutocompleteList>
                {(group: SuggestionGroup) => (
                  <AutocompleteGroup key={group.value} items={group.items}>
                    <AutocompleteGroupLabel>{group.value}</AutocompleteGroupLabel>
                    <AutocompleteCollection>
                      {(item: Suggestion) => (
                        <AutocompleteItem
                          key={suggestionKey(item)}
                          value={item}
                          onClick={() => select(item)}
                        >
                          {item.label}
                        </AutocompleteItem>
                      )}
                    </AutocompleteCollection>
                  </AutocompleteGroup>
                )}
              </AutocompleteList>
            </AutocompletePopup>
          </AutocompletePositioner>
        </AutocompletePortal>
      </search>
    </AutocompleteRoot>
  );
}
