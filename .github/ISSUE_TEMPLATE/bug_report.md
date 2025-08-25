name: "🐞 Bug Report"
description: "기능이 정상적으로 동작하지 않을 때 작성해주세요."
title: "[BUG] "
labels: ["bug"]
assignees: []
body:
  - type: textarea
    id: description
    attributes:
      label: 문제 설명
      description: 어떤 문제가 발생했는지 자세히 작성해주세요.
      placeholder: 예) 로그인 버튼 클릭 시 500 에러 발생
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: 재현 방법
      description: 문제가 어떻게 발생했는지 단계별로 작성해주세요.
      placeholder: "1) ...\n2) ...\n3) ..."
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: 기대 동작
      description: 원래 어떻게 동작해야 했는지 작성해주세요.
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 스크린샷 / 로그
      description: 가능하다면 이미지/로그를 첨부해주세요.
      placeholder: 이미지나 콘솔 로그를 붙여주세요.
