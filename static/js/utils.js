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
		} else if (SNIPPETS[DOM.langSel.value]) {
			return SNIPPETS[DOM.langSel.value];
		} else {
			// 保存されたカスタムコードの場合
			return CustomCode.getCustomCodeContent(DOM.langSel.value);
		}
	},

	// TypeWellオリジナルモード - ランダム文字生成
	generateTypeWellCode() {
		const CHARS_PER_LINE = 36;
		const TOTAL_LINES = 10;

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
				// TypeWellモードでは行頭にも空白を許可
				const randomIndex = Math.floor(Math.random() * allChars.length);
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

		if (lowercaseRadio && lowercaseRadio.checked) return "lowercase";
		if (mixedRadio && mixedRadio.checked) return "mixed";
		if (symbolsRadio && symbolsRadio.checked) return "symbols";

		// デフォルトは小文字のみ
		return "lowercase";
	},
};
