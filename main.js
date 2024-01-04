import { Bodies, Body, Collision, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS } from "./fruits";

const engine = Engine.create();
const render = Render.create(
  {
    engine,
    // 게임을 어디에 그릴지
    element: document.body, // document.body에 그린다
    options: {
      // wireframes : 대문자 False는 소문자 false와 다름
      wireframes: false, // 기본값은 true, 배경색 안나올 수 있음, (용도: 그래픽을 없애고 보고싶을 때 사용)
      background: "#F7F4C8", // 배경색 hex 코드
      width: 620,
      height: 850,
    }
  }
);

// 물리엔진 num(변할 수 없는 번호)
const world = engine.world;

// Bodies 클래스 직사각형(x좌표(직사각형의 중앙이 해당 좌표에 올 수 있도록 == 좌 상단부터 시작하려면 도형의 width값 절반), y좌표, 너비, 높이, {옵션들})
const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true, // 해당 왼쪽 벽 고정
  render: {fillStyle: "#E6B143"} // 채울 색상
});

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true, // 해당 왼쪽 벽 고정
  render: {fillStyle: "#E6B143"} // 채울 색상
});

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: {fillStyle: "#E6B143"}
});

const topLine = Bodies.rectangle(310, 150, 620, 1, {
  name: 'topLine',
  isStatic: true,
  isSensor: true,
  render: {fillStyle: "#E6B143"}
});

// 보이게 하려면 World에 추가해야함
World.add(world, [leftWall, rightWall, ground, topLine]);

// Render(render) & Runner(engine) 실행
Render.run(render);
Runner.run(engine);

// 재사용을 위한 전역변수
let currentBody = null;
let currentFruit = null;
let disableAction = null; // 내려가는동안 조작 불가능
let interval = null;

// 과일 생성 함수 정의
function addFruit() {
  const index = Math.floor(Math.random() * 5 ); // 0(체리) ~ 5(사과) 정도만 출현
  const fruit = FRUITS[index];

  // 과일을 추가
  const body = Bodies.circle(300, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    // 그림을 그려 가져다 쓸 때
    render: {
      sprite: { texture: `${fruit.name}.png` } // backtick 주의
    },
    // 통통 튀는 탄성 추가 0 ~ 1
    restitution: 0.2
  });

  // 전역변수 저장 ? dynamic 메모리가 아니어도 되나?
  currentBody = body;
  currentFruit = fruit;

  World.add(world, body);
}

/**********************
* 과일 움직이기
***********************/
window.onkeydown = (event) => {
  if (disableAction) {
    return;
  }

  switch(event.code) {
    case "ArrowLeft":
      if (interval)
        return;

      // 5ms 마다 주기적으로 실행되게 만듦
      interval = setInterval(() => {
        if (currentBody.position.x - currentFruit.radius > 30)
        Body.setPosition(currentBody, {
          x: currentBody.position.x - 1.3,
          y: currentBody.position.y,
        });
      }, 5);
      break;
      
    case "ArrowRight":
      if (interval)
        return;
      
        interval = setInterval(() => {
          if (currentBody.position.x + currentFruit.radius < 590)
          Body.setPosition(currentBody, {
            x: currentBody.position.x + 1.3 ,
            y: currentBody.position.y,
          });
        })
      break;

    case "Space":
      currentBody.isSleeping = false;
      disableAction = true;

      // 일정 시간 뒤에 코드 실행
      setTimeout(() => {
        addFruit();
        disableAction = false;
      }, 1000); // 1000ms(1초)
      break;
  }
}

/*******************
* setInterval 멈추기
*******************/
window.onkeyup = (event) => {
  switch(event.code){
    case 'ArrowRight':
    case 'ArrowLeft':
      clearInterval(interval);
      interval = null;
  }
}

/***********************
* 과일 충돌 판정
************************/
// matter-js의 클래스
Events.on(engine, 'collisionStart', (event) => {
  // 이벤트가 발생한 pair를 모두 for문 실행
  event.pairs.forEach((collision) => {
    // 동일한 과일인 경우
    if (collision.bodyA.index === collision.bodyB.index) {
      // 현재 과일의 index 저장
      const index = collision.bodyB.index;

      World.remove(world, [collision.bodyA, collision.bodyB]);

      // 수박일 때 
      if (index === FRUITS.lenth - 1){
        return;
      }

      // 한 단계 큰 과일 생성
      const newFruit = FRUITS[index + 1];
      const newBody = Bodies.circle(
        // 부딪힌 지점의 x, y좌표
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: { sprite: { texture: `${newFruit.name}.png` } },
          index: index  + 1
        }
      );

      World.add(world, newBody);
    }

    if (
      !disableAction &&
      (collision.bodyA.name === 'topLine' || collision.bodyB.name === 'topLine')){
      alert('Game over')
    }
  })
})

addFruit();