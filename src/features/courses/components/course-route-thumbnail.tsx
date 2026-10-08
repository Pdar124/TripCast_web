import { Route } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useKakaoMaps } from '@/shared/hooks/use-kakao-maps';
import { useVisibleOnce } from '@/shared/hooks/use-visible-once';
import { getKakaoMapAppKey, isValidCoordinate } from '@/shared/lib/kakao-maps';
import { createLoadLimiter } from '@/shared/lib/load-limiter';
import { cn } from '@/shared/lib/utils';

type RoutePoint = { latitude: number; longitude: number };

type CourseRouteThumbnailProps = {
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  /** 지도를 쓸 수 없을 때 보여 줄 기존 이미지. 없으면 공통 대체 배경을 쓴다. */
  fallbackImage?: string | null;
  className?: string;
};

/** 지도 인스턴스를 동시에 만들 수 있는 최대 개수. 넘는 카드는 앞선 지도의 타일이 뜬 뒤에 시작한다. */
const MAX_CONCURRENT_MAPS = 4;
/** 타일이 이 시간 안에 뜨지 않아도 자리를 반납하고 지도를 보여 준다(ms). */
const MAP_LOAD_TIMEOUT_MS = 6000;
const mapLimiter = createLoadLimiter(MAX_CONCURRENT_MAPS);

const MAP_LEVEL = 5;
const MAP_PADDING = 36;

function toPoint(latitude?: number | null, longitude?: number | null): RoutePoint | null {
  return typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    isValidCoordinate(latitude, longitude)
    ? { latitude, longitude }
    : null;
}

/** 출발·도착을 구분하는 라벨 마커. 출발과 도착이 같은 위치면 하나로 합친다. */
function createLabel(text: string, tone: 'start' | 'end') {
  const element = document.createElement('span');
  element.className = cn(
    'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black shadow-md ring-2 ring-background',
    tone === 'start' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
  );
  element.textContent = text;
  return element;
}

/**
 * 관광코스 썸네일. 상호작용을 막은 카카오맵에 출발·도착 지점만 마커로 표시한다.
 * 좌표가 없거나 앱 키가 없거나 SDK 로드에 실패하면 기존 이미지(없으면 공통 배경)로 대체한다.
 * 카드가 화면 근처에 보일 때만 불러온다.
 */
export function CourseRouteThumbnail({
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
  fallbackImage = null,
  className,
}: CourseRouteThumbnailProps) {
  const appKey = getKakaoMapAppKey();
  const start = toPoint(startLatitude, startLongitude);
  // 도착 좌표만 없을 때는 출발 지점만 표시한다.
  const end = toPoint(endLatitude, endLongitude) ?? start;
  const canShowMap = appKey !== '' && start !== null;
  const { ref: wrapperRef, visible } = useVisibleOnce<HTMLDivElement>(canShowMap);
  const { status, maps } = useKakaoMaps(appKey, canShowMap && visible);
  const [viewElement, setViewElement] = useState<HTMLDivElement | null>(null);
  const startLat = start?.latitude;
  const startLng = start?.longitude;
  const endLat = end?.latitude;
  const endLng = end?.longitude;
  const routeKey = `${startLat},${startLng},${endLat},${endLng}`;
  // 타일이 실제로 뜬 경로. 뜨기 전에는 빈 지도 대신 대체 화면을 유지한다.
  const [shownKey, setShownKey] = useState<string | null>(null);

  useEffect(() => {
    if (
      !maps ||
      !viewElement ||
      startLat === undefined ||
      startLng === undefined ||
      endLat === undefined ||
      endLng === undefined
    ) {
      return;
    }

    const startPosition = new maps.LatLng(startLat, startLng);
    const endPosition = new maps.LatLng(endLat, endLng);
    const sameLocation = startLat === endLat && startLng === endLng;
    let overlays: { setMap: (map: null) => void }[] = [];
    let timeoutId: number | undefined;
    let detach: (() => void) | null = null;

    // 인스턴스 생성은 자리가 날 때만 시작하고, 타일이 뜨거나 제한 시간이 지나면 자리를 반납한다.
    const cancelJob = mapLimiter.run((done) => {
      const map = new maps.Map(viewElement, {
        center: startPosition,
        level: MAP_LEVEL,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: true,
        disableDoubleClickZoom: true,
        keyboardShortcuts: false,
      });

      const finish = () => {
        window.clearTimeout(timeoutId);
        setShownKey(routeKey);
        done();
      };
      maps.event.addListener(map, 'tilesloaded', finish);
      detach = () => maps.event.removeListener(map, 'tilesloaded', finish);
      timeoutId = window.setTimeout(finish, MAP_LOAD_TIMEOUT_MS);

      overlays = (
        sameLocation
          ? [{ position: startPosition, label: createLabel('출발·도착', 'start'), zIndex: 20 }]
          : [
              { position: endPosition, label: createLabel('도착', 'end'), zIndex: 10 },
              { position: startPosition, label: createLabel('출발', 'start'), zIndex: 20 },
            ]
      ).map(
        ({ position, label, zIndex }) =>
          new maps.CustomOverlay({
            map,
            position,
            content: label,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex,
            clickable: false,
          }),
      );

      if (sameLocation) {
        map.setCenter(startPosition);
      } else {
        const bounds = new maps.LatLngBounds();
        bounds.extend(startPosition);
        bounds.extend(endPosition);
        map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);
      }
    });

    return () => {
      window.clearTimeout(timeoutId);
      cancelJob();
      detach?.();
      overlays.forEach((overlay) => overlay.setMap(null));
      viewElement.replaceChildren();
    };
  }, [maps, viewElement, startLat, startLng, endLat, endLng, routeKey]);

  const showMap = canShowMap && status !== 'error';
  const mapReady = showMap && status === 'ready' && shownKey === routeKey;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden',
        !fallbackImage && !mapReady && 'tc-route-visual',
        className,
      )}
      data-testid="course-route-thumbnail"
      data-view={mapReady ? 'route-map' : 'fallback'}
      ref={wrapperRef}
    >
      {fallbackImage && (
        <img alt="" className="h-full w-full object-cover" loading="lazy" src={fallbackImage} />
      )}
      {!mapReady && (
        <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-primary shadow-sm">
          <Route className="h-5 w-5" />
        </span>
      )}
      {showMap && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            mapReady ? 'opacity-100' : 'opacity-0',
          )}
          ref={setViewElement}
        />
      )}
    </div>
  );
}
