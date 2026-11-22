'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ==========================================================
   Theme toggle
   ========================================================== */
const themeBtn = $('#theme-toggle');

function syncThemeButton() {
    const isDark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

function setTheme(next) {
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    syncThemeButton();
}

function toggleTheme() {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
}

themeBtn.addEventListener('click', toggleTheme);
syncThemeButton();


/* ==========================================================
   Navbar: sliding pill, scroll-spy, progress bar, back to top
   ========================================================== */
const navLinks = $$('.nav-links a');
const pill = $('.nav-pill');
let currentLink = navLinks[0];

function movePill(link) {
    if (!link) return;
    pill.style.width = link.offsetWidth + 'px';
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
}

function setActive(id) {
    const link = navLinks.find(l => l.getAttribute('href') === '#' + id);
    if (!link) return;
    currentLink = link;
    navLinks.forEach(l => {
        const on = l === link;
        l.classList.toggle('active', on);
        if (on) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
    });
    movePill(link);
}

const spy = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach(s => spy.observe(s));

movePill(currentLink);
requestAnimationFrame(() => pill.classList.add('ready'));
window.addEventListener('resize', () => movePill(currentLink));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(currentLink));

const progressBar = $('.nav-progress');
const toTop = $('#to-top');
let scrollQueued = false;

function onScroll() {
    scrollQueued = false;
    const max = root.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    toTop.classList.toggle('show', scrollY > innerHeight * 0.8);
}
addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));


/* ==========================================================
   Scroll reveal (fade up, staggered inside [data-stagger])
   ========================================================== */
$$('[data-stagger]').forEach(group => {
    [...group.children].forEach((child, i) => child.style.setProperty('--d', i * 80 + 'ms'));
});
$$('.skill-pills').forEach(group => {
    $$('.skill', group).forEach((skill, i) => skill.style.setProperty('--i', i));
});

const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');
        obs.unobserve(el);
        // after the entrance finishes, drop the stagger delay so hover feels instant
        setTimeout(() => el.classList.add('done'), 1400);
    });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => revealer.observe(el));


/* ==========================================================
   Hero terminal: typed intro, then a real prompt
   ========================================================== */
const termBody = $('#terminal-body');
const cursor = document.createElement('span');
cursor.className = 'cursor';

const intro = [
    { type: 'command', text: 'whoami' },
    { type: 'output', cls: 'name', speed: 60, parts: [
        { text: 'Mubarak ' },
        { text: 'Abdulkareem', cls: 'accent' },
    ]},
    { type: 'output', speed: 20, parts: [{ text: 'software engineer · self-taught · Lagos' }] },
    { type: 'command', text: 'ls projects/' },
    { type: 'output', cls: 't-out', speed: 15, parts: [{ text: 'trading-journal/  weather-app/  palindrome-pkg/' }] },
];

async function typeText(el, text, delay) {
    if (!delay || reduce) { el.textContent += text; return; }
    for (const ch of text) {
        el.textContent += ch;
        await sleep(delay);
    }
}

function scrollTerminal() {
    termBody.scrollTop = termBody.scrollHeight;
}

async function runIntro() {
    for (const step of intro) {
        const line = document.createElement('div');
        if (step.cls) line.className = step.cls;
        termBody.appendChild(line);

        if (step.type === 'command') {
            line.innerHTML = '<span class="prompt">~ $</span> <span class="text"></span>';
            const text = $('.text', line);
            text.after(cursor);
            await typeText(text, step.text, 70);
            await sleep(350);
        } else {
            for (const part of step.parts) {
                const span = document.createElement('span');
                if (part.cls) span.className = part.cls;
                line.appendChild(span);
                span.after(cursor);
                await typeText(span, part.text, step.speed);
            }
            await sleep(250);
        }
        scrollTerminal();
    }
    cursor.remove();
    ready = true;
    newPrompt();
}

let ready = false;
let busy = false;
let live = null; // the active prompt line: { row, input }

function printLine(text, cls = 't-out') {
    const div = document.createElement('div');
    div.className = cls;
    div.textContent = text;
    termBody.appendChild(div);
}

function newPrompt() {
    const row = document.createElement('div');
    row.innerHTML = '<span class="prompt">~ $</span> <input class="term-input" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Terminal command, try help">';
    termBody.appendChild(row);
    const input = $('input', row);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    live = { row, input };
    scrollTerminal();
}

function goTo(id) {
    setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, reduce ? 0 : 450);
}

