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
			return;
		}

		// 苦手文字統計を表示（通常モードとInitial Speed統計の両方）
		this.displayMistakeStats();

		let html = "";

		Object.keys(statsData).forEach((language) => {
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
};
