import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Paste your Supabase Project URL and Publishable key here.
// Never put a service_role key in a GitHub Pages site.
const SUPABASE_URL = "https://agqwiliwozcrpmagzhgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqiLC0J93jtFvPcmzJ15Rw_7zHlOg7f";

const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_YOUR") && SUPABASE_KEY && !SUPABASE_KEY.includes("PASTE_YOUR");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const splash = document.querySelector("#splash");
const app = document.querySelector("#app");
const enterWishlist = document.querySelector("#enterWishlist");
const wishlistEl = document.querySelector("#wishlist");
const emptyState = document.querySelector("#emptyState");
const counter = document.querySelector("#counter");
const statusEl = document.querySelector("#status");
const openAdd = document.querySelector("#openAdd");
const openAddEmpty = document.querySelector("#openAddEmpty");
const addModal = document.querySelector("#addModal");
const detailModal = document.querySelector("#detailModal");
const form = document.querySelector("#wishForm");
const formError = document.querySelector("#formError");
const submitWish = document.querySelector("#submitWish");
const imageMethodInputs = document.querySelectorAll('input[name="imageMethod"]');
const imageUrlBox = document.querySelector("#imageUrlBox");
const imageFileBox = document.querySelector("#imageFileBox");
const imageUrlInput = document.querySelector("#imageUrl");
const imageFileInput = document.querySelector("#imageFile");

let wishes = [];
let currentDetailWish = null;

function setStatus(message = "", type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function openModal(modal) {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if ([addModal, detailModal].every(m => m.classList.contains("hidden"))) document.body.style.overflow = "";
}

document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => {
  const type = btn.dataset.close;
  if (type === "add") closeModal(addModal);
  if (type === "detail") closeModal(detailModal);
}));

enterWishlist.addEventListener("click", () => {
  splash.classList.add("splash-hide");
  app.classList.add("visible-app");
  setTimeout(() => splash.remove(), 600);
});

openAdd.addEventListener("click", () => openModal(addModal));
openAddEmpty.addEventListener("click", () => openModal(addModal));

window.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  [addModal, detailModal].forEach(modal => {
    if (!modal.classList.contains("hidden")) closeModal(modal);
  });
});

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";
  return `${Number(value).toLocaleString("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2})} BYN`;
}

function render() {
  wishlistEl.innerHTML = "";
  counter.textContent = `${wishes.length} ${wishes.length === 1 ? "item" : "items"}`;
  emptyState.classList.toggle("visible", wishes.length === 0);
  const template = document.querySelector("#wishTemplate");

  wishes.forEach((wish, index) => {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".wish-card");
    if (wish.reserved) article.classList.add("is-reserved");

    const image = card.querySelector(".wish-image");
    image.src = wish.image_url;
    image.alt = wish.title || "Wish";
    image.addEventListener("error", () => {
      image.alt = "Не удалось загрузить изображение";
      image.style.objectFit = "contain";
      image.style.padding = "20px";
    });

    card.querySelector(".item-number").textContent = `WISH ${String(index + 1).padStart(2, "0")}`;
    card.querySelector(".price").textContent = formatPrice(wish.price);
    card.querySelector(".wish-title").textContent = wish.title || "Untitled";
    card.querySelector(".wish-description").textContent = wish.description || "Нажми, чтобы посмотреть подробности.";

    const detailButton = card.querySelector(".open-detail");
    detailButton.addEventListener("click", event => { event.stopPropagation(); showDetail(wish); });

    const reserveButton = card.querySelector(".reserve-button");
    reserveButton.textContent = wish.reserved ? "UNRESERVE" : "RESERVE";
    reserveButton.addEventListener("click", event => { event.stopPropagation(); toggleReserved(wish); });

    const deleteButton = card.querySelector(".delete-button");
    deleteButton.addEventListener("click", event => { event.stopPropagation(); deleteWish(wish); });

    article.addEventListener("click", () => showDetail(wish));
    article.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showDetail(wish); }
    });

    wishlistEl.appendChild(card);
  });
}

async function loadWishes() {
  if (!configured) {
    setStatus("В app.js ещё не вставлены данные Supabase.", "error");
    return;
  }
  const { data, error } = await supabase.from("wishes").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); setStatus(`Ошибка загрузки: ${error.message}`, "error"); return; }
  wishes = data || [];
  render();
}



function updateImageMethod() {
  const method = document.querySelector('input[name="imageMethod"]:checked')?.value || "url";
  const useUrl = method === "url";
  imageUrlBox.classList.toggle("hidden", !useUrl);
  imageFileBox.classList.toggle("hidden", useUrl);
  imageUrlInput.required = useUrl;
  imageFileInput.required = !useUrl;
}

