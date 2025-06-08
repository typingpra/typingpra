// main.js - アプリケーションの初期化とイベントリスナーの設定

// イベントリスナーの設定
function setupEventListeners() {
	// 言語選択
	DOM.langSel.addEventListener("change", () => UI.handleLanguageChange());

	// カスタムコード関連
	DOM.toggleCustomBtn.addEventListener("click", () =>
		CustomCode.toggleContainer(),
	);
	DOM.customCodeArea.addEventListener("input", () =>
		UI.handleCustomCodeInput(),
	);
	DOM.saveCustomBtn.addEventListener("click", () => CustomCode.save());
	DOM.loadCustomBtn.addEventListener("click", () => CustomCode.load());
	DOM.deleteCustomBtn.addEventListener("click", () => CustomCode.delete());
	DOM.chooseFileBtn.addEventListener("click", () => CustomCode.chooseFile());
	DOM.fileInput.addEventListener("change", (e) =>
		CustomCode.handleFileSelect(e),
	);

	// カスタムモード選択関連
	if (DOM.customNormalRadio) {
		DOM.customNormalRadio.addEventListener("change", () =>
			UI.handleCustomModeChange(),
		);
	}
	if (DOM.customTypewellRadio) {
		DOM.customTypewellRadio.addEventListener("change", () =>
			UI.handleCustomModeChange(),
		);
	}

	// TypeWellモード選択関連
	if (DOM.typewellLowercaseRadio) {
		DOM.typewellLowercaseRadio.addEventListener("change", () =>
			UI.handleTypeWellModeChange(),
		);
	}
	if (DOM.typewellMixedRadio) {
		DOM.typewellMixedRadio.addEventListener("change", () =>
			UI.handleTypeWellModeChange(),
		);
	}
	if (DOM.typewellSymbolsRadio) {
		DOM.typewellSymbolsRadio.addEventListener("change", () =>
			UI.handleTypeWellModeChange(),
		);
	}
	if (DOM.typewellNumbersRadio) {
		DOM.typewellNumbersRadio.addEventListener("change", () =>
			UI.handleTypeWellModeChange(),
		);
	}

	// TypeWell開始ボタンのクリックイベント
	if (DOM.typewellStartButton) {
		DOM.typewellStartButton.addEventListener("click", () =>
			Typing.startTypeWellFromClick(),
		);
	}

	// Initial Speedモード選択関連
	if (DOM.initialSpeedLowercaseRadio) {
		DOM.initialSpeedLowercaseRadio.addEventListener("change", () =>
			UI.handleInitialSpeedModeChange(),
		);
	}
	if (DOM.initialSpeedNumbersRadio) {
		DOM.initialSpeedNumbersRadio.addEventListener("change", () =>
			UI.handleInitialSpeedModeChange(),
		);
	}

	// Initial Speed試行回数選択関連
	if (DOM.initialSpeedTrialsSelect) {
		DOM.initialSpeedTrialsSelect.addEventListener("change", () =>
			UI.handleInitialSpeedTrialsChange(),
		);
	}

	// Initial Speed開始ボタンのクリックイベント
	if (DOM.initialSpeedStartButton) {
		DOM.initialSpeedStartButton.addEventListener("click", () =>
			Typing.startInitialSpeedFromClick(),
		);
	}

	// ページナビゲーション
	DOM.pageSelectEl.addEventListener("change", (e) => UI.handlePageSelect(e));
	DOM.nextBtn.addEventListener("click", () => Typing.nextPage());
	DOM.retryBtn.addEventListener("click", () => Typing.retry());
	DOM.restartBtn.addEventListener("click", () => Typing.restartAll());

	// 設定関連
	DOM.settingsBtn.addEventListener("click", () => Theme.openSettings());
	DOM.closeSettingsBtn.addEventListener("click", () => Theme.closeSettings());
	DOM.themeToggleBtn.addEventListener("click", () => Theme.toggle());
	DOM.textWrapToggleBtn.addEventListener("click", () => Theme.toggleTextWrap());
	DOM.settingsPanel.addEventListener("click", (e) => {
		if (e.target === DOM.settingsPanel) {
			Theme.closeSettings();
		}
	});

	// 休憩設定関連
	if (DOM.breakCharsInput) {
		DOM.breakCharsInput.addEventListener("input", () =>
			Theme.handleBreakCharsChange(),
		);
		DOM.breakCharsInput.addEventListener("blur", () =>
			Theme.saveBreakSettings(),
		);
	}

	// TypeWellカウントダウン設定関連（追加）
	if (DOM.typewellCountdownInput) {
		DOM.typewellCountdownInput.addEventListener("input", () =>
			Theme.handleTypewellCountdownChange(),
		);
		DOM.typewellCountdownInput.addEventListener("blur", () =>
			Theme.validateTypewellCountdownInput(),
		);
	}

	// 休憩ダイアログ関連
	if (DOM.breakResumeBtn) {
		DOM.breakResumeBtn.addEventListener("click", () =>
			Typing.hideBreakDialog(),
		);
	}

	// 休憩ダイアログの背景クリックで閉じる（オプション：無効化も可能）
	if (DOM.breakDialog) {
		DOM.breakDialog.addEventListener("click", (e) => {
			if (e.target === DOM.breakDialog) {
				// 背景クリックでは閉じない（休憩を強制）
				// Typing.hideBreakDialog(); // コメントアウトして無効化
			}
		});
	}

	// 統計関連
	DOM.statsBtn.addEventListener("click", () => Stats.open());
	DOM.closeStatsBtn.addEventListener("click", () => Stats.close());
	DOM.clearStatsBtn.addEventListener("click", () => Stats.clearAll());
	DOM.statsPanel.addEventListener("click", (e) => {
		if (e.target === DOM.statsPanel) {
			Stats.close();
		}
	});

	// ヘルプ関連
	DOM.helpBtn.addEventListener("click", () => UI.openHelp());
	DOM.closeHelpBtn.addEventListener("click", () => UI.closeHelp());
	DOM.helpPanel.addEventListener("click", (e) => {
		if (e.target === DOM.helpPanel) {
			UI.closeHelp();
		}
	});

	// データエクスポート・インポート関連
	DOM.exportDataBtn.addEventListener("click", () => {
		try {
			Storage.exportData();
			alert("Data exported successfully!");
		} catch (error) {
			alert(`Export failed: ${error.message}`);
		}
	});

	DOM.importDataBtn.addEventListener("click", () => {
		DOM.importFileInput.click();
	});

	DOM.importFileInput.addEventListener("change", async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		try {
			const result = await Storage.importData(file);
			alert(
				`${result.message}\n\nExported: ${new Date(result.exportDate).toLocaleString()}`,
			);

			// ページリロードして変更を反映
			window.location.reload();
		} catch (error) {
			alert(`Import failed: ${error.message}`);
		}

		// ファイル入力をリセット
		DOM.importFileInput.value = "";
	});

	// 全データ削除関連
	DOM.deleteAllDataBtn.addEventListener("click", () =>
		UI.openDeleteConfirmation(),
	);
	DOM.deleteCancelBtn.addEventListener("click", () =>
		UI.closeDeleteConfirmation(),
	);
	DOM.deleteProceedBtn.addEventListener("click", () => UI.proceedDeletion());

	// 削除確認ダイアログの背景クリックで閉じる
	DOM.deleteConfirmationDialog.addEventListener("click", (e) => {
		if (e.target === DOM.deleteConfirmationDialog) {
			UI.closeDeleteConfirmation();
		}
	});

	// キーボード入力
	document.body.addEventListener("keydown", (e) => {
		// 入力フィールドにフォーカスがある場合は何もしない
		if (
			document.activeElement === DOM.customCodeArea ||
			document.activeElement === DOM.customNameInput ||
			document.activeElement === DOM.breakCharsInput ||
			document.activeElement === DOM.typewellCountdownInput
		)
			return;

		// モーダルパネルが開いている場合はタイピング関連の処理を無効化
		if (
			DOM.settingsPanel.style.display === "flex" ||
			DOM.statsPanel.style.display === "flex" ||
			DOM.helpPanel.style.display === "flex" ||
			DOM.deleteConfirmationDialog.style.display === "flex"
		) {
			// モーダル内で使用されるキーのみ許可（Escapeキーでモーダルを閉じるなど）
			if (e.key === "Escape") {
				e.preventDefault();
				// 開いているモーダルを閉じる
				if (DOM.settingsPanel.style.display === "flex") {
					Theme.closeSettings();
				} else if (DOM.statsPanel.style.display === "flex") {
					Stats.close();
				} else if (DOM.helpPanel.style.display === "flex") {
					UI.closeHelp();
				} else if (DOM.deleteConfirmationDialog.style.display === "flex") {
					UI.closeDeleteConfirmation();
				}
			}
			return; // その他のキー入力はブロック
		}

		// Escキー: 完全リセット
		if (e.key === "Escape") {
			e.preventDefault();
			Typing.restartAll();
			return;
		}

		// Enterキー: リザルト画面が表示されている場合はNext/Finishとして動作
		if (
			e.key === "Enter" &&
			DOM.overlay &&
			DOM.overlay.classList.contains("show")
		) {
			e.preventDefault();
			Typing.nextPage();
			return;
		}

		// rキー: リザルト画面が表示されている場合はRetryとして動作
		if (
			e.key === "r" &&
			DOM.overlay &&
			DOM.overlay.classList.contains("show")
		) {
			e.preventDefault();
			Typing.retry();
			return;
		}

		// Rキー: リザルト画面が表示されている場合はRestart Allとして動作
		if (
			e.key === "R" &&
			DOM.overlay &&
			DOM.overlay.classList.contains("show")
		) {
			e.preventDefault();
			Typing.restartAll();
			return;
		}

		// 休憩中のEnterキーで休憩解除
		if (APP_STATE.isBreakActive && e.key === "Enter") {
			e.preventDefault();
			Typing.hideBreakDialog();
			return;
		}

		// オーバーレイが表示されている場合は何もしない（Enterキー以外）
		if (DOM.overlay && DOM.overlay.classList.contains("show")) return;

		// 休憩中の場合は何もしない
		if (APP_STATE.isBreakActive) return;

		// Initial Speedモードの特別処理
		if (Typing.isInitialSpeedMode()) {
			// 待機中またはready状態の場合はTyping.handleKeyPressに委譲
			if (
				APP_STATE.initialSpeedState === "waiting" ||
				APP_STATE.initialSpeedState === "ready"
			) {
				if (e.key === "Enter" || e.key === " " || e.key.length === 1) {
					e.preventDefault();
					Typing.handleKeyPress(e.key);
				}
				return;
			}
			// その他の状態では入力を無視
			return;
		}

		// タイプウェルオリジナルモードの特別処理
		if (DOM.langSel.value === "typewell") {
			// 待機中またはカウントダウン中の場合はTyping.handleKeyPressに委譲
			if (
				APP_STATE.typewellState === "waiting" ||
				APP_STATE.typewellState === "countdown"
			) {
				if (e.key === "Enter" || e.key === " " || e.key.length === 1) {
					// スペースキー対応を追加
					e.preventDefault();
					Typing.handleKeyPress(e.key);
				}
				return;
			}
			// タイピング中の場合は通常処理を続行
		}

		// タイマーが開始されていない場合は開始（Initial Speedまたはタイプウェルのタイピング状態の場合のみ）
		if (
			!APP_STATE.startTime &&
			!Typing.isInitialSpeedMode() &&
			(DOM.langSel.value !== "typewell" || APP_STATE.typewellState === "typing")
		) {
			Typing.startTimer();
		}

		if (e.key.length === 1 || e.key === "Enter") {
			e.preventDefault();
			Typing.handleKeyPress(e.key);
		} else if (e.key === "Backspace") {
			e.preventDefault();
			Typing.handleBackspace();
		}
	});
}

// アプリケーションの初期化
function initializeApp() {
	console.log("Initializing Typing Practice App...");

	// DOM要素の初期化
	initializeDOMElements();

	// カスタムコードリストの更新
	CustomCode.updateSavedCodesSelect();

	// ページの準備とレンダリング（テーマ初期化より先に実行）
	Typing.preparePages();
	Typing.resetState();
	Typing.renderPage();

	// テーマとテキストラップ、休憩設定の初期化（ページ準備後に実行）
	Theme.initialize();

	// イベントリスナーの設定
	setupEventListeners();

	console.log("App initialized. Current language:", DOM.langSel.value);
	console.log("Current code length:", Utils.getCurrentCode().length);
	console.log("Text wrap enabled:", APP_STATE.isTextWrapEnabled);
	console.log("Break chars setting:", Storage.getBreakChars());
}

// ページ読み込み時の処理
window.onload = initializeApp;
