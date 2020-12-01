"use strict";

const app = new PIXI.Application({
    width: 1000,
    height: 600
});
document.body.appendChild(app.view);

const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

let paused = true;

let stage;

let testLevelScene, crate;

setup();

function setup()
{
    stage = app.stage;

    testLevelScene = new PIXI.Container();
    stage.addChild(testLevelScene);

    crate = new Crate(new Vector(245, 20), 20, 20, 0.5, 500);
    crate.interactive = true;
    crate.buttonMode = true;
    crate.on("mousedown", e => crate.grabbed = true);
    app.view.onmouseup = e => crate.grabbed = false;
    testLevelScene.addChild(crate);

    app.ticker.add(gameLoop);

    paused = false;
}

function gameLoop()
{
    if (paused) { return; }

    let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt = 1/12;

    let mousePosition = app.renderer.plugins.interaction.mouse.global;

    crate.update(dt, mousePosition);
    crate.draw();
}