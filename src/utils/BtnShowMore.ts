export function btnShowMore() {
  document
    .querySelectorAll<HTMLElement>("[data-showmore=true]")
    .forEach((parent) => {
      if (parent) {
        parent.addEventListener("click", (e) => {
          const target = e.target;
          if (!(target instanceof HTMLButtonElement)) return;
          if (target.getAttribute("data-btnShowMore") === "true") {
            const isPressed = target.getAttribute("aria-expanded") === "true";
            const parentShowMore = parent.querySelector(
              `#${target.getAttribute("aria-controls")}`
            );

            const showCount = parseInt(
              parentShowMore?.getAttribute("data-show") || "1",
              10
            );
            console.log(showCount);
            target.setAttribute("aria-expanded", String(!isPressed));

            parentShowMore
              ?.querySelectorAll<HTMLLIElement>(
                ` & > li:nth-child(n+${showCount + 1})`
              )
              .forEach((li) => {
                li.hidden = isPressed ? true : false; // toggle visibility
              });

            // Optional: change button text
            target.textContent = isPressed ? "عرض المزيد" : "عرض أقل";
          }
        });
      }
    });
}
