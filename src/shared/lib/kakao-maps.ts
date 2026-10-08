/** 이 프로젝트에서 사용하는 카카오맵 JS SDK 범위만 선언한 최소 타입. */
export type KakaoLatLng = object;
export type KakaoLatLngBounds = { extend: (latLng: KakaoLatLng) => void };
export type KakaoMap = {
  setCenter: (latLng: KakaoLatLng) => void;
  setBounds: (
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
};
/** 상호작용 없이 지도 이미지만 그리는 정적 지도. */
export type KakaoStaticMap = object;
export type KakaoRoadview = {
  setPanoId: (panoId: number, position: KakaoLatLng) => void;
  setViewpoint: (viewpoint: { pan: number; tilt: number; zoom: number }) => void;
  /** 좌표(와 고도)를 바라보는 시점을 계산하는 투영 객체. 파노라마가 뜬 뒤(init)에 쓴다. */
  getProjection: () => {
    viewpointFromCoords: (
      latLng: KakaoLatLng,
      height: number,
    ) => { pan: number; tilt: number; zoom: number };
  };
};
export type KakaoRoadviewClient = {
  /** 반경(m) 안에 파노라마가 없으면 callback에 null이 전달된다. */
  getNearestPanoId: (
    position: KakaoLatLng,
    radius: number,
    callback: (panoId: number | null) => void,
  ) => void;
};
export type KakaoMarker = { setMap: (map: KakaoMap | KakaoRoadview | null) => void };
export type KakaoCustomOverlay = { setMap: (map: KakaoMap | null) => void };
export type KakaoPolyline = { setMap: (map: KakaoMap | null) => void };

export type KakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng;
      level: number;
      draggable?: boolean;
      scrollwheel?: boolean;
      disableDoubleClick?: boolean;
      disableDoubleClickZoom?: boolean;
      keyboardShortcuts?: boolean;
    },
  ) => KakaoMap;
  StaticMap: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number; marker?: { position: KakaoLatLng } | boolean },
  ) => KakaoStaticMap;
  Roadview: new (container: HTMLElement) => KakaoRoadview;
  RoadviewClient: new () => KakaoRoadviewClient;
  Marker: new (options: {
    map: KakaoMap | KakaoRoadview;
    position: KakaoLatLng;
    title?: string;
    clickable?: boolean;
  }) => KakaoMarker;
  CustomOverlay: new (options: {
    map?: KakaoMap;
    position: KakaoLatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }) => KakaoCustomOverlay;
  Polyline: new (options: {
    map?: KakaoMap;
    path: KakaoLatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'shortdash' | 'dash';
  }) => KakaoPolyline;
  event: {
    addListener: (
      target: KakaoMarker | KakaoRoadview | KakaoMap,
      type: 'click' | 'init' | 'tilesloaded',
      handler: () => void,
    ) => void;
    removeListener: (
      target: KakaoMarker | KakaoRoadview | KakaoMap,
      type: 'click' | 'init' | 'tilesloaded',
      handler: () => void,
    ) => void;
  };
};

declare global {
  interface Window {
    kakao?: { maps?: KakaoMapsApi };
  }
}

const SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const SDK_TIMEOUT_MS = 10_000;

let sdkPromise: Promise<KakaoMapsApi> | null = null;
let sdkAppKey: string | null = null;

/** 빈 값이면 지도를 쓸 수 없는 상태(플레이스홀더 표시)로 취급한다. */
export function getKakaoMapAppKey() {
  return import.meta.env.VITE_KAKAO_MAP_APP_KEY?.trim() ?? '';
}

export function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * 카카오맵 SDK를 한 번만 동적으로 불러온다. 실패하면 다음 호출에서 다시 시도할 수 있게 캐시를 비운다.
 * `autoload=false`이므로 스크립트 로드 후 `kakao.maps.load` 콜백에서 API 사용이 가능해진다.
 */
export function loadKakaoMaps(appKey: string): Promise<KakaoMapsApi> {
  if (sdkPromise && sdkAppKey === appKey) return sdkPromise;

  sdkAppKey = appKey;
  sdkPromise = new Promise<KakaoMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    const timeoutId = window.setTimeout(
      () => fail(new Error('Kakao Maps SDK timed out')),
      SDK_TIMEOUT_MS,
    );

    function cleanup() {
      window.clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
    }

    function fail(error: Error) {
      cleanup();
      script.remove();
      sdkPromise = null;
      sdkAppKey = null;
      reject(error);
    }

    script.src = `${SDK_URL}?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onerror = () => fail(new Error('Kakao Maps SDK failed to load'));
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        fail(new Error('Kakao Maps SDK is unavailable'));
        return;
      }
      maps.load(() => {
        cleanup();
        resolve(maps);
      });
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}
