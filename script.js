/** --- 구글 API 설정 --- **/
// 중요: 깃헙 페이지 도메인을 구글 콘솔에 등록한 후 클라이언트 ID를 입력하세요.
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; 
const API_KEY = 'YOUR_API_KEY'; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = "My_BookStack_Data_DO_NOT_DELETE";
const TTB_KEY = 'ttbtwinwhee0938001';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let fileId = null;
let shelves = [];
const hipColors = ['#ffffff', '#00ff88', '#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#adb5bd', '#ff5400', '#00f5d4', '#9d4edd'];

/** --- 구글 API 초기화 로직 --- **/
function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', 
    });
    gisInited = true;
}

window.onload = () => { gapiLoaded(); gisLoaded(); };

/** --- 인증 및 데이터 처리 --- **/
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) throw (resp);
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginMessage').style.display = 'none';
        await loadDriveData();
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

async function loadDriveData() {
    document.getElementById('syncStatus').innerText = "데이터 로딩 중...";
    const resp = await gapi.client.drive.files.list({ q: `name = '${FILE_NAME}' and trashed = false`, fields: 'files(id, name)' });
    const files = resp.result.files;
    
    if (files.length > 0) {
        fileId = files[0].id;
        const fileData = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        shelves = typeof fileData.result === 'string' ? JSON.parse(fileData.result) : fileData.result;
    } else {
        shelves = [{ title: 'MY COLLECTION', books: [], color: '#ffffff' }];
        const metadata = { name: FILE_NAME, mimeType: 'application/json' };
        const res = await gapi.client.drive.files.create({ resource: metadata, fields: 'id' });
        fileId = res.result.id;
        await save();
    }
    render();
    document.getElementById('syncStatus').innerText = "Cloud Active";
}

async function save() {
    if (!fileId) return;
    document.getElementById('syncStatus').innerText = "저장 중...";
    await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: JSON.stringify(shelves)
    });
    document.getElementById('syncStatus').innerText = "저장 완료";
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        location.reload();
    }
}

/** --- 알라딘 검색 (프록시 사용) --- **/
async function searchByKeyword() {
    const kw = document.getElementById('kwInput').value;
    if (!kw) return;
    const apiUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=${encodeURIComponent(kw)}&QueryType=Keyword&MaxResults=15&start=1&SearchTarget=Book&output=js&Version=20131101`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const rawData = await response.json();
        let content = rawData.contents.trim();
        if (content.endsWith(';')) content = content.substring(0, content.length - 1);
        const data = JSON.parse(content);

        const results = document.getElementById('searchResults');
        results.innerHTML = '';
        if (data.item) {
            data.item.forEach(i => {
                const book = { title: i.title.replace(/<[^>]*>?/gm, ''), cover: i.cover.replace('coversum', 'cover500'), author: i.author ? i.author.split('(지은이)')[0] : "", addedDate: new Date().toLocaleDateString() };
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `<img src="${book.cover}"><p style="font-size:9px; color:white; margin-top:5px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${book.title}</p>`;
                div.onclick = () => { shelves[0].books.unshift(book); save(); render(); };
                results.appendChild(div);
            });
        }
    } catch (e) { console.error("Search Error:", e); }
}

/** --- UI 렌더링 (기능 유지) --- **/
function render() {
    const container = document.getElementById('shelfList');
    container.innerHTML = '';
    
    shelves.forEach((s, sIdx) => {
        const shelfEl = document.createElement('div');
        shelfEl.className = 'shelf-wrapper';
        shelfEl.innerHTML = `
            <div class="shelf-header">
                <input type="text" class="shelf-title" style="color:${s.color}" value="${s.title}" onchange="shelves[${sIdx}].title=this.value; save();">
                <button onclick="deleteShelf(${sIdx})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:0.8rem;">삭제</button>
            </div>
            <div class="book-grid-display" data-shelf="${sIdx}">
                ${s.books.map((b, bIdx) => `
                    <div class="book">
                        <img src="${b.cover}">
                        <button onclick="deleteBook(${sIdx}, ${bIdx})" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(shelfEl);
        
        new Sortable(shelfEl.querySelector('.book-grid-display'), {
            group: 'books', animation: 250,
            onEnd: (evt) => {
                const fromIdx = parseInt(evt.from.dataset.shelf);
                const toIdx = parseInt(evt.to.dataset.shelf);
                const [moved] = shelves[fromIdx].books.splice(evt.oldIndex, 1);
                shelves[toIdx].books.splice(evt.newIndex, 0, moved);
                save(); render();
            }
        });
    });
    updateStats();
}

function updateStats() {
    let total = 0;
    shelves.forEach(s => total += s.books.length);
    document.getElementById('totalCount').innerText = total;
}

function addShelf() { shelves.push({ title: 'NEW STACK', books: [], color: hipColors[Math.floor(Math.random()*hipColors.length)] }); save(); render(); }
function deleteShelf(idx) { if(confirm("책장을 삭제할까요?")) { shelves.splice(idx, 1); save(); render(); } }
function deleteBook(sIdx, bIdx) { shelves[sIdx].books.splice(bIdx, 1); save(); render(); }
function clearSearch() { document.getElementById('kwInput').value = ''; document.getElementById('searchResults').innerHTML = ''; }
function toggleStats() { document.getElementById('statsBar').classList.toggle('collapsed'); }
function toggleGuide(show) { document.getElementById('guideModal').style.display = show ? 'flex' : 'none'; }
