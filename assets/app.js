// Links de pedido: troque IFOOD pelo link direto da loja quando tiver.
const WHATSAPP = "554430343834";
const IFOOD = "https://www.ifood.com.br/busca?q=polaco%20lanches%20maringa";
const TOUR = "tour.html?embed=1";
const MAP = "https://www.google.com/maps?q=Polaco%20Lanches%20Sol%20Nascente%20Maring%C3%A1&ll=-23.4571001,-51.9103893&z=17&output=embed";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/* Entregador atravessa a página com a rolagem e vira a logo */
const hero = $("#inicio"), header = $("#top"), palco = $(".palco"), moto = $("#moto"), surge = $(".surge");
const ctx = moto.getContext("2d");
const QUADROS = 12, quadros = [];
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
const limita = v => Math.min(1, Math.max(0, v));
const trecho = (p, a, b) => limita((p - a) / (b - a));
const suave = t => t * t * (3 - 2 * t);
const salto = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
let alvo = semMovimento ? 1 : 0, atual = alvo, girando = false, ultimo = -1;

function desenharMoto(i) {
  const img = quadros[i] || quadros.find(Boolean);
  if (!img || img === ultimo) return;
  ultimo = img;
  ctx.clearRect(0, 0, 640, 640);
  ctx.drawImage(img, 0, 0, 640, 640);
}
function cena(p) {
  const W = palco.clientWidth, S = moto.offsetWidth;
  const anda = suave(trecho(p, 0, .52)), entra = suave(trecho(p, .5, .68));
  const x = (1 - anda) * -(W / 2 + S * .62);
  const pulo = Math.sin(p * 90) * 3 * (1 - entra);
  const giro = Math.sin(p * 55) * .7 * (1 - entra) - entra * 8;
  moto.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${pulo.toFixed(1)}px)) rotate(${giro.toFixed(2)}deg) scale(${(1 - entra * .74).toFixed(3)})`;
  moto.style.opacity = (1 - trecho(p, .6, .69)).toFixed(3);
  const l = trecho(p, .56, .74);
  surge.style.opacity = limita(l * 3.2).toFixed(3);
  surge.style.transform = `translate(-50%, -50%) scale(${(.16 + .84 * salto(l)).toFixed(3)}) rotate(${((1 - l) * -14).toFixed(2)}deg)`;
  const n = Math.floor(p * 70) % (QUADROS * 2 - 2);
  desenharMoto(n < QUADROS ? n : QUADROS * 2 - 2 - n);
  hero.style.setProperty("--p", p.toFixed(4));
  hero.classList.toggle("final", p > .76);
}
function animar() {
  const falta = alvo - atual;
  atual = Math.abs(falta) < .0008 ? alvo : atual + falta * .16;
  cena(atual);
  if (atual !== alvo) requestAnimationFrame(animar); else girando = false;
}
function onScroll() {
  const curso = hero.offsetHeight - palco.clientHeight;
  alvo = semMovimento || curso <= 0 ? 1 : limita(scrollY / curso);
  header.classList.toggle("show", curso > 0 && scrollY > curso);
  if (!girando) { girando = true; requestAnimationFrame(animar); }
}
for (let i = 0; i < QUADROS && !semMovimento; i++) {
  const img = new Image();
  img.onload = () => { quadros[i] = img; ultimo = -1; cena(atual); };
  img.src = `assets/moto/m${String(i).padStart(2, "0")}.webp`;
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { cena(atual); onScroll(); });
cena(atual);
onScroll();

/* Aberto ou fechado, sempre no horário de Maringá */
function renderStatus() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const now = +parts.hour * 60 + +parts.minute;
  const close = day === 0 ? 0 : day >= 5 ? 1410 : 1380;
  const open = day !== 0 && now >= 1080 && now < close;
  let label;
  if (open) label = `Aberto agora, até ${day >= 5 ? "23:30" : "23:00"}`;
  else if (day !== 0 && now < 1080) label = "Fechado, abre hoje às 18:00";
  else if (day === 6) label = "Fechado, abre segunda às 18:00";
  else label = "Fechado, abre amanhã às 18:00";
  $$("[data-status]").forEach(el => { el.textContent = label; el.classList.toggle("open", open); el.classList.toggle("closed", !open); });
  $$(".hours tr").forEach(tr => tr.classList.toggle("today", tr.dataset.days.split(",").includes(String(day))));
}
renderStatus();
setInterval(renderStatus, 60000);

/* Cardápio */
const tabs = $("#tabs"), items = $("#items");
const cart = new Map();
tabs.innerHTML = MENU.map((c, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(c.cat)}</button>`).join("");

