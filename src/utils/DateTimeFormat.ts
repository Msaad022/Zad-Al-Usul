export function dateFormatSE(element: string) {
  document.querySelectorAll<HTMLSpanElement>(element).forEach((el) => {
    const startY = el.getAttribute("data-ys");
    const endY = el.getAttribute("data-ye");
    if (!startY) return; // تجاهل لو مفيش تاريخ

    const start = new Date(startY);
    const now = !endY || endY == "0000" ? new Date() : new Date(endY);

    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    type TimeUnit = "year" | "month" | "day" | "hour" | "minute" | "second";

    // نجيب اللغة من الـ <html lang="..."> أو fallback عربي
    const lang = document.documentElement.lang || "ar";
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

    const formatUnit = (value: number, unit: TimeUnit) => {
      let text = rtf.format(-value, unit);
      // لو عربي نشيل "قبل" عشان تبقى مدة فقط
      if (lang.startsWith("ar")) {
        text = text.replace("قبل ", "");
      }
      return text;
    };

    const parts: string[] = [];
    if (years) parts.push(formatUnit(years, "year"));
    if (remainingMonths) parts.push(formatUnit(remainingMonths, "month"));

    el.textContent = parts.length
      ? parts.join(" و ")
      : lang.startsWith("ar")
      ? "أقل من شهر"
      : "Less than a month";
  });
}
//  dateFormatSE("span[data-duration='format']")
