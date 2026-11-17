# 공통 GNB 규칙

- 모든 새 페이지는 `site-navigation.css`와 `site-navigation.js`를 포함하고, 헤더에 `site-header gnb-shell` 클래스를 사용한다.
- GNB는 최초 진입 및 페이지 맨 위에서 표시한다. 아래로 스크롤하면 숨기고, 위로 스크롤하면 다시 표시한다. 공통 기준은 3px이며 `site-navigation.js`에서만 관리한다.
- 개별 페이지에 스크롤 방향 감지 로직이나 `is-hidden` 토글을 중복 추가하지 않는다.
- 인트로 모션이 있는 페이지에만 헤더의 `data-gnb-intro` 속성을 추가한다. 인트로 종료 시 `window.GreenHeaderScroll.ready()`를 호출한다. 일반 페이지에는 이 속성이 필요 없다.
- 헤더 숨김 스타일은 `site-navigation.css`의 공통 규칙을 사용하고 페이지 CSS에서 덮어쓰지 않는다.
