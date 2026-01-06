let animeData = JSON.parse(localStorage.getItem('myAnimeList')) || [];

function formatDate(dateStr) {
    if (!dateStr || dateStr === "Unknown" || dateStr === "不明") return "不明";
    const cleanStr = dateStr.split(' to ')[0];
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

async function searchAnime() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = "検索中...";
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        resultsDiv.innerHTML = "";
        data.data.forEach(anime => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
            <img src="${anime.images.jpg.image_url}">
            <div>${anime.title_japanese || anime.title}</div>
        `;
            div.onclick = () => prepareAdd(anime);
            resultsDiv.appendChild(div);
        });
    } catch (error) {
        resultsDiv.innerHTML = "検索に失敗しました";
    }
}

function prepareAdd(anime) {
    const newItem = {
        id: Date.now(),
        title: anime.title_japanese || anime.title,
        date: formatDate(anime.aired.string),
        image: anime.images.jpg.image_url,
        memo: "",
        timestamp: Date.now()
    };
    saveAnime(newItem);
}

function addAnimeManual() {
    const title = document.getElementById('m-title').value;
    const rawDate = document.getElementById('m-date').value;
    const img = document.getElementById('m-img').value;
    const memo = document.getElementById('m-memo').value;

    if (!title) return alert("タイトルは必須です");

    const newItem = {
        id: Date.now(),
        title: title,
        date: formatDate(rawDate),
        image: img || null,
        memo: memo,
        timestamp: Date.now()
    };
    saveAnime(newItem);
    toggleManualForm();
    document.querySelectorAll('#manual-form input, #manual-form textarea').forEach(el => el.value = "");
}

function saveAnime(item) {
    animeData.push(item);
    localStorage.setItem('myAnimeList', JSON.stringify(animeData));
    document.getElementById('search-results').innerHTML = "";
    document.getElementById('search-input').value = "";
    renderList();
}

function updateMemo(id, newText) {
    const index = animeData.findIndex(item => item.id === id);
    if (index !== -1) {
        animeData[index].memo = newText;
        localStorage.setItem('myAnimeList', JSON.stringify(animeData));
    }
}

function deleteAnime(id) {
    if (confirm("本当にこの記録を削除しますか？")) {
        animeData = animeData.filter(item => item.id !== id);
        localStorage.setItem('myAnimeList', JSON.stringify(animeData));
        renderList();
    }
}

function getNumericDate(dateStr) {
    if (!dateStr || dateStr === "不明") return null;
    const digits = dateStr.match(/\d+/g);
    return digits ? digits.join('') : null;
}

function renderList() {
    const listDiv = document.getElementById('anime-list');
    const sortVal = document.getElementById('sort-select').value;
    const countDisplay = document.getElementById('count');

    let sorted = [...animeData];

    sorted.sort((a, b) => {
        if (sortVal === 'newest') return b.timestamp - a.timestamp;
        if (sortVal === 'oldest') return a.timestamp - b.timestamp;
        if (sortVal === 'title') return a.title.localeCompare(b.title, 'ja');
        if (sortVal === 'date_asc' || sortVal === 'date_desc') {
            const dateA = getNumericDate(a.date);
            const dateB = getNumericDate(b.date);
            if (dateA === null && dateB === null) return 0;
            if (dateA === null) return 1;
            if (dateB === null) return -1;
            if (sortVal === 'date_asc') return dateA.localeCompare(dateB);
            if (sortVal === 'date_desc') return dateB.localeCompare(dateA);
        }
    });

    listDiv.innerHTML = "";
    countDisplay.innerText = `合計: ${sorted.length}作品`;

    sorted.forEach(item => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        const imageHtml = (item.image && item.image !== "")
            ? `<img src="${item.image}" alt="${item.title}">`
            : `<div class="no-image-placeholder">👍</div>`;

        card.innerHTML = `
        ${imageHtml}
        <div class="anime-info">
            <h3>${item.title}</h3>
            <div class="anime-date">放送・記録時期: ${item.date}</div>
            <textarea 
                class="memo-edit" 
                placeholder="メモを記入..." 
                onchange="updateMemo(${item.id}, this.value)">${item.memo}</textarea>
            <button class="delete-btn" onclick="deleteAnime(${item.id})">削除</button>
        </div>
    `;
        listDiv.appendChild(card);
    });
}

function toggleManualForm() {
    const form = document.getElementById('manual-form');
    const searchInput = document.getElementById('search-input');
    const manualTitle = document.getElementById('m-title');
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        manualTitle.value = searchInput.value;
    } else {
        form.style.display = 'none';
    }
}

// 初期表示
renderList();