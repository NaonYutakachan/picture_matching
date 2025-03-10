/**
 * Ising模型のスピン系を描画するキャンバスの情報とメソッドを持つクラス．
 */
class IsingCanvas {
    /**
     * @param {HTMLCanvasElement} isingCanvasElement Ising模型のスピン系を描画するキャンバス．
     */
    constructor(isingCanvasElement) {
        /**
         * キャンバスのx軸方向の大きさ．単位はpx.
         * @type {number}
         */
        this.xSize = isingCanvasElement.width;
        /**
         * キャンバスのy軸方向のの大きさ．単位はpx.
         * @type {number}
         */
        this.ySize = isingCanvasElement.height;

        /**
         * Ising模型のスピン系を描画するためのメソッドを持つオブジェクト．
         * @type {CanvasRenderingContext2D}
         */
        this.context = isingCanvasElement.getContext("2d");

        // キャンバスを初期化する．
        this.context.clearRect(0, 0, this.xSize, this.ySize);
        this.context.fillStyle = "rgba(200,200,200,0.2)";
        this.context.fillRect(0, 0, this.xSize, this.ySize);

        /**
         * 書き込み先の描画用データ．
         * @type {ImageData}
         */
        this.buffer = this.context.getImageData(0, 0, this.xSize, this.ySize);
    }

    /**
     * スピン系と座標を受け取り，指定された座標のスピンを描画用データに変換して書き込む．
     * @param {Array.<number>} isingState スピン系．
     * @param {number} x スピンのx座標．
     * @param {number} y スピンのy座標．
     */
    convertSpinIntoPixels(isingState, x, y) {
        // スピン系のサイズを取り出す．
        const stateXSize = isingState.length;
        const stateYSize = isingState[0].length;

        // 1スピンに対応する，キャンバスのブロックの大きさを計算する．
        const blockXSize = this.xSize / stateXSize;
        const blockYSize = this.ySize / stateYSize;

        // 書き込むスピンを取得する．
        const spin = isingState[x][y];
        let spinColorR;
        let spinColorG;
        let spinColorB;
        if (spin == 1) {
            spinColorR = 0x3C;
            spinColorG = 0xB3;
            spinColorB = 0x71;
        } else {
            spinColorR = 0xFF;
            spinColorG = 0xFD;
            spinColorB = 0xD0;
        }

        // ブロックへの書き込みを行う．
        const upperLeftPixelIndex = ((blockYSize * y) * this.xSize) + (blockXSize * x);
        const RGBA_SIZE = 4;
        for (let dx = 0; dx < blockXSize; dx++) {
            for (let dy = 0; dy < blockYSize; dy++) {
                const pixelIndex = upperLeftPixelIndex + (dy * this.xSize) + dx;
                const bufferIndex = pixelIndex * RGBA_SIZE;
                this.buffer.data[bufferIndex + 0] = spinColorR; // R
                this.buffer.data[bufferIndex + 1] = spinColorG; // G
                this.buffer.data[bufferIndex + 2] = spinColorB; // B
                this.buffer.data[bufferIndex + 3] = 255; // A
            }
        }
    }

    /**
     * スピン系を受け取り，描画用データに変換して画素配列に書き込む．
     * @param {Array.<number>} isingState 書き込むスピン系．
     */
    convertIsingStateIntoBufferData(isingState) {
        // スピン系のサイズを取り出す．
        const stateXSize = isingState.length;
        const stateYSize = isingState[0].length;

        // 各スピンを描画用データに変換する．
        for (let x = 0; x < stateXSize; x++) {
            for (let y = 0; y < stateYSize; y++) {
                this.convertSpinIntoPixels(isingState, x, y);
            }
        }
    }

    /**
     * 現在の描画用データをキャンバスに描画する．
     */
    drawCurrentBuffer() {
        this.context.putImageData(this.buffer, 0, 0);
    }
}

/**
 * Ising模型の状態を保持するクラス．
 */
