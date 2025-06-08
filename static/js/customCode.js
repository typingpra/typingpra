// customCode.js - カスタムコード管理機能

const CustomCode = {
	// 言語選択リストの更新
	updateLanguageSelect() {
		const currentValue = DOM.langSel.value;

		// Customオプションを value 属性で確実に特定
		const customOption = DOM.langSel.querySelector('option[value="custom"]');
		if (!customOption) {
			console.error("Custom option not found");
			return;
		}

		// 保存されたカスタムコード用のオプションを削除（デフォルト言語、TypeWell、Initial Speed、Customオプションは保持）
		const allOptions = Array.from(DOM.langSel.children);
		allOptions.forEach((option) => {
			// デフォルト言語、TypeWell、Initial Speed、Customオプション以外を削除
			if (!SNIPPETS[option.value] && option.value !== "custom") {
				option.remove();
			}
		});

		// 保存されたカスタムコードをオプションとして追加（Customオプションの直前に挿入）
		const codes = Storage.getSavedCodes();
		Object.keys(codes).forEach((name) => {
			const option = document.createElement("option");
			option.value = name;

			// モード情報を含む表示名を作成
			const codeData = codes[name];
			if (typeof codeData === "object" && codeData.mode) {
				const modeLabel =
					codeData.mode === "typewell" ? " [TypeWell]" : " [Normal]";
				option.textContent = name + modeLabel;
			} else {
				// 後方互換性：文字列データの場合
				option.textContent = name + " [Normal]";
			}

			DOM.langSel.insertBefore(option, customOption);
		});

		// 選択値を復元（存在する場合）
		if (
			currentValue &&
			(SNIPPETS[currentValue] ||
				codes[currentValue] ||
				currentValue === "custom" ||
				currentValue === "typewell" ||
				currentValue === "initial-speed")
		) {
			DOM.langSel.value = currentValue;
		}
	},

	// 保存されたコード選択リストの更新
	updateSavedCodesSelect() {
		const codes = Storage.getSavedCodes();
		DOM.savedCodesSelect.innerHTML =
			'<option value="">-- Select saved code --</option>';

		Object.keys(codes).forEach((name) => {
			const option = document.createElement("option");
			option.value = name;

			// モード情報を含む表示名を作成
			const codeData = codes[name];
			if (typeof codeData === "object" && codeData.mode) {
				const modeLabel =
					codeData.mode === "typewell" ? " [TypeWell]" : " [Normal]";
				option.textContent = name + modeLabel;
			} else {
				// 後方互換性：文字列データの場合
				option.textContent = name + " [Normal]";
			}

			DOM.savedCodesSelect.appendChild(option);
		});

		// 言語選択リストも更新
		this.updateLanguageSelect();
	},

	// 選択されたカスタムモードを取得
	getSelectedCustomMode() {
		const normalRadio = document.getElementById("custom-normal");
		const typewellRadio = document.getElementById("custom-typewell");

		if (typewellRadio && typewellRadio.checked) return "typewell";
		if (normalRadio && normalRadio.checked) return "normal";

		// デフォルトは通常モード
		return "normal";
	},

	// カスタムモードの設定
	setCustomMode(mode) {
		const normalRadio = document.getElementById("custom-normal");
		const typewellRadio = document.getElementById("custom-typewell");

		if (mode === "typewell" && typewellRadio) {
			typewellRadio.checked = true;
		} else if (normalRadio) {
			normalRadio.checked = true;
		}
	},

	// カスタムコードの保存
	save() {
		const name = DOM.customNameInput.value.trim();
		const code = DOM.customCodeArea.value;
		const mode = this.getSelectedCustomMode();

		if (!name) {
			alert("Please enter a name for the code.");
			return;
		}

		if (!code.trim()) {
			alert("Please enter some code to save.");
			return;
		}

		const codes = Storage.getSavedCodes();

		// 新しい形式でデータを保存（モード情報を含む）
		codes[name] = {
			code: code,
			mode: mode,
			savedAt: new Date().toISOString(),
		};

		Storage.saveCodes(codes);
		this.updateSavedCodesSelect();
		DOM.savedCodesSelect.value = name;

		// 保存したコードを言語として選択
		DOM.langSel.value = name;
		DOM.customContainer.style.display = "none";
		DOM.toggleCustomBtn.textContent = "Custom";

		// TypeWellモードとInitial Speedモードのスタイルを削除
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

		// ページを再準備
		Typing.preparePages();
		Typing.resetState();
		Typing.renderPage();

		const modeText = mode === "typewell" ? "TypeWell Mode" : "Normal Mode";
		alert(`Code "${name}" saved successfully with ${modeText}!`);
	},

	// カスタムコードの読み込み
	load() {
		const selectedName = DOM.savedCodesSelect.value;
		if (!selectedName) {
			alert("Please select a code to load.");
			return;
		}

		const codes = Storage.getSavedCodes();
		if (codes[selectedName]) {
			const codeData = codes[selectedName];

			// 新しい形式（オブジェクト）か古い形式（文字列）かを判定
			if (typeof codeData === "object" && codeData.code) {
				// 新しい形式：コードとモード情報を読み込み
				DOM.customCodeArea.value = codeData.code;
				this.setCustomMode(codeData.mode || "normal");
			} else {
				// 後方互換性：古い形式（文字列）の場合
				DOM.customCodeArea.value = codeData;
				this.setCustomMode("normal"); // デフォルトは通常モード
			}

			DOM.customNameInput.value = selectedName;

			// TypeWellモードとInitial Speedモードのスタイルを削除（カスタムコードなので）
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

	// カスタムコードの削除
	delete() {
		const selectedName = DOM.savedCodesSelect.value;
		if (!selectedName) {
			alert("Please select a code to delete.");
			return;
		}

		if (confirm(`Are you sure you want to delete "${selectedName}"?`)) {
			const codes = Storage.getSavedCodes();
			delete codes[selectedName];
			Storage.saveCodes(codes);

			// 削除したコードが現在選択されている場合、デフォルトに戻す
			if (DOM.langSel.value === selectedName) {
				DOM.langSel.value = "python";

				// TypeWellモードとInitial Speedモードのスタイルを削除
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

			this.updateSavedCodesSelect();
			if (DOM.customNameInput.value === selectedName) {
				DOM.customNameInput.value = "";
			}
			alert(`Code "${selectedName}" deleted successfully!`);
		}
	},

	// カスタムコンテナの表示切り替え
	toggleContainer() {
		if (DOM.customContainer.style.display === "flex") {
			DOM.customContainer.style.display = "none";
			DOM.toggleCustomBtn.textContent = "Custom";
		} else {
			DOM.customContainer.style.display = "flex";
			DOM.toggleCustomBtn.textContent = "Close";
			DOM.langSel.value = "custom";

			// TypeWellモードとInitial Speedモードのスタイルを削除
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

	// ファイル選択ボタンのクリック処理
	chooseFile() {
		DOM.fileInput.click();
	},

	// ファイル選択時の処理
	handleFileSelect(event) {
		const file = event.target.files[0];
		if (!file) return;

		// ファイルサイズチェック（1MB制限）
		const maxSize = 1024 * 1024; // 1MB
		if (file.size > maxSize) {
			alert(
				`File size too large. Maximum size is 1MB.\nSelected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
			);
			// ファイル入力をリセット
			DOM.fileInput.value = "";
			return;
		}

		// ファイル名をNameフィールドに設定（拡張子含む）
		DOM.customNameInput.value = file.name;

		// ファイル読み込み
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const content = e.target.result;

				// 2バイト文字の簡易チェック
				const hasNonASCII = /[^\x00-\x7F]/.test(content);
				if (hasNonASCII) {
					const proceed = confirm(
						"This file contains non-ASCII characters (such as Japanese, Chinese, etc.) which may not display correctly.\n\n" +
							"Do you want to continue loading this file?",
					);
					if (!proceed) {
						// ファイル入力をリセット
						DOM.fileInput.value = "";
						DOM.customNameInput.value = "";
						return;
					}
				}

				// コンテンツをテキストエリアに設定
				DOM.customCodeArea.value = content;

				// ページを再準備（自動保存はしない）
				if (DOM.langSel.value === "custom") {
					// TypeWellモードとInitial Speedモードのスタイルを削除（カスタムコードなので）
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

				// 成功メッセージ
				alert(
					`File "${file.name}" loaded successfully!\nRemember to save if you want to keep it.`,
				);
			} catch (error) {
				alert(`Error reading file: ${error.message}`);
				console.error("File reading error:", error);
			}

			// ファイル入力をリセット（同じファイルを再選択できるように）
			DOM.fileInput.value = "";
		};

		reader.onerror = () => {
			alert("Error reading file. Please try again.");
			console.error("FileReader error:", reader.error);
			// ファイル入力をリセット
			DOM.fileInput.value = "";
			DOM.customNameInput.value = "";
		};

		// ファイルをテキストとして読み込み
		reader.readAsText(file);
	},

	// カスタムコードのモード情報を取得
	getCustomCodeMode(codeName) {
		const codes = Storage.getSavedCodes();
		const codeData = codes[codeName];

		if (typeof codeData === "object" && codeData.mode) {
			return codeData.mode;
		}

		// 後方互換性：古い形式またはデフォルト
		return "normal";
	},

	// カスタムコードのコンテンツを取得
	getCustomCodeContent(codeName) {
		const codes = Storage.getSavedCodes();
		const codeData = codes[codeName];

		if (typeof codeData === "object" && codeData.code) {
			return codeData.code;
		} else if (typeof codeData === "string") {
			// 後方互換性：古い形式
			return codeData;
		}

		return "";
	},
};
