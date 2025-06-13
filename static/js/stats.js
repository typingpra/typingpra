// stats.js - 統計関連の機能

const Stats = {
	// 結果の保存
	saveResult(
		language,
		partNumber,
		totalParts,
		wpm,
		accuracy,
		time,
		characters,
	) {
		const statsData = Storage.getStatsData();

		if (!statsData[language]) {
			statsData[language] = { parts: [] };
		}

		let partData = statsData[language].parts.find(
			(p) => p.partNumber === partNumber,
		);

		if (!partData) {
			partData = {
				partNumber: partNumber,
				totalParts: totalParts,
				attempts: [],
			};
			statsData[language].parts.push(partData);
		}

		const attemptNumber = partData.attempts.length + 1;

		// Initial Speedモードの場合は特別な形式で保存
		if (language.startsWith("Initial Speed")) {
			partData.attempts.push({
				attemptNumber: attemptNumber,
				timestamp: new Date().toISOString(),
				averageTime: time, // 平均反応時間（秒）
				accuracy: accuracy,
				trials: characters, // 試行回数
				wpm: wpm, // WPM換算値（参考）
				detailedResults: APP_STATE.initialSpeedResults || [],
			});
		} else if (language.startsWith("Word Practice")) {
			// Word Practiceモードの場合は特別な形式で保存
			partData.attempts.push({
				attemptNumber: attemptNumber,
				timestamp: new Date().toISOString(),
				wpm: wpm,
				accuracy: accuracy,
				time: time,
				wordCount: characters, // 単語数
				wordsPerMinute: Math.round((characters / time) * 60), // 単語/分
				averageWordTime: time / characters, // 平均単語入力時間
				detailedWordResults: APP_STATE.wordPracticeResults || [],
			});
		} else {
			partData.attempts.push({
				attemptNumber: attemptNumber,
				timestamp: new Date().toISOString(),
				wpm: wpm,
				accuracy: accuracy,
				time: time,
				characters: characters,
			});
		}

		Storage.saveStatsData(statsData);
	},

	// 指定した言語・パートのTOP3記録を取得
	getTop3Records(language, partNumber) {
		const statsData = Storage.getStatsData();

		if (!statsData[language]) {
			return [];
		}

		const partData = statsData[language].parts.find(
			(p) => p.partNumber === partNumber,
		);

		if (!partData || !partData.attempts) {
			return [];
		}

		let sortedAttempts;

		// Initial Speedモードの場合は平均反応時間でソート（昇順 = 速い方が良い）
		if (language.startsWith("Initial Speed")) {
			sortedAttempts = [...partData.attempts]
				.filter((attempt) => attempt.averageTime > 0) // 有効な記録のみ
				.sort((a, b) => a.averageTime - b.averageTime) // 昇順ソート（速い方が上位）
				.slice(0, 3);

			return sortedAttempts.map((attempt, index) => ({
				rank: index + 1,
				time: attempt.averageTime, // 平均反応時間
				accuracy: attempt.accuracy,
				trials: attempt.trials,
				timestamp: attempt.timestamp,
				attemptNumber: attempt.attemptNumber,
			}));
		} else if (language.startsWith("Word Practice")) {
			// Word PracticeモードはWPMでソート
			sortedAttempts = [...partData.attempts]
				.filter((attempt) => attempt.wpm > 0) // 有効な記録のみ
				.sort((a, b) => b.wpm - a.wpm) // 降順ソート（速い方が上位）
				.slice(0, 3);

			return sortedAttempts.map((attempt, index) => ({
				rank: index + 1,
				wpm: attempt.wpm,
				accuracy: attempt.accuracy,
				time: attempt.time,
				wordCount: attempt.wordCount,
				wordsPerMinute: attempt.wordsPerMinute,
				timestamp: attempt.timestamp,
				attemptNumber: attempt.attemptNumber,
			}));
		} else {
			// 通常モードはWPMでソート
			sortedAttempts = [...partData.attempts]
				.sort((a, b) => b.wpm - a.wpm)
				.slice(0, 3);

			return sortedAttempts.map((attempt, index) => ({
				rank: index + 1,
				wpm: attempt.wpm,
				accuracy: attempt.accuracy,
				time: attempt.time,
				timestamp: attempt.timestamp,
				attemptNumber: attempt.attemptNumber,
			}));
		}
	},

	// 今回の記録がTOP3にランクインしているかチェック
	checkRankIn(language, partNumber, currentValue) {
		const top3 = this.getTop3Records(language, partNumber);

		// Initial Speedモードの場合は反応時間で比較
		if (language.startsWith("Initial Speed")) {
			// currentValueは平均反応時間（秒）として扱う
			const currentTimeInSeconds = currentValue;

			for (let i = 0; i < top3.length; i++) {
				if (Math.abs(top3[i].time - currentTimeInSeconds) < 0.01) {
					// 10ms以内の誤差を許容
					return {
						isRankIn: true,
						rank: top3[i].rank,
						isNewRecord: i === 0 && top3.length === 1,
					};
				}
			}

			// TOP3に入らない場合でも、記録が3つ未満なら可能性をチェック
			if (top3.length < 3) {
				return {
					isRankIn: true,
					rank: top3.length + 1,
					isNewRecord: top3.length === 0,
				};
			}
		} else {
			// 通常モードはWPMで比較
			for (let i = 0; i < top3.length; i++) {
				if (top3[i].wpm === currentValue) {
					return {
						isRankIn: true,
						rank: top3[i].rank,
						isNewRecord: i === 0 && top3.length === 1,
					};
				}
			}

			// TOP3に入らない場合でも、記録が3つ未満なら4位以下の可能性をチェック
			if (top3.length < 3) {
				return {
					isRankIn: true,
					rank: top3.length + 1,
					isNewRecord: top3.length === 0,
				};
			}
		}

		return {
			isRankIn: false,
			rank: null,
			isNewRecord: false,
		};
	},

	// 全記録に対する順位を計算（Initial Speed用 - 平均反応時間ベース）
	calculateRankByTime(language, partNumber, time) {
		const statsData = Storage.getStatsData();
		
		if (!statsData[language]) {
			return { rank: 1, totalRecords: 1 };
		}

		const partData = statsData[language].parts.find(p => p.partNumber === partNumber);
		if (!partData || !partData.attempts || partData.attempts.length === 0) {
			return { rank: 1, totalRecords: 1 };
		}

		// Initial Speedモードでは平均反応時間で昇順ソート（低い時間が良い）
		const sortedAttempts = partData.attempts
			.slice()
			.sort((a, b) => a.averageTime - b.averageTime);

		// 現在のタイムより良い記録の数を数える
		let betterRecords = 0;
		for (const attempt of sortedAttempts) {
			if (attempt.averageTime < time) {
				betterRecords++;
			} else {
				break;
			}
		}

		return {
			rank: betterRecords + 1,
			totalRecords: sortedAttempts.length + 1
		};
	},

	// 全記録に対する順位を計算（WPM用）
	calculateRankByWPM(language, partNumber, wpm) {
		const statsData = Storage.getStatsData();
		
		if (!statsData[language]) {
			return { rank: 1, totalRecords: 1 };
		}

		const partData = statsData[language].parts.find(p => p.partNumber === partNumber);
		if (!partData || !partData.attempts || partData.attempts.length === 0) {
			return { rank: 1, totalRecords: 1 };
		}

		// WPMで降順ソート（高いWPMが良い）
		const sortedAttempts = partData.attempts
			.slice()
			.sort((a, b) => b.wpm - a.wpm);

		// 現在のWPMより良い記録の数を数える
		let betterRecords = 0;
		for (const attempt of sortedAttempts) {
			if (attempt.wpm > wpm) {
				betterRecords++;
			} else {
				break;
			}
		}

		return {
			rank: betterRecords + 1,
			totalRecords: sortedAttempts.length + 1
		};
	},

	// 統計パネルの表示
	open() {
		this.updateDisplay();
		DOM.statsPanel.style.display = "flex";
	},

	// 統計パネルを閉じる
	close() {
		DOM.statsPanel.style.display = "none";
	},

	// 全統計のクリア
	clearAll() {
		if (
			confirm(
				"Are you sure you want to clear all statistics? This action cannot be undone.",
			)
		) {
			Storage.saveStatsData({});
			Storage.clearMistakeChars(); // 苦手文字データもクリア
			Storage.clearInitialSpeedMistakes(); // Initial Speed専用ミス統計もクリア
			this.updateDisplay();
			alert("All statistics have been cleared.");
		}
	},

	// 統計表示の更新
	updateDisplay() {
		const statsData = Storage.getStatsData();
		const statsListEl = document.getElementById("stats-list");

		if (!statsListEl) return;

		if (Object.keys(statsData).length === 0) {
			statsListEl.innerHTML =
				"<p style=\"text-align: center; color: var(--pending-color); font-family: 'Courier New', monospace;\">No statistics available yet.<br>Complete some typing exercises to see your progress!</p>";

			// 苦手文字セクションも非表示
			const mistakeStatsEl = document.getElementById("mistake-stats");
			if (mistakeStatsEl) {
				mistakeStatsEl.style.display = "none";
			}
			
			// グラフエリアは初期化のみ実行
			this.initializeGraphArea();
			return;
		}

		// 苦手文字統計を表示（通常モードとInitial Speed統計の両方）
		this.displayMistakeStats();

		// グラフエリアを初期化
		this.initializeGraphArea();

		let html = "";

		// 言語を定義順序でソート
		const sortedLanguages = this.sortLanguagesByOrder(Object.keys(statsData));

		sortedLanguages.forEach((language) => {
			const languageData = statsData[language];
			const languageId = `lang-${language.replace(/\s+/g, "-").toLowerCase()}`;

			html += `
                <div class="language-section">
                    <div class="language-header" onclick="Stats.toggleLanguage('${languageId}')">
                        <span>${language}</span>
                        <span class="expand-icon">▶</span>
                    </div>
                    <div class="language-content" id="${languageId}">
            `;

			const sortedParts = languageData.parts.sort(
				(a, b) => a.partNumber - b.partNumber,
			);

			sortedParts.forEach((part) => {
				const latestAttempt = part.attempts[part.attempts.length - 1];
				const isInitialSpeed = language.startsWith("Initial Speed");

				let bestAttempt;
				if (isInitialSpeed) {
					// Initial Speedモードでは平均反応時間で最良記録を判定（昇順）
					bestAttempt = part.attempts.reduce((best, current) =>
						current.averageTime < best.averageTime ? current : best,
					);
				} else {
					// 通常モードではWPMで最良記録を判定
					bestAttempt = part.attempts.reduce((best, current) =>
						current.wpm > best.wpm ? current : best,
					);
				}

				const historyId = `history-${languageId}-${part.partNumber}`;

				if (isInitialSpeed) {
					// Initial Speed専用表示
					html += `
                    <div class="part-section">
                        <div class="part-header">
                            <strong>Initial Speed Practice</strong>
                            <div class="part-latest">
                                📅 Latest: ${Utils.formatTimestamp(latestAttempt.timestamp)}<br>
                                ⚡ Average: ${Utils.formatReactionTime(latestAttempt.averageTime * 1000)} • 🎯 ${latestAttempt.accuracy}% • 📊 ${latestAttempt.trials} trials<br>
                                🏆 Best Average: ${Utils.formatReactionTime(bestAttempt.averageTime * 1000)} (${bestAttempt.attemptNumber}${Utils.getOrdinalSuffix(bestAttempt.attemptNumber)} attempt)<br>
                                📊 Attempts: ${part.attempts.length}
                            </div>
                            ${
															part.attempts.length > 1
																? `
                                <button class="history-toggle" onclick="Stats.toggleHistory('${historyId}')">
                                    ▼ View History (${part.attempts.length} attempts)
                                </button>
                            `
																: ""
														}
                        </div>
                        ${
													part.attempts.length > 1
														? `
                            <div class="part-history" id="${historyId}">
                                ${this.generateInitialSpeedHistoryTable(part.attempts, historyId)}
                            </div>
                        `
														: ""
												}
                    </div>
                `;
				} else {
					// 通常モード表示
					html += `
                    <div class="part-section">
                        <div class="part-header">
                            <strong>Part ${part.partNumber}/${part.totalParts}</strong>
                            <div class="part-latest">
                                📅 Latest: ${Utils.formatTimestamp(latestAttempt.timestamp)}<br>
                                ⏱ ${Utils.formatTime(latestAttempt.time)} • 🎯 ${latestAttempt.accuracy}% • ⚡ ${latestAttempt.wpm} WPM<br>
                                🏆 Best: ${bestAttempt.wpm} WPM (${bestAttempt.attemptNumber}${Utils.getOrdinalSuffix(bestAttempt.attemptNumber)} attempt)<br>
                                📊 Attempts: ${part.attempts.length}
                            </div>
                            ${
															part.attempts.length > 1
																? `
                                <button class="history-toggle" onclick="Stats.toggleHistory('${historyId}')">
                                    ▼ View History (${part.attempts.length} attempts)
                                </button>
                            `
																: ""
														}
                        </div>
                        ${
													part.attempts.length > 1
														? `
                            <div class="part-history" id="${historyId}">
                                ${this.generateHistoryTable(part.attempts, historyId)}
                            </div>
                        `
														: ""
												}
                    </div>
                `;
				}
			});

			html += `
                        <div class="language-actions">
                            <button class="language-delete-btn" onclick="Stats.deleteLanguageStats('${language}')" title="Delete all ${language} statistics">
                                🗑️ Delete ${language} Statistics
                            </button>
                        </div>
                    </div>
                </div>
            `;
		});

		statsListEl.innerHTML = html;
	},

	// 苦手文字統計の表示
	displayMistakeStats() {
		const mistakeStatsEl = document.getElementById("mistake-stats");

		if (!mistakeStatsEl) return;

		// 通常の苦手文字統計
		const topMistakes = Storage.getTopMistakeChars(5);

		// Initial Speed専用ミス統計（全言語合計）
		const initialSpeedMistakes = this.getTopInitialSpeedMistakes(5);

		if (topMistakes.length === 0 && initialSpeedMistakes.length === 0) {
			mistakeStatsEl.style.display = "none";
			return;
		}

		mistakeStatsEl.style.display = "block";
		const mistakeChartEl = document.getElementById("mistake-chart");

		if (mistakeChartEl) {
			let html = "";

			// 通常ミス統計
			if (topMistakes.length > 0) {
				html += '<div class="mistake-section">';
				html += `
					<div class="mistake-header" onclick="Stats.toggleMistakeSection('general-mistakes')">
						<span>General Typing Mistakes</span>
						<span class="expand-icon">▶</span>
					</div>
					<div class="mistake-content" id="general-mistakes">
						<div class="mistake-stats-grid">
				`;

				topMistakes.forEach(({ char, count }, index) => {
					const rank = index + 1;
					const percentage =
						topMistakes.length > 0 ? (count / topMistakes[0].count) * 100 : 0;

					html += `
						<div class="mistake-stat-item">
							<div class="mistake-rank">${rank}</div>
							<div class="mistake-char">${char}</div>
							<div class="mistake-count">${count}</div>
							<div class="mistake-bar">
								<div class="mistake-bar-fill" style="width: ${percentage}%"></div>
							</div>
						</div>
					`;
				});

				html += `
							</div>
							<div class="mistake-actions">
								<button class="mistake-delete-btn" onclick="Stats.deleteGeneralMistakes()" title="Clear all general typing mistakes">
									🗑️ Clear General Mistakes
								</button>
							</div>
						</div>
					</div>
				`;
			}

			// Initial Speedミス統計
			if (initialSpeedMistakes.length > 0) {
				html += '<div class="mistake-section">';
				html += `
					<div class="mistake-header" onclick="Stats.toggleMistakeSection('initial-speed-mistakes')">
						<span>Initial Speed Mistakes</span>
						<span class="expand-icon">▶</span>
					</div>
					<div class="mistake-content" id="initial-speed-mistakes">
						<div class="mistake-stats-grid">
				`;

				initialSpeedMistakes.forEach(({ mistake, count }, index) => {
					const rank = index + 1;
					const percentage =
						initialSpeedMistakes.length > 0
							? (count / initialSpeedMistakes[0].count) * 100
							: 0;

					html += `
						<div class="mistake-stat-item">
							<div class="mistake-rank">${rank}</div>
							<div class="mistake-char">${mistake}</div>
							<div class="mistake-count">${count}</div>
							<div class="mistake-bar">
								<div class="mistake-bar-fill" style="width: ${percentage}%"></div>
							</div>
						</div>
					`;
				});

				html += `
							</div>
							<div class="mistake-actions">
								<button class="mistake-delete-btn" onclick="Stats.deleteInitialSpeedMistakes()" title="Clear all Initial Speed mistakes">
									🗑️ Clear Initial Speed Mistakes
								</button>
							</div>
						</div>
					</div>
				`;
			}

			mistakeChartEl.innerHTML = html;
		}
	},

	// Initial Speed統合ミス統計の取得
	getTopInitialSpeedMistakes(limit = 5) {
		const initialSpeedData = Storage.getInitialSpeedMistakes();
		const combinedMistakes = {};

		// 全Initial Speedモードのミス統計を合計
		Object.keys(initialSpeedData).forEach((language) => {
			Object.entries(initialSpeedData[language]).forEach(([mistake, count]) => {
				combinedMistakes[mistake] = (combinedMistakes[mistake] || 0) + count;
			});
		});

		// ソートして上位を返す
		return Object.entries(combinedMistakes)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([mistake, count]) => ({ mistake, count }));
	},

	// 履歴テーブルの生成
	generateHistoryTable(attempts, tableId) {
		let html = `
            <table class="history-table" id="table-${tableId}">
                <thead>
                    <tr>
                        <th onclick="Stats.sortTable('${tableId}', 0, 'num')"># <span class="sort-arrow" id="sort-${tableId}-0">↕</span></th>
                        <th onclick="Stats.sortTable('${tableId}', 1, 'wpm')">WPM <span class="sort-arrow" id="sort-${tableId}-1">↕</span></th>
                        <th onclick="Stats.sortTable('${tableId}', 2, 'acc')">ACC <span class="sort-arrow" id="sort-${tableId}-2">↕</span></th>
                        <th onclick="Stats.sortTable('${tableId}', 3, 'time')">Time <span class="sort-arrow" id="sort-${tableId}-3">↕</span></th>
                    </tr>
                </thead>
                <tbody>
        `;

		const bestWPM = Math.max(...attempts.map((a) => a.wpm));

		attempts.forEach((attempt) => {
			const isBest = attempt.wpm === bestWPM;
			html += `
                <tr>
                    <td>${attempt.attemptNumber}${isBest ? "🏆" : ""}</td>
                    <td class="${isBest ? "best-record" : ""}">${attempt.wpm}</td>
                    <td>${attempt.accuracy}%</td>
                    <td>${Utils.formatTime(attempt.time)}</td>
                </tr>
            `;
		});

		html += `
                </tbody>
            </table>
        `;

		return html;
	},

	// Initial Speed履歴テーブルの生成
	generateInitialSpeedHistoryTable(attempts, tableId) {
		let html = `
            <table class="history-table" id="table-${tableId}">
                <thead>
                    <tr>
                        <th onclick="Stats.sortInitialSpeedTable('${tableId}', 0, 'num')"># <span class="sort-arrow" id="sort-${tableId}-0">↕</span></th>
                        <th onclick="Stats.sortInitialSpeedTable('${tableId}', 1, 'time')">AVG Time <span class="sort-arrow" id="sort-${tableId}-1">↕</span></th>
                        <th onclick="Stats.sortInitialSpeedTable('${tableId}', 2, 'acc')">ACC <span class="sort-arrow" id="sort-${tableId}-2">↕</span></th>
                        <th onclick="Stats.sortInitialSpeedTable('${tableId}', 3, 'trials')">Trials <span class="sort-arrow" id="sort-${tableId}-3">↕</span></th>
                    </tr>
                </thead>
                <tbody>
        `;

		const bestTime = Math.min(...attempts.map((a) => a.averageTime));

		attempts.forEach((attempt) => {
			const isBest = attempt.averageTime === bestTime;
			html += `
                <tr>
                    <td>${attempt.attemptNumber}${isBest ? "🏆" : ""}</td>
                    <td class="${isBest ? "best-record" : ""}">${Utils.formatReactionTime(attempt.averageTime * 1000)}</td>
                    <td>${attempt.accuracy}%</td>
                    <td>${attempt.trials}</td>
                </tr>
            `;
		});

		html += `
                </tbody>
            </table>
        `;

		return html;
	},

	// 言語セクションの開閉
	toggleLanguage(languageId) {
		const content = document.getElementById(languageId);
		const header = content.previousElementSibling;
		const icon = header.querySelector(".expand-icon");

		if (content.classList.contains("show")) {
			content.classList.remove("show");
			header.classList.remove("expanded");
			icon.textContent = "▶";
		} else {
			content.classList.add("show");
			header.classList.add("expanded");
			icon.textContent = "▼";
		}
	},

	// ミスセクションの開閉
	toggleMistakeSection(sectionId) {
		const content = document.getElementById(sectionId);
		const header = content.previousElementSibling;
		const icon = header.querySelector(".expand-icon");

		if (content.classList.contains("show")) {
			content.classList.remove("show");
			header.classList.remove("expanded");
			icon.textContent = "▶";
		} else {
			content.classList.add("show");
			header.classList.add("expanded");
			icon.textContent = "▼";
		}
	},

	// 言語別統計の削除
	deleteLanguageStats(language) {
		if (confirm(`Are you sure you want to delete all statistics for "${language}"? This action cannot be undone.`)) {
			const statsData = Storage.getStatsData();
			
			// 該当言語のデータを削除
			delete statsData[language];
			
			// 更新されたデータを保存
			Storage.saveStatsData(statsData);
			
			// Initial Speed専用ミス統計も該当言語があれば削除
			if (language.startsWith("Initial Speed")) {
				const initialSpeedMistakes = Storage.getInitialSpeedMistakes();
				delete initialSpeedMistakes[language];
				Storage.saveInitialSpeedMistakes(initialSpeedMistakes);
			}
			
			// 表示を更新
			this.updateDisplay();
		}
	},

	// 通常ミス統計の削除
	deleteGeneralMistakes() {
		if (confirm("Are you sure you want to clear all general typing mistakes? This action cannot be undone.")) {
			Storage.clearMistakeChars();
			this.updateDisplay();
		}
	},

	// Initial Speedミス統計の削除
	deleteInitialSpeedMistakes() {
		if (confirm("Are you sure you want to clear all Initial Speed mistakes? This action cannot be undone.")) {
			Storage.clearInitialSpeedMistakes();
			this.updateDisplay();
		}
	},

	// 履歴の表示切り替え
	toggleHistory(historyId) {
		const historyEl = document.getElementById(historyId);
		const button =
			historyEl.previousElementSibling.querySelector(".history-toggle");

		if (historyEl.classList.contains("show")) {
			historyEl.classList.remove("show");
			button.innerHTML = button.innerHTML.replace(
				"▲ Hide History",
				"▼ View History",
			);
		} else {
			historyEl.classList.add("show");
			button.innerHTML = button.innerHTML.replace(
				"▼ View History",
				"▲ Hide History",
			);
		}
	},

	// テーブルのソート
	sortTable(historyId, columnIndex, sortType) {
		const tableId = `table-${historyId}`;
		const table = document.getElementById(tableId);
		if (!table) return;

		const tbody = table.querySelector("tbody");
		const rows = Array.from(tbody.querySelectorAll("tr"));

		const currentSortKey = `${historyId}-${columnIndex}`;
		let direction = "desc";

		if (APP_STATE.currentSort[currentSortKey] === "desc") {
			direction = "asc";
		} else if (APP_STATE.currentSort[currentSortKey] === "asc") {
			direction = "original";
		}

		// ソート矢印をリセット
		table.querySelectorAll(".sort-arrow").forEach((arrow) => {
			arrow.textContent = "↕";
		});

		APP_STATE.currentSort = {};

		if (direction === "original") {
			// 元の順序に戻す
			rows.sort((a, b) => {
				const aNum = parseInt(a.cells[0].textContent);
				const bNum = parseInt(b.cells[0].textContent);
				return aNum - bNum;
			});
			const arrow = document.getElementById(`sort-${historyId}-0`);
			if (arrow) arrow.textContent = "↓";
		} else {
			APP_STATE.currentSort[currentSortKey] = direction;
			const arrow = document.getElementById(`sort-${historyId}-${columnIndex}`);
			if (arrow) arrow.textContent = direction === "desc" ? "↓" : "↑";

			rows.sort((a, b) => {
				let aVal, bVal;

				switch (sortType) {
					case "num":
						aVal = parseInt(a.cells[columnIndex].textContent);
						bVal = parseInt(b.cells[columnIndex].textContent);
						break;
					case "wpm":
						aVal = parseInt(a.cells[columnIndex].textContent);
						bVal = parseInt(b.cells[columnIndex].textContent);
						break;
					case "acc":
						aVal = parseInt(a.cells[columnIndex].textContent.replace("%", ""));
						bVal = parseInt(b.cells[columnIndex].textContent.replace("%", ""));
						break;
					case "time":
						aVal = Utils.parseTime(a.cells[columnIndex].textContent);
						bVal = Utils.parseTime(b.cells[columnIndex].textContent);
						break;
				}

				if (direction === "desc") {
					return bVal - aVal;
				} else {
					return aVal - bVal;
				}
			});
		}

		// テーブルを再構築
		tbody.innerHTML = "";
		rows.forEach((row) => tbody.appendChild(row));
	},

	// Initial Speedテーブルのソート
	sortInitialSpeedTable(historyId, columnIndex, sortType) {
		const tableId = `table-${historyId}`;
		const table = document.getElementById(tableId);
		if (!table) return;

		const tbody = table.querySelector("tbody");
		const rows = Array.from(tbody.querySelectorAll("tr"));

		const currentSortKey = `${historyId}-${columnIndex}`;
		let direction = "desc";

		if (APP_STATE.currentSort[currentSortKey] === "desc") {
			direction = "asc";
		} else if (APP_STATE.currentSort[currentSortKey] === "asc") {
			direction = "original";
		}

		// ソート矢印をリセット
		table.querySelectorAll(".sort-arrow").forEach((arrow) => {
			arrow.textContent = "↕";
		});

		APP_STATE.currentSort = {};

		if (direction === "original") {
			// 元の順序に戻す
			rows.sort((a, b) => {
				const aNum = parseInt(a.cells[0].textContent);
				const bNum = parseInt(b.cells[0].textContent);
				return aNum - bNum;
			});
			const arrow = document.getElementById(`sort-${historyId}-0`);
			if (arrow) arrow.textContent = "↓";
		} else {
			APP_STATE.currentSort[currentSortKey] = direction;
			const arrow = document.getElementById(`sort-${historyId}-${columnIndex}`);
			if (arrow) arrow.textContent = direction === "desc" ? "↓" : "↑";

			rows.sort((a, b) => {
				let aVal, bVal;

				switch (sortType) {
					case "num":
						aVal = parseInt(a.cells[columnIndex].textContent);
						bVal = parseInt(b.cells[columnIndex].textContent);
						break;
					case "time":
						// 反応時間をパースして比較（時間なので昇順が良い結果）
						const aTimeStr = a.cells[columnIndex].textContent.replace("s", "");
						const bTimeStr = b.cells[columnIndex].textContent.replace("s", "");
						aVal = parseFloat(aTimeStr);
						bVal = parseFloat(bTimeStr);
						break;
					case "acc":
						aVal = parseInt(a.cells[columnIndex].textContent.replace("%", ""));
						bVal = parseInt(b.cells[columnIndex].textContent.replace("%", ""));
						break;
					case "trials":
						aVal = parseInt(a.cells[columnIndex].textContent);
						bVal = parseInt(b.cells[columnIndex].textContent);
						break;
				}

				if (sortType === "time") {
					// 反応時間は昇順がより良い結果
					if (direction === "desc") {
						return aVal - bVal; // 昇順
					} else {
						return bVal - aVal; // 降順
					}
				} else {
					if (direction === "desc") {
						return bVal - aVal;
					} else {
						return aVal - bVal;
					}
				}
			});
		}

		// テーブルを再構築
		tbody.innerHTML = "";
		rows.forEach((row) => tbody.appendChild(row));
	},

	// ===== 新規グラフ関連関数 =====

	// 言語表示順序（HTMLの<select id="language">と同一順序）
	languageOrder: [
		'python', 'javascript', 'java', 'c', 'cpp', 'rust', 'lua',
		'typewell', 'typewell-english-words', 'initial-speed', 'word-practice', 'custom'
	],

	// 言語順序でソート
	sortLanguagesByOrder(languages) {
		const languageMap = {
			'python': 'Python',
			'javascript': 'JavaScript', 
			'java': 'Java',
			'c': 'C',
			'cpp': 'C++',
			'rust': 'Rust',
			'lua': 'Lua',
			'typewell': 'TypeWell Original',
			'typewell-english-words': 'TypeWell English Words',
			'initial-speed': 'Initial Speed',
			'word-practice': 'Word Practice',
			'custom': 'Custom'
		};

		return languages.sort((a, b) => {
			// 言語名から対応するキーを逆引き
			const getKeyByValue = (value) => {
				return Object.keys(languageMap).find(key => languageMap[key] === value);
			};

			const keyA = getKeyByValue(a) || a.toLowerCase();
			const keyB = getKeyByValue(b) || b.toLowerCase();

			const indexA = this.languageOrder.indexOf(keyA);
			const indexB = this.languageOrder.indexOf(keyB);

			// 定義済み言語は定義順序、未定義言語は末尾にアルファベット順
			if (indexA === -1 && indexB === -1) {
				return a.localeCompare(b);
			}
			if (indexA === -1) return 1;
			if (indexB === -1) return -1;
			return indexA - indexB;
		});
	},

	// Chart.jsインスタンス管理
	charts: {},

	// グラフエリア初期化
	initializeGraphArea() {
		this.setupGraphControls();
		this.setupGraphTabs();
		this.updateSummaryStats();
		this.initializeAllCharts();
		// 詳細ミス分析チャート（言語選択に依存しない）
		this.initMistakeChart();
	},

	// グラフコントロールの初期化
	setupGraphControls() {
		const languageFilter = document.getElementById('graph-language-filter');
		const periodFilter = document.getElementById('graph-period-filter');
		const metricFilter = document.getElementById('graph-metric-filter');

		if (languageFilter) {
			// 既存の統計データから言語リストを生成
			const statsData = Storage.getStatsData();
			const languages = Object.keys(statsData);
			
			languageFilter.innerHTML = '';
			if (languages.length > 0) {
				// 言語を定義順序でソート
				const sortedLanguages = this.sortLanguagesByOrder(languages);
				sortedLanguages.forEach(language => {
					const option = document.createElement('option');
					option.value = language;
					option.textContent = language;
					languageFilter.appendChild(option);
				});
			} else {
				const option = document.createElement('option');
				option.value = '';
				option.textContent = 'No data available';
				languageFilter.appendChild(option);
			}

			// イベントリスナー追加
			languageFilter.addEventListener('change', () => {
				this.updateGraphArea();
			});
		}

		if (periodFilter) {
			periodFilter.addEventListener('change', () => {
				this.updateGraphArea();
			});
		}

		if (metricFilter) {
			metricFilter.addEventListener('change', () => {
				this.updateGraphArea();
			});
		}
	},

	// グラフタブの初期化
	setupGraphTabs() {
		document.querySelectorAll('.graph-tab').forEach(tab => {
			tab.addEventListener('click', (e) => {
				const tabName = e.target.dataset.tab;
				this.switchGraphTab(tabName);
			});
		});
	},

	// タブ切り替え処理
	switchGraphTab(tabName) {
		// アクティブタブ更新
		document.querySelectorAll('.graph-tab').forEach(tab => {
			tab.classList.remove('active');
		});
		const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
		if (activeTab) {
			activeTab.classList.add('active');
		}

		// グラフコンテンツ切り替え
		document.querySelectorAll('.graph-content').forEach(content => {
			content.classList.remove('active');
		});
		const activeContent = document.getElementById(`${tabName}-graph`);
		if (activeContent) {
			activeContent.classList.add('active');
		}

		// 対応するグラフを初期化
		this.initializeChart(tabName);
	},

	// 全グラフの初期化
	initializeAllCharts() {
		// デフォルトでProgressチャートを表示
		this.initializeChart('progress');
	},

	// 個別グラフ初期化
	initializeChart(type) {
		const selectedLanguage = document.getElementById('graph-language-filter')?.value;
		if (!selectedLanguage) return;

		switch (type) {
			case 'progress':
				this.initProgressChart();
				break;
			case 'compare':
				this.initCompareChart();
				break;
			case 'speed':
				this.initSpeedChart();
				break;
			case 'keys':
				this.initKeysChart();
				break;
		}
	},

	// 動的色生成
	generateColors(count) {
		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		const baseColors = [
			getComputedColor('--progress-color'),
			getComputedColor('--correct-color'),
			getComputedColor('--incorrect-color'),
			getComputedColor('--pending-color'),
			getComputedColor('--current-bg')
		];

		const colors = [];
		const borderColors = [];

		for (let i = 0; i < count; i++) {
			if (i < baseColors.length) {
				colors.push(baseColors[i] + '80');
				borderColors.push(baseColors[i]);
			} else {
				const hue = (i * 137.5) % 360;
				const saturation = 60 + (i % 3) * 15;
				const lightness = document.body.hasAttribute('data-theme') ? 45 : 55;
				colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`);
				borderColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
			}
		}

		return { colors, borderColors };
	},

	// Chart.js共通オプション
	getChartOptions() {
		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		return {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					labels: {
						color: getComputedColor('--text-color'),
						font: {
							family: 'Courier New, monospace',
							size: 11
						}
					}
				}
			},
			scales: {
				x: {
					ticks: {
						color: getComputedColor('--pending-color'),
						font: {
							family: 'Courier New, monospace',
							size: 10
						}
					},
					grid: {
						color: getComputedColor('--border-color')
					}
				},
				y: {
					ticks: {
						color: getComputedColor('--pending-color'),
						font: {
							family: 'Courier New, monospace',
							size: 10
						}
					},
					grid: {
						color: getComputedColor('--border-color')
					}
				}
			}
		};
	},

	// サマリー統計の更新
	updateSummaryStats() {
		const statsData = Storage.getStatsData();
		const selectedLanguage = document.getElementById('graph-language-filter')?.value;

		let totalSessions = 0;
		let avgWpm = 0;
		let bestWpm = 0;
		let improvement = 0;

		if (selectedLanguage && statsData[selectedLanguage]) {
			const languageData = statsData[selectedLanguage];
			const allAttempts = [];

			languageData.parts.forEach(part => {
				allAttempts.push(...part.attempts);
			});

			if (allAttempts.length > 0) {
				totalSessions = allAttempts.length;

				if (selectedLanguage.startsWith('Initial Speed')) {
					// Initial Speed用統計
					const avgTime = allAttempts.reduce((sum, attempt) => sum + attempt.averageTime, 0) / allAttempts.length;
					const bestTime = Math.min(...allAttempts.map(a => a.averageTime));
					const firstTime = allAttempts[0].averageTime;

					document.getElementById('total-sessions').textContent = totalSessions;
					document.getElementById('avg-wpm').textContent = (avgTime * 1000).toFixed(0) + 'ms';
					document.getElementById('best-wpm').textContent = (bestTime * 1000).toFixed(0) + 'ms';
					document.getElementById('improvement').textContent = '-' + ((firstTime - bestTime) * 1000).toFixed(0) + 'ms';
				} else {
					// 通常モード用統計
					avgWpm = Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.wpm, 0) / allAttempts.length);
					bestWpm = Math.max(...allAttempts.map(a => a.wpm));
					improvement = bestWpm - allAttempts[0].wpm;

					document.getElementById('total-sessions').textContent = totalSessions;
					document.getElementById('avg-wpm').textContent = avgWpm;
					document.getElementById('best-wpm').textContent = bestWpm;
					document.getElementById('improvement').textContent = (improvement >= 0 ? '+' : '') + improvement;
				}
			}
		} else {
			// データがない場合のデフォルト値
			document.getElementById('total-sessions').textContent = '0';
			document.getElementById('avg-wpm').textContent = '0';
			document.getElementById('best-wpm').textContent = '0';
			document.getElementById('improvement').textContent = '+0';
		}
	},

	// グラフエリア更新（既存のupdateDisplayに統合）
	updateGraphArea() {
		this.updateSummaryStats();
		
		// アクティブタブのグラフを更新
		const activeTab = document.querySelector('.graph-tab.active');
		if (activeTab) {
			const tabType = activeTab.dataset.tab;
			this.initializeChart(tabType);
		}
		
		// 詳細ミス分析チャートも更新
		this.initMistakeChart();
	},

	// Progress Chart（パフォーマンス推移グラフ）
	initProgressChart() {
		const canvas = document.getElementById('progress-chart');
		if (!canvas) return;

		const selectedLanguage = document.getElementById('graph-language-filter')?.value;
		if (!selectedLanguage) return;

		// 既存のチャートを破棄
		if (this.charts.progress) {
			this.charts.progress.destroy();
		}

		const statsData = Storage.getStatsData();
		if (!statsData[selectedLanguage] || !statsData[selectedLanguage].parts.length) {
			// データがない場合
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Courier New';
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pending-color');
			ctx.textAlign = 'center';
			ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
			return;
		}

		const isInitialSpeed = selectedLanguage.startsWith('Initial Speed');
		const languageData = statsData[selectedLanguage];
		const allAttempts = [];
		
		languageData.parts.forEach(part => {
			allAttempts.push(...part.attempts);
		});

		if (allAttempts.length === 0) return;

		// ラベルとデータを準備
		const labels = allAttempts.map((_, index) => `Session ${index + 1}`);
		let data, yAxisLabel, datasetLabel;

		if (isInitialSpeed) {
			data = allAttempts.map(attempt => (attempt.averageTime * 1000).toFixed(0));
			yAxisLabel = 'Reaction Time (ms)';
			datasetLabel = 'Average Reaction Time';
		} else {
			data = allAttempts.map(attempt => attempt.wpm);
			yAxisLabel = 'Words Per Minute (WPM)';
			datasetLabel = 'WPM';
		}

		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		const options = this.getChartOptions();
		options.scales.y.title = {
			display: true,
			text: yAxisLabel,
			color: getComputedColor('--text-color'),
			font: {
				family: 'Courier New, monospace',
				size: 11
			}
		};

		if (isInitialSpeed) {
			options.scales.y.reverse = true; // 反応時間は短い方が上位
		}

		this.charts.progress = new Chart(canvas, {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					label: datasetLabel,
					data: data,
					borderColor: getComputedColor('--progress-color'),
					backgroundColor: getComputedColor('--progress-color') + '20',
					tension: 0.2,
					fill: true,
					pointBackgroundColor: getComputedColor('--progress-color'),
					pointBorderColor: getComputedColor('--progress-color'),
					pointRadius: 3,
					pointHoverRadius: 5
				}]
			},
			options: options
		});
	},

	// Compare Chart（言語別比較グラフ）
	initCompareChart() {
		const canvas = document.getElementById('compare-chart');
		if (!canvas) return;

		// 既存のチャートを破棄
		if (this.charts.compare) {
			this.charts.compare.destroy();
		}

		const statsData = Storage.getStatsData();
		const languages = Object.keys(statsData);

		if (languages.length === 0) {
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Courier New';
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pending-color');
			ctx.textAlign = 'center';
			ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
			return;
		}

		// 言語を定義順序でソート
		const sortedLanguages = this.sortLanguagesByOrder(languages);
		
		const languageStats = sortedLanguages.map(language => {
			const languageData = statsData[language];
			const allAttempts = [];
			
			languageData.parts.forEach(part => {
				allAttempts.push(...part.attempts);
			});

			if (allAttempts.length === 0) return null;

			const isInitialSpeed = language.startsWith('Initial Speed');
			let bestValue;

			if (isInitialSpeed) {
				bestValue = Math.min(...allAttempts.map(a => a.averageTime * 1000)); // ms
			} else {
				bestValue = Math.max(...allAttempts.map(a => a.wpm));
			}

			return {
				language: language,
				value: bestValue,
				sessions: allAttempts.length,
				isInitialSpeed: isInitialSpeed
			};
		}).filter(stat => stat !== null);

		if (languageStats.length === 0) return;

		const { colors, borderColors } = this.generateColors(languageStats.length);
		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		const options = this.getChartOptions();
		options.scales.y.title = {
			display: true,
			text: 'Best Performance',
			color: getComputedColor('--text-color'),
			font: {
				family: 'Courier New, monospace',
				size: 11
			}
		};

		this.charts.compare = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: languageStats.map(stat => stat.language),
				datasets: [{
					label: 'Best Performance',
					data: languageStats.map(stat => stat.value),
					backgroundColor: colors,
					borderColor: borderColors,
					borderWidth: 1
				}]
			},
			options: options
		});
	},

	// Speed Chart（Initial Speed分析グラフ）
	initSpeedChart() {
		const canvas = document.getElementById('speed-chart');
		if (!canvas) return;

		const selectedLanguage = document.getElementById('graph-language-filter')?.value;
		if (!selectedLanguage || !selectedLanguage.startsWith('Initial Speed')) {
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Courier New';
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pending-color');
			ctx.textAlign = 'center';
			ctx.fillText('Select an Initial Speed language', canvas.width / 2, canvas.height / 2);
			return;
		}

		// 既存のチャートを破棄
		if (this.charts.speed) {
			this.charts.speed.destroy();
		}

		const statsData = Storage.getStatsData();
		if (!statsData[selectedLanguage] || !statsData[selectedLanguage].parts.length) return;

		const languageData = statsData[selectedLanguage];
		const allAttempts = [];
		
		languageData.parts.forEach(part => {
			allAttempts.push(...part.attempts);
		});

		if (allAttempts.length === 0) return;

		// 散布図用データ準備
		const scatterData = allAttempts.map(attempt => ({
			x: attempt.averageTime * 1000, // ms
			y: attempt.accuracy
		}));

		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		const options = this.getChartOptions();
		options.scales.x.title = {
			display: true,
			text: 'Reaction Time (ms)',
			color: getComputedColor('--text-color'),
			font: {
				family: 'Courier New, monospace',
				size: 11
			}
		};
		options.scales.y.title = {
			display: true,
			text: 'Accuracy (%)',
			color: getComputedColor('--text-color'),
			font: {
				family: 'Courier New, monospace',
				size: 11
			}
		};

		this.charts.speed = new Chart(canvas, {
			type: 'scatter',
			data: {
				datasets: [{
					label: 'Reaction Time vs Accuracy',
					data: scatterData,
					backgroundColor: getComputedColor('--progress-color') + '60',
					borderColor: getComputedColor('--progress-color'),
					pointRadius: 4,
					pointHoverRadius: 6
				}]
			},
			options: options
		});
	},

	// Keys Chart（キーボード分析）
	initKeysChart() {
		// キーボードヒートマップを生成
		this.generateKeyboardHeatmap();

		const canvas = document.getElementById('keys-chart');
		if (!canvas) return;

		// 既存のチャートを破棄
		if (this.charts.keys) {
			this.charts.keys.destroy();
		}

		// 苦手文字データを取得
		const topMistakes = Storage.getTopMistakeChars(8);
		
		if (topMistakes.length === 0) {
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Courier New';
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pending-color');
			ctx.textAlign = 'center';
			ctx.fillText('No mistake data available', canvas.width / 2, canvas.height / 2);
			return;
		}

		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		const options = this.getChartOptions();
		options.scales.y.title = {
			display: true,
			text: 'Mistakes',
			color: getComputedColor('--text-color'),
			font: {
				family: 'Courier New, monospace',
				size: 11
			}
		};

		this.charts.keys = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: topMistakes.map(mistake => mistake.char),
				datasets: [{
					label: 'Mistake Count',
					data: topMistakes.map(mistake => mistake.count),
					backgroundColor: topMistakes.map((mistake, i) => {
						const intensity = mistake.count / Math.max(...topMistakes.map(m => m.count));
						return `rgba(244, 71, 71, ${0.3 + intensity * 0.7})`;
					}),
					borderColor: getComputedColor('--incorrect-color'),
					borderWidth: 1
				}]
			},
			options: options
		});
	},

	// キーボードヒートマップ生成
	generateKeyboardHeatmap() {
		const keyboard = document.getElementById('keyboard-heatmap');
		if (!keyboard) return;

		const keys = [
			'1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '', '', '',
			'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\', '', '',
			'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', '', '', '', '',
			'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', '', '', '', '', ''
		];

		// 苦手文字データを取得
		const topMistakes = Storage.getTopMistakeChars(50);
		const mistakeData = {};
		topMistakes.forEach(mistake => {
			mistakeData[mistake.char.toUpperCase()] = mistake.count;
		});

		const maxMistakes = Math.max(...Object.values(mistakeData), 1);

		keyboard.innerHTML = '';
		keys.forEach(key => {
			const keyEl = document.createElement('div');
			keyEl.className = 'key';
			keyEl.textContent = key;

			if (key && mistakeData[key]) {
				const intensity = Math.min(5, Math.ceil((mistakeData[key] / maxMistakes) * 5));
				keyEl.classList.add(`intensity-${intensity}`);
				keyEl.title = `${key}: ${mistakeData[key]} mistakes`;
			} else if (key) {
				keyEl.classList.add('intensity-0');
			}

			keyboard.appendChild(keyEl);
		});
	},

	// Mistake Chart（詳細ミス分析）
	initMistakeChart() {
		const canvas = document.getElementById('mistake-analysis-chart');
		if (!canvas) return;

		// 既存のチャートを破棄
		if (this.charts.mistake) {
			this.charts.mistake.destroy();
		}

		const topMistakes = Storage.getTopMistakeChars(8);
		
		if (topMistakes.length === 0) {
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.font = '14px Courier New';
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--pending-color');
			ctx.textAlign = 'center';
			ctx.fillText('No mistake data available', canvas.width / 2, canvas.height / 2);
			return;
		}

		const getComputedColor = (property) => {
			return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
		};

		this.charts.mistake = new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels: topMistakes.map(mistake => mistake.char),
				datasets: [{
					data: topMistakes.map(mistake => mistake.count),
					backgroundColor: topMistakes.map((mistake, i) => {
						const intensity = i / topMistakes.length;
						return `rgba(244, 71, 71, ${0.8 - intensity * 0.6})`;
					}),
					borderColor: getComputedColor('--incorrect-color'),
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: {
					legend: {
						position: 'right',
						labels: {
							color: getComputedColor('--text-color'),
							font: {
								family: 'Courier New, monospace',
								size: 10
							}
						}
					}
				}
			}
		});
	},
};