class IsingModel {
    /**
     * @param {number} xSize Ising模型のx軸方向の大きさ．単位はpx.
     * @param {number} ySize Ising模型のy軸方向の大きさ．単位はpx.
     */
    constructor(xSize, ySize) {
        /**
         * Ising模型のx軸方向の大きさ．単位はpx.
         * @type {number}
         */
        this.xSize = xSize;
        /**
         * Ising模型のy軸方向の大きさ．単位はpx.
         * @type {number}
         */
        this.ySize = ySize;

        /**
         * Ising模型のスピン系を表す2次元配列．
         * @type {Array.<number>}
         */
        this.state = [];

        // Ising模型を指定したサイズに初期化する．
        for (let i = 0; i < this.xSize; i++) {
            this.state.push(Array(this.ySize).fill(0));
        }

        // 各スピン変数を 1 または -1 に初期化する.
        for (let x = 0; x < this.xSize; x++) {
            for (let y = 0; y < this.ySize; y++) {
                let randomBit = Math.floor(Math.random() * 2);
                this.state[x][y] = 2 * randomBit - 1;
            }
        }
    }

    /**
     * スピン系におけるスピンの座標を受け取り，そのスピンと周りのスピンとの相互作用によるエネルギーの和を戻り値として返す．
     * @param {number} x スピンのx座標．
     * @param {number} y スピンのy座標．
     */
    calcBondEnergy(x, y) {
        // 周期境界条件を考慮して，隣接スピンの座標を計算．
        const xPlus1 = (x + 1) % this.xSize;
        const xMinus1 = (x - 1 + this.xSize) % this.xSize;
        const yPlus1 = (y + 1) % this.ySize;
        const yMinus1 = (y - 1 + this.ySize) % this.ySize;

        // エネルギーの和を戻り値として返す．
        return - this.state[x][y] * this.state[xPlus1][y]
            - this.state[x][y] * this.state[xMinus1][y]
            - this.state[x][y] * this.state[x][yPlus1]
            - this.state[x][y] * this.state[x][yMinus1];
    }
}

/**
 * Ising模型の外部パラメータに関する情報を持つクラス．
 */
class IsingParameter {
    /**
     * @param {number} temperature Ising模型の初期温度．
     * @param {number} changeRate Ising模型の初期変化速度．
     */
    constructor(temperature, changeRate) {
        /**
         * Ising模型の温度．
         * @type {number}
         */
        this.temperature = temperature;

        /**
         * Ising模型のスピン系が変化する速度．
         * 
         * 正確には，1フレーム当たりの状態遷移判定回数．
         * @type {number}
         */
        this.changeRate = changeRate;
    }

    /**
     * 温度を受け取り，現在の温度パラメータをその値に更新する．
     * @param {number} temperature 温度．
     */
    updateTemperature(temperature) {
        this.temperature = temperature;
    }

    /**
     * Ising模型の変化速度を受け取り，現在の速度パラメータをその値に更新する．
     * @param {number} changeRate 変化速度．
     */
    updateChangeRate(changeRate) {
        this.changeRate = changeRate;
    }
}

class IsingSystem {
    /**
     * @param {number} xSize Ising模型のx軸方向の大きさ．単位はpx.
     * @param {number} ySize Ising模型のy軸方向の大きさ．単位はpx.
     */
    constructor(xSize, ySize, temperature, changeRate) {
        /**
         * @type {IsingModel}
         */
        this.model = new IsingModel(xSize, ySize);

        /**
         * @type {IsingParameter}
         */
        this.parameter = new IsingParameter(temperature, changeRate);
    }

    /**
     * (提案状態のエネルギー) - (現在の状態のエネルギー)を計算して戻り値として返す．
     * @param {number} x 提案状態にて反転させたスピンのx座標．
     * @param {number} y 提案状態にて反転させたスピンのy座標．
     */
    calcEnergyDifference(x, y) {
        return -2 * this.model.calcBondEnergy(x, y);
    }

    /**
     * Ising模型のスピン系をメトロポリス法によって更新する．
     */
    updateStateByMetropolis() {
        for (var i = 0; i < this.parameter.changeRate; i++) {
            // 現在の状態から反転させるスピンを，ランダムに座標によって指定する．
            const x = Math.floor(Math.random() * this.model.xSize);
            const y = Math.floor(Math.random() * this.model.ySize);

            // 反転させたことによる，エネルギーの変化量を計算する．
            const energyDifference = this.calcEnergyDifference(x, y);

            // メトロポリス法により，遷移判定を行う．
            // Note: 指数部に必要以上に大きい値を渡さないよう，1 との min をとる．
            const exponent = Math.min(1, (- energyDifference / this.parameter.temperature));
            if (Math.random() < Math.exp(exponent)) {
                this.model.state[x][y] = - this.model.state[x][y];
            }
        }
    }
}

