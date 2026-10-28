"use strict";

const STORAGE_KEY = "kakeiboEntries";

const form = document.querySelector("#entry-form");
const entryList = document.querySelector("#entry-list");
const balanceOutput = document.querySelector("#balance");
const appMessage = document.querySelector("#app-message");
const submitButton = form.querySelector('button[type="submit"]');
const yenFormatter = new Intl.NumberFormat("ja-JP");

let entries = [];
let storageReady = false;

function isValidEntry(entry) {
  if (
    entry === null ||
    typeof entry !== "object" ||
    typeof entry.date !== "string" ||
    typeof entry.item !== "string" ||
    !["expense", "income"].includes(entry.type) ||
    !Number.isSafeInteger(entry.amount) ||
    entry.amount <= 0
  ) {
    return false;
  }

  const parsedDate = new Date(`${entry.date}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === entry.date &&
    entry.item.trim().length > 0
  );
}

function showMessage(message) {
  appMessage.textContent = message;
}

function renderEntries() {
  entryList.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録されたデータはありません。";
    row.append(cell);
    entryList.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "income" ? "収入" : "支出",
        `${yenFormatter.format(entry.amount)}円`,
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      entryList.append(row);
    }
  }

  const balance = entries.reduce(
    (total, entry) =>
      total + (entry.type === "income" ? entry.amount : -entry.amount),
    0,
  );
  balanceOutput.textContent = `${yenFormatter.format(balance)}円`;
}

function loadEntries() {
  try {
    const savedEntries = localStorage.getItem(STORAGE_KEY);

    if (savedEntries !== null) {
      const parsedEntries = JSON.parse(savedEntries);
      if (!Array.isArray(parsedEntries) || !parsedEntries.every(isValidEntry)) {
        throw new Error("保存データの形式が正しくありません。");
      }
      entries = parsedEntries;
    }

    storageReady = true;
    submitButton.disabled = false;
    renderEntries();
  } catch (error) {
    storageReady = false;
    submitButton.disabled = true;
    renderEntries();
    showMessage(
      `保存データを読み込めませんでした。データを保護するため登録を停止しました。${error.message}`,
    );
    console.error("家計簿データの読み込みに失敗しました。", error);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageReady) {
    showMessage("保存データを確認できないため、登録できません。");
    return;
  }

  const formData = new FormData(form);
  const entry = {
    date: String(formData.get("date")),
    item: String(formData.get("item")).trim(),
    type: String(formData.get("type")),
    amount: Number(formData.get("amount")),
  };

  if (!isValidEntry(entry)) {
    showMessage("入力内容を確認してください。金額は1円以上の整数で入力してください。");
    return;
  }

  const updatedEntries = [...entries, entry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    showMessage("データを保存できませんでした。ブラウザーの保存領域を確認してください。");
    console.error("家計簿データの保存に失敗しました。", error);
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  showMessage("家計簿に追加しました。");
});

loadEntries();
