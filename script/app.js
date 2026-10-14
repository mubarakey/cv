
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
document.querySelectorAll('.skill-pills').forEach(group => {
    group.querySelectorAll('.skill').forEach((skill, i) => {
        skill.style.setProperty('--i', i);
    });
});


// ---------- contact: live Lagos time ----------
const timeEl = document.getElementById('lagos-time');
const timeFmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos'
});
function updateTime() { timeEl.textContent = timeFmt.format(new Date()) + ' local time'; }
updateTime();
setInterval(updateTime, 30000);

// ---------- contact: copy email ----------
const copyBtn = document.getElementById('copy-email');
copyBtn.addEventListener('click', async () => {
    const email = document.getElementById('email-link').textContent.trim();
    try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied!';
    } catch {
        copyBtn.textContent = 'Copy failed';
    }
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
});

// ---------- contact: form ----------
const form = document.getElementById('contact-form');
const sendBtn = document.getElementById('send-btn');
const statusEl = document.getElementById('form-status');
const ACCESS_KEY = '9f4b6250-3b83-4a62-8aba-c3ddfdc8fe2e';

const nameInput = document.getElementById('c-name');
const emailInput = document.getElementById('c-email');
const messageInput = document.getElementById('c-message');
const fields = [nameInput, emailInput, messageInput];

const rules = {
    name:    v => v.trim().length >= 2 || 'Please enter your name',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email',
    message: v => v.trim().length >= 10 || 'Message should be at least 10 characters',
};

function validateField(input) {
    const result = rules[input.name](input.value);
    const ok = result === true;
    input.closest('.field').querySelector('.error').textContent = ok ? '' : result;
    input.classList.toggle('invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
}

function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
}

fields.forEach(f => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => {
        if (f.classList.contains('invalid')) validateField(f);   // clears the error as soon as it's fixed
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const results = fields.map(validateField);       // runs on all fields so every error shows
    if (!results.every(Boolean)) {
        fields.find(f => f.classList.contains('invalid')).focus();
        return;
    }
    if (form.elements.botcheck.checked) return;      // a bot filled the hidden box

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

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
        setStatus('Thanks! Your message was sent. I will reply soon.', 'success');
    } catch (err) {
        setStatus('Something went wrong. Please try again, or email me directly.', 'is-error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send message';
    }
});
