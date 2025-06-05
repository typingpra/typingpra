// typing.js - タイピングのコア機能

const Typing = {
	// キャッシュ用変数
	cachedTargets: [],
	currentHighlightIndex: -1,
	updatePending: false,

	// 2バイト文字（マルチバイト文字）の判定
	isMultiByteChar(char) {
		// ASCII文字以外を2バイト文字として判定
		// 日本語（ひらがな、カタカナ、漢字）、中国語、韓国語等を含む
		return /[^\x00-\x7F]/.test(char);
	},

	// 現在のモードがTypeWellモードかどうかを判定
	isTypeWellMode() {
		if (DOM.langSel.value === "typewell") {
			return true;
		}

		// カスタムコードでTypeWellモードが選択されている場合
		if (DOM.langSel.value === "custom") {
			return CustomCode.getSelectedCustomMode() === "typewell";
		}

		// 保存されたカスタムコードでTypeWellモードの場合
		const codes = Storage.getSavedCodes();
		if (codes[DOM.langSel.value]) {
			return CustomCode.getCustomCodeMode(DOM.langSel.value) === "typewell";
		}

		return false;
	},

	// ページの準備
	preparePages() {
		APP_STATE.allLines = Utils.getCurrentCode().split("\n");
		APP_STATE.pages = [];

		let currentPage = [];
		let nonEmptyLineCount = 0;
		let currentPageCharCount = 0;

		// ページを確定してリセットするヘルパー関数
		const finalizePage = () => {
			if (currentPage.length > 0) {
				APP_STATE.pages.push(currentPage);
			}
			currentPage = [];
			nonEmptyLineCount = 0;
			currentPageCharCount = 0;
		};

		APP_STATE.allLines.forEach((line, idx) => {
			// 現在の行の文字数（改行文字を含む）
			const lineCharCount = line.length + CONSTANTS.NEWLINE_CHAR_COUNT;

			// 20行制限チェック：非空白行が制限に達した場合、ページを確定
			if (
				nonEmptyLineCount >= CONSTANTS.LINES_PER_PAGE &&
				currentPage.length > 0
			) {
				finalizePage();
			}

			// 現在の行をページに追加
			currentPage.push({ line, idx });
			currentPageCharCount += lineCharCount;

			// 非空白行の場合はカウントを増やす
			if (line.trim() !== "") {
				nonEmptyLineCount++;
			}

			// 文字数制限チェック：800文字以上に達した場合、ページを確定
			if (currentPageCharCount >= CONSTANTS.CHARS_PER_PAGE) {
				finalizePage();
			}
		});

		// 最後のページを確定
		finalizePage();

		// ページが存在しない場合は空のページを作成
		if (APP_STATE.pages.length === 0) {
			APP_STATE.pages = [[{ line: "", idx: 0 }]];
		}

		APP_STATE.currentPage = 0;
		this.updatePageSelect();
	},

	// ページ選択の更新
	updatePageSelect() {
		DOM.pageSelectEl.innerHTML = "";
		for (let i = 0; i < APP_STATE.pages.length; i++) {
			const option = document.createElement("option");
			option.value = i;
			option.textContent = i + 1;
			DOM.pageSelectEl.appendChild(option);
		}
		DOM.pageSelectEl.value = APP_STATE.currentPage;
	},

	// ページのレンダリング
	renderPage() {
		// TypeWellモード（オリジナル）でカウントダウン中はコードを表示しない
		if (
			DOM.langSel.value === "typewell" &&
			APP_STATE.typewellState === "countdown"
		) {
			return;
		}

		// ページが初期化されているかチェック
		if (
			!APP_STATE.pages ||
			APP_STATE.pages.length === 0 ||
			!APP_STATE.pages[APP_STATE.currentPage]
		) {
			console.warn("Pages not properly initialized, cannot render");
			return;
		}

		// TypeWellオリジナルモードの特別処理
		if (DOM.langSel.value === "typewell") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
			// タイプウェルモードの場合は待機状態に設定
			APP_STATE.typewellState = "waiting";
			this.showTypeWellStartScreen();
			return;
		} else {
			document.body.classList.remove("typewell-mode");
			document.body.classList.remove("typewell-original-mode");
			this.hideTypeWellScreens();
		}

		// カスタムコードでTypeWellモードが選択されている場合
		if (this.isTypeWellMode()) {
			document.body.classList.add("typewell-mode");
			// カスタムコードの場合はオリジナルモードクラスは追加しない
		} else {
			document.body.classList.remove("typewell-mode");
		}

		this.renderNormalPage();
	},

	// タイプウェルスタート画面の表示
	showTypeWellStartScreen() {
		if (DOM.typewellStartScreen) {
			DOM.typewellStartScreen.style.display = "flex";
			this.updateTypeWellModeDisplay();
		}
		if (DOM.typewellCountdown) {
			DOM.typewellCountdown.style.display = "none";
		}
		// 通常のコード表示を隠す
		if (DOM.codeEl) {
			DOM.codeEl.style.display = "none";
		}
	},

	// タイプウェルカウントダウンの表示
	showTypeWellCountdown() {
		if (DOM.typewellStartScreen) {
			DOM.typewellStartScreen.style.display = "none";
		}
		if (DOM.typewellCountdown) {
			DOM.typewellCountdown.style.display = "flex";
		}
		// 通常のコード表示を隠す
		if (DOM.codeEl) {
			DOM.codeEl.style.display = "none";
		}
	},

	// タイプウェル画面の非表示
	hideTypeWellScreens() {
		if (DOM.typewellStartScreen) {
			DOM.typewellStartScreen.style.display = "none";
		}
		if (DOM.typewellCountdown) {
			DOM.typewellCountdown.style.display = "none";
		}
		// 通常のコード表示を戻す
		if (DOM.codeEl) {
			DOM.codeEl.style.display = "block";
		}
	},

	// タイプウェルモード表示の更新
	updateTypeWellModeDisplay() {
		const modeDisplayEl = document.getElementById("typewell-current-mode");
		if (modeDisplayEl) {
			const mode = Utils.getSelectedTypeWellMode();
			switch (mode) {
				case "lowercase":
					modeDisplayEl.textContent = "Lowercase (a-z)";
					break;
				case "mixed":
					modeDisplayEl.textContent = "Mixed Case (a-z, A-Z)";
					break;
				case "symbols":
					modeDisplayEl.textContent = "With Symbols (a-z, A-Z, symbols)";
					break;
				default:
					modeDisplayEl.textContent = "Lowercase (a-z)";
			}
		}
	},

	// タイプウェルカウントダウンの開始
	startTypeWellCountdown() {
		APP_STATE.typewellState = "countdown";

		// ストレージからカウントダウン秒数を取得
		const countdownSeconds = Storage.getTypewellCountdown();

		// 0秒の場合は即座にタイピング開始
		if (countdownSeconds === 0) {
			this.startTypeWellTyping();
			return;
		}

		APP_STATE.countdownValue = countdownSeconds;
		this.showTypeWellCountdown();

		const countdownEl = document.querySelector(".typewell-countdown-number");

		const updateCountdown = () => {
			if (countdownEl) {
				countdownEl.textContent = APP_STATE.countdownValue;
			}

			APP_STATE.countdownValue--;

			if (APP_STATE.countdownValue < 0) {
				clearInterval(APP_STATE.countdownTimer);
				APP_STATE.countdownTimer = null;

				// タイマーを即時開始
				this.startTimer();

				// タイピング状態をアクティブに設定
				APP_STATE.isActive = true;

				// タイピング開始処理
				this.startTypeWellTyping();
			}
		};

		// 最初の表示
		updateCountdown();

		// 1秒間隔でカウントダウン
		APP_STATE.countdownTimer = setInterval(updateCountdown, 1000);
	},

	// タイプウェルタイピング開始
	startTypeWellTyping() {
		APP_STATE.typewellState = "typing";
		this.hideTypeWellScreens();

		// タイピング開始前にページをレンダリング
		this.renderNormalPage();

		// 入力フィールドにフォーカスを設定
		if (DOM.inputEl) {
			DOM.inputEl.focus();
		}
	},

	// タイプウェル開始ボタンのクリックハンドラー
	startTypeWellFromClick() {
		if (
			DOM.langSel.value === "typewell" &&
			APP_STATE.typewellState === "waiting"
		) {
			this.startTypeWellCountdown();
		}
	},

	// 通常ページのレンダリング
	renderNormalPage() {
		DOM.codeEl.innerHTML = "";
		const page = APP_STATE.pages[APP_STATE.currentPage].slice(
			0,
			CONSTANTS.MAX_DISPLAY_LINES,
		);

		page.forEach(({ line, idx }) => {
			const row = document.createElement("div");
			row.className = "line";

			// テキストラップが有効な場合はクラスを追加
			if (APP_STATE.isTextWrapEnabled) {
				row.classList.add("text-wrap");
			}

			// 行番号
			const num = document.createElement("span");
			num.className = "lineno";
			num.textContent = idx + 1;
			row.appendChild(num);

			// テキストラップ時は文字コンテンツを別コンテナに
			let charContainer = row;
			if (APP_STATE.isTextWrapEnabled) {
				charContainer = document.createElement("div");
				charContainer.className = "char-content";
				row.appendChild(charContainer);
			}

			// インデント処理
			const lead = line.match(/^\s*/)[0].length;
			for (let j = 0; j < lead; j++) {
				const span = document.createElement("span");

				// TypeWellモードでは行頭空白もタイピング対象とする
				if (this.isTypeWellMode()) {
					span.className = "char pending";
					span.dataset.char = " ";
				} else {
					span.className = "char indent";
					span.dataset.char = " ";
				}

				span.textContent = " ";
				charContainer.appendChild(span);
			}

			// 文字の追加
			for (let j = lead; j < line.length; j++) {
				const char = line[j];
				const span = document.createElement("span");

				// 2バイト文字の場合はスキップ対象として特別処理
				if (this.isMultiByteChar(char)) {
					span.className = "char multibyte-skip";
					// data-char属性を付けない = タイピング対象外
				} else {
					span.className = "char pending";
					span.dataset.char = char;
				}

				span.textContent = char;
				charContainer.appendChild(span);
			}

			// 改行マーカーの処理
			if (line.trim() !== "" || idx === APP_STATE.allLines.length - 1) {
				const nl = document.createElement("span");

				// TypeWellオリジナルモードでは改行も自動スキップ
				// カスタムコードのTypeWellモードでは改行をタイピング対象にする
				if (DOM.langSel.value === "typewell") {
					nl.className = "char multibyte-skip newline";
					// data-char属性を付けない = タイピング対象外
				} else {
					nl.className = "char pending newline";
					nl.dataset.char = "\n";
				}

				nl.textContent = "⏎";
				charContainer.appendChild(nl);
			}

			DOM.codeEl.appendChild(row);
		});

		// DOM要素をキャッシュ（パフォーマンス最適化）
		this.cacheTargets();

		APP_STATE.inputBuffer = "";
		this.highlightCurrent();

		// 進捗表示の初期化
		DOM.progressTextEl.textContent = `0/${this.cachedTargets.length}`;
	},

	// DOM要素をキャッシュしてパフォーマンス向上
	cacheTargets() {
		const spans = [...DOM.codeEl.querySelectorAll(".char")];

		if (this.isTypeWellMode()) {
			// TypeWellモードでは行頭空白もタイピング対象とする
			this.cachedTargets = spans.filter(
				(s) => !s.classList.contains("multibyte-skip"),
			);
		} else {
			// 通常モードでは従来通りインデントを除外
			this.cachedTargets = spans.filter(
				(s) =>
					!s.classList.contains("indent") &&
					!s.classList.contains("multibyte-skip"),
			);
		}

		this.currentHighlightIndex = -1;
	},

	// 状態のリセット
	resetState() {
		clearInterval(APP_STATE.timerInterval);
		clearInterval(APP_STATE.countdownTimer);
		APP_STATE.startTime = null;
		APP_STATE.countdownTimer = null;
		APP_STATE.countdownValue = 0;
		DOM.timerEl.textContent = "0s";
		DOM.wpmEl.textContent = "WPM: 0";
		DOM.accEl.textContent = "Accuracy: 100%";
		DOM.progressEl.style.width = "0";
		DOM.progressTextEl.textContent = "0/0";
		APP_STATE.inputBuffer = "";
		APP_STATE.totalKeystrokes = 0;
		APP_STATE.errorCount = 0;
		APP_STATE.correctCharacters = 0;
		APP_STATE.maxCorrectPosition = 0;
		APP_STATE.currentMistakes = [];
		APP_STATE.currentLineCharCount = 0; // 休憩機能：行文字数リセット
		APP_STATE.isBreakActive = false; // 休憩機能：休憩状態リセット

		// タイプウェル状態のリセット
		if (DOM.langSel.value === "typewell") {
			APP_STATE.typewellState = "waiting";
		}

		this.currentHighlightIndex = -1;
	},

	// タイマーの開始
	startTimer() {
		APP_STATE.startTime = Date.now();
		APP_STATE.timerInterval = setInterval(() => {
			const secs = Math.floor((Date.now() - APP_STATE.startTime) / 1000);
			DOM.timerEl.textContent = `${secs}s`;
			this.updateStats();
		}, 1000);
	},

	// 効率的な現在位置のハイライト
	highlightCurrent() {
		const newIndex = APP_STATE.inputBuffer.length;

		// 前回と同じ位置なら何もしない
		if (this.currentHighlightIndex === newIndex) return;

		// 前回のハイライトを削除
		if (
			this.currentHighlightIndex >= 0 &&
			this.cachedTargets[this.currentHighlightIndex]
		) {
			this.cachedTargets[this.currentHighlightIndex].classList.remove(
				"current",
			);
		}

		// 新しい位置をハイライト
		if (newIndex < this.cachedTargets.length && this.cachedTargets[newIndex]) {
			this.cachedTargets[newIndex].classList.add("current");
		}

		this.currentHighlightIndex = newIndex;
	},

	// 効率的な表示更新
	updateDisplay() {
		if (this.updatePending) return;

		this.updatePending = true;
		requestAnimationFrame(() => {
			this.performUpdate();
			this.updatePending = false;
		});
	},

	// 実際の更新処理
	performUpdate() {
		let correctCount = 0;
		let currentCorrectPosition = 0;

		// 変更が必要な範囲のみ更新
		const inputLength = APP_STATE.inputBuffer.length;
		const targets = this.cachedTargets;

		for (
			let i = 0;
			i < Math.max(inputLength + 1, this.lastUpdateLength || 0);
			i++
		) {
			const span = targets[i];
			if (!span) break;

			if (i < inputLength) {
				const expectedChar = span.dataset.char;
				const typedChar = APP_STATE.inputBuffer[i];

				if (typedChar === expectedChar) {
					span.className = `char correct${span.classList.contains("newline") ? " newline" : ""}`;
					correctCount++;
					if (currentCorrectPosition === i) {
						currentCorrectPosition = i + 1;
					}
				} else {
					span.className = `char incorrect${span.classList.contains("newline") ? " newline" : ""}`;

					// 空白や改行の誤入力を視覚化
					if (expectedChar === " " || expectedChar === "\n") {
						if (typedChar === " ") {
							span.textContent = "␣";
						} else if (typedChar === "\n") {
							span.textContent = "↵";
						} else if (typedChar === "\t") {
							span.textContent = "→";
						} else {
							span.textContent = typedChar;
						}
					}
				}
			} else if (i === inputLength || i < (this.lastUpdateLength || 0)) {
				span.className = `char pending${span.classList.contains("newline") ? " newline" : ""}`;
				// 元のテキストに戻す
				if (span.dataset.char === "\n") {
					span.textContent = "⏎";
				} else {
					span.textContent = span.dataset.char;
				}
			}
		}

		this.lastUpdateLength = inputLength;

		// WPMカウント用の正しい文字数を更新
		if (currentCorrectPosition > APP_STATE.maxCorrectPosition) {
			const newCharacters =
				currentCorrectPosition - APP_STATE.maxCorrectPosition;
			APP_STATE.correctCharacters += newCharacters;
			APP_STATE.maxCorrectPosition = currentCorrectPosition;
		}

		this.highlightCurrent();
		this.updateStats(correctCount, targets.length);

		// 完了チェック
		if (inputLength >= targets.length && correctCount === targets.length) {
			UI.showOverlay(correctCount, targets.length);
		}
	},

	// 統計の更新
	updateStats(correctCount = null, total = null) {
		if (!APP_STATE.startTime) return;

		if (correctCount === null || total === null) {
			const targets = this.cachedTargets;
			total = targets.length;

			correctCount = 0;
			for (
				let i = 0;
				i < Math.min(APP_STATE.inputBuffer.length, targets.length);
				i++
			) {
				if (APP_STATE.inputBuffer[i] === targets[i]?.dataset.char) {
					correctCount++;
				} else {
					break;
				}
			}
		}

		const elapsed = (Date.now() - APP_STATE.startTime) / 60000 || 1 / 60;

		// WPMは分間文字数として計算（正しく入力された文字数のみ）
		const wpm = Math.round(APP_STATE.correctCharacters / elapsed);
		DOM.wpmEl.textContent = `WPM: ${wpm}`;

		// 正確性の計算
		const accuracy =
			APP_STATE.totalKeystrokes > 0
				? Math.round(
						((APP_STATE.totalKeystrokes - APP_STATE.errorCount) /
							APP_STATE.totalKeystrokes) *
							100,
					)
				: 100;
		DOM.accEl.textContent = `Accuracy: ${accuracy}%`;

		// 進捗表示
		DOM.progressTextEl.textContent = `${correctCount}/${total}`;
		DOM.progressEl.style.width = `${(correctCount / total) * 100}%`;
	},

	// 休憩判定と休憩ダイアログ表示
	checkAndShowBreak() {
		const breakChars = Storage.getBreakChars();

		// 休憩設定が0以下の場合は無効
		if (breakChars <= 0) {
			return false;
		}

		// 現在の行文字数が設定値以上なら休憩を表示
		if (APP_STATE.currentLineCharCount >= breakChars) {
			this.showBreakDialog();
			return true;
		}

		return false;
	},

	// 休憩ダイアログの表示
	showBreakDialog() {
		APP_STATE.isBreakActive = true;

		// タイマーを一時停止
		if (APP_STATE.timerInterval) {
			clearInterval(APP_STATE.timerInterval);
			APP_STATE.timerInterval = null;
		}

		// 現在の統計情報を取得して表示
		this.updateBreakStats();

		// 休憩ダイアログを表示
		if (DOM.breakDialog) {
			DOM.breakDialog.style.display = "flex";
		}
	},

	// 休憩ダイアログの統計情報更新
	updateBreakStats() {
		if (!APP_STATE.startTime) return;

		// 現在のWPMを取得
		const elapsed = (Date.now() - APP_STATE.startTime) / 60000 || 1 / 60;
		const wpm = Math.round(APP_STATE.correctCharacters / elapsed);

		// 現在の経過時間を取得
		const seconds = Math.floor((Date.now() - APP_STATE.startTime) / 1000);

		// 現在の正確な文字数を取得
		const characters = APP_STATE.correctCharacters;

		// DOM要素に表示
		const breakWpmEl = document.getElementById("break-wpm");
		const breakTimeEl = document.getElementById("break-time");
		const breakCharsEl = document.getElementById("break-chars");

		if (breakWpmEl) breakWpmEl.textContent = wpm;
		if (breakTimeEl) breakTimeEl.textContent = `${seconds}s`;
		if (breakCharsEl) breakCharsEl.textContent = characters;
	},

	// 休憩ダイアログの非表示と再開
	hideBreakDialog() {
		APP_STATE.isBreakActive = false;
		APP_STATE.currentLineCharCount = 0; // 行文字数をリセット

		// 休憩ダイアログを非表示
		if (DOM.breakDialog) {
			DOM.breakDialog.style.display = "none";
		}

		// タイマーを再開
		if (APP_STATE.startTime && !APP_STATE.timerInterval) {
			APP_STATE.timerInterval = setInterval(() => {
				const secs = Math.floor((Date.now() - APP_STATE.startTime) / 1000);
				DOM.timerEl.textContent = `${secs}s`;
				this.updateStats();
			}, 1000);
		}
	},

	// ページ移動
	goToPage(pageIndex) {
		if (pageIndex >= 0 && pageIndex < APP_STATE.pages.length) {
			APP_STATE.currentPage = pageIndex;
			this.resetState();
			this.renderPage();
			this.updatePageSelect();
		}
	},

	// 次のページへ
	nextPage() {
		if (DOM.overlay.style.visibility === "visible") {
			UI.hideOverlay(() => {
				if (DOM.langSel.value === "typewell") {
					// TypeWellオリジナルモードでは常に新しいランダムコードを生成
					this.preparePages();
					this.resetState();
					this.renderPage();
				} else if (APP_STATE.currentPage < APP_STATE.pages.length - 1) {
					APP_STATE.currentPage++;
					this.resetState();
					this.renderPage();
					this.updatePageSelect();
				} else {
					this.restartAll();
				}
			});
		}
	},

	// 現在のページをリトライ
	retry() {
		if (DOM.overlay.style.visibility === "visible") {
			UI.hideOverlay(() => {
				if (DOM.langSel.value === "typewell") {
					// TypeWellオリジナルモードでは新しいランダムコードを生成
					this.preparePages();
					this.resetState();
					this.renderPage();
				} else {
					this.resetState();
					this.renderPage();
				}
			});
		} else {
			if (DOM.langSel.value === "typewell") {
				// TypeWellオリジナルモードでは新しいランダムコードを生成
				this.preparePages();
				this.resetState();
				this.renderPage();
			} else {
				this.resetState();
				this.renderPage();
			}
		}
	},

	// 全体をリスタート
	restartAll() {
		if (DOM.overlay.style.visibility === "visible") {
			UI.hideOverlay(() => {
				if (DOM.langSel.value === "typewell") {
					// TypeWellオリジナルモードでは新しいランダムコードを生成
					this.preparePages();
					this.resetState();
					this.renderPage();
				} else {
					APP_STATE.currentPage = 0;
					this.resetState();
					this.renderPage();
					this.updatePageSelect();
				}
			});
		} else {
			if (DOM.langSel.value === "typewell") {
				// TypeWellオリジナルモードでは新しいランダムコードを生成
				this.preparePages();
				this.resetState();
				this.renderPage();
			} else {
				APP_STATE.currentPage = 0;
				this.resetState();
				this.renderPage();
				this.updatePageSelect();
			}
		}
	},

	// キー入力の処理
	handleKeyPress(key) {
		// 休憩中の場合は入力を無視
		if (APP_STATE.isBreakActive) {
			return;
		}

		// タイプウェルオリジナルモードでスタート待機中の場合
		if (
			DOM.langSel.value === "typewell" &&
			APP_STATE.typewellState === "waiting"
		) {
			if (key === "Enter" || key === " ") {
				// スペースキー対応を追加
				this.startTypeWellCountdown();
			}
			return;
		}

		// タイプウェルオリジナルモードでカウントダウン中の場合は入力を無視
		if (
			DOM.langSel.value === "typewell" &&
			APP_STATE.typewellState === "countdown"
		) {
			return;
		}

		const ch = key === "Enter" ? "\n" : key;
		const expectedChar =
			this.cachedTargets[APP_STATE.inputBuffer.length]?.dataset.char;

		// 最後の文字を超えて入力しようとした場合は無視
		if (APP_STATE.inputBuffer.length >= this.cachedTargets.length) {
			return;
		}

		// TypeWellモードの特別処理
		if (this.isTypeWellMode()) {
			// キーストローク数をカウント
			APP_STATE.totalKeystrokes++;

			// 期待される文字と一致するかチェック
			if (expectedChar && ch === expectedChar) {
				// 正しい文字の場合：前回のミスタイプ表示をクリア
				const currentSpan = this.cachedTargets[APP_STATE.inputBuffer.length];
				if (currentSpan && currentSpan.classList.contains("incorrect")) {
					// 元の状態に戻す
					currentSpan.className = `char pending${currentSpan.classList.contains("newline") ? " newline" : ""}`;
					if (currentSpan.dataset.char === "\n") {
						currentSpan.textContent = "⏎";
					} else {
						currentSpan.textContent = currentSpan.dataset.char;
					}
				}

				// 正しい文字の場合のみ進む
				APP_STATE.inputBuffer += ch;

				// 改行以外の文字は行文字数をカウント
				if (ch !== "\n") {
					APP_STATE.currentLineCharCount++;
				}

				// 正しい改行の場合のみ休憩判定
				if (ch === "\n" && expectedChar === "\n") {
					this.checkAndShowBreak();
				}
			} else {
				// ミスタイプの場合
				if (expectedChar) {
					APP_STATE.errorCount++;
					// 苦手文字として記録
					Storage.recordMistakeChar(expectedChar);
					// 現在のセッションのミス文字も記録
					if (!APP_STATE.currentMistakes) {
						APP_STATE.currentMistakes = [];
					}
					APP_STATE.currentMistakes.push(expectedChar);

					// 現在の文字を赤く表示
					const currentSpan = this.cachedTargets[APP_STATE.inputBuffer.length];
					if (currentSpan) {
						currentSpan.className = `char incorrect${currentSpan.classList.contains("newline") ? " newline" : ""}`;

						// 空白や改行の誤入力を視覚化
						if (expectedChar === " " || expectedChar === "\n") {
							if (ch === " ") {
								currentSpan.textContent = "␣";
							} else if (ch === "\n") {
								currentSpan.textContent = "↵";
							} else if (ch === "\t") {
								currentSpan.textContent = "→";
							} else {
								currentSpan.textContent = ch;
							}
						}
					}
				}
				// ミスタイプ時はinputBufferを進めない（その場で停止）
				return;
			}
		} else {
			// 通常モード（従来の処理）
			// キーストローク数をカウント
			APP_STATE.totalKeystrokes++;

			// ミスタイプかどうかチェック
			if (expectedChar && ch !== expectedChar) {
				APP_STATE.errorCount++;

				// 苦手文字として記録
				Storage.recordMistakeChar(expectedChar);

				// 現在のセッションのミス文字も記録
				if (!APP_STATE.currentMistakes) {
					APP_STATE.currentMistakes = [];
				}
				APP_STATE.currentMistakes.push(expectedChar);
			}

			// 改行の場合の特別処理
			if (ch === "\n") {
				// 正しい改行の場合のみ休憩判定を実行
				if (expectedChar === "\n") {
					this.checkAndShowBreak();
				}
			} else {
				// 改行以外の文字は行文字数をカウント
				APP_STATE.currentLineCharCount++;
			}

			APP_STATE.inputBuffer += ch;
		}

		this.updateDisplay();
	},

	// バックスペースの処理
	handleBackspace() {
		// 休憩中の場合は入力を無視
		if (APP_STATE.isBreakActive) {
			return;
		}

		// TypeWellモードではバックスペース無効
		if (this.isTypeWellMode()) {
			return;
		}

		if (APP_STATE.inputBuffer.length > 0) {
			const lastChar = APP_STATE.inputBuffer[APP_STATE.inputBuffer.length - 1];

			// バックスペースで削除された文字が改行以外の場合、行文字数を減らす
			if (lastChar !== "\n" && APP_STATE.currentLineCharCount > 0) {
				APP_STATE.currentLineCharCount--;
			}

			APP_STATE.inputBuffer = APP_STATE.inputBuffer.slice(0, -1);
			this.updateDisplay();
		}
	},
};
