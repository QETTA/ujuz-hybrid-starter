import type { ScoreGrade } from '@/app/types/admission';

/** UI copy SSOT - all user-facing Korean strings */
export const COPY = {
  // -- Admission --
  ADMISSION_TITLE: '입학 가능성',
  ADMISSION_HEADER: '분석 결과',
  ADMISSION_CTA: '입학 가능성 확인하기',
  ADMISSION_CTA_HINT: '입학 가능성을 분석합니다',
  ADMISSION_CTA_RETRY: '다시 확인하기',
  ADMISSION_SHARE_PREFIX: '[UJUz]',
  ADMISSION_PROBABILITY_LABEL: '입학 가능성',
  ADMISSION_WAIT_LABEL: '예상 대기(월)',
  ADMISSION_USAGE_LABEL: '입학 가능성 분석',
  ADMISSION_ERROR: '분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.',

  // -- Grade (replaces GRADE_LABELS) --
  GRADE: {
    A: '매우 높음',
    B: '높음',
    C: '보통',
    D: '낮음',
    F: '매우 낮음',
  } as Record<ScoreGrade, string>,

  // -- Confidence --
  CONFIDENCE: {
    high: '신뢰도 높음',
    medium: '신뢰도 보통',
    low: '신뢰도 낮음',
  } as const,

  // -- Trust row templates --
  TRUST_ROW: (count: number, sources: number, confidence: number) =>
    `분석 근거 ${count}개 · 출처 ${sources}곳 · 신뢰도 ${confidence}%`,
  TRUST_META: (confidence: number, date: string) => `신뢰도 ${confidence}% · ${date} 분석`,

  // -- Evidence --
  EVIDENCE_TITLE: '분석 근거',
  EVIDENCE_EMPTY: '분석 근거가 아직 없어요',
  EVIDENCE_EMPTY_DESC: '질문을 입력하면 신뢰할 수 있는 데이터에서 근거를 수집해요',

  // -- Section titles --
  SECTION_DEALS: '혜택',
  SECTION_SAFETY: '안전',
  SECTION_COMMUNITY: '지역 정보',
  SAFETY_LABEL: '안전 평가',
  SECTION_REVIEWS: '리뷰',
  SECTION_ABOUT: '소개',
  SECTION_VIDEOS: '이 장소의 영상',
  SECTION_INSIGHTS: '인사이트',
  SECTION_TODAY_INSIGHTS: '오늘의 정보',

  // -- TO -> vacancy --
  VACANCY_ALERT: '빈자리 알림',
  VACANCY_ALERT_CTA: '빈자리 알림 받기',
  VACANCY_FACTOR: '빈자리(TO) 발생률',
  VACANCY_DETECTED: (slots: number) => `예상 ${slots}석 빈자리 감지`,

  // -- Actions --
  ACTION_ASK: '질문하기',
  ACTION_NEXT_TITLE: '지금 할 일',
  ACTION_DEFAULT_1: '상담 일정 확인하기',
  ACTION_DEFAULT_2: '후보 2곳 더 살펴보기',
  ACTION_CALL: '전화',
  ACTION_DIRECTIONS: '길찾기',
  ACTION_SHARE: '공유',
  ACTION_SAVE: '저장',
  ACTION_DETAILS: '상세',

  // -- Amenities --
  AMENITY_FREE: '무료',
  AMENITY_PARKING: '주차',
  AMENITY_NURSING_ROOM: '수유실',
  AMENITY_DIAPER_STATION: '기저귀교환대',

  // -- Distance --
  DISTANCE_M: (m: number) => `${m}m`,
  DISTANCE_KM: (km: string) => `${km}km`,

  // -- Reviews / Rating --
  REVIEWS_COUNT: (count: number) => `리뷰 ${count}`,
  RATING_LABEL: (rating: number, count: number) => `별점 ${rating}점, 리뷰 ${count}개`,

  // -- Trust Panel --
  TRUST_TITLE: '신뢰 정보',

  // -- Badges --
  BADGE_VERIFIED: '인증됨',
  BADGE_POPULAR: '인기',
  BADGE_NEW: '새로운',

  // -- Screen titles --
  SCREEN_SAVED: '저장',
  SCREEN_DEALS: '혜택',
  SCREEN_ASK: '질문하기',
  SCREEN_MAP: '지도',

  // -- Saved tabs --
  TAB_PLACES: (count: number) => `장소 (${count})`,
  TAB_CONTENT: (count: number) => `콘텐츠 (${count})`,

  // -- Map --
  MAP_SEARCH_PLACEHOLDER: '장소 검색',
  MAP_FILTER_ALL: '전체',
  MAP_FILTER_PEERS: '또래',
  MAP_FILTER_DEALS: '혜택',
  MAP_FILTER_SAVED: '저장',
  MAP_PLACES_NEARBY: (count: number) => `주변 시설 ${count}곳`,
  MAP_STAT_PEERS: '또래',
  MAP_STAT_COPARENT: '공동육아',
  MAP_STAT_DEALS: '혜택',

  // -- NearbyScreen --
  NEARBY_TITLE: '내 주변',
  NEARBY_SUBTITLE: '주변 시설을 둘러보세요',
  AI_PICKS_TITLE: 'AI 추천',
  AI_PICKS_DESC: '날씨, 시간, 나이에 맞춘 추천',
  SEE_ALL: '전체 보기',
  ALL_NEARBY: '주변 전체 시설',
  WEATHER_SUNNY: '맑음',
  WEATHER_RAINY: '비',
  WEATHER_CLOUDY: '흐림',
  TIME_MORNING: '오전',
  TIME_AFTERNOON: '오후',
  TIME_EVENING: '저녁',
  COMMUNITY_INSIGHTS: '지역 소식',

  // -- SearchScreen --
  SEARCH_PLACEHOLDER: '어린이집, 카페 등 검색',
  CANCEL: '취소',
  ASK_UJU: '우주에게 질문',
  RECENT_SEARCHES: '최근 검색',
  CLEAR_ALL: '전체 삭제',
  POPULAR: '인기 검색어',
  NO_RESULTS_TITLE: '검색 결과가 없어요',

  // -- SavedScreen --
  SAVED_EMPTY_TITLE: '저장한 시설이 없어요',
  SAVED_EMPTY_MSG: '하트를 눌러 마음에 드는 곳을 저장하세요',
  EXPLORE_MAP: '지도 둘러보기',
  BOOKMARK_EMPTY_TITLE: '북마크한 콘텐츠가 없어요',
  BOOKMARK_EMPTY_MSG: '영상이나 글을 북마크해 나중에 보세요',

  // -- MapScreen --
  NO_FILTER_MATCH: '이 필터에 맞는 시설이 없어요',
  RESET_FILTER: '필터 초기화',

  // -- Accessibility --
  A11Y_PLACES_TAB: (count: number) => `장소 탭, ${count}개 저장됨`,
  A11Y_CONTENT_TAB: '콘텐츠 탭',
  A11Y_FAVORITE: '즐겨찾기에 추가',
  A11Y_FAVORITE_HINT: '눌러서 이 장소를 즐겨찾기에 추가합니다',
  A11Y_REVIEWS_ALL: '전체 리뷰 보기',
  A11Y_REVIEWS_ALL_HINT: '눌러서 전체 리뷰를 확인합니다',
  A11Y_REFRESH: '당겨서 새로고침',
  A11Y_SAVED_LIST: '저장한 장소 목록',

  // -- Error / Network --
  LOAD_FAILED: '정보를 불러오지 못했어요',
  ASK_FAILED: '답변을 불러오지 못했어요',
  ERROR_TITLE: '문제가 발생했어요',
  ERROR_MSG: '잠시 후 다시 시도해주세요',
  ERROR_UNEXPECTED: '예상치 못한 오류가 발생했어요',
  RETRY: '다시 시도',
  NETWORK_OFFLINE: '인터넷 연결 없음',
  CONNECTION_ERROR: '연결 오류',
  RETRY_LABEL: (current: number, max: number) => `다시 시도 (${current}/${max})`,
  MAX_RETRY_MSG: '재시도 횟수를 초과했어요. 잠시 후 다시 시도해주세요.',
  RETRYING: '다시 시도 중...',
  VIDEO_UNAVAILABLE: '영상을 재생할 수 없어요',
  NETWORK_ERROR: '네트워크 오류',

  // -- Filters --
  FILTER_ALL: '전체',
  FILTER_OUTDOOR: '야외',
  FILTER_INDOOR: '실내',
  FILTER_PUBLIC: '공공시설',
  FILTER_RESTAURANT: '음식점',

  // -- Data stats --
  DATA_BLOCKS_EMPTY: '분석 데이터가 아직 없어요',
  DATA_BLOCKS_STAT: (blocks: number, confidence: number, sources: number) =>
    `${blocks}개 블록 · ${Math.round(confidence * 100)}% 검증 · ${sources}곳 출처`,
  COPARENTING_STAT: (count: number) => `공동육아 ${count}곳`,
  TRY_OTHER_FILTER: '"전체"로 전환하거나 다른 지역을 둘러보세요',

  // -- Accessibility (additional) --
  A11Y_ACTIVATE_HINT: '눌러서 실행',
  A11Y_RETRY: '다시 시도하기',
  A11Y_RETRY_HINT: '눌러서 다시 시도합니다',
  A11Y_LIKE_HINT: '눌러서 좋아요',
  A11Y_COMMENT_HINT: '눌러서 댓글 보기',
  A11Y_SHARE_HINT: '눌러서 공유',
  A11Y_SAVE_HINT: '눌러서 저장',
  A11Y_VIDEO_ACTIONS: '영상 액션',
  A11Y_VIDEO_ACTIONS_HINT: '좋아요, 댓글, 공유, 저장',
  A11Y_LOADING_PLACES: '주변 시설 불러오는 중',
  A11Y_LOADED_PLACES: (count: number, cached?: boolean) =>
    `주변 시설 ${count}곳 불러옴${cached ? ' (캐시)' : ''}`,
  A11Y_NO_RESULTS: '검색 결과 없음',
  A11Y_FOUND_RESULTS: (count: number) => `검색 결과 ${count}건`,
  A11Y_NEARBY_SECTION: (title: string) => `${title} 섹션`,
  A11Y_BROWSE_PLACES: '추천 장소 둘러보기',

  // -- Legal --
  DISCLAIMER: '※ 결과는 참고용이며, 실제 모집·선발 기준에 따라 달라질 수 있어요.',

  // -- Age labels --
  AGE_INFANT: '0~2세',
  AGE_TODDLER: '3~5세',
  AGE_CHILD: '6~9세',
  AGE_ELEMENTARY: '10~12세',

  // -- NearbyScreen A11Y --
  A11Y_CONTEXT_FILTERS: '현재 상황 필터',
  A11Y_SEE_ALL_AI_PICKS: 'AI 추천 전체 보기',
  AI_PICK_BADGE: 'AI 추천',
  COMMUNITY_INSIGHTS_DESC: '궁금한 것을 질문해 보세요',
  A11Y_ASK_UJU: '우주에게 질문하기',

  // -- SearchScreen A11Y --
  A11Y_SEARCHING: (query: string) => `${query} 검색 중`,
  A11Y_SEARCH_INPUT: '검색 입력',
  A11Y_SEARCH_INPUT_HINT: '장소, 카페 등을 검색하세요',
  A11Y_CLEAR_SEARCH: '검색어 지우기',
  A11Y_CLEAR_SEARCH_HINT: '검색 입력을 지웁니다',
  A11Y_CANCEL_SEARCH: '검색 취소',
  A11Y_CANCEL_SEARCH_HINT: '이전 화면으로 돌아갑니다',
  A11Y_SEARCH_RESULTS: '검색 결과',
  NO_RESULTS_MSG: (query: string) =>
    `"${query}"에 대한 검색 결과가 없어요. 다른 필터로 시도해 보세요`,
  A11Y_RECENT_SEARCHES: '최근 검색 목록',
  A11Y_RECENT_SEARCHES_HINT: '이전 검색어 목록',
  A11Y_CLEAR_ALL_RECENT: '최근 검색 전체 삭제',
  A11Y_CLEAR_ALL_RECENT_HINT: '모든 최근 검색어를 삭제합니다',
  A11Y_RECENT_SEARCH_ITEM: (query: string) => `최근 검색: ${query}`,
  A11Y_RECENT_SEARCH_ITEM_HINT: '눌러서 다시 검색',
  A11Y_REMOVE_RECENT: (query: string) => `${query} 최근 검색에서 삭제`,
  A11Y_REMOVE_RECENT_HINT: '최근 검색에서 삭제합니다',
  A11Y_POPULAR_SEARCHES: '인기 검색어 목록',
  A11Y_POPULAR_SEARCHES_HINT: '인기 검색어',
  A11Y_POPULAR_SEARCH_ITEM: (query: string) => `인기 검색: ${query}`,
  A11Y_POPULAR_SEARCH_ITEM_HINT: '눌러서 검색',

  // -- Shorts feed --
  A11Y_SHORTS_FEED: '숏츠 영상 피드',
  A11Y_SHORTS_BROWSE_HINT: '위아래로 스와이프하여 영상 탐색',
  A11Y_SHORTS_NAVIGATE_HINT: '상하 스와이프로 영상 간 이동',
  A11Y_VIDEO_INFO: '영상 정보',
  A11Y_VIDEO_AUTHOR_HINT: '영상 제작자',
  A11Y_VIDEO_CAPTION_HINT: '영상 설명',
  A11Y_VIDEO_CONTROLS: '영상 콘텐츠 및 컨트롤',
  A11Y_NAVIGATE_PLACE: '눌러서 지도에서 이 장소 보기',
  A11Y_PLAY_VIDEO: '눌러서 영상 재생',
  A11Y_CLOSE_PLAYER: '눌러서 영상 플레이어 닫기',
  A11Y_RETRY_VIDEO: '영상 다시 로드',

  // -- Shared component A11Y --
  NETWORK_ERROR_MSG: '연결 상태를 확인하고 다시 시도해주세요',
  A11Y_REVIEW: '사용자 리뷰',
  A11Y_TAG_INDICATOR: '태그 또는 기능 표시',
  A11Y_VIEW_CONTENT: '눌러서 상세 보기',
  A11Y_VIEW_PLACE: '눌러서 장소 상세 보기',
  A11Y_RETRY_REQUEST: '눌러서 다시 시도',
  A11Y_OPEN_SOURCE: '출처 링크 열기',

  // -- Map A11Y --
  A11Y_MAP: '주변 시설을 보여주는 지도',
  A11Y_OPEN_SEARCH: '눌러서 검색 화면 열기',

  // -- Data note --
  DATA_NOTE_VACANCY:
    '2시간마다 커뮤니티 "빈자리 나왔어요" 키워드 수집\n4시간마다 대기 정보 자동 생성',
} as const;
