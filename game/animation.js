/**
 * 結合定数は固定値とし，1 とする．
 * 周期境界条件を考慮する．
 */

const RGBA_SIZE = 4;

let temperature = 2.26918531421;

/**
 * Ising模型のスピン系を描画するキャンバス．
 * @type {HTMLCanvasElement}
 */
let isingStateCanvas;

/**
 * Ising模型のスピン系を描画するためのメソッドを持つオブジェクト．
 * @type {CanvasRenderingContext2D}
 */
let stateContext

/**
 * Ising模型のスピン系を表す2次元配列．
 * @type {Array<Number>}
 */
let isingState;


/**
 * スピンの(x, y)座標を受け取り，
 * 指定されたスピンが周りのスピンとの相互作用によって生み出すエネルギーを戻り値として返す．
 * @param {Number} x 提案状態にて反転させたスピンのx座標．
 * @param {Number} y 提案状態にて反転させたスピンのy座標．
 */
function calcBondEnergy(x, y) {
    const xMaxSize = isingStateCanvas.width
    const yMaxSize = isingStateCanvas.height

    return - isingState[x][y] * isingState[(x + 1) % xMaxSize][y]
        - isingState[x][y] * isingState[(x - 1 + xMaxSize) % xMaxSize][y]
        - isingState[x][y] * isingState[x][(y + 1) % yMaxSize]
        - isingState[x][y] * isingState[x][(y - 1 + yMaxSize) % yMaxSize];
}

/**
 * (提案状態のエネルギー) - (現在の状態のエネルギー)を計算して戻り値として返す．
 * @param {Number} x 提案状態にて反転させたスピンのx座標．
 * @param {Number} y 提案状態にて反転させたスピンのy座標．
 */
function calcEnergyDifference(x, y) {
    return -2 * calcBondEnergy(x, y);
}

/**
 * Ising模型のスピン系をメトロポリス法によって更新する．
 */
function updateStateByMetropolis() {
    for (var i = 0; i < 100000; i++) {
        // 現在の状態から反転させるスピンを，ランダムに座標によって指定する．
        const xMaxSize = isingStateCanvas.width;
        const yMaxSize = isingStateCanvas.height;
        const x = Math.floor(Math.random() * xMaxSize);
        const y = Math.floor(Math.random() * yMaxSize);

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
    temperature = Math.max(0.00000001, parseFloat(document.getElementById('temperature').value));
}

function convertSpinIntoPixel(spin, bufferData, bufferIndex) {
    const rgb = (spin + 1) / 2 * 255; // 0 or 255

    bufferData[bufferIndex + 0] = rgb; // R
    bufferData[bufferIndex + 1] = rgb; // G
    bufferData[bufferIndex + 2] = rgb; // B
    bufferData[bufferIndex + 3] = 255; // A
}

function convertStateIntoPixelBufferData(buffer) {
    const xMaxSize = isingStateCanvas.width;
    const yMaxSize = isingStateCanvas.height;

    for (var x = 0; x < xMaxSize; x++) {
        for (var y = 0; y < yMaxSize; y++) {
            const indexOfPixel = x + y * xMaxSize;
            const realIndexInBuffer = indexOfPixel * RGBA_SIZE;
            convertSpinIntoPixel(isingState[x][y], buffer.data, realIndexInBuffer);
        }
    }
}

function drawCanvas() {
    let buffer = stateContext.getImageData(0, 0, isingStateCanvas.width, isingStateCanvas.height);
    convertStateIntoPixelBufferData(buffer);
    stateContext.putImageData(buffer, 0, 0);
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
    stateContext = isingStateCanvas.getContext('2d');
    stateContext.clearRect(0, 0, isingStateCanvas.width, isingStateCanvas.height);
    stateContext.fillStyle = 'rgba(200,200,200,0.2)';
    stateContext.fillRect(0, 0, isingStateCanvas.width, isingStateCanvas.height);
}

/**
 * 実行開始時に呼び出され，各変数を初期化する．
 */
let init = function () {
    // Ising模型のスピン系を描画するキャンバスを初期化する．
    isingStateCanvas = document.getElementById('ising-state-canvas');
    clearIsingStateCanvas();

    // Ising模型のスピン系のサイズを，キャンバスに合わせ初期化する．
    isingState = []
    for (let i = 0; i < isingStateCanvas.width; i++) {
        isingState.push(Array(isingStateCanvas.height).fill(0));
    }
    // 各要素(スピン変数)を 1 または -1 にランダムに初期化する.
    for (let x = 0; x < isingStateCanvas.width; x++) {
        for (let y = 0; y < isingStateCanvas.height; y++) {
            let randomBit = Math.floor(Math.random() * 2) // 1 or 0
            isingState[x][y] = 2 * randomBit - 1; // 1 or -1
        }
    }

    // 画面への描画・更新を開始する．
    requestAnimationFrame(tick);
};
window.onload = init;
