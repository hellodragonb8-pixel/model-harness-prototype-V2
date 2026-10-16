/* Choose your model and harness: "Open the pickers". The section's scroll beat: the session comes apart into three
 * rows, and each turn opens a row's real picker beside the session.
 *
 * Its rules: the session's frame never moves, nothing moves against the scroll, and it ends on the plain Copilot
 * session. In each turn the row's picker opens beside the session, the choice moves to its new item, the row rolls to
 * it, and the picker closes. Each row is named at the left in plain words, and
 * a line under the session reads the whole configuration. The beat visits only configurations the product offers:
 * Codex, its ChatGPT models, a ChatGPT account; Claude, its Anthropic models, your Anthropic API key; then Copilot.
 *
 * It autoplays: one scroll brings the section into place, it plays once (about 8 seconds) and stops on the plain
 * Copilot session, and the next scroll moves on. Every frame is a pure function of the playhead (u, 0 to 1), so the
 * review stops can jump anywhere. Motion is transform and opacity, except the rows' clip box, which grows like the
 * panel it is.
 *
 *   ?u=0.42     a still frame at u (for review and screenshots)
 *   ?motion=off reduced motion: the still at Claude's key, no autoplay (also with prefers-reduced-motion)
 */
(() => {
	'use strict';
	const D = window.APART.data;
	const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
	const range = (p, a, b) => clamp((p - a) / (b - a));
	const lerp = (a, b, t) => a + (b - a) * t;
	const io = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
	const out = t => 1 - (1 - t) ** 3;
	const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
	const code = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
	const ic = (n, c = '') => `<i class="codicon codicon-${n}${c ? ' ' + c : ''}" aria-hidden="true"></i>`;
	const div = (cls, html = '') => {
		const d = document.createElement('div');
		d.className = cls;
		d.innerHTML = html;
		return d;
	};

	// ------------------------------------------------------------------ the session's design space

	const SW = 320;
	const SH = 540;
	const FOOT = 96;
	const CONV = SH - FOOT;
	// The rows: tall and spaced apart, so they read as layers at the session's scale.
	const CTL = 44;
	const G = 8;
	const LIFT = 3 * CTL + 4 * G;
	const rowTop = i => CONV - G - (3 - i) * CTL - (2 - i) * G;
	const LAYERS = ['harness', 'model', 'access'];
	// The page's header and download notice (CSS --nav-h, --notice-h).
	const NAV = 88;
	const NOTICE = 26;

	const SESSION = window.HfSession || {
		title: 'Migrate api-gateway',
		prompt: 'Finish the auth-core v2 migration in api-gateway. Read `session.ts` and `AGENTS.md` first, and ask me before you touch `RedisSessionStore`.',
		reply: '`auth.ts` and `orders.ts` still read the cookie session, and production runs on `RedisSessionStore`.',
	};

	// ------------------------------------------------------------------ the configurations

	// The beat's configurations, in order, then back to the first. Each roll has one state per configuration.
	const CONFIGS = ['copilot', 'codex', 'claude', 'copilot'];
	const PICK = {
		copilot: { model: D.harnesses.copilot.model, access: 'copilot' },
		codex: { model: D.pickers.codex.models[0], access: 'chatgpt' },
		claude: { model: D.pickers.claude.models[0], access: 'key' },
	};
	const accessOf = h => D.access[h].find(a => a.id === PICK[h].access);
	const modelIconOf = h => D.tabs[D.pickers[h].active].icon;

	// The turns: six, one per row per harness, then one gesture back to Copilot.
	const STEPS = [
		{ layer: 'harness', h: 'codex', from: 'copilot' },
		{ layer: 'model', h: 'codex' },
		{ layer: 'access', h: 'codex' },
		{ layer: 'harness', h: 'claude', from: 'codex' },
		{ layer: 'model', h: 'claude' },
		{ layer: 'access', h: 'claude' },
	];

	// Shares of the pin. Within a turn's span s (0 to 1): its picker opens, the choice moves, the row rolls, it closes.
	const TL = {
		words: [0, 0.04],
		unfold: [0.05, 0.13],
		step0: 0.15,
		span: 0.095,
		open: [0, 0.18],
		choose: [0.22, 0.48],
		roll: [0.5, 0.7],
		close: [0.78, 0.95],
		back: [0.8, 0.87],
		fold: [0.89, 0.97],
	};
	const stepS = (u, i) => (u - (TL.step0 + TL.span * i)) / TL.span;
	const QUIET = TL.step0 + TL.span * STEPS.length + 0.025;
	// The stops, for the review pill: each a moment where nothing moves.
	const STOPS = [
		['Words', 0.035],
		['Taken apart', 0.14],
		...STEPS.map((st, i) => [`${D.harnesses[st.h].label}: ${st.layer === 'harness' ? 'harness' : st.layer}`, TL.step0 + TL.span * (i + 0.74)]),
		['All three', QUIET],
		['Back on Copilot', 0.88],
		['Closed', 0.99],
	];
	const STILL = TL.step0 + TL.span * 5.74;

	// ------------------------------------------------------------------ pieces

	const chipHtml = h => `<span class="mh-chip">${ic(D.harnesses[h].icon)}<b>${esc(D.harnesses[h].label)}</b>${ic('chevron-down', 'mh-chev')}</span>`;
	const tabsHtml = h => {
		const p = D.pickers[h];
		return `<span class="mh-tabs">${p.tabs.map(t => {
			const T = D.tabs[t];
			const on = t === p.active;
			return `<span class="mh-tab${on ? ' on' : ''}">${ic(T.icon)}${on ? `<b>${esc(T.label)}</b>` : ''}</span>`;
		}).join('')}<span class="mh-ib">${ic('add')}</span><span class="mh-ib">${ic('search')}</span></span>`;
	};
	const accessHtml = h => {
		const a = accessOf(h);
		const key = a.id === 'key' ? `<span class="mh-dots">${'•'.repeat(12)}</span>` : `<span class="mh-note">${esc(a.short || a.desc)}</span>`;
		return `<span class="mh-acc">${ic(a.icon)}<b>${esc(a.label)}</b>${key}</span>`;
	};

	// A roll: states one window apart; set(r) shows state r, fractions rolling upward.
	function roller(host, htmls, h) {
		const win = div('mh-win');
		const strip = div('mh-strip');
		htmls.forEach((html, i) => {
			const s = div('mh-state', html);
			s.style.top = i * h + 'px';
			s.style.height = h + 'px';
			strip.appendChild(s);
		});
		win.appendChild(strip);
		host.appendChild(win);
		let last = null;
		return {
			set(r) {
				const v = Math.round(clamp(r, 0, htmls.length - 1) * 1000) / 1000;
				if (v === last) { return; }
				last = v;
				strip.style.transform = v ? `translate3d(0, ${(-v * h).toFixed(2)}px, 0)` : '';
			},
		};
	}

	// A menu in the product's dark menu style. rows: [{ key, icon, label, desc, sep, link, check }].
	function menuEl(rows, { header = '', cls = '', checks = false } = {}) {
		const el = div('mh-menu' + (cls ? ' ' + cls : ''));
		el.innerHTML = `${header}<div class="mh-list"><span class="mh-hl"></span>${rows.map(r => r.sep
			? '<div class="mh-sep"></div>'
			: `<div class="mh-row${r.link ? ' is-link' : ''}" data-k="${r.key || ''}">${checks ? `<span class="mh-check">${ic('check')}</span>` : ''}${r.icon ? ic(r.icon) : '<span class="mh-noicon"></span>'}<span class="mh-l">${esc(r.label)}</span>${r.desc ? `<span class="mh-d">${esc(r.desc)}</span>` : ''}</div>`).join('')}</div>`;
		return el;
	}

	function harnessMenu(st) {
		const rows = D.harnessMenu.map(k => (k === '-' ? { sep: true } : k === 'learn'
			? { key: 'learn', label: D.learnHarnesses, link: true }
			: { key: k, icon: D.harnesses[k].icon, label: D.harnesses[k].label }));
		return { el: menuEl(rows, { cls: 'is-harness' }), from: st.from, to: st.h };
	}

	function modelMenu(st) {
		const p = D.pickers[st.h];
		const bar = `<div class="mh-mp-bar">${p.tabs.map(t => {
			const T = D.tabs[t];
			const on = t === p.active;
			return `<span class="mh-tab${on ? ' on' : ''}">${ic(T.icon)}${on ? `<b>${esc(T.label)}</b>` : ''}</span>`;
		}).join('')}<span class="mh-sp"></span><span class="mh-ib">${ic('add')}</span><span class="mh-ib">${ic('search')}</span></div>`;
		const rows = p.models.map(m => ({ key: m, label: m }));
		return { el: menuEl(rows, { header: bar, cls: 'is-model', checks: true }), from: null, to: PICK[st.h].model };
	}

	function accessMenu(st) {
		const rows = D.access[st.h].map(a => ({ key: a.id, icon: a.icon, label: a.label, desc: a.desc }));
		const header = `<div class="mh-mhead">Model access for ${esc(D.harnesses[st.h].label)}</div>`;
		const m = { el: menuEl(rows, { header, cls: 'is-access', checks: true }), from: D.access[st.h][0].id, to: PICK[st.h].access };
		if (m.to === 'key') {
			const f = div('mh-field', `<span class="mh-fv"></span><span class="mh-caret"></span>`);
			m.el.appendChild(f);
			m.field = f.firstElementChild;
		}
		return m;
	}

	// ------------------------------------------------------------------ build

	const scene = document.getElementById('mh-scene');
	const stage = document.getElementById('mh-stage');
	const words = document.getElementById('mh-words');
	const params = new URLSearchParams(location.search);
	const fixedU = params.has('u') ? clamp(parseFloat(params.get('u')) || 0) : null;
	const reduced = params.get('motion') === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
	const still = reduced || fixedU != null;
	if (still) { document.documentElement.classList.add('mh-still'); }
	if (fixedU != null) { document.documentElement.classList.add('mh-review'); }

	const frameEl = div('mh-frame');
	frameEl.setAttribute('aria-hidden', 'true');
	const sess = div('mh-sess');
	frameEl.appendChild(sess);
	stage.appendChild(frameEl);

	// The header: the harness's mark rolls with the Session Target, as the product's chat title prefix does.
	const head = div('mh-head');
	const headIcon = div('mh-hico');
	head.append(headIcon, div('mh-title', esc(SESSION.title)));
	sess.appendChild(head);
	const rolls = {};
	rolls.head = roller(headIcon, CONFIGS.map(h => ic(D.harnesses[h].icon)), 18);

	// The conversation, anchored to the bottom of its clip; it rises as the rows come in.
	const logClip = div('mh-logclip');
	const log = div('mh-log', `<div class="mh-req">${code(SESSION.prompt)}</div><p class="mh-msg">${code(SESSION.reply)}</p>`);
	logClip.appendChild(log);
	sess.appendChild(logClip);

	// The three rows, in a box that grows up from the input.
	const rowsBox = div('mh-rows');
	sess.appendChild(rowsBox);
	const rows = LAYERS.map((k, i) => {
		const el = div('mh-rowp is-' + k);
		el.style.bottom = G + (2 - i) * (CTL + G) + 'px';
		el.style.height = CTL + 'px';
		rowsBox.appendChild(el);
		return el;
	});
	rolls.harness = roller(rows[0], CONFIGS.map(chipHtml), CTL);
	rolls.model = roller(rows[1], CONFIGS.map(tabsHtml), CTL);
	rolls.access = roller(rows[2], CONFIGS.map(accessHtml), CTL);

	// The input: the watermark follows the Session Target, the model chip the Language model.
	const foot = div('mh-foot');
	const box = div('mh-box');
	const wm = div('mh-wm');
	rolls.wm = roller(wm, CONFIGS.map(h => `<span>${esc(D.harnesses[h].ph)}</span>`), 20);
	const tb = div('mh-tb', `<span class="mh-ib">${ic('add')}</span>`);
	const slot = div('mh-mslot');
	rolls.chip = roller(slot, CONFIGS.map(h => `<span class="mh-mchip">${ic(modelIconOf(h))}<span>${esc(PICK[h].model)}</span></span>`), 24);
	tb.appendChild(slot);
	tb.insertAdjacentHTML('beforeend', `<span class="mh-sp"></span><span class="mh-ib">${ic('mic')}</span><span class="mh-ib">${ic('voice-mode')}</span><span class="mh-ib mh-send">${ic('arrow-up')}</span>`);
	box.append(wm, tb);
	foot.appendChild(box);
	sess.appendChild(foot);

	// The pickers, one per turn, in the frame (outside the session's clip), and a hairline from the row to its picker.
	const menus = STEPS.map(st => {
		const m = st.layer === 'harness' ? harnessMenu(st) : st.layer === 'model' ? modelMenu(st) : accessMenu(st);
		m.st = st;
		m.row = LAYERS.indexOf(st.layer);
		m.line = div('mh-line');
		frameEl.append(m.line, m.el);
		m.hl = m.el.querySelector('.mh-hl');
		return m;
	});

	// The names, in the page's type: what each row is.
	const NAMES = ['Harness', 'Model', 'Access'];
	const labels = NAMES.map(n => {
		const el = div('mh-label', `<b>${n}</b>`);
		el.setAttribute('aria-hidden', 'true');
		stage.appendChild(el);
		return el;
	});

	// The configuration, as a line under the session: each part turns with its row.
	const cap = div('mh-cap');
	cap.setAttribute('aria-hidden', 'true');
	const capParts = LAYERS.map(k => {
		const s = document.createElement('span');
		s.className = 'mh-cap-' + k;
		cap.appendChild(s);
		return s;
	});
	cap.insertBefore(Object.assign(document.createElement('i'), { textContent: '·' }), capParts[1]);
	cap.insertBefore(Object.assign(document.createElement('i'), { textContent: '·' }), capParts[2]);
	stage.appendChild(cap);
	const capText = {
		harness: h => D.harnesses[h].label,
		model: h => PICK[h].model,
		access: h => (accessOf(h).id === 'key' ? accessOf(h).label : accessOf(h).id === 'chatgpt' ? 'ChatGPT account' : 'GitHub Copilot plan'),
	};

	// ------------------------------------------------------------------ layout

	let L = null;
	function layout() {
		const vw = document.documentElement.clientWidth;
		const vh = innerHeight;
		const col = Math.min(1200, Math.max(Math.min(vw - 48, 560), vw * 0.66));
		const colX = (vw - col) / 2;
		const gut = vw < 760 ? 16 : colX;
		// Under the header, as the live page has them: the words 30px below it, and the session (continuity's place) about
		// half the screen tall, centered, ending 75px above the download notice.
		words.style.left = gut + 'px';
		words.style.top = NAV + (vh < 760 ? 16 : 32) + 'px';
		const wb = words.offsetTop + words.offsetHeight;
		const bottom = vh - NOTICE - (vh < 760 ? 52 : 75);
		let k = Math.min((0.51 * vh) / SH, (bottom - wb - 24) / SH, (vw - 32) / SW);
		k = Math.max(0.5, Math.round(k * 1000) / 1000);
		const w = SW * k;
		const top = bottom - SH * k;
		// Desktop: the names at the left and the pickers at the right of the session; narrow screens: the pickers open
		// above their row, as the chat input's pickers do, and the line under the session names the layers.
		const wide = vw >= 980;
		const x = Math.round(vw / 2 - w / 2);
		const y = Math.round(top);
		frameEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
		L = { vw, vh, k, x, y, w, wide };
		labels.forEach((el, i) => {
			el.style.display = wide ? '' : 'none';
			el.style.right = vw - x + 28 + 'px';
			// Centered on its row (the name is one 20px line).
			el.style.top = (y + (rowTop(i) + CTL / 2) * k - 10).toFixed(1) + 'px';
		});
		cap.style.top = (y + SH * k + (vh < 760 ? 12 : 18)).toFixed(1) + 'px';
		menus.forEach(m => {
			const mh = m.el.offsetHeight;
			const rc = rowTop(m.row) + CTL / 2;
			let mx;
			let my;
			if (wide) {
				mx = SW + 26;
				my = rc - Math.min(mh / 2, 40);
				my = clamp(my, (12 - y) / k, (vh - 16 - y) / k - mh);
			} else {
				mx = 12;
				my = rowTop(m.row) - 8 - mh;
			}
			m.el.style.left = mx + 'px';
			m.el.style.top = my + 'px';
			m.line.style.display = wide ? '' : 'none';
			m.line.style.top = rc + 'px';
			// Where the choice starts and ends (the menu's own rows, in its own px).
			const rowOf = key => m.el.querySelector(`.mh-row[data-k="${CSS.escape(key)}"]`);
			const to = rowOf(m.to);
			const from = m.from ? rowOf(m.from) : null;
			m.toY = to ? to.offsetTop : 0;
			m.fromY = from ? from.offsetTop : m.toY;
			m.toRow = to;
			m.fromRow = from;
		});
	}

	// ------------------------------------------------------------------ frame

	const cache = new Map();
	const set = (el, prop, v) => {
		const key = cache.get(el) || {};
		if (key[prop] === v) { return; }
		key[prop] = v;
		cache.set(el, key);
		if (prop.startsWith('--')) { el.style.setProperty(prop, v); } else { el.style[prop] = v; }
	};
	const op = (el, o) => {
		const v = Math.round(clamp(o) * 1000) / 1000;
		set(el, 'opacity', String(v));
		set(el, 'visibility', v <= 0 ? 'hidden' : 'visible');
	};

	function frame(u) {
		if (!L) { return; }
		op(words, still ? 1 : out(range(u, TL.words[0], TL.words[1])));

		// The rows come in from the input and go back into it.
		const unfold = io(range(u, TL.unfold[0], TL.unfold[1])) * (1 - io(range(u, TL.fold[0], TL.fold[1])));
		const lift = LIFT * unfold;
		set(log, 'transform', lift ? `translate3d(0, ${(-lift).toFixed(2)}px, 0)` : '');
		set(rowsBox, 'height', lift.toFixed(2) + 'px');

		// The rolls: each turn of a row, then the one gesture back.
		const r = { harness: 0, model: 0, access: 0 };
		const focus = { harness: 0, model: 0, access: 0 };
		let any = 0;
		STEPS.forEach((st, i) => {
			const s = stepS(u, i);
			r[st.layer] += io(range(s, TL.roll[0], TL.roll[1]));
			const f = Math.min(range(s, 0, 0.08), 1 - range(s, 0.92, 1));
			focus[st.layer] = Math.max(focus[st.layer], f);
			any = Math.max(any, f);
		});
		const back = io(range(u, TL.back[0], TL.back[1]));
		for (const k of LAYERS) { r[k] += back; }
		rolls.harness.set(r.harness);
		rolls.head.set(r.harness);
		rolls.wm.set(r.harness);
		rolls.model.set(r.model);
		rolls.chip.set(r.model);
		rolls.access.set(r.access);

		// The turning row is ringed and named; the others step back.
		LAYERS.forEach((k, i) => {
			const dim = clamp(any - focus[k]);
			set(rows[i], '--ring', focus[k].toFixed(3));
			op(rows[i], 1 - 0.42 * dim);
			const shown = clamp((rowTop(i) + CTL - (CONV - lift)) / CTL);
			op(labels[i], shown * shown * (1 - 0.58 * dim));
		});

		// The pickers.
		menus.forEach((m, i) => {
			const s = stepS(u, i);
			const o = out(range(s, TL.open[0], TL.open[1])) * (1 - range(s, TL.close[0], TL.close[1]));
			op(m.el, o);
			op(m.line, o);
			const dy = L.wide ? 0 : (1 - o) * 6;
			const dx = L.wide ? (1 - o) * -8 : 0;
			set(m.el, 'transform', o < 1 ? `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${(0.98 + 0.02 * o).toFixed(4)})` : '');
			if (o <= 0) { return; }
			const c = io(range(s, TL.choose[0], TL.choose[1]));
			const fromIn = m.fromRow ? 1 : c;
			set(m.hl, 'transform', `translate3d(0, ${lerp(m.fromY, m.toY, c).toFixed(2)}px, 0)`);
			op(m.hl, fromIn);
			const picked = range(s, TL.choose[1] - 0.06, TL.choose[1]);
			m.el.querySelectorAll('.mh-check').forEach(el => {
				const row = el.parentElement;
				const v = row === m.toRow ? picked : row === m.fromRow ? 1 - picked : 0;
				op(el, v);
			});
			if (m.field) {
				const n = Math.round(14 * range(s, TL.choose[0] + 0.06, TL.roll[0]));
				const t = 'sk-ant-' + '•'.repeat(n);
				if (m.field.textContent !== t) { m.field.textContent = n ? t : ''; }
				m.field.parentElement.classList.toggle('is-empty', !n);
			}
		});

		// The line under the session: each part shows its row's state and turns with it.
		const capOn = range(unfold, 0.75, 1);
		op(cap, capOn);
		LAYERS.forEach((k, i) => {
			const v = r[k];
			const idx = clamp(Math.round(v), 0, CONFIGS.length - 1);
			const t = capText[k](CONFIGS[idx]);
			if (capParts[i].textContent !== t) { capParts[i].textContent = t; }
			const frac = v - Math.floor(v);
			op(capParts[i], frac ? Math.abs(2 * frac - 1) : 1);
		});
	}

	// ------------------------------------------------------------------ playback

	// The section plays on its own, not with the scroll. Scrolling down to it glides it into place and the rest of that
	// flick is absorbed; then it plays once and stops on the plain Copilot session. Any later scroll moves on, even
	// mid-play (nothing holds the page); if it leaves before the end, it is set back on Copilot once it's out of view.
	// The button pauses, plays and replays (anything that moves on its own for more than five seconds needs one).
	const PLAY = { from: TL.words[1], to: 1, ms: 8000, lead: 450 };
	let lenis = null;
	let u = still ? (fixedU != null ? fixedU : STILL) : PLAY.from;
	let state = 'ready';
	let u0 = u;
	let t0 = 0;
	let holding = false;
	let snapping = false;
	let btn = null;
	const progress = () => u;
	const sceneTop = () => scene.getBoundingClientRect().top;
	const ICONS = { playing: ['debug-pause', 'Pause'], paused: ['play', 'Play'], done: ['debug-restart', 'Replay'], ready: ['play', 'Play'] };

	function drawBtn() {
		if (!btn) { return; }
		const [i, label] = ICONS[state];
		btn.innerHTML = `${ic(i)}<span>${label}</span>`;
		btn.setAttribute('aria-label', `${label} the animation`);
	}
	function play(from) {
		if (from != null) { u = from; }
		if (u >= PLAY.to) { u = PLAY.from; }
		u0 = u;
		t0 = performance.now() + (u0 <= PLAY.from ? PLAY.lead : 0);
		state = 'playing';
		drawBtn();
	}
	function pause() {
		state = 'paused';
		drawBtn();
	}
	function finish() {
		u = PLAY.to;
		state = 'done';
		drawBtn();
	}

	// Brings the section's top to the screen's top, then holds the scroll a moment so the same flick doesn't carry on.
	function snapIn(then) {
		snapping = true;
		const y = scrollY + sceneTop();
		const settle = () => {
			holding = true;
			setTimeout(() => {
				holding = false;
				snapping = false;
				if (then) { then(); }
			}, 500);
		};
		if (lenis) {
			lenis.scrollTo(y, { duration: 0.9, lock: true, force: true, onComplete: settle });
		} else {
			scrollTo({ top: y, behavior: 'smooth' });
			setTimeout(settle, 700);
		}
	}

	let lastY = 0;
	function watch(now) {
		const top = sceneTop();
		const vh = innerHeight;
		const down = scrollY > lastY;
		lastY = scrollY;
		if (state === 'ready' && !snapping) {
			if (down && top > 2 && top < vh * 0.8) {
				snapIn(play);
			} else if (Math.abs(top) <= 2) {
				// Arrived without the glide (a touch scroll, or a jump): just play.
				play();
			}
		}
		if (state === 'playing') {
			u = Math.min(PLAY.to, u0 + (Math.max(0, now - t0) / PLAY.ms) * (PLAY.to - PLAY.from));
			if (u >= PLAY.to) { finish(); }
		}
		// Left before the end: back on Copilot once it's out of view.
		if ((state === 'playing' || state === 'paused') && !snapping && (top >= vh || top + scene.offsetHeight <= 0)) {
			finish();
		}
	}

	function sizeScene() {
		scene.style.height = '100vh';
	}

	function start() {
		sizeScene();
		layout();
		frame(progress());
		if (!still) {
			btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'mh-play';
			stage.appendChild(btn);
			btn.addEventListener('click', () => {
				if (state === 'playing') { pause(); } else if (state === 'paused') { play(); } else { play(PLAY.from); }
			});
			drawBtn();
			if (window.Lenis) {
				lenis = new Lenis({ lerp: 0.12, smoothWheel: true, virtualScroll: () => !holding });
			}
		}
		lastY = scrollY;
		const tick = t => {
			if (lenis) { lenis.raf(t); }
			if (!still) { watch(t); }
			frame(progress());
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
		addEventListener('resize', () => {
			layout();
			frame(progress());
		});
		buildStops();
		document.documentElement.classList.remove('mh-booting');
	}

	// The review pill: jump to each stop, paused there.
	function buildStops() {
		const nav = document.getElementById('mh-stops');
		if (!nav || still) {
			if (nav) { nav.hidden = true; }
			return;
		}
		nav.innerHTML = STOPS.map(([n, su], i) => `<button type="button" data-u="${su}" title="${esc(n)}">${i + 1}</button>`).join('') + '<span class="mh-stop-name" aria-live="polite"></span>';
		const name = nav.querySelector('.mh-stop-name');
		nav.addEventListener('click', e => {
			const b = e.target.closest('button');
			if (!b) { return; }
			u = parseFloat(b.dataset.u);
			pause();
			if (Math.abs(sceneTop()) > 2) { snapIn(); }
		});
		const btns = [...nav.querySelectorAll('button')];
		let cur = -1;
		setInterval(() => {
			let best = 0;
			STOPS.forEach(([, su], i) => { if (Math.abs(su - u) < Math.abs(STOPS[best][1] - u)) { best = i; } });
			if (best === cur) { return; }
			cur = best;
			btns.forEach((b, i) => b.setAttribute('aria-current', i === best ? 'true' : 'false'));
			name.textContent = STOPS[best][0];
		}, 120);
	}

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(start);
	} else {
		addEventListener('load', start);
	}
})();
