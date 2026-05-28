"use strict";	//エラーをログに表示

const WIDTH = 720;			//画面幅
const HEIGHT = 520;			//画面高さ
const MESH = 24;			//１マスのサイズ
const MAG = 8;				//描画の最小単位
const TIMER_INTERVAL = 33;	//更新間隔
const ROW = 8;				//ブロックの行数
const COLUMN = 14;			//ブロックの列数

//ブロックのカラー格納配列
const PALETTE = ["#ff0000", "#ff00ff", "#00ff00", "#ffff00"];	

//汎用的なRectangleクラス
class Rectangle {
	constructor(x, y, width, height) {
		this.mWidth = width;
		this.mHeight = height;
	}

	contains(x, y) {
		return (this.mX <= x && x < this.mX + this.mWidth &&
				this.mY <= y && y < this.mY + this.mHeight);
	}

	get pCX() {
		return (this.mX + this.mWidth / 2);
	}
	set pCX(value) {
		this.mX = value - this.mWidth / 2;
	}
	get pCY() {
		return (this.mY + this.mHeight / 2);
	}
	set pCY(value) {
		this.mY = value - this.mHeight / 2;
	}
}

var gTimer;						//更新用タイマー
var gKey = new Array(100);		//キー入力格納配列
var gScore = 0;					//スコア
var gLife = 3;					//ライフ
var gWait;
var gBreak = new Array(ROW * COLUMN);

function DrawBlock(g, x, y, style) {
	g.fillStyle = style;
	g.fillRect(x + MAG / 2, y, MESH * 2 - MAG, MESH - MAG);
}

//Rectangleクラスを継承したBallクラス
class Ball extends Rectangle {
	constructor() {
		super(0, 0, MAG, MAG);
	}
	//移動処理
	move() {
		this.mX += this.mDX;
		this.mY += this.mDY;

		if (gPlayer.contains(this.mX, this.mY)) {
			let a = Math.atan2(this.pCY - gPlayer.pCY, this.pCX - gPlayer.pCX);
			this.mDX = Math.cos(a);
			this.mDY = Math.sin(a);
			this.mDY = Math.min(this.mDY, -0.25);
			this.mY += this.mDY;
			this.mSpeed++;
		}

		let x = Math.floor((this.pCX - MESH) / (MESH * 2));
		let y = Math.floor((this.pCY - MESH * 3) / MESH);
		if (x >= 0 && x < COLUMN &&
			y >= 0 && y < ROW) {
			let i = y * COLUMN + x;
			if (!gBreak[i]) {
				gBreak[i] = 1;
				gScore++;
				let dx = Math.abs(this.pCX - (x + 1) * MESH * 2);
				let dy = Math.abs(this.pCY - (y + 3.5) * MESH);
				if (dx < dy * 2) {
					this.mDY *= -1;
				} else {
					this.mDX *= -1;
				}
			}
		}

		if (this.pCX < MESH || this.pCX > WIDTH - MESH) {
			this.mDX *= -1;
		}
		if (this.pCY < MESH) {
			this.mDY *= -1;
		}
	}
	//初期化
	start() {
		this.pCX = WIDTH / 2;
		this.pCY = MESH * 12;
		this.mDX = Math.random() / 5 - 0.1;
		this.mDY = 1;
		this.mSpeed = 32;
	}
	//更新
	tick() {
		for (let i = 0; i < this.mSpeed / 4; i++) {
			this.move();
		}

		if (this.mY > HEIGHT) {
			if (!--gLife) return;
			start();
		}
	}
	//描画
	draw(g) {
		g.fillStyle = "#ffffff";
		g.fillRect(this.mX, this.mY, MAG, MAG);
	}
}

var gBall = new Ball();

//Rectangleクラスを継承したPlayerクラス
class Player extends Rectangle {
	constructor() {
		super(0, 0, MESH * 2, MESH);
	}
	//初期化
	start() {
		this.pCX = WIDTH / 2;			//プレイヤーのX座標
		this.pCY = HEIGHT - MESH * 2;	//プレイヤーのY座標
	}
	//更新
	tick() {
		this.mX = Math.max(MESH,			  this.mX - gKey[37] * MAG);
		this.mX = Math.min(WIDTH - MESH * 2,  this.mX + gKey[39] * MAG);
		//this.mY = Math.max(MESH,			  this.mY - gKey[38] * MAG);
		//this.mY = Math.min(HEIGHT - MESH * 2, this.mY + gKey[40] * MAG);
	}
	//描画
	draw(g) {
		DrawBlock(g, this.mX, this.mY, "#00ffff");
	}
}

var gPlayer = new Player();	

//初期化
function start() {
	gWait = 60;
	//プレイヤー初期化
	gPlayer.start();
	//ボールの初期化
	gBall.start();
}
//更新
function tick() {
	if (!gLife) return;
	if (gScore == COLUMN * ROW) return;

	//プレイヤー更新
	gPlayer.tick();

	if (gWait) {
		gWait--;
		return;
	}
	
	//ボール更新
	gBall.tick();
}
//描画
function draw() {
	let g = document.getElementById("main").getContext("2d");

	//ステージの描画
	g.fillStyle = "#ffffff";
	g.fillRect(0, 0, WIDTH, HEIGHT);
	g.fillStyle = "#000000";
	g.fillRect(MESH, MESH, WIDTH - MESH * 2, HEIGHT - MESH);

	//ブロックの描画
	for (let y = 0; y < ROW; y++) {
		for (let x = 0; x < COLUMN; x++) {
			if (!gBreak[y * COLUMN + x]) DrawBlock(g, MESH * (x * 2 + 1), (y + 3) * MESH, PALETTE[ y >> 1]);
		}
	}

	//プレイヤーの描画
	gPlayer.draw(g);

	//ボールの表示
	gBall.draw(g);

	//UIの描画
	g.font = "36px monospace";
	g.fillStyle = "#ffffff";
	g.fillText("SCORE " + gScore, MESH * 2, MESH * 2.5);
	g.fillText("LIFE " + gLife, MESH * 23, MESH * 2.5);

	if (gLife <= 0) {
		g.fillText("GAME OVER", WIDTH / 2 - MESH * 3, HEIGHT / 2 + MESH * 3);
	}

	if (gScore == COLUMN * ROW) {
		g.fillText("GAME CLEAR", WIDTH / 2 - MESH * 3, HEIGHT / 2 + MESH * 3);
	}
}

//一定の間隔で処理されるmain関数
function main() {
	if (!gTimer) {
		gTimer = performance.now();
	}

	if (gTimer + TIMER_INTERVAL < performance.now()) {
		gTimer += TIMER_INTERVAL;
		tick();
		draw();
	}

	requestAnimationFrame(main);
}

//キーが押されたときのイベント
window.onkeydown = function(ev) {
	gKey[ev.keyCode] = 1;
}
//キーが離されたときのイベント
window.onkeyup = function(ev) {
	gKey[ev.keyCode] = 0;
}
//起動時のイベント
window.onload = function () {
	//キー入力格納配列の初期化
	for (var i = 0; i < 100; i++) {
		gKey[i] = 0;
	}
	for (var i = 0; i < gBreak.length; i++) {
		gBreak[i] = 0;
	}
	start();
	requestAnimationFrame(main);
}
