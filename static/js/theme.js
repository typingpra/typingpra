// theme.js - テーマ関連の機能

const Theme = {
	// 元の値を保存するためのプロパティ
	originalTypewellCountdown: null,

	// テーマの初期化
	initialize() {
		const savedTheme = Storage.getTheme();
		if (savedTheme === "light") {
			this.setLight();
		} else {
			this.setDark();
		}

		// テキストラップ設定の初期化
		const savedTextWrap = Storage.getTextWrap();
		if (savedTextWrap) {
			this.enableTextWrap();
		} else {
			this.disableTextWrap();
		}

		// 休憩設定の初期化
		this.initializeBreakSettings();
	},

	// ダークモードの設定
	setDark() {
		APP_STATE.isDarkMode = true;
		document.body.removeAttribute("data-theme");
		DOM.themeToggleBtn.classList.remove("active");
		DOM.darkLabel.classList.add("active");
		DOM.lightLabel.classList.remove("active");
		Storage.saveTheme(null); // ダークモードの場合は削除
	},

	// ライトモードの設定
	setLight() {
		APP_STATE.isDarkMode = false;
		document.body.setAttribute("data-theme", "light");
		DOM.themeToggleBtn.classList.add("active");
		DOM.darkLabel.classList.remove("active");
		DOM.lightLabel.classList.add("active");
		Storage.saveTheme("light");
	},

	// テーマの切り替え
	toggle() {
		if (APP_STATE.isDarkMode) {
			this.setLight();
		} else {
			this.setDark();
		}
	},

	// テキストラップの有効化
	enableTextWrap() {
		APP_STATE.isTextWrapEnabled = true;
		DOM.textWrapToggleBtn.classList.add("active");
		DOM.wrapDisabledLabel.classList.remove("active");
		DOM.wrapEnabledLabel.classList.add("active");
		Storage.saveTextWrap(true);

		// ページを再レンダリングして構造を更新
		this.updateTextWrapDisplay();
	},

	// テキストラップの無効化
	disableTextWrap() {
		APP_STATE.isTextWrapEnabled = false;
		DOM.textWrapToggleBtn.classList.remove("active");
		DOM.wrapDisabledLabel.classList.add("active");
		DOM.wrapEnabledLabel.classList.remove("active");
		Storage.saveTextWrap(false);

		// ページを再レンダリングして構造を更新
		this.updateTextWrapDisplay();
	},

	// テキストラップの切り替え
	toggleTextWrap() {
		if (APP_STATE.isTextWrapEnabled) {
			this.disableTextWrap();
		} else {
			this.enableTextWrap();
		}
	},

	// テキストラップ表示の更新
	updateTextWrapDisplay() {
		// ページが初期化されているかチェック
		if (!APP_STATE.pages || APP_STATE.pages.length === 0) {
			console.warn("Pages not initialized yet, skipping text wrap update");
			return;
		}

		// Initial Speedモードでは何もしない
		if (Typing.isInitialSpeedMode()) {
			return;
		}

		// ページを再レンダリングして構造を完全に更新
		if (typeof Typing !== "undefined" && Typing.renderPage) {
			Typing.renderPage();
		}
	},

	// 休憩設定の初期化
	initializeBreakSettings() {
		const savedBreakChars = Storage.getBreakChars();
		if (DOM.breakCharsInput) {
			DOM.breakCharsInput.value = savedBreakChars;
		}
	},

	// タイプウェルカウントダウン設定の初期化
	initializeTypewellCountdown() {
		// 保存された値を取得（デフォルト値は定数から）
		const savedCountdown = Storage.getTypewellCountdown();

		// DOM要素が存在する場合のみ値を設定
		if (DOM.typewellCountdownInput) {
			DOM.typewellCountdownInput.value = savedCountdown;
			// 元の値として保存（確実に数値を保存）
			this.originalTypewellCountdown = savedCountdown;
			// ボーダー色をリセット
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
		}
	},

	// 休憩設定の保存
	saveBreakSettings() {
		if (!DOM.breakCharsInput) return;

		const value = parseInt(DOM.breakCharsInput.value, 10);

		// 入力値の検証
		if (isNaN(value)) {
			alert("Please enter a valid number.");
			DOM.breakCharsInput.value = Storage.getBreakChars(); // 元の値に戻す
			return false;
		}

		if (value < 0) {
			alert("Value cannot be negative. Use 0 to disable breaks.");
			DOM.breakCharsInput.value = 0;
			return false;
		}

		if (value > CONSTANTS.BREAK_SETTINGS.MAX_CHARS) {
			alert(
				`Maximum value is ${CONSTANTS.BREAK_SETTINGS.MAX_CHARS} characters.`,
			);
			DOM.breakCharsInput.value = CONSTANTS.BREAK_SETTINGS.MAX_CHARS;
			return false;
		}

		// 保存実行
		const success = Storage.saveBreakChars(value);
		if (success) {
			return true;
		} else {
			alert("Failed to save break settings.");
			return false;
		}
	},

	// 休憩設定入力フィールドの変更処理
	handleBreakCharsChange() {
		// リアルタイムでの値検証とUIフィードバック
		if (!DOM.breakCharsInput) return;

		const value = parseInt(DOM.breakCharsInput.value, 10);

		if (isNaN(value) || value < 0) {
			DOM.breakCharsInput.style.borderColor = "var(--incorrect-color)";
		} else if (value > CONSTANTS.BREAK_SETTINGS.MAX_CHARS) {
			DOM.breakCharsInput.style.borderColor = "var(--incorrect-color)";
		} else {
			DOM.breakCharsInput.style.borderColor = "var(--border-color)";
		}
	},

	// TypeWellカウントダウン設定入力フィールドの変更処理（改善版）
	handleTypewellCountdownChange() {
		// リアルタイムでの値検証とUIフィードバック
		if (!DOM.typewellCountdownInput) return;

		const inputValue = DOM.typewellCountdownInput.value.trim();
		const value = parseInt(inputValue, 10);

		// 空文字列は有効とする（デフォルト値で保存される）
		if (inputValue === "") {
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
		} else if (isNaN(value) || inputValue !== value.toString()) {
			// 数値以外の文字が含まれている場合
			DOM.typewellCountdownInput.style.borderColor = "var(--incorrect-color)";
		} else if (
			value < CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN ||
			value > CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN
		) {
			// 範囲外の値の場合
			DOM.typewellCountdownInput.style.borderColor = "var(--incorrect-color)";
		} else {
			// 有効な値の場合
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
		}
	},

	// TypeWellカウントダウン入力のblur時検証（改善版）
	validateTypewellCountdownInput() {
		// blur時は自動復元を行わず、ボーダー色の更新のみ行う
		// 実際のエラーチェックと復元は設定を閉じる時に実行
		if (!DOM.typewellCountdownInput) return;

		const inputValue = DOM.typewellCountdownInput.value.trim();
		const value = parseInt(inputValue, 10);

		// 不正な値の場合はボーダー色を赤にするだけ（復元はしない）
		if (
			inputValue === "" ||
			isNaN(value) ||
			inputValue !== value.toString() ||
			value < CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN ||
			value > CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN
		) {
			DOM.typewellCountdownInput.style.borderColor = "var(--incorrect-color)";
		} else {
			// 有効な値の場合はボーダー色をリセット
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
		}
	},

	// 設定パネルの表示
	openSettings() {
		// 設定パネルを開く前にTypeWellカウントダウン設定を初期化
		this.initializeTypewellCountdown();

		// 既存の処理（設定パネル表示）
		DOM.settingsPanel.style.display = "flex";
	},

	// 設定パネルの非表示
	closeSettings() {
		// 休憩設定を検証・保存
		if (DOM.breakCharsInput) {
			this.saveBreakSettings();
		}

		// タイプウェルカウントダウン設定を検証・保存
		// 確実に実行されるよう独立して処理
		this.saveTypewellCountdown();

		// 設定パネルを閉じる
		DOM.settingsPanel.style.display = "none";
	},

	// タイプウェルカウントダウン設定の保存（改善版）
	saveTypewellCountdown() {
		if (!DOM.typewellCountdownInput) {
			return true;
		}

		const inputValue = DOM.typewellCountdownInput.value.trim();

		// 空の入力値の場合はデフォルト値を使用
		if (inputValue === "") {
			const defaultValue = CONSTANTS.TYPEWELL_SETTINGS.DEFAULT_COUNTDOWN;
			DOM.typewellCountdownInput.value = defaultValue;
			this.originalTypewellCountdown = defaultValue;
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
			return Storage.saveTypewellCountdown(defaultValue);
		}

		const value = parseInt(inputValue, 10);

		// より厳密な検証条件
		const isNotInteger = isNaN(value);
		const hasNonNumericChars = !/^\d+$/.test(inputValue); // 正の整数のみ許可
		const isNotExactMatch = inputValue !== value.toString();
		const isOutOfRange =
			value < CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN ||
			value > CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN;

		// 入力値検証：より厳密な条件
		if (isNotInteger || hasNonNumericChars || isNotExactMatch || isOutOfRange) {
			// より詳細なエラーメッセージ
			let errorMessage = "Invalid input for TypeWell Countdown.\n\n";

			if (hasNonNumericChars || isNotInteger) {
				errorMessage += "Please enter a valid whole number.\n";
			}

			if (isOutOfRange && !isNotInteger) {
				errorMessage += `Value must be between ${CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN} and ${CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN} seconds.\n`;
			}

			errorMessage += "\nThe setting has been reset to the previous value.";

			// エラーダイアログを表示
			alert(errorMessage);

			// 元の値に復元
			const restoreValue =
				this.originalTypewellCountdown !== null
					? this.originalTypewellCountdown
					: CONSTANTS.TYPEWELL_SETTINGS.DEFAULT_COUNTDOWN;

			DOM.typewellCountdownInput.value = restoreValue;
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";

			return false;
		}

		// 有効な値の場合：保存実行
		const success = Storage.saveTypewellCountdown(value);
		if (success) {
			this.originalTypewellCountdown = value;
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
			return true;
		} else {
			alert(
				"Failed to save TypeWell Countdown settings.\n\nThe value has been reset to the previous setting.",
			);
			const restoreValue =
				this.originalTypewellCountdown !== null
					? this.originalTypewellCountdown
					: CONSTANTS.TYPEWELL_SETTINGS.DEFAULT_COUNTDOWN;
			DOM.typewellCountdownInput.value = restoreValue;
			DOM.typewellCountdownInput.style.borderColor = "var(--border-color)";
			return false;
		}
	},
};
