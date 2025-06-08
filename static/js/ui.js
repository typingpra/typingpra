// ui.js - UI関連の操作

const UI = {
	// オーバーレイの表示
	showOverlay(correct, total) {
		clearInterval(APP_STATE.timerInterval);

		// Initial Speedモードの場合は専用処理
		if (Typing.isInitialSpeedMode()) {
			this.showInitialSpeedOverlay();
			return;
		}

		const finalAccuracy =
			APP_STATE.totalKeystrokes > 0
				? Math.round(
						((APP_STATE.totalKeystrokes - APP_STATE.errorCount) /
							APP_STATE.totalKeystrokes) *
							100,
					)
				: 100;
		const finalTime = Math.floor((Date.now() - APP_STATE.startTime) / 1000);
		const finalWPM = parseInt(DOM.wpmEl.textContent.split(": ")[1]) || 0;

		// 言語名の取得
		const currentLanguage = DOM.langSel.value;
		let languageName;

		if (currentLanguage === "custom") {
			const selectedMode = CustomCode.getSelectedCustomMode();
			languageName =
				selectedMode === "typewell" ? "Custom (TypeWell Mode)" : "Custom";
		} else if (currentLanguage === "typewell") {
			// TypeWellオリジナルモードの場合はモード情報を含める
			const mode = Utils.getSelectedTypeWellMode();
			switch (mode) {
				case "lowercase":
					languageName = "TypeWell Original (Lowercase)";
					break;
				case "mixed":
					languageName = "TypeWell Original (Mixed Case)";
					break;
				case "symbols":
					languageName = "TypeWell Original (With Symbols)";
					break;
				case "numbers":
					languageName = "TypeWell Original (Numbers Only)";
					break;
				default:
					languageName = "TypeWell Original";
			}
		} else if (SNIPPETS[currentLanguage]) {
			languageName =
				currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);
		} else {
			// 保存されたカスタムコードの場合
			const codeMode = CustomCode.getCustomCodeMode(currentLanguage);
			const modeLabel = codeMode === "typewell" ? " (TypeWell Mode)" : "";
			languageName = currentLanguage + modeLabel;
		}

		// 結果を保存
		Stats.saveResult(
			languageName,
			APP_STATE.currentPage + 1,
			APP_STATE.pages.length,
			finalWPM,
			finalAccuracy,
			finalTime,
			total,
		);

		// TOP3ランキングとランクインチェック
		const top3Records = Stats.getTop3Records(
			languageName,
			APP_STATE.currentPage + 1,
		);
		const rankStatus = Stats.checkRankIn(
			languageName,
			APP_STATE.currentPage + 1,
			finalWPM,
		);

		// 現在のセッションの苦手文字を集計
		const sessionMistakes = this.getSessionTopMistakes(3);

		// 結果表示の更新
		const pageBadgeEl = document.getElementById("page-badge");
		const characterCountEl = document.getElementById("character-count");
		const accuracyDisplayEl = document.getElementById("accuracy-display");
		const wpmDisplayEl = document.getElementById("wpm-display");
		const timeDisplayEl = document.getElementById("time-display");
		const mistakeCharsEl = document.getElementById("mistake-chars");
		const top3RankingEl = document.getElementById("top3-ranking");

		if (pageBadgeEl)
			pageBadgeEl.textContent = `Page ${APP_STATE.currentPage + 1}/${APP_STATE.pages.length}`;
		if (characterCountEl) characterCountEl.textContent = `${total} characters`;
		if (accuracyDisplayEl) accuracyDisplayEl.textContent = `${finalAccuracy}%`;
		if (wpmDisplayEl) wpmDisplayEl.textContent = `${finalWPM}`;
		if (timeDisplayEl) timeDisplayEl.textContent = `${finalTime}s`;

		// TOP3ランキングの表示
		if (top3RankingEl) {
			if (top3Records.length > 0) {
				top3RankingEl.style.display = "block";
				const rankingListEl = document.getElementById("ranking-list");

				if (rankingListEl) {
					let rankingHtml = "";

					// ランクイン表示
					if (rankStatus.isRankIn) {
						const rankingInfoEl = document.getElementById("ranking-info");
						if (rankingInfoEl) {
							let rankMessage = "";
							if (rankStatus.isNewRecord) {
								rankMessage = `Personal Best • Rank #${rankStatus.rank}`;
							} else {
								rankMessage = `Ranked #${rankStatus.rank}`;
							}
							rankingInfoEl.innerHTML = `<div class="rank-achievement">${rankMessage}</div>`;
							rankingInfoEl.style.display = "block";
						}
					} else {
						const rankingInfoEl = document.getElementById("ranking-info");
						if (rankingInfoEl) {
							rankingInfoEl.style.display = "none";
						}
					}

					// TOP3リストの表示
					top3Records.forEach((record) => {
						const isCurrentRecord =
							record.wpm === finalWPM && rankStatus.isRankIn;

						rankingHtml += `
							<div class="ranking-item ${isCurrentRecord ? "current-record" : ""}">
								<div class="rank-position">${record.rank}</div>
								<div class="rank-wpm">${record.wpm}</div>
								<div class="rank-unit">WPM</div>
								<div class="rank-details">${record.accuracy}% • ${Utils.formatTime(record.time)}</div>
							</div>
						`;
					});

					rankingListEl.innerHTML = rankingHtml;
				}
			} else {
				top3RankingEl.style.display = "none";
			}
		}

		// 苦手文字の表示
		if (mistakeCharsEl) {
			if (sessionMistakes.length > 0) {
				mistakeCharsEl.style.display = "block";
				const mistakeListEl = document.getElementById("mistake-list");
				if (mistakeListEl) {
					mistakeListEl.innerHTML = sessionMistakes
						.map(({ char, count }) => {
							const displayChar =
								char === " "
									? "Space"
									: char === "\n"
										? "Enter"
										: char === "\t"
											? "Tab"
											: char;
							return `<span class="mistake-char">${displayChar} (${count})</span>`;
						})
						.join("");
				}
			} else {
				mistakeCharsEl.style.display = "none";
			}
		}

		// ボタンテキストの更新（Enterキーヒント付き）
		this.updateOverlayButtons();

		// フェードイン効果でオーバーレイを表示
		if (DOM.overlay) {
			DOM.overlay.style.visibility = "visible";
			DOM.overlay.classList.remove("hide");
			setTimeout(() => {
				DOM.overlay.classList.add("show");
			}, 10);
		}
	},

	// Initial Speed専用オーバーレイ表示
	showInitialSpeedOverlay() {
		// Initial Speedリザルトセクションを表示
		if (DOM.initialSpeedResults) {
			DOM.initialSpeedResults.style.display = "block";
		}

		// 通常の統計セクションを非表示
		const statsListEl = document.querySelector(".stats-list");
		if (statsListEl) {
			statsListEl.style.display = "none";
		}

		// ボタンテキストの更新
		this.updateOverlayButtons();

		// フェードイン効果でオーバーレイを表示
		if (DOM.overlay) {
			DOM.overlay.style.visibility = "visible";
			DOM.overlay.classList.remove("hide");
			setTimeout(() => {
				DOM.overlay.classList.add("show");
			}, 10);
		}
	},

	// オーバーレイボタンテキストの更新
	updateOverlayButtons() {
		if (DOM.nextBtn) {
			if (Typing.isInitialSpeedMode()) {
				DOM.nextBtn.textContent = "New Practice (Enter)";
			} else if (DOM.langSel.value === "typewell") {
				DOM.nextBtn.textContent = "New Practice (Enter)";
			} else {
				DOM.nextBtn.textContent =
					APP_STATE.currentPage < APP_STATE.pages.length - 1
						? "Next (Enter)"
						: "Finish (Enter)";
			}
		}

		// TypeWellモードやInitial SpeedモードではRetryとRestart Allボタンも"New Practice"に
		const isSpecialMode =
			Typing.isInitialSpeedMode() ||
			DOM.langSel.value === "typewell" ||
			Typing.isTypeWellMode();

		if (DOM.retryBtn) {
			if (isSpecialMode) {
				DOM.retryBtn.textContent = "New Practice (r)";
			} else {
				DOM.retryBtn.textContent = "Retry (r)";
			}
		}

		if (DOM.restartBtn) {
			if (isSpecialMode) {
				DOM.restartBtn.textContent = "New Practice (R)";
			} else {
				DOM.restartBtn.textContent = "Restart All (R)";
			}
		}
	},

	// オーバーレイを非表示
	hideOverlay(callback) {
		if (DOM.overlay) {
			DOM.overlay.classList.remove("show");
			DOM.overlay.classList.add("hide");

			setTimeout(() => {
				DOM.overlay.style.visibility = "hidden";
				DOM.overlay.classList.remove("hide");

				// Initial Speedリザルトセクションを非表示に戻す
				if (DOM.initialSpeedResults) {
					DOM.initialSpeedResults.style.display = "none";
				}

				// 通常の統計セクションを表示に戻す
				const statsListEl = document.querySelector(".stats-list");
				if (statsListEl) {
					statsListEl.style.display = "block";
				}

				if (callback) callback();
			}, 400);
		}
	},

	// 言語変更時の処理
	handleLanguageChange() {
		// リザルト表示中の場合は、背景モードを即座に更新してからオーバーレイを非表示
		if (DOM.overlay && DOM.overlay.classList.contains("show")) {
			// 背景のモード状態を即座に更新
			this.updateBackgroundModeStyles();
			this.hideOverlay(() => {
				this.performLanguageChange();
			});
			return;
		}

		this.performLanguageChange();
	},

	// 背景のモード状態を即座に更新（リザルト表示中専用）
	updateBackgroundModeStyles() {
		// 全てのモードクラスをクリア
		document.body.classList.remove("initial-speed-mode");
		document.body.classList.remove("typewell-mode");
		document.body.classList.remove("typewell-original-mode");

		// 現在選択されている言語に応じてクラスを追加
		if (DOM.langSel.value === "initial-speed") {
			document.body.classList.add("initial-speed-mode");
		} else if (DOM.langSel.value === "typewell") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
		}

		// コンテナの表示/非表示も即座に更新
		if (DOM.initialSpeedContainer) {
			DOM.initialSpeedContainer.style.display = 
				DOM.langSel.value === "initial-speed" ? "block" : "none";
		}
		if (DOM.typewellContainer) {
			DOM.typewellContainer.style.display = 
				DOM.langSel.value === "typewell" ? "block" : "none";
		}
		if (DOM.customContainer) {
			DOM.customContainer.style.display = 
				DOM.langSel.value === "custom" ? "flex" : "none";
		}
	},

	// 実際の言語変更処理
	performLanguageChange() {
		// 現在表示されている特別な画面をすべて非表示にする
		this.hideAllSpecialScreens();

		// Initial Speedモードのスタイル制御
		if (DOM.langSel.value === "initial-speed") {
			document.body.classList.add("initial-speed-mode");
			// Initial Speedモード選択UIを表示
			if (DOM.initialSpeedContainer) {
				DOM.initialSpeedContainer.style.display = "block";
			}
		} else {
			document.body.classList.remove("initial-speed-mode");
			// Initial Speedモード選択UIを非表示
			if (DOM.initialSpeedContainer) {
				DOM.initialSpeedContainer.style.display = "none";
			}
		}

		// TypeWellオリジナルモードのスタイル制御
		if (DOM.langSel.value === "typewell") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
			// TypeWellモード選択UIを表示
			if (DOM.typewellContainer) {
				DOM.typewellContainer.style.display = "block";
			}
		} else {
			document.body.classList.remove("typewell-mode");
			document.body.classList.remove("typewell-original-mode");
			// TypeWellモード選択UIを非表示
			if (DOM.typewellContainer) {
				DOM.typewellContainer.style.display = "none";
			}
		}

		if (DOM.langSel.value === "custom") {
			DOM.customContainer.style.display = "flex";
			DOM.toggleCustomBtn.textContent = "Close";
		} else {
			DOM.customContainer.style.display = "none";
			DOM.toggleCustomBtn.textContent = "Custom";
		}

		Typing.preparePages();
		Typing.resetState();
		Typing.renderPage();
	},

	// すべての特別画面を非表示にする
	hideAllSpecialScreens() {
		// Initial Speed画面を非表示
		if (DOM.initialSpeedStartScreen) {
			DOM.initialSpeedStartScreen.style.display = "none";
		}
		if (DOM.initialSpeedPracticeScreen) {
			DOM.initialSpeedPracticeScreen.style.display = "none";
		}

		// TypeWell画面を非表示
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

	// カスタムコード入力時の処理
	handleCustomCodeInput() {
		if (DOM.langSel.value === "custom") {
			// TypeWellモードのスタイルを削除（カスタムコードなので）
			document.body.classList.remove("typewell-mode");
			document.body.classList.remove("typewell-original-mode");
			document.body.classList.remove("initial-speed-mode");

			// TypeWellとInitial Speedコンテナを非表示
			if (DOM.typewellContainer) {
				DOM.typewellContainer.style.display = "none";
			}
			if (DOM.initialSpeedContainer) {
				DOM.initialSpeedContainer.style.display = "none";
			}

			Typing.preparePages();
			Typing.resetState();
			Typing.renderPage();
		}
	},

	// カスタムモード変更時の処理
	handleCustomModeChange() {
		// カスタムコードが表示されている場合のみ処理
		if (DOM.langSel.value === "custom") {
			Typing.preparePages();
			Typing.resetState();
			Typing.renderPage();
		}
	},

	// ページ選択時の処理
	handlePageSelect(e) {
		const selectedPage = parseInt(e.target.value);
		Typing.goToPage(selectedPage);
	},

	// ヘルプパネルの開閉
	openHelp() {
		DOM.helpPanel.style.display = "flex";
	},

	closeHelp() {
		DOM.helpPanel.style.display = "none";
	},

	// 削除確認ダイアログの開閉と処理
	openDeleteConfirmation() {
		APP_STATE.deleteConfirmationStep = 1;
		DOM.deleteDialogTitle.textContent = "! DELETE ALL DATA";
		DOM.deleteDialogMessage.textContent =
			"Are you sure you want to delete ALL your data?";
		DOM.deleteWarningDetails.style.display = "none";
		DOM.deleteProceedBtn.textContent = "Yes, Delete";
		DOM.deleteProceedBtn.className = "delete-dialog-btn delete-confirm-btn";
		DOM.deleteConfirmationDialog.style.display = "flex";
	},

	closeDeleteConfirmation() {
		DOM.deleteConfirmationDialog.style.display = "none";
		APP_STATE.deleteConfirmationStep = 1;
	},

	proceedDeletion() {
		if (APP_STATE.deleteConfirmationStep === 1) {
			// 第1段階確認 → 第2段階確認
			APP_STATE.deleteConfirmationStep = 2;
			DOM.deleteDialogTitle.textContent = "🚨 FINAL WARNING";
			DOM.deleteDialogMessage.textContent =
				"Are you ABSOLUTELY sure? This cannot be undone!";
			DOM.deleteWarningDetails.style.display = "block";
			DOM.deleteProceedBtn.textContent = "DELETE EVERYTHING";
			DOM.deleteProceedBtn.className =
				"delete-dialog-btn delete-final-confirm-btn";
		} else if (APP_STATE.deleteConfirmationStep === 2) {
			// 第2段階確認 → 実際の削除実行
			this.performDataDeletion();
			this.closeDeleteConfirmation();
			Theme.closeSettings();
		}
	},

	performDataDeletion() {
		try {
			// 削除結果を追跡
			const deletionResults = [];
			let hasErrors = false;

			// localStorage内のすべてのデータを削除
			Object.values(CONSTANTS.STORAGE_KEYS).forEach((key) => {
				try {
					const success = Storage.remove(key);
					deletionResults.push({ key, success });
					if (!success) {
						hasErrors = true;
						console.warn(`Failed to delete ${key}`);
					}
				} catch (error) {
					hasErrors = true;
					console.error(`Error deleting ${key}:`, error);
					deletionResults.push({ key, success: false, error: error.message });
				}
			});

			// アプリケーション状態の完全リセット
			this.resetApplicationState();

			// エラーがあった場合は警告、なければ成功メッセージ
			if (hasErrors) {
				const failedKeys = deletionResults
					.filter((result) => !result.success)
					.map((result) => result.key);

				alert(
					`Data deletion completed with warnings.\nFailed to delete: ${failedKeys.join(", ")}\n\nPlease refresh the page to ensure complete reset.`,
				);
			} else {
				alert("All data has been successfully deleted!");
			}
		} catch (error) {
			console.error("Critical error during data deletion:", error);
			alert(
				`Failed to delete data: ${error.message}\n\nPlease try refreshing the page.`,
			);
		}
	},

	// アプリケーション状態の完全リセット
	resetApplicationState() {
		try {
			// UI状態のリセット
			CustomCode.updateSavedCodesSelect();

			// 現在の選択言語をデフォルトに戻す
			const defaultLanguages = ["python", "javascript", "c"];
			const currentLang = DOM.langSel.value;

			if (
				!SNIPPETS[currentLang] &&
				currentLang !== "custom" &&
				currentLang !== "typewell" &&
				currentLang !== "initial-speed"
			) {
				DOM.langSel.value = "python";
			}

			// カスタムコードエリアをクリア
			if (DOM.customCodeArea) {
				DOM.customCodeArea.value = "";
			}
			if (DOM.customNameInput) {
				DOM.customNameInput.value = "";
			}

			// カスタムモード選択をリセット
			const normalRadio = document.getElementById("custom-normal");
			if (normalRadio) {
				normalRadio.checked = true;
			}

			// カスタムコンテナを閉じる
			if (DOM.customContainer) {
				DOM.customContainer.style.display = "none";
			}
			if (DOM.toggleCustomBtn) {
				DOM.toggleCustomBtn.textContent = "Custom";
			}

			// ページを再準備
			if (typeof Typing !== "undefined") {
				Typing.preparePages();
				Typing.resetState();
				Typing.renderPage();
			}

			// テーマをダークモードにリセット
			if (APP_STATE.isDarkMode === false) {
				Theme.toggle();
			}

			// TypeWellモードのスタイルをリセット
			document.body.classList.remove("typewell-mode");
			document.body.classList.remove("typewell-original-mode");
			document.body.classList.remove("initial-speed-mode");

			// TypeWellとInitial Speedコンテナを非表示
			if (DOM.typewellContainer) {
				DOM.typewellContainer.style.display = "none";
			}
			if (DOM.initialSpeedContainer) {
				DOM.initialSpeedContainer.style.display = "none";
			}

			// 休憩設定をデフォルトに戻す
			if (DOM.breakCharsInput) {
				DOM.breakCharsInput.value = CONSTANTS.BREAK_SETTINGS.DEFAULT_CHARS;
			}

			// 統計パネルが開いている場合は更新
			if (DOM.statsPanel && DOM.statsPanel.style.display === "flex") {
				Stats.updateDisplay();
			}
		} catch (error) {
			console.error("Error during application state reset:", error);
			// 状態リセットに失敗した場合はページリロードを推奨
			if (
				confirm(
					"Application reset failed. Would you like to reload the page to ensure complete reset?",
				)
			) {
				window.location.reload();
			}
		}
	},

	// TypeWellモード変更時の処理
	handleTypeWellModeChange() {
		// TypeWellモードが選択されている場合のみ処理
		if (DOM.langSel.value === "typewell") {
			// モード表示を更新
			if (typeof Typing !== "undefined" && Typing.updateTypeWellModeDisplay) {
				Typing.updateTypeWellModeDisplay();
			}

			// 待機状態の場合は新しいコードを生成
			if (APP_STATE.typewellState === "waiting") {
				Typing.preparePages();
				Typing.resetState();
				Typing.renderPage();
			}
		}
	},

	// Initial Speedモード変更時の処理
	handleInitialSpeedModeChange() {
		// Initial Speedモードが選択されている場合のみ処理
		if (DOM.langSel.value === "initial-speed") {
			// モード表示を更新
			if (
				typeof Typing !== "undefined" &&
				Typing.updateInitialSpeedStartDisplay
			) {
				Typing.updateInitialSpeedStartDisplay();
			}

			// 待機状態の場合は表示を更新
			if (APP_STATE.initialSpeedState === "waiting") {
				Typing.renderPage();
			}
		}
	},

	// Initial Speed試行回数変更時の処理
	handleInitialSpeedTrialsChange() {
		// Initial Speedモードが選択されている場合のみ処理
		if (DOM.langSel.value === "initial-speed") {
			// 表示を更新
			if (
				typeof Typing !== "undefined" &&
				Typing.updateInitialSpeedStartDisplay
			) {
				Typing.updateInitialSpeedStartDisplay();
			}
		}
	},

	// 現在のセッションの苦手文字上位を取得
	getSessionTopMistakes(limit = 3) {
		if (!APP_STATE.currentMistakes || APP_STATE.currentMistakes.length === 0) {
			return [];
		}

		// 文字ごとのカウントを集計
		const mistakeCount = {};
		APP_STATE.currentMistakes.forEach((char) => {
			const displayChar =
				char === " "
					? "Space"
					: char === "\n"
						? "Enter"
						: char === "\t"
							? "Tab"
							: char;
			mistakeCount[displayChar] = (mistakeCount[displayChar] || 0) + 1;
		});

		// カウント順にソートして上位を返す
		return Object.entries(mistakeCount)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([char, count]) => ({ char, count }));
	},
};
