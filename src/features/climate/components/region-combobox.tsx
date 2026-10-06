import { useMemo, useState, type KeyboardEvent } from 'react';

import type { Region } from '@/features/climate/types';

type RegionComboboxProps = {
  regionId: string;
  regions: Region[];
};

function normalizeSearch(value: string) {
  return value.replace(/\s/g, '').toLocaleLowerCase('ko-KR');
}

export function RegionCombobox({ regionId, regions }: RegionComboboxProps) {
  const initialRegion = regions.find((region) => region.regionId === regionId);
  const [query, setQuery] = useState(initialRegion?.displayName ?? regionId);
  const [selectedRegionId, setSelectedRegionId] = useState(regionId);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredRegions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return regions;
    }

    return regions.filter((region) =>
      normalizeSearch(
        `${region.displayName} ${region.sidoName} ${region.name} ${region.regionId}`,
      ).includes(normalizedQuery),
    );
  }, [query, regions]);

  function selectRegion(region: Region) {
    setSelectedRegionId(region.regionId);
    setQuery(region.displayName);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredRegions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredRegions[activeIndex]) {
      event.preventDefault();
      selectRegion(filteredRegions[activeIndex]);
    }
  }

  return (
    <div
      className="relative grid gap-2 text-xs font-bold"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <label htmlFor="region-search">지역</label>
      <input name="region" type="hidden" value={selectedRegionId} />
      <input
        aria-activedescendant={
          isOpen && filteredRegions[activeIndex]
            ? `region-option-${filteredRegions[activeIndex].regionId}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls="region-options"
        aria-expanded={isOpen}
        autoComplete="off"
        className="h-12 rounded-md border border-transparent bg-secondary px-4 text-sm"
        id="region-search"
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedRegionId('');
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="지역 이름을 검색하세요"
        role="combobox"
        value={query}
      />
      {isOpen && (
        <div
          className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          id="region-options"
          role="listbox"
        >
          {filteredRegions.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm font-medium text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          ) : (
            filteredRegions.map((region, index) => (
              <button
                aria-selected={region.regionId === selectedRegionId}
                className="block w-full rounded-sm px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                id={`region-option-${region.regionId}`}
                key={region.regionId}
                onClick={() => selectRegion(region)}
                onFocus={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                {region.displayName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
