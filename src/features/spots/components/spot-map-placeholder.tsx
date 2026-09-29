import { MapPinned } from 'lucide-react';

type SpotMapPlaceholderProps = {
  latitude: number;
  longitude: number;
  name: string;
};

export function SpotMapPlaceholder({ latitude, longitude, name }: SpotMapPlaceholderProps) {
  return (
    <section className="relative grid min-h-80 place-items-center overflow-hidden rounded-lg border bg-muted/60 p-6 text-center lg:min-h-[34rem]">
      <div
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden="true"
      />
      <div className="relative max-w-sm space-y-4">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-card text-primary shadow-sm">
          <MapPinned className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold">지도 영역</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            카카오맵 API 키 설정 후 {name}의 위치를 표시합니다.
          </p>
        </div>
        <p className="rounded-full bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          {Number.isFinite(latitude) ? latitude.toFixed(4) : '위도 정보 없음'} ·{' '}
          {Number.isFinite(longitude) ? longitude.toFixed(4) : '경도 정보 없음'}
        </p>
      </div>
    </section>
  );
}
