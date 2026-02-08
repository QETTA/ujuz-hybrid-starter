---
name: ujuz-alerts-snapshots
description: worker-alerts(snapshotWorker) 안정화 + training blocks 업데이트 품질/성능 개선
---

목표: apps/worker-alerts 의 'collect_snapshots' / 'update_training_blocks' 잡의 안정성과 관측성을 올린다.

반드시:
1) 현재 BullMQ 큐/잡 타입(알려진 케이스/unknown 처리)을 요약
2) 데이터 저장 컬렉션/인덱스 확인(SSOT 인덱스 파일 참고)
3) 실패 재시도/중복 실행(idempotency)/로그 구조 개선안을 제안하고 구현
4) 작업 후 'ujuz: test' 또는 최소 수동 검증 커맨드 제시
