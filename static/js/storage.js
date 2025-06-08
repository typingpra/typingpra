// storage.js - localStorage操作のラッパー関数

const Storage = {
	// 基本的なlocalStorage操作
	set(key, value) {
		try {
			localStorage.setItem(key, value);
			return true;
		} catch (e) {
			console.warn("localStorage is not available:", e);
			return false;
		}
	},

	get(key) {
		try {
			return localStorage.getItem(key);
		} catch (e) {
			console.warn("localStorage is not available:", e);
			return null;
		}
	},

	remove(key) {
		try {
			localStorage.removeItem(key);
			return true;
		} catch (e) {
			console.warn("localStorage is not available:", e);
			return false;
		}
	},

	// JSON形式でのデータ保存・取得
	setJSON(key, data) {
		try {
			return this.set(key, JSON.stringify(data));
		} catch (e) {
			console.warn("Failed to stringify data:", e);
			return false;
		}
	},

	getJSON(key, defaultValue = null) {
		try {
			const data = this.get(key);
			return data ? JSON.parse(data) : defaultValue;
		} catch (e) {
			console.warn("Failed to parse data:", e);
			return defaultValue;
		}
	},

	// 特定のデータタイプ用のメソッド
	getSavedCodes() {
		return this.getJSON(CONSTANTS.STORAGE_KEYS.CODES, {});
	},

	saveCodes(codes) {
		return this.setJSON(CONSTANTS.STORAGE_KEYS.CODES, codes);
	},

	getStatsData() {
		return this.getJSON(CONSTANTS.STORAGE_KEYS.RESULTS, {});
	},

	saveStatsData(data) {
		return this.setJSON(CONSTANTS.STORAGE_KEYS.RESULTS, data);
	},

	getTheme() {
		return this.get(CONSTANTS.STORAGE_KEYS.THEME);
	},

	saveTheme(theme) {
		if (theme === "light") {
			return this.set(CONSTANTS.STORAGE_KEYS.THEME, theme);
		} else {
			// ダークモードの場合は削除
			return this.remove(CONSTANTS.STORAGE_KEYS.THEME);
		}
	},

	// テキストラップ設定の操作
	getTextWrap() {
		const value = this.get(CONSTANTS.STORAGE_KEYS.TEXT_WRAP);
		return value === "true"; // 文字列 "true" をbooleanに変換
	},

	saveTextWrap(enabled) {
		return this.set(
			CONSTANTS.STORAGE_KEYS.TEXT_WRAP,
			enabled ? "true" : "false",
		);
	},

	// 休憩設定の操作
	getBreakChars() {
		const value = this.get(CONSTANTS.STORAGE_KEYS.BREAK_CHARS);
		if (value === null) {
			return CONSTANTS.BREAK_SETTINGS.DEFAULT_CHARS; // デフォルト値
		}
		const parsed = parseInt(value, 10);
		return isNaN(parsed) ? CONSTANTS.BREAK_SETTINGS.DEFAULT_CHARS : parsed;
	},

	saveBreakChars(chars) {
		const value = parseInt(chars, 10);
		if (isNaN(value)) {
			return false;
		}
		return this.set(CONSTANTS.STORAGE_KEYS.BREAK_CHARS, value.toString());
	},

	// 苦手文字データの操作
	getMistakeChars() {
		return this.getJSON(CONSTANTS.STORAGE_KEYS.MISTAKE_CHARS, {});
	},

	saveMistakeChars(data) {
		return this.setJSON(CONSTANTS.STORAGE_KEYS.MISTAKE_CHARS, data);
	},

	// 苦手文字の記録
	recordMistakeChar(char) {
		const data = this.getMistakeChars();

		// 特殊文字の表示名変換
		let displayChar = char;
		if (char === " ") displayChar = "Space";
		else if (char === "\n") displayChar = "Enter";
		else if (char === "\t") displayChar = "Tab";

		if (data[displayChar]) {
			data[displayChar]++;
		} else {
			data[displayChar] = 1;
		}

		this.saveMistakeChars(data);
	},

	// 上位苦手文字の取得
	getTopMistakeChars(limit = 10) {
		const data = this.getMistakeChars();
		const sorted = Object.entries(data)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit);

		return sorted.map(([char, count]) => ({ char, count }));
	},

	// 苦手文字データのクリア
	clearMistakeChars() {
		return this.remove(CONSTANTS.STORAGE_KEYS.MISTAKE_CHARS);
	},

	// タイプウェルカウントダウン秒数の取得
	getTypewellCountdown() {
		const value = this.get(CONSTANTS.STORAGE_KEYS.TYPEWELL_COUNTDOWN);
		if (value === null) {
			return CONSTANTS.TYPEWELL_SETTINGS.DEFAULT_COUNTDOWN;
		}
		const parsed = parseInt(value, 10);
		return isNaN(parsed)
			? CONSTANTS.TYPEWELL_SETTINGS.DEFAULT_COUNTDOWN
			: Math.max(
					CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN,
					Math.min(parsed, CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN),
				);
	},

	// タイプウェルカウントダウン秒数の保存
	saveTypewellCountdown(seconds) {
		const value = parseInt(seconds, 10);
		if (isNaN(value)) return false;

		// 範囲制限
		const clamped = Math.max(
			CONSTANTS.TYPEWELL_SETTINGS.MIN_COUNTDOWN,
			Math.min(value, CONSTANTS.TYPEWELL_SETTINGS.MAX_COUNTDOWN),
		);

		return this.set(
			CONSTANTS.STORAGE_KEYS.TYPEWELL_COUNTDOWN,
			clamped.toString(),
		);
	},

	// Initial Speed専用ミス統計の操作
	getInitialSpeedMistakes() {
		return this.getJSON(CONSTANTS.STORAGE_KEYS.INITIAL_SPEED_MISTAKES, {});
	},

	saveInitialSpeedMistakes(data) {
		return this.setJSON(CONSTANTS.STORAGE_KEYS.INITIAL_SPEED_MISTAKES, data);
	},

	// Initial Speedミス文字の記録
	recordInitialSpeedMistake(language, expectedChar, inputChar) {
		const data = this.getInitialSpeedMistakes();

		if (!data[language]) {
			data[language] = {};
		}

		const mistakeKey = Utils.generateMistakeKey(expectedChar, inputChar);

		if (data[language][mistakeKey]) {
			data[language][mistakeKey]++;
		} else {
			data[language][mistakeKey] = 1;
		}

		this.saveInitialSpeedMistakes(data);
	},

	// Initial Speed上位ミス文字の取得
	getTopInitialSpeedMistakes(language, limit = 10) {
		const data = this.getInitialSpeedMistakes();
		if (!data[language]) {
			return [];
		}

		const sorted = Object.entries(data[language])
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit);

		return sorted.map(([mistake, count]) => ({ mistake, count }));
	},

	// Initial Speed専用ミス統計のクリア
	clearInitialSpeedMistakes() {
		return this.remove(CONSTANTS.STORAGE_KEYS.INITIAL_SPEED_MISTAKES);
	},

	// データエクスポート機能
	exportData() {
		try {
			// 現在の日時を取得
			const now = new Date();
			const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);

			// 全localStorageデータを収集
			const exportData = {
				version: "1.0.0",
				exportDate: now.toISOString(),
				data: {},
			};

			// 各キーのデータを収集
			Object.values(CONSTANTS.STORAGE_KEYS).forEach((key) => {
				const data = this.get(key);
				if (data !== null) {
					exportData.data[key] = data;
				}
			});

			// JSONファイルとしてダウンロード
			const jsonString = JSON.stringify(exportData, null, 2);
			const blob = new Blob([jsonString], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = `typing-practice-data-${timestamp}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			return true;
		} catch (error) {
			console.error("Export failed:", error);
			throw new Error(`Failed to export data: ${error.message}`);
		}
	},

	// データインポート機能
	importData(file) {
		return new Promise((resolve, reject) => {
			if (!file) {
				reject(new Error("No file selected"));
				return;
			}

			if (!file.name.toLowerCase().endsWith(".json")) {
				reject(new Error("Invalid file format. Please select a JSON file."));
				return;
			}

			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const jsonData = JSON.parse(e.target.result);

					// データ形式の基本チェック
					if (!jsonData.version || !jsonData.data) {
						reject(
							new Error("Invalid data format. Missing version or data fields."),
						);
						return;
					}

					// バージョンチェック
					const currentVersion = "1.0.0";
					if (jsonData.version !== currentVersion) {
						const proceed = confirm(
							`Data version mismatch!\n\n` +
								`File version: ${jsonData.version}\n` +
								`Current version: ${currentVersion}\n\n` +
								`The data format may be incompatible. Do you want to continue importing?`,
						);
						if (!proceed) {
							reject(
								new Error("Import cancelled by user due to version mismatch."),
							);
							return;
						}
					}

					// インポート確認
					const confirmImport = confirm(
						`This will completely replace all your current data including:\n\n` +
							`• Theme settings\n` +
							`• Text wrap settings\n` +
							`• Break settings\n` +
							`• Custom codes\n` +
							`• Statistics\n` +
							`• Mistake characters\n` +
							`• Initial Speed data\n\n` +
							`This action cannot be undone. Are you sure you want to continue?`,
					);

					if (!confirmImport) {
						reject(new Error("Import cancelled by user."));
						return;
					}

					// 既存データをクリア
					Object.values(CONSTANTS.STORAGE_KEYS).forEach((key) => {
						this.remove(key);
					});

					// 新しいデータをインポート
					let importedCount = 0;
					Object.entries(jsonData.data).forEach(([key, value]) => {
						if (Object.values(CONSTANTS.STORAGE_KEYS).includes(key)) {
							this.set(key, value);
							importedCount++;
						}
					});

					resolve({
						success: true,
						message: `Successfully imported ${importedCount} data items.`,
						importedCount: importedCount,
						exportDate: jsonData.exportDate || "Unknown",
					});
				} catch (parseError) {
					reject(new Error(`Failed to parse JSON file: ${parseError.message}`));
				}
			};

			reader.onerror = () => {
				reject(new Error("Failed to read file. Please try again."));
			};

			reader.readAsText(file);
		});
	},
};
