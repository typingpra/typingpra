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

		// TypeWellオリジナルモードでライン時間がある場合は専用処理
		if (DOM.langSel.value === "typewell" && APP_STATE.typewellLineTimes && APP_STATE.typewellLineTimes.length > 0) {
			this.showTypeWellOverlay(correct, total);
			return;
		}

		// Word Practiceモードの場合は専用処理
		if (DOM.langSel.value === "word-practice") {
			this.showWordPracticeOverlay(correct, total);
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
		// Word Practiceモードでは独自の時間計算を使用
		let finalTime;
		if (DOM.langSel.value === "word-practice") {
			// Word Practiceでは統計から総時間を取得（showWordPracticeOverlayで処理されるため、ここでは0に設定）
			finalTime = 0;
		} else {
			finalTime = Math.floor((Date.now() - APP_STATE.startTime) / 1000);
		}
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
		} else if (currentLanguage === "typewell-english-words") {
			// TypeWell English Wordsモード
			languageName = "TypeWell English Words";
		} else if (SNIPPETS[currentLanguage]) {
			const selectedMode = Utils.getSelectedDefaultMode();
			const modeLabel = selectedMode === "typewell" ? " (TypeWell Mode)" : "";
			languageName =
				currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1) + modeLabel;
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

		// 通常の統計セクションを非表示（TypeWell専用統計以外）
		const statsListEls = document.querySelectorAll(".stats-list:not(.typewell-stats)");
		statsListEls.forEach(el => {
			el.style.display = "none";
		});

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

	// TypeWell専用オーバーレイ表示
	showTypeWellOverlay(correct, total) {
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
		const mode = Utils.getSelectedTypeWellMode();
		let languageName;
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

		// TypeWell詳細結果の生成
		Typing.generateTypeWellDetailedResults();

		// TypeWellリザルトセクションを表示
		if (DOM.typewellResults) {
			DOM.typewellResults.style.display = "block";
		}

		// 基本統計の表示
		const pageBadgeEl = document.getElementById("page-badge");
		const characterCountEl = document.getElementById("character-count");
		
		// TypeWell専用の統計表示
		const typewellAccuracyDisplayEl = document.getElementById("typewell-accuracy-display");
		const typewellWpmDisplayEl = document.getElementById("typewell-wpm-display");
		const typewellTimeDisplayEl = document.getElementById("typewell-time-display");

		if (pageBadgeEl) pageBadgeEl.textContent = `TypeWell Original`;
		if (characterCountEl) characterCountEl.textContent = `${total} characters`;
		if (typewellAccuracyDisplayEl) typewellAccuracyDisplayEl.textContent = `${finalAccuracy}%`;
		if (typewellWpmDisplayEl) typewellWpmDisplayEl.textContent = `${finalWPM}`;
		
		// 全記録中の順位を計算してTypeWell時間表示に追加
		if (typewellTimeDisplayEl) {
			const rankInfo = Stats.calculateRankByWPM(languageName, APP_STATE.currentPage + 1, finalWPM);
			typewellTimeDisplayEl.textContent = `#${rankInfo.rank} / ${finalTime}s`;
		}

		// TypeWellモード情報を表示
		if (DOM.typewellModeInfo) {
			const modeDisplay = Utils.getSelectedTypeWellMode();
			switch (modeDisplay) {
				case "lowercase":
					DOM.typewellModeInfo.textContent = "Lowercase";
					break;
				case "mixed":
					DOM.typewellModeInfo.textContent = "Mixed Case";
					break;
				case "symbols":
					DOM.typewellModeInfo.textContent = "With Symbols";
					break;
				case "numbers":
					DOM.typewellModeInfo.textContent = "Numbers Only";
					break;
				default:
					DOM.typewellModeInfo.textContent = "Lowercase";
			}
		}
		if (DOM.typewellLinesInfo) {
			DOM.typewellLinesInfo.textContent = `${APP_STATE.typewellLineTimes.length} lines`;
		}

		// TypeWellモードではTOP3ランキング表示を常に非表示にする
		const top3RankingEl = document.getElementById("top3-ranking");
		if (top3RankingEl) {
			top3RankingEl.style.display = "none";
		}

		// 苦手文字の表示
		const mistakeCharsEl = document.getElementById("mistake-chars");
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

		// 通常の統計セクションを非表示（TypeWell専用統計を使用）
		const statsListEls = document.querySelectorAll(".stats-list:not(.typewell-stats)");
		statsListEls.forEach(el => {
			el.style.display = "none";
		});

		// TypeWell専用統計を明示的に表示
		const typewellStatsEl = document.querySelector(".stats-list.typewell-stats");
		if (typewellStatsEl) {
			typewellStatsEl.style.display = "block";
			typewellStatsEl.style.visibility = "visible";
			
			// TypeWell統計要素も個別に表示確認
			const typewellStatItems = typewellStatsEl.querySelectorAll(".stat-item");
			typewellStatItems.forEach(item => {
				item.style.display = "flex";
			});
		} else {
			console.warn("TypeWell stats element not found");
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

	// Word Practice専用オーバーレイ表示
	showWordPracticeOverlay(correct, total) {
		// Word Practiceリザルトセクションを表示
		if (DOM.wordPracticeResults) {
			DOM.wordPracticeResults.style.display = "block";
		}

		// 通常の統計セクションを非表示
		const statsListEls = document.querySelectorAll(".stats-list:not(.typewell-stats)");
		statsListEls.forEach(el => {
			el.style.display = "none";
		});

		// TOP3ランキング表示を無効化（Word Practiceは独自表示を使用）
		const top3RankingEl = document.getElementById("top3-ranking");
		if (top3RankingEl) {
			top3RankingEl.style.display = "none";
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

	// Word Practice結果表示（統計から呼ばれる）
	showWordPracticeResults(stats) {
		// 基本情報の表示
		const pageBadgeEl = document.getElementById("page-badge");
		const characterCountEl = document.getElementById("character-count");
		
		if (pageBadgeEl) {
			pageBadgeEl.textContent = "Word Practice";
		}
		if (characterCountEl) {
			characterCountEl.textContent = `${stats.wordCount} words`;
		}

		// Word Practice統計サマリーの表示
		if (DOM.wordPracticeSummary) {
			DOM.wordPracticeSummary.innerHTML = `
				<div class="word-practice-summary-grid">
					<div class="summary-stat">
						<span class="summary-label">Average WPM:</span>
						<span class="summary-value">${stats.averageWPM}</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Accuracy:</span>
						<span class="summary-value">${stats.accuracy}%</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Total Time:</span>
						<span class="summary-value">${stats.totalTime.toFixed(1)}s</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Avg First Key:</span>
						<span class="summary-value">${stats.averageFirstKeyTime}ms</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Avg Word Time:</span>
						<span class="summary-value">${stats.averageWordTime}ms</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Word Count:</span>
						<span class="summary-value">${stats.wordCount}</span>
					</div>
				</div>
			`;
		}

		// Word Practice詳細結果の生成
		this.generateWordPracticeDetailedResults();
	},

	// Word Practice詳細結果生成
	generateWordPracticeDetailedResults() {
		if (!DOM.wordPracticeDetailedResults) return;

		const results = APP_STATE.wordPracticeResults;
		if (!results || results.length === 0) return;

		const correctResults = results.filter(r => r.correct);
		const bestWPM = correctResults.length > 0 ? Math.max(...correctResults.map(r => r.wordWPM)) : 0;
		const worstWPM = correctResults.length > 0 ? Math.min(...correctResults.map(r => r.wordWPM)) : 0;

		let html = '<div class="word-practice-words-list">';

		results.forEach((result, index) => {
			const isBest = result.correct && result.wordWPM === bestWPM;
			const isWorst = result.correct && result.wordWPM === worstWPM && correctResults.length > 1;
			const badge = isBest ? " ✓ (Best)" : (isWorst ? " (Slowest)" : "");
			const status = result.correct ? "correct" : "incorrect";
			const wpmDisplay = result.correct ? `${result.wordWPM} WPM${badge}` : "Miss";

			html += `
				<div class="word-result ${status}">
					<span class="word-number">${index + 1}:</span>
					<span class="word-text">${result.word}</span>
					<span class="word-arrow">→</span>
					<span class="word-wpm">${wpmDisplay}</span>
					<span class="word-time">${result.wordTime}ms</span>
				</div>
			`;
		});

		html += "</div>";
		DOM.wordPracticeDetailedResults.innerHTML = html;
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

				// TypeWellリザルトセクションを非表示に戻す
				if (DOM.typewellResults) {
					DOM.typewellResults.style.display = "none";
				}

				// Word Practiceリザルトセクションを非表示に戻す
				if (DOM.wordPracticeResults) {
					DOM.wordPracticeResults.style.display = "none";
				}

				// 通常の統計セクションを表示に戻す（TypeWell専用統計以外）
				const statsListEls = document.querySelectorAll(".stats-list:not(.typewell-stats)");
				statsListEls.forEach(el => {
					el.style.display = "block";
				});

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
		document.body.classList.remove("word-practice-mode");

		// 現在選択されている言語に応じてクラスを追加
		if (DOM.langSel.value === "initial-speed") {
			document.body.classList.add("initial-speed-mode");
		} else if (DOM.langSel.value === "typewell") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
		} else if (DOM.langSel.value === "typewell-english-words") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
		} else if (DOM.langSel.value === "word-practice") {
			document.body.classList.add("word-practice-mode");
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
		if (DOM.wordPracticeContainer) {
			DOM.wordPracticeContainer.style.display = 
				DOM.langSel.value === "word-practice" ? "block" : "none";
		}
		if (DOM.typewellEnglishWordsContainer) {
			DOM.typewellEnglishWordsContainer.style.display = 
				DOM.langSel.value === "typewell-english-words" ? "block" : "none";
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
			// Initial Speed表示を更新
			if (typeof Typing !== "undefined" && Typing.updateInitialSpeedStartDisplay) {
				Typing.updateInitialSpeedStartDisplay();
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
			// TypeWellモード表示を更新
			if (typeof Typing !== "undefined" && Typing.updateTypeWellModeDisplay) {
				Typing.updateTypeWellModeDisplay();
			}
		} else {
			document.body.classList.remove("typewell-mode");
			document.body.classList.remove("typewell-original-mode");
			// TypeWellモード選択UIを非表示
			if (DOM.typewellContainer) {
				DOM.typewellContainer.style.display = "none";
			}
		}

		// TypeWell English Wordsモードのスタイル制御
		if (DOM.langSel.value === "typewell-english-words") {
			document.body.classList.add("typewell-mode");
			document.body.classList.add("typewell-original-mode");
		}

		// デフォルト言語モード選択UIの制御
		if (DOM.langSel.value === "custom") {
			DOM.customContainer.style.display = "flex";
			DOM.toggleCustomBtn.textContent = "Close";
			// デフォルト言語モード選択UIを非表示
			if (DOM.defaultLanguageModeContainer) {
				DOM.defaultLanguageModeContainer.style.display = "none";
			}
		} else {
			DOM.customContainer.style.display = "none";
			DOM.toggleCustomBtn.textContent = "Custom";
			
			// Word Practiceモードのスタイル制御
			if (DOM.langSel.value === "word-practice") {
				document.body.classList.add("word-practice-mode");
				// Word Practiceモード選択UIを表示
				if (DOM.wordPracticeContainer) {
					DOM.wordPracticeContainer.style.display = "block";
				}
				// Word Practiceモード表示を更新
				this.updateWordPracticeStartDisplay();
				// Word Practiceスタート画面を表示
				this.showWordPracticeStartScreen();
			} else {
				document.body.classList.remove("word-practice-mode");
				// Word Practiceモード選択UIを非表示
				if (DOM.wordPracticeContainer) {
					DOM.wordPracticeContainer.style.display = "none";
				}
			}

			// TypeWell English Wordsモードのスタイル制御
			if (DOM.langSel.value === "typewell-english-words") {
				document.body.classList.add("typewell-mode");
				document.body.classList.add("typewell-original-mode");
				// TypeWell English Wordsモード選択UIを表示
				if (DOM.typewellEnglishWordsContainer) {
					DOM.typewellEnglishWordsContainer.style.display = "block";
				}
				// TypeWell English Wordsモード表示を更新
				this.updateTypeWellEnglishWordsStartDisplay();
				// TypeWell English Wordsスタート画面を表示
				this.showTypeWellEnglishWordsStartScreen();
			} else {
				// TypeWell English Wordsモード選択UIを非表示
				if (DOM.typewellEnglishWordsContainer) {
					DOM.typewellEnglishWordsContainer.style.display = "none";
				}
			}

			// プログラミング言語（デフォルト言語）の場合はモード選択UIを表示
			const isDefaultLanguage = SNIPPETS[DOM.langSel.value] && 
				DOM.langSel.value !== "typewell" && 
				DOM.langSel.value !== "initial-speed" &&
				DOM.langSel.value !== "word-practice" &&
				DOM.langSel.value !== "typewell-english-words";
			
			if (isDefaultLanguage && DOM.defaultLanguageModeContainer) {
				DOM.defaultLanguageModeContainer.style.display = "block";
			} else if (DOM.defaultLanguageModeContainer) {
				DOM.defaultLanguageModeContainer.style.display = "none";
			}
		}

		// 特別なモード（専用スタート画面を持つモード）以外の場合のみコード準備・レンダリング
		const isSpecialMode = DOM.langSel.value === "typewell" || 
		                     DOM.langSel.value === "initial-speed" ||
		                     DOM.langSel.value === "word-practice" ||
		                     DOM.langSel.value === "typewell-english-words";

		if (!isSpecialMode) {
			Typing.preparePages();
			Typing.resetState();
			Typing.renderPage();
		}
		
		// 言語選択時にラジオボタンの状態を初期化
		if (typeof initializeRadioButtons === "function") {
			initializeRadioButtons();
		}
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

		// Word Practice画面を非表示
		if (DOM.wordPracticeStartScreen) {
			DOM.wordPracticeStartScreen.style.display = "none";
		}
		if (DOM.wordPracticePracticeScreen) {
			DOM.wordPracticePracticeScreen.style.display = "none";
		}

		// TypeWell English Words画面を非表示
		if (DOM.typewellEnglishWordsStartScreen) {
			DOM.typewellEnglishWordsStartScreen.style.display = "none";
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

	// デフォルト言語モード変更時の処理
	handleDefaultModeChange() {
		// プログラミング言語が選択されている場合のみ処理
		const isDefaultLanguage = SNIPPETS[DOM.langSel.value] && 
			DOM.langSel.value !== "typewell" && 
			DOM.langSel.value !== "initial-speed";
		
		if (isDefaultLanguage) {
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

	// Word Practiceスタート画面表示
	showWordPracticeStartScreen() {
		// 他の画面を非表示
		this.hideAllSpecialScreens();
		
		// Word Practiceスタート画面を表示
		if (DOM.wordPracticeStartScreen) {
			DOM.wordPracticeStartScreen.style.display = "flex";
		}

		// スタート画面の情報を更新
		this.updateWordPracticeStartDisplay();
	},

	// Word Practice単語セット変更時の処理
	handleWordPracticeSetChange() {
		// Word Practiceモードが選択されている場合のみ処理
		if (DOM.langSel.value === "word-practice") {
			this.updateWordPracticeStartDisplay();
		}
	},

	// Word Practice単語数変更時の処理
	handleWordPracticeCountChange() {
		// Word Practiceモードが選択されている場合のみ処理
		if (DOM.langSel.value === "word-practice") {
			this.updateWordPracticeStartDisplay();
		}
	},

	// Word Practiceスタート画面表示更新
	updateWordPracticeStartDisplay() {
		// 単語セット表示の更新
		const selectedSet = document.querySelector('input[name="word-practice-set"]:checked');
		if (selectedSet && DOM.wordPracticeCurrentSet) {
			const setTexts = {
				'top500': 'Top 500 Words',
				'top1500': 'Top 1500 Words',
				'all': 'All Words (2809)'
			};
			DOM.wordPracticeCurrentSet.textContent = setTexts[selectedSet.value] || 'Top 500 Words';
		}

		// 単語数表示の更新
		if (DOM.wordPracticeCountSelect && DOM.wordPracticeCountDisplay) {
			DOM.wordPracticeCountDisplay.textContent = DOM.wordPracticeCountSelect.value;
		}
	},

	// Word Practiceモックアップ表示（サンプルデータ）
	showWordPracticeMockup() {
		// モックアップデータ
		const mockWordResults = [
			{ word: "the", firstKeyTime: 234, wordTime: 800, wordWPM: 225, correct: true },
			{ word: "quick", firstKeyTime: 189, wordTime: 1500, wordWPM: 200, correct: true },
			{ word: "brown", firstKeyTime: 298, wordTime: 1200, wordWPM: 250, correct: false },
			{ word: "fox", firstKeyTime: 156, wordTime: 950, wordWPM: 189, correct: true },
			{ word: "jumps", firstKeyTime: 203, wordTime: 1800, wordWPM: 167, correct: true },
			{ word: "over", firstKeyTime: 245, wordTime: 1100, wordWPM: 218, correct: true },
			{ word: "lazy", firstKeyTime: 267, wordTime: 1350, wordWPM: 178, correct: false },
			{ word: "dog", firstKeyTime: 178, wordTime: 850, wordWPM: 212, correct: true },
			{ word: "sleeping", firstKeyTime: 289, wordTime: 2100, wordWPM: 171, correct: true },
			{ word: "peacefully", firstKeyTime: 312, wordTime: 2500, wordWPM: 168, correct: true }
		];

		// 統計計算
		const correctResults = mockWordResults.filter(r => r.correct);
		const averageFirstKeyTime = Math.round(
			correctResults.reduce((sum, r) => sum + r.firstKeyTime, 0) / correctResults.length
		);
		const averageWordTime = Math.round(
			correctResults.reduce((sum, r) => sum + r.wordTime, 0) / correctResults.length
		);
		const totalTime = mockWordResults.reduce((sum, r) => sum + r.wordTime, 0) / 1000; // 秒
		const averageWPM = Math.round(
			correctResults.reduce((sum, r) => sum + r.wordWPM, 0) / correctResults.length
		);
		const accuracy = Math.round((correctResults.length / mockWordResults.length) * 100);

		// Initial Speedと同じ構造で統計を保存（モックアップ用）
		APP_STATE.wordPracticeResults = mockWordResults;

		// 結果画面表示
		this.showWordPracticeResults({
			averageFirstKeyTime,
			averageWordTime,
			totalTime,
			averageWPM,
			accuracy,
			wordCount: mockWordResults.length
		});

		// オーバーレイ表示
		this.hideAllSpecialScreens();
		if (DOM.overlay) {
			DOM.overlay.style.visibility = "visible";
			DOM.overlay.classList.remove("hide");
			setTimeout(() => {
				DOM.overlay.classList.add("show");
			}, 10);
		}
	},

	// Word Practice結果画面表示
	showWordPracticeResults(stats) {
		// Word Practice専用リザルトセクションを表示
		if (DOM.wordPracticeResults) {
			DOM.wordPracticeResults.style.display = "block";
		}

		// Initial Speed専用リザルトセクションを非表示
		if (DOM.initialSpeedResults) {
			DOM.initialSpeedResults.style.display = "none";
		}

		// TypeWell専用リザルトセクションを非表示
		if (DOM.typewellResults) {
			DOM.typewellResults.style.display = "none";
		}

		// 通常の統計セクションを非表示
		const statsListEls = document.querySelectorAll(".stats-list:not(.typewell-stats)");
		statsListEls.forEach(el => {
			el.style.display = "none";
		});

		// モード情報
		const selectedSet = document.querySelector('input[name="word-practice-set"]:checked');
		const setTexts = {
			'top500': 'Top 500 Words',
			'top1500': 'Top 1500 Words',
			'all': 'All Words (2809)'
		};
		if (DOM.wordPracticeModeInfo) {
			DOM.wordPracticeModeInfo.textContent = setTexts[selectedSet?.value] || 'Top 500 Words';
		}
		if (DOM.wordPracticeCountInfo) {
			const wordCount = DOM.wordPracticeCountSelect?.value || '10';
			DOM.wordPracticeCountInfo.textContent = `${wordCount} words`;
		}

		// ページバッジ
		const pageBadgeEl = document.getElementById("page-badge");
		if (pageBadgeEl) {
			pageBadgeEl.textContent = `Word Practice`;
		}

		// 文字数表示
		const characterCountEl = document.getElementById("character-count");
		if (characterCountEl) {
			characterCountEl.textContent = `${stats.wordCount} words`;
		}

		// サマリー統計
		if (DOM.wordPracticeSummary) {
			DOM.wordPracticeSummary.innerHTML = `
				<div class="word-practice-summary-grid">
					<div class="summary-stat">
						<span class="summary-label">Average First Key:</span>
						<span class="summary-value">${(stats.averageFirstKeyTime / 1000).toFixed(3)}s</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Average Word Time:</span>
						<span class="summary-value">${(stats.averageWordTime / 1000).toFixed(3)}s</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Total Time:</span>
						<span class="summary-value">${stats.totalTime.toFixed(1)}s</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Average WPM:</span>
						<span class="summary-value">${stats.averageWPM}</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Accuracy:</span>
						<span class="summary-value">${stats.accuracy}%</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Words Typed:</span>
						<span class="summary-value">${stats.wordCount}</span>
					</div>
				</div>
			`;
		}

		// 詳細結果
		this.generateWordPracticeDetailedResults();
	},

	// Word Practice詳細結果生成
	generateWordPracticeDetailedResults() {
		if (!DOM.wordPracticeDetailedResults || !APP_STATE.wordPracticeResults) return;

		const results = APP_STATE.wordPracticeResults;
		
		let html = '<div class="word-practice-words-list">';
		
		// ヘッダー行を追加
		html += `
			<div class="word-result header">
				<span class="word-number">#</span>
				<span class="word-text">Word</span>
				<span class="word-first-key">First Key</span>
				<span class="word-time">Total Time</span>
				<span class="word-wpm">WPM</span>
			</div>
		`;
		
		results.forEach((result, index) => {
			html += `
				<div class="word-result ${result.correct ? "" : "incorrect"}">
					<span class="word-number">#${index + 1}</span>
					<span class="word-text">${result.word}</span>
					<span class="word-first-key">${(result.firstKeyTime / 1000).toFixed(3)}s</span>
					<span class="word-time">${(result.wordTime / 1000).toFixed(3)}s</span>
					<span class="word-wpm">${result.wordWPM}</span>
				</div>
			`;
		});

		html += '</div>';
		DOM.wordPracticeDetailedResults.innerHTML = html;
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

	// TypeWell English Wordsスタート画面表示
	showTypeWellEnglishWordsStartScreen() {
		// 他の画面を非表示
		this.hideAllSpecialScreens();
		
		// コード表示を非表示にする
		if (DOM.codeEl) {
			DOM.codeEl.style.display = "none";
		}
		
		// TypeWell English Wordsスタート画面を表示
		if (DOM.typewellEnglishWordsStartScreen) {
			DOM.typewellEnglishWordsStartScreen.style.display = "flex";
		}

		// スタート画面の情報を更新
		this.updateTypeWellEnglishWordsStartDisplay();
	},

	// TypeWell English Words単語セット変更時の処理
	handleTypeWellEnglishWordsSetChange() {
		// TypeWell English Wordsモードが選択されている場合のみ処理
		if (DOM.langSel.value === "typewell-english-words") {
			this.updateTypeWellEnglishWordsStartDisplay();
		}
	},

	// TypeWell English Wordsスタート画面表示更新
	updateTypeWellEnglishWordsStartDisplay() {
		// 単語セット表示の更新
		const selectedSet = document.querySelector('input[name="typewell-english-words-set"]:checked');
		if (selectedSet && DOM.typewellEnglishWordsCurrentSet) {
			const setTexts = {
				'top500': 'Top 500 Words',
				'top1500': 'Top 1500 Words',
				'all': 'All Words (2809)'
			};
			DOM.typewellEnglishWordsCurrentSet.textContent = setTexts[selectedSet.value] || 'Top 500 Words';
		}
	},
};
