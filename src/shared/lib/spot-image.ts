const spotImages: Record<string, string> = {
  감천문화마을: 'busan-gamcheon.jpg',
  광안리해수욕장: 'busan-gwangalli.jpg',
  해운대해수욕장: 'busan-haeundae.jpg',
  태종대: 'busan-taejongdae.jpg',
  안목해변: 'gangneung-anmok.jpg',
  경포해변: 'gangneung-gyeongpo.jpg',
  정동진역: 'gangneung-jeongdongjin.jpg',
  오죽헌: 'gangneung-ojukheon.jpg',
  불국사: 'gyeongju-bulguksa.jpg',
  첨성대: 'gyeongju-cheomseongdae.jpg',
  석굴암: 'gyeongju-seokguram.jpg',
  '동궁과 월지': 'gyeongju-wolji.jpg',
  만장굴: 'jeju-manjanggul.jpg',
  성산일출봉: 'jeju-seongsan.jpg',
  섭지코지: 'jeju-seopjikoji.jpg',
  우도: 'jeju-udo.jpg',
  경기전: 'jeonju-gyeonggijeon.jpg',
  전주한옥마을: 'jeonju-hanok.jpg',
  전동성당: 'jeonju-jeondong.jpg',
  북촌한옥마을: 'seoul-bukchon.jpg',
  창덕궁: 'seoul-changdeokgung.jpg',
  경복궁: 'seoul-gyeongbokgung.jpg',
  인사동: 'seoul-insadong.jpg',
};

export function getSpotImage(name?: string | null) {
  const filename = name ? spotImages[name.trim()] : undefined;
  return filename ? `/assets/img/${filename}` : null;
}
