// 1. 환경 설정 및 인증 정보
const CLIENT_ID = '982927191150-uc696nka5n0n3j0qmjt0mjnl1tgsj7i0.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB-d-Jw314oAqlBihwV05rr1zQfSJ9CoeQ';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const TTB_KEY = 'ttbtwinwhee0938001';

// 파일 이름을 이전 GAS 코드와 일관성 있게 수정했습니다.
const DATA_FILE_NAME = 'My_BookStack_Data_DO_NOT_DELETE'; 

let tokenClient, gapiInited = false, gisInited = false, shelves = [], fileId = null, folderId = null;
const hipColors = ['#ffffff', '#00ff88', '#3a86ff', '#ff006e', '#8338ec', '#ffbe0b', '#adb5bd', '#ff5400', '#00f5d4', '#9d4edd'];

// 2. 초기화 (신경망 가동)
window.onload = () => {
    gapi.load('client', async () => {
        await gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
        gapiInited = true;
        updateStatus();
    });
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES, callback: '',
    });
    gisInited = true;
};

function updateStatus() {
    if (gapiInited && gisInited) document.getElementById('syncStatus').innerText = "연결 준비 완료";
}

// 3. 로그인 및 드라이브 연결
function handleLogin() {
    tokenClient.callback = async (resp) => {
        if (resp.error) return;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('userActions').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginMessage').style.display = 'none';
        await initDriveFolder(); // 폴더와 파일 확인 시작
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// 4. 폴더 및 파일 관리 (데이터 대사 작용)
async function initDriveFolder() {
    try {
        // 'BookStack' 이라는 이름의 일반 폴더를 찾습니다.
        const res = await gapi.client.drive.files.list({
            q: "name = 'BookStack' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)'
        });
        
        if (res.result.files.length > 0) {
            folderId = res.result.files[0].id;
        } else {
            // 폴더가 없으면 새로 생성합니다.
            const folderMetadata = { 'name': 'BookStack', 'mimeType': 'application/vnd.google-apps.folder' };
            const folder = await gapi.client.drive.files.create({ resource: folderMetadata, fields: 'id' });
            folderId = folder.result.id;
        }
        await loadData();
    } catch (err) { console.error("Folder Init Error", err); }
}

async function loadData() {
    try {
        // 지정하신 이름(My_BookStack_Data_DO_NOT_DELETE)의 파일을 찾습니다.
        const res = await gapi.client.drive.files.list({
            q: `name = '${DATA_FILE_NAME}' and '${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)'
        });
        
        if (res.result.files.length > 0) {
            fileId = res.result.files[0].id;
            const content = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
            shelves = content.result.shelves || [];
        } else {
            shelves = [{ title: 'MY COLLECTION', books: [], color: '#ffffff' }];
            await save();
        }
        render();
    } catch (err) { console.error("Load Error", err); }
}

async function save() {
    if (!gapi.client.getToken()) return;
    document.getElementById('syncStatus').innerText = "기록 중...";
    const metadata = { 'name': DATA_FILE_NAME, 'parents': [folderId] };
    const data = { shelves: shelves, lastUpdated: new Date() };
    const boundary = 'foo_bar_baz';
    
    // 멀티파트 바디 구성 (파일 이름과 데이터를 함께 전송)
    const body = `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--`;

    try {
        const path = fileId ? `/upload/drive/v3/files/${fileId}` : '/upload/drive/v3/files';
        const method = fileId ? 'PATCH' : 'POST';
        const res = await gapi.client.request({
            path: path, method: method, params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: body
        });
        if (!fileId) fileId = res.result.id;
        document.getElementById('syncStatus').innerText = "동기화 완료";
    } catch (err) { document.getElementById('syncStatus').innerText = "기록 실패"; }
}

// 5. 검색 및 UI 렌더링 (운동 작용)
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
                const book = { title: i.title.replace(/<[^>]*>?/gm, ''), cover: i.cover.replace('coversum', 'cover500'), author: i.author.split('(지은이)')[0] };
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `<img src="${book.cover}">`;
                div.onclick = () => { 
                    if(shelves.length === 0) shelves.push({ title: 'MY COLLECTION', books: [], color: '#ffffff' });
                    shelves[0].books.unshift(book); 
                    save(); render(); 
                };
                results.appendChild(div);
            });
        }
    } catch (e) { console.error("Search Error"); }
}

function render() {
    const container = document.getElementById('shelfList');
    container.innerHTML = '';
    shelves.forEach((s, sIdx) => {
        const shelfEl = document.createElement('div');
        shelfEl.className = 'shelf-wrapper';
        shelfEl.innerHTML = `
            <div class="shelf-header">
                <input type="text" class="shelf-title" value="${s.title}" style="color:${s.color}; background:transparent; border:none; font-size:1.2rem; font-weight:900;" onchange="shelves[${sIdx}].title=this.value; save();">
                <button onclick="deleteShelf(${sIdx})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:0.8rem;">삭제</button>
            </div>
            <div class="book-grid-display">
                ${s.books.map((b, bIdx) => `<div class="book"><img src="${b.cover}" style="width:100%; border-radius:4px;"><button onclick="deleteBook(${sIdx}, ${bIdx})" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button></div>`).join('')}
            </div>
        `;
        container.appendChild(shelfEl);
    });
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.innerText = shelves.reduce((acc, cur) => acc + cur.books.length, 0);
}

function addShelf() { shelves.push({ title: 'NEW STACK', books: [], color: hipColors[Math.floor(Math.random()*hipColors.length)] }); save(); render(); }
function deleteShelf(idx) { if(confirm("책장을 삭제할까요?")) { shelves.splice(idx, 1); save(); render(); } }
function deleteBook(sIdx, bIdx) { shelves[sIdx].books.splice(bIdx, 1); save(); render(); }
function handleLogout() { gapi.client.setToken(''); location.reload(); }
function toggleStats() { document.getElementById('statsBar').classList.toggle('collapsed'); }
function clearSearch() { document.getElementById('kwInput').value = ''; document.getElementById('searchResults').innerHTML = ''; }
