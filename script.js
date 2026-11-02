"use strict";

// elements from the page
const display = document.getElementById("display");
const keypad = document.querySelector(".keypad");

// what the user typed, example: "78-11"
let expression = "";
// true right after "=" (or an error), so the next number starts fresh
let showingResult = false;

// ---------- show on screen ----------

function updateDisplay() {
  // textContent (not innerHTML) so nothing typed can run as code
  display.textContent = expression === "" ? "0" : expression;
  display.scrollLeft = display.scrollWidth; // keep the last digits visible
}

// ---------- typing ----------

function clearAll() {
  expression = "";
  showingResult = false;
}

// after a result, typing a new number starts a new calculation
function startNewIfNeeded() {
  if (showingResult) {
    clearAll();
  }
}

function addNumber(number) {
  startNewIfNeeded();
  expression += number;
}

function addDot() {
  startNewIfNeeded();

  // look only at the number being typed now ("5+3." -> "3.")
  const parts = expression.split(/[+*/-]/);
  const currentNumber = parts[parts.length - 1];

  if (currentNumber.includes(".")) return; // only one dot per number

  expression += currentNumber === "" ? "0." : ".";
}

function addOperator(operator) {
  if (expression === "Error") return;

  // empty screen: only a minus is allowed (negative number)
  if (expression === "") {
    if (operator === "-") expression = "-";
    return;
  }
  if (expression === "-") return;

  // two operators in a row: the new one replaces the old one
  const lastChar = expression[expression.length - 1];
  if ("+-*/.".includes(lastChar)) {
    expression = expression.slice(0, -1) + operator;
  } else {
    expression += operator;
  }

  showingResult = false; // allows to continue with the result
}

function deleteLast() {
  if (showingResult) {
    clearAll();
    return;
  }
  expression = expression.slice(0, -1);
}

// ---------- calculating (no eval, it is not safe) ----------

// "5+3*2" -> [5, "+", 3, "*", 2]
function getTokens(text) {
  const tokens = [];
  let number = "";

  for (const char of text) {
    if ("+-*/".includes(char) && number !== "") {
      tokens.push(Number(number));
      tokens.push(char);
      number = "";
    } else {
      number += char; // digits, dots, and a minus at the start
    }
  }
  tokens.push(Number(number));

  return tokens;
}

function solve(tokens) {
  // step 1: do * and / first
  const afterStep1 = [tokens[0]];

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const next = tokens[i + 1];
    const last = afterStep1.length - 1;

    if (operator === "*") {
      afterStep1[last] = afterStep1[last] * next;
    } else if (operator === "/") {
      afterStep1[last] = afterStep1[last] / next;
    } else {
      afterStep1.push(operator, next);
    }
  }

  // step 2: now do + and -
  let result = afterStep1[0];

  for (let i = 1; i < afterStep1.length; i += 2) {
    if (afterStep1[i] === "+") {
      result = result + afterStep1[i + 1];
    } else {
      result = result - afterStep1[i + 1];
    }
  }

  return result;
}

function calculate() {
  if (showingResult) return;

  // remove operator or dot at the end ("5+" -> "5")
  while (expression !== "" && "+-*/.".includes(expression[expression.length - 1])) {
    expression = expression.slice(0, -1);
  }
  if (expression === "") return;

  let result = solve(getTokens(expression));
  result = Number(result.toFixed(10)); // 0.1+0.2 -> 0.3

  // divide by 0 gives Infinity or NaN. Very big/small numbers contain "e"
  if (!Number.isFinite(result) || String(result).includes("e")) {
    expression = "Error";
  } else {
    expression = String(result);
  }
  showingResult = true;
}

// ---------- buttons and keyboard ----------

function handleKey(action, value) {
  if (action === "number") addNumber(value);
  else if (action === "dot") addDot();
  else if (action === "operator") addOperator(value);
  else if (action === "delete") deleteLast();
  else if (action === "clear") clearAll();
  else if (action === "equals") calculate();

  updateDisplay();
}

// one listener for all the buttons
keypad.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (button === null) return;

  handleKey(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return; // keep browser shortcuts

  const key = event.key;

  if (key >= "0" && key <= "9") handleKey("number", key);
  else if (key === ".") handleKey("dot");
  else if (key.length === 1 && "+-*/".includes(key)) handleKey("operator", key);
  else if (key === "Enter" || key === "=") handleKey("equals");
  else if (key === "Backspace") handleKey("delete");
  else if (key === "Escape") handleKey("clear");
  else return; // any other key: do nothing

  event.preventDefault(); // stops Enter from clicking a focused button twice
});
