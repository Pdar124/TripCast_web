import { MapPinned } from 'lucide-react';

type SpotMapPlaceholderProps = {
  latitude: number;
  longitude: number;
  name: string;
};

export function SpotMapPlaceholder({ latitude, longitude, name }: SpotMapPlaceholderProps) {
  return (
    <section className="tc-route-visual relative grid min-h-80 place-items-center rounded-lg p-6 text-center lg:min-h-[640px]">
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"
        aria-hidden="true"
      />
      <div className="relative max-w-sm space-y-4">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
          <MapPinned className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold">지도 영역</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            카카오맵 API 키 설정 후 {name}의 위치를 표시합니다.
          </p>
        </div>
        <p className="rounded-full bg-background/90 px-4 py-2 text-xs font-bold text-muted-foreground shadow-sm">
          {Number.isFinite(latitude) ? latitude.toFixed(4) : '위도 정보 없음'} ·{' '}
          {Number.isFinite(longitude) ? longitude.toFixed(4) : '경도 정보 없음'}
        </p>
      </div>
    </section>
  );
}