imageMethodInputs.forEach(input => input.addEventListener("change", updateImageMethod));
updateImageMethod();

async function uploadImage(file) {
  if (!file) throw new Error("Выбери изображение.");
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) throw new Error("Разрешены JPG, PNG, WEBP и GIF.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Фото слишком большое. Максимальный размер — 8 МБ.");
  const extension = file.name.split(".").pop().toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("wishlist-images").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type
  });
  if (error) throw error;
  const { data } = supabase.storage.from("wishlist-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!configured) { formError.textContent = "Сначала настрой Supabase в app.js."; return; }
  formError.textContent = "";
  submitWish.disabled = true;
  submitWish.querySelector("span").textContent = "SAVING…";
  try {
    const title = document.querySelector("#title").value.trim();
    const productUrl = document.querySelector("#productUrl").value.trim();
    const imageMethod = document.querySelector('input[name="imageMethod"]:checked')?.value || "url";
    const imageUrl = imageUrlInput.value.trim();
    const imageFile = imageFileInput.files[0];
    const description = document.querySelector("#description").value.trim();
    const priceRaw = document.querySelector("#price").value;
    if (!title) throw new Error("Укажи название товара.");
    if (!/^https?:\/\//i.test(productUrl)) throw new Error("Ссылка на товар должна начинаться с http:// или https://");
    const price = priceRaw === "" ? null : Number(priceRaw);
    if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error("Проверь цену.");

    let finalImageUrl = imageUrl;
    let imagePath = null;
    let uploadedPath = null;
    if (imageMethod === "url") {
      if (!/^https?:\/\//i.test(imageUrl)) throw new Error("Адрес изображения должен начинаться с http:// или https://");
    } else {
      const uploaded = await uploadImage(imageFile);
      finalImageUrl = uploaded.url;
      imagePath = uploaded.path;
      uploadedPath = uploaded.path;
    }

    const { error } = await supabase.from("wishes").insert({ title, product_url: productUrl, image_url: finalImageUrl, image_path: imagePath, description, price, reserved: false });
    if (error) throw error;
    form.reset();
    closeModal(addModal);
    setStatus("Желание добавлено!", "success");
    await loadWishes();
    setTimeout(() => setStatus(""), 2000);
  } catch (error) {
    console.error(error);
    formError.textContent = error.message || "Не удалось добавить товар.";
  } finally {
    submitWish.disabled = false;
    submitWish.querySelector("span").textContent = "ADD TO WISHLIST";
  }
});

function showDetail(wish) {
  currentDetailWish = wish;
  document.querySelector("#detailImage").src = wish.image_url;
  document.querySelector("#detailImage").alt = wish.title || "Wish";
  document.querySelector("#detailTitle").textContent = wish.title || "Untitled";
  document.querySelector("#detailPrice").textContent = formatPrice(wish.price) || "PRICE NOT SET";
  document.querySelector("#detailDescription").textContent = wish.description || "Описание не добавлено.";
  document.querySelector("#detailProductLink").href = wish.product_url;
  document.querySelector("#detailReserved").classList.toggle("hidden", !wish.reserved);
  const button = document.querySelector("#detailReserve");
  button.textContent = wish.reserved ? "UNRESERVE" : "RESERVE";
  button.onclick = () => toggleReserved(wish);
  openModal(detailModal);
}

async function toggleReserved(wish) {
  if (!configured) return;
  const nextValue = !wish.reserved;
  const { error } = await supabase.from("wishes").update({ reserved: nextValue }).eq("id", wish.id);
  if (error) { setStatus(`Ошибка: ${error.message}`, "error"); return; }
  wish.reserved = nextValue;
  if (currentDetailWish?.id === wish.id) showDetail(wish);
  render();
  setStatus(nextValue ? "Товар забронирован ★" : "Бронь снята.", "success");
  setTimeout(() => setStatus(""), 1800);
}

async function deleteWish(wish) {
  if (!window.confirm(`Удалить «${wish.title}» из виш-листа?`)) return;
  if (wish.image_path) {
    const { error: storageError } = await supabase.storage.from("wishlist-images").remove([wish.image_path]);
    if (storageError) console.warn("Не удалось удалить изображение из Storage:", storageError);
  }
  const { error } = await supabase.from("wishes").delete().eq("id", wish.id);
  if (error) { setStatus(`Ошибка удаления: ${error.message}`, "error"); return; }
  closeModal(detailModal);
  setStatus("Товар удалён.", "success");
  await loadWishes();
  setTimeout(() => setStatus(""), 1800);
}

function subscribeToChanges() {
  if (!configured) return;
  supabase.channel("wishlist-live").on("postgres_changes", { event: "*", schema: "public", table: "wishes" }, () => loadWishes()).subscribe();
}

loadWishes();
subscribeToChanges();
