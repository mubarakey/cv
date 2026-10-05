
const root = document.documentElement;
const lightIcon = document.querySelector('.theme-light-icon');
const darkIcon = document.querySelector('.theme-dark-icon');

function themeIcon() {
    const isDark = root.dataset.theme === 'dark';
    lightIcon.style.display = isDark ? 'inline' : 'none';
    darkIcon.style.display = isDark ? 'none' : 'inline';
}
themeIcon();

document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    themeIcon();
});

// hero section 
const termBody = document.querySelector('#terminal-body');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

const cursor = document.createElement('span');
cursor.className = 'cursor';

const script = [
    {type: 'command', text: 'whoami'},
    {type: 'output', cls: 'name', speed: 60, parts: [
        {text: 'Mubarak ' },
        {text: 'Abdulkareem', cls: 'accent'},
    ]},
    { type: 'output', speed: 20, parts: [{ text: 'software engineer · self-taught · Lagos' }] },
    { type: 'command', text: 'ls projects/' },
    { type: 'output', speed: 15, parts: [{ text: 'trading-journal/  weather-app/  palindrome-pkg/' }] },
    { type: 'command', text: '' },
];

async function typeText(el, text, delay) {
    if (!delay) {
        el.textContent = text; return;
    }
    for (const ch of text) {
        el.textContent += ch;
        await sleep(delay);
    }
}

async function runTerminal() {
    for (const step of script) {
        const line = document.createElement('div');
        if (step.cls) line.className = step.cls;
        termBody.appendChild(line);

        if (step.type === 'command') {
            line.innerHTML = '<span class="prompt">~ $</span> <span class="text"></span>';
            const text = line.querySelector('.text');
            text.after(cursor);
            await typeText(text, step.text, 70);
            await sleep(350);
        } else {
            for (const part of step.parts) {
                const span = document.createElement('span');
                if (part.cls) span.className = part.cls;
                line.appendChild(span);
                span.after(cursor);          // cursor follows the typing
                await typeText(span, part.text, step.speed);
            }
            await sleep(250);
        }
    }
}
runTerminal();

// end of hero section

// try section buttons
const tryBtns = document.querySelectorAll('.trybtn');
const panels = document.querySelectorAll('.panel');

function showPanel(id) {
    panels.forEach(p => p.classList.toggle('show', p.id === id));
    tryBtns.forEach(b => b.classList.toggle('active', b.dataset.target === id));
}

tryBtns.forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.target));
});

showPanel('projects');
// end of try section buttons

// about journey count
const counters = document.querySelectorAll('.stat-number');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(el) {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }

    const duration = 1200;
    const start = performance.now();
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * progress) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            countUp(entry.target);
            observer.unobserve(entry.target);   // run once only
        }
    });
}, { threshold: 0.6 });

counters.forEach(c => observer.observe(c));