class PlayerBoard {
    constructor(isingCanvasElement, isingModelXSize, isingModelYSize, temperature, changeRate) {
        /**
         * @type {IsingCanvas}
         */
        this.isingCanvas = new IsingCanvas(isingCanvasElement);

        /**
         * @type {IsingSystem}
         */
        this.IsingSystem = new IsingSystem(isingModelXSize, isingModelYSize, temperature, changeRate);
    }

    /**
     * 現在のスピン系をキャンバスに描画する．
     */
    drawCurrentIsingState() {
        this.isingCanvas.convertIsingStateIntoBufferData(this.IsingSystem.model.state);
        this.isingCanvas.drawCurrentBuffer();
    }
}

function calcTemperatureFromInputPosition() {
    // 入力から温度バーの位置を受け取る．
    const temperaturePosition = parseFloat(document.getElementById("temperature-position").value);

    // 入力の最小値と最大値を取り出す．
    const minPosition = 0;
    const maxPosition = 100;

    // 温度の最小値と最大値を設定する．
    const minTemperature = 0.00000000001;
    const maxTemperature = 4.53837062843;

    // 単位幅あたりの温度変更値を求める．
    const scale = (maxTemperature - minTemperature) / (maxPosition - minPosition);

    // 入力と対応する温度を求めて戻り値として返す．
    const temperature = minTemperature + scale * (temperaturePosition - minPosition);
    return temperature;
}

function calcChangeRateFromInputPosition() {
    // 入力から温度バーの位置を受け取る．
    const changeRatePosition = parseFloat(document.getElementById("change-rate-position").value);

    // 入力の最小値と最大値を取り出す．
    const minPosition = 0;
    const maxPosition = 100;

    // 変化速度の最小値と最大値を設定する．
    const minChangeRate = 100;
    const maxChangeRate = 100000;

    // 速度をlogスケールに変換する．
    const minLogChangeRate = Math.log(minChangeRate);
    const maxLogChangeRate = Math.log(maxChangeRate);

    // 単位幅あたりの速度変更値を求める．
    const scale = (maxLogChangeRate - minLogChangeRate) / (maxPosition - minPosition);

    // 入力と対応する温度を求めて戻り値として返す．
    const changeRate = parseInt(Math.exp(minLogChangeRate + scale * (changeRatePosition - minPosition)));
    return changeRate;
}

/**
 * @param {PlayerBoard} myBoard 自分の盤を表すインスタンス．
 */
function tick(myBoard) {
    // モデルの更新・描画を行う．
    myBoard.IsingSystem.updateStateByMetropolis();
    myBoard.drawCurrentIsingState();

    // パラメータの変更を動的に受け付ける．
    const temperature = calcTemperatureFromInputPosition();
    const changeRate = calcChangeRateFromInputPosition();
    myBoard.IsingSystem.parameter.updateTemperature(temperature);
    myBoard.IsingSystem.parameter.updateChangeRate(changeRate);

    // パラメータの値をwebページに反映する．
    document.getElementById("current-temperature").innerText = myBoard.IsingSystem.parameter.temperature;
    document.getElementById("current-change-rate").innerText = myBoard.IsingSystem.parameter.changeRate;

    // 再帰的に更新・描画を行う．
    requestAnimationFrame(function () { tick(myBoard); });
};


/**
 * 本ファイル実行開始時に呼び出され，各変数を初期化する．
 */
let init = function () {
    // Player用インスタンスを作成する．
    let isingCanvasElement = document.getElementById("ising-canvas");
    let isingModelXSize = 100;
    let isingModelYSize = 100;
    let myBoard = new PlayerBoard(isingCanvasElement, isingModelXSize, isingModelYSize);

    // 画面への描画・更新を開始する．
    requestAnimationFrame(function () { tick(myBoard); });
};
window.onload = init;
