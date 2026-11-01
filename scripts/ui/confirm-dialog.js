/**
 * Compact yes/no confirm built on Foundry DialogV2.
 * The window is about 400px wide and only as tall as its text.
 * Yes and No share the footer at equal width.
 * `content` is HTML placed inside the dialog shell. The caller escapes text it did not write.
 * Closing the window is the same as No.
 */
export async function confirm({
  title = "Confirm",
  content = "",
  yesLabel = "Yes",
  noLabel = "No",
  danger = false
} = {}, dialog = globalThis.foundry?.applications?.api?.DialogV2) {
  if (typeof dialog?.confirm !== "function") throw new Error("Morelord confirm requires Foundry DialogV2.");
  const classes = ["ml-window", "ml-confirm-dialog"];
  if (danger === true) classes.push("ml-confirm-dialog--danger");
  const accepted = await dialog.confirm({
    classes,
    window: { title: String(title || "Confirm") },
    position: { width: 400, height: "auto" },
    modal: true,
    rejectClose: false,
    content: `<div><div class="ml-app ml-app-shell ml-dialog-shell">${String(content ?? "")}</div></div>`,
    yes: { label: String(yesLabel || "Yes"), default: danger !== true },
    no: { label: String(noLabel || "No"), default: danger === true }
  });
  return accepted === true;
}
