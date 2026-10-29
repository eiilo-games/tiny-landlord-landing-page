// Page navigation. Keeps the sticky header's height in --header-h, so links
// to a section land below the header, and marks the section being read in
// the header's section links (aria-current="location"), scrolling that link
// into view when the links scroll sideways on a phone. Without JavaScript the
// links still work; anchors then use the stylesheet's fallback height.
// Nothing is stored anywhere.
(() => {
	const header = document.querySelector(".top");
	if (!header) return;
	const root = document.documentElement;
	const setHeight = () => root.style.setProperty("--header-h", `${header.offsetHeight}px`);
	setHeight();
	addEventListener("resize", setHeight);

	const nav = header.querySelector(".sections");
	const links = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
	const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
	if (!links.length || targets.some((t) => !t)) return;

	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	let current = -1;

	function mark(i) {
		if (i === current) return;
		current = i;
		links.forEach((a, j) => {
			if (j === i) a.setAttribute("aria-current", "location");
			else a.removeAttribute("aria-current");
		});
		if (nav.scrollWidth > nav.clientWidth) {
			// Centre it in the sideways list (back to the start above the first
			// section); scrollIntoView would also move the page.
			const a = links[i];
			nav.scrollTo({
				left: a ? a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2 : 0,
				behavior: reduced.matches ? "instant" : "smooth",
			});
		}
	}

	// The section being read is the last one whose top has passed a line a
	// third of the way down the space under the header; at the very bottom of
	// the page it is the last one, however short.
	function update() {
		const line = header.offsetHeight + (innerHeight - header.offsetHeight) / 3;
		let i = -1;
		targets.forEach((t, j) => { if (t.getBoundingClientRect().top <= line) i = j; });
		if (innerHeight + scrollY >= root.scrollHeight - 2) i = targets.length - 1;
		mark(i);
	}

	let frame = 0;
	addEventListener("scroll", () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(update);
	}, { passive: true });
	update();
})();
