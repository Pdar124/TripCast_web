import { useEffect, useState } from 'react';

import { useKakaoMaps } from '@/shared/hooks/use-kakao-maps';
import { useVisibleOnce } from '@/shared/hooks/use-visible-once';
import { getKakaoMapAppKey, isValidCoordinate, type KakaoMarker } from '@/shared/lib/kakao-maps';
import { createLoadLimiter } from '@/shared/lib/load-limiter';
import { cn } from '@/shared/lib/utils';

type CourseRoadviewThumbnailProps = {
  latitude?: number | null;
  longitude?: number | null;
  /** 지도를 쓸 수 없을 때 보여 줄 기존 이미지. 없으면 공통 대체 배경을 쓴다. */
  fallbackImage?: string | null;
  className?: string;
};

/** 로드뷰 인스턴스를 동시에 만들 수 있는 최대 개수. 넘는 카드는 앞선 로드뷰가 뜬 뒤에 시작한다. */
const MAX_CONCURRENT_ROADVIEWS = 4;
/** 파노라마가 이 시간 안에 뜨지 않아도 자리를 반납한다(ms). */
const ROADVIEW_LOAD_TIMEOUT_MS = 8000;
const roadviewLimiter = createLoadLimiter(MAX_CONCURRENT_ROADVIEWS);

/** 파노라마를 찾을 반경(m). */
const ROADVIEW_RADIUS = 100;
const STATIC_MAP_LEVEL = 4;
/**
 * 추천 코스 썸네일. 코스 대표 관광지 좌표 근처의 로드뷰를 상호작용 없이 보여 주고 마커를 표시한다.
 * 파노라마가 없는 곳은 정적 지도로, 좌표가 없거나 앱 키가 없거나 SDK 로드에 실패하면
 * 기존 이미지(없으면 공통 배경)로 대체한다. 카드가 화면 근처에 보일 때만 불러온다.
 */
export function CourseRoadviewThumbnail({
  latitude,
  longitude,
  fallbackImage = null,
  className,
}: CourseRoadviewThumbnailProps) {
  const appKey = getKakaoMapAppKey();
  const coordinate =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    isValidCoordinate(latitude, longitude)
      ? { latitude, longitude }
      : null;
  const canShowMap = appKey !== '' && coordinate !== null;
  const { ref: wrapperRef, visible } = useVisibleOnce<HTMLDivElement>(canShowMap);
  const { status, maps } = useKakaoMaps(appKey, canShowMap && visible);
  const [viewElement, setViewElement] = useState<HTMLDivElement | null>(null);
  // 조회 결과가 어느 좌표의 것인지 함께 저장해, 좌표가 바뀌면 다시 확인 중으로 돌아간다. id가 null이면 파노라마 없음.
  const coordinateKey = coordinate ? `${coordinate.latitude},${coordinate.longitude}` : '';
  const [panorama, setPanorama] = useState<{ key: string; id: number | null } | null>(null);
  const panoId = panorama?.key === coordinateKey ? panorama.id : undefined;
  // 파노라마가 실제로 뜬 좌표. 뜨기 전에는 빈 컨테이너 대신 대체 화면을 유지한다.
  const [shownKey, setShownKey] = useState<string | null>(null);
  const lat = coordinate?.latitude;
  const lng = coordinate?.longitude;

  useEffect(() => {
    if (!maps || lat === undefined || lng === undefined) return;

    let cancelled = false;
    new maps.RoadviewClient().getNearestPanoId(new maps.LatLng(lat, lng), ROADVIEW_RADIUS, (id) => {
      if (!cancelled) setPanorama({ key: `${lat},${lng}`, id });
    });

    return () => {
      cancelled = true;
    };
  }, [maps, lat, lng]);

  useEffect(() => {
    if (!maps || !viewElement || panoId === undefined || lat === undefined || lng === undefined) {
      return;
    }

    const center = new maps.LatLng(lat, lng);

    if (panoId === null) {
      new maps.StaticMap(viewElement, {
        center,
        level: STATIC_MAP_LEVEL,
        marker: { position: center },
      });
      return () => viewElement.replaceChildren();
    }

    let marker: KakaoMarker | null = null;
    let timeoutId: number | undefined;
    let detach: (() => void) | null = null;

    // 인스턴스 생성은 자리가 날 때만 시작하고, 파노라마가 뜨거나 제한 시간이 지나면 자리를 반납한다.
    const cancelJob = roadviewLimiter.run((done) => {
      const roadview = new maps.Roadview(viewElement);

      const handleInit = () => {
        window.clearTimeout(timeoutId);
        marker = new maps.Marker({ map: roadview, position: center });
        // 마커 쪽을 바라보도록 시점을 맞추고, 가까이 보이지 않게 조금 멀리서 비춘다.
        const viewpoint = roadview.getProjection().viewpointFromCoords(center, 0);
        roadview.setViewpoint({ ...viewpoint, zoom: -3 });
        setShownKey(`${lat},${lng}`);
        done();
      };
      maps.event.addListener(roadview, 'init', handleInit);
      detach = () => maps.event.removeListener(roadview, 'init', handleInit);
      timeoutId = window.setTimeout(done, ROADVIEW_LOAD_TIMEOUT_MS);
      roadview.setPanoId(panoId, center);
    });

    return () => {
      window.clearTimeout(timeoutId);
      cancelJob();
      detach?.();
      marker?.setMap(null);
      viewElement.replaceChildren();
    };
  }, [maps, viewElement, panoId, lat, lng]);

  const showView = canShowMap && status !== 'error';
  const viewReady =
    showView &&
    status === 'ready' &&
    panoId !== undefined &&
    (panoId === null || shownKey === coordinateKey);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden',
        !fallbackImage && !viewReady && 'tc-route-visual',
        className,
      )}
      data-testid="course-roadview-thumbnail"
      data-view={viewReady ? (panoId === null ? 'static-map' : 'roadview') : 'fallback'}
      ref={wrapperRef}
    >
      {fallbackImage && (
        <img alt="" className="h-full w-full object-cover" loading="lazy" src={fallbackImage} />
      )}
      {showView && (
        <div
          className={cn(
            'tc-roadview-static pointer-events-none absolute inset-0 transition-opacity duration-300',
            viewReady ? 'opacity-100' : 'opacity-0',
          )}
          ref={setViewElement}
        />
      )}
    </div>
  );
}