const commands = {
    help: () => printLine('commands: whoami · projects · about · skills · contact · theme · clear'),
    whoami: () => {
        const name = document.createElement('div');
        name.className = 'name';
        name.innerHTML = 'Mubarak <span class="accent">Abdulkareem</span>';
        termBody.appendChild(name);
        printLine('software engineer · self-taught · Lagos', '');
    },
    projects: () => { printLine('trading-journal/  weather-app/  palindrome-pkg/'); goTo('projects'); },
    ls: () => commands.projects(),
    about: () => { printLine('self-taught · Python then JavaScript · Lagos, NG'); goTo('about'); },
    skills: () => { printLine('python  javascript  html  css  git  linux'); goTo('skills'); },
    contact: () => { printLine('iammubarak69@gmail.com'); goTo('contact'); },
    theme: () => { toggleTheme(); printLine('theme: ' + root.dataset.theme); },
};

function submit() {
    if (!live) return;
    const raw = live.input.value;
    const cmd = raw.trim().toLowerCase();

    if (cmd === 'clear') {
        termBody.innerHTML = '';
        newPrompt();
        return;
    }

    live.row.innerHTML = '<span class="prompt">~ $</span> ';
    live.row.append(document.createTextNode(raw));

    if (cmd) {
        const run = commands[cmd];
        if (run) run();
        else printLine(`command not found: ${raw.trim()}. Try "help"`);
    }
    newPrompt();
}

async function runChip(cmd) {
    if (!ready || busy || !live) return;
    busy = true;
    live.input.value = '';
    for (const ch of cmd) {
        live.input.value += ch;
        await sleep(45);
    }
    await sleep(150);
    busy = false;
    submit();
}

$$('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => runChip(btn.dataset.cmd));
});
termBody.addEventListener('click', () => { if (live) live.input.focus({ preventScroll: true }); });

runIntro();


/* ==========================================================
   Projects: filter with FLIP animation
   ========================================================== */
const grid = $('#project-grid');
const cards = $$('.card', grid);
const filterBtns = $$('.filter-btn');
const countEl = $('#project-count');

function applyFilter(tag) {
    const before = new Map(cards.map(c => [c, c.hidden ? null : c.getBoundingClientRect()]));

    cards.forEach(c => {
        c.hidden = !(tag === 'all' || c.dataset.tags.split(' ').includes(tag));
    });
    const visible = cards.filter(c => !c.hidden);
    cards.forEach(c => c.classList.remove('featured'));
    if (visible[0]) visible[0].classList.add('featured');

    filterBtns.forEach(b => {
        const on = b.dataset.filter === tag;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
    });
    countEl.textContent = `${visible.length} project${visible.length === 1 ? '' : 's'}`;

    visible.forEach(c => {
        c.classList.add('in', 'done'); // a card revealed by filtering must be visible right away
        if (reduce) return;
        const first = before.get(c);
        const last = c.getBoundingClientRect();
        if (!first) {
            c.animate(
                [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
                { duration: 320, easing: 'ease-out' }
            );
        } else {
            const dx = first.left - last.left;
            const dy = first.top - last.top;
            if (dx || dy) {
                c.animate(
                    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                    { duration: 400, easing: 'cubic-bezier(.2,.7,.2,1)' }
                );
            }
        }
    });
}

filterBtns.forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));


/* ==========================================================
   Case-study drawer
   ========================================================== */
const dialog = $('#case-dialog');
const caseTitle = $('#case-title');
const caseTags = $('#case-tags');
const caseShot = $('#case-shot');
const caseImg = $('#case-img');
const caseBody = $('#case-body');
const caseEyebrow = $('#case-eyebrow');
let currentCard = null;
let opener = null;

function fillDrawer(card) {
    currentCard = card;
    const isFeatured = card.querySelector('.card-open').textContent.includes('case study');
    caseEyebrow.textContent = isFeatured ? 'Case study' : 'Project';
    caseTitle.textContent = $('h3', card).textContent;

    caseTags.innerHTML = '';
    $$('.tags li', card).forEach(li => {
        const tag = document.createElement('li');
        tag.textContent = li.textContent;
        caseTags.appendChild(tag);
    });

    const img = $('img', card);
    caseShot.hidden = !img;
    if (img) { caseImg.src = img.getAttribute('src'); caseImg.alt = img.alt; }

    // Optional extra text: add data-why="..." and data-learned="..." to a card in index.html
    caseBody.innerHTML = '';
    const blocks = [
        ['What it is', $('p', card).textContent],
        ['Why I built it', card.dataset.why],
        ['What I learned', card.dataset.learned],
    ];
    blocks.forEach(([heading, text]) => {
        if (!text) return;
        const wrap = document.createElement('div');
        const h = document.createElement('h4');
        const p = document.createElement('p');
        h.textContent = heading;
        p.textContent = text;
        wrap.append(h, p);
        caseBody.appendChild(wrap);
    });
}

