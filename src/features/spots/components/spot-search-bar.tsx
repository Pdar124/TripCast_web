import { Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/shared/components/ui/button';

type SpotSearchBarProps = {
  defaultKeyword: string;
  onSearch: (keyword: string) => void;
};

export function SpotSearchBar({ defaultKeyword, onSearch }: SpotSearchBarProps) {
  const [inputKeyword, setInputKeyword] = useState(defaultKeyword);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(inputKeyword.trim());
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} role="search">
      <label className="relative flex-1">
        <span className="sr-only">관광지 검색어</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          className="h-12 w-full rounded-full border bg-card py-2 pl-12 pr-5 text-base shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/60"
          name="keyword"
          onChange={(event) => setInputKeyword(event.target.value)}
          placeholder="예) 경복궁, 성산일출봉"
          type="search"
          value={inputKeyword}
        />
      </label>
      <Button className="h-12 rounded-full px-7" type="submit">
        검색
      </Button>
    </form>
  );
}
