const searchBtn = document.getElementById('searchBtn');
const queryInput = document.getElementById('query');
const searchResults = document.getElementById('searchResults');
const animeList = document.getElementById('animeList');

// 1. ページ読み込み時にデータを表示
window.onload = () => {
    renderList();
};

// 2. 検索機能 (前回と同じ)
searchBtn.addEventListener('click', async () => {
    const query = queryInput.value;
    if (!query) return;
    searchResults.innerHTML = "検索中...";
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=4`);
        const resData = await response.json();
        displayResults(resData.data);
    } catch (error) {
        searchResults.innerHTML = "エラーが発生しました。";
    }
});

function displayResults(animes) {
    searchResults.innerHTML = "";
    animes.forEach(anime => {
        const title = anime.title_japanese || anime.title;
        const image = anime.images.jpg.image_url;
        const date = anime.aired.from ? anime.aired.from.split('T')[0] : "不明";

        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="${image}">
            <p><strong>${title}</strong></p>
            <p>${date}</p>
            <button onclick="saveAnime('${title}', '${image}', '${date}')">追加</button>
        `;
        searchResults.innerHTML += card.outerHTML;
    });
}

// 3. 保存機能 (IDを付与するように変更)
window.saveAnime = (title, image, date) => {
    const animeData = {
        id: Date.now(), // 一意のIDとして現在の時刻を使用
        title,
        image,
        date
    };
    const savedData = JSON.parse(localStorage.getItem('myAnimes')) || [];
    savedData.push(animeData);
    localStorage.setItem('myAnimes', JSON.stringify(savedData));

    renderList(); // リストを更新
    searchResults.innerHTML = "";
    queryInput.value = "";
};

// 4. リスト表示機能 (再描画)
function renderList() {
    const savedData = JSON.parse(localStorage.getItem('myAnimes')) || [];
    animeList.innerHTML = ""; // 一旦空にする

    savedData.forEach(anime => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${anime.image}">
            <div>
                <strong>${anime.title}</strong><br>
                <small>${anime.date}</small>
            </div>
            <button class="delete-btn" onclick="deleteAnime(${anime.id})">削除</button>
        `;
        animeList.appendChild(li);
    });
}

// 5. 削除機能 (確認ダイアログ付き)
window.deleteAnime = (id) => {
    if (confirm("本当にこの記録を削除しますか？")) {
        let savedData = JSON.parse(localStorage.getItem('myAnimes')) || [];
        // 指定したID以外のデータだけを残す
        savedData = savedData.filter(anime => anime.id !== id);
        localStorage.setItem('myAnimes', JSON.stringify(savedData));
        renderList(); // リストを更新
    }
};

// 6. 並べ替え機能
window.sortList = (criterion) => {
    let savedData = JSON.parse(localStorage.getItem('myAnimes')) || [];

    if (criterion === 'title') {
        // 名前順 (あいうえお/ABC順)
        savedData.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
    } else if (criterion === 'date') {
        // 日付順 (新しい順)
        savedData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    localStorage.setItem('myAnimes', JSON.stringify(savedData));
    renderList(); // ソート後に再描画
};