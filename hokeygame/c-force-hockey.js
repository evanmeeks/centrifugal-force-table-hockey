// Wrap the entire code inside a function, to be able to re-initialize the game
const {
  Engine,
  Render,
  Runner,
  MouseConstraint,
  Mouse,
  Bodies,
  World,
  Body,
  Events,
  Constraint,
} = Matter;
Matter.use("matter-collision-events");

function initializeGame() {
  // Define the render dimensions, this needs to be inside the function to get updated values

  const SPRITE_ASPECT_RATIO = 708 / 1412;
  let VIEWPORT_WIDTH = window.innerWidth;
  let VIEWPORT_HEIGHT = window.innerWidth / SPRITE_ASPECT_RATIO;
  if (VIEWPORT_HEIGHT > window.innerHeight) {
    VIEWPORT_HEIGHT = window.innerHeight;
    VIEWPORT_WIDTH = window.innerHeight * SPRITE_ASPECT_RATIO;
  }
  const RENDER_WIDTH = VIEWPORT_WIDTH;
  const RENDER_HEIGHT = VIEWPORT_HEIGHT;

  let isMagnetOn = false;

  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 0;

  engine.world.bounds.max.x = RENDER_WIDTH - 25;
  engine.world.bounds.max.y = RENDER_HEIGHT - 25;

  const render = Render.create({
    element: document.body,
    engine,
    options: {
      pixelRatio: 1,
      element: document.body,
      engine: engine,
      left: "11.5vw",
      position: "absolute",
      background: `url(img/Simple-hockey-field.png)`,
      width: RENDER_WIDTH,
      height: RENDER_HEIGHT,
      wireframes: false, // Set wireframes to false to show background image

      hasBounds: true,
      enabled: true,
      wireframe: true,
      showSleeping: true,
      showDebug: true,
      showCollisions: true,
      showAngleIndicator: true,
      showVertexNumbers: true,
    },
  });
  render.canvas.tabIndex = -1;

  const mouse = Mouse.create(render.canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    label: "PuckController",
    constraint: {
      stiffness: 0.5,
      restitution: 0.5,
    },
  });

  Events.on(engine, "beforeUpdate", function () {
    if (mouseConstraint.body === puck) {
      mouseConstraint.mouse.button = -1;
    }
  });
  World.add(world, mouseConstraint);

  Runner.run(Runner.create(), engine);
  Render.run(render);
  const puck = Bodies.circle(RENDER_WIDTH / 3, RENDER_HEIGHT / 3, 30, {
    label: "puck",
    restitution: 0.8,
    isActive: true,
    render: {
      fillStyle: "#CCC",
      outlineStyle: "#000000",
      outlineWidth: 3,
    },
  });

  const p1Paddle = Bodies.circle(
    RENDER_WIDTH / 2,
    RENDER_HEIGHT - 105, // Placed paddle in front of goal
    40,
    {
      label: "P1 Paddle",
      isStatic: false,
    }
  );
  const p2Paddle = Bodies.circle(
    RENDER_WIDTH / 2,
    105, // Placed paddle in front of goal
    40,
    {
      label: "P2 Paddle",
      isStatic: false,
      render: {
        fillStyle: "blue",
      },
    }
  );

  const text = Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight + 50,
    window.innerHeight + 50,
    50,
    {
      isStatic: true,
      render: {
        fillStyle: "#FFF",
        text: {
          content: "Test",
          color: "blue",
          size: 16,
          family: "Papyrus",
        },
      },
    }
  );

  Body.setMass(puck, 0.01);
  Body.setMass(p1Paddle, 2);
  puck.onmousemove = function (event) {
    console.log(event);
  };
  puck.density = 0.01;
  p1Paddle.density = 1;
  p2Paddle.density = 1;
  const p1PaddleRadius = p1Paddle.circleRadius;
  const puckRadius = puck.circleRadius;

  const p1DiscConstraint = Constraint.create({
    bodyA: p1Paddle,
    bodyB: puck,
    label: "p1DiscConstraint",
    length: p1PaddleRadius + puckRadius,
    stiffness: 0.92,
  });

  const p2DiscConstraint = Constraint.create({
    bodyA: p2Paddle,
    bodyB: puck,
    label: "p2DiscConstraint",
    length: p1PaddleRadius + puckRadius,
    stiffness: 0.92,
  });

  p1Paddle.onCollideEnd(function (pair) {
    const isP1PuckMagnitized =
      pair.bodyB.label === "puck" &&
      pair.bodyA.label === "P1 Paddle" &&
      pair.isActive;

    if (isMagnetOn && !isP1PuckMagnitized) {
      World.add(world, p1DiscConstraint);
    }
  });

  const wallOptions = {
    isStatic: true,

    render: {
      fillStyle: "#CCC",
      borderStyle: "#FFF",
      border: "2px solid #CCC",
      borderRadius: "5px",
      background: "#FFF",
      visible: true,
    },
  };
  const walls = [
    Bodies.rectangle(RENDER_WIDTH / 2, 0, RENDER_WIDTH, 50, wallOptions),
    Bodies.rectangle(
      RENDER_WIDTH / 2,
      RENDER_HEIGHT,
      RENDER_WIDTH,
      50,
      wallOptions
    ),
    Bodies.rectangle(0, RENDER_HEIGHT / 2, 50, RENDER_HEIGHT, wallOptions),
    Bodies.rectangle(
      RENDER_WIDTH,
      RENDER_HEIGHT / 2,
      50,
      RENDER_HEIGHT,
      wallOptions
    ),
  ];

  World.add(engine.world, [p1Paddle, p2Paddle, puck, text, ...walls]);
  Window.hockeyMagneto = [p1Paddle, p2Paddle, puck, text, ...walls];

  const detachPuck = (event, paddle, constraintLabel) => {
    if (event?.mousebutton === 0 || event?.key === "ArrowDown") {
      isMagnetOn = false;

      const paddleControllers = engine.world.constraints.filter(
        (constraint) =>
          constraint.label === "PuckController" ||
          constraint.label === "Mouse Constraint"
      );

      if (paddleControllers.length > 1) {
        World.remove(engine.world, paddleControllers);
      }

      const puckControllers = engine.world.constraints.filter(
        (constraint) => constraint.label === constraintLabel
      );

      if (puckControllers.length > 0) {
        World.remove(engine.world, puckControllers);
      }
    }
  };

  const attachPuck = (event, constraint) => {
    if (event?.mousebutton === 0 || event?.key === "ArrowDown") {
      isMagnetOn = true;
      const puckControllers = engine.world.constraints.filter(
        (constraint) => constraint.label === "p2DiscConstraint"
      );
      if (event?.key === "ArrowDown" && paddle.label === "P1 Paddle") {
        World.add(engine.world, constraint);
      }
    }
  };
  render.canvas.removeEventListener(puck, MouseEvent, false);
  render.canvas.addEventListener("mousedown", function (event) {
    attachPuck(event, p1DiscConstraint);
  });
  render.canvas.addEventListener("mouseup", function (event) {
    detachPuck(event, p1Paddle, "p1DiscConstraint");
  });
  render.canvas.addEventListener("keydown", function (event) {
    attachPuck(event, p1DiscConstraint);
  });
  render.canvas.addEventListener("keyup", function (event) {
    detachPuck(event, p1Paddle, "p1DiscConstraint");
  });

  Events.on(engine, "afterUpdate", function () {
    if (mouseConstraint.body === puck) {
      mouseConstraint.body = null;
    }
  });

  render.canvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  // Create the score board
  const scoreBoard = document.createElement("div");
  scoreBoard.style.position = "absolute";
  scoreBoard.style.fontFamily = "sans-serif";
  scoreBoard.style.top = "40vh";
  scoreBoard.style.right = "10%";
  scoreBoard.style.zIndex = "1000";
  scoreBoard.style.color = "rgb(32 19 222)";
  scoreBoard.style.background = "rgb(242 242 255 / 78%)";
  scoreBoard.style.fontSize = "2em";
  scoreBoard.style.outline = "outline: 4px solid #b84f4b";
  scoreBoard.innerHTML = "Player 1: 0<br>Player 2: 0";

  document.body.appendChild(scoreBoard);

  // Code for updating the scoreboard when a goal is scored
  let player1Score = 0;
  let player2Score = 0;
  puck.onCollide(function (pair) {
    if (pair.bodyB.label === "Goal 1") {
      player1Score += 1;
    } else if (pair.bodyB.label === "Goal 2") {
      player2Score += 1;
    }
    scoreBoard.innerHTML = `Player 1: ${player1Score}<br>Player 2: ${player2Score}`;
  });

  // You will need to define the goals and add them to the world
  const goal1 = Bodies.rectangle(RENDER_WIDTH / 2, 20, 200, 120, {
    label: "Goal 1",
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "transparent" },
  });
  const goal2 = Bodies.rectangle(
    RENDER_WIDTH / 2,
    RENDER_HEIGHT - 20,
    200,
    120,
    {
      label: "Goal 2",
      isSensor: true,
      isStatic: true,
      render: { fillStyle: "transparent" },
    }
  );
  World.add(engine.world, [goal1, goal2]);

  // All the remaining code goes here...
}

// Initialize the game
initializeGame();

// Listen to the window resize event
window.addEventListener("resize", () => {
  // Remove all bodies and constraints from the world
  World.clear(engine.world);
  Engine.clear(engine);
  // Remove the canvas from the DOM
  document.body.removeChild(render.canvas);
  // Initialize the game again
  initializeGame();
  // initializeGame();
});
