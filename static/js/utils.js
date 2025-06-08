// utils.js - ユーティリティ関数

const Utils = {
	// タイムスタンプのフォーマット
	formatTimestamp(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleString("en-US", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	},

	// 時間のフォーマット（秒 → "Xm Ys" or "Xs"）
	formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return minutes > 0
			? `${minutes}m ${remainingSeconds}s`
			: `${remainingSeconds}s`;
	},

	// 反応時間のフォーマット（ミリ秒 → "X.XXXs"）
	formatReactionTime(milliseconds) {
		return `${(milliseconds / 1000).toFixed(3)}s`;
	},

	// 時間文字列のパース（"Xm Ys" → 秒）
	parseTime(timeStr) {
		const parts = timeStr.match(/(\d+)m\s*(\d+)s|(\d+)s/);
		if (parts) {
			if (parts[1] && parts[2]) {
				return parseInt(parts[1]) * 60 + parseInt(parts[2]);
			} else if (parts[3]) {
				return parseInt(parts[3]);
			}
		}
		return 0;
	},

	// 序数の接尾辞を取得（1st, 2nd, 3rd, 4th...）
	getOrdinalSuffix(num) {
		const j = num % 10;
		const k = num % 100;
		if (j === 1 && k !== 11) return "st";
		if (j === 2 && k !== 12) return "nd";
		if (j === 3 && k !== 13) return "rd";
		return "th";
	},

	// 現在のコードを取得
	getCurrentCode() {
		if (DOM.langSel.value === "custom") {
			return DOM.customCodeArea.value;
		} else if (DOM.langSel.value === "typewell") {
			return this.generateTypeWellCode();
		} else if (DOM.langSel.value === "initial-speed") {
			return ""; // Initial Speedは専用ロジックを使用
		} else if (SNIPPETS[DOM.langSel.value]) {
			return SNIPPETS[DOM.langSel.value];
		} else {
			// 保存されたカスタムコードの場合
			return CustomCode.getCustomCodeContent(DOM.langSel.value);
		}
	},

	// 高品質疑似ランダム生成器（Xorshift128）
	_xorshift128State: [123456789, 362436069, 521288629, 88675123],

	_xorshift128() {
		let t = this._xorshift128State[3];
		let s = this._xorshift128State[0];
		this._xorshift128State[3] = this._xorshift128State[2];
		this._xorshift128State[2] = this._xorshift128State[1];
		this._xorshift128State[1] = s;

		t ^= t << 11;
		t ^= t >>> 8;
		t ^= s ^ (s >>> 19);
		this._xorshift128State[0] = t;

		return (t >>> 0) / 0x100000000; // 0から1の範囲の数値を返す
	},

	// シード設定
	_seedXorshift128() {
		const seed = Date.now() + Math.random() * 1000000;
		this._xorshift128State[0] = seed & 0xffffffff;
		this._xorshift128State[1] = (seed >>> 16) & 0xffffffff;
		this._xorshift128State[2] = (seed >>> 8) & 0xffffffff;
		this._xorshift128State[3] = (seed >>> 24) & 0xffffffff;
		
		// 初期化のため数回実行
		for (let i = 0; i < 10; i++) {
			this._xorshift128();
		}
	},

	// TypeWellオリジナルモード - ランダム文字生成
	generateTypeWellCode() {
		const CHARS_PER_LINE = 36;
		const TOTAL_LINES = 10;

		// ランダム生成器の初期化
		this._seedXorshift128();

		// 選択されたモードを取得
		const selectedMode = this.getSelectedTypeWellMode();

		// モード別の文字セット定義
		let baseChars, punctuationChars, allChars;

		switch (selectedMode) {
			case "lowercase":
				// 小文字のみモード (a-z + 空白 + カンマ + ピリオド)
				baseChars = "abcdefghijklmnopqrstuvwxyz";
				punctuationChars = " .,";
				allChars = baseChars + punctuationChars;
				break;

			case "mixed":
				// 大小混合モード (a-z, A-Z + 空白 + カンマ + ピリオド)
				baseChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
				punctuationChars = " .,";
				allChars = baseChars + punctuationChars;
				break;

			case "symbols":
				// 記号混合モード (a-z, A-Z + 記号 + 空白)
				baseChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
				punctuationChars = " .,;:!?-()[]{}'\"@#$%&*+=/_<>|`~^\\";
				allChars = baseChars + punctuationChars;
				break;

			case "numbers":
				// 数字のみモード (0-9のみ)
				baseChars = "0123456789";
				punctuationChars = "";
				allChars = baseChars;
				break;

			default:
				// デフォルトは小文字のみ
				baseChars = "abcdefghijklmnopqrstuvwxyz";
				punctuationChars = " .,";
				allChars = baseChars + punctuationChars;
		}

		let result = "";

		for (let line = 0; line < TOTAL_LINES; line++) {
			let lineContent = "";

			for (let char = 0; char < CHARS_PER_LINE; char++) {
				// 高品質疑似ランダム生成器を使用
				const randomIndex = Math.floor(this._xorshift128() * allChars.length);
				lineContent += allChars[randomIndex];
			}

			result += lineContent;

			// 最後の行以外は改行を追加
			if (line < TOTAL_LINES - 1) {
				result += "\n";
			}
		}

		return result;
	},

	// 選択されたTypeWellモードを取得
	getSelectedTypeWellMode() {
		// DOMが存在しない場合はデフォルトを返す
		if (typeof document === "undefined") {
			return "lowercase";
		}

		const lowercaseRadio = document.getElementById("typewell-lowercase");
		const mixedRadio = document.getElementById("typewell-mixed");
		const symbolsRadio = document.getElementById("typewell-symbols");
		const numbersRadio = document.getElementById("typewell-numbers");

		if (lowercaseRadio && lowercaseRadio.checked) return "lowercase";
		if (mixedRadio && mixedRadio.checked) return "mixed";
		if (symbolsRadio && symbolsRadio.checked) return "symbols";
		if (numbersRadio && numbersRadio.checked) return "numbers";

		// デフォルトは小文字のみ
		return "lowercase";
	},

	// Initial Speed用のランダム文字生成
	generateInitialSpeedChar(mode = "lowercase") {
		const characterSet = CONSTANTS.INITIAL_SPEED_SETTINGS.CHARACTER_SETS[mode];
		if (!characterSet) {
			console.warn(`Unknown Initial Speed mode: ${mode}`);
			return "a";
		}

		// 高品質疑似ランダム生成器を使用
		const randomIndex = Math.floor(this._xorshift128() * characterSet.length);
		return characterSet[randomIndex];
	},

	// 選択されたInitial Speedモードを取得
	getSelectedInitialSpeedMode() {
		// DOMが存在しない場合はデフォルトを返す
		if (typeof document === "undefined") {
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LOWERCASE;
		}

		const lowercaseRadio = document.getElementById("initial-speed-lowercase");
		const numbersRadio = document.getElementById("initial-speed-numbers");

		if (lowercaseRadio && lowercaseRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LOWERCASE;
		if (numbersRadio && numbersRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.NUMBERS;

		// デフォルトは小文字+記号
		return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LOWERCASE;
	},

	// Initial Speedモード名を表示用文字列に変換
	getInitialSpeedModeDisplayName(mode) {
		switch (mode) {
			case CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LOWERCASE:
				return "Lowercase + Punctuation";
			case CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.NUMBERS:
				return "Numbers Only";
			default:
				return "Unknown Mode";
		}
	},

	// 選択されたInitial Speed試行回数を取得
	getSelectedInitialSpeedTrials() {
		if (typeof document === "undefined" || !DOM.initialSpeedTrialsSelect) {
			return CONSTANTS.INITIAL_SPEED_SETTINGS.DEFAULT_TRIALS;
		}

		const value = parseInt(DOM.initialSpeedTrialsSelect.value, 10);
		if (
			isNaN(value) ||
			value < CONSTANTS.INITIAL_SPEED_SETTINGS.MIN_TRIALS ||
			value > CONSTANTS.INITIAL_SPEED_SETTINGS.MAX_TRIALS
		) {
			return CONSTANTS.INITIAL_SPEED_SETTINGS.DEFAULT_TRIALS;
		}

		return value;
	},

	// Initial Speed統計計算
	calculateInitialSpeedStats(results) {
		if (!results || results.length === 0) {
			return {
				averageTime: 0,
				bestTime: 0,
				worstTime: 0,
				accuracy: 100,
				totalMistakes: 0,
			};
		}

		// 全結果から正解と不正解を分離
		const correctResults = results.filter((r) => r.correct);
		const incorrectResults = results.filter((r) => !r.correct);
		const totalMistakes = incorrectResults.length;

		// 正解がない場合
		if (correctResults.length === 0) {
			return {
				averageTime: 0,
				bestTime: 0,
				worstTime: 0,
				accuracy: 0,
				totalMistakes: totalMistakes,
			};
		}

		// 正解した試行の時間統計
		const correctTimes = correctResults.map((r) => r.time);
		const averageTime =
			correctTimes.reduce((sum, time) => sum + time, 0) / correctTimes.length;
		const bestTime = Math.min(...correctTimes);
		const worstTime = Math.max(...correctTimes);

		// 最終的な正解数をカウント（各試行で最終的に正解した数）
		const totalTrials = Math.max(...results.map((r) => r.trial));
		let finalCorrectCount = 0;

		// 各試行について、最終的に正解したかを判定
		for (let trial = 1; trial <= totalTrials; trial++) {
			const trialResults = results.filter((r) => r.trial === trial);
			const hasCorrect = trialResults.some((r) => r.correct);
			if (hasCorrect) {
				finalCorrectCount++;
			}
		}

		const accuracy = Math.round((finalCorrectCount / totalTrials) * 100);

		return {
			averageTime: Math.round(averageTime),
			bestTime: bestTime,
			worstTime: worstTime,
			accuracy: accuracy,
			totalMistakes: totalMistakes,
		};
	},

	// Initial Speedミス統計用のキー生成
	generateMistakeKey(expectedChar, inputChar) {
		// 特殊文字の表示名変換
		const getDisplayChar = (char) => {
			if (char === " ") return "Space";
			if (char === "\n") return "Enter";
			if (char === "\t") return "Tab";
			return char;
		};

		return `${getDisplayChar(expectedChar)}->${getDisplayChar(inputChar)}`;
	},
};
