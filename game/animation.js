/**
 * 結合定数は固定値とし，1 とする．
 * 周期境界条件を考慮する．
 */

/**
 * ImageData オブジェクトの，1セットごとの要素数．
 * @type {number}
 */
const RGBA_SIZE = 4;

/**
 * Ising模型の温度．
 * @type {number}
 */
let temperature = 2.26918531421;

/**
 * Ising模型のスピン系を描画するキャンバス．
 * @type {HTMLCanvasElement}
 */
let isingCanvas;

/**
 * Ising模型のスピン系を描画するためのメソッドを持つオブジェクト．
 * @type {CanvasRenderingContext2D}
 */
let canvasContext

/**
 * Ising模型のスピン系を表す2次元配列．
 * @type {Array.<number>}
 */
let isingState;

let canvasXSize;
let canvasYSize;
let stateXSize = 100;
let stateYSize = 100;


/**
 * スピンの座標を受け取り，そのスピンと周りのスピンとの相互作用エネルギーの和を戻り値として返す．
 * @param {number} x スピンのx座標．
 * @param {number} y スピンのy座標．
 */
function calcBondEnergy(x, y) {
    // 周期境界条件を考慮して，隣接スピンの座標を計算．
    const xPlus1 = (x + 1) % stateXSize;
    const xMinus1 = (x - 1 + stateXSize) % stateXSize;
    const yPlus1 = (y + 1) % stateYSize;
    const yMinus1 = (y - 1 + stateYSize) % stateYSize;

    // エネルギーの和を戻り値として返す．
    return - isingState[x][y] * isingState[xPlus1][y]
        - isingState[x][y] * isingState[xMinus1][y]
        - isingState[x][y] * isingState[x][yPlus1]
        - isingState[x][y] * isingState[x][yMinus1];
}

/**
 * (提案状態のエネルギー) - (現在の状態のエネルギー)を計算して戻り値として返す．
 * @param {number} x 提案状態にて反転させたスピンのx座標．
 * @param {number} y 提案状態にて反転させたスピンのy座標．
 */
function calcEnergyDifference(x, y) {
    return -2 * calcBondEnergy(x, y);
}

/**
 * Ising模型のスピン系をメトロポリス法によって更新する．
 */
function updateStateByMetropolis() {
    for (var i = 0; i < 10000; i++) {
        // 現在の状態から反転させるスピンを，ランダムに座標によって指定する．
        const x = Math.floor(Math.random() * stateXSize);
        const y = Math.floor(Math.random() * stateYSize);

        // 反転させたことによる，エネルギーの変化量を計算する．
        const energyDifference = calcEnergyDifference(x, y);

        // メトロポリス法により，遷移判定を行う．
        // Note: 指数部に必要以上に大きい値を渡さないよう，1 との min をとる．
        const exponent = Math.min(1, (- energyDifference / temperature));
        if (Math.random() < Math.exp(exponent)) {
            isingState[x][y] = - isingState[x][y];
        }
    }
}

function updateTemperature() {
    temperature = parseFloat(document.getElementById('temperature').value);
}

/**
 * スピンの座標を受け取り，スピンを描画用データに変換して書き込む．
 * @param {number} x スピンのx座標．
 * @param {number} y スピンのy座標．
 * @param {ImageData} buffer 書き込み先の描画用データ．
 */
function convertSpinIntoPixels(x, y, buffer) {
    // 1スピンに対応する，キャンバスのブロックの大きさを計算する．
    const blockXSize = canvasXSize / stateXSize;
    const blockYSize = canvasYSize / stateYSize;

    // 書き込むスピンを取得する．
    const spin = isingState[x][y];
    const spinColor = (spin + 1) / 2 * 255; // 0 or 255

    // ブロックへの書き込みを行う．
    const upperLeftPixelIndex = ((blockYSize * y) * canvasXSize) + (blockXSize * x);
    for (let dx = 0; dx < blockXSize; dx++) {
        for (let dy = 0; dy < blockYSize; dy++) {
            const pixelIndex = upperLeftPixelIndex + (dy * canvasXSize) + dx;
            const bufferIndex = pixelIndex * RGBA_SIZE;
            buffer.data[bufferIndex + 0] = spinColor; // R
            buffer.data[bufferIndex + 1] = spinColor; // G
            buffer.data[bufferIndex + 2] = spinColor; // B
            buffer.data[bufferIndex + 3] = 150; // A
        }
    }
}

/**
 * 現在のIsing模型の状態を，描画用のデータに変換する．
 * @param {ImageData} buffer 書き込み先の描画用データ．
 */
function convertIsingStateIntoBufferData(buffer) {
    // 各スピンを描画用データに変換する．
    for (var x = 0; x < stateXSize; x++) {
        for (var y = 0; y < stateYSize; y++) {
            convertSpinIntoPixels(x, y, buffer);
        }
    }
}

/**
 * スピン系の現在の状態をキャンバスに描画する．
 */
function drawCanvas() {
    let buffer = canvasContext.getImageData(0, 0, canvasXSize, canvasYSize);
    convertIsingStateIntoBufferData(buffer);
    canvasContext.putImageData(buffer, 0, 0);
}

let tick = function () {
    // モデルの更新・描画を行う．
    updateStateByMetropolis();
    drawCanvas();

    // 再帰的に更新・描画を行う．
    requestAnimationFrame(tick);
};

/**
 * Ising模型のスピン系を描画するキャンバスを初期化する．
 */
function clearIsingStateCanvas() {
    canvasContext = isingCanvas.getContext('2d');
    canvasContext.clearRect(0, 0, canvasXSize, canvasYSize);
    canvasContext.fillStyle = 'rgba(200,200,200,0.2)';
    canvasContext.fillRect(0, 0, canvasXSize, canvasYSize);
}

/**
 * 本ファイル実行開始時に呼び出され，各変数を初期化する．
 */
let init = function () {
    // Ising模型のスピン系を描画するキャンバスを初期化する．
    isingCanvas = document.getElementById('ising-state-canvas');
    canvasXSize = isingCanvas.width
    canvasYSize = isingCanvas.height
    clearIsingStateCanvas();

    // Ising模型のスピン系を初期化する．
    isingState = []
    for (let i = 0; i < stateXSize; i++) {
        isingState.push(Array(stateYSize).fill(0));
    }
    for (let x = 0; x < stateXSize; x++) {
        for (let y = 0; y < stateYSize; y++) {
            // 各スピン変数を 1 または -1 に初期化する.
            let randomBit = Math.floor(Math.random() * 2);
            isingState[x][y] = 2 * randomBit - 1;
        }
    }

    // 画面への描画・更新を開始する．
    requestAnimationFrame(tick);
};
window.onload = init;
