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
		} else if (DOM.langSel.value === "typewell-english-words") {
			return this.generateEnglishWordsCode();
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

	// English Words用コード生成（8行×50文字）
	generateEnglishWordsCode() {
		const CHARS_PER_LINE = 50;
		const TOTAL_LINES = 8;
		
		// 選択された単語セットを取得
		const selectedSet = this.getSelectedTypeWellEnglishWordsSet();
		
		// words.jsからWORD_SETSを使用（実際のNGSLデータ）
		if (typeof WORD_SETS === 'undefined') {
			console.error('WORD_SETS not found. Make sure words.js is loaded.');
			return "Error: Word data not available";
		}

		// 選択されたセットの単語を取得
		const words = WORD_SETS[selectedSet]?.words || WORD_SETS.top500?.words || [];

		// ランダム生成器の初期化
		this._seedXorshift128();

		// Fisher-Yatesシャッフルで単語プールを作成（重複制御）
		const shuffledWords = [...words]; // コピーを作成
		for (let i = shuffledWords.length - 1; i > 0; i--) {
			const j = Math.floor(this._xorshift128() * (i + 1));
			[shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
		}
		
		let wordIndex = 0; // シャッフルされた単語プールのインデックス
		
		// 単語選択関数（重複制御付き）
		const getNextWord = () => {
			if (wordIndex >= shuffledWords.length) {
				// プール枯渇時は再シャッフル
				for (let i = shuffledWords.length - 1; i > 0; i--) {
					const j = Math.floor(this._xorshift128() * (i + 1));
					[shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
				}
				wordIndex = 0;
			}
			return shuffledWords[wordIndex++];
		};

		let result = "";
		let pendingWordRemainder = ""; // 前の行から継続する単語の残り部分
		let pendingSpaceNeeded = false; // 次の行の最初にスペースが必要かどうか

		for (let line = 0; line < TOTAL_LINES; line++) {
			let lineContent = "";
			let currentLineLength = 0;

			// 前の行からスペースが必要な場合、行の最初にスペースを追加
			if (pendingSpaceNeeded && currentLineLength < CHARS_PER_LINE) {
				lineContent += " ";
				currentLineLength++;
				pendingSpaceNeeded = false;
			}

			// 前の行から継続する単語の残り部分がある場合、それから開始
			if (pendingWordRemainder) {
				const remainderLength = Math.min(pendingWordRemainder.length, CHARS_PER_LINE - currentLineLength);
				lineContent += pendingWordRemainder.substring(0, remainderLength);
				currentLineLength += remainderLength;
				
				// 残り部分が行に収まった場合
				if (pendingWordRemainder.length <= (CHARS_PER_LINE - currentLineLength + remainderLength)) {
					pendingWordRemainder = "";
					// 単語完了後はスペースを追加（行に余裕があれば）
					if (currentLineLength < CHARS_PER_LINE) {
						lineContent += " ";
						currentLineLength++;
					}
				} else {
					// 残り部分が行に収まらない場合、次の行に継続
					pendingWordRemainder = pendingWordRemainder.substring(remainderLength);
				}
			}

			// 行に余裕がある間、新しい単語を追加
			while (currentLineLength < CHARS_PER_LINE && !pendingWordRemainder) {
				// シャッフルされたプールから単語を選択
				const word = getNextWord();
				
				// 単語 + スペースの長さを計算
				const wordWithSpace = word + " ";
				const wordLength = wordWithSpace.length;

				// 最終行（8行目）では50文字で強制終了
				if (line === TOTAL_LINES - 1) {
					const remainingChars = CHARS_PER_LINE - currentLineLength;
					if (remainingChars <= 0) break;
					
					if (wordLength <= remainingChars) {
						// 単語全体が入る場合
						lineContent += wordWithSpace;
						currentLineLength += wordLength;
					} else {
						// 単語の一部のみ追加して終了
						lineContent += word.substring(0, remainingChars);
						currentLineLength = CHARS_PER_LINE;
					}
				} else {
					// 通常の行での処理
					if (currentLineLength + wordLength <= CHARS_PER_LINE) {
						// 単語全体が行に入る場合
						lineContent += wordWithSpace;
						currentLineLength += wordLength;
					} else {
						// 単語が行を超える場合、分割して次の行に継続
						const remainingChars = CHARS_PER_LINE - currentLineLength;
						if (remainingChars > 0) {
							lineContent += word.substring(0, remainingChars);
							currentLineLength = CHARS_PER_LINE;
							pendingWordRemainder = word.substring(remainingChars);
							// 単語分割時は次の行でスペースが必要
							pendingSpaceNeeded = false; // 単語が継続する場合はスペース不要
						}
					}
				}
			}

			// 行の内容を正確に50文字にする
			lineContent = lineContent.substring(0, CHARS_PER_LINE);
			
			// 行末でのスペース必要判定を改善（単語が継続しない場合のみ）
			if (line < TOTAL_LINES - 1 && !pendingWordRemainder) {
				// 単語が次の行に継続しない場合のみ、スペース要否を判定
				const lastChar = lineContent[lineContent.length - 1];
				if (lastChar && lastChar !== " ") {
					// 最後の文字がスペース以外（単語）で完了している場合、次行でスペースが必要
					pendingSpaceNeeded = true;
				} else {
					// 最後の文字がスペースの場合、次行でスペースは不要
					pendingSpaceNeeded = false;
				}
			}

			result += lineContent;

			// 最後の行以外は改行を追加
			if (line < TOTAL_LINES - 1) {
				result += "\n";
			}
		}

		return result;
	},

	// 選択されたデフォルト言語モードを取得
	getSelectedDefaultMode() {
		// DOMが存在しない場合はデフォルトを返す
		if (typeof document === "undefined") {
			return "normal";
		}

		const normalRadio = document.getElementById("default-normal");
		const typewellRadio = document.getElementById("default-typewell");

		if (normalRadio && normalRadio.checked) return "normal";
		if (typewellRadio && typewellRadio.checked) return "typewell";

		// デフォルトは通常モード
		return "normal";
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

	// 選択されたTypeWell English Words単語セットを取得
	getSelectedTypeWellEnglishWordsSet() {
		// DOMが存在しない場合はデフォルトを返す
		if (typeof document === "undefined") {
			return "top500";
		}

		const top500Radio = document.getElementById("typewell-english-words-top500");
		const top1500Radio = document.getElementById("typewell-english-words-top1500");
		const allRadio = document.getElementById("typewell-english-words-all");

		if (top500Radio && top500Radio.checked) return "top500";
		if (top1500Radio && top1500Radio.checked) return "top1500";
		if (allRadio && allRadio.checked) return "all";

		// デフォルトはTOP500
		return "top500";
	},

	// 選択されたWord Practice単語セットを取得
	getSelectedWordPracticeSet() {
		// DOMが存在しない場合はデフォルトを返す
		if (typeof document === "undefined") {
			return "top500";
		}

		const top500Radio = document.getElementById("word-practice-top500");
		const top1500Radio = document.getElementById("word-practice-top1500");
		const allRadio = document.getElementById("word-practice-all");

		if (top500Radio && top500Radio.checked) return "top500";
		if (top1500Radio && top1500Radio.checked) return "top1500";
		if (allRadio && allRadio.checked) return "all";

		// デフォルトはTOP500
		return "top500";
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
		const leftHandRadio = document.getElementById("initial-speed-lefthand");
		const rightHandRadio = document.getElementById("initial-speed-righthand");

		if (lowercaseRadio && lowercaseRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LOWERCASE;
		if (numbersRadio && numbersRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.NUMBERS;
		if (leftHandRadio && leftHandRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LEFT_HAND;
		if (rightHandRadio && rightHandRadio.checked)
			return CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.RIGHT_HAND;

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
			case CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.LEFT_HAND:
				return "Left Hand";
			case CONSTANTS.INITIAL_SPEED_SETTINGS.MODES.RIGHT_HAND:
				return "Right Hand";
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

		// 最初からミスらなかった文字数をカウント（各試行で最初の入力が正解だった数）
		const totalTrials = Math.max(...results.map((r) => r.trial));
		let firstTryCorrectCount = 0;

		// 各試行について、最初の入力が正解だったかを判定
		for (let trial = 1; trial <= totalTrials; trial++) {
			const trialResults = results.filter((r) => r.trial === trial);
			if (trialResults.length > 0) {
				// 時間順にソートして最初の結果を取得
				const firstResult = trialResults.sort((a, b) => a.time - b.time)[0];
				if (firstResult.correct) {
					firstTryCorrectCount++;
				}
			}
		}

		const accuracy = Math.round((firstTryCorrectCount / totalTrials) * 100);

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
