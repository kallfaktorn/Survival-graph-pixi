//  http-server -c-1 -p 8000

var locations = [];
var sprites = [];

$(document).ready(async function() {
  let type = "WebGL"
  /*if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
  }*/

  const appWidth = 2000;
  const appHeight = 2000;

  let app = new PIXI.Application({
      width: appWidth,         // default: 800
      height: appHeight,        // default: 600
      antialias: true,    // default: false
      transparent: false, // default: false
      resolution: 1       // default: 1
  });

  // Background color white
  app.renderer.backgroundColor = 0xffffff;

  PIXI.utils.sayHello(type)
  document.body.appendChild(app.view);

  let screenX = 0;
  let screenY = 0;
  let offsetScreenX = 0;
  let offsetScreenY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let scale = 1;
  let scaleOffsetX = 0;
  let scaleOffsetY = 0;
  let cameraX = 0;
  let cameraY = 0;

  const player = {};
  let state;

  let mouseDown = false;


  // Colors

  // black
  const black = 0x000000;

  // lightgreen
  const lightGreen = 0x90ee90;

  // lightergreen
  const lighterGreen = 0xc0eec0;


  // yellowgreen
  const yellowGreen = 0x9acd32;

  // green
  const green = 0x008f00;


  const texturePaths = ['tree.svg', 'grass_turf.svg'];
  loadTextures(texturePaths);
  PIXI.loader.load(setup);
  var graphics = new PIXI.Graphics();

  const firstNode = generateFirstNode();
  let selectedLocation = undefined;
  let traverseIndex = 0;
  let traveling = false;

  $( "body" ).keypress(function( event ) {
    if (traveling) {
      switch(event.which) {
        case 44:
        event.preventDefault();
        traverseLeft();
        break;
        case 46:
        event.preventDefault();
        traverseRight();
        break;
        case 13:
        event.preventDefault();
        updatePlayerLocation();
        break;
      }
    } else {
      switch(event.which) {
        case 13:
        event.preventDefault();
        explore();
        break;
        case 97:
        event.preventDefault();
        zoomIn();
        break;
        case 122:
        event.preventDefault();
        zoomOut();
        break;
        case 116:
        event.preventDefault();
        travel();
        break;
      }
    }
  });
/*
  state = play;

  //Start the game loop
  app.ticker.add(delta => gameLoop(delta));

  function gameLoop(delta) {

    //console.log(locations[0].x)


//    locations[0].x += 1;

    //Update the current game state:
    state(delta);
  }

  function play(delta) {

    //Use the cat's velocity to make it move
  //  cat.x += cat.vx;
  //  cat.y += cat.vy
  }
*/
  function setup() {
    console.log('textures loaded');
    //This code will run when the loader has finished loading the image
    createScene();
  }

  app.stage.hitArea = app.screen;
  app.stage.interactive = true;

  app.stage.on('mousemove', function(event) {
    if (mouseDown) {
      const mouseX = event.data.global.x;
      const mouseY = event.data.global.y;
      const scale = graphics.scale.x;
      screenX = mouseX - offsetScreenX;
      screenY = mouseY - offsetScreenY;
    }

  //  console.log('mousmove')
    graphics.position.set(screenX, screenY);

    locations.forEach((location, i) => {
      location.pois.forEach((poi, i) => {
        const sprite = poi.sprite;
        //sprite.x = scale * (screenX + location.x - location.r + poi.x - poi.r)
        //sprite.y = scale * (screenY + location.y - location.r + poi.y - poi.r)

      //  console.log('scale: ' + scale)

        const x = (screenX) + ((location.x - location.r + poi.x - poi.r) * scale)
        const y = (screenY) + ((location.y - location.r + poi.y - poi.r) * scale)
        sprite.x = x;
        sprite.y = y;
      });
    });
  });

  app.stage.on('mousedown', function(event) {
    const mouseX = event.data.global.x;
    const mouseY = event.data.global.y;
    offsetScreenX = mouseX - screenX;
    offsetScreenY = mouseY - screenY;
    mouseDown = true;
//    console.log('pixijs down mouse')
  });

  app.stage.on('mouseup', function(event) {
    mouseDown = false;
  });

  function loadTextures(texturePaths) {
    texturePaths.forEach((item, i) => {
      PIXI.loader.add(item);
    });
  }

  function createScene() {
    console.log('CREATING THE SCENE');
    app.stage.addChild(graphics);
    // addSpriteToScene(texturePaths[0], 200, 200, 20);

    // There will only be one. The first node
    const firstNode = locations[0];
    drawCircle(screenX + firstNode.x, screenY + firstNode.y, green);

    firstNode.pois.forEach((poi, i) => {
      const sprite = addSpriteToScene(poi.imageName, screenX + scale * (firstNode.x - firstNode.r + poi.x - poi.r), screenY + scale * (firstNode.y - firstNode.r + poi.y - poi.r), 20 * scale);
      sprite.scale.set(sprite.scale.x * scale, sprite.scale.y * scale)
      poi.sprite = sprite;
    });
  }

  function travel() {
    traveling = true;
    traverseIndex = 0;
    selectedLocation = player.location.neighbours[traverseIndex];
    const playerLocation = player.location;
    drawCircle(playerLocation.x, playerLocation.y, green);

    playerLocation.neighbours.forEach((neighbour, i) => {
      drawCircle(neighbour.x, neighbour.y, lighterGreen);
    });

    drawCircle(selectedLocation.x, selectedLocation.y, yellowGreen);
    //drawScene();
  }

  function explore() {
    const node = player.location;
    const location = generateLocation(node);

    if (location) {
      drawCircle(location.x, location.y, lightGreen);

      location.pois.forEach((poi, i) => {
        const sprite = addSpriteToScene(poi.imageName, (screenX) + (scale * (location.x - location.r + poi.x - poi.r)), screenY + (scale * (location.y - location.r + poi.y - poi.r)), 20 * scale);
        poi.sprite = sprite;
      });

      const pairs = findPairs(location);
      pairs.forEach((pair, i) => {
        const edge = computeEdgeBetweenNodes(pair[0], pair[1]);
        drawLine(edge.x1, edge.y1, edge.x2, edge.y2)
      });
    }
    // drawScene();
  }

  function drawCircle(x, y, color) {
    // lightgreen
    graphics.beginFill(color);
    //graphics.drawCircle(scale * x, scale * y, scale * NODE_RADIUS, 0, 2 * Math.PI);
    graphics.drawCircle(x, y, NODE_RADIUS()); // drawCircle(x, y, radius)
    graphics.endFill();
  }

  function drawLine(x1, y1, x2, y2) {
    graphics.lineStyle(1, black)
       .moveTo(x1, y1)
       .lineTo(x2, y2);
  }

  function zoomIn() {
    //scale *= 0.5;
    graphics.scale.set(graphics.scale.x * 0.5 , graphics.scale.y * 0.5 );

    const scale1 = graphics.scale.x;
    const x = graphics.position.x;
    const y = graphics.position.y;
    scaleOffsetX = (appWidth * scale1 / 8);
    scaleOffsetY = (appHeight * scale1 / 8);
    screenX = x + scaleOffsetX;
    screenY = y + scaleOffsetY;

    graphics.position.set(screenX, screenY);

    locations.forEach((location, i) => {
      location.pois.forEach((poi, i) => {
        const sprite = poi.sprite;

        const x = (screenX) + ((location.x - location.r + poi.x - poi.r) * scale1)
        const y = (screenY) + ((location.y - location.r + poi.y - poi.r) * scale1)
        sprite.x = x;
        sprite.y = y;

        sprite.scale.set(sprite.scale.x * 0.5, sprite.scale.y * 0.5);
      });
    });

    scale = scale1;
  }

  function zoomOut() {
    //scale *= 2;
    graphics.scale.set(graphics.scale.x * 2 , graphics.scale.y * 2 );

    const scale1 = graphics.scale.x;
    const x = graphics.position.x;
    const y = graphics.position.y;
    scaleOffsetX = -(appWidth * scale1 / 16);
    scaleOffsetY = -(appHeight * scale1 / 16);
    screenX = x + scaleOffsetX;
    screenY = y + scaleOffsetY;

    graphics.position.set(screenX, screenY);

    locations.forEach((location, i) => {
      location.pois.forEach((poi, i) => {
        const sprite = poi.sprite;

        const x = (screenX) + ((location.x - location.r + poi.x - poi.r) * scale1)
        const y = (screenY) + ((location.y - location.r + poi.y - poi.r) * scale1)
        sprite.x = x;
        sprite.y = y;

        sprite.scale.set(sprite.scale.x * 2, sprite.scale.y * 2);
      });
    });

    scale = scale1;
  }

  function traverseLeft() {
    if (traveling) {
      --traverseIndex;
      updateSelectedLocation()
    }
  }

  function traverseRight() {
    if (traveling) {
      ++traverseIndex;
      updateSelectedLocation()
    }
  }

  function updateSelectedLocation() {
    const neighboursLength = player.location.neighbours.length;
    let index = Math.abs(traverseIndex) % neighboursLength;
    if (traverseIndex < 0) {
      index = neighboursLength - index;
      if (index === neighboursLength) {
        index = 0;
      }
    }

    player.location.neighbours.forEach((location, i) => {
      drawCircle(location.x, location.y, lighterGreen);
    });

    //drawCircle(selectedLocation.x, selectedLocation.y, lightGreen);
    selectedLocation = player.location.neighbours[index];

    drawCircle(selectedLocation.x, selectedLocation.y, yellowGreen);
  }

  function updatePlayerLocation() {
    traveling = false;


    player.location.neighbours.forEach((location, i) => {
      drawCircle(location.x, location.y, lightGreen);
    });

    drawCircle(player.location.x, player.location.y, lightGreen);

    player.location = selectedLocation;
    drawCircle(selectedLocation.x, selectedLocation.y, green);
  }

  function addSpriteToScene(texturePath, x, y, size) {
    let sprite = new PIXI.Sprite(PIXI.loader.resources[texturePath].texture);
    sprite.position.set(x, y);
    sprite.width = size;
    sprite.height = size;
    app.stage.addChild(sprite);

    return sprite;
  }

  function generateFirstNode() {
    const firstNodeX = 340;
    const firstNodeY = 340;
    const node = generateNode( firstNodeX, firstNodeY, NODE_RADIUS() );
    locations.push( node );
    player.location = node;
    return node;
  }

  function findPairs(location) {
    const pairs = [];

    location.neighbours.forEach((neighbour, i) => {
      if (!existsPair(location, neighbour, pairs)) {
        pairs.push([location, neighbour]);
      }
    });

    return pairs;
  }

  function existsPair(n1, n2, pairs) {
    pairs.forEach((pair, i) => {
      if ((pair[0] === n1 && pair[1] === n2)
      || (pair[0] === n2 && pair[1] === n1)) {
        return true;
      }
    });

    return false;
  }
});