function renderCat(i) {
  $$("button", tabs).forEach((b, n) => b.setAttribute("aria-selected", n === i));
  items.innerHTML = MENU[i].items.map(([name, desc, price, old, img], n) => `
    <article class="item">
      ${img ? `<img src="assets/produtos/${img}" alt="${esc(name)}" width="92" height="92" loading="lazy">` : `<div class="noimg" aria-hidden="true">P</div>`}
      <div>
        <h3>${esc(name)}</h3>
        <p>${esc(desc)}</p>
        <div class="buy">
          <span class="price">${old ? `<s>${brl(old)}</s>` : ""}${brl(price)}</span>
          <button class="add" type="button" data-id="${i}-${n}" aria-label="Adicionar ${esc(name)}">Adicionar</button>
        </div>
      </div>
    </article>`).join("");
}
renderCat(0);
tabs.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  renderCat(+b.dataset.i);
  b.scrollIntoView({ inline: "center", block: "nearest" });
  const top = $(".tabs-bar").getBoundingClientRect().top;
  if (top <= 66) scrollTo({ top: scrollY + items.getBoundingClientRect().top - 130 });
});
items.addEventListener("click", e => {
  const b = e.target.closest(".add"); if (!b) return;
  change(b.dataset.id, 1);
  b.textContent = "Adicionado ✓";
  setTimeout(() => { if (b.isConnected) b.textContent = "Adicionar"; }, 900);
});

/* Pedido */
const itemOf = id => { const [c, n] = id.split("-").map(Number); return MENU[c].items[n]; };
const total = () => [...cart].reduce((s, [id, q]) => s + itemOf(id)[2] * q, 0);
function change(id, d) {
  const q = (cart.get(id) || 0) + d;
  if (q > 0) cart.set(id, q); else cart.delete(id);
  renderCart();
}
function renderCart() {
  const count = [...cart.values()].reduce((a, b) => a + b, 0);
  $("#cart-fab").hidden = !count;
  $("#fab-count").textContent = count;
  $("#fab-total").textContent = brl(total());
  $("#cart-total").textContent = brl(total());
  $("#cart-list").innerHTML = [...cart].map(([id, q]) => {
    const it = itemOf(id);
    return `<li><span>${esc(it[0])}<br><b>${brl(it[2] * q)}</b></span>
      <span class="qty"><button type="button" data-d="-1" data-id="${id}" aria-label="Remover um">−</button>${q}<button type="button" data-d="1" data-id="${id}" aria-label="Adicionar um">+</button></span></li>`;
  }).join("");
  if (!count && dialog.open) dialog.close();
}
const dialog = $("#cart");
$("#cart-fab").addEventListener("click", () => dialog.showModal());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
$("#cart-list").addEventListener("click", e => {
  const b = e.target.closest("[data-d]"); if (b) change(b.dataset.id, +b.dataset.d);
});
const mode = () => $("input[name=mode]:checked").value;
$$("input[name=mode]").forEach(r => r.addEventListener("change", () => { $("#addr-wrap").hidden = mode() !== "Entrega"; }));

$("#send").addEventListener("click", () => {
  const name = $("#c-name"), addr = $("#c-addr");
  const missing = [name, ...(mode() === "Entrega" ? [addr] : [])].filter(f => !f.value.trim());
  [name, addr].forEach(f => f.classList.toggle("err", missing.includes(f)));
  if (missing.length) { missing[0].focus(); return; }
  const lines = [...cart].map(([id, q]) => { const it = itemOf(id); return `${q}x ${it[0]} (${brl(it[2] * q)})`; });
  const msg = ["Olá! Quero fazer um pedido:", "", ...lines, "", `Subtotal: ${brl(total())}`, `Nome: ${name.value.trim()}`, `Recebimento: ${mode()}`,
    ...(mode() === "Entrega" ? [`Endereço: ${addr.value.trim()}`] : []), `Pagamento: ${$("#c-pay").value}`,
    ...($("#c-obs").value.trim() ? [`Observações: ${$("#c-obs").value.trim()}`] : [])].join("\n");
  window.open(waLink(msg), "_blank", "noopener");
});

/* Links, tour 360° e mapa */
$("#ifood").href = IFOOD;
$$("[data-wa]").forEach(a => { a.href = waLink("Olá! Vim pelo site e quero fazer um pedido."); a.target = "_blank"; a.rel = "noopener"; });
const viewer = $("#viewer");
viewer.src = TOUR;
$$(".switch button").forEach(b => b.addEventListener("click", () => {
  $$(".switch button").forEach(x => x.classList.toggle("on", x === b));
  const sv = b.dataset.view === "sv";
  viewer.src = sv ? TOUR : MAP;
  viewer.title = sv ? "Tour virtual 360° da Polaco Lanches" : "Mapa da localização da Polaco Lanches";
}));
$("#year").textContent = new Date().getFullYear();
