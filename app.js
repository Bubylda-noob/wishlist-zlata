import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
  1) Open your Supabase project.
  2) Settings -> API.
  3) Copy Project URL and Publishable key.
  4) Paste them below.

  IMPORTANT:
  Use the Publishable/anon key here, NOT the service_role key.
*/
const SUPABASE_URL = "https://agqwiliwozcrpmagzhgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_qqiLC0J93jtFvPcmzJ15Rw_7zHlOg7f";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_YOUR") &&
  SUPABASE_KEY &&
  !SUPABASE_KEY.includes("PASTE_YOUR");

const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const wishlistEl = document.querySelector("#wishlist");
const emptyState = document.querySelector("#emptyState");
const counter = document.querySelector("#counter");
const statusEl = document.querySelector("#status");

const modal = document.querySelector("#modal");
const openAdd = document.querySelector("#openAdd");
const openAddEmpty = document.querySelector("#openAddEmpty");
const closeModal = document.querySelector("#closeModal");
const closeModalBackdrop = document.querySelector("#closeModalBackdrop");

const form = document.querySelector("#wishForm");
const formError = document.querySelector("#formError");
const submitWish = document.querySelector("#submitWish");

let wishes = [];

function setStatus(message = "", type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function showModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.querySelector("#title")?.focus(), 50);
}

function hideModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  form.reset();
  formError.textContent = "";
}

openAdd.addEventListener("click", showModal);
openAddEmpty.addEventListener("click", showModal);
closeModal.addEventListener("click", hideModal);
closeModalBackdrop.addEventListener("click", hideModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) hideModal();
});

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "";
  return `${Number(value).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} BYN`;
}

function escapeText(value) {
  return String(value ?? "");
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
    image.alt = escapeText(wish.title);

    card.querySelector(".item-number").textContent =
      `WISH ${String(index + 1).padStart(2, "0")}`;

    card.querySelector(".price").textContent = formatPrice(wish.price);

    const title = card.querySelector(".wish-title");
    title.textContent = escapeText(wish.title);

    const description = card.querySelector(".wish-description");
    description.textContent = escapeText(wish.description || "No description.");

    const link = card.querySelector(".product-link");
    link.href = wish.product_url;

    const reserveButton = card.querySelector(".reserve-button");
    reserveButton.textContent = wish.reserved ? "UNRESERVE" : "RESERVE";
    reserveButton.addEventListener("click", () => toggleReserved(wish));

    const deleteButton = card.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => deleteWish(wish));

    wishlistEl.appendChild(card);
  });
}

async function loadWishes() {
  if (!configured) {
    setStatus("Сначала вставь SUPABASE_URL и SUPABASE_KEY в app.js.", "error");
    return;
  }

  setStatus("Loading wishlist…");

  const { data, error } = await supabase
    .from("wishes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setStatus(`Ошибка загрузки: ${error.message}`, "error");
    return;
  }

  wishes = data || [];
  render();
  setStatus("");
}

async function uploadImage(file) {
  if (!file) throw new Error("Выбери изображение.");

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Разрешены только JPG, PNG, WEBP и GIF.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Фото слишком большое. Максимальный размер — 8 МБ.");
  }

  const extension = file.name.split(".").pop().toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase
    .storage
    .from("wishlist-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  const { data } = supabase
    .storage
    .from("wishlist-images")
    .getPublicUrl(path);

  return { url: data.publicUrl, path };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!configured) {
    formError.textContent = "Сначала настрой Supabase в app.js.";
    return;
  }

  formError.textContent = "";
  submitWish.disabled = true;
  submitWish.querySelector("span").textContent = "UPLOADING…";

  let uploadedPath = null;

  try {
    const title = document.querySelector("#title").value.trim();
    const productUrl = document.querySelector("#productUrl").value.trim();
    const description = document.querySelector("#description").value.trim();
    const priceRaw = document.querySelector("#price").value;
    const file = document.querySelector("#image").files[0];

    if (!title) throw new Error("Укажи название товара.");
    if (!/^https?:\/\//i.test(productUrl)) {
      throw new Error("Ссылка должна начинаться с http:// или https://");
    }

    const price = priceRaw === "" ? null : Number(priceRaw);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      throw new Error("Проверь цену.");
    }

    const uploaded = await uploadImage(file);
    uploadedPath = uploaded.path;

    const { error } = await supabase.from("wishes").insert({
      title,
      product_url: productUrl,
      image_url: uploaded.url,
      image_path: uploaded.path,
      description,
      price,
      reserved: false
    });

    if (error) throw error;

    hideModal();
    setStatus("Wish added!", "success");
    setTimeout(() => setStatus(""), 2500);
  } catch (error) {
    console.error(error);
    formError.textContent = error.message || "Не удалось добавить товар.";

    // If database insert failed after upload, remove the unused image.
    if (uploadedPath) {
      await supabase.storage.from("wishlist-images").remove([uploadedPath]);
    }
  } finally {
    submitWish.disabled = false;
    submitWish.querySelector("span").textContent = "ADD TO WISHLIST";
  }
});

async function toggleReserved(wish) {
  if (!configured) return;

  const nextValue = !wish.reserved;

  const { error } = await supabase
    .from("wishes")
    .update({ reserved: nextValue })
    .eq("id", wish.id);

  if (error) {
    setStatus(`Ошибка: ${error.message}`, "error");
    return;
  }

  setStatus(nextValue ? "Товар забронирован." : "Бронь снята.", "success");
  setTimeout(() => setStatus(""), 1800);
}

async function deleteWish(wish) {
  if (!configured) return;

  const confirmed = window.confirm(
    `Удалить «${wish.title}» из виш-листа?`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", wish.id);

  if (error) {
    setStatus(`Ошибка удаления: ${error.message}`, "error");
    return;
  }

  if (wish.image_path) {
    const { error: storageError } = await supabase
      .storage
      .from("wishlist-images")
      .remove([wish.image_path]);

    if (storageError) console.warn("Image cleanup failed:", storageError);
  }

  setStatus("Товар удалён.", "success");
  setTimeout(() => setStatus(""), 1800);
}

function subscribeToChanges() {
  if (!configured) return;

  supabase
    .channel("wishlist-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wishes" },
      () => loadWishes()
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn("Realtime channel error.");
      }
    });
}

loadWishes();
subscribeToChanges();
