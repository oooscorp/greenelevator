# 공통 모션

## 텍스트모션1

사용자가 정한 명칭. 회사개요 첫 제목의 최신 설정을 기준으로 한다.

- 텍스트 크기에 맞는 줄별 프레임에 `overflow:hidden` 적용.
- 각 줄은 `translateY(110%)`에서 `translateY(0)`으로 등장.
- 이동 시간 `850ms`, 이징 `cubic-bezier(.4,0,.2,1)`.
- 두 번째 줄 시작 지연 `325ms`. 줄이 하나면 지연 없음.
- 보조 문구는 마지막 줄의 이동 완료 후 `600ms ease`로 페이드 인.
- 기술력 하단에서는 `.text-motion-1-line`이 이 설정을 사용한다.

## Lens Zoom Transition

홈 히어로와 기술력 하단은 `lens-zoom.js`의 `GreenLensZoom`을 공유한다.
전환 1050ms, 다음 이미지 scale 1.35 / blur 14px에서 정착,
불투명도는 367.5ms에 1. 이징은 `cubic-bezier(.16,.8,.2,1)`.
옅은 복제 레이어 두 개를 사용하고 중단 또는 완료 시 정리한다.