function openDrawer(card) {
    opener = document.activeElement;
    fillDrawer(card);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    if (!dialog.open) return;
    const finish = () => {
        dialog.classList.remove('closing');
        dialog.close();
        document.body.style.overflow = '';
        if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    if (reduce) { finish(); return; }
    dialog.classList.add('closing');
    dialog.addEventListener('animationend', finish, { once: true });
}

$$('.card-open').forEach(btn => {
    btn.addEventListener('click', () => openDrawer(btn.closest('.card')));
});
$('#case-close').addEventListener('click', closeDrawer);
dialog.addEventListener('cancel', e => { e.preventDefault(); closeDrawer(); }); // Esc key
dialog.addEventListener('click', e => { if (e.target === dialog) closeDrawer(); }); // backdrop click

$('#case-next').addEventListener('click', () => {
    const all = cards.filter(c => !c.hidden);
    const i = all.indexOf(currentCard);
    fillDrawer(all[(i + 1) % all.length]);
    dialog.scrollTo({ top: 0 });
});


/* ==========================================================
   About: count-up numbers (runs once, when visible)
   ========================================================== */
function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = target + suffix; return; }

    const duration = 1200;
    const start = performance.now();
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            countUp(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.6 });
$$('.stat-number').forEach(c => counterObserver.observe(c));


/* ==========================================================
   Contact: live Lagos time, copy email, form
   ========================================================== */
const timeEl = $('#lagos-time');
const timeFmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
});
function updateTime() { timeEl.textContent = timeFmt.format(new Date()) + ' local time'; }
updateTime();
setInterval(updateTime, 30000);

$('#year').textContent = new Date().getFullYear();

const copyBtn = $('#copy-email');
const copyLabel = $('.copy-label', copyBtn);
copyBtn.addEventListener('click', async () => {
    const email = $('#email-link').textContent.trim();
    try {
        await navigator.clipboard.writeText(email);
        copyBtn.classList.add('copied');
        copyLabel.textContent = 'Copied';
    } catch {
        copyLabel.textContent = 'Copy failed';
    }
    setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyLabel.textContent = 'Copy';
    }, 2000);
});

const form = $('#contact-form');
const sendBtn = $('#send-btn');
const sendLabel = $('.send-label', sendBtn);
const statusEl = $('#form-status');
const ACCESS_KEY = '9f4b6250-3b83-4a62-8aba-c3ddfdc8fe2e';

const nameInput = $('#c-name');
const emailInput = $('#c-email');
const messageInput = $('#c-message');
const fields = [nameInput, emailInput, messageInput];

const rules = {
    name:    v => v.trim().length >= 2 || 'Please enter your name',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email',
    message: v => v.trim().length >= 10 || 'Message should be at least 10 characters',
};

function validateField(input, { shake = false } = {}) {
    const result = rules[input.name](input.value);
    const ok = result === true;
    const field = input.closest('.field');
    $('.error', field).textContent = ok ? '' : result;
    input.classList.toggle('invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok && shake && !reduce) {
        field.classList.remove('shake');
        void field.offsetWidth; // restart the animation
        field.classList.add('shake');
        field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });
    }
    return ok;
}

function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
}

function setSendState(state, label) {
    sendBtn.dataset.state = state;
    sendLabel.textContent = label;
    sendBtn.disabled = state === 'sending';
}

fields.forEach(f => {
    f.addEventListener('blur', () => { if (f.value) validateField(f); });
    f.addEventListener('input', () => {
        if (f.classList.contains('invalid')) validateField(f); // clears the error as soon as it's fixed
    });
});

form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('', '');

    const results = fields.map(f => validateField(f, { shake: true })); // run on all so every error shows
    if (!results.every(Boolean)) {
        fields.find(f => f.classList.contains('invalid')).focus();
        return;
    }
    if (form.elements.botcheck.checked) return; // a bot filled the hidden box

    setSendState('sending', 'Sending…');

    try {
        const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                access_key: ACCESS_KEY,
                subject: 'New message from your portfolio',
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                message: messageInput.value.trim(),
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');

        form.reset();
        fields.forEach(f => f.setAttribute('aria-invalid', 'false'));
        setSendState('sent', 'Sent');
        setStatus('Thanks! Your message was sent. I will reply soon.', 'success');
        setTimeout(() => setSendState('idle', 'Send message'), 2800);
    } catch (err) {
        setSendState('idle', 'Send message');
        setStatus('Something went wrong. Please try again, or email me directly.', 'is-error');
    }
});
