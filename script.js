let animeData = JSON.parse(localStorage.getItem('myAnimeList')) || [];
let editingId = null;

function formatDate(dateStr) {
    if (!dateStr || dateStr === "Unknown" || dateStr === "不明") return "不明";
    const date = new Date(dateStr.split(' to ')[0]);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
}

function getComparableDate(item, type) {
    let dateStr = type === 'watched' ? (item.watched_date || item.date) : item.date;
    if (!dateStr || dateStr === "不明") return null;
    let digits = dateStr.match(/\d+/g);
    if (!digits) return null;
    if (digits[0].length === 2) digits[0] = "20" + digits[0];
    return digits.map(d => d.padStart(2, '0')).join('').padEnd(8, '0');
}

async function searchAnime() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    const resDiv = document.getElementById('search-results');
    resDiv.innerHTML = "検索中...";
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        resDiv.innerHTML = "";
        data.data.forEach(anime => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `<img src="${anime.images.jpg.image_url}"><div>${anime.title_japanese || anime.title}</div>`;
            div.onclick = () => prepareAdd(anime);
            resDiv.appendChild(div);
        });
    } catch (e) { resDiv.innerHTML = "検索に失敗しましたm(_ _)m"; }
}

function prepareAdd(anime) {
    saveAnime({
        id: Date.now(),
        title: anime.title_japanese || anime.title,
        date: formatDate(anime.aired.string),
        watched_date: "",
        image: anime.images.jpg.image_url,
        memo: "",
        timestamp: Date.now()
    });
}

function addAnimeManual() {
    const title = document.getElementById('m-title').value;
    if (!title) return alert("タイトルを記入してね");
    saveAnime({
        id: Date.now(),
        title: title,
        date: document.getElementById('m-date').value || "不明",
        watched_date: "",
        image: document.getElementById('m-img').value || null,
        memo: "",
        timestamp: Date.now()
    });
    toggleManualForm();
    document.querySelectorAll('#manual-form input').forEach(el => el.value = "");
}

function saveAnime(item) {
    animeData.push(item);
    localStorage.setItem('myAnimeList', JSON.stringify(animeData));
    document.getElementById('search-results').innerHTML = "";
    document.getElementById('search-input').value = "";
    renderList();
}

function startEdit(id) {
    editingId = id;
    renderList();
}

function cancelEdit() {
    editingId = null;
    renderList();
}

function saveEdit(id) {
    const idx = animeData.findIndex(i => i.id === id);
    if (idx !== -1) {
        animeData[idx].watched_date = document.getElementById(`edit-watched-${id}`).value || "";
        animeData[idx].memo = document.getElementById(`edit-memo-${id}`).value || "";
        localStorage.setItem('myAnimeList', JSON.stringify(animeData));
    }
    editingId = null;
    renderList();
}

function deleteAnime(id) {
    if (confirm("この記録を本当に削除しますか？")) {
        animeData = animeData.filter(i => i.id !== id);
        localStorage.setItem('myAnimeList', JSON.stringify(animeData));
        renderList();
    }
}

function renderList() {
    const listDiv = document.getElementById('anime-list');
    const sortVal = document.getElementById('sort-select').value;
    let sorted = [...animeData];

    sorted.sort((a, b) => {
        if (sortVal === 'newest') return b.timestamp - a.timestamp;
        if (sortVal === 'oldest') return a.timestamp - b.timestamp;
        if (sortVal === 'title') return a.title.localeCompare(b.title, 'ja');
        if (sortVal.startsWith('watched')) {
            const dA = getComparableDate(a, 'watched');
            const dB = getComparableDate(b, 'watched');
            if (dA === dB) return 0;
            if (!dA) return 1; if (!dB) return -1;
            return sortVal === 'watched_asc' ? dA.localeCompare(dB) : dB.localeCompare(dA);
        }
    });

    listDiv.innerHTML = "";
    document.getElementById('count').innerText = `合計: ${sorted.length}作品`;

    sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        const isEditing = editingId === item.id;
        const img = item.image ? `<img src="${item.image}">` : `<div class="no-image-placeholder">👍</div>`;

        const watchedRow = (!isEditing && item.watched_date)
            ? `<div class="info-row"><span class="field-label">見た年月:</span> <span>${item.watched_date}</span></div>`
            : "";

        const memoContent = (!isEditing && item.memo)
            ? `<div class="memo-text">${item.memo}</div>`
            : "";

        card.innerHTML = `
        ${img}
        <div class="anime-info">
            <h3>${item.title}</h3>
            <div class="info-row"><span class="field-label">放送時期:</span> <span>${item.date}</span></div>
            ${watchedRow}
            ${memoContent}

            ${isEditing ? `
                <div class="edit-fields">
                    <label>見た年月</label>
                    <input type="text" id="edit-watched-${item.id}" value="${item.watched_date || ''}" placeholder="--年--月">
                    <label>メモ</label>
                    <textarea id="edit-memo-${item.id}" rows="1">${item.memo || ''}</textarea>
                </div>
            ` : ""}

            <div class="action-btns">
                <div class="pro-btns">
                ${isEditing ? `
                    <button class="btn-save" onclick="saveEdit(${item.id})">保存</button>
                    <button class="btn-edit" onclick="cancelEdit()">戻る</button>
                ` : `
                    <button class="btn-edit" onclick="startEdit(${item.id})">編集</button>
                `}
                </div>
                <button class="btn-delete" onclick="deleteAnime(${item.id})">削除</button>
            </div>
        </div>
    `;
        listDiv.appendChild(card);
    });
}

function toggleManualForm() {
    const f = document.getElementById('manual-form');
    const s = document.getElementById('search-input');
    f.style.display = (f.style.display === 'none' || f.style.display === '') ? 'block' : 'none';
    if (f.style.display === 'block') document.getElementById('m-title').value = s.value;
}

// 初期実行
renderList();
